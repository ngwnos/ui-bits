import React from "react";

export type BasicButtonBorderStyle = "a" | "b" | "none";

export interface BasicButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  colorA?: string;
  colorB?: string;
  borderStyle?: BasicButtonBorderStyle;
  fontSize?: number;
  padding?: number | string;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

const BasicButton = React.forwardRef<HTMLButtonElement, BasicButtonProps>((props, ref) => {
  const {
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "a",
    fontSize = 12,
    padding,
    style,
    type,
    disabled,
    children,
    ...rest
  } = props;
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const resolvedPadding = resolveSize(padding)
    ?? `${Math.round(fontSize * 0.35)}px ${Math.round(fontSize * 0.7)}px`;

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled}
      style={{
        fontSize,
        fontFamily: "inherit",
        fontWeight: "inherit",
        lineHeight: 1,
        color: colorA,
        background: colorB,
        border: `1px solid ${resolvedBorderColor}`,
        borderRadius: 3,
        padding: resolvedPadding,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        ...(disabled ? { opacity: 0.5 } : null),
        ...(style ?? {}),
      }}
      {...rest}
    >
      {children}
    </button>
  );
});

BasicButton.displayName = "BasicButton";

export default BasicButton;
