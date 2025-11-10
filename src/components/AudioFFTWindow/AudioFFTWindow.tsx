import React from "react";
import tgpu from "typegpu";
import "./audio-fft-window.css";

export interface AudioFFTWindowProps {
  heightUnits?: number;
  unitSizePx: number;
  maxWidth?: number | string;
  bins?: readonly number[];
  maxBins?: number;
  playbackRatio?: number;
  onScrubStart?: () => void;
  onScrub?: (ratio: number) => void;
  onScrubEnd?: (ratio: number) => void;
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
  playbackRatio = 0,
  onScrubStart,
  onScrub,
  onScrubEnd,
}: AudioFFTWindowProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const interactionLayerRef = React.useRef<HTMLDivElement | null>(null);
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
  const playbackRatioRef = React.useRef<number>(Math.max(0, Math.min(1, playbackRatio)));
  const pointerStateRef = React.useRef<{ active: boolean; pointerId: number | null }>({ active: false, pointerId: null });

  React.useEffect(() => {
    binDataRef.current = new Float32Array(binTextureWidth);
    needsUploadRef.current = true;
  }, [binTextureWidth]);

  React.useEffect(() => {
    playbackRatioRef.current = Math.max(0, Math.min(1, playbackRatio));
  }, [playbackRatio]);

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

  const computeRatioFromClientX = React.useCallback((clientX: number): number | null => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const rect = wrapper.getBoundingClientRect();
    if (!rect.width) return null;
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!onScrub && !onScrubEnd && !onScrubStart) return;
    const ratio = computeRatioFromClientX(event.clientX);
    if (ratio == null) return;
    pointerStateRef.current = { active: true, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    onScrubStart?.();
    onScrub?.(ratio);
  }, [computeRatioFromClientX, onScrub, onScrubEnd, onScrubStart]);

  const handlePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStateRef.current.active || pointerStateRef.current.pointerId !== event.pointerId) return;
    const ratio = computeRatioFromClientX(event.clientX);
    if (ratio == null) return;
    event.preventDefault();
    onScrub?.(ratio);
  }, [computeRatioFromClientX, onScrub]);

  const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStateRef.current.active || pointerStateRef.current.pointerId !== event.pointerId) return;
    pointerStateRef.current = { active: false, pointerId: null };
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    const ratio = computeRatioFromClientX(event.clientX);
    if (ratio == null) return;
    onScrubEnd?.(ratio);
  }, [computeRatioFromClientX, onScrubEnd]);

  const handlePointerCancel = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) return;
    pointerStateRef.current = { active: false, pointerId: null };
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    const ratio = computeRatioFromClientX(event.clientX);
    if (ratio == null) return;
    onScrubEnd?.(ratio);
  }, [computeRatioFromClientX, onScrubEnd]);

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
  playback : f32,
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
  var color = mix(bgColor, baseColor, bar) + accent;
  let playhead = clamp(uniforms.playback, 0.0, 1.0);
  let lineWidth = 0.004;
  let distance = abs(in.uv.x - playhead);
  let lineFeather = smoothstep(lineWidth * 0.5, lineWidth, distance);
  let lineMask = 1.0 - lineFeather;
  let playColor = vec3<f32>(1.0, 0.87, 0.35);
  color = mix(color, playColor, lineMask);
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
        const uniformData = new Float32Array([secs * 2, amp, binCount, playbackRatioRef.current]);
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
        <div
          ref={interactionLayerRef}
          className="audio-fft-window__interaction-layer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          role="presentation"
        />
      </div>
    </div>
  );
}
