# Architecture

System map for ui-bits, a React control-surface library built around **two-way coupling**:
sliders/dials write shader-style parameters, LFOs and audio analysis modulate the same
parameters, external code (API, voice assistant) can drive them, and the UI always animates
to the true current value regardless of who is driving.

## 1. Monorepo layout

```
/                       root package "ui-bits" (private) — the installable unit
├── packages/ui-bits/   the library ("ui-bits-internal"), Vite lib build → dist/
├── apps/docs/          consumer/demo app, depends on "ui-bits": "file:../.."
├── docs/               repo-level docs (this file)
└── scripts/verify-exports.mjs   checks every exports-map path resolves to a real file
```

Distribution is **committed dist**: `packages/ui-bits/dist` is checked into git, and the
*root* `package.json` is the published surface — its `main`/`module`/`types`/`exports` all
point into `packages/ui-bits/dist/...`. Consumers install straight from git (as `apps/docs`
does with `file:../..`); there is no registry publish step.

Consequences:

- **Any source change requires rebuilding dist and committing it.** CI (`.github/workflows/check-dist.yml`)
  runs `bun --cwd packages/ui-bits build` then `git diff --exit-code -- packages/ui-bits/dist`;
  a stale dist fails the build. It also runs lint and the docs build.
- `bun run check:exports` validates both the root and inner package exports maps.

Peer deps: `react`/`react-dom` 19, `lucide-react`, `typegpu`; `tone` and `soundfont-player`
are optional peers (VirtualKeyboard bundler caveat: the root entry statically includes the
VirtualKeyboard chunk, whose `import("tone")` / `import("soundfont-player")` dynamic imports
fail consumer builds unless installed or aliased).

## 2. Entry points

Build entries (`packages/ui-bits/vite.config.ts`, mirrored in both exports maps):

```
library.ts  →  "."            re-exports audio.ts (everything)
audio.ts    →  "./audio"      core.ts + AudioControls/AudioFFTWindow + VirtualKeyboard
core.ts     →  "./core"       everything else; imports "./style.css" as a SIDE EFFECT
terrain.ts  →  "./terrain"    loadHeightTexture only (isolated; no CSS)
26 per-component subpaths      "./components/<Name>" (AudioControls … WebGpuStatus)
```

So: importing the root or `./core` pulls in the stylesheet side effect; `./style.css` is also
exported directly for consumers of per-component subpaths. `./core`, `./terrain`, and the
per-component subpaths all avoid the root graph — `./core` pulls in no audio chunks
(relevant for the optional-audio-deps issue above).

`core.ts` also re-exports the state layers wholesale: `export * from "./sliderStore"`,
`"./controlStore"`, `"./presetStore"`, plus `frameLoop`, `animationSuspension`,
`audioAnalysis`, `useStoreMirror`, `lfo` math (`clamp`, `snapToStep`, `lfoValue`, …),
palettes, and gradients.

## 3. State layer

### controlStore (current generation) — `src/controlStore/`

A deliberately minimal external store, not React state:

- `createControlStore(initial?)` → `{ getState, setValue(id, value), subscribe }` over a flat
  `Record<string, unknown>` keyed by string control ids. `setValue` no-ops on `Object.is`
  equality, otherwise replaces the state object and **notifies every listener** (no per-key
  subscription channels).
- `useControlValue<T>(id?, fallback?)` reads one key via `useSyncExternalStore`. Because the
  snapshot is the *value* at `state[id]`, unrelated `setValue` calls wake the hook but do not
  re-render (Object.is on the same value). Returns `[value, setValue]`.
- `useControlStoreState()` subscribes to the whole state object (re-renders on any change —
  used by preset UI, not controls).
- `ControlStoreProvider` supplies a store (own or via `store` prop) plus `ControlIdProvider`
  (`autoIds`, `controlIdPrefix`). `useResolvedControlId(explicitId, label, fallbackLabel)`
  slugifies the label under `autoIds` to derive ids like `panel.gain`.

