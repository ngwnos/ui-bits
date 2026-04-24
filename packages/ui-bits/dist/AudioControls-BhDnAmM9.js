import { jsx as T, jsxs as Le } from "react/jsx-runtime";
import e from "react";
import { Play as sn, Pause as un, VolumeX as cn, Volume2 as ln } from "lucide-react";
import { u as dt, A as fn } from "./animationSuspension-BEQdvvQj.js";
import { f as dn, b as mn, L as Ee } from "./LFOSlider-Cv0xjz_G.js";
import { u as $t } from "./frameLoop-DbiGWmY_.js";
import { f as Ft } from "./flexoki-DpJ9ZEpp.js";
import { u as pn } from "./panelGap-DjV8XIAA.js";
import { I as Ut } from "./IconButton-BvvMagK1.js";
import { S as hn } from "./SegmentBar-DTdbMbCH.js";
import gn from "typegpu";
import { c as xn, d as bn } from "./hooks-KNH81MTH.js";
let yt = null, st = null;
const Mn = [0.16, 0.47, 0.86], yn = [0.02, 0.02, 0.04], qt = 24, Rn = qt * Float32Array.BYTES_PER_ELEMENT, Ve = 64, vn = 0.2, wn = 4, Rt = 12, Lt = 0.01, Cn = 20, Sn = 80, Vt = (t, o, n) => Math.max(o, Math.min(n, t)), zt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : Math.max(0, Math.min(1, 1 - Math.exp(-d / n)));
};
async function An() {
  return navigator.gpu ? yt || (st || (st = gn.init().then((t) => (yt = t, t)).catch((t) => (console.error("AudioFFTWindow: TypeGPU init failed", t), st = null, null))), st) : null;
}
function Ue(t) {
  return Number.parseInt(t, 16) / 255;
}
function Nt(t, o = [0, 0, 0]) {
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
function Bn(t) {
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
    let radius = min(${Rt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${Rt}; offset = offset + 1) {
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
const MAX_RADIUS : i32 = ${Rt};

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
function Dt(t, o) {
  return t.createTexture({
    size: [o, 1, 1],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  });
}
function kn(t) {
  t && (t.uniformBuffer.destroy(), t.rawBuffer.destroy(), t.stateTextures[0].destroy(), t.stateTextures[1].destroy());
}
function Pn(t, o, n, d) {
  const b = o.getContext("webgpu");
  if (!b) return null;
  const i = navigator.gpu.getPreferredCanvasFormat();
  b.configure({
    device: t,
    format: i,
    alphaMode: "opaque"
  });
  const { computeModule: u, renderModule: w } = Bn(t), m = t.createBuffer({
    size: Rn,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), A = t.createBuffer({
    size: Math.max(1, d) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  }), g = [
    Dt(t, n),
    Dt(t, n)
  ], l = g.map((M) => M.createView({ dimension: "2d" })), f = t.createComputePipeline({
    layout: "auto",
    compute: { module: u, entryPoint: "cs_main" }
  }), I = t.createRenderPipeline({
    layout: "auto",
    vertex: { module: w, entryPoint: "vs_main" },
    fragment: {
      module: w,
      entryPoint: "fs_main",
      targets: [{ format: i }]
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
    format: i,
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
function En({
  heightUnits: t = 6,
  unitSizePx: o,
  maxWidth: n,
  maxBins: d = 1024,
  playbackRatio: b = 0,
  showPlaybackIndicator: i = !0,
  onScrubStart: u,
  onScrub: w,
  onScrubEnd: m,
  activeColor: A,
  inactiveColor: g,
  peakDecay: l = 0.05,
  rawFftDataRef: f,
  rawFrameVersion: I,
  rawBinCount: B = 0,
  attackMs: k = Cn,
  releaseMs: V = Sn,
  blurSigma: z = 0,
  discreteBins: L = !0,
  frequencyMin: M = 0,
  frequencyMax: O = 1,
  suspended: G
}) {
  const q = e.useRef(null), Q = e.useRef(null), re = e.useRef(null), [Z, Y] = e.useState(() => typeof navigator < "u" && !!navigator.gpu), [P, $] = e.useState({
    width: 480,
    height: Math.max(1, t) * o
  }), [de, me] = e.useState(() => Math.max(1, Math.ceil(Math.max(1, Math.floor(d)) / Ve) * Ve)), [pe, be] = e.useState(() => Math.max(1, B || 1)), J = e.useRef(Math.max(0, Math.min(1, b))), ce = e.useRef(Math.max(0, z)), le = e.useRef(Math.max(0, k)), oe = e.useRef(Math.max(0, V)), ae = e.useRef(Math.max(5e-4, l)), W = e.useRef(L ? 1 : 0), y = e.useRef(Math.max(0, Math.min(1, M))), _ = e.useRef(Math.max(0, Math.min(1, O))), F = e.useRef(Math.max(1, Math.floor(d))), p = e.useRef(!1), h = e.useRef(typeof performance < "u" ? performance.now() : Date.now()), x = e.useRef(new Float32Array(qt)), a = e.useRef(null), s = e.useRef(0), S = e.useRef(null), R = e.useRef(null), H = e.useRef(null), X = dt(G), se = e.useRef(X), U = e.useRef({ active: !1, pointerId: null }), Se = e.useMemo(() => Nt(A, Mn), [A]), j = e.useMemo(() => Nt(g, yn), [g]), ye = e.useRef(Se), Te = e.useRef(j);
  e.useEffect(() => {
    if (se.current = X, X) {
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
    oe.current = Math.max(0, V);
  }, [V]), e.useEffect(() => {
    ae.current = Math.max(5e-4, l);
  }, [l]), e.useEffect(() => {
    W.current = L ? 1 : 0;
  }, [L]), e.useEffect(() => {
    y.current = Vt(M, 0, Math.min(1, O - Lt));
  }, [M, O]), e.useEffect(() => {
    _.current = Vt(O, Math.min(1, M + Lt), 1);
  }, [O, M]), e.useEffect(() => {
    p.current = !0;
  }, [M, O, d]), e.useEffect(() => {
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
    $((v) => ({
      width: v.width,
      height: c
    }));
  }, [t, o]), e.useEffect(() => {
    const c = Q.current;
    if (!c) return;
    const v = () => {
      const he = c.getBoundingClientRect();
      he.width && $((Ie) => ({
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
  const ue = e.useCallback((c) => {
    const v = Q.current;
    if (!v) return null;
    const K = v.getBoundingClientRect();
    if (!K.width) return null;
    const he = (c - K.left) / K.width;
    return Math.max(0, Math.min(1, he));
  }, []), mt = e.useCallback((c) => {
    if (!w && !m && !u) return;
    const v = ue(c.clientX);
    v != null && (U.current = { active: !0, pointerId: c.pointerId }, c.currentTarget.setPointerCapture(c.pointerId), c.preventDefault(), u?.(), w?.(v));
  }, [ue, w, m, u]), pt = e.useCallback((c) => {
    if (!U.current.active || U.current.pointerId !== c.pointerId) return;
    const v = ue(c.clientX);
    v != null && (c.preventDefault(), w?.(v));
  }, [ue, w]), Ae = e.useCallback((c) => {
    if (!U.current.active || U.current.pointerId !== c.pointerId) return;
    U.current = { active: !1, pointerId: null };
    try {
      c.currentTarget.releasePointerCapture(c.pointerId);
    } catch {
    }
    const v = ue(c.clientX);
    v != null && m?.(v);
  }, [ue, m]), Ze = e.useCallback((c) => {
    if (U.current.pointerId !== c.pointerId) return;
    U.current = { active: !1, pointerId: null };
    try {
      c.currentTarget.releasePointerCapture(c.pointerId);
    } catch {
    }
    const v = ue(c.clientX);
    v != null && m?.(v);
  }, [ue, m]);
  e.useEffect(() => {
    if (!Z) return;
    let c = !1;
    async function v() {
      const K = await An();
      if (!K || c) {
        K || Y(!1);
        return;
      }
      const he = q.current;
      if (!he) return;
      const Ie = Pn(K.device, he, de, pe);
      if (!Ie) {
        Y(!1);
        return;
      }
      a.current = Ie, s.current = 0, p.current = !0;
      const De = (Oe) => {
        if (c) return;
        if (se.current) {
          R.current = null, h.current = Oe;
          return;
        }
        const Ge = K.device, $e = Ge.queue, ee = a.current;
        if (!ee) return;
        const fe = q.current;
        if (!fe) return;
        const qe = window.devicePixelRatio || 1, je = Math.max(1, Math.floor(P.width * qe)), Je = Math.max(1, Math.floor(P.height * qe));
        (fe.width !== je || fe.height !== Je) && (fe.width = je, fe.height = Je), fe.style.width !== `${Math.round(P.width)}px` && (fe.style.width = `${Math.round(P.width)}px`), fe.style.height !== `${Math.round(P.height)}px` && (fe.style.height = `${Math.round(P.height)}px`);
        const D = Math.max(5e-4, (Oe - h.current) / 1e3);
        h.current = Oe;
        const We = Math.max(1, F.current), He = We > 1 ? 1 / (We - 1) : 1, C = x.current, Xe = Math.max(1, B || 0);
        if (C[0] = We, C[1] = i ? J.current : -1, C[2] = ce.current, C[3] = He, C[4] = ye.current[0], C[5] = ye.current[1], C[6] = ye.current[2], C[7] = 1, C[8] = Te.current[0], C[9] = Te.current[1], C[10] = Te.current[2], C[11] = 1, C[12] = zt(le.current, D), C[13] = zt(oe.current, D), C[14] = D, C[15] = wn, C[16] = ae.current, C[17] = vn, C[18] = W.current, C[19] = Xe, C[20] = y.current, C[21] = _.current, C[22] = 0, C[23] = 0, $e.writeBuffer(ee.uniformBuffer, 0, C.buffer, C.byteOffset, C.byteLength), p.current && f?.current) {
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
        const gt = ee.renderBindGroups[s.current];
        ke.setBindGroup(0, gt), ke.draw(6, 1, 0, 0), ke.end(), $e.submit([_e.finish()]), R.current = requestAnimationFrame(De);
      };
      H.current = () => {
        c || R.current !== null || (h.current = typeof performance < "u" ? performance.now() : Date.now(), R.current = requestAnimationFrame(De));
      }, se.current || H.current();
    }
    return v(), () => {
      c = !0, R.current !== null && (cancelAnimationFrame(R.current), R.current = null), H.current = null, kn(a.current), a.current = null;
    };
  }, [Z, P.width, P.height, de, pe, f, B, i]);
  const ze = typeof n == "number" ? `${n}px` : n ?? "100%", ht = Math.round(P.width), Ne = Math.round(P.height);
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
                width: ht,
                height: Ne,
                style: { width: "100%", height: "100%", display: "block" }
              }
            ) : /* @__PURE__ */ T("div", { className: "audio-fft-window__fallback", children: "WebGPU not available" }),
            /* @__PURE__ */ T(
              "div",
              {
                ref: re,
                className: "audio-fft-window__interaction-layer",
                onPointerDown: mt,
                onPointerMove: pt,
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
function Tn(t, o) {
  const n = Ft.base[700], d = Ft.base[100];
  return { safeA: t ?? n, safeB: o ?? d };
}
const ne = (t) => Math.max(0, Math.min(1, t)), N = (t, o, n) => Math.max(o, Math.min(n, t)), In = 44100, Ot = In / 2, ut = 10, _n = 18, we = 8, lt = 10, Me = 500, Ct = 20, St = 80, Fn = 1 / 60, Un = [
  { value: "discrete", label: "Step" },
  { value: "interpolated", label: "Interp" }
], it = (t) => Math.round(ne(t) * 10) / 10, ct = (t) => Math.round(N(t, 0, 3) * 10) / 10, Ce = (t) => Math.round(N(t, 0, Me) / lt) * lt, wt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : ne(1 - Math.exp(-d / n));
};
function vt(t, o) {
  return t === "discrete" || t === "interpolated" ? t : o;
}
function xe(t, o, n, d) {
  const [b, i] = bn(d), u = d !== void 0 && t === void 0, w = u ? b : t, [m, A] = e.useState(o), g = w !== void 0, l = g ? w : m, f = e.useCallback((I) => {
    g || A(I), u && i(I), n?.(I);
  }, [g, n, i, u]);
  return e.useEffect(() => {
    !u || b !== void 0 || i(o);
  }, [o, i, u, b]), [l, f, g];
}
function Gt(t) {
  const o = t || 16, d = o * 0.35, i = o * 1;
  return Math.max(
    Math.round(i + d * 2 + 2),
    Math.round(o + d * 1.5),
    _n
  );
}
function ft(t) {
  !t || t.state === "closed" || t.close().catch(() => {
  });
}
function Jn({
  ariaLabel: t = "Audio controls",
  fontSize: o,
  colorA: n,
  colorB: d,
  borderStyle: b,
  source: i,
  heightUnits: u = 6,
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
  defaultBinInterpolation: O = "discrete",
  binInterpolation: G,
  onBinInterpolationChange: q,
  defaultFrequencyMin: Q = 0,
  frequencyMin: re,
  onFrequencyMinChange: Z,
  defaultFrequencyMax: Y = Ot,
  frequencyMax: P,
  onFrequencyMaxChange: $,
  defaultFftAttack: de = Ct,
  fftAttack: me,
  onFftAttackChange: pe,
  defaultFftRelease: be = St,
  fftRelease: J,
  onFftReleaseChange: ce,
  defaultFftBlurSigma: le = 0,
  fftBlurSigma: oe,
  onFftBlurSigmaChange: ae,
  defaultAnalyserSmoothing: W = 0.8,
  analyserSmoothing: y,
  onAnalyserSmoothingChange: _
}) {
  const F = dt(w), p = pn(), h = o ?? p?.fontSize ?? 12, x = b ?? p?.borderStyle ?? "a", { safeA: a, safeB: s } = Tn(
    n ?? p?.colorA,
    d ?? p?.colorB
  ), S = dn(), R = e.useRef(null), H = R.current ?? mn({
    bins: [],
    binCount: 0,
    maxMagnitude: 1
  });
  R.current || (R.current = H);
  const X = m ?? S ?? H, se = e.useMemo(() => ({
    setAudioBins: X.setAudioBins,
    setAudioBinCount: X.setAudioBinCount,
    setAudioMaxMagnitude: X.setAudioMaxMagnitude
  }), [X]), U = i.type === "buffer", Se = xn(A, t), j = e.useCallback((r) => {
    const E = g?.[r];
    if (E) return E;
    if (!(r === "playing" || r === "muted"))
      return Se ? `${Se}.${r}` : void 0;
  }, [g, Se]), [ye, Te] = xe(
    f,
    l,
    I,
    j("playing")
  ), [ue, mt] = xe(
    k,
    B,
    V,
    j("muted")
  ), [pt, Ae] = e.useState(0), [Ze, ze] = e.useState(!1), [ht, Ne] = e.useState(null), c = e.useRef(0), v = e.useCallback((r) => N(Math.round(r || 0), 1, 1024), []), [K, he] = xe(
    L,
    v(z),
    M,
    j("binCount")
  ), [Ie, De] = xe(
    y,
    it(ne(W)),
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
    oe,
    ct(le),
    ae,
    j("fftBlurSigma")
  ), [je, Je] = xe(
    G,
    vt(O, "discrete"),
    q,
    j("binInterpolation")
  ), [D, We] = e.useState(Ot), [He, C] = xe(
    re,
    Q,
    Z,
    j("frequencyMin")
  ), [Xe, _e] = xe(
    P,
    Y,
    $,
    j("frequencyMax")
  ), Be = e.useRef(null), [ke, gt] = e.useState({ version: 0, binCount: 0 }), ie = v(K), ge = it(ne(Ie)), Pe = Ce(Oe), et = Ce($e), te = ct(fe), At = vt(je, "discrete"), Ht = At === "discrete", Re = e.useMemo(() => Math.min(ut, D), [D]), { freqMinHz: tt, freqMaxHz: nt } = e.useMemo(() => {
    const r = Number.isFinite(He ?? Number.NaN) ? He : 0, E = Number.isFinite(Xe ?? Number.NaN) ? Xe : D, Ke = N(E, Re, D), Qe = N(r, 0, Math.max(0, Ke - Re)), at = N(Ke, Qe + Re, D);
    return { freqMinHz: Qe, freqMaxHz: at };
  }, [He, Xe, Re, D]), Xt = D > 0 ? tt / D : 0, Yt = D > 0 ? nt / D : 1, xt = N(Xt, 0, 1), bt = N(Yt, 0, 1), Bt = e.useCallback((r) => {
    const E = N(r, 0, Math.max(0, nt - Re));
    C(E);
  }, [nt, Re, C]), kt = e.useCallback((r) => {
    const E = N(r, Math.min(D, tt + Re), D);
    _e(E);
  }, [tt, Re, D, _e]), Pt = e.useCallback((r) => {
    We(Math.max(1, r / 2));
  }, []), [Mt, Et] = e.useState(() => Gt(h)), Tt = e.useRef(null);
  e.useEffect(() => {
    const r = Gt(h);
    Et((E) => Math.abs(E - r) < 0.5 ? E : r);
  }, [h]), e.useLayoutEffect(() => {
    const r = Tt.current;
    if (!r || typeof ResizeObserver > "u") return;
    const E = () => {
      const Qe = r.getBoundingClientRect();
      if (!Qe.height) return;
      const at = Math.round(Qe.height);
      Et((_t) => Math.abs(_t - at) < 0.5 ? _t : at);
    };
    E();
    const Ke = new ResizeObserver(() => E());
    return Ke.observe(r), () => Ke.disconnect();
  }, []);
  const Kt = a, Fe = x === "none" ? 0 : 1, ve = x === "none" ? "transparent" : x === "b" ? s : a, Qt = a, Zt = ye ? "playing" : "paused", jt = ue ? "muted" : "unmuted", Jt = [
    { value: "paused", icon: /* @__PURE__ */ T(sn, { strokeWidth: 1.6 }), ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: /* @__PURE__ */ T(un, { strokeWidth: 1.6 }), ariaLabel: "Pause audio analysis", title: "Pause audio analysis" }
  ], en = [
    { value: "muted", icon: /* @__PURE__ */ T(cn, { strokeWidth: 1.6 }), ariaLabel: "Unmute audio output", title: "Unmute audio output" },
    { value: "unmuted", icon: /* @__PURE__ */ T(ln, { strokeWidth: 1.6 }), ariaLabel: "Mute audio output", title: "Mute audio output" }
  ], rt = N(Pe, 0, Me), Ye = N(et, 0, Me), tn = Math.max(1e-3, wt(Ye, Fn) * 0.25), ot = e.useCallback((r) => {
    const E = ne(r);
    c.current += 1, Ne({ ratio: E, token: c.current });
  }, []), It = e.useCallback((r) => {
    r?.length && ((!Be.current || Be.current.length !== r.length) && (Be.current = new Uint8Array(r.length)), Be.current.set(r), gt((E) => ({
      version: E.version + 1,
      binCount: r.length
    })));
  }, []), nn = e.useCallback((r) => {
    if (!U) return;
    const E = ne(r);
    Ze || Ae(E);
  }, [U, Ze]), rn = e.useCallback(() => {
    U && ze(!0);
  }, [U]), on = e.useCallback((r) => {
    if (!U) return;
    const E = ne(r);
    Ae(E), ot(E);
  }, [U, ot]), an = e.useCallback((r) => {
    if (!U) return;
    const E = ne(r);
    Ae(E), ot(E), ze(!1);
  }, [U, ot]);
  return e.useEffect(() => {
    U || (Ae(0), ze(!1), Ne(null));
  }, [U]), /* @__PURE__ */ T(fn, { suspended: F, children: /* @__PURE__ */ Le("div", { style: { width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ Le(
      "div",
      {
        style: {
          width: "100%",
          minHeight: Mt,
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
            Ut,
            {
              behavior: "cycle",
              value: Zt,
              options: Jt,
              onChange: (r) => Te(r === "playing"),
              borderStyle: "none",
              fontSize: h,
              colorA: a,
              colorB: s
            }
          ) }),
          /* @__PURE__ */ Le("div", { style: { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: we }, children: [
            /* @__PURE__ */ T("div", { ref: Tt, style: { display: "flex", minWidth: 0 }, children: /* @__PURE__ */ T(
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
              hn,
              {
                ariaLabel: "Bin interpolation",
                showLabel: !1,
                options: Un,
                value: At,
                onChange: (r) => {
                  Je(vt(
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
                max: Math.max(0, D - ut),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: h,
                value: tt,
                onUserChange: Bt,
                onAnimatedUpdate: Bt,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            ),
            /* @__PURE__ */ T(
              Ee,
              {
                label: "Max",
                variant: "basic",
                min: ut,
                max: Math.max(ut, D),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: h,
                value: nt,
                onUserChange: kt,
                onAnimatedUpdate: kt,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            )
          ] })
        ]
      }
    ),
    i.type === "buffer" ? /* @__PURE__ */ T(
      Ln,
      {
        src: i.src,
        loop: i.loop,
        playing: ye,
        analysisActions: se,
        onProgress: nn,
        seekTarget: ht,
        analyserSmoothing: ge,
        attackMs: rt,
        releaseMs: Ye,
        blurSigma: te,
        targetBins: ie,
        onRawFftFrame: It,
        frequencyMin: xt,
        frequencyMax: bt,
        onSampleRateChange: Pt,
        muted: ue,
        suspended: F
      }
    ) : /* @__PURE__ */ T(
      Vn,
      {
        source: i,
        playing: ye,
        analysisActions: se,
        analyserSmoothing: ge,
        attackMs: rt,
        releaseMs: Ye,
        blurSigma: te,
        targetBins: ie,
        onRawFftFrame: It,
        frequencyMin: xt,
        frequencyMax: bt,
        onSampleRateChange: Pt,
        muted: ue,
        suspended: F
      }
    ),
    /* @__PURE__ */ T(
      "div",
      {
        style: {
          borderTop: `1px solid ${Kt}`,
          borderLeft: `${Fe}px solid ${ve}`,
          borderRight: `${Fe}px solid ${ve}`,
          borderRadius: 0,
          borderBottom: `1px solid ${s}`,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0a0a, #1a1a1a)"
        },
        children: /* @__PURE__ */ T(
          En,
          {
            heightUnits: u,
            unitSizePx: Mt,
            maxWidth: "100%",
            maxBins: ie,
            peakDecay: tn,
            playbackRatio: U ? pt : 0,
            showPlaybackIndicator: U,
            onScrubStart: U ? rn : void 0,
            onScrub: U ? on : void 0,
            onScrubEnd: U ? an : void 0,
            activeColor: a,
            inactiveColor: s,
            rawFftDataRef: Be,
            rawFrameVersion: ke.version,
            rawBinCount: ke.binCount,
            attackMs: rt,
            releaseMs: Ye,
            blurSigma: te,
            discreteBins: Ht,
            frequencyMin: xt,
            frequencyMax: bt,
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
          minHeight: Mt,
          borderTop: `1px solid ${a}`,
          borderLeft: `${Fe}px solid ${ve}`,
          borderRight: `${Fe}px solid ${ve}`,
          borderBottom: `1px solid ${ve}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: s,
          color: Qt,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: we,
          padding: `0 ${we}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ T("div", { style: { display: "flex", alignItems: "center", gap: we, flexShrink: 0 }, children: /* @__PURE__ */ T(
            Ut,
            {
              behavior: "cycle",
              value: jt,
              options: en,
              onChange: (r) => mt(r === "muted"),
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
                    step: lt,
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
                    step: lt,
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
                    onUserChange: (r) => De(it(r)),
                    onAnimatedUpdate: (r) => De(it(r)),
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
function Ln({
  src: t,
  loop: o = !0,
  playing: n,
  analysisActions: d,
  seekTarget: b,
  onProgress: i,
  analyserSmoothing: u = 0.8,
  attackMs: w = Ct,
  releaseMs: m = St,
  blurSigma: A = 0,
  targetBins: g = 1024,
  onRawFftFrame: l,
  frequencyMin: f = 0,
  frequencyMax: I = 1,
  onSampleRateChange: B,
  muted: k = !0,
  suspended: V
}) {
  const z = dt(V), { setAudioBins: L, setAudioBinCount: M, setAudioMaxMagnitude: O } = d, G = e.useRef(null), q = e.useRef(null), Q = e.useRef(null), re = e.useRef(null), Z = e.useRef(null), Y = e.useRef(null), P = e.useRef(0), $ = e.useRef(null), de = e.useRef(i), me = e.useRef(ne(u ?? 0.8)), pe = e.useRef(B), be = e.useRef(k), J = e.useRef({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  }), ce = e.useRef(null), le = e.useRef(null), oe = e.useRef(/* @__PURE__ */ new Map()), ae = e.useRef(null);
  e.useEffect(() => {
    de.current = i;
  }, [i]), e.useEffect(() => {
    pe.current = B;
  }, [B]), e.useEffect(() => {
    be.current = k;
    const x = Z.current, a = G.current;
    x && a && x.gain.setTargetAtTime(k ? 0 : 1, a.currentTime, 0.01);
  }, [k]), e.useEffect(() => {
    const x = ne(u ?? 0.8);
    me.current = x, q.current && (q.current.smoothingTimeConstant = x);
  }, [u]);
  const W = e.useCallback(() => Y.current?.duration ?? 0, []), y = e.useCallback((x) => {
    const a = W();
    if (a <= 0) return 0;
    const s = x % a, S = s < 0 ? s + a : s, R = Math.min(a * 1e-3, 1e-4) || 1e-4;
    return Math.min(S, Math.max(0, a - R));
  }, [W]), _ = e.useCallback(() => {
    if (W() <= 0) return 0;
    const a = y(P.current), s = $.current, S = G.current;
    if (!S || s == null) return a;
    const R = S.currentTime - s;
    return y(a + R);
  }, [W, y]), F = e.useCallback(() => {
    try {
      re.current?.stop();
    } catch {
    }
    re.current?.disconnect(), Z.current?.disconnect(), re.current = null, Z.current = null;
  }, []);
  e.useEffect(() => {
    const x = oe.current;
    let a = !1;
    async function s() {
      try {
        const S = new AudioContext();
        G.current = S, pe.current?.(S.sampleRate);
        const R = await fetch(t);
        if (!R.ok) throw new Error(`Failed to load audio sample: ${R.status}`);
        const H = await R.arrayBuffer(), X = await S.decodeAudioData(H);
        if (a) {
          ft(S);
          return;
        }
        Y.current = X, P.current = 0, $.current = null;
        const se = S.createAnalyser();
        se.fftSize = 2048, se.smoothingTimeConstant = me.current, q.current = se, Q.current = new Uint8Array(new ArrayBuffer(se.frequencyBinCount)), M(se.frequencyBinCount), O(1);
      } catch (S) {
        console.error("Failed to load audio for FFT", S);
      }
    }
    return s(), () => {
      a = !0, q.current = null, Q.current = null, F(), ft(G.current), G.current = null, re.current = null, Z.current = null, Y.current = null, P.current = 0, $.current = null, J.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: !1
      }, ce.current = null, le.current = null, x.clear(), ae.current = null;
    };
  }, [M, O, t, F]);
  const p = e.useCallback(() => {
    P.current = _(), $.current = null, F();
  }, [_, F]), h = e.useCallback(async (x) => {
    if (!Y.current || !G.current) return;
    const a = G.current;
    a.state === "suspended" && await a.resume().catch(() => {
    });
    const s = q.current ?? a.createAnalyser();
    s.fftSize = 2048, s.smoothingTimeConstant = me.current, q.current = s;
    const S = y(typeof x == "number" ? x : _());
    P.current = S, $.current = a.currentTime, F();
    const R = a.createBufferSource();
    R.buffer = Y.current, R.loop = o;
    const H = a.createGain();
    H.gain.value = be.current ? 0 : 1, R.connect(s), s.connect(H), H.connect(a.destination), R.start(0, S), re.current = R, Z.current = H, Q.current || (Q.current = new Uint8Array(new ArrayBuffer(s.frequencyBinCount)), M(s.frequencyBinCount));
  }, [_, o, M, F, y]);
  return e.useEffect(() => (n ? h() : p(), () => {
    p();
  }), [n, h, p]), e.useEffect(() => {
    if (!b) return;
    const x = W();
    if (x <= 0) return;
    const a = ne(b.ratio), s = y(a * x);
    P.current = s, n && Y.current && G.current ? h(s) : $.current = null;
  }, [W, n, b, h, y]), $t(z ? null : (x, a) => {
    const s = q.current, S = Q.current;
    if (s && S) {
      s.getByteFrequencyData(S), l && l(S);
      const X = Wt(
        S,
        {
          attackMs: N(w, 0, Me),
          releaseMs: N(m, 0, Me),
          dtSec: a,
          blurSigma: Math.max(0, A || 0),
          targetBins: N(Math.round(g || S.length), 1, S.length),
          frequencyMin: f,
          frequencyMax: I
        },
        J.current,
        ce,
        le,
        oe.current
      ).resampled;
      L(Array.from(X)), ae.current !== X.length && (ae.current = X.length, M(X.length));
    }
    const R = W();
    if (R > 0) {
      const H = _() / R;
      de.current?.(H);
    }
  }), null;
}
function Vn({
  source: t,
  playing: o,
  analysisActions: n,
  analyserSmoothing: d = 0.8,
  attackMs: b = Ct,
  releaseMs: i = St,
  blurSigma: u = 0,
  targetBins: w = 1024,
  onRawFftFrame: m,
  frequencyMin: A = 0,
  frequencyMax: g = 1,
  onSampleRateChange: l,
  muted: f = !0,
  suspended: I
}) {
  const B = dt(I), { setAudioBins: k, setAudioBinCount: V, setAudioMaxMagnitude: z } = n, L = e.useRef(null), M = e.useRef(null), O = e.useRef(null), G = e.useRef(null), q = e.useRef(null), Q = e.useRef(ne(d ?? 0.8)), re = e.useRef(l), Z = e.useRef(f), Y = e.useRef(!1), P = e.useRef(!1), $ = e.useRef(!1), de = e.useRef({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  }), me = e.useRef(null), pe = e.useRef(null), be = e.useRef(/* @__PURE__ */ new Map()), J = e.useRef(null), ce = t.type === "mediaStream" ? t.stream : null, le = t.type === "mediaStream" ? t.context : void 0, oe = t.type === "audioNode" ? t.node : null;
  e.useEffect(() => {
    re.current = l;
  }, [l]), e.useEffect(() => {
    Z.current = f;
    const y = G.current, _ = L.current;
    y && _ && y.gain.setTargetAtTime(f ? 0 : 1, _.currentTime, 0.01);
  }, [f]), e.useEffect(() => {
    const y = ne(d ?? 0.8);
    Q.current = y, M.current && (M.current.smoothingTimeConstant = y);
  }, [d]);
  const ae = e.useCallback(() => {
    if (P.current) return;
    const y = O.current, _ = M.current, F = G.current, p = L.current;
    !y || !_ || !F || !p || (y.connect(_), _.connect(F), F.connect(p.destination), P.current = !0);
  }, []), W = e.useCallback(() => {
    if (P.current) {
      try {
        const y = O.current, _ = M.current;
        y && _ && y.disconnect(_);
      } catch {
      }
      try {
        M.current?.disconnect();
      } catch {
      }
      try {
        G.current?.disconnect();
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
        if (!oe) return;
        h = oe, p = oe.context;
      }
      if (y) {
        x && ft(p);
        return;
      }
      Y.current = x, L.current = p, O.current = h, re.current?.(p.sampleRate);
      const a = p.createAnalyser();
      a.fftSize = 2048, a.smoothingTimeConstant = Q.current, M.current = a, q.current = new Uint8Array(new ArrayBuffer(a.frequencyBinCount)), J.current = a.frequencyBinCount, V(a.frequencyBinCount), z(1);
      const s = p.createGain();
      s.gain.value = Z.current ? 0 : 1, G.current = s, P.current = !1, $.current = !1;
    }
    _();
    const F = be.current;
    return () => {
      y = !0, W(), M.current = null, q.current = null, O.current = null, G.current = null, Y.current && ft(L.current), L.current = null, Y.current = !1, de.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: !1
      }, me.current = null, pe.current = null, F.clear(), J.current = null, $.current = !1;
    };
  }, [
    ae,
    W,
    V,
    z,
    t.type,
    le,
    ce,
    oe
  ]), e.useEffect(() => {
    const y = L.current;
    o ? (y?.state === "suspended" && y.resume().catch(() => {
    }), ae(), $.current = !1) : (W(), $.current = !1);
  }, [ae, W, o]), $t(B ? null : (y, _) => {
    if (!o || !P.current) {
      if (!$.current) {
        const h = J.current ?? 0;
        h > 0 && (k(new Array(h).fill(0)), V(h)), $.current = !0;
      }
      return;
    }
    const F = M.current, p = q.current;
    if (F && p) {
      F.getByteFrequencyData(p), m && m(p);
      const x = Wt(
        p,
        {
          attackMs: N(b, 0, Me),
          releaseMs: N(i, 0, Me),
          dtSec: _,
          blurSigma: Math.max(0, u || 0),
          targetBins: N(Math.round(w || p.length), 1, p.length),
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
function Wt(t, o, n, d, b, i) {
  const u = t.length;
  n.length !== u && (n.length = u, n.hasHistory = !1, n.previous = null, n.scratch = null);
  const w = n.previous && n.previous.length === u ? n.previous : null, m = n.scratch && n.scratch.length === u ? n.scratch : null, A = w ?? new Float32Array(u), g = m ?? new Float32Array(u), l = n.hasHistory && w !== null, f = Math.max(0, o.dtSec), I = wt(o.attackMs, f), B = wt(o.releaseMs, f);
  for (let z = 0; z < u; z += 1) {
    const L = t[z] / 255, M = l ? A[z] : L, O = L >= M ? I : B;
    g[z] = M + (L - M) * O;
  }
  n.hasHistory = !0, n.previous = g, n.scratch = A;
  let k = g;
  o.blurSigma > 1e-3 && (k = zn(k, o.blurSigma, d, i));
  const V = Dn(
    k,
    o.targetBins,
    b,
    o.frequencyMin,
    o.frequencyMax
  );
  return { smoothedSnapshot: g, resampled: V };
}
function zn(t, o, n, d) {
  const b = Math.max(1e-3, o);
  let i = n.current;
  (!i || i.length !== t.length) && (i = new Float32Array(t.length), n.current = i);
  const { radius: u, kernel: w } = Nn(b, d), m = t.length;
  for (let A = 0; A < m; A += 1) {
    let g = 0;
    for (let l = -u; l <= u; l += 1) {
      let f = A + l;
      f < 0 ? f = 0 : f >= m && (f = m - 1), g += t[f] * w[l + u];
    }
    i[A] = g;
  }
  return i;
}
function Nn(t, o) {
  const n = Math.round(t * 100) / 100, d = o.get(n);
  if (d) return d;
  const b = Math.max(1, Math.floor(t * 3)), i = b * 2 + 1, u = new Float32Array(i), w = Math.max(Number.EPSILON, 2 * t * t);
  let m = 0;
  for (let l = 0; l < i; l += 1) {
    const f = l - b, I = Math.exp(-(f * f) / w);
    u[l] = I, m += I;
  }
  const A = m || 1;
  for (let l = 0; l < i; l += 1)
    u[l] /= A;
  const g = { radius: b, kernel: u };
  return o.set(n, g), g;
}
function Dn(t, o, n, d, b) {
  const i = Math.max(1, Math.round(o));
  let u = n.current;
  (!u || u.length !== i) && (u = new Float32Array(i), n.current = u);
  const w = Math.max(0, t.length - 1);
  if (w === 0)
    return u.fill(t[0] ?? 0), u;
  const m = N(d, 0, 1), A = N(b, Math.min(1, m + 1e-3), 1), g = m * w, l = A * w;
  if (i === 1) {
    const f = (g + l) * 0.5, I = Math.floor(f), B = Math.min(w, I + 1), k = f - I, V = t[I] ?? 0, z = t[B] ?? V;
    return u[0] = V + (z - V) * k, u;
  }
  for (let f = 0; f < i; f += 1) {
    const I = f / (i - 1), B = g + I * (l - g), k = Math.floor(B), V = Math.min(w, k + 1), z = B - k, L = t[k] ?? 0, M = t[V] ?? 0;
    u[f] = L + (M - L) * z;
  }
  return u;
}
export {
  Jn as A,
  En as a
};
//# sourceMappingURL=AudioControls-BhDnAmM9.js.map
