import React from "react";
import "./key-value-accordion.css";
export type KeyValueAccordionBorderStyle = "a" | "b" | "none";
export type KeyValueAccordionMode = "single" | "multiple";
export interface KeyValueAccordionItem {
    key: string;
    label: React.ReactNode;
    value: React.ReactNode;
    children?: React.ReactNode;
    disabled?: boolean;
    defaultExpanded?: boolean;
}
export interface KeyValueAccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    items: KeyValueAccordionItem[];
    emptyLabel?: React.ReactNode;
    mode?: KeyValueAccordionMode;
    expandedKeys?: string[];
    defaultExpandedKeys?: string[];
    onExpandedKeysChange?: (expandedKeys: string[]) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: KeyValueAccordionBorderStyle;
    borderRadius?: number;
    fontSize?: number;
    rowHeight?: number;
    padding?: number | string;
    verticalGap?: number;
    inheritPanelSurface?: boolean;
    transparent?: boolean;
    keepMounted?: boolean;
    suspended?: boolean;
}
declare const KeyValueAccordion: React.ForwardRefExoticComponent<KeyValueAccordionProps & React.RefAttributes<HTMLDivElement>>;
export default KeyValueAccordion;
