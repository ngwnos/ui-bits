import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { flexoki, flexokiShades, type FlexokiHue } from "ui-bits";

const paletteHues: FlexokiHue[] = ['base', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'magenta'];
const shadesReversed = [...flexokiShades].reverse();
const tailwindShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;
const tailwindHues = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const;
const paletteTabs = [
  { id: 'flexoki', label: 'Flexoki' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'hsv', label: 'HSV' },
] as const;

const SWATCH_SIZE = 28;
const HSV_DEFAULT_HUE = 0;

type TailwindHue = (typeof tailwindHues)[number];
type TailwindShade = (typeof tailwindShades)[number];

const tailwindPalette: Record<TailwindHue, Record<TailwindShade, string>> = {
  red: {
    '50': '#fef2f2',
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
    '800': '#991b1b',
    '900': '#7f1d1d',
    '950': '#450a0a',
  },
  orange: {
    '50': '#fff7ed',
    '100': '#ffedd5',
    '200': '#fed7aa',
    '300': '#fdba74',
    '400': '#fb923c',
    '500': '#f97316',
    '600': '#ea580c',
    '700': '#c2410c',
    '800': '#9a3412',
    '900': '#7c2d12',
    '950': '#431407',
  },
  amber: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
    '950': '#451a03',
  },
  yellow: {
    '50': '#fefce8',
    '100': '#fef9c3',
    '200': '#fef08a',
    '300': '#fde047',
    '400': '#facc15',
    '500': '#eab308',
    '600': '#ca8a04',
    '700': '#a16207',
    '800': '#854d0e',
    '900': '#713f12',
    '950': '#422006',
  },
  lime: {
    '50': '#f7fee7',
    '100': '#ecfccb',
    '200': '#d9f99d',
    '300': '#bef264',
    '400': '#a3e635',
    '500': '#84cc16',
    '600': '#65a30d',
    '700': '#4d7c0f',
    '800': '#3f6212',
    '900': '#365314',
    '950': '#1a2e05',
  },
  green: {
    '50': '#f0fdf4',
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
    '950': '#052e16',
  },
  emerald: {
    '50': '#ecfdf5',
    '100': '#d1fae5',
    '200': '#a7f3d0',
    '300': '#6ee7b7',
    '400': '#34d399',
    '500': '#10b981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065f46',
    '900': '#064e3b',
    '950': '#022c22',
  },
  teal: {
    '50': '#f0fdfa',
    '100': '#ccfbf1',
    '200': '#99f6e4',
    '300': '#5eead4',
    '400': '#2dd4bf',
    '500': '#14b8a6',
    '600': '#0d9488',
    '700': '#0f766e',
    '800': '#115e59',
    '900': '#134e4a',
    '950': '#042f2e',
  },
  cyan: {
    '50': '#ecfeff',
    '100': '#cffafe',
    '200': '#a5f3fc',
    '300': '#67e8f9',
    '400': '#22d3ee',
    '500': '#06b6d4',
    '600': '#0891b2',
    '700': '#0e7490',
    '800': '#155e75',
    '900': '#164e63',
    '950': '#083344',
  },
  sky: {
    '50': '#f0f9ff',
    '100': '#e0f2fe',
    '200': '#bae6fd',
    '300': '#7dd3fc',
    '400': '#38bdf8',
    '500': '#0ea5e9',
    '600': '#0284c7',
    '700': '#0369a1',
    '800': '#075985',
    '900': '#0c4a6e',
    '950': '#082f49',
  },
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
    '950': '#172554',
  },
  indigo: {
    '50': '#eef2ff',
    '100': '#e0e7ff',
    '200': '#c7d2fe',
    '300': '#a5b4fc',
    '400': '#818cf8',
    '500': '#6366f1',
    '600': '#4f46e5',
    '700': '#4338ca',
    '800': '#3730a3',
    '900': '#312e81',
    '950': '#1e1b4b',
  },
  violet: {
    '50': '#f5f3ff',
    '100': '#ede9fe',
    '200': '#ddd6fe',
    '300': '#c4b5fd',
    '400': '#a78bfa',
    '500': '#8b5cf6',
    '600': '#7c3aed',
    '700': '#6d28d9',
    '800': '#5b21b6',
    '900': '#4c1d95',
    '950': '#2e1065',
  },
  purple: {
    '50': '#faf5ff',
    '100': '#f3e8ff',
    '200': '#e9d5ff',
    '300': '#d8b4fe',
    '400': '#c084fc',
    '500': '#a855f7',
    '600': '#9333ea',
    '700': '#7e22ce',
    '800': '#6b21a8',
    '900': '#581c87',
    '950': '#3b0764',
  },
  fuchsia: {
    '50': '#fdf4ff',
    '100': '#fae8ff',
    '200': '#f5d0fe',
    '300': '#f0abfc',
    '400': '#e879f9',
    '500': '#d946ef',
    '600': '#c026d3',
    '700': '#a21caf',
    '800': '#86198f',
    '900': '#701a75',
    '950': '#4a044e',
  },
  pink: {
    '50': '#fdf2f8',
    '100': '#fce7f3',
    '200': '#fbcfe8',
    '300': '#f9a8d4',
    '400': '#f472b6',
    '500': '#ec4899',
    '600': '#db2777',
    '700': '#be185d',
    '800': '#9d174d',
    '900': '#831843',
    '950': '#500724',
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
    '950': '#4c0519',
  },
  slate: {
    '50': '#f8fafc',
    '100': '#f1f5f9',
    '200': '#e2e8f0',
    '300': '#cbd5e1',
    '400': '#94a3b8',
    '500': '#64748b',
    '600': '#475569',
    '700': '#334155',
    '800': '#1e293b',
    '900': '#0f172a',
    '950': '#020617',
  },
  gray: {
    '50': '#f9fafb',
    '100': '#f3f4f6',
    '200': '#e5e7eb',
    '300': '#d1d5db',
    '400': '#9ca3af',
    '500': '#6b7280',
    '600': '#4b5563',
    '700': '#374151',
    '800': '#1f2937',
    '900': '#111827',
    '950': '#030712',
  },
  zinc: {
    '50': '#fafafa',
    '100': '#f4f4f5',
    '200': '#e4e4e7',
    '300': '#d4d4d8',
    '400': '#a1a1aa',
    '500': '#71717a',
    '600': '#52525b',
    '700': '#3f3f46',
    '800': '#27272a',
    '900': '#18181b',
    '950': '#09090b',
  },
  neutral: {
    '50': '#fafafa',
    '100': '#f5f5f5',
    '200': '#e5e5e5',
    '300': '#d4d4d4',
    '400': '#a3a3a3',
    '500': '#737373',
    '600': '#525252',
    '700': '#404040',
    '800': '#262626',
    '900': '#171717',
    '950': '#0a0a0a',
  },
  stone: {
    '50': '#fafaf9',
    '100': '#f5f5f4',
    '200': '#e7e5e4',
    '300': '#d6d3d1',
    '400': '#a8a29e',
    '500': '#78716c',
    '600': '#57534e',
    '700': '#44403c',
    '800': '#292524',
    '900': '#1c1917',
    '950': '#0c0a09',
  },
};

