import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeftRight,
  AudioWaveform,
  Columns4,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Minus,
  Mountain,
  MountainSnow,
  Moon,
  Pause,
  Play,
  Square,
  SquareDashed,
  Sun,
  X,
} from "lucide-react";
import {
  DEFAULT_SELECTION_GRID_ID,
  Dropdown,
  FrameLoopProvider,
  IconButton,
  LFOSlider,
  SelectionGrid,
  SegmentBar,
  createDayOfYearFormatter,
  createTimeFormatter,
  flexoki,
  type SegmentBarBorderStyle,
  type SliderBorder,
  type Waveform,
  SliderStoreProvider,
  useSliderActions,
  useSliderDefinition,
  useSliderLayout,
  useSliderState,
  useSliderStoreState,
  useSelectionGridState,
  useSelectionGridActions,
  type SelectionGridAlignment,
  type SelectionGridPreviewMode,
  type SliderRuntimeState,
  type SliderId,
} from "ui-bits";
import AudioControls, { type AudioControlsBorder } from "./components/AudioControls/AudioControls";
import CustomColorPopover from "./components/CustomColorPopover";
import TypeGPUTest from "./components/TypeGPUTest";

const BORDER_MODES: SliderBorder[] = ['left', 'right', 'none'];
const BORDER_ICONS: Record<SliderBorder, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  left: Square,
  right: SquareDashed,
  none: X,
};
const SELECTION_PREVIEW_MODE_SEQUENCE: SelectionGridPreviewMode[] = ["gradient", "terrainHeight", "terrainHillshade"];
const SELECTION_PREVIEW_MODE_ICON: Record<SelectionGridPreviewMode, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  gradient: Columns4,
  terrainHeight: Mountain,
  terrainHillshade: MountainSnow,
};
const SELECTION_PREVIEW_MODE_TITLE: Record<SelectionGridPreviewMode, string> = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews",
  terrainHillshade: "Terrain hillshade previews",
};

const DROPDOWN_OPTIONS = [
  {
    value: "sine",
    label: "Sine Wave",
    description: "Smooth modulation suited for pads or evolving textures.",
  },
  {
    value: "triangle",
    label: "Triangle",
    description: "Linear ramps, great for rhythmic sweeps.",
  },
  {
    value: "saw",
    label: "Sawtooth",
    description: "Sharp rise and drop, adds grit to filters.",
  },
  {
    value: "square",
    label: "Square",
    description: "Instant toggles for on/off style modulation.",
  },
];

const DROPDOWN_SIMPLE_OPTIONS = DROPDOWN_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const SEGMENT_BAR_MODES = [
  { value: "slow", label: "Slow Drift" },
  { value: "medium", label: "Medium" },
  { value: "fast", label: "Fast Rise" },
  { value: "burst", label: "Burst" },
];

const SEGMENT_BAR_DEMO_SETS = [
  [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ],
  [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
  ],
  [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
    { value: "d", label: "D" },
  ],
  [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
    { value: "d", label: "D" },
    { value: "e", label: "E" },
  ],
  [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
    { value: "c", label: "C" },
    { value: "d", label: "D" },
    { value: "e", label: "E" },
    { value: "f", label: "F" },
  ],
];
const SEGMENT_BORDER_STYLES: SegmentBarBorderStyle[] = ["a", "b", "none"];

const DATE_SLIDER_MIN = 0;
const DATE_SLIDER_MAX = 365.25;
const DATE_SLIDER_STEP = 0.01;
const DATE_SLIDER_BASE_YEAR = 2023;
const DATE_SLIDER_PRESET_OPTIONS = {
  baseYear: DATE_SLIDER_BASE_YEAR,
  zeroOffset: DATE_SLIDER_MIN,
};
const dateFormatterHelpers = createDayOfYearFormatter({
  min: DATE_SLIDER_MIN,
  max: DATE_SLIDER_MAX,
  options: DATE_SLIDER_PRESET_OPTIONS,
});
const formatDateLabel = (value: number) => dateFormatterHelpers.formatLabel(value);
const TIME_SLIDER_MIN = 0;
const TIME_SLIDER_MAX = 24 * 60 * 60;
const TIME_SLIDER_STEP = 1;
const TIME_SLIDER_PRESET_OPTIONS = {
  zeroOffset: TIME_SLIDER_MIN,
};
const timeFormatterHelpers = createTimeFormatter({
  min: TIME_SLIDER_MIN,
  max: TIME_SLIDER_MAX,
  options: TIME_SLIDER_PRESET_OPTIONS,
});
const formatTimeLabel = (value: number) => timeFormatterHelpers.formatLabel(value);

// =================== Demo: one slider per Flexoki hue ===================

