import React from "react";
import { usePanelTheme } from "../../panelGap";
import "./text-input.css";

export type TextInputBorderStyle = "a" | "b" | "none";

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "color"> {
  colorA?: string;
  colorB?: string;
  borderStyle?: TextInputBorderStyle;
  fontSize?: number;
  padding?: number | string;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  const {
    colorA,
    colorB,
    borderStyle = "a",
    fontSize,
    padding,
    className,
    style,
    type,
    disabled,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedBorderColor = borderStyle === "a"
    ? resolvedColorA
    : borderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const resolvedPadding = resolveSize(padding)
    ?? `${Math.round(resolvedFontSize * 0.35)}px ${Math.round(resolvedFontSize * 0.7)}px`;

  return (
    <input
      ref={ref}
      type={type ?? "text"}
      disabled={disabled}
      className={["ui-bits-text-input", className].filter(Boolean).join(" ")}
      style={{
        fontSize: resolvedFontSize,
        fontFamily: "inherit",
        lineHeight: 1,
        color: resolvedColorA,
        background: resolvedColorB,
        border: `1px solid ${resolvedBorderColor}`,
        borderRadius: 3,
        padding: resolvedPadding,
        outline: "none",
        boxSizing: "border-box",
        caretColor: resolvedColorA,
        "--ui-bits-text-input-selection-bg": resolvedColorA,
        "--ui-bits-text-input-selection-color": resolvedColorB,
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : null),
        ...(style ?? {}),
      } as React.CSSProperties}
      {...rest}
    />
  );
});

TextInput.displayName = "TextInput";

export default TextInput;
