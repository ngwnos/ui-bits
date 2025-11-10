import React from "react";
import tgpu from "typegpu";
import "./audio-fft-window.css";

export interface AudioFFTWindowProps {
  heightUnits?: number;
  unitSizePx: number;
  maxWidth?: number | string;
  bins?: readonly number[];
  maxBins?: number;
}

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
      console.error("AudioFFTWindow: TypeGPU init failed", error);
      sharedRootPromise = null;
      return null;
    });
  }
  return sharedRootPromise;
}

export default function AudioFFTWindow({
  heightUnits = 6,
  unitSizePx,
  maxWidth,
  bins,
  maxBins = 1024,
}: AudioFFTWindowProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [supportsWebGPU, setSupportsWebGPU] = React.useState<boolean>(() => typeof navigator !== "undefined" && Boolean(navigator.gpu));
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 480,
    height: Math.max(1, heightUnits) * unitSizePx,
  });

  const maxBinCount = Math.max(1, Math.floor(maxBins));
  const binTextureWidth = Math.max(1, Math.ceil(maxBinCount / 64) * 64);
  const binDataRef = React.useRef<Float32Array>(new Float32Array(binTextureWidth));
  const binCountRef = React.useRef<number>(0);
  const needsUploadRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    binDataRef.current = new Float32Array(binTextureWidth);
    needsUploadRef.current = true;
  }, [binTextureWidth]);

  React.useEffect(() => {
    const nextHeight = Math.max(1, heightUnits) * unitSizePx;
    setSize((prev) => ({
      width: prev.width,
      height: nextHeight,
    }));
  }, [heightUnits, unitSizePx]);

  React.useEffect(() => {
    if (!bins) return;
    const dest = binDataRef.current;
    const usable = Math.min(maxBinCount, bins.length);
    for (let i = 0; i < usable; i += 1) {
      const value = bins[i];
      dest[i] = Number.isFinite(value) ? Math.max(0, value) : 0;
    }
    for (let i = usable; i < dest.length; i += 1) {
      dest[i] = 0;
    }
    binCountRef.current = usable;
    needsUploadRef.current = true;
  }, [bins, maxBinCount]);

  React.useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width) return;
      setSize((prev) => ({
        width: Math.round(rect.width),
        height: prev.height,
      }));
    };
    measure();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (resizeObserver) {
      resizeObserver.observe(node);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", measure);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    let animationFrame: number | null = null;
    let cleanup: (() => void) | null = null;
    (async () => {
      if (!supportsWebGPU) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const root = await getSharedRoot();
      if (!root || cancelled) {
        if (!root) setSupportsWebGPU(false);
        return;
      }
      const { device } = root;
      const context = canvas.getContext("webgpu");
      if (!context) {
        setSupportsWebGPU(false);
        return;
      }
      const format = navigator.gpu.getPreferredCanvasFormat();
      const pixelRatio = window.devicePixelRatio || 1;
      const targetWidth = Math.max(1, Math.floor(size.width * pixelRatio));
      const targetHeight = Math.max(1, Math.floor(size.height * pixelRatio));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      if (canvas.style.width !== `${Math.round(size.width)}px`) {
        canvas.style.width = `${Math.round(size.width)}px`;
      }
      if (canvas.style.height !== `${Math.round(size.height)}px`) {
        canvas.style.height = `${Math.round(size.height)}px`;
      }
      context.configure({
        device,
        format,
        alphaMode: "opaque",
      });

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
  time : f32,
  amp : f32,
  binCount : f32,
  padding : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var fftTexture : texture_2d<f32>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let bins = max(1.0, uniforms.binCount);
  let dims = textureDimensions(fftTexture);
  let texWidth = max(1.0, f32(dims.x));
  let indexF = clamp(round(in.uv.x * (bins - 1.0)), 0.0, bins - 1.0);
  let clampedIndex = clamp(indexF, 0.0, texWidth - 1.0);
  let amplitude = textureLoad(fftTexture, vec2<i32>(i32(clampedIndex), 0), 0).r;
  let normalized = clamp(amplitude, 0.0, 1.0);
  let y = 1.0 - in.uv.y;
  let bar = smoothstep(normalized - 0.01, normalized, y);
  let glow = smoothstep(0.0, 0.3, normalized) * smoothstep(0.7, 1.0, y);
  let baseColor = vec3<f32>(0.16, 0.47, 0.86);
  let bgColor = vec3<f32>(0.02, 0.02, 0.04);
  let accent = vec3<f32>(0.9, 0.4, 0.8) * glow;
  let color = mix(bgColor, baseColor, bar) + accent;
  return vec4<f32>(color, 1.0);
}
`,
      });

      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: shaderModule, entryPoint: "vs_main" },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_main",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
      });

      const uniformBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const fftTexture = device.createTexture({
        size: [binTextureWidth, 1, 1],
        format: "r32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: fftTexture.createView() },
        ],
      });

      const render = (time: number) => {
        if (cancelled) return;
        const secs = time / 1000;
        const amp = 0.25 + (Math.sin(secs * 0.5) * 0.25 + 0.25);
        const binCount = Math.max(1, binCountRef.current || maxBinCount);
        const uniformData = new Float32Array([secs * 2, amp, binCount, 0]);
        device.queue.writeBuffer(uniformBuffer, 0, uniformData);
        if (needsUploadRef.current) {
          needsUploadRef.current = false;
          const data = binDataRef.current;
          device.queue.writeTexture(
            { texture: fftTexture },
            data,
            { bytesPerRow: binTextureWidth * 4 },
            [binTextureWidth, 1, 1],
          );
        }
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.04, g: 0.04, b: 0.04, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();
        device.queue.submit([encoder.finish()]);
        animationFrame = requestAnimationFrame(render);
      };
      animationFrame = requestAnimationFrame(render);
      cleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [binTextureWidth, maxBinCount, size.height, size.width, supportsWebGPU]);

  const heightPx = size.height;
  const widthPx = typeof maxWidth === "number" ? Math.min(size.width, maxWidth) : size.width;
  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  return (
    <div
      ref={wrapperRef}
      className="audio-fft-window"
      style={{
        width: "100%",
        maxWidth: resolvedMaxWidth,
      }}
    >
      <div
        className="audio-fft-window__canvas-wrapper"
        style={{
          width: "100%",
          height: `${heightPx}px`,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0a0a, #1a1a1a)",
        }}
      >
        {supportsWebGPU ? (
          <canvas
            ref={canvasRef}
            width={widthPx}
            height={heightPx}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        ) : (
          <div className="audio-fft-window__fallback">
            WebGPU not available
          </div>
        )}
      </div>
    </div>
  );
}
