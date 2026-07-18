import React from "react";
import tgpu from "typegpu";
import { useAnimationSuspended } from "../../animationSuspension";
import { useFrame } from "../../frameLoop";
import "./sequencer.css";

export interface SequencerEvent {
  timeMs: number;
  note: number;
}

export interface SequencerHandle {
  recordNote: (note: string | number, timeMs?: number) => void;
  clear: () => void;
}

export interface SequencerProps {
  heightUnits?: number;
  fontSize?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  minNote?: number | string;
  maxNote?: number | string;
  durationMs?: number;
  eventRadius?: number;
  maxEvents?: number;
  suspended?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

const DEFAULT_HEIGHT_UNITS = 6;
const DEFAULT_DURATION_MS = 2000;
const DEFAULT_EVENT_RADIUS = 6;
const DEFAULT_MAX_EVENTS = 128;
const MIN_SLIDER_UNIT_PX = 18;
const FALLBACK_COLOR_A = "#f2f0e5";
const FALLBACK_COLOR_B = "#1c1b1a";
const DEFAULT_MIN_NOTE = 21;
const DEFAULT_MAX_NOTE = 108;
const UNIFORM_FLOAT_COUNT = 16;
const UNIFORM_BUFFER_SIZE = UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

interface SequencerGpuResources {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  uniformBuffer: GPUBuffer;
  eventBuffer: GPUBuffer;
  renderPipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  width: number;
  height: number;
  device: GPUDevice;
}

async function getSharedRoot(): Promise<TypeGpuRoot | null> {
  if (!navigator.gpu) return null;
  if (sharedRoot) return sharedRoot;
  if (!sharedRootPromise) {
    sharedRootPromise = tgpu.init().then((root) => {
      sharedRoot = root;
      return root;
    }).catch((error) => {
      console.error("Sequencer: TypeGPU init failed", error);
      sharedRootPromise = null;
      return null;
    });
  }
  return sharedRootPromise;
}

function computeSliderUnitPx(fontSize: number) {
  const previewPaddingEm = 0.35;
  const previewPaddingPx = fontSize * previewPaddingEm;
  const previewLineHeight = 1;
  const baseLabelHeight = fontSize * previewLineHeight;
  return Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
    Math.round(fontSize + previewPaddingPx * 1.5),
    MIN_SLIDER_UNIT_PX,
  );
}

function hexChannel(value: string) {
  return Number.parseInt(value, 16) / 255;
}

function parseHexColor(color?: string, fallback: [number, number, number] = [0, 0, 0]): [number, number, number] {
  if (!color) return fallback;
  const normalized = color.trim();
  if (normalized.startsWith("#")) {
    if (normalized.length === 7) {
      return [
        hexChannel(normalized.slice(1, 3)),
        hexChannel(normalized.slice(3, 5)),
        hexChannel(normalized.slice(5, 7)),
      ];
    }
    if (normalized.length === 4) {
      return [
        hexChannel(normalized[1] + normalized[1]),
        hexChannel(normalized[2] + normalized[2]),
        hexChannel(normalized[3] + normalized[3]),
      ];
    }
  }
  return fallback;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function parseNoteName(value: string) {
  const match = value.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return null;
  const [, rawLetter, accidental, rawOctave] = match;
  const letter = rawLetter.toUpperCase();
  const baseIndex = NOTE_NAMES.findIndex((name) => name[0] === letter && name.length === 1);
  if (baseIndex < 0) return null;
  const octave = Number(rawOctave);
  if (!Number.isFinite(octave)) return null;
  let offset = baseIndex;
  if (accidental === "#") offset += 1;
  if (accidental === "b") offset -= 1;
  const normalized = ((offset % 12) + 12) % 12;
  return (octave + 1) * 12 + normalized;
}

function resolveMidi(value?: number | string, fallback = DEFAULT_MIN_NOTE) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(127, Math.round(value)));
  }
  if (typeof value === "string") {
    const parsed = parseNoteName(value);
    if (parsed != null) {
      return Math.max(0, Math.min(127, parsed));
    }
  }
  return fallback;
}

