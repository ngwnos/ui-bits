import React from "react";
import "./audio-fft-window.css";
export interface AudioFFTWindowProps {
    heightUnits?: number;
    unitSizePx: number;
    maxWidth?: number | string;
    maxBins?: number;
    playbackRatio?: number;
    showPlaybackIndicator?: boolean;
    onScrubStart?: () => void;
    onScrub?: (ratio: number) => void;
    onScrubEnd?: (ratio: number) => void;
    activeColor?: string;
    inactiveColor?: string;
    peakDecay?: number;
    rawFftDataRef?: React.RefObject<Uint8Array | null>;
    rawFrameVersion?: number;
    rawBinCount?: number;
    attackMs?: number;
    releaseMs?: number;
    blurSigma?: number;
    discreteBins?: boolean;
    frequencyMin?: number;
    frequencyMax?: number;
    suspended?: boolean;
}
export default function AudioFFTWindow({ heightUnits, unitSizePx, maxWidth, maxBins, playbackRatio, showPlaybackIndicator, onScrubStart, onScrub, onScrubEnd, activeColor, inactiveColor, peakDecay, rawFftDataRef, rawFrameVersion, rawBinCount, attackMs, releaseMs, blurSigma, discreteBins, frequencyMin, frequencyMax, suspended, }: AudioFFTWindowProps): import("react/jsx-runtime").JSX.Element;
