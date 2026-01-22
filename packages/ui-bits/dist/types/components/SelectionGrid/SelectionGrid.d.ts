import React from "react";
import "./selectionGrid.css";
export type SelectionGridAlignment = "left" | "center" | "right";
export type SelectionGridItemRenderState = {
    index: number;
    selected: boolean;
    size: number;
};
export type SelectionGridBaseProps = {
    layoutGap?: string;
    maxHeightUnits?: number;
    fontSize?: number;
    maxWidth?: number | string;
    className?: string;
    style?: React.CSSProperties;
};
export type SelectionGridGridProps<Item> = SelectionGridBaseProps & {
    items: Item[];
    getKey: (item: Item, index: number) => string;
    renderItem: (item: Item, state: SelectionGridItemRenderState) => React.ReactNode;
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
