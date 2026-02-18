import React from "react";
import "./radiolist.css";
export interface RadioListOption {
    value: string;
    label: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
}
export type RadioListBorderStyle = "a" | "b" | "none";
export interface RadioListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    label?: string;
    showLabel?: boolean;
    ariaLabel?: string;
    options: RadioListOption[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string, option: RadioListOption, index: number) => void;
    emptyLabel?: string;
    columns?: number;
    maxListHeight?: number | string;
    colorA?: string;
    colorB?: string;
    borderStyle?: RadioListBorderStyle;
    fontSize?: number;
    width?: number | string;
    disabled?: boolean;
    controlId?: string;
}
declare const RadioList: React.ForwardRefExoticComponent<RadioListProps & React.RefAttributes<HTMLDivElement>>;
export default RadioList;
