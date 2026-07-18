function r(s, n, t) {
  return Math.max(n, Math.min(t, s));
}
function w(s, n, t, a = 1 / 0) {
  if (t <= 0 || !isFinite(t)) return s;
  const e = Math.round((s - n) / t);
  return r(n + e * t, n, a);
}
function g(s, n, t) {
  return !isFinite(s) || t === n ? 0.5 : r((s - n) / (t - n), 0, 1);
}
function P(s, n, t, a) {
  const e = n + r(s, 0, 1) * (t - n);
  return w(e, n, a, t);
}
function I(s, n) {
  const t = Math.PI * 2, a = (n % t + t) % t;
  switch (s) {
    case "sine":
      return Math.sin(a);
    case "square":
      return Math.sign(Math.sin(a)) || 1;
    case "saw":
      return 2 * ((a / t + 1) % 1) - 1;
    case "triangle":
      return 2 / Math.PI * Math.asin(Math.sin(a));
    case "audio":
      return Math.sin(a);
    default:
      return Math.sin(a);
  }
}
function q(s, n, t, a) {
  const { frequency: e, depth: c, waveform: o, phase: i = 0, offset: h, invert: p } = s, u = a - t, l = h != null ? t + h * u : t + u / 2, M = u / 2 * r(c, 0, 1), d = (i + n * e) * Math.PI * 2, f = I(o, d), v = p ? -f : f, F = l + M * v;
  return r(F, t, a);
}
function y(s, n, t, a = 0.5) {
  const e = t - n || 1e-6, c = n + e * a, o = r((s - c) / (e / 2), -1, 1);
  return o <= 0 ? (o + 1) / 4 : (3 - o) / 4;
}
export {
  g as a,
  r as c,
  q as l,
  y as p,
  w as s,
  P as v
};
//# sourceMappingURL=lfo-oQ46pOIR.js.map