function createPipeline(device: GPUDevice, format: GPUTextureFormat, maxEvents: number) {
  const shaderModule = device.createShaderModule({
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
  for (var i = 0u; i < ${maxEvents}u; i = i + 1u) {
    if (f32(i) >= eventCount) { break; }
    let pos = events[i];
    let dist = distance(uv, pos);
    let hit = smoothstep(radius, 0.0, dist);
    intensity = max(intensity, hit);
  }
  return mix(uniforms.colorB, uniforms.colorA, intensity);
}
`,
  });

  return device.createRenderPipeline({
    layout: "auto",
    vertex: { module: shaderModule, entryPoint: "vs_main" },
    fragment: { module: shaderModule, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });
}

const Sequencer = React.forwardRef<SequencerHandle, SequencerProps>(({
  heightUnits = DEFAULT_HEIGHT_UNITS,
  fontSize = 12,
  header,
  footer,
  colorA,
  colorB,
  minNote,
  maxNote,
  durationMs = DEFAULT_DURATION_MS,
  eventRadius = DEFAULT_EVENT_RADIUS,
  maxEvents = DEFAULT_MAX_EVENTS,
  suspended,
  className,
  style,
  ariaLabel = "Sequencer timeline",
}, ref) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = React.useRef<SequencerGpuResources | null>(null);
  const eventsRef = React.useRef<SequencerEvent[]>([]);
  const startTimeRef = React.useRef<number | null>(null);
  const maxEventsRef = React.useRef(maxEvents);
  const [gpuReady, setGpuReady] = React.useState(false);
  const isSuspended = useAnimationSuspended(suspended);
  const resolvedMinNote = resolveMidi(minNote, DEFAULT_MIN_NOTE);
  const resolvedMaxNote = Math.max(resolvedMinNote + 1, resolveMidi(maxNote, DEFAULT_MAX_NOTE));
  const unitSizePx = computeSliderUnitPx(fontSize);
  const resolvedHeightUnits = Math.max(1, Math.round(heightUnits));
  const safeColorA = colorA ?? FALLBACK_COLOR_A;
  const safeColorB = colorB ?? FALLBACK_COLOR_B;

  const eventsBufferRef = React.useRef<Float32Array>(
    new Float32Array(Math.max(1, maxEvents) * 2),
  );

  React.useEffect(() => {
    maxEventsRef.current = maxEvents;
    eventsBufferRef.current = new Float32Array(Math.max(1, maxEvents) * 2);
    eventsRef.current = eventsRef.current.slice(-maxEvents);
  }, [maxEvents]);

  React.useImperativeHandle(ref, () => ({
    recordNote(note, timeMs) {
      const now = timeMs ?? performance.now();
      const midi = typeof note === "number" ? note : parseNoteName(note);
      if (midi == null) return;
      eventsRef.current.push({ timeMs: now, note: midi });
      if (eventsRef.current.length > maxEventsRef.current) {
        eventsRef.current.splice(0, eventsRef.current.length - maxEventsRef.current);
      }
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }
    },
    clear() {
      eventsRef.current = [];
    },
  }), []);

  React.useEffect(() => {
    let cancelled = false;
    const initGpu = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const root = await getSharedRoot();
      if (!root || cancelled) return;
      const device = root.device;
      const context = canvas.getContext("webgpu");
      if (!context) return;
      const format = navigator.gpu.getPreferredCanvasFormat();
      const renderPipeline = createPipeline(device, format, Math.max(1, maxEvents));
      const uniformBuffer = device.createBuffer({
        size: UNIFORM_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const eventBuffer = device.createBuffer({
        size: Math.max(1, maxEvents) * 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      const bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: { buffer: eventBuffer } },
        ],
      });
      resourcesRef.current = {
        context,
        format,
        uniformBuffer,
        eventBuffer,
        renderPipeline,
        bindGroup,
        width: 0,
        height: 0,
        device,
      };
      setGpuReady(true);
    };
    void initGpu();
    return () => {
      cancelled = true;
      const resources = resourcesRef.current;
      if (resources) {
        try {
          resources.uniformBuffer.destroy();
          resources.eventBuffer.destroy();
        } catch {
          // destroy() can throw if the device was already lost
        }
      }
      resourcesRef.current = null;
      setGpuReady(false);
    };
  }, [maxEvents]);

  useFrame(gpuReady && !isSuspended ? (nowSec) => {
    const resources = resourcesRef.current;
    const canvas = canvasRef.current;
    if (!resources || !canvas) return;
    const nowMs = nowSec * 1000;
    if (!startTimeRef.current) {
      startTimeRef.current = nowMs;
    }
    const duration = Math.max(50, durationMs);
    const elapsed = nowMs - (startTimeRef.current ?? nowMs);
    const playhead = ((elapsed % duration) + duration) % duration / duration;
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (width !== resources.width || height !== resources.height) {
      canvas.width = width;
      canvas.height = height;
      resources.context.configure({
        device: resources.device,
        format: resources.format,
        alphaMode: "premultiplied",
      });
      resources.width = width;
      resources.height = height;
    }
    const minDim = Math.max(1, Math.min(width, height));
    const radius = eventRadius / minDim;
    const colorAData = parseHexColor(safeColorA, [1, 1, 1]);
    const colorBData = parseHexColor(safeColorB, [0, 0, 0]);
    const events = eventsRef.current;
    const buffer = eventsBufferRef.current;
    const range = Math.max(1, resolvedMaxNote - resolvedMinNote);
    const eventCount = Math.min(events.length, maxEventsRef.current);
    for (let i = 0; i < eventCount; i += 1) {
      const event = events[events.length - eventCount + i];
      const t = ((event.timeMs - (startTimeRef.current ?? event.timeMs)) % duration + duration) % duration / duration;
      const normalized = 1 - Math.min(1, Math.max(0, (event.note - resolvedMinNote) / range));
      buffer[i * 2] = t;
      buffer[i * 2 + 1] = normalized;
    }
    const eventByteLength = eventCount * 2 * Float32Array.BYTES_PER_ELEMENT;
    resources.device.queue.writeBuffer(
      resources.eventBuffer,
      0,
      buffer.buffer,
      buffer.byteOffset,
      eventByteLength,
    );
    const uniforms = new Float32Array(UNIFORM_FLOAT_COUNT);
    uniforms[0] = width;
    uniforms[1] = height;
    uniforms[2] = playhead;
    uniforms[3] = radius;
    uniforms[4] = eventCount;
    uniforms[8] = colorAData[0];
    uniforms[9] = colorAData[1];
    uniforms[10] = colorAData[2];
    uniforms[11] = 1;
    uniforms[12] = colorBData[0];
    uniforms[13] = colorBData[1];
    uniforms[14] = colorBData[2];
    uniforms[15] = 1;
    resources.device.queue.writeBuffer(resources.uniformBuffer, 0, uniforms);
    const encoder = resources.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: resources.context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: colorBData[0], g: colorBData[1], b: colorBData[2], a: 1 },
        storeOp: "store",
      }],
    });
    pass.setPipeline(resources.renderPipeline);
    pass.setBindGroup(0, resources.bindGroup);
    pass.draw(6, 1, 0, 0);
    pass.end();
    resources.device.queue.submit([encoder.finish()]);
  } : null);

  const combinedStyle: React.CSSProperties = { ...style };
  (combinedStyle as Record<string, string>)["--ui-bits-color-a"] = safeColorA;
  (combinedStyle as Record<string, string>)["--ui-bits-color-b"] = safeColorB;
  (combinedStyle as Record<string, string>)["--seq-font-size"] = `${fontSize}px`;
  (combinedStyle as Record<string, string>)["--seq-header-height"] = `${unitSizePx}px`;
  (combinedStyle as Record<string, string>)["--seq-body-height"] = `${unitSizePx * resolvedHeightUnits}px`;
  (combinedStyle as Record<string, string>)["--seq-header-bg"] = safeColorB;
  (combinedStyle as Record<string, string>)["--seq-header-text"] = safeColorA;
  (combinedStyle as Record<string, string>)["--seq-border"] = safeColorA;
  (combinedStyle as Record<string, string>)["--seq-bg"] = safeColorB;

  return (
    <div
      className={["ui-bits-sequencer", className].filter(Boolean).join(" ")}
      style={combinedStyle}
      aria-label={ariaLabel}
    >
      <div className="ui-bits-sequencer__header">
        <div className="ui-bits-sequencer__header-inner">
          {header ?? null}
        </div>
      </div>
      <div className="ui-bits-sequencer__body">
        <canvas ref={canvasRef} className="ui-bits-sequencer__canvas" />
      </div>
      <div className="ui-bits-sequencer__footer">
        <div className="ui-bits-sequencer__footer-inner">
          {footer ?? null}
        </div>
      </div>
    </div>
  );
});

Sequencer.displayName = "Sequencer";

export default Sequencer;
