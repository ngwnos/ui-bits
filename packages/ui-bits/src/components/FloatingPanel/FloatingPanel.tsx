import React from "react";
import { AnimationSuspensionProvider } from "../../animationSuspension";
import { PanelSurfaceContext, useVerticalGap, VerticalGapContext } from "../../panelGap";
import IconButton from "../IconButton";

export type FloatingPanelBorderStyle = "a" | "b" | "none";

export interface FloatingPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  header?: React.ReactNode;
  title?: React.ReactNode;
  collapsible?: boolean;
  showDockButton?: boolean;
  colorA?: string;
  colorB?: string;
  borderStyle?: FloatingPanelBorderStyle;
  transparent?: boolean;
  bodyBlur?: number;
  bodyOpacity?: number;
  verticalGap?: number;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  keepMounted?: boolean;
  suspended?: boolean;
  draggable?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  defaultPosition?: { x: number; y: number };
  onCollapseChange?: (collapsed: boolean) => void;
  width?: number | string;
  padding?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  radius?: number;
  shadow?: string;
  fontSize?: number;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const SLIDER_LINE_HEIGHT = 1;
const SLIDER_PAD_Y_EM = 0.35;
const SLIDER_BORDER_WIDTH = 1;
const DEFAULT_BODY_BLUR = 10;
const DEFAULT_BODY_OPACITY = 0.5;
const DEFAULT_SHADOW = "none";

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

const clampBetween = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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

function computeHeaderHeight(fontSize: number) {
  const contentHeight = fontSize * (SLIDER_LINE_HEIGHT + SLIDER_PAD_Y_EM * 2);
  return Math.round(contentHeight + SLIDER_BORDER_WIDTH * 2);
}

