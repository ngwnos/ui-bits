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
import { CustomColorPopover, SelectionGrid, TypeGPUTest } from "./components";
import LFOSlider, { FrameLoopProvider, type SliderBorder } from "./components/LFOSlider";
import type { Waveform } from "./lfo";
import { flexoki } from "./flexoki";
import {
  SliderStoreProvider,
  useSliderActions,
  useSliderDefinition,
  useSliderLayout,
  useSliderState,
  useSliderStoreState,
  useSelectionGridState,
  useSelectionGridActions,
  type SelectionGridPreviewMode,
  type SliderRuntimeState,
  type SliderId,
} from "./sliderStore";
import { DEFAULT_SELECTION_GRID_ID } from "./selectionGridIds";

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
  const resolvedWidth = widthOverride ?? definition.width;

  return (
    <LFOSlider
      label={definition.label}
      min={definition.min}
      max={definition.max}
      step={definition.step}
      defaultValue={state.value}
      width={resolvedWidth}
      drawerLines={state.drawerLines}
      leftColor={state.leftColor}
      rightColor={state.rightColor}
      border={state.border}
      fontSize={fontSize}
      drawerHandle={definition.drawerHandle}
      drawerFeatureEnabled={state.drawerFeatureEnabled}
      columnDrawerOpen={state.drawerOpen}
      columnLfoEnabled={state.lfoEnabled}
      initialWaveform={state.waveform}
      initialFrequency={state.frequency}
      initialPhase={state.phase}
      onUserChange={(value: number) => actions.setSliderValue(sliderId, value)}
      onAnimatedUpdate={(value: number) => actions.setSliderValue(sliderId, value)}
      onDrawerOpenChange={(open: boolean) => actions.setSliderDrawerOpen(sliderId, open)}
      onDrawerLinesChange={(lines: [number, number]) => actions.setSliderDrawerLines(sliderId, lines)}
      onLfoEnabledChange={(enabled: boolean) => actions.setSliderLfoEnabled(sliderId, enabled)}
      onWaveformChange={(waveform: Waveform) => actions.setSliderWaveform(sliderId, waveform)}
      onFrequencyChange={(frequency: number) => actions.setSliderFrequency(sliderId, frequency)}
      onPhaseChange={(phase: number) => actions.setSliderPhase(sliderId, phase)}
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
  const CONTROL_FONT_SIZE = 12;
  const columnGap = 5;
  const MAX_COLUMN_WIDTH = 440;
  const rowGap = '3px';
  const columnButtonSize = 20;
  const layoutGap = '1.25rem';
  const toggleIconSize = Math.max(columnButtonSize - 4, 12);
  const controlIconSize = Math.max(columnButtonSize - 6, 12);
  const horizontalPadding = Math.max(columnGap * 2, 16);
const tabs = [
    { value: 'lfo-slider', label: 'LFO Slider' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'selection-grid', label: 'Selection Grid' },
    { value: 'typegpu-test', label: 'TypeGPU Test' },
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
                previewColor={customState.leftColor}
                accentColor={customState.rightColor}
                isDarkMode={previewDarkMode}
                triggerStyle={iconButtonStyle}
                onSelect={(color) => actions.setSliderColors(customSliderId, color, customState.rightColor)}
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
                previewColor={customState.rightColor}
                accentColor={customState.leftColor}
                isDarkMode={previewDarkMode}
                triggerStyle={iconButtonStyle}
                onSelect={(color) => actions.setSliderColors(customSliderId, customState.leftColor, color)}
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
          </Tabs.Content>
          <Tabs.Content value="dropdown" style={tabBodyStyle}>
            <p style={{ fontSize: CONTROL_FONT_SIZE, color: previewDarkMode ? '#FFFCF0' : flexoki.base['700'] }}>
              Dropdown component coming soon.
            </p>
          </Tabs.Content>
          <Tabs.Content value="selection-grid" style={tabBodyStyle}>
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
              colorB={flexoki.base['50']}
              textColor={previewDarkMode ? flexoki.base['50'] : "#ffffff"}
              maxHeightUnits={24}
            />
          </Tabs.Content>
          <Tabs.Content value="typegpu-test" style={tabBodyStyle}>
            <TypeGPUTest />
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
