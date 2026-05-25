import { jsxs as L, jsx as i } from "react/jsx-runtime";
import o from "react";
import { A as $t } from "./animationSuspension-BEQdvvQj.js";
import { a as Ot, P as Dt, V as Et, d as It } from "./panelGap-DjV8XIAA.js";
import { I as Le } from "./IconButton-BvvMagK1.js";
import { D as zt } from "./Dial-C7q_hztm.js";
const Vt = "#2f2f2f", _t = "#f0f0f0", At = 1, Nt = 0.35, Ft = 1, Wt = 10, Yt = 0.5, Xt = "none";
function K(a) {
  if (a != null)
    return typeof a == "number" ? `${a}px` : a;
}
const f = (a, l, b) => Math.max(l, Math.min(b, a));
function jt(a) {
  if (!a) return null;
  const l = a.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(l) ? l.split("").map((b) => b + b).join("") : /^[0-9a-fA-F]{6}$/.test(l) ? l : null;
}
function Gt(a, l, b = "255,255,255") {
  const I = jt(a);
  if (!I) return `rgba(${b},${l})`;
  const T = parseInt(I, 16), q = T >> 16 & 255, J = T >> 8 & 255, A = T & 255;
  return `rgba(${q}, ${J}, ${A}, ${l})`;
}
function Te(a) {
  const l = a * (At + Nt * 2);
  return Math.round(l + Ft * 2);
}
const Ut = o.forwardRef((a, l) => {
  const {
    header: b,
    headerControls: I,
    title: T,
    collapsible: q = !0,
    showDockButton: J = !0,
    dockOnMount: A = !1,
    colorA: g = Vt,
    colorB: v = _t,
    borderStyle: z = "a",
    transparent: ke = !1,
    bodyBlur: $e,
    bodyOpacity: k,
    defaultBodyOpacity: Oe,
    onBodyOpacityChange: De,
    showOpacityControl: Q = !1,
    collapsed: de,
    defaultCollapsed: Ee = !1,
    keepMounted: ce = !0,
    suspended: Ie,
    draggable: w = !1,
    position: x,
    onPositionChange: y,
    defaultPosition: V,
    constrainBodyToViewport: ze = !0,
    viewportMargin: Ve,
    onCollapseChange: _e,
    width: Ae,
    padding: Ne,
    paddingLeft: Fe,
    paddingRight: We,
    paddingBottom: Ye,
    radius: Xe,
    shadow: je,
    fontSize: Z = 12,
    verticalGap: Ge,
    style: Ue,
    className: Ke,
    children: qe,
    ...Je
  } = a, m = o.useRef(null), N = o.useRef(null), F = o.useRef(null), ue = o.useRef({ x: 0, y: 0 }), $ = o.useRef(null), [Qe, pe] = o.useState(!1), [c, Ze] = o.useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }), [et, he] = o.useState(!1), [tt, fe] = o.useState(null), [ot, B] = o.useState(() => V ? { x: V.x, y: V.y } : null), O = Math.max(0, Ve ?? 6), W = V?.x, Y = V?.y, ee = x?.x, te = x?.y;
  o.useEffect(() => {
    if (ee !== void 0 && te !== void 0) {
      B({ x: ee, y: te });
      return;
    }
    if (W === void 0 || Y === void 0) return;
    if (typeof window > "u") {
      B({ x: W, y: Y });
      return;
    }
    const t = m.current?.getBoundingClientRect(), n = t ? Math.max(0, window.innerWidth - t.width) : window.innerWidth, d = Te(Z ?? 12) + O, h = Math.max(0, window.innerHeight - d);
    B({
      x: f(W, 0, n),
      y: f(Y, 0, h)
    });
  }, [W, Y, Z, ee, te, O]);
  const C = Z ?? 12, ge = de !== void 0, [nt, it] = o.useState(Ee), u = ge ? de : nt, we = Ne ?? Math.round(C * 0.75), rt = Fe ?? we, st = We ?? we, lt = Ye ?? 0, xe = K(rt) ?? "0px", ye = K(st) ?? "0px", at = K(lt) ?? "0px", M = Xe ?? 3, dt = je ?? Xt, H = z === "a" ? g : z === "b" ? v : "transparent", P = z === "none" ? 0 : 1, oe = Ot(Ge), ct = `${oe}px`, p = Te(C), [ut, me] = o.useState(p), R = P, be = k !== void 0, [pt, ve] = o.useState(() => f(k ?? Oe ?? Yt, 0, 1));
  o.useEffect(() => {
    k !== void 0 && ve(f(k, 0, 1));
  }, [k]);
  const ne = f(
    be ? k : pt,
    0,
    1
  ), ie = Math.max(0, $e ?? Wt), X = (ke || Q) && (!Q || ne < 1), re = X ? ne : 1, D = X ? ie : 0, ht = Math.round(ne * 100), ft = o.useCallback(
    (e) => String(Math.round(e) % 100).padStart(2, "0"),
    []
  ), gt = (e) => {
    const t = f(e / 100, 0, 1);
    be || ve(t), De?.(t);
  }, wt = o.useMemo(() => ({
    colorA: g,
    colorB: v,
    fontSize: C,
    borderStyle: z,
    transparent: X,
    bodyBlur: ie
  }), [z, g, v, ie, C, X]), xt = !u || ce, yt = !!(Ie || ce && u), mt = o.useMemo(() => ({
    opacity: re,
    blur: D
  }), [D, re]), bt = u ? "collapsed" : "expanded", se = [
    { value: "collapsed", ariaLabel: "Expand panel", title: "Expand panel" },
    { value: "expanded", ariaLabel: "Collapse panel", title: "Collapse panel" }
  ], vt = (e) => {
    const t = e === "collapsed";
    ge || it(t), _e?.(t);
  }, Ce = !!(w && J), le = o.useCallback(() => {
    const e = m.current;
    if (!e || typeof window > "u") return;
    const t = e.getBoundingClientRect(), n = 6, d = Math.max(0, window.innerWidth - t.width - n), h = Math.max(0, window.innerHeight - t.height - n), r = Math.max(0, Math.min(n, h)), U = { x: d, y: r };
    x && y ? y(U) : B(U);
  }, [y, x]);
  o.useLayoutEffect(() => {
    A && (typeof window > "u" || le());
  }, [A, le]);
  const Re = Q ? /* @__PURE__ */ i(
    zt,
    {
      min: 0,
      max: 100,
      step: 1,
      value: ht,
      onChange: gt,
      borderStyle: "none",
      fontSize: C,
      ariaLabel: "Panel opacity",
      formatDisplayValue: ft,
      "data-floating-panel-ignore-drag": !0
    }
  ) : null, Ct = b ?? /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8, width: "100%" }, children: [
    /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      q && /* @__PURE__ */ i(
        Le,
        {
          behavior: "cycle",
          value: bt,
          options: se,
          onChange: (e) => vt(e),
          borderStyle: "none",
          fontSize: C,
          colorA: g,
          colorB: v,
          "aria-label": se[u ? 0 : 1]?.ariaLabel,
          title: se[u ? 0 : 1]?.title,
          children: u ? /* @__PURE__ */ L(
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
      T ? /* @__PURE__ */ i("span", { children: T }) : null
    ] }),
    I || Re || Ce ? /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }, children: [
      I,
      Re,
      Ce ? /* @__PURE__ */ i(
        Le,
        {
          borderStyle: "none",
          fontSize: C,
          colorA: g,
          colorB: v,
          "aria-label": "Dock panel",
          title: "Dock panel",
          onClick: le,
          children: /* @__PURE__ */ L(
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
  ] }), s = x ?? ot, S = !!(w && s), _ = ze, Be = S && s ? s.y : tt, Rt = Math.max(p, ut), j = _ && Be !== null && typeof window < "u" ? Math.max(0, window.innerHeight - Be - Rt - O) : void 0, G = o.useCallback(() => {
    if (typeof window > "u") return;
    const e = m.current, t = e?.getBoundingClientRect();
    S && s ? fe(s.y) : t && fe((r) => r !== null && Math.abs(r - t.top) < 0.5 ? r : t.top);
    const n = N.current;
    if (!e || !n || !t) {
      me((r) => Math.abs(r - p) < 0.5 ? r : p);
      return;
    }
    const d = n.getBoundingClientRect(), h = Math.max(p, t.height - d.height);
    me((r) => Math.abs(r - h) < 0.5 ? r : h);
  }, [p, S, s]), Me = o.useCallback(() => {
    if (!w || !s || typeof window > "u" || x && !y) return;
    const n = m.current?.getBoundingClientRect()?.width ?? 0, d = Math.max(0, window.innerWidth - n), h = Math.max(0, window.innerHeight - p - O), r = {
      x: f(s.x, 0, d),
      y: f(s.y, 0, h)
    };
    Math.abs(r.x - s.x) < 0.5 && Math.abs(r.y - s.y) < 0.5 || (x && y ? y(r) : B(r));
  }, [w, p, y, x, s, O]), E = o.useCallback(() => {
    const e = N.current;
    e && Ze((t) => {
      const n = { scrollTop: e.scrollTop, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight };
      return t.scrollTop === n.scrollTop && t.scrollHeight === n.scrollHeight && t.clientHeight === n.clientHeight ? t : n;
    });
  }, []), Bt = o.useCallback(() => {
    E(), he(!0), $.current && window.clearTimeout($.current), $.current = window.setTimeout(() => {
      he(!1), $.current = null;
    }, 650);
  }, [E]);
  o.useEffect(() => {
    E();
  }, [E, j, u]), o.useEffect(() => {
    const e = N.current;
    if (!e || typeof ResizeObserver > "u") return;
    const t = new ResizeObserver(() => E());
    return t.observe(e), () => t.disconnect();
  }, [E]), o.useLayoutEffect(() => {
    _ && G();
  }, [_, G]), o.useEffect(() => {
    if (!_ || typeof window > "u") return;
    const e = () => G();
    window.addEventListener("resize", e), window.addEventListener("scroll", e, !0);
    const t = m.current, n = t && typeof ResizeObserver < "u" ? new ResizeObserver(e) : null;
    return n?.observe(t), () => {
      window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0), n?.disconnect();
    };
  }, [_, G]), o.useEffect(() => {
    if (!w || !s || typeof window > "u") return;
    const e = () => Me();
    window.addEventListener("resize", e);
    const t = m.current, n = t && typeof ResizeObserver < "u" ? new ResizeObserver(e) : null;
    return n?.observe(t), () => {
      window.removeEventListener("resize", e), n?.disconnect();
    };
  }, [Me, w, s]), o.useEffect(() => () => {
    $.current && window.clearTimeout($.current);
  }, []);
  const ae = c.scrollHeight - c.clientHeight > 1, He = ae ? Math.max(12, Math.round(c.clientHeight * (c.clientHeight / c.scrollHeight))) : 0, Mt = Math.max(0, c.clientHeight - He), Ht = ae && c.scrollHeight > c.clientHeight ? Math.round(c.scrollTop / (c.scrollHeight - c.clientHeight) * Mt) : 0, Pt = (e) => {
    m.current = e, l && (typeof l == "function" ? l(e) : l.current = e);
  }, St = (e) => {
    if (!w || e.button !== 0 || e.target?.closest("button, [data-floating-panel-ignore-drag], input, select, textarea, a"))
      return;
    const n = m.current;
    if (!n) return;
    const d = n.getBoundingClientRect();
    s || B({ x: d.left, y: d.top }), ue.current = {
      x: e.clientX - d.left,
      y: e.clientY - d.top
    }, F.current = e.pointerId, pe(!0), e.currentTarget.setPointerCapture(e.pointerId);
  }, Lt = (e) => {
    if (!w || F.current !== e.pointerId || typeof window > "u") return;
    const n = m.current?.getBoundingClientRect(), d = ue.current, h = n?.width ?? 0, r = Math.max(0, window.innerWidth - h), U = Math.max(0, window.innerHeight - p - O), Tt = f(e.clientX - d.x, 0, r), kt = f(e.clientY - d.y, 0, U), Se = { x: Tt, y: kt };
    x && y ? y(Se) : B(Se);
  }, Pe = (e) => {
    if (F.current === e.pointerId) {
      F.current = null, pe(!1);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
  };
  return /* @__PURE__ */ i(Dt.Provider, { value: wt, children: /* @__PURE__ */ L(
    "div",
    {
      ref: Pt,
      className: Ke,
      style: {
        width: K(Ae),
        borderRadius: M,
        border: "none",
        background: "transparent",
        color: g,
        boxShadow: dt,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: C,
        fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
        lineHeight: 1.3,
        position: S ? "fixed" : void 0,
        left: S ? `${s.x}px` : void 0,
        top: S ? `${s.y}px` : void 0,
        zIndex: S ? 20 : void 0,
        "--ui-bits-color-a": g,
        "--ui-bits-color-b": v,
        ...Ue ?? {}
      },
      ...Je,
      children: [
        /* @__PURE__ */ i(
          "div",
          {
            style: {
              minHeight: p,
              display: "flex",
              alignItems: "center",
              padding: `0 ${ye} 0 ${xe}`,
              borderTop: R ? `${R}px solid ${H}` : "none",
              borderLeft: R ? `${R}px solid ${H}` : "none",
              borderRight: R ? `${R}px solid ${H}` : "none",
              borderBottom: R ? `${R}px solid ${H}` : "none",
              borderTopLeftRadius: M,
              borderTopRightRadius: M,
              borderBottomLeftRadius: u ? M : 0,
              borderBottomRightRadius: u ? M : 0,
              boxSizing: "border-box",
              fontWeight: 600,
              lineHeight: 1,
              background: v,
              color: g,
              cursor: w ? Qe ? "grabbing" : "grab" : "default",
              userSelect: "none",
              touchAction: "none",
              position: "relative"
            },
            onPointerDown: St,
            onPointerMove: Lt,
            onPointerUp: Pe,
            onPointerCancel: Pe,
            children: Ct
          }
        ),
        xt && /* @__PURE__ */ L(
          "div",
          {
            className: "ui-bits-floating-panel__body-wrap",
            style: {
              borderLeft: P ? `${P}px solid ${H}` : "none",
              borderRight: P ? `${P}px solid ${H}` : "none",
              borderBottom: P ? `${P}px solid ${H}` : "none",
              borderBottomLeftRadius: M,
              borderBottomRightRadius: M,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              overflow: "hidden",
              display: u ? "none" : "block",
              boxSizing: "border-box",
              position: "relative"
            },
            "aria-hidden": u,
            children: [
              /* @__PURE__ */ i(
                "div",
                {
                  ref: N,
                  onScroll: Bt,
                  style: {
                    overflowY: j !== void 0 ? "auto" : void 0,
                    maxHeight: j !== void 0 ? `${j}px` : void 0,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  },
                  className: "ui-bits-floating-panel__body",
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        padding: `${ct} ${ye} ${at} ${xe}`,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        background: Gt(v, re),
                        backdropFilter: D > 0 ? `blur(${D}px)` : "none",
                        WebkitBackdropFilter: D > 0 ? `blur(${D}px)` : "none"
                      },
                      children: /* @__PURE__ */ i(Et.Provider, { value: oe, children: /* @__PURE__ */ i(It.Provider, { value: mt, children: /* @__PURE__ */ i($t, { suspended: yt, children: /* @__PURE__ */ i("div", { style: { position: "relative", display: "flex", flexDirection: "column", gap: oe }, children: qe }) }) }) })
                    }
                  )
                }
              ),
              ae && /* @__PURE__ */ i(
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
                    opacity: et ? 1 : void 0,
                    transition: "opacity 160ms ease"
                  },
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        width: "100%",
                        height: He,
                        borderRadius: 999,
                        background: g,
                        transform: `translateY(${Ht}px)`
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
Ut.displayName = "FloatingPanel";
export {
  Ut as F
};
//# sourceMappingURL=FloatingPanel-EMOgiXlc.js.map
