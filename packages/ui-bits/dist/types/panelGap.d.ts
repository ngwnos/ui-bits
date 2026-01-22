import React from "react";
export declare const DEFAULT_VERTICAL_GAP_PX = 8;
export declare const VerticalGapContext: React.Context<number | null>;
export type PanelSurfaceContextValue = {
    opacity: number;
    blur: number;
    registerSurface?: (node: HTMLElement) => void;
    unregisterSurface?: (node: HTMLElement) => void;
};
export declare const PanelSurfaceContext: React.Context<PanelSurfaceContextValue | null>;
export declare const PanelEdgeBorderContext: React.Context<{
    left: boolean;
    right: boolean;
} | null>;
export declare const PanelThemeContext: React.Context<{
    colorA?: string;
    colorB?: string;
    fontSize?: number;
    borderStyle?: "a" | "b" | "none";
    transparent?: boolean;
    bodyBlur?: number;
} | null>;
export declare function useVerticalGap(explicit?: number): number;
export declare function usePanelEdgeBorders(): {
    left: boolean;
    right: boolean;
} | null;
export declare function usePanelSurface(): PanelSurfaceContextValue | null;
export declare function usePanelTheme(): {
    colorA?: string;
    colorB?: string;
    fontSize?: number;
    borderStyle?: "a" | "b" | "none";
    transparent?: boolean;
    bodyBlur?: number;
} | null;
