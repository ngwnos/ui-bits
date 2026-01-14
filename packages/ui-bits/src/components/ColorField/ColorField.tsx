import React from "react";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
import ColorPicker from "../ColorPicker";
import LFOSlider from "../LFOSlider";
import "./color-field.css";

export type ColorFieldBorderStyle = "a" | "b" | "none";

export interface ColorFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
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
  width?: number | string;
  ariaLabel?: string;
  controlId?: string;
}

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const DEFAULT_COLOR = "#ffffff";
const DEFAULT_ALPHA = 255;

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
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
    alpha,
    defaultAlpha = DEFAULT_ALPHA,
    onAlphaChange,
    alphaControlId,
    colorA,
    colorB,
    borderStyle,
    fontSize,
    width,
    ariaLabel,
    controlId,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedControlId = useResolvedControlId(controlId, ariaLabel);
  const [storeValue, setStoreValue] = useControlValue<string>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const isControlled = resolvedValueProp !== undefined;
  const resolvedAlphaControlId = useResolvedControlId(
    alphaControlId,
    ariaLabel ? `${ariaLabel} alpha` : undefined,
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

  return (
    <div
      ref={ref}
      className={[
        "ui-bits-color-field",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        width: resolvedWidth,
        gap,
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
        aria-label={ariaLabel ? `${ariaLabel} color` : "Color swatch"}
      />
      <LFOSlider
        label="Hex"
        ariaLabel={ariaLabel ?? "Hex color value"}
        showLabel
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
    </div>
  );
});

ColorField.displayName = "ColorField";

export default ColorField;
