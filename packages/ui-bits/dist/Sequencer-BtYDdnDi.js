import { jsxs as pe, jsx as x } from "react/jsx-runtime";
import a from "react";
import ve from "typegpu";
import { u as ge } from "./animationSuspension-BEQdvvQj.js";
import { u as xe } from "./frameLoop-DbiGWmY_.js";
let Y = null, L = null;
const _e = 6, Me = 2e3, be = 6, ye = 128, Re = 18, Ne = "#f2f0e5", Ae = "#1c1b1a", k = 21, Ee = 108, J = 16, Be = J * Float32Array.BYTES_PER_ELEMENT;
async function we() {
  return navigator.gpu ? Y || (L || (L = ve.init().then((e) => (Y = e, e)).catch((e) => (console.error("Sequencer: TypeGPU init failed", e), L = null, null))), L) : null;
}
function Te(e) {
  const t = e * 0.35, M = e * 1;
  return Math.max(
    Math.round(M + t * 2 + 2),
    Math.round(e + t * 1.5),
    Re
  );
}
function _(e) {
  return Number.parseInt(e, 16) / 255;
}
function K(e, o = [0, 0, 0]) {
  if (!e) return o;
  const t = e.trim();
  if (t.startsWith("#")) {
    if (t.length === 7)
      return [
        _(t.slice(1, 3)),
        _(t.slice(3, 5)),
        _(t.slice(5, 7))
      ];
    if (t.length === 4)
      return [
        _(t[1] + t[1]),
        _(t[2] + t[2]),
        _(t[3] + t[3])
      ];
  }
  return o;
}
const Ue = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function Q(e) {
  const o = e.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!o) return null;
  const [, t, l, M] = o, S = t.toUpperCase(), A = Ue.findIndex((s) => s[0] === S && s.length === 1);
  if (A < 0) return null;
  const E = Number(M);
  if (!Number.isFinite(E)) return null;
  let b = A;
  l === "#" && (b += 1), l === "b" && (b -= 1);
  const C = (b % 12 + 12) % 12;
  return (E + 1) * 12 + C;
}
function Z(e, o = k) {
  if (typeof e == "number" && Number.isFinite(e))
    return Math.max(0, Math.min(127, Math.round(e)));
  if (typeof e == "string") {
    const t = Q(e);
    if (t != null)
      return Math.max(0, Math.min(127, t));
  }
  return o;
}
function Pe(e, o, t) {
  const l = e.createShaderModule({
    code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

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

struct Uniforms {
  params0 : vec4<f32>,
  params1 : vec4<f32>,
  colorA : vec4<f32>,
  colorB : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> events : array<vec2<f32>>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let resolution = max(uniforms.params0.xy, vec2<f32>(1.0, 1.0));
  let playhead = uniforms.params0.z;
  let radius = uniforms.params0.w;
  let eventCount = uniforms.params1.x;
  let uv = in.uv;
  var intensity = 0.0;
  let lineWidth = 1.0 / resolution.x;
  let line = smoothstep(lineWidth * 1.5, 0.0, abs(uv.x - playhead));
  intensity = max(intensity, line);
  for (var i = 0u; i < ${t}u; i = i + 1u) {
    if (f32(i) >= eventCount) { break; }
    let pos = events[i];
    let dist = distance(uv, pos);
    let hit = smoothstep(radius, 0.0, dist);
    intensity = max(intensity, hit);
  }
  return mix(uniforms.colorB, uniforms.colorA, intensity);
}
`
  });
  return e.createRenderPipeline({
    layout: "auto",
    vertex: { module: l, entryPoint: "vs_main" },
    fragment: { module: l, entryPoint: "fs_main", targets: [{ format: o }] },
    primitive: { topology: "triangle-list" }
  });
}
const Fe = a.forwardRef(({
  heightUnits: e = _e,
  fontSize: o = 12,
  header: t,
  footer: l,
  colorA: M,
  colorB: S,
  minNote: A,
  maxNote: E,
  durationMs: b = Me,
  eventRadius: C = be,
  maxEvents: s = ye,
  suspended: ee,
  className: te,
  style: ne,
  ariaLabel: re = "Sequencer timeline"
}, ie) => {
  const q = a.useRef(null), I = a.useRef(null), d = a.useRef([]), v = a.useRef(null), B = a.useRef(s), [oe, $] = a.useState(!1), se = ge(ee), G = Z(A, k), ae = Math.max(G + 1, Z(E, Ee)), j = Te(o), ce = Math.max(1, Math.round(e)), w = M ?? Ne, T = S ?? Ae, W = a.useRef(
    new Float32Array(Math.max(1, s) * 2)
  );
  a.useEffect(() => {
    B.current = s, W.current = new Float32Array(Math.max(1, s) * 2), d.current = d.current.slice(-s);
  }, [s]), a.useImperativeHandle(ie, () => ({
    recordNote(m, n) {
      const u = n ?? performance.now(), f = typeof m == "number" ? m : Q(m);
      f != null && (d.current.push({ timeMs: u, note: f }), d.current.length > B.current && d.current.splice(0, d.current.length - B.current), v.current || (v.current = u));
    },
    clear() {
      d.current = [];
    }
  }), []), a.useEffect(() => {
    let m = !1;
    return (async () => {
      const u = q.current;
      if (!u) return;
      const f = await we();
      if (!f || m) return;
      const r = f.device, D = u.getContext("webgpu");
      if (!D) return;
      const U = navigator.gpu.getPreferredCanvasFormat(), y = Pe(r, U, Math.max(1, s)), R = r.createBuffer({
        size: Be,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      }), h = r.createBuffer({
        size: Math.max(1, s) * 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }), p = r.createBindGroup({
        layout: y.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: R } },
          { binding: 1, resource: { buffer: h } }
        ]
      });
      I.current = {
        context: D,
        format: U,
        uniformBuffer: R,
        eventBuffer: h,
        renderPipeline: y,
        bindGroup: p,
        width: 0,
        height: 0,
        device: r
      }, $(!0);
    })(), () => {
      m = !0, I.current = null, $(!1);
    };
  }, [s]), xe(oe && !se ? (m) => {
    const n = I.current, u = q.current;
    if (!n || !u) return;
    const f = m * 1e3;
    v.current || (v.current = f);
    const r = Math.max(50, b), U = ((f - (v.current ?? f)) % r + r) % r / r, y = u.getBoundingClientRect(), R = window.devicePixelRatio || 1, h = Math.max(1, Math.round(y.width * R)), p = Math.max(1, Math.round(y.height * R));
    (h !== n.width || p !== n.height) && (u.width = h, u.height = p, n.context.configure({
      device: n.device,
      format: n.format,
      alphaMode: "premultiplied"
    }), n.width = h, n.height = p);
    const ue = Math.max(1, Math.min(h, p)), fe = C / ue, H = K(w, [1, 1, 1]), g = K(T, [0, 0, 0]), V = d.current, P = W.current, le = Math.max(1, ae - G), F = Math.min(V.length, B.current);
    for (let N = 0; N < F; N += 1) {
      const z = V[V.length - F + N], me = ((z.timeMs - (v.current ?? z.timeMs)) % r + r) % r / r, he = 1 - Math.min(1, Math.max(0, (z.note - G) / le));
      P[N * 2] = me, P[N * 2 + 1] = he;
    }
    const de = F * 2 * Float32Array.BYTES_PER_ELEMENT;
    n.device.queue.writeBuffer(
      n.eventBuffer,
      0,
      P.buffer,
      P.byteOffset,
      de
    );
    const i = new Float32Array(J);
    i[0] = h, i[1] = p, i[2] = U, i[3] = fe, i[4] = F, i[8] = H[0], i[9] = H[1], i[10] = H[2], i[11] = 1, i[12] = g[0], i[13] = g[1], i[14] = g[2], i[15] = 1, n.device.queue.writeBuffer(n.uniformBuffer, 0, i);
    const X = n.device.createCommandEncoder(), O = X.beginRenderPass({
      colorAttachments: [{
        view: n.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: g[0], g: g[1], b: g[2], a: 1 },
        storeOp: "store"
      }]
    });
    O.setPipeline(n.renderPipeline), O.setBindGroup(0, n.bindGroup), O.draw(6, 1, 0, 0), O.end(), n.device.queue.submit([X.finish()]);
  } : null);
  const c = { ...ne };
  return c["--ui-bits-color-a"] = w, c["--ui-bits-color-b"] = T, c["--seq-font-size"] = `${o}px`, c["--seq-header-height"] = `${j}px`, c["--seq-body-height"] = `${j * ce}px`, c["--seq-header-bg"] = T, c["--seq-header-text"] = w, c["--seq-border"] = w, c["--seq-bg"] = T, /* @__PURE__ */ pe(
    "div",
    {
      className: ["ui-bits-sequencer", te].filter(Boolean).join(" "),
      style: c,
      "aria-label": re,
      children: [
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__header", children: /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__header-inner", children: t ?? null }) }),
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__body", children: /* @__PURE__ */ x("canvas", { ref: q, className: "ui-bits-sequencer__canvas" }) }),
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__footer", children: /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__footer-inner", children: l ?? null }) })
      ]
    }
  );
});
Fe.displayName = "Sequencer";
export {
  Fe as S
};
//# sourceMappingURL=Sequencer-BtYDdnDi.js.map
