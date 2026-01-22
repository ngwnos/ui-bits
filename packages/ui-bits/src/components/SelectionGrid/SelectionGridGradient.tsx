import React from "react";
import { Columns4, Mountain } from "lucide-react";
import { SliderStoreProvider } from "../../sliderStore";
import { SliderStoreContext } from "../../sliderStore/context";
import {
  useSelectionGridActions,
  useSelectionGridState,
  type SelectionGridId,
  type SelectionGridPreviewMode,
} from "../../sliderStore";
import { DEFAULT_SELECTION_GRID_ID } from "../../selectionGridIds";
import {
  MATPLOTLIB_GRADIENTS,
  buildPalette,
  createGradientCss,
  type GradientDefinition,
} from "../../gradients/matplotlib";
import { loadTerrainTileAssets, type TerrainTileAsset } from "../../assets/terrain/tiles";
import IconButton from "../IconButton";
import SelectionGridWorker from "./selectionGrid.worker?worker&inline";
import "./selectionGrid.css";

type PaletteInfo = {
  data: Uint8ClampedArray;
  css: string[];
};

type GradientBase = {
  name: string;
  stops: GradientDefinition["stops"];
  normal: PaletteInfo;
  inverted: PaletteInfo;
};

type GradientVisual = {
  name: string;
  tile: string;
  tileUrl: string;
  normal: {
    paletteCss: string[];
    cssFallback: string;
  };
  inverted: {
    paletteCss: string[];
    cssFallback: string;
  };
};

const CELL_CORNER_RADIUS_PX = 3;
const FALLBACK_COLOR_A = "var(--ui-bits-color-a, #2f2f2f)";
const FALLBACK_COLOR_B = "var(--ui-bits-color-b, #f0f0f0)";

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

function resolveWorkerUrl(src: string) {
  if (typeof window === "undefined") return src;
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}

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

type TileAssignment = {
  url: string;
  name: string;
};

const PREVIEW_MODE_SEQUENCE: SelectionGridPreviewMode[] = ["gradient", "terrainHeight"];
const PREVIEW_MODE_ICON: Record<SelectionGridPreviewMode, typeof Columns4> = {
  gradient: Columns4,
  terrainHeight: Mountain,
};
const PREVIEW_MODE_TITLE: Record<SelectionGridPreviewMode, string> = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews",
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function normalizeStops(stops: GradientDefinition["stops"], invert: boolean) {
  if (!invert) return stops;
  return stops
    .slice()
    .reverse()
    .map((stop) => ({
      ...stop,
      stop: 100 - stop.stop,
    }));
}

function drawGradientFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  stops: GradientDefinition["stops"],
  invert: boolean,
) {
  const gradient = ctx.createLinearGradient(x, y, x + size, y);
  const orderedStops = normalizeStops(stops, invert);
  orderedStops.forEach((stop) => {
    gradient.addColorStop(stop.stop / 100, stop.color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, size, size);
}

const GRADIENT_BASE_DATA: GradientBase[] = MATPLOTLIB_GRADIENTS.map((definition) => ({
  name: definition.name,
  stops: definition.stops,
  normal: buildPalette(definition.stops, false),
  inverted: buildPalette(definition.stops, true),
}));

type SelectionGridBaseProps = {
  layoutGap?: string;
  maxHeightUnits?: number;
  fontSize?: number;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
};
export type SelectionGridGradientProps = SelectionGridBaseProps & {
  gridId?: SelectionGridId;
  previewDarkMode: boolean;
  colorA?: string;
  colorB?: string;
  allowEmptySelection?: boolean;
};

function GradientSelectionGridContent({
  gridId = DEFAULT_SELECTION_GRID_ID,
  previewDarkMode,
  layoutGap = "6px",
  colorA = FALLBACK_COLOR_A,
  colorB = FALLBACK_COLOR_B,
  allowEmptySelection = false,
  maxHeightUnits = 24,
  fontSize,
  maxWidth = 360,
  className,
  style,
}: SelectionGridGradientProps) {
  const [terrainTiles, setTerrainTiles] = React.useState<TerrainTileAsset[]>([]);
  const [tileAssignments, setTileAssignments] = React.useState<Record<string, TileAssignment>>({});

  const selectionGridState = useSelectionGridState(gridId);
  const selectionGridActions = useSelectionGridActions();
  const {
    squareScale,
    squareAlignment,
    selectedIndex,
    invertGradients,
    allowEmptySelection: stateAllowEmptySelection,
    previewMode,
  } = selectionGridState;

  const renderMode: "plain" | "height" = previewMode === "gradient" ? "plain" : "height";
  const usesTerrainTiles = renderMode !== "plain";

  React.useEffect(() => {
    let cancelled = false;
    if (!usesTerrainTiles) {
      setTerrainTiles([]);
      return;
    }
    loadTerrainTileAssets()
      .then((assets) => {
        if (!cancelled) setTerrainTiles(assets);
      })
      .catch(() => {
        if (!cancelled) setTerrainTiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [usesTerrainTiles]);

  React.useEffect(() => {
    if (!usesTerrainTiles) {
      setTileAssignments({});
      return;
    }
    const tiles = terrainTiles;
    if (tiles.length === 0) {
      setTileAssignments({});
      return;
    }
    const shuffled = shuffle(tiles);
    const pool = shuffled.length > 0 ? shuffled : tiles;
    const assignments: Record<string, TileAssignment> = {};
    GRADIENT_BASE_DATA.forEach((gradient, index) => {
      const tile = pool[index % pool.length];
      assignments[gradient.name] = tile;
    });
    setTileAssignments(assignments);
  }, [terrainTiles, usesTerrainTiles]);

  const gradientVisuals = React.useMemo<GradientVisual[]>(() => GRADIENT_BASE_DATA.map((base) => {
    const assignment = usesTerrainTiles ? tileAssignments[base.name] : undefined;
    const tileUrl = assignment?.url ?? "";
    const tileName = assignment?.name ?? (tileUrl.split("/").pop() ?? tileUrl);
    return {
      name: base.name,
      tile: tileName,
      tileUrl,
      normal: {
        paletteCss: [...base.normal.css],
        cssFallback: createGradientCss(base.stops, false),
      },
      inverted: {
        paletteCss: [...base.inverted.css],
        cssFallback: createGradientCss(base.stops, true),
      },
    };
  }), [tileAssignments, usesTerrainTiles]);

  const gridCellCount = gradientVisuals.length;
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const labelRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(360);
  const [labelLineHeight, setLabelLineHeight] = React.useState<number>(fontSize ?? 16);
  const paletteSignatureRef = React.useRef<string | null>(null);
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
    selectionGridActions.registerSelectionGrid(gridId, { allowEmptySelection });
  }, [gridId, allowEmptySelection, selectionGridActions]);

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
    if (allowEmptySelection !== undefined && stateAllowEmptySelection !== allowEmptySelection) {
      selectionGridActions.setSelectionGridAllowEmpty(gridId, allowEmptySelection);
    }
  }, [allowEmptySelection, gridId, selectionGridActions, stateAllowEmptySelection]);

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

  React.useEffect(() => {
    const node = labelRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.height) return;
      setLabelLineHeight((prev) => (Math.abs(prev - rect.height) < 0.5 ? prev : rect.height));
    };
    measure();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(node);
      return () => {
        resizeObserver?.disconnect();
      };
    }
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [selectedIndex, invertGradients, previewDarkMode, containerWidth, previewMode]);

  const selectedPalette = React.useMemo(() => {
    if (selectedIndex == null || gradientVisuals[selectedIndex] === undefined) return null;
    const visual = gradientVisuals[selectedIndex];
    return invertGradients ? visual.inverted.paletteCss : visual.normal.paletteCss;
  }, [gradientVisuals, invertGradients, selectedIndex]);

  React.useEffect(() => {
    if (!selectedPalette) return;
    const signature = selectedPalette.join("|");
    if (signature === paletteSignatureRef.current) return;
    paletteSignatureRef.current = signature;
    selectionGridActions.setSelectionGridPalette(gridId, selectedPalette);
  }, [gridId, selectedPalette, selectionGridActions]);

  const previewFontSize = fontSize ?? 16;
  const previewLineHeight = 1;
  const previewPaddingEm = 0.35;
  const previewPaddingPx = previewFontSize * previewPaddingEm;
  const baseLabelHeight = labelLineHeight || (previewFontSize * previewLineHeight);
  const baseCellSize = Math.max(
    Math.round(baseLabelHeight + previewPaddingPx * 2 + 2), // extra room for 1px borders
    Math.round(previewFontSize + previewPaddingPx * 1.5),
  );
  const cellSizePx = baseCellSize * squareScale;
  const rowCapacity = containerWidth ? Math.max(1, Math.floor(containerWidth / cellSizePx)) : 1;
  const rowCount = rowCapacity ? Math.ceil(gridCellCount / rowCapacity) : gridCellCount;
  const lastRowCount = rowCapacity >= gridCellCount ? gridCellCount : gridCellCount % rowCapacity || rowCapacity;
  const leftoverSlots = rowCapacity > lastRowCount ? rowCapacity - lastRowCount : 0;
  const lastRowIndex = rowCapacity ? Math.floor((gridCellCount - 1) / rowCapacity) : 0;
  const alignmentOffsetPx = leftoverSlots > 0
    ? squareAlignment === "center"
      ? (leftoverSlots * cellSizePx) / 2
      : squareAlignment === "right"
        ? leftoverSlots * cellSizePx
        : 0
    : 0;
  const containerWidthPx = rowCapacity * cellSizePx;
  const resolvedMaxHeightUnits = typeof maxHeightUnits === "number" && Number.isFinite(maxHeightUnits) && maxHeightUnits > 0
    ? maxHeightUnits
    : null;
  const totalRowUnits = rowCount * squareScale;
  const gridMaxHeightPx = resolvedMaxHeightUnits != null ? resolvedMaxHeightUnits * baseCellSize : null;
  const clampGridHeight = resolvedMaxHeightUnits != null && totalRowUnits > resolvedMaxHeightUnits;
  const totalGridHeightPx = rowCount * cellSizePx;

  React.useEffect(() => {
    cacheRef.current.forEach((entry) => entry.bitmap?.close());
    cacheRef.current.clear();
    pendingRef.current.clear();
    requestRender();
  }, [cellSizePx, invertGradients, renderMode, tileAssignments, requestRender]);

  React.useEffect(() => {
    requestRender();
  }, [
    gradientVisuals,
    selectedIndex,
    invertGradients,
    containerWidth,
    cellSizePx,
    renderMode,
    alignmentOffsetPx,
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
        const base = GRADIENT_BASE_DATA[index];
        const visual = gradientVisuals[index];
        const isSelected = selectedIndex === index;
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
        const palette = invertGradients ? base.inverted.data : base.normal.data;
        const tileUrl = renderMode === "height" && usesTerrainTiles && visual.tileUrl ? visual.tileUrl : undefined;
        const resolvedTileUrl = tileUrl ? resolveWorkerUrl(tileUrl) : undefined;
        const targetSize = Math.max(1, Math.round(cellSizePx * dpr));
        const cacheKey = `${visual.name}|${invertGradients ? "inv" : "norm"}|${renderMode}|${targetSize}|${resolvedTileUrl ?? "plain"}`;

        let entry = cacheRef.current.get(cacheKey);
        if (!entry) {
          entry = { status: "loading" };
          cacheRef.current.set(cacheKey, entry);
        }

        if (entry.status !== "ready" || !entry.bitmap) {
          ctx.save();
          buildRoundedRectPath(ctx, x, y, cellSizePx, radii);
          ctx.clip();
          drawGradientFallback(ctx, x, y, cellSizePx, base.stops, invertGradients);
          ctx.restore();
          if (entry.status === "loading" && !pendingRef.current.has(cacheKey)) {
            const worker = workerRef.current;
            if (worker) {
              pendingRef.current.add(cacheKey);
              worker.postMessage({
                type: "gradient",
                id: cacheKey,
                palette,
                size: targetSize,
                tileUrl: resolvedTileUrl,
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

  const previewTextShadow = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)",
  ].join(", ");
  const previewIconFilter = [
    "drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))",
    "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))",
  ].join(" ");
  const previewButtonSize = Math.max(Math.round(baseCellSize - 4), Math.round(previewFontSize + previewPaddingPx));
  const previewButtonFontSize = Math.max(8, Math.round((previewButtonSize - 2) / (1 + previewPaddingEm * 2)));
  const previewIconSize = Math.max(Math.round(previewButtonSize * 0.6), 12);
  const previewButtonStyle: React.CSSProperties = {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    filter: previewIconFilter,
  };
  const previewModeOptions = PREVIEW_MODE_SEQUENCE.map((mode) => ({
    value: mode,
    icon: React.createElement(PREVIEW_MODE_ICON[mode], { size: previewIconSize, strokeWidth: 2 }),
    ariaLabel: PREVIEW_MODE_TITLE[mode],
    title: PREVIEW_MODE_TITLE[mode],
  }));

  const activeGradient = selectedIndex != null ? MATPLOTLIB_GRADIENTS[selectedIndex] : null;
  const previewGradient = activeGradient ? createGradientCss(activeGradient.stops, invertGradients) : "transparent";
  const previewLabelBase = activeGradient ? activeGradient.name : "None";
  const previewLabel =
    activeGradient == null
      ? previewLabelBase
      : invertGradients
        ? `<-${previewLabelBase}-<`
        : `>-${previewLabelBase}->`;

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
    if (index < 0 || index >= gridCellCount) return;
    if (selectedIndex === index) {
      if (stateAllowEmptySelection) {
        selectionGridActions.setSelectionGridSelectedIndex(gridId, null);
      }
      return;
    }
    selectionGridActions.setSelectionGridSelectedIndex(gridId, index);
  };

  return (
    <div ref={wrapperRef} className={className} style={wrapperStyle}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "stretch",
            width: `${containerWidthPx}px`,
            borderBottomLeftRadius: 3,
            borderBottomRightRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              borderRadius: 3,
              boxSizing: "border-box",
              background: previewGradient,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${previewPaddingPx}px 8px`,
              minHeight: `${baseCellSize}px`,
              position: "relative",
            }}
            aria-label="Selected gradient preview"
            role="button"
            tabIndex={0}
            aria-pressed={invertGradients}
            onClick={() => {
              selectionGridActions.toggleSelectionGridInvert(gridId);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectionGridActions.toggleSelectionGridInvert(gridId);
              }
            }}
          >
            <IconButton
              behavior="cycle"
              options={previewModeOptions}
              value={previewMode}
              fontSize={previewButtonFontSize}
              colorA={colorA}
              colorB="transparent"
              borderStyle="none"
              style={previewButtonStyle}
              onChange={(value) => {
                selectionGridActions.setSelectionGridPreviewMode(gridId, value as SelectionGridPreviewMode);
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                }
              }}
            />
            <div
              ref={labelRef}
              style={{
                textAlign: "center",
                fontSize: previewFontSize,
                lineHeight: previewLineHeight,
                fontWeight: 600,
                textTransform: "capitalize",
                color: colorA,
                textShadow: previewTextShadow,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {previewLabel}
            </div>
          </div>
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

export default function GradientSelectionGrid(props: SelectionGridGradientProps) {
  const context = React.useContext(SliderStoreContext);
  if (!context) {
    return (
      <SliderStoreProvider>
        <GradientSelectionGridContent {...props} />
      </SliderStoreProvider>
    );
  }
  return <GradientSelectionGridContent {...props} />;
}
