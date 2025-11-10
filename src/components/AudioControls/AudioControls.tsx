import React from "react";
import {
  ChartColumnIncreasing,
  ChartSpline,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import AudioFFTWindow from "../AudioFFTWindow/AudioFFTWindow";
import LFOSlider from "../LFOSlider";
import { useSliderActions } from "../../sliderStore";
import { useFrame } from "../LFOSlider";
import { flexoki } from "../../flexoki";

export type AudioControlsBorder = 'a' | 'b' | 'none';

export interface AudioControlsProps {
  fontSize: number;
  colorA?: string;
  colorB?: string;
  borderStyle?: AudioControlsBorder;
  audioSrc?: string;
  fftAttack?: number;
  fftRelease?: number;
  fftBlurSigma?: number;
  analyserSmoothing?: number;
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
const roundUnit = (value: number) => Math.round(clamp01(value) * 10) / 10;
const roundSigma = (value: number) => Math.round(clampBetween(value, 0, 3) * 10) / 10;
const DEFAULT_SAMPLE_RATE = 44100;
const DEFAULT_NYQUIST = DEFAULT_SAMPLE_RATE / 2;
const MIN_FREQ_HZ_GAP = 10;

export default function AudioControls({
  fontSize,
  colorA,
  colorB,
  borderStyle = 'a',
  audioSrc = "/audio/credits.mp3",
  fftAttack = 0.6,
  fftRelease = 0.2,
  fftBlurSigma = 0,
  analyserSmoothing = 0.8,
}: AudioControlsProps) {
  const analyserSmoothingDefault = clamp01(analyserSmoothing ?? 0.8);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(true);
  const [playheadRatio, setPlayheadRatio] = React.useState<number>(0);
  const [isScrubbing, setIsScrubbing] = React.useState<boolean>(false);
  const [seekCommand, setSeekCommand] = React.useState<{ ratio: number; token: number } | null>(null);
  const seekTokenRef = React.useRef<number>(0);
  const [binSliderValue, setBinSliderValue] = React.useState<number>(256);
  const [smoothingValue, setSmoothingValue] = React.useState<number>(() => roundUnit(analyserSmoothingDefault));
  const [attackValue, setAttackValue] = React.useState<number>(() => roundUnit(fftAttack));
  const [releaseValue, setReleaseValue] = React.useState<number>(() => roundUnit(fftRelease));
  const [blurValue, setBlurValue] = React.useState<number>(() => roundSigma(fftBlurSigma ?? 0));
  const [useDiscreteBins, setUseDiscreteBins] = React.useState<boolean>(true);
  const [nyquistHz, setNyquistHz] = React.useState<number>(DEFAULT_NYQUIST);
  const [freqMinRatio, setFreqMinRatio] = React.useState<number>(0);
  const [freqMaxRatio, setFreqMaxRatio] = React.useState<number>(1);
  const rawFftRef = React.useRef<Uint8Array | null>(null);
  const [rawFftMeta, setRawFftMeta] = React.useState<{ version: number; binCount: number }>({ version: 0, binCount: 0 });
  const clampBins = React.useCallback((value: number) => clampBetween(Math.round(value || 0), 1, 1024), []);
  const minGapRatio = React.useMemo(
    () => Math.min(0.5, MIN_FREQ_HZ_GAP / Math.max(nyquistHz, MIN_FREQ_HZ_GAP)),
    [nyquistHz],
  );
  const freqMinHz = React.useMemo(() => freqMinRatio * nyquistHz, [freqMinRatio, nyquistHz]);
  const freqMaxHz = React.useMemo(() => freqMaxRatio * nyquistHz, [freqMaxRatio, nyquistHz]);
  const freqMinRatioClamped = clampBetween(freqMinRatio, 0, 1);
  const freqMaxRatioClamped = clampBetween(freqMaxRatio, 0, 1);

  const handleFreqMinChange = React.useCallback((value: number) => {
    const ratio = nyquistHz > 0 ? value / nyquistHz : 0;
    const maxAllowed = Math.max(0, freqMaxRatio - minGapRatio);
    setFreqMinRatio(clampBetween(ratio, 0, maxAllowed));
  }, [freqMaxRatio, minGapRatio, nyquistHz]);

  const handleFreqMaxChange = React.useCallback((value: number) => {
    const ratio = nyquistHz > 0 ? value / nyquistHz : 1;
    const minAllowed = Math.min(1, freqMinRatio + minGapRatio);
    setFreqMaxRatio(clampBetween(ratio, minAllowed, 1));
  }, [freqMinRatio, minGapRatio, nyquistHz]);

  React.useEffect(() => {
    setFreqMinRatio((prev) => {
      const maxAllowed = Math.max(0, freqMaxRatio - minGapRatio);
      return prev > maxAllowed ? maxAllowed : prev;
    });
  }, [freqMaxRatio, minGapRatio]);

  React.useEffect(() => {
    setFreqMaxRatio((prev) => {
      const minAllowed = Math.min(1, freqMinRatio + minGapRatio);
      return prev < minAllowed ? minAllowed : prev;
    });
  }, [freqMinRatio, minGapRatio]);

  const handleSampleRateChange = React.useCallback((sampleRate: number) => {
    setNyquistHz(Math.max(1, sampleRate / 2));
  }, []);
  const sliderUnitPx = React.useMemo(() => {
    const previewFontSize = fontSize || 16;
    const previewPaddingEm = 0.35;
    const previewPaddingPx = previewFontSize * previewPaddingEm;
    const previewLineHeight = 1;
    const baseLabelHeight = previewFontSize * previewLineHeight;
    return Math.max(
      Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
      Math.round(previewFontSize + previewPaddingPx * 1.5),
    );
  }, [fontSize]);
  const { safeA, safeB } = resolveColors(colorA, colorB);
  const seamColor = safeA;
  const sideBorderColor = borderStyle === 'none'
    ? "transparent"
    : borderStyle === 'b'
      ? safeB
      : safeA;
  const textColor = safeA;
  const actionButtonSize = Math.max(18, sliderUnitPx - 8);
  const playPauseLabel = isPlaying ? "Pause audio analysis" : "Play audio analysis";
  const muteLabel = isMuted ? "Unmute audio output" : "Mute audio output";
  const interpolationLabel = useDiscreteBins ? "Show interpolated FFT bins" : "Show discrete FFT bins";
  const attackWeight = clamp01(attackValue);
  const releaseWeight = clamp01(releaseValue);
  const peakDecayRate = Math.max(0.001, releaseWeight * 0.25);

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
    const clamped = clamp01(ratio);
    if (!isScrubbing) {
      setPlayheadRatio(clamped);
    }
  }, [isScrubbing]);

  const handleScrubStart = React.useCallback(() => {
    setIsScrubbing(true);
  }, []);

  const handleScrubMove = React.useCallback((ratio: number) => {
    const clamped = clamp01(ratio);
    setPlayheadRatio(clamped);
    issueSeek(clamped);
  }, [issueSeek]);

  const handleScrubEnd = React.useCallback((ratio: number) => {
    const clamped = clamp01(ratio);
    setPlayheadRatio(clamped);
    issueSeek(clamped);
    setIsScrubbing(false);
  }, [issueSeek]);

  React.useEffect(() => {
    setSmoothingValue(roundUnit(analyserSmoothingDefault));
  }, [analyserSmoothingDefault]);

  React.useEffect(() => {
    setBlurValue(roundSigma(fftBlurSigma ?? 0));
  }, [fftBlurSigma]);

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          width: '100%',
          minHeight: sliderUnitPx,
          borderTop: `1px solid ${sideBorderColor}`,
          borderLeft: `1px solid ${sideBorderColor}`,
          borderRight: `1px solid ${sideBorderColor}`,
          borderBottom: `1px solid ${safeA}`,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: safeB,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: actionButtonSize + 6 }}>
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-pressed={isPlaying}
              aria-label={playPauseLabel}
              title={playPauseLabel}
              style={{
                width: actionButtonSize,
                height: actionButtonSize,
                borderRadius: 3,
                border: `1px solid ${safeA}`,
                background: isPlaying ? safeA : safeB,
                color: isPlaying ? safeB : safeA,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              {isPlaying ? (
                <Pause size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
              ) : (
                <Play size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
              )}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: actionButtonSize + 6, marginLeft: 2 }}>
            <button
              type="button"
              onClick={() => setUseDiscreteBins((prev) => !prev)}
              aria-pressed={!useDiscreteBins}
              aria-label={interpolationLabel}
              title={interpolationLabel}
              style={{
                width: actionButtonSize,
                height: actionButtonSize,
                borderRadius: 3,
                border: `1px solid ${safeA}`,
                background: useDiscreteBins ? safeA : safeB,
                color: useDiscreteBins ? safeB : safeA,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
              }}
            >
              {useDiscreteBins ? (
                <ChartColumnIncreasing size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
              ) : (
                <ChartSpline size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
              )}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: '0 0.5rem 0 0', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <LFOSlider
            label="Fmin"
            min={0}
            max={Math.max(0, nyquistHz - MIN_FREQ_HZ_GAP)}
            step={1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => freqMinHz}
            onUserChange={handleFreqMinChange}
            onAnimatedUpdate={handleFreqMinChange}
            formatDisplayValue={(value) => `${Math.round(value)} Hz`}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Fmax"
            min={MIN_FREQ_HZ_GAP}
            max={Math.max(MIN_FREQ_HZ_GAP, nyquistHz)}
            step={1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => freqMaxHz}
            onUserChange={handleFreqMaxChange}
            onAnimatedUpdate={handleFreqMaxChange}
            formatDisplayValue={(value) => `${Math.round(value)} Hz`}
            style={{ gap: 0 }}
          />
        </div>
      </div>
      <AudioPlaybackEngine
        src={audioSrc}
        playing={isPlaying}
        onProgress={handleProgress}
        seekTarget={seekCommand}
        analyserSmoothing={smoothingValue}
        attackWeight={attackWeight}
        releaseWeight={releaseWeight}
        blurSigma={blurValue}
        targetBins={clampBins(binSliderValue)}
        onRawFftFrame={handleRawFftData}
        frequencyMin={freqMinRatioClamped}
        frequencyMax={freqMaxRatioClamped}
        onSampleRateChange={handleSampleRateChange}
        muted={isMuted}
      />
      <div
        style={{
          borderTop: `1px solid ${sideBorderColor}`,
          borderLeft: `1px solid ${sideBorderColor}`,
          borderRight: `1px solid ${sideBorderColor}`,
          borderRadius: 0,
          borderBottom: 'none',
          overflow: 'hidden',
        }}
      >
        <AudioFFTWindow
          heightUnits={8}
          unitSizePx={sliderUnitPx}
          maxWidth="100%"
          maxBins={binSliderValue}
          peakDecay={peakDecayRate}
          playbackRatio={playheadRatio}
          onScrubStart={handleScrubStart}
          onScrub={handleScrubMove}
          onScrubEnd={handleScrubEnd}
          activeColor={safeA}
          inactiveColor={safeB}
          rawFftDataRef={rawFftRef}
          rawFrameVersion={rawFftMeta.version}
          attackWeight={attackWeight}
          releaseWeight={releaseWeight}
          blurSigma={blurValue}
          discreteBins={useDiscreteBins}
          frequencyMin={freqMinRatioClamped}
          frequencyMax={freqMaxRatioClamped}
        />
      </div>
      <div
        style={{
          width: '100%',
          minHeight: sliderUnitPx,
          borderTop: `1px solid ${seamColor}`,
          borderLeft: `1px solid ${sideBorderColor}`,
          borderRight: `1px solid ${sideBorderColor}`,
          borderBottom: `1px solid ${sideBorderColor}`,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          background: safeB,
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: actionButtonSize + 6,
          }}
        >
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            aria-pressed={!isMuted}
            aria-label={muteLabel}
            title={muteLabel}
            style={{
              width: actionButtonSize,
              height: actionButtonSize,
              borderRadius: 3,
              border: `1px solid ${safeA}`,
              background: isMuted ? safeB : safeA,
              color: isMuted ? safeA : safeB,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
            }}
          >
            {isMuted ? (
              <VolumeX size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
            ) : (
              <Volume2 size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
            )}
          </button>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 8,
            padding: '0 0.5rem 0 0',
          }}
        >
          <LFOSlider
            label="Bins"
            min={1}
            max={1024}
            step={1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => binSliderValue}
            onUserChange={(value: number) => {
              setBinSliderValue((prev) => {
                const next = clampBins(value);
                return prev === next ? prev : next;
              });
            }}
            onAnimatedUpdate={(value: number) => {
              setBinSliderValue((prev) => {
                const next = clampBins(value);
                return prev === next ? prev : next;
              });
            }}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Atk"
            min={0}
            max={1}
            step={0.1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => attackValue}
            onUserChange={(value: number) => setAttackValue(roundUnit(value))}
            onAnimatedUpdate={(value: number) => setAttackValue(roundUnit(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Rel"
            min={0}
            max={1}
            step={0.1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => releaseValue}
            onUserChange={(value: number) => setReleaseValue(roundUnit(value))}
            onAnimatedUpdate={(value: number) => setReleaseValue(roundUnit(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Smooth"
            min={0}
            max={1}
            step={0.1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => smoothingValue}
            onUserChange={(value: number) => setSmoothingValue(roundUnit(value))}
            onAnimatedUpdate={(value: number) => setSmoothingValue(roundUnit(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="σ"
            min={0}
            max={3}
            step={0.1}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => blurValue}
            onUserChange={(value: number) => setBlurValue(roundSigma(value))}
            onAnimatedUpdate={(value: number) => setBlurValue(roundSigma(value))}
            formatDisplayValue={(value) => value.toFixed(1)}
            style={{ gap: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

interface AudioPlaybackEngineProps {
  src: string;
  playing: boolean;
  seekTarget?: { ratio: number; token: number } | null;
  onProgress?: (ratio: number) => void;
  analyserSmoothing?: number;
  attackWeight?: number;
  releaseWeight?: number;
  blurSigma?: number;
  targetBins?: number;
  onRawFftFrame?: (data: Uint8Array) => void;
  frequencyMin?: number;
  frequencyMax?: number;
  onSampleRateChange?: (sampleRate: number) => void;
  muted?: boolean;
}

function AudioPlaybackEngine({
  src,
  playing,
  seekTarget,
  onProgress,
  analyserSmoothing = 0.8,
  attackWeight = 0.6,
  releaseWeight = 0.2,
  blurSigma = 0,
  targetBins = 1024,
  onRawFftFrame,
  frequencyMin = 0,
  frequencyMax = 1,
  onSampleRateChange,
  muted = true,
}: AudioPlaybackEngineProps) {
  const {
    setAudioBins,
    setAudioBinCount,
    setAudioMaxMagnitude,
  } = useSliderActions();
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const bufferRef = React.useRef<Uint8Array | null>(null);
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
          try {
            audioContext.close();
          } catch {
            // ignore double-close
          }
          return;
        }
        audioBufferRef.current = audioBuffer;
        playbackOffsetRef.current = 0;
        playbackStartedAtRef.current = null;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = analyserSmoothingRef.current;
        analyserRef.current = analyser;
        bufferRef.current = new Uint8Array(analyser.frequencyBinCount);
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
      try {
        audioContextRef.current?.close();
      } catch {
        // ignore double-close
      }
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
    source.loop = true;
    const silentGain = audioContext.createGain();
    silentGain.gain.value = mutedRef.current ? 0 : 1;
    source.connect(analyser);
    analyser.connect(silentGain);
    silentGain.connect(audioContext.destination);
    source.start(0, normalizedOffset);
    sourceRef.current = source;
    silentGainRef.current = silentGain;
    if (!bufferRef.current) {
      bufferRef.current = new Uint8Array(analyser.frequencyBinCount);
      setAudioBinCount(analyser.frequencyBinCount);
    }
  }, [getCurrentPlaybackSeconds, setAudioBinCount, stopSourceImmediate, wrapOffset]);

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

  useFrame(() => {
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
          attackWeight: clamp01(attackWeight),
          releaseWeight: clamp01(releaseWeight),
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

interface ProcessBinsOptions {
  attackWeight: number;
  releaseWeight: number;
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
  const attackWeight = clamp01(options.attackWeight);
  const releaseWeight = clamp01(options.releaseWeight);
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
