import { jsxs as B, jsx as i } from "react/jsx-runtime";
import t from "react";
import { A as Mt } from "./animationSuspension-BEQdvvQj.js";
import { a as Pt, P as Lt, V as Tt, d as $t } from "./panelGap-DjV8XIAA.js";
import { I as He } from "./IconButton-BvvMagK1.js";
import { D as kt } from "./Dial-C7q_hztm.js";
const Dt = "#2f2f2f", Ot = "#f0f0f0", It = 1, Et = 0.35, _t = 1, zt = 10, Vt = 0.5, At = "none";
function X(l) {
  if (l != null)
    return typeof l == "number" ? `${l}px` : l;
}
const y = (l, r, p) => Math.max(r, Math.min(p, l));
function Ft(l) {
  if (!l) return null;
  const r = l.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(r) ? r.split("").map((p) => p + p).join("") : /^[0-9a-fA-F]{6}$/.test(r) ? r : null;
}
function Wt(l, r, p = "255,255,255") {
  const T = Ft(l);
  if (!T) return `rgba(${p},${r})`;
  const R = parseInt(T, 16), j = R >> 16 & 255, G = R >> 8 & 255, _ = R & 255;
  return `rgba(${j}, ${G}, ${_}, ${r})`;
}
function Me(l) {
  const r = l * (It + Et * 2);
  return Math.round(r + _t * 2);
}
const Yt = t.forwardRef((l, r) => {
  const {
    header: p,
    headerControls: T,
    title: R,
    collapsible: j = !0,
    showDockButton: G = !0,
    dockOnMount: _ = !1,
    colorA: c = Dt,
    colorB: f = Ot,
    borderStyle: $ = "a",
    transparent: Pe = !1,
    bodyBlur: Le,
    bodyOpacity: C,
    defaultBodyOpacity: Te,
    onBodyOpacityChange: $e,
    showOpacityControl: U = !1,
    collapsed: ae,
    defaultCollapsed: ke = !1,
    keepMounted: de = !0,
    suspended: De,
    draggable: k = !1,
    position: S,
    onPositionChange: D,
    defaultPosition: O,
    constrainBodyToViewport: Oe = !0,
    onCollapseChange: Ie,
    width: Ee,
    padding: _e,
    paddingLeft: ze,
    paddingRight: Ve,
    paddingBottom: Ae,
    radius: Fe,
    shadow: We,
    fontSize: K = 12,
    verticalGap: Ye,
    style: Ne,
    className: Xe,
    children: je,
    ...Ge
  } = l, b = t.useRef(null), q = t.useRef(null), z = t.useRef(null), ce = t.useRef({ x: 0, y: 0 }), H = t.useRef(null), [Ue, ue] = t.useState(!1), [s, Ke] = t.useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }), [qe, pe] = t.useState(!1), [Je, fe] = t.useState(null), [Qe, M] = t.useState(() => O ? { x: O.x, y: O.y } : null), V = O?.x, A = O?.y, J = S?.x, Q = S?.y;
  t.useEffect(() => {
    if (J !== void 0 && Q !== void 0) {
      M({ x: J, y: Q });
      return;
    }
    if (V === void 0 || A === void 0) return;
    if (typeof window > "u") {
      M({ x: V, y: A });
      return;
    }
    const o = b.current?.getBoundingClientRect(), n = o ? Math.max(0, window.innerWidth - o.width) : window.innerWidth, d = Me(K ?? 12) + 6, E = Math.max(0, window.innerHeight - d);
    M({
      x: y(V, 0, n),
      y: y(A, 0, E)
    });
  }, [V, A, K, J, Q]);
  const h = K ?? 12, he = ae !== void 0, [Ze, et] = t.useState(ke), a = he ? ae : Ze, ge = _e ?? Math.round(h * 0.75), tt = ze ?? ge, ot = Ve ?? ge, nt = Ae ?? 0, ye = X(tt) ?? "0px", be = X(ot) ?? "0px", it = X(nt) ?? "0px", x = Fe ?? 3, rt = We ?? At, m = $ === "a" ? c : $ === "b" ? f : "transparent", w = $ === "none" ? 0 : 1, Z = Pt(Ye), lt = `${Z}px`, ee = Me(h), g = w, xe = C !== void 0, [st, me] = t.useState(() => y(C ?? Te ?? Vt, 0, 1));
  t.useEffect(() => {
    C !== void 0 && me(y(C, 0, 1));
  }, [C]);
  const te = y(
    xe ? C : st,
    0,
    1
  ), oe = Math.max(0, Le ?? zt), F = (Pe || U) && (!U || te < 1), ne = F ? te : 1, P = F ? oe : 0, at = Math.round(te * 100), dt = t.useCallback(
    (e) => String(Math.round(e) % 100).padStart(2, "0"),
    []
  ), ct = (e) => {
    const o = y(e / 100, 0, 1);
    xe || me(o), $e?.(o);
  }, ut = t.useMemo(() => ({
    colorA: c,
    colorB: f,
    fontSize: h,
    borderStyle: $,
    transparent: F,
    bodyBlur: oe
  }), [$, c, f, oe, h, F]), pt = !a || de, ft = !!(De || de && a), ht = t.useMemo(() => ({
    opacity: ne,
    blur: P
  }), [P, ne]), gt = a ? "collapsed" : "expanded", ie = [
    { value: "collapsed", ariaLabel: "Expand panel", title: "Expand panel" },
    { value: "expanded", ariaLabel: "Collapse panel", title: "Collapse panel" }
  ], yt = (e) => {
    const o = e === "collapsed";
    he || et(o), Ie?.(o);
  }, we = !!(k && G), re = t.useCallback(() => {
    const e = b.current;
    if (!e || typeof window > "u") return;
    const o = e.getBoundingClientRect(), n = 6, d = Math.max(0, window.innerWidth - o.width - n), E = Math.max(0, window.innerHeight - o.height - n), se = Math.max(0, Math.min(n, E)), N = { x: d, y: se };
    S && D ? D(N) : M(N);
  }, [D, S]);
  t.useLayoutEffect(() => {
    _ && (typeof window > "u" || re());
  }, [_, re]);
  const ve = U ? /* @__PURE__ */ i(
    kt,
    {
      min: 0,
      max: 100,
      step: 1,
      value: at,
      onChange: ct,
      borderStyle: "none",
      fontSize: h,
      ariaLabel: "Panel opacity",
      formatDisplayValue: dt,
      "data-floating-panel-ignore-drag": !0
    }
  ) : null, bt = p ?? /* @__PURE__ */ B("div", { style: { display: "flex", alignItems: "center", gap: 8, width: "100%" }, children: [
    /* @__PURE__ */ B("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      j && /* @__PURE__ */ i(
        He,
        {
          behavior: "cycle",
          value: gt,
          options: ie,
          onChange: (e) => yt(e),
          borderStyle: "none",
          fontSize: h,
          colorA: c,
          colorB: f,
          "aria-label": ie[a ? 0 : 1]?.ariaLabel,
          title: ie[a ? 0 : 1]?.title,
          children: a ? /* @__PURE__ */ B(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              width: "100%",
              height: "100%",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: [
                /* @__PURE__ */ i("path", { d: "M12 5v14" }),
                /* @__PURE__ */ i("path", { d: "M5 12h14" })
              ]
            }
          ) : /* @__PURE__ */ i(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              width: "100%",
              height: "100%",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: /* @__PURE__ */ i("path", { d: "M5 12h14" })
            }
          )
        }
      ),
      R ? /* @__PURE__ */ i("span", { children: R }) : null
    ] }),
    T || ve || we ? /* @__PURE__ */ B("div", { style: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }, children: [
      T,
      ve,
      we ? /* @__PURE__ */ i(
        He,
        {
          borderStyle: "none",
          fontSize: h,
          colorA: c,
          colorB: f,
          "aria-label": "Dock panel",
          title: "Dock panel",
          onClick: re,
          children: /* @__PURE__ */ B(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              width: "100%",
              height: "100%",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: [
                /* @__PURE__ */ i("path", { d: "M7 7h10v10" }),
                /* @__PURE__ */ i("path", { d: "M7 17 17 7" })
              ]
            }
          )
        }
      ) : null
    ] }) : null
  ] }), u = S ?? Qe, v = !!(k && u), I = Oe, xt = 6, Be = v && u ? u.y : Je, W = I && Be !== null && typeof window < "u" ? Math.max(0, window.innerHeight - Be - ee - xt) : void 0, Y = t.useCallback(() => {
    if (typeof window > "u") return;
    if (v && u) {
      fe(u.y);
      return;
    }
    const e = b.current;
    if (!e) return;
    const o = e.getBoundingClientRect();
    fe((n) => n !== null && Math.abs(n - o.top) < 0.5 ? n : o.top);
  }, [v, u]), L = t.useCallback(() => {
    const e = q.current;
    e && Ke((o) => {
      const n = { scrollTop: e.scrollTop, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight };
      return o.scrollTop === n.scrollTop && o.scrollHeight === n.scrollHeight && o.clientHeight === n.clientHeight ? o : n;
    });
  }, []), mt = t.useCallback(() => {
    L(), pe(!0), H.current && window.clearTimeout(H.current), H.current = window.setTimeout(() => {
      pe(!1), H.current = null;
    }, 650);
  }, [L]);
  t.useEffect(() => {
    L();
  }, [L, W, a]), t.useEffect(() => {
    const e = q.current;
    if (!e || typeof ResizeObserver > "u") return;
    const o = new ResizeObserver(() => L());
    return o.observe(e), () => o.disconnect();
  }, [L]), t.useLayoutEffect(() => {
    I && Y();
  }, [I, Y]), t.useEffect(() => {
    if (!I || typeof window > "u") return;
    const e = () => Y();
    window.addEventListener("resize", e), window.addEventListener("scroll", e, !0);
    const o = b.current, n = o && typeof ResizeObserver < "u" ? new ResizeObserver(e) : null;
    return n?.observe(o), () => {
      window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0), n?.disconnect();
    };
  }, [I, Y]), t.useEffect(() => () => {
    H.current && window.clearTimeout(H.current);
  }, []);
  const le = s.scrollHeight - s.clientHeight > 1, Re = le ? Math.max(12, Math.round(s.clientHeight * (s.clientHeight / s.scrollHeight))) : 0, wt = Math.max(0, s.clientHeight - Re), vt = le && s.scrollHeight > s.clientHeight ? Math.round(s.scrollTop / (s.scrollHeight - s.clientHeight) * wt) : 0, Bt = (e) => {
    b.current = e, r && (typeof r == "function" ? r(e) : r.current = e);
  }, Rt = (e) => {
    if (!k || e.button !== 0 || e.target?.closest("button, [data-floating-panel-ignore-drag], input, select, textarea, a"))
      return;
    const n = b.current;
    if (!n) return;
    const d = n.getBoundingClientRect();
    u || M({ x: d.left, y: d.top }), ce.current = {
      x: e.clientX - d.left,
      y: e.clientY - d.top
    }, z.current = e.pointerId, ue(!0), e.currentTarget.setPointerCapture(e.pointerId);
  }, Ct = (e) => {
    if (!k || z.current !== e.pointerId || typeof window > "u") return;
    const n = b.current?.getBoundingClientRect(), d = ce.current, E = n?.width ?? 0, se = Math.max(0, window.innerWidth - E), N = Math.max(0, window.innerHeight - ee - 6), St = y(e.clientX - d.x, 0, se), Ht = y(e.clientY - d.y, 0, N), Se = { x: St, y: Ht };
    S && D ? D(Se) : M(Se);
  }, Ce = (e) => {
    if (z.current === e.pointerId) {
      z.current = null, ue(!1);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
  };
  return /* @__PURE__ */ i(Lt.Provider, { value: ut, children: /* @__PURE__ */ B(
    "div",
    {
      ref: Bt,
      className: Xe,
      style: {
        width: X(Ee),
        borderRadius: x,
        border: "none",
        background: "transparent",
        color: c,
        boxShadow: rt,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: h,
        fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
        lineHeight: 1.3,
        position: v ? "fixed" : void 0,
        left: v ? `${u.x}px` : void 0,
        top: v ? `${u.y}px` : void 0,
        zIndex: v ? 20 : void 0,
        "--ui-bits-color-a": c,
        "--ui-bits-color-b": f,
        ...Ne ?? {}
      },
      ...Ge,
      children: [
        /* @__PURE__ */ i(
          "div",
          {
            style: {
              minHeight: ee,
              display: "flex",
              alignItems: "center",
              padding: `0 ${be} 0 ${ye}`,
              borderTop: g ? `${g}px solid ${m}` : "none",
              borderLeft: g ? `${g}px solid ${m}` : "none",
              borderRight: g ? `${g}px solid ${m}` : "none",
              borderBottom: g ? `${g}px solid ${m}` : "none",
              borderTopLeftRadius: x,
              borderTopRightRadius: x,
              borderBottomLeftRadius: a ? x : 0,
              borderBottomRightRadius: a ? x : 0,
              boxSizing: "border-box",
              fontWeight: 600,
              lineHeight: 1,
              background: f,
              color: c,
              cursor: k ? Ue ? "grabbing" : "grab" : "default",
              userSelect: "none",
              touchAction: "none",
              position: "relative"
            },
            onPointerDown: Rt,
            onPointerMove: Ct,
            onPointerUp: Ce,
            onPointerCancel: Ce,
            children: bt
          }
        ),
        pt && /* @__PURE__ */ B(
          "div",
          {
            className: "ui-bits-floating-panel__body-wrap",
            style: {
              borderLeft: w ? `${w}px solid ${m}` : "none",
              borderRight: w ? `${w}px solid ${m}` : "none",
              borderBottom: w ? `${w}px solid ${m}` : "none",
              borderBottomLeftRadius: x,
              borderBottomRightRadius: x,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              overflow: "hidden",
              display: a ? "none" : "block",
              boxSizing: "border-box",
              position: "relative"
            },
            "aria-hidden": a,
            children: [
              /* @__PURE__ */ i(
                "div",
                {
                  ref: q,
                  onScroll: mt,
                  style: {
                    overflowY: W !== void 0 ? "auto" : void 0,
                    maxHeight: W !== void 0 ? `${W}px` : void 0,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  },
                  className: "ui-bits-floating-panel__body",
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        padding: `${lt} ${be} ${it} ${ye}`,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        background: Wt(f, ne),
                        backdropFilter: P > 0 ? `blur(${P}px)` : "none",
                        WebkitBackdropFilter: P > 0 ? `blur(${P}px)` : "none"
                      },
                      children: /* @__PURE__ */ i(Tt.Provider, { value: Z, children: /* @__PURE__ */ i($t.Provider, { value: ht, children: /* @__PURE__ */ i(Mt, { suspended: ft, children: /* @__PURE__ */ i("div", { style: { position: "relative", display: "flex", flexDirection: "column", gap: Z }, children: je }) }) }) })
                    }
                  )
                }
              ),
              le && /* @__PURE__ */ i(
                "div",
                {
                  className: "ui-bits-floating-panel__scrollbar",
                  "aria-hidden": "true",
                  style: {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 6,
                    pointerEvents: "none",
                    opacity: qe ? 1 : void 0,
                    transition: "opacity 160ms ease"
                  },
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        width: "100%",
                        height: Re,
                        borderRadius: 999,
                        background: c,
                        transform: `translateY(${vt}px)`
                      }
                    }
                  )
                }
              )
            ]
          }
        )
      ]
    }
  ) });
});
Yt.displayName = "FloatingPanel";
export {
  Yt as F
};
//# sourceMappingURL=FloatingPanel-DKAdzTas.js.map
