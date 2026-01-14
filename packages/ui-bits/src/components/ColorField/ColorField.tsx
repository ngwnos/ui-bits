import React from "react";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
import ColorPicker from "../ColorPicker";
import LFOSlider from "../LFOSlider";
import SegmentBar from "../SegmentBar";
import "./color-field.css";

export type ColorFieldBorderStyle = "a" | "b" | "none";

export interface ColorFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  alpha?: number;
  defaultAlpha?: number;
  onAlphaChange?: (alpha: number) => void;
  alphaControlId?: string;
  colorA?: string;
  colorB?: string;
  borderStyle?: ColorFieldBorderStyle;
  fontSize?: number;
  pickerHeightUnits?: number;
  width?: number | string;
  ariaLabel?: string;
  controlId?: string;
}

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const DEFAULT_COLOR = "#ffffff";
const DEFAULT_ALPHA = 255;
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;
const DEFAULT_PICKER_HEIGHT_UNITS = 6;
const OKLCH_MAX_CHROMA = 0.4;

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function sliderUnitHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function normalizeHex(value: string) {
  const trimmed = value.trim();
  const short = /^#([0-9a-fA-F]{3})$/;
  const long = /^#([0-9a-fA-F]{6})$/;
  const shortMatch = trimmed.match(short);
  if (shortMatch) {
    return `#${shortMatch[1].split("").map((char) => char + char).join("")}`;
  }
  if (long.test(trimmed)) return trimmed;
  return null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const hex = normalized.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
}

function clampAlpha(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_ALPHA;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampHexValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(0xffffff, Math.max(0, Math.round(value)));
}

function clampByte(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToInt(value: string) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  const hex = normalized.slice(1);
  const parsed = Number.parseInt(hex, 16);
  return Number.isNaN(parsed) ? null : parsed;
}

function intToHex(value: number) {
  const clamped = clampHexValue(value);
  return `#${clamped.toString(16).padStart(6, "0")}`;
}

function hsvToRgb(h: number, s: number, v: number) {
  const normalizedHue = ((h % 360) + 360) % 360;
  const c = v * s;
  const hp = normalizedHue / 60;
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
  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  if (delta !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / delta + 2) * 60;
        break;
      default:
        h = ((rn - gn) / delta + 4) * 60;
        break;
    }
  }
  return { h, s, v };
}

