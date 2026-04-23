import { jsx as t, jsxs as I } from "react/jsx-runtime";
import d from "react";
import { A as ge } from "./animationSuspension-BEQdvvQj.js";
import { u as xe, a as me, c as _e, V as Be, P as Se } from "./panelGap-DjV8XIAA.js";
import { I as Ce } from "./IconButton-BvvMagK1.js";
const we = "#2f2f2f", Ee = "#f0f0f0", Ae = 1, $e = 0.35, Ke = 1;
function Le(n) {
  const a = n * (Ae + $e * 2);
  return Math.round(a + Ke * 2);
}
function ze(n) {
  if (n != null)
    return typeof n == "number" ? `${n}px` : n;
}
function Ie(n) {
  if (!n) return null;
  const a = n.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(a) ? a.split("").map((o) => o + o).join("") : /^[0-9a-fA-F]{6}$/.test(a) ? a : null;
}
function Re(n, a, o = "255,255,255") {
  const c = Ie(n);
  if (!c) return `rgba(${o},${a})`;
  const r = parseInt(c, 16), u = r >> 16 & 255, s = r >> 8 & 255, k = r & 255;
  return `rgba(${u}, ${s}, ${k}, ${a})`;
}
function Me(n, a, o) {
  if (Array.isArray(o))
    return o;
  const c = n.filter((r) => r.defaultExpanded).map((r) => r.key);
  return a === "single" ? c.slice(0, 1) : c;
}
function C(n, a, o) {
  const c = new Set(a.map((s) => s.key)), r = /* @__PURE__ */ new Set(), u = [];
  for (const s of n)
    if (!(!c.has(s) || r.has(s)) && (u.push(s), r.add(s), o === "single"))
      break;
  return u;
}
function Ne(n, a) {
  if (n.length !== a.length) return !1;
  for (let o = 0; o < n.length; o += 1)
    if (n[o] !== a[o]) return !1;
  return !0;
}
const Pe = d.forwardRef((n, a) => {
  const {
    items: o,
    emptyLabel: c = "No data",
    mode: r = "multiple",
    expandedKeys: u,
    defaultExpandedKeys: s,
    onExpandedKeysChange: k,
    colorA: F,
    colorB: O,
    borderStyle: G,
    borderRadius: W,
    fontSize: Y,
    rowHeight: q,
    padding: X = 0,
    verticalGap: J,
    inheritPanelSurface: Q,
    transparent: U,
    keepMounted: R = !0,
    suspended: Z,
    className: ee,
    style: oe,
    ...ne
  } = n, b = xe(), g = F ?? b?.colorA ?? we, x = O ?? b?.colorB ?? Ee, y = G ?? b?.borderStyle ?? "a", f = Y ?? b?.fontSize ?? 12, w = U ?? b?.transparent ?? !1, M = b?.bodyBlur, re = d.useMemo(() => ({
    colorA: g,
    colorB: x,
    fontSize: f,
    borderStyle: y,
    transparent: w,
    bodyBlur: M
  }), [
    y,
    M,
    g,
    x,
    f,
    w
  ]), m = y === "b" ? g : x, E = y === "b" ? x : g, N = y === "none" ? "transparent" : E, ae = y === "none" ? "1px solid transparent" : `1px solid ${N}`, te = Math.max(0, W ?? 3), ie = Math.max(1, Math.round(q ?? Le(f))), le = Math.round(f * 0.7), se = ze(X) ?? "0px", A = me(J), de = `${A}px`, $ = _e(), ce = Q ?? !!$, ue = $?.opacity ?? 1, P = $?.blur ?? 0, D = w && ce, pe = D ? Re(m, ue) : m, be = D && P > 0 ? `blur(${P}px)` : "none", h = u !== void 0, [_, H] = d.useState(() => C(
    Me(o, r, s),
    o,
    r
  )), ye = d.useMemo(() => C(u ?? [], o, r), [u, o, r]), v = h ? ye : _, K = d.useMemo(() => new Set(v), [v]), T = d.useId();
  d.useEffect(() => {
    if (h) return;
    const e = C(_, o, r);
    Ne(e, _) || H(e);
  }, [_, h, o, r]);
  const B = d.useCallback((e) => {
    const i = C(e, o, r);
    h || H(i), k?.(i);
  }, [h, o, r, k]), S = d.useCallback((e) => {
    if (e.disabled || e.children == null) return;
    const i = K.has(e.key);
    if (r === "single") {
      B(i ? [] : [e.key]);
      return;
    }
    if (i) {
      B(v.filter((l) => l !== e.key));
      return;
    }
    B([...v, e.key]);
  }, [B, v, K, r]), fe = d.useCallback((e, i) => {
    i.disabled || i.children == null || e.key !== "Enter" && e.key !== " " || (e.preventDefault(), S(i));
  }, [S]);
  return /* @__PURE__ */ t(
    "div",
    {
      ref: a,
      className: ["ui-bits-key-value-accordion", ee].filter(Boolean).join(" "),
      style: {
        fontFamily: "inherit",
        fontSize: f,
        lineHeight: 1,
        color: E,
        background: m,
        border: ae,
        borderRadius: te,
        overflow: "hidden",
        boxSizing: "border-box",
        "--ui-bits-key-value-accordion-row-height": `${ie}px`,
        "--ui-bits-key-value-accordion-padding-x": `${le}px`,
        "--ui-bits-key-value-accordion-body-padding-x": se,
        "--ui-bits-key-value-accordion-body-padding-y": de,
        "--ui-bits-key-value-accordion-body-gap": `${A}px`,
        "--ui-bits-key-value-accordion-border-color": N,
        "--ui-bits-key-value-accordion-body-background": pe,
        "--ui-bits-key-value-accordion-body-backdrop-filter": be,
        ...oe ?? {}
      },
      ...ne,
      children: o.length > 0 ? o.map((e, i) => {
        const l = K.has(e.key), p = e.children != null, V = `${T}-header-${i}`, j = `${T}-body-${i}`, he = l ? "expanded" : "collapsed", L = [
          { value: "collapsed", ariaLabel: "Expand section", title: "Expand section" },
          { value: "expanded", ariaLabel: "Collapse section", title: "Collapse section" }
        ], ve = p && (l || R), ke = !!(Z || R && !l);
        return /* @__PURE__ */ I("div", { className: "ui-bits-key-value-accordion__item", children: [
          /* @__PURE__ */ I(
            "div",
            {
              id: V,
              className: [
                "ui-bits-key-value-accordion__header",
                p ? "ui-bits-key-value-accordion__header--expandable" : "",
                e.disabled ? "ui-bits-key-value-accordion__header--disabled" : ""
              ].filter(Boolean).join(" "),
              role: p ? "button" : void 0,
              tabIndex: p && !e.disabled ? 0 : void 0,
              "aria-expanded": p ? l : void 0,
              "aria-controls": p ? j : void 0,
              "aria-disabled": e.disabled || void 0,
              onClick: () => S(e),
              onKeyDown: (z) => fe(z, e),
              children: [
                /* @__PURE__ */ t("div", { className: "ui-bits-key-value-accordion__icon", children: p ? /* @__PURE__ */ t(
                  Ce,
                  {
                    behavior: "cycle",
                    value: he,
                    options: L,
                    onChange: () => S(e),
                    borderStyle: "none",
                    fontSize: f,
                    colorA: E,
                    colorB: m,
                    disabled: e.disabled,
                    "aria-label": L[l ? 1 : 0]?.ariaLabel,
                    title: L[l ? 1 : 0]?.title,
                    onClick: (z) => z.stopPropagation(),
                    children: l ? /* @__PURE__ */ t(
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
                        children: /* @__PURE__ */ t("path", { d: "M5 12h14" })
                      }
                    ) : /* @__PURE__ */ I(
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
                          /* @__PURE__ */ t("path", { d: "M12 5v14" }),
                          /* @__PURE__ */ t("path", { d: "M5 12h14" })
                        ]
                      }
                    )
                  }
                ) : /* @__PURE__ */ t("div", { className: "ui-bits-key-value-accordion__icon-placeholder" }) }),
                /* @__PURE__ */ t("span", { className: "ui-bits-key-value-accordion__label", children: e.label }),
                /* @__PURE__ */ t("span", { className: "ui-bits-key-value-accordion__value", children: e.value })
              ]
            }
          ),
          ve ? /* @__PURE__ */ t(
            "div",
            {
              id: j,
              role: "region",
              "aria-labelledby": V,
              "aria-hidden": !l,
              className: [
                "ui-bits-key-value-accordion__body",
                l ? "" : "ui-bits-key-value-accordion__body--collapsed"
              ].filter(Boolean).join(" "),
              children: /* @__PURE__ */ t(Be.Provider, { value: A, children: /* @__PURE__ */ t(Se.Provider, { value: re, children: /* @__PURE__ */ t(ge, { suspended: ke, children: e.children }) }) })
            }
          ) : null
        ] }, e.key);
      }) : /* @__PURE__ */ t("div", { className: "ui-bits-key-value-accordion__empty", children: c })
    }
  );
});
Pe.displayName = "KeyValueAccordion";
export {
  Pe as K
};
//# sourceMappingURL=KeyValueAccordion-BcnxX8uP.js.map
