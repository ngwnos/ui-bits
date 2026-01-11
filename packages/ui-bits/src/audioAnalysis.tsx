import React, { createContext, useContext, useMemo, useRef, useSyncExternalStore } from "react";

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

const DEFAULT_MAX_MAGNITUDE = 1;
const FALLBACK_STATE: AudioAnalysisState = {
  bins: [],
  binCount: 0,
  maxMagnitude: DEFAULT_MAX_MAGNITUDE,
};

const FALLBACK_STORE: Pick<AudioAnalysisStore, "getSnapshot" | "subscribe"> = {
  getSnapshot: () => FALLBACK_STATE,
  subscribe: () => () => {},
};

const AudioAnalysisContext = createContext<AudioAnalysisStore | null>(null);

function normalizeBinCount(count: number | undefined, fallback: number) {
  if (!Number.isFinite(count ?? Number.NaN)) return fallback;
  return Math.max(0, Math.floor(count ?? 0));
}

function normalizeMaxMagnitude(magnitude: number | undefined) {
  if (!Number.isFinite(magnitude ?? Number.NaN) || (magnitude ?? 0) <= 0) {
    return DEFAULT_MAX_MAGNITUDE;
  }
  return magnitude ?? DEFAULT_MAX_MAGNITUDE;
}

export function createAudioAnalysisStore(initial: AudioAnalysisState): AudioAnalysisStore {
  let state = initial;
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  const setAudioBins = (bins: readonly number[]) => {
    const nextBins = Array.from(bins ?? []);
    state = { ...state, bins: nextBins };
    notify();
  };

  const setAudioBinCount = (count: number) => {
    const normalized = normalizeBinCount(count, 0);
    if (normalized === state.binCount) return;
    state = { ...state, binCount: normalized };
    notify();
  };

  const setAudioMaxMagnitude = (magnitude: number) => {
    const normalized = normalizeMaxMagnitude(magnitude);
    if (normalized === state.maxMagnitude) return;
    state = { ...state, maxMagnitude: normalized };
    notify();
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setAudioBins,
    setAudioBinCount,
    setAudioMaxMagnitude,
  };
}

export interface AudioAnalysisProviderProps {
  children: React.ReactNode;
  initialBins?: readonly number[];
  initialBinCount?: number;
  initialMaxMagnitude?: number;
}

export function AudioAnalysisProvider({
  children,
  initialBins,
  initialBinCount,
  initialMaxMagnitude,
}: AudioAnalysisProviderProps) {
  const storeRef = useRef<AudioAnalysisStore | null>(null);

  if (!storeRef.current) {
    const safeBins = Array.from(initialBins ?? []);
    const safeCount = normalizeBinCount(initialBinCount, safeBins.length);
    const safeMax = normalizeMaxMagnitude(initialMaxMagnitude);
    storeRef.current = createAudioAnalysisStore({
      bins: safeBins,
      binCount: safeCount,
      maxMagnitude: safeMax,
    });
  }

  return (
    <AudioAnalysisContext.Provider value={storeRef.current}>
      {children}
    </AudioAnalysisContext.Provider>
  );
}

export function useAudioAnalysisStore(): AudioAnalysisStore | null {
  return useContext(AudioAnalysisContext);
}

export function useAudioAnalysisState(): AudioAnalysisState | null {
  const store = useAudioAnalysisStore();
  const activeStore = store ?? FALLBACK_STORE;
  const snapshot = useSyncExternalStore(
    activeStore.subscribe,
    activeStore.getSnapshot,
    activeStore.getSnapshot,
  );
  return store ? snapshot : null;
}

export function useAudioAnalysisActions(): AudioAnalysisActions {
  const store = useAudioAnalysisStore();
  if (!store) {
    throw new Error("useAudioAnalysisActions must be used within an AudioAnalysisProvider");
  }
  return useMemo(() => ({
    setAudioBins: store.setAudioBins,
    setAudioBinCount: store.setAudioBinCount,
    setAudioMaxMagnitude: store.setAudioMaxMagnitude,
  }), [store]);
}
