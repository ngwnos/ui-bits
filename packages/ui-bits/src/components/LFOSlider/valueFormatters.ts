import { clamp } from "../../lfo";

export type DisplayValueFormatReason = 'value' | 'drawer';

export interface DisplayValueFormatContext {
  reason: DisplayValueFormatReason;
  rawValueText: string;
}

export type FormatDisplayValueFn = (value: number, context: DisplayValueFormatContext) => string;
export type ParseDisplayValueFn = (text: string) => number | null | undefined;

export type DisplayValueFormatterPreset = 'dayOfYear' | 'time';

export interface DayOfYearFormatterOptions {
  baseYear?: number;
  zeroOffset?: number;
  locale?: string;
}

export interface DisplayFormatterPresetOptions {
  dayOfYear?: DayOfYearFormatterOptions;
  time?: TimeFormatterOptions;
}

export interface DisplayFormatterResult {
  format: FormatDisplayValueFn;
  parse: ParseDisplayValueFn;
  formatLabel: (value: number) => string;
}

export interface TimeFormatterOptions {
  zeroOffset?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAY_OF_YEAR_BASE_YEAR = 2023;
const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_LOOKUP = MONTH_ORDER.reduce<Record<string, number>>((acc, label, index) => {
  acc[label] = index;
  return acc;
}, {});
const MONTH_DAY_REGEX = /^([A-Za-z]{3})\s+(\d{1,2})$/;
const TIME_REGEX = /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/;

export function createDayOfYearFormatter({
  min,
  max,
  options,
}: {
  min: number;
  max: number;
  options?: DayOfYearFormatterOptions;
}): DisplayFormatterResult {
  const baseYear = options?.baseYear ?? DEFAULT_DAY_OF_YEAR_BASE_YEAR;
  const zeroOffset = options?.zeroOffset ?? min;
  const locale = options?.locale ?? "en-US";
  const clampValue = (value: number) => clamp(value, min, max);
  const formatter = new Intl.DateTimeFormat(locale, { month: "short", day: "2-digit", timeZone: "UTC" });
  const baseMs = Date.UTC(baseYear, 0, 1);
  const maxOffset = max - zeroOffset;
  const normalizeOffset = (offset: number) => clamp(offset, 0, maxOffset);
  const formatLabel = (value: number) => {
    if (!Number.isFinite(value)) return "";
    const clamped = clampValue(value);
    const offset = normalizeOffset(clamped - zeroOffset);
    const wholeDays = Math.floor(offset);
    const fractionalMs = Math.round((offset - wholeDays) * DAY_MS);
    const target = new Date(baseMs + wholeDays * DAY_MS + fractionalMs);
    return formatter.format(target);
  };
  const parse: ParseDisplayValueFn = (text) => {
    if (!text) return null;
    const compact = text.trim();
    if (!compact) return null;
    const match = MONTH_DAY_REGEX.exec(compact);
    if (match) {
      const monthKey = match[1].toUpperCase();
      const dayNumber = Number(match[2]);
      const monthIndex = MONTH_LOOKUP[monthKey];
      if (monthIndex != null && Number.isFinite(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
        const candidate = new Date(Date.UTC(baseYear, monthIndex, dayNumber));
        if (
          candidate.getUTCFullYear() === baseYear &&
          candidate.getUTCMonth() === monthIndex &&
          candidate.getUTCDate() === dayNumber
        ) {
          const offsetDays = (candidate.getTime() - baseMs) / DAY_MS;
          const rawValue = zeroOffset + offsetDays;
          return clampValue(rawValue);
        }
      }
    }
    const numeric = Number(compact);
    if (Number.isFinite(numeric)) return clampValue(numeric);
    return null;
  };
  const format: FormatDisplayValueFn = (value, { rawValueText }) => {
    const label = formatLabel(value);
    return label || rawValueText;
  };
  return { format, parse, formatLabel };
}

export function createTimeFormatter({
  min,
  max,
  options,
}: {
  min: number;
  max: number;
  options?: TimeFormatterOptions;
}): DisplayFormatterResult {
  const zeroOffset = options?.zeroOffset ?? min;
  const clampValue = (value: number) => clamp(value, min, max);
  const span = Math.max(0, max - min);
  const secondsFromValue = (value: number) => clampValue(value) - zeroOffset;
  const formatLabel = (value: number) => {
    const seconds = secondsFromValue(value);
    if (!Number.isFinite(seconds)) return "";
    const clampedSeconds = clamp(seconds, 0, span);
    const hrs = Math.floor(clampedSeconds / 3600) % 24;
    const mins = Math.floor((clampedSeconds % 3600) / 60);
    const secs = Math.floor(clampedSeconds % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };
  const parse: ParseDisplayValueFn = (text) => {
    if (!text) return null;
    const compact = text.trim();
    if (!compact) return null;
    const match = TIME_REGEX.exec(compact);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      const s = Number(match[3]);
      if ([h, m, s].every((n) => Number.isFinite(n))) {
        if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
          const offset = h * 3600 + m * 60 + s;
          return clampValue(zeroOffset + offset);
        }
      }
    }
    const numeric = Number(compact);
    if (Number.isFinite(numeric)) return clampValue(numeric);
    return null;
  };
  const format: FormatDisplayValueFn = (value, { rawValueText }) => {
    const label = formatLabel(value);
    return label || rawValueText;
  };
  return { format, parse, formatLabel };
}
