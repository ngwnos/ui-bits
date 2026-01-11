import React from "react";
import {
  ChartColumnIncreasing,
  ChartSpline,
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
import { useFrame } from "../../frameLoop";
import { flexoki } from "../../flexoki";
import IconButton from "../IconButton";
import LFOSlider from "../LFOSlider";
import AudioFFTWindow from "./AudioFFTWindow";

export type AudioControlsBorder = 'a' | 'b' | 'none';
export type AudioControlsBinInterpolation = 'discrete' | 'interpolated';
export type AudioControlsSource =
  | { type: "buffer"; src: string; loop?: boolean }
  | { type: "mediaStream"; stream: MediaStream; context?: AudioContext }
  | { type: "audioNode"; node: AudioNode & { context: AudioContext } };

export interface AudioControlsProps {
  fontSize?: number;
  colorA?: string;
  colorB?: string;
  borderStyle?: AudioControlsBorder;
  source: AudioControlsSource;
  heightUnits?: number;
  suspended?: boolean;
  audioAnalysisStore?: AudioAnalysisStore | null;
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
const roundUnit = (value: number) => Math.round(clamp01(value) * 10) / 10;
const roundSigma = (value: number) => Math.round(clampBetween(value, 0, 3) * 10) / 10;
const roundMs = (value: number) => Math.round(clampBetween(value, 0, MAX_ENVELOPE_MS) / ENVELOPE_STEP_MS) * ENVELOPE_STEP_MS;
const weightFromTimeMs = (ms: number, dtSec: number) => {
  if (ms <= 0) return 1;
  const tau = ms / 1000;
  const dt = Math.max(0, dtSec);
  if (!Number.isFinite(tau) || tau <= 0) return 1;
  return clamp01(1 - Math.exp(-dt / tau));
};

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
) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const resolved = isControlled ? value : internal;
  const setValue = React.useCallback((next: T) => {
    if (!isControlled) {
      setInternal(next);
    }
    onChange?.(next);
  }, [isControlled, onChange]);
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
  fontSize = 12,
  colorA,
  colorB,
  borderStyle = 'a',
  source,
  heightUnits = 6,
  suspended,
  audioAnalysisStore,
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
  const analysisActions = React.useMemo<AudioAnalysisActions>(() => ({
    setAudioBins: resolvedStore.setAudioBins,
    setAudioBinCount: resolvedStore.setAudioBinCount,
    setAudioMaxMagnitude: resolvedStore.setAudioMaxMagnitude,
  }), [resolvedStore]);
  const isBufferSource = source.type === "buffer";
  const [isPlaying, setIsPlaying] = useControllableState(playing, defaultPlaying, onPlayingChange);
  const [isMuted, setIsMuted] = useControllableState(muted, defaultMuted, onMutedChange);
  const [playheadRatio, setPlayheadRatio] = React.useState<number>(0);
  const [isScrubbing, setIsScrubbing] = React.useState<boolean>(false);
  const [seekCommand, setSeekCommand] = React.useState<{ ratio: number; token: number } | null>(null);
  const seekTokenRef = React.useRef<number>(0);
  const clampBins = React.useCallback((value: number) => clampBetween(Math.round(value || 0), 1, 1024), []);
  const [binCountValue, setBinCountValue] = useControllableState(
    binCount,
    clampBins(defaultBinCount),
    onBinCountChange,
  );
  const [smoothingValueRaw, setSmoothingValueRaw] = useControllableState(
    analyserSmoothing,
    roundUnit(clamp01(defaultAnalyserSmoothing)),
    onAnalyserSmoothingChange,
  );
  const [attackMsRaw, setAttackMsRaw] = useControllableState(
    fftAttack,
    roundMs(defaultFftAttack),
    onFftAttackChange,
  );
  const [releaseMsRaw, setReleaseMsRaw] = useControllableState(
    fftRelease,
    roundMs(defaultFftRelease),
    onFftReleaseChange,
  );
  const [blurValueRaw, setBlurValueRaw] = useControllableState(
    fftBlurSigma,
    roundSigma(defaultFftBlurSigma),
    onFftBlurSigmaChange,
  );
  const [binInterpolationValue, setBinInterpolationValue] = useControllableState(
    binInterpolation,
    normalizeBinInterpolation(defaultBinInterpolation, "discrete"),
    onBinInterpolationChange,
  );
  const [nyquistHz, setNyquistHz] = React.useState<number>(DEFAULT_NYQUIST);
  const [frequencyMinValue, setFrequencyMinValue] = useControllableState(
    frequencyMin,
    defaultFrequencyMin,
    onFrequencyMinChange,
  );
  const [frequencyMaxValue, setFrequencyMaxValue] = useControllableState(
    frequencyMax,
    defaultFrequencyMax,
    onFrequencyMaxChange,
  );
  const rawFftRef = React.useRef<Uint8Array | null>(null);
  const [rawFftMeta, setRawFftMeta] = React.useState<{ version: number; binCount: number }>({ version: 0, binCount: 0 });
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
  const [sliderUnitPx, setSliderUnitPx] = React.useState<number>(() => computeSliderUnitPx(fontSize));
  const sliderMeasureRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const fallback = computeSliderUnitPx(fontSize);
    setSliderUnitPx((prev) => (Math.abs(prev - fallback) < 0.5 ? prev : fallback));
  }, [fontSize]);
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
  const { safeA, safeB } = resolveColors(colorA, colorB);
  const seamColor = safeA;
  const sideBorderWidth = borderStyle === 'none' ? 0 : 1;
  const sideBorderColor = borderStyle === 'none'
    ? "transparent"
    : borderStyle === 'b'
      ? safeB
      : safeA;
  const textColor = safeA;
  const playCycleValue = isPlaying ? "playing" : "paused";
  const interpolationCycleValue = useDiscreteBins ? "discrete" : "interpolated";
  const muteCycleValue = isMuted ? "muted" : "unmuted";
  const playCycleOptions = [
    { value: "paused", icon: <Play strokeWidth={1.6} />, ariaLabel: "Play audio analysis", title: "Play audio analysis" },
    { value: "playing", icon: <Pause strokeWidth={1.6} />, ariaLabel: "Pause audio analysis", title: "Pause audio analysis" },
  ];
  const interpolationCycleOptions = [
    { value: "discrete", icon: <ChartColumnIncreasing strokeWidth={1.6} />, ariaLabel: "Show interpolated FFT bins", title: "Show interpolated FFT bins" },
    { value: "interpolated", icon: <ChartSpline strokeWidth={1.6} />, ariaLabel: "Show discrete FFT bins", title: "Show discrete FFT bins" },
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
    setRawFftMeta((prev) => ({
      version: prev.version + 1,
      binCount: data.length,
    }));
  }, []);

  const handleProgress = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    if (!isScrubbing) {
      setPlayheadRatio(clamped);
    }
  }, [isBufferSource, isScrubbing]);

  const handleScrubStart = React.useCallback(() => {
    if (!isBufferSource) return;
    setIsScrubbing(true);
  }, [isBufferSource]);

  const handleScrubMove = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    setPlayheadRatio(clamped);
    issueSeek(clamped);
  }, [isBufferSource, issueSeek]);

  const handleScrubEnd = React.useCallback((ratio: number) => {
    if (!isBufferSource) return;
    const clamped = clamp01(ratio);
    setPlayheadRatio(clamped);
    issueSeek(clamped);
    setIsScrubbing(false);
  }, [isBufferSource, issueSeek]);

  React.useEffect(() => {
    if (isBufferSource) return;
    setPlayheadRatio(0);
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
              fontSize={fontSize}
              colorA={safeA}
              colorB={safeB}
            />
            <IconButton
              behavior="cycle"
              value={interpolationCycleValue}
              options={interpolationCycleOptions}
              onChange={(nextValue) => setBinInterpolationValue(nextValue === "discrete" ? "discrete" : "interpolated")}
              borderStyle="none"
              fontSize={fontSize}
              colorA={safeA}
              colorB={safeB}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: CONTROL_GAP_PX }}>
            <div ref={sliderMeasureRef} style={{ display: 'flex', minWidth: 0 }}>
              <LFOSlider
                label="Bins"
                variant="basic"
                min={1}
                max={1024}
                step={1}
                barStyle="continuous"
                width="100%"
                border="left"
                borderMask={{ top: false, bottom: false, right: true, left: true }}
                colorA={safeA}
                colorB={safeB}
                fontSize={fontSize}
                mode="external"
                readExternal={() => resolvedBinCount}
                onUserChange={(value: number) => {
                  setBinCountValue(clampBins(value));
                }}
                onAnimatedUpdate={(value: number) => {
                  setBinCountValue(clampBins(value));
                }}
                style={{ gap: 0 }}
              />
            </div>
            <LFOSlider
              label="Fmin"
              variant="basic"
              min={0}
              max={Math.max(0, nyquistHz - MIN_FREQ_HZ_GAP)}
              step={1}
              barStyle="continuous"
              width="100%"
              border="left"
              borderMask={{ top: false, bottom: false, right: true, left: true }}
              colorA={safeA}
              colorB={safeB}
              fontSize={fontSize}
              mode="external"
              readExternal={() => freqMinHz}
              onUserChange={handleFreqMinChange}
              onAnimatedUpdate={handleFreqMinChange}
              formatDisplayValue={(value) => `${Math.round(value)}`}
              style={{ gap: 0 }}
            />
            <LFOSlider
              label="Fmax"
              variant="basic"
              min={MIN_FREQ_HZ_GAP}
              max={Math.max(MIN_FREQ_HZ_GAP, nyquistHz)}
              step={1}
              barStyle="continuous"
              width="100%"
              border="left"
              borderMask={{ top: false, bottom: false, right: true, left: true }}
              colorA={safeA}
              colorB={safeB}
              fontSize={fontSize}
              mode="external"
              readExternal={() => freqMaxHz}
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
          playbackRatio={isBufferSource ? playheadRatio : 0}
          onScrubStart={isBufferSource ? handleScrubStart : undefined}
          onScrub={isBufferSource ? handleScrubMove : undefined}
          onScrubEnd={isBufferSource ? handleScrubEnd : undefined}
          activeColor={safeA}
          inactiveColor={safeB}
          rawFftDataRef={rawFftRef}
          rawFrameVersion={rawFftMeta.version}
          rawBinCount={rawFftMeta.binCount}
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
            fontSize={fontSize}
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
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => attackMsClamped}
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
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => releaseMsClamped}
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
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => smoothingValue}
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
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            colorA={safeA}
            colorB={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => blurValue}
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

