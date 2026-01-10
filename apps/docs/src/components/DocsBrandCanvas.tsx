import { useEffect, useRef } from "react";
import tgpu from "typegpu";

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

async function getSharedRoot(): Promise<TypeGpuRoot | null> {
  if (!navigator.gpu) return null;
  if (sharedRoot) return sharedRoot;
  if (!sharedRootPromise) {
    sharedRootPromise = tgpu.init().then((root) => {
      sharedRoot = root;
      return root;
    }).catch((error) => {
      console.error("DocsBrandCanvas: TypeGPU init failed", error);
      sharedRootPromise = null;
      return null;
    });
  }
  return sharedRootPromise;
}

export interface DocsBrandCanvasProps {
  palette?: string[];
  backgroundColor?: string;
  textColor?: string;
  textBlur?: number;
  textGain?: number;
  divisions?: number;
  textWidth?: number;
  textSpacing?: number;
  spawnProbability?: number;
  tickMs?: number;
  colorAttack?: number;
  colorRelease?: number;
  colorCycleMs?: number;
  className?: string;
}

const BRAND_TEXT = "ui-bits";
const MAX_BRAND_CHARS = 8;
const DEFAULT_TEXT_WIDTH = 1.6;
const DEFAULT_TEXT_BLUR = 0;
const DEFAULT_TEXT_GAIN = 2;
const DEFAULT_TICK_MS = 350;
const DEFAULT_COLOR_CYCLE_MS = 2000;
const OFFSCREEN_ROWS = 5;

