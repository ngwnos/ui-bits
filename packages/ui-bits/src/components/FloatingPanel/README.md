# FloatingPanel

Container that themes, lays out, and (optionally) drags/collapses a stack of ui-bits controls. Its real job is the set of contexts it provides to descendants.

```tsx
import { FloatingPanel, LFOSlider } from "ui-bits";

<FloatingPanel title="FX" draggable defaultPosition={{ x: 24, y: 24 }} defaultCollapsed
  colorA="#2f2f2f" colorB="#f0f0f0" fontSize={12}>
  <LFOSlider ariaLabel="Warp" min={0} max={1} />
</FloatingPanel>
```

## What descendants receive

| Context | Value | Scope |
| --- | --- | --- |
| `PanelThemeContext` | `{ colorA, colorB, fontSize, borderStyle, transparent, bodyBlur }` | entire panel (header + body) |
| `PanelSurfaceContext` | `{ opacity, blur }` — resolved body surface opacity/blur | body children only |
| `VerticalGapContext` | resolved `verticalGap` px (default 8); also the flex `gap` between children | body children only |
| `AnimationSuspensionProvider` | `suspended \|\| (keepMounted && collapsed)` | body children only |

- **Theme cascade**: child components resolve `prop ?? usePanelTheme() ?? fallback` (see `BasicButton`, `SegmentBar`). So `colorA`/`colorB`/`fontSize`/`borderStyle` on the panel become defaults for every ui-bits control inside; an explicit prop on the child always wins. `transparent` in the theme reflects whether the surface is actually translucent (`transparencyActive`), not the raw prop.
- **CSS variables**: the root div sets `--ui-bits-color-a` and `--ui-bits-color-b`. Components whose hardcoded fallbacks are `var(--ui-bits-color-a, #2f2f2f)` / `var(--ui-bits-color-b, #f0f0f0)` (Dial, Dropdown, ColorField, LFOSlider gradients, ...) inherit panel colors through CSS even where they don't read the theme context.
- **Animation suspension**: `useAnimationSuspended()` descendants stop per-frame work when suspended. LFOSlider passes `useFrame(isSuspended ? null : frameFn)` — it unsubscribes from the shared frame loop entirely; AudioControls engines gate the same way. A collapsed panel with `keepMounted` (the default) therefore keeps children mounted but costs zero rAF work. Nesting ORs: a suspended ancestor suspends everything below.
- Public exports: `usePanelTheme`, `AnimationSuspensionProvider`, `useAnimationSuspended` (from the package root). `PanelSurfaceContext`, `VerticalGapContext`, `usePanelSurface`, `useVerticalGap` are internal (`src/panelGap.tsx`), not exported.

## Collapse

- `collapsible` (default `true`) renders the +/− toggle in the default header. Controlled via `collapsed`, uncontrolled via `defaultCollapsed` (default `false`); `onCollapseChange(next)` fires either way.
- `keepMounted` (default `true`): collapsed body stays mounted with `display: none` and `aria-hidden`, and children are animation-suspended. With `keepMounted={false}` the body unmounts on collapse (children lose state) and suspension comes only from the `suspended` prop.

## Dragging / positioning

- `draggable` enables header-drag (pointer capture; drags starting on `button`, `input`, `select`, `textarea`, `a`, or `[data-floating-panel-ignore-drag]` are ignored). Once a position exists the panel becomes `position: fixed`, `zIndex: 20`.
- Uncontrolled: `defaultPosition` (clamped into the viewport on mount) or first drag captures the current rect. Controlled: pass **both** `position` and `onPositionChange` — with `position` alone, drags and viewport clamping are no-ops.
- Position is clamped so the header stays visible: `x ∈ [0, innerWidth − width]`, `y ∈ [0, innerHeight − headerHeight − 6]`. A resize listener + ResizeObserver re-clamp on viewport/panel size changes.
- `showDockButton` (default `true`, only shown when `draggable`) and `dockOnMount` snap the panel to the top-right corner (6px margin).

## Surface (opacity / blur)

`transparent` or `showOpacityControl` enable a translucent body: background is `colorB` at `bodyOpacity` alpha with `backdrop-filter: blur(bodyBlur)` (defaults 0.5 / 10). `bodyOpacity` is controllable (`bodyOpacity` + `onBodyOpacityChange`) or uncontrolled (`defaultBodyOpacity`). `showOpacityControl` adds a 0–100 Dial to the header; at 100 the surface renders fully opaque with blur off. The header itself is always opaque `colorB`.

## Body scrolling and the viewport caveat

With `constrainBodyToViewport` (default `true`), the body gets `max-height: window.innerHeight − panelTop − headerHeight − 6` and scrolls internally (custom overlay scrollbar; native one hidden).

**Sharp edge**: that expression reads `window.innerHeight` during render, and nothing re-renders on resize alone. The resize/scroll listeners only update state when the panel's viewport top (or clamped position) actually changes; if the window height changes while the panel stays put, the stale max-height persists until some other state change triggers a render. Shrinking the window can leave the body overflowing off-screen.

## Other props

`header` replaces the entire default header row (toggle, `title`, `headerControls`, opacity dial, dock button). `borderStyle`: `"a"` (border in `colorA`, default), `"b"`, or `"none"`. `width`, `padding`/`paddingLeft`/`paddingRight`/`paddingBottom`, `radius` (default 3), `shadow` (default `"none"`), `fontSize` (default 12 — also sets header height). Remaining div attributes spread onto the root.
