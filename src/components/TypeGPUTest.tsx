import React from "react";
import tgpu from "typegpu";
import { MATPLOTLIB_GRADIENTS, buildPalette } from "../gradients/matplotlib";

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
        const response = await fetch(TILE_URL, { cache: "force-cache" });
        if (!response.ok) throw new Error("Failed to fetch tile image.");
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        const format = navigator.gpu.getPreferredCanvasFormat();
        root = await tgpu.init();
        if (cancelled) {
          bitmap.close();
          root.destroy();
          return;
        }
        const { device } = root;
        const context = canvas.getContext("webgpu");
        if (!context) throw new Error("Unable to acquire WebGPU context.");

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.style.width = `${bitmap.width}px`;
        canvas.style.height = `${bitmap.height}px`;

        context.configure({
          device,
          format,
          alphaMode: "opaque",
        });

        const heightTexture = device.createTexture({
          size: [bitmap.width, bitmap.height, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.COPY_DST
            | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
          { source: bitmap },
          { texture: heightTexture },
          [bitmap.width, bitmap.height],
        );
        bitmap.close();

        const sampler = device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        });

        const gradientTexture = device.createTexture({
          size: [256, 1, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        updateGradientTexture(device, gradientTexture, gradientIndexRef.current);

        const hillshadeTexture = device.createTexture({
          size: [bitmap.width, bitmap.height, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        });

        const uniformBuffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(uniformBuffer, 0, new Uint32Array([1, 0, 0, 0]));

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
  useHillshade : u32,
  padding : vec3<u32>,
};

@group(0) @binding(0) var hillshadeTexture : texture_2d<f32>;
@group(0) @binding(1) var tileSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;
@group(0) @binding(3) var heightTexture : texture_2d<f32>;
@group(0) @binding(4) var<uniform> renderUniforms : RenderUniforms;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let hillshade = textureSample(hillshadeTexture, tileSampler, in.uv).r;
  if (renderUniforms.useHillshade == 1u) {
    return vec4<f32>(hillshade, hillshade, hillshade, 1.0);
  }
  let tileColor = textureSample(heightTexture, tileSampler, in.uv);
  let luminance = dot(tileColor.rgb, vec3f(0.299, 0.587, 0.114));
  let remapped = textureSample(gradientTexture, tileSampler, vec2f(luminance, 0.5));
  return vec4<f32>(remapped.rgb, 1.0);
}
`,
        });

        const computeModule = device.createShaderModule({
          code: `
@group(0) @binding(0) var heightTexture : texture_2d<f32>;
@group(0) @binding(1) var<storage, write> hillshadeTexture : texture_storage_2d<rgba8unorm, write>;

fn sampleHeight(coord : vec2<i32>, dims : vec2<i32>) -> f32 {
  let clamped = vec2<i32>(clamp(coord.x, 0, dims.x - 1), clamp(coord.y, 0, dims.y - 1));
  return textureLoad(heightTexture, clamped, 0).r;
}

@compute @workgroup_size(16, 16)
fn cs_main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let dimsU = textureDimensions(heightTexture);
  let dims = vec2<i32>(dimsU);
  let coord = vec2<i32>(global_id.xy);
  if (coord.x >= dims.x || coord.y >= dims.y) {
    return;
  }

  let left = sampleHeight(coord + vec2<i32>(-1, 0), dims);
  let right = sampleHeight(coord + vec2<i32>(1, 0), dims);
  let up = sampleHeight(coord + vec2<i32>(0, -1), dims);
  let down = sampleHeight(coord + vec2<i32>(0, 1), dims);

  let dzdx = (right - left) * 0.5;
  let dzdy = (down - up) * 0.5;

  let slope = atan(sqrt(dzdx * dzdx + dzdy * dzdy));
  let aspect = atan2(dzdy, -dzdx);

  let azimuth = 315.0 * (3.14159265359 / 180.0);
  let altitude = 45.0 * (3.14159265359 / 180.0);

  let hillshade = clamp(
    cos(altitude) * cos(slope)
      + sin(altitude) * sin(slope) * cos(azimuth - aspect),
    0.0,
    1.0
  );

  textureStore(hillshadeTexture, coord, vec4<f32>(hillshade, hillshade, hillshade, 1.0));
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

        const computePipeline = device.createComputePipeline({
          layout: "auto",
          compute: {
            module: computeModule,
            entryPoint: "cs_main",
          },
        });

        const computeBindGroup = device.createBindGroup({
          layout: computePipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: heightTexture.createView() },
            { binding: 1, resource: hillshadeTexture.createView() },
          ],
        });

        const renderBindGroup = device.createBindGroup({
          layout: renderPipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: hillshadeTexture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: gradientTexture.createView() },
            { binding: 3, resource: heightTexture.createView() },
            { binding: 4, resource: { buffer: uniformBuffer } },
          ],
        });

        resourceCleanup = () => {
          gradientTexture.destroy();
          hillshadeTexture.destroy();
          uniformBuffer.destroy();
          heightTexture.destroy();
        };

        const render = () => {
          const commandEncoder = device.createCommandEncoder();
          const computePass = commandEncoder.beginComputePass();
          computePass.setPipeline(computePipeline);
          computePass.setBindGroup(0, computeBindGroup);
          computePass.dispatchWorkgroups(
            Math.ceil(bitmap.width / 16),
            Math.ceil(bitmap.height / 16),
          );
          computePass.end();

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
