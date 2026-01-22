import React from "react";
import { type DropdownOption } from "../Dropdown/types";
export interface IconDropdownOption extends DropdownOption {
    icon?: React.ReactElement;
}
export interface IconDropdownProps {
    label?: string;
    showLabel?: boolean;
    ariaLabel?: string;
    options: IconDropdownOption[];
    value?: string;
    defaultValue?: string;
    icon?: React.ReactElement;
    showMenuIcons?: boolean;
    iconUsesOptionColors?: boolean;
    preventFocusOnPointerDown?: boolean;
    onChange?: (value: string, option: IconDropdownOption) => void;
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
export default function IconDropdown({ label, showLabel, ariaLabel, options, value, defaultValue, icon, showMenuIcons, iconUsesOptionColors, preventFocusOnPointerDown, onChange, open, defaultOpen, onOpenChange, colorA, colorB, borderStyle, borderMask, borderRadius, width, fontSize, disabled, controlId, className, style, }: IconDropdownProps): import("react/jsx-runtime").JSX.Element;
