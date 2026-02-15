# ui-bits

You probably shouldn't use this unless you're me.

## Install

```sh
bun add github:ngwnos/ui-bits
```

## Development

```sh
bun install
bun run dev
```

The primary playground lives in `apps/docs/`. The installable package entrypoints live at the repo root (`ui-bits`) and export the committed build output under `packages/ui-bits/dist/`.

## Use in a project

1) Import the stylesheet once.
2) Wrap your UI in `FrameLoopProvider`.
3) Use the components you need.

```tsx
import { FrameLoopProvider, LFOSlider, ColorField } from "ui-bits/core";
import "ui-bits/style.css";

export default function App() {
  return (
    <FrameLoopProvider>
      <LFOSlider
        label="Cutoff"
        min={20}
        max={20000}
        step={1}
        defaultValue={440}
        width={260}
        colorA="#2f2f2f"
        colorB="#f0f0f0"
      />
      <ColorField
        label="Tint"
        defaultValue="#ffcc66"
        colorA="#2f2f2f"
        colorB="#f0f0f0"
      />
    </FrameLoopProvider>
  );
}
```

If you need audio instrument features, import those from the audio entry:

```tsx
import { VirtualKeyboard } from "ui-bits/audio";
```

Install optional audio peers when you need playback:

```sh
bun add tone soundfont-player
```

The root entry (`ui-bits`) remains available and still exports the full surface area for backward compatibility.

If you don’t need animation updates, you can still wrap once and ignore it elsewhere. The stylesheet is required for the internal utility classes.
