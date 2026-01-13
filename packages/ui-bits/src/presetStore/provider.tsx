import React from "react";
import { ControlStoreProvider, useControlStore, ControlIdProvider } from "../controlStore";
import { createControlStore, type ControlStore } from "../controlStore/store";
import { PresetStoreContext } from "./context";
import { applyPresetSnapshot, createPresetSnapshot } from "./utils";
import type {
  PresetStoreContextValue,
  PresetStorePreset,
  PresetSnapshotOptions,
  ApplyPresetOptions,
} from "./types";

export interface PresetStoreProviderProps {
  children: React.ReactNode;
  presets?: PresetStorePreset[];
  defaultPresets?: PresetStorePreset[];
  onPresetsChange?: (presets: PresetStorePreset[]) => void;
  controlStore?: ControlStore;
  autoIds?: boolean;
  controlIdPrefix?: string;
  snapshotOptions?: PresetSnapshotOptions;
  applyOptions?: ApplyPresetOptions;
  includeDefaultsPreset?: boolean;
  defaultsPresetName?: string;
}

function toPresetId(value: string) {
  const trimmed = value.trim().toLowerCase();
  const slug = trimmed.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `preset-${Date.now()}`;
}

export function PresetStoreProvider({
  children,
  presets,
  defaultPresets = [],
  onPresetsChange,
  controlStore,
  autoIds = true,
  controlIdPrefix,
  snapshotOptions,
  applyOptions,
  includeDefaultsPreset = true,
  defaultsPresetName = "Defaults",
}: PresetStoreProviderProps) {
  const parentStore = useControlStore();
  const internalStoreRef = React.useRef<ControlStore | null>(null);
  if (!internalStoreRef.current) {
    internalStoreRef.current = createControlStore();
  }
  const resolvedStore = controlStore ?? parentStore ?? internalStoreRef.current;
  const shouldWrapControlStore = !parentStore && !controlStore;

  const [internalPresets, setInternalPresets] = React.useState<PresetStorePreset[]>(defaultPresets);
  const isControlled = presets !== undefined;
  const resolvedPresets = isControlled ? presets : internalPresets;
  const setPresets = React.useCallback((
    next: PresetStorePreset[] | ((prev: PresetStorePreset[]) => PresetStorePreset[]),
  ) => {
    if (!isControlled) {
      setInternalPresets((prev) => {
        const resolvedNext = typeof next === "function" ? next(prev) : next;
        onPresetsChange?.(resolvedNext);
        return resolvedNext;
      });
      return;
    }
    const resolvedNext = typeof next === "function" ? next(resolvedPresets) : next;
    onPresetsChange?.(resolvedNext);
  }, [isControlled, onPresetsChange, resolvedPresets]);

  const savePreset = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const snapshot = createPresetSnapshot(resolvedStore.getState(), snapshotOptions);
    setPresets((prev) => {
      const index = prev.findIndex((preset) => preset.name.toLowerCase() === trimmed.toLowerCase());
      if (index >= 0) {
        const existing = prev[index];
        if (existing.readonly) return prev;
        const next = [...prev];
        next[index] = { ...existing, name: trimmed, snapshot };
        return next;
      }
      const nextPreset: PresetStorePreset = {
        id: toPresetId(trimmed),
        name: trimmed,
        snapshot,
      };
      return [nextPreset, ...prev];
    });
  }, [resolvedStore, setPresets, snapshotOptions]);

  const deletePreset = React.useCallback((preset: PresetStorePreset) => {
    if (preset.readonly) return;
    setPresets((prev) => prev.filter((item) => (item.id ?? item.name) !== (preset.id ?? preset.name)));
  }, [setPresets]);

  const selectPreset = React.useCallback((preset: PresetStorePreset) => {
    if (!preset.snapshot) return;
    applyPresetSnapshot(resolvedStore, preset.snapshot, applyOptions);
  }, [applyOptions, resolvedStore]);

  const defaultsSnapshotRef = React.useRef<PresetStorePreset | null>(null);
  React.useEffect(() => {
    if (!includeDefaultsPreset || defaultsSnapshotRef.current) return;
    if (typeof window === "undefined") return;
    const capture = () => {
      const snapshot = createPresetSnapshot(resolvedStore.getState(), snapshotOptions);
      if (!Object.keys(snapshot).length) return;
      defaultsSnapshotRef.current = {
        id: "defaults",
        name: defaultsPresetName,
        readonly: true,
        snapshot,
      };
      setPresets((prev) => {
        const rest = prev.filter((preset) => (
          (preset.id ?? preset.name) !== "defaults"
          && preset.name !== defaultsPresetName
        ));
        return [defaultsSnapshotRef.current!, ...rest];
      });
    };
    const handle = window.setTimeout(capture, 0);
    return () => {
      window.clearTimeout(handle);
    };
  }, [defaultsPresetName, includeDefaultsPreset, resolvedStore, setPresets, snapshotOptions]);

  const resolvedPresetList = React.useMemo(() => {
    const defaultsPreset = defaultsSnapshotRef.current;
    if (!includeDefaultsPreset || !defaultsPreset) return resolvedPresets;
    const rest = resolvedPresets.filter((preset) => preset !== defaultsPreset);
    return [defaultsPreset, ...rest.filter((preset) => (
      (preset.id ?? preset.name) !== defaultsPreset.id
    ))];
  }, [includeDefaultsPreset, resolvedPresets]);

  const contextValue = React.useMemo<PresetStoreContextValue>(() => ({
    presets: resolvedPresetList,
    savePreset,
    selectPreset,
    deletePreset,
    setPresets,
  }), [deletePreset, resolvedPresetList, savePreset, selectPreset, setPresets]);

  const content = (
    <PresetStoreContext.Provider value={contextValue}>
      {shouldWrapControlStore ? (
        children
      ) : (
        <ControlIdProvider autoIds={autoIds} prefix={controlIdPrefix}>
          {children}
        </ControlIdProvider>
      )}
    </PresetStoreContext.Provider>
  );

  if (shouldWrapControlStore) {
    return (
      <ControlStoreProvider
        store={resolvedStore}
        autoIds={autoIds}
        controlIdPrefix={controlIdPrefix}
      >
        {content}
      </ControlStoreProvider>
    );
  }
  return content;
}
