import type { ControlStore, ControlStoreState } from "../controlStore/store";
import type { ApplyPresetOptions, PresetSnapshot, PresetSnapshotOptions } from "./types";
export declare function createPresetSnapshot(state: ControlStoreState, options?: PresetSnapshotOptions): PresetSnapshot;
export declare function applyPresetSnapshot(store: ControlStore, snapshot: PresetSnapshot, options?: ApplyPresetOptions): void;
