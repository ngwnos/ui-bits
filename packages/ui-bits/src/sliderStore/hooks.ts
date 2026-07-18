import { useEffect, useMemo } from "react";
import { useSliderStore } from "./context";
import {
  SELECTION_GRID_BASE_STATE,
  type SelectionGridAlignment,
  type SelectionGridId,
  type SelectionGridPreviewMode,
  type SelectionGridState,
} from "./state";

const FALLBACK_SELECTION_GRID: SelectionGridState = {
  ...SELECTION_GRID_BASE_STATE,
  colorPalette: [...SELECTION_GRID_BASE_STATE.colorPalette],
};

export function useSelectionGridIds(): SelectionGridId[] {
  const { state } = useSliderStore();
  return state.selectionGridIds;
}

export function useSelectionGridState(id: SelectionGridId): SelectionGridState {
  const { state, dispatch } = useSliderStore();
  const grid = state.selectionGrids[id];

  useEffect(() => {
    if (!grid) {
      dispatch({ type: "registerSelectionGrid", id });
    }
  }, [grid, id, dispatch]);

  if (!grid) {
    return FALLBACK_SELECTION_GRID;
  }
  return grid;
}

export function useSelectionGridActions() {
  const { dispatch } = useSliderStore();
  return useMemo(() => ({
    registerSelectionGrid: (id: SelectionGridId, initialState?: Partial<SelectionGridState>) => dispatch({ type: "registerSelectionGrid", id, initialState }),
    setSelectionGridSelectedIndex: (id: SelectionGridId, selectedIndex: number | null) => dispatch({ type: "updateSelectionGrid", id, patch: { selectedIndex } }),
    setSelectionGridSquareScale: (id: SelectionGridId, squareScale: number) => dispatch({ type: "updateSelectionGrid", id, patch: { squareScale } }),
    setSelectionGridAlignment: (id: SelectionGridId, squareAlignment: SelectionGridAlignment) => dispatch({ type: "updateSelectionGrid", id, patch: { squareAlignment } }),
    setSelectionGridAllowEmpty: (id: SelectionGridId, allowEmptySelection: boolean) => dispatch({ type: "updateSelectionGrid", id, patch: { allowEmptySelection } }),
    setSelectionGridInvert: (id: SelectionGridId, invertGradients: boolean) => dispatch({ type: "updateSelectionGrid", id, patch: { invertGradients } }),
    toggleSelectionGridInvert: (id: SelectionGridId) => dispatch({ type: "toggleSelectionGridInvert", id }),
    setSelectionGridPreviewMode: (id: SelectionGridId, previewMode: SelectionGridPreviewMode) => dispatch({ type: "setSelectionGridPreviewMode", id, previewMode }),
    setSelectionGridPalette: (id: SelectionGridId, palette: string[]) => dispatch({ type: "setSelectionGridPalette", id, palette }),
    setSelectionGridSunAltitude: (id: SelectionGridId, sunAltitudeDeg: number) => dispatch({ type: "updateSelectionGrid", id, patch: { sunAltitudeDeg } }),
    setSelectionGridSunAzimuth: (id: SelectionGridId, sunAzimuthDeg: number) => dispatch({ type: "updateSelectionGrid", id, patch: { sunAzimuthDeg } }),
  }), [dispatch]);
}
