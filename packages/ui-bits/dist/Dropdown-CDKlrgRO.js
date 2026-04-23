import { jsx as o, jsxs as W } from "react/jsx-runtime";
import "react";
import { D as $ } from "./DropdownBase-CL4zqt6B.js";
import { b as q } from "./hooks-KNH81MTH.js";
function G({
  label: r,
  labelInline: n,
  overlayMenu: a = !0,
  options: d,
  value: t,
  defaultValue: s,
  placeholder: i = "Select an option",
  onChange: l,
  open: p,
  defaultOpen: c = !1,
  onOpenChange: u,
  colorA: h,
  colorB: m,
  borderStyle: f,
  borderMask: w,
  borderRadius: b,
  width: g,
  fontSize: x,
  compact: k,
  disabled: D = !1,
  controlId: v,
  className: C,
  style: L
}) {
  const j = q(v, r);
  return /* @__PURE__ */ o(
    $,
    {
      label: r,
      labelInline: n,
      overlayMenu: a,
      options: d,
      value: t,
      defaultValue: s,
      placeholder: i,
      onChange: l,
      open: p,
      defaultOpen: c,
      onOpenChange: u,
      colorA: h,
      colorB: m,
      borderStyle: f,
      borderMask: w,
      borderRadius: b,
      width: g,
      fontSize: x,
      compact: k,
      disabled: D,
      controlId: j,
      className: C,
      style: L,
      renderTrigger: ({
        id: y,
        open: e,
        disabled: I,
        buttonRef: N,
        displayLabel: B,
        showPlaceholder: K,
        onTriggerClick: M,
        onTriggerKeyDown: R,
        ariaLabelledBy: S,
        ariaControls: T
      }) => /* @__PURE__ */ W(
        "button",
        {
          ref: N,
          id: y,
          type: "button",
          className: "dropdown-trigger",
          "aria-haspopup": "listbox",
          "aria-expanded": e,
          "aria-labelledby": S,
          "aria-controls": T,
          onClick: M,
          onKeyDown: R,
          disabled: I,
          "data-open": e ? "true" : "false",
          children: [
            /* @__PURE__ */ o("span", { className: `dropdown-value${K ? " dropdown-placeholder" : ""}`, children: B }),
            /* @__PURE__ */ o("span", { className: "dropdown-caret", "aria-hidden": "true", children: /* @__PURE__ */ o("svg", { width: "12", height: "12", viewBox: "0 0 12 12", fill: "none", children: /* @__PURE__ */ o(
              "path",
              {
                d: "M3 4.5L6 7.5L9 4.5",
                stroke: "currentColor",
                strokeWidth: "1.2",
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            ) }) })
          ]
        }
      )
    }
  );
}
export {
  G as D
};
//# sourceMappingURL=Dropdown-CDKlrgRO.js.map
