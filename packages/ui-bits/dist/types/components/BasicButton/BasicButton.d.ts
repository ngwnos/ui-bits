import React from "react";
export type BasicButtonBorderStyle = "a" | "b" | "none";
export interface BasicButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
    colorA?: string;
    colorB?: string;
    borderStyle?: BasicButtonBorderStyle;
    fontSize?: number;
    padding?: number | string;
}
declare const BasicButton: React.ForwardRefExoticComponent<BasicButtonProps & React.RefAttributes<HTMLButtonElement>>;
export default BasicButton;
