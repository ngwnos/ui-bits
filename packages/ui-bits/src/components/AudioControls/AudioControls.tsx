import React from "react";
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimationSuspensionProvider, useAnimationSuspended } from "../../animationSuspension";
import {
  createAudioAnalysisStore,
  useAudioAnalysisStore,
  type AudioAnalysisActions,
  type AudioAnalysisStore,
} from "../../audioAnalysis";
import { useControlValue, useResolvedControlIdPrefix } from "../../controlStore";
import { useFrame } from "../../frameLoop";
import { flexoki } from "../../flexoki";
import { usePanelTheme } from "../../panelGap";
import IconButton from "../IconButton";
import LFOSlider from "../LFOSlider";
import SegmentBar from "../SegmentBar";
import AudioFFTWindow from "./AudioFFTWindow";
import {
  createSmoothingState,
  processBinsFromBytes,
  weightFromTimeMs,
  type GaussianKernel,
  type SmoothingState,
} from "./binProcessing";

export type AudioControlsBorder = 'a' | 'b' | 'none';
export type AudioControlsBinInterpolation = 'discrete' | 'interpolated';
export type AudioControlsSource =
  | { type: "buffer"; src: string; loop?: boolean }
  | { type: "mediaStream"; stream: MediaStream; context?: AudioContext }
  | { type: "audioNode"; node: AudioNode & { context: AudioContext } };

export interface AudioControlsControlIds {
  playing?: string;
  muted?: string;
  binCount?: string;
  binInterpolation?: string;
  frequencyMin?: string;
  frequencyMax?: string;
  fftAttack?: string;
  fftRelease?: string;
  fftBlurSigma?: string;
  analyserSmoothing?: string;
}

export interface AudioControlsProps {
  ariaLabel?: string;
  fontSize?: number;
  colorA?: string;
  colorB?: string;
  borderStyle?: AudioControlsBorder;
  source: AudioControlsSource;
  heightUnits?: number;
  suspended?: boolean;
  audioAnalysisStore?: AudioAnalysisStore | null;
  controlIdPrefix?: string;
  controlIds?: AudioControlsControlIds;
  defaultPlaying?: boolean;
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  defaultMuted?: boolean;
  muted?: boolean;
  onMutedChange?: (muted: boolean) => void;
  defaultBinCount?: number;
  binCount?: number;
  onBinCountChange?: (count: number) => void;
  defaultBinInterpolation?: AudioControlsBinInterpolation;
  binInterpolation?: AudioControlsBinInterpolation;
  onBinInterpolationChange?: (mode: AudioControlsBinInterpolation) => void;
  defaultFrequencyMin?: number;
  frequencyMin?: number;
  onFrequencyMinChange?: (frequencyHz: number) => void;
  defaultFrequencyMax?: number;
  frequencyMax?: number;
  onFrequencyMaxChange?: (frequencyHz: number) => void;
  defaultFftAttack?: number;
  fftAttack?: number;
  onFftAttackChange?: (value: number) => void;
  defaultFftRelease?: number;
  fftRelease?: number;
  onFftReleaseChange?: (value: number) => void;
  defaultFftBlurSigma?: number;
  fftBlurSigma?: number;
  onFftBlurSigmaChange?: (value: number) => void;
  defaultAnalyserSmoothing?: number;
  analyserSmoothing?: number;
  onAnalyserSmoothingChange?: (value: number) => void;
}

function resolveColors(colorA?: string, colorB?: string) {
  const fallbackA = flexoki.base['700'];
  const fallbackB = flexoki.base['100'];
  const safeA = colorA ?? fallbackA;
  const safeB = colorB ?? fallbackB;
  return { safeA, safeB };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampBetween = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const DEFAULT_SAMPLE_RATE = 44100;
const DEFAULT_NYQUIST = DEFAULT_SAMPLE_RATE / 2;
const MIN_FREQ_HZ_GAP = 10;
const MIN_SLIDER_UNIT_PX = 18;
const CONTROL_GAP_PX = 8;
const ENVELOPE_STEP_MS = 10;
const MAX_ENVELOPE_MS = 500;
const DEFAULT_ATTACK_MS = 20;
const DEFAULT_RELEASE_MS = 80;
const PEAK_DECAY_DT_SEC = 1 / 60;
const BIN_INTERPOLATION_OPTIONS = [
  { value: "discrete", label: "Step" },
  { value: "interpolated", label: "Interp" },
];
const roundUnit = (value: number) => Math.round(clamp01(value) * 10) / 10;
const roundSigma = (value: number) => Math.round(clampBetween(value, 0, 3) * 10) / 10;
const roundMs = (value: number) => Math.round(clampBetween(value, 0, MAX_ENVELOPE_MS) / ENVELOPE_STEP_MS) * ENVELOPE_STEP_MS;

function normalizeBinInterpolation(
  value: AudioControlsBinInterpolation | undefined,
  fallback: AudioControlsBinInterpolation,
) {
  if (value === "discrete" || value === "interpolated") return value;
  return fallback;
}

function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
  storeId?: string,
) {
  const [storeValue, setStoreValue] = useControlValue<T>(storeId);
  const shouldUseStore = storeId !== undefined && value === undefined;
  const resolvedValueProp = shouldUseStore ? storeValue : value;
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = resolvedValueProp !== undefined;
  const resolved = isControlled ? resolvedValueProp : internal;
  const setValue = React.useCallback((next: T) => {
    if (!isControlled) {
      setInternal(next);
    }
    if (shouldUseStore) {
      setStoreValue(next);
    }
    onChange?.(next);
  }, [isControlled, onChange, setStoreValue, shouldUseStore]);
  React.useEffect(() => {
    if (!shouldUseStore || storeValue !== undefined) return;
    setStoreValue(defaultValue);
  }, [defaultValue, setStoreValue, shouldUseStore, storeValue]);
  return [resolved, setValue, isControlled] as const;
}

