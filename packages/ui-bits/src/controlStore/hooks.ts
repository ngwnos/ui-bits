import { useCallback, useSyncExternalStore } from "react";
import { useControlStore } from "./context";
import type { ControlStoreState } from "./store";

export function useControlValue<T>(id?: string, fallback?: T) {
  const store = useControlStore();
  const getSnapshot = useCallback(() => {
    if (!store || !id) return undefined;
    return store.getState()[id];
  }, [store, id]);
  const subscribe = useCallback((listener: () => void) => {
    if (!store || !id) return () => {};
    return store.subscribe(listener);
  }, [store, id]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const resolved = snapshot === undefined ? fallback : snapshot;
  const setValue = useCallback((next: T) => {
    if (!store || !id) return;
    store.setValue(id, next);
  }, [store, id]);
  return [resolved as T | undefined, setValue] as const;
}

export function useControlStoreState(): ControlStoreState | null {
  const store = useControlStore();
  const getSnapshot = useCallback(() => (
    store ? store.getState() : null
  ), [store]);
  const subscribe = useCallback((listener: () => void) => {
    if (!store) return () => {};
    return store.subscribe(listener);
  }, [store]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
