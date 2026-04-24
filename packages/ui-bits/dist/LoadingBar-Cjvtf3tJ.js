import { jsx as O } from "react/jsx-runtime";
import "react";
import { c as p } from "./lfo-DJ5JkDXn.js";
import { u as y } from "./panelGap-DjV8XIAA.js";
const H = "#2f2f2f", S = "#f0f0f0", T = 1, E = 0.35, I = 1;
function N(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
function V(o) {
  const i = o * (T + E * 2);
  return Math.round(i + I * 2);
}
function w({
  value: o,
  defaultValue: i = 0,
  colorA: f,
  colorB: b,
  barStyle: g = "continuous",
  barSegmentCount: l = 32,
  border: h,
  borderMask: e,
  width: B,
  fontSize: x,
  className: A,
  style: L,
  ..._
}) {
  const t = y(), s = f ?? t?.colorA ?? H, a = b ?? t?.colorB ?? S, u = h ?? t?.borderStyle ?? "a", R = x ?? t?.fontSize ?? 12, $ = typeof o == "number" && Number.isFinite(o) ? o : i, d = p($, 0, 1), c = Number.isFinite(l) ? Math.max(1, Math.floor(l)) : 0, v = g === "discrete" && c > 1 ? Math.round(d * c) / c : d, m = `${(p(v, 0, 1) * 100).toFixed(3)}%`, C = N(B), z = u === "b" ? a : s, r = {
    top: e?.top ?? !0,
    right: e?.right ?? !0,
    bottom: e?.bottom ?? !0,
    left: e?.left ?? !0
  }, n = u === "none" ? "1px solid transparent" : `1px solid ${z}`, F = V(R);
  return /* @__PURE__ */ O(
    "div",
    {
      className: A,
      role: "progressbar",
      "aria-valuemin": 0,
      "aria-valuemax": 1,
      "aria-valuenow": d,
      style: {
        width: C,
        height: F,
        borderRadius: 3,
        borderTop: r.top ? n : "none",
        borderRight: r.right ? n : "none",
        borderBottom: r.bottom ? n : "none",
        borderLeft: r.left ? n : "none",
        backgroundImage: `linear-gradient(90deg, ${s} 0%, ${s} ${m}, ${a} ${m}, ${a} 100%)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundOrigin: "padding-box",
        boxSizing: "border-box",
        ...L ?? {}
      },
      ..._
    }
  );
}
w.displayName = "LoadingBar";
export {
  w as L
};
//# sourceMappingURL=LoadingBar-Cjvtf3tJ.js.map
