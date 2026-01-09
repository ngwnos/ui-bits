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
  divisions?: number;
  textWidth?: number;
  textSpacing?: number;
  spawnProbability?: number;
  tickMs?: number;
  className?: string;
}

const BRAND_TEXT = "ui-bits";
const MAX_BRAND_CHARS = 8;
const DEFAULT_TEXT_WIDTH = 1.6;
const DEFAULT_TICK_MS = 350;
const OFFSCREEN_ROWS = 5;

export default function DocsBrandCanvas({
  palette = ["#205EA6", "#879A39", "#D0A215", "#DA702C"],
  backgroundColor = "#1C1B1A",
  textColor = "#F2F0E5",
  divisions = 12,
  textWidth = DEFAULT_TEXT_WIDTH,
  textSpacing = 0.5,
  spawnProbability = 0.35,
  tickMs = DEFAULT_TICK_MS,
  className,
}: DocsBrandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<GPUCanvasContext | null>(null);
  const pipelineRef = useRef<GPURenderPipeline | null>(null);
  const uniformBufferRef = useRef<GPUBuffer | null>(null);
  const bindGroupRef = useRef<GPUBindGroup | null>(null);
  const bindGroupTexturesRef = useRef<{ atlas?: GPUTexture; grid?: GPUTexture } | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const paramsRef = useRef({
    backgroundColor,
    textColor,
    divisions,
    textWidth,
    textSpacing,
    spawnProbability,
    tickMs,
  });
  const paletteRef = useRef<Array<[number, number, number]>>([]);
  const gridRef = useRef<{
    size: number;
    data: Uint8Array<ArrayBuffer>;
    scratch: Uint8Array<ArrayBuffer>;
    texture: GPUTexture;
    nextShiftMs: number;
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
      divisions,
      textWidth,
      textSpacing,
      spawnProbability,
      tickMs,
    };
  }, [backgroundColor, textColor, divisions, textWidth, textSpacing, spawnProbability, tickMs]);

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
    if (startTimeRef.current == null) {
      startTimeRef.current = performance.now();
    }

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

      if (!pipelineRef.current) {
        const shaderModule = device.createShaderModule({
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
  indices0 : vec4<f32>,
  indices1 : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var brandSampler : sampler;
@group(0) @binding(2) var brandAtlas : texture_2d<f32>;
@group(0) @binding(3) var gridAtlas : texture_2d<f32>;

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
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let div = max(uniforms.params.x, 1.0);
  let cell = floor(in.uv * div);
  let offscreen = ${OFFSCREEN_ROWS}.0;
  let cellUv = vec2<f32>(
    (cell.x + 0.5) / div,
    (cell.y + 0.5 + offscreen) / (div + offscreen)
  );
  let cellSample = textureSample(gridAtlas, brandSampler, cellUv);
  let cellOn = step(0.5, cellSample.a);
  let baseColor = uniforms.backgroundColor.xyz * (1.0 - cellOn) + cellSample.rgb * cellOn;

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
  let finalColor = baseColor * (1.0 - glyphMask) + uniforms.textColor.xyz * glyphMask;
  return vec4<f32>(finalColor, 1.0);
}
`,
        });

        pipelineRef.current = device.createRenderPipeline({
          layout: "auto",
          vertex: { module: shaderModule, entryPoint: "vs_main" },
          fragment: { module: shaderModule, entryPoint: "fs_main", targets: [{ format }] },
          primitive: { topology: "triangle-list" },
        });
      }

      if (!uniformBufferRef.current) {
        uniformBufferRef.current = device.createBuffer({
          size: Float32Array.BYTES_PER_ELEMENT * 24,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }

      const ensureGrid = (size: number) => {
        const rounded = Math.max(1, Math.round(size));
        if (gridRef.current && gridRef.current.size === rounded) return;
        const totalRows = rounded + OFFSCREEN_ROWS;
        const totalCells = rounded * totalRows;
        const data = new Uint8Array(totalCells * 4);
        const probability = paramsRef.current.spawnProbability;
        const paletteColors = paletteRef.current.length ? paletteRef.current : [[255, 255, 255]];
        for (let i = 0; i < totalCells; i += 1) {
          const on = Math.random() < probability;
          const base = i * 4;
          if (on) {
            const color = paletteColors[Math.floor(Math.random() * paletteColors.length)];
            data[base] = color[0];
            data[base + 1] = color[1];
            data[base + 2] = color[2];
            data[base + 3] = 255;
          } else {
            data[base] = 0;
            data[base + 1] = 0;
            data[base + 2] = 0;
            data[base + 3] = 0;
          }
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
          scratch,
          texture,
          nextShiftMs: now + tick,
        };
        bindGroupRef.current = null;
        bindGroupTexturesRef.current = null;
      };

      const stepFall = (grid: NonNullable<typeof gridRef.current>, probability: number) => {
        const rowBytes = grid.size * 4;
        const totalRows = grid.size + OFFSCREEN_ROWS;
        for (let y = totalRows - 1; y > 0; y -= 1) {
          const dst = y * rowBytes;
          const src = (y - 1) * rowBytes;
          grid.data.copyWithin(dst, src, src + rowBytes);
        }
        const paletteColors = paletteRef.current.length ? paletteRef.current : [[255, 255, 255]];
        for (let x = 0; x < grid.size; x += 1) {
          const base = x * 4;
          const on = Math.random() < probability;
          if (on) {
            const color = paletteColors[Math.floor(Math.random() * paletteColors.length)];
            grid.data[base] = color[0];
            grid.data[base + 1] = color[1];
            grid.data[base + 2] = color[2];
            grid.data[base + 3] = 255;
          } else {
            grid.data[base] = 0;
            grid.data[base + 1] = 0;
            grid.data[base + 2] = 0;
            grid.data[base + 3] = 0;
          }
        }
      };

      const stepLife = (grid: NonNullable<typeof gridRef.current>) => {
        const { size, data, scratch } = grid;
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
                if (data[idx + 3] > 0) count += 1;
              }
            }
            const idx = (y * size + x) * 4;
            const alive = data[idx + 3] > 0;
            const survives = alive && (count === 2 || count === 3);
            const born = !alive && count === 3;
            if (survives) {
              scratch[idx] = data[idx];
              scratch[idx + 1] = data[idx + 1];
              scratch[idx + 2] = data[idx + 2];
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
                  if (data[nidx + 3] > 0) {
                    sumR += data[nidx];
                    sumG += data[nidx + 1];
                    sumB += data[nidx + 2];
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
        grid.data.set(scratch);
      };

      const updateGrid = (nowMs: number) => {
        const grid = gridRef.current;
        if (!grid) return;
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
        if (updated) {
          device.queue.writeTexture(
            { texture: grid.texture },
            grid.data,
            { bytesPerRow: grid.size * 4 },
            { width: grid.size, height: grid.size + OFFSCREEN_ROWS },
          );
        }
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

        const encoder = device.createCommandEncoder();
        const { backgroundColor: bgColor, textColor: fgColor, divisions: div, textWidth: textScale, textSpacing: spacing } = paramsRef.current;
        const background = parseHexColor(bgColor);
        const text = parseHexColor(fgColor);
        const time = (nowMs - (startTimeRef.current ?? nowMs)) / 1000;
        const atlas = atlasRef.current;
        if (!atlas) return;
        ensureGrid(div);
        updateGrid(nowMs);
        const grid = gridRef.current;
        if (!grid) return;
        const bindTextures = bindGroupTexturesRef.current;
        if (!bindGroupRef.current || !bindTextures || bindTextures.atlas !== atlas.texture || bindTextures.grid !== grid.texture) {
          bindGroupRef.current = device.createBindGroup({
            layout: pipelineRef.current!.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: uniformBufferRef.current! },
              },
              {
                binding: 1,
                resource: atlas.sampler,
              },
              {
                binding: 2,
                resource: atlas.texture.createView(),
              },
              {
                binding: 3,
                resource: grid.texture.createView(),
              },
            ],
          });
          bindGroupTexturesRef.current = { atlas: atlas.texture, grid: grid.texture };
        }
        const indices = [...atlas.indices];
        while (indices.length < MAX_BRAND_CHARS) indices.push(0);
        const params = new Float32Array([
          background[0], background[1], background[2], 1,
          text[0], text[1], text[2], 1,
          Math.max(1, div), time, atlas.charCount, spacing,
          textScale, atlas.glyphAspect, atlas.cols, atlas.rows,
          indices[0], indices[1], indices[2], indices[3],
          indices[4], indices[5], indices[6], indices[7],
        ]);
        device.queue.writeBuffer(uniformBufferRef.current!, 0, params);
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
        pass.setPipeline(pipelineRef.current!);
        pass.setBindGroup(0, bindGroupRef.current!);
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
