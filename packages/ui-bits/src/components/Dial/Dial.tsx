import React from "react";
import { clamp, snapToStep, splitFromValue } from "../../lfo";
import { useAnimationSuspended } from "../../animationSuspension";
import { useControlValue, useResolvedControlId } from "../../controlStore";
import "./dial.css";

export type DialBorderStyle = "a" | "b" | "none";
export type DialBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export type DialControlMode = "angle" | "xy";

export interface DialProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onUserChange?: (value: number) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: DialBorderStyle;
  borderMask?: DialBorderMask;
  fontSize?: number;
  formatDisplayValue?: (value: number) => string;
  controlMode?: DialControlMode;
  defaultControlMode?: DialControlMode;
  onControlModeChange?: (mode: DialControlMode) => void;
  disabled?: boolean;
  suspended?: boolean;
  ariaLabel?: string;
  controlId?: string;
}

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;
const ARC_SWEEP_DEG = 270;
const ARC_START_DEG = 225;

function computeDialSize(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function Dial({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  onUserChange,
  colorA = FALLBACK_COLOR_A,
  colorB = FALLBACK_COLOR_B,
  borderStyle = "a",
  borderMask,
  fontSize = 12,
  formatDisplayValue,
  controlMode,
  defaultControlMode = "xy",
  onControlModeChange,
  disabled = false,
  suspended,
  ariaLabel = "Dial control",
  className,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
  onKeyDown,
  onWheel,
  controlId,
  ...rest
}: DialProps) {
  const isSuspended = useAnimationSuspended(suspended);
  const resolvedControlId = useResolvedControlId(controlId, ariaLabel);
  const [storeValue, setStoreValue] = useControlValue<number>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const isControlled = resolvedValueProp !== undefined;
  const resolvedStep = Number.isFinite(step) && step > 0 ? step : 1;
  const clampValue = React.useCallback((input: number) => {
    const clamped = clamp(input, min, max);
    const snapped = snapToStep(clamped, min, resolvedStep);
    return clamp(snapped, min, max);
  }, [min, max, resolvedStep]);
  const [internalValue, setInternalValue] = React.useState(() => (
    clampValue(defaultValue ?? min)
  ));
  const resolvedValue = isControlled ? clampValue(resolvedValueProp ?? min) : internalValue;
  const pointerRef = React.useRef<number | null>(null);
  const pointerStartRef = React.useRef<{ x: number; y: number; value: number } | null>(null);
  const dialRef = React.useRef<HTMLDivElement | null>(null);
  const [internalMode, setInternalMode] = React.useState<DialControlMode>(defaultControlMode);
  const isModeControlled = controlMode !== undefined;
  const resolvedMode = isModeControlled ? controlMode : internalMode;
  const setControlMode = React.useCallback((next: DialControlMode) => {
    if (!isModeControlled) {
      setInternalMode(next);
    }
    onControlModeChange?.(next);
  }, [isModeControlled, onControlModeChange]);

  React.useEffect(() => {
    if (!isControlled) {
      setInternalValue((prev) => clampValue(prev));
    }
  }, [clampValue, isControlled]);
  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(clampValue(defaultValue ?? min));
  }, [clampValue, defaultValue, min, setStoreValue, shouldUseStore, storeValue]);

  const emitChange = React.useCallback((next: number) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    if (shouldUseStore) {
      setStoreValue(next);
    }
    onChange?.(next);
    onUserChange?.(next);
  }, [isControlled, onChange, onUserChange, setStoreValue, shouldUseStore]);

  const ratioFromPoint = React.useCallback((clientX: number, clientY: number) => {
    const node = dialRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) {
      angle += Math.PI * 2;
    }
    const start = toRadians(ARC_START_DEG);
    const end = start + toRadians(ARC_SWEEP_DEG);
    let normalized = angle;
    if (normalized < start) {
      normalized += Math.PI * 2;
    }
    normalized = clamp(normalized, start, end);
    return (normalized - start) / (end - start);
  }, []);

  const updateFromPointer = React.useCallback((clientX: number, clientY: number) => {
    const ratio = ratioFromPoint(clientX, clientY);
    if (ratio == null) return;
    const next = clampValue(min + ratio * (max - min));
    emitChange(next);
  }, [clampValue, emitChange, max, min, ratioFromPoint]);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (disabled || isSuspended) {
      onPointerDown?.(event);
      return;
    }
    pointerRef.current = event.pointerId;
    if (resolvedMode === "xy") {
      pointerStartRef.current = { x: event.clientX, y: event.clientY, value: resolvedValue };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (resolvedMode === "angle") {
      updateFromPointer(event.clientX, event.clientY);
    }
    onPointerDown?.(event);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (pointerRef.current !== event.pointerId) {
      onPointerMove?.(event);
      return;
    }
    if (resolvedMode === "xy") {
      const start = pointerStartRef.current;
      if (start) {
        const delta = (event.clientX - start.x) - (event.clientY - start.y);
        const pixelsPerStep = Math.max(6, resolvedSize * 0.25);
        const stepScale = event.shiftKey ? 10 : 1;
        const next = clampValue(start.value + (delta / pixelsPerStep) * resolvedStep * stepScale);
        emitChange(next);
      }
    } else {
      updateFromPointer(event.clientX, event.clientY);
    }
    onPointerMove?.(event);
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (pointerRef.current !== event.pointerId) {
      onPointerUp?.(event);
      return;
    }
    pointerRef.current = null;
    pointerStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onPointerUp?.(event);
  };

  const handlePointerCancel: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (pointerRef.current !== event.pointerId) {
      onPointerCancel?.(event);
      return;
    }
    pointerRef.current = null;
    pointerStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onPointerCancel?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (disabled || isSuspended) {
      onKeyDown?.(event);
      return;
    }
    let next = resolvedValue;
    const stepDelta = event.shiftKey ? resolvedStep * 10 : resolvedStep;
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      next = clampValue(resolvedValue + stepDelta);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      next = clampValue(resolvedValue - stepDelta);
    } else if (event.key === "PageUp") {
      next = clampValue(resolvedValue + stepDelta * 5);
    } else if (event.key === "PageDown") {
      next = clampValue(resolvedValue - stepDelta * 5);
    } else if (event.key === "Home") {
      next = clampValue(min);
    } else if (event.key === "End") {
      next = clampValue(max);
    } else if (event.key === "m" || event.key === "M") {
      const nextMode = resolvedMode === "angle" ? "xy" : "angle";
      setControlMode(nextMode);
      event.preventDefault();
      onKeyDown?.(event);
      return;
    } else {
      onKeyDown?.(event);
      return;
    }
    event.preventDefault();
    emitChange(next);
    onKeyDown?.(event);
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (disabled || isSuspended) {
      onWheel?.(event);
      return;
    }
    const direction = event.deltaY < 0 ? 1 : -1;
    const stepDelta = event.shiftKey ? resolvedStep * 10 : resolvedStep;
    const next = clampValue(resolvedValue + direction * stepDelta);
    event.preventDefault();
    emitChange(next);
    onWheel?.(event);
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (disabled || isSuspended) {
      onDoubleClick?.(event);
      return;
    }
    const nextMode = resolvedMode === "angle" ? "xy" : "angle";
    setControlMode(nextMode);
    onDoubleClick?.(event);
  };

  const resolvedSize = computeDialSize(fontSize);
  const strokeWidth = Math.max(2, Math.round(fontSize * 0.15));
  const radius = Math.max(1, (resolvedSize - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const sweepLength = circumference * (ARC_SWEEP_DEG / 360);
  const ratio = splitFromValue(resolvedValue, min, max);
  const activeLength = sweepLength * ratio;
  const startRotation = ARC_START_DEG - 90;
  const displayValue = formatDisplayValue ? formatDisplayValue(resolvedValue) : `${Math.round(resolvedValue)}`;
  const digitCount = Math.max(1, displayValue.replace(/[^0-9]/g, "").length + (displayValue.startsWith("-") ? 1 : 0));
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const maskedBorderColor = borderStyle === "none" ? "transparent" : colorB;
  const resolvedBorderMask = {
    top: borderMask?.top ?? true,
    right: borderMask?.right ?? true,
    bottom: borderMask?.bottom ?? true,
    left: borderMask?.left ?? true,
  };

  return (
    <div
      ref={dialRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={resolvedValue}
      aria-valuetext={displayValue}
      aria-disabled={disabled || isSuspended}
      className={["ui-bits-dial", className].filter(Boolean).join(" ")}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        fontSize,
        background: colorB,
        color: colorA,
        borderStyle: "solid",
        borderWidth: SLIDER_BORDER_WIDTH,
        borderColor: resolvedBorderColor,
        borderTopColor: resolvedBorderMask.top ? resolvedBorderColor : maskedBorderColor,
        borderRightColor: resolvedBorderMask.right ? resolvedBorderColor : maskedBorderColor,
        borderBottomColor: resolvedBorderMask.bottom ? resolvedBorderColor : maskedBorderColor,
        borderLeftColor: resolvedBorderMask.left ? resolvedBorderColor : maskedBorderColor,
        "--dial-stroke": `${strokeWidth}px`,
        ...(disabled ? { opacity: 0.5 } : null),
        ...(style ?? {}),
      } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      {...rest}
    >
      <svg
        className="ui-bits-dial__arc"
        width={resolvedSize}
        height={resolvedSize}
        viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
        aria-hidden="true"
      >
        <circle
          className="ui-bits-dial__track"
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          strokeDasharray={`${sweepLength} ${circumference}`}
          strokeDashoffset="0"
          transform={`rotate(${startRotation} ${resolvedSize / 2} ${resolvedSize / 2})`}
        />
        <circle
          className="ui-bits-dial__indicator"
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          strokeDasharray={`${activeLength} ${circumference}`}
          strokeDashoffset="0"
          transform={`rotate(${startRotation} ${resolvedSize / 2} ${resolvedSize / 2})`}
        />
      </svg>
      <span className="ui-bits-dial__value" data-digits={digitCount}>
        {displayValue}
      </span>
    </div>
  );
}
