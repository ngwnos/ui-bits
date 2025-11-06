import React from "react";
import tgpu from "typegpu";
import { MATPLOTLIB_GRADIENTS, buildPalette } from "../gradients/matplotlib";
import { loadHeightTexture } from "../utils/loadHeightTexture";

const TILE_URL = "/terrain/dem_tiles/tile_r00_c00.png";

export default function TypeGPUTest() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const gradientIndexRef = React.useRef<number>(0);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let root: Awaited<ReturnType<typeof tgpu.init>> | null = null;
    let resourceCleanup: (() => void) | null = null;

    gradientIndexRef.current = 0;
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    gradientIndexRef.current = 0;
    const updateGradientTexture = (device: GPUDevice, paletteTexture: GPUTexture, index: number) => {
      const definition = MATPLOTLIB_GRADIENTS[index % MATPLOTLIB_GRADIENTS.length];
      const palette = buildPalette(definition.stops, false);
      device.queue.writeTexture(
        { texture: paletteTexture },
        Uint8Array.from(palette.data),
        { bytesPerRow: 256 * 4 },
        [256, 1, 1],
      );
    };

    const run = async () => {
      if (!navigator.gpu) {
        setStatus("error");
        setMessage("WebGPU is not available in this browser.");
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      setStatus("loading");
      try {
        root = await tgpu.init();
        if (cancelled) {
          root.destroy();
          return;
        }
        const { device } = root;
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("Unable to acquire WebGPU context.");
        const format = navigator.gpu.getPreferredCanvasFormat();

        const heightEntry = await loadHeightTexture(device, TILE_URL);
        if (!heightEntry) throw new Error("Failed to load height tile");
        const { texture: heightTexture, width, height, min: heightMin, max: heightMax } = heightEntry;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        context.configure({
          device,
          format,
          alphaMode: "opaque",
        });

        const sampler = device.createSampler({
          magFilter: "nearest",
          minFilter: "nearest",
        });

        const gradientTexture = device.createTexture({
          size: [256, 1, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        updateGradientTexture(device, gradientTexture, gradientIndexRef.current);

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

struct RenderUniforms {
  params0 : vec4<f32>,
  params1 : vec4<f32>,
  params2 : vec4<f32>,
};

@group(0) @binding(0) var heightTexture : texture_2d<f32>;
@group(0) @binding(1) var tileSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;
@group(0) @binding(3) var<uniform> uniforms : RenderUniforms;

fn quantizeUv(uv : vec2<f32>, texelSize : vec2<f32>) -> vec2<i32> {
  let width = max(1, i32(round(1.0 / texelSize.x)));
  let height = max(1, i32(round(1.0 / texelSize.y)));
  let x = clamp(i32(round(uv.x * f32(width - 1))), 0, width - 1);
  let y = clamp(i32(round(uv.y * f32(height - 1))), 0, height - 1);
  return vec2<i32>(x, y);
}

fn sampleHeight(uv : vec2<f32>, texelSize : vec2<f32>) -> f32 {
  let coords = quantizeUv(uv, texelSize);
  return textureLoad(heightTexture, coords, 0).r;
}

fn safeSample(uv : vec2<f32>) -> vec2<f32> {
  return clamp(uv, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let useHillshade = uniforms.params0.x;
  let texelSize = uniforms.params0.yz;
  let heightScale = uniforms.params0.w;
  let lightDir = normalize(uniforms.params1.xyz);
  let heightMin = uniforms.params1.w;
  let heightRange = max(uniforms.params2.x, 1e-6);
  let ambient = uniforms.params2.y;
  let contrast = uniforms.params2.z;
  let uv = safeSample(in.uv);

  let offset = vec2<f32>(texelSize.x, texelSize.y);

  let hC = sampleHeight(uv, texelSize);
  let hN = sampleHeight(safeSample(vec2<f32>(uv.x, uv.y + offset.y)), texelSize);
  let hS = sampleHeight(safeSample(vec2<f32>(uv.x, uv.y - offset.y)), texelSize);
  let hE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y)), texelSize);
  let hW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y)), texelSize);
  let hNE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y + offset.y)), texelSize);
  let hNW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y + offset.y)), texelSize);
  let hSE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y - offset.y)), texelSize);
  let hSW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y - offset.y)), texelSize);

  let dzdx = ((hNE + 2.0 * hE + hSE) - (hNW + 2.0 * hW + hSW)) * heightScale;
  let dzdy = ((hSW + 2.0 * hS + hSE) - (hNW + 2.0 * hN + hNE)) * heightScale;

  let normal = normalize(vec3<f32>(-dzdx, -dzdy, 1.0));
  let shade = clamp(ambient + dot(normal, lightDir) * contrast, 0.0, 1.0);

  if (useHillshade > 0.5) {
    return vec4<f32>(shade, shade, shade, 1.0);
  }

  let normalizedHeight = clamp((hC - heightMin) / heightRange, 0.0, 1.0);
  let remapped = textureSample(gradientTexture, tileSampler, vec2<f32>(normalizedHeight, 0.5));
  return vec4<f32>(remapped.rgb, 1.0);
}
`,
        });

        const renderPipeline = device.createRenderPipeline({
          layout: "auto",
          vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
          },
          fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [{ format }],
          },
          primitive: { topology: "triangle-list" },
        });

        const texelSizeX = 1 / width;
        const texelSizeY = 1 / height;
        const cellSizeMeters = 3;
        const verticalExaggeration = 8;
        const heightScale = verticalExaggeration / (cellSizeMeters * 8);
        const altitude = 45 * Math.PI / 180;
        const azimuth = 315 * Math.PI / 180;
        const lightDir = [
          Math.sin(azimuth) * Math.cos(altitude),
          Math.cos(azimuth) * Math.cos(altitude),
          Math.sin(altitude),
        ];
        const heightRange = Math.max(1e-6, heightMax - heightMin);
        const ambient = 0.2;
        const contrast = 0.9;
        const uniformData = new Float32Array([
          1,
          texelSizeX,
          texelSizeY,
          heightScale,
          lightDir[0],
          lightDir[1],
          lightDir[2],
          heightMin,
          heightRange,
          ambient,
          contrast,
          0,
        ]);
        const uniformBuffer = device.createBuffer({
          size: uniformData.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        const renderBindGroup = device.createBindGroup({
          layout: renderPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: heightTexture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: gradientTexture.createView() },
            { binding: 3, resource: { buffer: uniformBuffer } },
          ],
        });

        resourceCleanup = () => {
          gradientTexture.destroy();
          uniformBuffer.destroy();
        };

        const render = () => {
          const commandEncoder = device.createCommandEncoder();
          const textureView = context.getCurrentTexture().createView();
          const pass = commandEncoder.beginRenderPass({
            colorAttachments: [{
              view: textureView,
              loadOp: "clear",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              storeOp: "store",
            }],
          });
          pass.setPipeline(renderPipeline);
          pass.setBindGroup(0, renderBindGroup);
          pass.draw(6, 1, 0, 0);
          pass.end();
          device.queue.submit([commandEncoder.finish()]);
        };

        render();
        setStatus("ready");
        setMessage(null);

        intervalRef.current = window.setInterval(() => {
          gradientIndexRef.current = (gradientIndexRef.current + 1) % MATPLOTLIB_GRADIENTS.length;
          updateGradientTexture(device, gradientTexture, gradientIndexRef.current);
          render();
        }, 1000);
      } catch (error) {
        console.error("Failed to initialize TypeGPU preview", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to initialize TypeGPU preview.");
        if (resourceCleanup) {
          resourceCleanup();
          resourceCleanup = null;
        }
        if (root) {
          root.destroy();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (resourceCleanup) {
        resourceCleanup();
        resourceCleanup = null;
      }
      if (root) {
        root.destroy();
        root = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          borderRadius: 6,
          boxShadow: status === "ready" ? "0 8px 24px rgba(0, 0, 0, 0.25)" : "none",
        }}
      />
      {status === "loading" && <p style={{ opacity: 0.75 }}>Loading tile preview…</p>}
      {status === "error" && (
        <p style={{ color: "#d33", fontWeight: 600 }}>
          {message ?? "Unable to display the TypeGPU preview."}
        </p>
      )}
    </div>
  );
}
