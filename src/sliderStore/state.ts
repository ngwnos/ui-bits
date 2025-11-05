import { clamp, valueFromSplit } from "../lfo";
import type { Waveform } from "../lfo";
import { flexoki, type FlexokiHue } from "../flexoki";
import type { SliderBorder } from "../components/LFOSlider";
import { DEFAULT_SELECTION_GRID_ID } from "../selectionGridIds";
import { MATPLOTLIB_GRADIENTS, buildPalette } from "../gradients/matplotlib";

export type SliderId = string;
export type SelectionGridId = string;
export type SelectionGridAlignment = "left" | "center" | "right";

export interface SelectionGridState {
  selectedIndex: number | null;
  squareScale: number;
  squareAlignment: SelectionGridAlignment;
  invertGradients: boolean;
  allowEmptySelection: boolean;
  colorPalette: string[];
  useTerrainTiles: boolean;
}

export interface SliderDefinition {
  id: SliderId;
  label: string;
  hue: FlexokiHue;
  min: number;
  max: number;
  step: number;
  width: number;
  drawerHandle: boolean;
}

export interface SliderRuntimeState {
  value: number;
  leftColor: string;
  rightColor: string;
  border: SliderBorder;
  drawerFeatureEnabled: boolean;
  drawerLines: [number, number];
  drawerOpen: boolean;
  lfoEnabled: boolean;
  waveform: Waveform;
  frequency: number;
  phase: number;
}

export interface SliderColumn {
  id: string;
  sliderIds: SliderId[];
}

export interface SliderStoreState {
  definitions: Record<SliderId, SliderDefinition>;
  sliders: Record<SliderId, SliderRuntimeState>;
  columns: SliderColumn[];
  customSliderId: SliderId;
  selectionGrids: Record<SelectionGridId, SelectionGridState>;
  selectionGridIds: SelectionGridId[];
}

export type SliderStoreAction =
  | { type: "setValue"; id: SliderId; value: number }
  | { type: "setColors"; id: SliderId; left: string; right: string }
  | { type: "setBorder"; id: SliderId; border: SliderBorder }
  | { type: "setDrawerLines"; id: SliderId; lines: [number, number] }
  | { type: "setDrawerFeatureEnabled"; id: SliderId; enabled: boolean }
  | { type: "setDrawerOpen"; id: SliderId; open: boolean }
  | { type: "setLfoEnabled"; id: SliderId; enabled: boolean }
  | { type: "setWaveform"; id: SliderId; waveform: Waveform }
  | { type: "setFrequency"; id: SliderId; frequency: number }
  | { type: "setPhase"; id: SliderId; phase: number }
  | { type: "setDrawerOpenBatch"; ids: SliderId[]; open: boolean }
  | { type: "setDrawerFeatureEnabledBatch"; ids: SliderId[]; enabled: boolean }
  | { type: "setLfoEnabledBatch"; ids: SliderId[]; enabled: boolean }
  | { type: "swapColorsAll" }
  | { type: "swapColorsColumn"; ids: SliderId[] }
  | { type: "setBorderColumn"; ids: SliderId[]; border: SliderBorder }
  | { type: "registerSelectionGrid"; id: SelectionGridId; initialState?: Partial<SelectionGridState> }
  | { type: "updateSelectionGrid"; id: SelectionGridId; patch: Partial<SelectionGridState> }
  | { type: "toggleSelectionGridInvert"; id: SelectionGridId }
  | { type: "setSelectionGridPalette"; id: SelectionGridId; palette: string[] };

const DEFAULT_SELECTION_PALETTE = buildPalette(MATPLOTLIB_GRADIENTS[0].stops, false).css;

export const SELECTION_GRID_BASE_STATE: SelectionGridState = {
  selectedIndex: 0,
  squareScale: 1,
  squareAlignment: "left",
  invertGradients: false,
  allowEmptySelection: false,
  colorPalette: [...DEFAULT_SELECTION_PALETTE],
  useTerrainTiles: true,
};

function selectionGridStatesEqual(a: SelectionGridState, b: SelectionGridState): boolean {
  return (
    a.selectedIndex === b.selectedIndex
    && a.squareScale === b.squareScale
    && a.squareAlignment === b.squareAlignment
    && a.invertGradients === b.invertGradients
    && a.allowEmptySelection === b.allowEmptySelection
    && a.colorPalette.length === b.colorPalette.length
    && a.colorPalette.every((color, index) => color === b.colorPalette[index])
    && a.useTerrainTiles === b.useTerrainTiles
  );
}

