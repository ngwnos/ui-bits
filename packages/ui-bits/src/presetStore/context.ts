import { createContext, useContext } from "react";
import type { PresetStoreContextValue } from "./types";

export const PresetStoreContext = createContext<PresetStoreContextValue | null>(null);

export function usePresetStore() {
  return useContext(PresetStoreContext);
}
