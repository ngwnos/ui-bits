import type { ControlStoreState } from "../controlStore/store";

export type PresetSnapshot = ControlStoreState;

export type PresetSnapshotFilter = (id: string, value: unknown) => boolean;

export interface PresetStorePreset {
  id?: string;
  name: string;
  readonly?: boolean;
  snapshot?: PresetSnapshot;
}

export interface PresetSnapshotOptions {
  includeIds?: string[];
  excludeIds?: string[];
  filter?: PresetSnapshotFilter;
}

export interface ApplyPresetOptions {
  clearMissing?: boolean;
}

export interface PresetStoreContextValue {
  presets: PresetStorePreset[];
  savePreset: (name: string) => void;
  selectPreset: (preset: PresetStorePreset) => void;
  deletePreset: (preset: PresetStorePreset) => void;
  setPresets: (
    next: PresetStorePreset[] | ((prev: PresetStorePreset[]) => PresetStorePreset[])
  ) => void;
  getSnapshot?: () => PresetSnapshot;
}
