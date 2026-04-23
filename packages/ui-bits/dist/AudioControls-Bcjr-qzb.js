import { jsx as I, jsxs as ze } from "react/jsx-runtime";
import e from "react";
import { Play as an, Pause as sn, VolumeX as un, Volume2 as cn } from "lucide-react";
import { u as mt, A as ln } from "./animationSuspension-BEQdvvQj.js";
import { f as fn, b as dn, L as Te } from "./LFOSlider-Cv0xjz_G.js";
import { u as Ot } from "./frameLoop-DbiGWmY_.js";
import { f as It } from "./flexoki-DpJ9ZEpp.js";
import { u as mn } from "./panelGap-DjV8XIAA.js";
import { I as Ft } from "./IconButton-BvvMagK1.js";
import pn from "typegpu";
import { c as hn, d as gn } from "./hooks-KNH81MTH.js";
let yt = null, ut = null;
const xn = [0.16, 0.47, 0.86], bn = [0.02, 0.02, 0.04], $t = 24, Mn = $t * Float32Array.BYTES_PER_ELEMENT, Ne = 64, yn = 0.2, Rn = 4, Rt = 12, _t = 0.01, vn = 20, wn = 80, Ut = (t, o, n) => Math.max(o, Math.min(n, t)), Vt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : Math.max(0, Math.min(1, 1 - Math.exp(-d / n)));
};
async function Cn() {
  return navigator.gpu ? yt || (ut || (ut = pn.init().then((t) => (yt = t, t)).catch((t) => (console.error("AudioFFTWindow: TypeGPU init failed", t), ut = null, null))), ut) : null;
}
function Le(t) {
  return Number.parseInt(t, 16) / 255;
}
function Lt(t, o = [0, 0, 0]) {
  if (!t) return o;
  const n = t.trim();
  if (n.startsWith("#")) {
    if (n.length === 7)
      return [
        Le(n.slice(1, 3)),
        Le(n.slice(3, 5)),
        Le(n.slice(5, 7))
      ];
    if (n.length === 4)
      return [
        Le(n[1] + n[1]),
        Le(n[2] + n[2]),
        Le(n[3] + n[3])
      ];
  }
  return o;
}
function Sn(t) {
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

@compute @workgroup_size(${Ne})
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
function zt(t, o) {
  return t.createTexture({
    size: [o, 1, 1],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
  });
}
function An(t) {
  t && (t.uniformBuffer.destroy(), t.rawBuffer.destroy(), t.stateTextures[0].destroy(), t.stateTextures[1].destroy());
}
function kn(t, o, n, d) {
  const b = o.getContext("webgpu");
  if (!b) return null;
  const i = navigator.gpu.getPreferredCanvasFormat();
  b.configure({
    device: t,
    format: i,
    alphaMode: "opaque"
  });
  const { computeModule: u, renderModule: C } = Sn(t), m = t.createBuffer({
    size: Mn,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), A = t.createBuffer({
    size: Math.max(1, d) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  }), h = [
    zt(t, n),
    zt(t, n)
  ], l = h.map((M) => M.createView({ dimension: "2d" })), f = t.createComputePipeline({
    layout: "auto",
    compute: { module: u, entryPoint: "cs_main" }
  }), T = t.createRenderPipeline({
    layout: "auto",
    vertex: { module: C, entryPoint: "vs_main" },
    fragment: {
      module: C,
      entryPoint: "fs_main",
      targets: [{ format: i }]
    },
    primitive: { topology: "triangle-list" }
  }), k = f.getBindGroupLayout(0), B = T.getBindGroupLayout(0), L = [
    t.createBindGroup({
      layout: k,
      entries: [
        { binding: 0, resource: { buffer: A } },
        { binding: 1, resource: l[0] },
        { binding: 2, resource: l[1] },
        { binding: 3, resource: { buffer: m } }
      ]
    }),
    t.createBindGroup({
      layout: k,
      entries: [
        { binding: 0, resource: { buffer: A } },
        { binding: 1, resource: l[1] },
        { binding: 2, resource: l[0] },
        { binding: 3, resource: { buffer: m } }
      ]
    })
  ], z = [
    t.createBindGroup({
      layout: B,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: l[0] }
      ]
    }),
    t.createBindGroup({
      layout: B,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: l[1] }
      ]
    })
  ], V = Math.max(1, Math.ceil(n / Ne));
  return {
    context: b,
    format: i,
    uniformBuffer: m,
    rawBuffer: A,
    rawCapacity: Math.max(1, d),
    stateTextures: h,
    stateStorageViews: l,
    computePipeline: f,
    renderPipeline: T,
    computeBindGroups: L,
    renderBindGroups: z,
    workgroupCount: V,
    binCapacity: n
  };
}
function Bn({
  heightUnits: t = 6,
  unitSizePx: o,
  maxWidth: n,
  maxBins: d = 1024,
  playbackRatio: b = 0,
  showPlaybackIndicator: i = !0,
  onScrubStart: u,
  onScrub: C,
  onScrubEnd: m,
  activeColor: A,
  inactiveColor: h,
  peakDecay: l = 0.05,
  rawFftDataRef: f,
  rawFrameVersion: T,
  rawBinCount: k = 0,
  attackMs: B = vn,
  releaseMs: L = wn,
  blurSigma: z = 0,
  discreteBins: V = !0,
  frequencyMin: M = 0,
  frequencyMax: D = 1,
  suspended: G
}) {
  const q = e.useRef(null), Q = e.useRef(null), ne = e.useRef(null), [Z, Y] = e.useState(() => typeof navigator < "u" && !!navigator.gpu), [P, O] = e.useState({
    width: 480,
    height: Math.max(1, t) * o
  }), [fe, de] = e.useState(() => Math.max(1, Math.ceil(Math.max(1, Math.floor(d)) / Ne) * Ne)), [me, ge] = e.useState(() => Math.max(1, k || 1)), J = e.useRef(Math.max(0, Math.min(1, b))), ue = e.useRef(Math.max(0, z)), ie = e.useRef(Math.max(0, B)), re = e.useRef(Math.max(0, L)), oe = e.useRef(Math.max(5e-4, l)), W = e.useRef(V ? 1 : 0), y = e.useRef(Math.max(0, Math.min(1, M))), F = e.useRef(Math.max(0, Math.min(1, D))), _ = e.useRef(Math.max(1, Math.floor(d))), p = e.useRef(!1), g = e.useRef(typeof performance < "u" ? performance.now() : Date.now()), x = e.useRef(new Float32Array($t)), a = e.useRef(null), s = e.useRef(0), S = e.useRef(null), R = e.useRef(null), H = e.useRef(null), X = mt(G), ae = e.useRef(X), U = e.useRef({ active: !1, pointerId: null }), Ae = e.useMemo(() => Lt(A, xn), [A]), j = e.useMemo(() => Lt(h, bn), [h]), ye = e.useRef(Ae), Ie = e.useRef(j);
  e.useEffect(() => {
    if (ae.current = X, X) {
      R.current !== null && (cancelAnimationFrame(R.current), R.current = null), g.current = typeof performance < "u" ? performance.now() : Date.now();
      return;
    }
    H.current?.();
  }, [X]), e.useEffect(() => {
    J.current = Math.max(0, Math.min(1, b));
  }, [b]), e.useEffect(() => {
    ue.current = Math.max(0, z);
  }, [z]), e.useEffect(() => {
    ie.current = Math.max(0, B);
  }, [B]), e.useEffect(() => {
    re.current = Math.max(0, L);
  }, [L]), e.useEffect(() => {
    oe.current = Math.max(5e-4, l);
  }, [l]), e.useEffect(() => {
    W.current = V ? 1 : 0;
  }, [V]), e.useEffect(() => {
    y.current = Ut(M, 0, Math.min(1, D - _t));
  }, [M, D]), e.useEffect(() => {
    F.current = Ut(D, Math.min(1, M + _t), 1);
  }, [D, M]), e.useEffect(() => {
    p.current = !0;
  }, [M, D, d]), e.useEffect(() => {
    _.current = Math.max(1, Math.floor(d));
    const c = Math.max(1, Math.ceil(_.current / Ne) * Ne);
    de((v) => v === c ? v : c);
  }, [d]), e.useEffect(() => {
    !k || k <= 0 || ge((c) => k > c ? Math.max(k, c) : c);
  }, [k]), e.useEffect(() => {
    p.current = !0;
  }, [T]), e.useEffect(() => {
    ye.current = Ae;
  }, [Ae]), e.useEffect(() => {
    Ie.current = j;
  }, [j]), e.useEffect(() => {
    const c = Math.max(1, t) * o;
    O((v) => ({
      width: v.width,
      height: c
    }));
  }, [t, o]), e.useEffect(() => {
    const c = Q.current;
    if (!c) return;
    const v = () => {
      const pe = c.getBoundingClientRect();
      pe.width && O((Fe) => ({
        width: Math.round(pe.width),
        height: Fe.height
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
    const pe = (c - K.left) / K.width;
    return Math.max(0, Math.min(1, pe));
  }, []), pt = e.useCallback((c) => {
    if (!C && !m && !u) return;
    const v = se(c.clientX);
    v != null && (U.current = { active: !0, pointerId: c.pointerId }, c.currentTarget.setPointerCapture(c.pointerId), c.preventDefault(), u?.(), C?.(v));
  }, [se, C, m, u]), ht = e.useCallback((c) => {
    if (!U.current.active || U.current.pointerId !== c.pointerId) return;
    const v = se(c.clientX);
    v != null && (c.preventDefault(), C?.(v));
  }, [se, C]), ke = e.useCallback((c) => {
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
      const K = await Cn();
      if (!K || c) {
        K || Y(!1);
        return;
      }
      const pe = q.current;
      if (!pe) return;
      const Fe = kn(K.device, pe, fe, me);
      if (!Fe) {
        Y(!1);
        return;
      }
      a.current = Fe, s.current = 0, p.current = !0;
      const Oe = ($e) => {
        if (c) return;
        if (ae.current) {
          R.current = null, g.current = $e;
          return;
        }
        const qe = K.device, We = qe.queue, ee = a.current;
        if (!ee) return;
        const ce = q.current;
        if (!ce) return;
        const He = window.devicePixelRatio || 1, je = Math.max(1, Math.floor(P.width * He)), $ = Math.max(1, Math.floor(P.height * He));
        (ce.width !== je || ce.height !== $) && (ce.width = je, ce.height = $), ce.style.width !== `${Math.round(P.width)}px` && (ce.style.width = `${Math.round(P.width)}px`), ce.style.height !== `${Math.round(P.height)}px` && (ce.style.height = `${Math.round(P.height)}px`);
        const Xe = Math.max(5e-4, ($e - g.current) / 1e3);
        g.current = $e;
        const Be = Math.max(1, _.current), Je = Be > 1 ? 1 / (Be - 1) : 1, w = x.current, et = Math.max(1, k || 0);
        if (w[0] = Be, w[1] = i ? J.current : -1, w[2] = ue.current, w[3] = Je, w[4] = ye.current[0], w[5] = ye.current[1], w[6] = ye.current[2], w[7] = 1, w[8] = Ie.current[0], w[9] = Ie.current[1], w[10] = Ie.current[2], w[11] = 1, w[12] = Vt(ie.current, Xe), w[13] = Vt(re.current, Xe), w[14] = Xe, w[15] = Rn, w[16] = oe.current, w[17] = yn, w[18] = W.current, w[19] = et, w[20] = y.current, w[21] = F.current, w[22] = 0, w[23] = 0, We.writeBuffer(ee.uniformBuffer, 0, w.buffer, w.byteOffset, w.byteLength), p.current && f?.current) {
          const le = f.current, Re = ee.rawCapacity;
          (!S.current || S.current.length !== Re) && (S.current = new Float32Array(Re));
          const Pe = S.current, Ee = Math.min(Re, le.length);
          for (let be = 0; be < Ee; be += 1)
            Pe[be] = le[be] / 255;
          for (let be = Ee; be < Re; be += 1)
            Pe[be] = 0;
          We.writeBuffer(
            ee.rawBuffer,
            0,
            Pe.buffer,
            Pe.byteOffset,
            Pe.byteLength
          ), p.current = !1;
        }
        const xe = qe.createCommandEncoder();
        if (f?.current) {
          const le = xe.beginComputePass(), Re = ee.computeBindGroups[s.current];
          le.setPipeline(ee.computePipeline), le.setBindGroup(0, Re), le.dispatchWorkgroups(ee.workgroupCount, 1, 1), le.end(), s.current = s.current === 0 ? 1 : 0;
        }
        const tt = ee.context.getCurrentTexture().createView(), _e = xe.beginRenderPass({
          colorAttachments: [{
            view: tt,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }]
        });
        _e.setPipeline(ee.renderPipeline);
        const Ue = ee.renderBindGroups[s.current];
        _e.setBindGroup(0, Ue), _e.draw(6, 1, 0, 0), _e.end(), We.submit([xe.finish()]), R.current = requestAnimationFrame(Oe);
      };
      H.current = () => {
        c || R.current !== null || (g.current = typeof performance < "u" ? performance.now() : Date.now(), R.current = requestAnimationFrame(Oe));
      }, ae.current || H.current();
    }
    return v(), () => {
      c = !0, R.current !== null && (cancelAnimationFrame(R.current), R.current = null), H.current = null, An(a.current), a.current = null;
    };
  }, [Z, P.width, P.height, fe, me, f, k, i]);
  const De = typeof n == "number" ? `${n}px` : n ?? "100%", gt = Math.round(P.width), Ge = Math.round(P.height);
  return /* @__PURE__ */ I(
    "div",
    {
      ref: Q,
      className: "audio-fft-window",
      style: {
        width: "100%",
        maxWidth: De
      },
      children: /* @__PURE__ */ ze(
        "div",
        {
          className: "audio-fft-window__canvas-wrapper",
          style: {
            width: "100%",
            height: `${Ge}px`,
            position: "relative",
            overflow: "hidden",
            background: "transparent"
          },
          children: [
            Z ? /* @__PURE__ */ I(
              "canvas",
              {
                ref: q,
                width: gt,
                height: Ge,
                style: { width: "100%", height: "100%", display: "block" }
              }
            ) : /* @__PURE__ */ I("div", { className: "audio-fft-window__fallback", children: "WebGPU not available" }),
            /* @__PURE__ */ I(
              "div",
              {
                ref: ne,
                className: "audio-fft-window__interaction-layer",
                onPointerDown: pt,
                onPointerMove: ht,
                onPointerUp: ke,
                onPointerLeave: ke,
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
function Pn(t, o) {
  const n = It.base[700], d = It.base[100];
  return { safeA: t ?? n, safeB: o ?? d };
}
const te = (t) => Math.max(0, Math.min(1, t)), N = (t, o, n) => Math.max(o, Math.min(n, t)), En = 44100, Nt = En / 2, it = 10, Tn = 18, Ce = 8, ft = 10, Me = 500, wt = 20, Ct = 80, In = 1 / 60, ct = (t) => Math.round(te(t) * 10) / 10, lt = (t) => Math.round(N(t, 0, 3) * 10) / 10, Se = (t) => Math.round(N(t, 0, Me) / ft) * ft, vt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, d = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : te(1 - Math.exp(-d / n));
};
function Dt(t, o) {
  return t === "discrete" || t === "interpolated" ? t : o;
}
function he(t, o, n, d) {
  const [b, i] = gn(d), u = d !== void 0 && t === void 0, C = u ? b : t, [m, A] = e.useState(o), h = C !== void 0, l = h ? C : m, f = e.useCallback((T) => {
    h || A(T), u && i(T), n?.(T);
  }, [h, n, i, u]);
  return e.useEffect(() => {
    !u || b !== void 0 || i(o);
  }, [o, i, u, b]), [l, f, h];
}
function Gt(t) {
  const o = t || 16, d = o * 0.35, i = o * 1;
  return Math.max(
    Math.round(i + d * 2 + 2),
    Math.round(o + d * 1.5),
    Tn
  );
}
function dt(t) {
  !t || t.state === "closed" || t.close().catch(() => {
  });
}
function Kn({
  ariaLabel: t = "Audio controls",
  fontSize: o,
  colorA: n,
  colorB: d,
  borderStyle: b,
  source: i,
  heightUnits: u = 6,
  suspended: C,
  audioAnalysisStore: m,
  controlIdPrefix: A,
  controlIds: h,
  defaultPlaying: l = !1,
  playing: f,
  onPlayingChange: T,
  defaultMuted: k = !0,
  muted: B,
  onMutedChange: L,
  defaultBinCount: z = 256,
  binCount: V,
  onBinCountChange: M,
  defaultBinInterpolation: D = "discrete",
  binInterpolation: G,
  onBinInterpolationChange: q,
  defaultFrequencyMin: Q = 0,
  frequencyMin: ne,
  onFrequencyMinChange: Z,
  defaultFrequencyMax: Y = Nt,
  frequencyMax: P,
  onFrequencyMaxChange: O,
  defaultFftAttack: fe = wt,
  fftAttack: de,
  onFftAttackChange: me,
  defaultFftRelease: ge = Ct,
  fftRelease: J,
  onFftReleaseChange: ue,
  defaultFftBlurSigma: ie = 0,
  fftBlurSigma: re,
  onFftBlurSigmaChange: oe,
  defaultAnalyserSmoothing: W = 0.8,
  analyserSmoothing: y,
  onAnalyserSmoothingChange: F
}) {
  const _ = mt(C), p = mn(), g = o ?? p?.fontSize ?? 12, x = b ?? p?.borderStyle ?? "a", { safeA: a, safeB: s } = Pn(
    n ?? p?.colorA,
    d ?? p?.colorB
  ), S = fn(), R = e.useRef(null), H = R.current ?? dn({
    bins: [],
    binCount: 0,
    maxMagnitude: 1
  });
  R.current || (R.current = H);
  const X = m ?? S ?? H, ae = e.useMemo(() => ({
    setAudioBins: X.setAudioBins,
    setAudioBinCount: X.setAudioBinCount,
    setAudioMaxMagnitude: X.setAudioMaxMagnitude
  }), [X]), U = i.type === "buffer", Ae = hn(A, t), j = e.useCallback((r) => {
    const E = h?.[r];
    if (E) return E;
    if (!(r === "playing" || r === "muted"))
      return Ae ? `${Ae}.${r}` : void 0;
  }, [h, Ae]), [ye, Ie] = he(
    f,
    l,
    T,
    j("playing")
  ), [se, pt] = he(
    B,
    k,
    L,
    j("muted")
  ), [ht, ke] = e.useState(0), [Ze, De] = e.useState(!1), [gt, Ge] = e.useState(null), c = e.useRef(0), v = e.useCallback((r) => N(Math.round(r || 0), 1, 1024), []), [K, pe] = he(
    V,
    v(z),
    M,
    j("binCount")
  ), [Fe, Oe] = he(
    y,
    ct(te(W)),
    F,
    j("analyserSmoothing")
  ), [$e, qe] = he(
    de,
    Se(fe),
    me,
    j("fftAttack")
  ), [We, ee] = he(
    J,
    Se(ge),
    ue,
    j("fftRelease")
  ), [ce, He] = he(
    re,
    lt(ie),
    oe,
    j("fftBlurSigma")
  ), [je] = he(
    G,
    Dt(D, "discrete"),
    q,
    j("binInterpolation")
  ), [$, Xe] = e.useState(Nt), [Be, Je] = he(
    ne,
    Q,
    Z,
    j("frequencyMin")
  ), [w, et] = he(
    P,
    Y,
    O,
    j("frequencyMax")
  ), xe = e.useRef(null), [tt, _e] = e.useState({ version: 0, binCount: 0 }), Ue = v(K), le = ct(te(Fe)), Re = Se($e), Pe = Se(We), Ee = lt(ce), Wt = Dt(je, "discrete") === "discrete", ve = e.useMemo(() => Math.min(it, $), [$]), { freqMinHz: nt, freqMaxHz: rt } = e.useMemo(() => {
    const r = Number.isFinite(Be ?? Number.NaN) ? Be : 0, E = Number.isFinite(w ?? Number.NaN) ? w : $, Ke = N(E, ve, $), Qe = N(r, 0, Math.max(0, Ke - ve)), st = N(Ke, Qe + ve, $);
    return { freqMinHz: Qe, freqMaxHz: st };
  }, [Be, w, ve, $]), Ht = $ > 0 ? nt / $ : 0, Xt = $ > 0 ? rt / $ : 1, xt = N(Ht, 0, 1), bt = N(Xt, 0, 1), St = e.useCallback((r) => {
    const E = N(r, 0, Math.max(0, rt - ve));
    Je(E);
  }, [rt, ve, Je]), At = e.useCallback((r) => {
    const E = N(r, Math.min($, nt + ve), $);
    et(E);
  }, [nt, ve, $, et]), kt = e.useCallback((r) => {
    Xe(Math.max(1, r / 2));
  }, []), [Mt, Bt] = e.useState(() => Gt(g)), Pt = e.useRef(null);
  e.useEffect(() => {
    const r = Gt(g);
    Bt((E) => Math.abs(E - r) < 0.5 ? E : r);
  }, [g]), e.useLayoutEffect(() => {
    const r = Pt.current;
    if (!r || typeof ResizeObserver > "u") return;
    const E = () => {
      const Qe = r.getBoundingClientRect();
      if (!Qe.height) return;
      const st = Math.round(Qe.height);
      Bt((Tt) => Math.abs(Tt - st) < 0.5 ? Tt : st);
    };
    E();
    const Ke = new ResizeObserver(() => E());
    return Ke.observe(r), () => Ke.disconnect();
  }, []);
  const Yt = a, Ve = x === "none" ? 0 : 1, we = x === "none" ? "transparent" : x === "b" ? s : a, Kt = a, Qt = ye ? "playing" : "paused", Zt = se ? "muted" : "unmuted", jt = [
    { value: "paused", icon: /* @__PURE__ */ I(an, { strokeWidth: 1.6 }), ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: /* @__PURE__ */ I(sn, { strokeWidth: 1.6 }), ariaLabel: "Pause audio analysis", title: "Pause audio analysis" }
  ], Jt = [
    { value: "muted", icon: /* @__PURE__ */ I(un, { strokeWidth: 1.6 }), ariaLabel: "Unmute audio output", title: "Unmute audio output" },
    { value: "unmuted", icon: /* @__PURE__ */ I(cn, { strokeWidth: 1.6 }), ariaLabel: "Mute audio output", title: "Mute audio output" }
  ], ot = N(Re, 0, Me), Ye = N(Pe, 0, Me), en = Math.max(1e-3, vt(Ye, In) * 0.25), at = e.useCallback((r) => {
    const E = te(r);
    c.current += 1, Ge({ ratio: E, token: c.current });
  }, []), Et = e.useCallback((r) => {
    r?.length && ((!xe.current || xe.current.length !== r.length) && (xe.current = new Uint8Array(r.length)), xe.current.set(r), _e((E) => ({
      version: E.version + 1,
      binCount: r.length
    })));
  }, []), tn = e.useCallback((r) => {
    if (!U) return;
    const E = te(r);
    Ze || ke(E);
  }, [U, Ze]), nn = e.useCallback(() => {
    U && De(!0);
  }, [U]), rn = e.useCallback((r) => {
    if (!U) return;
    const E = te(r);
    ke(E), at(E);
  }, [U, at]), on = e.useCallback((r) => {
    if (!U) return;
    const E = te(r);
    ke(E), at(E), De(!1);
  }, [U, at]);
  return e.useEffect(() => {
    U || (ke(0), De(!1), Ge(null));
  }, [U]), /* @__PURE__ */ I(ln, { suspended: _, children: /* @__PURE__ */ ze("div", { style: { width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ ze(
      "div",
      {
        style: {
          width: "100%",
          minHeight: Mt,
          borderTop: `1px solid ${we}`,
          borderLeft: `${Ve}px solid ${we}`,
          borderRight: `${Ve}px solid ${we}`,
          borderBottom: `1px solid ${s}`,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: s,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: Ce,
          padding: `0 ${Ce}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ I("div", { style: { display: "flex", alignItems: "center", gap: Ce, flexShrink: 0 }, children: /* @__PURE__ */ I(
            Ft,
            {
              behavior: "cycle",
              value: Qt,
              options: jt,
              onChange: (r) => Ie(r === "playing"),
              borderStyle: "none",
              fontSize: g,
              colorA: a,
              colorB: s
            }
          ) }),
          /* @__PURE__ */ ze("div", { style: { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: Ce }, children: [
            /* @__PURE__ */ I("div", { ref: Pt, style: { display: "flex", minWidth: 0 }, children: /* @__PURE__ */ I(
              Te,
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
                fontSize: g,
                value: Ue,
                onUserChange: (r) => {
                  pe(v(r));
                },
                onAnimatedUpdate: (r) => {
                  pe(v(r));
                },
                style: { gap: 0 }
              }
            ) }),
            /* @__PURE__ */ I(
              Te,
              {
                label: "Min",
                variant: "basic",
                min: 0,
                max: Math.max(0, $ - it),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: g,
                value: nt,
                onUserChange: St,
                onAnimatedUpdate: St,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            ),
            /* @__PURE__ */ I(
              Te,
              {
                label: "Max",
                variant: "basic",
                min: it,
                max: Math.max(it, $),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: a,
                colorB: s,
                fontSize: g,
                value: rt,
                onUserChange: At,
                onAnimatedUpdate: At,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            )
          ] })
        ]
      }
    ),
    i.type === "buffer" ? /* @__PURE__ */ I(
      Fn,
      {
        src: i.src,
        loop: i.loop,
        playing: ye,
        analysisActions: ae,
        onProgress: tn,
        seekTarget: gt,
        analyserSmoothing: le,
        attackMs: ot,
        releaseMs: Ye,
        blurSigma: Ee,
        targetBins: Ue,
        onRawFftFrame: Et,
        frequencyMin: xt,
        frequencyMax: bt,
        onSampleRateChange: kt,
        muted: se,
        suspended: _
      }
    ) : /* @__PURE__ */ I(
      _n,
      {
        source: i,
        playing: ye,
        analysisActions: ae,
        analyserSmoothing: le,
        attackMs: ot,
        releaseMs: Ye,
        blurSigma: Ee,
        targetBins: Ue,
        onRawFftFrame: Et,
        frequencyMin: xt,
        frequencyMax: bt,
        onSampleRateChange: kt,
        muted: se,
        suspended: _
      }
    ),
    /* @__PURE__ */ I(
      "div",
      {
        style: {
          borderTop: `1px solid ${Yt}`,
          borderLeft: `${Ve}px solid ${we}`,
          borderRight: `${Ve}px solid ${we}`,
          borderRadius: 0,
          borderBottom: `1px solid ${s}`,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0a0a, #1a1a1a)"
        },
        children: /* @__PURE__ */ I(
          Bn,
          {
            heightUnits: u,
            unitSizePx: Mt,
            maxWidth: "100%",
            maxBins: Ue,
            peakDecay: en,
            playbackRatio: U ? ht : 0,
            showPlaybackIndicator: U,
            onScrubStart: U ? nn : void 0,
            onScrub: U ? rn : void 0,
            onScrubEnd: U ? on : void 0,
            activeColor: a,
            inactiveColor: s,
            rawFftDataRef: xe,
            rawFrameVersion: tt.version,
            rawBinCount: tt.binCount,
            attackMs: ot,
            releaseMs: Ye,
            blurSigma: Ee,
            discreteBins: Wt,
            frequencyMin: xt,
            frequencyMax: bt,
            suspended: _
          }
        )
      }
    ),
    /* @__PURE__ */ ze(
      "div",
      {
        style: {
          width: "100%",
          minHeight: Mt,
          borderTop: `1px solid ${a}`,
          borderLeft: `${Ve}px solid ${we}`,
          borderRight: `${Ve}px solid ${we}`,
          borderBottom: `1px solid ${we}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: s,
          color: Kt,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: Ce,
          padding: `0 ${Ce}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ I("div", { style: { display: "flex", alignItems: "center", gap: Ce, flexShrink: 0 }, children: /* @__PURE__ */ I(
            Ft,
            {
              behavior: "cycle",
              value: Zt,
              options: Jt,
              onChange: (r) => pt(r === "muted"),
              borderStyle: "none",
              fontSize: g,
              colorA: a,
              colorB: s
            }
          ) }),
          /* @__PURE__ */ ze(
            "div",
            {
              style: {
                flex: 1,
                minWidth: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: Ce
              },
              children: [
                /* @__PURE__ */ I(
                  Te,
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
                    fontSize: g,
                    value: ot,
                    onUserChange: (r) => qe(Se(r)),
                    onAnimatedUpdate: (r) => qe(Se(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ I(
                  Te,
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
                    fontSize: g,
                    value: Ye,
                    onUserChange: (r) => ee(Se(r)),
                    onAnimatedUpdate: (r) => ee(Se(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ I(
                  Te,
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
                    fontSize: g,
                    value: le,
                    onUserChange: (r) => Oe(ct(r)),
                    onAnimatedUpdate: (r) => Oe(ct(r)),
                    formatDisplayValue: (r) => r.toFixed(1),
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ I(
                  Te,
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
                    fontSize: g,
                    value: Ee,
                    onUserChange: (r) => He(lt(r)),
                    onAnimatedUpdate: (r) => He(lt(r)),
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
function Fn({
  src: t,
  loop: o = !0,
  playing: n,
  analysisActions: d,
  seekTarget: b,
  onProgress: i,
  analyserSmoothing: u = 0.8,
  attackMs: C = wt,
  releaseMs: m = Ct,
  blurSigma: A = 0,
  targetBins: h = 1024,
  onRawFftFrame: l,
  frequencyMin: f = 0,
  frequencyMax: T = 1,
  onSampleRateChange: k,
  muted: B = !0,
  suspended: L
}) {
  const z = mt(L), { setAudioBins: V, setAudioBinCount: M, setAudioMaxMagnitude: D } = d, G = e.useRef(null), q = e.useRef(null), Q = e.useRef(null), ne = e.useRef(null), Z = e.useRef(null), Y = e.useRef(null), P = e.useRef(0), O = e.useRef(null), fe = e.useRef(i), de = e.useRef(te(u ?? 0.8)), me = e.useRef(k), ge = e.useRef(B), J = e.useRef({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  }), ue = e.useRef(null), ie = e.useRef(null), re = e.useRef(/* @__PURE__ */ new Map()), oe = e.useRef(null);
  e.useEffect(() => {
    fe.current = i;
  }, [i]), e.useEffect(() => {
    me.current = k;
  }, [k]), e.useEffect(() => {
    ge.current = B;
    const x = Z.current, a = G.current;
    x && a && x.gain.setTargetAtTime(B ? 0 : 1, a.currentTime, 0.01);
  }, [B]), e.useEffect(() => {
    const x = te(u ?? 0.8);
    de.current = x, q.current && (q.current.smoothingTimeConstant = x);
  }, [u]);
  const W = e.useCallback(() => Y.current?.duration ?? 0, []), y = e.useCallback((x) => {
    const a = W();
    if (a <= 0) return 0;
    const s = x % a, S = s < 0 ? s + a : s, R = Math.min(a * 1e-3, 1e-4) || 1e-4;
    return Math.min(S, Math.max(0, a - R));
  }, [W]), F = e.useCallback(() => {
    if (W() <= 0) return 0;
    const a = y(P.current), s = O.current, S = G.current;
    if (!S || s == null) return a;
    const R = S.currentTime - s;
    return y(a + R);
  }, [W, y]), _ = e.useCallback(() => {
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
        G.current = S, me.current?.(S.sampleRate);
        const R = await fetch(t);
        if (!R.ok) throw new Error(`Failed to load audio sample: ${R.status}`);
        const H = await R.arrayBuffer(), X = await S.decodeAudioData(H);
        if (a) {
          dt(S);
          return;
        }
        Y.current = X, P.current = 0, O.current = null;
        const ae = S.createAnalyser();
        ae.fftSize = 2048, ae.smoothingTimeConstant = de.current, q.current = ae, Q.current = new Uint8Array(new ArrayBuffer(ae.frequencyBinCount)), M(ae.frequencyBinCount), D(1);
      } catch (S) {
        console.error("Failed to load audio for FFT", S);
      }
    }
    return s(), () => {
      a = !0, q.current = null, Q.current = null, _(), dt(G.current), G.current = null, ne.current = null, Z.current = null, Y.current = null, P.current = 0, O.current = null, J.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: !1
      }, ue.current = null, ie.current = null, x.clear(), oe.current = null;
    };
  }, [M, D, t, _]);
  const p = e.useCallback(() => {
    P.current = F(), O.current = null, _();
  }, [F, _]), g = e.useCallback(async (x) => {
    if (!Y.current || !G.current) return;
    const a = G.current;
    a.state === "suspended" && await a.resume().catch(() => {
    });
    const s = q.current ?? a.createAnalyser();
    s.fftSize = 2048, s.smoothingTimeConstant = de.current, q.current = s;
    const S = y(typeof x == "number" ? x : F());
    P.current = S, O.current = a.currentTime, _();
    const R = a.createBufferSource();
    R.buffer = Y.current, R.loop = o;
    const H = a.createGain();
    H.gain.value = ge.current ? 0 : 1, R.connect(s), s.connect(H), H.connect(a.destination), R.start(0, S), ne.current = R, Z.current = H, Q.current || (Q.current = new Uint8Array(new ArrayBuffer(s.frequencyBinCount)), M(s.frequencyBinCount));
  }, [F, o, M, _, y]);
  return e.useEffect(() => (n ? g() : p(), () => {
    p();
  }), [n, g, p]), e.useEffect(() => {
    if (!b) return;
    const x = W();
    if (x <= 0) return;
    const a = te(b.ratio), s = y(a * x);
    P.current = s, n && Y.current && G.current ? g(s) : O.current = null;
  }, [W, n, b, g, y]), Ot(z ? null : (x, a) => {
    const s = q.current, S = Q.current;
    if (s && S) {
      s.getByteFrequencyData(S), l && l(S);
      const X = qt(
        S,
        {
          attackMs: N(C, 0, Me),
          releaseMs: N(m, 0, Me),
          dtSec: a,
          blurSigma: Math.max(0, A || 0),
          targetBins: N(Math.round(h || S.length), 1, S.length),
          frequencyMin: f,
          frequencyMax: T
        },
        J.current,
        ue,
        ie,
        re.current
      ).resampled;
      V(Array.from(X)), oe.current !== X.length && (oe.current = X.length, M(X.length));
    }
    const R = W();
    if (R > 0) {
      const H = F() / R;
      fe.current?.(H);
    }
  }), null;
}
function _n({
  source: t,
  playing: o,
  analysisActions: n,
  analyserSmoothing: d = 0.8,
  attackMs: b = wt,
  releaseMs: i = Ct,
  blurSigma: u = 0,
  targetBins: C = 1024,
  onRawFftFrame: m,
  frequencyMin: A = 0,
  frequencyMax: h = 1,
  onSampleRateChange: l,
  muted: f = !0,
  suspended: T
}) {
  const k = mt(T), { setAudioBins: B, setAudioBinCount: L, setAudioMaxMagnitude: z } = n, V = e.useRef(null), M = e.useRef(null), D = e.useRef(null), G = e.useRef(null), q = e.useRef(null), Q = e.useRef(te(d ?? 0.8)), ne = e.useRef(l), Z = e.useRef(f), Y = e.useRef(!1), P = e.useRef(!1), O = e.useRef(!1), fe = e.useRef({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  }), de = e.useRef(null), me = e.useRef(null), ge = e.useRef(/* @__PURE__ */ new Map()), J = e.useRef(null), ue = t.type === "mediaStream" ? t.stream : null, ie = t.type === "mediaStream" ? t.context : void 0, re = t.type === "audioNode" ? t.node : null;
  e.useEffect(() => {
    ne.current = l;
  }, [l]), e.useEffect(() => {
    Z.current = f;
    const y = G.current, F = V.current;
    y && F && y.gain.setTargetAtTime(f ? 0 : 1, F.currentTime, 0.01);
  }, [f]), e.useEffect(() => {
    const y = te(d ?? 0.8);
    Q.current = y, M.current && (M.current.smoothingTimeConstant = y);
  }, [d]);
  const oe = e.useCallback(() => {
    if (P.current) return;
    const y = D.current, F = M.current, _ = G.current, p = V.current;
    !y || !F || !_ || !p || (y.connect(F), F.connect(_), _.connect(p.destination), P.current = !0);
  }, []), W = e.useCallback(() => {
    if (P.current) {
      try {
        const y = D.current, F = M.current;
        y && F && y.disconnect(F);
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
    async function F() {
      let p, g, x = !1;
      if (t.type === "mediaStream") {
        if (p = ie ?? new AudioContext(), x = !ie, !ue) return;
        g = p.createMediaStreamSource(ue);
      } else {
        if (!re) return;
        g = re, p = re.context;
      }
      if (y) {
        x && dt(p);
        return;
      }
      Y.current = x, V.current = p, D.current = g, ne.current?.(p.sampleRate);
      const a = p.createAnalyser();
      a.fftSize = 2048, a.smoothingTimeConstant = Q.current, M.current = a, q.current = new Uint8Array(new ArrayBuffer(a.frequencyBinCount)), J.current = a.frequencyBinCount, L(a.frequencyBinCount), z(1);
      const s = p.createGain();
      s.gain.value = Z.current ? 0 : 1, G.current = s, P.current = !1, O.current = !1;
    }
    F();
    const _ = ge.current;
    return () => {
      y = !0, W(), M.current = null, q.current = null, D.current = null, G.current = null, Y.current && dt(V.current), V.current = null, Y.current = !1, fe.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: !1
      }, de.current = null, me.current = null, _.clear(), J.current = null, O.current = !1;
    };
  }, [
    oe,
    W,
    L,
    z,
    t.type,
    ie,
    ue,
    re
  ]), e.useEffect(() => {
    const y = V.current;
    o ? (y?.state === "suspended" && y.resume().catch(() => {
    }), oe(), O.current = !1) : (W(), O.current = !1);
  }, [oe, W, o]), Ot(k ? null : (y, F) => {
    if (!o || !P.current) {
      if (!O.current) {
        const g = J.current ?? 0;
        g > 0 && (B(new Array(g).fill(0)), L(g)), O.current = !0;
      }
      return;
    }
    const _ = M.current, p = q.current;
    if (_ && p) {
      _.getByteFrequencyData(p), m && m(p);
      const x = qt(
        p,
        {
          attackMs: N(b, 0, Me),
          releaseMs: N(i, 0, Me),
          dtSec: F,
          blurSigma: Math.max(0, u || 0),
          targetBins: N(Math.round(C || p.length), 1, p.length),
          frequencyMin: A,
          frequencyMax: h
        },
        fe.current,
        de,
        me,
        ge.current
      ).resampled;
      B(Array.from(x)), J.current !== x.length && (J.current = x.length, L(x.length));
    }
  }), null;
}
function qt(t, o, n, d, b, i) {
  const u = t.length;
  n.length !== u && (n.length = u, n.hasHistory = !1, n.previous = null, n.scratch = null);
  const C = n.previous && n.previous.length === u ? n.previous : null, m = n.scratch && n.scratch.length === u ? n.scratch : null, A = C ?? new Float32Array(u), h = m ?? new Float32Array(u), l = n.hasHistory && C !== null, f = Math.max(0, o.dtSec), T = vt(o.attackMs, f), k = vt(o.releaseMs, f);
  for (let z = 0; z < u; z += 1) {
    const V = t[z] / 255, M = l ? A[z] : V, D = V >= M ? T : k;
    h[z] = M + (V - M) * D;
  }
  n.hasHistory = !0, n.previous = h, n.scratch = A;
  let B = h;
  o.blurSigma > 1e-3 && (B = Un(B, o.blurSigma, d, i));
  const L = Ln(
    B,
    o.targetBins,
    b,
    o.frequencyMin,
    o.frequencyMax
  );
  return { smoothedSnapshot: h, resampled: L };
}
function Un(t, o, n, d) {
  const b = Math.max(1e-3, o);
  let i = n.current;
  (!i || i.length !== t.length) && (i = new Float32Array(t.length), n.current = i);
  const { radius: u, kernel: C } = Vn(b, d), m = t.length;
  for (let A = 0; A < m; A += 1) {
    let h = 0;
    for (let l = -u; l <= u; l += 1) {
      let f = A + l;
      f < 0 ? f = 0 : f >= m && (f = m - 1), h += t[f] * C[l + u];
    }
    i[A] = h;
  }
  return i;
}
function Vn(t, o) {
  const n = Math.round(t * 100) / 100, d = o.get(n);
  if (d) return d;
  const b = Math.max(1, Math.floor(t * 3)), i = b * 2 + 1, u = new Float32Array(i), C = Math.max(Number.EPSILON, 2 * t * t);
  let m = 0;
  for (let l = 0; l < i; l += 1) {
    const f = l - b, T = Math.exp(-(f * f) / C);
    u[l] = T, m += T;
  }
  const A = m || 1;
  for (let l = 0; l < i; l += 1)
    u[l] /= A;
  const h = { radius: b, kernel: u };
  return o.set(n, h), h;
}
function Ln(t, o, n, d, b) {
  const i = Math.max(1, Math.round(o));
  let u = n.current;
  (!u || u.length !== i) && (u = new Float32Array(i), n.current = u);
  const C = Math.max(0, t.length - 1);
  if (C === 0)
    return u.fill(t[0] ?? 0), u;
  const m = N(d, 0, 1), A = N(b, Math.min(1, m + 1e-3), 1), h = m * C, l = A * C;
  if (i === 1) {
    const f = (h + l) * 0.5, T = Math.floor(f), k = Math.min(C, T + 1), B = f - T, L = t[T] ?? 0, z = t[k] ?? L;
    return u[0] = L + (z - L) * B, u;
  }
  for (let f = 0; f < i; f += 1) {
    const T = f / (i - 1), k = h + T * (l - h), B = Math.floor(k), L = Math.min(C, B + 1), z = k - B, V = t[B] ?? 0, M = t[L] ?? 0;
    u[f] = V + (M - V) * z;
  }
  return u;
}
export {
  Kn as A,
  Bn as a
};
//# sourceMappingURL=AudioControls-Bcjr-qzb.js.map
