# Conventions

Drift-prevention rules for a codebase built across many AI sessions. Read this before adding or modifying components. When this doc and the code disagree, the code wins — then fix this doc.

## 1. Component anatomy

Every component lives in its own directory under `packages/ui-bits/src/components/`:

```
components/Dial/
  Dial.tsx        # implementation (PascalCase, matches dir name)
  dial.css        # styles (kebab-case filename)
  index.ts        # re-exports: component + public prop types
  README.md       # per-component docs (present for nontrivial components)
```

Multi-file components add siblings (`AudioControls/AudioFFTWindow.tsx`, `AudioControls/binProcessing.ts`, `LFOSlider/utils.ts`). Every component must also be wired into `components/index.ts`, an entry module (`core.ts` for most components; `audio.ts` for audio-dependent ones like AudioControls and VirtualKeyboard — the entries chain `library.ts` → `audio.ts` → `core.ts`), and get a subpath entry in **both** `packages/ui-bits/package.json` and the root `package.json` `exports` maps (validated by `bun run check:exports`).

### CSS scoping — hard rule

Component CSS classes are kebab-case and **must be `ui-bits-`-prefixed** (`.ui-bits-dial`, `.ui-bits-dial__arc`, `.ui-bits-floating-panel__scrollbar`). All CSS ships in one flat bundle (`dist/ui-bits.css`) that consumers import globally, so any unprefixed class pollutes the consumer's page.

Known hazard, do not extend: `components/LFOSlider/lfoslider.css` defines bare utility classes (`.flex`, `.flex-col`, `.relative`, `.absolute`, `.pointer-events-auto`, `.pointer-events-none`) that collide with consumer utility frameworks. These are legacy. **Never add another unscoped class.** If you rework LFOSlider styles, migrating these under the `ui-bits-` prefix is in scope.

## 2. State: the tri-state value contract

Full contract in [STATE-CONTRACT.md](./STATE-CONTRACT.md). Summary: every value-bearing widget resolves its value from three sources, in priority order:

1. **Controlled** — `value` prop provided → it wins unconditionally.
2. **Store-bound** — no `value`, but a control id resolves (explicit `controlId`, or auto-derived from `ariaLabel` under `ControlIdProvider autoIds`) → value lives in the control store (`useControlValue`).
3. **Uncontrolled** — neither → internal `useState` seeded from `defaultValue`.

`onChange` fires in all three modes. New value widgets **must** implement this contract, including the dev warning when both `value` and a resolved control id are present (see §5).

Sharp edges (details in STATE-CONTRACT.md, do not "fix" without reading it):

