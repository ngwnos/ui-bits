import type { Waveform } from "../lfo";
import type { SliderBorder } from "../components/LFOSlider";
import { type SelectionGridAlignment, type SelectionGridId, type SelectionGridPreviewMode, type SelectionGridState, type SliderDefinition, type SliderId, type SliderRuntimeState, type SliderStoreState } from "./state";
export declare function useSliderDefinition(id: SliderId): SliderDefinition;
export declare function useSliderState(id: SliderId): SliderRuntimeState;
export declare function useSliderLayout(): {
    columns: Array<{
        id: string;
        sliderIds: SliderId[];
    }>;
    customSliderId: SliderId;
};
export declare function useSliderStoreState(): SliderStoreState;
export declare function useSelectionGridIds(): SelectionGridId[];
export declare function useSliderColumn(columnId: string): {
    id: string;
    sliderIds: SliderId[];
};
export declare function useSliderActions(): {
    setSliderValue: (id: SliderId, value: number) => void;
    setSliderColors: (id: SliderId, colorA: string, colorB: string) => void;
    setSliderBorder: (id: SliderId, border: SliderBorder) => void;
    setSliderDrawerLines: (id: SliderId, lines: [number, number]) => void;
    setSliderDrawerFeatureEnabled: (id: SliderId, enabled: boolean) => void;
    setSliderDrawerOpen: (id: SliderId, open: boolean) => void;
    setSliderLfoEnabled: (id: SliderId, enabled: boolean) => void;
    setSliderWaveform: (id: SliderId, waveform: Waveform) => void;
    setSliderFrequency: (id: SliderId, frequency: number) => void;
    setSliderPhase: (id: SliderId, phase: number) => void;
    setSliderAudioResponse: (id: SliderId, audioResponse: number) => void;
    setSliderAudioSamplePosition: (id: SliderId, audioSamplePosition: number) => void;
    setColumnDrawerOpen: (ids: SliderId[], open: boolean) => void;
    setColumnDrawerFeatureEnabled: (ids: SliderId[], enabled: boolean) => void;
    setColumnLfoEnabled: (ids: SliderId[], enabled: boolean) => void;
    swapAllSliderColors: () => void;
    swapColumnSliderColors: (ids: SliderId[]) => void;
    setColumnBorder: (ids: SliderId[], border: SliderBorder) => void;
    setAudioBins: (bins: number[]) => void;
    setAudioBinCount: (count: number) => void;
    setAudioMaxMagnitude: (magnitude: number) => void;
};
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
