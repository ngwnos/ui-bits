import React from "react";
import tgpu from "typegpu";
import "./audio-fft-window.css";

export interface AudioFFTWindowProps {
  heightUnits?: number;
  unitSizePx: number;
  maxWidth?: number | string;
  maxBins?: number;
  playbackRatio?: number;
  onScrubStart?: () => void;
  onScrub?: (ratio: number) => void;
  onScrubEnd?: (ratio: number) => void;
  activeColor?: string;
  inactiveColor?: string;
  peakDecay?: number;
  rawFftDataRef?: React.RefObject<Uint8Array | null>;
  rawFrameVersion?: number;
  rawBinCount?: number;
  attackWeight?: number;
  releaseWeight?: number;
  blurSigma?: number;
}

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

const DEFAULT_ACTIVE_COLOR: [number, number, number] = [0.16, 0.47, 0.86];
const DEFAULT_INACTIVE_COLOR: [number, number, number] = [0.02, 0.02, 0.04];
const UNIFORM_FLOAT_COUNT = 20;
const UNIFORM_BUFFER_SIZE = UNIFORM_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
const WORKGROUP_SIZE = 64;
const HOLD_SECONDS = 0.2;
const PEAK_GRAVITY = 4;
const MAX_GAUSSIAN_RADIUS = 12;

