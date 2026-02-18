import React from "react";
import "./key-value-rows.css";
export type KeyValueRowsBorderStyle = "a" | "b" | "none";
export interface KeyValueRowsRow {
    key?: string;
    label: React.ReactNode;
    value: React.ReactNode;
}
export interface KeyValueRowsProps extends React.HTMLAttributes<HTMLDivElement> {
    rows: KeyValueRowsRow[];
    emptyLabel?: React.ReactNode;
    colorA?: string;
    colorB?: string;
    borderStyle?: KeyValueRowsBorderStyle;
    borderRadius?: number;
    fontSize?: number;
    rowHeight?: number;
}
declare const KeyValueRows: React.ForwardRefExoticComponent<KeyValueRowsProps & React.RefAttributes<HTMLDivElement>>;
export default KeyValueRows;
