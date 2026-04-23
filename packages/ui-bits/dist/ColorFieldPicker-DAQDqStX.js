import { jsxs as Ae, jsx as $ } from "react/jsx-runtime";
import a from "react";
import dt from "typegpu";
import { u as mt } from "./panelGap-DjV8XIAA.js";
import { S as pt } from "./SegmentBar-DTdbMbCH.js";
const gt = "var(--ui-bits-color-a, #2f2f2f)", bt = "var(--ui-bits-color-b, #f0f0f0)", Ge = "#ffffff", xt = 1, vt = 0.35, Rt = 1, Mt = 6, ne = 0.4, oe = 360, ce = 512, Xe = 8, Ye = 8, Ve = 12, wt = Ve * Float32Array.BYTES_PER_ELEMENT;
let xe = null, re = null;
async function _t() {
  return typeof navigator > "u" || !navigator.gpu ? null : xe || (re || (re = dt.init().then((t) => (xe = t, t)).catch((t) => (console.error("ColorFieldPicker: TypeGPU init failed", t), re = null, null))), re);
}
function yt() {
  return `
const LUT_WIDTH : u32 = ${oe}u;
const LUT_HEIGHT : u32 = ${ce}u;
const OKLCH_MAX_CHROMA : f32 = ${ne};

@group(0) @binding(0) var<storage, read_write> lut : array<f32>;

fn oklchToLinearRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let hRad = h * 3.14159265359 / 180.0;
  let a = c * cos(hRad);
  let b = c * sin(hRad);
  let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = l - 0.0894841775 * a - 1.291485548 * b;
  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;
  return vec3<f32>(
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  );
}

fn isInGamut(l: f32, c: f32, h: f32) -> bool {
  let rgb = oklchToLinearRgb(l, c, h);
  let epsilon = 0.0001;
  return rgb.x >= -epsilon && rgb.x <= (1.0 + epsilon)
    && rgb.y >= -epsilon && rgb.y <= (1.0 + epsilon)
    && rgb.z >= -epsilon && rgb.z <= (1.0 + epsilon);
}

fn findMaxChroma(l: f32, h: f32, targetC: f32) -> f32 {
  if (isInGamut(l, targetC, h)) {
    return targetC;
  }
  var lo = 0.0;
  var hi = targetC;
  for (var i = 0u; i < 12u; i = i + 1u) {
    let mid = (lo + hi) * 0.5;
    if (isInGamut(l, mid, h)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

fn lutIndex(lIndex: u32, hIndex: u32) -> u32 {
  return lIndex * LUT_WIDTH + hIndex;
}

@compute @workgroup_size(${Xe}, ${Ye}, 1)
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let hIndex = gid.x;
  let lIndex = gid.y;
  if (hIndex >= LUT_WIDTH || lIndex >= LUT_HEIGHT) {
    return;
  }
  let l = f32(lIndex) / f32(LUT_HEIGHT - 1u);
  let h = f32(hIndex) / f32(LUT_WIDTH) * 360.0;
  lut[lutIndex(lIndex, hIndex)] = findMaxChroma(l, h, OKLCH_MAX_CHROMA);
}
`;
}
function Ct() {
  return `
const LUT_WIDTH : u32 = ${oe}u;
const LUT_HEIGHT : u32 = ${ce}u;
const OKLCH_MAX_CHROMA : f32 = ${ne};
const EPSILON : f32 = 0.0001;

struct Uniforms {
  viewport : vec4<f32>,
  state0 : vec4<f32>,
  state1 : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> lut : array<f32>;

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

fn clamp01(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3<f32> {
  let normalizedHue = h - 360.0 * floor(h / 360.0);
  let c = v * s;
  let hp = normalizedHue / 60.0;
  let x = c * (1.0 - abs((hp - 2.0 * floor(hp * 0.5)) - 1.0));
  var rgb = vec3<f32>(0.0, 0.0, 0.0);
  if (hp >= 0.0 && hp < 1.0) {
    rgb = vec3<f32>(c, x, 0.0);
  } else if (hp >= 1.0 && hp < 2.0) {
    rgb = vec3<f32>(x, c, 0.0);
  } else if (hp >= 2.0 && hp < 3.0) {
    rgb = vec3<f32>(0.0, c, x);
  } else if (hp >= 3.0 && hp < 4.0) {
    rgb = vec3<f32>(0.0, x, c);
  } else if (hp >= 4.0 && hp < 5.0) {
    rgb = vec3<f32>(x, 0.0, c);
  } else {
    rgb = vec3<f32>(c, 0.0, x);
  }
  let m = v - c;
  return rgb + vec3<f32>(m, m, m);
}

fn linearToSrgb(value: f32) -> f32 {
  let clamped = clamp(value, 0.0, 1.0);
  if (clamped <= 0.0031308) {
    return clamped * 12.92;
  }
  return 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

fn oklchToLinearRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let hRad = h * 3.14159265359 / 180.0;
  let a = c * cos(hRad);
  let b = c * sin(hRad);
  let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = l - 0.0894841775 * a - 1.291485548 * b;
  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;
  return vec3<f32>(
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  );
}

fn oklchToRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let linear = oklchToLinearRgb(l, c, h);
  return vec3<f32>(
    linearToSrgb(linear.x),
    linearToSrgb(linear.y),
    linearToSrgb(linear.z),
  );
}

fn lutIndex(lIndex: u32, hIndex: u32) -> u32 {
  return lIndex * LUT_WIDTH + hIndex;
}

fn sampleMaxChroma(l: f32, h: f32) -> f32 {
  let lScaled = clamp01(l) * f32(LUT_HEIGHT - 1u);
  let hWrapped = h - 360.0 * floor(h / 360.0);
  let hScaled = hWrapped / 360.0 * f32(LUT_WIDTH);

  let l0 = u32(floor(lScaled));
  let l1 = min(LUT_HEIGHT - 1u, l0 + 1u);
  let h0 = u32(floor(hScaled)) % LUT_WIDTH;
  let h1 = (h0 + 1u) % LUT_WIDTH;

  let tl = fract(lScaled);
  let th = fract(hScaled);

  let c00 = lut[lutIndex(l0, h0)];
  let c10 = lut[lutIndex(l0, h1)];
  let c01 = lut[lutIndex(l1, h0)];
  let c11 = lut[lutIndex(l1, h1)];

  let c0 = mix(c00, c10, th);
  let c1 = mix(c01, c11, th);
  return mix(c0, c1, tl);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let width = max(1.0, uniforms.viewport.x);
  let height = max(1.0, uniforms.viewport.y);
  let barHeight = clamp(uniforms.viewport.z, 1.0, height);
  let mode = uniforms.viewport.w;

  let planeHeight = max(1.0, height - barHeight);
  let maxX = max(1.0, width - 1.0);
  let maxY = max(1.0, planeHeight - 1.0);

  let xPx = clamp(in.uv.x * width, 0.0, width - 1.0);
  let yPx = clamp(in.uv.y * height, 0.0, height - 1.0);
  let xRatio = xPx / maxX;
  let isBar = yPx >= planeHeight;

  var color = vec3<f32>(0.0, 0.0, 0.0);

  if (mode < 0.5) {
    if (isBar) {
      color = hsvToRgb(xRatio * 360.0, clamp01(uniforms.state1.y), clamp01(uniforms.state1.z));
    } else {
      let v = 1.0 - clamp01(yPx / maxY);
      color = hsvToRgb(uniforms.state1.w, xRatio, v);
    }
  } else if (mode < 1.5) {
    if (isBar) {
      color = vec3<f32>(
        clamp(uniforms.state0.z, 0.0, 255.0) / 255.0,
        clamp(uniforms.state0.w, 0.0, 255.0) / 255.0,
        xRatio,
      );
    } else {
      color = vec3<f32>(
        xRatio,
        1.0 - clamp01(yPx / maxY),
        clamp(uniforms.state1.x, 0.0, 255.0) / 255.0,
      );
    }
  } else {
    if (isBar) {
      let nextL = xRatio;
      let maxC = sampleMaxChroma(nextL, uniforms.state1.w);
      let mappedC = min(clamp(uniforms.state0.y, 0.0, OKLCH_MAX_CHROMA), maxC);
      color = oklchToRgb(nextL, mappedC, uniforms.state1.w);
    } else {
      let h = xRatio * 360.0;
      let row = floor(yPx);
      let rowC = clamp01(1.0 - row / maxY) * OKLCH_MAX_CHROMA;
      let rowCBelow = clamp01(1.0 - (row + 1.0) / maxY) * OKLCH_MAX_CHROMA;
      let maxC = sampleMaxChroma(clamp01(uniforms.state0.x), h);
      if (rowC <= maxC + EPSILON) {
        color = oklchToRgb(clamp01(uniforms.state0.x), rowC, h);
      } else if (rowCBelow <= maxC + EPSILON) {
        color = vec3<f32>(0.0, 0.0, 0.0);
      } else {
        color = oklchToRgb(clamp01(uniforms.state0.x), min(rowC, maxC), h);
      }
    }
  }

  return vec4<f32>(clamp(color, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
`;
}
function ve(t) {
  t && (t.uniformBuffer.destroy(), t.lutBuffer.destroy(), t.width = 0, t.height = 0);
}
function Ht(t, i) {
  if (typeof navigator > "u" || !navigator.gpu) return null;
  const s = i.getContext("webgpu");
  if (!s) return null;
  const o = navigator.gpu.getPreferredCanvasFormat();
  s.configure({
    device: t,
    format: o,
    alphaMode: "opaque"
  });
  const n = t.createBuffer({
    size: wt,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  }), l = t.createBuffer({
    size: oe * ce * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE
  }), u = t.createShaderModule({ code: yt() }), x = t.createShaderModule({ code: Ct() }), m = t.createComputePipeline({
    layout: "auto",
    compute: { module: u, entryPoint: "cs_main" }
  }), p = t.createRenderPipeline({
    layout: "auto",
    vertex: { module: x, entryPoint: "vs_main" },
    fragment: {
      module: x,
      entryPoint: "fs_main",
      targets: [{ format: o }]
    },
    primitive: { topology: "triangle-list" }
  }), v = t.createBindGroup({
    layout: m.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: l } }
    ]
  }), y = t.createBindGroup({
    layout: p.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: n } },
      { binding: 1, resource: { buffer: l } }
    ]
  }), A = t.createCommandEncoder(), T = A.beginComputePass();
  return T.setPipeline(m), T.setBindGroup(0, v), T.dispatchWorkgroups(
    Math.ceil(oe / Xe),
    Math.ceil(ce / Ye),
    1
  ), T.end(), t.queue.submit([A.finish()]), {
    device: t,
    context: s,
    format: o,
    uniformBuffer: n,
    lutBuffer: l,
    computePipeline: m,
    renderPipeline: p,
    computeBindGroup: v,
    renderBindGroup: y,
    width: 0,
    height: 0
  };
}
function Tt(t) {
  if (t != null)
    return typeof t == "number" ? `${t}px` : t;
}
function Re(t) {
  const i = t * (xt + vt * 2);
  return Math.round(i + Rt * 2);
}
function He(t) {
  const i = t.trim(), s = /^#([0-9a-fA-F]{3})$/, o = /^#([0-9a-fA-F]{6})$/, n = i.match(s);
  return n ? `#${n[1].split("").map((l) => l + l).join("")}` : o.test(i) ? i : null;
}
function Me(t) {
  const i = He(t);
  if (!i) return null;
  const s = i.slice(1), o = parseInt(s.slice(0, 2), 16), n = parseInt(s.slice(2, 4), 16), l = parseInt(s.slice(4, 6), 16);
  return [o, n, l].some((u) => Number.isNaN(u)) ? null : { r: o, g: n, b: l };
}
function It(t) {
  return Number.isFinite(t) ? Math.min(16777215, Math.max(0, Math.round(t))) : 0;
}
function Ie(t) {
  return `#${It(t).toString(16).padStart(6, "0")}`;
}
function Lt(t, i, s) {
  const o = (t % 360 + 360) % 360, n = s * i, l = o / 60, u = n * (1 - Math.abs(l % 2 - 1));
  let x = 0, m = 0, p = 0;
  l >= 0 && l < 1 ? (x = n, m = u) : l >= 1 && l < 2 ? (x = u, m = n) : l >= 2 && l < 3 ? (m = n, p = u) : l >= 3 && l < 4 ? (m = u, p = n) : l >= 4 && l < 5 ? (x = u, p = n) : l >= 5 && l < 6 && (x = n, p = u);
  const v = s - n;
  return {
    r: Math.round((x + v) * 255),
    g: Math.round((m + v) * 255),
    b: Math.round((p + v) * 255)
  };
}
function we(t, i, s) {
  const o = t / 255, n = i / 255, l = s / 255, u = Math.max(o, n, l), x = Math.min(o, n, l), m = u - x;
  let p = 0;
  const v = u, y = u === 0 ? 0 : m / u;
  if (m !== 0)
    switch (u) {
      case o:
        p = ((n - l) / m + (n < l ? 6 : 0)) * 60;
        break;
      case n:
        p = ((l - o) / m + 2) * 60;
        break;
      default:
        p = ((o - n) / m + 4) * 60;
        break;
    }
  return { h: p, s: y, v };
}
function ze(t, i, s) {
  const o = Lt(t, i, s), n = o.r << 16 | o.g << 8 | o.b;
  return Ie(n);
}
function R(t) {
  return Math.min(1, Math.max(0, t));
}
function _e(t) {
  return Number.isFinite(t) ? Math.min(255, Math.max(0, Math.round(t))) : 0;
}
function Fe(t, i, s) {
  const o = _e(t), n = _e(i), l = _e(s), u = o << 16 | n << 8 | l;
  return Ie(u);
}
function ye(t) {
  const i = t / 255;
  return i <= 0.04045 ? i / 12.92 : Math.pow((i + 0.055) / 1.055, 2.4);
}
function Ce(t) {
  const i = Math.min(1, Math.max(0, t));
  return i <= 31308e-7 ? i * 12.92 : 1.055 * Math.pow(i, 1 / 2.4) - 0.055;
}
function $e(t, i, s) {
  const o = ye(t), n = ye(i), l = ye(s), u = 0.4122214708 * o + 0.5363325363 * n + 0.0514459929 * l, x = 0.2119034982 * o + 0.6806995451 * n + 0.1073969566 * l, m = 0.0883024619 * o + 0.2817188376 * n + 0.6299787005 * l, p = Math.cbrt(u), v = Math.cbrt(x), y = Math.cbrt(m), A = 0.2104542553 * p + 0.793617785 * v - 0.0040720468 * y, T = 1.9779984951 * p - 2.428592205 * v + 0.4505937099 * y, X = 0.0259040371 * p + 0.7827717662 * v - 0.808675766 * y, ie = Math.sqrt(T * T + X * X), le = (Math.atan2(X, T) * 180 / Math.PI + 360) % 360;
  return { l: A, c: ie, h: le };
}
function Ne(t, i, s, o) {
  const n = $e(t, i, s);
  return n.c < 1e-3 ? { ...n, h: o } : n;
}
function Ke(t, i, s) {
  const o = s * Math.PI / 180, n = i * Math.cos(o), l = i * Math.sin(o), u = t + 0.3963377774 * n + 0.2158037573 * l, x = t - 0.1055613458 * n - 0.0638541728 * l, m = t - 0.0894841775 * n - 1.291485548 * l, p = u * u * u, v = x * x * x, y = m * m * m;
  return {
    r: 4.0767416621 * p - 3.3077115913 * v + 0.2309699292 * y,
    g: -1.2684380046 * p + 2.6097574011 * v - 0.3413193965 * y,
    b: -0.0041960863 * p - 0.7034186147 * v + 1.707614701 * y
  };
}
function Te(t, i, s) {
  const o = Ke(t, i, s), n = 1e-4;
  return o.r >= -n && o.r <= 1 + n && o.g >= -n && o.g <= 1 + n && o.b >= -n && o.b <= 1 + n;
}
function Pt(t, i, s) {
  if (Te(t, s, i)) return s;
  let o = 0, n = s;
  for (let l = 0; l < 12; l += 1) {
    const u = (o + n) / 2;
    Te(t, u, i) ? o = u : n = u;
  }
  return o;
}
function We(t, i, s) {
  const o = Ke(t, i, s);
  return {
    r: Math.round(Ce(o.r) * 255),
    g: Math.round(Ce(o.g) * 255),
    b: Math.round(Ce(o.b) * 255)
  };
}
function kt(t, i, s) {
  if (Te(t, i, s)) return We(t, i, s);
  const o = Pt(t, s, i);
  return We(t, o, s);
}
function De(t, i, s) {
  const o = kt(t, i, s), n = o.r << 16 | o.g << 8 | o.b;
  return Ie(n);
}
const St = a.forwardRef((t, i) => {
  const {
    value: s,
    defaultValue: o = Ge,
    onChange: n,
    mode: l,
    defaultMode: u = "oklch",
    onModeChange: x,
    colorA: m,
    colorB: p,
    borderStyle: v,
    fontSize: y,
    heightUnits: A,
    width: T,
    className: X,
    style: ie,
    ...le
  } = t, K = mt(), ae = m ?? K?.colorA ?? gt, se = p ?? K?.colorB ?? bt, ue = v ?? K?.borderStyle ?? "a", P = y ?? K?.fontSize ?? 12, qe = Math.max(1, Math.round(A ?? Mt)), je = Tt(T), Le = He(o) ?? Ge, fe = s !== void 0, [Ze, Je] = a.useState(Le), G = He(fe ? s ?? "" : Ze) ?? Le, he = l !== void 0, [Qe, et] = a.useState(u), I = he ? l : Qe, de = a.useRef(/* @__PURE__ */ new Set()), Pe = a.useCallback((e) => {
    const c = de.current;
    if (c.add(e), c.size > 256) {
      const r = c.values().next().value;
      r !== void 0 && c.delete(r);
    }
  }, []), S = a.useCallback((e, c) => {
    c?.localInteraction && Pe(e), fe || Je(e), n?.(e);
  }, [fe, n, Pe]), tt = a.useCallback((e) => {
    he || et(e), x?.(e);
  }, [he, x]), rt = Re(P) * qe, nt = ue === "a" ? ae : ue === "b" ? se : "transparent", ot = Math.max(2, Math.round(P * 0.25)), Y = typeof navigator < "u" && !!navigator.gpu, [q, z] = a.useState(() => Y ? "loading" : "unsupported"), E = q === "ready", F = a.useRef(null), [j, ct] = a.useState(null), ke = a.useRef(null), Se = a.useRef(null), k = a.useRef(null), it = a.useRef(new Float32Array(Ve)), N = a.useRef(null), Z = a.useRef(null), V = a.useRef(!1), me = a.useRef(null), J = a.useRef(null), Q = a.useRef(null), [ee, lt] = a.useState({ width: 0, height: 0, barHeight: 0 }), te = a.useRef(ee), O = a.useRef(I), U = a.useRef(Me(G) ?? { r: 255, g: 255, b: 255 }), C = a.useRef(U.current), H = a.useRef(we(U.current.r, U.current.g, U.current.b)), w = a.useRef($e(U.current.r, U.current.g, U.current.b)), M = a.useCallback(() => {
    typeof window > "u" || N.current === null && (N.current = window.requestAnimationFrame(() => {
      N.current = null, Z.current?.();
    }));
  }, []);
  a.useEffect(() => {
    z((e) => Y ? e === "unsupported" ? "loading" : e : "unsupported");
  }, [Y]), a.useEffect(() => {
    te.current = ee;
  }, [ee]);
  const Ee = a.useCallback(() => {
    const e = ke.current, c = Se.current;
    if (!e || !c) return;
    const r = te.current;
    if (r.width <= 0 || r.height <= 0) {
      e.style.opacity = "0", c.style.opacity = "0";
      return;
    }
    const f = O.current, h = Math.max(1, r.height - r.barHeight), d = f === "oklch" ? R(w.current.h / 360) * r.width : f === "rgb" ? R(C.current.r / 255) * r.width : R(H.current.s) * r.width, B = f === "oklch" ? R(1 - w.current.c / ne) * h : f === "rgb" ? R(1 - C.current.g / 255) * h : R(1 - H.current.v) * h, W = f === "oklch" ? w.current.l : f === "rgb" ? C.current.b / 255 : H.current.h / 360, D = R(W) * r.width;
    e.style.left = `${d}px`, e.style.top = `${B}px`, e.style.opacity = "1", c.style.left = `${D}px`, c.style.top = `${Math.max(1, r.height - r.barHeight) + r.barHeight / 2}px`, c.style.opacity = "1";
  }, []);
  a.useEffect(() => {
    O.current = I, M();
  }, [I, M]), a.useEffect(() => {
    if (V.current) return;
    const e = de.current;
    if (e.size > 0 && e.has(G)) {
      M();
      return;
    }
    e.size > 0 && e.clear();
    const c = Me(G);
    if (!c) return;
    const r = we(c.r, c.g, c.b);
    H.current = r, C.current = c;
    const f = Ne(c.r, c.g, c.b, w.current.h);
    w.current = f, M();
  }, [G, M]);
  const Oe = a.useRef(I);
  a.useEffect(() => {
    if (Oe.current === I) return;
    Oe.current = I;
    const e = Me(G);
    if (e) {
      if (I === "oklch") {
        const c = Ne(e.r, e.g, e.b, w.current.h);
        w.current = c;
      } else if (I === "rgb")
        C.current = e;
      else {
        const c = we(e.r, e.g, e.b);
        H.current = c;
      }
      M();
    }
  }, [I, G, M]);
  const pe = a.useCallback(() => {
    if (Ee(), typeof window > "u") return;
    const e = k.current, c = F.current;
    if (!e || !c) return;
    const r = te.current;
    if (r.width <= 0 || r.height <= 0) return;
    const f = window.devicePixelRatio || 1, h = Math.max(1, Math.round(r.width * f)), d = Math.max(1, Math.round(r.height * f)), B = Math.max(1, Math.round(r.barHeight * f));
    (c.width !== h || c.height !== d) && (c.width = h, c.height = d), (e.width !== h || e.height !== d) && (e.context.configure({
      device: e.device,
      format: e.format,
      alphaMode: "opaque"
    }), e.width = h, e.height = d);
    const W = O.current === "hsv" ? 0 : O.current === "rgb" ? 1 : 2, D = O.current === "oklch" ? w.current.h : O.current === "hsv" ? H.current.h : 0, b = it.current;
    b[0] = h, b[1] = d, b[2] = B, b[3] = W, b[4] = w.current.l, b[5] = w.current.c, b[6] = C.current.r, b[7] = C.current.g, b[8] = C.current.b, b[9] = H.current.s, b[10] = H.current.v, b[11] = D, e.device.queue.writeBuffer(
      e.uniformBuffer,
      0,
      b.buffer,
      b.byteOffset,
      b.byteLength
    );
    const g = e.device.createCommandEncoder(), L = g.beginRenderPass({
      colorAttachments: [{
        view: e.context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 }
      }]
    });
    L.setPipeline(e.renderPipeline), L.setBindGroup(0, e.renderBindGroup), L.draw(6, 1, 0, 0), L.end(), e.device.queue.submit([g.finish()]);
  }, [Ee]);
  a.useEffect(() => (Z.current = pe, () => {
    Z.current === pe && (Z.current = null);
  }), [pe]), a.useEffect(() => {
    if (typeof window > "u") return;
    if (!Y) {
      z("unsupported");
      return;
    }
    const e = j ?? F.current;
    if (!e) return;
    let c = !1, r = null;
    return z((h) => h === "ready" ? h : "loading"), (async () => {
      const h = await _t();
      if (c) return;
      if (!h) {
        z("error");
        return;
      }
      const d = Ht(h.device, e);
      if (c) {
        ve(d);
        return;
      }
      if (!d) {
        z("error");
        return;
      }
      r = d, k.current = d, z("ready"), M();
    })(), () => {
      c = !0, k.current && k.current === r && (ve(k.current), k.current = null);
    };
  }, [j, M, Y]), a.useEffect(() => {
    if (typeof window > "u") return;
    const e = j ?? F.current;
    if (!e) return;
    const c = () => {
      const f = e.getBoundingClientRect(), h = {
        width: f.width,
        height: f.height,
        barHeight: Re(P)
      };
      lt((d) => d.width === h.width && d.height === h.height && d.barHeight === h.barHeight ? d : h), J.current = null, M();
    };
    c();
    let r = null;
    return typeof ResizeObserver < "u" && (r = new ResizeObserver(c), r.observe(e)), window.addEventListener("resize", c), () => {
      r?.disconnect(), window.removeEventListener("resize", c);
    };
  }, [j, P, M]), a.useEffect(() => {
    M();
  }, [ee, M]), a.useEffect(() => (() => {
    typeof window < "u" && N.current !== null && window.cancelAnimationFrame(N.current), N.current = null, ve(k.current), k.current = null;
  }), []);
  const at = a.useCallback((e) => {
    F.current = e, ct(e);
  }, []), ge = a.useCallback(() => {
    if (!F.current) return null;
    const e = F.current.getBoundingClientRect(), c = te.current.barHeight || Re(P), r = Math.max(1, e.height - c), f = {
      left: e.left,
      top: e.top,
      width: e.width,
      height: e.height,
      planeHeight: r
    };
    return J.current = f, f;
  }, [P]), be = a.useCallback((e, c) => {
    const r = J.current ?? ge();
    if (!r) return;
    const f = Math.min(Math.max(e - r.left, 0), r.width), h = Math.min(Math.max(c - r.top, 0), r.height), d = O.current, B = me.current ?? (h >= r.planeHeight ? "hue" : "plane"), W = Math.round(f), D = Math.round(h), b = Q.current;
    if (!(b && b.x === W && b.y === D && b.region === B && b.mode === d)) {
      if (Q.current = {
        x: W,
        y: D,
        region: B,
        mode: d
      }, B === "plane")
        if (d === "oklch") {
          const g = R(r.width > 0 ? f / r.width : 0), L = R(r.planeHeight > 0 ? h / r.planeHeight : 0), _ = {
            ...w.current,
            h: g * 360,
            c: (1 - L) * ne
          };
          w.current = _, S(De(_.l, _.c, _.h), { localInteraction: !0 });
        } else if (d === "rgb") {
          const g = R(r.width > 0 ? f / r.width : 0), L = R(r.planeHeight > 0 ? h / r.planeHeight : 0), _ = {
            ...C.current,
            r: g * 255,
            g: (1 - L) * 255
          };
          C.current = _, S(Fe(_.r, _.g, _.b), { localInteraction: !0 });
        } else {
          const g = R(r.width > 0 ? f / r.width : 0), L = R(r.planeHeight > 0 ? h / r.planeHeight : 0), _ = {
            ...H.current,
            s: g,
            v: 1 - L
          };
          H.current = _, S(ze(_.h, _.s, _.v), { localInteraction: !0 });
        }
      else if (d === "oklch") {
        const g = {
          ...w.current,
          l: R(r.width > 0 ? f / r.width : 0)
        };
        w.current = g, S(De(g.l, g.c, g.h), { localInteraction: !0 });
      } else if (d === "rgb") {
        const g = {
          ...C.current,
          b: R(r.width > 0 ? f / r.width : 0) * 255
        };
        C.current = g, S(Fe(g.r, g.g, g.b), { localInteraction: !0 });
      } else {
        const g = {
          ...H.current,
          h: R(r.width > 0 ? f / r.width : 0) * 360
        };
        H.current = g, S(ze(g.h, g.s, g.v), { localInteraction: !0 });
      }
      M();
    }
  }, [ge, S, M]), st = (e) => {
    if (!E || e.button !== 0) return;
    const c = ge();
    if (!c) return;
    de.current.clear(), Q.current = null;
    const r = Math.min(Math.max(e.clientY - c.top, 0), c.height);
    me.current = r >= c.planeHeight ? "hue" : "plane", V.current = !0, e.currentTarget.setPointerCapture(e.pointerId), be(e.clientX, e.clientY);
  }, ut = (e) => {
    E && V.current && be(e.clientX, e.clientY);
  }, Ue = (e, c) => {
    if (V.current) {
      c && E && be(e.clientX, e.clientY), V.current = !1, me.current = null, J.current = null, Q.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
      }
    }
  }, ft = (e) => {
    Ue(e, !0);
  }, ht = (e) => {
    Ue(e, !1);
  }, Be = q === "unsupported" ? "WebGPU is required for this color picker." : q === "error" ? "WebGPU initialization failed." : q === "loading" ? "Initializing WebGPU..." : null;
  return /* @__PURE__ */ Ae(
    "div",
    {
      ref: i,
      className: [
        "ui-bits-color-field-picker",
        X
      ].filter(Boolean).join(" "),
      style: {
        width: je,
        height: rt,
        borderRadius: ot,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: nt,
        background: ae,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...ie ?? {}
      },
      ...le,
      children: [
        /* @__PURE__ */ $(
          pt,
          {
            options: [
              { value: "hsv", label: "HSV" },
              { value: "rgb", label: "RGB" },
              { value: "oklch", label: "OKLCH" }
            ],
            value: I,
            onChange: (e) => tt(e),
            colorA: ae,
            colorB: se,
            borderStyle: ue,
            borderMask: { top: !1, left: !1, right: !1, bottom: !0 },
            fontSize: P
          }
        ),
        /* @__PURE__ */ Ae(
          "div",
          {
            style: {
              flex: 1,
              position: "relative",
              overflow: "hidden",
              touchAction: "none",
              cursor: E ? "crosshair" : "default"
            },
            onPointerDown: st,
            onPointerMove: ut,
            onPointerUp: ft,
            onPointerCancel: ht,
            children: [
              /* @__PURE__ */ $(
                "canvas",
                {
                  ref: at,
                  style: {
                    display: "block",
                    width: "100%",
                    height: "100%",
                    opacity: E ? 1 : 0.5
                  }
                }
              ),
              /* @__PURE__ */ $(
                "div",
                {
                  ref: ke,
                  style: {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    opacity: 0,
                    display: E ? "block" : "none"
                  }
                }
              ),
              /* @__PURE__ */ $(
                "div",
                {
                  ref: Se,
                  style: {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    opacity: 0,
                    display: E ? "block" : "none"
                  }
                }
              ),
              Be ? /* @__PURE__ */ $(
                "div",
                {
                  role: "status",
                  "aria-live": "polite",
                  style: {
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 8px",
                    textAlign: "center",
                    pointerEvents: "none",
                    color: se,
                    background: "rgba(0,0,0,0.35)",
                    fontSize: Math.max(10, Math.round(P * 0.9)),
                    lineHeight: 1.2
                  },
                  children: Be
                }
              ) : null
            ]
          }
        )
      ]
    }
  );
});
St.displayName = "ColorFieldPicker";
export {
  St as C
};
//# sourceMappingURL=ColorFieldPicker-DAQDqStX.js.map
