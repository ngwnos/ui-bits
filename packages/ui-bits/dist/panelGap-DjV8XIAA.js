import e from "react";
const r = 8, a = e.createContext(null), u = e.createContext(null), s = e.createContext(null), c = e.createContext(null), o = (t) => typeof t == "number" && Number.isFinite(t);
function l(t) {
  const n = e.useContext(a);
  return o(t) ? Math.max(0, t) : o(n) ? Math.max(0, n) : r;
}
function i() {
  return e.useContext(s);
}
function C() {
  return e.useContext(u);
}
function f() {
  return e.useContext(c);
}
export {
  c as P,
  a as V,
  l as a,
  i as b,
  C as c,
  u as d,
  f as u
};
//# sourceMappingURL=panelGap-DjV8XIAA.js.map
