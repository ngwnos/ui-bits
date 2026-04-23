import { jsx as b } from "react/jsx-runtime";
import { createContext as l, useContext as d, useId as g, useCallback as u, useSyncExternalStore as C } from "react";
const p = l(null);
function m() {
  return d(p);
}
const S = l({ autoIds: !1 });
function h({
  autoIds: t = !1,
  prefix: n,
  children: e
}) {
  return /* @__PURE__ */ b(S.Provider, { value: { autoIds: t, prefix: n }, children: e });
}
function v() {
  return d(S);
}
function i(t) {
  return t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function I(t, n) {
  return t ? `${t.replace(/\.+$/, "")}.${n}` : n;
}
function z(t, n, e) {
  const { autoIds: r, prefix: o } = v(), s = g();
  if (t) return t;
  if (!r) return;
  const c = i(n ?? e ?? s) || i(s) || "control";
  return I(o, c);
}
function P(t, n) {
  const { autoIds: e, prefix: r } = v();
  if (t) return t;
  if (!e) return;
  const o = n ? i(n) : "";
  return o ? I(r, o) : r;
}
function V(t, n) {
  const e = m(), r = u(() => {
    if (!(!e || !t))
      return e.getState()[t];
  }, [e, t]), o = u((a) => !e || !t ? () => {
  } : e.subscribe(a), [e, t]), s = C(o, r, r), f = s === void 0 ? n : s, c = u((a) => {
    !e || !t || e.setValue(t, a);
  }, [e, t]);
  return [f, c];
}
function j() {
  const t = m(), n = u(() => t ? t.getState() : null, [t]), e = u((r) => t ? t.subscribe(r) : () => {
  }, [t]);
  return C(e, n, n);
}
export {
  h as C,
  v as a,
  z as b,
  P as c,
  V as d,
  j as e,
  p as f,
  m as u
};
//# sourceMappingURL=hooks-KNH81MTH.js.map
