import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { flexoki } from "../../flexoki";
import "./dropdown.css";

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string, option: DropdownOption) => void;
  colorA?: string;
  colorB?: string;
  isDarkMode?: boolean;
  width?: number | string;
  fontSize?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function normalizeHex(hex: string): string | null {
  const trimmed = hex.trim();
  if (!trimmed) return null;
  const withoutHash = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-fA-F]{3}$/.test(withoutHash)) {
    return withoutHash.split("").map((c) => c + c).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
    return withoutHash;
  }
  return null;
}

function colorWithAlpha(color: string, alpha: number, fallback = "0,0,0"): string {
  const normalized = normalizeHex(color);
  if (!normalized) return `rgba(${fallback},${alpha})`;
  const base = parseInt(normalized, 16);
  const r = (base >> 16) & 255;
  const g = (base >> 8) & 255;
  const b = base & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Dropdown({
  label,
  options,
  value,
  defaultValue,
  placeholder = "Select an option",
  onChange,
  colorA,
  colorB,
  isDarkMode = false,
  width,
  fontSize,
  disabled = false,
  className,
  style,
}: DropdownProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listboxId = `${id}-listbox`;
  const buttonId = `${id}-button`;
  const isControlled = value !== undefined;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  optionRefs.current.length = options.length;

  const firstEnabledIndex = useMemo(
    () => options.findIndex((option) => !option.disabled),
    [options],
  );

  const resolveInitialValue = useCallback(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    if (firstEnabledIndex >= 0) return options[firstEnabledIndex].value;
    return "";
  }, [value, defaultValue, firstEnabledIndex, options]);

  const [internalValue, setInternalValue] = useState<string>(() => resolveInitialValue());
  const currentValue = isControlled ? value! : internalValue;

  useEffect(() => {
    if (value !== undefined) return;
    const existing = options.find((option) => option.value === internalValue);
    if (!existing) {
      setInternalValue(resolveInitialValue());
    }
  }, [internalValue, options, resolveInitialValue, value]);

  const activeIndex = options.findIndex((option) => option.value === currentValue);
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;
  const [open, setOpen] = useState(false);
  const [virtualFocusIndex, setVirtualFocusIndex] = useState(() => (
    activeIndex >= 0 ? activeIndex : Math.max(0, firstEnabledIndex)
  ));

  useEffect(() => {
    if (!open) return;
    const fallback = activeIndex >= 0 ? activeIndex : firstEnabledIndex;
    setVirtualFocusIndex(fallback >= 0 ? fallback : 0);
  }, [activeIndex, firstEnabledIndex, open]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => window.removeEventListener("pointerdown", handlePointer);
  }, [open]);

  const moveFocus = useCallback((direction: 1 | -1) => {
    if (!options.length) return;
    let nextIndex = virtualFocusIndex;
    for (let i = 0; i < options.length; i += 1) {
      nextIndex = (nextIndex + direction + options.length) % options.length;
      if (!options[nextIndex].disabled) {
        setVirtualFocusIndex(nextIndex);
        break;
      }
    }
  }, [options, virtualFocusIndex]);

  const selectOption = useCallback((option: DropdownOption) => {
    if (disabled || option.disabled) return;
    if (!isControlled) {
      setInternalValue(option.value);
    }
    onChange?.(option.value, option);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, [disabled, isControlled, onChange]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => buttonRef.current?.focus());
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveFocus(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveFocus(-1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        if (firstEnabledIndex >= 0) setVirtualFocusIndex(firstEnabledIndex);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        const lastEnabled = [...options].reverse().findIndex((option) => !option.disabled);
        if (lastEnabled >= 0) {
          const absoluteIndex = options.length - 1 - lastEnabled;
          setVirtualFocusIndex(absoluteIndex);
        }
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const option = options[virtualFocusIndex];
        if (option && !option.disabled) {
          selectOption(option);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [firstEnabledIndex, moveFocus, open, options, selectOption, virtualFocusIndex]);

  useEffect(() => {
    if (!open) return;
    const node = optionRefs.current[virtualFocusIndex];
    if (node && node.scrollIntoView) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [open, virtualFocusIndex]);

  const handleTriggerKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
    }
  };

  const appliedFontSize = fontSize ?? 16;
  const fallbackA = isDarkMode ? flexoki.base["50"] : flexoki.base["900"];
  const fallbackB = isDarkMode ? flexoki.base["900"] : flexoki.base["50"];
  const resolvedColorA = colorA ?? fallbackA;
  const resolvedColorB = colorB ?? fallbackB;
  const surfaceColor = resolvedColorB;
  const borderColor = resolvedColorA;
  const textColor = resolvedColorA;
  const mutedColor = colorWithAlpha(resolvedColorA, 0.7);
  const highlightShadow = colorWithAlpha(resolvedColorA, 0.25);
  const placeholderColor = colorWithAlpha(resolvedColorA, 0.5);
  const focusOverlay = colorWithAlpha(resolvedColorA, 0.2, "16,15,15");

  const themeVars: React.CSSProperties = {
    "--dropdown-surface": surfaceColor,
    "--dropdown-border": borderColor,
    "--dropdown-text": textColor,
    "--dropdown-muted": mutedColor,
    "--dropdown-placeholder": placeholderColor,
    "--dropdown-shadow": highlightShadow,
    "--dropdown-inverse-surface": resolvedColorA,
    "--dropdown-inverse-text": resolvedColorB,
    "--dropdown-focus-overlay": focusOverlay,
    "--dropdown-font-size": `${appliedFontSize}px`,
  } as React.CSSProperties;

  const rootClass = ["dropdown-root", className].filter(Boolean).join(" ");
  const displayLabel = activeOption?.label ?? placeholder;
  const showPlaceholder = !activeOption;

  const resolvedMaxWidth = width == null
    ? undefined
    : typeof width === "number"
      ? `${width}px`
      : width;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-open={open ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      style={{
        width: "100%",
        maxWidth: resolvedMaxWidth,
        ...themeVars,
        ...style,
      }}
    >
      <label id={labelId} htmlFor={buttonId} className="dropdown-label">
        {label}
      </label>
      <div className="dropdown-field">
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          className="dropdown-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${labelId} ${buttonId}`}
          aria-controls={open ? listboxId : undefined}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKey}
          disabled={disabled}
          data-open={open ? "true" : "false"}
        >
          <span className={`dropdown-value${showPlaceholder ? " dropdown-placeholder" : ""}`}>
            {displayLabel}
          </span>
          <span className="dropdown-caret" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        {open && (
          <div
            className="dropdown-menu"
            role="listbox"
            id={listboxId}
            aria-labelledby={labelId}
          >
            {options.map((option, index) => {
              const optionSelected = option.value === currentValue;
              const focused = virtualFocusIndex === index;
              const optionId = `${id}-option-${index}`;
              return (
                <button
                  key={option.value}
                  id={optionId}
                  type="button"
                  role="option"
                  aria-selected={optionSelected}
                  className="dropdown-option"
                  onMouseEnter={() => {
                    if (option.disabled) return;
                    setVirtualFocusIndex(index);
                  }}
                  onClick={() => {
                    if (!option.disabled) selectOption(option);
                  }}
                  disabled={option.disabled}
                  data-focused={focused ? "true" : "false"}
                  tabIndex={-1}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                >
                  <span className="dropdown-option-label">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className={`dropdown-option-description${optionSelected ? " dropdown-option-description--inverse" : ""}`}>
                      {option.description}
                    </span>
                  )}
                </button>
              );
            })}
            {!options.length && (
              <div className="dropdown-empty">No options available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
