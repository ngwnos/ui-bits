export declare const CELL_CORNER_RADIUS_PX = 3;
export declare const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
export declare const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
export declare const MAX_ATLAS_DIMENSION = 4096;
export declare const MAX_TILE_INFLIGHT = 6;
export type CachedTile = {
    status: "loading" | "ready" | "error";
    bitmap?: ImageBitmap;
};
export type AtlasLayout = {
    key: string;
    columns: number;
    rows: number;
    tileSize: number;
};
export type CornerRadii = {
    tl: number;
    tr: number;
    br: number;
    bl: number;
};
export declare function buildRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, radii: CornerRadii): void;
export declare function resolveWorkerUrl(src: string, baseUrl?: string): string;
export declare function computeAtlasColumns(count: number, size: number, maxDimension?: number): number;
export declare function createAtlasCanvas(width: number, height: number): HTMLCanvasElement | null;
