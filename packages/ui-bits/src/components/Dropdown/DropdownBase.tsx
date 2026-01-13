import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { type DropdownOption } from "./types";
import { usePanelTheme } from "../../panelGap";
import { useControlValue } from "../../controlStore";
import "./dropdown.css";

export interface DropdownTriggerRenderProps {
  id: string;
  labelId?: string;
  listboxId: string;
  open: boolean;
  disabled: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  displayLabel: string;
  showPlaceholder: boolean;
  activeOption?: DropdownOption;
  onTriggerClick: () => void;
  onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaControls?: string;
}

export interface DropdownBaseProps {
  label?: string;
  showLabel?: boolean;
  ariaLabel?: string;
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string, option: DropdownOption) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: "a" | "b" | "none";
  borderMask?: Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
  borderRadius?: number;
  width?: number | string;
  fontSize?: number;
  showOptionIcons?: boolean;
  returnFocusOnSelect?: boolean;
  disabled?: boolean;
  controlId?: string;
  className?: string;
  style?: React.CSSProperties;
  renderTrigger: (props: DropdownTriggerRenderProps) => React.ReactNode;
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

const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";

function resolveThemeColors({
  colorA,
  colorB,
  borderStyle,
}: {
  colorA: string;
  colorB: string;
  borderStyle: "a" | "b" | "none";
}) {
  const surface = borderStyle === "b" ? colorA : colorB;
  const text = borderStyle === "b" ? colorB : colorA;
  const inverseSurface = borderStyle === "b" ? colorB : colorA;
  const inverseText = borderStyle === "b" ? colorA : colorB;
  return { surface, text, inverseSurface, inverseText };
}

