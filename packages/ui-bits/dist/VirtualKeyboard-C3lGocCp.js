import { jsx as a, jsxs as R, Fragment as wn } from "react/jsx-runtime";
import r from "react";
import { MousePointer2 as Mn, CaseUpper as gn, Piano as En } from "lucide-react";
import { u as Sn } from "./panelGap-DjV8XIAA.js";
import { I as kn } from "./IconButton-BvvMagK1.js";
import { I as Nn } from "./IconDropdown-up2bKIx5.js";
import { D as Ke } from "./Dial-C7q_hztm.js";
import { c as In, d as Ln } from "./hooks-KNH81MTH.js";
const St = "C4", An = 13, Pn = 6, Rn = !1, Tn = "tonejs", Dn = 18, Kn = "#f2f0e5", Un = "#1c1b1a", kt = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], On = /* @__PURE__ */ new Set([1, 3, 6, 8, 10]), Nt = /* @__PURE__ */ new Set([0, 2, 4, 5, 7, 9, 11]), $n = 21, H = (() => {
  const s = [];
  for (let i = 0; i <= 127; i += 1)
    Nt.has(i % 12) && s.push(i);
  return s;
})(), B = Math.max(0, H.indexOf($n));
function Be(s) {
  const i = Math.round(s), u = kt[(i % 12 + 12) % 12], b = Math.floor(i / 12) - 1;
  return `${u}${b}`;
}
function It(s) {
  const i = Math.round(s);
  return 440 * Math.pow(2, (i - 69) / 12);
}
function He(s) {
  const i = s.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!i) return null;
  const [, u, b, C] = i, _ = u.toUpperCase(), m = kt.findIndex((T) => T[0] === _ && T.length === 1);
  if (m < 0) return null;
  const w = Number(C);
  if (!Number.isFinite(w)) return null;
  let g = m;
  b === "#" && (g += 1), b === "b" && (g -= 1);
  const E = (g % 12 + 12) % 12;
  return (w + 1) * 12 + E;
}
function gt(s) {
  if (typeof s == "number" && Number.isFinite(s)) {
    const i = Math.max(0, Math.min(127, Math.round(s)));
    return Ue(i);
  }
  if (typeof s == "string") {
    const i = He(s);
    if (i != null) {
      const u = Math.max(0, Math.min(127, i));
      return Ue(u);
    }
  }
  return Ue(He(St) ?? 60);
}
function Ue(s) {
  let i = Math.max(0, Math.min(127, Math.round(s)));
  for (; i > 0 && !Nt.has(i % 12); )
    i -= 1;
  return i;
}
function Fn(s, i) {
  const u = Math.max(1, Math.round(i)), b = [], C = [];
  let _ = 0;
  for (let m = 0; m < u; m += 1) {
    const w = s + m, g = Be(w), E = It(w), T = (w % 12 + 12) % 12;
    if (On.has(T)) {
      const X = _ - 1 + 0.7;
      C.push({ note: g, frequency: E, position: X });
    } else
      b.push({ note: g, frequency: E }), _ += 1;
  }
  return { whiteKeys: b, blackKeys: C };
}
function Bn(s) {
  const u = s * 0.35, C = s * 1;
  return Math.max(
    Math.round(C + u * 2 + 2),
    Math.round(s + u * 1.5),
    Dn
  );
}
const Oe = [
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
let $e = null, Fe = null;
function Et(s, i) {
  const u = i instanceof Error ? i.message : String(i);
  return new Error(
    `[ui-bits] Missing optional audio dependency "${s}". Install "${s}" to use VirtualKeyboard audio playback. (${u})`
  );
}
function Hn(s, i) {
  return !s && !i ? null : {
    ...s ?? {},
    ...i ?? {}
  };
}
async function Vn() {
  return $e || ($e = import("tone").then((s) => s)), $e;
}
async function zn() {
  return Fe || (Fe = import("soundfont-player").then((s) => s)), Fe;
}
function Wn(s) {
  if (!(s instanceof HTMLElement)) return !1;
  const i = s.tagName.toLowerCase();
  return i === "input" || i === "textarea" || i === "select" ? !0 : s.isContentEditable;
}
function G(s, i, u, b) {
  const [C, _] = Ln(b), m = b !== void 0 && s === void 0, [w, g] = r.useState(i), E = s !== void 0, T = E ? s : m ? C ?? w : w, X = r.useCallback((Y) => {
    !E && !m && g(Y), m && _(Y), u?.(Y);
  }, [E, u, _, m]);
  return r.useEffect(() => {
    !m || C !== void 0 || _(i);
  }, [i, _, m, C]), [T, X];
}
function oo({
  whiteKeys: s,
  blackKeys: i,
  startNote: u,
  defaultStartNote: b,
  onStartNoteChange: C,
  noteCount: _,
  defaultNoteCount: m,
  onNoteCountChange: w,
  showLabels: g,
  defaultShowLabels: E,
  onShowLabelsChange: T,
  heightUnits: X,
  defaultHeightUnits: Y,
  onHeightUnitsChange: Lt,
  showControls: me = !0,
  showHeightControl: At = !0,
  instrumentOptions: Ve = [],
  soundfontOptions: ze = [],
  instrument: Pt,
  defaultInstrument: Rt,
  onInstrumentChange: Tt,
  toneInstrumentValue: Dt = Tn,
  instrumentIcon: Kt,
  soundfontConfig: We,
  toneConfig: qe,
  header: ve,
  footer: Ut,
  colorA: Ot,
  colorB: $t,
  whiteKeyColor: Ft,
  blackKeyColor: Bt,
  whiteKeyActiveColor: Ht,
  blackKeyActiveColor: Vt,
  dialIndicatorColor: be,
  soundfont: pe,
  tone: ne,
  keyboardShortcutsEnabled: zt,
  defaultKeyboardShortcutsEnabled: Wt = Rn,
  onKeyboardShortcutsChange: qt,
  controlIdPrefix: jt,
  controlIds: je,
  activeNotes: J,
  onNoteOn: Ge,
  onNoteOff: Xe,
  className: Gt,
  style: Xt,
  fontSize: Yt,
  ariaLabel: Ye = "Virtual keyboard"
}) {
  const ye = In(jt, Ye), V = r.useCallback((e) => je?.[e] ?? (ye ? `${ye}.${e}` : void 0), [je, ye]), Jt = V("startNote"), Qt = V("noteCount"), Zt = V("heightUnits"), en = V("showLabels"), tn = V("keyboardShortcutsEnabled"), nn = V("instrument"), [oe, Je] = G(
    u,
    b ?? St,
    C,
    Jt
  ), [on, Qe] = G(
    _,
    m ?? An,
    w,
    Qt
  ), [rn, Ze] = G(
    X,
    Y ?? Pn,
    Lt,
    Zt
  ), [et] = G(
    g,
    E ?? !1,
    T,
    en
  ), [Q, sn] = G(
    zt,
    Wt,
    qt,
    tn
  ), tt = r.useMemo(() => ze.map(({ value: e, label: t, ...n }) => ({
    value: e,
    label: t,
    source: "soundfont",
    soundfontConfig: n,
    toneConfig: void 0
  })), [ze]), z = r.useMemo(() => {
    const e = /* @__PURE__ */ new Set();
    return [...Ve, ...tt].filter((t) => e.has(t.value) ? !1 : (e.add(t.value), !0));
  }, [Ve, tt]), [an, cn] = G(
    Pt,
    Rt ?? z[0]?.value ?? "",
    Tt,
    nn
  ), N = r.useRef({
    pointerId: null,
    note: null
  }), S = r.useRef(/* @__PURE__ */ new Map()), re = r.useRef(/* @__PURE__ */ new Set()), I = r.useRef(null), D = r.useRef(null), M = r.useRef(/* @__PURE__ */ new Map()), [nt, ot] = r.useState(null), [un, rt] = r.useState({});
  if (nt)
    throw nt;
  const se = J ?? un, L = Math.max(1, Math.min(88, Math.round(on))), st = r.useMemo(() => {
    if (s && i)
      return { white: s, black: i };
    const e = gt(oe), { whiteKeys: t, blackKeys: n } = Fn(e, L);
    return {
      white: t,
      black: n
    };
  }, [i, L, oe, s]), Ce = st.white, ln = st.black, xe = Sn(), it = Ce.length > 0 ? 100 / Ce.length : 100, dn = it * 0.6, K = Yt ?? xe?.fontSize ?? 12, at = Bn(K), ct = Math.max(1, Math.round(rn)), U = r.useMemo(() => gt(oe), [oe]), ut = H.indexOf(U), Z = Math.max(0, H.length - 1), fn = Math.max(
    B,
    Math.min(Z, ut >= 0 ? ut : B)
  ), O = Ot ?? xe?.colorA ?? Kn, ie = $t ?? xe?.colorB ?? Un, lt = Ft ?? ie, _e = Bt ?? O, hn = Ht ?? O, mn = Vt ?? O, W = me && z.length > 0 && !pe && !ne, q = an || z[0]?.value || "", j = r.useMemo(() => z.find((e) => e.value === q) ?? null, [q, z]), ae = W && (j?.source === "tone" || j?.toneConfig != null || q === Dt), we = r.useMemo(() => Hn(We, j?.soundfontConfig), [j, We]), dt = r.useMemo(() => W && !ae && we ? { ...we, instrument: q } : null, [q, we, W, ae]), p = r.useMemo(() => {
    const e = pe ?? dt;
    return e ? typeof e == "string" ? { instrument: e } : e : null;
  }, [dt, pe]), v = r.useMemo(() => ne || (!W || !ae ? null : j?.toneConfig ?? qe ?? {}), [j, W, ne, qe, ae]), vn = Kt ?? /* @__PURE__ */ a(En, {}), ee = p?.instrument, ce = p?.soundfont, ue = p?.format, Me = p?.url, ge = p?.monitor ?? !0, Ee = p?.gain, Se = p?.attack, ke = p?.decay, Ne = p?.sustain, Ie = p?.release, Le = p?.notes, le = p?.context, Ae = p?.destination, te = v?.destination, de = v?.context ?? (te?.context instanceof AudioContext ? te.context : null), ft = Math.max(1, Math.round(v?.polyphony ?? 8)), Pe = v?.volume, ht = v?.attack, mt = v?.decay, vt = v?.sustain, bt = v?.release, fe = r.useCallback((e, t) => {
    J || rt((n) => {
      if (t)
        return n[e] ? n : { ...n, [e]: !0 };
      if (!n[e]) return n;
      const o = { ...n };
      return delete o[e], o;
    });
  }, [J]), $ = r.useCallback((e, t) => {
    try {
      const n = D.current;
      if (n)
        n.context.state === "suspended" && n.context.resume().catch(() => {
        }), n.toneModule.start().catch(() => {
        }), n.synth.triggerAttack(e);
      else {
        const o = I.current;
        if (o) {
          const { instrument: l, context: y } = o, d = M.current.get(e);
          d?.stop && d.stop(y.currentTime), M.current.delete(e), y.state === "suspended" && y.resume().catch(() => {
          });
          const x = l.start(e, y.currentTime);
          x && typeof x.stop == "function" && M.current.set(e, x);
        }
      }
    } catch {
    }
    re.current.add(e), Ge?.(e, t), fe(e, !0);
  }, [Ge, fe]), A = r.useCallback((e) => {
    try {
      const t = D.current;
      if (t)
        t.synth.triggerRelease(e);
      else {
        const n = I.current;
        if (n) {
          const { context: o } = n, l = M.current.get(e);
          l?.stop && l.stop(o.currentTime), M.current.delete(e);
        }
      }
    } catch {
    }
    re.current.delete(e), Xe?.(e), fe(e, !1);
  }, [Xe, fe]), pt = r.useRef($), F = r.useRef(A), Re = r.useRef(() => {
  }), P = r.useRef(() => {
  }), yt = r.useRef(U), Ct = r.useRef(L);
  r.useEffect(() => {
    pt.current = $;
  }, [$]), r.useEffect(() => {
    F.current = A;
  }, [A]), r.useEffect(() => {
    Re.current = () => {
      const e = N.current;
      e.note && F.current(e.note), N.current = { pointerId: null, note: null };
    };
  }, []), r.useEffect(() => {
    P.current = () => {
      Array.from(re.current).forEach((t) => F.current(t)), re.current.clear();
    };
  }, []), r.useEffect(() => {
    yt.current = U;
  }, [U]), r.useEffect(() => {
    Ct.current = L;
  }, [L]), r.useEffect(() => {
    if (!v) {
      D.current = null;
      return;
    }
    if (typeof AudioContext > "u" && !de && !te) {
      D.current = null;
      return;
    }
    let e = !1, t;
    return (async () => {
      let n;
      try {
        n = await Vn();
      } catch (De) {
        e || ot(Et("tone", De));
        return;
      }
      if (e) {
        D.current = null;
        return;
      }
      const o = te, l = o?.context, d = de ?? (l instanceof AudioContext ? l : null) ?? new AudioContext(), x = !de && !o, k = new n.Context({ context: d }), h = n.getContext();
      n.setContext(k);
      const Te = {
        attack: ht ?? 0.01,
        decay: mt ?? 0.1,
        sustain: vt ?? 0.3,
        release: bt ?? 0.8
      }, c = new n.PolySynth(n.Synth, { envelope: Te });
      c.maxPolyphony = ft, Pe !== void 0 && (c.volume.value = Pe), o && o !== d.destination ? c.connect(o) : c.toDestination(), P.current(), D.current = {
        toneModule: n,
        synth: c,
        context: d,
        destination: o ?? d.destination,
        ownsContext: x,
        toneContext: k
      }, t = () => {
        P.current(), c.releaseAll(), c.disconnect(), c.dispose(), D.current = null, n.getContext() === k && n.setContext(h), x && (k.dispose(), d.close().catch(() => {
        }));
      }, e && t();
    })(), () => {
      e = !0, t?.();
    };
  }, [
    v,
    de,
    te,
    ft,
    Pe,
    ht,
    mt,
    vt,
    bt
  ]), r.useEffect(() => {
    if (!ee || v) {
      I.current = null;
      return;
    }
    if (typeof AudioContext > "u" && !le && !Ae) {
      I.current = null;
      return;
    }
    let e = !1, t;
    return (async () => {
      let n;
      try {
        n = await zn();
      } catch (c) {
        e || ot(Et("soundfont-player", c));
        return;
      }
      if (e) {
        I.current = null;
        return;
      }
      const o = Ae, l = o?.context, d = le ?? (l instanceof AudioContext ? l : null) ?? new AudioContext(), x = !le && !o, k = Me ? Me.replace(/\/$/, "") : null, h = {};
      ce && (h.soundfont = ce), ue && (h.format = ue), Ee !== void 0 && (h.gain = Ee), Se !== void 0 && (h.attack = Se), ke !== void 0 && (h.decay = ke), Ne !== void 0 && (h.sustain = Ne), Ie !== void 0 && (h.release = Ie), Le !== void 0 && (h.notes = Le), !ge && o && (h.destination = o), k && (h.nameToUrl = (c, De, _n) => `${k}/${De ?? ce ?? "MusyngKite"}/${c}-${_n === "ogg" ? "ogg" : ue ?? "mp3"}.js`), P.current(), M.current.forEach((c) => {
        c?.stop && c.stop(d.currentTime);
      }), M.current.clear(), I.current = null;
      const Te = ee;
      n.instrument(d, Te, h).then((c) => {
        e || (o && (ge || h.destination !== o) && o !== d.destination && typeof c.connect == "function" && c.connect(o), I.current = {
          instrument: c,
          context: d,
          destination: o ?? d.destination,
          ownsContext: x
        });
      }).catch(() => {
        e || (I.current = null);
      }), t = () => {
        P.current(), M.current.forEach((c) => {
          c?.stop && c.stop();
        }), M.current.clear(), I.current = null, x && d.close().catch(() => {
        });
      }, e && t();
    })(), () => {
      e = !0, t?.();
    };
  }, [
    ee,
    v,
    ce,
    ue,
    Me,
    Ee,
    Se,
    ke,
    Ne,
    Ie,
    ge,
    Le,
    le,
    Ae
  ]), r.useEffect(() => {
    !ee || v || (P.current(), M.current.forEach((e) => {
      e?.stop && e.stop();
    }), M.current.clear(), J || rt({}));
  }, [J, L, ee, U, v]);
  const xt = r.useCallback((e, t) => {
    N.current = { pointerId: e.pointerId, note: t.note }, e.preventDefault(), $(t.note, t.frequency);
  }, [$]), _t = r.useCallback((e, t) => {
    const n = N.current;
    n.pointerId === e.pointerId && n.note !== t.note && (n.note && A(n.note), N.current.note = t.note, $(t.note, t.frequency));
  }, [A, $]), wt = r.useCallback((e, t) => {
    const n = N.current;
    n.pointerId === e.pointerId && n.note === t.note && (A(t.note), N.current.note = null);
  }, [A]), he = r.useCallback((e) => {
    const t = N.current;
    t.pointerId === e.pointerId && (t.note && A(t.note), N.current = { pointerId: null, note: null });
  }, [A]), f = { ...Xt };
  f["--ui-bits-color-a"] = O, f["--ui-bits-color-b"] = ie, f["--vk-font-size"] = `${K}px`, f["--vk-header-height"] = `${at}px`, f["--vk-body-height"] = `${at * ct}px`, f["--vk-header-bg"] = ie, f["--vk-header-text"] = O, f["--vk-border"] = O, f["--vk-bg"] = _e, f["--vk-white"] = lt, f["--vk-white-text"] = _e, f["--vk-black"] = _e, f["--vk-black-text"] = lt, f["--vk-white-active"] = hn, f["--vk-black-active"] = mn;
  const bn = r.useCallback((e) => {
    const t = Math.max(B, Math.min(Z, Math.round(e))), n = H[t] ?? H[B] ?? 60;
    Je(n);
  }, [Z, Je]), pn = r.useCallback((e) => {
    const t = Math.max(4, Math.min(88, Math.round(e)));
    Qe(t);
  }, [Qe]), yn = r.useCallback((e) => {
    const t = Math.max(3, Math.min(12, Math.round(e)));
    Ze(t);
  }, [Ze]), Cn = me ? /* @__PURE__ */ R(wn, { children: [
    me ? /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__controls", children: [
      W ? /* @__PURE__ */ a(
        Nn,
        {
          label: "Soundfont",
          options: z,
          value: q,
          onChange: (e) => cn(e),
          borderStyle: "b",
          fontSize: K,
          className: "ui-bits-virtual-keyboard__dropdown",
          icon: vn,
          preventFocusOnPointerDown: !0
        }
      ) : null,
      /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Start:" }),
        /* @__PURE__ */ a(
          Ke,
          {
            min: B,
            max: Z,
            step: 1,
            value: fn,
            onChange: bn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: be,
            ariaLabel: "Keyboard start note",
            formatDisplayValue: (e) => {
              const t = Math.max(B, Math.min(Z, Math.round(e))), n = H[t] ?? H[B] ?? 60;
              return Be(n);
            }
          }
        )
      ] }),
      /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Notes:" }),
        /* @__PURE__ */ a(
          Ke,
          {
            min: 4,
            max: 88,
            step: 1,
            value: L,
            onChange: pn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: be,
            ariaLabel: "Keyboard note count",
            formatDisplayValue: (e) => `${Math.round(e)}`
          }
        )
      ] }),
      At ? /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__control-group", children: [
        /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__control-label", children: "Height:" }),
        /* @__PURE__ */ a(
          Ke,
          {
            min: 3,
            max: 12,
            step: 1,
            value: ct,
            onChange: yn,
            fontSize: K,
            indicatorStyle: "arc",
            indicatorColor: be,
            ariaLabel: "Keyboard height"
          }
        )
      ] }) : null
    ] }) : null,
    ve ? /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header-extra", children: ve }) : null
  ] }) : ve, xn = r.useMemo(() => [
    {
      value: "pointer",
      icon: /* @__PURE__ */ a(Mn, {}),
      ariaLabel: "Pointer mode",
      title: "Pointer mode"
    },
    {
      value: "keyboard",
      icon: /* @__PURE__ */ a(gn, {}),
      ariaLabel: "Keyboard mode",
      title: "Keyboard mode"
    }
  ], []), Mt = r.useCallback((e) => {
    if (!Q) return null;
    const t = He(e);
    if (t == null) return null;
    const n = t - U;
    return n < 0 || n >= L || n >= Oe.length ? null : Oe[n];
  }, [L, Q, U]);
  return r.useEffect(() => {
    if (!Q) {
      S.current.forEach((o) => F.current(o)), S.current.clear();
      return;
    }
    const e = (o) => {
      if (o.repeat || o.metaKey || o.ctrlKey || o.altKey || Wn(o.target)) return;
      const l = o.key.toLowerCase(), y = Oe.indexOf(l), d = Ct.current;
      if (y < 0 || y >= d || S.current.has(l)) return;
      const x = yt.current + y, k = Be(x), h = It(x);
      S.current.set(l, k), o.preventDefault(), pt.current(k, h);
    }, t = (o) => {
      const l = o.key.toLowerCase(), y = S.current.get(l);
      y && (S.current.delete(l), o.preventDefault(), F.current(y), S.current.size === 0 && P.current());
    };
    window.addEventListener("keydown", e, !0), window.addEventListener("keyup", t, !0);
    const n = S.current;
    return () => {
      window.removeEventListener("keydown", e, !0), window.removeEventListener("keyup", t, !0), n.forEach((o) => F.current(o)), n.clear();
    };
  }, [Q]), r.useEffect(() => {
    if (typeof window > "u") return;
    const e = () => {
      Re.current(), P.current();
    };
    return window.addEventListener("pointerup", e, !0), window.addEventListener("pointercancel", e, !0), () => {
      window.removeEventListener("pointerup", e, !0), window.removeEventListener("pointercancel", e, !0);
    };
  }, []), r.useEffect(() => {
    if (typeof window > "u") return;
    const e = () => {
      Re.current(), S.current.forEach((n) => F.current(n)), S.current.clear(), P.current();
    }, t = () => {
      document.visibilityState === "hidden" && e();
    };
    return window.addEventListener("blur", e), document.addEventListener("visibilitychange", t), () => {
      window.removeEventListener("blur", e), document.removeEventListener("visibilitychange", t);
    };
  }, []), /* @__PURE__ */ R(
    "div",
    {
      className: ["ui-bits-virtual-keyboard", Gt].filter(Boolean).join(" "),
      style: f,
      "aria-label": Ye,
      children: [
        /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header", children: /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__header-inner", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__header-controls", children: /* @__PURE__ */ a(
            kn,
            {
              behavior: "cycle",
              value: Q ? "keyboard" : "pointer",
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
        /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__body", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__white", children: Ce.map((e) => /* @__PURE__ */ a(
            "button",
            {
              type: "button",
              className: `ui-bits-virtual-keyboard__key ui-bits-virtual-keyboard__key--white${se[e.note] ? " is-active" : ""}`,
              "data-note": e.note,
              "data-frequency": e.frequency,
              "aria-label": `Play ${e.note}`,
              "aria-pressed": !!se[e.note],
              onPointerDown: (t) => xt(t, e),
              onPointerEnter: (t) => _t(t, e),
              onPointerLeave: (t) => wt(t, e),
              onPointerUp: (t) => {
                he(t);
              },
              onPointerCancel: (t) => {
                he(t);
              },
              children: (() => {
                const t = Mt(e.note);
                return t ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: t }) : et ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: e.note }) : null;
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
                  left: `${n * it}%`,
                  width: `${dn}%`
                },
                "data-note": e.note,
                "data-frequency": e.frequency,
                "aria-label": `Play ${e.note}`,
                "aria-pressed": !!se[e.note],
                onPointerDown: (o) => xt(o, e),
                onPointerEnter: (o) => _t(o, e),
                onPointerLeave: (o) => wt(o, e),
                onPointerUp: (o) => {
                  he(o);
                },
                onPointerCancel: (o) => {
                  he(o);
                },
                children: (() => {
                  const o = Mt(e.note);
                  return o ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: o }) : et ? /* @__PURE__ */ a("span", { className: "ui-bits-virtual-keyboard__label", children: e.note }) : null;
                })()
              },
              e.note
            );
          }) })
        ] }),
        /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer", children: /* @__PURE__ */ R("div", { className: "ui-bits-virtual-keyboard__footer-inner", children: [
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer-controls" }),
          /* @__PURE__ */ a("div", { className: "ui-bits-virtual-keyboard__footer-content", children: Ut ?? null })
        ] }) })
      ]
    }
  );
}
export {
  St as D,
  oo as V,
  An as a,
  Pn as b
};
//# sourceMappingURL=VirtualKeyboard-C3lGocCp.js.map