function computeSliderUnitPx(fontSize?: number) {
  const previewFontSize = fontSize || 16;
  const previewPaddingEm = 0.35;
  const previewPaddingPx = previewFontSize * previewPaddingEm;
  const previewLineHeight = 1;
  const baseLabelHeight = previewFontSize * previewLineHeight;
  return Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
    Math.round(previewFontSize + previewPaddingPx * 1.5),
    MIN_SLIDER_UNIT_PX,
  );
}

function safeCloseAudioContext(context: AudioContext | null) {
  if (!context || context.state === "closed") return;
  void context.close().catch(() => {});
}

export default function AudioControls({
  ariaLabel = "Audio controls",
  fontSize,
  colorA,
  colorB,
  borderStyle,
  source,
  heightUnits = 6,
  suspended,
  audioAnalysisStore,
  controlIdPrefix,
  controlIds,
  defaultPlaying = false,
  playing,
  onPlayingChange,
  defaultMuted = true,
  muted,
  onMutedChange,
  defaultBinCount = 256,
  binCount,
  onBinCountChange,
  defaultBinInterpolation = "discrete",
  binInterpolation,
  onBinInterpolationChange,
  defaultFrequencyMin = 0,
  frequencyMin,
  onFrequencyMinChange,
  defaultFrequencyMax = DEFAULT_NYQUIST,
  frequencyMax,
  onFrequencyMaxChange,
  defaultFftAttack = DEFAULT_ATTACK_MS,
  fftAttack,
  onFftAttackChange,
  defaultFftRelease = DEFAULT_RELEASE_MS,
  fftRelease,
  onFftReleaseChange,
  defaultFftBlurSigma = 0,
  fftBlurSigma,
  onFftBlurSigmaChange,
  defaultAnalyserSmoothing = 0.8,
  analyserSmoothing,
  onAnalyserSmoothingChange,
}: AudioControlsProps) {
  const isSuspended = useAnimationSuspended(suspended);
  const panelTheme = usePanelTheme();
  const resolvedFontSize = fontSize ?? panelTheme?.fontSize ?? 12;
  const resolvedBorderStyle = borderStyle ?? panelTheme?.borderStyle ?? 'a';
  const { safeA, safeB } = resolveColors(
    colorA ?? panelTheme?.colorA,
    colorB ?? panelTheme?.colorB,
  );
  const contextStore = useAudioAnalysisStore();
  const localStoreRef = React.useRef<AudioAnalysisStore | null>(null);
  const localStore = localStoreRef.current ?? createAudioAnalysisStore({
    bins: [],
    binCount: 0,
    maxMagnitude: 1,
  });
  if (!localStoreRef.current) {
    localStoreRef.current = localStore;
  }
  const resolvedStore = audioAnalysisStore ?? contextStore ?? localStore;
  const analysisActions = React.useMemo<EngineAnalysisActions>(() => ({
    setAudioBins: resolvedStore.setAudioBins,
    setAudioBinCount: resolvedStore.setAudioBinCount,
    setAudioMaxMagnitude: resolvedStore.setAudioMaxMagnitude,
    getBinCount: () => resolvedStore.getSnapshot().bins.length,
  }), [resolvedStore]);
  const isBufferSource = source.type === "buffer";
  const resolvedControlPrefix = useResolvedControlIdPrefix(controlIdPrefix, ariaLabel);
  const resolveControlId = React.useCallback((key: keyof AudioControlsControlIds) => {
    const explicitId = controlIds?.[key];
    if (explicitId) return explicitId;
    if (key === "playing" || key === "muted") return undefined;
    return resolvedControlPrefix ? `${resolvedControlPrefix}.${key}` : undefined;
  }, [controlIds, resolvedControlPrefix]);
  const [isPlaying, setIsPlaying] = useControllableState(
    playing,
    defaultPlaying,
    onPlayingChange,
    resolveControlId("playing"),
  );
  const [isMuted, setIsMuted] = useControllableState(
    muted,
    defaultMuted,
    onMutedChange,
    resolveControlId("muted"),
  );
  const playheadRatioRef = React.useRef<number>(0);
  const [isScrubbing, setIsScrubbing] = React.useState<boolean>(false);
  const [seekCommand, setSeekCommand] = React.useState<{ ratio: number; token: number } | null>(null);
  const seekTokenRef = React.useRef<number>(0);
  const clampBins = React.useCallback((value: number) => clampBetween(Math.round(value || 0), 1, 1024), []);
  const [binCountValue, setBinCountValue] = useControllableState(
    binCount,
    clampBins(defaultBinCount),
    onBinCountChange,
    resolveControlId("binCount"),
  );
  const [smoothingValueRaw, setSmoothingValueRaw] = useControllableState(
    analyserSmoothing,
    roundUnit(clamp01(defaultAnalyserSmoothing)),
    onAnalyserSmoothingChange,
    resolveControlId("analyserSmoothing"),
  );
  const [attackMsRaw, setAttackMsRaw] = useControllableState(
    fftAttack,
    roundMs(defaultFftAttack),
    onFftAttackChange,
    resolveControlId("fftAttack"),
  );
  const [releaseMsRaw, setReleaseMsRaw] = useControllableState(
    fftRelease,
    roundMs(defaultFftRelease),
    onFftReleaseChange,
    resolveControlId("fftRelease"),
  );
  const [blurValueRaw, setBlurValueRaw] = useControllableState(
    fftBlurSigma,
    roundSigma(defaultFftBlurSigma),
    onFftBlurSigmaChange,
    resolveControlId("fftBlurSigma"),
  );
  const [binInterpolationValue, setBinInterpolationValue] = useControllableState(
    binInterpolation,
    normalizeBinInterpolation(defaultBinInterpolation, "discrete"),
    onBinInterpolationChange,
    resolveControlId("binInterpolation"),
  );
  const [nyquistHz, setNyquistHz] = React.useState<number>(DEFAULT_NYQUIST);
  const [frequencyMinValue, setFrequencyMinValue] = useControllableState(
    frequencyMin,
    defaultFrequencyMin,
    onFrequencyMinChange,
    resolveControlId("frequencyMin"),
  );
  const [frequencyMaxValue, setFrequencyMaxValue] = useControllableState(
    frequencyMax,
    defaultFrequencyMax,
    onFrequencyMaxChange,
    resolveControlId("frequencyMax"),
  );
  const rawFftRef = React.useRef<Uint8Array | null>(null);
  const rawFftMetaRef = React.useRef<{ version: number; binCount: number }>({ version: 0, binCount: 0 });
  const resolvedBinCount = clampBins(binCountValue);
  const smoothingValue = roundUnit(clamp01(smoothingValueRaw));
  const attackMs = roundMs(attackMsRaw);
  const releaseMs = roundMs(releaseMsRaw);
  const blurValue = roundSigma(blurValueRaw);
  const resolvedBinInterpolation = normalizeBinInterpolation(binInterpolationValue, "discrete");
  const useDiscreteBins = resolvedBinInterpolation === "discrete";
  const minGapHz = React.useMemo(() => Math.min(MIN_FREQ_HZ_GAP, nyquistHz), [nyquistHz]);
  const { freqMinHz, freqMaxHz } = React.useMemo(() => {
    const safeMin = Number.isFinite(frequencyMinValue ?? Number.NaN) ? frequencyMinValue : 0;
    const safeMax = Number.isFinite(frequencyMaxValue ?? Number.NaN) ? frequencyMaxValue : nyquistHz;
    const boundedMax = clampBetween(safeMax, minGapHz, nyquistHz);
    const boundedMin = clampBetween(safeMin, 0, Math.max(0, boundedMax - minGapHz));
    const clampedMax = clampBetween(boundedMax, boundedMin + minGapHz, nyquistHz);
    return { freqMinHz: boundedMin, freqMaxHz: clampedMax };
  }, [frequencyMinValue, frequencyMaxValue, minGapHz, nyquistHz]);
  const freqMinRatio = nyquistHz > 0 ? freqMinHz / nyquistHz : 0;
  const freqMaxRatio = nyquistHz > 0 ? freqMaxHz / nyquistHz : 1;
  const freqMinRatioClamped = clampBetween(freqMinRatio, 0, 1);
  const freqMaxRatioClamped = clampBetween(freqMaxRatio, 0, 1);

  const handleFreqMinChange = React.useCallback((value: number) => {
    const next = clampBetween(value, 0, Math.max(0, freqMaxHz - minGapHz));
    setFrequencyMinValue(next);
  }, [freqMaxHz, minGapHz, setFrequencyMinValue]);

  const handleFreqMaxChange = React.useCallback((value: number) => {
    const next = clampBetween(value, Math.min(nyquistHz, freqMinHz + minGapHz), nyquistHz);
    setFrequencyMaxValue(next);
  }, [freqMinHz, minGapHz, nyquistHz, setFrequencyMaxValue]);

  const handleSampleRateChange = React.useCallback((sampleRate: number) => {
    setNyquistHz(Math.max(1, sampleRate / 2));
  }, []);
  const [sliderUnitPx, setSliderUnitPx] = React.useState<number>(() => computeSliderUnitPx(resolvedFontSize));
  const sliderMeasureRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const fallback = computeSliderUnitPx(resolvedFontSize);
    setSliderUnitPx((prev) => (Math.abs(prev - fallback) < 0.5 ? prev : fallback));
  }, [resolvedFontSize]);
  React.useLayoutEffect(() => {
    const node = sliderMeasureRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.height) return;
      const next = Math.round(rect.height);
      setSliderUnitPx((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };
    update();
    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const seamColor = safeA;
  const sideBorderWidth = resolvedBorderStyle === 'none' ? 0 : 1;
  const sideBorderColor = resolvedBorderStyle === 'none'
    ? "transparent"
    : resolvedBorderStyle === 'b'
      ? safeB
      : safeA;
  const textColor = safeA;
  const playCycleValue = isPlaying ? "playing" : "paused";
  const muteCycleValue = isMuted ? "muted" : "unmuted";
  const playCycleOptions = [
    { value: "paused", icon: <Play strokeWidth={1.6} />, ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: <Pause strokeWidth={1.6} />, ariaLabel: "Pause audio analysis", title: "Pause audio analysis" },
  ];
  const muteCycleOptions = [
    { value: "muted", icon: <VolumeX strokeWidth={1.6} />, ariaLabel: "Unmute audio output", title: "Unmute audio output" },
    { value: "unmuted", icon: <Volume2 strokeWidth={1.6} />, ariaLabel: "Mute audio output", title: "Mute audio output" },
  ];
  const attackMsClamped = clampBetween(attackMs, 0, MAX_ENVELOPE_MS);
  const releaseMsClamped = clampBetween(releaseMs, 0, MAX_ENVELOPE_MS);
  const peakDecayRate = Math.max(0.001, weightFromTimeMs(releaseMsClamped, PEAK_DECAY_DT_SEC) * 0.25);

  const issueSeek = React.useCallback((ratio: number) => {
    const clamped = clamp01(ratio);
    seekTokenRef.current += 1;
    setSeekCommand({ ratio: clamped, token: seekTokenRef.current });
  }, []);

  const handleRawFftData = React.useCallback((data: Uint8Array) => {
    if (!data?.length) return;
    if (!rawFftRef.current || rawFftRef.current.length !== data.length) {
      rawFftRef.current = new Uint8Array(data.length);
    }
    rawFftRef.current.set(data);
    const meta = rawFftMetaRef.current;
    meta.version += 1;
    meta.binCount = data.length;
  }, []);

  const handleProgress = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    if (!isScrubbing) {
      playheadRatioRef.current = clamped;
    }
  }, [isBufferSource, isScrubbing]);

  const handleScrubStart = React.useCallback(() => {
    if (!isBufferSource) return;
    setIsScrubbing(true);
  }, [isBufferSource]);

  const handleScrubMove = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    playheadRatioRef.current = clamped;
    issueSeek(clamped);
  }, [isBufferSource, issueSeek]);

  const handleScrubEnd = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    playheadRatioRef.current = clamped;
    issueSeek(clamped);
    setIsScrubbing(false);
  }, [isBufferSource, issueSeek]);

  React.useEffect(() => {
    if (isBufferSource) return;
    playheadRatioRef.current = 0;
    setIsScrubbing(false);
    setSeekCommand(null);
  }, [isBufferSource]);

  return (
    <AnimationSuspensionProvider suspended={isSuspended}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            width: '100%',
            minHeight: sliderUnitPx,
            borderTop: `1px solid ${sideBorderColor}`,
            borderLeft: `${sideBorderWidth}px solid ${sideBorderColor}`,
            borderRight: `${sideBorderWidth}px solid ${sideBorderColor}`,
            borderBottom: `1px solid ${safeB}`,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            background: safeB,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            gap: CONTROL_GAP_PX,
            padding: `0 ${CONTROL_GAP_PX}px`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: CONTROL_GAP_PX, flexShrink: 0 }}>
            <IconButton
              behavior="cycle"
              value={playCycleValue}
              options={playCycleOptions}
              onChange={(nextValue) => setIsPlaying(nextValue === "playing")}
              borderStyle="none"
              fontSize={resolvedFontSize}
              colorA={safeA}
              colorB={safeB}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: CONTROL_GAP_PX }}>
            <div ref={sliderMeasureRef} style={{ display: 'flex', minWidth: 0 }}>
              <LFOSlider
                label="Bins"
                variant="basic"
                min={1}
                max={1024}
                step={1}
                barStyle="continuous"
                width="100%"
                border="a"
                borderMask={{ top: false, bottom: false, right: true, left: true }}
                colorA={safeA}
                colorB={safeB}
                fontSize={resolvedFontSize}
                value={resolvedBinCount}
                onUserChange={(value: number) => {
                  setBinCountValue(clampBins(value));
                }}
                onAnimatedUpdate={(value: number) => {
                  setBinCountValue(clampBins(value));
                }}
                style={{ gap: 0 }}
              />
            </div>
            <SegmentBar
              ariaLabel="Bin interpolation"
              showLabel={false}
              options={BIN_INTERPOLATION_OPTIONS}
              value={resolvedBinInterpolation}
              onChange={(nextValue) => {
                setBinInterpolationValue(normalizeBinInterpolation(
                  nextValue as AudioControlsBinInterpolation,
                  "discrete",
                ));
              }}
              colorA={safeA}
              colorB={safeB}
              borderStyle="a"
              borderMask={{ top: false, bottom: false, right: true, left: true }}
              fontSize={resolvedFontSize}
              style={{ gap: 0, minWidth: 0 }}
            />
            <LFOSlider
              label="Min"
              variant="basic"
              min={0}
              max={Math.max(0, nyquistHz - MIN_FREQ_HZ_GAP)}
              step={1}
              barStyle="continuous"
              width="100%"
              border="a"
              borderMask={{ top: false, bottom: false, right: true, left: true }}
              colorA={safeA}
              colorB={safeB}
              fontSize={resolvedFontSize}
              value={freqMinHz}
              onUserChange={handleFreqMinChange}
              onAnimatedUpdate={handleFreqMinChange}
              formatDisplayValue={(value) => `${Math.round(value)}`}
              style={{ gap: 0 }}
            />
            <LFOSlider
              label="Max"
              variant="basic"
              min={MIN_FREQ_HZ_GAP}
              max={Math.max(MIN_FREQ_HZ_GAP, nyquistHz)}
              step={1}
              barStyle="continuous"
              width="100%"
              border="a"
              borderMask={{ top: false, bottom: false, right: true, left: true }}
              colorA={safeA}
              colorB={safeB}
              fontSize={resolvedFontSize}
              value={freqMaxHz}
              onUserChange={handleFreqMaxChange}
              onAnimatedUpdate={handleFreqMaxChange}
              formatDisplayValue={(value) => `${Math.round(value)}`}
              style={{ gap: 0 }}
            />
          </div>
        </div>
      {source.type === "buffer" ? (
        <AudioBufferEngine
          src={source.src}
          loop={source.loop}
          playing={isPlaying}
          analysisActions={analysisActions}
          onProgress={handleProgress}
          seekTarget={seekCommand}
          analyserSmoothing={smoothingValue}
          attackMs={attackMsClamped}
          releaseMs={releaseMsClamped}
          blurSigma={blurValue}
          targetBins={resolvedBinCount}
          onRawFftFrame={handleRawFftData}
          frequencyMin={freqMinRatioClamped}
          frequencyMax={freqMaxRatioClamped}
          onSampleRateChange={handleSampleRateChange}
          muted={isMuted}
          suspended={isSuspended}
        />
      ) : (
        <AudioLiveEngine
          source={source}
          playing={isPlaying}
          analysisActions={analysisActions}
          analyserSmoothing={smoothingValue}
          attackMs={attackMsClamped}
          releaseMs={releaseMsClamped}
          blurSigma={blurValue}
          targetBins={resolvedBinCount}
          onRawFftFrame={handleRawFftData}
          frequencyMin={freqMinRatioClamped}
          frequencyMax={freqMaxRatioClamped}
          onSampleRateChange={handleSampleRateChange}
          muted={isMuted}
          suspended={isSuspended}
        />
      )}
      <div
        style={{
          borderTop: `1px solid ${seamColor}`,
          borderLeft: `${sideBorderWidth}px solid ${sideBorderColor}`,
          borderRight: `${sideBorderWidth}px solid ${sideBorderColor}`,
          borderRadius: 0,
          borderBottom: `1px solid ${safeB}`,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0a0a0a, #1a1a1a)',
        }}
      >
          <AudioFFTWindow
            heightUnits={heightUnits}
            unitSizePx={sliderUnitPx}
            maxWidth="100%"
            maxBins={resolvedBinCount}
            peakDecay={peakDecayRate}
            playbackRatioRef={playheadRatioRef}
            showPlaybackIndicator={isBufferSource}
            onScrubStart={isBufferSource ? handleScrubStart : undefined}
            onScrub={isBufferSource ? handleScrubMove : undefined}
            onScrubEnd={isBufferSource ? handleScrubEnd : undefined}
          activeColor={safeA}
          inactiveColor={safeB}
          rawFftDataRef={rawFftRef}
          rawFftMetaRef={rawFftMetaRef}
          attackMs={attackMsClamped}
          releaseMs={releaseMsClamped}
          blurSigma={blurValue}
          discreteBins={useDiscreteBins}
          frequencyMin={freqMinRatioClamped}
          frequencyMax={freqMaxRatioClamped}
          suspended={isSuspended}
        />
      </div>
      <div
        style={{
          width: '100%',
          minHeight: sliderUnitPx,
          borderTop: `1px solid ${safeA}`,
          borderLeft: `${sideBorderWidth}px solid ${sideBorderColor}`,
          borderRight: `${sideBorderWidth}px solid ${sideBorderColor}`,
          borderBottom: `1px solid ${sideBorderColor}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: safeB,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          gap: CONTROL_GAP_PX,
          padding: `0 ${CONTROL_GAP_PX}px`,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: CONTROL_GAP_PX, flexShrink: 0 }}>
          <IconButton
            behavior="cycle"
            value={muteCycleValue}
            options={muteCycleOptions}
            onChange={(nextValue) => setIsMuted(nextValue === "muted")}
            borderStyle="none"
            fontSize={resolvedFontSize}
            colorA={safeA}
            colorB={safeB}
          />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: CONTROL_GAP_PX,
          }}
        >
          <LFOSlider
            label="Atk"
            variant="basic"
            min={0}
            max={MAX_ENVELOPE_MS}
            step={ENVELOPE_STEP_MS}
            barStyle="continuous"
            width="100%"
            border="a"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={resolvedFontSize}
            value={attackMsClamped}
            onUserChange={(value: number) => setAttackMsRaw(roundMs(value))}
            onAnimatedUpdate={(value: number) => setAttackMsRaw(roundMs(value))}
            formatDisplayValue={(value) => `${Math.round(value)}`}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Rel"
            variant="basic"
            min={0}
            max={MAX_ENVELOPE_MS}
            step={ENVELOPE_STEP_MS}
            barStyle="continuous"
            width="100%"
            border="a"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={resolvedFontSize}
            value={releaseMsClamped}
            onUserChange={(value: number) => setReleaseMsRaw(roundMs(value))}
            onAnimatedUpdate={(value: number) => setReleaseMsRaw(roundMs(value))}
            formatDisplayValue={(value) => `${Math.round(value)}`}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Sm"
            variant="basic"
            min={0}
            max={1}
            step={0.1}
            barStyle="continuous"
            width="100%"
            border="a"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={resolvedFontSize}
            value={smoothingValue}
            onUserChange={(value: number) => setSmoothingValueRaw(roundUnit(value))}
            onAnimatedUpdate={(value: number) => setSmoothingValueRaw(roundUnit(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="σ"
            variant="basic"
            min={0}
            max={3}
            step={0.1}
            barStyle="continuous"
            width="100%"
            border="a"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={resolvedFontSize}
            value={blurValue}
            onUserChange={(value: number) => setBlurValueRaw(roundSigma(value))}
            onAnimatedUpdate={(value: number) => setBlurValueRaw(roundSigma(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
        </div>
      </div>
    </div>
    </AnimationSuspensionProvider>
  );
}

type EngineAnalysisActions = AudioAnalysisActions & { getBinCount: () => number };

interface AudioBufferEngineProps {
  src: string;
  loop?: boolean;
  playing: boolean;
  analysisActions: EngineAnalysisActions;
  seekTarget?: { ratio: number; token: number } | null;
  onProgress?: (ratio: number) => void;
  analyserSmoothing?: number;
  attackMs?: number;
  releaseMs?: number;
  blurSigma?: number;
  targetBins?: number;
  onRawFftFrame?: (data: Uint8Array) => void;
  frequencyMin?: number;
  frequencyMax?: number;
  onSampleRateChange?: (sampleRate: number) => void;
  muted?: boolean;
  suspended?: boolean;
}

function AudioBufferEngine({
  src,
  loop = true,
  playing,
  analysisActions,
  seekTarget,
  onProgress,
  analyserSmoothing = 0.8,
  attackMs = DEFAULT_ATTACK_MS,
  releaseMs = DEFAULT_RELEASE_MS,
  blurSigma = 0,
  targetBins = 1024,
  onRawFftFrame,
  frequencyMin = 0,
  frequencyMax = 1,
  onSampleRateChange,
  muted = true,
  suspended,
}: AudioBufferEngineProps) {
  const isSuspended = useAnimationSuspended(suspended);
  const { setAudioBins, setAudioBinCount, setAudioMaxMagnitude, getBinCount } = analysisActions;
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const bufferRef = React.useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = React.useRef<AudioBufferSourceNode | null>(null);
  const silentGainRef = React.useRef<GainNode | null>(null);
  const audioBufferRef = React.useRef<AudioBuffer | null>(null);
  const playbackOffsetRef = React.useRef<number>(0);
  const playbackStartedAtRef = React.useRef<number | null>(null);
  const onProgressRef = React.useRef<typeof onProgress>(onProgress);
  const analyserSmoothingRef = React.useRef<number>(clamp01(analyserSmoothing ?? 0.8));
  const onSampleRateChangeRef = React.useRef<typeof onSampleRateChange>(onSampleRateChange);
  const mutedRef = React.useRef<boolean>(muted);
  const smoothingStateRef = React.useRef<SmoothingState>(createSmoothingState());
  const blurBufferRef = React.useRef<Float32Array | null>(null);
  const resampleBufferRef = React.useRef<Float32Array | null>(null);
  const gaussianKernelCacheRef = React.useRef<Map<number, GaussianKernel>>(new Map());
  const lastBinCountRef = React.useRef<number | null>(null);
  const clearedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  React.useEffect(() => {
    onSampleRateChangeRef.current = onSampleRateChange;
  }, [onSampleRateChange]);

  React.useEffect(() => {
    mutedRef.current = muted;
    const gain = silentGainRef.current;
    const audioContext = audioContextRef.current;
    if (gain && audioContext) {
      gain.gain.setTargetAtTime(muted ? 0 : 1, audioContext.currentTime, 0.01);
    }
  }, [muted]);

  React.useEffect(() => {
    const clamped = clamp01(analyserSmoothing ?? 0.8);
    analyserSmoothingRef.current = clamped;
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = clamped;
    }
  }, [analyserSmoothing]);

  const getDuration = React.useCallback(() => audioBufferRef.current?.duration ?? 0, []);

  const wrapOffset = React.useCallback((value: number) => {
    const duration = getDuration();
    if (duration <= 0) return 0;
    const mod = value % duration;
    const normalized = mod < 0 ? mod + duration : mod;
    const epsilon = Math.min(duration * 0.001, 1e-4) || 1e-4;
    return Math.min(normalized, Math.max(0, duration - epsilon));
  }, [getDuration]);

  const getCurrentPlaybackSeconds = React.useCallback(() => {
    const duration = getDuration();
    if (duration <= 0) return 0;
    const base = wrapOffset(playbackOffsetRef.current);
    const startedAt = playbackStartedAtRef.current;
    const audioContext = audioContextRef.current;
    if (!audioContext || startedAt == null) return base;
    const elapsed = audioContext.currentTime - startedAt;
    return wrapOffset(base + elapsed);
  }, [getDuration, wrapOffset]);

  const stopSourceImmediate = React.useCallback(() => {
    try {
      sourceRef.current?.stop();
    } catch {
      // ignore
    }
    sourceRef.current?.disconnect();
    silentGainRef.current?.disconnect();
    sourceRef.current = null;
    silentGainRef.current = null;
  }, []);

  React.useEffect(() => {
    const kernelCache = gaussianKernelCacheRef.current;
    let cancelled = false;
    async function loadAudio() {
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        onSampleRateChangeRef.current?.(audioContext.sampleRate);
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load audio sample: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (cancelled) {
          safeCloseAudioContext(audioContext);
          return;
        }
        audioBufferRef.current = audioBuffer;
        playbackOffsetRef.current = 0;
        playbackStartedAtRef.current = null;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = analyserSmoothingRef.current;
        analyserRef.current = analyser;
        bufferRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        setAudioBinCount(analyser.frequencyBinCount);
        setAudioMaxMagnitude(1);
      } catch (error) {
        console.error("Failed to load audio for FFT", error);
      }
    }
    loadAudio();
    return () => {
      cancelled = true;
      analyserRef.current = null;
      bufferRef.current = null;
      stopSourceImmediate();
      safeCloseAudioContext(audioContextRef.current);
      audioContextRef.current = null;
      sourceRef.current = null;
      silentGainRef.current = null;
      audioBufferRef.current = null;
      playbackOffsetRef.current = 0;
      playbackStartedAtRef.current = null;
      smoothingStateRef.current = createSmoothingState();
      blurBufferRef.current = null;
      resampleBufferRef.current = null;
      kernelCache.clear();
      lastBinCountRef.current = null;
      clearedRef.current = false;
    };
  }, [setAudioBinCount, setAudioMaxMagnitude, src, stopSourceImmediate]);

  const stopPlayback = React.useCallback(() => {
    playbackOffsetRef.current = getCurrentPlaybackSeconds();
    playbackStartedAtRef.current = null;
    stopSourceImmediate();
  }, [getCurrentPlaybackSeconds, stopSourceImmediate]);

  const startPlayback = React.useCallback(async (offsetSeconds?: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    const audioContext = audioContextRef.current;
    if (audioContext.state === "suspended") {
      await audioContext.resume().catch(() => {});
    }
    const analyser = analyserRef.current ?? audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = analyserSmoothingRef.current;
    analyserRef.current = analyser;
    const normalizedOffset = wrapOffset(typeof offsetSeconds === "number" ? offsetSeconds : getCurrentPlaybackSeconds());
    playbackOffsetRef.current = normalizedOffset;
    playbackStartedAtRef.current = audioContext.currentTime;
    stopSourceImmediate();
    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.loop = loop;
    const silentGain = audioContext.createGain();
    silentGain.gain.value = mutedRef.current ? 0 : 1;
    source.connect(analyser);
    analyser.connect(silentGain);
    silentGain.connect(audioContext.destination);
    source.start(0, normalizedOffset);
    sourceRef.current = source;
    silentGainRef.current = silentGain;
    if (!bufferRef.current) {
      bufferRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      setAudioBinCount(analyser.frequencyBinCount);
    }
  }, [getCurrentPlaybackSeconds, loop, setAudioBinCount, stopSourceImmediate, wrapOffset]);

  React.useEffect(() => {
    if (playing) {
      startPlayback();
    } else {
      stopPlayback();
    }
    return () => {
      stopPlayback();
    };
  }, [playing, startPlayback, stopPlayback]);

  React.useEffect(() => {
    if (!seekTarget) return;
    const duration = getDuration();
    if (duration <= 0) return;
    const ratio = clamp01(seekTarget.ratio);
    const targetSeconds = wrapOffset(ratio * duration);
    playbackOffsetRef.current = targetSeconds;
    if (playing && audioBufferRef.current && audioContextRef.current) {
      startPlayback(targetSeconds);
    } else {
      playbackStartedAtRef.current = null;
    }
  }, [getDuration, playing, seekTarget, startPlayback, wrapOffset]);

  useFrame(isSuspended ? null : (_, dtSec) => {
    if (!playing) {
      if (!clearedRef.current) {
        const length = lastBinCountRef.current ?? getBinCount();
        if (length > 0) {
          setAudioBins(new Array(length).fill(0));
          setAudioBinCount(length);
        }
        const data = bufferRef.current;
        if (data && onRawFftFrame) {
          data.fill(0);
          onRawFftFrame(data);
        }
        clearedRef.current = true;
      }
      return;
    }
    clearedRef.current = false;
    const analyser = analyserRef.current;
    const data = bufferRef.current;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      if (onRawFftFrame) {
        onRawFftFrame(data);
      }
      const processed = processBinsFromBytes(
        data,
        {
          attackMs: clampBetween(attackMs, 0, MAX_ENVELOPE_MS),
          releaseMs: clampBetween(releaseMs, 0, MAX_ENVELOPE_MS),
          dtSec,
          blurSigma: Math.max(0, blurSigma || 0),
          targetBins: clampBetween(Math.round(targetBins || data.length), 1, data.length),
          frequencyMin,
          frequencyMax,
        },
        smoothingStateRef.current,
        blurBufferRef,
        resampleBufferRef,
        gaussianKernelCacheRef.current,
      );
      const finalBins = processed.resampled;
      setAudioBins(Array.from(finalBins));
      if (lastBinCountRef.current !== finalBins.length) {
        lastBinCountRef.current = finalBins.length;
        setAudioBinCount(finalBins.length);
      }
    }
    const duration = getDuration();
    if (duration > 0) {
      const ratio = getCurrentPlaybackSeconds() / duration;
      onProgressRef.current?.(ratio);
    }
  });

  return null;
}

type AudioLiveSource = Extract<AudioControlsSource, { type: "mediaStream" | "audioNode" }>;

interface AudioLiveEngineProps {
  source: AudioLiveSource;
  playing: boolean;
  analysisActions: EngineAnalysisActions;
  analyserSmoothing?: number;
  attackMs?: number;
  releaseMs?: number;
  blurSigma?: number;
  targetBins?: number;
  onRawFftFrame?: (data: Uint8Array) => void;
  frequencyMin?: number;
  frequencyMax?: number;
  onSampleRateChange?: (sampleRate: number) => void;
  muted?: boolean;
  suspended?: boolean;
}

function AudioLiveEngine({
  source,
  playing,
  analysisActions,
  analyserSmoothing = 0.8,
  attackMs = DEFAULT_ATTACK_MS,
  releaseMs = DEFAULT_RELEASE_MS,
  blurSigma = 0,
  targetBins = 1024,
  onRawFftFrame,
  frequencyMin = 0,
  frequencyMax = 1,
  onSampleRateChange,
  muted = true,
  suspended,
}: AudioLiveEngineProps) {
  const isSuspended = useAnimationSuspended(suspended);
  const { setAudioBins, setAudioBinCount, setAudioMaxMagnitude, getBinCount } = analysisActions;
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const sourceNodeRef = React.useRef<AudioNode | null>(null);
  const monitorGainRef = React.useRef<GainNode | null>(null);
  const bufferRef = React.useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserSmoothingRef = React.useRef<number>(clamp01(analyserSmoothing ?? 0.8));
  const onSampleRateChangeRef = React.useRef<typeof onSampleRateChange>(onSampleRateChange);
  const mutedRef = React.useRef<boolean>(muted);
  const ownsContextRef = React.useRef<boolean>(false);
  const connectedRef = React.useRef<boolean>(false);
  const clearedRef = React.useRef<boolean>(false);
  const smoothingStateRef = React.useRef<SmoothingState>(createSmoothingState());
  const blurBufferRef = React.useRef<Float32Array | null>(null);
  const resampleBufferRef = React.useRef<Float32Array | null>(null);
  const gaussianKernelCacheRef = React.useRef<Map<number, GaussianKernel>>(new Map());
  const lastBinCountRef = React.useRef<number | null>(null);
  const sourceStream = source.type === "mediaStream" ? source.stream : null;
  const sourceContext = source.type === "mediaStream" ? source.context : undefined;
  const sourceNodeValue = source.type === "audioNode" ? source.node : null;

  React.useEffect(() => {
    onSampleRateChangeRef.current = onSampleRateChange;
  }, [onSampleRateChange]);

  React.useEffect(() => {
    mutedRef.current = muted;
    const gain = monitorGainRef.current;
    const audioContext = audioContextRef.current;
    if (gain && audioContext) {
      gain.gain.setTargetAtTime(muted ? 0 : 1, audioContext.currentTime, 0.01);
    }
  }, [muted]);

  React.useEffect(() => {
    const clamped = clamp01(analyserSmoothing ?? 0.8);
    analyserSmoothingRef.current = clamped;
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = clamped;
    }
  }, [analyserSmoothing]);

  const connectChain = React.useCallback(() => {
    if (connectedRef.current) return;
    const sourceNode = sourceNodeRef.current;
    const analyser = analyserRef.current;
    const monitorGain = monitorGainRef.current;
    const audioContext = audioContextRef.current;
    if (!sourceNode || !analyser || !monitorGain || !audioContext) return;
    sourceNode.connect(analyser);
    analyser.connect(monitorGain);
    monitorGain.connect(audioContext.destination);
    connectedRef.current = true;
  }, []);

  const disconnectChain = React.useCallback(() => {
    if (!connectedRef.current) return;
    try {
      const sourceNode = sourceNodeRef.current;
      const analyser = analyserRef.current;
      if (sourceNode && analyser) {
        sourceNode.disconnect(analyser);
      }
    } catch {
      // ignore
    }
    try {
      analyserRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      monitorGainRef.current?.disconnect();
    } catch {
      // ignore
    }
    connectedRef.current = false;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function setup() {
      let context: AudioContext;
      let sourceNode: AudioNode;
      let ownsContext = false;
      if (source.type === "mediaStream") {
        context = sourceContext ?? new AudioContext();
        ownsContext = !sourceContext;
        if (!sourceStream) return;
        sourceNode = context.createMediaStreamSource(sourceStream);
      } else {
        if (!sourceNodeValue) return;
        sourceNode = sourceNodeValue;
        context = sourceNodeValue.context;
      }
      if (cancelled) {
        if (ownsContext) safeCloseAudioContext(context);
        return;
      }
      ownsContextRef.current = ownsContext;
      audioContextRef.current = context;
      sourceNodeRef.current = sourceNode;
      onSampleRateChangeRef.current?.(context.sampleRate);

      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = analyserSmoothingRef.current;
      analyserRef.current = analyser;

      bufferRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      lastBinCountRef.current = analyser.frequencyBinCount;
      setAudioBinCount(analyser.frequencyBinCount);
      setAudioMaxMagnitude(1);

      const monitorGain = context.createGain();
      monitorGain.gain.value = mutedRef.current ? 0 : 1;
      monitorGainRef.current = monitorGain;
      connectedRef.current = false;
      clearedRef.current = false;

    }
    setup();
    const gaussianKernelCache = gaussianKernelCacheRef.current;
    return () => {
      cancelled = true;
      disconnectChain();
      analyserRef.current = null;
      bufferRef.current = null;
      sourceNodeRef.current = null;
      monitorGainRef.current = null;
      if (ownsContextRef.current) {
        safeCloseAudioContext(audioContextRef.current);
      }
      audioContextRef.current = null;
      ownsContextRef.current = false;
      smoothingStateRef.current = createSmoothingState();
      blurBufferRef.current = null;
      resampleBufferRef.current = null;
      gaussianKernelCache.clear();
      lastBinCountRef.current = null;
      clearedRef.current = false;
    };
  }, [
    connectChain,
    disconnectChain,
    setAudioBinCount,
    setAudioMaxMagnitude,
    source.type,
    sourceContext,
    sourceStream,
    sourceNodeValue,
  ]);

  React.useEffect(() => {
    const context = audioContextRef.current;
    if (playing) {
      if (context?.state === "suspended") {
        context.resume().catch(() => {});
      }
      connectChain();
      clearedRef.current = false;
    } else {
      disconnectChain();
      clearedRef.current = false;
    }
  }, [connectChain, disconnectChain, playing]);

  useFrame(isSuspended ? null : (_, dtSec) => {
    if (!playing || !connectedRef.current) {
      if (!clearedRef.current) {
        const length = lastBinCountRef.current ?? getBinCount();
        if (length > 0) {
          setAudioBins(new Array(length).fill(0));
          setAudioBinCount(length);
        }
        const data = bufferRef.current;
        if (data && onRawFftFrame) {
          data.fill(0);
          onRawFftFrame(data);
        }
        clearedRef.current = true;
      }
      return;
    }
    const analyser = analyserRef.current;
    const data = bufferRef.current;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      if (onRawFftFrame) {
        onRawFftFrame(data);
      }
      const processed = processBinsFromBytes(
        data,
        {
          attackMs: clampBetween(attackMs, 0, MAX_ENVELOPE_MS),
          releaseMs: clampBetween(releaseMs, 0, MAX_ENVELOPE_MS),
          dtSec,
          blurSigma: Math.max(0, blurSigma || 0),
          targetBins: clampBetween(Math.round(targetBins || data.length), 1, data.length),
          frequencyMin,
          frequencyMax,
        },
        smoothingStateRef.current,
        blurBufferRef,
        resampleBufferRef,
        gaussianKernelCacheRef.current,
      );
      const finalBins = processed.resampled;
      setAudioBins(Array.from(finalBins));
      if (lastBinCountRef.current !== finalBins.length) {
        lastBinCountRef.current = finalBins.length;
        setAudioBinCount(finalBins.length);
      }
    }
  });

  return null;
}
