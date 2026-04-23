import { jsx as A } from "react/jsx-runtime";
import B from "react";
import { u as C } from "./panelGap-DjV8XIAA.js";
const g = "#2f2f2f", S = "#f0f0f0";
function h(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
const z = B.forwardRef((o, l) => {
  const {
    colorA: d,
    colorB: a,
    borderStyle: i = "a",
    fontSize: c,
    padding: p,
    className: u,
    style: f,
    type: b,
    disabled: s,
    ...x
  } = o, t = C(), e = d ?? t?.colorA ?? g, r = a ?? t?.colorB ?? S, n = c ?? t?.fontSize ?? 12, m = i === "a" ? e : i === "b" ? r : "transparent", y = h(p) ?? `${Math.round(n * 0.35)}px ${Math.round(n * 0.7)}px`;
  return /* @__PURE__ */ A(
    "input",
    {
      ref: l,
      type: b ?? "text",
      disabled: s,
      className: ["ui-bits-text-input", u].filter(Boolean).join(" "),
      style: {
        fontSize: n,
        fontFamily: "inherit",
        lineHeight: 1,
        color: e,
        background: r,
        border: `1px solid ${m}`,
        borderRadius: 3,
        padding: y,
        outline: "none",
        boxSizing: "border-box",
        caretColor: e,
        "--ui-bits-text-input-selection-bg": e,
        "--ui-bits-text-input-selection-color": r,
        ...s ? { opacity: 0.5, cursor: "not-allowed" } : null,
        ...f ?? {}
      },
      ...x
    }
  );
});
z.displayName = "TextInput";
export {
  z as T
};
//# sourceMappingURL=TextInput-DYCLlEXP.js.map
