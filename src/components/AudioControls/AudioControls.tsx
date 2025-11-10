import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import AudioFFTWindow from "../AudioFFTWindow/AudioFFTWindow";
import LFOSlider from "../LFOSlider";
import { useSliderStoreState, useSliderActions } from "../../sliderStore";
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

function applyGaussianBlur(values: Float32Array, sigma: number): Float32Array {
  if (sigma <= 0) return values;
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
  for (let i = 0; i < kernelSize; i += 1) {
    kernel[i] /= weightSum || 1;
  }
  const result = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let sample = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const idx = clampBetween(i + k, 0, values.length - 1);
      sample += values[idx] * kernel[k + radius];
    }
    result[i] = sample;
  }
  return result;
}

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
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [playheadRatio, setPlayheadRatio] = React.useState<number>(0);
  const [isScrubbing, setIsScrubbing] = React.useState<boolean>(false);
  const [seekCommand, setSeekCommand] = React.useState<{ ratio: number; token: number } | null>(null);
  const seekTokenRef = React.useRef<number>(0);
  const [binSliderValue, setBinSliderValue] = React.useState<number>(256);
  const [attackValue, setAttackValue] = React.useState<number>(fftAttack);
  const [releaseValue, setReleaseValue] = React.useState<number>(fftRelease);
  const smoothedBinsRef = React.useRef<Float32Array | null>(null);
  const clampBins = React.useCallback((value: number) => clampBetween(Math.round(value || 0), 1, 1024), []);
  const { audioBins } = useSliderStoreState();
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
  const attackWeight = clamp01(attackValue);
  const releaseWeight = clamp01(releaseValue);
  const blurSigma = Math.max(0, fftBlurSigma || 0);
  const analyserSmoothingValue = clamp01(analyserSmoothing ?? 0.8);

  const issueSeek = React.useCallback((ratio: number) => {
    const clamped = clamp01(ratio);
    seekTokenRef.current += 1;
    setSeekCommand({ ratio: clamped, token: seekTokenRef.current });
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
    smoothedBinsRef.current = null;
  }, [attackWeight, releaseWeight]);

  React.useEffect(() => {
    if (!audioBins || audioBins.length === 0) {
      smoothedBinsRef.current = null;
    }
  }, [audioBins]);

  const smoothedBins = React.useMemo(() => {
    if (!audioBins || audioBins.length === 0) {
      smoothedBinsRef.current = null;
      return undefined;
    }
    const previous = smoothedBinsRef.current;
    const next = new Float32Array(audioBins.length);
    for (let i = 0; i < audioBins.length; i += 1) {
      const value = audioBins[i] ?? 0;
      const prevValue = previous ? previous[i] ?? value : value;
      const weight = value >= prevValue ? attackWeight : releaseWeight;
      next[i] = prevValue + (value - prevValue) * weight;
    }
    smoothedBinsRef.current = next;
    return next;
  }, [audioBins, attackWeight, releaseWeight]);

  const processedBins = React.useMemo(() => {
    const base = smoothedBins ?? (audioBins ? Float32Array.from(audioBins) : undefined);
    if (!base) return undefined;
    if (blurSigma > 0.001) {
      return applyGaussianBlur(base, blurSigma);
    }
    return base;
  }, [audioBins, smoothedBins, blurSigma]);

  const resizedBins = React.useMemo(() => {
    const source = processedBins ?? audioBins;
    if (!source || source.length === 0) return undefined;
    const targetBins = clampBins(binSliderValue);
    const sourceLength = source.length;
    if (targetBins === sourceLength) return source;
    if (targetBins <= 1) {
      return [source[0] ?? 0];
    }
    const result = new Array<number>(targetBins);
    for (let i = 0; i < targetBins; i += 1) {
      const position = (i / (targetBins - 1)) * (sourceLength - 1);
      const lower = Math.floor(position);
      const upper = Math.min(sourceLength - 1, lower + 1);
      const t = position - lower;
      const lowerValue = source[lower] ?? 0;
      const upperValue = source[upper] ?? 0;
      result[i] = lowerValue + (upperValue - lowerValue) * t;
    }
    return result;
  }, [processedBins, audioBins, binSliderValue, clampBins]);

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <AudioPlaybackEngine
        src={audioSrc}
        playing={isPlaying}
        onProgress={handleProgress}
        seekTarget={seekCommand}
        analyserSmoothing={analyserSmoothingValue}
      />
      <div
        style={{
          borderTop: `1px solid ${sideBorderColor}`,
          borderLeft: `1px solid ${sideBorderColor}`,
          borderRight: `1px solid ${sideBorderColor}`,
          borderRadius: '3px 3px 0 0',
          borderBottom: 'none',
          overflow: 'hidden',
        }}
      >
        <AudioFFTWindow
          heightUnits={8}
          unitSizePx={sliderUnitPx}
          maxWidth="100%"
          maxBins={binSliderValue}
          bins={resizedBins ?? processedBins ?? audioBins}
          playbackRatio={playheadRatio}
          onScrubStart={handleScrubStart}
          onScrub={handleScrubMove}
          onScrubEnd={handleScrubEnd}
          activeColor={safeA}
          inactiveColor={safeB}
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
              <Volume2 size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
            ) : (
              <VolumeX size={Math.max(14, actionButtonSize - 10)} strokeWidth={1.6} />
            )}
          </button>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
            label="Attack"
            min={0}
            max={1}
            step={0.01}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => attackValue}
            onUserChange={(value: number) => setAttackValue(clamp01(value))}
            onAnimatedUpdate={(value: number) => setAttackValue(clamp01(value))}
            style={{ gap: 0 }}
          />
          <LFOSlider
            label="Release"
            min={0}
            max={1}
            step={0.01}
            width="100%"
            border="left"
            borderMask={{ top: false, bottom: false, right: true, left: true }}
            leftColor={safeA}
            rightColor={safeB}
            fontSize={fontSize}
            mode="external"
            readExternal={() => releaseValue}
            onUserChange={(value: number) => setReleaseValue(clamp01(value))}
            onAnimatedUpdate={(value: number) => setReleaseValue(clamp01(value))}
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
}

function AudioPlaybackEngine({
  src,
  playing,
  seekTarget,
  onProgress,
  analyserSmoothing = 0.8,
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

  React.useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

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
    let cancelled = false;
    async function loadAudio() {
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
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
        analyser.smoothingTimeConstant = clamp01(analyserSmoothing ?? 0.8);
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
    };
  }, [analyserSmoothing, setAudioBinCount, setAudioMaxMagnitude, src, stopSourceImmediate]);

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
    analyser.smoothingTimeConstant = clamp01(analyserSmoothing ?? 0.8);
    analyserRef.current = analyser;
    const normalizedOffset = wrapOffset(typeof offsetSeconds === "number" ? offsetSeconds : getCurrentPlaybackSeconds());
    playbackOffsetRef.current = normalizedOffset;
    playbackStartedAtRef.current = audioContext.currentTime;
    stopSourceImmediate();
    const source = audioContext.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.loop = true;
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
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
  }, [analyserSmoothing, getCurrentPlaybackSeconds, setAudioBinCount, stopSourceImmediate, wrapOffset]);

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
      const normalized: number[] = new Array(data.length);
      for (let i = 0; i < data.length; i += 1) {
        normalized[i] = data[i] / 255;
      }
      setAudioBins(normalized);
    }
    const duration = getDuration();
    if (duration > 0) {
      const ratio = getCurrentPlaybackSeconds() / duration;
      onProgressRef.current?.(ratio);
    }
  });

  return null;
}
