type PaintMessage = {
  width: number;
  height: number;
  barHeight: number;
  yStart: number;
  yEnd: number;
  hue: number;
  mode: "hsl" | "oklch" | "rgb";
  planeL: number;
  planeC: number;
  planeR: number;
  planeG: number;
  planeB: number;
  token: number;
};

const OKLCH_MAX_CHROMA = 0.4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp >= 1 && hp < 2) {
    r = x;
    g = c;
  } else if (hp >= 2 && hp < 3) {
    g = c;
    b = x;
  } else if (hp >= 3 && hp < 4) {
    g = x;
    b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x;
    b = c;
  } else if (hp >= 5 && hp < 6) {
    r = c;
    b = x;
  }
  const m = l - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function linearToSrgb(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function oklchToRgb(l: number, c: number, h: number) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  const rLin = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
  return {
    r: Math.round(linearToSrgb(rLin) * 255),
    g: Math.round(linearToSrgb(gLin) * 255),
    b: Math.round(linearToSrgb(bLin) * 255),
  };
}

function fillPixels(
  width: number,
  height: number,
  barHeight: number,
  yStart: number,
  yEnd: number,
  hue: number,
  mode: "hsl" | "oklch" | "rgb",
  planeL: number,
  planeC: number,
  planeR: number,
  planeG: number,
  planeB: number,
) {
  const sliceHeight = Math.max(0, yEnd - yStart);
  const pixels = new Uint8ClampedArray(width * sliceHeight * 4);
  const maxX = Math.max(1, width - 1);
  const planeHeight = Math.max(0, height - barHeight);
  const maxY = Math.max(1, planeHeight - 1);
  for (let y = yStart; y < yEnd; y += 1) {
    const localY = y - yStart;
    for (let x = 0; x < width; x += 1) {
      const isBar = y >= planeHeight;
      const color = isBar
        ? (mode === "oklch"
          ? oklchToRgb(planeL, planeC, (x / maxX) * 360)
          : mode === "rgb"
            ? {
              r: clamp(planeR, 0, 255),
              g: clamp(planeG, 0, 255),
              b: Math.round((x / maxX) * 255),
            }
            : hslToRgb((x / maxX) * 360, 1, 0.5))
        : (mode === "oklch"
          ? oklchToRgb(1 - y / maxY, (x / maxX) * OKLCH_MAX_CHROMA, hue)
          : mode === "rgb"
            ? {
              r: Math.round((x / maxX) * 255),
              g: Math.round((1 - y / maxY) * 255),
              b: clamp(planeB, 0, 255),
            }
            : hslToRgb(hue, x / maxX, 1 - y / maxY));
      const idx = (localY * width + x) * 4;
      pixels[idx] = color.r;
      pixels[idx + 1] = color.g;
      pixels[idx + 2] = color.b;
      pixels[idx + 3] = 255;
    }
  }
  return pixels;
}

self.onmessage = (event: MessageEvent<PaintMessage>) => {
  const {
    width,
    height,
    barHeight,
    yStart,
    yEnd,
    hue,
    mode,
    planeL,
    planeC,
    planeR,
    planeG,
    planeB,
    token,
  } = event.data;
  const pixels = fillPixels(
    width,
    height,
    clamp(barHeight, 1, height),
    clamp(yStart, 0, height),
    clamp(yEnd, 0, height),
    hue,
    mode,
    planeL,
    planeC,
    planeR,
    planeG,
    planeB,
  );
  self.postMessage({ pixels, width, height: Math.max(0, yEnd - yStart), token }, [pixels.buffer]);
};
