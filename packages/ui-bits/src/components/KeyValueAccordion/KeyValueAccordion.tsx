import React from "react";
import { AnimationSuspensionProvider } from "../../animationSuspension";
import {
  PanelThemeContext,
  usePanelSurface,
  usePanelTheme,
  useVerticalGap,
  VerticalGapContext,
} from "../../panelGap";
import IconButton from "../IconButton";
import "./key-value-accordion.css";

export type KeyValueAccordionBorderStyle = "a" | "b" | "none";
export type KeyValueAccordionMode = "single" | "multiple";

export interface KeyValueAccordionItem {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

export interface KeyValueAccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: KeyValueAccordionItem[];
  emptyLabel?: React.ReactNode;
  mode?: KeyValueAccordionMode;
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  onExpandedKeysChange?: (expandedKeys: string[]) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: KeyValueAccordionBorderStyle;
  borderRadius?: number;
  fontSize?: number;
  rowHeight?: number;
  padding?: number | string;
  verticalGap?: number;
  inheritPanelSurface?: boolean;
  transparent?: boolean;
  keepMounted?: boolean;
  suspended?: boolean;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

function computeRowHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

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

function colorWithAlpha(color: string, alpha: number, fallback = "255,255,255"): string {
  const normalized = normalizeHex(color);
  if (!normalized) return `rgba(${fallback},${alpha})`;
  const intVal = parseInt(normalized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildDefaultExpandedKeys(
  items: KeyValueAccordionItem[],
  mode: KeyValueAccordionMode,
  defaultExpandedKeys?: string[],
) {
  if (Array.isArray(defaultExpandedKeys)) {
    return defaultExpandedKeys;
  }
  const fallback = items
    .filter((item) => item.defaultExpanded)
    .map((item) => item.key);
  if (mode === "single") {
    return fallback.slice(0, 1);
  }
  return fallback;
}

function normalizeExpandedKeys(
  keys: readonly string[],
  items: KeyValueAccordionItem[],
  mode: KeyValueAccordionMode,
) {
  const validKeys = new Set(items.map((item) => item.key));
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const key of keys) {
    if (!validKeys.has(key) || seen.has(key)) continue;
    normalized.push(key);
    seen.add(key);
    if (mode === "single") break;
  }
  return normalized;
}

function expandedKeysEqual(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

const KeyValueAccordion = React.forwardRef<HTMLDivElement, KeyValueAccordionProps>((props, ref) => {
  const {
    items,
    emptyLabel = "No data",
    mode = "multiple",
    expandedKeys,
    defaultExpandedKeys,
    onExpandedKeysChange,
    colorA,
    colorB,
    borderStyle,
    borderRadius,
    fontSize,
    rowHeight,
    padding = 0,
    verticalGap,
    inheritPanelSurface,
    transparent,
    keepMounted = true,
    suspended,
    className,
    style,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedTransparent = transparent ?? panelTheme?.transparent ?? false;
  const resolvedBodyBlur = panelTheme?.bodyBlur;
  const resolvedTheme = React.useMemo(() => ({
    colorA: resolvedColorA,
    colorB: resolvedColorB,
    fontSize: resolvedFontSize,
    borderStyle: resolvedBorderStyle,
    transparent: resolvedTransparent,
    bodyBlur: resolvedBodyBlur,
  }), [
    resolvedBorderStyle,
    resolvedBodyBlur,
    resolvedColorA,
    resolvedColorB,
    resolvedFontSize,
    resolvedTransparent,
  ]);
  const surfaceColor = resolvedBorderStyle === "b" ? resolvedColorA : resolvedColorB;
  const textColor = resolvedBorderStyle === "b" ? resolvedColorB : resolvedColorA;
  const resolvedBorderColor = resolvedBorderStyle === "none" ? "transparent" : textColor;
  const borderValue = resolvedBorderStyle === "none"
    ? "1px solid transparent"
    : `1px solid ${resolvedBorderColor}`;
  const resolvedRadius = Math.max(0, borderRadius ?? 3);
  const resolvedRowHeight = Math.max(1, Math.round(rowHeight ?? computeRowHeight(resolvedFontSize)));
  const paddingX = Math.round(resolvedFontSize * 0.7);
  const resolvedPadding = resolveSize(padding) ?? "0px";
  const resolvedVerticalGap = useVerticalGap(verticalGap);
  const bodyPaddingY = `${resolvedVerticalGap}px`;
  const panelSurface = usePanelSurface();
  const usePanelSurfaceBackground = inheritPanelSurface ?? Boolean(panelSurface);
  const surfaceOpacity = panelSurface?.opacity ?? 1;
  const surfaceBlur = panelSurface?.blur ?? 0;
  const useTransparentSurface = resolvedTransparent && usePanelSurfaceBackground;
  const bodyBackground = useTransparentSurface
    ? colorWithAlpha(surfaceColor, surfaceOpacity)
    : surfaceColor;
  const bodyBackdropFilter = useTransparentSurface && surfaceBlur > 0 ? `blur(${surfaceBlur}px)` : "none";

  const isControlled = expandedKeys !== undefined;
  const [internalExpandedKeys, setInternalExpandedKeys] = React.useState<string[]>(() => (
    normalizeExpandedKeys(
      buildDefaultExpandedKeys(items, mode, defaultExpandedKeys),
      items,
      mode,
    )
  ));
  const normalizedControlledKeys = React.useMemo(() => (
    normalizeExpandedKeys(expandedKeys ?? [], items, mode)
  ), [expandedKeys, items, mode]);
  const currentExpandedKeys = isControlled ? normalizedControlledKeys : internalExpandedKeys;
  const expandedSet = React.useMemo(() => new Set(currentExpandedKeys), [currentExpandedKeys]);
  const idBase = React.useId();

  React.useEffect(() => {
    if (isControlled) return;
    const normalized = normalizeExpandedKeys(internalExpandedKeys, items, mode);
    if (!expandedKeysEqual(normalized, internalExpandedKeys)) {
      setInternalExpandedKeys(normalized);
    }
  }, [internalExpandedKeys, isControlled, items, mode]);

  const commitExpandedKeys = React.useCallback((nextKeys: string[]) => {
    const normalized = normalizeExpandedKeys(nextKeys, items, mode);
    if (!isControlled) {
      setInternalExpandedKeys(normalized);
    }
    onExpandedKeysChange?.(normalized);
  }, [isControlled, items, mode, onExpandedKeysChange]);

  const handleToggle = React.useCallback((item: KeyValueAccordionItem) => {
    if (item.disabled) return;
    if (item.children == null) return;
    const isExpanded = expandedSet.has(item.key);
    if (mode === "single") {
      commitExpandedKeys(isExpanded ? [] : [item.key]);
      return;
    }
    if (isExpanded) {
      commitExpandedKeys(currentExpandedKeys.filter((key) => key !== item.key));
      return;
    }
    commitExpandedKeys([...currentExpandedKeys, item.key]);
  }, [commitExpandedKeys, currentExpandedKeys, expandedSet, mode]);

  const handleHeaderKeyDown = React.useCallback((
    event: React.KeyboardEvent<HTMLDivElement>,
    item: KeyValueAccordionItem,
  ) => {
    if (item.disabled || item.children == null) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleToggle(item);
  }, [handleToggle]);

  return (
    <div
      ref={ref}
      className={["ui-bits-key-value-accordion", className].filter(Boolean).join(" ")}
      style={{
        fontFamily: "inherit",
        fontSize: resolvedFontSize,
        lineHeight: 1,
        color: textColor,
        background: surfaceColor,
        border: borderValue,
        borderRadius: resolvedRadius,
        overflow: "hidden",
        boxSizing: "border-box",
        "--ui-bits-key-value-accordion-row-height": `${resolvedRowHeight}px`,
        "--ui-bits-key-value-accordion-padding-x": `${paddingX}px`,
        "--ui-bits-key-value-accordion-body-padding-x": resolvedPadding,
        "--ui-bits-key-value-accordion-body-padding-y": bodyPaddingY,
        "--ui-bits-key-value-accordion-body-gap": `${resolvedVerticalGap}px`,
        "--ui-bits-key-value-accordion-border-color": resolvedBorderColor,
        "--ui-bits-key-value-accordion-body-background": bodyBackground,
        "--ui-bits-key-value-accordion-body-backdrop-filter": bodyBackdropFilter,
        ...(style ?? {}),
      } as React.CSSProperties}
      {...rest}
    >
      {items.length > 0 ? items.map((item, index) => {
        const isExpanded = expandedSet.has(item.key);
        const isExpandable = item.children != null;
        const headerId = `${idBase}-header-${index}`;
        const bodyId = `${idBase}-body-${index}`;
        const toggleValue = isExpanded ? "expanded" : "collapsed";
        const toggleOptions = [
          { value: "collapsed", ariaLabel: "Expand section", title: "Expand section" },
          { value: "expanded", ariaLabel: "Collapse section", title: "Collapse section" },
        ];
        const renderBody = isExpandable && (isExpanded || keepMounted);
        const suspendChildren = Boolean(suspended || (keepMounted && !isExpanded));
        return (
          <div key={item.key} className="ui-bits-key-value-accordion__item">
            <div
              id={headerId}
              className={[
                "ui-bits-key-value-accordion__header",
                isExpandable ? "ui-bits-key-value-accordion__header--expandable" : "",
                item.disabled ? "ui-bits-key-value-accordion__header--disabled" : "",
              ].filter(Boolean).join(" ")}
              role={isExpandable ? "button" : undefined}
              tabIndex={isExpandable && !item.disabled ? 0 : undefined}
              aria-expanded={isExpandable ? isExpanded : undefined}
              aria-controls={isExpandable ? bodyId : undefined}
              aria-disabled={item.disabled || undefined}
              onClick={() => handleToggle(item)}
              onKeyDown={(event) => handleHeaderKeyDown(event, item)}
            >
              <div className="ui-bits-key-value-accordion__icon">
                {isExpandable ? (
                  <IconButton
                    behavior="cycle"
                    value={toggleValue}
                    options={toggleOptions}
                    onChange={() => handleToggle(item)}
                    borderStyle="none"
                    fontSize={resolvedFontSize}
                    colorA={textColor}
                    colorB={surfaceColor}
                    disabled={item.disabled}
                    aria-label={toggleOptions[isExpanded ? 1 : 0]?.ariaLabel}
                    title={toggleOptions[isExpanded ? 1 : 0]?.title}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {isExpanded ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    )}
                  </IconButton>
                ) : (
                  <div className="ui-bits-key-value-accordion__icon-placeholder" />
                )}
              </div>
              <span className="ui-bits-key-value-accordion__label">{item.label}</span>
              <span className="ui-bits-key-value-accordion__value">{item.value}</span>
            </div>
            {renderBody ? (
              <div
                id={bodyId}
                role="region"
                aria-labelledby={headerId}
                aria-hidden={!isExpanded}
                className={[
                  "ui-bits-key-value-accordion__body",
                  isExpanded ? "" : "ui-bits-key-value-accordion__body--collapsed",
                ].filter(Boolean).join(" ")}
              >
                <VerticalGapContext.Provider value={resolvedVerticalGap}>
                  <PanelThemeContext.Provider value={resolvedTheme}>
                    <AnimationSuspensionProvider suspended={suspendChildren}>
                      {item.children}
                    </AnimationSuspensionProvider>
                  </PanelThemeContext.Provider>
                </VerticalGapContext.Provider>
              </div>
            ) : null}
          </div>
        );
      }) : (
        <div className="ui-bits-key-value-accordion__empty">
          {emptyLabel}
        </div>
      )}
    </div>
  );
});

KeyValueAccordion.displayName = "KeyValueAccordion";

export default KeyValueAccordion;
