import { jsx as a, jsxs as P, Fragment as gn } from "react/jsx-runtime";
import o from "react";
import { MousePointer2 as wn, CaseUpper as Mn, Piano as En } from "lucide-react";
import { ak as Sn, d as kn, _ as Nn, al as In, I as Ln, $ as De } from "./FloatingPanel-BUrwphVp.js";
const Et = "C4", An = 13, Pn = 6, Rn = !1, Tn = "tonejs", Dn = 18, Kn = "#f2f0e5", Un = "#1c1b1a", St = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], On = /* @__PURE__ */ new Set([1, 3, 6, 8, 10]), kt = /* @__PURE__ */ new Set([0, 2, 4, 5, 7, 9, 11]), $n = 21, H = (() => {
  const s = [];
  for (let i = 0; i <= 127; i += 1)
    kt.has(i % 12) && s.push(i);
  return s;
})(), B = Math.max(0, H.indexOf($n));
function Fe(s) {
  const i = Math.round(s), l = St[(i % 12 + 12) % 12], b = Math.floor(i / 12) - 1;
  return `${l}${b}`;
}
function Nt(s) {
  const i = Math.round(s);
  return 440 * Math.pow(2, (i - 69) / 12);
}
function Be(s) {
  const i = s.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!i) return null;
  const [, l, b, y] = i, x = l.toUpperCase(), h = St.findIndex((R) => R[0] === x && R.length === 1);
  if (h < 0) return null;
  const _ = Number(y);
  if (!Number.isFinite(_)) return null;
  let M = h;
  b === "#" && (M += 1), b === "b" && (M -= 1);
  const E = (M % 12 + 12) % 12;
  return (_ + 1) * 12 + E;
}
function wt(s) {
  if (typeof s == "number" && Number.isFinite(s)) {
    const i = Math.max(0, Math.min(127, Math.round(s)));
    return Ke(i);
  }
  if (typeof s == "string") {
    const i = Be(s);
    if (i != null) {
      const l = Math.max(0, Math.min(127, i));
      return Ke(l);
    }
  }
  return Ke(Be(Et) ?? 60);
}
function Ke(s) {
  let i = Math.max(0, Math.min(127, Math.round(s)));
  for (; i > 0 && !kt.has(i % 12); )
    i -= 1;
  return i;
}
function Fn(s, i) {
  const l = Math.max(1, Math.round(i)), b = [], y = [];
  let x = 0;
  for (let h = 0; h < l; h += 1) {
    const _ = s + h, M = Fe(_), E = Nt(_), R = (_ % 12 + 12) % 12;
    if (On.has(R)) {
      const q = x - 1 + 0.7;
      y.push({ note: M, frequency: E, position: q });
    } else
      b.push({ note: M, frequency: E }), x += 1;
  }
  return { whiteKeys: b, blackKeys: y };
}
function Bn(s) {
  const l = s * 0.35, y = s * 1;
  return Math.max(
    Math.round(y + l * 2 + 2),
    Math.round(s + l * 1.5),
    Dn
  );
}
const Ue = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
  "k",
  "o",
  "l",
  "p",
  ";",
  "'",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n"
];
let Oe = null, $e = null;
function Mt(s, i) {
  const l = i instanceof Error ? i.message : String(i);
  return new Error(
    `[ui-bits] Missing optional audio dependency "${s}". Install "${s}" to use VirtualKeyboard audio playback. (${l})`
  );
}
async function Hn() {
  return Oe || (Oe = import("tone").then((s) => s)), Oe;
}
async function Vn() {
  return $e || ($e = import("soundfont-player").then((s) => s)), $e;
}
function zn(s) {
  if (!(s instanceof HTMLElement)) return !1;
  const i = s.tagName.toLowerCase();
  return i === "input" || i === "textarea" || i === "select" ? !0 : s.isContentEditable;
}
function W(s, i, l, b) {
  const [y, x] = In(b), h = b !== void 0 && s === void 0, [_, M] = o.useState(i), E = s !== void 0, R = E ? s : h ? y ?? _ : _, q = o.useCallback((j) => {
    !E && !h && M(j), h && x(j), l?.(j);
  }, [E, l, x, h]);
  return o.useEffect(() => {
    !h || y !== void 0 || x(i);
  }, [i, x, h, y]), [R, q];
}
function Qn({
  whiteKeys: s,
  blackKeys: i,
  startNote: l,
  defaultStartNote: b,
  onStartNoteChange: y,
  noteCount: x,
  defaultNoteCount: h,
  onNoteCountChange: _,
  showLabels: M,
  defaultShowLabels: E,
  onShowLabelsChange: R,
  heightUnits: q,
  defaultHeightUnits: j,
  onHeightUnitsChange: It,
  showControls: he = !0,
  showHeightControl: Lt = !0,
  instrumentOptions: He = [],
  soundfontOptions: Ve = [],
  instrument: At,
  defaultInstrument: Pt,
  onInstrumentChange: Rt,
  toneInstrumentValue: Tt = Tn,
  instrumentIcon: Dt,
  soundfontConfig: Kt,
  toneConfig: ze,
  header: ve,
  footer: Ut,
  colorA: Ot,
  colorB: $t,
  whiteKeyColor: Ft,
  blackKeyColor: Bt,
  whiteKeyActiveColor: Ht,
  blackKeyActiveColor: Vt,
  dialIndicatorColor: me,
  soundfont: be,
  tone: ne,
  keyboardShortcutsEnabled: zt,
  defaultKeyboardShortcutsEnabled: Wt = Rn,
  onKeyboardShortcutsChange: qt,
  controlIdPrefix: jt,
  controlIds: We,
  activeNotes: G,
  onNoteOn: qe,
  onNoteOff: je,
  className: Gt,
  style: Xt,
  fontSize: Yt,
  ariaLabel: Ge = "Virtual keyboard"
}) {
  const pe = Sn(jt, Ge), V = o.useCallback((e) => We?.[e] ?? (pe ? `${pe}.${e}` : void 0), [We, pe]), Jt = V("startNote"), Qt = V("noteCount"), Zt = V("heightUnits"), en = V("showLabels"), tn = V("keyboardShortcutsEnabled"), nn = V("instrument"), [oe, Xe] = W(
    l,
    b ?? Et,
    y,
    Jt
  ), [on, Ye] = W(
    x,
    h ?? An,
    _,
    Qt
  ), [rn, Je] = W(
    q,
    j ?? Pn,
    It,
    Zt
  ), [Qe] = W(
    M,
    E ?? !1,
    R,
    en
  ), [X, sn] = W(
    zt,
    Wt,
    qt,
    tn
  ), Ze = o.useMemo(() => Ve.map(({ value: e, label: t, ...n }) => ({
    value: e,
    label: t,
    source: "soundfont",
    soundfontConfig: n,
    toneConfig: void 0
  })), [Ve]), z = o.useMemo(() => {
    const e = /* @__PURE__ */ new Set();
    return [...He, ...Ze].filter((t) => e.has(t.value) ? !1 : (e.add(t.value), !0));
  }, [He, Ze]), [an, cn] = W(
    At,
    Pt ?? z[0]?.value ?? "",
    Rt,
    nn
  ), S = o.useRef({
    pointerId: null,
    note: null
  }), g = o.useRef(/* @__PURE__ */ new Map()), re = o.useRef(/* @__PURE__ */ new Set()), k = o.useRef(null), D = o.useRef(null), w = o.useRef(/* @__PURE__ */ new Map()), [et, tt] = o.useState(null), [un, nt] = o.useState({});
  if (et)
    throw et;
  const se = G ?? un, N = Math.max(1, Math.min(88, Math.round(on))), ot = o.useMemo(() => {
    if (s && i)
      return { white: s, black: i };
    const e = wt(oe), { whiteKeys: t, blackKeys: n } = Fn(e, N);
    return {
      white: t,
      black: n
    };
  }, [i, N, oe, s]), ye = ot.white, ln = ot.black, Ce = kn(), rt = ye.length > 0 ? 100 / ye.length : 100, dn = rt * 0.6, K = Yt ?? Ce?.fontSize ?? 12, st = Bn(K), it = Math.max(1, Math.round(rn)), U = o.useMemo(() => wt(oe), [oe]), at = H.indexOf(U), Y = Math.max(0, H.length - 1), fn = Math.max(
    B,
    Math.min(Y, at >= 0 ? at : B)
  ), O = Ot ?? Ce?.colorA ?? Kn, ie = $t ?? Ce?.colorB ?? Un, ct = Ft ?? ie, xe = Bt ?? O, hn = Ht ?? O, vn = Vt ?? O, J = he && z.length > 0 && !be && !ne, Q = an || z[0]?.value || "", Z = o.useMemo(() => z.find((e) => e.value === Q) ?? null, [Q, z]), _e = J && (Z?.source === "tone" || Z?.toneConfig != null || Q === Tt), ut = Z?.soundfontConfig ?? Kt ?? null, lt = J && !_e && ut ? { ...ut, instrument: Q } : null, p = o.useMemo(() => {
    const e = be ?? lt;
    return e ? typeof e == "string" ? { instrument: e } : e : null;
  }, [lt, be]), v = o.useMemo(() => ne || (!J || !_e ? null : Z?.toneConfig ?? ze ?? {}), [Z, J, ne, ze, _e]), mn = Dt ?? /* @__PURE__ */ a(En, {}), ee = p?.instrument, ae = p?.soundfont, ce = p?.format, ge = p?.url, we = p?.monitor ?? !0, Me = p?.gain, Ee = p?.attack, Se = p?.decay, ke = p?.sustain, Ne = p?.release, Ie = p?.notes, ue = p?.context, Le = p?.destination, te = v?.destination, le = v?.context ?? (te?.context instanceof AudioContext ? te.context : null), dt = Math.max(1, Math.round(v?.polyphony ?? 8)), Ae = v?.volume, ft = v?.attack, ht = v?.decay, vt = v?.sustain, mt = v?.release, de = o.useCallback((e, t) => {
    G || nt((n) => {
      if (t)
        return n[e] ? n : { ...n, [e]: !0 };
      if (!n[e]) return n;
      const r = { ...n };
      return delete r[e], r;
    });
  }, [G]), $ = o.useCallback((e, t) => {
    try {
      const n = D.current;
      if (n)
        n.context.state === "suspended" && n.context.resume().catch(() => {
        }), n.toneModule.start().catch(() => {
        }), n.synth.triggerAttack(e);
      else {
        const r = k.current;
        if (r) {
          const { instrument: d, context: T } = r, u = w.current.get(e);
          u?.stop && u.stop(T.currentTime), w.current.delete(e), T.state === "suspended" && T.resume().catch(() => {
          });
          const C = d.start(e, T.currentTime);
          C && typeof C.stop == "function" && w.current.set(e, C);
        }
      }
    } catch {
    }
    re.current.add(e), qe?.(e, t), de(e, !0);
  }, [qe, de]), I = o.useCallback((e) => {
    try {
      const t = D.current;
      if (t)
        t.synth.triggerRelease(e);
      else {
        const n = k.current;
        if (n) {
          const { context: r } = n, d = w.current.get(e);
          d?.stop && d.stop(r.currentTime), w.current.delete(e);
        }
      }
    } catch {
    }
    re.current.delete(e), je?.(e), de(e, !1);
  }, [je, de]), bt = o.useRef($), F = o.useRef(I), Pe = o.useRef(() => {
  }), L = o.useRef(() => {
  }), pt = o.useRef(U), yt = o.useRef(N);
  o.useEffect(() => {
    bt.current = $;
  }, [$]), o.useEffect(() => {
    F.current = I;
  }, [I]), o.useEffect(() => {
    Pe.current = () => {
      const e = S.current;
      e.note && F.current(e.note), S.current = { pointerId: null, note: null };
    };
  }, []), o.useEffect(() => {
    L.current = () => {
      Array.from(re.current).forEach((t) => F.current(t)), re.current.clear();
    };
  }, []), o.useEffect(() => {
    pt.current = U;
  }, [U]), o.useEffect(() => {
    yt.current = N;
  }, [N]), o.useEffect(() => {
    if (!v) {
      D.current = null;
      return;
    }
    if (typeof AudioContext > "u" && !le && !te) {
      D.current = null;
      return;
    }
    let e = !1, t;
    return (async () => {
      let n;
      try {
        n = await Hn();
      } catch (Te) {
        e || tt(Mt("tone", Te));
        return;
      }
      if (e) {
        D.current = null;
        return;
      }
      const r = te, d = r?.context, u = le ?? (d instanceof AudioContext ? d : null) ?? new AudioContext(), C = !le && !r, A = new n.Context({ context: u }), m = n.getContext();
      n.setContext(A);
      const Re = {
        attack: ft ?? 0.01,
        decay: ht ?? 0.1,
        sustain: vt ?? 0.3,
        release: mt ?? 0.8
      }, c = new n.PolySynth(n.Synth, { envelope: Re });
      c.maxPolyphony = dt, Ae !== void 0 && (c.volume.value = Ae), r && r !== u.destination ? c.connect(r) : c.toDestination(), L.current(), D.current = {
        toneModule: n,
        synth: c,
        context: u,
        destination: r ?? u.destination,
        ownsContext: C,
        toneContext: A
      }, t = () => {
        L.current(), c.releaseAll(), c.disconnect(), c.dispose(), D.current = null, n.getContext() === A && n.setContext(m), C && (A.dispose(), u.close().catch(() => {
        }));
      }, e && t();
    })(), () => {
      e = !0, t?.();
    };
  }, [
    v,
    le,
    te,
    dt,
    Ae,
    ft,
    ht,
    vt,
    mt
  ]), o.useEffect(() => {
    if (!ee || v) {
      k.current = null;
      return;
    }
    if (typeof AudioContext > "u" && !ue && !Le) {
      k.current = null;
      return;
    }
    let e = !1, t;
    return (async () => {
      let n;
      try {
        n = await Vn();
      } catch (c) {
        e || tt(Mt("soundfont-player", c));
        return;
      }
      if (e) {
        k.current = null;
        return;
      }
      const r = Le, d = r?.context, u = ue ?? (d instanceof AudioContext ? d : null) ?? new AudioContext(), C = !ue && !r, A = ge ? ge.replace(/\/$/, "") : null, m = {};
      ae && (m.soundfont = ae), ce && (m.format = ce), Me !== void 0 && (m.gain = Me), Ee !== void 0 && (m.attack = Ee), Se !== void 0 && (m.decay = Se), ke !== void 0 && (m.sustain = ke), Ne !== void 0 && (m.release = Ne), Ie !== void 0 && (m.notes = Ie), !we && r && (m.destination = r), A && (m.nameToUrl = (c, Te, _n) => `${A}/${Te ?? ae ?? "MusyngKite"}/${c}-${_n === "ogg" ? "ogg" : ce ?? "mp3"}.js`), L.current(), w.current.forEach((c) => {
        c?.stop && c.stop(u.currentTime);
      }), w.current.clear(), k.current = null;
      const Re = ee;
      n.instrument(u, Re, m).then((c) => {
        e || (r && (we || m.destination !== r) && r !== u.destination && typeof c.connect == "function" && c.connect(r), k.current = {
          instrument: c,
          context: u,
          destination: r ?? u.destination,
          ownsContext: C
        });
      }).catch(() => {
        e || (k.current = null);
      }), t = () => {
        L.current(), w.current.forEach((c) => {
          c?.stop && c.stop();
        }), w.current.clear(), k.current = null, C && u.close().catch(() => {
        });
      }, e && t();
    })(), () => {
      e = !0, t?.();
    };
  }, [
    ee,
    v,
    ae,
    ce,
    ge,
    Me,
    Ee,
    Se,
    ke,
    Ne,
    we,
    Ie,
    ue,
    Le
  ]), o.useEffect(() => {
    !ee || v || (L.current(), w.current.forEach((e) => {
      e?.stop && e.stop();
    }), w.current.clear(), G || nt({}));
  }, [G, N, ee, U, v]);
  const Ct = o.useCallback((e, t) => {
    S.current = { pointerId: e.pointerId, note: t.note }, e.preventDefault(), $(t.note, t.frequency);
  }, [$]), xt = o.useCallback((e, t) => {
    const n = S.current;
    n.pointerId === e.pointerId && n.note !== t.note && (n.note && I(n.note), S.current.note = t.note, $(t.note, t.frequency));
  }, [I, $]), _t = o.useCallback((e, t) => {
    const n = S.current;
    n.pointerId === e.pointerId && n.note === t.note && (I(t.note), S.current.note = null);
  }, [I]), fe = o.useCallback((e) => {
    const t = S.current;
    t.pointerId === e.pointerId && (t.note && I(t.note), S.current = { pointerId: null, note: null });
  }, [I]), f = { ...Xt };
  f["--ui-bits-color-a"] = O, f["--ui-bits-color-b"] = ie, f["--vk-font-size"] = `${K}px`, f["--vk-header-height"] = `${st}px`, f["--vk-body-height"] = `${st * it}px`, f["--vk-header-bg"] = ie, f["--vk-header-text"] = O, f["--vk-border"] = O, f["--vk-bg"] = xe, f["--vk-white"] = ct, f["--vk-white-text"] = xe, f["--vk-black"] = xe, f["--vk-black-text"] = ct, f["--vk-white-active"] = hn, f["--vk-black-active"] = vn;
  const bn = o.useCallback((e) => {
    const t = Math.max(B, Math.min(Y, Math.round(e))), n = H[t] ?? H[B] ?? 60;
    Xe(n);
  }, [Y, Xe]), pn = o.useCallback((e) => {
    const t = Math.max(4, Math.min(88, Math.round(e)));
    Ye(t);
  }, [Ye]), yn = o.useCallback((e) => {
    const t = Math.max(3, Math.min(12, Math.round(e)));
    Je(t);
  }, [Je]), Cn = he ? /* @__PURE__ */ P(gn, { children: [
    he ? /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__controls", children: [
      J ? /* @__PURE__ */ a(
        Ln,
        {
          label: "Soundfont",
          options: z,
          value: Q,
          onChange: (e) => cn(e),
          borderStyle: "b",
          fontSize: K,
          className: "ui-bits-virtual-keyboard__dropdown",
          icon: mn,
          preventFocusOnPointerDown: !0
        }
      ) : null,
      /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Start:" }),
        /* @__PURE__ */ a(
          De,
          {
            min: B,
            max: Y,
            step: 1,
            value: fn,
            onChange: bn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: me,
            ariaLabel: "Keyboard start note",
            formatDisplayValue: (e) => {
              const t = Math.max(B, Math.min(Y, Math.round(e))), n = H[t] ?? H[B] ?? 60;
              return Fe(n);
            }
          }
        )
      ] }),
      /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Notes:" }),
        /* @__PURE__ */ a(
          De,
          {
            min: 4,
            max: 88,
            step: 1,
            value: N,
            onChange: pn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: me,
            ariaLabel: "Keyboard note count",
            formatDisplayValue: (e) => `${Math.round(e)}`
          }
        )
      ] }),
      Lt ? /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Height:" }),
        /* @__PURE__ */ a(
          De,
          {
            min: 3,
            max: 12,
            step: 1,
            value: it,
            onChange: yn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: me,
            ariaLabel: "Keyboard height"
          }
        )
      ] }) : null
    ] }) : null,
    ve ? /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header-extra", children: ve }) : null
  ] }) : ve, xn = o.useMemo(() => [
    {
      value: "pointer",
      icon: /* @__PURE__ */ a(wn, {}),
      ariaLabel: "Pointer mode",
      title: "Pointer mode"
    },
    {
      value: "keyboard",
      icon: /* @__PURE__ */ a(Mn, {}),
      ariaLabel: "Keyboard mode",
      title: "Keyboard mode"
    }
  ], []), gt = o.useCallback((e) => {
    if (!X) return null;
    const t = Be(e);
    if (t == null) return null;
    const n = t - U;
    return n < 0 || n >= N || n >= Ue.length ? null : Ue[n];
  }, [N, X, U]);
  return o.useEffect(() => {
    if (!X) {
      g.current.forEach((n) => F.current(n)), g.current.clear();
      return;
    }
    const e = (n) => {
      if (n.repeat || n.metaKey || n.ctrlKey || n.altKey || zn(n.target)) return;
      const r = n.key.toLowerCase(), d = Ue.indexOf(r), T = yt.current;
      if (d < 0 || d >= T || g.current.has(r)) return;
      const u = pt.current + d, C = Fe(u), A = Nt(u);
      g.current.set(r, C), n.preventDefault(), bt.current(C, A);
    }, t = (n) => {
      const r = n.key.toLowerCase(), d = g.current.get(r);
      d && (g.current.delete(r), n.preventDefault(), F.current(d), g.current.size === 0 && L.current());
    };
    return window.addEventListener("keydown", e, !0), window.addEventListener("keyup", t, !0), () => {
      window.removeEventListener("keydown", e, !0), window.removeEventListener("keyup", t, !0), g.current.forEach((n) => F.current(n)), g.current.clear();
    };
  }, [X]), o.useEffect(() => {
    if (typeof window > "u") return;
    const e = () => {
      Pe.current(), L.current();
    };
    return window.addEventListener("pointerup", e, !0), window.addEventListener("pointercancel", e, !0), () => {
      window.removeEventListener("pointerup", e, !0), window.removeEventListener("pointercancel", e, !0);
    };
  }, []), o.useEffect(() => {
    if (typeof window > "u") return;
    const e = () => {
      Pe.current(), g.current.forEach((n) => F.current(n)), g.current.clear(), L.current();
    }, t = () => {
      document.visibilityState === "hidden" && e();
    };
    return window.addEventListener("blur", e), document.addEventListener("visibilitychange", t), () => {
      window.removeEventListener("blur", e), document.removeEventListener("visibilitychange", t);
    };
  }, []), /* @__PURE__ */ P(
    "div",
    {
      className: ["ui-bits-virtual-keyboard", Gt].filter(Boolean).join(" "),
      style: f,
      "aria-label": Ge,
      children: [
        /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header", children: /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__header-inner", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header-controls", children: /* @__PURE__ */ a(
            Nn,
            {
              behavior: "cycle",
              value: X ? "keyboard" : "pointer",
              options: xn,
              onChange: (e) => sn(e === "keyboard"),
              onPointerDown: (e) => {
                e.preventDefault();
              },
              borderStyle: "none",
              fontSize: K,
              colorA: O,
              colorB: ie
            }
          ) }),
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header-content", children: Cn ?? null })
        ] }) }),
        /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__body", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__white", children: ye.map((e) => /* @__PURE__ */ a(
            "button",
            {
              type: "button",
              className: `ui-bits-virtual-keyboard__key ui-bits-virtual-keyboard__key--white${se[e.note] ? " is-active" : ""}`,
              "data-note": e.note,
              "data-frequency": e.frequency,
              "aria-label": `Play ${e.note}`,
              "aria-pressed": !!se[e.note],
              onPointerDown: (t) => Ct(t, e),
              onPointerEnter: (t) => xt(t, e),
              onPointerLeave: (t) => _t(t, e),
              onPointerUp: (t) => {
                fe(t);
              },
              onPointerCancel: (t) => {
                fe(t);
              },
              children: (() => {
                const t = gt(e.note);
                return t ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: t }) : Qe ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: e.note }) : null;
              })()
            },
            e.note
          )) }),
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__black", children: ln.map((e, t) => {
            const n = e.position ?? t + 0.5;
            return /* @__PURE__ */ a(
              "button",
              {
                type: "button",
                className: `ui-bits-virtual-keyboard__key ui-bits-virtual-keyboard__key--black${se[e.note] ? " is-active" : ""}`,
                style: {
                  left: `${n * rt}%`,
                  width: `${dn}%`
                },
                "data-note": e.note,
                "data-frequency": e.frequency,
                "aria-label": `Play ${e.note}`,
                "aria-pressed": !!se[e.note],
                onPointerDown: (r) => Ct(r, e),
                onPointerEnter: (r) => xt(r, e),
                onPointerLeave: (r) => _t(r, e),
                onPointerUp: (r) => {
                  fe(r);
                },
                onPointerCancel: (r) => {
                  fe(r);
                },
                children: (() => {
                  const r = gt(e.note);
                  return r ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: r }) : Qe ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: e.note }) : null;
                })()
              },
              e.note
            );
          }) })
        ] }),
        /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer", children: /* @__PURE__ */ P("div", { className: "ui-bits-virtual-keyboard__footer-inner", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer-controls" }),
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer-content", children: Ut ?? null })
        ] }) })
      ]
    }
  );
}
export {
  Qn as V
};
//# sourceMappingURL=VirtualKeyboard-CvGY0kxu.js.map
