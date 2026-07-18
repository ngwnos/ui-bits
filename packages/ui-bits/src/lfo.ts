export type Waveform = "sine" | "triangle" | "saw" | "square" | "audio";

export interface LfoSettings {
  enabled: boolean;
  frequency: number;
  depth: number;
  offset?: number;
  // Fraction of a full cycle (0-1).
  phase?: number;
  waveform: Waveform;
  invert?: boolean;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function snapToStep(n: number, min: number, step: number, max = Infinity) {
  if (step <= 0 || !isFinite(step)) return n;
  const k = Math.round((n - min) / step);
  return clamp(min + k * step, min, max);
}

export function splitFromValue(value: number, min: number, max: number) {
  if (!isFinite(value) || max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

export function valueFromSplit(split: number, min: number, max: number, step: number) {
  const raw = min + clamp(split, 0, 1) * (max - min);
  return snapToStep(raw, min, step, max);
}

function evalWaveform(w: Waveform, phase: number): number {
  const τ = Math.PI * 2;
  const p = ((phase % τ) + τ) % τ;
  switch (w) {
    case "sine":
      return Math.sin(p);
    case "square":
      return Math.sign(Math.sin(p)) || 1;
    case "saw": {
      const t = (p / τ + 1) % 1;
      return 2 * t - 1;
    }
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(p));
    case "audio":
      return Math.sin(p);
    default:
      return Math.sin(p);
  }
}

export function lfoValue(settings: LfoSettings, tSec: number, min: number, max: number): number {
  const { frequency, depth, waveform, phase = 0, offset, invert } = settings;
  const span = max - min;
  const center = offset != null ? min + offset * span : min + span / 2;
  const amp = (span / 2) * clamp(depth, 0, 1);
  const phaseRad = (phase + tSec * frequency) * Math.PI * 2;
  const base = evalWaveform(waveform, phaseRad);
  const shaped = invert ? -base : base;
  const v = center + amp * shaped;
  return clamp(v, min, max);
}

export function phaseCaptureForTriangle(current: number, min: number, max: number, centerBias = 0.5) {
  const span = max - min || 1e-6;
  const center = min + span * centerBias;
  const x = clamp((current - center) / (span / 2), -1, 1);
  const tNorm = x <= 0 ? (x + 1) / 4 : (3 - x) / 4;
  return tNorm;
}
