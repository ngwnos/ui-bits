type MutableRef<T> = {
    current: T;
};
export interface ProcessBinsOptions {
    attackMs: number;
    releaseMs: number;
    dtSec: number;
    blurSigma: number;
    targetBins: number;
    frequencyMin: number;
    frequencyMax: number;
}
export interface SmoothingState {
    previous: Float32Array | null;
    scratch: Float32Array | null;
    length: number;
    hasHistory: boolean;
}
export interface GaussianKernel {
    radius: number;
    kernel: Float32Array;
}
export declare function createSmoothingState(): SmoothingState;
export declare function weightFromTimeMs(ms: number, dtSec: number): number;
export declare function processBinsFromBytes(source: Uint8Array, options: ProcessBinsOptions, smoothingState: SmoothingState, blurBufferRef: MutableRef<Float32Array | null>, resampleBufferRef: MutableRef<Float32Array | null>, kernelCache: Map<number, GaussianKernel>): {
    smoothedSnapshot: Float32Array<ArrayBufferLike>;
    resampled: Float32Array<ArrayBufferLike>;
};
export declare function applyGaussianBlurCached(values: Float32Array, sigma: number, blurBufferRef: MutableRef<Float32Array | null>, kernelCache: Map<number, GaussianKernel>): Float32Array;
export declare function getGaussianKernel(sigma: number, cache: Map<number, GaussianKernel>): GaussianKernel;
export declare function resampleBinsCached(values: Float32Array, targetBins: number, resampleBufferRef: MutableRef<Float32Array | null>, frequencyMin: number, frequencyMax: number): Float32Array;
export {};
