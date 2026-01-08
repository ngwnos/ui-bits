import React from "react";
import { AnimationSuspensionProvider } from "../../animationSuspension";

export type FloatingPanelBorderStyle = "a" | "b" | "none";

export interface FloatingPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  colorA?: string;
  colorB?: string;
  borderStyle?: FloatingPanelBorderStyle;
  transparent?: boolean;
  bodyBlur?: number;
  bodyOpacity?: number;
  collapsed?: boolean;
  keepMounted?: boolean;
  suspended?: boolean;
  draggable?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
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
const DEFAULT_SHADOW = "none";

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

const clampBetween = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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
    collapsed = false,
    keepMounted = true,
    suspended,
    draggable = false,
    position,
    onPositionChange,
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
  const resolvedPadding = padding ?? Math.round(resolvedFontSize * 0.75);
  const resolvedPaddingValue = resolveSize(resolvedPadding);
  const resolvedRadius = radius ?? Math.max(4, Math.round(resolvedFontSize * 0.4));
  const resolvedShadow = shadow ?? DEFAULT_SHADOW;
  const resolvedBorderColor = borderStyle === "a"
    ? colorA
    : borderStyle === "b"
      ? colorB
      : "transparent";
  const gap = Math.max(6, Math.round(resolvedFontSize * 0.4));
  const headerMinHeight = computeHeaderHeight(resolvedFontSize);
  const headerBorderWidth = SLIDER_BORDER_WIDTH;
  const renderBody = !collapsed || keepMounted;
  const suspendChildren = Boolean(suspended || (keepMounted && collapsed));

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
          padding: `0 ${resolvedPaddingValue ?? 0}`,
          border: headerBorderWidth ? `${headerBorderWidth}px solid ${resolvedBorderColor}` : "none",
          borderTopLeftRadius: resolvedRadius,
          borderTopRightRadius: resolvedRadius,
          borderBottomLeftRadius: collapsed ? resolvedRadius : 0,
          borderBottomRightRadius: collapsed ? resolvedRadius : 0,
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
      {renderBody && (
        <div
          style={{
            padding: resolvedPaddingValue,
            display: collapsed ? "none" : "flex",
            flexDirection: "column",
            gap,
            background: "transparent",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
          aria-hidden={collapsed}
        >
          <AnimationSuspensionProvider suspended={suspendChildren}>
            {children}
          </AnimationSuspensionProvider>
        </div>
      )}
    </div>
  );
});

FloatingPanel.displayName = "FloatingPanel";

export default FloatingPanel;
