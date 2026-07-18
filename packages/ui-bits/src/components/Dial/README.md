# Dial

Circular knob (270° sweep) rendering a numeric value with an arc or dot indicator. Exposed as `role="slider"`.

## Importing

```tsx
import { Dial, type DialProps } from "ui-bits/core";
import "ui-bits/style.css";
```

Subpath: `import Dial from "ui-bits/components/Dial";`

## State contract (tri-state)

Exactly one of three modes applies, resolved in this order:

1. **Controlled** — `value` is set. Internal state and the control store are ignored. If an explicit `controlId` prop is also set, a one-time dev warning fires (`Dial received both controlId and controlled value`) and the store binding is skipped; an ariaLabel-derived auto id is skipped silently.
2. **Store-bound** — no `value`, and a control id resolves (see below). The store entry is the source of truth; on mount, if the store slot is `undefined`, Dial seeds it with `clamp(defaultValue ?? min)`. User input writes back to the store; external writes to the same id re-render the dial.
3. **Uncontrolled** — neither. Internal state, initialized from `defaultValue ?? min`.

In all modes every user-driven value change (pointer, wheel, keyboard) fires both `onChange` and `onUserChange` — Dial has no LFO/animation source, so there is no other change path except external store writes, which re-render the dial without firing either callback.

## Control id resolution (changed behavior)

A control id resolves only from a **user-supplied** `controlId` or `ariaLabel`:

- Explicit `controlId` always wins.
- Under `ControlIdProvider autoIds`, a user-supplied `ariaLabel` is slugified (lowercased, non-alphanumerics → `-`) and joined with the provider `prefix` (`prefix.slug`).
- **An unlabeled Dial under `autoIds` does not bind at all.** The built-in default aria-label (`"Dial control"`) is accessibility-only and no longer feeds id derivation — previously every unlabeled Dial resolved to the shared id `dial-control`, cross-linking their values. Now it gets no store binding and emits a one-time dev warning telling you to provide `ariaLabel` or `controlId`.

```tsx
<ControlIdProvider autoIds prefix="synth">
  <Dial ariaLabel="Cutoff" min={0} max={1} step={0.01} />  {/* binds to "synth.cutoff" */}
  <Dial />                                                  {/* no binding, dev-warns */}
</ControlIdProvider>
```

## Interaction

Two control modes: `"xy"` (default; relative drag — right/up increases, `Shift` = 10× step) and `"angle"` (pointer position maps directly to arc angle). Controlled via `controlMode`/`defaultControlMode`/`onControlModeChange`. Double-click toggles the mode.

Keyboard (from the source; `Shift` multiplies the step by 10 where noted):

| Key | Action |
| --- | --- |
| `ArrowUp` / `ArrowRight` | +1 step (Shift: +10) |
| `ArrowDown` / `ArrowLeft` | −1 step (Shift: −10) |
| `PageUp` / `PageDown` | ±5 steps (Shift: ±50) |
| `Home` / `End` | jump to `min` / `max` |
| `m` / `M` | toggle control mode (`angle` ↔ `xy`) |

Mouse wheel: ±1 step per notch (Shift: ±10). `disabled` or suspension (via `suspended` prop or `AnimationSuspension` context) blocks all input and sets `aria-disabled`.

Values are always clamped to `[min, max]` and snapped to `step` (non-finite or non-positive `step` falls back to `1`).

## Theming caveat

**Dial does not read `PanelThemeContext`.** Unlike Dropdown/LFOSlider, panel-provided `fontSize` and `borderStyle` are ignored — Dial always uses its own props (`fontSize` default `12`, `borderStyle` default `"none"`). Colors follow an enclosing `FloatingPanel` only indirectly: the `colorA`/`colorB` defaults are `var(--ui-bits-color-a)` / `var(--ui-bits-color-b)`, which FloatingPanel sets as CSS variables. Explicit `colorA`/`colorB` props override. Set `fontSize` manually to match panel-themed siblings.

Other visuals: `indicatorStyle` `"arc"` (default) or `"dot"`, `indicatorColor` (defaults to `currentColor`), `formatDisplayValue` for the center readout (default: rounded integer), `borderMask` to hide individual border edges. Dial size derives from `fontSize` (roughly `fontSize * 1.7 + 2px`); there is no independent size prop.
