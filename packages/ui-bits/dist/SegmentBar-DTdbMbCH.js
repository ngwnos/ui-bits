import { jsxs as ge, jsx as x } from "react/jsx-runtime";
import { useState as U, useEffect as $, useMemo as he, useRef as _, useCallback as G } from "react";
import { c as pe } from "./lfo-DJ5JkDXn.js";
import { u as ve } from "./panelGap-DjV8XIAA.js";
import { w as ye } from "./warnOnceDev-BPubHnZA.js";
import { b as be, d as we } from "./hooks-KNH81MTH.js";
const xe = "#2f2f2f", $e = "#f0f0f0";
function Ce(l) {
  if (!l) return null;
  const o = l.trim().replace("#", "");
  return /^[0-9a-fA-F]{3}$/.test(o) ? o.split("").map((c) => c + c).join("") : /^[0-9a-fA-F]{6}$/.test(o) ? o : null;
}
function N(l, o, c = "0,0,0") {
  const e = Ce(l);
  if (!e) return `rgba(${c},${o})`;
  const a = parseInt(e, 16), m = a >> 16 & 255, C = a >> 8 & 255, O = a & 255;
  return `rgba(${m}, ${C}, ${O}, ${o})`;
}
function X(l, o, c) {
  return c !== void 0 ? c : o !== void 0 ? o : l[0]?.value ?? "";
}
function Pe({
  label: l,
  showLabel: o = !0,
  ariaLabel: c,
  options: e,
  value: a,
  defaultValue: m,
  onChange: C,
  colorA: O,
  colorB: Y,
  borderStyle: q,
  borderMask: S,
  width: B,
  fontSize: J,
  disabled: i = !1,
  controlId: Q,
  className: Z,
  style: ee
}) {
  const A = ve(), te = J ?? A?.fontSize ?? 12, re = q ?? A?.borderStyle ?? "a", I = O ?? A?.colorA ?? xe, g = Y ?? A?.colorB ?? $e, T = c ?? l, h = be(Q, T), j = h ?? (T || "unlabeled"), [z, k] = we(h), p = h !== void 0 && a === void 0, v = p ? z : a, L = re, y = L === "a" ? I : L === "b" ? g : "transparent", W = N(L === "none" ? I : g, 0.16, L === "none" ? "0,0,0" : "255,255,255"), ne = g, [E, F] = U(() => X(e, m, v)), b = v !== void 0;
  $(() => {
    h === void 0 || a === void 0 || ye(
      `SegmentBar.control-id-controlled-value.${j}`,
      "[ui-bits] SegmentBar received both `controlId` and controlled `value`. The control store binding is ignored while `value` is controlled."
    );
  }, [h, a, j]);
  const D = b ? v : E, P = he(() => e.findIndex((t) => t.value === D), [D, e]), oe = P >= 0 ? P : 0;
  $(() => {
    if (!b) {
      if (!e.length) {
        E !== "" && F("");
        return;
      }
      P === -1 && F(e[0].value);
    }
  }, [E, b, e, P]), $(() => {
    !p || z !== void 0 || k(X(e, m, v));
  }, [m, e, v, k, p, z]);
  const f = _([]);
  f.current.length = e.length;
  const [le, V] = U(null), ie = B == null ? void 0 : typeof B == "number" ? `${B}px` : B, ce = "0.35em", se = "0.5em", ae = {
    width: "100%",
    maxWidth: ie,
    display: "flex",
    flexDirection: "column",
    gap: o && l ? "4px" : 0,
    fontSize: te,
    fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
    fontWeight: 600,
    ...ee ?? {}
  }, H = e.length > 0, K = I, ue = g, fe = N(K, 0.7, "0,0,0"), w = _(!1), s = G((t) => {
    if (i || !e.length) return;
    const r = pe(t, 0, Math.max(e.length - 1, 0)), n = e[r];
    if (!n) return;
    const d = n.value;
    d !== D && (b || F(d), p && k(d), C?.(d, n, r));
  }, [D, i, b, C, e, k, p]), de = G((t, r) => {
    if (!(i || !e.length)) {
      if (t.key === "ArrowRight" || t.key === "ArrowDown") {
        t.preventDefault();
        const n = (r + 1) % e.length;
        s(n), f.current[n]?.focus();
        return;
      }
      if (t.key === "ArrowLeft" || t.key === "ArrowUp") {
        t.preventDefault();
        const n = (r - 1 + e.length) % e.length;
        s(n), f.current[n]?.focus();
        return;
      }
      if (t.key === "Home") {
        t.preventDefault(), s(0), f.current[0]?.focus();
        return;
      }
      if (t.key === "End") {
        t.preventDefault();
        const n = e.length - 1;
        s(n), f.current[n]?.focus();
        return;
      }
      (t.key === " " || t.key === "Enter") && (t.preventDefault(), s(r));
    }
  }, [i, e.length, s]);
  $(() => {
    H || V(null);
  }, [H]), $(() => {
    if (typeof window > "u") return;
    const t = () => {
      w.current = !1;
    };
    return window.addEventListener("pointerup", t), window.addEventListener("pointercancel", t), () => {
      window.removeEventListener("pointerup", t), window.removeEventListener("pointercancel", t);
    };
  }, []);
  const R = {
    top: S?.top ?? !0,
    right: S?.right ?? !0,
    bottom: S?.bottom ?? !0,
    left: S?.left ?? !0
  };
  return /* @__PURE__ */ ge("div", { className: Z, style: ae, children: [
    o && l ? /* @__PURE__ */ x(
      "div",
      {
        style: {
          fontSize: "1em",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: fe
        },
        children: l
      }
    ) : null,
    /* @__PURE__ */ x(
      "div",
      {
        role: "radiogroup",
        "aria-label": T,
        "aria-disabled": i || void 0,
        style: {
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(e.length, 1)}, minmax(0, 1fr))`,
          borderRadius: 3,
          borderTop: R.top ? `1px solid ${y}` : "none",
          borderRight: R.right ? `1px solid ${y}` : "none",
          borderBottom: R.bottom ? `1px solid ${y}` : "none",
          borderLeft: R.left ? `1px solid ${y}` : "none",
          overflow: "hidden",
          backgroundColor: ne,
          touchAction: "none",
          opacity: i ? 0.6 : 1
        },
        children: H ? e.map((t, r) => {
          const n = r === oe, d = le === r && !i, M = n ? I : "transparent", me = d ? `linear-gradient(${W}, ${W}), ${M}` : M;
          return /* @__PURE__ */ x(
            "button",
            {
              ref: (u) => {
                f.current[r] = u;
              },
              type: "button",
              role: "radio",
              "aria-checked": n,
              tabIndex: n ? 0 : -1,
              disabled: i,
              onKeyDown: (u) => de(u, r),
              onClick: () => s(r),
              onPointerDown: (u) => {
                i || (w.current = !0, u.currentTarget.focus(), s(r));
              },
              onPointerUp: () => {
                w.current = !1;
              },
              onPointerEnter: () => {
                V(r), w.current && s(r);
              },
              onPointerLeave: () => {
                w.current || V((u) => u === r ? null : u);
              },
              style: {
                border: "none",
                borderRight: r < e.length - 1 ? `1px solid ${y}` : "none",
                background: me,
                color: n ? ue : K,
                fontSize: "inherit",
                fontFamily: "inherit",
                fontWeight: 600,
                padding: `${ce} ${se}`,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: i ? "not-allowed" : "pointer",
                position: "relative",
                userSelect: "none",
                transition: "background 120ms ease, color 120ms ease",
                outline: "none",
                height: "100%"
              },
              children: /* @__PURE__ */ x("span", { style: { lineHeight: 1 }, children: t.label })
            },
            t.value
          );
        }) : /* @__PURE__ */ x(
          "div",
          {
            style: {
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: g,
              opacity: 0.7
            },
            children: "No options"
          }
        )
      }
    )
  ] });
}
export {
  Pe as S
};
//# sourceMappingURL=SegmentBar-DTdbMbCH.js.map
