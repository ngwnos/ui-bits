import React from "react";
import Folder, { type FolderBorderStyle } from "../Folder/Folder";
import SelectionGridWorker from "./selectionGrid.worker?worker&inline";
import "./selectionGrid.css";

const CELL_CORNER_RADIUS_PX = 3;
const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";
const MAX_ATLAS_DIMENSION = 4096;
const MAX_TILE_INFLIGHT = 6;

export type SelectionGridAlignment = "left" | "center" | "right";

export type SelectionGridPreview =
  | { type: "color"; color: string }
  | { type: "image"; src: string };

export type SelectionGridBaseProps = {
  layoutGap?: string;
  maxHeightUnits?: number;
  fontSize?: number;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export type SelectionGridFolder<Item> = {
  id: string;
  label: React.ReactNode;
  items: Item[];
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  colorA?: string;
  colorB?: string;
  borderStyle?: FolderBorderStyle;
};

export type SelectionGridGridProps<Item> = SelectionGridBaseProps & {
  items?: Item[];
  folders?: SelectionGridFolder<Item>[];
  getKey: (item: Item, index: number) => string;
  getPreview: (item: Item, index: number) => SelectionGridPreview;
  getLabel?: (item: Item, index: number) => string;
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  onSelect?: (key: string | null, item: Item | null, index: number | null) => void;
  allowEmptySelection?: boolean;
  squareScale?: number;
  squareAlignment?: SelectionGridAlignment;
  colorA?: string;
  colorB?: string;
};

export type SelectionGridProps<Item = unknown> = SelectionGridGridProps<Item>;

type CachedTile = {
  status: "loading" | "ready" | "error";
  bitmap?: ImageBitmap;
};

type AtlasLayout = {
  key: string;
  columns: number;
  rows: number;
  tileSize: number;
};

type CornerRadii = {
  tl: number;
  tr: number;
  br: number;
  bl: number;
};

function buildRoundedRectPath(
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

function resolveWorkerUrl(src: string) {
  if (typeof window === "undefined") return src;
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}

function computeAtlasColumns(count: number, size: number) {
  const safeSize = Math.max(1, Math.floor(size));
  const maxColumns = Math.max(1, Math.floor(MAX_ATLAS_DIMENSION / safeSize));
  const maxRows = Math.max(1, Math.floor(MAX_ATLAS_DIMENSION / safeSize));
  if (count <= 0) return 1;
  return Math.min(maxColumns, Math.max(1, Math.ceil(count / maxRows)));
}

function createAtlasCanvas(width: number, height: number) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createSelectionGridWorker() {
  return new SelectionGridWorker();
}

export default function SelectionGrid<Item>(props: SelectionGridGridProps<Item>) {
  const {
    items,
    folders,
    getKey,
    getPreview,
    getLabel,
    selectedKey,
    defaultSelectedKey = null,
    onSelect,
    allowEmptySelection = false,
    squareScale = 1,
    squareAlignment = "left",
    colorA = FALLBACK_COLOR_A,
    colorB = FALLBACK_COLOR_B,
    layoutGap = "6px",
    maxHeightUnits = 24,
    fontSize,
    maxWidth = 360,
    className,
    style,
  } = props;

  const [internalSelectedKey, setInternalSelectedKey] = React.useState<string | null>(defaultSelectedKey);
  const [internalFolderCollapsed, setInternalFolderCollapsed] = React.useState<Record<string, boolean>>({});
  const isControlled = selectedKey !== undefined;
  const resolvedSelectedKey = isControlled ? selectedKey ?? null : internalSelectedKey;

  const resolvedSquareScale = Number.isFinite(squareScale) && squareScale > 0 ? squareScale : 1;
  const resolvedSquareAlignment = squareAlignment ?? "left";

  const resolvedItems = items ?? [];
  const resolvedFolders = folders ?? [];
  const usesFolders = resolvedFolders.length > 0;

  const allEntries = React.useMemo(() => {
    if (usesFolders) {
      const entries: Array<{ item: Item; index: number; key: string }> = [];
      let cursor = 0;
      resolvedFolders.forEach((folder) => {
        folder.items.forEach((item) => {
          const key = getKey(item, cursor);
          entries.push({ item, index: cursor, key });
          cursor += 1;
        });
      });
      return entries;
    }
    return resolvedItems.map((item, index) => ({
      item,
      index,
      key: getKey(item, index),
    }));
  }, [getKey, resolvedFolders, resolvedItems, usesFolders]);

  const allItemKeys = React.useMemo(
    () => allEntries.map((entry) => entry.key),
    [allEntries],
  );

  React.useEffect(() => {
    if (isControlled) return;
    if (resolvedSelectedKey == null) return;
    if (!allItemKeys.includes(resolvedSelectedKey)) {
      setInternalSelectedKey(null);
    }
  }, [allItemKeys, isControlled, resolvedSelectedKey]);

  React.useEffect(() => {
    if (!usesFolders) return;
    setInternalFolderCollapsed((prev) => {
      let changed = false;
      const next = { ...prev };
      resolvedFolders.forEach((folder) => {
        if (folder.collapsed !== undefined) return;
        if (next[folder.id] !== undefined) return;
        if (folder.defaultCollapsed === undefined) return;
        next[folder.id] = folder.defaultCollapsed;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [resolvedFolders, usesFolders]);

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(360);

  React.useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width) return;
      const nextWidth = Math.round(rect.width);
      setContainerWidth((prev) => (Math.abs(prev - nextWidth) < 0.5 ? prev : nextWidth));
    };
    measure();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(node);
    } else {
      window.addEventListener("resize", measure);
    }
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const previewFontSize = fontSize ?? 16;
  const previewLineHeight = 1;
  const previewPaddingEm = 0.35;
  const previewPaddingPx = previewFontSize * previewPaddingEm;
  const baseLabelHeight = previewFontSize * previewLineHeight;
  const baseCellSize = Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2),
    Math.round(previewFontSize + previewPaddingPx * 1.5),
  );
  const cellSizePx = baseCellSize * resolvedSquareScale;
  const rowCapacity = containerWidth ? Math.max(1, Math.floor(containerWidth / cellSizePx)) : 1;
  const containerWidthPx = rowCapacity * cellSizePx;

  const visibleEntries = React.useMemo(() => {
    if (!usesFolders) return allEntries;
    const entries: Array<{ item: Item; index: number; key: string }> = [];
    let cursor = 0;
    resolvedFolders.forEach((folder) => {
      const collapsed = folder.collapsed ?? internalFolderCollapsed[folder.id] ?? false;
      if (collapsed) {
        cursor += folder.items.length;
        return;
      }
      folder.items.forEach((item) => {
        const key = getKey(item, cursor);
        entries.push({ item, index: cursor, key });
        cursor += 1;
      });
    });
    return entries;
  }, [allEntries, getKey, internalFolderCollapsed, resolvedFolders, usesFolders]);

  const gridCellCount = visibleEntries.length;

  type GridRow =
    | { type: "header"; folderIndex: number; alignmentOffsetPx: number }
    | { type: "items"; startIndex: number; count: number; alignmentOffsetPx: number };

  const gridRows = React.useMemo(() => {
    if (!usesFolders) {
      const rows: GridRow[] = [];
      for (let start = 0; start < gridCellCount; start += rowCapacity) {
        const count = Math.min(rowCapacity, gridCellCount - start);
        const leftoverSlots = rowCapacity - count;
        const alignmentOffsetPx = leftoverSlots > 0
          ? resolvedSquareAlignment === "center"
            ? (leftoverSlots * cellSizePx) / 2
            : resolvedSquareAlignment === "right"
              ? leftoverSlots * cellSizePx
              : 0
          : 0;
        rows.push({ type: "items", startIndex: start, count, alignmentOffsetPx });
      }
      return rows;
    }
    const rows: GridRow[] = [];
    let cursor = 0;
    resolvedFolders.forEach((folder, folderIndex) => {
      rows.push({ type: "header", folderIndex, alignmentOffsetPx: 0 });
      const collapsed = folder.collapsed ?? internalFolderCollapsed[folder.id] ?? false;
      if (collapsed) return;
      const visibleCount = folder.items.length;
      for (let start = 0; start < visibleCount; start += rowCapacity) {
        const count = Math.min(rowCapacity, visibleCount - start);
        const leftoverSlots = rowCapacity - count;
        const alignmentOffsetPx = leftoverSlots > 0
          ? resolvedSquareAlignment === "center"
            ? (leftoverSlots * cellSizePx) / 2
            : resolvedSquareAlignment === "right"
              ? leftoverSlots * cellSizePx
              : 0
          : 0;
        rows.push({ type: "items", startIndex: cursor + start, count, alignmentOffsetPx });
      }
      cursor += visibleCount;
    });
    return rows;
  }, [
    cellSizePx,
    gridCellCount,
    internalFolderCollapsed,
    resolvedFolders,
    resolvedSquareAlignment,
    rowCapacity,
    usesFolders,
  ]);

  const rowCount = gridRows.length;
  const totalGridHeightPx = rowCount * cellSizePx;

  const resolvedMaxHeightUnits = typeof maxHeightUnits === "number" && Number.isFinite(maxHeightUnits) && maxHeightUnits > 0
    ? maxHeightUnits
    : null;
  const totalRowUnits = rowCount * resolvedSquareScale;
  const gridMaxHeightPx = resolvedMaxHeightUnits != null ? resolvedMaxHeightUnits * baseCellSize : null;
  const clampGridHeight = resolvedMaxHeightUnits != null && totalRowUnits > resolvedMaxHeightUnits;
  const resolvedMaxWidth = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: resolvedMaxWidth,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: layoutGap,
    alignItems: "stretch",
    ...(style ?? {}),
  };

  const commitSelection = (key: string | null, item: Item | null, index: number | null) => {
    if (!isControlled) {
      setInternalSelectedKey(key);
    }
    onSelect?.(key, item, index);
  };

  const workerRef = React.useRef<Worker | null>(null);
  const tileCacheRef = React.useRef<Map<string, CachedTile>>(new Map());
  const pendingRef = React.useRef<Set<string>>(new Set());
  const queuedRef = React.useRef<Set<string>>(new Set());
  const queueRef = React.useRef<string[]>([]);
  const tileRequestRef = React.useRef<Map<string, { src: string; size: number }>>(new Map());
  const atlasCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const atlasContextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const atlasLayoutRef = React.useRef<AtlasLayout | null>(null);
  const renderTokenRef = React.useRef(0);
  const atlasSignatureRef = React.useRef<string | null>(null);
  const prefetchSignatureRef = React.useRef<string | null>(null);
  const drawnIndexRef = React.useRef<string[]>([]);
  const drawRef = React.useRef<() => void>(() => undefined);

  const requestRender = React.useCallback(() => {
    if (typeof window === "undefined") return;
    renderTokenRef.current += 1;
    const token = renderTokenRef.current;
    window.requestAnimationFrame(() => {
      if (token !== renderTokenRef.current) return;
      drawRef.current();
    });
  }, []);

  const flushQueue = React.useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    while (pendingRef.current.size < MAX_TILE_INFLIGHT && queueRef.current.length > 0) {
      const nextKey = queueRef.current.shift();
      if (!nextKey) break;
      queuedRef.current.delete(nextKey);
      if (pendingRef.current.has(nextKey)) continue;
      const request = tileRequestRef.current.get(nextKey);
      if (!request) continue;
      pendingRef.current.add(nextKey);
      worker.postMessage({
        type: "imageTile",
        id: nextKey,
        src: request.src,
        size: request.size,
      });
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const worker = createSelectionGridWorker();
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ id: string; bitmap?: ImageBitmap; error?: string }>) => {
      const { id, bitmap, error } = event.data ?? {};
      if (!id) return;
      pendingRef.current.delete(id);
      const entry = tileCacheRef.current.get(id);
      if (entry?.bitmap && entry.bitmap !== bitmap) {
        entry.bitmap.close();
      }
      if (error) {
        tileCacheRef.current.set(id, { status: "error" });
        bitmap?.close();
      } else if (bitmap) {
        tileCacheRef.current.set(id, { status: "ready", bitmap });
      }
      flushQueue();
      requestRender();
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
      tileCacheRef.current.forEach((entry) => entry.bitmap?.close());
      tileCacheRef.current.clear();
      pendingRef.current.clear();
      queuedRef.current.clear();
      queueRef.current = [];
      tileRequestRef.current.clear();
      atlasCanvasRef.current = null;
      atlasContextRef.current = null;
      atlasLayoutRef.current = null;
      atlasSignatureRef.current = null;
      prefetchSignatureRef.current = null;
      drawnIndexRef.current = [];
    };
  }, [flushQueue, requestRender]);

  React.useEffect(() => {
    requestRender();
  }, [
    visibleEntries,
    resolvedSelectedKey,
    containerWidth,
    cellSizePx,
    colorA,
    colorB,
    rowCapacity,
    rowCount,
    gridCellCount,
    requestRender,
  ]);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    const handleScroll = () => requestRender();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [requestRender]);

  drawRef.current = () => {
    const canvas = canvasRef.current;
    const scrollNode = scrollRef.current;
    if (!canvas || !scrollNode) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const viewportWidth = Math.max(1, Math.round(containerWidthPx));
    const viewportHeight = Math.max(1, Math.round(scrollNode.clientHeight || totalGridHeightPx));
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const pixelWidth = Math.max(1, Math.round(viewportWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(viewportHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    if (gridCellCount === 0) return;

    const scrollTop = scrollNode.scrollTop;
    const startRow = Math.max(0, Math.floor(scrollTop / cellSizePx) - 1);
    const endRow = Math.min(rowCount - 1, Math.floor((scrollTop + viewportHeight) / cellSizePx) + 1);
    const targetSize = Math.max(1, Math.round(cellSizePx * dpr));
    const previews: SelectionGridPreview[] = new Array(gridCellCount);
    const tileKeys: string[] = new Array(gridCellCount);
    const activeImageKeys = new Set<string>();
    for (let index = 0; index < gridCellCount; index += 1) {
      const entry = visibleEntries[index];
      const preview = getPreview(entry.item, entry.index);
      previews[index] = preview;
      if (preview.type === "color") {
        tileKeys[index] = `color:${preview.color}`;
      } else {
        const resolvedSrc = resolveWorkerUrl(preview.src);
        const tileKey = `image:${resolvedSrc}|${targetSize}`;
        tileKeys[index] = tileKey;
        activeImageKeys.add(tileKey);
        tileRequestRef.current.set(tileKey, { src: resolvedSrc, size: targetSize });
      }
    }
    const atlasColumns = computeAtlasColumns(gridCellCount, targetSize);
    const atlasRows = Math.max(1, Math.ceil(gridCellCount / atlasColumns));
    const atlasKey = `${targetSize}|${atlasColumns}|${tileKeys.join("|")}`;
    if (atlasSignatureRef.current !== atlasKey) {
      atlasSignatureRef.current = atlasKey;
      prefetchSignatureRef.current = null;
      const atlasWidth = atlasColumns * targetSize;
      const atlasHeight = atlasRows * targetSize;
      const atlasCanvas = createAtlasCanvas(atlasWidth, atlasHeight);
      atlasCanvasRef.current = atlasCanvas;
      atlasContextRef.current = atlasCanvas?.getContext("2d") ?? null;
      atlasLayoutRef.current = {
        key: atlasKey,
        columns: atlasColumns,
        rows: atlasRows,
        tileSize: targetSize,
      };
      drawnIndexRef.current = new Array(gridCellCount).fill("");
      if (atlasContextRef.current) {
        atlasContextRef.current.clearRect(0, 0, atlasWidth, atlasHeight);
        for (let index = 0; index < gridCellCount; index += 1) {
          const preview = previews[index];
          if (preview.type !== "color") continue;
          const x = (index % atlasColumns) * targetSize;
          const y = Math.floor(index / atlasColumns) * targetSize;
          atlasContextRef.current.fillStyle = preview.color;
          atlasContextRef.current.fillRect(x, y, targetSize, targetSize);
          drawnIndexRef.current[index] = tileKeys[index];
        }
      }
      tileCacheRef.current.forEach((entry, key) => {
        if (!activeImageKeys.has(key)) {
          entry.bitmap?.close();
          tileCacheRef.current.delete(key);
        }
      });
      pendingRef.current.forEach((key) => {
        if (!activeImageKeys.has(key)) {
          pendingRef.current.delete(key);
        }
      });
      queueRef.current = queueRef.current.filter((key) => activeImageKeys.has(key));
      queuedRef.current = new Set(queueRef.current);
      tileRequestRef.current.forEach((_, key) => {
        if (!activeImageKeys.has(key)) {
          tileRequestRef.current.delete(key);
        }
      });
    }

    for (let row = startRow; row <= endRow; row += 1) {
      const rowModel = gridRows[row];
      if (!rowModel || rowModel.type !== "items") continue;
      const rowOffset = rowModel.alignmentOffsetPx;
      const rowCellCount = rowModel.count;
      const rowBaseIndex = rowModel.startIndex;
      const y = row * cellSizePx - scrollTop;

      for (let col = 0; col < rowCellCount; col += 1) {
        const index = rowBaseIndex + col;
        if (index >= gridCellCount) break;
        const entry = visibleEntries[index];
        const itemKey = entry?.key ?? String(index);
        const isSelected = resolvedSelectedKey != null && itemKey === resolvedSelectedKey;
        const aboveRow = row > 0 ? gridRows[row - 1] : null;
        const belowRow = row + 1 < gridRows.length ? gridRows[row + 1] : null;
        const hasTopNeighbor = aboveRow?.type === "items" && col < aboveRow.count;
        const hasBottomNeighbor = belowRow?.type === "items" && col < belowRow.count;
        const hasLeftNeighbor = col > 0;
        const hasRightNeighbor = col < rowCellCount - 1;
        const radii: CornerRadii = {
          tl: (hasTopNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          tr: (hasTopNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          br: (hasBottomNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          bl: (hasBottomNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
        };
        const x = rowOffset + col * cellSizePx;

        const preview = previews[index];
        const tileKey = tileKeys[index];
        const atlasCanvas = atlasCanvasRef.current;
        const atlasLayout = atlasLayoutRef.current;
        const atlasCtx = atlasContextRef.current;
        let tileDrawn = drawnIndexRef.current[index] === tileKey;

        if (preview.type === "image") {
          const tileEntry = tileCacheRef.current.get(tileKey);
          if (tileEntry?.status === "ready" && tileEntry.bitmap && atlasCtx && atlasLayout && !tileDrawn) {
            const atlasX = (index % atlasLayout.columns) * atlasLayout.tileSize;
            const atlasY = Math.floor(index / atlasLayout.columns) * atlasLayout.tileSize;
            atlasCtx.drawImage(tileEntry.bitmap, atlasX, atlasY, atlasLayout.tileSize, atlasLayout.tileSize);
            drawnIndexRef.current[index] = tileKey;
            tileDrawn = true;
          }
          if (!tileEntry) {
            tileCacheRef.current.set(tileKey, { status: "loading" });
          }
          if (!tileEntry || tileEntry.status === "loading") {
            if (!pendingRef.current.has(tileKey) && !queuedRef.current.has(tileKey)) {
              queueRef.current.push(tileKey);
              queuedRef.current.add(tileKey);
            }
          }
        }

        if (atlasCanvas && atlasLayout && tileDrawn) {
          const srcX = (index % atlasLayout.columns) * atlasLayout.tileSize;
          const srcY = Math.floor(index / atlasLayout.columns) * atlasLayout.tileSize;
          ctx.save();
          buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
          ctx.clip();
          ctx.drawImage(
            atlasCanvas,
            srcX,
            srcY,
            atlasLayout.tileSize,
            atlasLayout.tileSize,
            x,
            y,
            cellSizePx,
            cellSizePx,
          );
          ctx.restore();
        } else if (preview.type === "color") {
          buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
          ctx.fillStyle = preview.color;
          ctx.fill();
        } else {
          buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
          ctx.fillStyle = colorA;
          ctx.fill();
        }

        if (isSelected) {
          ctx.save();
          ctx.strokeStyle = colorB;
          ctx.lineWidth = 2;
          buildRoundedRectPath(ctx, x + 1, y + 1, cellSizePx - 2, radii);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if (prefetchSignatureRef.current !== atlasKey) {
      prefetchSignatureRef.current = atlasKey;
      for (let index = 0; index < gridCellCount; index += 1) {
        const preview = previews[index];
        if (preview.type !== "image") continue;
        const tileKey = tileKeys[index];
        const entry = tileCacheRef.current.get(tileKey);
        if (entry?.status === "ready" || entry?.status === "error" || entry?.status === "loading") continue;
        if (pendingRef.current.has(tileKey) || queuedRef.current.has(tileKey)) continue;
        queueRef.current.push(tileKey);
        queuedRef.current.add(tileKey);
        tileCacheRef.current.set(tileKey, { status: "loading" });
      }
    }

    flushQueue();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const scrollNode = scrollRef.current;
    if (!canvas || !scrollNode) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top + scrollNode.scrollTop;
    if (x < 0 || y < 0) return;
    const row = Math.floor(y / cellSizePx);
    if (row < 0 || row >= rowCount) return;
    const rowModel = gridRows[row];
    if (!rowModel || rowModel.type !== "items") return;
    const rowOffset = rowModel.alignmentOffsetPx;
    const rowCellCount = rowModel.count;
    if (x < rowOffset || x > rowOffset + rowCellCount * cellSizePx) return;
    const col = Math.floor((x - rowOffset) / cellSizePx);
    if (col < 0 || col >= rowCellCount) return;
    const index = rowModel.startIndex + col;
    if (index < 0 || index >= visibleEntries.length) return;
    const entry = visibleEntries[index];
    const item = entry.item;
    const key = entry.key ?? String(index);
    const isSelected = resolvedSelectedKey != null && key === resolvedSelectedKey;
    if (isSelected) {
      if (allowEmptySelection) {
        commitSelection(null, null, null);
      }
      return;
    }
    commitSelection(key, item, index);
  };

  const hoverTitle = React.useMemo(() => {
    if (!getLabel) return undefined;
    if (resolvedSelectedKey == null) return undefined;
    const entry = allEntries.find((candidate) => candidate.key === resolvedSelectedKey);
    if (!entry) return undefined;
    return getLabel(entry.item, entry.index);
  }, [allEntries, getLabel, resolvedSelectedKey]);

  const headerRows = React.useMemo(() => {
    if (!usesFolders) return [];
    return gridRows.flatMap((row, rowIndex) => (
      row.type === "header"
        ? [{ rowIndex, folderIndex: row.folderIndex, top: rowIndex * cellSizePx }]
        : []
    ));
  }, [cellSizePx, gridRows, usesFolders]);

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: `${containerWidthPx}px`,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            ref={scrollRef}
            className="selection-grid__scroll"
            style={{
              position: "relative",
              width: "100%",
              height: clampGridHeight && gridMaxHeightPx != null
                ? `${gridMaxHeightPx}px`
                : `${totalGridHeightPx}px`,
              maxHeight: gridMaxHeightPx != null ? `${gridMaxHeightPx}px` : undefined,
              overflowY: clampGridHeight ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
            title={hoverTitle}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                left: 0,
                height: 0,
                overflow: "visible",
                zIndex: 1,
              }}
            >
              <canvas
                ref={canvasRef}
                className="selection-grid__canvas"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
                onPointerDown={handlePointerDown}
              />
            </div>
            {usesFolders && headerRows.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${totalGridHeightPx}px`,
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              >
                {headerRows.map((header) => {
                  const folder = resolvedFolders[header.folderIndex];
                  if (!folder) return null;
                  const collapsed = folder.collapsed ?? internalFolderCollapsed[folder.id] ?? false;
                  return (
                    <div
                      key={`${folder.id}-${header.rowIndex}`}
                      style={{
                        position: "absolute",
                        top: `${header.top}px`,
                        left: 0,
                        width: "100%",
                        height: `${cellSizePx}px`,
                        pointerEvents: "auto",
                      }}
                    >
                      <Folder
                        label={folder.label}
                        collapsed={collapsed}
                        onCollapseChange={(next) => {
                          if (folder.collapsed === undefined) {
                            setInternalFolderCollapsed((prev) => ({ ...prev, [folder.id]: next }));
                          }
                          folder.onCollapseChange?.(next);
                        }}
                        colorA={folder.colorA ?? colorA}
                        colorB={folder.colorB ?? colorB}
                        borderStyle={folder.borderStyle ?? "none"}
                        fontSize={previewFontSize}
                        headerHeight={cellSizePx}
                        padding={0}
                        verticalGap={0}
                        keepMounted={false}
                        showBody={false}
                        style={{ height: `${cellSizePx}px` }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ width: "100%", height: `${totalGridHeightPx}px` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
