import React from "react";
import tgpu from "typegpu";
import { usePanelTheme } from "../../panelGap";
import SegmentBar from "../SegmentBar";

export type ColorFieldPickerMode = "hsv" | "rgb" | "oklch";
export type ColorFieldPickerBorderStyle = "a" | "b" | "none";

export interface ColorFieldPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  mode?: ColorFieldPickerMode;
  defaultMode?: ColorFieldPickerMode;
  onModeChange?: (mode: ColorFieldPickerMode) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: ColorFieldPickerBorderStyle;
  fontSize?: number;
  heightUnits?: number;
  width?: number | string;
}

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const DEFAULT_COLOR = "#ffffff";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;
const DEFAULT_PICKER_HEIGHT_UNITS = 6;
const OKLCH_MAX_CHROMA = 0.4;

const LUT_WIDTH = 360;
const LUT_HEIGHT = 512;
const LUT_WORKGROUP_SIZE_X = 8;
const LUT_WORKGROUP_SIZE_Y = 8;
const UNIFORM_FLOAT_COUNT = 12;
const UNIFORM_BUFFER_SIZE = UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

type PointerMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
  planeHeight: number;
};

type CanvasMetrics = {
  width: number;
  height: number;
  barHeight: number;
};

type GpuStatus = "loading" | "ready" | "unsupported" | "error";

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;

let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

interface ColorFieldGpuResources {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  uniformBuffer: GPUBuffer;
  lutBuffer: GPUBuffer;
  computePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  computeBindGroup: GPUBindGroup;
  renderBindGroup: GPUBindGroup;
  width: number;
  height: number;
}

async function getSharedRoot(): Promise<TypeGpuRoot | null> {
  if (typeof navigator === "undefined" || !navigator.gpu) return null;
  if (sharedRoot) return sharedRoot;
  if (!sharedRootPromise) {
    sharedRootPromise = tgpu.init().then((root) => {
      sharedRoot = root;
      return root;
    }).catch((error) => {
      console.error("ColorFieldPicker: TypeGPU init failed", error);
      sharedRootPromise = null;
      return null;
    });
  }
  return sharedRootPromise;
}

function createColorFieldComputeShader() {
  return `
const LUT_WIDTH : u32 = ${LUT_WIDTH}u;
const LUT_HEIGHT : u32 = ${LUT_HEIGHT}u;
const OKLCH_MAX_CHROMA : f32 = ${OKLCH_MAX_CHROMA};

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

@compute @workgroup_size(${LUT_WORKGROUP_SIZE_X}, ${LUT_WORKGROUP_SIZE_Y}, 1)
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

function createColorFieldRenderShader() {
  return `
const LUT_WIDTH : u32 = ${LUT_WIDTH}u;
const LUT_HEIGHT : u32 = ${LUT_HEIGHT}u;
const OKLCH_MAX_CHROMA : f32 = ${OKLCH_MAX_CHROMA};
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

function disposeGpuResources(resources: ColorFieldGpuResources | null) {
  if (!resources) return;
  resources.uniformBuffer.destroy();
  resources.lutBuffer.destroy();
  resources.width = 0;
  resources.height = 0;
}

function buildGpuResources(device: GPUDevice, canvas: HTMLCanvasElement): ColorFieldGpuResources | null {
  if (typeof navigator === "undefined" || !navigator.gpu) return null;
  const context = canvas.getContext("webgpu");
  if (!context) return null;

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });

  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const lutBuffer = device.createBuffer({
    size: LUT_WIDTH * LUT_HEIGHT * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE,
  });

  const computeModule = device.createShaderModule({ code: createColorFieldComputeShader() });
  const renderModule = device.createShaderModule({ code: createColorFieldRenderShader() });

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module: computeModule, entryPoint: "cs_main" },
  });

  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: renderModule, entryPoint: "vs_main" },
    fragment: {
      module: renderModule,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
  });

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: lutBuffer } },
    ],
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: lutBuffer } },
    ],
  });

  const computeEncoder = device.createCommandEncoder();
  const computePass = computeEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeBindGroup);
  computePass.dispatchWorkgroups(
    Math.ceil(LUT_WIDTH / LUT_WORKGROUP_SIZE_X),
    Math.ceil(LUT_HEIGHT / LUT_WORKGROUP_SIZE_Y),
    1,
  );
  computePass.end();
  device.queue.submit([computeEncoder.finish()]);

  return {
    device,
    context,
    format,
    uniformBuffer,
    lutBuffer,
    computePipeline,
    renderPipeline,
    computeBindGroup,
    renderBindGroup,
    width: 0,
    height: 0,
  };
}

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function sliderUnitHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  const short = /^#([0-9a-fA-F]{3})$/;
  const long = /^#([0-9a-fA-F]{6})$/;
  const shortMatch = trimmed.match(short);
  if (shortMatch) {
    return `#${shortMatch[1].split("").map((char) => char + char).join("")}`;
  }
  if (long.test(trimmed)) return trimmed;
  return null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const hex = normalized.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
}

function clampHexValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(0xffffff, Math.max(0, Math.round(value)));
}

function intToHex(value: number) {
  const clamped = clampHexValue(value);
  return `#${clamped.toString(16).padStart(6, "0")}`;
}

function hsvToRgb(h: number, s: number, v: number) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const c = v * s;
  const hp = normalizedHue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp >= 1 && hp < 2) {
    r = x;
    g = c;
  } else if (hp >= 2 && hp < 3) {
    g = c;
    b = x;
  } else if (hp >= 3 && hp < 4) {
    g = x;
    b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x;
    b = c;
  } else if (hp >= 5 && hp < 6) {
    r = c;
    b = x;
  }
  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  if (delta !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / delta + 2) * 60;
        break;
      default:
        h = ((rn - gn) / delta + 4) * 60;
        break;
    }
  }
  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number) {
  const rgb = hsvToRgb(h, s, v);
  const value = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  return intToHex(value);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function clampByte(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function rgbToHex(r: number, g: number, b: number) {
  const red = clampByte(r);
  const green = clampByte(g);
  const blue = clampByte(b);
  const value = (red << 16) | (green << 8) | blue;
  return intToHex(value);
}

function srgbToLinear(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function rgbToOklch(r: number, g: number, b: number) {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + b2 * b2);
  const H = ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h: H };
}

function rgbToOklchWithHue(r: number, g: number, b: number, fallbackHue: number) {
  const next = rgbToOklch(r, g, b);
  if (next.c < 0.001) {
    return { ...next, h: fallbackHue };
  }
  return next;
}

function oklchToLinearRgb(l: number, c: number, h: number) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

function isOklchInGamut(l: number, c: number, h: number) {
  const rgb = oklchToLinearRgb(l, c, h);
  const epsilon = 0.0001;
  return rgb.r >= -epsilon && rgb.r <= 1 + epsilon
    && rgb.g >= -epsilon && rgb.g <= 1 + epsilon
    && rgb.b >= -epsilon && rgb.b <= 1 + epsilon;
}

function findMaxChroma(l: number, h: number, targetC: number) {
  if (isOklchInGamut(l, targetC, h)) return targetC;
  let lo = 0;
  let hi = targetC;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    if (isOklchInGamut(l, mid, h)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function oklchToRgb(l: number, c: number, h: number) {
  const rgb = oklchToLinearRgb(l, c, h);
  return {
    r: Math.round(linearToSrgb(rgb.r) * 255),
    g: Math.round(linearToSrgb(rgb.g) * 255),
    b: Math.round(linearToSrgb(rgb.b) * 255),
  };
}

function oklchToRgbGamutMapped(l: number, c: number, h: number) {
  if (isOklchInGamut(l, c, h)) return oklchToRgb(l, c, h);
  const mappedC = findMaxChroma(l, h, c);
  return oklchToRgb(l, mappedC, h);
}

function oklchToHex(l: number, c: number, h: number) {
  const rgb = oklchToRgbGamutMapped(l, c, h);
  const value = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  return intToHex(value);
}

const ColorFieldPicker = React.forwardRef<HTMLDivElement, ColorFieldPickerProps>((props, ref) => {
  const {
    value,
    defaultValue = DEFAULT_COLOR,
    onChange,
    mode,
    defaultMode = "oklch",
    onModeChange,
    colorA,
    colorB,
    borderStyle,
    fontSize,
    heightUnits,
    width,
    className,
    style,
    ...rest
  } = props;

  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedHeightUnits = Math.max(1, Math.round(heightUnits ?? DEFAULT_PICKER_HEIGHT_UNITS));
  const resolvedWidth = resolveSize(width);
  const fallbackValue = normalizeHex(defaultValue) ?? DEFAULT_COLOR;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const resolvedValue = normalizeHex(isControlled ? (value ?? "") : internalValue) ?? fallbackValue;

  const isModeControlled = mode !== undefined;
  const [internalMode, setInternalMode] = React.useState<ColorFieldPickerMode>(defaultMode);
  const resolvedMode = isModeControlled ? mode : internalMode;

  const commitValue = React.useCallback((nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  }, [isControlled, onChange]);

  const commitMode = React.useCallback((nextMode: ColorFieldPickerMode) => {
    if (!isModeControlled) {
      setInternalMode(nextMode);
    }
    onModeChange?.(nextMode);
  }, [isModeControlled, onModeChange]);

  const pickerHeight = sliderUnitHeight(resolvedFontSize) * resolvedHeightUnits;
  const borderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const borderRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));

  const supportsWebGPU = typeof navigator !== "undefined" && Boolean(navigator.gpu);
  const [gpuStatus, setGpuStatus] = React.useState<GpuStatus>(() => (supportsWebGPU ? "loading" : "unsupported"));
  const isGpuReady = gpuStatus === "ready";

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [canvasNode, setCanvasNode] = React.useState<HTMLCanvasElement | null>(null);
  const planeMarkerRef = React.useRef<HTMLDivElement | null>(null);
  const barMarkerRef = React.useRef<HTMLDivElement | null>(null);
  const resourcesRef = React.useRef<ColorFieldGpuResources | null>(null);
  const uniformArrayRef = React.useRef<Float32Array>(new Float32Array(UNIFORM_FLOAT_COUNT));

  const renderRafRef = React.useRef<number | null>(null);
  const renderNowRef = React.useRef<(() => void) | null>(null);

  const draggingRef = React.useRef(false);
  const activeRegionRef = React.useRef<"plane" | "hue" | null>(null);
  const pointerMetricsRef = React.useRef<PointerMetrics | null>(null);
  const lastPointerSampleRef = React.useRef<{
    x: number;
    y: number;
    region: "plane" | "hue";
    mode: ColorFieldPickerMode;
  } | null>(null);

  const [canvasMetrics, setCanvasMetrics] = React.useState<CanvasMetrics>({ width: 0, height: 0, barHeight: 0 });
  const canvasMetricsRef = React.useRef<CanvasMetrics>(canvasMetrics);
  const modeRef = React.useRef<ColorFieldPickerMode>(resolvedMode);
  const seedRgbRef = React.useRef(hexToRgb(resolvedValue) ?? { r: 255, g: 255, b: 255 });
  const rgbRef = React.useRef(seedRgbRef.current);
  const hsvRef = React.useRef(rgbToHsv(seedRgbRef.current.r, seedRgbRef.current.g, seedRgbRef.current.b));
  const oklchRef = React.useRef(rgbToOklch(seedRgbRef.current.r, seedRgbRef.current.g, seedRgbRef.current.b));

  const scheduleRender = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (renderRafRef.current !== null) return;
    renderRafRef.current = window.requestAnimationFrame(() => {
      renderRafRef.current = null;
      renderNowRef.current?.();
    });
  }, []);

  React.useEffect(() => {
    setGpuStatus((prev) => {
      if (!supportsWebGPU) return "unsupported";
      return prev === "unsupported" ? "loading" : prev;
    });
  }, [supportsWebGPU]);

  React.useEffect(() => {
    canvasMetricsRef.current = canvasMetrics;
  }, [canvasMetrics]);

  const updateMarkersNow = React.useCallback(() => {
    const planeMarker = planeMarkerRef.current;
    const barMarker = barMarkerRef.current;
    if (!planeMarker || !barMarker) return;
    const metrics = canvasMetricsRef.current;
    if (metrics.width <= 0 || metrics.height <= 0) {
      planeMarker.style.opacity = "0";
      barMarker.style.opacity = "0";
      return;
    }

    const planeMode = modeRef.current;
    const planeHeight = Math.max(1, metrics.height - metrics.barHeight);
    const planeX = planeMode === "oklch"
      ? clamp01(oklchRef.current.h / 360) * metrics.width
      : planeMode === "rgb"
        ? clamp01(rgbRef.current.r / 255) * metrics.width
        : clamp01(hsvRef.current.s) * metrics.width;
    const planeY = planeMode === "oklch"
      ? clamp01(1 - oklchRef.current.c / OKLCH_MAX_CHROMA) * planeHeight
      : planeMode === "rgb"
        ? clamp01(1 - rgbRef.current.g / 255) * planeHeight
        : clamp01(1 - hsvRef.current.v) * planeHeight;
    const barValue = planeMode === "oklch"
      ? oklchRef.current.l
      : planeMode === "rgb"
        ? rgbRef.current.b / 255
        : hsvRef.current.h / 360;
    const barX = clamp01(barValue) * metrics.width;

    planeMarker.style.left = `${planeX}px`;
    planeMarker.style.top = `${planeY}px`;
    planeMarker.style.opacity = "1";

    barMarker.style.left = `${barX}px`;
    barMarker.style.top = `${Math.max(1, metrics.height - metrics.barHeight) + metrics.barHeight / 2}px`;
    barMarker.style.opacity = "1";
  }, []);

  React.useEffect(() => {
    modeRef.current = resolvedMode;
    scheduleRender();
  }, [resolvedMode, scheduleRender]);

  React.useEffect(() => {
    if (draggingRef.current) return;
    const rgb = hexToRgb(resolvedValue);
    if (!rgb) return;
    const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hsvRef.current = nextHsv;
    rgbRef.current = rgb;
    const nextOklch = rgbToOklchWithHue(rgb.r, rgb.g, rgb.b, oklchRef.current.h);
    oklchRef.current = nextOklch;
    scheduleRender();
  }, [resolvedValue, scheduleRender]);

  const prevColorModeRef = React.useRef(resolvedMode);
  React.useEffect(() => {
    if (prevColorModeRef.current === resolvedMode) return;
    prevColorModeRef.current = resolvedMode;
    const rgb = hexToRgb(resolvedValue);
    if (!rgb) return;
    if (resolvedMode === "oklch") {
      const nextOklch = rgbToOklchWithHue(rgb.r, rgb.g, rgb.b, oklchRef.current.h);
      oklchRef.current = nextOklch;
    } else if (resolvedMode === "rgb") {
      rgbRef.current = rgb;
    } else {
      const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      hsvRef.current = nextHsv;
    }
    scheduleRender();
  }, [resolvedMode, resolvedValue, scheduleRender]);

  const renderCanvas = React.useCallback(() => {
    updateMarkersNow();
    if (typeof window === "undefined") return;
    const resources = resourcesRef.current;
    const canvas = canvasRef.current;
    if (!resources || !canvas) return;

    const metrics = canvasMetricsRef.current;
    if (metrics.width <= 0 || metrics.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const widthPx = Math.max(1, Math.round(metrics.width * dpr));
    const heightPx = Math.max(1, Math.round(metrics.height * dpr));
    const barHeightPx = Math.max(1, Math.round(metrics.barHeight * dpr));

    if (canvas.width !== widthPx || canvas.height !== heightPx) {
      canvas.width = widthPx;
      canvas.height = heightPx;
    }

    if (resources.width !== widthPx || resources.height !== heightPx) {
      resources.context.configure({
        device: resources.device,
        format: resources.format,
        alphaMode: "opaque",
      });
      resources.width = widthPx;
      resources.height = heightPx;
    }

    const modeValue = modeRef.current === "hsv"
      ? 0
      : modeRef.current === "rgb"
        ? 1
        : 2;

    const hue = modeRef.current === "oklch"
      ? oklchRef.current.h
      : modeRef.current === "hsv"
        ? hsvRef.current.h
        : 0;

    const uniforms = uniformArrayRef.current;
    uniforms[0] = widthPx;
    uniforms[1] = heightPx;
    uniforms[2] = barHeightPx;
    uniforms[3] = modeValue;

    uniforms[4] = oklchRef.current.l;
    uniforms[5] = oklchRef.current.c;
    uniforms[6] = rgbRef.current.r;
    uniforms[7] = rgbRef.current.g;

    uniforms[8] = rgbRef.current.b;
    uniforms[9] = hsvRef.current.s;
    uniforms[10] = hsvRef.current.v;
    uniforms[11] = hue;

    resources.device.queue.writeBuffer(
      resources.uniformBuffer,
      0,
      uniforms.buffer,
      uniforms.byteOffset,
      uniforms.byteLength,
    );

    const encoder = resources.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: resources.context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }],
    });
    pass.setPipeline(resources.renderPipeline);
    pass.setBindGroup(0, resources.renderBindGroup);
    pass.draw(6, 1, 0, 0);
    pass.end();

    resources.device.queue.submit([encoder.finish()]);
  }, [updateMarkersNow]);

  React.useEffect(() => {
    renderNowRef.current = renderCanvas;
    return () => {
      if (renderNowRef.current === renderCanvas) {
        renderNowRef.current = null;
      }
    };
  }, [renderCanvas]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!supportsWebGPU) {
      setGpuStatus("unsupported");
      return;
    }
    const canvas = canvasNode ?? canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let createdResources: ColorFieldGpuResources | null = null;
    setGpuStatus((prev) => (prev === "ready" ? prev : "loading"));

    const boot = async () => {
      const root = await getSharedRoot();
      if (cancelled) return;
      if (!root) {
        setGpuStatus("error");
        return;
      }
      const resources = buildGpuResources(root.device, canvas);
      if (cancelled) {
        disposeGpuResources(resources);
        return;
      }
      if (!resources) {
        setGpuStatus("error");
        return;
      }
      createdResources = resources;
      resourcesRef.current = resources;
      setGpuStatus("ready");
      scheduleRender();
    };

    void boot();

    return () => {
      cancelled = true;
      if (resourcesRef.current && resourcesRef.current === createdResources) {
        disposeGpuResources(resourcesRef.current);
        resourcesRef.current = null;
      }
    };
  }, [canvasNode, scheduleRender, supportsWebGPU]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasNode ?? canvasRef.current;
    if (!canvas) return;

    const updateMetrics = () => {
      const rect = canvas.getBoundingClientRect();
      const nextMetrics = {
        width: rect.width,
        height: rect.height,
        barHeight: sliderUnitHeight(resolvedFontSize),
      };
      setCanvasMetrics((prev) => (
        prev.width === nextMetrics.width
          && prev.height === nextMetrics.height
          && prev.barHeight === nextMetrics.barHeight
          ? prev
          : nextMetrics
      ));
      pointerMetricsRef.current = null;
      scheduleRender();
    };

    updateMetrics();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateMetrics);
      resizeObserver.observe(canvas);
    }

    window.addEventListener("resize", updateMetrics);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [canvasNode, resolvedFontSize, scheduleRender]);

  React.useEffect(() => {
    scheduleRender();
  }, [canvasMetrics, scheduleRender]);

  React.useEffect(() => (
    () => {
      if (typeof window !== "undefined" && renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
      renderRafRef.current = null;
      disposeGpuResources(resourcesRef.current);
      resourcesRef.current = null;
    }
  ), []);

  const handleCanvasRef = React.useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    setCanvasNode(node);
  }, []);

  const capturePointerMetrics = React.useCallback((): PointerMetrics | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const barHeight = canvasMetricsRef.current.barHeight || sliderUnitHeight(resolvedFontSize);
    const planeHeight = Math.max(1, rect.height - barHeight);
    const metrics = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      planeHeight,
    };
    pointerMetricsRef.current = metrics;
    return metrics;
  }, [resolvedFontSize]);

  const updateFromPointer = React.useCallback((clientX: number, clientY: number) => {
    const metrics = pointerMetricsRef.current ?? capturePointerMetrics();
    if (!metrics) return;
    const x = Math.min(Math.max(clientX - metrics.left, 0), metrics.width);
    const y = Math.min(Math.max(clientY - metrics.top, 0), metrics.height);
    const planeMode = modeRef.current;
    const region = activeRegionRef.current
      ?? (y >= metrics.planeHeight ? "hue" : "plane");

    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const prevSample = lastPointerSampleRef.current;
    if (
      prevSample
      && prevSample.x === roundedX
      && prevSample.y === roundedY
      && prevSample.region === region
      && prevSample.mode === planeMode
    ) {
      return;
    }

    lastPointerSampleRef.current = {
      x: roundedX,
      y: roundedY,
      region,
      mode: planeMode,
    };

    if (region === "plane") {
      if (planeMode === "oklch") {
        const ratioX = clamp01(metrics.width > 0 ? x / metrics.width : 0);
        const ratioY = clamp01(metrics.planeHeight > 0 ? y / metrics.planeHeight : 0);
        const next = {
          ...oklchRef.current,
          h: ratioX * 360,
          c: (1 - ratioY) * OKLCH_MAX_CHROMA,
        };
        oklchRef.current = next;
        commitValue(oklchToHex(next.l, next.c, next.h));
      } else if (planeMode === "rgb") {
        const ratioX = clamp01(metrics.width > 0 ? x / metrics.width : 0);
        const ratioY = clamp01(metrics.planeHeight > 0 ? y / metrics.planeHeight : 0);
        const next = {
          ...rgbRef.current,
          r: ratioX * 255,
          g: (1 - ratioY) * 255,
        };
        rgbRef.current = next;
        commitValue(rgbToHex(next.r, next.g, next.b));
      } else {
        const ratioX = clamp01(metrics.width > 0 ? x / metrics.width : 0);
        const ratioY = clamp01(metrics.planeHeight > 0 ? y / metrics.planeHeight : 0);
        const next = {
          ...hsvRef.current,
          s: ratioX,
          v: 1 - ratioY,
        };
        hsvRef.current = next;
        commitValue(hsvToHex(next.h, next.s, next.v));
      }
    } else if (planeMode === "oklch") {
      const next = {
        ...oklchRef.current,
        l: clamp01(metrics.width > 0 ? x / metrics.width : 0),
      };
      oklchRef.current = next;
      commitValue(oklchToHex(next.l, next.c, next.h));
    } else if (planeMode === "rgb") {
      const next = {
        ...rgbRef.current,
        b: clamp01(metrics.width > 0 ? x / metrics.width : 0) * 255,
      };
      rgbRef.current = next;
      commitValue(rgbToHex(next.r, next.g, next.b));
    } else {
      const next = {
        ...hsvRef.current,
        h: clamp01(metrics.width > 0 ? x / metrics.width : 0) * 360,
      };
      hsvRef.current = next;
      commitValue(hsvToHex(next.h, next.s, next.v));
    }

    scheduleRender();
  }, [capturePointerMetrics, commitValue, scheduleRender]);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!isGpuReady) return;
    if (event.button !== 0) return;
    const metrics = capturePointerMetrics();
    if (!metrics) return;
    lastPointerSampleRef.current = null;
    const y = Math.min(Math.max(event.clientY - metrics.top, 0), metrics.height);
    activeRegionRef.current = y >= metrics.planeHeight ? "hue" : "plane";
    draggingRef.current = true;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!isGpuReady) return;
    if (!draggingRef.current) return;
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    activeRegionRef.current = null;
    pointerMetricsRef.current = null;
    lastPointerSampleRef.current = null;
    try {
      (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const overlayMessage = gpuStatus === "unsupported"
    ? "WebGPU is required for this color picker."
    : gpuStatus === "error"
      ? "WebGPU initialization failed."
      : gpuStatus === "loading"
        ? "Initializing WebGPU..."
        : null;

  return (
    <div
      ref={ref}
      className={[
        "ui-bits-color-field-picker",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        width: resolvedWidth,
        height: pickerHeight,
        borderRadius,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor,
        background: resolvedColorA,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...(style ?? {}),
      }}
      {...rest}
    >
      <SegmentBar
        options={[
          { value: "hsv", label: "HSV" },
          { value: "rgb", label: "RGB" },
          { value: "oklch", label: "OKLCH" },
        ]}
        value={resolvedMode}
        onChange={(next) => commitMode(next as ColorFieldPickerMode)}
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        borderStyle={resolvedBorderStyle}
        borderMask={{ top: false, left: false, right: false, bottom: true }}
        fontSize={resolvedFontSize}
      />
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          touchAction: "none",
          cursor: isGpuReady ? "crosshair" : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas
          ref={handleCanvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            opacity: isGpuReady ? 1 : 0.5,
          }}
        />
        <div
          ref={planeMarkerRef}
          style={{
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
            display: isGpuReady ? "block" : "none",
          }}
        />
        <div
          ref={barMarkerRef}
          style={{
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
            display: isGpuReady ? "block" : "none",
          }}
        />
        {overlayMessage ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
              textAlign: "center",
              pointerEvents: "none",
              color: resolvedColorB,
              background: "rgba(0,0,0,0.35)",
              fontSize: Math.max(10, Math.round(resolvedFontSize * 0.9)),
              lineHeight: 1.2,
            }}
          >
            {overlayMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
});

ColorFieldPicker.displayName = "ColorFieldPicker";

export default ColorFieldPicker;