Components that bind: LFOSlider, Dial, SegmentBar, IconButton, Dropdown/IconDropdown,
RadioList, ColorField, ColorPicker, AudioControls, VirtualKeyboard. Binding rules:

- A component binds only when it has a resolved control id **and** no controlled `value`
  prop. Supplying both ignores the store binding; LFOSlider, Dial, SegmentBar, and
  ColorField also emit a one-time dev warning (the others ignore it silently).
- **Dial sharp edge:** under `autoIds`, a Dial binds only if given a user-supplied
  `ariaLabel` or explicit `controlId`. The built-in default label ("Dial control") is
  accessibility-only and never feeds id derivation — unlabeled Dials have *no* store binding.

LFOSlider's store contract (the heart of two-way coupling):

- Base key `<id>` holds the committed value. LFO settings are sibling string-suffixed keys:
  `<id>.lfo.enabled`, `.waveform`, `.frequency`, `.phase`, `.range`, `.audioResponse`,
  `.audioSample` (prefix overridable via `lfoControlIdPrefix`).
- **Sharp edge, deliberate:** while the LFO is enabled, the base key is set to `undefined`
  (`LFOSlider.tsx` ~line 402–409). The store intentionally does *not* carry the animated
  value. Readback of the live value is via `onAnimatedUpdate` (throttled to ≥16 ms) — which,
  when store-bound and the LFO is *off*, also writes the base key — or via the
  `mirrorToStore` prop (`useStoreMirror`: own rAF, throttle + epsilon dedup).
- Consequence for presets: an LFO-driven control's base value is absent from snapshots
  (`createPresetSnapshot` skips `undefined`), but its `.lfo.*` keys are captured, so applying
  a preset restores the modulation config rather than a frozen value.

### presetStore — `src/presetStore/`

Layered strictly on top of controlStore. `PresetStoreProvider` finds the parent store (or
creates its own), and exposes `{ presets, savePreset, selectPreset, deletePreset, setPresets,
getSnapshot }` via `usePresetStore`. Mechanics are two pure functions in `utils.ts`:
`createPresetSnapshot(state, {includeIds, excludeIds, filter})` (drops `undefined` values) and
`applyPresetSnapshot(store, snapshot, {clearMissing})` — apply is just repeated `setValue`;
`clearMissing` writes `undefined` into keys not present in the snapshot (keys are never
deleted). Optional `storageKey` persists non-readonly presets to `localStorage`.
`PresetManager` is the UI over this context.

### Residual selection-grid store — `src/sliderStore/`

Historical name; after the recent surgery this is **only** the selection-grid slice: a
reducer store holding `Record<SelectionGridId, SelectionGridState>` (`selectedIndex`,
`squareScale`, `squareAlignment`, `invertGradients`, `allowEmptySelection`, `colorPalette`,
`previewMode`, sun angles) with 5 actions. Public surface: `SliderStoreProvider`, `useSliderStore`,
`useSelectionGridState(gridId)`, `useSelectionGridActions`, `useSelectionGridIds`. Sole
consumer is `GradientSelectionGrid` (which auto-mounts a provider if none exists — an
auto-mounted store is unreachable from outside).

**Sharp edge:** this store is completely separate from controlStore. Gradient selection /
invert / preview mode are NOT captured by presets and have no persistence. It is slated to
merge into controlStore; treat it as legacy and do not extend it.

## 4. Animation layer

- **`FrameLoopProvider` / `useFrame(fn | null)`** (`src/frameLoop.tsx`): one shared
  `requestAnimationFrame` loop per provider; subscribers get `(nowSec, dtSec)`. Each
  subscriber call is wrapped in try/catch — a throwing subscriber logs
  `console.error("ui-bits: frame subscriber threw", …)` *every frame* and does not stop the
  loop or other subscribers. Passing `null` unsubscribes; `useFrame` re-subscribes whenever
  the callback identity changes (per render for inline callbacks — some components read
  closure state relying on this).