export default function DocsBrandCanvas({
  palette = ["#205EA6", "#879A39", "#D0A215", "#DA702C"],
  backgroundColor = "#1C1B1A",
  textColor = "#F2F0E5",
  textBlur = DEFAULT_TEXT_BLUR,
  textGain = DEFAULT_TEXT_GAIN,
  divisions = 12,
  textWidth = DEFAULT_TEXT_WIDTH,
  textSpacing = 0.5,
  spawnProbability = 0.35,
  tickMs = DEFAULT_TICK_MS,
  colorAttack = 6,
  colorRelease = 10,
  colorCycleMs = DEFAULT_COLOR_CYCLE_MS,
  className,
}: DocsBrandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<GPUCanvasContext | null>(null);
  const scenePipelineRef = useRef<GPURenderPipeline | null>(null);
  const blurPipelineRef = useRef<GPURenderPipeline | null>(null);
  const compositePipelineRef = useRef<GPURenderPipeline | null>(null);
  const uniformBufferRef = useRef<GPUBuffer | null>(null);
  const sceneBindGroupRef = useRef<GPUBindGroup | null>(null);
  const sceneBindGroupTexturesRef = useRef<{ grid?: GPUTexture } | null>(null);
  const blurSourceBindGroupRef = useRef<GPUBindGroup | null>(null);
  const blurSourceBindGroupTexturesRef = useRef<{ grid?: GPUTexture } | null>(null);
  const blurBindGroupsRef = useRef<{
    scene?: GPUTexture;
    blurA?: GPUTexture;
    horizontal?: GPUBindGroup;
    vertical?: GPUBindGroup;
  } | null>(null);
  const compositeBindGroupRef = useRef<GPUBindGroup | null>(null);
  const compositeBindGroupTexturesRef = useRef<{
    atlas?: GPUTexture;
    scene?: GPUTexture;
    blur?: GPUTexture;
  } | null>(null);
  const offscreenRef = useRef<{
    width: number;
    height: number;
    scene: GPUTexture;
    blurA: GPUTexture;
    blurB: GPUTexture;
  } | null>(null);
  const gridSamplerRef = useRef<GPUSampler | null>(null);
  const gridBlurSamplerRef = useRef<GPUSampler | null>(null);
  const blurSamplerRef = useRef<GPUSampler | null>(null);
  const paramsRef = useRef({
    backgroundColor,
    textColor,
    textBlur,
    textGain,
    divisions,
    textWidth,
    textSpacing,
    spawnProbability,
    tickMs,
    colorAttack,
    colorRelease,
    colorCycleMs,
  });
  const paletteRef = useRef<Array<[number, number, number]>>([]);
  const gridRef = useRef<{
    size: number;
    data: Uint8Array<ArrayBuffer>;
    target: Uint8Array<ArrayBuffer>;
    current: Float32Array;
    lastUpdateMs: number;
    scratch: Uint8Array<ArrayBuffer>;
    texture: GPUTexture;
    nextShiftMs: number;
    colorCycleIndex: number;
    nextColorCycleMs: number;
  } | null>(null);
  const atlasRef = useRef<{
    texture: GPUTexture;
    sampler: GPUSampler;
    indices: number[];
    cols: number;
    rows: number;
    glyphAspect: number;
    charCount: number;
  } | null>(null);
  const configuredSizeRef = useRef<{ width: number; height: number } | null>(null);

  const parseHexColor = (color: string): [number, number, number] => {
    const normalized = color.trim();
    if (normalized.startsWith("#")) {
      if (normalized.length === 7) {
        return [
          Number.parseInt(normalized.slice(1, 3), 16) / 255,
          Number.parseInt(normalized.slice(3, 5), 16) / 255,
          Number.parseInt(normalized.slice(5, 7), 16) / 255,
        ];
      }
      if (normalized.length === 4) {
        return [
          Number.parseInt(normalized[1] + normalized[1], 16) / 255,
          Number.parseInt(normalized[2] + normalized[2], 16) / 255,
          Number.parseInt(normalized[3] + normalized[3], 16) / 255,
        ];
      }
    }
    return [0, 0, 0];
  };

  const parseHexBytes = (color: string): [number, number, number] => {
    const [r, g, b] = parseHexColor(color);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  const buildAtlas = async (device: GPUDevice) => {
    if (typeof document === "undefined") return null;
    if ("fonts" in document) {
      await document.fonts.load('600 48px "IBM Plex Mono"');
      await document.fonts.ready;
    }
    const glyphs = Array.from(new Set(Array.from(BRAND_TEXT)));
    const charCount = Math.min(BRAND_TEXT.length, MAX_BRAND_CHARS);
    const cellSize = 56;
    const cols = glyphs.length;
    const rows = 1;
    const canvas = document.createElement("canvas");
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 40px "IBM Plex Mono"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    glyphs.forEach((glyph, index) => {
      const x = index * cellSize + cellSize / 2;
      const y = cellSize / 2;
      ctx.fillText(glyph, x, y);
    });
    const texture = device.createTexture({
      size: { width: canvas.width, height: canvas.height },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: canvas },
      { texture },
      { width: canvas.width, height: canvas.height },
    );
    const sampler = device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
    });
    const indices = Array.from(BRAND_TEXT).slice(0, MAX_BRAND_CHARS).map((glyph) => glyphs.indexOf(glyph));
    return {
      texture,
      sampler,
      indices,
      cols,
      rows,
      glyphAspect: 1,
      charCount,
    };
  };

  useEffect(() => {
    paramsRef.current = {
      backgroundColor,
      textColor,
      textBlur,
      textGain,
      divisions,
      textWidth,
      textSpacing,
      spawnProbability,
      tickMs,
      colorAttack,
      colorRelease,
      colorCycleMs,
    };
  }, [
    backgroundColor,
    textColor,
    textBlur,
    textGain,
    divisions,
    textWidth,
    textSpacing,
    spawnProbability,
    tickMs,
    colorAttack,
    colorRelease,
    colorCycleMs,
  ]);

  useEffect(() => {
    const fallback: [number, number, number] = [255, 255, 255];
    const colors: Array<[number, number, number]> = palette.length
      ? palette.map(parseHexBytes)
      : [fallback];
    paletteRef.current = colors;
  }, [palette]);

  useEffect(() => {
    let disposed = false;
    let rafId = 0;
    const run = async () => {
      const root = await getSharedRoot();
      if (!root || disposed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const device = root.device;
      const format = navigator.gpu.getPreferredCanvasFormat();

      let context = contextRef.current;
      if (!context) {
        context = canvas.getContext("webgpu");
        contextRef.current = context;
      }
      if (!context) return;

      if (!atlasRef.current) {
        atlasRef.current = await buildAtlas(device);
      }
      if (!atlasRef.current) return;

      if (!scenePipelineRef.current || !blurPipelineRef.current || !compositePipelineRef.current) {
        const offscreenFormat = "rgba8unorm";
        const sceneModule = device.createShaderModule({
          code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

struct Uniforms {
  backgroundColor : vec4<f32>,
  textColor : vec4<f32>,
  params : vec4<f32>,
  textParams : vec4<f32>,
  screenParams : vec4<f32>,
  indices0 : vec4<f32>,
  indices1 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var gridSampler : sampler;
@group(0) @binding(2) var gridAtlas : texture_2d<f32>;

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

fn sampleGrid(uv: vec2<f32>) -> vec3<f32> {
  let div = max(uniforms.params.x, 1.0);
  let offscreen = ${OFFSCREEN_ROWS}.0;
  let clampedUv = clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0));
  let gridUv = vec2<f32>(
    clampedUv.x,
    (clampedUv.y * div + offscreen) / (div + offscreen)
  );
  let sample = textureSample(gridAtlas, gridSampler, gridUv);
  let cellOn = step(0.5, sample.a);
  return uniforms.backgroundColor.xyz * (1.0 - cellOn) + sample.rgb * cellOn;
}

@fragment
fn fs_scene(in: VertexOutput) -> @location(0) vec4<f32> {
  let baseColor = sampleGrid(in.uv);
  return vec4<f32>(baseColor, 1.0);
}
`,
        });

        scenePipelineRef.current = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: sceneModule, entryPoint: "vs_main" },
          fragment: { module: sceneModule, entryPoint: "fs_scene", targets: [{ format: offscreenFormat }] },
          primitive: { topology: "triangle-list" },
        });

        const blurModule = device.createShaderModule({
          code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

struct Uniforms {
  backgroundColor : vec4<f32>,
  textColor : vec4<f32>,
  params : vec4<f32>,
  textParams : vec4<f32>,
  screenParams : vec4<f32>,
  indices0 : vec4<f32>,
  indices1 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var blurSampler : sampler;
@group(0) @binding(2) var sourceTex : texture_2d<f32>;

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

@fragment
fn fs_blur(in: VertexOutput) -> @location(0) vec4<f32> {
  let blurPx = max(uniforms.screenParams.z, 0.0);
  if (blurPx <= 0.0) {
    return textureSample(sourceTex, blurSampler, in.uv);
  }
  let screenSize = max(uniforms.screenParams.xy, vec2<f32>(1.0));
  let dirY = step(0.5, uniforms.screenParams.w);
  let direction = vec2<f32>(1.0 - dirY, dirY);
  let stepUv = direction / screenSize;
  let sigma = max(blurPx, 0.001);
  let radius = min(blurPx, 64.0);
  var color = textureSample(sourceTex, blurSampler, in.uv);
  var weightSum = 1.0;
  for (var i = 1u; i <= 64u; i = i + 1u) {
    let x = f32(i);
    let gate = step(x, radius);
    let w = exp(-0.5 * (x * x) / (sigma * sigma)) * gate;
    color = color + textureSample(sourceTex, blurSampler, in.uv + stepUv * x) * w;
    color = color + textureSample(sourceTex, blurSampler, in.uv - stepUv * x) * w;
    weightSum = weightSum + 2.0 * w;
  }
  return color / weightSum;
}
`,
        });

        blurPipelineRef.current = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: blurModule, entryPoint: "vs_main" },
          fragment: { module: blurModule, entryPoint: "fs_blur", targets: [{ format: offscreenFormat }] },
          primitive: { topology: "triangle-list" },
        });

        const compositeModule = device.createShaderModule({
          code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

struct Uniforms {
  backgroundColor : vec4<f32>,
  textColor : vec4<f32>,
  params : vec4<f32>,
  textParams : vec4<f32>,
  screenParams : vec4<f32>,
  indices0 : vec4<f32>,
  indices1 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var brandSampler : sampler;
@group(0) @binding(2) var brandAtlas : texture_2d<f32>;
@group(0) @binding(3) var sceneSampler : sampler;
@group(0) @binding(4) var sceneTex : texture_2d<f32>;
@group(0) @binding(5) var blurSampler : sampler;
@group(0) @binding(6) var blurTex : texture_2d<f32>;

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

fn glyphIndex(i: u32) -> f32 {
  if (i < 4u) {
    return uniforms.indices0[i];
  }
  return uniforms.indices1[i - 4u];
}

@fragment
fn fs_composite(in: VertexOutput) -> @location(0) vec4<f32> {
  let baseColor = textureSample(sceneTex, sceneSampler, in.uv).xyz;

  let textWidth = uniforms.textParams.x;
  let glyphAspect = uniforms.textParams.y;
  let cols = max(uniforms.textParams.z, 1.0);
  let rows = max(uniforms.textParams.w, 1.0);
  let charCount = max(uniforms.params.z, 1.0);
  let spacing = clamp(uniforms.params.w, 0.0, 2.0);
  let glyphWidth = textWidth / charCount;
  let textHeight = glyphWidth / glyphAspect;
  let centerStep = glyphWidth * spacing;
  let totalWidth = glyphWidth + centerStep * max(0.0, charCount - 1.0);
  let textMin = vec2<f32>(0.5 - totalWidth * 0.5, 0.5 - textHeight * 0.5);
  let textMax = textMin + vec2<f32>(totalWidth, textHeight);
  let insideX = step(textMin.x, in.uv.x) * step(in.uv.x, textMax.x);
  let insideY = step(textMin.y, in.uv.y) * step(in.uv.y, textMax.y);
  let inside = insideX * insideY;
  let localY = clamp((in.uv.y - textMin.y) / textHeight, 0.0, 1.0);
  let halfCount = (charCount - 1.0) * 0.5;
  var glyphMask = 0.0;
  for (var i = 0u; i < 8u; i = i + 1u) {
    let glyphActive = step(f32(i), charCount - 1.0);
    let centerX = 0.5 + (f32(i) - halfCount) * centerStep;
    let glyphLocalX = (in.uv.x - centerX) / glyphWidth + 0.5;
    let insideGlyph = step(0.0, glyphLocalX) * step(glyphLocalX, 1.0);
    let glyph = glyphIndex(i);
    let glyphCol = glyph - floor(glyph / cols) * cols;
    let glyphRow = floor(glyph / cols);
    let glyphUv = vec2<f32>(
      (glyphCol + glyphLocalX) / cols,
      (glyphRow + localY) / rows
    );
    let sample = textureSample(brandAtlas, brandSampler, glyphUv);
    let localMask = step(0.2, sample.a) * inside * insideGlyph * glyphActive;
    glyphMask = max(glyphMask, localMask);
  }

  let blurredColor = textureSample(blurTex, blurSampler, in.uv).xyz;
  let textGain = clamp(uniforms.params.y, 0.0, 10.0);
  let boostedColor = clamp(blurredColor * textGain, vec3<f32>(0.0), vec3<f32>(1.0));
  let finalColor = baseColor * (1.0 - glyphMask) + boostedColor * glyphMask;
  return vec4<f32>(finalColor, 1.0);
}
`,
        });

        compositePipelineRef.current = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: compositeModule, entryPoint: "vs_main" },
          fragment: { module: compositeModule, entryPoint: "fs_composite", targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        });
      }

      if (!uniformBufferRef.current) {
        uniformBufferRef.current = device.createBuffer({
          size: Float32Array.BYTES_PER_ELEMENT * 28,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }

      const ensureGrid = (size: number) => {
        const rounded = Math.max(1, Math.round(size));
        if (gridRef.current && gridRef.current.size === rounded) return;
        const totalRows = rounded + OFFSCREEN_ROWS;
        const totalCells = rounded * totalRows;
        const data = new Uint8Array(totalCells * 4);
        const target = new Uint8Array(totalCells * 4);
        const current = new Float32Array(totalCells * 4);
        for (let i = 0; i < totalCells; i += 1) {
          const base = i * 4;
          data[base] = 0;
          data[base + 1] = 0;
          data[base + 2] = 0;
          data[base + 3] = 0;
          target[base] = 0;
          target[base + 1] = 0;
          target[base + 2] = 0;
          target[base + 3] = 0;
          current[base] = 0;
          current[base + 1] = 0;
          current[base + 2] = 0;
          current[base + 3] = 0;
        }
        const scratch = new Uint8Array(totalCells * 4);
        const texture = device.createTexture({
          size: { width: rounded, height: totalRows },
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        device.queue.writeTexture(
          { texture },
          data,
          { bytesPerRow: rounded * 4 },
          { width: rounded, height: totalRows },
        );
        const now = performance.now();
        const tick = Math.max(60, paramsRef.current.tickMs);
        gridRef.current = {
          size: rounded,
          data,
          target,
          current,
          lastUpdateMs: now,
          scratch,
          texture,
          nextShiftMs: now + tick,
          colorCycleIndex: 0,
          nextColorCycleMs: now + Math.max(0, paramsRef.current.colorCycleMs),
        };
        sceneBindGroupRef.current = null;
        sceneBindGroupTexturesRef.current = null;
        blurSourceBindGroupRef.current = null;
        blurSourceBindGroupTexturesRef.current = null;
      };

      const stepFall = (grid: NonNullable<typeof gridRef.current>, probability: number) => {
        const rowBytes = grid.size * 4;
        const totalRows = grid.size + OFFSCREEN_ROWS;
        for (let y = totalRows - 1; y > 0; y -= 1) {
          const dst = y * rowBytes;
          const src = (y - 1) * rowBytes;
          grid.target.copyWithin(dst, src, src + rowBytes);
        }
        const paletteColors = paletteRef.current.length ? paletteRef.current : [[255, 255, 255]];
        const paletteIndex = Math.abs(grid.colorCycleIndex) % paletteColors.length;
        const leftColor = paletteColors[paletteIndex] ?? [255, 255, 255];
        const rightColor = paletteColors[(paletteIndex + 1) % paletteColors.length] ?? leftColor;
        const splitAt = grid.size / 2;
        for (let x = 0; x < grid.size; x += 1) {
          const base = x * 4;
          const on = Math.random() < probability;
          if (on) {
            const color = x < splitAt ? leftColor : rightColor;
            grid.target[base] = color[0];
            grid.target[base + 1] = color[1];
            grid.target[base + 2] = color[2];
            grid.target[base + 3] = 255;
          } else {
            grid.target[base] = 0;
            grid.target[base + 1] = 0;
            grid.target[base + 2] = 0;
            grid.target[base + 3] = 0;
          }
        }
      };

      const updateColorCycle = (grid: NonNullable<typeof gridRef.current>, nowMs: number) => {
        const paletteColors = paletteRef.current.length ? paletteRef.current : [[255, 255, 255]];
        if (paletteColors.length < 2) return;
        const interval = Math.max(0, paramsRef.current.colorCycleMs);
        if (interval <= 0) return;
        if (!Number.isFinite(grid.nextColorCycleMs) || grid.nextColorCycleMs <= 0) {
          grid.nextColorCycleMs = nowMs + interval;
          return;
        }
        while (nowMs >= grid.nextColorCycleMs) {
          grid.colorCycleIndex = (grid.colorCycleIndex + 1) % paletteColors.length;
          grid.nextColorCycleMs += interval;
        }
      };

      const stepLife = (grid: NonNullable<typeof gridRef.current>) => {
        const { size, target, scratch } = grid;
        const totalRows = size + OFFSCREEN_ROWS;
        for (let y = 0; y < totalRows; y += 1) {
          for (let x = 0; x < size; x += 1) {
            let count = 0;
            for (let dy = -1; dy <= 1; dy += 1) {
              for (let dx = -1; dx <= 1; dx += 1) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                if (ny < 0 || ny >= totalRows) continue;
                const nx = (x + dx + size) % size;
                const idx = (ny * size + nx) * 4;
                if (target[idx + 3] > 0) count += 1;
              }
            }
            const idx = (y * size + x) * 4;
            const alive = target[idx + 3] > 0;
            const survives = alive && (count === 2 || count === 3);
            const born = !alive && count === 3;
            if (survives) {
              scratch[idx] = target[idx];
              scratch[idx + 1] = target[idx + 1];
              scratch[idx + 2] = target[idx + 2];
              scratch[idx + 3] = 255;
            } else if (born) {
              let sumR = 0;
              let sumG = 0;
              let sumB = 0;
              for (let dy = -1; dy <= 1; dy += 1) {
                for (let dx = -1; dx <= 1; dx += 1) {
                  if (dx === 0 && dy === 0) continue;
                  const ny = y + dy;
                  if (ny < 0 || ny >= totalRows) continue;
                  const nx = (x + dx + size) % size;
                  const nidx = (ny * size + nx) * 4;
                  if (target[nidx + 3] > 0) {
                    sumR += target[nidx];
                    sumG += target[nidx + 1];
                    sumB += target[nidx + 2];
                  }
                }
              }
              const denom = count || 1;
              scratch[idx] = Math.round(sumR / denom);
              scratch[idx + 1] = Math.round(sumG / denom);
              scratch[idx + 2] = Math.round(sumB / denom);
              scratch[idx + 3] = 255;
            } else {
              scratch[idx] = 0;
              scratch[idx + 1] = 0;
              scratch[idx + 2] = 0;
              scratch[idx + 3] = 0;
            }
          }
        }
        grid.target.set(scratch);
      };

      const updateGrid = (nowMs: number) => {
        const grid = gridRef.current;
        if (!grid) return;
        updateColorCycle(grid, nowMs);
        const { spawnProbability: probability } = paramsRef.current;
        let updated = false;
        let guard = 0;
        const tick = Math.max(60, paramsRef.current.tickMs);
        while (nowMs >= grid.nextShiftMs && guard < 120) {
          stepLife(grid);
          stepFall(grid, probability);
          grid.nextShiftMs += tick;
          updated = true;
          guard += 1;
        }
        return updated;
      };

      const updateCurrentColors = (nowMs: number) => {
        const grid = gridRef.current;
        if (!grid) return;
        const { colorAttack, colorRelease } = paramsRef.current;
        const dtMs = Math.max(0, nowMs - grid.lastUpdateMs);
        grid.lastUpdateMs = nowMs;
        const attackAlpha = Math.min(1, (colorAttack * dtMs) / 1000);
        const releaseAlpha = Math.min(1, (colorRelease * dtMs) / 1000);
        const totalCells = grid.size * (grid.size + OFFSCREEN_ROWS);
        for (let i = 0; i < totalCells; i += 1) {
          const base = i * 4;
          for (let c = 0; c < 4; c += 1) {
            const current = grid.current[base + c];
            const target = grid.target[base + c];
            if (current === target) continue;
            const alpha = target > current ? attackAlpha : releaseAlpha;
            grid.current[base + c] = current + (target - current) * alpha;
          }
          grid.data[base] = Math.round(grid.current[base]);
          grid.data[base + 1] = Math.round(grid.current[base + 1]);
          grid.data[base + 2] = Math.round(grid.current[base + 2]);
          grid.data[base + 3] = Math.round(grid.current[base + 3]);
        }
        device.queue.writeTexture(
          { texture: grid.texture },
          grid.data,
          { bytesPerRow: grid.size * 4 },
          { width: grid.size, height: grid.size + OFFSCREEN_ROWS },
        );
      };

      const render = (nowMs: number) => {
        if (disposed) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));
        if (!configuredSizeRef.current || configuredSizeRef.current.width !== width || configuredSizeRef.current.height !== height) {
          canvas.width = width;
          canvas.height = height;
          context!.configure({ device, format, alphaMode: "opaque" });
          configuredSizeRef.current = { width, height };
        }

        const ensureOffscreen = (targetWidth: number, targetHeight: number) => {
          const existing = offscreenRef.current;
          if (existing && existing.width === targetWidth && existing.height === targetHeight) return;
          const usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
          const createTexture = () => device.createTexture({
            size: { width: targetWidth, height: targetHeight },
            format: "rgba8unorm",
            usage,
          });
          offscreenRef.current = {
            width: targetWidth,
            height: targetHeight,
            scene: createTexture(),
            blurA: createTexture(),
            blurB: createTexture(),
          };
          blurBindGroupsRef.current = null;
          compositeBindGroupRef.current = null;
          compositeBindGroupTexturesRef.current = null;
        };

        ensureOffscreen(width, height);
        const offscreen = offscreenRef.current;
        if (!offscreen) return;

        const encoder = device.createCommandEncoder();
        const {
          backgroundColor: bgColor,
          textColor: fgColor,
          textBlur,
          textGain,
          divisions: div,
          textWidth: textScale,
          textSpacing: spacing,
        } = paramsRef.current;
        const background = parseHexColor(bgColor);
        const text = parseHexColor(fgColor);
        const atlas = atlasRef.current;
        if (!atlas) return;
        ensureGrid(div);
        updateGrid(nowMs);
        updateCurrentColors(nowMs);
        const grid = gridRef.current;
        if (!grid) return;
        if (!gridSamplerRef.current) {
          gridSamplerRef.current = device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
          });
        }
        if (!gridBlurSamplerRef.current) {
          gridBlurSamplerRef.current = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
          });
        }
        if (!blurSamplerRef.current) {
          blurSamplerRef.current = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
          });
        }
        const sceneTextures = sceneBindGroupTexturesRef.current;
        if (!sceneBindGroupRef.current || !sceneTextures || sceneTextures.grid !== grid.texture) {
          sceneBindGroupRef.current = device.createBindGroup({
            layout: scenePipelineRef.current!.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBufferRef.current! } },
              { binding: 1, resource: gridSamplerRef.current! },
              { binding: 2, resource: grid.texture.createView() },
            ],
          });
          sceneBindGroupTexturesRef.current = { grid: grid.texture };
        }
        const blurSourceTextures = blurSourceBindGroupTexturesRef.current;
        if (!blurSourceBindGroupRef.current || !blurSourceTextures || blurSourceTextures.grid !== grid.texture) {
          blurSourceBindGroupRef.current = device.createBindGroup({
            layout: scenePipelineRef.current!.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBufferRef.current! } },
              { binding: 1, resource: gridBlurSamplerRef.current! },
              { binding: 2, resource: grid.texture.createView() },
            ],
          });
          blurSourceBindGroupTexturesRef.current = { grid: grid.texture };
        }
        const blurGroups = blurBindGroupsRef.current;
        if (!blurGroups || blurGroups.scene !== offscreen.blurA || blurGroups.blurA !== offscreen.blurB) {
          blurBindGroupsRef.current = {
            scene: offscreen.blurA,
            blurA: offscreen.blurB,
            horizontal: device.createBindGroup({
              layout: blurPipelineRef.current!.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer: uniformBufferRef.current! } },
                { binding: 1, resource: blurSamplerRef.current! },
                { binding: 2, resource: offscreen.blurA.createView() },
              ],
            }),
            vertical: device.createBindGroup({
              layout: blurPipelineRef.current!.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer: uniformBufferRef.current! } },
                { binding: 1, resource: blurSamplerRef.current! },
                { binding: 2, resource: offscreen.blurB.createView() },
              ],
            }),
          };
        }
        const compositeTextures = compositeBindGroupTexturesRef.current;
        if (!compositeBindGroupRef.current
          || !compositeTextures
          || compositeTextures.atlas !== atlas.texture
          || compositeTextures.scene !== offscreen.scene
          || compositeTextures.blur !== offscreen.blurA
        ) {
          compositeBindGroupRef.current = device.createBindGroup({
            layout: compositePipelineRef.current!.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBufferRef.current! } },
              { binding: 1, resource: atlas.sampler },
              { binding: 2, resource: atlas.texture.createView() },
              { binding: 3, resource: gridSamplerRef.current! },
              { binding: 4, resource: offscreen.scene.createView() },
              { binding: 5, resource: blurSamplerRef.current! },
              { binding: 6, resource: offscreen.blurA.createView() },
            ],
          });
          compositeBindGroupTexturesRef.current = {
            atlas: atlas.texture,
            scene: offscreen.scene,
            blur: offscreen.blurA,
          };
        }
        const indices = [...atlas.indices];
        while (indices.length < MAX_BRAND_CHARS) indices.push(0);
        const params = new Float32Array([
          background[0], background[1], background[2], 1,
          text[0], text[1], text[2], 1,
          Math.max(1, div), textGain, atlas.charCount, spacing,
          textScale, atlas.glyphAspect, atlas.cols, atlas.rows,
          width, height, textBlur, 0,
          indices[0], indices[1], indices[2], indices[3],
          indices[4], indices[5], indices[6], indices[7],
        ]);
        device.queue.writeBuffer(uniformBufferRef.current!, 0, params);
        const screenParamsOffset = Float32Array.BYTES_PER_ELEMENT * 16;
        const screenParams = new Float32Array([width, height, textBlur, 0]);
        device.queue.writeBuffer(uniformBufferRef.current!, screenParamsOffset, screenParams);
        const scenePass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: offscreen.scene.createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            },
          ],
        });
        scenePass.setPipeline(scenePipelineRef.current!);
        scenePass.setBindGroup(0, sceneBindGroupRef.current!);
        scenePass.draw(6, 1, 0, 0);
        scenePass.end();

        const blurSourcePass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: offscreen.blurA.createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            },
          ],
        });
        blurSourcePass.setPipeline(scenePipelineRef.current!);
        blurSourcePass.setBindGroup(0, blurSourceBindGroupRef.current!);
        blurSourcePass.draw(6, 1, 0, 0);
        blurSourcePass.end();

        const blurPassH = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: offscreen.blurB.createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            },
          ],
        });
        blurPassH.setPipeline(blurPipelineRef.current!);
        blurPassH.setBindGroup(0, blurBindGroupsRef.current!.horizontal!);
        blurPassH.draw(6, 1, 0, 0);
        blurPassH.end();

        screenParams[3] = 1;
        device.queue.writeBuffer(uniformBufferRef.current!, screenParamsOffset, screenParams);
        const blurPassV = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: offscreen.blurA.createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            },
          ],
        });
        blurPassV.setPipeline(blurPipelineRef.current!);
        blurPassV.setBindGroup(0, blurBindGroupsRef.current!.vertical!);
        blurPassV.draw(6, 1, 0, 0);
        blurPassV.end();

        screenParams[3] = 0;
        device.queue.writeBuffer(uniformBufferRef.current!, screenParamsOffset, screenParams);
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context!.getCurrentTexture().createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
            },
          ],
        });
        pass.setPipeline(compositePipelineRef.current!);
        pass.setBindGroup(0, compositeBindGroupRef.current!);
        pass.draw(6, 1, 0, 0);
        pass.end();
        device.queue.submit([encoder.finish()]);
      };

      const loop = (nowMs: number) => {
        render(nowMs);
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    };

    const cleanupPromise = run();
    return () => {
      disposed = true;
      cleanupPromise?.then((cleanup) => cleanup?.());
    };
  }, []);

  return <canvas ref={canvasRef} className={className ?? "docs-brand-canvas"} />;
}
