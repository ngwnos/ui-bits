function o(a, n, t) {
  return Math.max(n, Math.min(t, a));
}
function w(a, n, t) {
  if (t <= 0 || !isFinite(t)) return a;
  const s = Math.round((a - n) / t);
  return n + s * t;
}
function I(a, n, t) {
  return !isFinite(a) || t === n ? 0.5 : o((a - n) / (t - n), 0, 1);
}
function P(a, n, t, s) {
  const e = n + o(a, 0, 1) * (t - n);
  return w(e, n, s);
}
function g(a, n) {
  const t = Math.PI * 2, s = (n % t + t) % t;
  switch (a) {
    case "sine":
      return Math.sin(s);
    case "square":
      return Math.sign(Math.sin(s)) || 1;
    case "saw":
      return 2 * ((s / t + 1) % 1) - 1;
    case "triangle":
      return 2 / Math.PI * Math.asin(Math.sin(s));
    case "audio":
      return Math.sin(s);
    default:
      return Math.sin(s);
  }
}
function q(a, n, t, s) {
  const { frequency: e, depth: c, waveform: r, phase: i = 0, offset: h, invert: p } = a, u = s - t, l = h != null ? t + h * u : t + u / 2, M = u / 2 * o(c, 0, 1), d = (i + n * e) * Math.PI * 2, f = g(r, d), v = p ? -f : f, F = l + M * v;
  return o(F, t, s);
}
function N(a, n, t, s = 0.5) {
  const e = t - n || 1e-6, c = n + e * s, r = o((a - c) / (e / 2), -1, 1);
  return r <= 0 ? (r + 1) / 4 : (3 - r) / 4;
}
export {
  I as a,
  o as c,
  q as l,
  N as p,
  w as s,
  P as v
};
//# sourceMappingURL=lfo-DJ5JkDXn.js.map
