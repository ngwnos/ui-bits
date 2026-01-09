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
  leftColor?: string;
  rightColor?: string;
  divisions?: number;
  ditherWidth?: number;
  ditherStrength?: number;
  seed?: number;
  className?: string;
}

export default function DocsBrandCanvas({
  leftColor = "#1C1B1A",
  rightColor = "#282726",
  divisions = 12,
  ditherWidth = 0.18,
  ditherStrength = 0.65,
  seed = 0,
  className,
}: DocsBrandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<GPUCanvasContext | null>(null);
  const pipelineRef = useRef<GPURenderPipeline | null>(null);
  const uniformBufferRef = useRef<GPUBuffer | null>(null);
  const bindGroupRef = useRef<GPUBindGroup | null>(null);
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

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

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

      if (!pipelineRef.current) {
        const shaderModule = device.createShaderModule({
          code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

struct Uniforms {
  colorLeft : vec4<f32>,
  colorRight : vec4<f32>,
  params : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

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

fn hash(p: vec2<f32>, seed: f32) -> f32 {
  return fract(sin(dot(p + vec2<f32>(seed), vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let div = max(uniforms.params.x, 1.0);
  let cell = floor(in.uv * div);
  let cellUv = (cell + vec2<f32>(0.5)) / div;
  let isRight = cellUv.x >= 0.5;
  var useRight = isRight;
  let ditherWidth = uniforms.params.y;
  let ditherStrength = uniforms.params.z;
  if (ditherWidth > 0.0 && ditherStrength > 0.0) {
    let dist = abs(cellUv.x - 0.5);
    let t = clamp(1.0 - dist / ditherWidth, 0.0, 1.0);
    let chance = t * ditherStrength;
    let noise = hash(cell, uniforms.params.w);
    if (noise < chance) {
      useRight = !useRight;
    }
  }
  let color = select(uniforms.colorLeft.xyz, uniforms.colorRight.xyz, useRight);
  return vec4<f32>(color, 1.0);
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
          size: Float32Array.BYTES_PER_ELEMENT * 12,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
      }

      if (!bindGroupRef.current) {
        bindGroupRef.current = device.createBindGroup({
          layout: pipelineRef.current.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBufferRef.current },
            },
          ],
        });
      }

      const render = () => {
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
        const left = parseHexColor(leftColor);
        const right = parseHexColor(rightColor);
        const params = new Float32Array([
          left[0], left[1], left[2], 1,
          right[0], right[1], right[2], 1,
          Math.max(1, divisions), ditherWidth, ditherStrength, seed,
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

      render();

      resizeObserver = new ResizeObserver(() => render());
      resizeObserver.observe(canvas);
      window.addEventListener("resize", render);

      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener("resize", render);
      };
    };

    const cleanupPromise = run();
    return () => {
      disposed = true;
      cleanupPromise?.then((cleanup) => cleanup?.());
    };
  }, [ditherStrength, ditherWidth, divisions, leftColor, rightColor, seed]);

  return <canvas ref={canvasRef} className={className ?? "docs-brand-canvas"} />;
}