export function normalizeSelectionGridState(base: SelectionGridState): SelectionGridState {
  const clampScale = (value: number): number => {
    if (!Number.isFinite(value)) return 1;
    return Math.min(4, Math.max(1, Math.round(value)));
  };
  const normalizeAlignment = (value: SelectionGridAlignment): SelectionGridAlignment => {
    if (value === "center" || value === "right") return value;
    return "left";
  };
  const normalized: SelectionGridState = {
    selectedIndex: base.selectedIndex,
    squareScale: clampScale(base.squareScale),
    squareAlignment: normalizeAlignment(base.squareAlignment),
    invertGradients: Boolean(base.invertGradients),
    allowEmptySelection: Boolean(base.allowEmptySelection),
    colorPalette: Array.isArray(base.colorPalette) && base.colorPalette.length === 256
      ? [...base.colorPalette]
      : [...DEFAULT_SELECTION_PALETTE],
    useTerrainTiles: Boolean(base.useTerrainTiles ?? true),
  };
  if (!normalized.allowEmptySelection && normalized.selectedIndex == null) {
    normalized.selectedIndex = 0;
  }
  return normalized;
}

function randomValue({ min, max, step }: { min: number; max: number; step: number }): number {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  const span = Math.max(0, safeMax - safeMin);
  const safeStep = step > 0 && Number.isFinite(step) ? step : (span || 1);
  if (span === 0 || !Number.isFinite(span)) return safeMin;
  const steps = Math.max(1, Math.floor(span / safeStep));
  const index = Math.floor(Math.random() * (steps + 1));
  const raw = safeMin + index * safeStep;
  const precision = (() => {
    const stepStr = safeStep.toString();
    if (stepStr.includes("e-")) {
      const [, exponent] = stepStr.split("e-");
      return Number(exponent ?? "0");
    }
    const [, decimals] = stepStr.split(".");
    return decimals?.length ?? 0;
  })();
  return Number(raw.toFixed(precision));
}

const INITIAL_FREQUENCIES = [0.2, 0.4, 0.6, 0.8] as const;

function randomFrequency(): number {
  const index = Math.floor(Math.random() * INITIAL_FREQUENCIES.length);
  return INITIAL_FREQUENCIES[index];
}

function randomPhase(): number {
  return Math.random() * Math.PI * 2;
}

const waveformOptions: Waveform[] = ["sine", "triangle", "saw", "square"];

type SliderGroupDefinition = {
  hue: FlexokiHue;
  min: number;
  max: number;
  step: number;
  width: number;
  variants: Array<{
    key: string;
    label: string;
    leftColor?: string;
    rightColor?: string;
  }>;
};

const sliderGroups: SliderGroupDefinition[] = [
  {
    hue: "base",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Base 500/50", leftColor: flexoki.base["500"], rightColor: flexoki.base["50"] },
      { key: "600-100", label: "Base 600/100" },
      { key: "700-200", label: "Base 700/200", leftColor: flexoki.base["700"], rightColor: flexoki.base["200"] },
    ],
  },
  {
    hue: "red",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Red 500/50", leftColor: flexoki.red["500"], rightColor: flexoki.red["50"] },
      { key: "600-100", label: "Red 600/100" },
      { key: "700-200", label: "Red 700/200", leftColor: flexoki.red["700"], rightColor: flexoki.red["200"] },
    ],
  },
  {
    hue: "orange",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Orange 500/50", leftColor: flexoki.orange["500"], rightColor: flexoki.orange["50"] },
      { key: "600-100", label: "Orange 600/100" },
      { key: "700-200", label: "Orange 700/200", leftColor: flexoki.orange["700"], rightColor: flexoki.orange["200"] },
    ],
  },
  {
    hue: "yellow",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Yellow 500/50", leftColor: flexoki.yellow["500"], rightColor: flexoki.yellow["50"] },
      { key: "600-100", label: "Yellow 600/100" },
      { key: "700-200", label: "Yellow 700/200", leftColor: flexoki.yellow["700"], rightColor: flexoki.yellow["200"] },
    ],
  },
  {
    hue: "green",
    min: -10,
    max: 10,
    step: 0.5,
    width: 260,
    variants: [
      { key: "500-50", label: "Green 500/50", leftColor: flexoki.green["500"], rightColor: flexoki.green["50"] },
      { key: "600-100", label: "Green 600/100" },
      { key: "700-200", label: "Green 700/200", leftColor: flexoki.green["700"], rightColor: flexoki.green["200"] },
    ],
  },
  {
    hue: "cyan",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Cyan 500/50", leftColor: flexoki.cyan["500"], rightColor: flexoki.cyan["50"] },
      { key: "600-100", label: "Cyan 600/100" },
      { key: "700-200", label: "Cyan 700/200", leftColor: flexoki.cyan["700"], rightColor: flexoki.cyan["200"] },
    ],
  },
  {
    hue: "blue",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Blue 500/50", leftColor: flexoki.blue["500"], rightColor: flexoki.blue["50"] },
      { key: "600-100", label: "Blue 600/100" },
      { key: "700-200", label: "Blue 700/200", leftColor: flexoki.blue["700"], rightColor: flexoki.blue["200"] },
    ],
  },
  {
    hue: "purple",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Purple 500/50", leftColor: flexoki.purple["500"], rightColor: flexoki.purple["50"] },
      { key: "600-100", label: "Purple 600/100" },
      { key: "700-200", label: "Purple 700/200", leftColor: flexoki.purple["700"], rightColor: flexoki.purple["200"] },
    ],
  },
  {
    hue: "magenta",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Magenta 500/50", leftColor: flexoki.magenta["500"], rightColor: flexoki.magenta["50"] },
      { key: "600-100", label: "Magenta 600/100" },
      { key: "700-200", label: "Magenta 700/200", leftColor: flexoki.magenta["700"], rightColor: flexoki.magenta["200"] },
    ],
  },
];

