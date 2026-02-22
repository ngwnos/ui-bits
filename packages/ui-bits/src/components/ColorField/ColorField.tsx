import React from "react";
import { createPortal } from "react-dom";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";
import ColorFieldPicker from "../ColorFieldPicker";
import ColorPicker from "../ColorPicker";
import LFOSlider from "../LFOSlider";
import "./color-field.css";

export type ColorFieldBorderStyle = "a" | "b" | "none";
export type ColorFieldPickerDisplay = "inline" | "popup";

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
  pickerDisplay?: ColorFieldPickerDisplay;
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
    label = "Color",
    alpha,
    defaultAlpha = DEFAULT_ALPHA,
    onAlphaChange,
    alphaControlId,
    colorA,
    colorB,
    borderStyle,
    pickerDisplay = "inline",
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
  const usesPopupPicker = pickerDisplay === "popup";
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

  const handlePickerChange = React.useCallback((nextValue: string) => {
    const normalized = normalizeHex(nextValue) ?? fallbackValue;
    commitValue(normalized);
  }, [commitValue, fallbackValue]);

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

  const fieldRef = React.useRef<HTMLDivElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [popoverMetrics, setPopoverMetrics] = React.useState<{
    top: number;
    left: number;
    width: number;
    placement: "below" | "above";
  } | null>(null);

  React.useEffect(() => {
    if (!usesPopupPicker || !isPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (fieldRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsPickerOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isPickerOpen, usesPopupPicker]);

  const updatePopoverMetrics = React.useCallback(() => {
    if (!fieldRef.current || typeof window === "undefined") return;
    const rect = fieldRef.current.getBoundingClientRect();
    const nextPlacement = rect.top + popoverOffset + popoverHeight > window.innerHeight
      ? "above"
      : "below";
    const nextTop = nextPlacement === "above"
      ? rect.top - popoverHeight - popoverOffset
      : rect.bottom + popoverOffset;
    const nextLeft = rect.left;
    const nextWidth = rect.width;
    setPopoverMetrics((prev) => {
      if (
        prev
        && prev.top === nextTop
        && prev.left === nextLeft
        && prev.width === nextWidth
        && prev.placement === nextPlacement
      ) {
        return prev;
      }
      return {
        top: nextTop,
        left: nextLeft,
        width: nextWidth,
        placement: nextPlacement,
      };
    });
  }, [popoverHeight, popoverOffset]);

  React.useEffect(() => {
    if (!usesPopupPicker || !isPickerOpen || typeof window === "undefined") {
      setPopoverMetrics(null);
      return;
    }
    const handleUpdate = () => updatePopoverMetrics();
    handleUpdate();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isPickerOpen, updatePopoverMetrics, usesPopupPicker]);

  React.useEffect(() => {
    if (usesPopupPicker) return;
    if (!isPickerOpen) return;
    setIsPickerOpen(false);
  }, [isPickerOpen, usesPopupPicker]);

  const handleRef = React.useCallback((node: HTMLDivElement | null) => {
    fieldRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  return (
    <div
      ref={handleRef}
      className={[
        "ui-bits-color-field",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        width: resolvedWidth,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: usesPopupPicker ? 0 : gap,
        position: "relative",
        overflow: "visible",
        ...(style ?? {}),
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", gap }}>
        <ColorPicker
          value={resolvedValue}
          onChange={handlePickerChange}
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle={resolvedBorderStyle}
          fontSize={resolvedFontSize}
          style={{
            background: swatchColor,
            cursor: usesPopupPicker ? "pointer" : "default",
          }}
          aria-label={resolvedAriaLabel ? `${resolvedAriaLabel} color` : "Color swatch"}
          onClick={usesPopupPicker ? () => setIsPickerOpen((prev) => !prev) : undefined}
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
          formatDisplayValue={(sliderValue) => intToHex(sliderValue)}
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
          formatDisplayValue={(sliderValue) => `${Math.round(sliderValue)}`}
          style={{ flex: `0 0 ${alphaWidth}px` }}
        />
      </div>
      {!usesPopupPicker ? (
        <ColorFieldPicker
          value={resolvedValue}
          onChange={handlePickerChange}
          colorA={resolvedColorA}
          colorB={resolvedColorB}
          borderStyle={resolvedBorderStyle}
          fontSize={resolvedFontSize}
          heightUnits={resolvedPickerUnits}
          width="100%"
        />
      ) : null}
      {usesPopupPicker && isPickerOpen && popoverMetrics && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: popoverMetrics.top,
              left: popoverMetrics.left,
              width: popoverMetrics.width,
              zIndex: 1000,
            }}
          >
            <ColorFieldPicker
              value={resolvedValue}
              onChange={handlePickerChange}
              colorA={resolvedColorA}
              colorB={resolvedColorB}
              borderStyle={resolvedBorderStyle}
              fontSize={resolvedFontSize}
              heightUnits={resolvedPickerUnits}
              width="100%"
              style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
            />
          </div>,
          document.body,
        )
        : null}
    </div>
  );
});

ColorField.displayName = "ColorField";

export default ColorField;