type PaletteTabId = (typeof paletteTabs)[number]['id'];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHex(input: string): `#${string}` | null {
  if (!input) return null;
  const trimmed = input.trim();
  const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-fA-F]{3}$/.test(withoutHash)) {
    const expanded = withoutHash.split('').map((ch) => ch + ch).join('');
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
    return `#${withoutHash.toUpperCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const intVal = Number.parseInt(normalized.slice(1), 16);
  if (Number.isNaN(intVal)) return null;
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): `#${string}` {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(clamp(Math.round(r), 0, 255))}${toHex(clamp(Math.round(g), 0, 255))}${toHex(clamp(Math.round(b), 0, 255))}`.toUpperCase() as `#${string}`;
}

function rgbToHsv(r: number, g: number, b: number): { hue: number; saturation: number; value: number } {
  const red = clamp(r, 0, 255) / 255;
  const green = clamp(g, 0, 255) / 255;
  const blue = clamp(b, 0, 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const value = max;
  return { hue, saturation, value };
}

function hexToHsv(hex: string): { hue: number; saturation: number; value: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsv(rgb[0], rgb[1], rgb[2]);
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const saturation = Math.min(Math.max(s, 0), 1);
  const value = Math.min(Math.max(v, 0), 1);
  const chroma = value * saturation;
  const huePrime = hue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (huePrime >= 0 && huePrime < 1) {
    r1 = chroma;
    g1 = x;
  } else if (huePrime >= 1 && huePrime < 2) {
    r1 = x;
    g1 = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    g1 = chroma;
    b1 = x;
  } else if (huePrime >= 3 && huePrime < 4) {
    g1 = x;
    b1 = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    r1 = x;
    b1 = chroma;
  } else {
    r1 = chroma;
    b1 = x;
  }

  const m = value - chroma;
  return [
    (r1 + m) * 255,
    (g1 + m) * 255,
    (b1 + m) * 255,
  ];
}

export interface CustomColorPopoverProps {
  label: string;
  previewColor: string;
  accentColor: string;
  isDarkMode: boolean;
  onSelect(color: string): void;
  triggerStyle?: React.CSSProperties;
}

export function CustomColorPopover({
  label,
  previewColor,
  accentColor,
  isDarkMode,
  onSelect,
  triggerStyle,
}: CustomColorPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<PaletteTabId>('flexoki');
  const saturationCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const hueTrackRef = React.useRef<HTMLDivElement | null>(null);
  const saturationDraggingRef = React.useRef(false);
  const hueDraggingRef = React.useRef(false);
  const lastAppliedColorRef = React.useRef<string | null>(normalizeHex(previewColor));

  const flexokiPaletteWidth = SWATCH_SIZE * shadesReversed.length;
  const flexokiPaletteHeight = SWATCH_SIZE * paletteHues.length;
  const paletteWidth = flexokiPaletteWidth;
  const paletteHeight = flexokiPaletteHeight;
  const tailwindSwatchHeight = paletteHeight / tailwindHues.length;
  const saturationCanvasHeight = Math.max(SWATCH_SIZE, paletteHeight - SWATCH_SIZE);
  const initialHsv = hexToHsv(previewColor) ?? {
    hue: HSV_DEFAULT_HUE,
    saturation: 1,
    value: 1,
  };
  const [hsv, setHsv] = React.useState(initialHsv);

  const buttonBackground = isDarkMode ? flexoki.base['100'] : flexoki.base['700'];
  const buttonForeground = isDarkMode ? flexoki.base['700'] : flexoki.base['50'];
  const inverseButtonBackground = isDarkMode ? flexoki.base['700'] : flexoki.base['100'];
  const inverseButtonForeground = isDarkMode ? flexoki.base['50'] : flexoki.base['700'];

  const baseTriggerSizeStyle: React.CSSProperties = triggerStyle ?? {
    width: 40,
    height: 40,
    borderRadius: 3,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  };
  const triggerButtonStyle: React.CSSProperties = {
    ...baseTriggerSizeStyle,
    cursor: 'pointer',
    background: previewColor,
    border: `2px solid ${accentColor}`,
    color: buttonForeground,
    boxSizing: 'border-box',
  };
  const tabListStyle: React.CSSProperties = {
    display: 'flex',
    width: paletteWidth,
    height: SWATCH_SIZE,
    borderBottom: `1px solid ${isDarkMode ? flexoki.base['800'] : flexoki.base['200']}`,
    background: buttonBackground,
    overflow: 'hidden',
  };
  const tabButtonStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: buttonForeground,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'IBM Plex Mono', monospace",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    lineHeight: 1,
    height: '100%',
  };
  const popoverContentStyle: React.CSSProperties = {
    borderRadius: 3,
    border: `1px solid ${isDarkMode ? flexoki.base['800'] : flexoki.base['200']}`,
    background: isDarkMode ? flexoki.base['900'] : flexoki.base['50'],
    padding: 0,
    overflow: 'hidden',
    boxShadow: isDarkMode
      ? '0 18px 40px rgba(0, 0, 0, 0.35)'
      : '0 18px 40px rgba(16, 15, 15, 0.25)',
    zIndex: 1200,
    fontFamily: "'IBM Plex Mono', monospace",
  };
  const colorGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${shadesReversed.length}, ${SWATCH_SIZE}px)`,
    gridAutoRows: `${SWATCH_SIZE}px`,
    gap: 0,
  };
  const tailwindGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${tailwindShades.length}, 1fr)`,
    gridAutoRows: `${tailwindSwatchHeight}px`,
    gap: 0,
    width: paletteWidth,
    height: paletteHeight,
  };
  const colorSwatchStyle: React.CSSProperties = {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    display: 'block',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };
  const tailwindSwatchStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };
  const hueGradientStyle: React.CSSProperties = {
    width: paletteWidth,
    height: SWATCH_SIZE,
    background: 'linear-gradient(90deg, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))',
  };
  const hueTrackContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: paletteWidth,
    height: SWATCH_SIZE,
  };
  const popoverArrowStyle: React.CSSProperties = {
    fill: isDarkMode ? flexoki.base['900'] : flexoki.base['50'],
  };

  React.useEffect(() => {
    const normalized = normalizeHex(previewColor);
    if (!normalized) return;
    lastAppliedColorRef.current = normalized;
    const next = hexToHsv(normalized);
    if (!next) return;
    setHsv((prev) => {
      const delta = Math.abs(prev.hue - next.hue) + Math.abs(prev.saturation - next.saturation) + Math.abs(prev.value - next.value);
      if (delta < 1e-3) return prev;
      return next;
    });
  }, [previewColor]);

  const updateSaturationValue = React.useCallback((clientX: number, clientY: number) => {
    const canvas = saturationCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const saturation = clamp((clientX - rect.left) / rect.width, 0, 1);
    const value = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    setHsv((prev) => ({ ...prev, saturation, value }));
  }, []);

  const updateHueValue = React.useCallback((clientX: number) => {
    const track = hueTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    setHsv((prev) => ({ ...prev, hue: ratio * 360 }));
  }, []);

  const handleSaturationPointerMove = React.useCallback((event: PointerEvent) => {
    if (!saturationDraggingRef.current) return;
    updateSaturationValue(event.clientX, event.clientY);
  }, [updateSaturationValue]);

  const handleSaturationPointerUp = React.useCallback(() => {
    if (!saturationDraggingRef.current) return;
    saturationDraggingRef.current = false;
    window.removeEventListener('pointermove', handleSaturationPointerMove);
    window.removeEventListener('pointerup', handleSaturationPointerUp);
  }, [handleSaturationPointerMove]);

  const handleHuePointerMove = React.useCallback((event: PointerEvent) => {
    if (!hueDraggingRef.current) return;
    updateHueValue(event.clientX);
  }, [updateHueValue]);

  const handleHuePointerUp = React.useCallback(() => {
    if (!hueDraggingRef.current) return;
    hueDraggingRef.current = false;
    window.removeEventListener('pointermove', handleHuePointerMove);
    window.removeEventListener('pointerup', handleHuePointerUp);
  }, [handleHuePointerMove]);

  const handleSaturationPointerDown = React.useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    saturationDraggingRef.current = true;
    updateSaturationValue(event.clientX, event.clientY);
    window.addEventListener('pointermove', handleSaturationPointerMove);
    window.addEventListener('pointerup', handleSaturationPointerUp);
  }, [handleSaturationPointerMove, handleSaturationPointerUp, updateSaturationValue]);

  const handleHuePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    hueDraggingRef.current = true;
    updateHueValue(event.clientX);
    window.addEventListener('pointermove', handleHuePointerMove);
    window.addEventListener('pointerup', handleHuePointerUp);
  }, [handleHuePointerMove, handleHuePointerUp, updateHueValue]);

  React.useEffect(() => () => {
    window.removeEventListener('pointermove', handleSaturationPointerMove);
    window.removeEventListener('pointerup', handleSaturationPointerUp);
    window.removeEventListener('pointermove', handleHuePointerMove);
    window.removeEventListener('pointerup', handleHuePointerUp);
  }, [handleHuePointerMove, handleHuePointerUp, handleSaturationPointerMove, handleSaturationPointerUp]);

  const renderSaturationCanvas = React.useCallback((target?: HTMLCanvasElement | null) => {
    const canvas = target ?? saturationCanvasRef.current;
    if (!canvas) return;
    const width = Math.max(1, Math.floor(paletteWidth));
    const height = Math.max(1, Math.floor(saturationCanvasHeight));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let y = 0; y < height; y += 1) {
      const value = 1 - y / Math.max(1, height - 1);
      for (let x = 0; x < width; x += 1) {
        const saturation = x / Math.max(1, width - 1);
        const [r, g, b] = hsvToRgb(hsv.hue, saturation, value);
        const idx = (y * width + x) * 4;
        data[idx] = clamp(r, 0, 255);
        data[idx + 1] = clamp(g, 0, 255);
        data[idx + 2] = clamp(b, 0, 255);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [hsv.hue, paletteWidth, saturationCanvasHeight]);

  const handleSaturationCanvasRef = React.useCallback((node: HTMLCanvasElement | null) => {
    saturationCanvasRef.current = node;
    if (node && open && activeTab === 'hsv') {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => renderSaturationCanvas(node));
      } else {
        renderSaturationCanvas(node);
      }
    }
  }, [activeTab, open, renderSaturationCanvas]);

  React.useEffect(() => {
    if (!open || activeTab !== 'hsv') return;
    renderSaturationCanvas();
  }, [open, activeTab, renderSaturationCanvas]);

  const hsvHex = React.useMemo(() => {
    const [r, g, b] = hsvToRgb(hsv.hue, hsv.saturation, hsv.value);
    return rgbToHex(r, g, b);
  }, [hsv.hue, hsv.saturation, hsv.value]);

  React.useEffect(() => {
    if (activeTab !== 'hsv') return;
    if (lastAppliedColorRef.current === hsvHex) return;
    lastAppliedColorRef.current = hsvHex;
    onSelect(hsvHex);
  }, [activeTab, hsvHex, onSelect]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={label} style={triggerButtonStyle} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" sideOffset={12} style={popoverContentStyle}>
          <div style={tabListStyle}>
            {paletteTabs.map((tab, tabIndex) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`color-tab-${tab.id}`}
                  type="button"
                  style={{
                    ...tabButtonStyle,
                    background: isActive ? inverseButtonBackground : buttonBackground,
                    color: isActive ? inverseButtonForeground : buttonForeground,
                    borderRight: tabIndex < paletteTabs.length - 1
                      ? `1px solid ${isDarkMode ? flexoki.base['800'] : flexoki.base['200']}`
                      : 'none',
                  }}
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {activeTab === 'flexoki' ? (
            <div style={colorGridStyle}>
              {paletteHues.map((hue) => (
                shadesReversed.map((shade) => (
                  <button
                    key={`${hue}-${shade}`}
                    style={{
                      ...colorSwatchStyle,
                      background: flexoki[hue][shade],
                    }}
                    type="button"
                    aria-label={`${hue} ${shade}`}
                    onClick={() => {
                      const normalized = normalizeHex(flexoki[hue][shade]) ?? flexoki[hue][shade];
                      const next = hexToHsv(normalized);
                      if (next) {
                        setHsv(next);
                        lastAppliedColorRef.current = normalized;
                      }
                      onSelect(normalized);
                    }}
                  />
                ))
              ))}
            </div>
          ) : activeTab === 'tailwind' ? (
            <div style={tailwindGridStyle}>
              {tailwindHues.map((hue) => (
                tailwindShades.map((shade) => {
                  const swatchColor = tailwindPalette[hue][shade];
                  return (
                    <button
                      key={`${hue}-${shade}`}
                      style={{
                        ...tailwindSwatchStyle,
                        background: swatchColor,
                      }}
                      type="button"
                      aria-label={`${hue} ${shade}`}
                      onClick={() => {
                        const normalized = normalizeHex(swatchColor) ?? swatchColor;
                        const next = hexToHsv(normalized);
                        if (next) {
                          setHsv(next);
                          lastAppliedColorRef.current = normalized;
                        }
                        onSelect(normalized);
                      }}
                    />
                  );
                })
              ))}
            </div>
          ) : (
            <div style={{ width: paletteWidth, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ position: 'relative', width: paletteWidth, height: saturationCanvasHeight }}>
                <canvas
                  ref={handleSaturationCanvasRef}
                  width={paletteWidth}
                  height={saturationCanvasHeight}
                  style={{ width: paletteWidth, height: saturationCanvasHeight, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                  onPointerDown={handleSaturationPointerDown}
                />
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: `${hsv.saturation * 100}%`,
                    top: `${(1 - hsv.value) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    boxShadow: '0 0 2px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div style={hueTrackContainerStyle}>
                <div
                  ref={hueTrackRef}
                  style={{ ...hueGradientStyle, cursor: 'pointer', height: '100%', width: '100%' }}
                  onPointerDown={handleHuePointerDown}
                />
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: `${(hsv.hue / 360) * 100}%`,
                    top: 0,
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: '100%',
                    background: '#fff',
                    boxShadow: '0 0 2px rgba(0,0,0,0.6)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}
          <Popover.Arrow style={popoverArrowStyle} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default CustomColorPopover;
