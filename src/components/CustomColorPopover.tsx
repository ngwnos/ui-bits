import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { flexoki, flexokiShades, type FlexokiHue } from "../flexoki";

const paletteHues: FlexokiHue[] = ['base', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'magenta'];
const shadesReversed = [...flexokiShades].reverse();
const paletteTabs = [
  { id: 'flexoki', label: 'Flexoki' },
  { id: 'hsv', label: 'HSV' },
] as const;

const SWATCH_SIZE = 28;
const HSV_DEFAULT_HUE = 0;

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

  const paletteWidth = SWATCH_SIZE * shadesReversed.length;
  const paletteHeight = SWATCH_SIZE * paletteHues.length;
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
  const colorSwatchStyle: React.CSSProperties = {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
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
            {paletteTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`color-tab-${tab.id}`}
                  type="button"
                  style={{
                    ...tabButtonStyle,
                    background: isActive ? inverseButtonBackground : buttonBackground,
                    color: isActive ? inverseButtonForeground : buttonForeground,
                    borderRight: tab.id === 'flexoki' ? `1px solid ${isDarkMode ? flexoki.base['800'] : flexoki.base['200']}` : 'none',
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
