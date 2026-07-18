import { type SelectionGridAlignment, type SelectionGridId, type SelectionGridPreviewMode, type SelectionGridState } from "./state";
export declare function useSelectionGridIds(): SelectionGridId[];
export declare function useSelectionGridState(id: SelectionGridId): SelectionGridState;
export declare function useSelectionGridActions(): {
    registerSelectionGrid: (id: SelectionGridId, initialState?: Partial<SelectionGridState>) => void;
    setSelectionGridSelectedIndex: (id: SelectionGridId, selectedIndex: number | null) => void;
    setSelectionGridSquareScale: (id: SelectionGridId, squareScale: number) => void;
    setSelectionGridAlignment: (id: SelectionGridId, squareAlignment: SelectionGridAlignment) => void;
    setSelectionGridAllowEmpty: (id: SelectionGridId, allowEmptySelection: boolean) => void;
    setSelectionGridInvert: (id: SelectionGridId, invertGradients: boolean) => void;
    toggleSelectionGridInvert: (id: SelectionGridId) => void;
    setSelectionGridPreviewMode: (id: SelectionGridId, previewMode: SelectionGridPreviewMode) => void;
    setSelectionGridPalette: (id: SelectionGridId, palette: string[]) => void;
    setSelectionGridSunAltitude: (id: SelectionGridId, sunAltitudeDeg: number) => void;
    setSelectionGridSunAzimuth: (id: SelectionGridId, sunAzimuthDeg: number) => void;
};
