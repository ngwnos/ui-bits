# ui-bits

> ⚠️ WARNING: THIS IS AI SLOP. DO NOT TRUST ANY OF THIS CODE. I DON'T EVEN KNOW HOW IT WORKS.

Right now this package only exports the low-frequency oscillator slider from the sandbox. More UI pieces may land here later.

## Install

```sh
bun add github:ngwnos/ui-bits
```

## Use it

```tsx
import { FrameLoopProvider, LFOSlider, type LFOSliderProps } from 'ui-bits';
import 'ui-bits/style.css';

const sliderProps: LFOSliderProps = {
  label: 'Cutoff',
  min: 20,
  max: 20000,
  step: 1,
  defaultValue: 440,
  width: 260,
  lfoRange: [400, 16000],
  leftColor: '#2f2f2f',
  rightColor: '#f0f0f0',
  border: 'left', // 'left' | 'right' | 'none'
  fontSize: 16,
  showLfoControls: true,
  phase: 0,
  mode: 'auto', // 'auto' | 'manual' | 'lfo' | 'external'
  lfo: {
    enabled: true, // initial running state
    frequency: 0.5,
    depth: 1,
    offset: 0.5,
    phase: 0,
    waveform: 'sine', // 'sine' | 'triangle' | 'saw' | 'square'
    invert: false,
  },
  readExternal: () => undefined,
  mirrorToStore: (value, tSec) => console.log('mirror', value, tSec),
  mirrorEveryMs: 16,
  epsilon: 1e-3,
  onUserChange: (value) => console.log('user', value),
  onAnimatedUpdate: (value) => console.log('animated', value),
  onDrawerOpenChange: (open) => console.log('drawer', open),
  onDrawerLinesChange: (lines) => console.log('lines', lines),
  onLfoEnabledChange: (enabled) => console.log('lfo enabled', enabled),
  onWaveformChange: (waveform) => console.log('waveform', waveform),
  onFrequencyChange: (frequency) => console.log('frequency', frequency),
  onPhaseChange: (phase) => console.log('phase', phase),
  initialWaveform: 'sine',
  initialFrequency: 0.5,
  initialPhase: 0,
  className: 'my-slider',
  style: { marginTop: 24 },
};

export function Oscillator() {
  return (
    <FrameLoopProvider>
      <LFOSlider {...sliderProps} />
    </FrameLoopProvider>
  );
}
```

`ui-bits/style.css` wires up the utility classes the component expects. Beyond `LFOSlider`, helpers like `FrameLoopProvider`, `useFrame`, `useStoreMirror`, and the math utilities are re-exported from the package entry.

The original Vite demo is still available via `bun run dev`; cloning the repo lets you explore everything locally.

## What Actually Ships?

The published package only includes the pieces re-exported from `src/library.ts`:

- `LFOSlider` plus its prop/type helpers.
- `SelectionGrid` for the gradient/terrain preview control, including its props.
- `Dropdown` for lightweight themable select menus.
- `FrameLoopProvider` / `useFrame` and `useStoreMirror` for animation + store mirroring.
- Numeric helpers from `src/lfo.ts` (clamp, snap, waveform math, etc.).

Everything else you see in this repo (Radix Tabs layout, TypeGPU preview, column toggles, etc.) lives in the playground under `src/App.tsx`. Those demo controls exist purely to poke at otherwise hidden slider props and won’t be bundled into `ui-bits`.

Run `bun run dev` locally if you want to explore that playground; just remember it’s an example surface, not part of the distributed library.
