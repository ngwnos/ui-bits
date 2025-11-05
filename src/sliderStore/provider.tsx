import React, { useMemo, useReducer } from "react";
import { SliderStoreContext, type SliderStoreContextValue } from "./context";
import { buildInitialState, sliderStoreReducer } from "./state";

export function SliderStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sliderStoreReducer, undefined, buildInitialState);
  const value = useMemo<SliderStoreContextValue>(() => ({ state, dispatch }), [state, dispatch]);
  return <SliderStoreContext.Provider value={value}>{children}</SliderStoreContext.Provider>;
}
