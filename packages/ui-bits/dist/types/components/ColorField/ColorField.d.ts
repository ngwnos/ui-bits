import React from "react";
import "./color-field.css";
export type ColorFieldBorderStyle = "a" | "b" | "none";
export interface ColorFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
    label?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    alpha?: number;
    defaultAlpha?: number;
    onAlphaChange?: (alpha: number) => void;
    alphaControlId?: string;
    colorA?: string;
    colorB?: string;
    borderStyle?: ColorFieldBorderStyle;
    fontSize?: number;
    pickerHeightUnits?: number;
    width?: number | string;
    ariaLabel?: string;
    controlId?: string;
}
declare const ColorField: React.ForwardRefExoticComponent<ColorFieldProps & React.RefAttributes<HTMLDivElement>>;
export default ColorField;
