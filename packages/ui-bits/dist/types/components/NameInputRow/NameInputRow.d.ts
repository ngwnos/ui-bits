import React from "react";
import "./name-input-row.css";
export type NameInputRowBorderStyle = "a" | "b" | "none";
export type NameInputRowRandomizeMode = "replace" | "append";
export interface NameInputRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onCreate?: (name: string) => void | Promise<void>;
    onRandomize?: () => string | Promise<string>;
    placeholder?: string;
    createLabel?: string;
    randomizeLabel?: string;
    inputAriaLabel?: string;
    clearOnCreate?: boolean;
    randomizeMode?: NameInputRowRandomizeMode;
    appendSeparator?: string;
    normalize?: (value: string) => string;
    colorA?: string;
    colorB?: string;
    borderStyle?: NameInputRowBorderStyle;
    fontSize?: number;
    disabled?: boolean;
}
declare const NameInputRow: React.ForwardRefExoticComponent<NameInputRowProps & React.RefAttributes<HTMLDivElement>>;
export default NameInputRow;
