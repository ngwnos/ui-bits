import { jsxs as J, Fragment as Q, jsx as _ } from "react/jsx-runtime";
import c from "react";
import { u as X } from "./panelGap-DjV8XIAA.js";
import { b as Z, d as oo } from "./hooks-KNH81MTH.js";
const eo = "var(--ui-bits-color-a, #2f2f2f)", to = "var(--ui-bits-color-b, #f0f0f0)", ro = 1, no = 0.35, lo = 1, R = "#ffffff";
function so(r) {
  const e = r * (ro + no * 2);
  return Math.round(e + lo * 2);
}
function v(r) {
  const e = r.trim(), d = /^#([0-9a-fA-F]{3})$/, u = /^#([0-9a-fA-F]{6})$/, n = e.match(d);
  return n ? `#${n[1].split("").map((t) => t + t).join("")}` : u.test(e) ? e : null;
}
const ao = c.forwardRef((r, e) => {
  const {
    value: d,
    defaultValue: u = R,
    onChange: n,
    nativePicker: t = !0,
    colorA: z,
    colorB: E,
    borderStyle: M,
    borderMask: f,
    fontSize: w,
    controlId: F,
    style: O,
    className: P,
    disabled: l,
    onClick: T,
    onKeyDown: K,
    type: H,
    title: S,
    ...k
  } = r, b = X(), j = k["aria-label"], L = Z(F, j ?? S), [y, m] = oo(L), s = L !== void 0 && d === void 0, I = s ? y : d, g = I !== void 0, N = z ?? b?.colorA ?? eo, $ = E ?? b?.colorB ?? to, x = M ?? b?.borderStyle ?? "none", B = w ?? b?.fontSize ?? 12, a = x === "a" ? N : x === "b" ? $ : "transparent", h = {
    top: f?.top ?? !0,
    right: f?.right ?? !0,
    bottom: f?.bottom ?? !0,
    left: f?.left ?? !0
  }, A = so(B), U = Math.max(2, Math.round(B * 0.25)), W = Math.max(1, Math.round(B * 0.1)), D = v(u) ?? R, [G, Y] = c.useState(D), i = v(g ? I ?? D : G) ?? v(u) ?? R, p = i, V = c.useRef(null);
  c.useEffect(() => {
    !s || y !== void 0 || m(i);
  }, [i, m, s, y]);
  const q = c.useCallback((o) => {
    const C = v(o);
    C && (g || Y(C), s && m(C), n?.(C));
  }, [g, n, m, s]);
  return /* @__PURE__ */ J(Q, { children: [
    /* @__PURE__ */ _(
      "button",
      {
        ref: e,
        type: H ?? "button",
        className: P,
        disabled: l,
        onClick: (o) => {
          T?.(o), !(o.defaultPrevented || l || !t) && V.current?.click();
        },
        onKeyDown: (o) => {
          K?.(o);
        },
        title: S,
        style: {
          width: A,
          height: A,
          borderRadius: U,
          borderStyle: "solid",
          borderWidth: 1,
          borderColor: a,
          borderTopColor: h.top ? a : p,
          borderRightColor: h.right ? a : p,
          borderBottomColor: h.bottom ? a : p,
          borderLeftColor: h.left ? a : p,
          boxSizing: "border-box",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: W,
          backgroundClip: "padding-box",
          background: i,
          cursor: l ? "not-allowed" : t ? "pointer" : "default",
          ...l ? { opacity: 0.5 } : null,
          ...O ?? {}
        },
        ...k
      }
    ),
    t ? /* @__PURE__ */ _(
      "input",
      {
        ref: V,
        type: "color",
        value: i,
        tabIndex: -1,
        "aria-hidden": "true",
        disabled: l,
        onChange: (o) => q(o.currentTarget.value),
        style: {
          position: "fixed",
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none"
        }
      }
    ) : null
  ] });
});
ao.displayName = "ColorPicker";
export {
  ao as C
};
//# sourceMappingURL=ColorPicker-MnwzfDC5.js.map
