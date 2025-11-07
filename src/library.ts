export { default as LFOSlider } from "./components/LFOSlider";
export type {
  LFOSliderProps,
  LFOSliderMode,
  SliderBorder,
} from "./components/LFOSlider";

export { FrameLoopProvider, useFrame } from "./frameLoop";
export { useStoreMirror, type MirrorFn } from "./useStoreMirror";

export type { LfoSettings, Waveform } from "./lfo";
export {
  clamp,
  snapToStep,
  splitFromValue,
  valueFromSplit,
  lfoValue,
  phaseCaptureForTriangle,
} from "./lfo";

export { default as SelectionGrid, type SelectionGridProps } from "./components/SelectionGrid";
export { default as Dropdown, type DropdownProps, type DropdownOption } from "./components/Dropdown";