export function buildInitialState(): SliderStoreState {
  const definitions: Record<SliderId, SliderDefinition> = {};
  const sliders: Record<SliderId, SliderRuntimeState> = {};
  const columns: SliderColumn[] = [];
  const selectionGrids: Record<SelectionGridId, SelectionGridState> = {};
  const selectionGridIds: SelectionGridId[] = [];

  const columnCount = sliderGroups[0]?.variants.length ?? 0;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const columnSliderIds: SliderId[] = [];
    sliderGroups.forEach((group) => {
      const variant = group.variants[columnIndex];
      if (!variant) return;
      const id = `${group.hue}-${variant.key}`;
      const leftColor = variant.leftColor ?? flexoki[group.hue]["600"];
      const rightColor = variant.rightColor ?? flexoki[group.hue]["100"];
      definitions[id] = {
        id,
        label: variant.label,
        hue: group.hue,
        min: group.min,
        max: group.max,
        step: group.step,
        width: group.width,
        drawerHandle: true,
      };
      sliders[id] = {
        value: randomValue({ min: group.min, max: group.max, step: group.step }),
        leftColor,
        rightColor,
        border: "none",
        drawerFeatureEnabled: definitions[id].drawerHandle,
        drawerLines: [
          valueFromSplit(Math.random(), group.min, group.max, group.step),
          valueFromSplit(Math.random(), group.min, group.max, group.step),
        ],
        drawerOpen: false,
        lfoEnabled: true,
        waveform: waveformOptions[Math.floor(Math.random() * waveformOptions.length)],
        frequency: randomFrequency(),
        phase: randomPhase(),
      };
      columnSliderIds.push(id);
    });
    columns.push({ id: `column-${columnIndex}`, sliderIds: columnSliderIds });
  }

  const customSliderId = "custom-primary";
  const customMin = 0;
  const customMax = 100;
  const customStep = 1;

  definitions[customSliderId] = {
    id: customSliderId,
    label: "Custom colors",
    hue: "base",
    min: customMin,
    max: customMax,
    step: customStep,
    width: 320,
    drawerHandle: true,
  };
  sliders[customSliderId] = {
    value: randomValue({ min: customMin, max: customMax, step: customStep }),
    leftColor: "#205EA6",
    rightColor: "#ECCB60",
    border: "none",
    drawerFeatureEnabled: definitions[customSliderId].drawerHandle,
    drawerLines: [
      valueFromSplit(Math.random(), customMin, customMax, customStep),
      valueFromSplit(Math.random(), customMin, customMax, customStep),
    ],
    drawerOpen: true,
    lfoEnabled: true,
    waveform: waveformOptions[Math.floor(Math.random() * waveformOptions.length)],
    frequency: randomFrequency(),
    phase: randomPhase(),
  };

  selectionGrids[DEFAULT_SELECTION_GRID_ID] = normalizeSelectionGridState({
    ...SELECTION_GRID_BASE_STATE,
  });
  selectionGridIds.push(DEFAULT_SELECTION_GRID_ID);

  return {
    definitions,
    sliders,
    columns,
    customSliderId,
    selectionGrids,
    selectionGridIds,
  };
}

