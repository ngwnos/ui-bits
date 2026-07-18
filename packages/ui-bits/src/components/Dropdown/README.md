# Dropdown / IconDropdown

Listbox-style select. Two public wrappers over a shared internal `DropdownBase` (not exported): `Dropdown` (labeled text trigger with caret) and `IconDropdown` (icon-button trigger; the active option's `icon` — or the `icon` prop fallback — becomes the trigger icon). Everything below applies to both unless noted.

## Importing

```tsx
import { Dropdown, IconDropdown, type DropdownOption } from "ui-bits/core";
import "ui-bits/style.css";
```

Subpaths: `ui-bits/components/Dropdown`, `ui-bits/components/IconDropdown`.

```tsx
<Dropdown
  label="Waveform"
  options={[
    { value: "sine", label: "Sine" },
    { value: "square", label: "Square", description: "Hard edges" },
  ]}
  onChange={(value, option) => console.log(value)}
/>
```

## State contract

Value resolution in `DropdownBase`:

1. **Controlled** — `value` set. Store binding inert (no warning, unlike Dial — `value` silently wins; the store is neither seeded nor written).
2. **Store-bound** — no `value` and a `controlId` resolved. Store slot is the source of truth; if `undefined` on mount it is seeded with `defaultValue`, else the first non-disabled option's value, else `""`. `selectOption` writes back to the store; external store writes re-render.
3. **Uncontrolled** — internal state, same initial-value fallback chain. If the current internal value disappears from `options`, it resets to that fallback.

`onChange(value, option)` fires on every selection in all modes. Open state is separately controllable: `open` / `defaultOpen` / `onOpenChange`.

Control id resolution: explicit `controlId` wins; under `ControlIdProvider autoIds`, `Dropdown` slugs its (required) `label`. `IconDropdown` slugs `label`, else `ariaLabel`. Sharp edge: an `IconDropdown` with neither label under `autoIds` still binds — the id falls back to a slug of React's `useId()`, which is not stable across sessions or tree changes. Give it a label or explicit `controlId` if the binding matters.

## Menu behavior (DropdownBase)

- **Portal + fixed positioning.** The open menu portals to `document.body` and uses `position: fixed` with measured viewport coordinates, so it escapes `overflow: hidden` ancestors. It repositions on window resize, any capture-phase scroll (except the menu's own), and trigger resize (ResizeObserver).
- **Clamping and flip.** Horizontal position clamps to the viewport with a 6px margin. Vertical: opens downward by default; flips upward when downward space is under 40px and upward space is greater. Max height 240px, shrunk to available space (min 40px).
- **`overlayMenu`** (default `true`): the menu overlays the trigger (anchors at the trigger's top edge). `false` anchors below it, native-select style.
- **Outside close.** A window `pointerdown` outside both the trigger root and the portaled menu closes it. `Escape` closes and refocuses the trigger.
- Custom overlay scrollbar; per-option theming via `DropdownOption.colorA/colorB/borderStyle`.

## Keyboard and focus model

While open, keys are handled by a **window-level** keydown listener; real DOM focus stays on the trigger button and options have `tabIndex={-1}`. Focus within the list is *virtual* — an index rendered as `data-focused` and kept in view via `scrollIntoView`.

| Key | Closed (trigger focused) | Open |
| --- | --- | --- |
| `ArrowDown` / `ArrowUp` | opens | move virtual focus (wraps, skips disabled) |
| `Space` | opens | select focused option |
| `Enter` | toggles (native button click) | select focused option |
| `Home` / `End` | — | first / last enabled option |
| `Escape` | — | close, refocus trigger |

Hovering an option moves virtual focus to it. After selection, focus returns to the trigger on the next frame (IconDropdown: unless `preventFocusOnPointerDown`).

**Accessibility caveat:** virtual focus does not set `aria-activedescendant` on the listbox/trigger. Option elements have stable ids and `aria-selected`, but screen readers cannot track which option is virtually focused. Keyboard operation works; AT focus reporting does not.

## Theming

Unlike Dial, both components read `PanelThemeContext`: `fontSize`, `colorA`, `colorB`, `borderStyle` fall back to the panel theme, then to `12` / `var(--ui-bits-color-a)` / `var(--ui-bits-color-b)` / `"a"`. `borderStyle: "b"` swaps surface and text colors.
