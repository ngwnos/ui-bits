import React from "react";
import SelectionGridWorker from "./selectionGrid.worker?worker&inline";
import "./selectionGrid.css";

const CELL_CORNER_RADIUS_PX = 3;
const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";

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

export type SelectionGridGridProps<Item> = SelectionGridBaseProps & {
  items: Item[];
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

type CachedBitmap = {
  status: "loading" | "ready" | "error";
  bitmap?: ImageBitmap;
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

function createSelectionGridWorker() {
  return new SelectionGridWorker();
}

export default function SelectionGrid<Item>(props: SelectionGridGridProps<Item>) {
  const {
    items,
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
  const isControlled = selectedKey !== undefined;
  const resolvedSelectedKey = isControlled ? selectedKey ?? null : internalSelectedKey;

  const resolvedSquareScale = Number.isFinite(squareScale) && squareScale > 0 ? squareScale : 1;
  const resolvedSquareAlignment = squareAlignment ?? "left";

  const itemKeys = React.useMemo(
    () => items.map((item, index) => getKey(item, index)),
    [getKey, items],
  );

  React.useEffect(() => {
    if (isControlled) return;
    if (resolvedSelectedKey == null) return;
    if (!itemKeys.includes(resolvedSelectedKey)) {
      setInternalSelectedKey(null);
    }
  }, [isControlled, itemKeys, resolvedSelectedKey]);

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
  const gridCellCount = items.length;
  const rowCapacity = containerWidth ? Math.max(1, Math.floor(containerWidth / cellSizePx)) : 1;
  const rowCount = gridCellCount > 0 ? Math.ceil(gridCellCount / rowCapacity) : 0;
  const lastRowCount = gridCellCount === 0
    ? 0
    : rowCapacity >= gridCellCount
      ? gridCellCount
      : gridCellCount % rowCapacity || rowCapacity;
  const leftoverSlots = rowCapacity > lastRowCount ? rowCapacity - lastRowCount : 0;
  const lastRowIndex = gridCellCount === 0 ? 0 : Math.floor((gridCellCount - 1) / rowCapacity);
  const alignmentOffsetPx = leftoverSlots > 0
    ? resolvedSquareAlignment === "center"
      ? (leftoverSlots * cellSizePx) / 2
      : resolvedSquareAlignment === "right"
        ? leftoverSlots * cellSizePx
        : 0
    : 0;
  const containerWidthPx = rowCapacity * cellSizePx;

  const resolvedMaxHeightUnits = typeof maxHeightUnits === "number" && Number.isFinite(maxHeightUnits) && maxHeightUnits > 0
    ? maxHeightUnits
    : null;
  const totalRowUnits = rowCount * resolvedSquareScale;
  const gridMaxHeightPx = resolvedMaxHeightUnits != null ? resolvedMaxHeightUnits * baseCellSize : null;
  const clampGridHeight = resolvedMaxHeightUnits != null && totalRowUnits > resolvedMaxHeightUnits;
  const totalGridHeightPx = rowCount * cellSizePx;

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
  const cacheRef = React.useRef<Map<string, CachedBitmap>>(new Map());
  const pendingRef = React.useRef<Set<string>>(new Set());
  const renderTokenRef = React.useRef(0);
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

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const worker = createSelectionGridWorker();
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ id: string; bitmap?: ImageBitmap; error?: string }>) => {
      const { id, bitmap, error } = event.data ?? {};
      if (!id) return;
      pendingRef.current.delete(id);
      const entry = cacheRef.current.get(id);
      if (!entry) {
        bitmap?.close();
        return;
      }
      if (error) {
        entry.status = "error";
        entry.bitmap = undefined;
      } else if (bitmap) {
        entry.status = "ready";
        entry.bitmap = bitmap;
      }
      requestRender();
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
      cacheRef.current.forEach((entry) => entry.bitmap?.close());
      cacheRef.current.clear();
      pendingRef.current.clear();
    };
  }, [requestRender]);

  React.useEffect(() => {
    cacheRef.current.forEach((entry) => entry.bitmap?.close());
    cacheRef.current.clear();
    pendingRef.current.clear();
    requestRender();
  }, [cellSizePx, requestRender]);

  React.useEffect(() => {
    requestRender();
  }, [
    items,
    resolvedSelectedKey,
    containerWidth,
    cellSizePx,
    colorA,
    colorB,
    alignmentOffsetPx,
    rowCapacity,
    rowCount,
    lastRowCount,
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

    for (let row = startRow; row <= endRow; row += 1) {
      const rowOffset = row === lastRowIndex ? alignmentOffsetPx : 0;
      const rowCellCount = row === lastRowIndex ? lastRowCount : rowCapacity;
      const rowBaseIndex = row * rowCapacity;
      const y = row * cellSizePx - scrollTop;

      for (let col = 0; col < rowCellCount; col += 1) {
        const index = rowBaseIndex + col;
        if (index >= gridCellCount) break;
        const item = items[index];
        const itemKey = itemKeys[index] ?? String(index);
        const isSelected = resolvedSelectedKey != null && itemKey === resolvedSelectedKey;
        const hasTopNeighbor = index - rowCapacity >= 0;
        const hasBottomNeighbor = index + rowCapacity < gridCellCount;
        const hasLeftNeighbor = col > 0;
        const hasRightNeighbor = col < rowCapacity - 1
          && index + 1 < gridCellCount
          && Math.floor((index + 1) / rowCapacity) === row;
        const radii: CornerRadii = {
          tl: (hasTopNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          tr: (hasTopNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          br: (hasBottomNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
          bl: (hasBottomNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX,
        };
        const x = rowOffset + col * cellSizePx;

        const preview = getPreview(item, index);
        if (preview.type === "color") {
          buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
          ctx.fillStyle = preview.color;
          ctx.fill();
        } else {
          const targetSize = Math.max(1, Math.round(cellSizePx * dpr));
          const cacheKey = `${preview.src}|${targetSize}`;
          let entry = cacheRef.current.get(cacheKey);
          if (!entry) {
            entry = { status: "loading" };
            cacheRef.current.set(cacheKey, entry);
          }
          if (entry.status !== "ready" || !entry.bitmap) {
            buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
            ctx.fillStyle = colorA;
            ctx.fill();
            if (entry.status === "loading" && !pendingRef.current.has(cacheKey)) {
              const worker = workerRef.current;
              if (worker) {
                pendingRef.current.add(cacheKey);
                worker.postMessage({
                  type: "image",
                  id: cacheKey,
                  src: preview.src,
                  size: targetSize,
                });
              }
            }
          } else {
            ctx.save();
            buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
            ctx.clip();
            ctx.drawImage(entry.bitmap, x, y, cellSizePx, cellSizePx);
            ctx.restore();
          }
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
    const rowOffset = row === lastRowIndex ? alignmentOffsetPx : 0;
    const rowCellCount = row === lastRowIndex ? lastRowCount : rowCapacity;
    if (x < rowOffset || x > rowOffset + rowCellCount * cellSizePx) return;
    const col = Math.floor((x - rowOffset) / cellSizePx);
    if (col < 0 || col >= rowCellCount) return;
    const index = row * rowCapacity + col;
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    const key = itemKeys[index] ?? String(index);
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
    const index = itemKeys.indexOf(resolvedSelectedKey);
    if (index < 0) return undefined;
    return getLabel(items[index], index);
  }, [getLabel, itemKeys, items, resolvedSelectedKey]);

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
            <canvas
              ref={canvasRef}
              className="selection-grid__canvas"
              style={{
                position: "sticky",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
                touchAction: "manipulation",
              }}
              onPointerDown={handlePointerDown}
            />
            <div style={{ width: "100%", height: `${totalGridHeightPx}px` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
