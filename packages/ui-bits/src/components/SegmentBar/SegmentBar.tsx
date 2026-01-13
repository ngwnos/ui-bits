import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clamp } from "../../lfo";
import { useControlValue, useResolvedControlId } from "../../controlStore";

export interface SegmentBarOption {
  value: string;
  label: string;
}

export type SegmentBarBorderStyle = "a" | "b" | "none";

export interface SegmentBarProps {
  label?: string;
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
  controlId?: string;
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
  label,
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
  controlId,
  className,
  style,
}: SegmentBarProps) {
  const resolvedControlId = useResolvedControlId(controlId, label);
  const [storeValue, setStoreValue] = useControlValue<string>(resolvedControlId);
  const shouldUseStore = resolvedControlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const resolvedColorA = colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? FALLBACK_COLOR_B;
  const borderMode = borderStyle;
  const resolvedBorderColor = borderMode === "a"
    ? resolvedColorA
    : borderMode === "b"
      ? resolvedColorB
      : "transparent";
  const hoverOverlayBase = borderMode === "none" ? resolvedColorA : resolvedColorB;
  const hoverOverlay = colorWithAlpha(hoverOverlayBase, 0.16, borderMode === "none" ? "0,0,0" : "255,255,255");
  const containerBackground = resolvedColorB;
  const [internalValue, setInternalValue] = useState<string>(() => (
    resolveInitialValue(options, defaultValue, resolvedValueProp)
  ));
  const isControlled = resolvedValueProp !== undefined;
  const currentValue = isControlled ? resolvedValueProp! : internalValue;
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
  useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(resolveInitialValue(options, defaultValue, resolvedValueProp));
  }, [defaultValue, options, resolvedValueProp, setStoreValue, shouldUseStore, storeValue]);

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
    if (shouldUseStore) {
      setStoreValue(nextValue);
    }
    onChange?.(nextValue, option, bounded);
  }, [currentValue, disabled, isControlled, onChange, options, setStoreValue, shouldUseStore]);

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
          border: `1px solid ${resolvedBorderColor}`,
          overflow: "hidden",
          backgroundColor: containerBackground,
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
            const baseBackground = isActive ? resolvedColorA : "transparent";
            const background = isHovered
              ? `linear-gradient(${hoverOverlay}, ${hoverOverlay}), ${baseBackground}`
              : baseBackground;
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
                  borderRight: index < options.length - 1 ? `1px solid ${resolvedColorA}` : "none",
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
      </div>
    </div>
  );
}
