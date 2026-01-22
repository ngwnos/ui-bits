import React from "react";
import { type FolderBorderStyle } from "../Folder/Folder";
import "./selectionGrid.css";
export type SelectionGridAlignment = "left" | "center" | "right";
export type SelectionGridPreview = {
    type: "color";
    color: string;
} | {
    type: "image";
    src: string;
};
export type SelectionGridBaseProps = {
    layoutGap?: string;
    maxHeightUnits?: number;
    fontSize?: number;
    maxWidth?: number | string;
    className?: string;
    style?: React.CSSProperties;
};
export type SelectionGridFolder<Item> = {
    id: string;
    label: React.ReactNode;
    items: Item[];
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    onCollapseChange?: (collapsed: boolean) => void;
    colorA?: string;
    colorB?: string;
    borderStyle?: FolderBorderStyle;
    addTile?: {
        label?: string;
        accept?: string;
        multiple?: boolean;
        onAdd?: (files: FileList) => void;
        createItem?: (file: File, url: string) => Item;
        onAddItems?: (items: Item[], files: File[]) => void;
        autoAppend?: boolean;
        revokeObjectUrls?: boolean;
    };
};
export type SelectionGridSelectionSlot<Item> = {
    id: string;
    color: string;
    selectedKey?: string | null;
    defaultSelectedKey?: string | null;
    onSelect?: (key: string | null, item: Item | null, index: number | null) => void;
};
export type SelectionGridGridProps<Item> = SelectionGridBaseProps & {
    items?: Item[];
    folders?: SelectionGridFolder<Item>[];
    selectionSlots?: SelectionGridSelectionSlot<Item>[];
    getKey: (item: Item, index: number) => string;
    getPreview: (item: Item, index: number) => SelectionGridPreview;
    getLabel?: (item: Item, index: number) => string;
    selectedKey?: string | null;
    defaultSelectedKey?: string | null;
    onSelect?: (key: string | null, item: Item | null, index: number | null) => void;
    allowEmptySelection?: boolean;
    squareScale?: number;
    squareAlignment?: SelectionGridAlignment;
    colorA?: string;
    colorB?: string;
};
export type SelectionGridProps<Item = unknown> = SelectionGridGridProps<Item>;
export default function SelectionGrid<Item>(props: SelectionGridGridProps<Item>): import("react/jsx-runtime").JSX.Element;
