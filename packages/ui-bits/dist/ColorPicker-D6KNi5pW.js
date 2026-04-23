import { jsx as P } from "react/jsx-runtime";
import L from "react";
import { u as j } from "./panelGap-DjV8XIAA.js";
import { b as N, d as $ } from "./hooks-KNH81MTH.js";
const U = "var(--ui-bits-color-a, #2f2f2f)", W = "var(--ui-bits-color-b, #f0f0f0)", G = 1, Y = 0.35, q = 1, R = "#ffffff";
function J(e) {
  const o = e * (G + Y * 2);
  return Math.round(o + q * 2);
}
function k(e) {
  const o = e.trim(), n = /^#([0-9a-fA-F]{3})$/, l = /^#([0-9a-fA-F]{6})$/, f = o.match(n);
  return f ? `#${f[1].split("").map((s) => s + s).join("")}` : l.test(o) ? o : null;
}
const Q = L.forwardRef((e, o) => {
  const {
    value: n,
    defaultValue: l = R,
    onChange: f,
    colorA: s,
    colorB: A,
    borderStyle: D,
    borderMask: a,
    fontSize: _,
    controlId: E,
    style: I,
    className: x,
    disabled: b,
    onClick: M,
    onKeyDown: z,
    type: V,
    title: p,
    ...y
  } = e, d = j(), w = y["aria-label"], B = N(E, w ?? p), [m, v] = $(B), C = B !== void 0 && n === void 0, O = C ? m : n, F = s ?? d?.colorA ?? U, K = A ?? d?.colorB ?? W, S = D ?? d?.borderStyle ?? "none", h = _ ?? d?.fontSize ?? 12, r = S === "a" ? F : S === "b" ? K : "transparent", i = {
    top: a?.top ?? !0,
    right: a?.right ?? !0,
    bottom: a?.bottom ?? !0,
    left: a?.left ?? !0
  }, g = J(h), T = Math.max(2, Math.round(h * 0.25)), H = Math.max(1, Math.round(h * 0.1)), c = k(O ?? l) ?? k(l) ?? R, u = c;
  return L.useEffect(() => {
    !C || m !== void 0 || v(c);
  }, [c, v, C, m]), /* @__PURE__ */ P(
    "button",
    {
      ref: o,
      type: V ?? "button",
      className: x,
      disabled: b,
      onClick: (t) => {
        M?.(t);
      },
      onKeyDown: (t) => {
        (t.key === " " || t.key === "Enter") && t.preventDefault(), z?.(t);
      },
      title: p,
      style: {
        width: g,
        height: g,
        borderRadius: T,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: r,
        borderTopColor: i.top ? r : u,
        borderRightColor: i.right ? r : u,
        borderBottomColor: i.bottom ? r : u,
        borderLeftColor: i.left ? r : u,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: H,
        backgroundClip: "padding-box",
        background: c,
        cursor: b ? "not-allowed" : "pointer",
        ...b ? { opacity: 0.5 } : null,
        ...I ?? {}
      },
      ...y
    }
  );
});
Q.displayName = "ColorPicker";
export {
  Q as C
};
//# sourceMappingURL=ColorPicker-D6KNi5pW.js.map
