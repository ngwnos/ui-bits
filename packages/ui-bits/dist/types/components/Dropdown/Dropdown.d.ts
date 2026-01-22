import React from "react";
import { type DropdownOption } from "./types";
export interface DropdownProps {
    label: string;
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
    disabled?: boolean;
    controlId?: string;
    className?: string;
    style?: React.CSSProperties;
}
export default function Dropdown({ label, options, value, defaultValue, placeholder, onChange, open, defaultOpen, onOpenChange, colorA, colorB, borderStyle, borderMask, borderRadius, width, fontSize, disabled, controlId, className, style, }: DropdownProps): import("react/jsx-runtime").JSX.Element;
