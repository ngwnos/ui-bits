import { jsx as A } from "react/jsx-runtime";
import S from "react";
import { u as g } from "./panelGap-DjV8XIAA.js";
const x = "#2f2f2f", C = "#f0f0f0";
function L(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
const v = S.forwardRef((o, i) => {
  const {
    colorA: d,
    colorB: c,
    borderStyle: a,
    fontSize: f,
    padding: p,
    style: u,
    type: m,
    disabled: r,
    children: B,
    ...b
  } = o, e = g(), n = d ?? e?.colorA ?? x, s = c ?? e?.colorB ?? C, l = a ?? e?.borderStyle ?? "a", t = f ?? e?.fontSize ?? 12, y = l === "a" ? n : l === "b" ? s : "transparent", h = L(p) ?? `${Math.round(t * 0.35)}px ${Math.round(t * 0.7)}px`;
  return /* @__PURE__ */ A(
    "button",
    {
      ref: i,
      type: m ?? "button",
      disabled: r,
      style: {
        fontSize: t,
        fontFamily: "inherit",
        fontWeight: "inherit",
        lineHeight: 1,
        color: n,
        background: s,
        border: `1px solid ${y}`,
        borderRadius: 3,
        padding: h,
        textAlign: "center",
        cursor: r ? "not-allowed" : "pointer",
        userSelect: "none",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        ...r ? { opacity: 0.5 } : null,
        ...u ?? {}
      },
      ...b,
      children: B
    }
  );
});
v.displayName = "BasicButton";
export {
  v as B
};
//# sourceMappingURL=BasicButton-EcIYDsTq.js.map
