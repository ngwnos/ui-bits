import React from "react";
import { type SelectionGridId } from "../../sliderStore";
import "./selectionGrid.css";
export type TerrainTileAsset = {
    name: string;
    url: string;
};
type SelectionGridBaseProps = {
    layoutGap?: string;
    maxHeightUnits?: number;
    fontSize?: number;
    maxWidth?: number | string;
    className?: string;
    style?: React.CSSProperties;
};
export type SelectionGridGradientProps = SelectionGridBaseProps & {
    gridId?: SelectionGridId;
    previewDarkMode: boolean;
    terrainAssets?: TerrainTileAsset[] | (() => Promise<TerrainTileAsset[]>);
    colorA?: string;
    colorB?: string;
    allowEmptySelection?: boolean;
};
export default function GradientSelectionGrid(props: SelectionGridGradientProps): import("react/jsx-runtime").JSX.Element;
export {};
