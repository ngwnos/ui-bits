import { describe, expect, test } from "bun:test";
import {
  applyGaussianBlurCached,
  createSmoothingState,
  getGaussianKernel,
  processBinsFromBytes,
  resampleBinsCached,
  weightFromTimeMs,
} from "../../src/components/AudioControls/binProcessing";

const ref = <T>(current: T) => ({ current });

const closeArray = (values: Float32Array, expected: number[]) => {
  expect(Array.from(values)).toHaveLength(expected.length);
  expected.forEach((value, index) => {
    expect(values[index]).toBeCloseTo(value, 5);
  });
};

const process = (
  source: number[],
  overrides: Partial<Parameters<typeof processBinsFromBytes>[1]> = {},
) => processBinsFromBytes(
  new Uint8Array(source),
  {
    attackMs: 0,
    releaseMs: 0,
    dtSec: 1 / 60,
    blurSigma: 0,
    targetBins: source.length,
    frequencyMin: 0,
    frequencyMax: 1,
    ...overrides,
  },
  createSmoothingState(),
  ref<Float32Array | null>(null),
  ref<Float32Array | null>(null),
  new Map(),
);

describe("AudioControls bin processing", () => {
  test("normalizes full-range byte bins without interpolation drift", () => {
    const { resampled } = process([0, 85, 170, 255]);

    closeArray(resampled, [0, 85 / 255, 170 / 255, 1]);
  });

  test("resamples a normalized frequency window", () => {
    const { resampled } = process([0, 85, 170, 255], {
      targetBins: 2,
      frequencyMin: 1 / 3,
      frequencyMax: 2 / 3,
    });

    closeArray(resampled, [85 / 255, 170 / 255]);
  });

  test("uses release smoothing when incoming bins fall", () => {
    const smoothingState = createSmoothingState();
    const blurBuffer = ref<Float32Array | null>(null);
    const resampleBuffer = ref<Float32Array | null>(null);
    const kernelCache = new Map();

    processBinsFromBytes(
      new Uint8Array([255]),
      {
        attackMs: 0,
        releaseMs: 100,
        dtSec: 1 / 60,
        blurSigma: 0,
        targetBins: 1,
        frequencyMin: 0,
        frequencyMax: 1,
      },
      smoothingState,
      blurBuffer,
      resampleBuffer,
      kernelCache,
    );
    const falling = processBinsFromBytes(
      new Uint8Array([0]),
      {
        attackMs: 0,
        releaseMs: 100,
        dtSec: 1 / 60,
        blurSigma: 0,
        targetBins: 1,
        frequencyMin: 0,
        frequencyMax: 1,
      },
      smoothingState,
      blurBuffer,
      resampleBuffer,
      kernelCache,
    );

    expect(falling.resampled[0]).toBeGreaterThan(0);
    expect(falling.resampled[0]).toBeLessThan(1);
  });

  test("normalizes gaussian kernels and reuses cached kernels", () => {
    const cache = new Map();
    const first = getGaussianKernel(1.249, cache);
    const second = getGaussianKernel(1.25, cache);
    const sum = Array.from(first.kernel).reduce((total, value) => total + value, 0);

    expect(second).toBe(first);
    expect(sum).toBeCloseTo(1, 5);
  });

  test("gaussian blur spreads a center impulse", () => {
    const cache = new Map();
    const blurred = applyGaussianBlurCached(
      new Float32Array([0, 0, 1, 0, 0]),
      1,
      ref<Float32Array | null>(null),
      cache,
    );

    expect(blurred[1]).toBeGreaterThan(0);
    expect(blurred[2]).toBeLessThan(1);
    expect(blurred[2]).toBeGreaterThan(blurred[1]);
    expect(blurred[1]).toBeCloseTo(blurred[3], 5);
  });

  test("resample output buffer is reused when size is stable", () => {
    const bufferRef = ref<Float32Array | null>(null);
    const first = resampleBinsCached(new Float32Array([0, 1]), 4, bufferRef, 0, 1);
    const second = resampleBinsCached(new Float32Array([1, 0]), 4, bufferRef, 0, 1);

    expect(second).toBe(first);
    closeArray(second, [1, 2 / 3, 1 / 3, 0]);
  });

  test("time constants convert to bounded frame weights", () => {
    expect(weightFromTimeMs(0, 1 / 60)).toBe(1);
    expect(weightFromTimeMs(100, 1 / 60)).toBeGreaterThan(0);
    expect(weightFromTimeMs(100, 1 / 60)).toBeLessThan(1);
    expect(weightFromTimeMs(100, -1)).toBe(0);
  });
});
