import type { SliderStoreAction, SliderStoreState } from "./state";
export interface SliderStoreContextValue {
    state: SliderStoreState;
    dispatch: React.Dispatch<SliderStoreAction>;
}
export declare const SliderStoreContext: import("react").Context<SliderStoreContextValue | undefined>;
export declare function useSliderStore(): SliderStoreContextValue;
