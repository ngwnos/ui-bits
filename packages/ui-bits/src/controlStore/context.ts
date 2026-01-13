import { createContext, useContext } from "react";
import type { ControlStore } from "./store";

export const ControlStoreContext = createContext<ControlStore | null>(null);

export function useControlStore(): ControlStore | null {
  return useContext(ControlStoreContext);
}
