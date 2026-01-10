# LFOSlider

Reusable React slider component with built-in support for displaying and animating values using low-frequency oscillators (LFOs). The slider exposes a rich set of callbacks so host applications can own all state while the component handles pointer interaction, keyboard editing, and visual presentation.

## Importing

```tsx
import { LFOSlider, type LFOSliderProps } from "../components";
```

You can also import directly from `../components/LFOSlider` if you prefer.

## Basic Usage

```tsx
const Example = () => {
  const [value, setValue] = useState(0.4);

  return (
    <LFOSlider
      label="Depth"
      min={0}
      max={1}
      step={0.01}
      defaultValue={value}
      colorA="#24837B"
      colorB="#FFFCF0"
      onUserChange={setValue}
      onAnimatedUpdate={setValue}
    />
  );
};
```

## Key Props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | On-screen caption; use `ariaLabel` when you want accessibility text without rendering a label. |
| `ariaLabel` | `string` | Optional aria-label for screen readers, useful when `showLabel={false}`. |
| `showLabel` | `boolean` | Toggle the visible label while keeping the component accessible. Defaults to `true`. |
| `min`, `max`, `step` | `number` | Range and quantisation of the numeric value. Defaults to `0 → 100` with step `1`. |
| `variant` | `'full' \| 'basic'` | `basic` disables text editing + LFO drawer controls to create a minimal slider for nested usage. |
| `barStyle` | `'continuous' \| 'discrete' \| 'step-aligned'` | Controls how the bar fill renders; `discrete` snaps to `barSegmentCount`, `step-aligned` snaps to the slider step. |
| `barSegmentCount` | `number` | Visual segment count used when `barStyle="discrete"`. |
| `defaultValue` | `number` | Initial numerical value; the component keeps its own local text buffer. |
| `value` | `number` | Controlled value used for external mode; overrides `defaultValue` for initial display. |
| `defaultLfoRange` | `[number, number]` | Initial min/max markers shown in the drawer track. |
| `lfoRange` | `[number, number]` | Controlled min/max markers shown in the drawer track. |
| `colorA`, `colorB` | `string` | Hex colours for the segmented background. When omitted the slider falls back to neutral grey/white. |
| `showLfoControls` | `boolean` | Enables the drawer UI (waveform toggles + min/max handles). |
| `defaultWaveform`, `defaultFrequency`, `defaultPhase` | Numbers describing the starting LFO (phase uses 0-1 to represent a full cycle). |
| `defaultLfo` | `LfoSettings` | Optional defaults for LFO settings (frequency, depth, offset, phase, invert). |
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

## Frame Loop & Mirroring

The component uses the local `frameLoop` and `useStoreMirror` helpers from this project. If you embed the slider in another application you can either:

1. Reuse the same helpers (copy `frameLoop.tsx` and `useStoreMirror.ts`), or
2. Replace the hook implementations with equivalents that fit your environment.

The hooks are optional – leaving `mode="manual"`, `mirrorToStore={undefined}`, and `readExternal={undefined}` (or `value={undefined}`) disables the extra animation/mirroring features.

## Audio LFO Input

When the active waveform is `audio`, the slider samples FFT bins to drive its value. You can either pass
`audioBins`/`audioBinCount`/`audioMaxMagnitude` directly, or wrap your UI in `AudioAnalysisProvider` and push
updates with `useAudioAnalysisActions` so nested sliders pick up the same analysis stream. The `AudioControls`
component ships a full playback + FFT UI that feeds this provider for you.

## Suspension

When `suspended` is true, the slider stops `useFrame` updates but keeps its state. `Folder` and `FloatingPanel`
set an `AnimationSuspensionProvider` while collapsed so nested sliders pause automatically.

## Styling

The slider uses inline styles for layout and colours, so it does not ship with any external CSS. Provide `colorA`/`colorB` values to match your theme.

## Types

```ts
import { LFOSliderMode, LFOSliderProps, SliderBarStyle, SliderVariant } from "../components";
```

`LFOSliderMode` enumerates the allowed LFO behaviour hints (`'auto' | 'manual' | 'lfo' | 'external'`). `SliderVariant` toggles full vs. basic interaction, and `SliderBarStyle` controls continuous vs. discrete bar rendering.

## Example Integration

The `src/App.tsx` file in this repository shows how to:

- Coordinate multiple sliders via a store,
- Mirror drawer state and LFO controls,
- Expose colour pickers that feed straight into the slider.

Use it as a reference when embedding `LFOSlider` in your own project.