- **`AnimationSuspensionProvider` / `useAnimationSuspended(explicit?)`**
  (`src/animationSuspension.tsx`): boolean context, OR-composed with parents. FloatingPanel,
  Folder, and KeyValueAccordion wrap children in it when collapsed/closed, so hidden controls
  pass `null` to `useFrame` and cost nothing. LFOSlider, Dial, AudioControls, AudioFFTWindow,
  and Sequencer all honor it.
- **CSS-variable fast path (LFOSlider):** the animated bar never goes through React state.
  `writeSplitVars` writes `--split`, `--splitPct`, `--handleSplitPct` directly on the host
  element via `style.setProperty`; CSS renders the fill. React `setText` only fires when the
  formatted readout string actually changes. Store/callback emission is throttled to 16 ms.

## 5. Audio pipeline

```
AudioControls (AudioBufferEngine | AudioLiveEngine, one useFrame each)
  → getByteFrequencyData → processBinsFromBytes (binProcessing.ts, pure)
  → AudioAnalysisStore (setAudioBins / setAudioBinCount / setAudioMaxMagnitude)
  → pull-based consumers
```

- `binProcessing.ts` is pure and allocation-conscious: attack/release smoothing, optional
  gaussian blur, frequency-window resampling — all operating on caller-owned reusable
  `Float32Array` buffers and a kernel cache (steady-state zero allocation until
  `setAudioBins` converts to `number[]` for the store).
- `AudioAnalysisStore` (`src/audioAnalysis.tsx`) is another minimal external store:
  `getSnapshot`/`subscribe` plus the three setters; `AudioAnalysisProvider` context;
  `useAudioAnalysisState` for React reads (re-renders per frame — avoid on hot paths).
- **Consumers pull, they don't subscribe:** LFOSlider (waveform `'audio'`) calls
  `audioAnalysisStore.getSnapshot()` inside its own frame callback and samples a bin — no
  React render per audio frame. Explicit `audioBins`/`audioBinCount`/`audioMaxMagnitude`
  props bypass the store. Raw (unsmoothed) FFT frames additionally flow to `AudioFFTWindow`
  through refs polled by its rAF loop, not React state.
- Pause semantics: pausing either engine zero-fills the store once and stops per-frame work.

## 6. GPU usage

Three components use WebGPU: **AudioFFTWindow**, **ColorFieldPicker**, **Sequencer**.
Pattern in all three: `typegpu` is used **only for device init** — a module-level
`getSharedRoot()` memoizes `tgpu.init()` and everything after `root.device` is raw WebGPU
(pipelines, bind groups, buffers, canvas context). Missing `navigator.gpu` or init failure
degrades gracefully (fallback rendering / `WebGpuStatus` reporting).

**Known consolidation target:** each of the three modules has its *own* module-level
`sharedRootPromise`, so the root is shared across instances of one component but the library
holds up to three separate `tgpu.init()` roots/devices. These should eventually share one root.

## 7. Planned evolution — PROPOSAL, NOT IMPLEMENTED

Nothing below exists in code today. Do not document or code against it as if it does.

Converge all control state on a single control store with two declared channels per id:

1. **Committed values** — what the base key holds today.
2. **Typed modulation config** — a structured object replacing the string-suffixed
   `.lfo.*` key convention (which is stringly-typed and only discoverable by reading
   LFOSlider source).

Plus a **store-owned effective-value channel**: `getEffective(id)` / `subscribeEffective(id)`
computed by a single modulation engine running on the shared frame loop, instead of each
component privately computing its LFO/audio value and leaving the base key `undefined`.
Consumers (shader uniforms, mirrors, remote APIs) would read effective values from one place;
presets would snapshot committed values + modulation config.

Invariant to preserve: **no echo** — components never write back values they merely read
(today's guards: `Object.is` in `setValue`, epsilon in `useStoreMirror`, the
`shouldUseStore && !lfoEnabled` gate on `emitAnimatedUpdate`). Any effective-value channel
must keep reads side-effect-free or drivers will fight their own reflections.

Related cleanups implied: fold the residual selection-grid store (section 3) into the
control store, and share one typegpu root across GPU components (section 6).
