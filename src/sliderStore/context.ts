import { createContext, useContext } from "react";
import type { SliderStoreAction, SliderStoreState } from "./state";

export interface SliderStoreContextValue {
  state: SliderStoreState;
  dispatch: React.Dispatch<SliderStoreAction>;
}

export const SliderStoreContext = createContext<SliderStoreContextValue | undefined>(undefined);

export function useSliderStore(): SliderStoreContextValue {
  const context = useContext(SliderStoreContext);
  if (!context) throw new Error("useSliderStore must be used within a SliderStoreProvider");
  return context;
}
