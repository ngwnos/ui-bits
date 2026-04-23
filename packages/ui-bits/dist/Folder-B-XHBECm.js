import { jsxs as $, jsx as r } from "react/jsx-runtime";
import h from "react";
import { A as be } from "./animationSuspension-BEQdvvQj.js";
import { u as me, a as Be, b as xe, c as ve, V as Ce, P as ye } from "./panelGap-DjV8XIAA.js";
import { I as ke } from "./IconButton-BvvMagK1.js";
const Se = "#2f2f2f", Le = "#f0f0f0", we = 1, $e = 0.35, Ae = 1;
function Re(o) {
  if (!o) return null;
  const e = o.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(e) ? e.split("").map((s) => s + s).join("") : /^[0-9a-fA-F]{6}$/.test(e) ? e : null;
}
function He(o, e, s = "255,255,255") {
  const f = Re(o);
  if (!f) return `rgba(${s},${e})`;
  const d = parseInt(f, 16), m = d >> 16 & 255, B = d >> 8 & 255, x = d & 255;
  return `rgba(${m}, ${B}, ${x}, ${e})`;
}
function A(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
function Pe(o) {
  const e = o * (we + $e * 2);
  return Math.round(e + Ae * 2);
}
const Te = h.forwardRef((o, e) => {
  const {
    label: s,
    colorA: f,
    colorB: d,
    borderStyle: m,
    fontSize: B,
    headerHeight: x,
    padding: v = 0,
    verticalGap: O,
    inheritPanelSurface: W,
    transparent: M,
    showBody: j = !0,
    collapsed: R,
    defaultCollapsed: G = !1,
    keepMounted: H = !0,
    suspended: V,
    onCollapseChange: N,
    style: K,
    className: Y,
    children: q,
    ...J
  } = o, l = me(), a = f ?? l?.colorA ?? Se, i = d ?? l?.colorB ?? Le, c = m ?? l?.borderStyle ?? "a", p = c !== "none", u = B ?? l?.fontSize ?? 12, C = M ?? l?.transparent ?? !1, P = l?.bodyBlur, Q = h.useMemo(() => ({
    colorA: a,
    colorB: i,
    fontSize: u,
    borderStyle: c,
    transparent: C,
    bodyBlur: P
  }), [c, P, a, i, u, C]), T = R !== void 0, [U, X] = h.useState(G), n = T ? R : U, Z = A(v) ?? "0px", g = c === "a" ? a : c === "b" ? i : "transparent", ee = n ? a : i, oe = n ? i : a, y = x ?? Pe(u), I = y + (p ? 1 : 0), k = Be(O), ne = k, te = `${k}px`, re = j && (!n || H), se = !!(V || H && n), E = xe(), le = E?.left ?? !0, ae = E?.right ?? !0, S = ve(), ie = W ?? !!S, de = S?.opacity ?? 1, b = S?.blur ?? 0, _ = ee, z = oe, F = n ? a : i, L = C && ie, ce = L ? He(F, de) : F, pe = n ? "collapsed" : "expanded", w = [
    { value: "collapsed", ariaLabel: "Expand section", title: "Expand section" },
    { value: "expanded", ariaLabel: "Collapse section", title: "Collapse section" }
  ], ue = h.useRef(null), he = h.useCallback((t) => {
    ue.current = t, e && (typeof e == "function" ? e(t) : e.current = t);
  }, [e]), D = (t) => {
    T || X(t), N?.(t);
  }, fe = (t) => {
    D(t === "collapsed");
  }, ge = () => {
    D(!n);
  };
  return /* @__PURE__ */ $(
    "div",
    {
      ref: he,
      className: Y,
      style: {
        display: "flex",
        flexDirection: "column",
        borderTop: p ? `1px solid ${g}` : "none",
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 3,
        overflow: "hidden",
        ...K ?? {}
      },
      ...J,
      children: [
        /* @__PURE__ */ $(
          "div",
          {
            style: {
              minHeight: I,
              height: I,
              display: "grid",
              gridTemplateColumns: `${y}px 1fr ${y}px`,
              alignItems: "center",
              padding: `0 ${Z}`,
              borderLeft: p && le ? `1px solid ${g}` : "none",
              borderRight: p && ae ? `1px solid ${g}` : "none",
              borderBottom: p ? `1px solid ${g}` : "none",
              background: _,
              color: z,
              boxSizing: "border-box",
              fontSize: u,
              fontWeight: 600,
              lineHeight: 1,
              cursor: "pointer",
              transition: "background 120ms ease, color 120ms ease"
            },
            onClick: ge,
            children: [
              /* @__PURE__ */ r("div", { style: { display: "flex", alignItems: "center", justifyContent: "flex-start" }, children: /* @__PURE__ */ r(
                ke,
                {
                  behavior: "cycle",
                  value: pe,
                  options: w,
                  onChange: (t) => fe(t),
                  borderStyle: "none",
                  fontSize: u,
                  colorA: z,
                  colorB: _,
                  "aria-label": w[n ? 0 : 1]?.ariaLabel,
                  title: w[n ? 0 : 1]?.title,
                  onClick: (t) => t.stopPropagation(),
                  children: n ? /* @__PURE__ */ $(
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
                        /* @__PURE__ */ r("path", { d: "M12 5v14" }),
                        /* @__PURE__ */ r("path", { d: "M5 12h14" })
                      ]
                    }
                  ) : /* @__PURE__ */ r(
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
                      children: /* @__PURE__ */ r("path", { d: "M5 12h14" })
                    }
                  )
                }
              ) }),
              /* @__PURE__ */ r("span", { style: { textAlign: "center" }, children: s }),
              /* @__PURE__ */ r("div", {})
            ]
          }
        ),
        re && /* @__PURE__ */ r(
          "div",
          {
            style: {
              paddingLeft: A(v),
              paddingRight: A(v),
              paddingTop: te,
              paddingBottom: 0,
              display: n ? "none" : "flex",
              flexDirection: "column",
              gap: ne,
              background: ce,
              backdropFilter: L && b > 0 ? `blur(${b}px)` : "none",
              WebkitBackdropFilter: L && b > 0 ? `blur(${b}px)` : "none"
            },
            "aria-hidden": n,
            children: /* @__PURE__ */ r(Ce.Provider, { value: k, children: /* @__PURE__ */ r(ye.Provider, { value: Q, children: /* @__PURE__ */ r(be, { suspended: se, children: q }) }) })
          }
        )
      ]
    }
  );
});
Te.displayName = "Folder";
export {
  Te as F
};
//# sourceMappingURL=Folder-B-XHBECm.js.map