function hsvToHex(h: number, s: number, v: number) {
  const rgb = hsvToRgb(h, s, v);
  const value = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  return intToHex(value);
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function rgbToHex(r: number, g: number, b: number) {
  const red = clampByte(r);
  const green = clampByte(g);
  const blue = clampByte(b);
  const value = (red << 16) | (green << 8) | blue;
  return intToHex(value);
}

function srgbToLinear(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearToSrgb(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function rgbToOklch(r: number, g: number, b: number) {
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + b2 * b2);
  const H = ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h: H };
}

function rgbToOklchWithHue(r: number, g: number, b: number, fallbackHue: number) {
  const next = rgbToOklch(r, g, b);
  if (next.c < 0.001) {
    return { ...next, h: fallbackHue };
  }
  return next;
}

function oklchToLinearRgb(l: number, c: number, h: number) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

function isOklchInGamut(l: number, c: number, h: number) {
  const rgb = oklchToLinearRgb(l, c, h);
  const epsilon = 0.0001;
  return rgb.r >= -epsilon && rgb.r <= 1 + epsilon
    && rgb.g >= -epsilon && rgb.g <= 1 + epsilon
    && rgb.b >= -epsilon && rgb.b <= 1 + epsilon;
}

function findMaxChroma(l: number, h: number, targetC: number) {
  if (isOklchInGamut(l, targetC, h)) return targetC;
  let lo = 0;
  let hi = targetC;
  for (let i = 0; i < 12; i += 1) {
    const mid = (lo + hi) / 2;
    if (isOklchInGamut(l, mid, h)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function oklchToRgb(l: number, c: number, h: number) {
  const rgb = oklchToLinearRgb(l, c, h);
  return {
    r: Math.round(linearToSrgb(rgb.r) * 255),
    g: Math.round(linearToSrgb(rgb.g) * 255),
    b: Math.round(linearToSrgb(rgb.b) * 255),
  };
}

function oklchToRgbGamutMapped(l: number, c: number, h: number) {
  if (isOklchInGamut(l, c, h)) return oklchToRgb(l, c, h);
  const mappedC = findMaxChroma(l, h, c);
  return oklchToRgb(l, mappedC, h);
}

function oklchToHex(l: number, c: number, h: number) {
  const rgb = oklchToRgbGamutMapped(l, c, h);
  const value = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  return intToHex(value);
}

function parseHexInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const normalized = normalizeHex(cleaned);
  return normalized ? hexToInt(normalized) : null;
}

const ColorField = React.forwardRef<HTMLDivElement, ColorFieldProps>((props, ref) => {
  const {
    value,
    defaultValue = DEFAULT_COLOR,
    onChange,
    label = "Color",
    alpha,
    defaultAlpha = DEFAULT_ALPHA,
    onAlphaChange,
    alphaControlId,
    colorA,
    colorB,
    borderStyle,
    fontSize,
    pickerHeightUnits,
    width,
    ariaLabel,
    controlId,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const labelText = label.trim();
  const resolvedAriaLabel = ariaLabel ?? labelText;
  const resolvedControlId = useResolvedControlId(controlId, resolvedAriaLabel);
  const [storeValue, setStoreValue] = useControlValue<string>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const isControlled = resolvedValueProp !== undefined;
  const resolvedAlphaControlId = useResolvedControlId(
    alphaControlId,
    resolvedAriaLabel ? `${resolvedAriaLabel} alpha` : undefined,
  );
  const [storeAlpha, setStoreAlpha] = useControlValue<number>(resolvedAlphaControlId);
  const shouldUseAlphaStore = resolvedAlphaControlId !== undefined && alpha === undefined;
  const resolvedAlphaProp = shouldUseAlphaStore ? storeAlpha : alpha;
  const isAlphaControlled = resolvedAlphaProp !== undefined;
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedWidth = resolveSize(width);
  const resolvedPickerUnits = Math.max(1, Math.round(pickerHeightUnits ?? DEFAULT_PICKER_HEIGHT_UNITS));
  const fallbackValue = normalizeHex(defaultValue) ?? DEFAULT_COLOR;
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const resolvedValue = isControlled ? (normalizeHex(resolvedValueProp ?? "") ?? fallbackValue) : internalValue;
  const resolvedHexValue = clampHexValue(hexToInt(resolvedValue) ?? 0);
  const [internalAlpha, setInternalAlpha] = React.useState(() => clampAlpha(defaultAlpha));
  const resolvedAlpha = clampAlpha(
    isAlphaControlled ? (resolvedAlphaProp ?? defaultAlpha) : internalAlpha,
  );

  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(resolvedValue);
  }, [resolvedValue, setStoreValue, shouldUseStore, storeValue]);
  React.useEffect(() => {
    if (!shouldUseAlphaStore || storeAlpha !== undefined) return;
    setStoreAlpha(resolvedAlpha);
  }, [resolvedAlpha, setStoreAlpha, shouldUseAlphaStore, storeAlpha]);

  const commitValue = React.useCallback((nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (shouldUseStore) {
      setStoreValue(nextValue);
    }
    onChange?.(nextValue);
  }, [isControlled, onChange, setStoreValue, shouldUseStore]);
  const commitAlpha = React.useCallback((nextValue: number) => {
    if (!isAlphaControlled) {
      setInternalAlpha(nextValue);
    }
    if (shouldUseAlphaStore) {
      setStoreAlpha(nextValue);
    }
    onAlphaChange?.(nextValue);
  }, [isAlphaControlled, onAlphaChange, setStoreAlpha, shouldUseAlphaStore]);

  const handlePickerChange = (nextValue: string) => {
    const normalized = normalizeHex(nextValue) ?? fallbackValue;
    commitValue(normalized);
  };

  const gap = Math.round(resolvedFontSize * 0.5);
  const alphaWidth = Math.round(resolvedFontSize * 7);
  const resolvedBorder = resolvedBorderStyle === "b"
    ? "b"
    : resolvedBorderStyle === "none"
      ? "none"
      : "a";
  const swatchRgb = hexToRgb(resolvedValue) ?? { r: 255, g: 255, b: 255 };
  const swatchColor = `rgba(${swatchRgb.r}, ${swatchRgb.g}, ${swatchRgb.b}, ${resolvedAlpha / 255})`;
  const popoverHeight = sliderUnitHeight(resolvedFontSize) * resolvedPickerUnits;
  const popoverOffset = sliderUnitHeight(resolvedFontSize);
  const popoverBorderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const popoverRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));
  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const workerPoolRef = React.useRef<Worker[]>([]);
  const paintTokenRef = React.useRef(0);
  const canvasSizeRef = React.useRef({ width: 0, height: 0 });
  const lastCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const draggingRef = React.useRef(false);
  const activeRegionRef = React.useRef<"plane" | "hue" | null>(null);
  const [canvasMetrics, setCanvasMetrics] = React.useState({ width: 0, height: 0, barHeight: 0 });
  const [hsvState, setHsvState] = React.useState(() => {
    const rgb = hexToRgb(resolvedValue) ?? { r: 255, g: 255, b: 255 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });
  const hsvRef = React.useRef(hsvState);
  const [rgbState, setRgbState] = React.useState(() => (
    hexToRgb(resolvedValue) ?? { r: 255, g: 255, b: 255 }
  ));
  const rgbRef = React.useRef(rgbState);
  const [oklchState, setOklchState] = React.useState(() => {
    const rgb = hexToRgb(resolvedValue) ?? { r: 255, g: 255, b: 255 };
    return rgbToOklch(rgb.r, rgb.g, rgb.b);
  });
  const oklchRef = React.useRef(oklchState);
  const [colorMode, setColorMode] = React.useState<"hsv" | "rgb" | "oklch">("oklch");
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [popoverPlacement, setPopoverPlacement] = React.useState<"below" | "above">("below");

  React.useEffect(() => {
    hsvRef.current = hsvState;
  }, [hsvState]);
  React.useEffect(() => {
    rgbRef.current = rgbState;
  }, [rgbState]);
  React.useEffect(() => {
    oklchRef.current = oklchState;
  }, [oklchState]);

  React.useEffect(() => {
    // Skip sync when dragging - we already updated state directly
    if (draggingRef.current) return;
    const rgb = hexToRgb(resolvedValue);
    if (!rgb) return;
    const next = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hsvRef.current = next;
    setHsvState(next);
    rgbRef.current = rgb;
    setRgbState(rgb);
    const nextOklch = rgbToOklchWithHue(rgb.r, rgb.g, rgb.b, oklchRef.current.h);
    oklchRef.current = nextOklch;
    setOklchState(nextOklch);
  }, [resolvedValue]);

  const prevColorModeRef = React.useRef(colorMode);
  React.useEffect(() => {
    // Only sync when color mode actually changes, not on every resolvedValue change
    if (prevColorModeRef.current === colorMode) return;
    prevColorModeRef.current = colorMode;
    const rgb = hexToRgb(resolvedValue);
    if (!rgb) return;
    if (colorMode === "oklch") {
      const nextOklch = rgbToOklchWithHue(rgb.r, rgb.g, rgb.b, oklchRef.current.h);
      oklchRef.current = nextOklch;
      setOklchState(nextOklch);
    } else if (colorMode === "rgb") {
      rgbRef.current = rgb;
      setRgbState(rgb);
    } else {
      const nextHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      hsvRef.current = nextHsv;
      setHsvState(nextHsv);
    }
  }, [colorMode, resolvedValue]);

  React.useEffect(() => {
    if (!isPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!fieldRef.current || !event.target) return;
      if (fieldRef.current.contains(event.target as Node)) return;
      setIsPickerOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isPickerOpen]);

  const updatePopoverPlacement = React.useCallback(() => {
    if (!fieldRef.current || typeof window === "undefined") return;
    const rect = fieldRef.current.getBoundingClientRect();
    const nextPlacement = rect.top + popoverOffset + popoverHeight > window.innerHeight
      ? "above"
      : "below";
    setPopoverPlacement((prev) => (prev === nextPlacement ? prev : nextPlacement));
  }, [popoverHeight, popoverOffset]);

  React.useEffect(() => {
    if (!isPickerOpen || typeof window === "undefined") return;
    const handleUpdate = () => updatePopoverPlacement();
    const frame = window.requestAnimationFrame(handleUpdate);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isPickerOpen, updatePopoverPlacement]);

  React.useEffect(() => {
    if (!isPickerOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (lastCanvasRef.current !== canvas) {
      canvasSizeRef.current = { width: 0, height: 0 };
      lastCanvasRef.current = canvas;
    }
  }, [isPickerOpen]);

  React.useEffect(() => {
    if (!isPickerOpen || typeof window === "undefined") return;
    const ensureWorkers = (count: number) => {
      const pool = workerPoolRef.current;
      if (pool.length === count) return pool;
      if (pool.length > count) {
        const extras = pool.splice(count);
        extras.forEach((worker) => worker.terminate());
      } else {
        for (let i = pool.length; i < count; i += 1) {
          pool.push(new Worker(new URL("./color-field.worker.ts", import.meta.url), { type: "module" }));
        }
      }
      return pool;
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      const barHeight = Math.max(1, Math.round(sliderUnitHeight(resolvedFontSize) * dpr));
      const nextMetrics = {
        width: rect.width,
        height: rect.height,
        barHeight: sliderUnitHeight(resolvedFontSize),
      };
      setCanvasMetrics((prev) => (
        prev.width === nextMetrics.width
          && prev.height === nextMetrics.height
          && prev.barHeight === nextMetrics.barHeight
          ? prev
          : nextMetrics
      ));
      if (canvasSizeRef.current.width !== width || canvasSizeRef.current.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvasSizeRef.current = { width, height };
      }
      paintTokenRef.current += 1;
      const token = paintTokenRef.current;
      const planeMode = colorMode;
      const hue = planeMode === "oklch"
        ? oklchRef.current.h
        : planeMode === "hsv"
          ? hsvRef.current.h
          : 0;
      const stripeHeight = Math.max(1, Math.round(sliderUnitHeight(resolvedFontSize) * dpr));
      const stripeCount = Math.max(1, Math.ceil(height / stripeHeight));
      const workers = ensureWorkers(stripeCount);
      workers.forEach((worker, index) => {
        const yStart = index * stripeHeight;
        const yEnd = Math.min(height, yStart + stripeHeight);
        worker.onmessage = (event) => {
          if (event.data?.token !== token) return;
          const pixels = new Uint8ClampedArray(event.data.pixels);
          const sliceHeight = event.data.height as number;
          const imageData = new ImageData(pixels, width, sliceHeight);
          ctx.putImageData(imageData, 0, yStart);
        };
        worker.postMessage({
          width,
          height,
          barHeight,
          yStart,
          yEnd,
          hue,
          mode: planeMode,
          planeL: oklchRef.current.l,
          planeC: oklchRef.current.c,
          planeR: rgbRef.current.r,
          planeG: rgbRef.current.g,
          planeB: rgbRef.current.b,
          planeS: hsvRef.current.s,
          planeHsvV: hsvRef.current.v,
          token,
        });
      });
    };

    const handleResize = () => paint();
    paint();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    isPickerOpen,
    resolvedFontSize,
    hsvState.h,
    hsvState.s,
    hsvState.v,
    oklchState.h,
    oklchState.l,
    oklchState.c,
    rgbState.r,
    rgbState.g,
    rgbState.b,
    colorMode,
  ]);

  React.useEffect(() => (
    () => {
      workerPoolRef.current.forEach((worker) => worker.terminate());
      workerPoolRef.current = [];
    }
  ), []);

  const handleRef = React.useCallback((node: HTMLDivElement | null) => {
    fieldRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  const updateFromPointer = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const barHeight = canvasMetrics.barHeight || sliderUnitHeight(resolvedFontSize);
    const planeHeight = Math.max(1, rect.height - barHeight);
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    const planeMode = colorMode;
    const region = activeRegionRef.current
      ?? (y >= planeHeight ? "hue" : "plane");
    if (region === "plane") {
      if (planeMode === "oklch") {
        // Plane: X = Hue, Y = Chroma (high at top)
        const ratioX = clamp01(rect.width > 0 ? x / rect.width : 0);
        const ratioY = clamp01(planeHeight > 0 ? y / planeHeight : 0);
        const next = {
          ...oklchRef.current,
          h: ratioX * 360,
          c: (1 - ratioY) * OKLCH_MAX_CHROMA,
        };
        oklchRef.current = next;
        setOklchState(next);
        commitValue(oklchToHex(next.l, next.c, next.h));
      } else if (planeMode === "rgb") {
        const ratioX = clamp01(rect.width > 0 ? x / rect.width : 0);
        const ratioY = clamp01(planeHeight > 0 ? y / planeHeight : 0);
        const next = {
          ...rgbRef.current,
          r: ratioX * 255,
          g: (1 - ratioY) * 255,
        };
        rgbRef.current = next;
        setRgbState(next);
        commitValue(rgbToHex(next.r, next.g, next.b));
      } else {
        const ratioX = clamp01(rect.width > 0 ? x / rect.width : 0);
        const ratioY = clamp01(planeHeight > 0 ? y / planeHeight : 0);
        const next = {
          ...hsvRef.current,
          s: ratioX,
          v: 1 - ratioY,
        };
        hsvRef.current = next;
        setHsvState(next);
        commitValue(hsvToHex(next.h, next.s, next.v));
      }
    } else if (planeMode === "oklch") {
      // Bar: X = Lightness
      const next = {
        ...oklchRef.current,
        l: clamp01(rect.width > 0 ? x / rect.width : 0),
      };
      oklchRef.current = next;
      setOklchState(next);
      commitValue(oklchToHex(next.l, next.c, next.h));
    } else if (planeMode === "rgb") {
      const next = {
        ...rgbRef.current,
        b: clamp01(rect.width > 0 ? x / rect.width : 0) * 255,
      };
      rgbRef.current = next;
      setRgbState(next);
      commitValue(rgbToHex(next.r, next.g, next.b));
    } else {
      const next = {
        ...hsvRef.current,
        h: clamp01(rect.width > 0 ? x / rect.width : 0) * 360,
      };
      hsvRef.current = next;
      setHsvState(next);
      commitValue(hsvToHex(next.h, next.s, next.v));
    }
  }, [canvasMetrics.barHeight, colorMode, commitValue, resolvedFontSize]);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const barHeight = canvasMetrics.barHeight || sliderUnitHeight(resolvedFontSize);
    const planeHeight = Math.max(1, rect.height - barHeight);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    activeRegionRef.current = y >= planeHeight ? "hue" : "plane";
    draggingRef.current = true;
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggingRef.current) return;
    updateFromPointer(event);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    activeRegionRef.current = null;
    (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={handleRef}
      className={[
        "ui-bits-color-field",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        width: resolvedWidth,
        gap,
        position: "relative",
        overflow: "visible",
        ...(style ?? {}),
      }}
      {...rest}
    >
      <ColorPicker
        value={resolvedValue}
        onChange={handlePickerChange}
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        borderStyle={resolvedBorderStyle}
        fontSize={resolvedFontSize}
        style={{ background: swatchColor }}
        aria-label={resolvedAriaLabel ? `${resolvedAriaLabel} color` : "Color swatch"}
        onClick={() => setIsPickerOpen((prev) => !prev)}
      />
      <LFOSlider
        label={labelText}
        ariaLabel={resolvedAriaLabel ? `${resolvedAriaLabel} hex` : "Hex color value"}
        showLabel={labelText.length > 0}
        variant="full"
        min={0}
        max={0xffffff}
        step={1}
        value={resolvedHexValue}
        onUserChange={(next) => commitValue(intToHex(next))}
        width="100%"
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        border={resolvedBorder}
        fontSize={resolvedFontSize}
        showLfoControls={false}
        formatEditingValue
        formatDisplayValue={(value) => intToHex(value)}
        parseDisplayValue={(input) => parseHexInput(input)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <LFOSlider
        label="A"
        showLabel
        variant="basic"
        min={0}
        max={255}
        step={1}
        value={resolvedAlpha}
        onUserChange={(next) => commitAlpha(clampAlpha(next))}
        width={alphaWidth}
        colorA={resolvedColorA}
        colorB={resolvedColorB}
        border={resolvedBorder}
        fontSize={resolvedFontSize}
        formatDisplayValue={(value) => `${Math.round(value)}`}
        style={{ flex: `0 0 ${alphaWidth}px` }}
      />
      {isPickerOpen ? (
        <div
          style={{
            position: "absolute",
            top: popoverPlacement === "above"
              ? -(popoverHeight + popoverOffset)
              : popoverOffset,
            left: 0,
            width: "100%",
            height: popoverHeight,
            borderRadius: popoverRadius,
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: popoverBorderColor,
            background: resolvedColorA,
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            boxSizing: "border-box",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SegmentBar
            options={[
              { value: "hsv", label: "HSV" },
              { value: "rgb", label: "RGB" },
              { value: "oklch", label: "OKLCH" },
            ]}
            value={colorMode}
            onChange={(next) => setColorMode(next as "hsv" | "rgb" | "oklch")}
            colorA={resolvedColorA}
            colorB={resolvedColorB}
            borderStyle={resolvedBorderStyle}
            borderMask={{ top: false, left: false, right: false, bottom: true }}
            fontSize={resolvedFontSize}
          />
          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              borderBottomLeftRadius: popoverRadius,
              borderBottomRightRadius: popoverRadius,
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
              }}
            />
            {canvasMetrics.width > 0 && canvasMetrics.height > 0 ? (
              (() => {
                const planeMode = colorMode;
                const planeHeight = Math.max(1, canvasMetrics.height - canvasMetrics.barHeight);
                // OKLCH: X = Hue, Y = Chroma (high at top)
                // Others: X = S or R, Y = V or G (inverted)
                const planeX = planeMode === "oklch"
                  ? clamp01(oklchState.h / 360) * canvasMetrics.width
                  : planeMode === "rgb"
                    ? clamp01(rgbState.r / 255) * canvasMetrics.width
                    : clamp01(hsvState.s) * canvasMetrics.width;
                const planeY = planeMode === "oklch"
                  ? clamp01(1 - oklchState.c / OKLCH_MAX_CHROMA) * planeHeight
                  : planeMode === "rgb"
                    ? clamp01(1 - rgbState.g / 255) * planeHeight
                    : clamp01(1 - hsvState.v) * planeHeight;
                // OKLCH bar: Lightness, Others: Hue or Blue
                const barValue = planeMode === "oklch"
                  ? oklchState.l
                  : planeMode === "rgb"
                    ? rgbState.b / 255
                    : hsvState.h / 360;
                const barX = clamp01(barValue) * canvasMetrics.width;
                return (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: `${planeX}px`,
                        top: `${planeY}px`,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.85)",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${barX}px`,
                        top: `${Math.max(1, canvasMetrics.height - canvasMetrics.barHeight) + canvasMetrics.barHeight / 2}px`,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.85)",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                      }}
                    />
                  </>
                );
              })()
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
});

ColorField.displayName = "ColorField";

export default ColorField;
