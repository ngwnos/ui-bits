export type MirrorFn = (value: number, tSec: number) => void;
export declare function useStoreMirror(readValue: () => number, mirror: MirrorFn | undefined, throttleMs?: number, epsilon?: number): void;
