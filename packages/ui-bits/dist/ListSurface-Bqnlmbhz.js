import { jsx as m, jsxs as w } from "react/jsx-runtime";
import t from "react";
const C = 12, j = 650;
function D(r = {}) {
  const {
    minThumbHeight: n = C,
    scrollingResetDelayMs: d = j
  } = r, h = t.useRef(null), [e, u] = t.useState(() => ({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0
  })), [S, a] = t.useState(!1), c = t.useRef(null), l = t.useCallback(() => {
    const s = h.current;
    if (!s) return;
    const i = {
      scrollTop: s.scrollTop,
      scrollHeight: s.scrollHeight,
      clientHeight: s.clientHeight
    };
    u((o) => o.scrollTop === i.scrollTop && o.scrollHeight === i.scrollHeight && o.clientHeight === i.clientHeight ? o : i);
  }, []), g = t.useCallback(() => {
    l(), a(!0), c.current && clearTimeout(c.current), c.current = setTimeout(() => {
      a(!1), c.current = null;
    }, d);
  }, [d, l]);
  t.useLayoutEffect(() => {
    l();
  }), t.useEffect(() => {
    const s = h.current;
    if (!s || typeof ResizeObserver > "u") return;
    const i = new ResizeObserver(() => l());
    return i.observe(s), () => i.disconnect();
  }, [l]), t.useEffect(() => (() => {
    c.current && clearTimeout(c.current);
  }), []);
  const f = e.scrollHeight - e.clientHeight > 1, b = f ? Math.max(
    n,
    Math.round(e.clientHeight * (e.clientHeight / e.scrollHeight))
  ) : 0, T = Math.max(0, e.clientHeight - b), p = f && e.scrollHeight > e.clientHeight ? Math.round(e.scrollTop / (e.scrollHeight - e.clientHeight) * T) : 0;
  return {
    listRef: h,
    handleScroll: g,
    updateScrollMetrics: l,
    scrollMetrics: e,
    isScrolling: S,
    hasOverflow: f,
    thumbHeight: b,
    thumbTop: p
  };
}
function O(r, n) {
  if (r) {
    if (typeof r == "function") {
      r(n);
      return;
    }
    r.current = n;
  }
}
const k = t.forwardRef((r, n) => {
  const {
    children: d,
    isEmpty: h = !1,
    emptyState: e = null,
    columns: u,
    listClassName: S,
    listStyle: a,
    listRole: c = "list",
    onListScroll: l,
    listRef: g,
    minThumbHeight: f,
    scrollingResetDelayMs: b,
    showScrollbar: T = !0,
    className: p,
    style: s,
    ...i
  } = r, {
    listRef: o,
    handleScroll: R,
    hasOverflow: L,
    thumbHeight: M,
    thumbTop: y,
    isScrolling: v
  } = D({
    minThumbHeight: f,
    scrollingResetDelayMs: b
  }), N = t.useCallback((H) => {
    o.current = H, O(g, H);
  }, [g, o]), x = t.useCallback((H) => {
    l?.(H), R();
  }, [R, l]), _ = Number.isFinite(u) && u && u > 0 ? Math.floor(u) : void 0, E = t.useMemo(() => _ === void 0 ? a : {
    "--ui-bits-list-columns": _,
    ...a ?? {}
  }, [a, _]);
  return /* @__PURE__ */ m(
    "div",
    {
      ref: n,
      className: ["ui-bits-list-surface", p].filter(Boolean).join(" "),
      style: s,
      ...i,
      children: /* @__PURE__ */ w(
        "div",
        {
          className: [
            "ui-bits-list-surface__wrap",
            v ? "ui-bits-list-surface__wrap--scrolling" : ""
          ].filter(Boolean).join(" "),
          children: [
            /* @__PURE__ */ m(
              "div",
              {
                ref: N,
                className: ["ui-bits-list-surface__list", S].filter(Boolean).join(" "),
                style: E,
                role: c,
                onScroll: x,
                children: h ? /* @__PURE__ */ m("div", { className: "ui-bits-list-surface__empty", children: e }) : d
              }
            ),
            T && L ? /* @__PURE__ */ m("div", { className: "ui-bits-list-surface__scrollbar", "aria-hidden": "true", children: /* @__PURE__ */ m(
              "div",
              {
                className: "ui-bits-list-surface__scrollbar-thumb",
                style: { height: `${M}px`, transform: `translateY(${y}px)` }
              }
            ) }) : null
          ]
        }
      )
    }
  );
});
k.displayName = "ListSurface";
export {
  k as L,
  D as u
};
//# sourceMappingURL=ListSurface-Bqnlmbhz.js.map