export default function DropdownBase({
  label,
  showLabel = true,
  ariaLabel,
  options,
  value,
  defaultValue,
  placeholder = "Select an option",
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  colorA,
  colorB,
  borderStyle,
  borderMask,
  borderRadius,
  width,
  fontSize,
  showOptionIcons = false,
  returnFocusOnSelect = true,
  disabled = false,
  controlId,
  className,
  style,
  renderTrigger,
}: DropdownBaseProps) {
  const id = useId();
  const panelTheme = usePanelTheme();
  const [storeValue, setStoreValue] = useControlValue<string>(controlId);
  const shouldUseStore = controlId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const labelId = label ? `${id}-label` : undefined;
  const listboxId = `${id}-listbox`;
  const buttonId = `${id}-button`;
  const isControlled = resolvedValueProp !== undefined;
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  optionRefs.current.length = options.length;

  const firstEnabledIndex = useMemo(
    () => options.findIndex((option) => !option.disabled),
    [options],
  );

  const resolveInitialValue = useCallback(() => {
    if (resolvedValueProp !== undefined) return resolvedValueProp;
    if (defaultValue !== undefined) return defaultValue;
    if (firstEnabledIndex >= 0) return options[firstEnabledIndex].value;
    return "";
  }, [defaultValue, firstEnabledIndex, options, resolvedValueProp]);

  const [internalValue, setInternalValue] = useState<string>(() => resolveInitialValue());
  const currentValue = isControlled ? resolvedValueProp! : internalValue;

  useEffect(() => {
    if (resolvedValueProp !== undefined) return;
    const existing = options.find((option) => option.value === internalValue);
    if (!existing) {
      setInternalValue(resolveInitialValue());
    }
  }, [internalValue, options, resolveInitialValue, resolvedValueProp]);
  useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(resolveInitialValue());
  }, [resolveInitialValue, setStoreValue, shouldUseStore, storeValue]);

  const activeIndex = options.findIndex((option) => option.value === currentValue);
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpenControlled = open !== undefined;
  const resolvedOpen = isOpenControlled ? open : internalOpen;
  const setOpen = useCallback((next: boolean) => {
    if (!isOpenControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }, [isOpenControlled, onOpenChange]);
  const [virtualFocusIndex, setVirtualFocusIndex] = useState(() => (
    activeIndex >= 0 ? activeIndex : Math.max(0, firstEnabledIndex)
  ));

  useEffect(() => {
    if (!resolvedOpen) return;
    const fallback = activeIndex >= 0 ? activeIndex : firstEnabledIndex;
    setVirtualFocusIndex(fallback >= 0 ? fallback : 0);
  }, [activeIndex, firstEnabledIndex, resolvedOpen]);

  useEffect(() => {
    if (!resolvedOpen) return;
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => window.removeEventListener("pointerdown", handlePointer);
  }, [resolvedOpen, setOpen]);

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
    if (shouldUseStore) {
      setStoreValue(option.value);
    }
    onChange?.(option.value, option);
    setOpen(false);
    if (returnFocusOnSelect) {
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  }, [disabled, isControlled, onChange, returnFocusOnSelect, setOpen, setStoreValue, shouldUseStore]);

  useEffect(() => {
    if (!resolvedOpen) return;
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
  }, [firstEnabledIndex, moveFocus, options, resolvedOpen, selectOption, setOpen, virtualFocusIndex]);

  useEffect(() => {
    if (!resolvedOpen) return;
    const node = optionRefs.current[virtualFocusIndex];
    if (node && node.scrollIntoView) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [resolvedOpen, virtualFocusIndex]);

  const handleTriggerKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === " ") {
      event.preventDefault();
      if (!resolvedOpen) {
        setOpen(true);
      }
    }
  };

  const appliedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const rowHeight = Math.round(appliedFontSize * (1 + 0.35 * 2) + 2);
  const iconInset = Math.max(1, Math.round(appliedFontSize * 0.1));
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const borderColor = resolvedBorderStyle === "none"
    ? "transparent"
    : resolvedBorderStyle === "a"
      ? resolvedColorA
      : resolvedColorB;
  const { surface: surfaceColor, text: textColor, inverseSurface, inverseText } = resolveThemeColors({
    colorA: resolvedColorA,
    colorB: resolvedColorB,
    borderStyle: resolvedBorderStyle,
  });
  const maskedBorderColor = resolvedBorderStyle === "none" ? "transparent" : surfaceColor;
  const mutedColor = colorWithAlpha(textColor, 0.7);
  const highlightShadow = colorWithAlpha(textColor, 0.25);
  const placeholderColor = colorWithAlpha(textColor, 0.5);
  const focusOverlay = colorWithAlpha(textColor, 0.2, "16,15,15");

  const resolvedBorderMask = {
    top: borderMask?.top ?? true,
    right: borderMask?.right ?? true,
    bottom: borderMask?.bottom ?? true,
    left: borderMask?.left ?? true,
  };
  const resolvedRadius = Math.max(0, borderRadius ?? 3);
  const themeVars: React.CSSProperties = {
    "--dropdown-surface": surfaceColor,
    "--dropdown-border": borderColor,
    "--dropdown-border-top": resolvedBorderMask.top ? borderColor : maskedBorderColor,
    "--dropdown-border-right": resolvedBorderMask.right ? borderColor : maskedBorderColor,
    "--dropdown-border-bottom": resolvedBorderMask.bottom ? borderColor : maskedBorderColor,
    "--dropdown-border-left": resolvedBorderMask.left ? borderColor : maskedBorderColor,
    "--dropdown-text": textColor,
    "--dropdown-muted": mutedColor,
    "--dropdown-placeholder": placeholderColor,
    "--dropdown-shadow": highlightShadow,
    "--dropdown-inverse-surface": inverseSurface,
    "--dropdown-inverse-text": inverseText,
    "--dropdown-focus-overlay": focusOverlay,
    "--dropdown-font-size": `${appliedFontSize}px`,
    "--dropdown-radius": `${resolvedRadius}px`,
    "--dropdown-row-height": `${rowHeight}px`,
    "--dropdown-icon-inset": `${iconInset}px`,
  } as React.CSSProperties;

  const rootClass = ["dropdown-root", className].filter(Boolean).join(" ");
  const displayLabel = activeOption?.label ?? placeholder;
  const showPlaceholder = !activeOption;
  const resolvedLabelClass = showLabel ? "dropdown-label" : "dropdown-label dropdown-label--sr";

  const resolvedMaxWidth = width == null
    ? undefined
    : typeof width === "number"
      ? `${width}px`
      : width;

  const ariaLabelledBy = labelId ? `${labelId} ${buttonId}` : undefined;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-open={resolvedOpen ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      data-show-icons={showOptionIcons ? "true" : "false"}
      style={{
        width: "100%",
        maxWidth: resolvedMaxWidth,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        ...themeVars,
        ...style,
      }}
    >
      {label && (
        <label id={labelId} htmlFor={buttonId} className={resolvedLabelClass}>
          {label}
        </label>
      )}
      <div className="dropdown-field">
        {renderTrigger({
          id: buttonId,
          labelId,
          listboxId,
          open: resolvedOpen,
          disabled,
          buttonRef,
          displayLabel,
          showPlaceholder,
          activeOption,
          onTriggerClick: () => setOpen(!resolvedOpen),
          onTriggerKeyDown: handleTriggerKey,
          ariaLabel: label ? undefined : ariaLabel,
          ariaLabelledBy,
          ariaControls: resolvedOpen ? listboxId : undefined,
        })}
        {resolvedOpen && (
          <div
            className="dropdown-menu"
            role="listbox"
            id={listboxId}
            aria-labelledby={labelId ?? buttonId}
          >
            {options.map((option, index) => {
              const optionSelected = option.value === currentValue;
              const focused = virtualFocusIndex === index;
              const optionId = `${id}-option-${index}`;
              const optionIcon = showOptionIcons
                ? (option as DropdownOption & { icon?: React.ReactNode }).icon
                : undefined;
              const hasOptionTheme = Boolean(option.colorA || option.colorB || option.borderStyle);
              const optionTheme = hasOptionTheme
                ? resolveThemeColors({
                  colorA: option.colorA ?? resolvedColorA,
                  colorB: option.colorB ?? resolvedColorB,
                  borderStyle: option.borderStyle ?? resolvedBorderStyle,
                })
                : null;
              const optionStyle = hasOptionTheme ? {
                "--dropdown-surface": optionTheme!.surface,
                "--dropdown-text": optionTheme!.text,
                "--dropdown-muted": colorWithAlpha(optionTheme!.text, 0.7),
                "--dropdown-inverse-surface": optionTheme!.inverseSurface,
                "--dropdown-inverse-text": optionTheme!.inverseText,
                "--dropdown-focus-overlay": colorWithAlpha(optionTheme!.text, 0.2, "16,15,15"),
              } as React.CSSProperties : undefined;
              return (
                <button
                  key={option.value}
                  id={optionId}
                  type="button"
                  role="option"
                  aria-selected={optionSelected}
                  className="dropdown-option"
                  data-has-description={option.description ? "true" : "false"}
                  style={optionStyle}
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
                  <span className={`dropdown-option-label${showOptionIcons ? " dropdown-option-label--icon" : ""}`}>
                    {showOptionIcons && (
                      <span
                        className={`dropdown-option-icon${optionIcon ? "" : " dropdown-option-icon--empty"}`}
                        aria-hidden="true"
                      >
                        {optionIcon}
                      </span>
                    )}
                    <span className="dropdown-option-text">{option.label}</span>
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
