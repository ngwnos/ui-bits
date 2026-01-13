import React from "react";
import { clamp } from "../../lfo";
import type { SliderBorder } from "../LFOSlider";

export type LoadingBarStyle = "continuous" | "discrete";

export interface LoadingBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  value?: number;
  defaultValue?: number;
  colorA?: string;
  colorB?: string;
  barStyle?: LoadingBarStyle;
  barSegmentCount?: number;
  border?: SliderBorder;
  borderMask?: Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
  width?: number | string;
  fontSize?: number;
}

const FALLBACK_COLOR_A = "#2f2f2f";
const FALLBACK_COLOR_B = "#f0f0f0";
const BAR_LINE_HEIGHT = 1;
const BAR_PAD_Y_EM = 0.35;
const BAR_BORDER_WIDTH = 1;

function resolveSize(value?: number | string): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function computeBarHeight(fontSize: number) {
  const contentHeight = fontSize * (BAR_LINE_HEIGHT + BAR_PAD_Y_EM * 2);
  return Math.round(contentHeight + BAR_BORDER_WIDTH * 2);
}

export default function LoadingBar({
  value,
  defaultValue = 0,
  colorA = FALLBACK_COLOR_A,
  colorB = FALLBACK_COLOR_B,
  barStyle = "continuous",
  barSegmentCount = 32,
  border = "a",
  borderMask,
  width,
  fontSize = 12,
  className,
  style,
  ...rest
}: LoadingBarProps) {
  const rawValue = typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
  const clampedValue = clamp(rawValue, 0, 1);
  const segmentCount = Number.isFinite(barSegmentCount)
    ? Math.max(1, Math.floor(barSegmentCount))
    : 0;
  const quantizedValue = barStyle === "discrete" && segmentCount > 1
    ? Math.round(clampedValue * segmentCount) / segmentCount
    : clampedValue;
  const splitPct = `${(clamp(quantizedValue, 0, 1) * 100).toFixed(3)}%`;
  const resolvedWidth = resolveSize(width);
  const resolvedBorderColor = border === "b" ? colorB : colorA;
  const resolvedBorderMask = {
    top: borderMask?.top ?? true,
    right: borderMask?.right ?? true,
    bottom: borderMask?.bottom ?? true,
    left: borderMask?.left ?? true,
  };
  const borderValue = border === "none" ? "1px solid transparent" : `1px solid ${resolvedBorderColor}`;
  const height = computeBarHeight(fontSize);

  return (
    <div
      className={className}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={clampedValue}
      style={{
        width: resolvedWidth,
        height,
        borderRadius: 3,
        borderTop: resolvedBorderMask.top ? borderValue : "none",
        borderRight: resolvedBorderMask.right ? borderValue : "none",
        borderBottom: resolvedBorderMask.bottom ? borderValue : "none",
        borderLeft: resolvedBorderMask.left ? borderValue : "none",
        backgroundImage: `linear-gradient(90deg, ${colorA} 0%, ${colorA} ${splitPct}, ${colorB} ${splitPct}, ${colorB} 100%)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        backgroundOrigin: "padding-box",
        boxSizing: "border-box",
        ...(style ?? {}),
      }}
      {...rest}
    />
  );
}

LoadingBar.displayName = "LoadingBar";
