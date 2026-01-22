export type Waveform = "sine" | "triangle" | "saw" | "square" | "audio";
export interface LfoSettings {
    enabled: boolean;
    frequency: number;
    depth: number;
    offset?: number;
    phase?: number;
    waveform: Waveform;
    invert?: boolean;
}
export declare function clamp(n: number, lo: number, hi: number): number;
export declare function snapToStep(n: number, min: number, step: number): number;
export declare function splitFromValue(value: number, min: number, max: number): number;
export declare function valueFromSplit(split: number, min: number, max: number, step: number): number;
export declare function lfoValue(settings: LfoSettings, tSec: number, min: number, max: number): number;
export declare function phaseCaptureForTriangle(current: number, min: number, max: number, centerBias?: number): number;
