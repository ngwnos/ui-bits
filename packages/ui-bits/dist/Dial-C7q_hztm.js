import { jsxs as _t, jsx as A } from "react/jsx-runtime";
import n from "react";
import { c as K, s as Gt, a as Ut } from "./lfo-DJ5JkDXn.js";
import { u as zt } from "./animationSuspension-BEQdvvQj.js";
import { b as qt, d as Jt } from "./hooks-KNH81MTH.js";
const Qt = "var(--ui-bits-color-a, #2f2f2f)", Zt = "var(--ui-bits-color-b, #f0f0f0)", vt = 1, to = 0.35, G = 1, X = 270, kt = 225;
function oo(r) {
  const i = r * (vt + to * 2);
  return Math.round(i + G * 2);
}
function j(r) {
  return r * Math.PI / 180;
}
function co({
  min: r = 0,
  max: i = 100,
  step: E = 1,
  value: U,
  defaultValue: w,
  onChange: z,
  onUserChange: q,
  colorA: J = Qt,
  colorB: L = Zt,
  borderStyle: T = "none",
  borderMask: _,
  fontSize: B = 12,
  formatDisplayValue: Q,
  indicatorStyle: mt = "arc",
  indicatorColor: Z,
  controlMode: v,
  defaultControlMode: Dt = "xy",
  onControlModeChange: tt,
  disabled: u = !1,
  suspended: It,
  ariaLabel: ot = "Dial control",
  className: bt,
  style: Pt,
  onPointerDown: rt,
  onPointerMove: et,
  onPointerUp: st,
  onPointerCancel: at,
  onDoubleClick: nt,
  onKeyDown: k,
  onWheel: ct,
  controlId: St,
  ...$t
}) {
  const h = zt(It), lt = qt(St, ot), [N, m] = Jt(lt), p = lt !== void 0 && U === void 0, it = p ? N : U, g = it !== void 0, d = Number.isFinite(E) && E > 0 ? E : 1, s = n.useCallback((t) => {
    const o = K(t, r, i), a = Gt(o, r, d);
    return K(a, r, i);
  }, [r, i, d]), [At, ut] = n.useState(() => s(w ?? r)), c = g ? s(it ?? r) : At, f = n.useRef(null), D = n.useRef(null), dt = n.useRef(null), [Et, wt] = n.useState(Dt), V = v !== void 0, C = V ? v : Et, ft = n.useCallback((t) => {
    V || wt(t), tt?.(t);
  }, [V, tt]);
  n.useEffect(() => {
    g || ut((t) => s(t));
  }, [s, g]), n.useEffect(() => {
    !p || N !== void 0 || m(s(w ?? r));
  }, [s, w, r, m, p, N]);
  const y = n.useCallback((t) => {
    g || ut(t), p && m(t), z?.(t), q?.(t);
  }, [g, z, q, m, p]), ht = n.useCallback((t, o) => {
    const a = dt.current;
    if (!a) return null;
    const l = a.getBoundingClientRect(), Y = l.left + l.width / 2, H = l.top + l.height / 2, Xt = t - Y, jt = o - H;
    let O = Math.atan2(jt, Xt) + Math.PI / 2;
    O < 0 && (O += Math.PI * 2);
    const M = j(kt), Rt = M + j(X);
    let R = O;
    return R < M && (R += Math.PI * 2), R = K(R, M, Rt), (R - M) / (Rt - M);
  }, []), pt = n.useCallback((t, o) => {
    const a = ht(t, o);
    if (a == null) return;
    const l = s(r + a * (i - r));
    y(l);
  }, [s, y, i, r, ht]), Lt = (t) => {
    if (u || h) {
      rt?.(t);
      return;
    }
    f.current = t.pointerId, C === "xy" && (D.current = { x: t.clientX, y: t.clientY, value: c }), t.currentTarget.setPointerCapture(t.pointerId), C === "angle" && pt(t.clientX, t.clientY), rt?.(t);
  }, Tt = (t) => {
    if (f.current !== t.pointerId) {
      et?.(t);
      return;
    }
    if (C === "xy") {
      const o = D.current;
      if (o) {
        const a = t.clientX - o.x - (t.clientY - o.y), l = Math.max(6, e * 0.25), Y = t.shiftKey ? 10 : 1, H = s(o.value + a / l * d * Y);
        y(H);
      }
    } else
      pt(t.clientX, t.clientY);
    et?.(t);
  }, Bt = (t) => {
    if (f.current !== t.pointerId) {
      st?.(t);
      return;
    }
    f.current = null, D.current = null, t.currentTarget.releasePointerCapture(t.pointerId), st?.(t);
  }, Nt = (t) => {
    if (f.current !== t.pointerId) {
      at?.(t);
      return;
    }
    f.current = null, D.current = null, t.currentTarget.releasePointerCapture(t.pointerId), at?.(t);
  }, Vt = (t) => {
    if (u || h) {
      k?.(t);
      return;
    }
    let o = c;
    const a = t.shiftKey ? d * 10 : d;
    if (t.key === "ArrowUp" || t.key === "ArrowRight")
      o = s(c + a);
    else if (t.key === "ArrowDown" || t.key === "ArrowLeft")
      o = s(c - a);
    else if (t.key === "PageUp")
      o = s(c + a * 5);
    else if (t.key === "PageDown")
      o = s(c - a * 5);
    else if (t.key === "Home")
      o = s(r);
    else if (t.key === "End")
      o = s(i);
    else if (t.key === "m" || t.key === "M") {
      ft(C === "angle" ? "xy" : "angle"), t.preventDefault(), k?.(t);
      return;
    } else {
      k?.(t);
      return;
    }
    t.preventDefault(), y(o), k?.(t);
  }, Ft = (t) => {
    if (u || h) {
      ct?.(t);
      return;
    }
    const o = t.deltaY < 0 ? 1 : -1, a = t.shiftKey ? d * 10 : d, l = s(c + o * a);
    t.preventDefault(), y(l), ct?.(t);
  }, Wt = (t) => {
    if (u || h) {
      nt?.(t);
      return;
    }
    ft(C === "angle" ? "xy" : "angle"), nt?.(t);
  }, e = oo(B), I = Math.max(2, Math.round(B * 0.15)), b = Math.max(1, (e - I) / 2), F = 2 * Math.PI * b, gt = F * (X / 360), Ct = Ut(c, r, i), Yt = gt * Ct, W = kt - 90, yt = j(W + X * Ct), xt = Math.max(2, Math.round(I * 0.75)), Mt = Math.max(0, b + I / 2 - xt), Ht = e / 2 + Mt * Math.cos(yt), Ot = e / 2 + Mt * Math.sin(yt), P = Q ? Q(c) : `${Math.round(c)}`, Kt = Math.max(1, P.replace(/[^0-9]/g, "").length + (P.startsWith("-") ? 1 : 0)), x = T === "a" ? J : T === "b" ? L : "transparent", S = T === "none" ? "transparent" : L, $ = {
    top: _?.top ?? !0,
    right: _?.right ?? !0,
    bottom: _?.bottom ?? !0,
    left: _?.left ?? !0
  };
  return /* @__PURE__ */ _t(
    "div",
    {
      ref: dt,
      role: "slider",
      tabIndex: u ? -1 : 0,
      "aria-label": ot,
      "aria-valuemin": r,
      "aria-valuemax": i,
      "aria-valuenow": c,
      "aria-valuetext": P,
      "aria-disabled": u || h,
      className: ["ui-bits-dial", bt].filter(Boolean).join(" "),
      style: {
        width: e,
        height: e,
        fontSize: B,
        background: L,
        color: J,
        borderStyle: "solid",
        borderWidth: G,
        borderColor: x,
        borderTopColor: $.top ? x : S,
        borderRightColor: $.right ? x : S,
        borderBottomColor: $.bottom ? x : S,
        borderLeftColor: $.left ? x : S,
        "--dial-stroke": `${I}px`,
        "--dial-border-width": `${G}px`,
        ...Z ? { "--dial-indicator-color": Z } : null,
        ...u ? { opacity: 0.5 } : null,
        ...Pt ?? {}
      },
      onPointerDown: Lt,
      onPointerMove: Tt,
      onPointerUp: Bt,
      onPointerCancel: Nt,
      onDoubleClick: Wt,
      onKeyDown: Vt,
      onWheel: Ft,
      ...$t,
      children: [
        /* @__PURE__ */ _t(
          "svg",
          {
            className: "ui-bits-dial__arc",
            width: e,
            height: e,
            viewBox: `0 0 ${e} ${e}`,
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ A(
                "circle",
                {
                  className: "ui-bits-dial__track",
                  cx: e / 2,
                  cy: e / 2,
                  r: b,
                  strokeDasharray: `${gt} ${F}`,
                  strokeDashoffset: "0",
                  transform: `rotate(${W} ${e / 2} ${e / 2})`
                }
              ),
              mt === "arc" ? /* @__PURE__ */ A(
                "circle",
                {
                  className: "ui-bits-dial__indicator",
                  cx: e / 2,
                  cy: e / 2,
                  r: b,
                  strokeDasharray: `${Yt} ${F}`,
                  strokeDashoffset: "0",
                  transform: `rotate(${W} ${e / 2} ${e / 2})`
                }
              ) : /* @__PURE__ */ A(
                "circle",
                {
                  className: "ui-bits-dial__dot",
                  cx: Ht,
                  cy: Ot,
                  r: xt
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ A("span", { className: "ui-bits-dial__value", "data-digits": Kt, children: P })
      ]
    }
  );
}
export {
  co as D
};
//# sourceMappingURL=Dial-C7q_hztm.js.map
