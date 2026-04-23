# ui-bits

`ui-bits` is a React + TypeScript control library for graphics and audio tools.

## Install

```sh
bun add github:ngwnos/ui-bits
```

## Quick start

1. Import styles once.
2. Wrap your UI in `FrameLoopProvider`.
3. Pick one state mode per control: controlled, store-bound, or uncontrolled.

```tsx
import { FrameLoopProvider, LFOSlider, ColorField } from "ui-bits/core";
import "ui-bits/style.css";

export default function App() {
  return (
    <FrameLoopProvider>
      <LFOSlider
        label="Wind"
        min={0}
        max={2}
        step={0.01}
        defaultValue={0.6}
        controlId="scene.wind"
      />

      <ColorField
        label="Leaf Color"
        defaultValue="#78a35b"
        defaultAlpha={255}
        controlId="scene.leafColor"
        alphaControlId="scene.leafAlpha"
      />
    </FrameLoopProvider>
  );
}
```

## State Contract

- Use exactly one state mode per prop set:
  - Controlled: `value` + `onChange`/`onUserChange`
  - Store-bound: `controlId` (or `alphaControlId`) with no controlled `value`
  - Uncontrolled: `defaultValue` / `defaultAlpha`
- Do not pass both `value` and `controlId` on the same control. Dev warnings are emitted and store binding is ignored.
- For preset workflows, controls must either be store-bound or explicitly mirrored into the control store.
- For animated controls (`LFOSlider`), use `onUserChange` for direct edits and `onAnimatedUpdate` for frame-time outputs.

## Entry Points

- `ui-bits/core`: controls, stores, providers, gradients, and non-audio helpers.
- `ui-bits/audio`: `ui-bits/core` plus `AudioControls` and `VirtualKeyboard`.
- `ui-bits/terrain`: TIFF height-texture loading utilities.
- `ui-bits/components/<Name>`: component-level subpath exports.
- `ui-bits`: full compatibility export.

The package stylesheet is exported as `ui-bits/style.css`. Sample terrain tiles and docs fonts live in the docs app, not in the package bundle.

## Development

```sh
bun install
bun run dev
bun run lint
bun run build
```

## Docs

- Integration patterns: `docs/INTEGRATION_PATTERNS.md`
- Docs app setup: `apps/docs/README.md`
