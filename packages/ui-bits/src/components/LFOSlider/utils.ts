import { splitFromValue, valueFromSplit } from "../../lfo";

export function normalizeSelection(a: number, b: number, max: number): [number, number] {
  const s = Math.max(0, Math.min(a, b));
  const e = Math.min(max, Math.max(a, b));
  return [s, e];
}

export function applyReplace(base: string, start: number, end: number, insert: string) {
  const before = base.slice(0, start);
  const after = base.slice(end);
  const next = before + insert + after;
  const pos = before.length + insert.length; // collapsed caret after insertion
  return { next, pos };
}

export function isAllowedNumericChar(k: string): boolean {
  if (k.length === 1) return /^[0-9.-]$/.test(k);
  if (/^Numpad[0-9]$/.test(k)) return true;
  if (k === "NumpadDecimal") return true;
  if (k === "NumpadSubtract") return true;
  return false;
}

export function countDecimals(n: number): number {
  if (!isFinite(n)) return 0;
  if (Math.floor(n) === n) return 0;
  const s = n.toString().toLowerCase();
  if (s.includes("e-")) {
    const p = parseInt(s.split("e-")[1], 10);
    return Number.isNaN(p) ? 0 : p;
  }
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

export function precisionFrom(min: number, max: number, step: number): number {
  return Math.max(countDecimals(min), countDecimals(max), countDecimals(step));
}

export function hexToRGBA(hex: string, alpha: number) {
  const trimmed = hex.trim();
  const isShort = /^#?[0-9a-fA-F]{3}$/.test(trimmed);
  const isLong = /^#?[0-9a-fA-F]{6}$/.test(trimmed);
  if (!isShort && !isLong) return `rgba(0,0,0,${alpha})`;
  const normalized = trimmed.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  const intVal = parseInt(full, 16);
  if (Number.isNaN(intVal)) return `rgba(0,0,0,${alpha})`;
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function extendStep(anchor: number, selStart: number, selEnd: number, dir: -1 | 1, textLen: number): [number, number] {
  const clampIndex = (i: number) => Math.max(0, Math.min(textLen, i));
  const head = selStart === anchor ? selEnd : selStart;
  const newHead = clampIndex(head + dir);
  return normalizeSelection(anchor, newHead, textLen);
}

function runDevTests() {
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  console.assert(eq(normalizeSelection(5, 2, 10), [2, 5]), "normalizeSelection basic");
  console.assert(eq(normalizeSelection(-3, 100, 6), [0, 6]), "normalizeSelection clamps");
  console.assert(eq(normalizeSelection(4, 4, 7), [4, 4]), "normalizeSelection equal");
  console.assert(eq(normalizeSelection(0, 0, 0), [0, 0]), "normalizeSelection empty max");

  let r = applyReplace("abc", 0, 3, "X");
  console.assert(eq([r.next, r.pos], ["X", 1]), "replace all with X");
  r = applyReplace("abc", 1, 1, "Z");
  console.assert(eq([r.next, r.pos], ["aZbc", 2]), "insert at 1");
  r = applyReplace("abcdef", 2, 4, "");
  console.assert(eq([r.next, r.pos], ["abef", 2]), "delete middle range");
  r = applyReplace("hello", 5, 5, "!");
  console.assert(eq([r.next, r.pos], ["hello!", 6]), "insert at end");

  console.assert(isAllowedNumericChar("0") === true, "numeric 0");
  console.assert(isAllowedNumericChar("9") === true, "numeric 9");
  console.assert(isAllowedNumericChar(".") === true, "numeric dot");
  console.assert(isAllowedNumericChar("-") === true, "numeric minus");
  console.assert(isAllowedNumericChar("Numpad4") === true, "numeric numpad digit");
  console.assert(isAllowedNumericChar("NumpadDecimal") === true, "numeric numpad decimal");
  console.assert(isAllowedNumericChar("NumpadSubtract") === true, "numeric numpad minus");
  console.assert(isAllowedNumericChar("a") === false, "numeric letter");
  console.assert(isAllowedNumericChar(",") === false, "numeric comma");

  console.assert(countDecimals(1) === 0, "countDecimals int");
  console.assert(countDecimals(0.001) === 3, "countDecimals 0.001");
  console.assert(precisionFrom(0.001, 100, 1) === 3, "precisionFrom min dominates");
  console.assert(precisionFrom(0, 1, 0.01) === 2, "precisionFrom step dominates");
  console.assert(precisionFrom(0.1, 0.001, 1) === 3, "precisionFrom mixed cases");

  console.assert(splitFromValue(0, 0, 10) === 0, "splitFromValue min");
  console.assert(splitFromValue(10, 0, 10) === 1, "splitFromValue max");
  console.assert(valueFromSplit(0, 0, 10, 1) === 0, "valueFromSplit min");
  console.assert(valueFromSplit(1, 0, 10, 1) === 10, "valueFromSplit max");

  let rng = extendStep(5, 5, 5, -1 as -1, 10);
  console.assert(JSON.stringify(rng) === JSON.stringify([4, 5]), "extend left from caret");
  rng = extendStep(5, rng[0], rng[1], -1 as -1, 10);
  console.assert(JSON.stringify(rng) === JSON.stringify([3, 5]), "extend left continues");
  rng = extendStep(3, 3, 5, +1 as 1, 10);
  console.assert(JSON.stringify(rng) === JSON.stringify([3, 6]), "extend right from left-anchored");
}

if (typeof window !== "undefined") {
  const globalWindow = window as Window & { __EditableRectPOC_TestsDone?: boolean };
  if (!globalWindow.__EditableRectPOC_TestsDone) {
    try {
      runDevTests();
    } catch {
      // ignore test failures in production
    }
    globalWindow.__EditableRectPOC_TestsDone = true;
  }
}
