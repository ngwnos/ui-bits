import { jsxs as ve, jsx as x } from "react/jsx-runtime";
import a from "react";
import pe from "typegpu";
import { u as ge } from "./animationSuspension-BEQdvvQj.js";
import { u as xe } from "./frameLoop-BrwpA-Gk.js";
let Y = null, S = null;
const _e = 6, Me = 2e3, be = 6, ye = 128, Re = 18, Ne = "#f2f0e5", Ae = "#1c1b1a", k = 21, Be = 108, J = 16, Ee = J * Float32Array.BYTES_PER_ELEMENT;
async function we() {
  return navigator.gpu ? Y || (S || (S = pe.init().then((e) => (Y = e, e)).catch((e) => (console.error("Sequencer: TypeGPU init failed", e), S = null, null))), S) : null;
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
function K(e, s = [0, 0, 0]) {
  if (!e) return s;
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
  return s;
}
const Ue = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function Q(e) {
  const s = e.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!s) return null;
  const [, t, l, M] = s, C = t.toUpperCase(), A = Ue.findIndex((c) => c[0] === C && c.length === 1);
  if (A < 0) return null;
  const B = Number(M);
  if (!Number.isFinite(B)) return null;
  let b = A;
  l === "#" && (b += 1), l === "b" && (b -= 1);
  const q = (b % 12 + 12) % 12;
  return (B + 1) * 12 + q;
}
function Z(e, s = k) {
  if (typeof e == "number" && Number.isFinite(e))
    return Math.max(0, Math.min(127, Math.round(e)));
  if (typeof e == "string") {
    const t = Q(e);
    if (t != null)
      return Math.max(0, Math.min(127, t));
  }
  return s;
}
function Pe(e, s, t) {
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
    fragment: { module: l, entryPoint: "fs_main", targets: [{ format: s }] },
    primitive: { topology: "triangle-list" }
  });
}
const Fe = a.forwardRef(({
  heightUnits: e = _e,
  fontSize: s = 12,
  header: t,
  footer: l,
  colorA: M,
  colorB: C,
  minNote: A,
  maxNote: B,
  durationMs: b = Me,
  eventRadius: q = be,
  maxEvents: c = ye,
  suspended: ee,
  className: te,
  style: re,
  ariaLabel: ne = "Sequencer timeline"
}, ie) => {
  const I = a.useRef(null), E = a.useRef(null), d = a.useRef([]), p = a.useRef(null), w = a.useRef(c), [oe, $] = a.useState(!1), se = ge(ee), G = Z(A, k), ce = Math.max(G + 1, Z(B, Be)), j = Te(s), ae = Math.max(1, Math.round(e)), T = M ?? Ne, U = C ?? Ae, W = a.useRef(
    new Float32Array(Math.max(1, c) * 2)
  );
  a.useEffect(() => {
    w.current = c, W.current = new Float32Array(Math.max(1, c) * 2), d.current = d.current.slice(-c);
  }, [c]), a.useImperativeHandle(ie, () => ({
    recordNote(m, r) {
      const n = r ?? performance.now(), f = typeof m == "number" ? m : Q(m);
      f != null && (d.current.push({ timeMs: n, note: f }), d.current.length > w.current && d.current.splice(0, d.current.length - w.current), p.current || (p.current = n));
    },
    clear() {
      d.current = [];
    }
  }), []), a.useEffect(() => {
    let m = !1;
    return (async () => {
      const n = I.current;
      if (!n) return;
      const f = await we();
      if (!f || m) return;
      const i = f.device, D = n.getContext("webgpu");
      if (!D) return;
      const P = navigator.gpu.getPreferredCanvasFormat(), y = Pe(i, P, Math.max(1, c)), R = i.createBuffer({
        size: Ee,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      }), h = i.createBuffer({
        size: Math.max(1, c) * 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      }), v = i.createBindGroup({
        layout: y.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: R } },
          { binding: 1, resource: { buffer: h } }
        ]
      });
      E.current = {
        context: D,
        format: P,
        uniformBuffer: R,
        eventBuffer: h,
        renderPipeline: y,
        bindGroup: v,
        width: 0,
        height: 0,
        device: i
      }, $(!0);
    })(), () => {
      m = !0;
      const n = E.current;
      if (n)
        try {
          n.uniformBuffer.destroy(), n.eventBuffer.destroy();
        } catch {
        }
      E.current = null, $(!1);
    };
  }, [c]), xe(oe && !se ? (m) => {
    const r = E.current, n = I.current;
    if (!r || !n) return;
    const f = m * 1e3;
    p.current || (p.current = f);
    const i = Math.max(50, b), P = ((f - (p.current ?? f)) % i + i) % i / i, y = n.getBoundingClientRect(), R = window.devicePixelRatio || 1, h = Math.max(1, Math.round(y.width * R)), v = Math.max(1, Math.round(y.height * R));
    (h !== r.width || v !== r.height) && (n.width = h, n.height = v, r.context.configure({
      device: r.device,
      format: r.format,
      alphaMode: "premultiplied"
    }), r.width = h, r.height = v);
    const ue = Math.max(1, Math.min(h, v)), fe = q / ue, H = K(T, [1, 1, 1]), g = K(U, [0, 0, 0]), V = d.current, F = W.current, le = Math.max(1, ce - G), O = Math.min(V.length, w.current);
    for (let N = 0; N < O; N += 1) {
      const z = V[V.length - O + N], me = ((z.timeMs - (p.current ?? z.timeMs)) % i + i) % i / i, he = 1 - Math.min(1, Math.max(0, (z.note - G) / le));
      F[N * 2] = me, F[N * 2 + 1] = he;
    }
    const de = O * 2 * Float32Array.BYTES_PER_ELEMENT;
    r.device.queue.writeBuffer(
      r.eventBuffer,
      0,
      F.buffer,
      F.byteOffset,
      de
    );
    const o = new Float32Array(J);
    o[0] = h, o[1] = v, o[2] = P, o[3] = fe, o[4] = O, o[8] = H[0], o[9] = H[1], o[10] = H[2], o[11] = 1, o[12] = g[0], o[13] = g[1], o[14] = g[2], o[15] = 1, r.device.queue.writeBuffer(r.uniformBuffer, 0, o);
    const X = r.device.createCommandEncoder(), L = X.beginRenderPass({
      colorAttachments: [{
        view: r.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: g[0], g: g[1], b: g[2], a: 1 },
        storeOp: "store"
      }]
    });
    L.setPipeline(r.renderPipeline), L.setBindGroup(0, r.bindGroup), L.draw(6, 1, 0, 0), L.end(), r.device.queue.submit([X.finish()]);
  } : null);
  const u = { ...re };
  return u["--ui-bits-color-a"] = T, u["--ui-bits-color-b"] = U, u["--seq-font-size"] = `${s}px`, u["--seq-header-height"] = `${j}px`, u["--seq-body-height"] = `${j * ae}px`, u["--seq-header-bg"] = U, u["--seq-header-text"] = T, u["--seq-border"] = T, u["--seq-bg"] = U, /* @__PURE__ */ ve(
    "div",
    {
      className: ["ui-bits-sequencer", te].filter(Boolean).join(" "),
      style: u,
      "aria-label": ne,
      children: [
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__header", children: /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__header-inner", children: t ?? null }) }),
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__body", children: /* @__PURE__ */ x("canvas", { ref: I, className: "ui-bits-sequencer__canvas" }) }),
        /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__footer", children: /* @__PURE__ */ x("div", { className: "ui-bits-sequencer__footer-inner", children: l ?? null }) })
      ]
    }
  );
});
Fe.displayName = "Sequencer";
export {
  Fe as S
};
//# sourceMappingURL=Sequencer-C8rYSnAj.js.map
