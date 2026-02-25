# ui-bits Integration Patterns

This document captures production usage patterns across `tree`, `roots`, and `dm-to-survive`.

## 1) Pick one control state mode

Every control should use exactly one mode:

- Controlled mode:
  - Pass `value`
  - Update parent state in `onChange` / `onUserChange`
- Store-bound mode:
  - Pass `controlId`
  - Do not pass controlled `value`
- Uncontrolled mode:
  - Pass `defaultValue`
  - Optional callbacks for side effects

Anti-pattern:

- Passing both `controlId` and `value`.

Result:

- `value` wins, store binding is ignored.
- Components now emit one-time dev warnings for this.

## 2) Realtime scene integrations (Three/WebGPU)

For high-frequency rendering loops:

- Keep render-loop inputs in refs or GPU buffers.
- In slider/color callbacks, update refs directly.
- Avoid large React tree updates on each pointer move.

Use this split:

- `onUserChange`: immediate user edits.
- `onAnimatedUpdate`: per-frame modulation output.

## 3) Preset contract

If you use `PresetStoreProvider` + `PresetManager`:

- Ensure relevant controls are represented in the control store.
- Use stable `controlId`s and keep naming consistent.
- When `presets` is controlled, provide `onPresetsChange`.

Common failure mode:

- Visual controls update scene state, but control store is not updated.
- Symptom: "current settings" comparisons and copied preset snapshots look stuck/default.

## 4) Color controls

For `ColorField`:

- `value`/`defaultValue` must be hex (`#rgb` or `#rrggbb`).
- Use `pickerDisplay="inline"` for always-visible picker.
- Use `pickerDisplay="popup"` for swatch-triggered popover.

## 5) Theming and panel composition

Observed common structure:

- `FloatingPanel` as shell
- `Folder` for grouped sections
- `ControlGroup` / `ControlRow` for dense control layouts
- Theme variables (`colorA`, `colorB`, border style, font size) defined once and threaded through components

## 6) Minimal robust template

```tsx
import {
  FrameLoopProvider,
  PresetStoreProvider,
  LFOSlider,
  ColorField,
} from "ui-bits/core";
import "ui-bits/style.css";

export function Controls() {
  return (
    <FrameLoopProvider>
      <PresetStoreProvider autoIds controlIdPrefix="scene" storageKey="scene-presets">
        <LFOSlider
          label="Growth"
          controlId="scene.growth"
          min={0}
          max={1}
          step={0.001}
          defaultValue={0.35}
          onUserChange={(v) => {
            // Update scene ref/buffer directly when possible.
            void v;
          }}
        />

        <ColorField
          label="Leaf"
          controlId="scene.leafColor"
          alphaControlId="scene.leafAlpha"
          defaultValue="#78a35b"
          defaultAlpha={255}
          pickerDisplay="inline"
        />
      </PresetStoreProvider>
    </FrameLoopProvider>
  );
}
```

## 7) Prompt hint block for code models

Use this verbatim when asking a model to add controls with `ui-bits`:

```text
Use ui-bits with strict state-mode rules:
- For each control, choose exactly one mode: controlled (value+callback), store-bound (controlId), or uncontrolled (defaultValue).
- Never pass both value and controlId.
- For preset support, bind controls to stable controlIds so snapshots stay accurate.
- For realtime scenes, update refs/buffers in callbacks and avoid triggering heavy React rerenders per pointer move.
- Use FrameLoopProvider at the root and import ui-bits/style.css once.
```
