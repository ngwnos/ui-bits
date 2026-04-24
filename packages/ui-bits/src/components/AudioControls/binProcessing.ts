const clampBetween = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type MutableRef<T> = { current: T };

export interface ProcessBinsOptions {
  attackMs: number;
  releaseMs: number;
  dtSec: number;
  blurSigma: number;
  targetBins: number;
  frequencyMin: number;
  frequencyMax: number;
}

export interface SmoothingState {
  previous: Float32Array | null;
  scratch: Float32Array | null;
  length: number;
  hasHistory: boolean;
}

export interface GaussianKernel {
  radius: number;
  kernel: Float32Array;
}

export function createSmoothingState(): SmoothingState {
  return {
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: false,
  };
}

export function weightFromTimeMs(ms: number, dtSec: number) {
  if (ms <= 0) return 1;
  const tau = ms / 1000;
  const dt = Math.max(0, dtSec);
  if (!Number.isFinite(tau) || tau <= 0) return 1;
  return clampBetween(1 - Math.exp(-dt / tau), 0, 1);
}

export function processBinsFromBytes(
  source: Uint8Array,
  options: ProcessBinsOptions,
  smoothingState: SmoothingState,
  blurBufferRef: MutableRef<Float32Array | null>,
  resampleBufferRef: MutableRef<Float32Array | null>,
  kernelCache: Map<number, GaussianKernel>,
) {
  const length = source.length;
  if (smoothingState.length !== length) {
    smoothingState.length = length;
    smoothingState.hasHistory = false;
    smoothingState.previous = null;
    smoothingState.scratch = null;
  }
  const prevBuffer = smoothingState.previous && smoothingState.previous.length === length
    ? smoothingState.previous
    : null;
  const scratchBuffer = smoothingState.scratch && smoothingState.scratch.length === length
    ? smoothingState.scratch
    : null;
  const prev = prevBuffer ?? new Float32Array(length);
  const next = scratchBuffer ?? new Float32Array(length);
  const useHistory = smoothingState.hasHistory && prevBuffer !== null;
  const dt = Math.max(0, options.dtSec);
  const attackWeight = weightFromTimeMs(options.attackMs, dt);
  const releaseWeight = weightFromTimeMs(options.releaseMs, dt);
  for (let i = 0; i < length; i += 1) {
    const current = source[i] / 255;
    const prevValue = useHistory ? prev[i] : current;
    const weight = current >= prevValue ? attackWeight : releaseWeight;
    next[i] = prevValue + (current - prevValue) * weight;
  }
  smoothingState.hasHistory = true;
  smoothingState.previous = next;
  smoothingState.scratch = prev;

  let working = next;
  if (options.blurSigma > 0.001) {
    working = applyGaussianBlurCached(working, options.blurSigma, blurBufferRef, kernelCache);
  }
  const resampled = resampleBinsCached(
    working,
    options.targetBins,
    resampleBufferRef,
    options.frequencyMin,
    options.frequencyMax,
  );

  return { smoothedSnapshot: next, resampled };
}

export function applyGaussianBlurCached(
  values: Float32Array,
  sigma: number,
  blurBufferRef: MutableRef<Float32Array | null>,
  kernelCache: Map<number, GaussianKernel>,
): Float32Array {
  const normalizedSigma = Math.max(0.001, sigma);
  let blurred = blurBufferRef.current;
  if (!blurred || blurred.length !== values.length) {
    blurred = new Float32Array(values.length);
    blurBufferRef.current = blurred;
  }
  const { radius, kernel } = getGaussianKernel(normalizedSigma, kernelCache);
  const length = values.length;
  for (let i = 0; i < length; i += 1) {
    let sample = 0;
    for (let k = -radius; k <= radius; k += 1) {
      let index = i + k;
      if (index < 0) index = 0;
      else if (index >= length) index = length - 1;
      sample += values[index] * kernel[k + radius];
    }
    blurred[i] = sample;
  }
  return blurred;
}

export function getGaussianKernel(sigma: number, cache: Map<number, GaussianKernel>): GaussianKernel {
  const key = Math.round(sigma * 100) / 100;
  const cached = cache.get(key);
  if (cached) return cached;
  const radius = Math.max(1, Math.floor(sigma * 3));
  const kernelSize = radius * 2 + 1;
  const kernel = new Float32Array(kernelSize);
  const denom = Math.max(Number.EPSILON, 2 * sigma * sigma);
  let weightSum = 0;
  for (let i = 0; i < kernelSize; i += 1) {
    const offset = i - radius;
    const weight = Math.exp(-(offset * offset) / denom);
    kernel[i] = weight;
    weightSum += weight;
  }
  const normalization = weightSum || 1;
  for (let i = 0; i < kernelSize; i += 1) {
    kernel[i] /= normalization;
  }
  const kernelData: GaussianKernel = { radius, kernel };
  cache.set(key, kernelData);
  return kernelData;
}

export function resampleBinsCached(
  values: Float32Array,
  targetBins: number,
  resampleBufferRef: MutableRef<Float32Array | null>,
  frequencyMin: number,
  frequencyMax: number,
): Float32Array {
  const count = Math.max(1, Math.round(targetBins));
  let result = resampleBufferRef.current;
  if (!result || result.length !== count) {
    result = new Float32Array(count);
    resampleBufferRef.current = result;
  }
  const maxIndex = Math.max(0, values.length - 1);
  if (maxIndex === 0) {
    result.fill(values[0] ?? 0);
    return result;
  }
  const safeMin = clampBetween(frequencyMin, 0, 1);
  const safeMax = clampBetween(frequencyMax, Math.min(1, safeMin + 1e-3), 1);
  const minPos = safeMin * maxIndex;
  const maxPos = safeMax * maxIndex;
  if (count === 1) {
    const position = (minPos + maxPos) * 0.5;
    const lower = Math.floor(position);
    const upper = Math.min(maxIndex, lower + 1);
    const t = position - lower;
    const lowerValue = values[lower] ?? 0;
    const upperValue = values[upper] ?? lowerValue;
    result[0] = lowerValue + (upperValue - lowerValue) * t;
    return result;
  }
  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1);
    const position = minPos + ratio * (maxPos - minPos);
    const lower = Math.floor(position);
    const upper = Math.min(maxIndex, lower + 1);
    const t = position - lower;
    const lowerValue = values[lower] ?? 0;
    const upperValue = values[upper] ?? 0;
    result[i] = lowerValue + (upperValue - lowerValue) * t;
  }
  return result;
}
