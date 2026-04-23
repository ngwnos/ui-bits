import { jsx as i } from "react/jsx-runtime";
import t from "react";
const n = t.createContext(!1);
function d({
  suspended: e = !1,
  children: o
}) {
  const s = t.useContext(n) || e;
  return /* @__PURE__ */ i(n.Provider, { value: s, children: o });
}
function p(e) {
  return t.useContext(n) || !!e;
}
export {
  d as A,
  p as u
};
//# sourceMappingURL=animationSuspension-BEQdvvQj.js.map
