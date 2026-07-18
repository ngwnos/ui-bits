import { jsx as p } from "react/jsx-runtime";
import { useRef as F, useMemo as d, useEffect as u, createContext as x, useContext as v } from "react";
const i = x(null);
let s = -1 / 0;
const A = ({ children: t }) => {
  const e = F(/* @__PURE__ */ new Set()), a = d(() => ({
    subscribe(r) {
      return e.current.add(r), () => e.current.delete(r);
    }
  }), []);
  return u(() => {
    let r = 0, c = performance.now();
    const n = (o) => {
      const m = o / 1e3, b = (o - c) / 1e3;
      c = o, e.current.forEach((f) => {
        try {
          f(m, b);
        } catch (l) {
          o - s >= 1e3 && (s = o, console.error("ui-bits: frame subscriber threw", l));
        }
      }), r = requestAnimationFrame(n);
    };
    return r = requestAnimationFrame(n), () => cancelAnimationFrame(r);
  }, []), /* @__PURE__ */ p(i.Provider, { value: a, children: t });
};
function C(t) {
  const e = v(i);
  u(() => {
    if (!(!e || !t))
      return e.subscribe(t);
  }, [e, t]);
}
export {
  A as F,
  C as u
};
//# sourceMappingURL=frameLoop-BrwpA-Gk.js.map
