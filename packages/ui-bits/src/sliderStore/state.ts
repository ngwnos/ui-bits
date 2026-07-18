import { DEFAULT_SELECTION_GRID_ID } from "../selectionGridIds";
import { MATPLOTLIB_GRADIENTS, buildPalette } from "../gradients/matplotlib";

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

export type SliderStoreAction =
  | { type: "registerSelectionGrid"; id: SelectionGridId; initialState?: Partial<SelectionGridState> }
  | { type: "updateSelectionGrid"; id: SelectionGridId; patch: Partial<SelectionGridState> }
  | { type: "toggleSelectionGridInvert"; id: SelectionGridId }
  | { type: "setSelectionGridPalette"; id: SelectionGridId; palette: string[] }
  | { type: "setSelectionGridPreviewMode"; id: SelectionGridId; previewMode: SelectionGridPreviewMode };

const DEFAULT_SELECTION_PALETTE = buildPalette(MATPLOTLIB_GRADIENTS[0].stops, false).css;

export const SELECTION_GRID_BASE_STATE: SelectionGridState = {
  selectedIndex: 0,
  squareScale: 1,
  squareAlignment: "left",
  invertGradients: false,
  allowEmptySelection: false,
  colorPalette: [...DEFAULT_SELECTION_PALETTE],
  previewMode: "terrainHeight",
  sunAltitudeDeg: 45,
  sunAzimuthDeg: 315,
};

function selectionGridStatesEqual(a: SelectionGridState, b: SelectionGridState): boolean {
  return (
    a.selectedIndex === b.selectedIndex
    && a.squareScale === b.squareScale
    && a.squareAlignment === b.squareAlignment
    && a.invertGradients === b.invertGradients
    && a.allowEmptySelection === b.allowEmptySelection
    && a.colorPalette.length === b.colorPalette.length
    && a.colorPalette.every((color, index) => color === b.colorPalette[index])
    && a.previewMode === b.previewMode
    && a.sunAltitudeDeg === b.sunAltitudeDeg
    && a.sunAzimuthDeg === b.sunAzimuthDeg
  );
}

export function normalizeSelectionGridState(base: SelectionGridState): SelectionGridState {
  const clampScale = (value: number): number => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(4, Math.max(1, Math.round(value)));
  };

  const normalizeSunAltitude = (value: number | undefined): number => {
    if (!Number.isFinite(value ?? Number.NaN)) return SELECTION_GRID_BASE_STATE.sunAltitudeDeg;
    return Math.min(90, Math.max(0, Number(value)));
  };
  const normalizeSunAzimuth = (value: number | undefined): number => {
    if (!Number.isFinite(value ?? Number.NaN)) return SELECTION_GRID_BASE_STATE.sunAzimuthDeg;
    const raw = Number(value);
    const wrapped = ((raw % 360) + 360) % 360;
    return wrapped;
  };
  const normalizeAlignment = (value: SelectionGridAlignment): SelectionGridAlignment => {
    if (value === "center" || value === "right") return value;
    return "left";
  };
  const normalizePreviewMode = (value: SelectionGridPreviewMode | boolean | undefined | "terrainHillshade"): SelectionGridPreviewMode => {
    if (value === "gradient" || value === "terrainHeight") {
      return value;
    }
    if (value === "terrainHillshade") {
      return "terrainHeight";
    }
    if (typeof value === "boolean") {
      return value ? "terrainHeight" : "gradient";
    }
    return "terrainHeight";
  };
  const rawPreviewMode = (base as SelectionGridState & { previewMode?: SelectionGridPreviewMode }).previewMode;
  const legacyUseTerrain = (base as { useTerrainTiles?: boolean }).useTerrainTiles;
  const normalized: SelectionGridState = {
    selectedIndex: base.selectedIndex,
    squareScale: clampScale(base.squareScale),
    squareAlignment: normalizeAlignment(base.squareAlignment),
    invertGradients: Boolean(base.invertGradients),
    allowEmptySelection: Boolean(base.allowEmptySelection),
    colorPalette: Array.isArray(base.colorPalette) && base.colorPalette.length === 256
      ? [...base.colorPalette]
      : [...DEFAULT_SELECTION_PALETTE],
    previewMode: normalizePreviewMode(rawPreviewMode ?? legacyUseTerrain),
    sunAltitudeDeg: normalizeSunAltitude((base as { sunAltitudeDeg?: number }).sunAltitudeDeg),
    sunAzimuthDeg: normalizeSunAzimuth((base as { sunAzimuthDeg?: number }).sunAzimuthDeg),
  };
  if (!normalized.allowEmptySelection && normalized.selectedIndex == null) {
    normalized.selectedIndex = 0;
  }
  return normalized;
}

export function buildInitialState(): SliderStoreState {
  const selectionGrids: Record<SelectionGridId, SelectionGridState> = {};
  const selectionGridIds: SelectionGridId[] = [];

  selectionGrids[DEFAULT_SELECTION_GRID_ID] = normalizeSelectionGridState({
    ...SELECTION_GRID_BASE_STATE,
  });
  selectionGridIds.push(DEFAULT_SELECTION_GRID_ID);

  return {
    selectionGrids,
    selectionGridIds,
  };
}

export function sliderStoreReducer(state: SliderStoreState, action: SliderStoreAction): SliderStoreState {
  switch (action.type) {
    case "registerSelectionGrid": {
      const current = state.selectionGrids[action.id];
      if (current) {
        const next = normalizeSelectionGridState({ ...current, ...(action.initialState ?? {}) });
        if (selectionGridStatesEqual(next, current)) return state;
        return {
          ...state,
          selectionGrids: {
            ...state.selectionGrids,
            [action.id]: next,
          },
        };
      }
      const next = normalizeSelectionGridState({ ...SELECTION_GRID_BASE_STATE, ...(action.initialState ?? {}) });
      return {
        ...state,
        selectionGridIds: state.selectionGridIds.includes(action.id)
          ? state.selectionGridIds
          : [...state.selectionGridIds, action.id],
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "updateSelectionGrid": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      const next = normalizeSelectionGridState({ ...current, ...action.patch });
      if (selectionGridStatesEqual(next, current)) {
        return state;
      }
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "toggleSelectionGridInvert": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      const next = { ...current, invertGradients: !current.invertGradients };
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "setSelectionGridPalette": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      if (current.colorPalette.length === action.palette.length
        && current.colorPalette.every((color, index) => color === action.palette[index])) {
        return state;
      }
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: {
            ...current,
            colorPalette: [...action.palette],
          },
        },
      };
    }
    case "setSelectionGridPreviewMode": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      if (current.previewMode === action.previewMode) {
        return state;
      }
      const next = normalizeSelectionGridState({ ...current, previewMode: action.previewMode });
      if (selectionGridStatesEqual(next, current)) {
        return state;
      }
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    default:
      return state;
  }
}
