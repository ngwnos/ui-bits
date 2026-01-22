import React from "react";
export interface AudioAnalysisState {
    bins: readonly number[];
    binCount: number;
    maxMagnitude: number;
}
export interface AudioAnalysisActions {
    setAudioBins: (bins: readonly number[]) => void;
    setAudioBinCount: (count: number) => void;
    setAudioMaxMagnitude: (magnitude: number) => void;
}
export interface AudioAnalysisStore extends AudioAnalysisActions {
    getSnapshot: () => AudioAnalysisState;
    subscribe: (listener: () => void) => () => void;
}
export declare function createAudioAnalysisStore(initial: AudioAnalysisState): AudioAnalysisStore;
export interface AudioAnalysisProviderProps {
    children: React.ReactNode;
    initialBins?: readonly number[];
    initialBinCount?: number;
    initialMaxMagnitude?: number;
}
export declare function AudioAnalysisProvider({ children, initialBins, initialBinCount, initialMaxMagnitude, }: AudioAnalysisProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAudioAnalysisStore(): AudioAnalysisStore | null;
export declare function useAudioAnalysisState(): AudioAnalysisState | null;
export declare function useAudioAnalysisActions(): AudioAnalysisActions;
