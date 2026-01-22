export declare function loadTilePixels(src: string): Promise<{
    data: Uint8Array;
    width: number;
    height: number;
}>;
export declare function colorizeTile(tile: {
    data: Uint8Array;
    width: number;
    height: number;
}, palette: Uint8ClampedArray): string | null;
