import { jsx as _e } from "react/jsx-runtime";
import r from "react";
import { u as Ke } from "./panelGap-DjV8XIAA.js";
import { b as Ve, d as Oe } from "./hooks-KNH81MTH.js";
const He = "var(--ui-bits-color-a, #2f2f2f)", Fe = "var(--ui-bits-color-b, #f0f0f0)", Ne = 1, je = 0.35, ne = 1;
function We(L) {
  const E = L * (Ne + je * 2);
  return Math.round(E + ne * 2);
}
const Ge = r.forwardRef((L, E) => {
  const {
    fontSize: re,
    colorA: le,
    colorB: se,
    borderStyle: ie,
    borderMask: f,
    behavior: ae,
    toggled: k,
    defaultToggled: A = !1,
    onToggle: ce,
    pressed: D,
    defaultPressed: U = !1,
    onPressChange: V,
    options: R,
    value: T,
    defaultValue: de,
    onChange: ue,
    controlId: O,
    style: fe,
    children: H,
    className: ye,
    type: he,
    disabled: c,
    onClick: ve,
    onPointerDown: be,
    onPointerUp: me,
    onPointerLeave: pe,
    onPointerCancel: ge,
    onKeyDown: Ce,
    onKeyUp: Pe,
    onBlur: Se,
    title: F,
    ...y
  } = L, h = Ke(), Be = y["aria-label"], v = Ve(O, Be ?? F), Ie = O !== void 0, [t, n] = Oe(v), o = ae ?? (R?.length ? "cycle" : "momentary"), b = re ?? h?.fontSize ?? 12, N = le ?? h?.colorA ?? He, j = se ?? h?.colorB ?? Fe, W = ie ?? h?.borderStyle ?? "none", s = r.useMemo(() => R ?? [], [R]), [G, xe] = r.useState(U), M = D !== void 0, Y = v !== void 0 && o === "momentary" && D === void 0 && Ie, m = Y, Le = M ? D : Y && typeof t == "boolean" ? t : G, i = r.useCallback((e) => {
    M || xe(e), m && n(e ? !0 : void 0), V?.(e);
  }, [M, V, n, m]), [q, Ee] = r.useState(A), J = k !== void 0, p = v !== void 0 && o === "toggle" && k === void 0, w = J ? k : p && typeof t == "boolean" ? t : q, [g, Q] = r.useState(() => de ?? s[0]?.value ?? ""), C = T !== void 0, d = v !== void 0 && o === "cycle" && T === void 0, z = C ? T : d && typeof t == "string" ? t : g;
  r.useEffect(() => {
    if (o !== "cycle" || C || !s.length) return;
    if (!s.some((l) => l.value === z)) {
      const l = s[0].value;
      d ? n(l) : Q(l);
    }
  }, [s, C, o, z, n, d]), r.useEffect(() => {
    !p || t !== void 0 || n(A);
  }, [A, n, p, t]), r.useEffect(() => {
    if (m) {
      if (t === !1) {
        n(void 0);
        return;
      }
      t === void 0 && U && n(!0);
    }
  }, [U, n, m, t]), r.useEffect(() => {
    !d || t !== void 0 || n(g);
  }, [n, d, t, g]);
  const X = s.findIndex((e) => e.value === z), Z = X >= 0 ? X : 0, a = s[Z], $ = o === "cycle" ? a?.colorA ?? N : N, ee = o === "cycle" ? a?.colorB ?? j : j, ke = o === "toggle" && w || o === "momentary" && Le, [_, P] = ke ? [ee, $] : [$, ee], oe = o === "cycle" ? a?.borderStyle ?? W : W, K = We(b), Ae = Math.max(2, Math.round(b * 0.25)), te = Math.max(1, Math.round(b * 0.1)), De = Math.max(0, K - ne * 2 - te * 2), Ue = Math.max(10, Math.floor(De)), S = {
    top: f?.top ?? !0,
    right: f?.right ?? !0,
    bottom: f?.bottom ?? !0,
    left: f?.left ?? !0
  }, u = oe === "a" ? _ : oe === "b" ? P : "transparent", B = P, Re = {
    "--icon-btn-a": _,
    "--icon-btn-b": P,
    width: K,
    height: K,
    borderRadius: Ae,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: u,
    borderTopColor: S.top ? u : B,
    borderRightColor: S.right ? u : B,
    borderBottomColor: S.bottom ? u : B,
    borderLeftColor: S.left ? u : B,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: te,
    lineHeight: 1,
    cursor: c ? "not-allowed" : "pointer",
    userSelect: "none",
    backgroundClip: "padding-box",
    transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
    fontSize: b,
    background: P,
    color: _,
    ...c ? { opacity: 0.5 } : null,
    ...fe ?? {}
  }, I = o === "cycle" ? a?.icon ?? H : H, Te = r.isValidElement(I) && typeof I.type != "string" ? (() => {
    const e = I;
    return e.props.size == null ? r.cloneElement(e, { size: Ue }) : e;
  })() : I, Me = o === "toggle" ? w : y["aria-pressed"], we = y["aria-label"] ?? (o === "cycle" ? a?.ariaLabel : void 0), ze = F ?? (o === "cycle" ? a?.title ?? a?.ariaLabel : void 0);
  return /* @__PURE__ */ _e(
    "button",
    {
      ref: E,
      type: he ?? "button",
      className: ye,
      style: Re,
      ...y,
      onClick: (e) => {
        if (!c) {
          if (o === "toggle") {
            const l = !w;
            J || Ee(l), p && n(l), ce?.(l);
          } else if (o === "cycle" && s.length) {
            const l = (Z + 1) % s.length, x = s[l];
            C || Q(x.value), d && n(x.value), ue?.(x.value, x, l);
          }
        }
        ve?.(e);
      },
      onPointerDown: (e) => {
        !c && o === "momentary" && i(!0), be?.(e);
      },
      onPointerUp: (e) => {
        o === "momentary" && i(!1), me?.(e);
      },
      onPointerLeave: (e) => {
        o === "momentary" && i(!1), pe?.(e);
      },
      onPointerCancel: (e) => {
        o === "momentary" && i(!1), ge?.(e);
      },
      onKeyDown: (e) => {
        !c && o === "momentary" && (e.key === " " || e.key === "Enter") && i(!0), Ce?.(e);
      },
      onKeyUp: (e) => {
        o === "momentary" && (e.key === " " || e.key === "Enter") && i(!1), Pe?.(e);
      },
      onBlur: (e) => {
        o === "momentary" && i(!1), Se?.(e);
      },
      "aria-pressed": Me,
      "aria-label": we,
      title: ze,
      disabled: c,
      children: Te
    }
  );
});
Ge.displayName = "IconButton";
export {
  Ge as I
};
//# sourceMappingURL=IconButton-BvvMagK1.js.map
