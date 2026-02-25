import type { ControlStoreState } from "../controlStore/store";

/** Serialized control-store state captured for preset save/apply. */
export type PresetSnapshot = ControlStoreState;

/** Predicate used to include/exclude snapshot entries when saving. */
export type PresetSnapshotFilter = (id: string, value: unknown) => boolean;

export interface PresetStorePreset {
  /** Stable id for diffing and persistence. Falls back to `name` when omitted. */
  id?: string;
  /** User-visible preset name. */
  name: string;
  /** Prevents destructive actions and persistence rewrites for this preset. */
  readonly?: boolean;
  /** Captured control values. */
  snapshot?: PresetSnapshot;
}

export interface PresetSnapshotOptions {
  /** Only include these control ids (after filtering). */
  includeIds?: string[];
  /** Exclude these control ids. */
  excludeIds?: string[];
  /** Per-entry filter hook. Return `true` to keep the value in the snapshot. */
  filter?: PresetSnapshotFilter;
}

export interface ApplyPresetOptions {
  /** Remove current controls that are missing from the incoming snapshot. */
  clearMissing?: boolean;
}

export interface PresetStoreContextValue {
  /** Resolved preset list consumed by UI components such as `PresetManager`. */
  presets: PresetStorePreset[];
  /** Capture current control-store state into a new or existing preset. */
  savePreset: (name: string) => void;
  /** Apply a preset snapshot into the current control store. */
  selectPreset: (preset: PresetStorePreset) => void;
  /** Remove a non-readonly preset. */
  deletePreset: (preset: PresetStorePreset) => void;
  /** Replace or update the preset list in controlled/uncontrolled mode. */
  setPresets: (
    next: PresetStorePreset[] | ((prev: PresetStorePreset[]) => PresetStorePreset[])
  ) => void;
  /** Return a fresh snapshot from the active control store. */
  getSnapshot?: () => PresetSnapshot;
}
