import { jsx as A } from "react/jsx-runtime";
import "react";
import { c as m } from "./lfo-DJ5JkDXn.js";
const O = "#2f2f2f", C = "#f0f0f0", F = 1, H = 0.35, v = 1;
function y(t) {
  if (t != null)
    return typeof t == "number" ? `${t}px` : t;
}
function z(t) {
  const r = t * (F + H * 2);
  return Math.round(r + v * 2);
}
function E({
  value: t,
  defaultValue: r = 0,
  colorA: i = O,
  colorB: a = C,
  barStyle: g = "continuous",
  barSegmentCount: u = 32,
  border: c = "a",
  borderMask: o,
  width: f,
  fontSize: b = 12,
  className: l,
  style: h,
  ...x
}) {
  const B = typeof t == "number" && Number.isFinite(t) ? t : r, s = m(B, 0, 1), d = Number.isFinite(u) ? Math.max(1, Math.floor(u)) : 0, L = g === "discrete" && d > 1 ? Math.round(s * d) / d : s, p = `${(m(L, 0, 1) * 100).toFixed(3)}%`, _ = y(f), R = c === "b" ? a : i, e = {
    top: o?.top ?? !0,
    right: o?.right ?? !0,
    bottom: o?.bottom ?? !0,
    left: o?.left ?? !0
  }, n = c === "none" ? "1px solid transparent" : `1px solid ${R}`, $ = z(b);
  return /* @__PURE__ */ A(
    "div",
    {
      className: l,
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": s,
      style: {
        width: _,
        height: $,
        borderRadius: 3,
        borderTop: e.top ? n : "none",
        borderRight: e.right ? n : "none",
        borderBottom: e.bottom ? n : "none",
        borderLeft: e.left ? n : "none",
        backgroundImage: `linear-gradient(90deg, ${i} 0%, ${i} ${p}, ${a} ${p}, ${a} 100%)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundOrigin: "padding-box",
        boxSizing: "border-box",
        ...h ?? {}
      },
      ...x
    }
  );
}
E.displayName = "LoadingBar";
export {
  E as L
};
//# sourceMappingURL=LoadingBar-q33c1C2y.js.map
