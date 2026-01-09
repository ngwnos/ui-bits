import React from "react";

export const DEFAULT_VERTICAL_GAP_PX = 8;

export const VerticalGapContext = React.createContext<number | null>(null);

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === "number" && Number.isFinite(value)
);

export function useVerticalGap(explicit?: number) {
  const contextGap = React.useContext(VerticalGapContext);
  if (isFiniteNumber(explicit)) return Math.max(0, explicit);
  if (isFiniteNumber(contextGap)) return Math.max(0, contextGap);
  return DEFAULT_VERTICAL_GAP_PX;
}
