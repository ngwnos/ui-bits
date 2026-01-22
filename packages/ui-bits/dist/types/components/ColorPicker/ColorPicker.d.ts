import React from "react";
export type ColorPickerBorderStyle = "a" | "b" | "none";
export type ColorPickerBorderMask = Partial<Record<"top" | "right" | "bottom" | "left", boolean>>;
export interface ColorPickerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onChange"> {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: ColorPickerBorderStyle;
    borderMask?: ColorPickerBorderMask;
    fontSize?: number;
    controlId?: string;
}
declare const ColorPicker: React.ForwardRefExoticComponent<ColorPickerProps & React.RefAttributes<HTMLButtonElement>>;
export default ColorPicker;
