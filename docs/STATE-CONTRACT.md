# ui-bits State Contract

Who owns and writes every value. This is the reference for building an external
driver (API, voice assistant, automation) against the control store without
reading library source. All paths below are relative to `packages/ui-bits/src`.

Imports: everything named here is exported from the package root (`ui-bits`)
and — except `AudioControls`/`VirtualKeyboard`, which live only at the root and
`ui-bits/audio` — from `ui-bits/core` (`core.ts` re-exports `controlStore/`,
`presetStore/`, `frameLoop.tsx`, `useStoreMirror.ts`, `lfo.ts`).

## 1. The store primitive

`createControlStore(initialState?)` (`controlStore/store.ts`) returns:

```ts
interface ControlStore {
  getState(): Record<string, unknown>;        // ControlStoreState
  setValue(id: string, value: unknown): void; // Object.is-equal writes are dropped
  subscribe(listener: () => void): () => void;
}
```

- Flat string-keyed map. Values are untyped (`unknown`); each widget validates on read.
- `setValue` replaces the state object immutably and notifies **all** listeners.
  There is no per-key subscription and the listener receives no payload — diff
  `getState()` yourself.
- `setValue(id, undefined)` is legal and meaningful (see §5).

Providers: `<ControlStoreProvider store={...} autoIds controlIdPrefix="...">`
creates an internal store if `store` is omitted. `<PresetStoreProvider>` also
provides a control store (own > nearest parent > internal) — see §9.

## 2. Tri-state precedence (every store-aware widget)

Verbatim from the widgets (`shouldUseStore = resolvedControlId !== undefined && value === undefined`):

1. **Controlled** — `value` prop is defined → it wins. The store binding is
   ignored entirely (no reads, no writes) and a one-time dev warning fires if a
   control id also resolved.
2. **Store-bound** — control id resolved and `value === undefined` → the store
   key is the source of truth. The widget reads it via `useControlValue` and
   writes user edits back.
3. **Uncontrolled** — no id, no `value` → internal state seeded from
   `defaultValue`.

**Mount-time seeding**: a store-bound widget writes its initial value into the
store once, iff the key currently reads `undefined`. So an empty store is
populated by whatever renders, and pre-populated store values win over
`defaultValue`. Specifics:

- `LFOSlider` seeds `defaultValue ?? 0` **un-snapped**, and only while the LFO
  is not enabled (LFOSlider.tsx ~372). (A defined `value` prop means the widget
  is controlled, not store-bound, so it never seeds.)
- `Dial` seeds `clamp+snap(defaultValue ?? min)`.
- `SegmentBar` seeds the resolved option value (string).

Widgets that follow this contract with a single id: `LFOSlider` (number),
`Dial` (number), `SegmentBar` (string), `Dropdown`/`IconDropdown`/`RadioList`
(string), `ColorPicker` (string), `ColorField` (hex string, plus a second
`alphaControlId` bound to a number), `IconButton` (boolean for toggle, string
for cycle). `AudioControls` and `VirtualKeyboard` bind a *family* of ids under
a `controlIdPrefix` instead.

## 3. Control id resolution (`controlStore/ids.tsx`)

`useResolvedControlId(explicitId, label, fallbackLabel)`:

1. Explicit `controlId` prop → used verbatim. Works even without
   `ControlIdProvider`.
2. Else, if the nearest `ControlIdProvider` has `autoIds: true` → slug of
   `label ?? fallbackLabel ?? reactId`, joined to the provider `prefix` with a
   dot. Slug: trim → lowercase → non-`[a-z0-9]` runs become `-` → strip edge
   dashes (an empty slug falls back to the `reactId` slug, then the literal
   `control`). `"Wind Speed"` under `prefix="scene"` → `scene.wind-speed`.
3. Else `undefined` — no binding.

- Prefix join strips trailing dots from the prefix; nested `ControlIdProvider`s
  do **not** compose — the innermost provider's `{autoIds, prefix}` replaces the
  outer one wholesale.
- Defaults: `ControlStoreProvider` has `autoIds = false`; `PresetStoreProvider`
  has `autoIds = true`.
- Which prop seeds the auto slug: `LFOSlider` uses `label`, then `ariaLabel`;
  `SegmentBar` uses `ariaLabel ?? label`; `Dropdown` uses `label`; `IconButton`
  uses `ariaLabel ?? title`.
- **Dial requires an explicit label to auto-bind.** Its built-in
  `"Dial control"` aria-label is accessibility-only and no longer feeds the
  slug. Under `autoIds`, a Dial with neither `ariaLabel` nor `controlId` gets
  **no binding** and emits a one-time dev warning (previously all unlabeled
  dials collided on a shared `dial-control` id — that behavior is gone).

