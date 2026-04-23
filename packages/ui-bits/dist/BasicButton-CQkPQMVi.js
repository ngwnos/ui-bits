import { jsx as b } from "react/jsx-runtime";
import m from "react";
const B = "#2f2f2f", y = "#f0f0f0";
function g(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
const h = m.forwardRef((o, s) => {
  const {
    colorA: e = B,
    colorB: n = y,
    borderStyle: i = "a",
    fontSize: r = 12,
    padding: d,
    style: a,
    type: l,
    disabled: t,
    children: c,
    ...f
  } = o, p = i === "a" ? e : i === "b" ? n : "transparent", u = g(d) ?? `${Math.round(r * 0.35)}px ${Math.round(r * 0.7)}px`;
  return /* @__PURE__ */ b(
    "button",
    {
      ref: s,
      type: l ?? "button",
      disabled: t,
      style: {
        fontSize: r,
        fontFamily: "inherit",
        fontWeight: "inherit",
        lineHeight: 1,
        color: e,
        background: n,
        border: `1px solid ${p}`,
        borderRadius: 3,
        padding: u,
        textAlign: "center",
        cursor: t ? "not-allowed" : "pointer",
        userSelect: "none",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        ...t ? { opacity: 0.5 } : null,
        ...a ?? {}
      },
      ...f,
      children: c
    }
  );
});
h.displayName = "BasicButton";
export {
  h as B
};
//# sourceMappingURL=BasicButton-CQkPQMVi.js.map