export function sliderStoreReducer(state: SliderStoreState, action: SliderStoreAction): SliderStoreState {
  switch (action.type) {
    case "setValue":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            value: clamp(action.value, state.definitions[action.id].min, state.definitions[action.id].max),
          },
        },
      };
    case "setColors":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            leftColor: action.left,
            rightColor: action.right,
          },
        },
      };
    case "setBorder":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            border: action.border,
          },
        },
      };
    case "setDrawerLines":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            drawerLines: action.lines,
          },
        },
      };
    case "setDrawerFeatureEnabled": {
      const current = state.sliders[action.id];
      if (!current) return state;
      const nextSlider: SliderRuntimeState = action.enabled
        ? { ...current, drawerFeatureEnabled: true }
        : { ...current, drawerFeatureEnabled: false, drawerOpen: false, lfoEnabled: false };
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: nextSlider,
        },
      };
    }
    case "setDrawerOpen": {
      const current = state.sliders[action.id];
      if (!current) return state;
      const drawerOpen = current.drawerFeatureEnabled ? action.open : false;
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...current,
            drawerOpen,
          },
        },
      };
    }
    case "setLfoEnabled":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            lfoEnabled: action.enabled,
          },
        },
      };
    case "setWaveform":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            waveform: action.waveform,
          },
        },
      };
    case "setFrequency":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            frequency: action.frequency,
          },
        },
      };
    case "setPhase":
      return {
        ...state,
        sliders: {
          ...state.sliders,
          [action.id]: {
            ...state.sliders[action.id],
            phase: action.phase,
          },
        },
      };
    case "setDrawerOpenBatch": {
      const nextSliders = { ...state.sliders };
      action.ids.forEach((id) => {
        const current = nextSliders[id];
        if (!current) return;
        const drawerOpen = current.drawerFeatureEnabled ? action.open : false;
        nextSliders[id] = { ...current, drawerOpen };
      });
      return { ...state, sliders: nextSliders };
    }
    case "setDrawerFeatureEnabledBatch": {
      const nextSliders = { ...state.sliders };
      action.ids.forEach((id) => {
        const current = nextSliders[id];
        if (!current) return;
        nextSliders[id] = action.enabled
          ? { ...current, drawerFeatureEnabled: true }
          : { ...current, drawerFeatureEnabled: false, drawerOpen: false, lfoEnabled: false };
      });
      return { ...state, sliders: nextSliders };
    }
    case "setLfoEnabledBatch": {
      const nextSliders = { ...state.sliders };
      action.ids.forEach((id) => {
        const current = nextSliders[id];
        if (!current) return;
        nextSliders[id] = { ...current, lfoEnabled: action.enabled };
      });
      return { ...state, sliders: nextSliders };
    }
    case "swapColorsAll": {
      const nextSliders = Object.fromEntries(
        Object.entries(state.sliders).map(([id, slider]) => [
          id,
          { ...slider, leftColor: slider.rightColor, rightColor: slider.leftColor },
        ]),
      );
      return { ...state, sliders: nextSliders };
    }
    case "swapColorsColumn": {
      const nextSliders = { ...state.sliders };
      action.ids.forEach((id) => {
        const current = nextSliders[id];
        if (!current) return;
        nextSliders[id] = { ...current, leftColor: current.rightColor, rightColor: current.leftColor };
      });
      return { ...state, sliders: nextSliders };
    }
    case "setBorderColumn": {
      const nextSliders = { ...state.sliders };
      action.ids.forEach((id) => {
        const current = nextSliders[id];
        if (!current) return;
        nextSliders[id] = { ...current, border: action.border };
      });
      return { ...state, sliders: nextSliders };
    }
    case "registerSelectionGrid": {
      const current = state.selectionGrids[action.id];
      if (current) {
        const next = normalizeSelectionGridState({ ...current, ...(action.initialState ?? {}) });
        if (selectionGridStatesEqual(next, current)) return state;
        return {
          ...state,
          selectionGrids: {
            ...state.selectionGrids,
            [action.id]: next,
          },
        };
      }
      const next = normalizeSelectionGridState({ ...SELECTION_GRID_BASE_STATE, ...(action.initialState ?? {}) });
      return {
        ...state,
        selectionGridIds: state.selectionGridIds.includes(action.id)
          ? state.selectionGridIds
          : [...state.selectionGridIds, action.id],
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "updateSelectionGrid": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      const next = normalizeSelectionGridState({ ...current, ...action.patch });
      if (selectionGridStatesEqual(next, current)) {
        return state;
      }
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "toggleSelectionGridInvert": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      const next = { ...current, invertGradients: !current.invertGradients };
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: next,
        },
      };
    }
    case "setSelectionGridPalette": {
      const current = state.selectionGrids[action.id];
      if (!current) return state;
      if (current.colorPalette.length === action.palette.length
        && current.colorPalette.every((color, index) => color === action.palette[index])) {
        return state;
      }
      return {
        ...state,
        selectionGrids: {
          ...state.selectionGrids,
          [action.id]: {
            ...current,
            colorPalette: [...action.palette],
          },
        },
      };
    }
    default:
      return state;
  }
}