- While an LFO drives an LFOSlider, the store's **base value key is deliberately `undefined`**; the live modulated value is only observable via `onAnimatedUpdate` or by mirroring animated output back with `useStoreMirror` — reading the base key mid-LFO is not a bug, it is the design.
- Under `autoIds`, a component only auto-binds if the *user* supplied `ariaLabel` or `controlId`. Built-in default labels (e.g. Dial's `"Dial control"`) are accessibility-only and never feed id derivation.

### Reference implementation / consolidation target

The tri-state resolution is currently **hand-rolled ~9 different ways** across components (Dial, LFOSlider, SegmentBar, ColorField, etc. each inline their own `shouldUseStore` / `resolvedValueProp` / `isControlled` dance). The cleanest version is `useControllableState<T>(value, defaultValue, onChange?, storeId?)`, private to `components/AudioControls/AudioControls.tsx` (~line 131). That hook should be promoted to a shared module and adopted everywhere. **Do not hand-roll an 8th variant** — if you're building a new value widget, extract `useControllableState` first and use it.

## 3. Theming

Two channels, used together:

- **`PanelThemeContext`** (defined in `src/panelGap.tsx`, consumed via `usePanelTheme()`): `{ colorA?, colorB?, fontSize?, borderStyle?: "a" | "b" | "none", transparent?, bodyBlur? }`. `colorA` is **ink/foreground**, `colorB` is **paper/background**. `FloatingPanel` provides it; children resolve `prop ?? panelTheme?.x ?? fallback`.
- **CSS variables** `--ui-bits-color-a` / `--ui-bits-color-b`, set as inline style by `FloatingPanel`. Newer components use fallbacks like `var(--ui-bits-color-a, #2f2f2f)` so canvas-free styling works even without the React context.

Canonical fallback semantics: **A = ink, dark (`#2f2f2f`); B = paper, light (`#f0f0f0`)**. Most components follow this (BasicButton, Folder, TextInput, SegmentBar, FloatingPanel, KeyValueRows, …).

**Known bugs — do not imitate:** four components ship *inverted* fallbacks: `NameInputRow` and `PresetManager` (`A=#f0f0f0`, `B=#2f2f2f`), `Sequencer` and `VirtualKeyboard` (`A=#f2f0e5`, `B=#1c1b1a`). New code uses the canonical orientation; fixing an inverted component means flipping its fallbacks, not its A/B wiring.

Note also `Sequencer` falls back straight to constants without consulting `panelTheme` for colors — another inconsistency, not a pattern.

## 4. Known duplication — the hit list

Rule: **never add another copy. When you touch a file containing one of these, extract it into a shared module and migrate that file** (migrating every other copy is optional but welcome). Counts verified 2026-07-18; re-grep before relying on them.

| Duplicate | Where | Count |
|---|---|---|
| Control-height formula (`fontSize * (LINE_HEIGHT + PAD_Y_EM * 2) + border*2`) + private `SLIDER_*` constants | Dial, ColorField, ColorFieldPicker, ColorPicker, FloatingPanel, Folder, IconButton, KeyValueAccordion, KeyValueRows, LoadingBar, NameInputRow, PresetManager, RadioList, WebGpuStatus, plus `computeSliderUnitPx` variants in AudioControls, Sequencer, and VirtualKeyboard, and inline pad/line-height constants in LFOSlider | ~18 files |
| `resolveSize(value?: number \| string)` | BasicButton, ColorField, ColorFieldPicker, FloatingPanel, Folder, KeyValueAccordion, LoadingBar, PresetManager, RadioList, TextInput | 10 identical copies |
| `normalizeHex` / `colorWithAlpha` | **Two incompatible families**: `normalizeHex(hex): string \| null` + `colorWithAlpha(color, alpha, fallback)` (Dropdown, Folder, FloatingPanel, KeyValueAccordion, SegmentBar) vs. `normalizeHex(value)` with different semantics (ColorField, ColorFieldPicker, ColorPicker). Consolidating requires reconciling behavior, not just deduping | 8 files |
| typegpu `getSharedRoot` | AudioFFTWindow, ColorFieldPicker, Sequencer + a 4th copy in `apps/docs/src/components/DocsBrandCanvas.tsx` | 3 + 1 |
| Fake-scrollbar (hidden native scroll + measured thumb) | Hand-rolled in FloatingPanel and DropdownBase; the extracted version is `ListSurface/useListScrollMetrics.ts` (used by ListSurface). New scroll surfaces use the hook; touching FloatingPanel/Dropdown scroll code means migrating to it | 2 copies + 1 extracted |

## 5. Dev warnings

Misuse warnings go through `warnOnceDev(key, message)` (`src/utils/warnOnceDev.ts`): dev-only (via `import.meta.env.DEV` / `NODE_ENV`), deduped per key for the module lifetime. Conventions:

- Key: `ComponentName.what-happened`, with an instance scope suffix when per-instance dedup matters: `` `Dial.control-id-controlled-value.${warningScope}` ``.
- Message: prefix `[ui-bits] `, state the conflict and the resolution.

Required warnings for value widgets: conflicting `value` + resolved control id ("binding is ignored while `value` is controlled" — see Dial.tsx ~line 105 or LFOSlider.tsx ~line 287 for the exact format), and unusable configuration (e.g. `Dial.auto-id-missing-label` when `autoIds` is on but no label exists). Missing-provider situations that silently no-op should also warn.

Never `console.warn` directly for misuse; never throw for recoverable misconfiguration.

## 6. Testing

```sh
cd packages/ui-bits && bun test
```

Runner is `bun:test`. Tests live in `packages/ui-bits/tests/`, mirroring source: `tests/LFOSlider/utils.test.ts`, `tests/AudioControls/binProcessing.test.ts`, `tests/SelectionGrid/selectionGridCanvas.test.ts`, `tests/lfo.test.ts`.

There is no DOM/component test rig. The convention that makes this work: **extract pure logic into plain `.ts` modules** (`utils.ts`, `binProcessing.ts`, `selectionGridCanvas.ts`, `lfo.ts`) **and unit-test those**. If logic in a `.tsx` file is worth testing, that's the signal to extract it.

## 7. Workflow invariants

- **`dist/` is committed.** CI (`.github/workflows/check-dist.yml`) rebuilds the library and fails on `git diff --exit-code -- packages/ui-bits/dist`. After any source change:
  ```sh
  bun --cwd packages/ui-bits build   # vite build + tsc -p tsconfig.lib.json
  ```
  and commit the resulting `dist/` changes alongside the source, or CI fails.
- Before committing, from the repo root:
  ```sh
  bun --cwd packages/ui-bits test
  bun run lint            # lints packages/ui-bits and apps/docs
  bun run check:exports   # verifies both package.json exports maps point at real dist files
  ```
- **Branching:** work happens on `dev` (or a task branch). `main` is production-like — merge to `main` only with explicit approval. CI runs on PRs and pushes to `main`.
- New public API (component, hook, or subpath) is not done until it's exported from an entry module (`core.ts` for most components and logic; `audio.ts` for audio-dependent API — both reach `library.ts` via re-export), both `exports` maps, and `check:exports` passes.
