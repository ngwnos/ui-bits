const t = {}, n = /* @__PURE__ */ new Set();
function r() {
  if (typeof import.meta < "u" && typeof t < "u")
    return !1;
  const e = typeof globalThis < "u" && "process" in globalThis && typeof globalThis.process?.env?.NODE_ENV == "string" ? globalThis.process?.env?.NODE_ENV : void 0;
  return e !== void 0 ? e !== "production" : !0;
}
function i(e, o) {
  r() && (n.has(e) || (n.add(e), console.warn(o)));
}
export {
  i as w
};
//# sourceMappingURL=warnOnceDev-BPubHnZA.js.map
