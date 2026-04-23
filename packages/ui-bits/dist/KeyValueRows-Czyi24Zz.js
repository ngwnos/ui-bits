import { jsx as r, jsxs as A } from "react/jsx-runtime";
import C from "react";
import { u as N } from "./panelGap-DjV8XIAA.js";
const H = "#2f2f2f", E = "#f0f0f0", D = 1, I = 0.35, M = 1;
function z(s) {
  const t = s * (D + I * 2);
  return Math.round(t + M * 2);
}
const K = C.forwardRef((s, t) => {
  const {
    rows: n,
    emptyLabel: b = "No data",
    colorA: m,
    colorB: h,
    borderStyle: v,
    borderRadius: y,
    fontSize: _,
    rowHeight: p,
    className: f,
    style: w,
    ...R
  } = s, e = N(), i = m ?? e?.colorA ?? H, c = h ?? e?.colorB ?? E, o = v ?? e?.borderStyle ?? "a", a = _ ?? e?.fontSize ?? 12, x = o === "b" ? i : c, d = o === "b" ? c : i, u = o === "none" ? "transparent" : d, g = o === "none" ? "1px solid transparent" : `1px solid ${u}`, k = Math.max(0, y ?? 3), L = Math.max(1, Math.round(p ?? z(a))), S = Math.round(a * 0.7);
  return /* @__PURE__ */ r(
    "div",
    {
      ref: t,
      className: ["ui-bits-key-value-rows", f].filter(Boolean).join(" "),
      style: {
        fontFamily: "inherit",
        fontSize: a,
        lineHeight: 1,
        color: d,
        background: x,
        border: g,
        borderRadius: k,
        boxSizing: "border-box",
        "--ui-bits-key-value-rows-row-height": `${L}px`,
        "--ui-bits-key-value-rows-padding-x": `${S}px`,
        "--ui-bits-key-value-rows-border-color": u,
        ...w ?? {}
      },
      ...R,
      children: n.length > 0 ? n.map((l, B) => /* @__PURE__ */ A(
        "div",
        {
          className: "ui-bits-key-value-rows__row",
          children: [
            /* @__PURE__ */ r("span", { className: "ui-bits-key-value-rows__label", children: l.label }),
            /* @__PURE__ */ r("span", { className: "ui-bits-key-value-rows__value", children: l.value })
          ]
        },
        l.key ?? `${B}`
      )) : /* @__PURE__ */ r("div", { className: "ui-bits-key-value-rows__row ui-bits-key-value-rows__row--empty", children: b })
    }
  );
});
K.displayName = "KeyValueRows";
export {
  K
};
//# sourceMappingURL=KeyValueRows-Czyi24Zz.js.map
