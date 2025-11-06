import { useEffect, useMemo } from "react";
import type { Waveform } from "../lfo";
import type { SliderBorder } from "../components/LFOSlider";
import { useSliderStore } from "./context";
import {
  SELECTION_GRID_BASE_STATE,
  type SelectionGridAlignment,
  type SelectionGridId,
  type SelectionGridPreviewMode,
  type SelectionGridState,
  type SliderDefinition,
  type SliderId,
  type SliderRuntimeState,
  type SliderStoreState,
} from "./state";

const FALLBACK_SELECTION_GRID: SelectionGridState = {
  ...SELECTION_GRID_BASE_STATE,
  colorPalette: [...SELECTION_GRID_BASE_STATE.colorPalette],
};

export function useSliderDefinition(id: SliderId): SliderDefinition {
  const { state } = useSliderStore();
  const definition = state.definitions[id];
  if (!definition) throw new Error(`Slider definition not found for id "${id}"`);
  return definition;
}

export function useSliderState(id: SliderId): SliderRuntimeState {
  const { state } = useSliderStore();
  const sliderState = state.sliders[id];
  if (!sliderState) throw new Error(`Slider state not found for id "${id}"`);
  return sliderState;
}

export function useSliderLayout(): { columns: Array<{ id: string; sliderIds: SliderId[] }>; customSliderId: SliderId } {
  const { state } = useSliderStore();
  return { columns: state.columns, customSliderId: state.customSliderId };
}

export function useSliderStoreState(): SliderStoreState {
  const { state } = useSliderStore();
  return state;
}

export function useSelectionGridIds(): SelectionGridId[] {
  const { state } = useSliderStore();
  return state.selectionGridIds;
}

export function useSliderColumn(columnId: string): { id: string; sliderIds: SliderId[] } {
  const { state } = useSliderStore();
  const column = state.columns.find((c) => c.id === columnId);
  if (!column) throw new Error(`Slider column not found for id "${columnId}"`);
  return column;
}

export function useSliderActions() {
  const { dispatch } = useSliderStore();
  return useMemo(() => ({
    setSliderValue: (id: SliderId, value: number) => dispatch({ type: "setValue", id, value }),
    setSliderColors: (id: SliderId, left: string, right: string) => dispatch({ type: "setColors", id, left, right }),
    setSliderBorder: (id: SliderId, border: SliderBorder) => dispatch({ type: "setBorder", id, border }),
    setSliderDrawerLines: (id: SliderId, lines: [number, number]) => dispatch({ type: "setDrawerLines", id, lines }),
    setSliderDrawerFeatureEnabled: (id: SliderId, enabled: boolean) => dispatch({ type: "setDrawerFeatureEnabled", id, enabled }),
    setSliderDrawerOpen: (id: SliderId, open: boolean) => dispatch({ type: "setDrawerOpen", id, open }),
    setSliderLfoEnabled: (id: SliderId, enabled: boolean) => dispatch({ type: "setLfoEnabled", id, enabled }),
    setSliderWaveform: (id: SliderId, waveform: Waveform) => dispatch({ type: "setWaveform", id, waveform }),
    setSliderFrequency: (id: SliderId, frequency: number) => dispatch({ type: "setFrequency", id, frequency }),
    setSliderPhase: (id: SliderId, phase: number) => dispatch({ type: "setPhase", id, phase }),
    setColumnDrawerOpen: (ids: SliderId[], open: boolean) => dispatch({ type: "setDrawerOpenBatch", ids, open }),
    setColumnDrawerFeatureEnabled: (ids: SliderId[], enabled: boolean) => dispatch({ type: "setDrawerFeatureEnabledBatch", ids, enabled }),
    setColumnLfoEnabled: (ids: SliderId[], enabled: boolean) => dispatch({ type: "setLfoEnabledBatch", ids, enabled }),
    swapAllSliderColors: () => dispatch({ type: "swapColorsAll" }),
    swapColumnSliderColors: (ids: SliderId[]) => dispatch({ type: "swapColorsColumn", ids }),
    setColumnBorder: (ids: SliderId[], border: SliderBorder) => dispatch({ type: "setBorderColumn", ids, border }),
  }), [dispatch]);
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
  }), [dispatch]);
}
