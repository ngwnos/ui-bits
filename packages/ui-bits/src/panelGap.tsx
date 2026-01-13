import React from "react";

export const DEFAULT_VERTICAL_GAP_PX = 8;

export const VerticalGapContext = React.createContext<number | null>(null);
export type PanelSurfaceContextValue = {
  opacity: number;
  blur: number;
  registerSurface?: (node: HTMLElement) => void;
  unregisterSurface?: (node: HTMLElement) => void;
};

export const PanelSurfaceContext = React.createContext<PanelSurfaceContextValue | null>(null);

export const PanelEdgeBorderContext = React.createContext<{ left: boolean; right: boolean } | null>(null);
export const PanelThemeContext = React.createContext<{
  colorA?: string;
  colorB?: string;
  fontSize?: number;
  borderStyle?: "a" | "b" | "none";
  transparent?: boolean;
  bodyBlur?: number;
} | null>(null);

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === "number" && Number.isFinite(value)
);

export function useVerticalGap(explicit?: number) {
  const contextGap = React.useContext(VerticalGapContext);
  if (isFiniteNumber(explicit)) return Math.max(0, explicit);
  if (isFiniteNumber(contextGap)) return Math.max(0, contextGap);
  return DEFAULT_VERTICAL_GAP_PX;
}

export function usePanelEdgeBorders() {
  return React.useContext(PanelEdgeBorderContext);
}

export function usePanelSurface() {
  return React.useContext(PanelSurfaceContext);
}

export function usePanelTheme() {
  return React.useContext(PanelThemeContext);
}
