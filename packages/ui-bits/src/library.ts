import "./style.css";

export { default as LFOSlider } from "./components/LFOSlider";
export type {
  LFOSliderProps,
  LFOSliderMode,
  SliderBorder,
  SliderBarStyle,
  SliderVariant,
} from "./components/LFOSlider";
export {
  createDayOfYearFormatter,
  createTimeFormatter,
  type DayOfYearFormatterOptions,
  type TimeFormatterOptions,
  type DisplayValueFormatterPreset,
  type DisplayFormatterPresetOptions,
} from "./components/LFOSlider/valueFormatters";

export { FrameLoopProvider, useFrame } from "./frameLoop";
export { useStoreMirror, type MirrorFn } from "./useStoreMirror";
export {
  AnimationSuspensionProvider,
  useAnimationSuspended,
  type AnimationSuspensionProviderProps,
} from "./animationSuspension";
export {
  AudioAnalysisProvider,
  useAudioAnalysisActions,
  useAudioAnalysisState,
  useAudioAnalysisStore,
  type AudioAnalysisActions,
  type AudioAnalysisState,
} from "./audioAnalysis";

export type { LfoSettings, Waveform } from "./lfo";
export {
  clamp,
  snapToStep,
  splitFromValue,
  valueFromSplit,
  lfoValue,
  phaseCaptureForTriangle,
} from "./lfo";
export { flexoki, flexokiShades, type FlexokiHue, type FlexokiPalette } from "./flexoki";
export {
  MATPLOTLIB_GRADIENTS,
  buildPalette,
  createGradientCss,
  type GradientDefinition,
} from "./gradients/matplotlib";
export { DEFAULT_SELECTION_GRID_ID } from "./selectionGridIds";
export { loadHeightTexture, type HeightTextureEntry } from "./utils/loadHeightTexture";

export {
  AudioControls,
  AudioFFTWindow,
  type AudioControlsProps,
  type AudioControlsBorder,
  type AudioFFTWindowProps,
} from "./components/AudioControls";
export { default as SelectionGrid, type SelectionGridProps } from "./components/SelectionGrid";
export { default as Dropdown, type DropdownProps, type DropdownOption } from "./components/Dropdown";
export {
  default as SegmentBar,
  type SegmentBarProps,
  type SegmentBarOption,
  type SegmentBarBorderStyle,
} from "./components/SegmentBar";
export {
  default as IconButton,
  type IconButtonProps,
  type IconButtonBehavior,
  type IconButtonBorderStyle,
  type IconButtonBorderMask,
  type IconButtonCycleOption,
} from "./components/IconButton";
export { default as BasicButton, type BasicButtonProps, type BasicButtonBorderStyle } from "./components/BasicButton";
export { default as Folder, type FolderProps, type FolderBorderStyle } from "./components/Folder";
export { default as FloatingPanel, type FloatingPanelProps, type FloatingPanelBorderStyle } from "./components/FloatingPanel";
export * from "./sliderStore";
