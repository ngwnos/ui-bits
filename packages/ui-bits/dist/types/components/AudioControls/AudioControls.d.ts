import { type AudioAnalysisStore } from "../../audioAnalysis";
export type AudioControlsBorder = 'a' | 'b' | 'none';
export type AudioControlsBinInterpolation = 'discrete' | 'interpolated';
export type AudioControlsSource = {
    type: "buffer";
    src: string;
    loop?: boolean;
} | {
    type: "mediaStream";
    stream: MediaStream;
    context?: AudioContext;
} | {
    type: "audioNode";
    node: AudioNode & {
        context: AudioContext;
    };
};
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
export default function AudioControls({ ariaLabel, fontSize, colorA, colorB, borderStyle, source, heightUnits, suspended, audioAnalysisStore, controlIdPrefix, controlIds, defaultPlaying, playing, onPlayingChange, defaultMuted, muted, onMutedChange, defaultBinCount, binCount, onBinCountChange, defaultBinInterpolation, binInterpolation, onBinInterpolationChange, defaultFrequencyMin, frequencyMin, onFrequencyMinChange, defaultFrequencyMax, frequencyMax, onFrequencyMaxChange, defaultFftAttack, fftAttack, onFftAttackChange, defaultFftRelease, fftRelease, onFftReleaseChange, defaultFftBlurSigma, fftBlurSigma, onFftBlurSigmaChange, defaultAnalyserSmoothing, analyserSmoothing, onAnalyserSmoothingChange, }: AudioControlsProps): import("react/jsx-runtime").JSX.Element;
