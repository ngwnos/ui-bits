import { jsx as $ } from "react/jsx-runtime";
import A from "react";
import { u as eo } from "./panelGap-DjV8XIAA.js";
import { I as to } from "./IconButton-BvvMagK1.js";
import { D as ro } from "./DropdownBase-CL4zqt6B.js";
import { b as no } from "./hooks-KNH81MTH.js";
function ho({
  label: i,
  showLabel: D = !1,
  labelInline: P = !1,
  overlayMenu: T = !0,
  ariaLabel: W,
  options: a,
  value: F,
  defaultValue: L,
  icon: M,
  showMenuIcons: r = !1,
  iconUsesOptionColors: b = !0,
  preventFocusOnPointerDown: d = !1,
  onChange: k,
  open: w,
  defaultOpen: z,
  onOpenChange: G,
  colorA: I,
  colorB: R,
  borderStyle: j,
  borderMask: E,
  borderRadius: N,
  width: y,
  fontSize: v,
  compact: q,
  disabled: K = !1,
  controlId: V,
  className: H,
  style: J
}) {
  const c = eo(), o = v ?? c?.fontSize ?? 12, s = I ?? c?.colorA, m = R ?? c?.colorB, Q = j ?? c?.borderStyle ?? "a", B = W ?? i, X = no(V, i, B), Y = ["dropdown-root--icon", H].filter(Boolean).join(" "), u = A.useRef(!1), Z = A.useMemo(() => {
    if (!a.length) return;
    const l = a.reduce((e, t) => t.label.length > e.length ? t.label : e, "");
    if (typeof document > "u") {
      const e = r ? o * 1.7 + 2 : 0, t = r ? o * 0.4 : 0;
      return `calc(${l.length}ch + ${Math.max(2, Math.round(o * 0.6))}em + ${Math.round(e + t)}px)`;
    }
    const n = document.createElement("canvas").getContext("2d");
    if (!n) {
      const e = r ? o * 1.7 + 2 : 0, t = r ? o * 0.4 : 0;
      return `calc(${l.length}ch + ${Math.max(2, Math.round(o * 0.6))}em + ${Math.round(e + t)}px)`;
    }
    const f = getComputedStyle(document.documentElement).getPropertyValue("--ui-bits-font-family").trim() || '"IBM Plex Mono", monospace';
    n.font = `600 ${o}px ${f}`;
    const h = a.reduce((e, t) => Math.max(e, n.measureText(t.label).width), 0), p = o * 2, g = r ? o * (1 + 0.35 * 2) + 2 : 0, x = r ? o * 0.4 : 0;
    return `${Math.ceil(h + p + g + x)}px`;
  }, [a, o, r]), _ = {
    width: y == null ? "fit-content" : void 0,
    "--dropdown-menu-width": Z,
    ...J
  };
  return /* @__PURE__ */ $(
    ro,
    {
      label: i,
      showLabel: D,
      labelInline: P,
      overlayMenu: T,
      ariaLabel: B,
      options: a,
      value: F,
      defaultValue: L,
      onChange: k,
      open: w,
      defaultOpen: z,
      onOpenChange: G,
      colorA: s,
      colorB: m,
      borderStyle: Q,
      borderMask: E,
      borderRadius: N,
      width: y,
      fontSize: v,
      compact: q,
      showOptionIcons: r,
      returnFocusOnSelect: !d,
      disabled: K,
      controlId: X,
      className: Y,
      style: _,
      renderTrigger: ({
        open: l,
        disabled: C,
        buttonRef: n,
        activeOption: S,
        onTriggerClick: f,
        onTriggerKeyDown: h,
        ariaLabelledBy: p,
        ariaLabel: g,
        ariaControls: x
      }) => {
        const e = S, t = e?.icon ?? M, O = b ? e?.colorA ?? s : s, U = b ? e?.colorB ?? m : m;
        return /* @__PURE__ */ $(
          to,
          {
            ref: n,
            behavior: "toggle",
            toggled: l,
            onClick: () => {
              f(), d && u.current && (u.current = !1, requestAnimationFrame(() => n.current?.blur()));
            },
            onKeyDown: h,
            onPointerDown: (oo) => {
              d && (u.current = !0, oo.preventDefault());
            },
            "aria-haspopup": "listbox",
            "aria-expanded": l,
            "aria-controls": x,
            "aria-labelledby": p,
            "aria-label": g,
            fontSize: o,
            colorA: O,
            colorB: U,
            borderStyle: "none",
            disabled: C,
            children: t
          }
        );
      }
    }
  );
}
export {
  ho as I
};
//# sourceMappingURL=IconDropdown-up2bKIx5.js.map
