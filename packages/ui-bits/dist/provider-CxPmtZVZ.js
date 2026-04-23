import { f as q } from "./flexoki-DpJ9ZEpp.js";
import { jsx as h } from "react/jsx-runtime";
import c from "react";
import { w as W } from "./warnOnceDev-BPubHnZA.js";
import { c as j, a as X, b as Y } from "./PresetManager-DL60FxGg.js";
import { f as Z, C as F, u as _ } from "./hooks-KNH81MTH.js";
function G(e = {}) {
  let n = { ...e };
  const i = /* @__PURE__ */ new Set(), a = () => {
    i.forEach((o) => o());
  };
  return {
    getState: () => n,
    setValue: (o, u) => {
      const S = n[o];
      Object.is(S, u) || (n = { ...n, [o]: u }, a());
    },
    subscribe: (o) => (i.add(o), () => i.delete(o))
  };
}
function K({
  store: e,
  autoIds: n = !1,
  controlIdPrefix: i,
  children: a
}) {
  const o = c.useRef(null);
  o.current || (o.current = G());
  const u = e ?? o.current;
  return /* @__PURE__ */ h(Z.Provider, { value: u, children: /* @__PURE__ */ h(F, { autoIds: n, prefix: i, children: a }) });
}
const ee = [
  "base",
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "magenta"
], fe = ee.map((e) => ({
  key: `${e}-600-150`,
  colorA: q[e][600],
  colorB: q[e][150]
}));
function te(e) {
  return e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `preset-${Date.now()}`;
}
function D(e) {
  if (!e || typeof e != "object") return !1;
  const n = Object.getPrototypeOf(e);
  return n === Object.prototype || n === null;
}
function re(e) {
  if (!D(e)) return null;
  const n = typeof e.name == "string" ? e.name.trim() : "";
  if (!n) return null;
  const i = D(e.snapshot) ? e.snapshot : null;
  if (!i) return null;
  const a = typeof e.id == "string" ? e.id : void 0, o = !!e.readonly;
  return {
    id: a,
    name: n,
    snapshot: i,
    readonly: o
  };
}
function ne(e) {
  if (!e) return [];
  try {
    const n = JSON.parse(e);
    return Array.isArray(n) ? n.map(re).filter(Boolean) : [];
  } catch {
    return [];
  }
}
function oe(e, n) {
  const i = /* @__PURE__ */ new Set(), a = [], o = (u) => {
    const S = (u.id ?? u.name).toLowerCase();
    i.has(S) || (i.add(S), a.push(u));
  };
  return e.forEach(o), n.forEach(o), a;
}
function de({
  children: e,
  presets: n,
  defaultPresets: i = [],
  onPresetsChange: a,
  controlStore: o,
  autoIds: u = !0,
  controlIdPrefix: S,
  storageKey: w,
  storage: Q,
  snapshotOptions: y,
  applyOptions: I,
  includeDefaultsPreset: b = !0,
  defaultsPresetName: x = "Defaults"
}) {
  const O = _(), R = c.useRef(null);
  R.current || (R.current = G());
  const l = o ?? O ?? R.current, A = O !== l, [E, L] = c.useState(i), d = n !== void 0, p = d ? n : E;
  c.useEffect(() => {
    !d || a || W(
      "PresetStoreProvider.controlled-without-onPresetsChange",
      "[ui-bits] PresetStoreProvider is controlled (`presets` provided) without `onPresetsChange`. Save/delete actions cannot update parent state."
    );
  }, [d, a]);
  const m = c.useCallback((t) => {
    if (!d) {
      L((s) => {
        const f = typeof t == "function" ? t(s) : t;
        return a?.(f), f;
      });
      return;
    }
    const r = typeof t == "function" ? t(p) : t;
    a?.(r);
  }, [d, a, p]), B = c.useCallback((t) => {
    const r = t.trim();
    if (!r) return;
    const s = j(l.getState(), y);
    m((f) => {
      const C = f.findIndex((v) => v.name.toLowerCase() === r.toLowerCase());
      if (C >= 0) {
        const v = f[C];
        if (v.readonly) return f;
        const H = [...f];
        return H[C] = { ...v, name: r, snapshot: s }, H;
      }
      return [{
        id: te(r),
        name: r,
        snapshot: s
      }, ...f];
    });
  }, [l, m, y]), M = c.useCallback((t) => {
    t.readonly || m((r) => r.filter((s) => (s.id ?? s.name) !== (t.id ?? t.name)));
  }, [m]), $ = c.useCallback((t) => {
    t.snapshot && X(l, t.snapshot, I);
  }, [I, l]), P = Q ?? (typeof window < "u" ? window.localStorage : null), z = c.useRef(!1), J = c.useMemo(() => {
    const t = /* @__PURE__ */ new Set();
    return i.forEach((r) => {
      t.add((r.id ?? r.name).toLowerCase());
    }), t;
  }, [i]);
  c.useEffect(() => {
    if (!w || d || !P) return;
    const t = ne(P.getItem(w));
    t.length && L((r) => oe(t, r)), z.current = !0;
  }, [d, P, L, w]), c.useEffect(() => {
    if (!w || d || !P || !z.current) return;
    const t = E.filter((r) => {
      if (r.readonly) return !1;
      const s = (r.id ?? r.name).toLowerCase();
      return !J.has(s);
    });
    try {
      P.setItem(w, JSON.stringify(t));
    } catch {
    }
  }, [J, E, d, P, w]);
  const g = c.useRef(null);
  c.useEffect(() => {
    if (!b || g.current || typeof window > "u") return;
    const t = () => {
      const s = j(l.getState(), y);
      Object.keys(s).length && (g.current = {
        id: "defaults",
        name: x,
        readonly: !0,
        snapshot: s
      }, m((f) => {
        const C = f.filter((k) => (k.id ?? k.name) !== "defaults" && k.name !== x);
        return [g.current, ...C];
      }));
    }, r = window.setTimeout(t, 0);
    return () => {
      window.clearTimeout(r);
    };
  }, [x, b, l, m, y]);
  const N = c.useMemo(() => {
    const t = g.current;
    if (!b || !t) return p;
    const r = p.filter((s) => s !== t);
    return [t, ...r.filter((s) => (s.id ?? s.name) !== t.id)];
  }, [b, p]), T = c.useCallback(() => j(l.getState(), y), [l, y]), U = c.useMemo(() => ({
    presets: N,
    savePreset: B,
    selectPreset: $,
    deletePreset: M,
    setPresets: m,
    getSnapshot: T
  }), [M, T, N, B, $, m]), V = /* @__PURE__ */ h(Y.Provider, { value: U, children: A ? e : /* @__PURE__ */ h(F, { autoIds: u, prefix: S, children: e }) });
  return A ? /* @__PURE__ */ h(
    K,
    {
      store: l,
      autoIds: u,
      controlIdPrefix: S,
      children: V
    }
  ) : V;
}
export {
  K as C,
  de as P,
  G as c,
  fe as s
};
//# sourceMappingURL=provider-CxPmtZVZ.js.map
