import { jsxs as O, jsx as c } from "react/jsx-runtime";
import P, { createContext as ne, useContext as oe } from "react";
import { u as re } from "./panelGap-DjV8XIAA.js";
import { I as R } from "./IconButton-BvvMagK1.js";
import { L as se } from "./ListRow-BKWOKtFA.js";
import { L as ie } from "./ListSurface-Bqnlmbhz.js";
import { Save as ae, ClipboardCopy as le } from "lucide-react";
import { T as ce } from "./TextInput-DYCLlEXP.js";
import { e as ue } from "./hooks-KNH81MTH.js";
const de = ne(null);
function pe() {
  return oe(de);
}
function fe(e, n = {}) {
  const { includeIds: r, excludeIds: s, filter: i } = n, a = r ? new Set(r) : null, g = s ? new Set(s) : null, S = {};
  return Object.entries(e).forEach(([u, h]) => {
    g?.has(u) || a && !a.has(u) || i && !i(u, h) || h !== void 0 && (S[u] = h);
  }), S;
}
function De(e, n, r = {}) {
  const { clearMissing: s = !1 } = r;
  s && Object.keys(e.getState()).forEach((a) => {
    a in n || e.setValue(a, void 0);
  }), Object.entries(n).forEach(([i, a]) => {
    e.setValue(i, a);
  });
}
const me = "#f0f0f0", he = "#2f2f2f", ye = 1, M = 0.35, be = 1;
function ge(e) {
  if (e != null)
    return typeof e == "number" ? `${e}px` : e;
}
function Se(e) {
  const n = e * (ye + M * 2);
  return Math.round(n + be * 2);
}
function $(e) {
  if (!e || typeof e != "object") return !1;
  const n = Object.getPrototypeOf(e);
  return n === Object.prototype || n === null;
}
function w(e, n) {
  if (Object.is(e, n)) return !0;
  if (Array.isArray(e) && Array.isArray(n))
    return e.length !== n.length ? !1 : e.every((r, s) => w(r, n[s]));
  if ($(e) && $(n)) {
    const r = Object.keys(e), s = Object.keys(n);
    return r.length !== s.length ? !1 : r.every((i) => w(e[i], n[i]));
  }
  return !1;
}
function xe(e, n) {
  const r = Object.keys(e), s = Object.keys(n);
  return r.length !== s.length ? !1 : s.every((i) => w(e[i], n[i]));
}
const ve = P.forwardRef((e, n) => {
  const {
    presets: r,
    onSave: s,
    onSelect: i,
    onDelete: a,
    value: g,
    defaultValue: S = "",
    onValueChange: u,
    placeholder: h = "Preset name...",
    emptyLabel: V = "No presets saved",
    saveLabel: A = "Save",
    maxListHeight: k,
    colorA: z,
    colorB: H,
    fontSize: K,
    disabled: l = !1,
    className: T,
    style: F,
    ...W
  } = e, d = pe(), L = r ?? d?.presets ?? [], Y = s ?? d?.savePreset, q = i ?? d?.selectPreset, j = a ?? d?.deletePreset, x = ue(), y = P.useMemo(() => d?.getSnapshot ? d.getSnapshot() : x ? fe(x) : null, [d, x]), v = re(), f = z ?? v?.colorA ?? me, m = H ?? v?.colorB ?? he, p = K ?? v?.fontSize ?? 12, [G, B] = P.useState(S), C = g !== void 0, D = C ? g : G, b = Se(p), E = Math.round(p * M), _ = Math.round(p * 0.7), N = ge(k) ?? `${b * 6}px`, J = (t) => {
    const o = t.target.value;
    C || B(o), u?.(o);
  }, I = () => {
    const t = D.trim();
    !t || l || (Y?.(t), C || B(""), u?.(""));
  }, X = async () => {
    if (l || !y) return;
    const t = JSON.stringify(y, null, 2);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(t);
        return;
      }
    } catch {
    }
    const o = document.createElement("textarea");
    o.value = t, o.style.position = "fixed", o.style.opacity = "0", o.style.pointerEvents = "none", document.body.appendChild(o), o.focus(), o.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(o);
    }
  }, Q = (t) => {
    t.key === "Enter" && (t.preventDefault(), I());
  }, U = (t) => {
    l || q?.(t);
  }, Z = (t, o) => {
    t.stopPropagation(), !(l || o.readonly) && j?.(o);
  };
  return /* @__PURE__ */ O(
    "div",
    {
      ref: n,
      className: ["ui-bits-preset-manager", T].filter(Boolean).join(" "),
      style: {
        ...F ?? {},
        "--pm-color-a": f,
        "--pm-color-b": m,
        "--pm-row-height": `${b}px`,
        "--pm-padding-y": `${E}px`,
        "--pm-padding-x": `${_}px`,
        "--pm-max-height": N,
        "--ui-bits-list-max-height": N,
        "--ui-bits-list-row-min-height": `${b}px`,
        "--ui-bits-list-gap": "2px",
        "--ui-bits-list-scrollbar-color": f,
        "--ui-bits-list-row-height": `${b}px`,
        "--ui-bits-list-row-padding-x": `${_}px`,
        "--ui-bits-list-row-color-a": f,
        "--ui-bits-list-row-color-b": m,
        "--ui-bits-list-row-active-border": m,
        fontSize: p
      },
      ...W,
      children: [
        /* @__PURE__ */ O("div", { className: "ui-bits-preset-manager__input-row", children: [
          /* @__PURE__ */ c(
            ce,
            {
              value: D,
              onChange: J,
              onKeyDown: Q,
              placeholder: h,
              className: "ui-bits-preset-manager__input",
              colorA: f,
              colorB: m,
              borderStyle: "a",
              fontSize: p,
              padding: `${E}px ${_}px`,
              style: { height: b, flex: 1, minWidth: 0 },
              disabled: l,
              "aria-label": "Preset name"
            }
          ),
          /* @__PURE__ */ c(
            R,
            {
              colorA: f,
              colorB: m,
              borderStyle: "a",
              fontSize: p,
              behavior: "momentary",
              disabled: l,
              onClick: I,
              "aria-label": A,
              title: A,
              children: /* @__PURE__ */ c(ae, {})
            }
          ),
          /* @__PURE__ */ c(
            R,
            {
              colorA: f,
              colorB: m,
              borderStyle: "a",
              fontSize: p,
              behavior: "momentary",
              disabled: l || !y,
              onClick: X,
              "aria-label": "Copy preset",
              title: "Copy preset",
              children: /* @__PURE__ */ c(le, {})
            }
          )
        ] }),
        /* @__PURE__ */ c(
          ie,
          {
            className: "ui-bits-preset-manager__surface",
            listClassName: "ui-bits-preset-manager__list",
            columns: 2,
            isEmpty: L.length === 0,
            emptyState: V,
            children: L.map((t) => {
              const o = l, ee = !!(y && t.snapshot && xe(y, t.snapshot));
              return /* @__PURE__ */ O(
                se,
                {
                  className: "ui-bits-preset-manager__item",
                  active: ee,
                  disabled: o,
                  onSelect: () => U(t),
                  children: [
                    /* @__PURE__ */ c("span", { className: "ui-bits-preset-manager__name", children: t.name }),
                    j ? /* @__PURE__ */ c(
                      "button",
                      {
                        type: "button",
                        className: "ui-bits-preset-manager__delete",
                        onClick: (te) => Z(te, t),
                        disabled: o || t.readonly,
                        "aria-label": `Delete preset ${t.name}`,
                        title: t.readonly ? "Built-in preset" : "Delete preset",
                        children: "x"
                      }
                    ) : null
                  ]
                },
                t.id ?? t.name
              );
            })
          }
        )
      ]
    }
  );
});
ve.displayName = "PresetManager";
export {
  ve as P,
  De as a,
  de as b,
  fe as c,
  pe as u
};
//# sourceMappingURL=PresetManager-DL60FxGg.js.map