function ColumnView({
  column,
  columnIndex,
  columnButtonSize,
  rowGap,
  fontSize,
  isDarkMode,
  maxColumnWidth,
}: {
  column: { id: string; sliderIds: SliderId[] };
  columnIndex: number;
  columnButtonSize: number;
  rowGap: string;
  fontSize: number;
  isDarkMode: boolean;
  maxColumnWidth?: number;
}) {
  const actions = useSliderActions();
  const sliderStoreState = useSliderStoreState();
  const sliderStates = React.useMemo(
    () => column.sliderIds
      .map((sliderId) => {
        const state = sliderStoreState.sliders[sliderId];
        if (!state) return null;
        return { sliderId, state };
      })
      .filter((entry): entry is { sliderId: SliderId; state: SliderRuntimeState } => entry !== null),
    [column.sliderIds, sliderStoreState.sliders],
  );
  const allOpen = sliderStates.every(({ state }) => state.drawerOpen);
  const allDrawerFeaturesEnabled = sliderStates.every(({ state }) => state.drawerFeatureEnabled);
  const allLfoEnabled = sliderStates.every(({ state }) => state.lfoEnabled);
  const [swapFlipped, setSwapFlipped] = React.useState(false);
  const [columnWidth, setColumnWidth] = React.useState<number | null>(maxColumnWidth ?? null);
  const columnContainerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const node = columnContainerRef.current;
    if (!node) return undefined;
    const updateWidth = () => {
      const rect = node.getBoundingClientRect();
      setColumnWidth(rect.width);
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [column.sliderIds]);
  React.useEffect(() => {
    if (maxColumnWidth === undefined) return;
    setColumnWidth((prev) => {
      if (prev === null) return maxColumnWidth;
      return Math.min(prev, maxColumnWidth);
    });
  }, [maxColumnWidth]);

  const playPauseIconSize = Math.max(columnButtonSize - 6, 12);
  const drawerIconSize = Math.max(columnButtonSize - 6, 12);
  const columnButtonBaseStyle: React.CSSProperties = {
    width: columnButtonSize,
    height: columnButtonSize,
    borderRadius: 3,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    fontWeight: 600,
    lineHeight: 1,
    userSelect: 'none',
    padding: 2,
    transition: 'background 120ms ease, color 120ms ease',
  };
  const buttonPalette = isDarkMode
    ? {
      background: flexoki.base['100'],
      color: flexoki.base['700'],
    }
    : {
      background: flexoki.base['700'],
      color: flexoki.base['50'],
    };
  const disabledButtonPalette: React.CSSProperties = {
    background: flexoki.base['500'],
    color: flexoki.base['50'],
    cursor: 'not-allowed',
  };
  const currentBorder: SliderBorder = sliderStates[0]?.state.border ?? 'left';
  const nextBorderMode = BORDER_MODES[(BORDER_MODES.indexOf(currentBorder) + 1) % BORDER_MODES.length];

  const handleToggleDrawer = () => {
    actions.setColumnDrawerOpen(column.sliderIds, !allOpen);
  };

  const handleToggleDrawerFeature = () => {
    actions.setColumnDrawerFeatureEnabled(column.sliderIds, !allDrawerFeaturesEnabled);
  };

  const handleToggleLfo = () => {
    actions.setColumnLfoEnabled(column.sliderIds, !allLfoEnabled);
  };

  const swapColumnColors = () => {
    actions.swapColumnSliderColors(column.sliderIds);
    setSwapFlipped((prev) => !prev);
  };

  const swapButtonBaseStyle: React.CSSProperties = {
    ...columnButtonBaseStyle,
    ...buttonPalette,
  };

  const cycleColumnBorder = () => {
    actions.setColumnBorder(column.sliderIds, nextBorderMode);
  };

  return (
    <div
      ref={columnContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: rowGap,
        alignItems: 'stretch',
        width: '100%',
        maxWidth: maxColumnWidth ?? '100%',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleToggleDrawer}
          aria-pressed={allOpen}
          aria-label={allOpen ? `Collapse column ${columnIndex + 1}` : `Expand column ${columnIndex + 1}`}
          title="Expand/collapse"
          style={{
            ...columnButtonBaseStyle,
            ...(allDrawerFeaturesEnabled ? buttonPalette : disabledButtonPalette),
          }}
          disabled={!allDrawerFeaturesEnabled}
        >
          {allOpen ? (
            <ListChevronsDownUp size={drawerIconSize} strokeWidth={2} />
          ) : (
            <ListChevronsUpDown size={drawerIconSize} strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          onClick={handleToggleDrawerFeature}
          aria-pressed={allDrawerFeaturesEnabled}
          aria-label={allDrawerFeaturesEnabled ? `Disable column ${columnIndex + 1} LFO drawer` : `Enable column ${columnIndex + 1} LFO drawer`}
          title="Toggle LFO drawer"
          style={{ ...columnButtonBaseStyle, ...buttonPalette }}
        >
          {allDrawerFeaturesEnabled ? (
            <AudioWaveform size={drawerIconSize} strokeWidth={2} />
          ) : (
            <Minus size={drawerIconSize} strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          onClick={handleToggleLfo}
          aria-pressed={allLfoEnabled}
          aria-label={allLfoEnabled ? `Disable column ${columnIndex + 1} LFO` : `Enable column ${columnIndex + 1} LFO`}
          title="Toggle LFO animation"
          style={{
            ...columnButtonBaseStyle,
            ...(allDrawerFeaturesEnabled ? buttonPalette : disabledButtonPalette),
          }}
          disabled={!allDrawerFeaturesEnabled}
        >
          {allLfoEnabled ? (
            <Pause size={playPauseIconSize} strokeWidth={2} />
          ) : (
            <Play size={playPauseIconSize} strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          onClick={swapColumnColors}
          aria-label={`Swap colors for column ${columnIndex + 1}`}
          title="Swap colors"
          style={swapButtonBaseStyle}
        >
          <ArrowLeftRight
            size={drawerIconSize}
            strokeWidth={2}
            style={{ transform: swapFlipped ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 160ms ease' }}
          />
        </button>
        <button
          type="button"
          onClick={cycleColumnBorder}
          aria-label={`Cycle border for column ${columnIndex + 1}`}
          title={"Border color left/right/none"}
          style={{ ...columnButtonBaseStyle, ...buttonPalette }}
        >
          {React.createElement(BORDER_ICONS[currentBorder], { size: drawerIconSize, strokeWidth: 2 })}
        </button>
      </div>
      {sliderStates.map(({ sliderId }) => (
        <ConnectedSlider
          key={sliderId}
          sliderId={sliderId}
          fontSize={fontSize}
          widthOverride={maxColumnWidth !== undefined
            ? Math.min(columnWidth ?? maxColumnWidth, maxColumnWidth)
            : columnWidth ?? undefined}
          isFullWidth
        />
      ))}
    </div>
  );
}

function ConnectedSlider({
  sliderId,
  fontSize,
  widthOverride,
  isFullWidth = false,
}: {
  sliderId: SliderId;
  fontSize: number;
  widthOverride?: number;
  isFullWidth?: boolean;
}) {
  const definition = useSliderDefinition(sliderId);
  const state = useSliderState(sliderId);
  const actions = useSliderActions();
  const { audioBins, audioBinCount, audioMaxMagnitude } = useSliderStoreState();
  const resolvedWidth = widthOverride ?? definition.width;

  return (
    <LFOSlider
      label={definition.label}
      min={definition.min}
      max={definition.max}
      step={definition.step}
      defaultValue={state.value}
      width={resolvedWidth}
      lfoRange={state.drawerLines}
      colorA={state.colorA}
      colorB={state.colorB}
      border={state.border}
      fontSize={fontSize}
      showLfoControls={definition.drawerHandle && state.drawerFeatureEnabled}
      drawerOpen={state.drawerOpen}
      lfoRunning={state.lfoEnabled}
      initialWaveform={state.waveform}
      initialFrequency={state.frequency}
      initialPhase={state.phase}
      initialAudioResponse={state.audioResponse}
      initialAudioSamplePosition={state.audioSamplePosition}
      onUserChange={(value: number) => actions.setSliderValue(sliderId, value)}
      onAnimatedUpdate={(value: number) => actions.setSliderValue(sliderId, value)}
      onDrawerOpenChange={(open: boolean) => actions.setSliderDrawerOpen(sliderId, open)}
      onDrawerLinesChange={(lines: [number, number]) => actions.setSliderDrawerLines(sliderId, lines)}
      onLfoEnabledChange={(enabled: boolean) => actions.setSliderLfoEnabled(sliderId, enabled)}
      onWaveformChange={(waveform: Waveform) => actions.setSliderWaveform(sliderId, waveform)}
      onFrequencyChange={(frequency: number) => actions.setSliderFrequency(sliderId, frequency)}
      onPhaseChange={(phase: number) => actions.setSliderPhase(sliderId, phase)}
      onAudioResponseChange={(value: number) => actions.setSliderAudioResponse(sliderId, value)}
      onAudioSamplePositionChange={(value: number) => actions.setSliderAudioSamplePosition(sliderId, value)}
      audioBins={audioBins}
      audioBinCount={audioBinCount}
      audioMaxMagnitude={audioMaxMagnitude}
      style={isFullWidth ? { width: '100%' } : undefined}
    />
  );
}


function EditableRectPOC() {
  const { columns, customSliderId } = useSliderLayout();
  const actions = useSliderActions();
  const selectionGridState = useSelectionGridState(DEFAULT_SELECTION_GRID_ID);
  const selectionGridActions = useSelectionGridActions();
  const customState = useSliderState(customSliderId);
  const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<string>('lfo-slider');
  const [dropdownValue, setDropdownValue] = React.useState<string>(DROPDOWN_OPTIONS[0].value);
  const [darkDropdownValue, setDarkDropdownValue] = React.useState<string>(DROPDOWN_OPTIONS[1].value);
  const [segmentCompareValue, setSegmentCompareValue] = React.useState<number>(64);
  const [segmentModeValue, setSegmentModeValue] = React.useState<string>(SEGMENT_BAR_MODES[1].value);
  const [segmentBorderStyle, setSegmentBorderStyle] = React.useState<SegmentBarBorderStyle>("a");
  const [dropdownSliderValue, setDropdownSliderValue] = React.useState<number>(42);
  const [dropdownSliderValueDark, setDropdownSliderValueDark] = React.useState<number>(58);
  const [dateSliderValue, setDateSliderValue] = React.useState<number>(32);
  const [timeSliderValue, setTimeSliderValue] = React.useState<number>(3600);
  const [dateDrawerLines, setDateDrawerLines] = React.useState<[number, number]>([
    DATE_SLIDER_MIN,
    DATE_SLIDER_MAX,
  ]);
  const [timeDrawerLines, setTimeDrawerLines] = React.useState<[number, number]>([
    TIME_SLIDER_MIN,
    TIME_SLIDER_MAX,
  ]);
  const dropdownSelectionLabel = React.useMemo(
    () => DROPDOWN_OPTIONS.find((option) => option.value === dropdownValue)?.label ?? dropdownValue,
    [dropdownValue],
  );
  const darkDropdownSelectionLabel = React.useMemo(
    () => DROPDOWN_OPTIONS.find((option) => option.value === darkDropdownValue)?.label ?? darkDropdownValue,
    [darkDropdownValue],
  );
  const segmentModeSelection = React.useMemo(
    () => SEGMENT_BAR_MODES.find((option) => option.value === segmentModeValue),
    [segmentModeValue],
  );
  const cycleSegmentBorderStyle = () => {
    setSegmentBorderStyle((prev) => {
      const index = SEGMENT_BORDER_STYLES.indexOf(prev);
      const next = SEGMENT_BORDER_STYLES[(index + 1) % SEGMENT_BORDER_STYLES.length];
      return next;
    });
  };

  const cycleAudioBorderStyle = () => {
    setAudioBorderStyle((prev) => {
      if (prev === 'a') return 'b';
      if (prev === 'b') return 'none';
      return 'a';
    });
  };
  const handleTogglePalette = () => {
    setPreviewDarkMode((value) => !value);
  };

  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 16;
  const columnBreakpointQuery = '(max-width: 900px)';
  const [singleColumnLayout, setSingleColumnLayout] = React.useState<boolean>(() => (
    typeof window !== 'undefined' ? window.matchMedia(columnBreakpointQuery).matches : false
  ));
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(columnBreakpointQuery);
    const handleMediaChange = (event: MediaQueryListEvent) => setSingleColumnLayout(event.matches);
    setSingleColumnLayout(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handleMediaChange);
      return () => media.removeEventListener('change', handleMediaChange);
    }
    media.addListener(handleMediaChange);
    return () => media.removeListener(handleMediaChange);
  }, []);

  const customDefinition = useSliderDefinition(customSliderId);
  const customSliderWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [customSliderWidth, setCustomSliderWidth] = React.useState<number>(customDefinition.width);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateWidth = () => {
      const wrapper = customSliderWrapperRef.current;
      const parent = wrapper?.parentElement;
      if (!wrapper || !parent) return;
      const parentWidth = parent.clientWidth;
      const containerWidth = parent.parentElement?.clientWidth ?? parentWidth;
      const siblings = Array.from(parent.children);
      const otherWidth = siblings.reduce((total, child) => {
        if (child === wrapper) return total;
        const rect = child.getBoundingClientRect();
        return total + rect.width;
      }, 0);
      const computed = window.getComputedStyle(parent);
      const gapValue = parseFloat(computed.columnGap || computed.gap || '0') || 0;
      const totalGaps = gapValue * Math.max(0, siblings.length - 1);
      const available = Math.max(containerWidth - otherWidth - totalGaps, 0);
      const next = available > 0
        ? Math.min(customDefinition.width, available)
        : Math.min(customDefinition.width, containerWidth);
      setCustomSliderWidth((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => updateWidth())
      : null;
    if (resizeObserver && customSliderWrapperRef.current?.parentElement) {
      resizeObserver.observe(customSliderWrapperRef.current.parentElement);
    }
    return () => {
      window.removeEventListener('resize', updateWidth);
      resizeObserver?.disconnect();
    };
  }, [customDefinition.width]);

  const [sliderFontSize, setSliderFontSize] = React.useState<number>(12);
  const [audioControlFontSize, setAudioControlFontSize] = React.useState<number>(12);
  const [audioControlMaxWidth, setAudioControlMaxWidth] = React.useState<number>(50);
  const [audioPreviewValue, setAudioPreviewValue] = React.useState<number>(42);
  const [audioBorderStyle, setAudioBorderStyle] = React.useState<AudioControlsBorder>('a');
  const [iconToggleOn, setIconToggleOn] = React.useState(false);
  const [iconCycleValue, setIconCycleValue] = React.useState<string>('play');
  const CONTROL_FONT_SIZE = 12;
  const columnGap = 5;
  const MAX_COLUMN_WIDTH = 440;
  const rowGap = '3px';
  const columnButtonSize = 20;
  const MIN_AUDIO_WIDTH = 20;
  const MAX_AUDIO_WIDTH = 100;
  const AUDIO_WIDTH_STEP = 10;
  const layoutGap = '1.25rem';
  const toggleIconSize = Math.max(columnButtonSize - 4, 12);
  const controlIconSize = Math.max(columnButtonSize - 6, 12);
  const horizontalPadding = Math.max(columnGap * 2, 16);
const tabs = [
    { value: 'lfo-slider', label: 'LFO Slider' },
    { value: 'icon-button', label: 'Icon Button' },
    { value: 'segment-bar', label: 'Segment Bar' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'selection-grid', label: 'Selection Grid' },
    { value: 'typegpu-test', label: 'TypeGPU Test' },
    { value: 'audio-controls', label: 'Audio Controls' },
  ];
  const tabsRootStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: layoutGap,
    width: '100%',
    alignItems: 'center',
  };
  const tabsListStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  };
  const tabBorderColor = previewDarkMode ? flexoki.base['200'] : flexoki.base['600'];
  const tabActiveBg = previewDarkMode ? flexoki.base['200'] : flexoki.base['700'];
  const tabActiveColor = previewDarkMode ? flexoki.base['900'] : flexoki.paper;
  const tabInactiveColor = previewDarkMode ? flexoki.base['200'] : flexoki.base['700'];
  const tabBodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: layoutGap,
    width: '100%',
  };
  const getTabTriggerStyle = (value: string): React.CSSProperties => ({
    padding: '0.35rem 0.9rem',
    borderRadius: 6,
    border: `1px solid ${tabBorderColor}`,
    background: activeTab === value ? tabActiveBg : 'transparent',
    color: activeTab === value ? tabActiveColor : tabInactiveColor,
    fontSize: CONTROL_FONT_SIZE,
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1,
    transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
    boxShadow: activeTab === value ? `0 0 0 1px ${tabActiveBg}` : 'none',
  });
  const buttonBackground = previewDarkMode ? flexoki.base['100'] : flexoki.base['700'];
  const buttonForeground = previewDarkMode ? flexoki.base['700'] : flexoki.base['50'];
  const iconButtonStyle: React.CSSProperties = {
    width: columnButtonSize,
    height: columnButtonSize,
    borderRadius: 3,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: CONTROL_FONT_SIZE,
    fontWeight: 600,
    lineHeight: 1,
    userSelect: 'none',
    padding: 2,
    transition: 'background 120ms ease, color 120ms ease',
    background: buttonBackground,
    color: buttonForeground,
  };
  const iconButtonBorderStyles: Array<'a' | 'b' | 'none'> = ['a', 'b', 'none'];
  const iconButtonFontSizes = [10, 12, 14, 16];
  const iconButtonColorA = buttonForeground;
  const iconButtonColorB = buttonBackground;
  const iconCycleOptions = [
    {
      value: 'play',
      icon: <Play strokeWidth={1.6} />,
      ariaLabel: 'Play',
    },
    {
      value: 'pause',
      icon: <Pause strokeWidth={1.6} />,
      colorA: previewDarkMode ? flexoki.base['50'] : flexoki.base['900'],
      colorB: previewDarkMode ? flexoki.blue['600'] : flexoki.blue['200'],
      ariaLabel: 'Pause',
    },
    {
      value: 'wave',
      icon: <AudioWaveform strokeWidth={1.6} />,
      colorA: previewDarkMode ? flexoki.base['50'] : flexoki.base['900'],
      colorB: previewDarkMode ? flexoki.orange['600'] : flexoki.orange['200'],
      ariaLabel: 'Waveform',
    },
  ];
  const selectionPreviewMode = selectionGridState.previewMode;
  const selectionPreviewModeIndex = SELECTION_PREVIEW_MODE_SEQUENCE.indexOf(selectionPreviewMode);
  const safeSelectionPreviewModeIndex = selectionPreviewModeIndex >= 0 ? selectionPreviewModeIndex : 0;
  const nextSelectionPreviewMode = SELECTION_PREVIEW_MODE_SEQUENCE[
    (safeSelectionPreviewModeIndex + 1) % SELECTION_PREVIEW_MODE_SEQUENCE.length
  ];
  const SelectionPreviewModeIcon = SELECTION_PREVIEW_MODE_ICON[selectionPreviewMode];
  const selectionPreviewModeTitle = SELECTION_PREVIEW_MODE_TITLE[selectionPreviewMode];
  const nextSelectionPreviewModeTitle = SELECTION_PREVIEW_MODE_TITLE[nextSelectionPreviewMode];
  const selectionPreviewButtonLabel = `Switch to ${nextSelectionPreviewModeTitle.toLowerCase()}`;
  const selectionPreviewButtonTitle = `${selectionPreviewModeTitle} (click to switch to ${nextSelectionPreviewModeTitle.toLowerCase()})`;
  const terrainToggleStyle: React.CSSProperties = selectionPreviewMode === "gradient"
    ? {
      ...iconButtonStyle,
      background: flexoki.base['500'],
      color: flexoki.base['50'],
    }
    : iconButtonStyle;
  const selectionGridControlStackStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
  const selectionGridAlignmentOptions: Array<{ value: SelectionGridAlignment; label: string }> = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ];
  const selectionGridSliderColorA = previewDarkMode ? flexoki.base['100'] : flexoki.base['700'];
  const selectionGridSliderColorB = previewDarkMode ? flexoki.base['700'] : flexoki.base['50'];
  const selectionGridAlignmentButtonStyle: React.CSSProperties = {
    background: previewDarkMode ? flexoki.base['200'] : flexoki.base['700'],
    color: previewDarkMode ? flexoki.base['900'] : flexoki.base['50'],
    padding: '0.35rem 0.9rem',
    borderRadius: 4,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background 120ms ease, color 120ms ease, transform 120ms ease',
    boxShadow: '0 0 0 1px transparent',
  };
  const selectionGridAlignmentActiveStyle: React.CSSProperties = {
    background: previewDarkMode ? flexoki.base['300'] : flexoki.base['500'],
    color: previewDarkMode ? flexoki.base['950'] : flexoki.base['50'],
    boxShadow: `0 0 0 1px ${previewDarkMode ? flexoki.base['300'] : flexoki.base['500']}`,
  };
  const {
    squareScale: selectionSquareScale,
    sunAltitudeDeg: selectionSunAltitude,
    sunAzimuthDeg: selectionSunAzimuth,
    squareAlignment: selectionSquareAlignment,
  } = selectionGridState;
  const fontSizeControlStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: CONTROL_FONT_SIZE,
    color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'],
  };
  const fontSizeButtonStyle: React.CSSProperties = {
    ...iconButtonStyle,
    width: columnButtonSize,
    height: columnButtonSize,
  };
  const customDrawerEnabled = customState.drawerFeatureEnabled;
  const customDrawerButtonStyle: React.CSSProperties = {
    ...iconButtonStyle,
    background: customDrawerEnabled ? buttonBackground : flexoki.base['500'],
    color: customDrawerEnabled ? buttonForeground : flexoki.base['50'],
  };
  const customBorder = customState.border ?? 'left';
  const customNextBorder = BORDER_MODES[(BORDER_MODES.indexOf(customBorder) + 1) % BORDER_MODES.length];
  const [customSwapFlipped, setCustomSwapFlipped] = React.useState(false);
  const handleSwapCustomColors = () => {
    actions.swapColumnSliderColors([customSliderId]);
    setCustomSwapFlipped((prev) => !prev);
  };
  const handleCycleCustomBorder = () => {
    actions.setColumnBorder([customSliderId], customNextBorder);
  };

  return (
    <FrameLoopProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: layoutGap,
          width: '100%',
          minHeight: '100vh',
          paddingTop: `calc(2rem + env(safe-area-inset-top, 0px))`,
          paddingLeft: `calc(${horizontalPadding}px + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(${horizontalPadding}px + env(safe-area-inset-right, 0px))`,
          paddingBottom: `calc(4rem + env(safe-area-inset-bottom, 0px))`,
          boxSizing: 'border-box',
          background: previewDarkMode ? '#1C1B1A' : flexoki.paper,
          color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'],
          transition: 'none',
        }}
      >
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={tabsRootStyle}>
          <Tabs.List style={tabsListStyle} aria-label="UI components">
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value} style={getTabTriggerStyle(tab.value)}>
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="lfo-slider" style={tabBodyStyle}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleTogglePalette}
                aria-pressed={previewDarkMode}
                aria-label={previewDarkMode ? 'Switch to light preview' : 'Switch to dark preview'}
                style={{
                  width: columnButtonSize,
                  height: columnButtonSize,
                  borderRadius: 3,
                  border: `1px solid ${previewDarkMode ? flexoki.purple['100'] : flexoki.yellow['700']}`,
                  background: previewDarkMode ? flexoki.purple['700'] : flexoki.yellow['100'],
                  color: previewDarkMode ? flexoki.purple['100'] : flexoki.yellow['700'],
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: CONTROL_FONT_SIZE,
                  fontWeight: 600,
                  lineHeight: 1,
                  userSelect: 'none',
                  padding: 2,
                }}
              >
                {previewDarkMode ? (
                  <Moon size={toggleIconSize} strokeWidth={1.8} />
                ) : (
                  <Sun size={toggleIconSize} strokeWidth={1.8} />
                )}
              </button>
            </div>
            <div style={fontSizeControlStyle}>
              <button
                type="button"
                aria-label="Decrease font size"
                title="Decrease font size"
                style={fontSizeButtonStyle}
                onClick={() => setSliderFontSize((prev) => Math.max(MIN_FONT_SIZE, prev - 1))}
                disabled={sliderFontSize <= MIN_FONT_SIZE}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>−</span>
              </button>
              <span>Font Size: {sliderFontSize}</span>
              <button
                type="button"
                aria-label="Increase font size"
                title="Increase font size"
                style={fontSizeButtonStyle}
                onClick={() => setSliderFontSize((prev) => Math.min(MAX_FONT_SIZE, prev + 1))}
                disabled={sliderFontSize >= MAX_FONT_SIZE}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              </button>
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'], textAlign: 'center' }}>
              Examples using{' '}
              <a
                href="https://stephango.com/flexoki"
                style={{ color: previewDarkMode ? flexoki.blue['200'] : flexoki.blue['500'], textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Flexoki
              </a>{' '}
              colors:
            </h2>
            <div
              style={{
                display: 'grid',
                width: '100%',
                gap: columnGap,
                justifyItems: 'stretch',
                alignItems: 'flex-start',
                gridTemplateColumns: singleColumnLayout
                  ? `minmax(0, ${MAX_COLUMN_WIDTH}px)`
                  : 'repeat(3, minmax(0, 1fr))',
                justifyContent: singleColumnLayout ? 'center' : 'stretch',
              }}
            >
              {columns.map((column, columnIndex) => (
                <ColumnView
                  key={column.id}
                  column={column}
                  columnIndex={columnIndex}
                  columnButtonSize={columnButtonSize}
                  rowGap={rowGap}
                  fontSize={sliderFontSize}
                  isDarkMode={previewDarkMode}
                  maxColumnWidth={singleColumnLayout ? MAX_COLUMN_WIDTH : undefined}
                />
              ))}
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'] }}>Custom colors:</h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CustomColorPopover
                label="Left color"
                previewColor={customState.colorA}
                accentColor={customState.colorB}
                isDarkMode={previewDarkMode}
                triggerStyle={iconButtonStyle}
                onSelect={(color) => actions.setSliderColors(customSliderId, color, customState.colorB)}
              />
              <button
                type="button"
                onClick={() => actions.setSliderDrawerFeatureEnabled(customSliderId, !customDrawerEnabled)}
                aria-pressed={customDrawerEnabled}
                aria-label={customDrawerEnabled ? 'Disable custom slider drawer' : 'Enable custom slider drawer'}
                title="Toggle custom slider drawer"
                style={customDrawerButtonStyle}
              >
                {customDrawerEnabled ? (
                  <AudioWaveform size={controlIconSize} strokeWidth={2} />
                ) : (
                  <Minus size={controlIconSize} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                onClick={handleSwapCustomColors}
                aria-label="Swap custom slider colors"
                title="Swap colors"
                style={iconButtonStyle}
              >
                <ArrowLeftRight
                  size={controlIconSize}
                  strokeWidth={2}
                  style={{ transform: customSwapFlipped ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 160ms ease' }}
                />
              </button>
              <button
                type="button"
                onClick={handleCycleCustomBorder}
                aria-label="Cycle custom slider border"
                title={"Border color left/right/none"}
                style={iconButtonStyle}
              >
                {React.createElement(BORDER_ICONS[customBorder], { size: controlIconSize, strokeWidth: 2 })}
              </button>
              <CustomColorPopover
                label="Right color"
                previewColor={customState.colorB}
                accentColor={customState.colorA}
                isDarkMode={previewDarkMode}
                triggerStyle={iconButtonStyle}
                onSelect={(color) => actions.setSliderColors(customSliderId, customState.colorA, color)}
              />
            </div>
            <div
              ref={customSliderWrapperRef}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <ConnectedSlider
                sliderId={customSliderId}
                fontSize={sliderFontSize}
                widthOverride={customSliderWidth}
                isFullWidth
              />
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'] }}>
                Calendar-style formatting
              </h3>
              <LFOSlider
                label="Mission Day"
                min={DATE_SLIDER_MIN}
                max={DATE_SLIDER_MAX}
                step={DATE_SLIDER_STEP}
                width={360}
                defaultValue={dateSliderValue}
                colorA={flexoki.green['700']}
                colorB={previewDarkMode ? flexoki.base['100'] : flexoki.base['50']}
                border="left"
                fontSize={sliderFontSize}
                displayFormatterPreset="dayOfYear"
                displayFormatterPresetOptions={{ dayOfYear: DATE_SLIDER_PRESET_OPTIONS }}
                showLfoControls
                lfoRange={dateDrawerLines}
                onDrawerLinesChange={setDateDrawerLines}
                onUserChange={(value: number) => setDateSliderValue(value)}
                onAnimatedUpdate={(value: number) => setDateSliderValue(value)}
              />
              <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.85 }}>
                Selected: {formatDateLabel(dateSliderValue)}
              </span>
              <div style={{ width: '100%', height: 1, background: previewDarkMode ? flexoki.base['200'] : flexoki.base['300'], opacity: 0.3 }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'] }}>
                HH:MM:SS formatting
              </h3>
              <LFOSlider
                label="Runtime"
                min={TIME_SLIDER_MIN}
                max={TIME_SLIDER_MAX}
                step={TIME_SLIDER_STEP}
                width={360}
                defaultValue={timeSliderValue}
                colorA={previewDarkMode ? flexoki.base['200'] : flexoki.base['900']}
                colorB={previewDarkMode ? flexoki.blue['400'] : flexoki.blue['100']}
                border="right"
                fontSize={sliderFontSize}
                displayFormatterPreset="time"
                displayFormatterPresetOptions={{ time: TIME_SLIDER_PRESET_OPTIONS }}
                showLfoControls
                lfoRange={timeDrawerLines}
                onDrawerLinesChange={setTimeDrawerLines}
                onUserChange={(value: number) => setTimeSliderValue(value)}
                onAnimatedUpdate={(value: number) => setTimeSliderValue(value)}
              />
              <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.85 }}>
                Selected: {formatTimeLabel(timeSliderValue)}
              </span>
            </div>
          </Tabs.Content>
          <Tabs.Content value="icon-button" style={tabBodyStyle}>
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'],
              }}
            >
              <p style={{ margin: 0, fontSize: CONTROL_FONT_SIZE }}>
                Icon Button sticks to the two-color palette with A/B/none borders and supports momentary, toggle, and cycle behavior.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>Momentary</span>
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                }}
              >
                {iconButtonBorderStyles.map((borderStyle) => (
                  <div
                    key={borderStyle}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: CONTROL_FONT_SIZE, textTransform: 'uppercase' }}>{borderStyle}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <IconButton
                        borderStyle={borderStyle}
                        fontSize={CONTROL_FONT_SIZE}
                        colorA={iconButtonColorA}
                        colorB={iconButtonColorB}
                        aria-label={`${borderStyle} icon button`}
                      >
                        <Sun strokeWidth={1.6} />
                      </IconButton>
                      <IconButton
                        borderStyle={borderStyle}
                        fontSize={CONTROL_FONT_SIZE}
                        colorA={iconButtonColorA}
                        colorB={iconButtonColorB}
                        aria-label={`${borderStyle} icon button alt`}
                      >
                        <Moon strokeWidth={1.6} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>Toggle</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <IconButton
                    behavior="toggle"
                    borderStyle="a"
                    fontSize={CONTROL_FONT_SIZE}
                    colorA={iconButtonColorA}
                    colorB={iconButtonColorB}
                    toggled={iconToggleOn}
                    onToggle={setIconToggleOn}
                    aria-label="Toggle action"
                  >
                    <ArrowLeftRight strokeWidth={1.6} />
                  </IconButton>
                  <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.7 }}>
                    {iconToggleOn ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>Cycle</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <IconButton
                    behavior="cycle"
                    borderStyle="a"
                    fontSize={CONTROL_FONT_SIZE}
                    colorA={iconButtonColorA}
                    colorB={iconButtonColorB}
                    options={iconCycleOptions}
                    value={iconCycleValue}
                    onChange={(next) => setIconCycleValue(next)}
                  />
                  <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.7 }}>
                    {iconCycleValue}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>Sizes</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {iconButtonFontSizes.map((size) => (
                    <IconButton
                      key={`icon-size-${size}`}
                      borderStyle="a"
                      fontSize={size}
                      colorA={iconButtonColorA}
                      colorB={iconButtonColorB}
                      aria-label={`Icon button size ${size}`}
                    >
                      <AudioWaveform strokeWidth={1.6} />
                    </IconButton>
                  ))}
                  <IconButton
                    borderStyle="a"
                    fontSize={CONTROL_FONT_SIZE}
                    colorA={iconButtonColorA}
                    colorB={iconButtonColorB}
                    disabled
                    aria-label="Disabled icon button"
                  >
                    <X strokeWidth={1.6} />
                  </IconButton>
                </div>
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="segment-bar" style={tabBodyStyle}>
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'],
              }}
            >
              <p style={{ margin: 0, fontSize: CONTROL_FONT_SIZE }}>
                Segment Bar slots options along the same mono-weight bar layout as the sliders. It behaves like a single-select
                radio group and sticks to the exact two-color palette you pass in.
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={cycleSegmentBorderStyle}
                  style={{
                    ...iconButtonStyle,
                    width: 110,
                    height: columnButtonSize,
                    fontSize: CONTROL_FONT_SIZE,
                  }}
                >
                  Border: {segmentBorderStyle.toUpperCase()}
                </button>
                <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>
                  (cycles A → B → none)
                </span>
              </div>
              <LFOSlider
                label="Segment Compare"
                min={0}
                max={100}
                step={1}
                width={420}
                defaultValue={segmentCompareValue}
                colorA={flexoki.orange['600']}
                colorB={flexoki.magenta['300']}
                border="left"
                fontSize={sliderFontSize}
                onUserChange={(value: number) => setSegmentCompareValue(value)}
                onAnimatedUpdate={(value: number) => setSegmentCompareValue(value)}
              />
              <SegmentBar
                options={SEGMENT_BAR_MODES}
                value={segmentModeValue}
                onChange={(next) => setSegmentModeValue(next)}
                colorA={flexoki.blue['600']}
                colorB={flexoki.blue['100']}
                borderStyle={segmentBorderStyle}
                width={420}
                fontSize={sliderFontSize}
              />
              <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.85 }}>
                Selected: {segmentModeSelection?.label ?? segmentModeValue}
              </span>
              {SEGMENT_BAR_DEMO_SETS.map((optionSet, index) => (
                <SegmentBar
                  key={`segment-demo-${index}`}
                  options={optionSet}
                  colorA={flexoki.blue['600']}
                  colorB={flexoki.blue['100']}
                  borderStyle={segmentBorderStyle}
                  width={420}
                  fontSize={sliderFontSize}
                />
              ))}
            </div>
          </Tabs.Content>
          <Tabs.Content value="dropdown" style={tabBodyStyle}>
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'],
              }}
            >
              <p style={{ margin: 0, fontSize: CONTROL_FONT_SIZE }}>
                A compact dropdown that reuses the same Flexoki accents as the sliders. It supports light/dark palettes,
                keyboard navigation, disabled options, and subtle helper text.
              </p>
              <Dropdown
                label="Waveform Source"
                options={DROPDOWN_OPTIONS}
                value={dropdownValue}
                onChange={(next) => setDropdownValue(next)}
                colorA={flexoki.cyan['600']}
                colorB={flexoki.base['50']}
                width={360}
                fontSize={sliderFontSize}
              />
              <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>
                Selected: {dropdownSelectionLabel}
              </span>
              <Dropdown
                label="Dark Mode Preview"
                options={DROPDOWN_OPTIONS}
                value={darkDropdownValue}
                onChange={(next) => setDarkDropdownValue(next)}
                colorA={flexoki.base['50']}
                colorB={flexoki.cyan['600']}
                width={360}
                fontSize={sliderFontSize}
              />
              <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.8 }}>
                Selected (dark): {darkDropdownSelectionLabel}
              </span>
              <Dropdown
                label="Compact List"
                options={DROPDOWN_SIMPLE_OPTIONS}
                colorA={flexoki.base['900']}
                colorB={flexoki.base['50']}
                width={360}
                fontSize={sliderFontSize}
              />
              <Dropdown
                label="Read-only Example"
                options={DROPDOWN_OPTIONS}
                defaultValue={DROPDOWN_OPTIONS[2].value}
                colorA={flexoki.orange['500']}
                colorB={flexoki.paper}
                width={360}
                disabled
                fontSize={sliderFontSize}
              />
              <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LFOSlider
                  label="Palette Compare Slider"
                  min={0}
                  max={100}
                  step={1}
                  width={360}
                  defaultValue={dropdownSliderValue}
                  colorA={flexoki.cyan['600']}
                  colorB={flexoki.base['50']}
                  border="left"
                  fontSize={sliderFontSize}
                  onUserChange={(value: number) => setDropdownSliderValue(value)}
                  onAnimatedUpdate={(value: number) => setDropdownSliderValue(value)}
                />
                <LFOSlider
                  label="Palette Compare Slider (Flipped)"
                  min={0}
                  max={100}
                  step={1}
                  width={360}
                  defaultValue={dropdownSliderValueDark}
                  colorA={flexoki.base['50']}
                  colorB={flexoki.cyan['600']}
                  border="right"
                  fontSize={sliderFontSize}
                  onUserChange={(value: number) => setDropdownSliderValueDark(value)}
                  onAnimatedUpdate={(value: number) => setDropdownSliderValueDark(value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <LFOSlider
                  label="Mission Day"
                  min={DATE_SLIDER_MIN}
                  max={DATE_SLIDER_MAX}
                  step={DATE_SLIDER_STEP}
                  width={360}
                  defaultValue={dateSliderValue}
                  colorA={flexoki.cyan['700']}
                  colorB={flexoki.base['100']}
                  border="left"
                  fontSize={sliderFontSize}
                  displayFormatterPreset="dayOfYear"
                  displayFormatterPresetOptions={{ dayOfYear: DATE_SLIDER_PRESET_OPTIONS }}
                  showLfoControls
                  lfoRange={dateDrawerLines}
                  onDrawerLinesChange={setDateDrawerLines}
                  onUserChange={(value: number) => setDateSliderValue(value)}
                  onAnimatedUpdate={(value: number) => setDateSliderValue(value)}
                />
                  <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.85 }}>
                    Selected: {formatDateLabel(dateSliderValue)}
                  </span>
                <LFOSlider
                  label="Mission Runtime"
                  min={TIME_SLIDER_MIN}
                  max={TIME_SLIDER_MAX}
                  step={TIME_SLIDER_STEP}
                  width={360}
                  defaultValue={timeSliderValue}
                  colorA={flexoki.cyan['800']}
                  colorB={flexoki.base['100']}
                  border="left"
                  fontSize={sliderFontSize}
                  displayFormatterPreset="time"
                  displayFormatterPresetOptions={{ time: TIME_SLIDER_PRESET_OPTIONS }}
                  showLfoControls
                  lfoRange={timeDrawerLines}
                  onDrawerLinesChange={setTimeDrawerLines}
                  onUserChange={(value: number) => setTimeSliderValue(value)}
                  onAnimatedUpdate={(value: number) => setTimeSliderValue(value)}
                />
                  <span style={{ fontSize: CONTROL_FONT_SIZE, opacity: 0.85 }}>
                    Selected runtime: {formatTimeLabel(timeSliderValue)}
                  </span>
                </div>
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="selection-grid" style={tabBodyStyle}>
            <div style={selectionGridControlStackStyle}>
              <LFOSlider
                label="Square Size"
                min={1}
                max={4}
                step={1}
                defaultValue={selectionSquareScale}
                width={360}
                mode="external"
                readExternal={() => selectionSquareScale}
                colorA={selectionGridSliderColorA}
                colorB={selectionGridSliderColorB}
                onUserChange={(value: number) => {
                  selectionGridActions.setSelectionGridSquareScale(DEFAULT_SELECTION_GRID_ID, value);
                }}
                onAnimatedUpdate={(value: number) => {
                  selectionGridActions.setSelectionGridSquareScale(DEFAULT_SELECTION_GRID_ID, value);
                }}
              />
              <LFOSlider
                label="Sun Altitude"
                min={0}
                max={90}
                step={1}
                defaultValue={selectionSunAltitude}
                width={360}
                mode="external"
                readExternal={() => selectionSunAltitude}
                colorA={selectionGridSliderColorA}
                colorB={selectionGridSliderColorB}
                onUserChange={(value: number) => {
                  selectionGridActions.setSelectionGridSunAltitude(DEFAULT_SELECTION_GRID_ID, value);
                }}
                onAnimatedUpdate={(value: number) => {
                  selectionGridActions.setSelectionGridSunAltitude(DEFAULT_SELECTION_GRID_ID, value);
                }}
              />
              <LFOSlider
                label="Sun Azimuth"
                min={0}
                max={360}
                step={1}
                defaultValue={selectionSunAzimuth}
                width={360}
                mode="external"
                readExternal={() => selectionSunAzimuth}
                colorA={selectionGridSliderColorA}
                colorB={selectionGridSliderColorB}
                onUserChange={(value: number) => {
                  selectionGridActions.setSelectionGridSunAzimuth(DEFAULT_SELECTION_GRID_ID, value);
                }}
                onAnimatedUpdate={(value: number) => {
                  selectionGridActions.setSelectionGridSunAzimuth(DEFAULT_SELECTION_GRID_ID, value);
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {selectionGridAlignmentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectionGridActions.setSelectionGridAlignment(DEFAULT_SELECTION_GRID_ID, option.value)}
                    aria-pressed={selectionSquareAlignment === option.value}
                    style={{
                      ...selectionGridAlignmentButtonStyle,
                      ...(selectionSquareAlignment === option.value ? selectionGridAlignmentActiveStyle : {}),
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => selectionGridActions.setSelectionGridPreviewMode(
                DEFAULT_SELECTION_GRID_ID,
                nextSelectionPreviewMode,
              )}
              aria-label={selectionPreviewButtonLabel}
              title={selectionPreviewButtonTitle}
              style={terrainToggleStyle}
            >
              <SelectionPreviewModeIcon size={controlIconSize} strokeWidth={2} />
            </button>
            <SelectionGrid
              gridId={DEFAULT_SELECTION_GRID_ID}
              previewDarkMode={previewDarkMode}
              layoutGap={layoutGap}
              colorA={previewDarkMode ? flexoki.base['50'] : "#ffffff"}
              colorB={flexoki.base['50']}
              maxHeightUnits={24}
            />
          </Tabs.Content>
          <Tabs.Content value="typegpu-test" style={tabBodyStyle}>
            <TypeGPUTest />
          </Tabs.Content>
          <Tabs.Content value="audio-controls" style={tabBodyStyle}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div style={fontSizeControlStyle}>
                <button
                  type="button"
                  aria-label="Decrease audio control font size"
                  title="Decrease audio control font size"
                  style={fontSizeButtonStyle}
                  onClick={() => setAudioControlFontSize((prev) => Math.max(MIN_FONT_SIZE, prev - 1))}
                  disabled={audioControlFontSize <= MIN_FONT_SIZE}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>−</span>
                </button>
                <span>Audio font size: {audioControlFontSize}</span>
                <button
                  type="button"
                  aria-label="Increase audio control font size"
                  title="Increase audio control font size"
                  style={fontSizeButtonStyle}
                  onClick={() => setAudioControlFontSize((prev) => Math.min(MAX_FONT_SIZE, prev + 1))}
                  disabled={audioControlFontSize >= MAX_FONT_SIZE}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                </button>
              </div>
              <div style={fontSizeControlStyle}>
                <button
                  type="button"
                  aria-label="Decrease audio control width"
                  title="Decrease audio control width"
                  style={fontSizeButtonStyle}
                  onClick={() => setAudioControlMaxWidth((prev) => Math.max(MIN_AUDIO_WIDTH, prev - AUDIO_WIDTH_STEP))}
                  disabled={audioControlMaxWidth <= MIN_AUDIO_WIDTH}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>−</span>
                </button>
                <span>Audio width: {audioControlMaxWidth}%</span>
                <button
                  type="button"
                  aria-label="Increase audio control width"
                  title="Increase audio control width"
                  style={fontSizeButtonStyle}
                  onClick={() => setAudioControlMaxWidth((prev) => Math.min(MAX_AUDIO_WIDTH, prev + AUDIO_WIDTH_STEP))}
                  disabled={audioControlMaxWidth >= MAX_AUDIO_WIDTH}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                </button>
              </div>
              <div style={{ width: '100%', maxWidth: `min(720px, ${audioControlMaxWidth}vw)` }}>
                <AudioControls
                  fontSize={audioControlFontSize}
                  colorA={flexoki.red['600']}
                  colorB={flexoki.red['100']}
                  borderStyle={audioBorderStyle}
                />
              </div>
              <div style={{ width: '100%', maxWidth: `min(720px, ${audioControlMaxWidth}vw)`, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={cycleAudioBorderStyle}
                  style={{
                    ...iconButtonStyle,
                    width: 140,
                    fontSize: CONTROL_FONT_SIZE,
                  }}
                >
                  Audio border: {audioBorderStyle.toUpperCase()}
                </button>
                <LFOSlider
                  label="Audio Preview"
                  min={0}
                  max={100}
                  step={1}
                  width="100%"
                  defaultValue={audioPreviewValue}
                  colorA={flexoki.base['600']}
                  colorB={flexoki.base['50']}
                  border="left"
                  fontSize={12}
                  onUserChange={setAudioPreviewValue}
                  onAnimatedUpdate={setAudioPreviewValue}
                />
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </FrameLoopProvider>
  );
}

export default function App() {
  return (
    <SliderStoreProvider>
      <EditableRectPOC />
    </SliderStoreProvider>
  );
}
