import type { ControlStore, ControlStoreState } from "../controlStore/store";
import type { ApplyPresetOptions, PresetSnapshot, PresetSnapshotOptions } from "./types";

export function createPresetSnapshot(
  state: ControlStoreState,
  options: PresetSnapshotOptions = {},
): PresetSnapshot {
  const { includeIds, excludeIds, filter } = options;
  const includeSet = includeIds ? new Set(includeIds) : null;
  const excludeSet = excludeIds ? new Set(excludeIds) : null;
  const snapshot: PresetSnapshot = {};
  Object.entries(state).forEach(([id, value]) => {
    if (excludeSet?.has(id)) return;
    if (includeSet && !includeSet.has(id)) return;
    if (filter && !filter(id, value)) return;
    if (value === undefined) return;
    snapshot[id] = value;
  });
  return snapshot;
}

export function applyPresetSnapshot(
  store: ControlStore,
  snapshot: PresetSnapshot,
  options: ApplyPresetOptions = {},
) {
  const { clearMissing = false } = options;
  if (clearMissing) {
    const existingKeys = Object.keys(store.getState());
    existingKeys.forEach((key) => {
      if (!(key in snapshot)) {
        store.setValue(key, undefined);
      }
    });
  }
  Object.entries(snapshot).forEach(([id, value]) => {
    store.setValue(id, value);
  });
}
