import { jsxs as L, jsx as i } from "react/jsx-runtime";
import n from "react";
import { A as Lt } from "./animationSuspension-BEQdvvQj.js";
import { a as St, P as Tt, V as kt, d as $t } from "./panelGap-DjV8XIAA.js";
import { I as He } from "./IconButton-BvvMagK1.js";
import { D as Ot } from "./Dial-cra7Boek.js";
const Dt = "#2f2f2f", Et = "#f0f0f0", It = 1, zt = 0.35, Vt = 1, _t = 10, At = 0.5, Nt = "none";
function G(l) {
  if (l != null)
    return typeof l == "number" ? `${l}px` : l;
}
const u = (l, s, y) => Math.max(s, Math.min(y, l));
function Ft(l) {
  if (!l) return null;
  const s = l.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(s) ? s.split("").map((y) => y + y).join("") : /^[0-9a-fA-F]{6}$/.test(s) ? s : null;
}
function Wt(l, s, y = "255,255,255") {
  const D = Ft(l);
  if (!D) return `rgba(${y},${s})`;
  const S = parseInt(D, 16), U = S >> 16 & 255, K = S >> 8 & 255, _ = S & 255;
  return `rgba(${U}, ${K}, ${_}, ${s})`;
}
function Le(l) {
  const s = l * (It + zt * 2);
  return Math.round(s + Vt * 2);
}
const Yt = n.forwardRef((l, s) => {
  const {
    header: y,
    headerControls: D,
    title: S,
    collapsible: U = !0,
    showDockButton: K = !0,
    dockOnMount: _ = !1,
    colorA: p = Dt,
    colorB: x = Et,
    borderStyle: E = "a",
    transparent: Se = !1,
    bodyBlur: Te,
    bodyOpacity: T,
    defaultBodyOpacity: ke,
    onBodyOpacityChange: $e,
    showOpacityControl: q = !1,
    collapsed: ae,
    defaultCollapsed: Oe = !1,
    keepMounted: de = !0,
    suspended: De,
    draggable: f = !1,
    position: h,
    onPositionChange: g,
    defaultPosition: I,
    constrainBodyToViewport: Ee = !0,
    onCollapseChange: Ie,
    width: ze,
    padding: Ve,
    paddingLeft: _e,
    paddingRight: Ae,
    paddingBottom: Ne,
    radius: Fe,
    shadow: We,
    fontSize: J = 12,
    verticalGap: Ye,
    style: Xe,
    className: je,
    children: Ge,
    ...Ue
  } = l, w = n.useRef(null), Q = n.useRef(null), A = n.useRef(null), ce = n.useRef({ x: 0, y: 0 }), k = n.useRef(null), [Ke, ue] = n.useState(!1), [d, qe] = n.useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }), [Je, pe] = n.useState(!1), [Qe, fe] = n.useState(null), [Ze, B] = n.useState(() => I ? { x: I.x, y: I.y } : null), N = I?.x, F = I?.y, Z = h?.x, ee = h?.y;
  n.useEffect(() => {
    if (Z !== void 0 && ee !== void 0) {
      B({ x: Z, y: ee });
      return;
    }
    if (N === void 0 || F === void 0) return;
    if (typeof window > "u") {
      B({ x: N, y: F });
      return;
    }
    const t = w.current?.getBoundingClientRect(), o = t ? Math.max(0, window.innerWidth - t.width) : window.innerWidth, a = Le(J ?? 12) + 6, H = Math.max(0, window.innerHeight - a);
    B({
      x: u(N, 0, o),
      y: u(F, 0, H)
    });
  }, [N, F, J, Z, ee]);
  const b = J ?? 12, he = ae !== void 0, [et, tt] = n.useState(Oe), c = he ? ae : et, ge = Ve ?? Math.round(b * 0.75), nt = _e ?? ge, ot = Ae ?? ge, it = Ne ?? 0, we = G(nt) ?? "0px", ye = G(ot) ?? "0px", rt = G(it) ?? "0px", R = Fe ?? 3, st = We ?? Nt, C = E === "a" ? p : E === "b" ? x : "transparent", M = E === "none" ? 0 : 1, te = St(Ye), lt = `${te}px`, z = Le(b), m = M, xe = T !== void 0, [at, be] = n.useState(() => u(T ?? ke ?? At, 0, 1));
  n.useEffect(() => {
    T !== void 0 && be(u(T, 0, 1));
  }, [T]);
  const ne = u(
    xe ? T : at,
    0,
    1
  ), oe = Math.max(0, Te ?? _t), W = (Se || q) && (!q || ne < 1), ie = W ? ne : 1, $ = W ? oe : 0, dt = Math.round(ne * 100), ct = n.useCallback(
    (e) => String(Math.round(e) % 100).padStart(2, "0"),
    []
  ), ut = (e) => {
    const t = u(e / 100, 0, 1);
    xe || be(t), $e?.(t);
  }, pt = n.useMemo(() => ({
    colorA: p,
    colorB: x,
    fontSize: b,
    borderStyle: E,
    transparent: W,
    bodyBlur: oe
  }), [E, p, x, oe, b, W]), ft = !c || de, ht = !!(De || de && c), gt = n.useMemo(() => ({
    opacity: ie,
    blur: $
  }), [$, ie]), wt = c ? "collapsed" : "expanded", re = [
    { value: "collapsed", ariaLabel: "Expand panel", title: "Expand panel" },
    { value: "expanded", ariaLabel: "Collapse panel", title: "Collapse panel" }
  ], yt = (e) => {
    const t = e === "collapsed";
    he || tt(t), Ie?.(t);
  }, me = !!(f && K), se = n.useCallback(() => {
    const e = w.current;
    if (!e || typeof window > "u") return;
    const t = e.getBoundingClientRect(), o = 6, a = Math.max(0, window.innerWidth - t.width - o), H = Math.max(0, window.innerHeight - t.height - o), v = Math.max(0, Math.min(o, H)), j = { x: a, y: v };
    h && g ? g(j) : B(j);
  }, [g, h]);
  n.useLayoutEffect(() => {
    _ && (typeof window > "u" || se());
  }, [_, se]);
  const ve = q ? /* @__PURE__ */ i(
    Ot,
    {
      min: 0,
      max: 100,
      step: 1,
      value: dt,
      onChange: ut,
      borderStyle: "none",
      fontSize: b,
      ariaLabel: "Panel opacity",
      formatDisplayValue: ct,
      "data-floating-panel-ignore-drag": !0
    }
  ) : null, xt = y ?? /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8, width: "100%" }, children: [
    /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
      U && /* @__PURE__ */ i(
        He,
        {
          behavior: "cycle",
          value: wt,
          options: re,
          onChange: (e) => yt(e),
          borderStyle: "none",
          fontSize: b,
          colorA: p,
          colorB: x,
          "aria-label": re[c ? 0 : 1]?.ariaLabel,
          title: re[c ? 0 : 1]?.title,
          children: c ? /* @__PURE__ */ L(
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
      S ? /* @__PURE__ */ i("span", { children: S }) : null
    ] }),
    D || ve || me ? /* @__PURE__ */ L("div", { style: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }, children: [
      D,
      ve,
      me ? /* @__PURE__ */ i(
        He,
        {
          borderStyle: "none",
          fontSize: b,
          colorA: p,
          colorB: x,
          "aria-label": "Dock panel",
          title: "Dock panel",
          onClick: se,
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
  ] }), r = h ?? Ze, P = !!(f && r), V = Ee, bt = 6, Be = P && r ? r.y : Qe, Y = V && Be !== null && typeof window < "u" ? Math.max(0, window.innerHeight - Be - z - bt) : void 0, X = n.useCallback(() => {
    if (typeof window > "u") return;
    if (P && r) {
      fe(r.y);
      return;
    }
    const e = w.current;
    if (!e) return;
    const t = e.getBoundingClientRect();
    fe((o) => o !== null && Math.abs(o - t.top) < 0.5 ? o : t.top);
  }, [P, r]), Re = n.useCallback(() => {
    if (!f || !r || typeof window > "u" || h && !g) return;
    const o = w.current?.getBoundingClientRect()?.width ?? 0, a = Math.max(0, window.innerWidth - o), H = Math.max(0, window.innerHeight - z - 6), v = {
      x: u(r.x, 0, a),
      y: u(r.y, 0, H)
    };
    Math.abs(v.x - r.x) < 0.5 && Math.abs(v.y - r.y) < 0.5 || (h && g ? g(v) : B(v));
  }, [f, z, g, h, r]), O = n.useCallback(() => {
    const e = Q.current;
    e && qe((t) => {
      const o = { scrollTop: e.scrollTop, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight };
      return t.scrollTop === o.scrollTop && t.scrollHeight === o.scrollHeight && t.clientHeight === o.clientHeight ? t : o;
    });
  }, []), mt = n.useCallback(() => {
    O(), pe(!0), k.current && window.clearTimeout(k.current), k.current = window.setTimeout(() => {
      pe(!1), k.current = null;
    }, 650);
  }, [O]);
  n.useEffect(() => {
    O();
  }, [O, Y, c]), n.useEffect(() => {
    const e = Q.current;
    if (!e || typeof ResizeObserver > "u") return;
    const t = new ResizeObserver(() => O());
    return t.observe(e), () => t.disconnect();
  }, [O]), n.useLayoutEffect(() => {
    V && X();
  }, [V, X]), n.useEffect(() => {
    if (!V || typeof window > "u") return;
    const e = () => X();
    window.addEventListener("resize", e), window.addEventListener("scroll", e, !0);
    const t = w.current, o = t && typeof ResizeObserver < "u" ? new ResizeObserver(e) : null;
    return o?.observe(t), () => {
      window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0), o?.disconnect();
    };
  }, [V, X]), n.useEffect(() => {
    if (!f || !r || typeof window > "u") return;
    const e = () => Re();
    window.addEventListener("resize", e);
    const t = w.current, o = t && typeof ResizeObserver < "u" ? new ResizeObserver(e) : null;
    return o?.observe(t), () => {
      window.removeEventListener("resize", e), o?.disconnect();
    };
  }, [Re, f, r]), n.useEffect(() => () => {
    k.current && window.clearTimeout(k.current);
  }, []);
  const le = d.scrollHeight - d.clientHeight > 1, Ce = le ? Math.max(12, Math.round(d.clientHeight * (d.clientHeight / d.scrollHeight))) : 0, vt = Math.max(0, d.clientHeight - Ce), Bt = le && d.scrollHeight > d.clientHeight ? Math.round(d.scrollTop / (d.scrollHeight - d.clientHeight) * vt) : 0, Rt = (e) => {
    w.current = e, s && (typeof s == "function" ? s(e) : s.current = e);
  }, Ct = (e) => {
    if (!f || e.button !== 0 || e.target?.closest("button, [data-floating-panel-ignore-drag], input, select, textarea, a"))
      return;
    const o = w.current;
    if (!o) return;
    const a = o.getBoundingClientRect();
    r || B({ x: a.left, y: a.top }), ce.current = {
      x: e.clientX - a.left,
      y: e.clientY - a.top
    }, A.current = e.pointerId, ue(!0), e.currentTarget.setPointerCapture(e.pointerId);
  }, Mt = (e) => {
    if (!f || A.current !== e.pointerId || typeof window > "u") return;
    const o = w.current?.getBoundingClientRect(), a = ce.current, H = o?.width ?? 0, v = Math.max(0, window.innerWidth - H), j = Math.max(0, window.innerHeight - z - 6), Pt = u(e.clientX - a.x, 0, v), Ht = u(e.clientY - a.y, 0, j), Pe = { x: Pt, y: Ht };
    h && g ? g(Pe) : B(Pe);
  }, Me = (e) => {
    if (A.current === e.pointerId) {
      A.current = null, ue(!1);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
  };
  return /* @__PURE__ */ i(Tt.Provider, { value: pt, children: /* @__PURE__ */ L(
    "div",
    {
      ref: Rt,
      className: je,
      style: {
        width: G(ze),
        borderRadius: R,
        border: "none",
        background: "transparent",
        color: p,
        boxShadow: st,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: b,
        fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
        lineHeight: 1.3,
        position: P ? "fixed" : void 0,
        left: P ? `${r.x}px` : void 0,
        top: P ? `${r.y}px` : void 0,
        zIndex: P ? 20 : void 0,
        "--ui-bits-color-a": p,
        "--ui-bits-color-b": x,
        ...Xe ?? {}
      },
      ...Ue,
      children: [
        /* @__PURE__ */ i(
          "div",
          {
            style: {
              minHeight: z,
              display: "flex",
              alignItems: "center",
              padding: `0 ${ye} 0 ${we}`,
              borderTop: m ? `${m}px solid ${C}` : "none",
              borderLeft: m ? `${m}px solid ${C}` : "none",
              borderRight: m ? `${m}px solid ${C}` : "none",
              borderBottom: m ? `${m}px solid ${C}` : "none",
              borderTopLeftRadius: R,
              borderTopRightRadius: R,
              borderBottomLeftRadius: c ? R : 0,
              borderBottomRightRadius: c ? R : 0,
              boxSizing: "border-box",
              fontWeight: 600,
              lineHeight: 1,
              background: x,
              color: p,
              cursor: f ? Ke ? "grabbing" : "grab" : "default",
              userSelect: "none",
              touchAction: "none",
              position: "relative"
            },
            onPointerDown: Ct,
            onPointerMove: Mt,
            onPointerUp: Me,
            onPointerCancel: Me,
            children: xt
          }
        ),
        ft && /* @__PURE__ */ L(
          "div",
          {
            className: "ui-bits-floating-panel__body-wrap",
            style: {
              borderLeft: M ? `${M}px solid ${C}` : "none",
              borderRight: M ? `${M}px solid ${C}` : "none",
              borderBottom: M ? `${M}px solid ${C}` : "none",
              borderBottomLeftRadius: R,
              borderBottomRightRadius: R,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              overflow: "hidden",
              display: c ? "none" : "block",
              boxSizing: "border-box",
              position: "relative"
            },
            "aria-hidden": c,
            children: [
              /* @__PURE__ */ i(
                "div",
                {
                  ref: Q,
                  onScroll: mt,
                  style: {
                    overflowY: Y !== void 0 ? "auto" : void 0,
                    maxHeight: Y !== void 0 ? `${Y}px` : void 0,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"
                  },
                  className: "ui-bits-floating-panel__body",
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        padding: `${lt} ${ye} ${rt} ${we}`,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        background: Wt(x, ie),
                        backdropFilter: $ > 0 ? `blur(${$}px)` : "none",
                        WebkitBackdropFilter: $ > 0 ? `blur(${$}px)` : "none"
                      },
                      children: /* @__PURE__ */ i(kt.Provider, { value: te, children: /* @__PURE__ */ i($t.Provider, { value: gt, children: /* @__PURE__ */ i(Lt, { suspended: ht, children: /* @__PURE__ */ i("div", { style: { position: "relative", display: "flex", flexDirection: "column", gap: te }, children: Ge }) }) }) })
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
                    opacity: Je ? 1 : void 0,
                    transition: "opacity 160ms ease"
                  },
                  children: /* @__PURE__ */ i(
                    "div",
                    {
                      style: {
                        width: "100%",
                        height: Ce,
                        borderRadius: 999,
                        background: p,
                        transform: `translateY(${Bt}px)`
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
//# sourceMappingURL=FloatingPanel-FkRcNvc5.js.map
