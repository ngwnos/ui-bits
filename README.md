# ui-bits

Reusable low-frequency oscillator slider components extracted from the demo app. This package ships the slider, helper hooks, and math utilities so you can embed them directly into any React project without cloning the playground.

## Installation

```sh
bun add ui-bits
```

`react` and `react-dom` are peer dependencies; keep them in your host app.

## Quick start

```tsx
import { FrameLoopProvider, LFOSlider } from 'ui-bits';
import 'ui-bits/style.css';

export function Oscillator() {
  return (
    <FrameLoopProvider>
      <LFOSlider
        label="Cutoff"
        min={20}
        max={20000}
        step={1}
        drawerHandle
        onUserChange={(value) => console.log(value)}
      />
    </FrameLoopProvider>
  );
}
```

Import `ui-bits/style.css` once near your app entry point so the utility classes used by the slider resolve correctly.

## API surface

- `LFOSlider` & `LFOSliderProps`: the primary control with drawer, LFO, and external value modes.
- `FrameLoopProvider` & `useFrame(fn)`: wraps sliders that animate via LFO or external feeds.
- `useStoreMirror(readValue, mirrorFn, throttleMs?, epsilon?)`: stream slider values into your own store.
- `lfo` utilities: `clamp`, `snapToStep`, `splitFromValue`, `valueFromSplit`, `lfoValue`, `phaseCaptureForTriangle`, plus `LfoSettings` and `Waveform` types.

See `src/components/LFOSlider/LFOSlider.tsx` for advanced props such as `readExternal`, `onAnimatedUpdate`, and drawer callbacks.

## Demo app

The Vite playground under `bun run dev` still lives in this repo for experimentation. It includes the Flexoki-themed store, color pickers, and layout helpers that are not part of the published package.
