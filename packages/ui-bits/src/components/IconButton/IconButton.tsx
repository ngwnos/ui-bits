import React from "react";

export type IconButtonBorderStyle = "a" | "b" | "none";
export type IconButtonBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export type IconButtonBehavior = "momentary" | "toggle" | "cycle";

export interface IconButtonCycleOption {
  value: string;
  icon?: React.ReactElement;
  colorA?: string;
  colorB?: string;
  borderStyle?: IconButtonBorderStyle;
  ariaLabel?: string;
  title?: string;
}

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onChange" | "onToggle"> {
  fontSize?: number;
  colorA?: string;
  colorB?: string;
  borderStyle?: IconButtonBorderStyle;
  borderMask?: IconButtonBorderMask;
  behavior?: IconButtonBehavior;
  toggled?: boolean;
  defaultToggled?: boolean;
  onToggle?: (next: boolean) => void;
  options?: IconButtonCycleOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: IconButtonCycleOption, index: number) => void;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function computeButtonSize(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    fontSize,
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "none",
    borderMask,
    behavior,
    toggled,
    defaultToggled = false,
    onToggle,
    options,
    value,
    defaultValue,
    onChange,
    style,
    children,
    className,
    type,
    disabled,
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onKeyDown,
    onKeyUp,
    onBlur,
    title,
    ...rest
  } = props;
  const resolvedBehavior: IconButtonBehavior = behavior ?? (options?.length ? "cycle" : "momentary");
  const cycleOptions = options ?? [];
  const [isPressed, setIsPressed] = React.useState(false);
  const [uncontrolledToggled, setUncontrolledToggled] = React.useState(defaultToggled);
  const isToggleControlled = toggled !== undefined;
  const resolvedToggled = isToggleControlled ? toggled : uncontrolledToggled;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() => (
    defaultValue ?? cycleOptions[0]?.value ?? ""
  ));
  const isCycleControlled = value !== undefined;
  const resolvedCycleValue = isCycleControlled ? value : uncontrolledValue;
  React.useEffect(() => {
    if (resolvedBehavior !== "cycle" || isCycleControlled) return;
    if (!cycleOptions.length) return;
    const exists = cycleOptions.some((option) => option.value === resolvedCycleValue);
    if (!exists) {
      setUncontrolledValue(cycleOptions[0].value);
    }
  }, [cycleOptions, isCycleControlled, resolvedBehavior, resolvedCycleValue]);
  const activeCycleIndex = cycleOptions.findIndex((option) => option.value === resolvedCycleValue);
  const resolvedCycleIndex = activeCycleIndex >= 0 ? activeCycleIndex : 0;
  const activeOption = cycleOptions[resolvedCycleIndex];
  const optionColorA = resolvedBehavior === "cycle"
    ? (activeOption?.colorA ?? colorA)
    : colorA;
  const optionColorB = resolvedBehavior === "cycle"
    ? (activeOption?.colorB ?? colorB)
    : colorB;
  const shouldInvert = (resolvedBehavior === "toggle" && resolvedToggled)
    || (resolvedBehavior === "momentary" && isPressed);
  const [resolvedColorA, resolvedColorB] = shouldInvert
    ? [optionColorB, optionColorA]
    : [optionColorA, optionColorB];
  const resolvedBorderStyle = resolvedBehavior === "cycle"
    ? (activeOption?.borderStyle ?? borderStyle)
    : borderStyle;
  const resolvedFontSize = fontSize ?? 12;
  const resolvedSize = computeButtonSize(resolvedFontSize);
  const resolvedRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));
  const padding = Math.max(1, Math.round(resolvedFontSize * 0.1));
  const innerSize = Math.max(0, resolvedSize - SLIDER_BORDER_WIDTH * 2 - padding * 2);
  const resolvedIconSize = Math.max(10, Math.floor(innerSize));
  const resolvedBorderMask = {
    top: borderMask?.top ?? true,
    right: borderMask?.right ?? true,
    bottom: borderMask?.bottom ?? true,
    left: borderMask?.left ?? true,
  };
  const resolvedBorderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const maskedBorderColor = resolvedColorB;
  const baseStyle = {
    "--icon-btn-a": resolvedColorA,
    "--icon-btn-b": resolvedColorB,
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
    lineHeight: 1,
    cursor: disabled ? "not-allowed" : "pointer",
    userSelect: "none",
    backgroundClip: "padding-box",
    transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
    fontSize: resolvedFontSize,
    background: resolvedColorB,
    color: resolvedColorA,
    ...(disabled ? { opacity: 0.5 } : null),
    ...(style ?? {}),
  } as React.CSSProperties;
  const displayIcon = resolvedBehavior === "cycle"
    ? (activeOption?.icon ?? children)
    : children;
  const resolvedChildren = React.isValidElement(displayIcon) && typeof displayIcon.type !== "string"
    ? (() => {
      const child = displayIcon as React.ReactElement<{ size?: number }>;
      return child.props.size == null
        ? React.cloneElement(child, { size: resolvedIconSize })
        : child;
    })()
    : displayIcon;
  const resolvedAriaPressed = resolvedBehavior === "toggle" ? resolvedToggled : rest["aria-pressed"];
  const resolvedAriaLabel = rest["aria-label"]
    ?? (resolvedBehavior === "cycle" ? activeOption?.ariaLabel : undefined);
  const resolvedTitle = title
    ?? (resolvedBehavior === "cycle" ? activeOption?.title ?? activeOption?.ariaLabel : undefined);
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (!disabled) {
      if (resolvedBehavior === "toggle") {
        const next = !resolvedToggled;
        if (!isToggleControlled) {
          setUncontrolledToggled(next);
        }
        onToggle?.(next);
      } else if (resolvedBehavior === "cycle" && cycleOptions.length) {
        const nextIndex = (resolvedCycleIndex + 1) % cycleOptions.length;
        const nextOption = cycleOptions[nextIndex];
        if (!isCycleControlled) {
          setUncontrolledValue(nextOption.value);
        }
        onChange?.(nextOption.value, nextOption, nextIndex);
      }
    }
    onClick?.(event);
  };
  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (!disabled && resolvedBehavior === "momentary") {
      setIsPressed(true);
    }
    onPointerDown?.(event);
  };
  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedBehavior === "momentary") {
      setIsPressed(false);
    }
    onPointerUp?.(event);
  };
  const handlePointerLeave: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedBehavior === "momentary") {
      setIsPressed(false);
    }
    onPointerLeave?.(event);
  };
  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedBehavior === "momentary") {
      setIsPressed(false);
    }
    onPointerCancel?.(event);
  };
  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (!disabled && resolvedBehavior === "momentary" && (event.key === " " || event.key === "Enter")) {
      setIsPressed(true);
    }
    onKeyDown?.(event);
  };
  const handleKeyUp: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedBehavior === "momentary" && (event.key === " " || event.key === "Enter")) {
      setIsPressed(false);
    }
    onKeyUp?.(event);
  };
  const handleBlur: React.FocusEventHandler<HTMLButtonElement> = (event) => {
    if (resolvedBehavior === "momentary") {
      setIsPressed(false);
    }
    onBlur?.(event);
  };

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={className}
      style={baseStyle}
      {...rest}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
      aria-pressed={resolvedAriaPressed}
      aria-label={resolvedAriaLabel}
      title={resolvedTitle}
      disabled={disabled}
    >
      {resolvedChildren}
    </button>
  );
});

IconButton.displayName = "IconButton";

export default IconButton;
