import React from "react";
import { type ControlStore } from "../controlStore/store";
import type { PresetStorePreset, PresetSnapshotOptions, ApplyPresetOptions } from "./types";
export interface PresetStoreProviderProps {
    children: React.ReactNode;
    presets?: PresetStorePreset[];
    defaultPresets?: PresetStorePreset[];
    onPresetsChange?: (presets: PresetStorePreset[]) => void;
    controlStore?: ControlStore;
    autoIds?: boolean;
    controlIdPrefix?: string;
    storageKey?: string;
    storage?: Storage;
    snapshotOptions?: PresetSnapshotOptions;
    applyOptions?: ApplyPresetOptions;
    includeDefaultsPreset?: boolean;
    defaultsPresetName?: string;
}
export declare function PresetStoreProvider({ children, presets, defaultPresets, onPresetsChange, controlStore, autoIds, controlIdPrefix, storageKey, storage, snapshotOptions, applyOptions, includeDefaultsPreset, defaultsPresetName, }: PresetStoreProviderProps): import("react/jsx-runtime").JSX.Element;
