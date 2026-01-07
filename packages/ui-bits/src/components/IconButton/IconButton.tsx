import React from "react";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  fontSize?: number;
  colorA?: string;
  colorB?: string;
  borderStyle?: "a" | "b" | "none";
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    fontSize,
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "none",
    style,
    children,
    className,
    type,
    disabled,
    ...rest
  } = props;
  const resolvedFontSize = fontSize ?? 12;
  const resolvedSize = Math.round(resolvedFontSize * 1.6);
  const resolvedRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));
  const padding = Math.max(2, Math.round(resolvedFontSize * 0.2));
  const resolvedIconSize = Math.max(12, Math.round(resolvedFontSize));
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const baseStyle = {
    "--icon-btn-a": colorA,
    "--icon-btn-b": colorB,
    width: resolvedSize,
    height: resolvedSize,
    borderRadius: resolvedRadius,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: resolvedBorderColor,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding,
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none",
    backgroundClip: "padding-box",
    transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
    fontSize: resolvedFontSize,
    background: "var(--icon-btn-b)",
    color: "var(--icon-btn-a)",
    ...(disabled ? { opacity: 0.5 } : null),
    ...(style ?? {}),
  } as React.CSSProperties;
  const resolvedChildren = React.isValidElement(children) && typeof children.type !== "string"
    ? (() => {
      const child = children as React.ReactElement<{ size?: number }>;
      return child.props.size == null
        ? React.cloneElement(child, { size: resolvedIconSize })
        : child;
    })()
    : children;

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={className}
      style={baseStyle}
      {...rest}
      disabled={disabled}
    >
      {resolvedChildren}
    </button>
  );
});

IconButton.displayName = "IconButton";

export default IconButton;
