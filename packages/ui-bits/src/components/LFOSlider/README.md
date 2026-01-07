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
| `label` | `string` | Accessible label and on-screen caption. |
| `min`, `max`, `step` | `number` | Range and quantisation of the numeric value. Defaults to `0 → 100` with step `1`. |
| `variant` | `'full' \| 'basic'` | `basic` disables text editing + LFO drawer controls to create a minimal slider for nested usage. |
| `barStyle` | `'continuous' \| 'discrete'` | Controls how the bar fill renders; discrete snaps the fill without changing the numeric value step. |
| `barSegmentCount` | `number` | Visual segment count used when `barStyle="discrete"`. |
| `defaultValue` | `number` | Initial numerical value; the component keeps its own local text buffer. |
| `lfoRange` | `[number, number]` | Optional min/max markers shown in the drawer track. Falls back to randomised handles when omitted. |
| `colorA`, `colorB` | `string` | Hex colours for the segmented background. When omitted the slider falls back to neutral grey/white. |
| `showLfoControls` | `boolean` | Enables the drawer UI (waveform toggles + min/max handles). |
| `initialWaveform`, `initialFrequency`, `initialPhase` | Numbers describing the starting LFO. |
| `onUserChange` | `(value: number) => void` | Fired for direct user edits (dragging, typing). |
| `onAnimatedUpdate` | `(value: number) => void` | Fired for automated updates (frame loop, external source). |
| `onDrawerOpenChange`, `onDrawerLinesChange` | Callbacks for synchronising drawer state with your store. |
| `onWaveformChange`, `onFrequencyChange`, `onPhaseChange`, `onLfoEnabledChange` | Hooks for mirroring LFO controls (running state toggles when the active waveform button is clicked again). |
| `className`, `style` | `string`, `React.CSSProperties` | Optional overrides applied to the root wrapper. |

Refer to `LFOSliderProps` for the full list of optional callbacks and configuration flags.

## Frame Loop & Mirroring

The component uses the local `frameLoop` and `useStoreMirror` helpers from this project. If you embed the slider in another application you can either:

1. Reuse the same helpers (copy `frameLoop.tsx` and `useStoreMirror.ts`), or
2. Replace the hook implementations with equivalents that fit your environment.

The hooks are optional – leaving `mode="manual"`, `mirrorToStore={undefined}`, and `readExternal={undefined}` disables the extra animation/mirroring features.

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
