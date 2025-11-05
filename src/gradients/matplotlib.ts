export type GradientStop = { color: string; stop: number };
export type GradientDefinition = { name: string; stops: GradientStop[] };

function parseHexColor(color: string): [number, number, number] {
  const normalized = color.trim().replace("#", "");
  if (normalized.length !== 6) {
    return [0, 0, 0];
  }
  const intVal = Number.parseInt(normalized, 16);
  if (Number.isNaN(intVal)) return [0, 0, 0];
  const r = (intVal >> 16) & 0xff;
  const g = (intVal >> 8) & 0xff;
  const b = intVal & 0xff;
  return [r, g, b];
}

function normalizeStops(stops: GradientStop[], invert: boolean): Array<GradientStop & { rgb: [number, number, number] }> {
  const normalized = stops.map((stop) => ({
    ...stop,
    rgb: parseHexColor(stop.color),
  }));
  if (!invert) return normalized;
  return normalized
    .slice()
    .reverse()
    .map((stop) => ({
      ...stop,
      stop: 100 - stop.stop,
    }));
}

export function createGradientCss(stops: GradientStop[], invert = false): string {
  const ordered = normalizeStops(stops, invert);
  const entries = ordered.map((stop) => `${stop.color} ${stop.stop}%`).join(", ");
  return `linear-gradient(90deg, ${entries})`;
}

export function buildPalette(stops: GradientStop[], invert = false): { data: Uint8ClampedArray; css: string[] } {
  const ordered = normalizeStops(stops, invert);
  const palette = new Uint8ClampedArray(256 * 4);
  const css: string[] = new Array(256);
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const current = ordered[i];
    const next = ordered[i + 1];
    const start = Math.round((current.stop / 100) * 255);
    const end = Math.round((next.stop / 100) * 255);
    const span = Math.max(1, end - start);
    for (let index = start; index <= end; index += 1) {
      const t = (index - start) / span;
      const r = Math.round(current.rgb[0] + (next.rgb[0] - current.rgb[0]) * t);
      const g = Math.round(current.rgb[1] + (next.rgb[1] - current.rgb[1]) * t);
      const b = Math.round(current.rgb[2] + (next.rgb[2] - current.rgb[2]) * t);
      const offset = index * 4;
      palette[offset] = r;
      palette[offset + 1] = g;
      palette[offset + 2] = b;
      palette[offset + 3] = 255;
      css[index] = `rgb(${r}, ${g}, ${b})`;
    }
  }
  // Ensure palette fully populated
  for (let index = 0; index < 256; index += 1) {
    const offset = index * 4;
    if (css[index]) continue;
    const source = css.find((value) => value !== undefined);
    if (!source) {
      css[index] = "rgb(0, 0, 0)";
      palette[offset] = 0;
      palette[offset + 1] = 0;
      palette[offset + 2] = 0;
      palette[offset + 3] = 255;
    } else {
      // Find nearest defined color
      let left = index - 1;
      while (left >= 0 && !css[left]) left -= 1;
      let right = index + 1;
      while (right < 256 && !css[right]) right += 1;
      const reference = left >= 0 ? left : right;
      const refOffset = reference * 4;
      css[index] = css[reference]!;
      palette[offset] = palette[refOffset];
      palette[offset + 1] = palette[refOffset + 1];
      palette[offset + 2] = palette[refOffset + 2];
      palette[offset + 3] = 255;
    }
  }
  return { data: palette, css };
}

export const MATPLOTLIB_GRADIENTS: GradientDefinition[] = [
  {
    name: "Viridis",
    stops: [
      { color: "#440154", stop: 0 },
      { color: "#3b528b", stop: 25 },
      { color: "#21918c", stop: 50 },
      { color: "#5ec962", stop: 75 },
      { color: "#fde725", stop: 100 },
    ],
  },
  {
    name: "Plasma",
    stops: [
      { color: "#0d0887", stop: 0 },
      { color: "#7e03a8", stop: 25 },
      { color: "#cc4778", stop: 50 },
      { color: "#f89441", stop: 75 },
      { color: "#f0f921", stop: 100 },
    ],
  },
  {
    name: "Inferno",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#420a68", stop: 25 },
      { color: "#932667", stop: 50 },
      { color: "#dd513a", stop: 75 },
      { color: "#fba40a", stop: 100 },
    ],
  },
  {
    name: "Magma",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#3b0f70", stop: 20 },
      { color: "#8c2981", stop: 40 },
      { color: "#de4968", stop: 65 },
      { color: "#fe9f6d", stop: 85 },
      { color: "#fcfdbf", stop: 100 },
    ],
  },
  {
    name: "Cividis",
    stops: [
      { color: "#00204c", stop: 0 },
      { color: "#2d708e", stop: 35 },
      { color: "#a2a929", stop: 70 },
      { color: "#f9f7a5", stop: 100 },
    ],
  },
  {
    name: "Turbo",
    stops: [
      { color: "#30123b", stop: 0 },
      { color: "#4145ab", stop: 20 },
      { color: "#4686f4", stop: 40 },
      { color: "#38bf6b", stop: 60 },
      { color: "#d7e21c", stop: 80 },
      { color: "#fca107", stop: 90 },
      { color: "#d62f27", stop: 100 },
    ],
  },
  {
    name: "Twilight",
    stops: [
      { color: "#e2d9ff", stop: 0 },
      { color: "#b8a0ff", stop: 15 },
      { color: "#8469f0", stop: 30 },
      { color: "#5b3fa8", stop: 45 },
      { color: "#3b1f65", stop: 60 },
      { color: "#5a375e", stop: 70 },
      { color: "#8c675d", stop: 80 },
      { color: "#c39d6a", stop: 90 },
      { color: "#f1d9a7", stop: 100 },
    ],
  },
  {
    name: "Coolwarm",
    stops: [
      { color: "#3b4cc0", stop: 0 },
      { color: "#6f92f3", stop: 25 },
      { color: "#f7f7f7", stop: 50 },
      { color: "#f49d7c", stop: 75 },
      { color: "#b40426", stop: 100 },
    ],
  },
  {
    name: "Spectral",
    stops: [
      { color: "#9e0142", stop: 0 },
      { color: "#f46d43", stop: 20 },
      { color: "#fee08b", stop: 40 },
      { color: "#e6f598", stop: 60 },
      { color: "#66c2a5", stop: 80 },
      { color: "#5e4fa2", stop: 100 },
    ],
  },
  {
    name: "Rainbow",
    stops: [
      { color: "#6e40aa", stop: 0 },
      { color: "#4178d4", stop: 20 },
      { color: "#1fa187", stop: 40 },
      { color: "#73d055", stop: 60 },
      { color: "#fde725", stop: 80 },
      { color: "#f97306", stop: 100 },
    ],
  },
  {
    name: "Monochrome",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Flexoki Monochrome",
    stops: [
      { color: "#100F0F", stop: 0 },
      { color: "#FFFCF0", stop: 100 },
    ],
  },
];