interface FftGpuResources {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  uniformBuffer: GPUBuffer;
  rawBuffer: GPUBuffer;
  stateTextures: [GPUTexture, GPUTexture];
  stateStorageViews: [GPUTextureView, GPUTextureView];
  computePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  computeBindGroups: [GPUBindGroup, GPUBindGroup];
  renderBindGroups: [GPUBindGroup, GPUBindGroup];
  workgroupCount: number;
  binCapacity: number;
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

function createShaderModules(device: GPUDevice) {
  const computeModule = device.createShaderModule({
    code: `
struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
};

@group(0) @binding(0) var<storage, read> rawFft : array<f32>;
@group(0) @binding(1) var stateSrc : texture_storage_2d<rgba32float, read>;
@group(0) @binding(2) var stateDst : texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let index = gid.x;
  if (f32(index) >= uniforms.binCount) {
    return;
  }
  let coord = vec2<i32>(i32(index), 0);
  let current = rawFft[index];
  let previous = textureLoad(stateSrc, coord);
  let prevValue = previous.x;
  let prevPeak = previous.y;
  let holdTimer = previous.z;
  let fallTimer = previous.w;
  let weight = select(uniforms.releaseWeight, uniforms.attackWeight, current >= prevValue);
  let smoothed = prevValue + (current - prevValue) * weight;
  var nextPeak = prevPeak;
  var nextHold = holdTimer;
  var nextFall = fallTimer;
  if (smoothed >= prevPeak) {
    nextPeak = smoothed;
    nextHold = uniforms.holdSeconds;
    nextFall = 0.0;
  } else if (holdTimer > 0.0) {
    nextHold = max(0.0, holdTimer - uniforms.deltaSeconds);
    nextFall = 0.0;
  } else {
    let elapsed = fallTimer + uniforms.deltaSeconds;
    nextFall = elapsed;
    let accel = 1.0 + uniforms.gravity * elapsed;
    let drop = uniforms.peakDecay * accel * uniforms.deltaSeconds;
    nextPeak = max(0.0, prevPeak - drop);
  }
  textureStore(stateDst, coord, vec4<f32>(smoothed, nextPeak, nextHold, nextFall));
}
`,
  });

  const renderModule = device.createShaderModule({
    code: `
const MAX_RADIUS : i32 = ${MAX_GAUSSIAN_RADIUS};

struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var stateTexture : texture_storage_2d<rgba32float, read>;

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

fn sampleStateNormalized(u : f32) -> vec2<f32> {
  let bins = max(1.0, uniforms.binCount);
  let maxIndex = max(0.0, bins - 1.0);
  let scaled = clamp(u, 0.0, 1.0) * maxIndex;
  let lower = i32(floor(scaled));
  let upper = i32(min(maxIndex, f32(lower) + 1.0));
  let frac = scaled - f32(lower);
  let lowerSample = textureLoad(stateTexture, vec2<i32>(lower, 0)).xy;
  let upperSample = textureLoad(stateTexture, vec2<i32>(upper, 0)).xy;
  return lowerSample + (upperSample - lowerSample) * frac;
}

fn blurredAmplitude(u : f32) -> f32 {
  let sigma = max(0.0, uniforms.blurSigma);
  let base = sampleStateNormalized(u).x;
  if (sigma < 0.001) {
    return base;
  }
  let radius = min(MAX_RADIUS, i32(ceil(sigma * 3.0)));
  if (radius <= 0) {
    return base;
  }
  var accum = base;
  var weightSum = 1.0;
  let binStep = uniforms.binStep;
  for (var offset = 1; offset <= MAX_RADIUS; offset = offset + 1) {
    if (offset > radius) {
      continue;
    }
    let distance = f32(offset);
    let weight = exp(-(distance * distance) / (2.0 * sigma * sigma));
    let delta = distance * binStep;
    accum = accum + sampleStateNormalized(u + delta).x * weight;
    accum = accum + sampleStateNormalized(u - delta).x * weight;
    weightSum = weightSum + 2.0 * weight;
  }
  return accum / max(weightSum, 1e-4);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let normalizedX = in.uv.x;
  let amplitude = blurredAmplitude(normalizedX);
  let peak = sampleStateNormalized(normalizedX).y;
  let y = 1.0 - in.uv.y;
  let edgeMask = smoothstep(amplitude - 0.01, amplitude, y);
  let activeMask = 1.0 - edgeMask;
  let activeColor = uniforms.colorActive.xyz;
  let inactiveColor = uniforms.colorInactive.xyz;
  var color = mix(inactiveColor, activeColor, activeMask);
  let playhead = clamp(uniforms.playback, 0.0, 1.0);
  let lineWidth = 0.004;
  let distance = abs(normalizedX - playhead);
  let lineFeather = smoothstep(lineWidth * 0.5, lineWidth, distance);
  let lineMask = 1.0 - lineFeather;
  let invertedColor = mix(activeColor, inactiveColor, activeMask);
  color = mix(color, invertedColor, lineMask);
  if (peak > 0.01) {
    let peakY = clamp(peak, 0.0, 1.0);
    let peakLine = 1.0 - smoothstep(0.0, 0.01, abs(y - peakY));
    color = mix(color, activeColor, peakLine);
  }
  return vec4<f32>(color, 1.0);
}
`,
  });

  return { computeModule, renderModule };
}

function createStateTexture(device: GPUDevice, width: number): GPUTexture {
  return device.createTexture({
    size: [width, 1, 1],
    format: "rgba32float",
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  });
}

function disposeResources(resources: FftGpuResources | null) {
  if (!resources) return;
  resources.uniformBuffer.destroy();
  resources.rawBuffer.destroy();
  resources.stateTextures[0].destroy();
  resources.stateTextures[1].destroy();
}

function buildResources(device: GPUDevice, canvas: HTMLCanvasElement, binCapacity: number): FftGpuResources | null {
  const context = canvas.getContext("webgpu");
  if (!context) return null;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });
  const { computeModule, renderModule } = createShaderModules(device);
  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const rawBuffer = device.createBuffer({
    size: binCapacity * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const stateTextures: [GPUTexture, GPUTexture] = [
    createStateTexture(device, binCapacity),
    createStateTexture(device, binCapacity),
  ];
  const stateStorageViews = stateTextures.map((texture) => texture.createView({ dimension: "2d" })) as [GPUTextureView, GPUTextureView];

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

  const computeLayout = computePipeline.getBindGroupLayout(0);
  const renderLayout = renderPipeline.getBindGroupLayout(0);

  const computeBindGroups: [GPUBindGroup, GPUBindGroup] = [
    device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: rawBuffer } },
        { binding: 1, resource: stateStorageViews[0] },
        { binding: 2, resource: stateStorageViews[1] },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    }),
    device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: rawBuffer } },
        { binding: 1, resource: stateStorageViews[1] },
        { binding: 2, resource: stateStorageViews[0] },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    }),
  ];

  const renderBindGroups: [GPUBindGroup, GPUBindGroup] = [
    device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: stateStorageViews[0] },
      ],
    }),
    device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: stateStorageViews[1] },
      ],
    }),
  ];

  const workgroupCount = Math.max(1, Math.ceil(binCapacity / WORKGROUP_SIZE));

  return {
    context,
    format,
    uniformBuffer,
    rawBuffer,
    stateTextures,
    stateStorageViews,
    computePipeline,
    renderPipeline,
    computeBindGroups,
    renderBindGroups,
    workgroupCount,
    binCapacity,
  };
}