## 4. LFOSlider derived ids

When a base id resolves (or `lfoControlIdPrefix` is set explicitly — it works
even with no base id), LFOSlider derives a prefix `${id}.lfo` (overridable via
the `lfoControlIdPrefix` prop) and binds seven extra keys. Only the `full`
variant writes them (`basic` never does). All are two-way: external writes are
absorbed into widget state, validated/clamped on read; wrongly-typed values are
ignored.

| Key | Type | Meaning | Normalization on absorb |
|---|---|---|---|
| `${id}.lfo.enabled` | `boolean` | LFO/audio modulation running | must be boolean; ignored when `lfoRunning` prop is controlled |
| `${id}.lfo.waveform` | `"sine" \| "triangle" \| "saw" \| "square" \| "audio"` | active waveform; `"audio"` switches to FFT-driven mode | must be one of the five strings |
| `${id}.lfo.frequency` | `number` | oscillator rate, Hz (unused in `audio` mode) | clamped to `[lfoFrequencyMin, lfoFrequencyMax]` (defaults `[0.1, 2]`) |
| `${id}.lfo.phase` | `number` | phase offset, fraction of a cycle | clamped to `[0, 1]` |
| `${id}.lfo.range` | `[number, number]` | modulation bounds in value units (the drawer lines) | must be a 2-tuple of finite numbers; snapped to `step` when dragged in the UI; ignored when the `lfoRange` prop is controlled |
| `${id}.lfo.audioResponse` | `number` | response-curve bias for audio mode (positive = expand, negative = compress) | clamped to `[-1, 1]` |
| `${id}.lfo.audioSample` | `number` | normalized FFT bin position sampled in audio mode | clamped to `[audioFrequencyMin, audioFrequencyMax]` (defaults `[0, 1]`) |

The LFO frequency and the audio sample position are independent state: switching
to the `audio` waveform and back preserves `.lfo.frequency` verbatim.

## 5. SHARP EDGE: the base id is `undefined` while modulation runs

This is deliberate (LFOSlider.tsx ~402):

- On LFO enable, the widget writes `setValue(baseId, undefined)`.
- On disable, it writes back its last manual value (see **Writers** below for
  what that is after a mid-modulation write).
- While enabled, the animated per-frame value is **never** written to the base
  key (`emitAnimatedUpdate` skips the store write when `lfoEnabled`).

Consequences for external code:

- **Readers**: `getState()[baseId] === undefined` during modulation. Check
  `getState()[`${baseId}.lfo.enabled`] === true` and read the live value via
  the readback channels (§6). Do not treat `undefined` as 0.
- **Writers**: a `setValue(baseId, x)` during modulation is **not absorbed**
  while the LFO runs. The value sits in the store (the `undefined` invariant is
  enforced only at the enable transition, not continuously) and the UI ignores
  it on the next frame. At the disable transition the widget first absorbs any
  finite number sitting on the base key into its manual value, then writes that
  back — so `x` actually survives disable and becomes the restored value. To
  set a value deterministically, first write `${baseId}.lfo.enabled = false`,
  then the base value.
- **Presets**: `createPresetSnapshot` drops `undefined` entries, so a preset
  saved mid-modulation captures all `.lfo.*` settings but **no base value**
  (§9). This is by design: the preset restores the modulation, not a frozen
  sample of it.

## 6. Readback channels (true current value, whoever is driving)

- `onAnimatedUpdate?: (v: number) => void` — LFOSlider prop. Fires with the
  clamped+snapped output while an LFO, audio analysis, or `readExternal` drives
  the slider. Throttled: at most one call per 16 ms (frame-time gate in
  `applyWaveValue`).
- `mirrorToStore?: MirrorFn` + `mirrorEveryMs` (default 16) + `epsilon`
  (default 1e-3) — LFOSlider props backed by the exported
  `useStoreMirror(readValue, mirror, throttleMs = 16, epsilon = 1e-3)` hook.
  **Naming caveat: despite the name, this does not write to any ControlStore.**
  It calls *your* callback `(value, tSec) => void` from its own
  `requestAnimationFrame` loop whenever the live value moved by ≥ epsilon.
  Ideal for pushing into shader uniforms or an external bus.
- `onUserChange?: (v: number) => void` — direct user edits only (drag, type,
  wheel), not modulation.

## 7. External drive recipe

Complete and runnable once the `uniforms` stand-in is swapped for your own
sink. Create the store outside React so non-React code can hold it; wire it in
with `ControlStoreProvider`; drive and observe from anywhere.

