import React from "react";
export type IconButtonBorderStyle = "a" | "b" | "none";
export type IconButtonBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export type IconButtonBehavior = "momentary" | "toggle" | "cycle";
export interface IconButtonCycleOption {
    value: string;
    icon?: React.ReactElement;
    colorA?: string;
    colorB?: string;
    borderStyle?: IconButtonBorderStyle;
    ariaLabel?: string;
    title?: string;
}
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onChange" | "onToggle"> {
    fontSize?: number;
    colorA?: string;
    colorB?: string;
    borderStyle?: IconButtonBorderStyle;
    borderMask?: IconButtonBorderMask;
    behavior?: IconButtonBehavior;
    toggled?: boolean;
    defaultToggled?: boolean;
    onToggle?: (next: boolean) => void;
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressChange?: (pressed: boolean) => void;
    options?: IconButtonCycleOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string, option: IconButtonCycleOption, index: number) => void;
    controlId?: string;
}
declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
export default IconButton;
