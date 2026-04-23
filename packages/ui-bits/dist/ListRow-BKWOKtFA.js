import { jsx as y } from "react/jsx-runtime";
import a from "react";
const p = a.forwardRef((d, c) => {
  const {
    active: i = !1,
    disabled: o = !1,
    onSelect: l,
    selectable: t = !0,
    className: u,
    tabIndex: r,
    role: f,
    onClick: s,
    onKeyDown: n,
    ...b
  } = d, w = t ? r ?? (o ? -1 : 0) : r, m = f ?? (t ? "listitem" : void 0), k = a.useCallback((e) => {
    s?.(e), !(e.defaultPrevented || o || !t) && l?.();
  }, [o, s, l, t]), v = a.useCallback((e) => {
    n?.(e), !(e.defaultPrevented || o || !t || !l) && (e.key !== "Enter" && e.key !== " " || (e.preventDefault(), l()));
  }, [o, n, l, t]);
  return /* @__PURE__ */ y(
    "div",
    {
      ref: c,
      className: [
        "ui-bits-list-row",
        t ? "ui-bits-list-row--selectable" : "",
        i ? "ui-bits-list-row--active" : "",
        u
      ].filter(Boolean).join(" "),
      role: m,
      tabIndex: w,
      "aria-disabled": o || void 0,
      "aria-current": i ? "true" : void 0,
      onClick: k,
      onKeyDown: v,
      ...b
    }
  );
});
p.displayName = "ListRow";
export {
  p as L
};
//# sourceMappingURL=ListRow-BKWOKtFA.js.map
