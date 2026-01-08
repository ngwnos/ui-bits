import React from "react";

export type FloatingPanelBorderStyle = "a" | "b" | "none";

export interface FloatingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  borderStyle?: FloatingPanelBorderStyle;
  transparent?: boolean;
  bodyBlur?: number;
  bodyOpacity?: number;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
  width?: number | string;
  padding?: number | string;
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
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    borderStyle = "a",
    transparent = false,
    bodyBlur,
    bodyOpacity,
    draggable = false,
    defaultPosition,
    width,
    padding,
    radius,
    shadow,
    fontSize = 12,
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
  React.useEffect(() => {
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
  }, [defaultPosition?.x, defaultPosition?.y]);
  const resolvedFontSize = fontSize ?? 12;
  const resolvedPadding = padding ?? Math.round(resolvedFontSize * 0.75);
  const resolvedPaddingValue = resolveSize(resolvedPadding);
  const resolvedRadius = radius ?? Math.max(4, Math.round(resolvedFontSize * 0.4));
  const resolvedShadow = shadow ?? "0 12px 24px rgba(0, 0, 0, 0.18)";
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const gap = Math.max(6, Math.round(resolvedFontSize * 0.4));
  const headerHeight = computeHeaderHeight(resolvedFontSize);
  const resolvedBodyOpacity = Math.max(0, Math.min(1, bodyOpacity ?? DEFAULT_BODY_OPACITY));
  const resolvedBodyBlur = Math.max(0, bodyBlur ?? DEFAULT_BODY_BLUR);

  const resolvedPosition = dragPosition;
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
    setDragPosition({ x: nextX, y: nextY });
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
        border: `1px solid ${resolvedBorderColor}`,
        background: transparent ? "transparent" : colorB,
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
          minHeight: headerHeight,
          height: headerHeight,
          display: "flex",
          alignItems: "center",
          padding: `0 ${resolvedPaddingValue ?? 0}`,
          borderBottom: `1px solid ${resolvedBorderColor}`,
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
        {header}
      </div>
      <div
        style={{
          padding: resolvedPaddingValue,
          display: "flex",
          flexDirection: "column",
          gap,
          background: transparent ? colorWithAlpha(colorB, resolvedBodyOpacity) : colorB,
          backdropFilter: transparent ? `blur(${resolvedBodyBlur}px)` : "none",
          WebkitBackdropFilter: transparent ? `blur(${resolvedBodyBlur}px)` : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
});

FloatingPanel.displayName = "FloatingPanel";

export default FloatingPanel;