export default function AudioFFTWindow({
  heightUnits = 6,
  unitSizePx,
  maxWidth,
  maxBins = 1024,
  playbackRatio = 0,
  onScrubStart,
  onScrub,
  onScrubEnd,
  activeColor,
  inactiveColor,
  peakDecay = 0.05,
  rawFftDataRef,
  rawFrameVersion,
  rawBinCount = 0,
  attackWeight = 0.6,
  releaseWeight = 0.2,
  blurSigma = 0,
}: AudioFFTWindowProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const interactionLayerRef = React.useRef<HTMLDivElement | null>(null);
  const [supportsWebGPU, setSupportsWebGPU] = React.useState<boolean>(() => typeof navigator !== "undefined" && Boolean(navigator.gpu));
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 480,
    height: Math.max(1, heightUnits) * unitSizePx,
  });
  const [binCapacity, setBinCapacity] = React.useState<number>(() => Math.max(1, Math.ceil(Math.max(1, Math.floor(maxBins)) / WORKGROUP_SIZE) * WORKGROUP_SIZE));

  const playbackRatioRef = React.useRef<number>(Math.max(0, Math.min(1, playbackRatio)));
  const blurSigmaRef = React.useRef<number>(Math.max(0, blurSigma));
  const attackWeightRef = React.useRef<number>(Math.max(0, Math.min(1, attackWeight)));
  const releaseWeightRef = React.useRef<number>(Math.max(0, Math.min(1, releaseWeight)));
  const peakDecayRef = React.useRef<number>(Math.max(0.0005, peakDecay));
  const maxBinCountRef = React.useRef<number>(Math.max(1, Math.floor(maxBins)));
  const rawUploadPendingRef = React.useRef<boolean>(false);
  const lastTimestampRef = React.useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const uniformArrayRef = React.useRef<Float32Array>(new Float32Array(UNIFORM_FLOAT_COUNT));
  const resourcesRef = React.useRef<FftGpuResources | null>(null);
  const stateIndexRef = React.useRef<0 | 1>(0);
  const normalizedFftRef = React.useRef<Float32Array | null>(null);

  const pointerStateRef = React.useRef<{ active: boolean; pointerId: number | null }>({ active: false, pointerId: null });
  const activeColorVec = React.useMemo(() => parseHexColor(activeColor, DEFAULT_ACTIVE_COLOR), [activeColor]);
  const inactiveColorVec = React.useMemo(() => parseHexColor(inactiveColor, DEFAULT_INACTIVE_COLOR), [inactiveColor]);
  const activeColorRef = React.useRef<[number, number, number]>(activeColorVec);
  const inactiveColorRef = React.useRef<[number, number, number]>(inactiveColorVec);

  React.useEffect(() => {
    playbackRatioRef.current = Math.max(0, Math.min(1, playbackRatio));
  }, [playbackRatio]);

  React.useEffect(() => {
    blurSigmaRef.current = Math.max(0, blurSigma);
  }, [blurSigma]);

  React.useEffect(() => {
    attackWeightRef.current = Math.max(0, Math.min(1, attackWeight));
  }, [attackWeight]);

  React.useEffect(() => {
    releaseWeightRef.current = Math.max(0, Math.min(1, releaseWeight));
  }, [releaseWeight]);

  React.useEffect(() => {
    peakDecayRef.current = Math.max(0.0005, peakDecay);
  }, [peakDecay]);

  React.useEffect(() => {
    maxBinCountRef.current = Math.max(1, Math.floor(maxBins));
    const needed = Math.max(maxBinCountRef.current, rawBinCount, 1);
    const aligned = Math.max(1, Math.ceil(needed / WORKGROUP_SIZE) * WORKGROUP_SIZE);
    setBinCapacity((prev) => (prev === aligned ? prev : aligned));
  }, [maxBins, rawBinCount]);

  React.useEffect(() => {
    rawUploadPendingRef.current = true;
  }, [rawFrameVersion]);

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
    if (!supportsWebGPU) return;
    let cancelled = false;
    let animationFrame: number | null = null;

    async function boot() {
      const root = await getSharedRoot();
      if (!root || cancelled) {
        if (!root) setSupportsWebGPU(false);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const resources = buildResources(root.device, canvas, binCapacity);
      if (!resources) {
        setSupportsWebGPU(false);
        return;
      }
      resourcesRef.current = resources;
      stateIndexRef.current = 0;
      rawUploadPendingRef.current = true;

      const frame = (timestamp: number) => {
        if (cancelled) return;
        const device = root.device;
        const queue = device.queue;
        const currentResources = resourcesRef.current;
        if (!currentResources) return;
        const canvasNode = canvasRef.current;
        if (!canvasNode) return;

        const pixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.max(1, Math.floor(size.width * pixelRatio));
        const targetHeight = Math.max(1, Math.floor(size.height * pixelRatio));
        if (canvasNode.width !== targetWidth || canvasNode.height !== targetHeight) {
          canvasNode.width = targetWidth;
          canvasNode.height = targetHeight;
        }
        if (canvasNode.style.width !== `${Math.round(size.width)}px`) {
          canvasNode.style.width = `${Math.round(size.width)}px`;
        }
        if (canvasNode.style.height !== `${Math.round(size.height)}px`) {
          canvasNode.style.height = `${Math.round(size.height)}px`;
        }

        const deltaSeconds = Math.max(0.0005, (timestamp - lastTimestampRef.current) / 1000);
        lastTimestampRef.current = timestamp;
        const effectiveBinCount = Math.max(1, Math.min(maxBinCountRef.current, rawBinCount || maxBinCountRef.current));
        const binStep = effectiveBinCount > 1 ? 1 / (effectiveBinCount - 1) : 0;

        const uniformArray = uniformArrayRef.current;
        uniformArray[0] = effectiveBinCount;
        uniformArray[1] = playbackRatioRef.current;
        uniformArray[2] = blurSigmaRef.current;
        uniformArray[3] = binStep;
        uniformArray[4] = activeColorRef.current[0];
        uniformArray[5] = activeColorRef.current[1];
        uniformArray[6] = activeColorRef.current[2];
        uniformArray[7] = 1;
        uniformArray[8] = inactiveColorRef.current[0];
        uniformArray[9] = inactiveColorRef.current[1];
        uniformArray[10] = inactiveColorRef.current[2];
        uniformArray[11] = 1;
        uniformArray[12] = attackWeightRef.current;
        uniformArray[13] = releaseWeightRef.current;
        uniformArray[14] = deltaSeconds;
        uniformArray[15] = PEAK_GRAVITY;
        uniformArray[16] = peakDecayRef.current;
        uniformArray[17] = HOLD_SECONDS;
        uniformArray[18] = 0;
        uniformArray[19] = 0;
        queue.writeBuffer(currentResources.uniformBuffer, 0, uniformArray.buffer, uniformArray.byteOffset, uniformArray.byteLength);

        if (rawUploadPendingRef.current && rawFftDataRef?.current) {
          const data = rawFftDataRef.current;
          if (data.length > currentResources.binCapacity) {
            const alignedCapacity = Math.max(1, Math.ceil(data.length / WORKGROUP_SIZE) * WORKGROUP_SIZE);
            setBinCapacity((prev) => (prev === alignedCapacity ? prev : alignedCapacity));
            rawUploadPendingRef.current = true;
            animationFrame = requestAnimationFrame(frame);
            return;
          }
          if (!normalizedFftRef.current || normalizedFftRef.current.length !== data.length) {
            normalizedFftRef.current = new Float32Array(data.length);
          }
          const normalized = normalizedFftRef.current;
          for (let i = 0; i < data.length; i += 1) {
            normalized[i] = data[i] / 255;
          }
          queue.writeBuffer(
            currentResources.rawBuffer,
            0,
            normalized.buffer,
            normalized.byteOffset,
            normalized.byteLength,
          );
          rawUploadPendingRef.current = false;
        }

        const commandEncoder = device.createCommandEncoder();
        if (rawFftDataRef?.current && rawBinCount) {
          const computePass = commandEncoder.beginComputePass();
          const bindGroup = currentResources.computeBindGroups[stateIndexRef.current];
          computePass.setPipeline(currentResources.computePipeline);
          computePass.setBindGroup(0, bindGroup);
          computePass.dispatchWorkgroups(currentResources.workgroupCount, 1, 1);
          computePass.end();
          stateIndexRef.current = (stateIndexRef.current === 0 ? 1 : 0);
        }

        const textureView = currentResources.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [{
            view: textureView,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          }],
        });
        renderPass.setPipeline(currentResources.renderPipeline);
        const renderBindGroup = currentResources.renderBindGroups[stateIndexRef.current];
        renderPass.setBindGroup(0, renderBindGroup);
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();

        queue.submit([commandEncoder.finish()]);
        animationFrame = requestAnimationFrame(frame);
      };

      animationFrame = requestAnimationFrame(frame);
    }

    boot();

    return () => {
      cancelled = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      disposeResources(resourcesRef.current);
      resourcesRef.current = null;
    };
  }, [supportsWebGPU, size.width, size.height, binCapacity, rawBinCount, rawFftDataRef]);

  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth ?? "100%";
  const widthPx = Math.round(size.width);
  const heightPx = Math.round(size.height);

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
