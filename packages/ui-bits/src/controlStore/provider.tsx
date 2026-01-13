import React from "react";
import { ControlStoreContext } from "./context";
import { ControlIdProvider } from "./ids";
import { createControlStore, type ControlStore } from "./store";

export interface ControlStoreProviderProps {
  store?: ControlStore;
  autoIds?: boolean;
  controlIdPrefix?: string;
  children: React.ReactNode;
}

export function ControlStoreProvider({
  store,
  autoIds = false,
  controlIdPrefix,
  children,
}: ControlStoreProviderProps) {
  const internalStoreRef = React.useRef<ControlStore | null>(null);
  if (!internalStoreRef.current) {
    internalStoreRef.current = createControlStore();
  }
  const resolvedStore = store ?? internalStoreRef.current;

  return (
    <ControlStoreContext.Provider value={resolvedStore}>
      <ControlIdProvider autoIds={autoIds} prefix={controlIdPrefix}>
        {children}
      </ControlIdProvider>
    </ControlStoreContext.Provider>
  );
}
