import type { Waveform } from "../lfo";
import { type FlexokiHue } from "../flexoki";
import type { SliderBorder } from "../components/LFOSlider";
export type SliderId = string;
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
export interface SliderDefinition {
    id: SliderId;
    label: string;
    hue: FlexokiHue;
    min: number;
    max: number;
    step: number;
    width: number;
    drawerHandle: boolean;
}
export interface SliderRuntimeState {
    value: number;
    colorA: string;
    colorB: string;
    border: SliderBorder;
    drawerFeatureEnabled: boolean;
    drawerLines: [number, number];
    drawerOpen: boolean;
    lfoEnabled: boolean;
    waveform: Waveform;
    frequency: number;
    phase: number;
    audioResponse: number;
    audioSamplePosition: number;
}
export interface SliderColumn {
    id: string;
    sliderIds: SliderId[];
}
export interface SliderStoreState {
    definitions: Record<SliderId, SliderDefinition>;
    sliders: Record<SliderId, SliderRuntimeState>;
    columns: SliderColumn[];
    customSliderId: SliderId;
    selectionGrids: Record<SelectionGridId, SelectionGridState>;
    selectionGridIds: SelectionGridId[];
    audioBins: number[];
    audioBinCount: number;
    audioMaxMagnitude: number;
}
export type SliderStoreAction = {
    type: "setValue";
    id: SliderId;
    value: number;
} | {
    type: "setColors";
    id: SliderId;
    colorA: string;
    colorB: string;
} | {
    type: "setBorder";
    id: SliderId;
    border: SliderBorder;
} | {
    type: "setDrawerLines";
    id: SliderId;
    lines: [number, number];
} | {
    type: "setDrawerFeatureEnabled";
    id: SliderId;
    enabled: boolean;
} | {
    type: "setDrawerOpen";
    id: SliderId;
    open: boolean;
} | {
    type: "setLfoEnabled";
    id: SliderId;
    enabled: boolean;
} | {
    type: "setWaveform";
    id: SliderId;
    waveform: Waveform;
} | {
    type: "setFrequency";
    id: SliderId;
    frequency: number;
} | {
    type: "setPhase";
    id: SliderId;
    phase: number;
} | {
    type: "setDrawerOpenBatch";
    ids: SliderId[];
    open: boolean;
} | {
    type: "setDrawerFeatureEnabledBatch";
    ids: SliderId[];
    enabled: boolean;
} | {
    type: "setLfoEnabledBatch";
    ids: SliderId[];
    enabled: boolean;
} | {
    type: "swapColorsAll";
} | {
    type: "swapColorsColumn";
    ids: SliderId[];
} | {
    type: "setBorderColumn";
    ids: SliderId[];
    border: SliderBorder;
} | {
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
} | {
    type: "setAudioBins";
    bins: number[];
} | {
    type: "setAudioBinCount";
    count: number;
} | {
    type: "setAudioMaxMagnitude";
    magnitude: number;
} | {
    type: "setAudioResponse";
    id: SliderId;
    audioResponse: number;
} | {
    type: "setAudioSamplePosition";
    id: SliderId;
    audioSamplePosition: number;
};
export declare const SELECTION_GRID_BASE_STATE: SelectionGridState;
export declare function normalizeSelectionGridState(base: SelectionGridState): SelectionGridState;
export declare function buildInitialState(): SliderStoreState;
export declare function sliderStoreReducer(state: SliderStoreState, action: SliderStoreAction): SliderStoreState;
