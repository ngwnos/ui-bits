# ui-bits Integration Patterns

These notes cover contracts implemented in `packages/ui-bits/src`.

## State Modes

Use one state mode per control.

- Controlled: pass `value` plus `onChange` or `onUserChange`.
- Store-bound: pass a stable `controlId` and no controlled `value`.
- Uncontrolled: pass `defaultValue` or the relevant `default*` props.

Passing both a controlled value and `controlId` makes the controlled value win. Several controls emit a one-time development warning for that case.

## Presets

`PresetStoreProvider` and `PresetManager` snapshot values from the control store. Controls that should appear in presets need stable control ids, or the host app needs to mirror values into the store directly.

## Realtime UIs

High-frequency callbacks should update refs, audio nodes, or render-loop inputs directly when possible. For `LFOSlider`, use `onUserChange` for direct edits and `onAnimatedUpdate` for frame-time modulation.

## Styles

Import `ui-bits/style.css` once in the host app. Individual components expose `colorA`, `colorB`, border, font size, and spacing props for local composition.

## Terrain Previews

`GradientSelectionGrid` accepts a `terrainAssets` prop. The package does not bundle terrain images; docs load their sample tiles from `apps/docs/src/assets/terrain/tiles`.

## Minimal Example

```tsx
import { ColorField, FrameLoopProvider, LFOSlider, PresetStoreProvider } from "ui-bits/core";
import "ui-bits/style.css";

export function Controls() {
  return (
    <FrameLoopProvider>
      <PresetStoreProvider storageKey="scene-presets">
        <LFOSlider
          label="Growth"
          controlId="scene.growth"
          min={0}
          max={1}
          step={0.001}
          defaultValue={0.35}
        />

        <ColorField
          label="Leaf"
          controlId="scene.leafColor"
          alphaControlId="scene.leafAlpha"
          defaultValue="#78a35b"
          defaultAlpha={255}
        />
      </PresetStoreProvider>
    </FrameLoopProvider>
  );
}
```
