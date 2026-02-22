import React from "react";
export type ColorFieldPickerMode = "hsv" | "rgb" | "oklch";
export type ColorFieldPickerBorderStyle = "a" | "b" | "none";
export interface ColorFieldPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    mode?: ColorFieldPickerMode;
    defaultMode?: ColorFieldPickerMode;
    onModeChange?: (mode: ColorFieldPickerMode) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: ColorFieldPickerBorderStyle;
    fontSize?: number;
    heightUnits?: number;
    width?: number | string;
}
declare const ColorFieldPicker: React.ForwardRefExoticComponent<ColorFieldPickerProps & React.RefAttributes<HTMLDivElement>>;
export default ColorFieldPicker;
