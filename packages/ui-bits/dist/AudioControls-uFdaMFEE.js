import { jsx as T, jsxs as Le } from "react/jsx-runtime";
import e from "react";
import { Play as cn, Pause as ln, VolumeX as fn, Volume2 as dn } from "lucide-react";
import { u as mt, A as mn } from "./animationSuspension-BEQdvvQj.js";
import { f as pn, b as hn, L as Ee } from "./LFOSlider-Cv0xjz_G.js";
import { u as Wt } from "./frameLoop-DbiGWmY_.js";
import { f as Lt } from "./flexoki-DpJ9ZEpp.js";
import { u as gn } from "./panelGap-DjV8XIAA.js";
import { I as Vt } from "./IconButton-BvvMagK1.js";
import { S as xn } from "./SegmentBar-DTdbMbCH.js";
import bn from "typegpu";
import { c as Mn, d as yn } from "./hooks-KNH81MTH.js";
let Rt = null, st = null;
const Rn = [0.16, 0.47, 0.86], vn = [0.02, 0.02, 0.04], Ht = 24, wn = Ht * Float32Array.BYTES_PER_ELEMENT, Ve = 64, Cn = 0.2, Sn = 4, vt = 12, zt = 0.01, An = 20, Bn = 80, Nt = (t, o, n) => Math.max(o, Math.min(n, t)), Dt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : Math.max(0, Math.min(1, 1 - Math.exp(-d / n)));
};
async function kn() {
  return navigator.gpu ? Rt || (st || (st = bn.init().then((t) => (Rt = t, t)).catch((t) => (console.error("AudioFFTWindow: TypeGPU init failed", t), st = null, null))), st) : null;
}
function Ue(t) {
  return Number.parseInt(t, 16) / 255;
}
function Ot(t, o = [0, 0, 0]) {
  if (!t) return o;
  const n = t.trim();
  if (n.startsWith("#")) {
    if (n.length === 7)
      return [
        Ue(n.slice(1, 3)),
        Ue(n.slice(3, 5)),
        Ue(n.slice(5, 7))
      ];
    if (n.length === 4)
      return [
        Ue(n[1] + n[1]),
        Ue(n[2] + n[2]),
        Ue(n[3] + n[3])
      ];
  }
  return o;
}
function Pn(t) {
  const o = t.createShaderModule({
    code: `
struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
  discreteMode : f32,
  rawBinCount : f32,
  frequencyMin : f32,
  frequencyMax : f32,
};

@group(0) @binding(0) var<storage, read> rawFft : array<f32>;
@group(0) @binding(1) var stateSrc : texture_storage_2d<rgba32float, read>;
@group(0) @binding(2) var stateDst : texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

fn sampleRaw(position : f32) -> f32 {
  let maxIndex = max(0.0, uniforms.rawBinCount - 1.0);
  if (maxIndex <= 0.0) {
    return rawFft[0];
  }
  let clamped = clamp(position, 0.0, maxIndex);
  let lower = i32(floor(clamped));
  let upper = min(i32(maxIndex), lower + 1);
  let t = clamped - f32(lower);
  let lowerValue = rawFft[lower];
  let upperValue = rawFft[upper];
  return mix(lowerValue, upperValue, t);
}

@compute @workgroup_size(${Ve})
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let binCount = max(1.0, uniforms.binCount);
  let index = gid.x;
  if (f32(index) >= binCount) {
    return;
  }
  let maxRawIndex = max(0.0, uniforms.rawBinCount - 1.0);
  if (maxRawIndex <= 0.0) {
    textureStore(stateDst, vec2<i32>(i32(index), 0), vec4<f32>(0.0, 0.0, 0.0, 0.0));
    return;
  }
  let minPos = uniforms.frequencyMin * maxRawIndex;
  let maxPos = uniforms.frequencyMax * maxRawIndex;
  var ratio = 0.5;
  if (binCount > 1.0) {
    ratio = f32(index) / (binCount - 1.0);
  }
  let position = mix(minPos, maxPos, ratio);
  let binSpan = max(1.0, binCount - 1.0);
  let deltaPos = (maxPos - minPos) / binSpan;
  var current = sampleRaw(position);
  if (uniforms.blurSigma > 0.001) {
    let radius = min(${vt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${vt}; offset = offset + 1) {
        if (offset > radius) { continue; }
        let distance = f32(offset);
        let weight = exp(-(distance * distance) / (2.0 * uniforms.blurSigma * uniforms.blurSigma));
        let delta = distance * deltaPos;
        accum = accum + sampleRaw(position + delta) * weight;
        accum = accum + sampleRaw(position - delta) * weight;
        weightSum = weightSum + 2.0 * weight;
      }
      current = accum / max(weightSum, 1e-4);
    }
  }
  let coord = vec2<i32>(i32(index), 0);
  let previous = textureLoad(stateSrc, coord);
  let prevValue = previous.x;
  let prevPeak = previous.y;
  let holdTimer = previous.z;
  let fallTimer = previous.w;
  let weight = select(uniforms.releaseWeight, uniforms.attackWeight, current >= prevValue);
  let smoothed = prevValue + (current - prevValue) * weight;
  var nextPeak = prevPeak;
  var nextHold = holdTimer;
  var nextFall = fallTimer;
  if (smoothed >= prevPeak) {
    nextPeak = smoothed;
    nextHold = uniforms.holdSeconds;
    nextFall = 0.0;
  } else if (holdTimer > 0.0) {
    nextHold = max(0.0, holdTimer - uniforms.deltaSeconds);
    nextFall = 0.0;
  } else {
    let elapsed = fallTimer + uniforms.deltaSeconds;
    nextFall = elapsed;
    let accel = 1.0 + uniforms.gravity * elapsed;
    let drop = uniforms.peakDecay * accel * uniforms.deltaSeconds;
    nextPeak = max(0.0, prevPeak - drop);
  }
  textureStore(stateDst, coord, vec4<f32>(smoothed, nextPeak, nextHold, nextFall));
}
`
  }), n = t.createShaderModule({
    code: `
const MAX_RADIUS : i32 = ${vt};

struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
  discreteMode : f32,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var stateTexture : texture_storage_2d<rgba32float, read>;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0)
  );
  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );
  var out : VertexOutput;
  out.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  out.uv = uvs[vertexIndex];
  return out;
}

fn sampleStateNormalized(u : f32) -> vec2<f32> {
  let bins = max(1.0, uniforms.binCount);
  let maxIndex = max(0.0, bins - 1.0);
  let clamped = clamp(u, 0.0, 1.0);
  if (uniforms.discreteMode > 0.5 || maxIndex <= 0.0) {
    let scaled = clamp(floor(clamped * bins), 0.0, maxIndex);
    let discreteIdx = i32(scaled);
    return textureLoad(stateTexture, vec2<i32>(discreteIdx, 0)).xy;
  }
  let scaled = clamped * maxIndex;
  let lower = i32(floor(scaled));
  let upper = i32(min(maxIndex, f32(lower) + 1.0));
  let frac = scaled - f32(lower);
  let lowerSample = textureLoad(stateTexture, vec2<i32>(lower, 0)).xy;
  let upperSample = textureLoad(stateTexture, vec2<i32>(upper, 0)).xy;
  return lowerSample + (upperSample - lowerSample) * frac;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let normalizedX = in.uv.x;
  let sample = sampleStateNormalized(normalizedX);
  let amplitude = sample.x;
  let peak = sample.y;
  let y = 1.0 - in.uv.y;
  let edgeMask = smoothstep(amplitude - 0.01, amplitude, y);
  let activeMask = 1.0 - edgeMask;
  let activeColor = uniforms.colorActive.xyz;
  let inactiveColor = uniforms.colorInactive.xyz;
  var color = mix(inactiveColor, activeColor, activeMask);
  if (uniforms.playback >= 0.0 && uniforms.playback <= 1.0) {
    let playhead = uniforms.playback;
    let lineWidth = 0.004;
    let distance = abs(normalizedX - playhead);
    let lineFeather = smoothstep(lineWidth * 0.5, lineWidth, distance);
    let lineMask = 1.0 - lineFeather;
    let invertedColor = mix(activeColor, inactiveColor, activeMask);
    color = mix(color, invertedColor, lineMask);
  }
  if (peak > 0.01) {
    let peakY = clamp(peak, 0.0, 1.0);
    let peakLine = 1.0 - smoothstep(0.0, 0.01, abs(y - peakY));
    color = mix(color, activeColor, peakLine);
  }
  return vec4<f32>(color, 1.0);
}
`
  });
  return { computeModule: o, renderModule: n };
}
function Gt(t, o) {
  return t.createTexture({
    size: [o, 1, 1],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  });
}
function En(t) {
  t && (t.uniformBuffer.destroy(), t.rawBuffer.destroy(), t.stateTextures[0].destroy(), t.stateTextures[1].destroy());
}
function Tn(t, o, n, d) {
  const b = o.getContext("webgpu");
  if (!b) return null;
  const u = navigator.gpu.getPreferredCanvasFormat();
  b.configure({
    device: t,
    format: u,
    alphaMode: "opaque"
  });
  const { computeModule: i, renderModule: w } = Pn(t), m = t.createBuffer({
    size: wn,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), A = t.createBuffer({
    size: Math.max(1, d) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  }), g = [
    Gt(t, n),
    Gt(t, n)
  ], l = g.map((M) => M.createView({ dimension: "2d" })), f = t.createComputePipeline({
    layout: "auto",
    compute: { module: i, entryPoint: "cs_main" }
  }), I = t.createRenderPipeline({
    layout: "auto",
    vertex: { module: w, entryPoint: "vs_main" },
    fragment: {
      module: w,
      entryPoint: "fs_main",
      targets: [{ format: u }]
    },
    primitive: { topology: "triangle-list" }
  }), B = f.getBindGroupLayout(0), k = I.getBindGroupLayout(0), V = [
    t.createBindGroup({
      layout: B,
      entries: [
        { binding: 0, resource: { buffer: A } },
        { binding: 1, resource: l[0] },
        { binding: 2, resource: l[1] },
        { binding: 3, resource: { buffer: m } }
      ]
    }),
    t.createBindGroup({
      layout: B,
      entries: [
        { binding: 0, resource: { buffer: A } },
        { binding: 1, resource: l[1] },
        { binding: 2, resource: l[0] },
        { binding: 3, resource: { buffer: m } }
      ]
    })
  ], z = [
    t.createBindGroup({
      layout: k,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: l[0] }
      ]
    }),
    t.createBindGroup({
      layout: k,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: l[1] }
      ]
    })
  ], L = Math.max(1, Math.ceil(n / Ve));
  return {
    context: b,
    format: u,
    uniformBuffer: m,
    rawBuffer: A,
    rawCapacity: Math.max(1, d),
    stateTextures: g,
    stateStorageViews: l,
    computePipeline: f,
    renderPipeline: I,
    computeBindGroups: V,
    renderBindGroups: z,
    workgroupCount: L,
    binCapacity: n
  };
}
function In({
  heightUnits: t = 6,
  unitSizePx: o,
  maxWidth: n,
  maxBins: d = 1024,
  playbackRatio: b = 0,
  showPlaybackIndicator: u = !0,
  onScrubStart: i,
  onScrub: w,
  onScrubEnd: m,
  activeColor: A,
  inactiveColor: g,
  peakDecay: l = 0.05,
  rawFftDataRef: f,
  rawFrameVersion: I,
  rawBinCount: B = 0,
  attackMs: k = An,
  releaseMs: V = Bn,
  blurSigma: z = 0,
  discreteBins: L = !0,
  frequencyMin: M = 0,
  frequencyMax: D = 1,
  suspended: O
}) {
  const q = e.useRef(null), Q = e.useRef(null), ne = e.useRef(null), [Z, Y] = e.useState(() => typeof navigator < "u" && !!navigator.gpu), [P, G] = e.useState({
    width: 480,
    height: Math.max(1, t) * o
  }), [de, me] = e.useState(() => Math.max(1, Math.ceil(Math.max(1, Math.floor(d)) / Ve) * Ve)), [pe, be] = e.useState(() => Math.max(1, B || 1)), J = e.useRef(Math.max(0, Math.min(1, b))), ce = e.useRef(Math.max(0, z)), le = e.useRef(Math.max(0, k)), re = e.useRef(Math.max(0, V)), oe = e.useRef(Math.max(5e-4, l)), W = e.useRef(L ? 1 : 0), y = e.useRef(Math.max(0, Math.min(1, M))), _ = e.useRef(Math.max(0, Math.min(1, D))), F = e.useRef(Math.max(1, Math.floor(d))), p = e.useRef(!1), h = e.useRef(typeof performance < "u" ? performance.now() : Date.now()), x = e.useRef(new Float32Array(Ht)), a = e.useRef(null), s = e.useRef(0), S = e.useRef(null), R = e.useRef(null), H = e.useRef(null), X = mt(O), ae = e.useRef(X), U = e.useRef({ active: !1, pointerId: null }), Se = e.useMemo(() => Ot(A, Rn), [A]), j = e.useMemo(() => Ot(g, vn), [g]), ye = e.useRef(Se), Te = e.useRef(j);
  e.useEffect(() => {
    if (ae.current = X, X) {
      R.current !== null && (cancelAnimationFrame(R.current), R.current = null), h.current = typeof performance < "u" ? performance.now() : Date.now();
      return;
    }
    H.current?.();
  }, [X]), e.useEffect(() => {
    J.current = Math.max(0, Math.min(1, b));
  }, [b]), e.useEffect(() => {
    ce.current = Math.max(0, z);
  }, [z]), e.useEffect(() => {
    le.current = Math.max(0, k);
  }, [k]), e.useEffect(() => {
    re.current = Math.max(0, V);
  }, [V]), e.useEffect(() => {
    oe.current = Math.max(5e-4, l);
  }, [l]), e.useEffect(() => {
    W.current = L ? 1 : 0;
  }, [L]), e.useEffect(() => {
    y.current = Nt(M, 0, Math.min(1, D - zt));
  }, [M, D]), e.useEffect(() => {
    _.current = Nt(D, Math.min(1, M + zt), 1);
  }, [D, M]), e.useEffect(() => {
    p.current = !0;
  }, [M, D, d]), e.useEffect(() => {
    F.current = Math.max(1, Math.floor(d));
    const c = Math.max(1, Math.ceil(F.current / Ve) * Ve);
    me((v) => v === c ? v : c);
  }, [d]), e.useEffect(() => {
    !B || B <= 0 || be((c) => B > c ? Math.max(B, c) : c);
  }, [B]), e.useEffect(() => {
    p.current = !0;
  }, [I]), e.useEffect(() => {
    ye.current = Se;
  }, [Se]), e.useEffect(() => {
    Te.current = j;
  }, [j]), e.useEffect(() => {
    const c = Math.max(1, t) * o;
    G((v) => ({
      width: v.width,
      height: c
    }));
  }, [t, o]), e.useEffect(() => {
    const c = Q.current;
    if (!c) return;
    const v = () => {
      const he = c.getBoundingClientRect();
      he.width && G((Ie) => ({
        width: Math.round(he.width),
        height: Ie.height
      }));
    };
    v();
    const K = typeof ResizeObserver < "u" ? new ResizeObserver(v) : null;
    return K ? K.observe(c) : window.addEventListener("resize", v), () => {
      K?.disconnect(), K || window.removeEventListener("resize", v);
    };
  }, []);
  const se = e.useCallback((c) => {
    const v = Q.current;
    if (!v) return null;
    const K = v.getBoundingClientRect();
    if (!K.width) return null;
    const he = (c - K.left) / K.width;
    return Math.max(0, Math.min(1, he));
  }, []), pt = e.useCallback((c) => {
    if (!w && !m && !i) return;
    const v = se(c.clientX);
    v != null && (U.current = { active: !0, pointerId: c.pointerId }, c.currentTarget.setPointerCapture(c.pointerId), c.preventDefault(), i?.(), w?.(v));
  }, [se, w, m, i]), ht = e.useCallback((c) => {
    if (!U.current.active || U.current.pointerId !== c.pointerId) return;
    const v = se(c.clientX);
    v != null && (c.preventDefault(), w?.(v));
  }, [se, w]), Ae = e.useCallback((c) => {
    if (!U.current.active || U.current.pointerId !== c.pointerId) return;
    U.current = { active: !1, pointerId: null };
    try {
      c.currentTarget.releasePointerCapture(c.pointerId);
    } catch {
    }
    const v = se(c.clientX);
    v != null && m?.(v);
  }, [se, m]), Ze = e.useCallback((c) => {
    if (U.current.pointerId !== c.pointerId) return;
    U.current = { active: !1, pointerId: null };
    try {
      c.currentTarget.releasePointerCapture(c.pointerId);
    } catch {
    }
    const v = se(c.clientX);
    v != null && m?.(v);
  }, [se, m]);
  e.useEffect(() => {
    if (!Z) return;
    let c = !1;
    async function v() {
      const K = await kn();
      if (!K || c) {
        K || Y(!1);
        return;
      }
      const he = q.current;
      if (!he) return;
      const Ie = Tn(K.device, he, de, pe);
      if (!Ie) {
        Y(!1);
        return;
      }
      a.current = Ie, s.current = 0, p.current = !0;
      const De = (Oe) => {
        if (c) return;
        if (ae.current) {
          R.current = null, h.current = Oe;
          return;
        }
        const Ge = K.device, $e = Ge.queue, ee = a.current;
        if (!ee) return;
        const fe = q.current;
        if (!fe) return;
        const qe = window.devicePixelRatio || 1, je = Math.max(1, Math.floor(P.width * qe)), Je = Math.max(1, Math.floor(P.height * qe));
        (fe.width !== je || fe.height !== Je) && (fe.width = je, fe.height = Je), fe.style.width !== `${Math.round(P.width)}px` && (fe.style.width = `${Math.round(P.width)}px`), fe.style.height !== `${Math.round(P.height)}px` && (fe.style.height = `${Math.round(P.height)}px`);
        const N = Math.max(5e-4, (Oe - h.current) / 1e3);
        h.current = Oe;
        const We = Math.max(1, F.current), He = We > 1 ? 1 / (We - 1) : 1, C = x.current, Xe = Math.max(1, B || 0);
        if (C[0] = We, C[1] = u ? J.current : -1, C[2] = ce.current, C[3] = He, C[4] = ye.current[0], C[5] = ye.current[1], C[6] = ye.current[2], C[7] = 1, C[8] = Te.current[0], C[9] = Te.current[1], C[10] = Te.current[2], C[11] = 1, C[12] = Dt(le.current, N), C[13] = Dt(re.current, N), C[14] = N, C[15] = Sn, C[16] = oe.current, C[17] = Cn, C[18] = W.current, C[19] = Xe, C[20] = y.current, C[21] = _.current, C[22] = 0, C[23] = 0, $e.writeBuffer(ee.uniformBuffer, 0, C.buffer, C.byteOffset, C.byteLength), p.current && f?.current) {
          const ie = f.current, ge = ee.rawCapacity;
          (!S.current || S.current.length !== ge) && (S.current = new Float32Array(ge));
          const Pe = S.current, et = Math.min(ge, ie.length);
          for (let te = 0; te < et; te += 1)
            Pe[te] = ie[te] / 255;
          for (let te = et; te < ge; te += 1)
            Pe[te] = 0;
          $e.writeBuffer(
            ee.rawBuffer,
            0,
            Pe.buffer,
            Pe.byteOffset,
            Pe.byteLength
          ), p.current = !1;
        }
        const _e = Ge.createCommandEncoder();
        if (f?.current) {
          const ie = _e.beginComputePass(), ge = ee.computeBindGroups[s.current];
          ie.setPipeline(ee.computePipeline), ie.setBindGroup(0, ge), ie.dispatchWorkgroups(ee.workgroupCount, 1, 1), ie.end(), s.current = s.current === 0 ? 1 : 0;
        }
        const Be = ee.context.getCurrentTexture().createView(), ke = _e.beginRenderPass({
          colorAttachments: [{
            view: Be,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }]
        });
        ke.setPipeline(ee.renderPipeline);
        const xt = ee.renderBindGroups[s.current];
        ke.setBindGroup(0, xt), ke.draw(6, 1, 0, 0), ke.end(), $e.submit([_e.finish()]), R.current = requestAnimationFrame(De);
      };
      H.current = () => {
        c || R.current !== null || (h.current = typeof performance < "u" ? performance.now() : Date.now(), R.current = requestAnimationFrame(De));
      }, ae.current || H.current();
    }
    return v(), () => {
      c = !0, R.current !== null && (cancelAnimationFrame(R.current), R.current = null), H.current = null, En(a.current), a.current = null;
    };
  }, [Z, P.width, P.height, de, pe, f, B, u]);
  const ze = typeof n == "number" ? `${n}px` : n ?? "100%", gt = Math.round(P.width), Ne = Math.round(P.height);
  return /* @__PURE__ */ T(
    "div",
    {
      ref: Q,
      className: "audio-fft-window",
      style: {
        width: "100%",
        maxWidth: ze
      },
      children: /* @__PURE__ */ Le(
        "div",
        {
          className: "audio-fft-window__canvas-wrapper",
          style: {
            width: "100%",
            height: `${Ne}px`,
            position: "relative",
            overflow: "hidden",
            background: "transparent"
          },
          children: [
            Z ? /* @__PURE__ */ T(
              "canvas",
              {
                ref: q,
                width: gt,
                height: Ne,
                style: { width: "100%", height: "100%", display: "block" }
              }
            ) : /* @__PURE__ */ T("div", { className: "audio-fft-window__fallback", children: "WebGPU not available" }),
            /* @__PURE__ */ T(
              "div",
              {
                ref: ne,
                className: "audio-fft-window__interaction-layer",
                onPointerDown: pt,
                onPointerMove: ht,
                onPointerUp: Ae,
                onPointerLeave: Ae,
                onPointerCancel: Ze,
                role: "presentation"
              }
            )
          ]
        }
      )
    }
  );
}
const Ct = (t, o, n) => Math.max(o, Math.min(n, t));
function lt() {
  return {
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  };
}
function St(t, o) {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : Ct(1 - Math.exp(-d / n), 0, 1);
}
function Xt(t, o, n, d, b, u) {
  const i = t.length;
  n.length !== i && (n.length = i, n.hasHistory = !1, n.previous = null, n.scratch = null);
  const w = n.previous && n.previous.length === i ? n.previous : null, m = n.scratch && n.scratch.length === i ? n.scratch : null, A = w ?? new Float32Array(i), g = m ?? new Float32Array(i), l = n.hasHistory && w !== null, f = Math.max(0, o.dtSec), I = St(o.attackMs, f), B = St(o.releaseMs, f);
  for (let z = 0; z < i; z += 1) {
    const L = t[z] / 255, M = l ? A[z] : L, D = L >= M ? I : B;
    g[z] = M + (L - M) * D;
  }
  n.hasHistory = !0, n.previous = g, n.scratch = A;
  let k = g;
  o.blurSigma > 1e-3 && (k = _n(k, o.blurSigma, d, u));
  const V = Un(
    k,
    o.targetBins,
    b,
    o.frequencyMin,
    o.frequencyMax
  );
  return { smoothedSnapshot: g, resampled: V };
}
function _n(t, o, n, d) {
  const b = Math.max(1e-3, o);
  let u = n.current;
  (!u || u.length !== t.length) && (u = new Float32Array(t.length), n.current = u);
  const { radius: i, kernel: w } = Fn(b, d), m = t.length;
  for (let A = 0; A < m; A += 1) {
    let g = 0;
    for (let l = -i; l <= i; l += 1) {
      let f = A + l;
      f < 0 ? f = 0 : f >= m && (f = m - 1), g += t[f] * w[l + i];
    }
    u[A] = g;
  }
  return u;
}
function Fn(t, o) {
  const n = Math.round(t * 100) / 100, d = o.get(n);
  if (d) return d;
  const b = Math.max(1, Math.floor(t * 3)), u = b * 2 + 1, i = new Float32Array(u), w = Math.max(Number.EPSILON, 2 * t * t);
  let m = 0;
  for (let l = 0; l < u; l += 1) {
    const f = l - b, I = Math.exp(-(f * f) / w);
    i[l] = I, m += I;
  }
  const A = m || 1;
  for (let l = 0; l < u; l += 1)
    i[l] /= A;
  const g = { radius: b, kernel: i };
  return o.set(n, g), g;
}
function Un(t, o, n, d, b) {
  const u = Math.max(1, Math.round(o));
  let i = n.current;
  (!i || i.length !== u) && (i = new Float32Array(u), n.current = i);
  const w = Math.max(0, t.length - 1);
  if (w === 0)
    return i.fill(t[0] ?? 0), i;
  const m = Ct(d, 0, 1), A = Ct(b, Math.min(1, m + 1e-3), 1), g = m * w, l = A * w;
  if (u === 1) {
    const f = (g + l) * 0.5, I = Math.floor(f), B = Math.min(w, I + 1), k = f - I, V = t[I] ?? 0, z = t[B] ?? V;
    return i[0] = V + (z - V) * k, i;
  }
  for (let f = 0; f < u; f += 1) {
    const I = f / (u - 1), B = g + I * (l - g), k = Math.floor(B), V = Math.min(w, k + 1), z = B - k, L = t[k] ?? 0, M = t[V] ?? 0;
    i[f] = L + (M - L) * z;
  }
  return i;
}
function Ln(t, o) {
  const n = Lt.base[700], d = Lt.base[100];
  return { safeA: t ?? n, safeB: o ?? d };
}
const ue = (t) => Math.max(0, Math.min(1, t)), $ = (t, o, n) => Math.max(o, Math.min(n, t)), Vn = 44100, $t = Vn / 2, it = 10, zn = 18, we = 8, ft = 10, Me = 500, At = 20, Bt = 80, Nn = 1 / 60, Dn = [
  { value: "discrete", label: "Step" },
  { value: "interpolated", label: "Interp" }
], ut = (t) => Math.round(ue(t) * 10) / 10, ct = (t) => Math.round($(t, 0, 3) * 10) / 10, Ce = (t) => Math.round($(t, 0, Me) / ft) * ft;
function wt(t, o) {
  return t === "discrete" || t === "interpolated" ? t : o;
}
function xe(t, o, n, d) {
  const [b, u] = yn(d), i = d !== void 0 && t === void 0, w = i ? b : t, [m, A] = e.useState(o), g = w !== void 0, l = g ? w : m, f = e.useCallback((I) => {
    g || A(I), i && u(I), n?.(I);
  }, [g, n, u, i]);
  return e.useEffect(() => {
    !i || b !== void 0 || u(o);
  }, [o, u, i, b]), [l, f, g];
}
function qt(t) {
  const o = t || 16, d = o * 0.35, u = o * 1;
  return Math.max(
    Math.round(u + d * 2 + 2),
    Math.round(o + d * 1.5),
    zn
  );
}
function dt(t) {
  !t || t.state === "closed" || t.close().catch(() => {
  });
}
function tr({
  ariaLabel: t = "Audio controls",
  fontSize: o,
  colorA: n,
  colorB: d,
  borderStyle: b,
  source: u,
  heightUnits: i = 6,
  suspended: w,
  audioAnalysisStore: m,
  controlIdPrefix: A,
  controlIds: g,
  defaultPlaying: l = !1,
  playing: f,
  onPlayingChange: I,
  defaultMuted: B = !0,
  muted: k,
  onMutedChange: V,
  defaultBinCount: z = 256,
  binCount: L,
  onBinCountChange: M,
  defaultBinInterpolation: D = "discrete",
  binInterpolation: O,
  onBinInterpolationChange: q,
  defaultFrequencyMin: Q = 0,
  frequencyMin: ne,
  onFrequencyMinChange: Z,
  defaultFrequencyMax: Y = $t,
  frequencyMax: P,
  onFrequencyMaxChange: G,
  defaultFftAttack: de = At,
  fftAttack: me,
  onFftAttackChange: pe,
  defaultFftRelease: be = Bt,
  fftRelease: J,
  onFftReleaseChange: ce,
  defaultFftBlurSigma: le = 0,
  fftBlurSigma: re,
  onFftBlurSigmaChange: oe,
  defaultAnalyserSmoothing: W = 0.8,
  analyserSmoothing: y,
  onAnalyserSmoothingChange: _
}) {
  const F = mt(w), p = gn(), h = o ?? p?.fontSize ?? 12, x = b ?? p?.borderStyle ?? "a", { safeA: a, safeB: s } = Ln(
    n ?? p?.colorA,
    d ?? p?.colorB
  ), S = pn(), R = e.useRef(null), H = R.current ?? hn({
    bins: [],
    binCount: 0,
    maxMagnitude: 1
  });
  R.current || (R.current = H);
  const X = m ?? S ?? H, ae = e.useMemo(() => ({
    setAudioBins: X.setAudioBins,
    setAudioBinCount: X.setAudioBinCount,
    setAudioMaxMagnitude: X.setAudioMaxMagnitude
  }), [X]), U = u.type === "buffer", Se = Mn(A, t), j = e.useCallback((r) => {
    const E = g?.[r];
    if (E) return E;
    if (!(r === "playing" || r === "muted"))
      return Se ? `${Se}.${r}` : void 0;
  }, [g, Se]), [ye, Te] = xe(
    f,
    l,
    I,
    j("playing")
  ), [se, pt] = xe(
    k,
    B,
    V,
    j("muted")
  ), [ht, Ae] = e.useState(0), [Ze, ze] = e.useState(!1), [gt, Ne] = e.useState(null), c = e.useRef(0), v = e.useCallback((r) => $(Math.round(r || 0), 1, 1024), []), [K, he] = xe(
    L,
    v(z),
    M,
    j("binCount")
  ), [Ie, De] = xe(
    y,
    ut(ue(W)),
    _,
    j("analyserSmoothing")
  ), [Oe, Ge] = xe(
    me,
    Ce(de),
    pe,
    j("fftAttack")
  ), [$e, ee] = xe(
    J,
    Ce(be),
    ce,
    j("fftRelease")
  ), [fe, qe] = xe(
    re,
    ct(le),
    oe,
    j("fftBlurSigma")
  ), [je, Je] = xe(
    O,
    wt(D, "discrete"),
    q,
    j("binInterpolation")
  ), [N, We] = e.useState($t), [He, C] = xe(
    ne,
    Q,
    Z,
    j("frequencyMin")
  ), [Xe, _e] = xe(
    P,
    Y,
    G,
    j("frequencyMax")
  ), Be = e.useRef(null), [ke, xt] = e.useState({ version: 0, binCount: 0 }), ie = v(K), ge = ut(ue(Ie)), Pe = Ce(Oe), et = Ce($e), te = ct(fe), kt = wt(je, "discrete"), Yt = kt === "discrete", Re = e.useMemo(() => Math.min(it, N), [N]), { freqMinHz: tt, freqMaxHz: nt } = e.useMemo(() => {
    const r = Number.isFinite(He ?? Number.NaN) ? He : 0, E = Number.isFinite(Xe ?? Number.NaN) ? Xe : N, Ke = $(E, Re, N), Qe = $(r, 0, Math.max(0, Ke - Re)), at = $(Ke, Qe + Re, N);
    return { freqMinHz: Qe, freqMaxHz: at };
  }, [He, Xe, Re, N]), Kt = N > 0 ? tt / N : 0, Qt = N > 0 ? nt / N : 1, bt = $(Kt, 0, 1), Mt = $(Qt, 0, 1), Pt = e.useCallback((r) => {
    const E = $(r, 0, Math.max(0, nt - Re));
    C(E);
  }, [nt, Re, C]), Et = e.useCallback((r) => {
    const E = $(r, Math.min(N, tt + Re), N);
    _e(E);
  }, [tt, Re, N, _e]), Tt = e.useCallback((r) => {
    We(Math.max(1, r / 2));
  }, []), [yt, It] = e.useState(() => qt(h)), _t = e.useRef(null);
  e.useEffect(() => {
    const r = qt(h);
    It((E) => Math.abs(E - r) < 0.5 ? E : r);
  }, [h]), e.useLayoutEffect(() => {
    const r = _t.current;
    if (!r || typeof ResizeObserver > "u") return;
    const E = () => {
      const Qe = r.getBoundingClientRect();
      if (!Qe.height) return;
      const at = Math.round(Qe.height);
      It((Ut) => Math.abs(Ut - at) < 0.5 ? Ut : at);
    };
    E();
    const Ke = new ResizeObserver(() => E());
    return Ke.observe(r), () => Ke.disconnect();
  }, []);
  const Zt = a, Fe = x === "none" ? 0 : 1, ve = x === "none" ? "transparent" : x === "b" ? s : a, jt = a, Jt = ye ? "playing" : "paused", en = se ? "muted" : "unmuted", tn = [
    { value: "paused", icon: /* @__PURE__ */ T(cn, { strokeWidth: 1.6 }), ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: /* @__PURE__ */ T(ln, { strokeWidth: 1.6 }), ariaLabel: "Pause audio analysis", title: "Pause audio analysis" }
  ], nn = [
    { value: "muted", icon: /* @__PURE__ */ T(fn, { strokeWidth: 1.6 }), ariaLabel: "Unmute audio output", title: "Unmute audio output" },
    { value: "unmuted", icon: /* @__PURE__ */ T(dn, { strokeWidth: 1.6 }), ariaLabel: "Mute audio output", title: "Mute audio output" }
  ], rt = $(Pe, 0, Me), Ye = $(et, 0, Me), rn = Math.max(1e-3, St(Ye, Nn) * 0.25), ot = e.useCallback((r) => {
    const E = ue(r);
    c.current += 1, Ne({ ratio: E, token: c.current });
  }, []), Ft = e.useCallback((r) => {
    r?.length && ((!Be.current || Be.current.length !== r.length) && (Be.current = new Uint8Array(r.length)), Be.current.set(r), xt((E) => ({
      version: E.version + 1,
      binCount: r.length
    })));
  }, []), on = e.useCallback((r) => {
    if (!U) return;
    const E = ue(r);
    Ze || Ae(E);
  }, [U, Ze]), an = e.useCallback(() => {
    U && ze(!0);
  }, [U]), sn = e.useCallback((r) => {
    if (!U) return;
    const E = ue(r);
    Ae(E), ot(E);
  }, [U, ot]), un = e.useCallback((r) => {
    if (!U) return;
    const E = ue(r);
    Ae(E), ot(E), ze(!1);
  }, [U, ot]);
  return e.useEffect(() => {
    U || (Ae(0), ze(!1), Ne(null));
  }, [U]), /* @__PURE__ */ T(mn, { suspended: F, children: /* @__PURE__ */ Le("div", { style: { width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ Le(
      "div",
      {
        style: {
          width: "100%",
          minHeight: yt,
          borderTop: `1px solid ${ve}`,
          borderLeft: `${Fe}px solid ${ve}`,
          borderRight: `${Fe}px solid ${ve}`,
          borderBottom: `1px solid ${s}`,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: s,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: we,
          padding: `0 ${we}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ T("div", { style: { display: "flex", alignItems: "center", gap: we, flexShrink: 0 }, children: /* @__PURE__ */ T(
            Vt,
            {
              behavior: "cycle",
              value: Jt,
              options: tn,
              onChange: (r) => Te(r === "playing"),
              borderStyle: "none",
              fontSize: h,
              colorA: a,
              colorB: s
            }
          ) }),
          /* @__PURE__ */ Le("div", { style: { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: we }, children: [
            /* @__PURE__ */ T("div", { ref: _t, style: { display: "flex", minWidth: 0 }, children: /* @__PURE__ */ T(
              Ee,
              {
                label: "Bins",
                variant: "basic",
                min: 1,
                max: 1024,
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: h,
                value: ie,
                onUserChange: (r) => {
                  he(v(r));
                },
                onAnimatedUpdate: (r) => {
                  he(v(r));
                },
                style: { gap: 0 }
              }
            ) }),
            /* @__PURE__ */ T(
              xn,
              {
                ariaLabel: "Bin interpolation",
                showLabel: !1,
                options: Dn,
                value: kt,
                onChange: (r) => {
                  Je(wt(
                    r,
                    "discrete"
                  ));
                },
                colorA: a,
                colorB: s,
                borderStyle: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                fontSize: h,
                style: { gap: 0, minWidth: 0 }
              }
            ),
            /* @__PURE__ */ T(
              Ee,
              {
                label: "Min",
                variant: "basic",
                min: 0,
                max: Math.max(0, N - it),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: h,
                value: tt,
                onUserChange: Pt,
                onAnimatedUpdate: Pt,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            ),
            /* @__PURE__ */ T(
              Ee,
              {
                label: "Max",
                variant: "basic",
                min: it,
                max: Math.max(it, N),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: h,
                value: nt,
                onUserChange: Et,
                onAnimatedUpdate: Et,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            )
          ] })
        ]
      }
    ),
    u.type === "buffer" ? /* @__PURE__ */ T(
      On,
      {
        src: u.src,
        loop: u.loop,
        playing: ye,
        analysisActions: ae,
        onProgress: on,
        seekTarget: gt,
        analyserSmoothing: ge,
        attackMs: rt,
        releaseMs: Ye,
        blurSigma: te,
        targetBins: ie,
        onRawFftFrame: Ft,
        frequencyMin: bt,
        frequencyMax: Mt,
        onSampleRateChange: Tt,
        muted: se,
        suspended: F
      }
    ) : /* @__PURE__ */ T(
      Gn,
      {
        source: u,
        playing: ye,
        analysisActions: ae,
        analyserSmoothing: ge,
        attackMs: rt,
        releaseMs: Ye,
        blurSigma: te,
        targetBins: ie,
        onRawFftFrame: Ft,
        frequencyMin: bt,
        frequencyMax: Mt,
        onSampleRateChange: Tt,
        muted: se,
        suspended: F
      }
    ),
    /* @__PURE__ */ T(
      "div",
      {
        style: {
          borderTop: `1px solid ${Zt}`,
          borderLeft: `${Fe}px solid ${ve}`,
          borderRight: `${Fe}px solid ${ve}`,
          borderRadius: 0,
          borderBottom: `1px solid ${s}`,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0a0a, #1a1a1a)"
        },
        children: /* @__PURE__ */ T(
          In,
          {
            heightUnits: i,
            unitSizePx: yt,
            maxWidth: "100%",
            maxBins: ie,
            peakDecay: rn,
            playbackRatio: U ? ht : 0,
            showPlaybackIndicator: U,
            onScrubStart: U ? an : void 0,
            onScrub: U ? sn : void 0,
            onScrubEnd: U ? un : void 0,
            activeColor: a,
            inactiveColor: s,
            rawFftDataRef: Be,
            rawFrameVersion: ke.version,
            rawBinCount: ke.binCount,
            attackMs: rt,
            releaseMs: Ye,
            blurSigma: te,
            discreteBins: Yt,
            frequencyMin: bt,
            frequencyMax: Mt,
            suspended: F
          }
        )
      }
    ),
    /* @__PURE__ */ Le(
      "div",
      {
        style: {
          width: "100%",
          minHeight: yt,
          borderTop: `1px solid ${a}`,
          borderLeft: `${Fe}px solid ${ve}`,
          borderRight: `${Fe}px solid ${ve}`,
          borderBottom: `1px solid ${ve}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: s,
          color: jt,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: we,
          padding: `0 ${we}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ T("div", { style: { display: "flex", alignItems: "center", gap: we, flexShrink: 0 }, children: /* @__PURE__ */ T(
            Vt,
            {
              behavior: "cycle",
              value: en,
              options: nn,
              onChange: (r) => pt(r === "muted"),
              borderStyle: "none",
              fontSize: h,
              colorA: a,
              colorB: s
            }
          ) }),
          /* @__PURE__ */ Le(
            "div",
            {
              style: {
                flex: 1,
                minWidth: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: we
              },
              children: [
                /* @__PURE__ */ T(
                  Ee,
                  {
                    label: "Atk",
                    variant: "basic",
                    min: 0,
                    max: Me,
                    step: ft,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: a,
                    colorB: s,
                    fontSize: h,
                    value: rt,
                    onUserChange: (r) => Ge(Ce(r)),
                    onAnimatedUpdate: (r) => Ge(Ce(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ T(
                  Ee,
                  {
                    label: "Rel",
                    variant: "basic",
                    min: 0,
                    max: Me,
                    step: ft,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: a,
                    colorB: s,
                    fontSize: h,
                    value: Ye,
                    onUserChange: (r) => ee(Ce(r)),
                    onAnimatedUpdate: (r) => ee(Ce(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ T(
                  Ee,
                  {
                    label: "Sm",
                    variant: "basic",
                    min: 0,
                    max: 1,
                    step: 0.1,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: a,
                    colorB: s,
                    fontSize: h,
                    value: ge,
                    onUserChange: (r) => De(ut(r)),
                    onAnimatedUpdate: (r) => De(ut(r)),
                    formatDisplayValue: (r) => r.toFixed(1),
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ T(
                  Ee,
                  {
                    label: "σ",
                    variant: "basic",
                    min: 0,
                    max: 3,
                    step: 0.1,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: a,
                    colorB: s,
                    fontSize: h,
                    value: te,
                    onUserChange: (r) => qe(ct(r)),
                    onAnimatedUpdate: (r) => qe(ct(r)),
                    formatDisplayValue: (r) => r.toFixed(1),
                    style: { gap: 0 }
                  }
                )
              ]
            }
          )
        ]
      }
    )
  ] }) });
}
function On({
  src: t,
  loop: o = !0,
  playing: n,
  analysisActions: d,
  seekTarget: b,
  onProgress: u,
  analyserSmoothing: i = 0.8,
  attackMs: w = At,
  releaseMs: m = Bt,
  blurSigma: A = 0,
  targetBins: g = 1024,
  onRawFftFrame: l,
  frequencyMin: f = 0,
  frequencyMax: I = 1,
  onSampleRateChange: B,
  muted: k = !0,
  suspended: V
}) {
  const z = mt(V), { setAudioBins: L, setAudioBinCount: M, setAudioMaxMagnitude: D } = d, O = e.useRef(null), q = e.useRef(null), Q = e.useRef(null), ne = e.useRef(null), Z = e.useRef(null), Y = e.useRef(null), P = e.useRef(0), G = e.useRef(null), de = e.useRef(u), me = e.useRef(ue(i ?? 0.8)), pe = e.useRef(B), be = e.useRef(k), J = e.useRef(lt()), ce = e.useRef(null), le = e.useRef(null), re = e.useRef(/* @__PURE__ */ new Map()), oe = e.useRef(null);
  e.useEffect(() => {
    de.current = u;
  }, [u]), e.useEffect(() => {
    pe.current = B;
  }, [B]), e.useEffect(() => {
    be.current = k;
    const x = Z.current, a = O.current;
    x && a && x.gain.setTargetAtTime(k ? 0 : 1, a.currentTime, 0.01);
  }, [k]), e.useEffect(() => {
    const x = ue(i ?? 0.8);
    me.current = x, q.current && (q.current.smoothingTimeConstant = x);
  }, [i]);
  const W = e.useCallback(() => Y.current?.duration ?? 0, []), y = e.useCallback((x) => {
    const a = W();
    if (a <= 0) return 0;
    const s = x % a, S = s < 0 ? s + a : s, R = Math.min(a * 1e-3, 1e-4) || 1e-4;
    return Math.min(S, Math.max(0, a - R));
  }, [W]), _ = e.useCallback(() => {
    if (W() <= 0) return 0;
    const a = y(P.current), s = G.current, S = O.current;
    if (!S || s == null) return a;
    const R = S.currentTime - s;
    return y(a + R);
  }, [W, y]), F = e.useCallback(() => {
    try {
      ne.current?.stop();
    } catch {
    }
    ne.current?.disconnect(), Z.current?.disconnect(), ne.current = null, Z.current = null;
  }, []);
  e.useEffect(() => {
    const x = re.current;
    let a = !1;
    async function s() {
      try {
        const S = new AudioContext();
        O.current = S, pe.current?.(S.sampleRate);
        const R = await fetch(t);
        if (!R.ok) throw new Error(`Failed to load audio sample: ${R.status}`);
        const H = await R.arrayBuffer(), X = await S.decodeAudioData(H);
        if (a) {
          dt(S);
          return;
        }
        Y.current = X, P.current = 0, G.current = null;
        const ae = S.createAnalyser();
        ae.fftSize = 2048, ae.smoothingTimeConstant = me.current, q.current = ae, Q.current = new Uint8Array(new ArrayBuffer(ae.frequencyBinCount)), M(ae.frequencyBinCount), D(1);
      } catch (S) {
        console.error("Failed to load audio for FFT", S);
      }
    }
    return s(), () => {
      a = !0, q.current = null, Q.current = null, F(), dt(O.current), O.current = null, ne.current = null, Z.current = null, Y.current = null, P.current = 0, G.current = null, J.current = lt(), ce.current = null, le.current = null, x.clear(), oe.current = null;
    };
  }, [M, D, t, F]);
  const p = e.useCallback(() => {
    P.current = _(), G.current = null, F();
  }, [_, F]), h = e.useCallback(async (x) => {
    if (!Y.current || !O.current) return;
    const a = O.current;
    a.state === "suspended" && await a.resume().catch(() => {
    });
    const s = q.current ?? a.createAnalyser();
    s.fftSize = 2048, s.smoothingTimeConstant = me.current, q.current = s;
    const S = y(typeof x == "number" ? x : _());
    P.current = S, G.current = a.currentTime, F();
    const R = a.createBufferSource();
    R.buffer = Y.current, R.loop = o;
    const H = a.createGain();
    H.gain.value = be.current ? 0 : 1, R.connect(s), s.connect(H), H.connect(a.destination), R.start(0, S), ne.current = R, Z.current = H, Q.current || (Q.current = new Uint8Array(new ArrayBuffer(s.frequencyBinCount)), M(s.frequencyBinCount));
  }, [_, o, M, F, y]);
  return e.useEffect(() => (n ? h() : p(), () => {
    p();
  }), [n, h, p]), e.useEffect(() => {
    if (!b) return;
    const x = W();
    if (x <= 0) return;
    const a = ue(b.ratio), s = y(a * x);
    P.current = s, n && Y.current && O.current ? h(s) : G.current = null;
  }, [W, n, b, h, y]), Wt(z ? null : (x, a) => {
    const s = q.current, S = Q.current;
    if (s && S) {
      s.getByteFrequencyData(S), l && l(S);
      const X = Xt(
        S,
        {
          attackMs: $(w, 0, Me),
          releaseMs: $(m, 0, Me),
          dtSec: a,
          blurSigma: Math.max(0, A || 0),
          targetBins: $(Math.round(g || S.length), 1, S.length),
          frequencyMin: f,
          frequencyMax: I
        },
        J.current,
        ce,
        le,
        re.current
      ).resampled;
      L(Array.from(X)), oe.current !== X.length && (oe.current = X.length, M(X.length));
    }
    const R = W();
    if (R > 0) {
      const H = _() / R;
      de.current?.(H);
    }
  }), null;
}
function Gn({
  source: t,
  playing: o,
  analysisActions: n,
  analyserSmoothing: d = 0.8,
  attackMs: b = At,
  releaseMs: u = Bt,
  blurSigma: i = 0,
  targetBins: w = 1024,
  onRawFftFrame: m,
  frequencyMin: A = 0,
  frequencyMax: g = 1,
  onSampleRateChange: l,
  muted: f = !0,
  suspended: I
}) {
  const B = mt(I), { setAudioBins: k, setAudioBinCount: V, setAudioMaxMagnitude: z } = n, L = e.useRef(null), M = e.useRef(null), D = e.useRef(null), O = e.useRef(null), q = e.useRef(null), Q = e.useRef(ue(d ?? 0.8)), ne = e.useRef(l), Z = e.useRef(f), Y = e.useRef(!1), P = e.useRef(!1), G = e.useRef(!1), de = e.useRef(lt()), me = e.useRef(null), pe = e.useRef(null), be = e.useRef(/* @__PURE__ */ new Map()), J = e.useRef(null), ce = t.type === "mediaStream" ? t.stream : null, le = t.type === "mediaStream" ? t.context : void 0, re = t.type === "audioNode" ? t.node : null;
  e.useEffect(() => {
    ne.current = l;
  }, [l]), e.useEffect(() => {
    Z.current = f;
    const y = O.current, _ = L.current;
    y && _ && y.gain.setTargetAtTime(f ? 0 : 1, _.currentTime, 0.01);
  }, [f]), e.useEffect(() => {
    const y = ue(d ?? 0.8);
    Q.current = y, M.current && (M.current.smoothingTimeConstant = y);
  }, [d]);
  const oe = e.useCallback(() => {
    if (P.current) return;
    const y = D.current, _ = M.current, F = O.current, p = L.current;
    !y || !_ || !F || !p || (y.connect(_), _.connect(F), F.connect(p.destination), P.current = !0);
  }, []), W = e.useCallback(() => {
    if (P.current) {
      try {
        const y = D.current, _ = M.current;
        y && _ && y.disconnect(_);
      } catch {
      }
      try {
        M.current?.disconnect();
      } catch {
      }
      try {
        O.current?.disconnect();
      } catch {
      }
      P.current = !1;
    }
  }, []);
  return e.useEffect(() => {
    let y = !1;
    async function _() {
      let p, h, x = !1;
      if (t.type === "mediaStream") {
        if (p = le ?? new AudioContext(), x = !le, !ce) return;
        h = p.createMediaStreamSource(ce);
      } else {
        if (!re) return;
        h = re, p = re.context;
      }
      if (y) {
        x && dt(p);
        return;
      }
      Y.current = x, L.current = p, D.current = h, ne.current?.(p.sampleRate);
      const a = p.createAnalyser();
      a.fftSize = 2048, a.smoothingTimeConstant = Q.current, M.current = a, q.current = new Uint8Array(new ArrayBuffer(a.frequencyBinCount)), J.current = a.frequencyBinCount, V(a.frequencyBinCount), z(1);
      const s = p.createGain();
      s.gain.value = Z.current ? 0 : 1, O.current = s, P.current = !1, G.current = !1;
    }
    _();
    const F = be.current;
    return () => {
      y = !0, W(), M.current = null, q.current = null, D.current = null, O.current = null, Y.current && dt(L.current), L.current = null, Y.current = !1, de.current = lt(), me.current = null, pe.current = null, F.clear(), J.current = null, G.current = !1;
    };
  }, [
    oe,
    W,
    V,
    z,
    t.type,
    le,
    ce,
    re
  ]), e.useEffect(() => {
    const y = L.current;
    o ? (y?.state === "suspended" && y.resume().catch(() => {
    }), oe(), G.current = !1) : (W(), G.current = !1);
  }, [oe, W, o]), Wt(B ? null : (y, _) => {
    if (!o || !P.current) {
      if (!G.current) {
        const h = J.current ?? 0;
        h > 0 && (k(new Array(h).fill(0)), V(h)), G.current = !0;
      }
      return;
    }
    const F = M.current, p = q.current;
    if (F && p) {
      F.getByteFrequencyData(p), m && m(p);
      const x = Xt(
        p,
        {
          attackMs: $(b, 0, Me),
          releaseMs: $(u, 0, Me),
          dtSec: _,
          blurSigma: Math.max(0, i || 0),
          targetBins: $(Math.round(w || p.length), 1, p.length),
          frequencyMin: A,
          frequencyMax: g
        },
        de.current,
        me,
        pe,
        be.current
      ).resampled;
      k(Array.from(x)), J.current !== x.length && (J.current = x.length, V(x.length));
    }
  }), null;
}
export {
  tr as A,
  In as a
};
//# sourceMappingURL=AudioControls-uFdaMFEE.js.map
