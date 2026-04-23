import { jsxs as D, jsx as d } from "react/jsx-runtime";
import n from "react";
import { CircleDot as ne, Circle as ae } from "lucide-react";
import { u as de } from "./panelGap-DjV8XIAA.js";
import { L as ce } from "./ListRow-BKWOKtFA.js";
import { L as ue } from "./ListSurface-Bqnlmbhz.js";
import { b as fe, d as be } from "./hooks-KNH81MTH.js";
const he = "#2f2f2f", me = "#f0f0f0", ve = 1, _e = 0.35, pe = 1;
function F(t) {
  if (t != null)
    return typeof t == "number" ? `${t}px` : t;
}
function ge(t) {
  const l = t * (ve + _e * 2);
  return Math.round(l + pe * 2);
}
function B(t, l, s) {
  return s !== void 0 ? s : l !== void 0 ? l : t.find((a) => !a.disabled)?.value ?? "";
}
function K(t, l, s) {
  if (!t.length) return -1;
  for (let a = 1; a <= t.length; a += 1) {
    const _ = (l + s * a + t.length) % t.length;
    if (!t[_]?.disabled) return _;
  }
  return -1;
}
function k(t, l) {
  if (!t.length) return -1;
  if (!l)
    return t.findIndex((s) => !s.disabled);
  for (let s = t.length - 1; s >= 0; s -= 1)
    if (!t[s]?.disabled) return s;
  return -1;
}
const Le = n.forwardRef((t, l) => {
  const {
    label: s,
    showLabel: a = !1,
    ariaLabel: _,
    options: e,
    value: H,
    defaultValue: u,
    onChange: V,
    emptyLabel: T = "No options",
    columns: I = 1,
    maxListHeight: j,
    colorA: P,
    colorB: U,
    borderStyle: W,
    fontSize: G,
    width: X,
    disabled: c = !1,
    controlId: Y,
    className: q,
    style: J,
    ...Q
  } = t, p = de(), E = G ?? p?.fontSize ?? 12, g = P ?? p?.colorA ?? he, y = U ?? p?.colorB ?? me, M = W ?? p?.borderStyle ?? "a", O = M === "a" ? g : M === "b" ? y : "transparent", z = _ ?? s, $ = fe(Y, s, z), [C, L] = be($), f = $ !== void 0 && H === void 0, b = f ? C : H, R = ge(E), Z = Math.round(E * 0.7), ee = F(j) ?? `${R * 8}px`, te = F(X), ie = Number.isFinite(I) && I > 0 ? Math.floor(I) : 1, h = b !== void 0, [m, x] = n.useState(() => B(e, u, b)), v = h ? b ?? "" : m, se = n.useMemo(() => e.findIndex((i) => i.value === v), [v, e]), re = n.useMemo(() => k(e, !1), [e]), S = n.useRef([]);
  S.current.length = e.length, n.useEffect(() => {
    if (h) return;
    if (!e.length) {
      m !== "" && x("");
      return;
    }
    if (!e.some((o) => !o.disabled)) {
      m !== "" && x("");
      return;
    }
    e.some((o) => o.value === m && !o.disabled) || x(B(e, u));
  }, [u, m, h, e]), n.useEffect(() => {
    !f || C !== void 0 || L(B(e, u, b));
  }, [u, e, b, L, f, C]);
  const A = n.useCallback((i) => {
    if (c) return;
    const r = e[i];
    !r || r.disabled || r.value !== v && (h || x(r.value), f && L(r.value), V?.(r.value, r, i));
  }, [v, c, h, V, e, L, f]), oe = n.useCallback((i, r) => {
    if (c || !e.length) return;
    let o = -1;
    i.key === "ArrowDown" || i.key === "ArrowRight" ? o = K(e, r, 1) : i.key === "ArrowUp" || i.key === "ArrowLeft" ? o = K(e, r, -1) : i.key === "Home" ? o = k(e, !1) : i.key === "End" && (o = k(e, !0)), !(o < 0) && (i.preventDefault(), A(o), S.current[o]?.focus());
  }, [c, A, e]);
  return /* @__PURE__ */ D(
    "div",
    {
      ref: l,
      className: ["ui-bits-radio-list", q].filter(Boolean).join(" "),
      style: {
        ...J ?? {},
        width: te ?? "100%",
        "--ui-bits-list-max-height": ee,
        "--ui-bits-list-row-min-height": `${R}px`,
        "--ui-bits-list-gap": "2px",
        "--ui-bits-list-scrollbar-color": g,
        "--ui-bits-list-row-height": `${R}px`,
        "--ui-bits-list-row-padding-x": `${Z}px`,
        "--ui-bits-list-row-color-a": O,
        "--ui-bits-list-row-color-b": y,
        "--ui-bits-radio-list-active-bg": g,
        "--ui-bits-radio-list-active-color": y,
        "--ui-bits-radio-list-active-border": O,
        color: g,
        fontSize: E
      },
      ...Q,
      children: [
        a && s ? /* @__PURE__ */ d("div", { className: "ui-bits-radio-list__label", children: s }) : null,
        /* @__PURE__ */ d(
          "div",
          {
            className: "ui-bits-radio-list__group",
            role: "radiogroup",
            "aria-label": z,
            "aria-disabled": c || void 0,
            children: /* @__PURE__ */ d(
              ue,
              {
                className: "ui-bits-radio-list__surface",
                listClassName: "ui-bits-radio-list__list",
                columns: ie,
                isEmpty: e.length === 0,
                emptyState: T,
                children: e.map((i, r) => {
                  const o = c || i.disabled === !0, w = i.value === v, le = o ? -1 : w || se < 0 && r === re ? 0 : -1;
                  return /* @__PURE__ */ D(
                    ce,
                    {
                      ref: (N) => {
                        S.current[r] = N;
                      },
                      role: "radio",
                      "aria-checked": w,
                      className: "ui-bits-radio-list__item",
                      active: w,
                      disabled: o,
                      tabIndex: le,
                      onSelect: () => A(r),
                      onKeyDown: (N) => oe(N, r),
                      children: [
                        w ? /* @__PURE__ */ d(ne, { className: "ui-bits-radio-list__icon", "aria-hidden": "true" }) : /* @__PURE__ */ d(ae, { className: "ui-bits-radio-list__icon", "aria-hidden": "true" }),
                        /* @__PURE__ */ D("span", { className: "ui-bits-radio-list__content", children: [
                          /* @__PURE__ */ d("span", { className: "ui-bits-radio-list__name", children: i.label }),
                          i.description ? /* @__PURE__ */ d("span", { className: "ui-bits-radio-list__description", children: i.description }) : null
                        ] })
                      ]
                    },
                    i.value
                  );
                })
              }
            )
          }
        )
      ]
    }
  );
});
Le.displayName = "RadioList";
export {
  Le as R
};
//# sourceMappingURL=RadioList-Cr2SL56l.js.map
