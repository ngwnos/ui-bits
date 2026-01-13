import React from "react";
import { AnimationSuspensionProvider } from "../../animationSuspension";
import { usePanelEdgeBorders, usePanelSurface, usePanelTheme, useVerticalGap, VerticalGapContext } from "../../panelGap";
import IconButton from "../IconButton";

export type FolderBorderStyle = "a" | "b" | "none";

export interface FolderProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  colorA?: string;
  colorB?: string;
  borderStyle?: FolderBorderStyle;
  fontSize?: number;
  padding?: number | string;
  verticalGap?: number;
  inheritPanelSurface?: boolean;
  transparent?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  keepMounted?: boolean;
  suspended?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;

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

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function computeHeaderHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const Folder = React.forwardRef<HTMLDivElement, FolderProps>((props, ref) => {
  const {
    label,
    colorA,
    colorB,
    borderStyle,
    fontSize,
    padding = 0,
    verticalGap,
    inheritPanelSurface,
    transparent,
    collapsed,
    defaultCollapsed = false,
    keepMounted = true,
    suspended,
    onCollapseChange,
    style,
    className,
    children,
    ...rest
  } = props;
  const panelTheme = usePanelTheme();
  const resolvedColorA = colorA ?? panelTheme?.colorA ?? FALLBACK_COLOR_A;
  const resolvedColorB = colorB ?? panelTheme?.colorB ?? FALLBACK_COLOR_B;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? "a";
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedTransparent = transparent ?? panelTheme?.transparent ?? false;
  const isControlled = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = isControlled ? collapsed : internalCollapsed;
  const resolvedPadding = resolveSize(padding) ?? "0px";
  const resolvedBorderColor = resolvedBorderStyle === "a"
    ? resolvedColorA
    : resolvedBorderStyle === "b"
      ? resolvedColorB
      : "transparent";
  const rawHeaderBackground = isCollapsed ? resolvedColorB : resolvedColorA;
  const rawHeaderTextColor = isCollapsed ? resolvedColorA : resolvedColorB;
  const headerHeight = computeHeaderHeight(resolvedFontSize);
  const headerBorderWidth = 1;
  const headerOuterHeight = headerHeight + headerBorderWidth;
  const resolvedVerticalGap = useVerticalGap(verticalGap);
  const bodyGap = resolvedVerticalGap;
  const bodyPaddingY = `${resolvedVerticalGap}px`;
  const renderBody = !isCollapsed || keepMounted;
  const suspendChildren = Boolean(suspended || (keepMounted && isCollapsed));
  const panelEdgeBorders = usePanelEdgeBorders();
  const showLeftBorder = panelEdgeBorders?.left ?? true;
  const showRightBorder = panelEdgeBorders?.right ?? true;
  const panelSurface = usePanelSurface();
  const usePanelSurfaceBackground = inheritPanelSurface ?? Boolean(panelSurface);
  const surfaceOpacity = panelSurface?.opacity ?? 1;
  const headerBackground = rawHeaderBackground;
  const headerTextColor = rawHeaderTextColor;
  const bodyBackground = resolvedTransparent
    ? "transparent"
    : usePanelSurfaceBackground
      ? colorWithAlpha(rawHeaderTextColor, surfaceOpacity)
      : rawHeaderTextColor;
  const toggleValue = isCollapsed ? "collapsed" : "expanded";
  const toggleOptions = [
    { value: "collapsed", ariaLabel: "Expand section", title: "Expand section" },
    { value: "expanded", ariaLabel: "Collapse section", title: "Collapse section" },
  ];
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const registerSurface = panelSurface?.registerSurface;
  const unregisterSurface = panelSurface?.unregisterSurface;
  const setRefs = React.useCallback((node: HTMLDivElement | null) => {
    localRef.current = node;
    if (!ref) return;
    if (typeof ref === "function") {
      ref(node);
    } else {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);
  const shouldRegisterBody = usePanelSurfaceBackground && renderBody && !isCollapsed;
  React.useEffect(() => {
    if (!shouldRegisterBody || !registerSurface) return;
    const node = bodyRef.current;
    if (!node) return;
    registerSurface(node);
    return () => {
      if (unregisterSurface) unregisterSurface(node);
    };
  }, [isCollapsed, registerSurface, renderBody, shouldRegisterBody, unregisterSurface]);

  const commitCollapse = (next: boolean) => {
    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onCollapseChange?.(next);
  };
  const handleToggle = (nextValue: string) => {
    const next = nextValue === "collapsed";
    commitCollapse(next);
  };
  const handleHeaderClick = () => {
    commitCollapse(!isCollapsed);
  };

  return (
    <div
      ref={setRefs}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${resolvedBorderColor}`,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 3,
        overflow: "hidden",
        ...(style ?? {}),
      }}
      {...rest}
    >
      <div
        style={{
          minHeight: headerOuterHeight,
          height: headerOuterHeight,
          display: "grid",
          gridTemplateColumns: `${headerHeight}px 1fr ${headerHeight}px`,
          alignItems: "center",
          padding: `0 ${resolvedPadding}`,
          borderLeft: showLeftBorder ? `1px solid ${resolvedBorderColor}` : "none",
          borderRight: showRightBorder ? `1px solid ${resolvedBorderColor}` : "none",
          borderBottom: `1px solid ${resolvedBorderColor}`,
          background: headerBackground,
          color: headerTextColor,
          boxSizing: "border-box",
          fontSize: resolvedFontSize,
          fontWeight: 600,
          lineHeight: 1,
          cursor: "pointer",
          transition: "background 120ms ease, color 120ms ease",
        }}
        onClick={handleHeaderClick}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          <IconButton
            behavior="cycle"
            value={toggleValue}
            options={toggleOptions}
            onChange={(value) => handleToggle(value)}
            borderStyle="none"
            fontSize={resolvedFontSize}
            colorA={headerTextColor}
            colorB={headerBackground}
            aria-label={toggleOptions[isCollapsed ? 0 : 1]?.ariaLabel}
            title={toggleOptions[isCollapsed ? 0 : 1]?.title}
            onClick={(event) => event.stopPropagation()}
          >
            {isCollapsed ? (
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
                <path d="M5 12h14" />
              </svg>
            )}
          </IconButton>
        </div>
        <span style={{ textAlign: "center" }}>{label}</span>
        <div />
      </div>
      {renderBody && (
        <div
          ref={bodyRef}
          style={{
            paddingLeft: resolveSize(padding),
            paddingRight: resolveSize(padding),
            paddingTop: bodyPaddingY,
            paddingBottom: 0,
            display: isCollapsed ? "none" : "flex",
            flexDirection: "column",
            gap: bodyGap,
            background: bodyBackground,
          }}
          aria-hidden={isCollapsed}
        >
          <VerticalGapContext.Provider value={resolvedVerticalGap}>
            <AnimationSuspensionProvider suspended={suspendChildren}>
              {children}
            </AnimationSuspensionProvider>
          </VerticalGapContext.Provider>
        </div>
      )}
    </div>
  );
});

Folder.displayName = "Folder";

export default Folder;
