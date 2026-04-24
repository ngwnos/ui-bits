export const CELL_CORNER_RADIUS_PX = 3;
export const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
export const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
export const MAX_ATLAS_DIMENSION = 4096;
export const MAX_TILE_INFLIGHT = 6;

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

export function buildRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radii: CornerRadii,
) {
  const maxRadius = size / 2;
  const tl = Math.min(maxRadius, Math.max(0, radii.tl));
  const tr = Math.min(maxRadius, Math.max(0, radii.tr));
  const br = Math.min(maxRadius, Math.max(0, radii.br));
  const bl = Math.min(maxRadius, Math.max(0, radii.bl));
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + size - tr, y);
  if (tr > 0) ctx.quadraticCurveTo(x + size, y, x + size, y + tr);
  else ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size - br);
  if (br > 0) ctx.quadraticCurveTo(x + size, y + size, x + size - br, y + size);
  else ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + bl, y + size);
  if (bl > 0) ctx.quadraticCurveTo(x, y + size, x, y + size - bl);
  else ctx.lineTo(x, y + size);
  ctx.lineTo(x, y + tl);
  if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y);
  else ctx.lineTo(x, y);
  ctx.closePath();
}

export function resolveWorkerUrl(src: string, baseUrl?: string) {
  const resolvedBaseUrl = baseUrl ?? (typeof window === "undefined" ? undefined : window.location.href);
  if (!resolvedBaseUrl) return src;
  try {
    return new URL(src, resolvedBaseUrl).href;
  } catch {
    return src;
  }
}

export function computeAtlasColumns(count: number, size: number, maxDimension = MAX_ATLAS_DIMENSION) {
  const safeSize = Math.max(1, Math.floor(size));
  const safeMaxDimension = Math.max(1, Math.floor(maxDimension));
  const maxColumns = Math.max(1, Math.floor(safeMaxDimension / safeSize));
  const maxRows = Math.max(1, Math.floor(safeMaxDimension / safeSize));
  if (count <= 0) return 1;
  return Math.min(maxColumns, Math.max(1, Math.ceil(count / maxRows)));
}

export function createAtlasCanvas(width: number, height: number) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
