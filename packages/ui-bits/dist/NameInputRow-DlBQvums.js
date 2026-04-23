import { jsxs as oe, jsx as r } from "react/jsx-runtime";
import o from "react";
import { Dice6 as te, Plus as ae } from "lucide-react";
import { u as ne } from "./panelGap-DjV8XIAA.js";
import { I as V } from "./IconButton-BvvMagK1.js";
import { T as le } from "./TextInput-DYCLlEXP.js";
const re = "#f0f0f0", ie = "#2f2f2f", se = 1, x = 0.35, ce = 1;
function ue(n) {
  const u = n * (se + x * 2);
  return Math.round(u + ce * 2);
}
const de = (n) => n.trim(), fe = o.forwardRef((n, u) => {
  const {
    value: y,
    defaultValue: k = "",
    onValueChange: z,
    onCreate: i,
    onRandomize: l,
    placeholder: E = "Name...",
    createLabel: v = "Create",
    randomizeLabel: B = "Randomize",
    inputAriaLabel: H = "Name",
    clearOnCreate: S = !0,
    randomizeMode: I = "replace",
    appendSeparator: A = " ",
    normalize: O = de,
    colorA: T,
    colorB: M,
    borderStyle: d = "a",
    fontSize: P,
    disabled: f = !1,
    className: $,
    style: K,
    ...j
  } = n, m = ne(), s = T ?? m?.colorA ?? re, p = M ?? m?.colorB ?? ie, t = P ?? m?.fontSize ?? 12, [F, W] = o.useState(k), [Y, L] = o.useState(!1), [G, _] = o.useState(!1), w = o.useRef(null), h = y !== void 0, c = h ? y : F, X = ue(t), q = Math.round(t * x), J = Math.round(t * 0.7), C = O(c), N = Y || G, R = !f && !N && !!i && C.length > 0, g = !f && !N && !!l, a = o.useCallback((e) => {
    h || W(e), z?.(e);
  }, [h, z]), Q = o.useCallback((e) => {
    a(e.target.value);
  }, [a]), b = o.useCallback(async () => {
    if (!(!R || !i)) {
      L(!0);
      try {
        await i(C), S && a("");
      } finally {
        L(!1);
      }
    }
  }, [R, S, a, C, i]), U = o.useCallback(async () => {
    if (!(!g || !l)) {
      _(!0);
      try {
        const e = await l();
        if (typeof e != "string" || e.length === 0) return;
        const D = w.current?.value ?? c;
        if (I === "append") {
          const ee = D.length > 0 ? `${D}${A}${e}` : e;
          a(ee);
          return;
        }
        a(e);
      } finally {
        _(!1);
      }
    }
  }, [A, g, a, l, I, c]), Z = o.useCallback((e) => {
    e.key === "Enter" && (e.preventDefault(), b());
  }, [b]);
  return /* @__PURE__ */ oe(
    "div",
    {
      ref: u,
      className: ["ui-bits-name-input-row", $].filter(Boolean).join(" "),
      style: {
        color: s,
        fontSize: t,
        ...K ?? {}
      },
      ...j,
      children: [
        /* @__PURE__ */ r(
          le,
          {
            ref: w,
            value: c,
            onChange: Q,
            onKeyDown: Z,
            placeholder: E,
            className: "ui-bits-name-input-row__input",
            colorA: s,
            colorB: p,
            borderStyle: d,
            fontSize: t,
            padding: `${q}px ${J}px`,
            style: { height: X, flex: 1, minWidth: 0 },
            disabled: f,
            "aria-label": H
          }
        ),
        l ? /* @__PURE__ */ r(
          V,
          {
            colorA: s,
            colorB: p,
            borderStyle: d,
            fontSize: t,
            behavior: "momentary",
            disabled: !g,
            onClick: () => {
              U();
            },
            "aria-label": B,
            title: B,
            children: /* @__PURE__ */ r(te, {})
          }
        ) : null,
        /* @__PURE__ */ r(
          V,
          {
            colorA: s,
            colorB: p,
            borderStyle: d,
            fontSize: t,
            behavior: "momentary",
            disabled: !R,
            onClick: () => {
              b();
            },
            "aria-label": v,
            title: v,
            children: /* @__PURE__ */ r(ae, {})
          }
        )
      ]
    }
  );
});
fe.displayName = "NameInputRow";
export {
  fe as N
};
//# sourceMappingURL=NameInputRow-DlBQvums.js.map