```tsx
import {
  ControlStoreProvider,
  FrameLoopProvider,
  LFOSlider,
  createControlStore,
} from "ui-bits/core";
import "ui-bits/style.css";

export const store = createControlStore();

export function App() {
  return (
    <FrameLoopProvider>
      <ControlStoreProvider store={store}>
        <LFOSlider
          label="Wind"
          controlId="scene.wind"
          min={0}
          max={2}
          step={0.01}
          defaultValue={0.6}
          showLfoControls
          onAnimatedUpdate={(v) => { uniforms.wind.value = v; }}
        />
      </ControlStoreProvider>
    </FrameLoopProvider>
  );
}

// --- outside React (API handler, voice assistant, ...) ---
export function setWind(v: number) {
  store.setValue("scene.wind.lfo.enabled", false); // release modulation first (§5)
  store.setValue("scene.wind", v);                 // UI animates to v, snaps, echoes back (§8)
}
export function wobbleWind() {
  store.setValue("scene.wind.lfo.waveform", "sine");
  store.setValue("scene.wind.lfo.frequency", 0.5);
  store.setValue("scene.wind.lfo.range", [0.2, 1.4]);
  store.setValue("scene.wind.lfo.enabled", true);  // base id becomes undefined now
}
const unsubscribe = store.subscribe(() => {
  console.log(store.getState()); // no payload; diff against your last snapshot
});
```

## 8. Requirements and silent no-ops

- **`FrameLoopProvider` is required for anything animated.** `useFrame` no-ops
  without the context, so absent a provider: no LFO, no audio modulation, no
  `readExternal` polling, and no snapped echo-back (§8a). Store-bound value
  changes still render (an effect, not the frame loop, syncs the visuals).
  Nothing warns.
- **`controlId` without a `ControlStoreProvider`/`PresetStoreProvider` in scope
  is a silent no-op**: reads are `undefined`, writes are dropped, and the
  widget behaves as uncontrolled.
- **LFO run gate**: modulation requires `variant="full"` (default) and
  `showLfoControls`. When `showLfoControls` is false the widget forces
  `lfoEnabled` (and the stored `.lfo.enabled`) to `false` at mount and whenever
  the prop turns false — but this is **not continuously enforced**: a later
  external `.lfo.enabled = true` write is absorbed and starts the LFO even with
  the drawer UI hidden. `variant="basic"` never runs an LFO.
- **Audio waveform** additionally needs FFT data: an `AudioAnalysisProvider`
  ancestor with a producing engine (e.g. `AudioControls`), or the `audioBins`
  prop. With no bins the slider simply stops updating — no warning, no store
  writes.

### 8a. Value normalization and the store echo

Every LFOSlider/Dial write path clamps to `[min, max]` and snaps to `step`
(`snapToStep(v, min, step, max?)` from `lfo.ts`; note it now clamps its result
into `[min, max]` — 4th param defaults to `Infinity`).

Store-bound LFOSlider echoes normalization back: writing an unsnapped or
out-of-range value to the base id makes the widget, on the next frame (frame
loop required), clamp it into the **current modulation range** — the
`.lfo.range` drawer lines when `showLfoControls` is on, else `[min, max]` —
snap it to `step`, and write the normalized value back to the store (throttled
to ≥ 16 ms; skipped when `Object.is`-equal). So the store converges to the
canonical value; don't fight the echo. Dial does not echo: it normalizes on
display, and the raw store value persists until the next user interaction.

Derived-id writes are normalized on absorb per the table in §4 but are *not*
echoed back to the store (the clamped value lives in widget state; the store
keeps what you wrote).

## 9. Preset semantics (`presetStore/`)

- `createPresetSnapshot(state, {includeIds, excludeIds, filter})` copies the
  store state, **dropping every key whose value is `undefined`** — this is why
  a preset saved mid-LFO keeps `.lfo.*` but loses the manual base value (§5).
- `applyPresetSnapshot(store, snapshot, {clearMissing})` is a plain per-key
  `setValue` loop (insertion order); with `clearMissing: true` it first sets
  existing keys absent from the snapshot to `undefined`. Each `setValue`
  notifies listeners individually — there is no batching, so a subscriber sees
  N intermediate states.
- `PresetStoreProvider` resolves its store as: `controlStore` prop > nearest
  `ControlStoreProvider` > internal. It defaults `autoIds` to **true** and
  captures a readonly "Defaults" preset one tick after mount (i.e. after
  widgets have seeded, §2). `savePreset(name)` snapshots the live store;
  `selectPreset(preset)` applies. Applying a snapshot containing
  `.lfo.enabled: true` starts modulation (and the widget then clears the base
  id per §5).
