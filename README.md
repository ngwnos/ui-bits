# ui-bits

> ⚠️ WARNING: THIS IS AI SLOP. DO NOT TRUST ANY OF THIS CODE. I DON'T EVEN KNOW HOW IT WORKS.

An experimental playground of UI bits we plan to grow into a broader library. Today it exposes a single low-frequency oscillator slider so you can embed the demo control without cloning the whole Vite app.

## Install

```sh
bun add ui-bits
```

Bring your own `react` and `react-dom` peer dependencies.

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

The original Vite demo is still available via `bun run dev` if you want to poke around, but consumable code should come from the published package.
