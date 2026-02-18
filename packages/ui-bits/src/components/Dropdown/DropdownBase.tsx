import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
  labelInline?: boolean;
  overlayMenu?: boolean;
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
  compact?: boolean;
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
const MENU_MAX_HEIGHT = 240;
const MENU_MIN_HEIGHT = 40;
const MENU_VIEWPORT_MARGIN = 6;
const MENU_BORDER_ALLOWANCE = 2;
const MENU_OPTION_PADDING_X_REM = 1.25;
const DROPDOWN_POPUP_SHADOW = "0 8px 20px rgba(0,0,0,0.2)";

type DropdownMenuPlacement = "up" | "down";

interface DropdownMenuMetrics {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: DropdownMenuPlacement;
}

function extractCssVariableStyle(style?: React.CSSProperties): React.CSSProperties {
  if (!style) return {};
  const result: React.CSSProperties = {};
  for (const [key, value] of Object.entries(style)) {
    if (!key.startsWith("--") || value === undefined) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

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
  labelInline = false,
  overlayMenu = true,
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
  compact = false,
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
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuViewportRef = useRef<HTMLDivElement | null>(null);
  const menuScrollTimeoutRef = useRef<number | null>(null);
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
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
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
    "--dropdown-shadow": DROPDOWN_POPUP_SHADOW,
    "--dropdown-inverse-surface": inverseSurface,
    "--dropdown-inverse-text": inverseText,
    "--dropdown-focus-overlay": focusOverlay,
    "--dropdown-font-size": `${appliedFontSize}px`,
    "--dropdown-radius": `${resolvedRadius}px`,
    "--dropdown-row-height": `${rowHeight}px`,
    "--dropdown-icon-inset": `${iconInset}px`,
  } as React.CSSProperties;

  const rootClass = ["dropdown-root", className].filter(Boolean).join(" ");
  const isIconVariant = useMemo(
    () => rootClass.split(/\s+/).includes("dropdown-root--icon"),
    [rootClass],
  );
  const displayLabel = activeOption?.label ?? placeholder;
  const showPlaceholder = !activeOption;
  const resolvedLabelClass = showLabel ? "dropdown-label" : "dropdown-label dropdown-label--sr";
  const customCssVars = useMemo(() => extractCssVariableStyle(style), [style]);
  const measuredOptionContentWidth = useMemo(() => {
    if (typeof document === "undefined" || options.length === 0) return undefined;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const computedFont = getComputedStyle(document.documentElement)
      .getPropertyValue("--ui-bits-font-family")
      .trim();
    const fontFamily = computedFont || '"IBM Plex Mono", monospace';
    const labelFont = `600 ${appliedFontSize}px ${fontFamily}`;
    const descriptionFont = `600 ${appliedFontSize * 0.75}px ${fontFamily}`;
    let maxTextWidth = 0;
    context.font = labelFont;
    for (const option of options) {
      maxTextWidth = Math.max(maxTextWidth, context.measureText(option.label).width);
      if (option.description) {
        context.font = descriptionFont;
        maxTextWidth = Math.max(maxTextWidth, context.measureText(option.description).width);
        context.font = labelFont;
      }
    }
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
    const horizontalPadding = rootFontSize * MENU_OPTION_PADDING_X_REM;
    return Math.ceil(maxTextWidth + horizontalPadding + MENU_BORDER_ALLOWANCE);
  }, [appliedFontSize, options]);
  const [menuMetrics, setMenuMetrics] = useState<DropdownMenuMetrics | null>(null);
  const [menuScrollMetrics, setMenuScrollMetrics] = useState(() => ({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  }));
  const [isMenuScrolling, setIsMenuScrolling] = useState(false);

  const resolvedMaxWidth = width == null
    ? undefined
    : typeof width === "number"
      ? `${width}px`
      : width;

  const ariaLabelledBy = labelId ? `${labelId} ${buttonId}` : undefined;
  const updateMenuMetrics = useCallback(() => {
    if (!fieldRef.current || typeof window === "undefined") return;
    const rect = fieldRef.current.getBoundingClientRect();
    const rootRect = rootRef.current?.getBoundingClientRect();
    const downAnchorTop = overlayMenu ? rect.top : rect.bottom;
    const upAnchorBottom = overlayMenu ? rect.bottom : rect.top;
    const availableBelow = Math.max(0, window.innerHeight - downAnchorTop - MENU_VIEWPORT_MARGIN);
    const availableAbove = Math.max(0, upAnchorBottom - MENU_VIEWPORT_MARGIN);
    const placement: DropdownMenuPlacement = (
      availableBelow >= MENU_MIN_HEIGHT || availableBelow >= availableAbove
    )
      ? "down"
      : "up";
    const availableSpace = placement === "down" ? availableBelow : availableAbove;
    const maxHeight = Math.max(MENU_MIN_HEIGHT, Math.min(MENU_MAX_HEIGHT, availableSpace));
    const maxViewportWidth = window.innerWidth - MENU_VIEWPORT_MARGIN * 2;
    const anchorWidth = Math.max(
      0,
      Math.min(rect.width, maxViewportWidth),
    );
    const canExpandIntoLabelArea = labelInline && !isIconVariant && Boolean(rootRect);
    const measuredContentWidth = canExpandIntoLabelArea
      ? measuredOptionContentWidth ?? anchorWidth
      : anchorWidth;
    const width = canExpandIntoLabelArea
      ? Math.max(anchorWidth, Math.min(measuredContentWidth, maxViewportWidth))
      : anchorWidth;
    const preferredLeft = canExpandIntoLabelArea
      ? Math.max(rootRect!.left, rect.right - width)
      : rect.left;
    const maxLeft = Math.max(MENU_VIEWPORT_MARGIN, window.innerWidth - width - MENU_VIEWPORT_MARGIN);
    const left = Math.max(MENU_VIEWPORT_MARGIN, Math.min(preferredLeft, maxLeft));
    const top = placement === "down"
      ? (overlayMenu ? rect.top : rect.bottom)
      : (overlayMenu ? rect.bottom : rect.top);
    setMenuMetrics((prev) => {
      if (
        prev
        && prev.top === top
        && prev.left === left
        && prev.width === width
        && prev.maxHeight === maxHeight
        && prev.placement === placement
      ) {
        return prev;
      }
      return { top, left, width, maxHeight, placement };
    });
  }, [isIconVariant, labelInline, measuredOptionContentWidth, overlayMenu]);
  const updateMenuScrollMetrics = useCallback(() => {
    const node = menuViewportRef.current;
    if (!node) return;
    setMenuScrollMetrics((prev) => {
      const next = {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
      if (
        prev.scrollTop === next.scrollTop
        && prev.scrollHeight === next.scrollHeight
        && prev.clientHeight === next.clientHeight
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  const handleMenuScroll = useCallback(() => {
    updateMenuScrollMetrics();
    setIsMenuScrolling(true);
    if (typeof window === "undefined") return;
    if (menuScrollTimeoutRef.current !== null) {
      window.clearTimeout(menuScrollTimeoutRef.current);
    }
    menuScrollTimeoutRef.current = window.setTimeout(() => {
      setIsMenuScrolling(false);
      menuScrollTimeoutRef.current = null;
    }, 650);
  }, [updateMenuScrollMetrics]);

  useEffect(() => {
    if (!resolvedOpen || typeof window === "undefined") {
      setMenuMetrics(null);
      setMenuScrollMetrics({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
      setIsMenuScrolling(false);
      return;
    }
    const handleUpdate = () => updateMenuMetrics();
    const handleWindowScroll = (event: Event) => {
      const scrollTarget = event.target;
      if (
        scrollTarget instanceof Node
        && menuViewportRef.current
        && menuViewportRef.current.contains(scrollTarget)
      ) {
        return;
      }
      updateMenuMetrics();
    };
    handleUpdate();
    const raf = window.requestAnimationFrame(handleUpdate);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleWindowScroll, true);
    };
  }, [resolvedOpen, updateMenuMetrics]);

  useEffect(() => {
    if (!resolvedOpen || typeof ResizeObserver === "undefined") return;
    const node = fieldRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => updateMenuMetrics());
    observer.observe(node);
    return () => observer.disconnect();
  }, [resolvedOpen, updateMenuMetrics]);

  useEffect(() => {
    if (!resolvedOpen || !menuMetrics) return;
    updateMenuScrollMetrics();
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(updateMenuScrollMetrics);
    return () => window.cancelAnimationFrame(raf);
  }, [menuMetrics, resolvedOpen, updateMenuScrollMetrics]);

  useEffect(() => {
    if (!resolvedOpen || typeof ResizeObserver === "undefined") return;
    const node = menuViewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => updateMenuScrollMetrics());
    observer.observe(node);
    return () => observer.disconnect();
  }, [resolvedOpen, updateMenuScrollMetrics]);

  useEffect(() => () => {
    if (typeof window === "undefined") return;
    if (menuScrollTimeoutRef.current !== null) {
      window.clearTimeout(menuScrollTimeoutRef.current);
      menuScrollTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!resolvedOpen || !menuMetrics) return;
    const node = optionRefs.current[virtualFocusIndex];
    if (node?.scrollIntoView) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [menuMetrics, resolvedOpen, virtualFocusIndex]);
  const hasMenuOverflow = menuScrollMetrics.scrollHeight - menuScrollMetrics.clientHeight > 1;
  const menuScrollThumbHeight = hasMenuOverflow
    ? Math.max(
      12,
      Math.round(menuScrollMetrics.clientHeight * (menuScrollMetrics.clientHeight / menuScrollMetrics.scrollHeight)),
    )
    : 0;
  const maxMenuThumbTop = Math.max(0, menuScrollMetrics.clientHeight - menuScrollThumbHeight);
  const menuScrollThumbTop = hasMenuOverflow && menuScrollMetrics.scrollHeight > menuScrollMetrics.clientHeight
    ? Math.round((menuScrollMetrics.scrollTop / (menuScrollMetrics.scrollHeight - menuScrollMetrics.clientHeight)) * maxMenuThumbTop)
    : 0;

  const menu = (resolvedOpen && menuMetrics && typeof document !== "undefined")
    ? createPortal(
      <div
        className={isIconVariant ? "dropdown-root dropdown-root--icon" : "dropdown-root"}
        data-compact={compact ? "true" : "false"}
        data-overlay-menu={overlayMenu ? "true" : "false"}
        data-show-icons={showOptionIcons ? "true" : "false"}
        style={{
          fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
          fontWeight: 600,
          ...themeVars,
          ...customCssVars,
        }}
      >
        <div
          ref={menuRef}
          className="dropdown-menu"
          data-placement={menuMetrics.placement}
          style={{
            top: `${menuMetrics.top}px`,
            left: `${menuMetrics.left}px`,
            maxHeight: `${menuMetrics.maxHeight}px`,
            minWidth: isIconVariant ? undefined : `${menuMetrics.width}px`,
            width: isIconVariant ? undefined : `${menuMetrics.width}px`,
            maxWidth: `calc(100vw - ${MENU_VIEWPORT_MARGIN * 2}px)`,
            zIndex: 1000,
            "--dropdown-anchor-width": `${menuMetrics.width}px`,
          } as React.CSSProperties}
        >
          <div
            ref={menuViewportRef}
            className="dropdown-menu__viewport"
            role="listbox"
            id={listboxId}
            aria-labelledby={labelId ?? buttonId}
            onScroll={handleMenuScroll}
            style={{ maxHeight: `${menuMetrics.maxHeight}px` }}
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
          {hasMenuOverflow && (
            <div
              className="dropdown-menu__scrollbar"
              aria-hidden="true"
              style={{ opacity: isMenuScrolling ? 1 : undefined }}
            >
              <div
                className="dropdown-menu__scrollbar-thumb"
                style={{
                  height: menuScrollThumbHeight,
                  transform: `translateY(${menuScrollThumbTop}px)`,
                }}
              />
            </div>
          )}
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-open={resolvedOpen ? "true" : "false"}
      data-compact={compact ? "true" : "false"}
      data-label-inline={labelInline ? "true" : "false"}
      data-overlay-menu={overlayMenu ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      data-show-icons={showOptionIcons ? "true" : "false"}
      style={{
        width: "100%",
        maxWidth: resolvedMaxWidth,
        fontFamily: 'var(--ui-bits-font-family, "IBM Plex Mono", monospace)',
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
      <div className="dropdown-field" ref={fieldRef}>
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
      </div>
      {menu}
    </div>
  );
}
