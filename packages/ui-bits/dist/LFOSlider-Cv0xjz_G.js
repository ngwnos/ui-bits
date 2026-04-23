import { jsx as h, jsxs as V, Fragment as wo } from "react/jsx-runtime";
import { useContext as Mi, createContext as wi, useRef as S, useMemo as de, useSyncExternalStore as Ai, useEffect as f, useState as w, useCallback as g, useLayoutEffect as Ln } from "react";
import { u as Fi } from "./animationSuspension-BEQdvvQj.js";
import { u as Ri } from "./frameLoop-DbiGWmY_.js";
import { c as d, a as _, v as G, s as Mn, l as Ni } from "./lfo-DJ5JkDXn.js";
import { I as Ci } from "./IconButton-BvvMagK1.js";
import { u as Pi, b as Di } from "./panelGap-DjV8XIAA.js";
import { w as $i } from "./warnOnceDev-BPubHnZA.js";
import { b as Ti, d as De } from "./hooks-KNH81MTH.js";
const gr = 1, Ei = {
  bins: [],
  binCount: 0,
  maxMagnitude: gr
}, ki = {
  getSnapshot: () => Ei,
  subscribe: () => () => {
  }
}, Co = wi(null);
function Po(a, l) {
  return Number.isFinite(a ?? Number.NaN) ? Math.max(0, Math.floor(a ?? 0)) : l;
}
function Do(a) {
  return !Number.isFinite(a ?? Number.NaN) || (a ?? 0) <= 0 ? gr : a ?? gr;
}
function Bi(a) {
  let l = a;
  const p = /* @__PURE__ */ new Set(), r = () => {
    p.forEach((m) => m());
  };
  return {
    getSnapshot: () => l,
    subscribe: (m) => (p.add(m), () => p.delete(m)),
    setAudioBins: (m) => {
      const A = Array.from(m ?? []);
      l = { ...l, bins: A }, r();
    },
    setAudioBinCount: (m) => {
      const A = Po(m, 0);
      A !== l.binCount && (l = { ...l, binCount: A }, r());
    },
    setAudioMaxMagnitude: (m) => {
      const A = Do(m);
      A !== l.maxMagnitude && (l = { ...l, maxMagnitude: A }, r());
    }
  };
}
function ga({
  children: a,
  initialBins: l,
  initialBinCount: p,
  initialMaxMagnitude: r
}) {
  const o = S(null);
  if (!o.current) {
    const c = Array.from(l ?? []), C = Po(p, c.length), m = Do(r);
    o.current = Bi({
      bins: c,
      binCount: C,
      maxMagnitude: m
    });
  }
  return /* @__PURE__ */ h(Co.Provider, { value: o.current, children: a });
}
function vr() {
  return Mi(Co);
}
function ma() {
  const a = vr(), l = a ?? ki, p = Ai(
    l.subscribe,
    l.getSnapshot,
    l.getSnapshot
  );
  return a ? p : null;
}
function va() {
  const a = vr();
  if (!a)
    throw new Error("useAudioAnalysisActions must be used within an AudioAnalysisProvider");
  return de(() => ({
    setAudioBins: a.setAudioBins,
    setAudioBinCount: a.setAudioBinCount,
    setAudioMaxMagnitude: a.setAudioMaxMagnitude
  }), [a]);
}
function Ii(a, l, p = 16, r = 1e-3) {
  const o = S(0), c = S(null);
  f(() => {
    if (!l) return;
    let C = 0;
    const m = (A) => {
      if (A - o.current >= p) {
        const ee = a();
        (c.current === null || Math.abs(ee - c.current) >= r) && (l(ee, A / 1e3), c.current = ee), o.current = A;
      }
      C = requestAnimationFrame(m);
    };
    return C = requestAnimationFrame(m), () => cancelAnimationFrame(C);
  }, [l, p, r, a]);
}
function mr(a, l, p) {
  const r = Math.max(0, Math.min(a, l)), o = Math.min(p, Math.max(a, l));
  return [r, o];
}
function Vi(a, l, p, r) {
  const o = a.slice(0, l), c = a.slice(p), C = o + r + c, m = o.length + r.length;
  return { next: C, pos: m };
}
function zi(a) {
  return a.length === 1 ? /^[0-9.-]$/.test(a) : !!(/^Numpad[0-9]$/.test(a) || a === "NumpadDecimal" || a === "NumpadSubtract");
}
function hr(a) {
  if (!isFinite(a) || Math.floor(a) === a) return 0;
  const l = a.toString().toLowerCase();
  if (l.includes("e-")) {
    const r = parseInt(l.split("e-")[1], 10);
    return Number.isNaN(r) ? 0 : r;
  }
  const p = l.indexOf(".");
  return p === -1 ? 0 : l.length - p - 1;
}
function Ao(a, l, p) {
  return Math.max(hr(a), hr(l), hr(p));
}
function Fo(a, l) {
  const p = a.trim(), r = /^#?[0-9a-fA-F]{3}$/.test(p), o = /^#?[0-9a-fA-F]{6}$/.test(p);
  if (!r && !o) return `rgba(0,0,0,${l})`;
  const c = p.replace("#", ""), C = c.length === 3 ? c.split("").map((x) => x + x).join("") : c, m = parseInt(C, 16);
  if (Number.isNaN(m)) return `rgba(0,0,0,${l})`;
  const A = m >> 16 & 255, ee = m >> 8 & 255, P = m & 255;
  return `rgba(${A}, ${ee}, ${P}, ${l})`;
}
function Oi(a, l, p, r, o) {
  const m = ((A) => Math.max(0, Math.min(o, A)))((l === a ? p : l) + r);
  return mr(a, m, o);
}
const br = 1440 * 60 * 1e3, _i = 2023, qi = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], Ui = qi.reduce((a, l, p) => (a[l] = p, a), {}), Hi = /^([A-Za-z]{3})\s+(\d{1,2})$/, Xi = /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/;
function Wi({
  min: a,
  max: l,
  options: p
}) {
  const r = p?.baseYear ?? _i, o = p?.zeroOffset ?? a, c = p?.locale ?? "en-US", C = (F) => d(F, a, l), m = new Intl.DateTimeFormat(c, { month: "short", day: "2-digit", timeZone: "UTC" }), A = Date.UTC(r, 0, 1), ee = l - o, P = (F) => d(F, 0, ee), x = (F) => {
    if (!Number.isFinite(F)) return "";
    const z = C(F), T = P(z - o), Y = Math.floor(T), lt = Math.round((T - Y) * br), fe = new Date(A + Y * br + lt);
    return m.format(fe);
  };
  return { format: (F, { rawValueText: z }) => x(F) || z, parse: (F) => {
    if (!F) return null;
    const z = F.trim();
    if (!z) return null;
    const T = Hi.exec(z);
    if (T) {
      const lt = T[1].toUpperCase(), fe = Number(T[2]), ut = Ui[lt];
      if (ut != null && Number.isFinite(fe) && fe >= 1 && fe <= 31) {
        const je = new Date(Date.UTC(r, ut, fe));
        if (je.getUTCFullYear() === r && je.getUTCMonth() === ut && je.getUTCDate() === fe) {
          const wn = (je.getTime() - A) / br, dt = o + wn;
          return C(dt);
        }
      }
    }
    const Y = Number(z);
    return Number.isFinite(Y) ? C(Y) : null;
  }, formatLabel: x };
}
function Yi({
  min: a,
  max: l,
  options: p
}) {
  const r = p?.zeroOffset ?? a, o = (P) => d(P, a, l), c = Math.max(0, l - a), C = (P) => o(P) - r, m = (P) => {
    const x = C(P);
    if (!Number.isFinite(x)) return "";
    const J = d(x, 0, c), Te = Math.floor(J / 3600) % 24, F = Math.floor(J % 3600 / 60), z = Math.floor(J % 60), T = (Y) => Y.toString().padStart(2, "0");
    return `${T(Te)}:${T(F)}:${T(z)}`;
  };
  return { format: (P, { rawValueText: x }) => m(P) || x, parse: (P) => {
    if (!P) return null;
    const x = P.trim();
    if (!x) return null;
    const J = Xi.exec(x);
    if (J) {
      const F = Number(J[1]), z = Number(J[2]), T = Number(J[3]);
      if ([F, z, T].every((Y) => Number.isFinite(Y)) && F >= 0 && F < 24 && z >= 0 && z < 60 && T >= 0 && T < 60) {
        const Y = F * 3600 + z * 60 + T;
        return o(r + Y);
      }
    }
    const Te = Number(x);
    return Number.isFinite(Te) ? o(Te) : null;
  }, formatLabel: m };
}
const Ro = [], Ye = -1, Ke = 1, Ki = 0.01, ji = 0, Gi = 1, Ji = 0.01, Qi = 0.1, Zi = 2, ea = 0.01, $e = (a) => Number.isFinite(a) ? d(a, 0, 1) : 0, ta = [
  {
    waveform: "sine",
    label: "Sine",
    path: "M0.000 37.500 L1.562 33.824 L3.125 30.184 L4.688 26.614 L6.250 23.149 L7.812 19.823 L9.375 16.666 L10.938 13.710 L12.500 10.983 L14.062 8.512 L15.625 6.320 L17.188 4.428 L18.750 2.855 L20.312 1.615 L21.875 0.721 L23.438 0.181 L25.000 0.000 L26.562 0.181 L28.125 0.721 L29.688 1.615 L31.250 2.855 L32.812 4.428 L34.375 6.320 L35.938 8.512 L37.500 10.983 L39.062 13.710 L40.625 16.666 L42.188 19.823 L43.750 23.149 L45.312 26.614 L46.875 30.184 L48.438 33.824 L50.000 37.500 L51.562 41.176 L53.125 44.816 L54.688 48.386 L56.250 51.851 L57.812 55.177 L59.375 58.334 L60.938 61.290 L62.500 64.017 L64.062 66.488 L65.625 68.680 L67.188 70.572 L68.750 72.145 L70.312 73.385 L71.875 74.279 L73.438 74.819 L75.000 75.000 L76.562 74.819 L78.125 74.279 L79.688 73.385 L81.250 72.145 L82.812 70.572 L84.375 68.680 L85.938 66.488 L87.500 64.017 L89.062 61.290 L90.625 58.334 L92.188 55.177 L93.750 51.851 L95.312 48.386 L96.875 44.816 L98.438 41.176 L100.000 37.500",
    lineCap: "round",
    lineJoin: "round"
  },
  {
    waveform: "triangle",
    label: "Triangle",
    path: "M0 75 L50 0 L100 75",
    lineCap: "round",
    lineJoin: "round"
  },
  {
    waveform: "saw",
    label: "Sawtooth",
    path: "M4.500 70.500 L95.500 4.500 V70.500",
    lineCap: "butt",
    lineJoin: "miter"
  },
  {
    waveform: "square",
    label: "Square",
    path: "M0 0 H50 V75 H100",
    lineCap: "round",
    lineJoin: "round"
  },
  {
    waveform: "audio",
    label: "Audio",
    path: "M8.333 31.250 V40.625 M25.000 18.750 V53.125 M41.667 9.375 V65.625 M58.333 25.000 V46.875 M75.000 15.625 V56.250 M91.667 31.250 V40.625",
    lineCap: "round",
    lineJoin: "round"
  }
];
function na({
  label: a,
  ariaLabel: l,
  showLabel: p,
  min: r = 0,
  max: o = 100,
  step: c = 1,
  variant: C = "full",
  barStyle: m = "step-aligned",
  barSegmentCount: A = 32,
  defaultValue: ee,
  value: P,
  width: x,
  drawerLines: J,
  defaultLfoRange: Te,
  lfoRange: F,
  lfoFrequencyMin: z,
  lfoFrequencyMax: T,
  lfoFrequencyStep: Y,
  audioFrequencyMin: lt,
  audioFrequencyMax: fe,
  audioFrequencyStep: ut,
  colorA: je,
  colorB: wn,
  border: dt = "a",
  fontSize: $o,
  showLfoControls: To = !1,
  phase: xr = 0,
  mode: kt = "auto",
  defaultLfo: Eo,
  lfo: ko,
  readExternal: An,
  mirrorToStore: Bo,
  mirrorEveryMs: Io = 16,
  epsilon: Vo = 1e-3,
  onUserChange: yr,
  onAnimatedUpdate: Bt,
  onDrawerOpenChange: zo,
  onDrawerLinesChange: Sr,
  onLfoEnabledChange: Lr,
  onWaveformChange: Oo,
  onFrequencyChange: Mr,
  onPhaseChange: wr,
  defaultWaveform: Fn,
  defaultFrequency: Rn,
  defaultPhase: Nn,
  defaultDrawerOpen: _o,
  drawerOpen: ft,
  defaultLfoRunning: qo,
  lfoRunning: pt,
  className: Uo,
  style: Ho,
  formatDisplayValue: Xo,
  parseDisplayValue: Wo,
  formatEditingValue: It = !1,
  valuePrefix: Yo,
  valueSuffix: Ko,
  displayFormatterPreset: Cn,
  displayFormatterPresetOptions: Pn,
  audioBins: Vt,
  audioBinCount: Dn,
  audioMaxMagnitude: $n,
  defaultAudioResponse: zt,
  onAudioResponseChange: Ar,
  defaultAudioSamplePosition: Ot,
  onAudioSamplePositionChange: Fr,
  borderMask: ht,
  suspended: jo,
  controlId: Go,
  lfoControlIdPrefix: Jo
}) {
  const Ee = Ti(Go, a, l), Rr = Ee ?? a, H = Jo ?? (Ee ? `${Ee}.lfo` : void 0), Nr = H ? `${H}.enabled` : void 0, Cr = H ? `${H}.waveform` : void 0, Pr = H ? `${H}.frequency` : void 0, Dr = H ? `${H}.phase` : void 0, $r = H ? `${H}.range` : void 0, Tr = H ? `${H}.audioResponse` : void 0, Er = H ? `${H}.audioSample` : void 0, [ke, pe] = De(Ee), [kr, Ge] = De(Nr), [Je, Tn] = De(Cr), [En, _t] = De(Pr), [kn, qt] = De(Dr), [Ut, Ht] = De($r), [Bn, Xt] = De(Tr), [In, Wt] = De(Er), K = Ee !== void 0 && P === void 0, he = K ? ke : P;
  f(() => {
    Ee === void 0 || P === void 0 || $i(
      `LFOSlider.control-id-controlled-value.${Rr}`,
      "[ui-bits] LFOSlider received both `controlId` and controlled `value`. The control store binding is ignored while `value` is controlled."
    );
  }, [Ee, P, Rr]);
  const Qo = Fi(jo), be = z ?? Qi, ge = T ?? Zi, Zo = Y ?? ea, te = lt ?? ji, ne = fe ?? Gi, es = ut ?? Ji, Br = Ao(r, o, c), Q = C === "basic", Yt = Q ? "continuous" : m, Kt = Yt === "discrete" && Number.isFinite(A) ? Math.floor(A) : 0, bt = typeof he == "number" && Number.isFinite(he) ? he : ee !== void 0 ? ee : 0, Vn = S(bt), [y, re] = w(() => Number(bt).toFixed(Br)), zn = Eo ?? ko, oe = de(() => {
    const e = {
      enabled: !0,
      frequency: Rn ?? 0.5,
      depth: 1,
      offset: 0.5,
      waveform: Fn ?? "sine",
      phase: $e(xr),
      invert: !1
    }, t = { ...e, ...zn ?? {} }, n = $e(t.phase ?? e.phase ?? 0);
    return { ...t, phase: n };
  }, [Rn, Fn, zn, xr]), ts = Fn ?? oe.waveform ?? "sine", Be = Je === "sine" || Je === "triangle" || Je === "saw" || Je === "square" || Je === "audio" ? Je : void 0, Ie = typeof kr == "boolean" ? kr : void 0, ye = typeof En == "number" && Number.isFinite(En) ? En : void 0, Se = typeof kn == "number" && Number.isFinite(kn) ? kn : void 0, Le = typeof Bn == "number" && Number.isFinite(Bn) ? Bn : void 0, Me = typeof In == "number" && Number.isFinite(In) ? In : void 0, On = !Q && Cr !== void 0, jt = !Q && Pr !== void 0, Gt = !Q && Dr !== void 0, Jt = !Q && Tr !== void 0, Qt = !Q && Er !== void 0, _n = !Q && To, D = _n, [L, Zt] = w(y.length), [R, en] = w(y.length), [X, Ve] = w(!1), [Ir, Vr] = w(!0), [ns, tn] = w(!1), [rs, gt] = w(!1), [os, ze] = w(!1), [Oe, nn] = w(() => ft ?? _o ?? !1), [ss, is] = w(0), [we, zr] = w(Be ?? ts), Qe = !Q && Nr !== void 0 && pt === void 0, as = Q ? !1 : pt ?? Ie ?? qo ?? zn?.enabled ?? !1, [$, mt] = w(as);
  f(() => {
    !K || ke !== void 0 || $ || pe(bt);
  }, [bt, $, pe, K, ke]), f(() => {
    Be !== void 0 && zr((e) => e === Be ? e : Be);
  }, [Be]), f(() => {
    !On || Be !== void 0 || Tn(we);
  }, [we, Tn, On, Be]), f(() => {
    if (!Q) {
      if (pt !== void 0) {
        mt(pt);
        return;
      }
      Ie !== void 0 && mt((e) => e === Ie ? e : Ie);
    }
  }, [Q, pt, Ie]), f(() => {
    !Qe || Ie !== void 0 || Ge($);
  }, [$, Ge, Qe, Ie]), f(() => {
    !K || $ || typeof ke != "number" || !Number.isFinite(ke) || (Vn.current = ke);
  }, [$, K, ke]), f(() => {
    if (K) {
      if ($) {
        pe(void 0);
        return;
      }
      pe(Vn.current);
    }
  }, [$, pe, K]);
  const [rn, on] = w(() => d(
    ye ?? Rn ?? oe.frequency ?? 0.5,
    be,
    ge
  ));
  f(() => {
    if (ye === void 0) return;
    const e = d(ye, be, ge);
    on((t) => Math.abs(t - e) < 1e-6 ? t : e);
  }, [ge, be, ye]), f(() => {
    !jt || ye !== void 0 || _t(rn);
  }, [rn, _t, jt, ye]);
  const [Ze, qn] = w(() => $e(Se ?? Nn ?? oe.phase ?? 0));
  f(() => {
    if (Se === void 0) return;
    const e = $e(Se);
    qn((t) => Math.abs(t - e) < 1e-6 ? t : e);
  }, [Se]), f(() => {
    !Gt || Se !== void 0 || qt(Ze);
  }, [Ze, qt, Gt, Se]), f(() => {
    !D && Oe && (nn(!1), Ce(null));
  }, [D, Oe]);
  const Un = S(null), _e = S(null), vt = S({ id: -1, node: null }), xt = Array.isArray(Ut) && Ut.length === 2 && Ut.every((e) => typeof e == "number" && Number.isFinite(e)) ? Ut : void 0, Hn = F ?? Te ?? J, sn = Hn?.[0], an = Hn?.[1], yt = F !== void 0, cn = !Q && $r !== void 0 && !yt, St = Hn ?? xt ?? [r, o], ln = xt?.[0], un = xt?.[1], [qe, Lt] = w(() => [...St]), [et, Or] = w(() => [
    _(St[0], r, o),
    _(St[1], r, o)
  ]), Mt = S([
    _(St[0], r, o),
    _(St[1], r, o)
  ]), Ue = S(!1), He = S(!1), Xe = S(R);
  f(() => {
    Mt.current = et;
  }, [et]), f(() => {
    Lt((e) => {
      const t = _(e[0], r, o), n = _(e[1], r, o);
      return [
        G(t, r, o, c),
        G(n, r, o, c)
      ];
    });
  }, [r, o, c]), f(() => {
    !yt || sn === void 0 || an === void 0 || Lt((e) => Math.abs(e[0] - sn) < 1e-6 && Math.abs(e[1] - an) < 1e-6 ? e : [sn, an]);
  }, [yt, an, sn]), f(() => {
    yt || ln === void 0 || un === void 0 || Lt((e) => Math.abs(e[0] - ln) < 1e-6 && Math.abs(e[1] - un) < 1e-6 ? e : [ln, un]);
  }, [yt, un, ln]), f(() => {
    !cn || xt !== void 0 || Ht(qe);
  }, [qe, Ht, cn, xt]), f(() => {
    if (_e.current !== null) return;
    const e = [
      _(qe[0], r, o),
      _(qe[1], r, o)
    ];
    Or((t) => Math.abs(t[0] - e[0]) < 1e-6 && Math.abs(t[1] - e[1]) < 1e-6 ? t : (Mt.current = e, e));
  }, [qe, r, o]);
  const [Ae, tt] = w(() => _(bt, r, o)), q = S(Ae), b = S(y), Fe = S({ start: L, end: R }), _r = S(L), dn = S(y), W = S(!1);
  f(() => {
    b.current = y;
  }, [y]), f(() => {
    q.current = Ae;
  }, [Ae]), f(() => {
    Fe.current = { start: L, end: R };
  }, [L, R]);
  const O = de(() => Ao(r, o, c), [r, o, c]), qr = de(() => Cn === "dayOfYear" ? Wi({
    min: r,
    max: o,
    options: Pn?.dayOfYear
  }) : Cn === "time" ? Yi({
    min: r,
    max: o,
    options: Pn?.time
  }) : null, [Cn, Pn, o, r]), Xn = Xo ?? qr?.format ?? null, Wn = Wo ?? qr?.parse ?? null, me = g((e, t, n) => {
    if (!Xn) return t;
    const s = Xn(e, { reason: n, rawValueText: t });
    return typeof s == "string" ? s : t;
  }, [Xn]), ae = g(
    (e, t) => {
      const n = e.toFixed(O);
      return It ? me(e, n, t) : n;
    },
    [It, me, O]
  ), Yn = g((e) => {
    if (Wn) {
      const n = Wn(e);
      if (n != null && Number.isFinite(n))
        return n;
    }
    const t = Number(e);
    return Number.isFinite(t) ? t : null;
  }, [Wn]), fn = g((e) => {
    Vn.current = e, K && !$ && pe(e), yr?.(e);
  }, [$, yr, pe, K]), Ur = g((e) => {
    K && !$ && pe(e), Bt?.(e);
  }, [$, Bt, pe, K]), wt = S(G(q.current, r, o, c)), pn = S(
    me(wt.current, wt.current.toFixed(Br), "value")
  ), Hr = S(null), Xr = S(0), Wr = S(0), cs = S(0), [Kn, jn] = w(() => d(
    Le ?? zt ?? 0,
    Ye,
    Ke
  ));
  f(() => {
    if (Le === void 0) return;
    const e = d(Le, Ye, Ke);
    jn((t) => Math.abs(t - e) < 1e-6 ? t : e);
  }, [Le]), f(() => {
    !Jt || Le !== void 0 || Xt(Kn);
  }, [Kn, Xt, Jt, Le]), f(() => {
    Le === void 0 && zt !== void 0 && jn(d(zt, Ye, Ke));
  }, [zt, Le]);
  const [Gn, Jn] = w(() => d(
    Me ?? Ot ?? 0.5,
    te,
    ne
  ));
  f(() => {
    if (Me === void 0) return;
    const e = d(Me, te, ne);
    Jn((t) => Math.abs(t - e) < 1e-6 ? t : e);
  }, [ne, te, Me]), f(() => {
    !Qt || Me !== void 0 || Wt(Gn);
  }, [Gn, Wt, Qt, Me]), f(() => {
    Me === void 0 && Ot !== void 0 && Jn(d(Ot, te, ne));
  }, [Ot, ne, te, Me]);
  const ce = S([]), k = S(null), Yr = S(null), Kr = S(null), Qn = Pi(), jr = $o ?? Qn?.fontSize, hn = jr ?? 16;
  ce.current.length = y.length + 1;
  const [bn, ls] = w(0), [us, Gr] = w(0), gn = g(() => {
    const e = k.current;
    if (!e) return;
    const n = e.getBoundingClientRect().height || parseFloat(getComputedStyle(e).height) || 0, s = n ? Math.max(1, Math.round(n * 0.7)) : 0;
    s && s !== bn && ls(s);
  }, [bn]);
  Ln(() => {
    gn();
  }, [gn, y, x]), Ln(() => {
    if (X && L === R) {
      const e = k.current, t = ce.current[R] || ce.current[y.length];
      if (e && t) {
        const s = t.getBoundingClientRect(), i = e.getBoundingClientRect();
        Gr(s.left - i.left);
        return;
      }
      const n = Yr.current;
      if (e && n) {
        const s = n.getBoundingClientRect(), i = parseFloat(getComputedStyle(n).paddingRight || "0"), u = e.getBoundingClientRect();
        Gr(s.right - u.left - i);
      }
    }
  }, [X, L, R, y, Ae, x]), f(() => {
    const e = () => gn();
    return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
  }, [gn]), Ln(() => {
    if (!D) return;
    const e = () => {
      const t = k.current;
      if (t) {
        const n = t.getBoundingClientRect();
        is(n.height);
      }
    };
    return e(), window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
  }, [D, Oe, hn, y, x]);
  const nt = et, { min: Z, max: se } = de(() => {
    if (!D) return { min: r, max: o };
    const e = G(et[0], r, o, c), t = G(et[1], r, o, c), n = Math.min(e, t), s = Math.max(e, t);
    return {
      min: d(n, r, o),
      max: d(s, r, o)
    };
  }, [D, et, r, o, c]), ds = "var(--ui-bits-color-a, #2f2f2f)", fs = "var(--ui-bits-color-b, #f0f0f0)", ps = je ?? Qn?.colorA, hs = wn ?? Qn?.colorB, B = ps ?? ds, E = hs ?? fs, At = Di(), Re = de(() => {
    const e = At ? At.left : !0, t = At ? At.right : !0;
    return {
      top: ht?.top ?? !0,
      right: ht?.right ?? t,
      bottom: ht?.bottom ?? !0,
      left: ht?.left ?? e
    };
  }, [ht, At]), Ft = E, mn = B, Jr = de(
    () => `linear-gradient(90deg, ${B} 0%, ${B} var(--splitPct), ${E} var(--splitPct), ${E} 100%)`,
    [B, E]
  ), ve = "0.35em", Rt = "0.5em", Qr = `calc(1em + ${ve} + ${ve} + 2px)`, Nt = Math.max(10, Math.round(hn)), Ct = D ? Math.max(3, Math.round(Nt / 3)) : 0, Zn = D ? `${Ct + Nt + Ct}px` : "0.5em", Pt = "8px", Zr = D && Oe ? "3px 3px 0 0" : "3px", rt = dt !== "none", eo = dt === "b" ? E : B, xe = dt === "none" ? "transparent" : eo, bs = D && Oe ? {
    width: "100%",
    backgroundImage: Jr,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    backgroundOrigin: "padding-box",
    borderRadius: Zr,
    borderTop: Re.top ? rt ? `1px solid ${eo}` : "1px solid transparent" : "none",
    borderLeft: Re.left ? `1px solid ${xe}` : "none",
    borderRight: Re.right ? `1px solid ${xe}` : "none",
    borderBottom: Re.bottom ? `1px solid ${E}` : "none",
    boxShadow: rt ? "none" : "inset 0 0 0 1px rgba(0,0,0,0)",
    backgroundClip: "padding-box",
    boxSizing: "border-box",
    touchAction: "none",
    isolation: "isolate"
  } : {
    width: "100%",
    backgroundImage: Jr,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    backgroundOrigin: "padding-box",
    borderRadius: Zr,
    borderTop: Re.top ? rt ? `1px solid ${xe}` : "1px solid transparent" : "none",
    borderRight: Re.right ? rt ? `1px solid ${xe}` : "1px solid transparent" : "none",
    borderBottom: Re.bottom ? rt ? `1px solid ${xe}` : "1px solid transparent" : "none",
    borderLeft: Re.left ? `1px solid ${xe}` : "none",
    boxShadow: rt ? "none" : "0 0 0 1px rgba(0,0,0,0)",
    backgroundClip: "padding-box",
    boxSizing: "border-box",
    touchAction: "none",
    isolation: "isolate"
  }, gs = 18, to = jr ?? 16, ms = (e) => e.toFixed(2).padStart(5, " "), vs = (e) => e.toFixed(2).padStart(5, " "), xs = g((e) => {
    const t = d(e, be, ge);
    on(t), jt && _t(t), Mr?.(t);
  }, [Mr, ge, be, _t, jt]), ys = g((e) => {
    const t = $e(e);
    qn(t), Gt && qt(t), wr?.(t);
  }, [wr, qt, Gt]), Ss = g((e) => {
    const t = d(e, Ye, Ke);
    jn(t), Jt && Xt(t), Ar?.(t);
  }, [Ar, Xt, Jt]), Ls = g((e) => {
    const t = d(e, te, ne);
    Jn(t), Qt && Wt(t), Fr?.(t);
  }, [
    Fr,
    ne,
    te,
    Wt,
    Qt
  ]), er = vr(), j = we === "audio", tr = j ? {
    min: te,
    max: ne,
    step: es
  } : {
    min: be,
    max: ge,
    step: Zo
  }, nr = d(rn, be, ge), rr = d(Gn, te, ne), Ms = j ? rr : nr, no = g(() => {
    if (Vt !== void 0)
      return {
        bins: Vt,
        binCount: Dn ?? Vt.length,
        maxMagnitude: $n ?? 1
      };
    if (!er) return null;
    const e = er.getSnapshot();
    return {
      bins: e.bins ?? Ro,
      binCount: Dn ?? e.binCount,
      maxMagnitude: $n ?? e.maxMagnitude
    };
  }, [er, Dn, Vt, $n]), [ws, As] = w(() => typeof x == "number" ? x : Number(x) || 0);
  Ln(() => {
    if (typeof ResizeObserver > "u") return;
    const e = k.current;
    if (!e) return;
    const t = new ResizeObserver((n) => {
      const s = n[0];
      if (!s) return;
      const i = s.contentRect.width;
      As((u) => Math.abs(u - i) < 0.5 ? u : i);
    });
    return t.observe(e), () => t.disconnect();
  }, []);
  const Fs = typeof x == "number" ? x : Number(x) || 0, or = Math.max(ws || Fs, 0), vn = D ? d(Ct / Math.max(or, 1), 0, 1) : 0, Rs = D ? d((Ct + Nt) / Math.max(or, 1), 0, 1) : 0, sr = Math.max(Rs - vn, 1 / Math.max(or, 1, 1e3)), ro = ((D ? d((Ae - vn) / Math.max(sr, Number.EPSILON), 0, 1) : 0) * 100).toFixed(3), Ns = 0, Cs = 1, Ps = 0.01, Ds = "Freq", $s = "Phase", Ts = !0, Es = !0, ks = "Frequency", Bs = "Phase", ir = j ? d(Kn, Ye, Ke) : $e(Ze), Is = j ? Ye : Ns, Vs = j ? Ke : Cs, zs = j ? Ki : Ps, Os = j ? (e) => e.toFixed(2).padStart(5, " ") : vs, _s = (e) => ms(e), qs = (e) => Os(e), Us = j ? Ss : ys, Hs = j ? Ls : xs, oo = g((e) => {
    const t = no();
    if (!t || !Number.isFinite(Z) || !Number.isFinite(se))
      return null;
    const n = t.bins ?? Ro, s = n.length, i = Number(t.binCount), u = Number.isFinite(i) ? Math.floor(i) : s, v = Math.min(
      s,
      Math.max(0, u ?? s)
    ), I = Number(t.maxMagnitude), M = Number.isFinite(I) && I > 0 ? I : 1;
    if (s <= 0 || v <= 0 || M <= 0)
      return null;
    const U = d(e, 0, 1), Pe = Math.min(
      v - 1,
      Math.max(0, Math.floor(U * v))
    ), ue = n[Pe];
    if (ue == null || Number.isNaN(ue) || !Number.isFinite(ue)) return null;
    const Et = d(ue, 0, M);
    if (!Number.isFinite(Et) || M <= 0) return null;
    const vi = Et / M, xi = ra(vi, ir), yi = se - Z, Mo = Z + xi * yi;
    if (!Number.isFinite(Mo)) return null;
    const Si = Math.min(Z, se), Li = Math.max(Z, se);
    return d(Mo, Si, Li);
  }, [se, Z, no, ir]), so = g((e) => {
    if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(o - r) || o === r)
      return d(e, 0, 1);
    const t = G(e, r, o, c);
    return d(_(t, r, o), 0, 1);
  }, [o, r, c]), ot = g((e) => {
    const t = d(e, 0, 1);
    if (Yt === "discrete") {
      if (Kt <= 1) return t;
      const n = Math.round(t * Kt) / Kt;
      return d(n, 0, 1);
    }
    return Yt === "step-aligned" ? so(t) : t;
  }, [so, Kt, Yt]), io = g((e) => ot(e), [ot]), ie = g((e) => {
    const t = k.current;
    if (!t) return;
    const n = io(e);
    if (t.style.setProperty("--split", n.toFixed(6)), t.style.setProperty("--splitPct", `${(n * 100).toFixed(3)}%`), D) {
      const s = Math.max(sr, Number.EPSILON), i = d((n - vn) / s, 0, 1);
      t.style.setProperty("--handleSplitPct", `${(i * 100).toFixed(3)}%`);
    }
  }, [D, vn, sr, io]), le = g((e, t) => {
    wt.current = e, Hr.current === null && (pn.current = me(e, t, "value"));
  }, [me]), [Ne, Ce] = w(null), Dt = de(() => {
    if (Ne === null || !Number.isFinite(Ne)) return null;
    const e = Ne.toFixed(O);
    return me(Ne, e, "drawer");
  }, [Ne, me, O]), ao = Dt ?? (X ? y : pn.current), We = g((e, t) => {
    const n = ot(t);
    Or((s) => {
      if (Math.abs(s[e] - n) < 1e-6) return s;
      const i = [...s];
      return i[e] = n, Mt.current = i, i;
    });
  }, [ot]), st = g((e) => {
    if (!Un.current) return null;
    const t = Un.current.getBoundingClientRect();
    if (!t.width) return null;
    const n = d((e - t.left) / t.width, 0, 1);
    return ot(n);
  }, [ot]), Xs = g((e) => (t) => {
    t.preventDefault(), t.stopPropagation(), _e.current = e, vt.current = { id: t.pointerId, node: t.currentTarget }, t.currentTarget.setPointerCapture?.(t.pointerId);
    const n = st(t.clientX);
    if (n !== null) {
      We(e, n);
      const s = G(n, r, o, c);
      Ce(s);
    } else
      Ce(qe[e]);
  }, [qe, st, o, r, We, c]), Ws = g((e) => {
    const t = _e.current;
    if (t === null) return;
    e.preventDefault(), e.stopPropagation();
    const n = st(e.clientX);
    if (n === null) return;
    We(t, n);
    const s = G(n, r, o, c);
    Ce(s);
  }, [st, o, r, We, c]), xn = g((e) => {
    const t = _e.current;
    if (t === null) return;
    let n = e === null ? null : st(e);
    n !== null ? We(t, n) : n = Mt.current[t];
    const s = n ?? Mt.current[t], i = G(s, r, o, c), u = _(i, r, o);
    We(t, u), Lt((I) => {
      if (Math.abs(I[t] - i) < 1e-6) return I;
      const M = [...I];
      return M[t] = i, cn && Ht(M), Sr?.(M), M;
    });
    const v = vt.current;
    v.node && v.node.releasePointerCapture?.(v.id), Ce(null), _e.current = null, vt.current = { id: -1, node: null };
  }, [
    st,
    o,
    r,
    Sr,
    We,
    Lt,
    Ht,
    cn,
    c
  ]), Ys = g((e) => {
    e.preventDefault(), e.stopPropagation(), xn(e.clientX);
  }, [xn]), Ks = g((e) => {
    e.preventDefault(), e.stopPropagation(), xn(null);
  }, [xn]), yn = a.trim(), ar = (p ?? !0) && yn.length > 0, cr = (l ?? a).trim(), it = L !== R, js = R, N = g((e, t, n = b.current.length) => {
    const [s, i] = mr(e, t, n);
    Zt(s), en(i);
  }, []);
  f(() => {
    if (!It || W.current || X) return;
    const e = G(q.current, r, o, c), t = ae(e, "value");
    b.current !== t && (b.current = t, re(t), N(t.length, t.length));
  }, [X, ae, It, o, r, N, c]);
  const lr = (e) => {
    const t = Yn(e);
    if (t === null) return;
    const n = _(t, r, o);
    q.current = n, ie(n), tt(n);
  }, co = (e) => {
    const n = Yn(b.current) ?? r, s = c > 0 && Number.isFinite(c) ? c : 1, i = n + s * e, u = d(i, r, o), v = Mn(u, r, c), I = v.toFixed(O), M = ae(v, "value"), U = M.length, Pe = _(v, r, o);
    b.current = M, Fe.current = { start: U, end: U }, re(M), Zt(U), en(U), q.current = Pe, ie(Pe), le(v, I), tt(Pe), fn(v), W.current = !0;
  }, ur = g((e, t, n = !1) => {
    const s = Z, i = se;
    if (!Number.isFinite(s) || !Number.isFinite(i) || i < s) return;
    const u = d(e, s, i), v = Mn(u, r, c), I = v.toFixed(O), M = ae(v, "value"), U = M.length, Pe = X || W.current || n;
    le(v, I), Pe ? (b.current !== M && (b.current = M, re(M)), (Fe.current.start !== U || Fe.current.end !== U) && (Fe.current = { start: U, end: U }, Zt(U), en(U))) : b.current = M;
    const ue = _(u, r, o);
    if (Number.isFinite(ue) && Math.abs(ue - q.current) > 1e-5 && (q.current = ue, ie(ue), Pe && tt(ue)), (Bt || K) && t !== void 0) {
      const Et = t * 1e3;
      Et - Wr.current >= 16 && (Wr.current = Et, Ur(v));
    }
  }, [
    Z,
    se,
    Ur,
    X,
    ae,
    o,
    r,
    Bt,
    O,
    le,
    K,
    c,
    ie
  ]), $t = typeof he == "number" && Number.isFinite(he), lo = $t || !!An;
  f(() => {
    if (!$t || Ue.current || W.current) return;
    const e = d(he, r, o), t = Mn(e, r, c), n = _(t, r, o), s = t.toFixed(O), i = ae(t, "value");
    Math.abs(n - q.current) > 1e-6 && (q.current = n, ie(n), tt(n)), le(t, s), b.current !== i && (b.current = i, re(i), N(i.length, i.length));
  }, [
    ae,
    $t,
    o,
    r,
    O,
    le,
    he,
    N,
    c,
    ie
  ]);
  const Gs = g((e) => {
    if (cs.current = e, !Number.isFinite(Z) || !Number.isFinite(se)) return;
    const t = kt === "auto" ? $ ? "lfo" : lo ? "external" : "manual" : kt === "lfo" && !$ ? "manual" : kt;
    if (Ue.current || W.current) return;
    let n;
    if (t === "lfo" && $) {
      if (j) {
        const u = oo(rr);
        u !== null && ur(u, e, !0);
        return;
      }
      const s = $e(Ze) + Xr.current, i = {
        ...oe,
        phase: s,
        waveform: we,
        frequency: nr
      };
      n = Ni(i, e, Z, se);
    } else if (t === "external") {
      const s = $t ? he : An?.();
      typeof s == "number" && Number.isFinite(s) && (n = d(s, Z, se));
    }
    n !== void 0 && ur(n, e, t === "lfo" && $);
  }, [
    we,
    ur,
    rr,
    se,
    Z,
    lo,
    $t,
    j,
    nr,
    $,
    oe,
    kt,
    Ze,
    An,
    oo,
    he
  ]);
  Ri(Qo ? null : Gs);
  const Js = g(
    () => G(q.current, r, o, c),
    [o, r, c]
  );
  Ii(
    Js,
    Bo,
    Io,
    Vo
  ), f(() => {
    ie(q.current);
  }, [ie]), f(() => {
    const e = G(q.current, r, o, c), t = e.toFixed(O);
    le(e, t);
  }, [r, o, O, le, c]), f(() => {
    Hr.current = Ne, Dt !== null ? pn.current = Dt : pn.current = me(
      wt.current,
      wt.current.toFixed(O),
      "value"
    );
  }, [Ne, me, Dt, O]), f(() => {
    Xr.current = 0;
  }, [we, rn, Ze, oe.depth, oe.offset]), f(() => {
    ye === void 0 && on(d(
      oe.frequency ?? 0.5,
      be,
      ge
    ));
  }, [oe.frequency, ge, be, ye]), f(() => {
    j && on((e) => {
      const t = d(e, te, ne);
      return Math.abs(e - t) < 1e-6 ? e : t;
    });
  }, [j, ne, te]), f(() => {
    Se === void 0 && qn($e(Nn ?? oe.phase ?? 0));
  }, [Nn, oe.phase, Se]), f(() => {
    ft !== void 0 && (nn(ft), ft || Ce(null));
  }, [ft]), f(() => {
    _n || (nn(!1), Ce(null), mt(!1), Qe && Ge(!1));
  }, [_n, Ge, Qe]);
  const uo = () => {
    if (!D) return;
    nn((t) => {
      const n = !t;
      return zo?.(n), n;
    }), Ce(null), W.current = !1, Ve(!1), tn(!1), He.current = !1, k.current?.blur();
    const e = vt.current;
    e.node && e.node.releasePointerCapture?.(e.id), _e.current = null, vt.current = { id: -1, node: null };
  };
  f(() => {
    if (!X || it) return;
    Vr(!0);
    const e = setInterval(() => Vr((t) => !t), 500);
    return () => clearInterval(e);
  }, [X, it]);
  const fo = (e) => {
    const t = [];
    for (let i = 0; i <= y.length; i++) {
      const u = ce.current[i];
      if (!u) continue;
      const v = u.getBoundingClientRect();
      t.push({ x: v.left, index: i });
    }
    if (!t.length) return 0;
    let n = t[0], s = Math.abs(e - t[0].x);
    for (let i = 1; i < t.length; i++) {
      const u = Math.abs(e - t[i].x);
      u < s && (n = t[i], s = u);
    }
    return n.index;
  }, Qs = () => {
    const e = ce.current[0], t = ce.current[y.length];
    if (!e || !t) return null;
    const n = e.getBoundingClientRect().left, s = t.getBoundingClientRect().left;
    return n <= s ? { left: n, right: s } : { left: s, right: n };
  }, Sn = (e) => {
    const t = Kr.current;
    if (t) {
      const s = t.getBoundingClientRect();
      return e >= s.left && e <= s.right;
    }
    const n = Qs();
    return n ? e >= n.left && e <= n.right : !1;
  }, po = g((e) => {
    const t = k.current;
    if (!t) return Ae;
    const n = t.getBoundingClientRect(), s = (e - n.left) / n.width;
    return d(s, 0, 1);
  }, [Ae]), Tt = (e, t = 12) => {
    const n = k.current;
    if (!n) return !1;
    const s = n.getBoundingClientRect(), i = s.left + s.width * Ae;
    return Math.abs(e - i) <= t;
  }, ho = g((e) => {
    const t = po(e);
    q.current = t, ie(t), tt(t);
    const n = G(t, r, o, c), s = n.toFixed(O), i = ae(n, "value");
    le(n, s), b.current = i, re(i), N(i.length, i.length), fn(n);
  }, [fn, ae, po, o, r, O, le, N, c, ie]), dr = (e) => {
    const t = b.current, { start: n, end: s } = Fe.current, { next: i, pos: u } = Vi(t, n, s, e);
    b.current = i, Fe.current = { start: u, end: u }, re(i), Zt(u), en(u), lr(i);
  }, Zs = (e) => dr(e), ei = () => {
    if (it) {
      dr("");
      return;
    }
    if (L === 0) return;
    const e = L - 1, t = y.slice(0, L - 1) + y.slice(L);
    b.current = t, re(t), N(e, e), lr(t);
  }, ti = () => {
    if (it) {
      dr("");
      return;
    }
    if (L >= y.length) return;
    const e = y.slice(0, L) + y.slice(L + 1);
    b.current = e, re(e), N(L, L), lr(e);
  }, bo = (e) => {
    He.current = !1;
    const t = it ? e < 0 ? Math.min(L, R) : Math.max(L, R) : R, n = Math.max(0, Math.min(y.length, t + e));
    N(n, n), Xe.current = n;
  }, go = (e) => {
    He.current || (He.current = !0, it ? Xe.current = e < 0 ? Math.max(L, R) : Math.min(L, R) : Xe.current = R);
    const [t, n] = Oi(Xe.current, L, R, e, y.length);
    N(t, n);
  }, mo = (e, t) => {
    if (t) {
      He.current || (He.current = !0, Xe.current = e ? Math.max(L, R) : Math.min(L, R));
      const n = e ? 0 : y.length;
      N(Xe.current, n);
    } else {
      He.current = !1;
      const n = e ? 0 : y.length;
      N(n, n), Xe.current = n;
    }
  }, ni = (e) => {
    if (X) {
      if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(), N(0, y.length);
        return;
      }
      if (e.key.length === 1 && !e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(), zi(e.key) && Zs(e.key);
        return;
      }
      switch (e.key) {
        case "Backspace":
          e.preventDefault(), ei();
          break;
        case "Delete":
          e.preventDefault(), ti();
          break;
        case "ArrowUp":
          if (e.ctrlKey || e.metaKey || e.altKey) break;
          e.preventDefault(), co(1);
          break;
        case "ArrowDown":
          if (e.ctrlKey || e.metaKey || e.altKey) break;
          e.preventDefault(), co(-1);
          break;
        case "ArrowLeft":
          e.preventDefault(), e.shiftKey ? go(-1) : bo(-1);
          break;
        case "ArrowRight":
          e.preventDefault(), e.shiftKey ? go(1) : bo(1);
          break;
        case "Home":
          e.preventDefault(), mo(!0, e.shiftKey);
          break;
        case "End":
          e.preventDefault(), mo(!1, e.shiftKey);
          break;
        case "Enter":
          e.preventDefault(), k.current?.blur();
          return;
      }
    }
  }, vo = g((e) => {
    k.current?.setPointerCapture?.(e);
  }, []), ri = g((e) => {
    k.current?.releasePointerCapture?.(e);
  }, []), oi = (e) => {
    Sn(e.clientX) && b.current.length > 0 && (e.preventDefault(), k.current?.focus(), Ve(!0), W.current = !0, dn.current = b.current, N(0, b.current.length));
  }, si = (e) => {
    const t = Sn(e.clientX) && b.current.length > 0, n = e.pointerType === "touch", s = t && !n;
    gt(s);
    const i = !s && Tt(e.clientX);
    if (ze(i), i) {
      X && (k.current?.blur(), Ve(!1)), W.current = !1, Ue.current = !0, vo(e.pointerId), e.preventDefault(), e.stopPropagation();
      return;
    }
    if (!s) {
      X && (k.current?.blur(), Ve(!1)), W.current = !1, ho(e.clientX), Ue.current = !0, vo(e.pointerId), e.preventDefault(), e.stopPropagation();
      return;
    }
    dn.current = b.current, W.current = !0, k.current?.focus(), Ve(!0);
    const u = b.current.length;
    let v = fo(e.clientX);
    ce.current.length !== u + 1 && (v = u), _r.current = v, tn(!0), N(v, v, u), e.preventDefault();
  }, ii = (e) => {
    const t = Sn(e.clientX) && b.current.length > 0, n = e.pointerType === "touch", s = t && !n;
    if (gt(s), ze(!s && Tt(e.clientX)), Ue.current) {
      e.preventDefault(), e.stopPropagation(), ho(e.clientX);
      return;
    }
    if (!ns) return;
    e.preventDefault(), e.stopPropagation();
    const i = fo(e.clientX), u = b.current.length, [v, I] = mr(_r.current, i, u);
    N(v, I, u);
  }, xo = (e) => {
    if (Ue.current) {
      Ue.current = !1, ri(e.pointerId), e.preventDefault(), e.stopPropagation(), ze(Tt(e.clientX));
      return;
    }
    tn(!1), ze(Tt(e.clientX));
  }, ai = () => {
    gt(!1), ze(!1);
  }, ci = (e) => {
    const t = Sn(e.clientX) && b.current.length > 0;
    gt(t), ze(!t && Tt(e.clientX));
  }, li = () => {
    dn.current = b.current, W.current = !0, Ve(!0), y !== b.current && re(b.current);
    const { start: e, end: t } = Fe.current;
    N(e, t);
  }, ui = () => {
    if (W.current && b.current.length === 0) {
      const e = dn.current || "";
      re(e), N(e.length, e.length), b.current = e;
    } else if (W.current) {
      const e = Yn(b.current);
      if (e !== null) {
        const t = d(e, r, o), n = Mn(t, r, c), s = n.toFixed(O), i = ae(n, "value"), u = _(n, r, o);
        re(i), N(i.length, i.length), b.current = i, q.current = u, ie(u), le(n, s), tt(u), fn(n);
      }
    }
    W.current = !1, Ve(!1), tn(!1), gt(!1), ze(!1), N(b.current.length, b.current.length);
  }, yo = de(() => Array.from(y), [y]), So = de(() => Array.from(ao), [ao]), di = (e) => {
    const t = ce.current[e], n = k.current, s = Ir ? `1px solid ${Ft}` : "1px solid transparent";
    if (!t || !n) return s;
    const i = t.getBoundingClientRect(), u = n.getBoundingClientRect(), v = q.current, M = i.left >= u.left + u.width * v ? mn : Ft;
    return Ir ? `1px solid ${M}` : "1px solid transparent";
  }, fi = os ? "cursor-col-resize" : rs && y.length > 0 ? "cursor-text" : "cursor-col-resize", fr = Math.min(L, R), pr = Math.max(L, R), Lo = X && pr > fr, pi = Fo(E, 0.36), hi = Fo(B, 0.36), at = Yo ?? "", ct = Ko ?? "", bi = D ? "0" : "0.25em", gi = ["ui-bits-slider", "flex flex-col", Uo].filter(Boolean).join(" "), mi = {
    width: "100%",
    maxWidth: x == null ? void 0 : typeof x == "number" ? `${x}px` : x,
    fontSize: hn,
    fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
    fontWeight: 600,
    gap: bi,
    ...Ho ?? {}
  };
  return /* @__PURE__ */ V("div", { className: gi, style: mi, children: [
    /* @__PURE__ */ V(
      "div",
      {
        ref: k,
        role: "textbox",
        "aria-label": cr || void 0,
        "aria-multiline": !1,
        tabIndex: 0,
        onKeyDown: ni,
        onBlur: ui,
        onPointerDown: si,
        onPointerMove: ii,
        onPointerUp: xo,
        onPointerCancel: xo,
        onPointerLeave: ai,
        onPointerEnter: ci,
        onDoubleClick: oi,
        onFocus: li,
        className: `relative inline-block select-none outline-none overflow-hidden ${fi}`,
        style: bs,
        children: [
          D && /* @__PURE__ */ V(
            "div",
            {
              className: "absolute pointer-events-auto",
              style: {
                left: Ct,
                top: "50%",
                transform: "translateY(-50%)",
                width: Nt,
                height: Nt,
                borderRadius: 3,
                overflow: "hidden",
                zIndex: 40,
                cursor: "pointer"
              },
              onPointerDown: (e) => e.stopPropagation(),
              onPointerUp: (e) => e.stopPropagation(),
              onClick: (e) => {
                e.preventDefault(), e.stopPropagation(), uo();
              },
              role: "button",
              "aria-pressed": Oe,
              "aria-label": cr ? `${cr} drawer toggle` : void 0,
              tabIndex: 0,
              onKeyDown: (e) => {
                (e.key === " " || e.key === "Enter") && (e.preventDefault(), uo());
              },
              children: [
                /* @__PURE__ */ h(
                  "span",
                  {
                    "aria-hidden": !0,
                    style: {
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `var(--handleSplitPct, ${ro}%)`,
                      background: Ft
                    }
                  }
                ),
                /* @__PURE__ */ h(
                  "span",
                  {
                    "aria-hidden": !0,
                    style: {
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `var(--handleSplitPct, ${ro}%)`,
                      right: 0,
                      background: mn
                    }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ V("div", { className: "absolute inset-0 -z-10 pointer-events-none", children: [
            /* @__PURE__ */ h("div", { className: "absolute inset-0", style: { background: B, clipPath: "inset(0 calc(100% - var(--splitPct)) 0 0)" } }),
            /* @__PURE__ */ h("div", { className: "absolute inset-0", style: { background: E, clipPath: "inset(0 0 0 var(--splitPct))" } })
          ] }),
          /* @__PURE__ */ V("div", { className: "absolute inset-0 pointer-events-none z-0", "aria-hidden": !0, children: [
            /* @__PURE__ */ h("div", { className: "absolute inset-0", style: { clipPath: "inset(0 calc(100% - var(--splitPct)) 0 0)" }, children: /* @__PURE__ */ V(
              "div",
              {
                className: "absolute inset-0",
                style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${ve} ${Rt} ${ve} ${Zn}`, lineHeight: "1" },
                children: [
                  ar ? /* @__PURE__ */ h("span", { style: { color: Ft, marginRight: "0.5em", flexShrink: 0 }, children: yn }) : null,
                  /* @__PURE__ */ V(
                    "span",
                    {
                      style: { color: Ft, whiteSpace: "pre", textAlign: "right", flex: "1 1 auto", display: "flex", justifyContent: "flex-end" },
                      children: [
                        at ? /* @__PURE__ */ h("span", { className: "inline-block", children: at }) : null,
                        So.map((e, t) => /* @__PURE__ */ h(
                          "span",
                          {
                            className: "inline-block",
                            style: { background: Lo && t >= fr && t < pr ? pi : "transparent" },
                            children: e
                          },
                          `left-display-${t}`
                        )),
                        ct ? /* @__PURE__ */ h("span", { className: "inline-block", children: ct }) : null
                      ]
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ h("div", { className: "absolute inset-0", style: { clipPath: "inset(0 0 0 var(--splitPct))" }, children: /* @__PURE__ */ V(
              "div",
              {
                className: "absolute inset-0",
                style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${ve} ${Rt} ${ve} ${Zn}`, lineHeight: "1" },
                children: [
                  ar ? /* @__PURE__ */ h("span", { style: { color: mn, marginRight: "0.5em", flexShrink: 0 }, children: yn }) : null,
                  /* @__PURE__ */ V(
                    "span",
                    {
                      style: { color: mn, whiteSpace: "pre", textAlign: "right", flex: "1 1 auto", display: "flex", justifyContent: "flex-end" },
                      children: [
                        at ? /* @__PURE__ */ h("span", { className: "inline-block", children: at }) : null,
                        So.map((e, t) => /* @__PURE__ */ h(
                          "span",
                          {
                            className: "inline-block",
                            style: { background: Lo && t >= fr && t < pr ? hi : "transparent" },
                            children: e
                          },
                          `right-display-${t}`
                        )),
                        ct ? /* @__PURE__ */ h("span", { className: "inline-block", children: ct }) : null
                      ]
                    }
                  )
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ V(
            "div",
            {
              ref: Yr,
              className: "text-transparent z-10",
              style: {
                display: "flex",
                alignItems: "center",
                padding: `${ve} ${Rt} ${ve} ${Zn}`,
                lineHeight: "1",
                width: "100%",
                boxSizing: "border-box"
              },
              children: [
                ar ? /* @__PURE__ */ h("span", { style: { flexShrink: 0, marginRight: "0.5em" }, children: yn }) : null,
                /* @__PURE__ */ V(
                  "span",
                  {
                    className: "whitespace-pre",
                    style: { display: "inline-flex", justifyContent: "flex-end", marginLeft: "auto", alignItems: "center" },
                    children: [
                      at ? /* @__PURE__ */ h("span", { className: "inline-block", "aria-hidden": !0, children: at }) : null,
                      /* @__PURE__ */ h("span", { className: "inline-flex whitespace-pre", ref: Kr, children: Ne === null ? /* @__PURE__ */ V(wo, { children: [
                        yo.map((e, t) => /* @__PURE__ */ h(
                          "span",
                          {
                            ref: (n) => {
                              ce.current[t] = n;
                            },
                            className: "inline-block",
                            children: e
                          },
                          t
                        )),
                        /* @__PURE__ */ h("span", { ref: (e) => {
                          ce.current[yo.length] = e;
                        } })
                      ] }) : /* @__PURE__ */ h("span", { className: "inline-block", children: Dt ?? "" }) }),
                      ct ? /* @__PURE__ */ h("span", { className: "inline-block", "aria-hidden": !0, children: ct }) : null
                    ]
                  }
                ),
                X && L === R && bn > 0 && /* @__PURE__ */ h(
                  "span",
                  {
                    "aria-hidden": !0,
                    className: "pointer-events-none absolute",
                    style: { left: us, top: "50%", transform: "translateY(-50%)", height: bn, borderLeft: di(js) }
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    D && Oe && /* @__PURE__ */ V(
      "div",
      {
        style: {
          width: "100%",
          marginTop: 0,
          borderLeft: `1px solid ${xe}`,
          borderRight: `1px solid ${xe}`,
          borderBottom: `1px solid ${xe}`,
          borderRadius: "0 0 3px 3px",
          backgroundColor: E,
          backgroundClip: "padding-box",
          overflow: "hidden",
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ V(
            "div",
            {
              ref: Un,
              style: {
                position: "relative",
                height: ss || void 0,
                borderTop: `1px solid ${B}`,
                borderBottom: `1px solid ${E}`,
                overflow: "hidden",
                touchAction: "none"
              },
              children: [
                (() => {
                  const [e, t] = nt, n = d(Math.min(e, t), 0, 1), s = d(Math.max(e, t), 0, 1);
                  return /* @__PURE__ */ V(wo, { children: [
                    /* @__PURE__ */ h(
                      "span",
                      {
                        "aria-hidden": !0,
                        style: {
                          position: "absolute",
                          inset: 0,
                          background: B,
                          clipPath: `inset(0 ${(100 - n * 100).toFixed(3)}% 0 0)`
                        }
                      }
                    ),
                    /* @__PURE__ */ h(
                      "span",
                      {
                        "aria-hidden": !0,
                        style: {
                          position: "absolute",
                          inset: 0,
                          background: B,
                          clipPath: `inset(0 0 0 ${(s * 100).toFixed(3)}%)`
                        }
                      }
                    )
                  ] });
                })(),
                nt.map((e, t) => {
                  const n = _e.current === t, s = d(Math.min(nt[0], nt[1]), 0, 1), i = d(Math.max(nt[0], nt[1]), 0, 1), u = Math.abs(e - s), v = Math.abs(e - i), I = u <= v, M = I ? E : B, U = I ? B : E;
                  return /* @__PURE__ */ V(
                    "span",
                    {
                      onPointerDown: Xs(t),
                      onPointerMove: Ws,
                      onPointerUp: Ys,
                      onPointerCancel: Ks,
                      style: {
                        position: "absolute",
                        top: "10%",
                        bottom: "10%",
                        width: 6,
                        borderRadius: 3,
                        left: `${(e * 100).toFixed(3)}%`,
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "row",
                        overflow: "hidden",
                        cursor: "col-resize"
                      },
                      children: [
                        /* @__PURE__ */ h(
                          "span",
                          {
                            "aria-hidden": !0,
                            style: {
                              flex: "0 0 50%",
                              background: M,
                              borderRadius: "3px 0 0 3px"
                            }
                          }
                        ),
                        /* @__PURE__ */ h(
                          "span",
                          {
                            "aria-hidden": !0,
                            style: {
                              flex: "0 0 50%",
                              background: U,
                              borderRadius: "0 3px 3px 0"
                            }
                          }
                        )
                      ]
                    },
                    `drawer-line-${t}`
                  );
                })
              ]
            }
          ),
          /* @__PURE__ */ V(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: Pt,
                padding: `0 ${Rt} 0 ${Pt}`,
                background: E,
                borderTop: `1px solid ${B}`,
                borderBottom: `1px solid ${E}`
              },
              children: [
                /* @__PURE__ */ h(
                  No,
                  {
                    label: Ds,
                    ariaLabel: ks,
                    showLabel: Ts,
                    variant: "basic",
                    min: tr.min,
                    max: tr.max,
                    step: tr.step,
                    width: "100%",
                    colorA: B,
                    colorB: E,
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    fontSize: to,
                    mode: "external",
                    value: Ms,
                    onUserChange: Hs,
                    formatDisplayValue: (e) => _s(e),
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ h(
                  No,
                  {
                    label: $s,
                    ariaLabel: Bs,
                    showLabel: Es,
                    variant: "basic",
                    min: Is,
                    max: Vs,
                    step: zs,
                    width: "100%",
                    colorA: B,
                    colorB: E,
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    fontSize: to,
                    mode: "external",
                    value: ir,
                    onUserChange: Us,
                    formatDisplayValue: (e) => qs(e),
                    style: { gap: 0 }
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: Pt,
                padding: `0 ${Rt} 0 ${Pt}`,
                background: E,
                borderTop: `1px solid ${B}`,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3
              },
              children: /* @__PURE__ */ h("div", { style: { display: "flex", alignItems: "center", gap: Pt, flexShrink: 0 }, children: ta.map((e) => {
                const t = we === e.waveform;
                return /* @__PURE__ */ h(
                  Ci,
                  {
                    behavior: "toggle",
                    toggled: t && $,
                    onToggle: () => {
                      if (t) {
                        mt((i) => {
                          const u = !i;
                          return Qe && Ge(u), Lr?.(u), u;
                        });
                        return;
                      }
                      zr(e.waveform), On && Tn(e.waveform), we !== e.waveform && Oo?.(e.waveform), $ || (mt(!0), Qe && Ge(!0), Lr?.(!0));
                    },
                    borderStyle: "none",
                    fontSize: hn,
                    colorA: B,
                    colorB: E,
                    "aria-label": `${e.label} waveform`,
                    title: `${e.label} waveform`,
                    style: {
                      width: Qr,
                      height: Qr,
                      padding: ve
                    },
                    children: /* @__PURE__ */ h(
                      "svg",
                      {
                        "aria-hidden": !0,
                        viewBox: "0 0 100 75",
                        preserveAspectRatio: "xMidYMid meet",
                        role: "img",
                        style: { width: "100%", height: "100%", display: "block" },
                        children: /* @__PURE__ */ h(
                          "path",
                          {
                            d: e.path,
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: gs,
                            strokeLinecap: e.lineCap,
                            strokeLinejoin: e.lineJoin
                          }
                        )
                      }
                    )
                  },
                  `drawer-action-${e.waveform}`
                );
              }) })
            }
          )
        ]
      }
    )
  ] });
}
function No(a) {
  return /* @__PURE__ */ h(na, { ...a });
}
function ra(a, l) {
  const p = d(a, 0, 1), r = d(l, Ye, Ke);
  if (!Number.isFinite(r) || r === 0) return p;
  if (r > 0) {
    const c = Math.max(0.05, 1 - r * 0.8);
    return Math.pow(p, c);
  }
  const o = 1 + Math.abs(r) * 4;
  return Math.pow(p, o);
}
export {
  ga as A,
  No as L,
  Yi as a,
  Bi as b,
  Wi as c,
  va as d,
  ma as e,
  vr as f,
  Ii as u
};
//# sourceMappingURL=LFOSlider-Cv0xjz_G.js.map
