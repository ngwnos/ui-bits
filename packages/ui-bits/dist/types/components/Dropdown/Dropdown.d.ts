import React from "react";
import { type DropdownOption } from "./types";
export interface DropdownProps {
    label: string;
    labelInline?: boolean;
    overlayMenu?: boolean;
    options: DropdownOption[];
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    onChange?: (value: string, option: DropdownOption) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: "a" | "b" | "none";
    borderMask?: Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
    borderRadius?: number;
    width?: number | string;
    fontSize?: number;
    compact?: boolean;
    disabled?: boolean;
    controlId?: string;
    className?: string;
    style?: React.CSSProperties;
}
export default function Dropdown({ label, labelInline, overlayMenu, options, value, defaultValue, placeholder, onChange, open, defaultOpen, onOpenChange, colorA, colorB, borderStyle, borderMask, borderRadius, width, fontSize, compact, disabled, controlId, className, style, }: DropdownProps): import("react/jsx-runtime").JSX.Element;
