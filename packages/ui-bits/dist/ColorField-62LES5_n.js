import { jsxs as ce, jsx as w } from "react/jsx-runtime";
import n from "react";
import { createPortal as Ue } from "react-dom";
import { u as Ve } from "./panelGap-DjV8XIAA.js";
import { w as F } from "./warnOnceDev-BPubHnZA.js";
import { C as de } from "./ColorFieldPicker-CkngSmel.js";
import { C as Oe } from "./ColorPicker-MnwzfDC5.js";
import { L as ue } from "./LFOSlider-C8Ho5u8z.js";
import { b as fe, d as he } from "./hooks-KNH81MTH.js";
const We = "var(--ui-bits-color-a, #2f2f2f)", je = "var(--ui-bits-color-b, #f0f0f0)", J = "#ffffff", ve = 255, Ke = 1, Ge = 0.35, Ye = 1, qe = 6;
function Je(o) {
  if (o != null)
    return typeof o == "number" ? `${o}px` : o;
}
function pe(o) {
  const t = o * (Ke + Ge * 2);
  return Math.round(t + Ye * 2);
}
function x(o) {
  const t = o.trim(), r = /^#([0-9a-fA-F]{3})$/, l = /^#([0-9a-fA-F]{6})$/, c = t.match(r);
  return c ? `#${c[1].split("").map((u) => u + u).join("")}` : l.test(t) ? t : null;
}
function Qe(o) {
  const t = x(o);
  if (!t) return null;
  const r = t.slice(1), l = parseInt(r.slice(0, 2), 16), c = parseInt(r.slice(2, 4), 16), u = parseInt(r.slice(4, 6), 16);
  return [l, c, u].some((v) => Number.isNaN(v)) ? null : { r: l, g: c, b: u };
}
function Q(o) {
  return Number.isFinite(o) ? Math.min(255, Math.max(0, Math.round(o))) : ve;
}
function be(o) {
  return Number.isFinite(o) ? Math.min(16777215, Math.max(0, Math.round(o))) : 0;
}
function Ce(o) {
  const t = x(o);
  if (!t) return null;
  const r = t.slice(1), l = Number.parseInt(r, 16);
  return Number.isNaN(l) ? null : l;
}
function me(o) {
  return `#${be(o).toString(16).padStart(6, "0")}`;
}
function Xe(o) {
  const t = o.trim();
  if (!t) return null;
  const r = t.startsWith("#") ? t : `#${t}`, l = x(r);
  return l ? Ce(l) : null;
}
const Ze = n.forwardRef((o, t) => {
  const {
    value: r,
    defaultValue: l = J,
    onChange: c,
    label: u = "Color",
    alpha: v,
    defaultAlpha: X = ve,
    onAlphaChange: Z,
    alphaControlId: ge,
    colorA: we,
    colorB: xe,
    borderStyle: Ae,
    pickerDisplay: Se = "inline",
    fontSize: Le,
    pickerHeightUnits: Ee,
    width: Ie,
    ariaLabel: ye,
    controlId: Fe,
    className: $e,
    style: ke,
    ...Re
  } = o, $ = Ve(), k = u.trim(), f = ye ?? k, A = fe(Fe, f), s = A ?? (k || "unlabeled"), [T, R] = he(A), S = A !== void 0 && r === void 0, b = S ? T : r, _ = b !== void 0, P = fe(
    ge,
    f ? `${f} alpha` : void 0
  ), [N, z] = he(P), L = P !== void 0 && v === void 0, ee = L ? N : v, U = ee !== void 0, V = x(l), a = Le ?? $?.fontSize ?? 12, E = we ?? $?.colorA ?? We, I = xe ?? $?.colorB ?? je, y = Ae ?? $?.borderStyle ?? "a", i = Se === "popup", Pe = Je(Ie), O = Math.max(1, Math.round(Ee ?? qe)), h = V ?? J, [ze, De] = n.useState(h), W = b === void 0 ? void 0 : x(b), p = _ ? W ?? h : ze, He = be(Ce(p) ?? 0), [Me, Be] = n.useState(() => Q(X)), D = Q(
    U ? ee ?? X : Me
  );
  n.useEffect(() => {
    A === void 0 || r === void 0 || F(
      `ColorField.control-id-controlled-value.${s}`,
      "[ui-bits] ColorField received both `controlId` and controlled `value`. The control store binding is ignored while `value` is controlled."
    );
  }, [A, r, s]), n.useEffect(() => {
    P === void 0 || v === void 0 || F(
      `ColorField.alpha-control-id-controlled-value.${s}`,
      "[ui-bits] ColorField received both `alphaControlId` and controlled `alpha`. The alpha control store binding is ignored while `alpha` is controlled."
    );
  }, [v, P, s]), n.useEffect(() => {
    V === null && F(
      `ColorField.invalid-default.${s}`,
      `[ui-bits] ColorField expected \`defaultValue\` to be a hex color (#rgb or #rrggbb). Received "${l}". Falling back to ${J}.`
    );
  }, [l, V, s]), n.useEffect(() => {
    b === void 0 || W !== null || F(
      `ColorField.invalid-controlled-value.${s}`,
      `[ui-bits] ColorField expected \`value\` to be a hex color (#rgb or #rrggbb). Received "${b}". Falling back to ${h}.`
    );
  }, [h, W, b, s]), n.useEffect(() => {
    !S || T !== void 0 || R(p);
  }, [p, R, S, T]), n.useEffect(() => {
    !L || N !== void 0 || z(D);
  }, [D, z, L, N]);
  const j = n.useCallback((e) => {
    _ || De(e), S && R(e), c?.(e);
  }, [_, c, R, S]), Te = n.useCallback((e) => {
    U || Be(e), L && z(e), Z?.(e);
  }, [U, Z, z, L]), K = n.useCallback((e) => {
    const d = x(e);
    d === null && F(
      `ColorField.invalid-picker-output.${s}`,
      `[ui-bits] ColorFieldPicker returned a non-hex value "${e}". Falling back to ${h}.`
    ), j(d ?? h);
  }, [j, h, s]), oe = Math.round(a * 0.5), te = Math.round(a * 7), ne = y === "b" ? "b" : y === "none" ? "none" : "a", G = Qe(p) ?? { r: 255, g: 255, b: 255 }, _e = `rgba(${G.r}, ${G.g}, ${G.b}, ${D / 255})`, Y = pe(a) * O, H = pe(a), M = n.useRef(null), re = n.useRef(null), [m, q] = n.useState(!1), [B, le] = n.useState(null);
  n.useEffect(() => {
    if (!i || !m) return;
    const e = (d) => {
      const C = d.target;
      C && (M.current?.contains(C) || re.current?.contains(C) || q(!1));
    };
    return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
  }, [m, i]);
  const ie = n.useCallback(() => {
    if (!M.current || typeof window > "u") return;
    const e = M.current.getBoundingClientRect(), d = e.top + H + Y > window.innerHeight ? "above" : "below", C = d === "above" ? e.top - Y - H : e.bottom + H, se = e.left, ae = e.width;
    le((g) => g && g.top === C && g.left === se && g.width === ae && g.placement === d ? g : {
      top: C,
      left: se,
      width: ae,
      placement: d
    });
  }, [Y, H]);
  n.useEffect(() => {
    if (!i || !m || typeof window > "u") {
      le(null);
      return;
    }
    const e = () => ie();
    return e(), window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
      window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
    };
  }, [m, ie, i]), n.useEffect(() => {
    i || m && q(!1);
  }, [m, i]);
  const Ne = n.useCallback((e) => {
    M.current = e, typeof t == "function" ? t(e) : t && (t.current = e);
  }, [t]);
  return /* @__PURE__ */ ce(
    "div",
    {
      ref: Ne,
      className: [
        "ui-bits-color-field",
        $e
      ].filter(Boolean).join(" "),
      style: {
        width: Pe,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: i ? 0 : oe,
        position: "relative",
        overflow: "visible",
        ...ke ?? {}
      },
      ...Re,
      children: [
        /* @__PURE__ */ ce("div", { style: { display: "flex", alignItems: "center", gap: oe }, children: [
          /* @__PURE__ */ w(
            Oe,
            {
              value: p,
              onChange: K,
              nativePicker: !1,
              colorA: E,
              colorB: I,
              borderStyle: y,
              fontSize: a,
              style: {
                background: _e,
                cursor: i ? "pointer" : "default"
              },
              "aria-label": f ? `${f} color` : "Color swatch",
              onClick: i ? () => q((e) => !e) : void 0
            }
          ),
          /* @__PURE__ */ w(
            ue,
            {
              label: k,
              ariaLabel: f ? `${f} hex` : "Hex color value",
              showLabel: k.length > 0,
              variant: "full",
              min: 0,
              max: 16777215,
              step: 1,
              value: He,
              onUserChange: (e) => j(me(e)),
              width: "100%",
              colorA: E,
              colorB: I,
              border: ne,
              fontSize: a,
              showLfoControls: !1,
              formatEditingValue: !0,
              formatDisplayValue: (e) => me(e),
              parseDisplayValue: (e) => Xe(e),
              style: { flex: 1, minWidth: 0 }
            }
          ),
          /* @__PURE__ */ w(
            ue,
            {
              label: "A",
              showLabel: !0,
              variant: "basic",
              min: 0,
              max: 255,
              step: 1,
              value: D,
              onUserChange: (e) => Te(Q(e)),
              width: te,
              colorA: E,
              colorB: I,
              border: ne,
              fontSize: a,
              formatDisplayValue: (e) => `${Math.round(e)}`,
              style: { flex: `0 0 ${te}px` }
            }
          )
        ] }),
        i ? null : /* @__PURE__ */ w(
          de,
          {
            value: p,
            onChange: K,
            colorA: E,
            colorB: I,
            borderStyle: y,
            fontSize: a,
            heightUnits: O,
            width: "100%"
          }
        ),
        i && m && B && typeof document < "u" ? Ue(
          /* @__PURE__ */ w(
            "div",
            {
              ref: re,
              style: {
                position: "fixed",
                top: B.top,
                left: B.left,
                width: B.width,
                zIndex: 1e3
              },
              children: /* @__PURE__ */ w(
                de,
                {
                  value: p,
                  onChange: K,
                  colorA: E,
                  colorB: I,
                  borderStyle: y,
                  fontSize: a,
                  heightUnits: O,
                  width: "100%",
                  style: { boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }
                }
              )
            }
          ),
          document.body
        ) : null
      ]
    }
  );
});
Ze.displayName = "ColorField";
export {
  Ze as C
};
//# sourceMappingURL=ColorField-62LES5_n.js.map
