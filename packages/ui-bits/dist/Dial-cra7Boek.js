import { jsxs as _t, jsx as A } from "react/jsx-runtime";
import a from "react";
import { c as G, s as Jt, a as Qt } from "./lfo-oQ46pOIR.js";
import { u as Zt } from "./animationSuspension-BEQdvvQj.js";
import { w as kt } from "./warnOnceDev-BPubHnZA.js";
import { a as vt, b as to, d as oo } from "./hooks-KNH81MTH.js";
const ro = "var(--ui-bits-color-a, #2f2f2f)", eo = "var(--ui-bits-color-b, #f0f0f0)", so = 1, no = 0.35, J = 1, z = 270, It = 225;
function ao(r) {
  const c = r * (so + no * 2);
  return Math.round(c + J * 2);
}
function q(r) {
  return r * Math.PI / 180;
}
function po({
  min: r = 0,
  max: c = 100,
  step: L = 1,
  value: M,
  defaultValue: T,
  onChange: Q,
  onUserChange: Z,
  colorA: v = ro,
  colorB: B = eo,
  borderStyle: N = "none",
  borderMask: R,
  fontSize: V = 12,
  formatDisplayValue: tt,
  indicatorStyle: Pt = "arc",
  indicatorColor: ot,
  controlMode: rt,
  defaultControlMode: wt = "xy",
  onControlModeChange: et,
  disabled: u = !1,
  suspended: Et,
  ariaLabel: F,
  className: $t,
  style: St,
  onPointerDown: st,
  onPointerMove: nt,
  onPointerUp: at,
  onPointerCancel: it,
  onDoubleClick: lt,
  onKeyDown: _,
  onWheel: ct,
  controlId: h,
  ...At
}) {
  const p = Zt(Et), { autoIds: ut } = vt(), O = h !== void 0 || F !== void 0, Lt = to(h, F), dt = O ? Lt : void 0;
  a.useEffect(() => {
    !ut || O || kt(
      "Dial.auto-id-missing-label",
      "[ui-bits] Dial cannot derive an automatic control id without an `ariaLabel` or `controlId`. Provide one to bind this dial to the control store."
    );
  }, [ut, O]), a.useEffect(() => {
    h === void 0 || M === void 0 || kt(
      `Dial.control-id-controlled-value.${h}`,
      "[ui-bits] Dial received both `controlId` and controlled `value`. The control store binding is ignored while `value` is controlled."
    );
  }, [h, M]);
  const [W, k] = oo(dt), g = dt !== void 0 && M === void 0, ft = g ? W : M, C = ft !== void 0, d = Number.isFinite(L) && L > 0 ? L : 1, s = a.useCallback((t) => {
    const o = G(t, r, c), n = Jt(o, r, d);
    return G(n, r, c);
  }, [r, c, d]), [Tt, ht] = a.useState(() => s(T ?? r)), i = C ? s(ft ?? r) : Tt, f = a.useRef(null), I = a.useRef(null), pt = a.useRef(null), [Bt, Nt] = a.useState(wt), Y = rt !== void 0, b = Y ? rt : Bt, gt = a.useCallback((t) => {
    Y || Nt(t), et?.(t);
  }, [Y, et]);
  a.useEffect(() => {
    C || ht((t) => s(t));
  }, [s, C]), a.useEffect(() => {
    !g || W !== void 0 || k(s(T ?? r));
  }, [s, T, r, k, g, W]);
  const m = a.useCallback((t) => {
    C || ht(t), g && k(t), Q?.(t), Z?.(t);
  }, [C, Q, Z, k, g]), Ct = a.useCallback((t, o) => {
    const n = pt.current;
    if (!n) return null;
    const l = n.getBoundingClientRect(), U = l.left + l.width / 2, X = l.top + l.height / 2, zt = t - U, qt = o - X;
    let j = Math.atan2(qt, zt) + Math.PI / 2;
    j < 0 && (j += Math.PI * 2);
    const D = q(It), Rt = D + q(z);
    let x = j;
    return x < D && (x += Math.PI * 2), x = G(x, D, Rt), (x - D) / (Rt - D);
  }, []), bt = a.useCallback((t, o) => {
    const n = Ct(t, o);
    if (n == null) return;
    const l = s(r + n * (c - r));
    m(l);
  }, [s, m, c, r, Ct]), Vt = (t) => {
    if (u || p) {
      st?.(t);
      return;
    }
    f.current = t.pointerId, b === "xy" && (I.current = { x: t.clientX, y: t.clientY, value: i }), t.currentTarget.setPointerCapture(t.pointerId), b === "angle" && bt(t.clientX, t.clientY), st?.(t);
  }, Ft = (t) => {
    if (f.current !== t.pointerId) {
      nt?.(t);
      return;
    }
    if (b === "xy") {
      const o = I.current;
      if (o) {
        const n = t.clientX - o.x - (t.clientY - o.y), l = Math.max(6, e * 0.25), U = t.shiftKey ? 10 : 1, X = s(o.value + n / l * d * U);
        m(X);
      }
    } else
      bt(t.clientX, t.clientY);
    nt?.(t);
  }, Ot = (t) => {
    if (f.current !== t.pointerId) {
      at?.(t);
      return;
    }
    f.current = null, I.current = null, t.currentTarget.releasePointerCapture(t.pointerId), at?.(t);
  }, Wt = (t) => {
    if (f.current !== t.pointerId) {
      it?.(t);
      return;
    }
    f.current = null, I.current = null, t.currentTarget.releasePointerCapture(t.pointerId), it?.(t);
  }, Yt = (t) => {
    if (u || p) {
      _?.(t);
      return;
    }
    let o = i;
    const n = t.shiftKey ? d * 10 : d;
    if (t.key === "ArrowUp" || t.key === "ArrowRight")
      o = s(i + n);
    else if (t.key === "ArrowDown" || t.key === "ArrowLeft")
      o = s(i - n);
    else if (t.key === "PageUp")
      o = s(i + n * 5);
    else if (t.key === "PageDown")
      o = s(i - n * 5);
    else if (t.key === "Home")
      o = s(r);
    else if (t.key === "End")
      o = s(c);
    else if (t.key === "m" || t.key === "M") {
      gt(b === "angle" ? "xy" : "angle"), t.preventDefault(), _?.(t);
      return;
    } else {
      _?.(t);
      return;
    }
    t.preventDefault(), m(o), _?.(t);
  }, Ht = (t) => {
    if (u || p) {
      ct?.(t);
      return;
    }
    const o = t.deltaY < 0 ? 1 : -1, n = t.shiftKey ? d * 10 : d, l = s(i + o * n);
    t.preventDefault(), m(l), ct?.(t);
  }, Kt = (t) => {
    if (u || p) {
      lt?.(t);
      return;
    }
    gt(b === "angle" ? "xy" : "angle"), lt?.(t);
  }, e = ao(V), P = Math.max(2, Math.round(V * 0.15)), w = Math.max(1, (e - P) / 2), H = 2 * Math.PI * w, mt = H * (z / 360), yt = Qt(i, r, c), Ut = mt * yt, K = It - 90, Dt = q(K + z * yt), xt = Math.max(2, Math.round(P * 0.75)), Mt = Math.max(0, w + P / 2 - xt), Xt = e / 2 + Mt * Math.cos(Dt), jt = e / 2 + Mt * Math.sin(Dt), E = tt ? tt(i) : `${Math.round(i)}`, Gt = Math.max(1, E.replace(/[^0-9]/g, "").length + (E.startsWith("-") ? 1 : 0)), y = N === "a" ? v : N === "b" ? B : "transparent", $ = N === "none" ? "transparent" : B, S = {
    top: R?.top ?? !0,
    right: R?.right ?? !0,
    bottom: R?.bottom ?? !0,
    left: R?.left ?? !0
  };
  return /* @__PURE__ */ _t(
    "div",
    {
      ref: pt,
      role: "slider",
      tabIndex: u ? -1 : 0,
      "aria-label": F ?? "Dial control",
      "aria-valuemin": r,
      "aria-valuemax": c,
      "aria-valuenow": i,
      "aria-valuetext": E,
      "aria-disabled": u || p,
      className: ["ui-bits-dial", $t].filter(Boolean).join(" "),
      style: {
        width: e,
        height: e,
        fontSize: V,
        background: B,
        color: v,
        borderStyle: "solid",
        borderWidth: J,
        borderColor: y,
        borderTopColor: S.top ? y : $,
        borderRightColor: S.right ? y : $,
        borderBottomColor: S.bottom ? y : $,
        borderLeftColor: S.left ? y : $,
        "--dial-stroke": `${P}px`,
        "--dial-border-width": `${J}px`,
        ...ot ? { "--dial-indicator-color": ot } : null,
        ...u ? { opacity: 0.5 } : null,
        ...St ?? {}
      },
      onPointerDown: Vt,
      onPointerMove: Ft,
      onPointerUp: Ot,
      onPointerCancel: Wt,
      onDoubleClick: Kt,
      onKeyDown: Yt,
      onWheel: Ht,
      ...At,
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
                  r: w,
                  strokeDasharray: `${mt} ${H}`,
                  strokeDashoffset: "0",
                  transform: `rotate(${K} ${e / 2} ${e / 2})`
                }
              ),
              Pt === "arc" ? /* @__PURE__ */ A(
                "circle",
                {
                  className: "ui-bits-dial__indicator",
                  cx: e / 2,
                  cy: e / 2,
                  r: w,
                  strokeDasharray: `${Ut} ${H}`,
                  strokeDashoffset: "0",
                  transform: `rotate(${K} ${e / 2} ${e / 2})`
                }
              ) : /* @__PURE__ */ A(
                "circle",
                {
                  className: "ui-bits-dial__dot",
                  cx: Xt,
                  cy: jt,
                  r: xt
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ A("span", { className: "ui-bits-dial__value", "data-digits": Gt, children: E })
      ]
    }
  );
}
export {
  po as D
};
//# sourceMappingURL=Dial-cra7Boek.js.map