const FloatingPanel = React.forwardRef<HTMLDivElement, FloatingPanelProps>((props, ref) => {
  const {
    header,
    title,
    collapsible = false,
    showDockButton = false,
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "a",
    transparent = false,
    bodyBlur,
    bodyOpacity,
    collapsed,
    defaultCollapsed = false,
    keepMounted = true,
    suspended,
    draggable = false,
    position,
    onPositionChange,
    defaultPosition,
    onCollapseChange,
    width,
    padding,
    paddingLeft,
    paddingRight,
    paddingBottom,
    radius,
    shadow,
    fontSize = 12,
    verticalGap,
    style,
    className,
    children,
    ...rest
  } = props;
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const pointerIdRef = React.useRef<number | null>(null);
  const dragOffsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState<{ x: number; y: number } | null>(() => (
    defaultPosition ? { x: defaultPosition.x, y: defaultPosition.y } : null
  ));
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const surfaceNodesRef = React.useRef<Set<HTMLElement>>(new Set());
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const [surfaceRects, setSurfaceRects] = React.useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [surfaceSize, setSurfaceSize] = React.useState<{ width: number; height: number } | null>(null);
  React.useEffect(() => {
    if (position) {
      setDragPosition({ x: position.x, y: position.y });
      return;
    }
    if (!defaultPosition) return;
    if (typeof window === "undefined") {
      setDragPosition({ x: defaultPosition.x, y: defaultPosition.y });
      return;
    }
    const panelNode = panelRef.current;
    const rect = panelNode?.getBoundingClientRect();
    const maxX = rect ? Math.max(0, window.innerWidth - rect.width) : window.innerWidth;
    const maxY = rect ? Math.max(0, window.innerHeight - rect.height) : window.innerHeight;
    setDragPosition({
      x: clampBetween(defaultPosition.x, 0, maxX),
      y: clampBetween(defaultPosition.y, 0, maxY),
    });
  }, [defaultPosition?.x, defaultPosition?.y, position?.x, position?.y]);
  const resolvedFontSize = fontSize ?? 12;
  const isCollapsedControlled = collapsed !== undefined;
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const resolvedCollapsed = isCollapsedControlled ? collapsed : internalCollapsed;
  const resolvedPadding = padding ?? Math.round(resolvedFontSize * 0.75);
  const resolvedPaddingLeft = paddingLeft ?? resolvedPadding;
  const resolvedPaddingRight = paddingRight ?? resolvedPadding;
  const resolvedPaddingBottom = paddingBottom ?? 0;
  const resolvedPaddingLeftValue = resolveSize(resolvedPaddingLeft) ?? "0px";
  const resolvedPaddingRightValue = resolveSize(resolvedPaddingRight) ?? "0px";
  const resolvedPaddingBottomValue = resolveSize(resolvedPaddingBottom) ?? "0px";
  const resolvedRadius = radius ?? 3;
  const resolvedShadow = shadow ?? DEFAULT_SHADOW;
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const resolvedVerticalGap = useVerticalGap(verticalGap);
  const verticalGapValue = `${resolvedVerticalGap}px`;
  const headerMinHeight = computeHeaderHeight(resolvedFontSize);
  const headerBorderWidth = SLIDER_BORDER_WIDTH;
  const resolvedBodyOpacity = clampBetween(bodyOpacity ?? DEFAULT_BODY_OPACITY, 0, 1);
  const resolvedBodyBlur = Math.max(0, bodyBlur ?? DEFAULT_BODY_BLUR);
  const surfaceOpacity = transparent ? resolvedBodyOpacity : 1;
  const surfaceBlur = transparent ? resolvedBodyBlur : 0;
  const renderBody = !resolvedCollapsed || keepMounted;
  const suspendChildren = Boolean(suspended || (keepMounted && resolvedCollapsed));
  const updateSurfaceRects = React.useCallback(() => {
    const bodyNode = bodyRef.current;
    if (!bodyNode) return;
    const bodyRect = bodyNode.getBoundingClientRect();
    if (!bodyRect.width || !bodyRect.height) return;
    const nextRects: Array<{ x: number; y: number; width: number; height: number }> = [];
    surfaceNodesRef.current.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, rect.left - bodyRect.left);
      const y = Math.max(0, rect.top - bodyRect.top);
      const width = Math.max(0, Math.min(rect.width, bodyRect.width - x));
      const height = Math.max(0, Math.min(rect.height, bodyRect.height - y));
      if (width > 0 && height > 0) {
        nextRects.push({ x, y, width, height });
      }
    });
    setSurfaceSize({ width: bodyRect.width, height: bodyRect.height });
    setSurfaceRects(nextRects);
  }, []);
  const registerSurface = React.useCallback((node: HTMLElement) => {
    surfaceNodesRef.current.add(node);
    resizeObserverRef.current?.observe(node);
    updateSurfaceRects();
  }, [updateSurfaceRects]);
  const unregisterSurface = React.useCallback((node: HTMLElement) => {
    surfaceNodesRef.current.delete(node);
    resizeObserverRef.current?.unobserve(node);
    updateSurfaceRects();
  }, [updateSurfaceRects]);
  React.useLayoutEffect(() => {
    updateSurfaceRects();
  }, [updateSurfaceRects, children, resolvedPaddingLeftValue, resolvedPaddingRightValue, resolvedPaddingBottomValue, resolvedVerticalGap]);
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateSurfaceRects());
    resizeObserverRef.current = observer;
    const bodyNode = bodyRef.current;
    if (bodyNode) observer.observe(bodyNode);
    surfaceNodesRef.current.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [updateSurfaceRects]);
  const surfaceOverlayRects = React.useMemo(() => (
    surfaceRects.map((rect) => ({
      x: Math.max(0, Math.floor(rect.x)),
      y: Math.max(0, Math.floor(rect.y)),
      width: Math.max(0, Math.ceil(rect.width)),
      height: Math.max(0, Math.ceil(rect.height)),
    }))
  ), [surfaceRects]);
  const surfacePathData = React.useMemo(() => {
    if (!surfaceSize) return null;
    const width = Math.max(1, Math.ceil(surfaceSize.width));
    const height = Math.max(1, Math.ceil(surfaceSize.height));
    const holes = surfaceOverlayRects.map((rect) => (
      `M${rect.x} ${rect.y}H${rect.x + rect.width}V${rect.y + rect.height}H${rect.x}Z`
    ));
    return {
      width,
      height,
      path: `M0 0H${width}V${height}H0Z${holes.length ? ` ${holes.join(" ")}` : ""}`,
    };
  }, [surfaceOverlayRects, surfaceSize]);
  const panelSurfaceValue = React.useMemo(() => ({
    opacity: surfaceOpacity,
    blur: surfaceBlur,
    registerSurface,
    unregisterSurface,
  }), [registerSurface, surfaceBlur, surfaceOpacity, unregisterSurface]);
  const toggleValue = resolvedCollapsed ? "collapsed" : "expanded";
  const toggleOptions = [
    { value: "collapsed", ariaLabel: "Expand panel", title: "Expand panel" },
    { value: "expanded", ariaLabel: "Collapse panel", title: "Collapse panel" },
  ];
  const handleToggle = (nextValue: string) => {
    const next = nextValue === "collapsed";
    if (!isCollapsedControlled) {
      setInternalCollapsed(next);
    }
    onCollapseChange?.(next);
  };
  const showDock = Boolean(showDockButton && draggable);
  const handleDock = React.useCallback(() => {
    const panelNode = panelRef.current;
    if (!panelNode || typeof window === "undefined") return;
    const rect = panelNode.getBoundingClientRect();
    const margin = 6;
    const dockX = Math.max(0, window.innerWidth - rect.width - margin);
    const maxY = Math.max(0, window.innerHeight - rect.height - margin);
    const dockY = Math.max(0, Math.min(margin, maxY));
    const nextPosition = { x: dockX, y: dockY };
    if (position && onPositionChange) {
      onPositionChange(nextPosition);
    } else {
      setDragPosition(nextPosition);
    }
  }, [onPositionChange, position]);
  const resolvedHeader = header ?? (
    <div style={{ display: "flex", alignItems: "center", justifyContent: showDock ? "space-between" : "flex-start", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {collapsible && (
          <IconButton
            behavior="cycle"
            value={toggleValue}
            options={toggleOptions}
            onChange={(value) => handleToggle(value)}
            borderStyle="none"
            fontSize={resolvedFontSize}
            colorA={colorA}
            colorB={colorB}
            aria-label={toggleOptions[resolvedCollapsed ? 0 : 1]?.ariaLabel}
            title={toggleOptions[resolvedCollapsed ? 0 : 1]?.title}
          >
            {resolvedCollapsed ? (
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
        )}
        {title ? <span>{title}</span> : null}
      </div>
      {showDock ? (
        <IconButton
          borderStyle="none"
          fontSize={resolvedFontSize}
          colorA={colorA}
          colorB={colorB}
          aria-label="Dock panel"
          title="Dock panel"
          onClick={handleDock}
        >
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
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </IconButton>
      ) : null}
    </div>
  );

  const resolvedPosition = position ?? dragPosition;
  const isFloating = Boolean(draggable && resolvedPosition);
  const setRefs = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (!ref) return;
    if (typeof ref === "function") {
      ref(node);
    } else {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggable || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, [data-floating-panel-ignore-drag], input, select, textarea, a")) {
      return;
    }
    const panelNode = panelRef.current;
    if (!panelNode) return;
    const rect = panelNode.getBoundingClientRect();
    if (!resolvedPosition) {
      setDragPosition({ x: rect.left, y: rect.top });
    }
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggable || pointerIdRef.current !== event.pointerId) return;
    if (typeof window === "undefined") return;
    const panelNode = panelRef.current;
    const rect = panelNode?.getBoundingClientRect();
    const offset = dragOffsetRef.current;
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    const nextX = clampBetween(event.clientX - offset.x, 0, maxX);
    const nextY = clampBetween(event.clientY - offset.y, 0, maxY);
    const nextPosition = { x: nextX, y: nextY };
    if (position && onPositionChange) {
      onPositionChange(nextPosition);
    } else {
      setDragPosition(nextPosition);
    }
  };
  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={setRefs}
      className={className}
      style={{
        width: resolveSize(width),
        borderRadius: resolvedRadius,
        border: "none",
        background: "transparent",
        color: colorA,
        boxShadow: resolvedShadow,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontSize: resolvedFontSize,
        lineHeight: 1.3,
        position: isFloating ? "fixed" : undefined,
        left: isFloating ? `${resolvedPosition!.x}px` : undefined,
        top: isFloating ? `${resolvedPosition!.y}px` : undefined,
        zIndex: isFloating ? 20 : undefined,
        ...(style ?? {}),
      }}
      {...rest}
    >
      <div
        style={{
          minHeight: headerMinHeight,
          display: "flex",
          alignItems: "center",
          padding: `0 ${resolvedPaddingRightValue} 0 ${resolvedPaddingLeftValue}`,
          border: headerBorderWidth ? `${headerBorderWidth}px solid ${resolvedBorderColor}` : "none",
          borderTopLeftRadius: resolvedRadius,
          borderTopRightRadius: resolvedRadius,
          borderBottomLeftRadius: resolvedCollapsed ? resolvedRadius : 0,
          borderBottomRightRadius: resolvedCollapsed ? resolvedRadius : 0,
          boxSizing: "border-box",
          fontWeight: 600,
          lineHeight: 1,
          background: colorB,
          color: colorA,
          cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {resolvedHeader}
      </div>
      {renderBody && (
        <div
          ref={bodyRef}
          style={{
            padding: `${verticalGapValue} ${resolvedPaddingRightValue} ${resolvedPaddingBottomValue} ${resolvedPaddingLeftValue}`,
            display: resolvedCollapsed ? "none" : "flex",
            flexDirection: "column",
            position: "relative",
          }}
          aria-hidden={resolvedCollapsed}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: surfaceBlur > 0 ? "rgba(0,0,0,0.001)" : "transparent",
              backdropFilter: surfaceBlur > 0 ? `blur(${surfaceBlur}px)` : "none",
              WebkitBackdropFilter: surfaceBlur > 0 ? `blur(${surfaceBlur}px)` : "none",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {surfacePathData ? (
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${surfacePathData.width} ${surfacePathData.height}`}
                preserveAspectRatio="none"
                style={{ display: "block" }}
              >
                <path d={surfacePathData.path} fill={colorWithAlpha(colorB, surfaceOpacity)} fillRule="evenodd" />
              </svg>
            ) : (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: colorWithAlpha(colorB, surfaceOpacity),
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
          <VerticalGapContext.Provider value={resolvedVerticalGap}>
            <PanelSurfaceContext.Provider value={panelSurfaceValue}>
              <AnimationSuspensionProvider suspended={suspendChildren}>
                <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: resolvedVerticalGap }}>
                  {children}
                </div>
              </AnimationSuspensionProvider>
            </PanelSurfaceContext.Provider>
          </VerticalGapContext.Provider>
        </div>
      )}
    </div>
  );
});

FloatingPanel.displayName = "FloatingPanel";

export default FloatingPanel;
