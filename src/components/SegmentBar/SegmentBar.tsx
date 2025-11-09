import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clamp } from "../../lfo";

export interface SegmentBarOption {
  value: string;
  label: string;
}

export type SegmentBarBorderStyle = "a" | "b" | "none";

export interface SegmentBarProps {
  options: SegmentBarOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: SegmentBarOption, index: number) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: SegmentBarBorderStyle;
  width?: number | string;
  fontSize?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";

function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  const cleaned = hex.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return cleaned.split("").map((c) => c + c).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

function colorWithAlpha(color: string, alpha: number, fallback = "0,0,0"): string {
  const normalized = normalizeHex(color);
  if (!normalized) return `rgba(${fallback},${alpha})`;
  const intVal = parseInt(normalized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveInitialValue(
  options: SegmentBarOption[],
  defaultValue?: string,
  value?: string,
): string {
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  return options[0]?.value ?? "";
}

export default function SegmentBar({
  options,
  value,
  defaultValue,
  onChange,
  colorA,
  colorB,
  borderStyle = "a",
  width,
  fontSize,
  disabled = false,
  className,
  style,
}: SegmentBarProps) {
  const resolvedColorA = colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? FALLBACK_COLOR_B;
  const borderMode = borderStyle;
  const resolvedBorderColor = borderMode === "a"
    ? resolvedColorA
    : borderMode === "b"
      ? resolvedColorB
      : "transparent";
  const hoverOverlay = colorWithAlpha(resolvedColorB, 0.16, "255,255,255");
  const [internalValue, setInternalValue] = useState<string>(() => (
    resolveInitialValue(options, defaultValue, value)
  ));
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value! : internalValue;
  const selectedIndex = useMemo(() => (
    options.findIndex((option) => option.value === currentValue)
  ), [currentValue, options]);
  const effectiveIndex = selectedIndex >= 0 ? selectedIndex : 0;
  useEffect(() => {
    if (isControlled) return;
    if (!options.length) {
      if (internalValue !== "") setInternalValue("");
      return;
    }
    if (selectedIndex === -1) {
      setInternalValue(options[0].value);
    }
  }, [internalValue, isControlled, options, selectedIndex]);

  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  optionRefs.current.length = options.length;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const appliedFontSize = fontSize ?? 12;
  const resolvedWidth = width == null
    ? undefined
    : typeof width === "number"
      ? `${width}px`
      : width;
  const segmentPaddingY = `${0.35}em`;
  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: resolvedWidth,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: appliedFontSize,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    ...(style ?? {}),
  };
  const hasOptions = options.length > 0;
  const separatorColor = borderMode === "a"
    ? resolvedColorA
    : resolvedColorB;
  const inactiveTextColor = resolvedColorA;
  const activeTextColor = resolvedColorB;

  const draggingRef = useRef(false);

  const selectIndex = useCallback((index: number) => {
    if (disabled || !options.length) return;
    const bounded = clamp(index, 0, Math.max(options.length - 1, 0));
    const option = options[bounded];
    if (!option) return;
    const nextValue = option.value;
    if (nextValue === currentValue) return;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue, option, bounded);
  }, [currentValue, disabled, isControlled, onChange, options]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled || !options.length) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = (index + 1) % options.length;
      selectIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (index - 1 + options.length) % options.length;
      selectIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectIndex(0);
      optionRefs.current[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = options.length - 1;
      selectIndex(last);
      optionRefs.current[last]?.focus();
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectIndex(index);
    }
  }, [disabled, options.length, selectIndex]);
  useEffect(() => {
    if (!hasOptions) {
      setHoverIndex(null);
    }
  }, [hasOptions]);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleGlobalPointerUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  return (
    <div className={className} style={wrapperStyle}>
      <div
        role="radiogroup"
        aria-disabled={disabled || undefined}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`,
          borderRadius: 3,
          border: borderMode === "none" ? "none" : `1px solid ${resolvedBorderColor}`,
          overflow: "hidden",
          backgroundColor: resolvedColorA,
          touchAction: "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {!hasOptions ? (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: resolvedColorB,
              opacity: 0.7,
            }}
          >
            No options
          </div>
        ) : (
          options.map((option, index) => {
            const isActive = index === effectiveIndex;
            const isHovered = hoverIndex === index && !disabled;
            const background = isActive
              ? resolvedColorA
              : (isHovered ? `linear-gradient(${hoverOverlay}, ${hoverOverlay}), ${resolvedColorB}` : resolvedColorB);
            return (
              <button
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="radio"
                aria-checked={isActive}
                tabIndex={isActive ? 0 : -1}
                disabled={disabled}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onClick={() => selectIndex(index)}
                onPointerDown={(event) => {
                  if (disabled) return;
                  draggingRef.current = true;
                  (event.currentTarget as HTMLButtonElement).focus();
                  selectIndex(index);
                }}
                onPointerUp={() => { draggingRef.current = false; }}
                onPointerEnter={() => {
                  setHoverIndex(index);
                  if (draggingRef.current) selectIndex(index);
                }}
                onPointerLeave={() => {
                  if (!draggingRef.current) {
                    setHoverIndex((prev) => (prev === index ? null : prev));
                  }
                }}
                style={{
                  border: "none",
                  background,
                  color: isActive ? activeTextColor : inactiveTextColor,
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  padding: `${segmentPaddingY} 0.75rem`,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: disabled ? "not-allowed" : "pointer",
                  position: "relative",
                  userSelect: "none",
                  transition: "background 120ms ease, color 120ms ease",
                  outline: "none",
                  height: "100%",
                }}
              >
                <span style={{ lineHeight: 1 }}>
                  {option.label}
                </span>
              </button>
            );
          })
        )}
        {hasOptions && options.length > 1 && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            {options.slice(1).map((_, index) => (
              <span
                key={`segment-separator-${index}`}
                style={{
                  position: "absolute",
                  top: "12%",
                  bottom: "12%",
                  width: 1,
                  background: separatorColor,
                  left: `${((index + 1) / options.length) * 100}%`,
                  transform: "translateX(-0.5px)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
