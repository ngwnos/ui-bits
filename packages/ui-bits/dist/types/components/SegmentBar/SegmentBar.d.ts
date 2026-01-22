import React from "react";
export interface SegmentBarOption {
    value: string;
    label: string;
}
export type SegmentBarBorderStyle = "a" | "b" | "none";
export type SegmentBarBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export interface SegmentBarProps {
    label?: string;
    showLabel?: boolean;
    ariaLabel?: string;
    options: SegmentBarOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string, option: SegmentBarOption, index: number) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: SegmentBarBorderStyle;
    borderMask?: SegmentBarBorderMask;
    width?: number | string;
    fontSize?: number;
    disabled?: boolean;
    controlId?: string;
    className?: string;
    style?: React.CSSProperties;
}
export default function SegmentBar({ label, showLabel, ariaLabel, options, value, defaultValue, onChange, colorA, colorB, borderStyle, borderMask, width, fontSize, disabled, controlId, className, style, }: SegmentBarProps): import("react/jsx-runtime").JSX.Element;
