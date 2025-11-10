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
  activeColor?: string;
  inactiveColor?: string;
  peakDecay?: number;
}

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;
const DEFAULT_ACTIVE_COLOR: [number, number, number] = [0.16, 0.47, 0.86];
const DEFAULT_INACTIVE_COLOR: [number, number, number] = [0.02, 0.02, 0.04];
const UNIFORM_FLOAT_COUNT = 12;
const UNIFORM_BUFFER_SIZE = UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

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
  activeColor,
  inactiveColor,
  peakDecay = 0.05,
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
  const peakDataRef = React.useRef<Float32Array>(new Float32Array(binTextureWidth));
  const peakHoldTimersRef = React.useRef<Float32Array>(new Float32Array(binTextureWidth));
  const peakFallTimersRef = React.useRef<Float32Array>(new Float32Array(binTextureWidth));
  const lastPeakUpdateRef = React.useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const needsPeakUploadRef = React.useRef<boolean>(false);
  const playbackRatioRef = React.useRef<number>(Math.max(0, Math.min(1, playbackRatio)));
  const pointerStateRef = React.useRef<{ active: boolean; pointerId: number | null }>({ active: false, pointerId: null });
  const activeColorVec = React.useMemo(
    () => parseHexColor(activeColor, DEFAULT_ACTIVE_COLOR),
    [activeColor],
  );
  const inactiveColorVec = React.useMemo(
    () => parseHexColor(inactiveColor, DEFAULT_INACTIVE_COLOR),
    [inactiveColor],
  );
  const activeColorRef = React.useRef<[number, number, number]>(activeColorVec);
  const inactiveColorRef = React.useRef<[number, number, number]>(inactiveColorVec);

  React.useEffect(() => {
    binDataRef.current = new Float32Array(binTextureWidth);
    needsUploadRef.current = true;
    peakDataRef.current = new Float32Array(binTextureWidth);
    peakHoldTimersRef.current = new Float32Array(binTextureWidth);
    peakFallTimersRef.current = new Float32Array(binTextureWidth);
    needsPeakUploadRef.current = true;
  }, [binTextureWidth]);

  React.useEffect(() => {
    playbackRatioRef.current = Math.max(0, Math.min(1, playbackRatio));
  }, [playbackRatio]);

  React.useEffect(() => {
    activeColorRef.current = activeColorVec;
  }, [activeColorVec]);

  React.useEffect(() => {
    inactiveColorRef.current = inactiveColorVec;
  }, [inactiveColorVec]);

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
    const peaks = peakDataRef.current;
    const holdTimers = peakHoldTimersRef.current;
    const fallTimers = peakFallTimersRef.current;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const deltaSeconds = Math.max(0.001, (now - lastPeakUpdateRef.current) / 1000);
    lastPeakUpdateRef.current = now;
    const usable = Math.min(maxBinCount, bins.length);
    const baseDecayPerSecond = Math.max(0.0005, Math.min(peakDecay, 0.1));
    const gravity = 4.0;
    const holdSeconds = 0.2;
    for (let i = 0; i < usable; i += 1) {
      const value = Number.isFinite(bins[i]) ? Math.max(0, bins[i]) : 0;
      dest[i] = value;
      const prev = peaks[i] ?? 0;
      if (value >= prev) {
        peaks[i] = value;
        holdTimers[i] = holdSeconds;
      } else if (holdTimers[i] > 0) {
        holdTimers[i] = Math.max(0, holdTimers[i] - deltaSeconds);
        fallTimers[i] = 0;
      } else {
        const elapsed = fallTimers[i] + deltaSeconds;
        fallTimers[i] = elapsed;
        const accel = 1 + gravity * elapsed;
        const drop = baseDecayPerSecond * accel * deltaSeconds;
        peaks[i] = Math.max(0, prev - drop);
      }
    }
    for (let i = usable; i < dest.length; i += 1) {
      dest[i] = 0;
      const prev = peaks[i] ?? 0;
      if (holdTimers[i] > 0) {
        holdTimers[i] = Math.max(0, holdTimers[i] - deltaSeconds);
        fallTimers[i] = 0;
      } else {
        const elapsed = fallTimers[i] + deltaSeconds;
        fallTimers[i] = elapsed;
        const accel = 1 + gravity * elapsed;
        const drop = baseDecayPerSecond * accel * deltaSeconds;
        peaks[i] = Math.max(0, prev - drop);
      }
    }
    binCountRef.current = usable;
    needsUploadRef.current = true;
    needsPeakUploadRef.current = true;
  }, [bins, maxBinCount, peakDecay]);

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
  colorActive : vec3<f32>,
  padding0 : f32,
  colorInactive : vec3<f32>,
  padding1 : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var fftTexture : texture_2d<f32>;
@group(0) @binding(2) var peakTexture : texture_2d<f32>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let bins = max(1.0, uniforms.binCount);
  let dims = textureDimensions(fftTexture);
  let texWidth = max(1.0, f32(dims.x));
  let indexF = clamp(floor(in.uv.x * bins), 0.0, bins - 1.0);
  let clampedIndex = clamp(indexF, 0.0, texWidth - 1.0);
  let amplitude = textureLoad(fftTexture, vec2<i32>(i32(clampedIndex), 0), 0).r;
  let peakValue = textureLoad(peakTexture, vec2<i32>(i32(clampedIndex), 0), 0).r;
  let normalized = clamp(amplitude, 0.0, 1.0);
  let y = 1.0 - in.uv.y;
  let edgeMask = smoothstep(normalized - 0.01, normalized, y);
  let activeMask = 1.0 - edgeMask;
  var color = mix(uniforms.colorInactive, uniforms.colorActive, activeMask);
  let playhead = clamp(uniforms.playback, 0.0, 1.0);
  let lineWidth = 0.004;
  let distance = abs(in.uv.x - playhead);
  let lineFeather = smoothstep(lineWidth * 0.5, lineWidth, distance);
  let lineMask = 1.0 - lineFeather;
  let invertedColor = mix(uniforms.colorActive, uniforms.colorInactive, activeMask);
  color = mix(color, invertedColor, lineMask);
  if (peakValue > 0.01) {
    let peakY = clamp(peakValue, 0.0, 1.0);
    let peakLine = 1.0 - smoothstep(0.0, 0.01, abs(y - peakY));
    color = mix(color, uniforms.colorActive, peakLine);
  }
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
        size: UNIFORM_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const fftTexture = device.createTexture({
        size: [binTextureWidth, 1, 1],
        format: "r32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      const peakTexture = device.createTexture({
        size: [binTextureWidth, 1, 1],
        format: "r32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: fftTexture.createView() },
          { binding: 2, resource: peakTexture.createView() },
        ],
      });

      const render = (time: number) => {
        if (cancelled) return;
        const secs = time / 1000;
        const amp = 0.25 + (Math.sin(secs * 0.5) * 0.25 + 0.25);
        const binCount = Math.max(1, binCountRef.current || maxBinCount);
        const activeColorCurrent = activeColorRef.current;
        const inactiveColorCurrent = inactiveColorRef.current;
        const uniformData = new Float32Array([
          secs * 2,
          amp,
          binCount,
          playbackRatioRef.current,
          activeColorCurrent[0],
          activeColorCurrent[1],
          activeColorCurrent[2],
          0,
          inactiveColorCurrent[0],
          inactiveColorCurrent[1],
          inactiveColorCurrent[2],
          0,
        ]);
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
        if (needsPeakUploadRef.current) {
          needsPeakUploadRef.current = false;
          const peakData = peakDataRef.current;
          device.queue.writeTexture(
            { texture: peakTexture },
            peakData,
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
