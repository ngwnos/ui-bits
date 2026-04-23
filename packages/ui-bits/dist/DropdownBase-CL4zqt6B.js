import { jsx as w, jsxs as K } from "react/jsx-runtime";
import { useId as Tt, useRef as A, useMemo as le, useCallback as C, useState as R, useEffect as p } from "react";
import { createPortal as $t } from "react-dom";
import { u as St } from "./panelGap-DjV8XIAA.js";
import { d as At } from "./hooks-KNH81MTH.js";
function Ct(a) {
  const s = a.trim();
  if (!s) return null;
  const i = s.startsWith("#") ? s.slice(1) : s;
  return /^[0-9a-fA-F]{3}$/.test(i) ? i.split("").map((l) => l + l).join("") : /^[0-9a-fA-F]{6}$/.test(i) ? i : null;
}
function q(a, s, i = "0,0,0") {
  const l = Ct(a);
  if (!l) return `rgba(${i},${s})`;
  const I = parseInt(l, 16), n = I >> 16 & 255, _ = I >> 8 & 255, L = I & 255;
  return `rgba(${n}, ${_}, ${L}, ${s})`;
}
const Et = "var(--ui-bits-color-a, #2f2f2f)", It = "var(--ui-bits-color-b, #f0f0f0)", Nt = 240, ze = 40, E = 6, Ft = 2, Rt = 1.25, _t = "0 8px 20px rgba(0,0,0,0.2)";
function Lt(a) {
  if (!a) return {};
  const s = {};
  for (const [i, l] of Object.entries(a))
    !i.startsWith("--") || l === void 0 || (s[i] = l);
  return s;
}
function Ue({
  colorA: a,
  colorB: s,
  borderStyle: i
}) {
  return { surface: i === "b" ? a : s, text: i === "b" ? s : a, inverseSurface: i === "b" ? s : a, inverseText: i === "b" ? a : s };
}
function Vt({
  label: a,
  showLabel: s = !0,
  labelInline: i = !1,
  overlayMenu: l = !0,
  ariaLabel: I,
  options: n,
  value: _,
  defaultValue: L,
  placeholder: je = "Select an option",
  onChange: Se,
  open: Ae,
  defaultOpen: Ke = !1,
  onOpenChange: Ce,
  colorA: qe,
  colorB: Ge,
  borderStyle: Xe,
  borderMask: G,
  borderRadius: Ye,
  width: X,
  fontSize: Je,
  compact: Ee = !1,
  showOptionIcons: O = !1,
  returnFocusOnSelect: Ie = !0,
  disabled: Y = !1,
  controlId: Ne,
  className: Qe,
  style: ae,
  renderTrigger: Ze
}) {
  const J = Tt(), Q = St(), [ce, Z] = At(Ne), B = Ne !== void 0 && _ === void 0, g = B ? ce : _, W = a ? `${J}-label` : void 0, de = `${J}-listbox`, ee = `${J}-button`, ue = g !== void 0, fe = A(null), me = A(null), te = A(null), Fe = A(null), k = A(null), y = A(null), pe = A([]);
  pe.current.length = n.length;
  const h = le(
    () => n.findIndex((e) => !e.disabled),
    [n]
  ), D = C(() => g !== void 0 ? g : L !== void 0 ? L : h >= 0 ? n[h].value : "", [L, h, n, g]), [he, Re] = R(() => D()), _e = ue ? g : he;
  p(() => {
    if (g !== void 0) return;
    n.find((t) => t.value === he) || Re(D());
  }, [he, n, D, g]), p(() => {
    !B || ce !== void 0 || Z(D());
  }, [D, Z, B, ce]);
  const M = n.findIndex((e) => e.value === _e), we = M >= 0 ? n[M] : void 0, [et, tt] = R(Ke), be = Ae !== void 0, r = be ? Ae : et, b = C((e) => {
    be || tt(e), Ce?.(e);
  }, [be, Ce]), [H, P] = R(() => M >= 0 ? M : Math.max(0, h));
  p(() => {
    if (!r) return;
    const e = M >= 0 ? M : h;
    P(e >= 0 ? e : 0);
  }, [M, h, r]), p(() => {
    if (!r) return;
    const e = (t) => {
      const o = t.target;
      o && (me.current?.contains(o) || Fe.current?.contains(o) || b(!1));
    };
    return window.addEventListener("pointerdown", e), () => window.removeEventListener("pointerdown", e);
  }, [r, b]);
  const xe = C((e) => {
    if (!n.length) return;
    let t = H;
    for (let o = 0; o < n.length; o += 1)
      if (t = (t + e + n.length) % n.length, !n[t].disabled) {
        P(t);
        break;
      }
  }, [n, H]), ve = C((e) => {
    Y || e.disabled || (ue || Re(e.value), B && Z(e.value), Se?.(e.value, e), b(!1), Ie && requestAnimationFrame(() => fe.current?.focus()));
  }, [Y, ue, Se, Ie, b, Z, B]);
  p(() => {
    if (!r) return;
    const e = (t) => {
      if (t.key === "Escape") {
        t.preventDefault(), b(!1), requestAnimationFrame(() => fe.current?.focus());
        return;
      }
      if (t.key === "ArrowDown") {
        t.preventDefault(), xe(1);
        return;
      }
      if (t.key === "ArrowUp") {
        t.preventDefault(), xe(-1);
        return;
      }
      if (t.key === "Home") {
        t.preventDefault(), h >= 0 && P(h);
        return;
      }
      if (t.key === "End") {
        t.preventDefault();
        const o = [...n].reverse().findIndex((u) => !u.disabled);
        if (o >= 0) {
          const u = n.length - 1 - o;
          P(u);
        }
        return;
      }
      if (t.key === "Enter" || t.key === " ") {
        t.preventDefault();
        const o = n[H];
        o && !o.disabled && ve(o);
      }
    };
    return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
  }, [h, xe, n, r, ve, b, H]);
  const nt = (e) => {
    (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ") && (e.preventDefault(), r || b(!0));
  }, N = Je ?? Q?.fontSize ?? 12, ot = Math.round(N * (1 + 0.35 * 2) + 2), rt = Math.max(1, Math.round(N * 0.1)), ge = qe ?? Q?.colorA ?? Et, ye = Ge ?? Q?.colorB ?? It, V = Xe ?? Q?.borderStyle ?? "a", z = V === "none" ? "transparent" : V === "a" ? ge : ye, { surface: Le, text: ne, inverseSurface: it, inverseText: st } = Ue({
    colorA: ge,
    colorB: ye,
    borderStyle: V
  }), oe = V === "none" ? "transparent" : Le, lt = q(ne, 0.7), at = q(ne, 0.5), ct = q(ne, 0.2, "16,15,15"), re = {
    top: G?.top ?? !0,
    right: G?.right ?? !0,
    bottom: G?.bottom ?? !0,
    left: G?.left ?? !0
  }, dt = Math.max(0, Ye ?? 3), Oe = {
    "--dropdown-surface": Le,
    "--dropdown-border": z,
    "--dropdown-border-top": re.top ? z : oe,
    "--dropdown-border-right": re.right ? z : oe,
    "--dropdown-border-bottom": re.bottom ? z : oe,
    "--dropdown-border-left": re.left ? z : oe,
    "--dropdown-text": ne,
    "--dropdown-muted": lt,
    "--dropdown-placeholder": at,
    "--dropdown-shadow": _t,
    "--dropdown-inverse-surface": it,
    "--dropdown-inverse-text": st,
    "--dropdown-focus-overlay": ct,
    "--dropdown-font-size": `${N}px`,
    "--dropdown-radius": `${dt}px`,
    "--dropdown-row-height": `${ot}px`,
    "--dropdown-icon-inset": `${rt}px`
  }, Me = ["dropdown-root", Qe].filter(Boolean).join(" "), U = le(
    () => Me.split(/\s+/).includes("dropdown-root--icon"),
    [Me]
  ), ut = we?.label ?? je, ft = !we, mt = s ? "dropdown-label" : "dropdown-label dropdown-label--sr", pt = le(() => Lt(ae), [ae]), Be = le(() => {
    if (typeof document > "u" || n.length === 0) return;
    const t = document.createElement("canvas").getContext("2d");
    if (!t) return;
    const u = getComputedStyle(document.documentElement).getPropertyValue("--ui-bits-font-family").trim() || '"IBM Plex Mono", monospace', m = `600 ${N}px ${u}`, $ = `600 ${N * 0.75}px ${u}`;
    let d = 0;
    t.font = m;
    for (const v of n)
      d = Math.max(d, t.measureText(v.label).width), v.description && (t.font = $, d = Math.max(d, t.measureText(v.description).width), t.font = m);
    const F = parseFloat(getComputedStyle(document.documentElement).fontSize || "16") * Rt;
    return Math.ceil(d + F + Ft);
  }, [N, n]), [c, We] = R(null), [f, ke] = R(() => ({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0
  })), [ht, He] = R(!1), wt = X == null ? void 0 : typeof X == "number" ? `${X}px` : X, bt = W ? `${W} ${ee}` : void 0, j = C(() => {
    if (!te.current || typeof window > "u") return;
    const e = te.current.getBoundingClientRect(), t = me.current?.getBoundingClientRect(), o = l ? e.top : e.bottom, u = l ? e.bottom : e.top, m = Math.max(0, window.innerHeight - o - E), $ = Math.max(0, u - E), d = m >= ze || m >= $ ? "down" : "up", F = Math.max(ze, Math.min(Nt, d === "down" ? m : $)), v = window.innerWidth - E * 2, ie = Math.max(
      0,
      Math.min(e.width, v)
    ), $e = i && !U && !!t, se = $e ? Math.max(ie, Math.min($e ? Be ?? ie : ie, v)) : ie, Mt = $e ? Math.max(t.left, e.right - se) : e.left, Ht = Math.max(E, window.innerWidth - se - E), Pe = Math.max(E, Math.min(Mt, Ht)), Ve = d === "down" ? l ? e.top : e.bottom : l ? e.bottom : e.top;
    We((S) => S && S.top === Ve && S.left === Pe && S.width === se && S.maxHeight === F && S.placement === d ? S : { top: Ve, left: Pe, width: se, maxHeight: F, placement: d });
  }, [U, i, Be, l]), T = C(() => {
    const e = k.current;
    e && ke((t) => {
      const o = {
        scrollTop: e.scrollTop,
        scrollHeight: e.scrollHeight,
        clientHeight: e.clientHeight
      };
      return t.scrollTop === o.scrollTop && t.scrollHeight === o.scrollHeight && t.clientHeight === o.clientHeight ? t : o;
    });
  }, []), xt = C(() => {
    T(), He(!0), !(typeof window > "u") && (y.current !== null && window.clearTimeout(y.current), y.current = window.setTimeout(() => {
      He(!1), y.current = null;
    }, 650));
  }, [T]);
  p(() => {
    if (!r || typeof window > "u") {
      We(null), ke({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }), He(!1);
      return;
    }
    const e = () => j(), t = (u) => {
      const m = u.target;
      m instanceof Node && k.current && k.current.contains(m) || j();
    };
    e();
    const o = window.requestAnimationFrame(e);
    return window.addEventListener("resize", e), window.addEventListener("scroll", t, !0), () => {
      window.cancelAnimationFrame(o), window.removeEventListener("resize", e), window.removeEventListener("scroll", t, !0);
    };
  }, [r, j]), p(() => {
    if (!r || typeof ResizeObserver > "u") return;
    const e = te.current;
    if (!e) return;
    const t = new ResizeObserver(() => j());
    return t.observe(e), () => t.disconnect();
  }, [r, j]), p(() => {
    if (!r || !c || (T(), typeof window > "u")) return;
    const e = window.requestAnimationFrame(T);
    return () => window.cancelAnimationFrame(e);
  }, [c, r, T]), p(() => {
    if (!r || typeof ResizeObserver > "u") return;
    const e = k.current;
    if (!e) return;
    const t = new ResizeObserver(() => T());
    return t.observe(e), () => t.disconnect();
  }, [r, T]), p(() => () => {
    typeof window > "u" || y.current !== null && (window.clearTimeout(y.current), y.current = null);
  }, []), p(() => {
    if (!r || !c) return;
    const e = pe.current[H];
    e?.scrollIntoView && e.scrollIntoView({ block: "nearest" });
  }, [c, r, H]);
  const Te = f.scrollHeight - f.clientHeight > 1, De = Te ? Math.max(
    12,
    Math.round(f.clientHeight * (f.clientHeight / f.scrollHeight))
  ) : 0, vt = Math.max(0, f.clientHeight - De), gt = Te && f.scrollHeight > f.clientHeight ? Math.round(f.scrollTop / (f.scrollHeight - f.clientHeight) * vt) : 0, yt = r && c && typeof document < "u" ? $t(
    /* @__PURE__ */ w(
      "div",
      {
        className: U ? "dropdown-root dropdown-root--icon" : "dropdown-root",
        "data-compact": Ee ? "true" : "false",
        "data-overlay-menu": l ? "true" : "false",
        "data-show-icons": O ? "true" : "false",
        style: {
          fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
          fontWeight: 600,
          ...Oe,
          ...pt
        },
        children: /* @__PURE__ */ K(
          "div",
          {
            ref: Fe,
            className: "dropdown-menu",
            "data-placement": c.placement,
            style: {
              top: `${c.top}px`,
              left: `${c.left}px`,
              maxHeight: `${c.maxHeight}px`,
              minWidth: U ? void 0 : `${c.width}px`,
              width: U ? void 0 : `${c.width}px`,
              maxWidth: `calc(100vw - ${E * 2}px)`,
              zIndex: 1e3,
              "--dropdown-anchor-width": `${c.width}px`
            },
            children: [
              /* @__PURE__ */ K(
                "div",
                {
                  ref: k,
                  className: "dropdown-menu__viewport",
                  role: "listbox",
                  id: de,
                  "aria-labelledby": W ?? ee,
                  onScroll: xt,
                  style: { maxHeight: `${c.maxHeight}px` },
                  children: [
                    n.map((e, t) => {
                      const o = e.value === _e, u = H === t, m = `${J}-option-${t}`, $ = O ? e.icon : void 0, d = !!(e.colorA || e.colorB || e.borderStyle), x = d ? Ue({
                        colorA: e.colorA ?? ge,
                        colorB: e.colorB ?? ye,
                        borderStyle: e.borderStyle ?? V
                      }) : null, F = d ? {
                        "--dropdown-surface": x.surface,
                        "--dropdown-text": x.text,
                        "--dropdown-muted": q(x.text, 0.7),
                        "--dropdown-inverse-surface": x.inverseSurface,
                        "--dropdown-inverse-text": x.inverseText,
                        "--dropdown-focus-overlay": q(x.text, 0.2, "16,15,15")
                      } : void 0;
                      return /* @__PURE__ */ K(
                        "button",
                        {
                          id: m,
                          type: "button",
                          role: "option",
                          "aria-selected": o,
                          className: "dropdown-option",
                          "data-has-description": e.description ? "true" : "false",
                          style: F,
                          onMouseEnter: () => {
                            e.disabled || P(t);
                          },
                          onClick: () => {
                            e.disabled || ve(e);
                          },
                          disabled: e.disabled,
                          "data-focused": u ? "true" : "false",
                          tabIndex: -1,
                          ref: (v) => {
                            pe.current[t] = v;
                          },
                          children: [
                            /* @__PURE__ */ K("span", { className: `dropdown-option-label${O ? " dropdown-option-label--icon" : ""}`, children: [
                              O && /* @__PURE__ */ w(
                                "span",
                                {
                                  className: `dropdown-option-icon${$ ? "" : " dropdown-option-icon--empty"}`,
                                  "aria-hidden": "true",
                                  children: $
                                }
                              ),
                              /* @__PURE__ */ w("span", { className: "dropdown-option-text", children: e.label })
                            ] }),
                            e.description && /* @__PURE__ */ w("span", { className: `dropdown-option-description${o ? " dropdown-option-description--inverse" : ""}`, children: e.description })
                          ]
                        },
                        e.value
                      );
                    }),
                    !n.length && /* @__PURE__ */ w("div", { className: "dropdown-empty", children: "No options available" })
                  ]
                }
              ),
              Te && /* @__PURE__ */ w(
                "div",
                {
                  className: "dropdown-menu__scrollbar",
                  "aria-hidden": "true",
                  style: { opacity: ht ? 1 : void 0 },
                  children: /* @__PURE__ */ w(
                    "div",
                    {
                      className: "dropdown-menu__scrollbar-thumb",
                      style: {
                        height: De,
                        transform: `translateY(${gt}px)`
                      }
                    }
                  )
                }
              )
            ]
          }
        )
      }
    ),
    document.body
  ) : null;
  return /* @__PURE__ */ K(
    "div",
    {
      ref: me,
      className: Me,
      "data-open": r ? "true" : "false",
      "data-compact": Ee ? "true" : "false",
      "data-label-inline": i ? "true" : "false",
      "data-overlay-menu": l ? "true" : "false",
      "data-disabled": Y ? "true" : "false",
      "data-show-icons": O ? "true" : "false",
      style: {
        width: "100%",
        maxWidth: wt,
        fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
        fontWeight: 600,
        ...Oe,
        ...ae
      },
      children: [
        a && /* @__PURE__ */ w("label", { id: W, htmlFor: ee, className: mt, children: a }),
        /* @__PURE__ */ w("div", { className: "dropdown-field", ref: te, children: Ze({
          id: ee,
          labelId: W,
          listboxId: de,
          open: r,
          disabled: Y,
          buttonRef: fe,
          displayLabel: ut,
          showPlaceholder: ft,
          activeOption: we,
          onTriggerClick: () => b(!r),
          onTriggerKeyDown: nt,
          ariaLabel: a ? void 0 : I,
          ariaLabelledBy: bt,
          ariaControls: r ? de : void 0
        }) }),
        yt
      ]
    }
  );
}
export {
  Vt as D
};
//# sourceMappingURL=DropdownBase-CL4zqt6B.js.map
