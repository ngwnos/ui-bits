export type SelectionGridId = string;
export type SelectionGridAlignment = "left" | "center" | "right";
export type SelectionGridPreviewMode = "gradient" | "terrainHeight";
export interface SelectionGridState {
    selectedIndex: number | null;
    squareScale: number;
    squareAlignment: SelectionGridAlignment;
    invertGradients: boolean;
    allowEmptySelection: boolean;
    colorPalette: string[];
    previewMode: SelectionGridPreviewMode;
    sunAltitudeDeg: number;
    sunAzimuthDeg: number;
}
export interface SliderStoreState {
    selectionGrids: Record<SelectionGridId, SelectionGridState>;
    selectionGridIds: SelectionGridId[];
}
export type SliderStoreAction = {
    type: "registerSelectionGrid";
    id: SelectionGridId;
    initialState?: Partial<SelectionGridState>;
} | {
    type: "updateSelectionGrid";
    id: SelectionGridId;
    patch: Partial<SelectionGridState>;
} | {
    type: "toggleSelectionGridInvert";
    id: SelectionGridId;
} | {
    type: "setSelectionGridPalette";
    id: SelectionGridId;
    palette: string[];
} | {
    type: "setSelectionGridPreviewMode";
    id: SelectionGridId;
    previewMode: SelectionGridPreviewMode;
};
export declare const SELECTION_GRID_BASE_STATE: SelectionGridState;
export declare function normalizeSelectionGridState(base: SelectionGridState): SelectionGridState;
export declare function buildInitialState(): SliderStoreState;
export declare function sliderStoreReducer(state: SliderStoreState, action: SliderStoreAction): SliderStoreState;
