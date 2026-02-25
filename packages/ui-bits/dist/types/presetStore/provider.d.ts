import React from "react";
import { type ControlStore } from "../controlStore/store";
import type { PresetStorePreset, PresetSnapshotOptions, ApplyPresetOptions } from "./types";
export interface PresetStoreProviderProps {
    children: React.ReactNode;
    /** Controlled preset list. When provided, update via `onPresetsChange`. */
    presets?: PresetStorePreset[];
    /** Initial presets for uncontrolled mode. */
    defaultPresets?: PresetStorePreset[];
    /** Change callback for controlled mode and persistence hooks. */
    onPresetsChange?: (presets: PresetStorePreset[]) => void;
    /** Optional external control store. Falls back to nearest provider/internal store. */
    controlStore?: ControlStore;
    /** Enables automatic `controlId` generation in descendants. */
    autoIds?: boolean;
    /** Prefix applied to auto-generated descendant ids. */
    controlIdPrefix?: string;
    /** Local storage key for persisting user presets (uncontrolled mode only). */
    storageKey?: string;
    /** Storage backend override (`window.localStorage` by default in browser). */
    storage?: Storage;
    /** Snapshot include/exclude/filter controls for save/capture. */
    snapshotOptions?: PresetSnapshotOptions;
    /** Apply behavior for `selectPreset` calls. */
    applyOptions?: ApplyPresetOptions;
    /** Adds a readonly defaults preset captured after initial render. */
    includeDefaultsPreset?: boolean;
    /** Name used for the auto-captured defaults preset. */
    defaultsPresetName?: string;
}
export declare function PresetStoreProvider({ children, presets, defaultPresets, onPresetsChange, controlStore, autoIds, controlIdPrefix, storageKey, storage, snapshotOptions, applyOptions, includeDefaultsPreset, defaultsPresetName, }: PresetStoreProviderProps): import("react/jsx-runtime").JSX.Element;
