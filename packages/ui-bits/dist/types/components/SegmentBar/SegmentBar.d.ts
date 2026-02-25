import React from "react";
export interface SegmentBarOption {
    /** Programmatic value emitted on selection. */
    value: string;
    /** Visible text for the segment. */
    label: string;
}
export type SegmentBarBorderStyle = "a" | "b" | "none";
export type SegmentBarBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export interface SegmentBarProps {
    /** Optional label rendered above the bar. */
    label?: string;
    /** Controls whether the label row is visible when `label` is present. */
    showLabel?: boolean;
    ariaLabel?: string;
    /** Segment definitions shown left-to-right. */
    options: SegmentBarOption[];
    /** Controlled selected value. */
    value?: string;
    /** Initial value for uncontrolled usage. */
    defaultValue?: string;
    /** Fired when a segment is selected. */
    onChange?: (value: string, option: SegmentBarOption, index: number) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: SegmentBarBorderStyle;
    borderMask?: SegmentBarBorderMask;
    width?: number | string;
    fontSize?: number;
    disabled?: boolean;
    /** Control-store id, used when `value` is not controlled. */
    controlId?: string;
    className?: string;
    style?: React.CSSProperties;
}
export default function SegmentBar({ label, showLabel, ariaLabel, options, value, defaultValue, onChange, colorA, colorB, borderStyle, borderMask, width, fontSize, disabled, controlId, className, style, }: SegmentBarProps): import("react/jsx-runtime").JSX.Element;
