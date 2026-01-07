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
    name: "Blues",
    stops: [
      { color: "#f7fbff", stop: 0 },
      { color: "#c6dbef", stop: 25 },
      { color: "#6aaed6", stop: 50 },
      { color: "#2070b4", stop: 75 },
      { color: "#08306b", stop: 100 },
    ],
  },
  {
    name: "BuGn",
    stops: [
      { color: "#f7fcfd", stop: 0 },
      { color: "#ccece6", stop: 25 },
      { color: "#65c2a3", stop: 50 },
      { color: "#228a44", stop: 75 },
      { color: "#00441b", stop: 100 },
    ],
  },
  {
    name: "BuPu",
    stops: [
      { color: "#f7fcfd", stop: 0 },
      { color: "#bfd3e6", stop: 25 },
      { color: "#8c95c6", stop: 50 },
      { color: "#88409c", stop: 75 },
      { color: "#4d004b", stop: 100 },
    ],
  },
  {
    name: "GnBu",
    stops: [
      { color: "#f7fcf0", stop: 0 },
      { color: "#ccebc5", stop: 25 },
      { color: "#7accc4", stop: 50 },
      { color: "#2a8bbe", stop: 75 },
      { color: "#084081", stop: 100 },
    ],
  },
  {
    name: "Greens",
    stops: [
      { color: "#f7fcf5", stop: 0 },
      { color: "#c7e9c0", stop: 25 },
      { color: "#73c476", stop: 50 },
      { color: "#228a44", stop: 75 },
      { color: "#00441b", stop: 100 },
    ],
  },
  {
    name: "Oranges",
    stops: [
      { color: "#fff5eb", stop: 0 },
      { color: "#fdd0a2", stop: 25 },
      { color: "#fd8c3b", stop: 50 },
      { color: "#d84801", stop: 75 },
      { color: "#7f2704", stop: 100 },
    ],
  },
  {
    name: "OrRd",
    stops: [
      { color: "#fff7ec", stop: 0 },
      { color: "#fdd49e", stop: 25 },
      { color: "#fc8c59", stop: 50 },
      { color: "#d62f1e", stop: 75 },
      { color: "#7f0000", stop: 100 },
    ],
  },
  {
    name: "PuBu",
    stops: [
      { color: "#fff7fb", stop: 0 },
      { color: "#d0d1e6", stop: 25 },
      { color: "#73a9cf", stop: 50 },
      { color: "#056faf", stop: 75 },
      { color: "#023858", stop: 100 },
    ],
  },
  {
    name: "PuBuGn",
    stops: [
      { color: "#fff7fb", stop: 0 },
      { color: "#d0d1e6", stop: 25 },
      { color: "#66a9cf", stop: 50 },
      { color: "#028189", stop: 75 },
      { color: "#014636", stop: 100 },
    ],
  },
  {
    name: "PuRd",
    stops: [
      { color: "#f7f4f9", stop: 0 },
      { color: "#d4b9da", stop: 25 },
      { color: "#df64af", stop: 50 },
      { color: "#cd1256", stop: 75 },
      { color: "#67001f", stop: 100 },
    ],
  },
  {
    name: "Purples",
    stops: [
      { color: "#fcfbfd", stop: 0 },
      { color: "#dadaeb", stop: 25 },
      { color: "#9e9ac8", stop: 50 },
      { color: "#6950a3", stop: 75 },
      { color: "#3f007d", stop: 100 },
    ],
  },
  {
    name: "RdPu",
    stops: [
      { color: "#fff7f3", stop: 0 },
      { color: "#fcc5c0", stop: 25 },
      { color: "#f767a1", stop: 50 },
      { color: "#ad017e", stop: 75 },
      { color: "#49006a", stop: 100 },
    ],
  },
  {
    name: "Reds",
    stops: [
      { color: "#fff5f0", stop: 0 },
      { color: "#fcbba1", stop: 25 },
      { color: "#fb694a", stop: 50 },
      { color: "#ca181d", stop: 75 },
      { color: "#67000d", stop: 100 },
    ],
  },
  {
    name: "YlGn",
    stops: [
      { color: "#ffffe5", stop: 0 },
      { color: "#d9f0a3", stop: 25 },
      { color: "#77c679", stop: 50 },
      { color: "#228343", stop: 75 },
      { color: "#004529", stop: 100 },
    ],
  },
  {
    name: "YlGnBu",
    stops: [
      { color: "#ffffd9", stop: 0 },
      { color: "#c6e9b4", stop: 25 },
      { color: "#40b5c4", stop: 50 },
      { color: "#225da8", stop: 75 },
      { color: "#081d58", stop: 100 },
    ],
  },
  {
    name: "YlOrBr",
    stops: [
      { color: "#ffffe5", stop: 0 },
      { color: "#fee390", stop: 25 },
      { color: "#fe9829", stop: 50 },
      { color: "#cb4b02", stop: 75 },
      { color: "#662506", stop: 100 },
    ],
  },
  {
    name: "YlOrRd",
    stops: [
      { color: "#ffffcc", stop: 0 },
      { color: "#fed976", stop: 25 },
      { color: "#fd8c3c", stop: 50 },
      { color: "#e2191c", stop: 75 },
      { color: "#800026", stop: 100 },
    ],
  },
  {
    name: "Bone",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#38384e", stop: 25 },
      { color: "#707b90", stop: 50 },
      { color: "#a9c8c8", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Pink",
    stops: [
      { color: "#1e0000", stop: 0 },
      { color: "#a16868", stop: 25 },
      { color: "#d0ac94", stop: 50 },
      { color: "#e9e9b6", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Spring",
    stops: [
      { color: "#ff00ff", stop: 0 },
      { color: "#ff40bf", stop: 25 },
      { color: "#ff807f", stop: 50 },
      { color: "#ffc03f", stop: 75 },
      { color: "#ffff00", stop: 100 },
    ],
  },
  {
    name: "Summer",
    stops: [
      { color: "#008066", stop: 0 },
      { color: "#40a066", stop: 25 },
      { color: "#80c066", stop: 50 },
      { color: "#c0e066", stop: 75 },
      { color: "#ffff66", stop: 100 },
    ],
  },
  {
    name: "Autumn",
    stops: [
      { color: "#ff0000", stop: 0 },
      { color: "#ff4000", stop: 25 },
      { color: "#ff8000", stop: 50 },
      { color: "#ffc000", stop: 75 },
      { color: "#ffff00", stop: 100 },
    ],
  },
  {
    name: "Winter",
    stops: [
      { color: "#0000ff", stop: 0 },
      { color: "#0040df", stop: 25 },
      { color: "#0080bf", stop: 50 },
      { color: "#00c09f", stop: 75 },
      { color: "#00ff80", stop: 100 },
    ],
  },
  {
    name: "Cool",
    stops: [
      { color: "#00ffff", stop: 0 },
      { color: "#40bfff", stop: 25 },
      { color: "#807fff", stop: 50 },
      { color: "#c03fff", stop: 75 },
      { color: "#ff00ff", stop: 100 },
    ],
  },
  {
    name: "Wistia",
    stops: [
      { color: "#e4ff7a", stop: 0 },
      { color: "#ffe81a", stop: 25 },
      { color: "#ffbd00", stop: 50 },
      { color: "#ffa000", stop: 75 },
      { color: "#fc7f00", stop: 100 },
    ],
  },
  {
    name: "Hot",
    stops: [
      { color: "#0b0000", stop: 0 },
      { color: "#b30000", stop: 25 },
      { color: "#ff5c00", stop: 50 },
      { color: "#ffff07", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Afmhot",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#800000", stop: 25 },
      { color: "#ff8001", stop: 50 },
      { color: "#ffff81", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Gist Heat",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#600000", stop: 25 },
      { color: "#c00100", stop: 50 },
      { color: "#ff8103", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Copper",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#4f3220", stop: 25 },
      { color: "#9e6440", stop: 50 },
      { color: "#ed9660", stop: 75 },
      { color: "#ffc77f", stop: 100 },
    ],
  },
  {
    name: "Gist Earth",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#2b737e", stop: 25 },
      { color: "#5ea04b", stop: 50 },
      { color: "#bdab62", stop: 75 },
      { color: "#fdfbfb", stop: 100 },
    ],
  },
  {
    name: "Terrain",
    stops: [
      { color: "#333399", stop: 0 },
      { color: "#01cc66", stop: 25 },
      { color: "#fefe98", stop: 50 },
      { color: "#815e56", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Ocean",
    stops: [
      { color: "#008000", stop: 0 },
      { color: "#002040", stop: 25 },
      { color: "#004080", stop: 50 },
      { color: "#42a0c0", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Gist Stern",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#404080", stop: 25 },
      { color: "#8080fd", stop: 50 },
      { color: "#c0c011", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Brg",
    stops: [
      { color: "#0000ff", stop: 0 },
      { color: "#80007f", stop: 25 },
      { color: "#fe0100", stop: 50 },
      { color: "#7e8100", stop: 75 },
      { color: "#00ff00", stop: 100 },
    ],
  },
  {
    name: "CMRmap",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#4d26bf", stop: 25 },
      { color: "#ff4126", stop: 50 },
      { color: "#e6c01c", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Cubehelix",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#16534c", stop: 25 },
      { color: "#a1794a", stop: 50 },
      { color: "#c6b4ee", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Gnuplot",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#8004ff", stop: 25 },
      { color: "#b52000", stop: 50 },
      { color: "#dd6d00", stop: 75 },
      { color: "#ffff00", stop: 100 },
    ],
  },
  {
    name: "Gnuplot2",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#0100ff", stop: 25 },
      { color: "#c92ad5", stop: 50 },
      { color: "#ffaa55", stop: 75 },
      { color: "#ffffff", stop: 100 },
    ],
  },
  {
    name: "Nipy Spectral",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#0078dd", stop: 25 },
      { color: "#00bc00", stop: 50 },
      { color: "#ffc900", stop: 75 },
      { color: "#cccccc", stop: 100 },
    ],
  },
  {
    name: "Gist Ncar",
    stops: [
      { color: "#000080", stop: 0 },
      { color: "#00fbb0", stop: 25 },
      { color: "#dbff20", stop: 50 },
      { color: "#ff0047", stop: 75 },
      { color: "#fef8fe", stop: 100 },
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
      { color: "#100f0f", stop: 0 },
      { color: "#fffcf0", stop: 100 },
    ],
  },
];
