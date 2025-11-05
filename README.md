# ui-bits

> ⚠️ WARNING: THIS IS AI SLOP. DO NOT TRUST ANY OF THIS CODE. I DON'T EVEN KNOW HOW IT WORKS.

Right now this package only exports the low-frequency oscillator slider from the sandbox. More UI pieces may land here later.

## Install

```sh
bun add ngwnos/ui-bits
```

Bring your own `react` and `react-dom` peer dependencies. If you prefer npm or pnpm, point them at the repo git URL.

## Use it

```tsx
import { FrameLoopProvider, LFOSlider } from 'ui-bits';
import 'ui-bits/style.css';

export function Oscillator() {
  return (
    <FrameLoopProvider>
      <LFOSlider label="Cutoff" min={20} max={20000} step={1} drawerHandle />
    </FrameLoopProvider>
  );
}
```

`ui-bits/style.css` wires up the utility classes the component expects. Beyond `LFOSlider`, helpers like `FrameLoopProvider`, `useFrame`, `useStoreMirror`, and the math utilities are re-exported from the package entry.

The original Vite demo is still available via `bun run dev`; cloning the repo lets you explore everything locally.
