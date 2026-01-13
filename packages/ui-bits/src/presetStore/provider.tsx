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
  storageKey?: string;
  storage?: Storage;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function normalizePreset(value: unknown): PresetStorePreset | null {
  if (!isPlainObject(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) return null;
  const snapshot = isPlainObject(value.snapshot) ? value.snapshot : null;
  if (!snapshot) return null;
  const id = typeof value.id === "string" ? value.id : undefined;
  const readonly = Boolean(value.readonly);
  return {
    id,
    name,
    snapshot,
    readonly,
  };
}

function loadStoredPresets(raw: string | null): PresetStorePreset[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePreset).filter(Boolean) as PresetStorePreset[];
  } catch (error) {
    return [];
  }
}

function mergePresets(primary: PresetStorePreset[], secondary: PresetStorePreset[]) {
  const seen = new Set<string>();
  const result: PresetStorePreset[] = [];
  const addPreset = (preset: PresetStorePreset) => {
    const key = (preset.id ?? preset.name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(preset);
  };
  primary.forEach(addPreset);
  secondary.forEach(addPreset);
  return result;
}

export function PresetStoreProvider({
  children,
  presets,
  defaultPresets = [],
  onPresetsChange,
  controlStore,
  autoIds = true,
  controlIdPrefix,
  storageKey,
  storage,
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

  const resolvedStorage = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  const hasLoadedRef = React.useRef(false);
  const defaultPresetKeys = React.useMemo(() => {
    const keys = new Set<string>();
    defaultPresets.forEach((preset) => {
      keys.add((preset.id ?? preset.name).toLowerCase());
    });
    return keys;
  }, [defaultPresets]);

  React.useEffect(() => {
    if (!storageKey || isControlled || !resolvedStorage) return;
    const stored = loadStoredPresets(resolvedStorage.getItem(storageKey));
    if (stored.length) {
      setInternalPresets((prev) => mergePresets(stored, prev));
    }
    hasLoadedRef.current = true;
  }, [isControlled, resolvedStorage, setInternalPresets, storageKey]);

  React.useEffect(() => {
    if (!storageKey || isControlled || !resolvedStorage || !hasLoadedRef.current) return;
    const persistable = internalPresets.filter((preset) => {
      if (preset.readonly) return false;
      const key = (preset.id ?? preset.name).toLowerCase();
      return !defaultPresetKeys.has(key);
    });
    try {
      resolvedStorage.setItem(storageKey, JSON.stringify(persistable));
    } catch (error) {
      // Ignore storage failures (private mode, quota, etc).
    }
  }, [defaultPresetKeys, internalPresets, isControlled, resolvedStorage, storageKey]);

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
  const getSnapshot = React.useCallback(() => (
    createPresetSnapshot(resolvedStore.getState(), snapshotOptions)
  ), [resolvedStore, snapshotOptions]);

  const contextValue = React.useMemo<PresetStoreContextValue>(() => ({
    presets: resolvedPresetList,
    savePreset,
    selectPreset,
    deletePreset,
    setPresets,
    getSnapshot,
  }), [deletePreset, getSnapshot, resolvedPresetList, savePreset, selectPreset, setPresets]);

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
