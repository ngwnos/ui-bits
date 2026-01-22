import React from "react";
import "./text-input.css";
export type TextInputBorderStyle = "a" | "b" | "none";
export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "color"> {
    colorA?: string;
    colorB?: string;
    borderStyle?: TextInputBorderStyle;
    fontSize?: number;
    padding?: number | string;
}
declare const TextInput: React.ForwardRefExoticComponent<TextInputProps & React.RefAttributes<HTMLInputElement>>;
export default TextInput;
