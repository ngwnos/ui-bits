import { describe, expect, test } from "bun:test";
import { lfoValue, snapToStep, valueFromSplit, type LfoSettings } from "../src/lfo";

describe("snapToStep", () => {
  test("snaps to the nearest step from min", () => {
    expect(snapToStep(5.4, 0, 1)).toBe(5);
    expect(snapToStep(5.6, 0, 1)).toBe(6);
    expect(snapToStep(2.4, 1, 0.5)).toBe(2.5);
  });

  test("returns the input unchanged for non-positive or non-finite steps", () => {
    expect(snapToStep(5.4, 0, 0)).toBe(5.4);
    expect(snapToStep(5.4, 0, -1)).toBe(5.4);
    expect(snapToStep(5.4, 0, Infinity)).toBe(5.4);
  });

  test("clamps to max when the range is not step-divisible", () => {
    expect(snapToStep(10, 0, 4)).toBe(12);
    expect(snapToStep(10, 0, 4, 10)).toBe(10);
    expect(snapToStep(0.95, 0, 0.3, 1)).toBeCloseTo(0.9);
  });

  test("clamps below min", () => {
    expect(snapToStep(-1.4, 0, 1)).toBe(0);
  });
});

describe("valueFromSplit", () => {
  test("never exceeds max for non-divisible ranges", () => {
    expect(valueFromSplit(1, 0, 10, 4)).toBe(10);
    expect(valueFromSplit(0.99, 0, 10, 4)).toBe(8);
    expect(valueFromSplit(0, 0, 10, 4)).toBe(0);
    expect(valueFromSplit(0.5, 0, 10, 4)).toBe(4);
  });
});

describe("lfoValue", () => {
  const base: LfoSettings = {
    enabled: true,
    frequency: 1,
    depth: 1,
    waveform: "sine",
  };

  test("returns the range center at phase zero", () => {
    expect(lfoValue(base, 0, 0, 10)).toBeCloseTo(5);
    expect(lfoValue(base, 0, -4, 4)).toBeCloseTo(0);
  });

  test("reaches the range extremes at quarter cycles", () => {
    expect(lfoValue(base, 0.25, 0, 10)).toBeCloseTo(10);
    expect(lfoValue(base, 0.75, 0, 10)).toBeCloseTo(0);
  });

  test("scales amplitude with depth", () => {
    expect(lfoValue({ ...base, depth: 0.5 }, 0.25, 0, 10)).toBeCloseTo(7.5);
    expect(lfoValue({ ...base, depth: 0 }, 0.25, 0, 10)).toBeCloseTo(5);
  });

  test("inverts the waveform", () => {
    expect(lfoValue({ ...base, invert: true }, 0.25, 0, 10)).toBeCloseTo(0);
  });

  test("shifts the center with offset and stays within range", () => {
    expect(lfoValue({ ...base, offset: 0 }, 0.25, 0, 10)).toBeCloseTo(5);
    expect(lfoValue({ ...base, offset: 0 }, 0.75, 0, 10)).toBeCloseTo(0);
  });
});
