import React from "react";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import { usePanelTheme } from "../../panelGap";

export type ColorPickerBorderStyle = "a" | "b" | "none";
export type ColorPickerBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;

export interface ColorPickerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: ColorPickerBorderStyle;
  borderMask?: ColorPickerBorderMask;
  fontSize?: number;
  controlId?: string;
}

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;
const DEFAULT_COLOR = "#ffffff";

function computeButtonSize(fontSize: number) {
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

const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>((props, ref) => {
  const {
    value,
    defaultValue = DEFAULT_COLOR,
    onChange,
    colorA,
    colorB,
    borderStyle,
    borderMask,
    fontSize,
    controlId,
    style,
    className,
    disabled,
    onClick,
    onKeyDown,
    type,
    title,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const ariaLabel = rest["aria-label"] as string | undefined;
  const resolvedControlId = useResolvedControlId(controlId, ariaLabel ?? title);
  const [storeValue, setStoreValue] = useControlValue<string>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const baseColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const baseColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "none";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedBorderColor = resolvedBorderStyle === "a"
    ? baseColorA
    : resolvedBorderStyle === "b"
      ? baseColorB
      : "transparent";
  const resolvedBorderMask = {
    top: borderMask?.top ?? true,
    right: borderMask?.right ?? true,
    bottom: borderMask?.bottom ?? true,
    left: borderMask?.left ?? true,
  };
  const resolvedSize = computeButtonSize(resolvedFontSize);
  const resolvedRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));
  const padding = Math.max(1, Math.round(resolvedFontSize * 0.1));
  const resolvedValue = resolvedValueProp ?? defaultValue;
  const normalizedValue = normalizeHex(resolvedValue) ?? normalizeHex(defaultValue) ?? DEFAULT_COLOR;
  const maskedBorderColor = normalizedValue;
  void onChange;
  void onChange;

  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(normalizedValue);
  }, [normalizedValue, setStoreValue, shouldUseStore, storeValue]);

  const handleButtonClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
  };

  const handleButtonKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
    }
    onKeyDown?.(event);
  };

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={className}
      disabled={disabled}
      onClick={handleButtonClick}
      onKeyDown={handleButtonKeyDown}
      title={title}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        borderRadius: resolvedRadius,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: resolvedBorderColor,
        borderTopColor: resolvedBorderMask.top ? resolvedBorderColor : maskedBorderColor,
        borderRightColor: resolvedBorderMask.right ? resolvedBorderColor : maskedBorderColor,
        borderBottomColor: resolvedBorderMask.bottom ? resolvedBorderColor : maskedBorderColor,
        borderLeftColor: resolvedBorderMask.left ? resolvedBorderColor : maskedBorderColor,
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
        backgroundClip: "padding-box",
        background: normalizedValue,
        cursor: disabled ? "not-allowed" : "pointer",
        ...(disabled ? { opacity: 0.5 } : null),
        ...(style ?? {}),
      } as React.CSSProperties}
      {...rest}
    />
  );
});

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
