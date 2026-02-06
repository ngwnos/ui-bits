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