interface AudioBufferEngineProps {
  src: string;
  loop?: boolean;
  playing: boolean;
  analysisActions: AudioAnalysisActions;
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
  const { setAudioBins, setAudioBinCount, setAudioMaxMagnitude } = analysisActions;
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
  const smoothingStateRef = React.useRef<SmoothingState>({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: false,
  });
  const blurBufferRef = React.useRef<Float32Array | null>(null);
  const resampleBufferRef = React.useRef<Float32Array | null>(null);
  const gaussianKernelCacheRef = React.useRef<Map<number, GaussianKernel>>(new Map());
  const lastBinCountRef = React.useRef<number | null>(null);

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
      smoothingStateRef.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: false,
      };
      blurBufferRef.current = null;
      resampleBufferRef.current = null;
      kernelCache.clear();
      lastBinCountRef.current = null;
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
  analysisActions: AudioAnalysisActions;
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
  const { setAudioBins, setAudioBinCount, setAudioMaxMagnitude } = analysisActions;
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
  const smoothingStateRef = React.useRef<SmoothingState>({
    previous: null,
    scratch: null,
    length: 0,
    hasHistory: false,
  });
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
      smoothingStateRef.current = {
        previous: null,
        scratch: null,
        length: 0,
        hasHistory: false,
      };
      blurBufferRef.current = null;
      resampleBufferRef.current = null;
      gaussianKernelCacheRef.current.clear();
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
        const length = lastBinCountRef.current ?? 0;
        if (length > 0) {
          setAudioBins(new Array(length).fill(0));
          setAudioBinCount(length);
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

interface ProcessBinsOptions {
  attackMs: number;
  releaseMs: number;
  dtSec: number;
  blurSigma: number;
  targetBins: number;
  frequencyMin: number;
  frequencyMax: number;
}

interface SmoothingState {
  previous: Float32Array | null;
  scratch: Float32Array | null;
  length: number;
  hasHistory: boolean;
}

interface GaussianKernel {
  radius: number;
  kernel: Float32Array;
}

function processBinsFromBytes(
  source: Uint8Array,
  options: ProcessBinsOptions,
  smoothingState: SmoothingState,
  blurBufferRef: React.MutableRefObject<Float32Array | null>,
  resampleBufferRef: React.MutableRefObject<Float32Array | null>,
  kernelCache: Map<number, GaussianKernel>,
) {
  const length = source.length;
  if (smoothingState.length !== length) {
    smoothingState.length = length;
    smoothingState.hasHistory = false;
    smoothingState.previous = null;
    smoothingState.scratch = null;
  }
  const prevBuffer = smoothingState.previous && smoothingState.previous.length === length
    ? smoothingState.previous
    : null;
  const scratchBuffer = smoothingState.scratch && smoothingState.scratch.length === length
    ? smoothingState.scratch
    : null;
  const prev = prevBuffer ?? new Float32Array(length);
  const next = scratchBuffer ?? new Float32Array(length);
  const useHistory = smoothingState.hasHistory && prevBuffer !== null;
  const dt = Math.max(0, options.dtSec);
  const attackWeight = weightFromTimeMs(options.attackMs, dt);
  const releaseWeight = weightFromTimeMs(options.releaseMs, dt);
  for (let i = 0; i < length; i += 1) {
    const current = source[i] / 255;
    const prevValue = useHistory ? prev[i] : current;
    const weight = current >= prevValue ? attackWeight : releaseWeight;
    next[i] = prevValue + (current - prevValue) * weight;
  }
  smoothingState.hasHistory = true;
  smoothingState.previous = next;
  smoothingState.scratch = prev;

  let working = next;
  if (options.blurSigma > 0.001) {
    working = applyGaussianBlurCached(working, options.blurSigma, blurBufferRef, kernelCache);
  }
  const resampled = resampleBinsCached(
    working,
    options.targetBins,
    resampleBufferRef,
    options.frequencyMin,
    options.frequencyMax,
  );

  return { smoothedSnapshot: next, resampled };
}

function applyGaussianBlurCached(
  values: Float32Array,
  sigma: number,
  blurBufferRef: React.MutableRefObject<Float32Array | null>,
  kernelCache: Map<number, GaussianKernel>,
): Float32Array {
  const normalizedSigma = Math.max(0.001, sigma);
  let blurred = blurBufferRef.current;
  if (!blurred || blurred.length !== values.length) {
    blurred = new Float32Array(values.length);
    blurBufferRef.current = blurred;
  }
  const { radius, kernel } = getGaussianKernel(normalizedSigma, kernelCache);
  const length = values.length;
  for (let i = 0; i < length; i += 1) {
    let sample = 0;
    for (let k = -radius; k <= radius; k += 1) {
      let index = i + k;
      if (index < 0) index = 0;
      else if (index >= length) index = length - 1;
      sample += values[index] * kernel[k + radius];
    }
    blurred[i] = sample;
  }
  return blurred;
}

function getGaussianKernel(sigma: number, cache: Map<number, GaussianKernel>): GaussianKernel {
  const key = Math.round(sigma * 100) / 100;
  const cached = cache.get(key);
  if (cached) return cached;
  const radius = Math.max(1, Math.floor(sigma * 3));
  const kernelSize = radius * 2 + 1;
  const kernel = new Float32Array(kernelSize);
  const denom = Math.max(Number.EPSILON, 2 * sigma * sigma);
  let weightSum = 0;
  for (let i = 0; i < kernelSize; i += 1) {
    const offset = i - radius;
    const weight = Math.exp(-(offset * offset) / denom);
    kernel[i] = weight;
    weightSum += weight;
  }
  const normalization = weightSum || 1;
  for (let i = 0; i < kernelSize; i += 1) {
    kernel[i] /= normalization;
  }
  const kernelData: GaussianKernel = { radius, kernel };
  cache.set(key, kernelData);
  return kernelData;
}

function resampleBinsCached(
  values: Float32Array,
  targetBins: number,
  resampleBufferRef: React.MutableRefObject<Float32Array | null>,
  frequencyMin: number,
  frequencyMax: number,
): Float32Array {
  const count = Math.max(1, Math.round(targetBins));
  let result = resampleBufferRef.current;
  if (!result || result.length !== count) {
    result = new Float32Array(count);
    resampleBufferRef.current = result;
  }
  const maxIndex = Math.max(0, values.length - 1);
  if (maxIndex === 0) {
    result.fill(values[0] ?? 0);
    return result;
  }
  const safeMin = clampBetween(frequencyMin, 0, 1);
  const safeMax = clampBetween(frequencyMax, Math.min(1, safeMin + 1e-3), 1);
  const minPos = safeMin * maxIndex;
  const maxPos = safeMax * maxIndex;
  if (count === 1) {
    const position = (minPos + maxPos) * 0.5;
    const lower = Math.floor(position);
    const upper = Math.min(maxIndex, lower + 1);
    const t = position - lower;
    const lowerValue = values[lower] ?? 0;
    const upperValue = values[upper] ?? lowerValue;
    result[0] = lowerValue + (upperValue - lowerValue) * t;
    return result;
  }
  for (let i = 0; i < count; i += 1) {
    const ratio = i / (count - 1);
    const position = minPos + ratio * (maxPos - minPos);
    const lower = Math.floor(position);
    const upper = Math.min(maxIndex, lower + 1);
    const t = position - lower;
    const lowerValue = values[lower] ?? 0;
    const upperValue = values[upper] ?? 0;
    result[i] = lowerValue + (upperValue - lowerValue) * t;
  }
  return result;
}
