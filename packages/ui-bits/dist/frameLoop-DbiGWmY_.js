import { jsx as f } from "react/jsx-runtime";
import { useRef as l, useMemo as F, useEffect as s, createContext as d, useContext as x } from "react";
const u = d(null), A = ({ children: t }) => {
  const e = l(/* @__PURE__ */ new Set()), a = F(() => ({
    subscribe(r) {
      return e.current.add(r), () => e.current.delete(r);
    }
  }), []);
  return s(() => {
    let r = 0, n = performance.now();
    const c = (o) => {
      const i = o / 1e3, m = (o - n) / 1e3;
      n = o, e.current.forEach((p) => p(i, m)), r = requestAnimationFrame(c);
    };
    return r = requestAnimationFrame(c), () => cancelAnimationFrame(r);
  }, []), /* @__PURE__ */ f(u.Provider, { value: a, children: t });
};
function C(t) {
  const e = x(u);
  s(() => {
    if (!(!e || !t))
      return e.subscribe(t);
  }, [e, t]);
}
export {
  A as F,
  C as u
};
//# sourceMappingURL=frameLoop-DbiGWmY_.js.map
