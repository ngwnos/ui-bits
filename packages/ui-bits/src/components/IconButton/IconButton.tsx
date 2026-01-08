import React from "react";

export type IconButtonBorderStyle = "a" | "b" | "none";
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

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    fontSize,
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "none",
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
    title,
    ...rest
  } = props;
  const resolvedBehavior: IconButtonBehavior = behavior ?? (options?.length ? "cycle" : "momentary");
  const cycleOptions = options ?? [];
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
  const [resolvedColorA, resolvedColorB] = resolvedBehavior === "toggle" && resolvedToggled
    ? [optionColorB, optionColorA]
    : [optionColorA, optionColorB];
  const resolvedBorderStyle = resolvedBehavior === "cycle"
    ? (activeOption?.borderStyle ?? borderStyle)
    : borderStyle;
  const resolvedFontSize = fontSize ?? 12;
  const resolvedSize = Math.round(resolvedFontSize * 1.6);
  const resolvedRadius = Math.max(2, Math.round(resolvedFontSize * 0.25));
  const padding = Math.max(2, Math.round(resolvedFontSize * 0.2));
  const resolvedIconSize = Math.max(12, Math.round(resolvedFontSize));
  const resolvedBorderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const baseStyle = {
    "--icon-btn-a": resolvedColorA,
    "--icon-btn-b": resolvedColorB,
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

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={className}
      style={baseStyle}
      {...rest}
      onClick={handleClick}
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
