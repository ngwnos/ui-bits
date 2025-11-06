import React from "react";
import tgpu from "typegpu";
import { MATPLOTLIB_GRADIENTS, buildPalette } from "../gradients/matplotlib";

const TILE_URL = "/terrain/tiles/tile_r02_c14.png";

export default function TypeGPUTest() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = React.useState<string | null>(null);
  const gradientIndexRef = React.useRef<number>(0);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let root: Awaited<ReturnType<typeof tgpu.init>> | null = null;

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

        const texture = device.createTexture({
          size: [bitmap.width, bitmap.height, 1],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.COPY_DST
            | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
          { source: bitmap },
          { texture },
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

@group(0) @binding(0) var tileTexture : texture_2d<f32>;
@group(0) @binding(1) var tileSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let tileColor = textureSample(tileTexture, tileSampler, in.uv);
  let luminance = dot(tileColor.rgb, vec3f(0.299, 0.587, 0.114));
  let remapped = textureSample(gradientTexture, tileSampler, vec2f(luminance, 0.5));
  return vec4<f32>(remapped.rgb, 1.0);
}
`,
        });

        const pipeline = device.createRenderPipeline({
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

        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: texture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: gradientTexture.createView() },
          ],
        });

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
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
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
