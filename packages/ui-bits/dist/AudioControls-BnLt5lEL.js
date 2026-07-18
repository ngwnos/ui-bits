import { jsx as U, jsxs as De } from "react/jsx-runtime";
import e from "react";
import { Play as sn, Pause as un, VolumeX as cn, Volume2 as ln } from "lucide-react";
import { u as ht, A as fn } from "./animationSuspension-BEQdvvQj.js";
import { f as dn, b as mn, L as Ie } from "./LFOSlider-C8Ho5u8z.js";
import { u as Wt } from "./frameLoop-BrwpA-Gk.js";
import { f as Lt } from "./flexoki-DpJ9ZEpp.js";
import { u as pn } from "./panelGap-DjV8XIAA.js";
import { I as Vt } from "./IconButton-BvvMagK1.js";
import { S as hn } from "./SegmentBar-CwLUWaLy.js";
import gn from "typegpu";
import { c as xn, d as bn } from "./hooks-KNH81MTH.js";
let vt = null, it = null;
const Mn = [0.16, 0.47, 0.86], yn = [0.02, 0.02, 0.04], Ht = 24, Rn = Ht * Float32Array.BYTES_PER_ELEMENT, Oe = 64, vn = 0.2, wn = 4, wt = 12, zt = 0.01, Cn = 20, Sn = 80, Nt = (t, o, n) => Math.max(o, Math.min(n, t)), Dt = (t, o) => {
  if (t <= 0) return 1;
  const n = t / 1e3, f = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : Math.max(0, Math.min(1, 1 - Math.exp(-f / n)));
};
async function An() {
  return navigator.gpu ? vt || (it || (it = gn.init().then((t) => (vt = t, t)).catch((t) => (console.error("AudioFFTWindow: TypeGPU init failed", t), it = null, null))), it) : null;
}
function Ne(t) {
  return Number.parseInt(t, 16) / 255;
}
function Ot(t, o = [0, 0, 0]) {
  if (!t) return o;
  const n = t.trim();
  if (n.startsWith("#")) {
    if (n.length === 7)
      return [
        Ne(n.slice(1, 3)),
        Ne(n.slice(3, 5)),
        Ne(n.slice(5, 7))
      ];
    if (n.length === 4)
      return [
        Ne(n[1] + n[1]),
        Ne(n[2] + n[2]),
        Ne(n[3] + n[3])
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

@compute @workgroup_size(${Oe})
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
    let radius = min(${wt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${wt}; offset = offset + 1) {
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
const MAX_RADIUS : i32 = ${wt};

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
function kn(t) {
  t && (t.uniformBuffer.destroy(), t.rawBuffer.destroy(), t.stateTextures[0].destroy(), t.stateTextures[1].destroy());
}
function Pn(t, o, n, f) {
  const b = o.getContext("webgpu");
  if (!b) return null;
  const s = navigator.gpu.getPreferredCanvasFormat();
  b.configure({
    device: t,
    format: s,
    alphaMode: "opaque"
  });
  const { computeModule: u, renderModule: B } = Bn(t), p = t.createBuffer({
    size: Rn,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), w = t.createBuffer({
    size: Math.max(1, f) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  }), g = [
    Gt(t, n),
    Gt(t, n)
  ], c = g.map((P) => P.createView({ dimension: "2d" })), d = t.createComputePipeline({
    layout: "auto",
    compute: { module: u, entryPoint: "cs_main" }
  }), k = t.createRenderPipeline({
    layout: "auto",
    vertex: { module: B, entryPoint: "vs_main" },
    fragment: {
      module: B,
      entryPoint: "fs_main",
      targets: [{ format: s }]
    },
    primitive: { topology: "triangle-list" }
  }), O = d.getBindGroupLayout(0), M = k.getBindGroupLayout(0), D = [
    t.createBindGroup({
      layout: O,
      entries: [
        { binding: 0, resource: { buffer: w } },
        { binding: 1, resource: c[0] },
        { binding: 2, resource: c[1] },
        { binding: 3, resource: { buffer: p } }
      ]
    }),
    t.createBindGroup({
      layout: O,
      entries: [
        { binding: 0, resource: { buffer: w } },
        { binding: 1, resource: c[1] },
        { binding: 2, resource: c[0] },
        { binding: 3, resource: { buffer: p } }
      ]
    })
  ], z = [
    t.createBindGroup({
      layout: M,
      entries: [
        { binding: 0, resource: { buffer: p } },
        { binding: 1, resource: c[0] }
      ]
    }),
    t.createBindGroup({
      layout: M,
      entries: [
        { binding: 0, resource: { buffer: p } },
        { binding: 1, resource: c[1] }
      ]
    })
  ], G = Math.max(1, Math.ceil(n / Oe));
  return {
    context: b,
    format: s,
    uniformBuffer: p,
    rawBuffer: w,
    rawCapacity: Math.max(1, f),
    stateTextures: g,
    stateStorageViews: c,
    computePipeline: d,
    renderPipeline: k,
    computeBindGroups: D,
    renderBindGroups: z,
    workgroupCount: G,
    binCapacity: n
  };
}
function En({
  heightUnits: t = 6,
  unitSizePx: o,
  maxWidth: n,
  maxBins: f = 1024,
  playbackRatio: b = 0,
  playbackRatioRef: s,
  showPlaybackIndicator: u = !0,
  onScrubStart: B,
  onScrub: p,
  onScrubEnd: w,
  activeColor: g,
  inactiveColor: c,
  peakDecay: d = 0.05,
  rawFftDataRef: k,
  rawFrameVersion: O,
  rawBinCount: M = 0,
  rawFftMetaRef: D,
  attackMs: z = Cn,
  releaseMs: G = Sn,
  blurSigma: P = 0,
  discreteBins: $ = !0,
  frequencyMin: K = 0,
  frequencyMax: L = 1,
  suspended: X
}) {
  const Q = e.useRef(null), j = e.useRef(null), ae = e.useRef(null), [Y, W] = e.useState(() => typeof navigator < "u" && !!navigator.gpu), [_, pe] = e.useState({
    width: 480,
    height: Math.max(1, t) * o
  }), [fe, ve] = e.useState(() => Math.max(1, Math.ceil(Math.max(1, Math.floor(f)) / Oe) * Oe)), [he, ne] = e.useState(() => Math.max(1, M || 1)), se = e.useRef(Math.max(0, Math.min(1, b))), de = e.useRef(Math.max(0, P)), ue = e.useRef(Math.max(0, z)), re = e.useRef(Math.max(0, G)), J = e.useRef(Math.max(5e-4, d)), y = e.useRef($ ? 1 : 0), S = e.useRef(Math.max(0, Math.min(1, K))), N = e.useRef(Math.max(0, Math.min(1, L))), i = e.useRef(Math.max(1, Math.floor(f))), V = e.useRef(!1), m = e.useRef(null), a = e.useRef(typeof performance < "u" ? performance.now() : Date.now()), h = e.useRef(new Float32Array(Ht)), R = e.useRef(null), v = e.useRef(0), E = e.useRef(null), T = e.useRef(null), C = e.useRef(null), ee = ht(X), te = e.useRef(ee), ie = e.useRef({ active: !1, pointerId: null }), Ge = e.useMemo(() => Ot(g, Mn), [g]), ke = e.useMemo(() => Ot(c, yn), [c]), _e = e.useRef(Ge), ge = e.useRef(ke);
  e.useEffect(() => {
    if (te.current = ee, ee) {
      T.current !== null && (cancelAnimationFrame(T.current), T.current = null), a.current = typeof performance < "u" ? performance.now() : Date.now();
      return;
    }
    C.current?.();
  }, [ee]), e.useEffect(() => {
    se.current = Math.max(0, Math.min(1, b));
  }, [b]), e.useEffect(() => {
    de.current = Math.max(0, P);
  }, [P]), e.useEffect(() => {
    ue.current = Math.max(0, z);
  }, [z]), e.useEffect(() => {
    re.current = Math.max(0, G);
  }, [G]), e.useEffect(() => {
    J.current = Math.max(5e-4, d);
  }, [d]), e.useEffect(() => {
    y.current = $ ? 1 : 0;
  }, [$]), e.useEffect(() => {
    S.current = Nt(K, 0, Math.min(1, L - zt));
  }, [K, L]), e.useEffect(() => {
    N.current = Nt(L, Math.min(1, K + zt), 1);
  }, [L, K]), e.useEffect(() => {
    V.current = !0;
  }, [K, L, f]), e.useEffect(() => {
    i.current = Math.max(1, Math.floor(f));
    const l = Math.max(1, Math.ceil(i.current / Oe) * Oe);
    ve((A) => A === l ? A : l);
  }, [f]), e.useEffect(() => {
    !M || M <= 0 || ne((l) => M > l ? Math.max(M, l) : l);
  }, [M]), e.useEffect(() => {
    V.current = !0;
  }, [O]), e.useEffect(() => {
    _e.current = Ge;
  }, [Ge]), e.useEffect(() => {
    ge.current = ke;
  }, [ke]), e.useEffect(() => {
    const l = Math.max(1, t) * o;
    pe((A) => ({
      width: A.width,
      height: l
    }));
  }, [t, o]), e.useEffect(() => {
    const l = j.current;
    if (!l) return;
    const A = () => {
      const xe = l.getBoundingClientRect();
      xe.width && pe((Fe) => ({
        width: Math.round(xe.width),
        height: Fe.height
      }));
    };
    A();
    const Z = typeof ResizeObserver < "u" ? new ResizeObserver(A) : null;
    return Z ? Z.observe(l) : window.addEventListener("resize", A), () => {
      Z?.disconnect(), Z || window.removeEventListener("resize", A);
    };
  }, []);
  const me = e.useCallback((l) => {
    const A = j.current;
    if (!A) return null;
    const Z = A.getBoundingClientRect();
    if (!Z.width) return null;
    const xe = (l - Z.left) / Z.width;
    return Math.max(0, Math.min(1, xe));
  }, []), $e = e.useCallback((l) => {
    if (!p && !w && !B) return;
    const A = me(l.clientX);
    A != null && (ie.current = { active: !0, pointerId: l.pointerId }, l.currentTarget.setPointerCapture(l.pointerId), l.preventDefault(), B?.(), p?.(A));
  }, [me, p, w, B]), gt = e.useCallback((l) => {
    if (!ie.current.active || ie.current.pointerId !== l.pointerId) return;
    const A = me(l.clientX);
    A != null && (l.preventDefault(), p?.(A));
  }, [me, p]), qe = e.useCallback((l) => {
    if (!ie.current.active || ie.current.pointerId !== l.pointerId) return;
    ie.current = { active: !1, pointerId: null };
    try {
      l.currentTarget.releasePointerCapture(l.pointerId);
    } catch {
    }
    const A = me(l.clientX);
    A != null && w?.(A);
  }, [me, w]), nt = e.useCallback((l) => {
    if (ie.current.pointerId !== l.pointerId) return;
    ie.current = { active: !1, pointerId: null };
    try {
      l.currentTarget.releasePointerCapture(l.pointerId);
    } catch {
    }
    const A = me(l.clientX);
    A != null && w?.(A);
  }, [me, w]);
  e.useEffect(() => {
    if (!Y) return;
    let l = !1;
    async function A() {
      const Z = await An();
      if (!Z || l) {
        Z || W(!1);
        return;
      }
      const xe = Q.current;
      if (!xe) return;
      const Fe = Pn(Z.device, xe, fe, he);
      if (!Fe) {
        W(!1);
        return;
      }
      R.current = Fe, v.current = 0, V.current = !0;
      const He = (Xe) => {
        if (l) return;
        if (te.current) {
          T.current = null, a.current = Xe;
          return;
        }
        const Ye = Z.device, Ke = Ye.queue, oe = R.current;
        if (!oe) return;
        const F = Q.current;
        if (!F) return;
        const rt = window.devicePixelRatio || 1, Le = Math.max(1, Math.floor(_.width * rt)), Qe = Math.max(1, Math.floor(_.height * rt));
        (F.width !== Le || F.height !== Qe) && (F.width = Le, F.height = Qe), F.style.width !== `${Math.round(_.width)}px` && (F.style.width = `${Math.round(_.width)}px`), F.style.height !== `${Math.round(_.height)}px` && (F.style.height = `${Math.round(_.height)}px`);
        const Pe = Math.max(5e-4, (Xe - a.current) / 1e3);
        a.current = Xe;
        const Ve = Math.max(1, i.current), Ee = Ve > 1 ? 1 / (Ve - 1) : 1;
        s && (se.current = Math.max(0, Math.min(1, s.current ?? 0)));
        const be = D?.current;
        if (be && (be.version !== m.current && (m.current = be.version, V.current = !0), be.binCount > oe.rawCapacity)) {
          const ce = be.binCount;
          ne((q) => ce > q ? Math.max(ce, q) : q);
        }
        const x = h.current, Ze = Math.max(1, (be ? be.binCount : M) || 0);
        if (x[0] = Ve, x[1] = u ? se.current : -1, x[2] = de.current, x[3] = Ee, x[4] = _e.current[0], x[5] = _e.current[1], x[6] = _e.current[2], x[7] = 1, x[8] = ge.current[0], x[9] = ge.current[1], x[10] = ge.current[2], x[11] = 1, x[12] = Dt(ue.current, Pe), x[13] = Dt(re.current, Pe), x[14] = Pe, x[15] = wn, x[16] = J.current, x[17] = vn, x[18] = y.current, x[19] = Ze, x[20] = S.current, x[21] = N.current, x[22] = 0, x[23] = 0, Ke.writeBuffer(oe.uniformBuffer, 0, x.buffer, x.byteOffset, x.byteLength), V.current && k?.current) {
          const ce = k.current, q = oe.rawCapacity;
          (!E.current || E.current.length !== q) && (E.current = new Float32Array(q));
          const Me = E.current, Te = Math.min(q, ce.length);
          for (let ye = 0; ye < Te; ye += 1)
            Me[ye] = ce[ye] / 255;
          for (let ye = Te; ye < q; ye += 1)
            Me[ye] = 0;
          Ke.writeBuffer(
            oe.rawBuffer,
            0,
            Me.buffer,
            Me.byteOffset,
            Me.byteLength
          ), V.current = !1;
        }
        const je = Ye.createCommandEncoder();
        if (k?.current) {
          const ce = je.beginComputePass(), q = oe.computeBindGroups[v.current];
          ce.setPipeline(oe.computePipeline), ce.setBindGroup(0, q), ce.dispatchWorkgroups(oe.workgroupCount, 1, 1), ce.end(), v.current = v.current === 0 ? 1 : 0;
        }
        const bt = oe.context.getCurrentTexture().createView(), we = je.beginRenderPass({
          colorAttachments: [{
            view: bt,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 }
          }]
        });
        we.setPipeline(oe.renderPipeline);
        const ot = oe.renderBindGroups[v.current];
        we.setBindGroup(0, ot), we.draw(6, 1, 0, 0), we.end(), Ke.submit([je.finish()]), T.current = requestAnimationFrame(He);
      };
      C.current = () => {
        l || T.current !== null || (a.current = typeof performance < "u" ? performance.now() : Date.now(), T.current = requestAnimationFrame(He));
      }, te.current || C.current();
    }
    return A(), () => {
      l = !0, T.current !== null && (cancelAnimationFrame(T.current), T.current = null), C.current = null, kn(R.current), R.current = null;
    };
  }, [Y, _.width, _.height, fe, he, k, D, M, s, u]);
  const Ue = typeof n == "number" ? `${n}px` : n ?? "100%", xt = Math.round(_.width), We = Math.round(_.height);
  return /* @__PURE__ */ U(
    "div",
    {
      ref: j,
      className: "audio-fft-window",
      style: {
        width: "100%",
        maxWidth: Ue
      },
      children: /* @__PURE__ */ De(
        "div",
        {
          className: "audio-fft-window__canvas-wrapper",
          style: {
            width: "100%",
            height: `${We}px`,
            position: "relative",
            overflow: "hidden",
            background: "transparent"
          },
          children: [
            Y ? /* @__PURE__ */ U(
              "canvas",
              {
                ref: Q,
                width: xt,
                height: We,
                style: { width: "100%", height: "100%", display: "block" }
              }
            ) : /* @__PURE__ */ U("div", { className: "audio-fft-window__fallback", children: "WebGPU not available" }),
            /* @__PURE__ */ U(
              "div",
              {
                ref: ae,
                className: "audio-fft-window__interaction-layer",
                onPointerDown: $e,
                onPointerMove: gt,
                onPointerUp: qe,
                onPointerLeave: qe,
                onPointerCancel: nt,
                role: "presentation"
              }
            )
          ]
        }
      )
    }
  );
}
const St = (t, o, n) => Math.max(o, Math.min(n, t));
function dt() {
  return {
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: !1
  };
}
function At(t, o) {
  if (t <= 0) return 1;
  const n = t / 1e3, f = Math.max(0, o);
  return !Number.isFinite(n) || n <= 0 ? 1 : St(1 - Math.exp(-f / n), 0, 1);
}
function Xt(t, o, n, f, b, s) {
  const u = t.length;
  n.length !== u && (n.length = u, n.hasHistory = !1, n.previous = null, n.scratch = null);
  const B = n.previous && n.previous.length === u ? n.previous : null, p = n.scratch && n.scratch.length === u ? n.scratch : null, w = B ?? new Float32Array(u), g = p ?? new Float32Array(u), c = n.hasHistory && B !== null, d = Math.max(0, o.dtSec), k = At(o.attackMs, d), O = At(o.releaseMs, d);
  for (let z = 0; z < u; z += 1) {
    const G = t[z] / 255, P = c ? w[z] : G, $ = G >= P ? k : O;
    g[z] = P + (G - P) * $;
  }
  n.hasHistory = !0, n.previous = g, n.scratch = w;
  let M = g;
  o.blurSigma > 1e-3 && (M = Tn(M, o.blurSigma, f, s));
  const D = _n(
    M,
    o.targetBins,
    b,
    o.frequencyMin,
    o.frequencyMax
  );
  return { smoothedSnapshot: g, resampled: D };
}
function Tn(t, o, n, f) {
  const b = Math.max(1e-3, o);
  let s = n.current;
  (!s || s.length !== t.length) && (s = new Float32Array(t.length), n.current = s);
  const { radius: u, kernel: B } = In(b, f), p = t.length;
  for (let w = 0; w < p; w += 1) {
    let g = 0;
    for (let c = -u; c <= u; c += 1) {
      let d = w + c;
      d < 0 ? d = 0 : d >= p && (d = p - 1), g += t[d] * B[c + u];
    }
    s[w] = g;
  }
  return s;
}
function In(t, o) {
  const n = Math.round(t * 100) / 100, f = o.get(n);
  if (f) return f;
  const b = Math.max(1, Math.floor(t * 3)), s = b * 2 + 1, u = new Float32Array(s), B = Math.max(Number.EPSILON, 2 * t * t);
  let p = 0;
  for (let c = 0; c < s; c += 1) {
    const d = c - b, k = Math.exp(-(d * d) / B);
    u[c] = k, p += k;
  }
  const w = p || 1;
  for (let c = 0; c < s; c += 1)
    u[c] /= w;
  const g = { radius: b, kernel: u };
  return o.set(n, g), g;
}
function _n(t, o, n, f, b) {
  const s = Math.max(1, Math.round(o));
  let u = n.current;
  (!u || u.length !== s) && (u = new Float32Array(s), n.current = u);
  const B = Math.max(0, t.length - 1);
  if (B === 0)
    return u.fill(t[0] ?? 0), u;
  const p = St(f, 0, 1), w = St(b, Math.min(1, p + 1e-3), 1), g = p * B, c = w * B;
  if (s === 1) {
    const d = (g + c) * 0.5, k = Math.floor(d), O = Math.min(B, k + 1), M = d - k, D = t[k] ?? 0, z = t[O] ?? D;
    return u[0] = D + (z - D) * M, u;
  }
  for (let d = 0; d < s; d += 1) {
    const k = d / (s - 1), O = g + k * (c - g), M = Math.floor(O), D = Math.min(B, M + 1), z = O - M, G = t[M] ?? 0, P = t[D] ?? 0;
    u[d] = G + (P - G) * z;
  }
  return u;
}
function Un(t, o) {
  const n = Lt.base[700], f = Lt.base[100];
  return { safeA: t ?? n, safeB: o ?? f };
}
const le = (t) => Math.max(0, Math.min(1, t)), H = (t, o, n) => Math.max(o, Math.min(n, t)), Fn = 44100, $t = Fn / 2, ct = 10, Ln = 18, Ae = 8, mt = 10, Ce = 500, Bt = 20, kt = 80, Vn = 1 / 60, zn = [
  { value: "discrete", label: "Step" },
  { value: "interpolated", label: "Interp" }
], lt = (t) => Math.round(le(t) * 10) / 10, ft = (t) => Math.round(H(t, 0, 3) * 10) / 10, Be = (t) => Math.round(H(t, 0, Ce) / mt) * mt;
function Ct(t, o) {
  return t === "discrete" || t === "interpolated" ? t : o;
}
function Re(t, o, n, f) {
  const [b, s] = bn(f), u = f !== void 0 && t === void 0, B = u ? b : t, [p, w] = e.useState(o), g = B !== void 0, c = g ? B : p, d = e.useCallback((k) => {
    g || w(k), u && s(k), n?.(k);
  }, [g, n, s, u]);
  return e.useEffect(() => {
    !u || b !== void 0 || s(o);
  }, [o, s, u, b]), [c, d, g];
}
function qt(t) {
  const o = t || 16, f = o * 0.35, s = o * 1;
  return Math.max(
    Math.round(s + f * 2 + 2),
    Math.round(o + f * 1.5),
    Ln
  );
}
function pt(t) {
  !t || t.state === "closed" || t.close().catch(() => {
  });
}
function Jn({
  ariaLabel: t = "Audio controls",
  fontSize: o,
  colorA: n,
  colorB: f,
  borderStyle: b,
  source: s,
  heightUnits: u = 6,
  suspended: B,
  audioAnalysisStore: p,
  controlIdPrefix: w,
  controlIds: g,
  defaultPlaying: c = !1,
  playing: d,
  onPlayingChange: k,
  defaultMuted: O = !0,
  muted: M,
  onMutedChange: D,
  defaultBinCount: z = 256,
  binCount: G,
  onBinCountChange: P,
  defaultBinInterpolation: $ = "discrete",
  binInterpolation: K,
  onBinInterpolationChange: L,
  defaultFrequencyMin: X = 0,
  frequencyMin: Q,
  onFrequencyMinChange: j,
  defaultFrequencyMax: ae = $t,
  frequencyMax: Y,
  onFrequencyMaxChange: W,
  defaultFftAttack: _ = Bt,
  fftAttack: pe,
  onFftAttackChange: fe,
  defaultFftRelease: ve = kt,
  fftRelease: he,
  onFftReleaseChange: ne,
  defaultFftBlurSigma: se = 0,
  fftBlurSigma: de,
  onFftBlurSigmaChange: ue,
  defaultAnalyserSmoothing: re = 0.8,
  analyserSmoothing: J,
  onAnalyserSmoothingChange: y
}) {
  const S = ht(B), N = pn(), i = o ?? N?.fontSize ?? 12, V = b ?? N?.borderStyle ?? "a", { safeA: m, safeB: a } = Un(
    n ?? N?.colorA,
    f ?? N?.colorB
  ), h = dn(), R = e.useRef(null), v = R.current ?? mn({
    bins: [],
    binCount: 0,
    maxMagnitude: 1
  });
  R.current || (R.current = v);
  const E = p ?? h ?? v, T = e.useMemo(() => ({
    setAudioBins: E.setAudioBins,
    setAudioBinCount: E.setAudioBinCount,
    setAudioMaxMagnitude: E.setAudioMaxMagnitude,
    getBinCount: () => E.getSnapshot().bins.length
  }), [E]), C = s.type === "buffer", ee = xn(w, t), te = e.useCallback((r) => {
    const I = g?.[r];
    if (I) return I;
    if (!(r === "playing" || r === "muted"))
      return ee ? `${ee}.${r}` : void 0;
  }, [g, ee]), [ie, Ge] = Re(
    d,
    c,
    k,
    te("playing")
  ), [ke, _e] = Re(
    M,
    O,
    D,
    te("muted")
  ), ge = e.useRef(0), [me, $e] = e.useState(!1), [gt, qe] = e.useState(null), nt = e.useRef(0), Ue = e.useCallback((r) => H(Math.round(r || 0), 1, 1024), []), [xt, We] = Re(
    G,
    Ue(z),
    P,
    te("binCount")
  ), [l, A] = Re(
    J,
    lt(le(re)),
    y,
    te("analyserSmoothing")
  ), [Z, xe] = Re(
    pe,
    Be(_),
    fe,
    te("fftAttack")
  ), [Fe, He] = Re(
    he,
    Be(ve),
    ne,
    te("fftRelease")
  ), [Xe, Ye] = Re(
    de,
    ft(se),
    ue,
    te("fftBlurSigma")
  ), [Ke, oe] = Re(
    K,
    Ct($, "discrete"),
    L,
    te("binInterpolation")
  ), [F, rt] = e.useState($t), [Le, Qe] = Re(
    Q,
    X,
    j,
    te("frequencyMin")
  ), [Pe, Ve] = Re(
    Y,
    ae,
    W,
    te("frequencyMax")
  ), Ee = e.useRef(null), be = e.useRef({ version: 0, binCount: 0 }), x = Ue(xt), Ze = lt(le(l)), je = Be(Z), bt = Be(Fe), we = ft(Xe), ot = Ct(Ke, "discrete"), ce = ot === "discrete", q = e.useMemo(() => Math.min(ct, F), [F]), { freqMinHz: Me, freqMaxHz: Te } = e.useMemo(() => {
    const r = Number.isFinite(Le ?? Number.NaN) ? Le : 0, I = Number.isFinite(Pe ?? Number.NaN) ? Pe : F, et = H(I, q, F), tt = H(r, 0, Math.max(0, et - q)), ut = H(et, tt + q, F);
    return { freqMinHz: tt, freqMaxHz: ut };
  }, [Le, Pe, q, F]), ye = F > 0 ? Me / F : 0, Yt = F > 0 ? Te / F : 1, Mt = H(ye, 0, 1), yt = H(Yt, 0, 1), Pt = e.useCallback((r) => {
    const I = H(r, 0, Math.max(0, Te - q));
    Qe(I);
  }, [Te, q, Qe]), Et = e.useCallback((r) => {
    const I = H(r, Math.min(F, Me + q), F);
    Ve(I);
  }, [Me, q, F, Ve]), Tt = e.useCallback((r) => {
    rt(Math.max(1, r / 2));
  }, []), [Rt, It] = e.useState(() => qt(i)), _t = e.useRef(null);
  e.useEffect(() => {
    const r = qt(i);
    It((I) => Math.abs(I - r) < 0.5 ? I : r);
  }, [i]), e.useLayoutEffect(() => {
    const r = _t.current;
    if (!r || typeof ResizeObserver > "u") return;
    const I = () => {
      const tt = r.getBoundingClientRect();
      if (!tt.height) return;
      const ut = Math.round(tt.height);
      It((Ft) => Math.abs(Ft - ut) < 0.5 ? Ft : ut);
    };
    I();
    const et = new ResizeObserver(() => I());
    return et.observe(r), () => et.disconnect();
  }, []);
  const Kt = m, ze = V === "none" ? 0 : 1, Se = V === "none" ? "transparent" : V === "b" ? a : m, Qt = m, Zt = ie ? "playing" : "paused", jt = ke ? "muted" : "unmuted", Jt = [
    { value: "paused", icon: /* @__PURE__ */ U(sn, { strokeWidth: 1.6 }), ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: /* @__PURE__ */ U(un, { strokeWidth: 1.6 }), ariaLabel: "Pause audio analysis", title: "Pause audio analysis" }
  ], en = [
    { value: "muted", icon: /* @__PURE__ */ U(cn, { strokeWidth: 1.6 }), ariaLabel: "Unmute audio output", title: "Unmute audio output" },
    { value: "unmuted", icon: /* @__PURE__ */ U(ln, { strokeWidth: 1.6 }), ariaLabel: "Mute audio output", title: "Mute audio output" }
  ], at = H(je, 0, Ce), Je = H(bt, 0, Ce), tn = Math.max(1e-3, At(Je, Vn) * 0.25), st = e.useCallback((r) => {
    const I = le(r);
    nt.current += 1, qe({ ratio: I, token: nt.current });
  }, []), Ut = e.useCallback((r) => {
    if (!r?.length) return;
    (!Ee.current || Ee.current.length !== r.length) && (Ee.current = new Uint8Array(r.length)), Ee.current.set(r);
    const I = be.current;
    I.version += 1, I.binCount = r.length;
  }, []), nn = e.useCallback((r) => {
    if (!C) return;
    const I = le(r);
    me || (ge.current = I);
  }, [C, me]), rn = e.useCallback(() => {
    C && $e(!0);
  }, [C]), on = e.useCallback((r) => {
    if (!C) return;
    const I = le(r);
    ge.current = I, st(I);
  }, [C, st]), an = e.useCallback((r) => {
    if (!C) return;
    const I = le(r);
    ge.current = I, st(I), $e(!1);
  }, [C, st]);
  return e.useEffect(() => {
    C || (ge.current = 0, $e(!1), qe(null));
  }, [C]), /* @__PURE__ */ U(fn, { suspended: S, children: /* @__PURE__ */ De("div", { style: { width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column" }, children: [
    /* @__PURE__ */ De(
      "div",
      {
        style: {
          width: "100%",
          minHeight: Rt,
          borderTop: `1px solid ${Se}`,
          borderLeft: `${ze}px solid ${Se}`,
          borderRight: `${ze}px solid ${Se}`,
          borderBottom: `1px solid ${a}`,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: a,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: Ae,
          padding: `0 ${Ae}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ U("div", { style: { display: "flex", alignItems: "center", gap: Ae, flexShrink: 0 }, children: /* @__PURE__ */ U(
            Vt,
            {
              behavior: "cycle",
              value: Zt,
              options: Jt,
              onChange: (r) => Ge(r === "playing"),
              borderStyle: "none",
              fontSize: i,
              colorA: m,
              colorB: a
            }
          ) }),
          /* @__PURE__ */ De("div", { style: { flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: Ae }, children: [
            /* @__PURE__ */ U("div", { ref: _t, style: { display: "flex", minWidth: 0 }, children: /* @__PURE__ */ U(
              Ie,
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
                colorA: m,
                colorB: a,
                fontSize: i,
                value: x,
                onUserChange: (r) => {
                  We(Ue(r));
                },
                onAnimatedUpdate: (r) => {
                  We(Ue(r));
                },
                style: { gap: 0 }
              }
            ) }),
            /* @__PURE__ */ U(
              hn,
              {
                ariaLabel: "Bin interpolation",
                showLabel: !1,
                options: zn,
                value: ot,
                onChange: (r) => {
                  oe(Ct(
                    r,
                    "discrete"
                  ));
                },
                colorA: m,
                colorB: a,
                borderStyle: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                fontSize: i,
                style: { gap: 0, minWidth: 0 }
              }
            ),
            /* @__PURE__ */ U(
              Ie,
              {
                label: "Min",
                variant: "basic",
                min: 0,
                max: Math.max(0, F - ct),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: m,
                colorB: a,
                fontSize: i,
                value: Me,
                onUserChange: Pt,
                onAnimatedUpdate: Pt,
                formatDisplayValue: (r) => `${Math.round(r)}`,
                style: { gap: 0 }
              }
            ),
            /* @__PURE__ */ U(
              Ie,
              {
                label: "Max",
                variant: "basic",
                min: ct,
                max: Math.max(ct, F),
                step: 1,
                barStyle: "continuous",
                width: "100%",
                border: "a",
                borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                colorA: m,
                colorB: a,
                fontSize: i,
                value: Te,
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
    s.type === "buffer" ? /* @__PURE__ */ U(
      Nn,
      {
        src: s.src,
        loop: s.loop,
        playing: ie,
        analysisActions: T,
        onProgress: nn,
        seekTarget: gt,
        analyserSmoothing: Ze,
        attackMs: at,
        releaseMs: Je,
        blurSigma: we,
        targetBins: x,
        onRawFftFrame: Ut,
        frequencyMin: Mt,
        frequencyMax: yt,
        onSampleRateChange: Tt,
        muted: ke,
        suspended: S
      }
    ) : /* @__PURE__ */ U(
      Dn,
      {
        source: s,
        playing: ie,
        analysisActions: T,
        analyserSmoothing: Ze,
        attackMs: at,
        releaseMs: Je,
        blurSigma: we,
        targetBins: x,
        onRawFftFrame: Ut,
        frequencyMin: Mt,
        frequencyMax: yt,
        onSampleRateChange: Tt,
        muted: ke,
        suspended: S
      }
    ),
    /* @__PURE__ */ U(
      "div",
      {
        style: {
          borderTop: `1px solid ${Kt}`,
          borderLeft: `${ze}px solid ${Se}`,
          borderRight: `${ze}px solid ${Se}`,
          borderRadius: 0,
          borderBottom: `1px solid ${a}`,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0a0a, #1a1a1a)"
        },
        children: /* @__PURE__ */ U(
          En,
          {
            heightUnits: u,
            unitSizePx: Rt,
            maxWidth: "100%",
            maxBins: x,
            peakDecay: tn,
            playbackRatioRef: ge,
            showPlaybackIndicator: C,
            onScrubStart: C ? rn : void 0,
            onScrub: C ? on : void 0,
            onScrubEnd: C ? an : void 0,
            activeColor: m,
            inactiveColor: a,
            rawFftDataRef: Ee,
            rawFftMetaRef: be,
            attackMs: at,
            releaseMs: Je,
            blurSigma: we,
            discreteBins: ce,
            frequencyMin: Mt,
            frequencyMax: yt,
            suspended: S
          }
        )
      }
    ),
    /* @__PURE__ */ De(
      "div",
      {
        style: {
          width: "100%",
          minHeight: Rt,
          borderTop: `1px solid ${m}`,
          borderLeft: `${ze}px solid ${Se}`,
          borderRight: `${ze}px solid ${Se}`,
          borderBottom: `1px solid ${Se}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: a,
          color: Qt,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          gap: Ae,
          padding: `0 ${Ae}px`,
          boxSizing: "border-box"
        },
        children: [
          /* @__PURE__ */ U("div", { style: { display: "flex", alignItems: "center", gap: Ae, flexShrink: 0 }, children: /* @__PURE__ */ U(
            Vt,
            {
              behavior: "cycle",
              value: jt,
              options: en,
              onChange: (r) => _e(r === "muted"),
              borderStyle: "none",
              fontSize: i,
              colorA: m,
              colorB: a
            }
          ) }),
          /* @__PURE__ */ De(
            "div",
            {
              style: {
                flex: 1,
                minWidth: 0,
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: Ae
              },
              children: [
                /* @__PURE__ */ U(
                  Ie,
                  {
                    label: "Atk",
                    variant: "basic",
                    min: 0,
                    max: Ce,
                    step: mt,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: m,
                    colorB: a,
                    fontSize: i,
                    value: at,
                    onUserChange: (r) => xe(Be(r)),
                    onAnimatedUpdate: (r) => xe(Be(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ U(
                  Ie,
                  {
                    label: "Rel",
                    variant: "basic",
                    min: 0,
                    max: Ce,
                    step: mt,
                    barStyle: "continuous",
                    width: "100%",
                    border: "a",
                    borderMask: { top: !1, bottom: !1, right: !0, left: !0 },
                    colorA: m,
                    colorB: a,
                    fontSize: i,
                    value: Je,
                    onUserChange: (r) => He(Be(r)),
                    onAnimatedUpdate: (r) => He(Be(r)),
                    formatDisplayValue: (r) => `${Math.round(r)}`,
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ U(
                  Ie,
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
                    colorA: m,
                    colorB: a,
                    fontSize: i,
                    value: Ze,
                    onUserChange: (r) => A(lt(r)),
                    onAnimatedUpdate: (r) => A(lt(r)),
                    formatDisplayValue: (r) => r.toFixed(1),
                    style: { gap: 0 }
                  }
                ),
                /* @__PURE__ */ U(
                  Ie,
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
                    colorA: m,
                    colorB: a,
                    fontSize: i,
                    value: we,
                    onUserChange: (r) => Ye(ft(r)),
                    onAnimatedUpdate: (r) => Ye(ft(r)),
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
function Nn({
  src: t,
  loop: o = !0,
  playing: n,
  analysisActions: f,
  seekTarget: b,
  onProgress: s,
  analyserSmoothing: u = 0.8,
  attackMs: B = Bt,
  releaseMs: p = kt,
  blurSigma: w = 0,
  targetBins: g = 1024,
  onRawFftFrame: c,
  frequencyMin: d = 0,
  frequencyMax: k = 1,
  onSampleRateChange: O,
  muted: M = !0,
  suspended: D
}) {
  const z = ht(D), { setAudioBins: G, setAudioBinCount: P, setAudioMaxMagnitude: $, getBinCount: K } = f, L = e.useRef(null), X = e.useRef(null), Q = e.useRef(null), j = e.useRef(null), ae = e.useRef(null), Y = e.useRef(null), W = e.useRef(0), _ = e.useRef(null), pe = e.useRef(s), fe = e.useRef(le(u ?? 0.8)), ve = e.useRef(O), he = e.useRef(M), ne = e.useRef(dt()), se = e.useRef(null), de = e.useRef(null), ue = e.useRef(/* @__PURE__ */ new Map()), re = e.useRef(null), J = e.useRef(!1);
  e.useEffect(() => {
    pe.current = s;
  }, [s]), e.useEffect(() => {
    ve.current = O;
  }, [O]), e.useEffect(() => {
    he.current = M;
    const a = ae.current, h = L.current;
    a && h && a.gain.setTargetAtTime(M ? 0 : 1, h.currentTime, 0.01);
  }, [M]), e.useEffect(() => {
    const a = le(u ?? 0.8);
    fe.current = a, X.current && (X.current.smoothingTimeConstant = a);
  }, [u]);
  const y = e.useCallback(() => Y.current?.duration ?? 0, []), S = e.useCallback((a) => {
    const h = y();
    if (h <= 0) return 0;
    const R = a % h, v = R < 0 ? R + h : R, E = Math.min(h * 1e-3, 1e-4) || 1e-4;
    return Math.min(v, Math.max(0, h - E));
  }, [y]), N = e.useCallback(() => {
    if (y() <= 0) return 0;
    const h = S(W.current), R = _.current, v = L.current;
    if (!v || R == null) return h;
    const E = v.currentTime - R;
    return S(h + E);
  }, [y, S]), i = e.useCallback(() => {
    try {
      j.current?.stop();
    } catch {
    }
    j.current?.disconnect(), ae.current?.disconnect(), j.current = null, ae.current = null;
  }, []);
  e.useEffect(() => {
    const a = ue.current;
    let h = !1;
    async function R() {
      try {
        const v = new AudioContext();
        L.current = v, ve.current?.(v.sampleRate);
        const E = await fetch(t);
        if (!E.ok) throw new Error(`Failed to load audio sample: ${E.status}`);
        const T = await E.arrayBuffer(), C = await v.decodeAudioData(T);
        if (h) {
          pt(v);
          return;
        }
        Y.current = C, W.current = 0, _.current = null;
        const ee = v.createAnalyser();
        ee.fftSize = 2048, ee.smoothingTimeConstant = fe.current, X.current = ee, Q.current = new Uint8Array(new ArrayBuffer(ee.frequencyBinCount)), P(ee.frequencyBinCount), $(1);
      } catch (v) {
        console.error("Failed to load audio for FFT", v);
      }
    }
    return R(), () => {
      h = !0, X.current = null, Q.current = null, i(), pt(L.current), L.current = null, j.current = null, ae.current = null, Y.current = null, W.current = 0, _.current = null, ne.current = dt(), se.current = null, de.current = null, a.clear(), re.current = null, J.current = !1;
    };
  }, [P, $, t, i]);
  const V = e.useCallback(() => {
    W.current = N(), _.current = null, i();
  }, [N, i]), m = e.useCallback(async (a) => {
    if (!Y.current || !L.current) return;
    const h = L.current;
    h.state === "suspended" && await h.resume().catch(() => {
    });
    const R = X.current ?? h.createAnalyser();
    R.fftSize = 2048, R.smoothingTimeConstant = fe.current, X.current = R;
    const v = S(typeof a == "number" ? a : N());
    W.current = v, _.current = h.currentTime, i();
    const E = h.createBufferSource();
    E.buffer = Y.current, E.loop = o;
    const T = h.createGain();
    T.gain.value = he.current ? 0 : 1, E.connect(R), R.connect(T), T.connect(h.destination), E.start(0, v), j.current = E, ae.current = T, Q.current || (Q.current = new Uint8Array(new ArrayBuffer(R.frequencyBinCount)), P(R.frequencyBinCount));
  }, [N, o, P, i, S]);
  return e.useEffect(() => (n ? m() : V(), () => {
    V();
  }), [n, m, V]), e.useEffect(() => {
    if (!b) return;
    const a = y();
    if (a <= 0) return;
    const h = le(b.ratio), R = S(h * a);
    W.current = R, n && Y.current && L.current ? m(R) : _.current = null;
  }, [y, n, b, m, S]), Wt(z ? null : (a, h) => {
    if (!n) {
      if (!J.current) {
        const T = re.current ?? K();
        T > 0 && (G(new Array(T).fill(0)), P(T));
        const C = Q.current;
        C && c && (C.fill(0), c(C)), J.current = !0;
      }
      return;
    }
    J.current = !1;
    const R = X.current, v = Q.current;
    if (R && v) {
      R.getByteFrequencyData(v), c && c(v);
      const C = Xt(
        v,
        {
          attackMs: H(B, 0, Ce),
          releaseMs: H(p, 0, Ce),
          dtSec: h,
          blurSigma: Math.max(0, w || 0),
          targetBins: H(Math.round(g || v.length), 1, v.length),
          frequencyMin: d,
          frequencyMax: k
        },
        ne.current,
        se,
        de,
        ue.current
      ).resampled;
      G(Array.from(C)), re.current !== C.length && (re.current = C.length, P(C.length));
    }
    const E = y();
    if (E > 0) {
      const T = N() / E;
      pe.current?.(T);
    }
  }), null;
}
function Dn({
  source: t,
  playing: o,
  analysisActions: n,
  analyserSmoothing: f = 0.8,
  attackMs: b = Bt,
  releaseMs: s = kt,
  blurSigma: u = 0,
  targetBins: B = 1024,
  onRawFftFrame: p,
  frequencyMin: w = 0,
  frequencyMax: g = 1,
  onSampleRateChange: c,
  muted: d = !0,
  suspended: k
}) {
  const O = ht(k), { setAudioBins: M, setAudioBinCount: D, setAudioMaxMagnitude: z, getBinCount: G } = n, P = e.useRef(null), $ = e.useRef(null), K = e.useRef(null), L = e.useRef(null), X = e.useRef(null), Q = e.useRef(le(f ?? 0.8)), j = e.useRef(c), ae = e.useRef(d), Y = e.useRef(!1), W = e.useRef(!1), _ = e.useRef(!1), pe = e.useRef(dt()), fe = e.useRef(null), ve = e.useRef(null), he = e.useRef(/* @__PURE__ */ new Map()), ne = e.useRef(null), se = t.type === "mediaStream" ? t.stream : null, de = t.type === "mediaStream" ? t.context : void 0, ue = t.type === "audioNode" ? t.node : null;
  e.useEffect(() => {
    j.current = c;
  }, [c]), e.useEffect(() => {
    ae.current = d;
    const y = L.current, S = P.current;
    y && S && y.gain.setTargetAtTime(d ? 0 : 1, S.currentTime, 0.01);
  }, [d]), e.useEffect(() => {
    const y = le(f ?? 0.8);
    Q.current = y, $.current && ($.current.smoothingTimeConstant = y);
  }, [f]);
  const re = e.useCallback(() => {
    if (W.current) return;
    const y = K.current, S = $.current, N = L.current, i = P.current;
    !y || !S || !N || !i || (y.connect(S), S.connect(N), N.connect(i.destination), W.current = !0);
  }, []), J = e.useCallback(() => {
    if (W.current) {
      try {
        const y = K.current, S = $.current;
        y && S && y.disconnect(S);
      } catch {
      }
      try {
        $.current?.disconnect();
      } catch {
      }
      try {
        L.current?.disconnect();
      } catch {
      }
      W.current = !1;
    }
  }, []);
  return e.useEffect(() => {
    let y = !1;
    async function S() {
      let i, V, m = !1;
      if (t.type === "mediaStream") {
        if (i = de ?? new AudioContext(), m = !de, !se) return;
        V = i.createMediaStreamSource(se);
      } else {
        if (!ue) return;
        V = ue, i = ue.context;
      }
      if (y) {
        m && pt(i);
        return;
      }
      Y.current = m, P.current = i, K.current = V, j.current?.(i.sampleRate);
      const a = i.createAnalyser();
      a.fftSize = 2048, a.smoothingTimeConstant = Q.current, $.current = a, X.current = new Uint8Array(new ArrayBuffer(a.frequencyBinCount)), ne.current = a.frequencyBinCount, D(a.frequencyBinCount), z(1);
      const h = i.createGain();
      h.gain.value = ae.current ? 0 : 1, L.current = h, W.current = !1, _.current = !1;
    }
    S();
    const N = he.current;
    return () => {
      y = !0, J(), $.current = null, X.current = null, K.current = null, L.current = null, Y.current && pt(P.current), P.current = null, Y.current = !1, pe.current = dt(), fe.current = null, ve.current = null, N.clear(), ne.current = null, _.current = !1;
    };
  }, [
    re,
    J,
    D,
    z,
    t.type,
    de,
    se,
    ue
  ]), e.useEffect(() => {
    const y = P.current;
    o ? (y?.state === "suspended" && y.resume().catch(() => {
    }), re(), _.current = !1) : (J(), _.current = !1);
  }, [re, J, o]), Wt(O ? null : (y, S) => {
    if (!o || !W.current) {
      if (!_.current) {
        const V = ne.current ?? G();
        V > 0 && (M(new Array(V).fill(0)), D(V));
        const m = X.current;
        m && p && (m.fill(0), p(m)), _.current = !0;
      }
      return;
    }
    const N = $.current, i = X.current;
    if (N && i) {
      N.getByteFrequencyData(i), p && p(i);
      const m = Xt(
        i,
        {
          attackMs: H(b, 0, Ce),
          releaseMs: H(s, 0, Ce),
          dtSec: S,
          blurSigma: Math.max(0, u || 0),
          targetBins: H(Math.round(B || i.length), 1, i.length),
          frequencyMin: w,
          frequencyMax: g
        },
        pe.current,
        fe,
        ve,
        he.current
      ).resampled;
      M(Array.from(m)), ne.current !== m.length && (ne.current = m.length, D(m.length));
    }
  }), null;
}
export {
  Jn as A,
  En as a
};
//# sourceMappingURL=AudioControls-BnLt5lEL.js.map
