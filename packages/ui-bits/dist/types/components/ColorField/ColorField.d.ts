import React from "react";
import "./color-field.css";
export type ColorFieldBorderStyle = "a" | "b" | "none";
export type ColorFieldPickerDisplay = "inline" | "popup";
/**
 * Color input with hex and alpha sliders plus an optional 2D picker.
 *
 * State modes:
 * - Controlled: provide `value`/`alpha` and corresponding callbacks.
 * - Store-bound: provide `controlId`/`alphaControlId` without controlled values.
 * - Uncontrolled: provide `defaultValue`/`defaultAlpha`.
 */
export interface ColorFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange"> {
    /** Visible label above the hex slider. */
    label?: string;
    /** Controlled hex value (`#rgb` or `#rrggbb`). */
    value?: string;
    /** Initial value for uncontrolled usage. */
    defaultValue?: string;
    /** Called when color changes. */
    onChange?: (value: string) => void;
    /** Controlled alpha channel (`0..255`). */
    alpha?: number;
    /** Initial alpha for uncontrolled usage. */
    defaultAlpha?: number;
    /** Called when alpha changes. */
    onAlphaChange?: (alpha: number) => void;
    /** Control-store id for alpha, used only when `alpha` is not controlled. */
    alphaControlId?: string;
    colorA?: string;
    colorB?: string;
    borderStyle?: ColorFieldBorderStyle;
    /** `inline` keeps picker always visible; `popup` toggles from swatch click. */
    pickerDisplay?: ColorFieldPickerDisplay;
    fontSize?: number;
    pickerHeightUnits?: number;
    width?: number | string;
    ariaLabel?: string;
    /** Control-store id for color, used only when `value` is not controlled. */
    controlId?: string;
}
declare const ColorField: React.ForwardRefExoticComponent<ColorFieldProps & React.RefAttributes<HTMLDivElement>>;
export default ColorField;
