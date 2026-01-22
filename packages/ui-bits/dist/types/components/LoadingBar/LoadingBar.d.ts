import React from "react";
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
declare function LoadingBar({ value, defaultValue, colorA, colorB, barStyle, barSegmentCount, border, borderMask, width, fontSize, className, style, ...rest }: LoadingBarProps): import("react/jsx-runtime").JSX.Element;
declare namespace LoadingBar {
    var displayName: string;
}
export default LoadingBar;
