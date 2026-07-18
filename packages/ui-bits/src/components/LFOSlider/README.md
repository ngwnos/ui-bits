# LFOSlider

React slider with optional low-frequency oscillator controls.

## Importing

```tsx
import { LFOSlider, type LFOSliderProps } from "ui-bits/core";
import "ui-bits/style.css";
```

Direct component export (the subpath ships the component as its default export):

```tsx
import LFOSlider from "ui-bits/components/LFOSlider";
```

## Basic Usage

```tsx
const [value, setValue] = useState(0.4);

<LFOSlider
  label="Depth"
  min={0}
  max={1}
  step={0.01}
  value={value}
  colorA="#24837B"
  colorB="#FFFCF0"
  onUserChange={setValue}
  onAnimatedUpdate={setValue}
/>
```

Use `defaultValue` instead of `value` when the slider should keep local state.

## Key Props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | On-screen caption; use `ariaLabel` when you want accessibility text without rendering a label. |
| `ariaLabel` | `string` | Optional aria-label for screen readers, useful when `showLabel={false}`. |
| `showLabel` | `boolean` | Toggle the visible label while keeping the component accessible. Defaults to `true`. |
| `min`, `max`, `step` | `number` | Range and quantisation of the numeric value. Defaults to `0 → 100` with step `1`. |
| `variant` | `'full' \| 'basic'` | `basic` disables the LFO drawer controls and forces a continuous bar fill to create a minimal slider for nested usage (text editing stays available). |
| `barStyle` | `'continuous' \| 'discrete' \| 'step-aligned'` | Controls how the bar fill renders; `discrete` snaps to `barSegmentCount`, `step-aligned` snaps to the slider step. |
| `barSegmentCount` | `number` | Visual segment count used when `barStyle="discrete"`. |
| `defaultValue` | `number` | Initial value for uncontrolled state. |
| `value` | `number` | Controlled value. Pair with `onUserChange` or `onAnimatedUpdate`. |
| `controlId` | `string` | Store-bound value id. Do not use with `value`. |
| `defaultLfoRange` | `[number, number]` | Initial min/max markers shown in the drawer track. |
| `lfoRange` | `[number, number]` | Controlled min/max markers shown in the drawer track. |
| `colorA`, `colorB` | `string` | Hex colours for the segmented background. When omitted the slider inherits the surrounding panel theme, then falls back to neutral grey/white. |
| `showLfoControls` | `boolean` | Enables the drawer UI (waveform toggles + min/max handles). |
| `defaultWaveform`, `defaultFrequency`, `defaultPhase` | Starting LFO: `defaultWaveform` is a `Waveform` string, the others numbers (phase uses 0-1 to represent a full cycle). |
| `defaultLfo` | `LfoSettings` | Optional defaults for LFO settings (enabled, waveform, frequency, depth, offset, phase, invert). |
| `defaultDrawerOpen` | `boolean` | Initial drawer open state. |
| `drawerOpen` | `boolean` | Controlled drawer open state. |
| `defaultLfoRunning` | `boolean` | Initial LFO running state. |
| `lfoRunning` | `boolean` | Controlled LFO running state. |
| `onUserChange` | `(value: number) => void` | Fired for direct user edits (dragging, typing). |
| `onAnimatedUpdate` | `(value: number) => void` | Fired for automated updates (frame loop, external source). |
| `onDrawerOpenChange`, `onDrawerLinesChange` | Callbacks for synchronising drawer state with your store. |
| `onWaveformChange`, `onFrequencyChange`, `onPhaseChange`, `onLfoEnabledChange` | Hooks for mirroring LFO controls (phase values are normalized 0-1; running state toggles when the active waveform button is clicked again). |
| `audioBins`, `audioBinCount`, `audioMaxMagnitude` | FFT data used when the waveform is set to `audio`. These may also be supplied via `AudioAnalysisProvider`. |
| `suspended` | Pause frame-loop updates while keeping state mounted (also picked up from `AnimationSuspensionProvider`). |
| `className`, `style` | `string`, `React.CSSProperties` | Optional overrides applied to the root wrapper. |

Refer to `LFOSliderProps` for the full list of optional callbacks and configuration flags.

## State Modes

Use one state mode per slider.

- Controlled: `value` with callbacks.
- Store-bound: `controlId` with no controlled `value`.
- Uncontrolled: `defaultValue`.

`FrameLoopProvider` is required for LFO animation. Store-bound controls also need the relevant store provider from `ui-bits/core`.

## Store Contract

When store-bound via `controlId`, the slider persists its LFO settings under derived keys: `<controlId>.lfo.enabled`, `.waveform`, `.frequency`, `.phase`, `.range`, `.audioResponse`, `.audioSample`.

Sharp edge: **while the LFO is enabled, the base `<controlId>` store key is deliberately set to `undefined`** — animated frame values are never written to the store. The last manual value is restored to the key when the LFO is disabled. To read the live animated value, use `onAnimatedUpdate` (throttled to ~16 ms) or `useStoreMirror`. Full details: [STATE-CONTRACT.md](../../../../../docs/STATE-CONTRACT.md).

## Audio LFO Input

When the active waveform is `audio`, the slider samples FFT bins to drive its value. You can either pass
`audioBins`/`audioBinCount`/`audioMaxMagnitude` directly, or wrap your UI in `AudioAnalysisProvider` and push
updates with `useAudioAnalysisActions`. `AudioControls` can feed the same provider.

## Suspension

When `suspended` is true, the slider stops `useFrame` updates but keeps its state. `Folder` and `FloatingPanel`
set an `AnimationSuspensionProvider` while collapsed so nested sliders pause automatically.

## Styling

Import `ui-bits/style.css` once. Use `colorA`, `colorB`, border, font size, and bar props for local styling.

## Types

```ts
import { LFOSliderMode, LFOSliderProps, SliderBarStyle, SliderVariant } from "ui-bits/core";
```

`LFOSliderMode` enumerates the allowed LFO behaviour hints (`'auto' | 'manual' | 'lfo' | 'external'`). `SliderVariant` toggles full vs. basic interaction, and `SliderBarStyle` selects continuous, discrete, or step-aligned bar rendering.
