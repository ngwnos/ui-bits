import React from "react";
import tgpu from "typegpu";
import { Columns4, Mountain } from "lucide-react";
import LFOSlider from "../LFOSlider";
import { flexoki } from "../../flexoki";
import { SliderStoreProvider } from "../../sliderStore";
import { SliderStoreContext } from "../../sliderStore/context";
import {
  useSelectionGridActions,
  useSelectionGridState,
  type SelectionGridId,
} from "../../sliderStore";
import { DEFAULT_SELECTION_GRID_ID } from "../../selectionGridIds";
import {
  MATPLOTLIB_GRADIENTS,
  buildPalette,
  createGradientCss,
  type GradientDefinition,
} from "../../gradients/matplotlib";
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
    textureUrl: string | null;
    paletteCss: string[];
    cssFallback: string;
  };
  inverted: {
    textureUrl: string | null;
    paletteCss: string[];
    cssFallback: string;
  };
};

const CELL_CORNER_RADIUS_PX = 3;

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

const tileTextureCache = new Map<string, { texture: GPUTexture; width: number; height: number }>();
let sharedPipeline: { pipeline: GPURenderPipeline; sampler: GPUSampler; format: GPUTextureFormat; device: GPUDevice } | null = null;
let sharedLinearGradientTexture: { texture: GPUTexture; width: number; height: number } | null = null;

async function getSharedRoot(): Promise<TypeGpuRoot | null> {
  if (!navigator.gpu) return null;
  if (sharedRoot) return sharedRoot;
  if (!sharedRootPromise) {
    sharedRootPromise = tgpu.init().then((root) => {
      sharedRoot = root;
      return root;
    }).catch((error) => {
      console.error('TypeGPU initialization failed', error);
      sharedRootPromise = null;
      return null;
    });
  }
  return sharedRootPromise;
}

function getSharedPipeline(device: GPUDevice, format: GPUTextureFormat): { pipeline: GPURenderPipeline; sampler: GPUSampler } {
  if (sharedPipeline && sharedPipeline.device === device && sharedPipeline.format === format) {
    return { pipeline: sharedPipeline.pipeline, sampler: sharedPipeline.sampler };
  }
  const shaderModule = device.createShaderModule({
    code: `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0)
  );
  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );
  var out : VertexOutput;
  out.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  out.uv = uvs[vertexIndex];
  return out;
}

@group(0) @binding(0) var tileTexture : texture_2d<f32>;
@group(0) @binding(1) var tileSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let tileColor = textureSample(tileTexture, tileSampler, in.uv);
  let luminance = dot(tileColor.rgb, vec3f(0.299, 0.587, 0.114));
  let remapped = textureSample(gradientTexture, tileSampler, vec2f(luminance, 0.5));
  return vec4<f32>(remapped.rgb, 1.0);
}
`,
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  sharedPipeline = { pipeline, sampler, format, device };
  return { pipeline, sampler };
}

async function getTileTexture(device: GPUDevice, tileUrl: string): Promise<{ texture: GPUTexture; width: number; height: number } | null> {
  const cached = tileTextureCache.get(tileUrl);
  if (cached) return cached;
  try {
    const response = await fetch(tileUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error('Failed to fetch tile texture');
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const texture = device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING
        | GPUTextureUsage.COPY_DST
        | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [bitmap.width, bitmap.height]);
    bitmap.close();
    const entry = { texture, width: bitmap.width, height: bitmap.height };
    tileTextureCache.set(tileUrl, entry);
    return entry;
  } catch (error) {
    console.error('Failed to prepare tile texture', error);
    return null;
  }
}

function getLinearGradientTexture(device: GPUDevice): { texture: GPUTexture; width: number; height: number } {
  if (sharedLinearGradientTexture) return sharedLinearGradientTexture;
  const size = 256;
  const bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = Math.round((x / (size - 1)) * 255);
      const offset = (y * size + x) * 4;
      bytes[offset] = value;
      bytes[offset + 1] = value;
      bytes[offset + 2] = value;
      bytes[offset + 3] = 255;
    }
  }
  const texture = device.createTexture({
    size: [size, size, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture },
    bytes,
    { bytesPerRow: size * 4 },
    [size, size, 1],
  );
  sharedLinearGradientTexture = { texture, width: size, height: size };
  return sharedLinearGradientTexture;
}

function uploadGradientToTexture(device: GPUDevice, texture: GPUTexture, stops: GradientDefinition['stops'], invert: boolean) {
  const palette = buildPalette(stops, invert);
  device.queue.writeTexture(
    { texture },
    Uint8Array.from(palette.data),
    { bytesPerRow: 256 * 4 },
    [256, 1, 1],
  );
}


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

const GRADIENT_BASE_DATA: GradientBase[] = MATPLOTLIB_GRADIENTS.map((definition) => ({
  name: definition.name,
  stops: definition.stops,
  normal: buildPalette(definition.stops, false),
  inverted: buildPalette(definition.stops, true),
}));

async function loadTileList(): Promise<string[]> {
  try {
    const response = await fetch("/terrain/tiles.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load tile list");
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Tile manifest malformed");
    return data.filter((entry): entry is string => typeof entry === "string" && entry.endsWith(".png")).map((name) => `/terrain/tiles/${name}`);
  } catch (error) {
    console.error("Failed to fetch tile list", error);
    return [];
  }
}

export type SelectionGridProps = {
  gridId?: SelectionGridId;
  previewDarkMode: boolean;
  layoutGap: string;
  colorA: string;
  colorB: string;
  textColor: string;
  allowEmptySelection?: boolean;
  maxHeightUnits?: number;
};

function SelectionGridContent({
  gridId = DEFAULT_SELECTION_GRID_ID,
  previewDarkMode,
  layoutGap,
  colorA,
  colorB,
  textColor,
  allowEmptySelection = false,
  maxHeightUnits = 24,
}: SelectionGridProps) {
  const [tileAssignments, setTileAssignments] = React.useState<Record<string, string>>({});

  const selectionGridState = useSelectionGridState(gridId);
  const selectionGridActions = useSelectionGridActions();
  const {
    squareScale,
    squareAlignment,
    selectedIndex,
    invertGradients,
    allowEmptySelection: stateAllowEmptySelection,
    useTerrainTiles,
  } = selectionGridState;

  React.useEffect(() => {
    let cancelled = false;
    const loadAssignmentsOnly = async () => {
      try {
        const tileUrls = await loadTileList();
        const shuffled = shuffle(tileUrls);
        const pool = shuffled.length > 0 ? shuffled : tileUrls;
        const assignments: Record<string, string> = {};
        GRADIENT_BASE_DATA.forEach((gradient, index) => {
          assignments[gradient.name] = pool[index % pool.length];
        });
        if (!cancelled) {
          setTileAssignments(assignments);
        }
      } catch (error) {
        console.error("Failed to load selection grid tiles", error);
      }
    };
    if (useTerrainTiles) {
      loadAssignmentsOnly();
    } else {
      setTileAssignments({});
    }
    return () => {
      cancelled = true;
    };
  }, [useTerrainTiles]);

  const gradientVisuals = React.useMemo<GradientVisual[]>(() => GRADIENT_BASE_DATA.map((base) => {
    const tileUrl = useTerrainTiles ? (tileAssignments[base.name] ?? "") : "";
    const tileName = tileUrl.split("/").pop() ?? tileUrl;
    return {
      name: base.name,
      tile: tileName,
      tileUrl,
      normal: {
        textureUrl: null,
        paletteCss: [...base.normal.css],
        cssFallback: createGradientCss(base.stops, false),
      },
      inverted: {
        textureUrl: null,
        paletteCss: [...base.inverted.css],
        cssFallback: createGradientCss(base.stops, true),
      },
    };
  }), [tileAssignments, useTerrainTiles]);

  const gridCellCount = gradientVisuals.length;
  const sliderContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [sliderBox, setSliderBox] = React.useState<{ width: number; height: number }>({ width: 260, height: 48 });
  const paletteSignatureRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    selectionGridActions.registerSelectionGrid(gridId, { allowEmptySelection });
  }, [gridId, allowEmptySelection, selectionGridActions]);

  React.useEffect(() => {
    if (allowEmptySelection !== undefined && stateAllowEmptySelection !== allowEmptySelection) {
      selectionGridActions.setSelectionGridAllowEmpty(gridId, allowEmptySelection);
    }
  }, [allowEmptySelection, gridId, selectionGridActions, stateAllowEmptySelection]);

  React.useEffect(() => {
    const node = sliderContainerRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width && rect.height) {
        setSliderBox((prev) => {
          const nextWidth = Math.round(rect.width);
          const nextHeight = Math.round(rect.height);
          if (prev.width === nextWidth && prev.height === nextHeight) return prev;
          return { width: nextWidth, height: nextHeight };
        });
      }
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

  const baseCellSize = Math.max(8, sliderBox.height || 0);
  const cellSizePx = baseCellSize * squareScale;
  const rowCapacity = sliderBox.width ? Math.max(1, Math.floor(sliderBox.width / cellSizePx)) : 1;
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

  const cells = gradientVisuals.map((visual, index) => {
    const row = rowCapacity ? Math.floor(index / rowCapacity) : 0;
    const col = rowCapacity ? index % rowCapacity : 0;
    const isLastRow = row === lastRowIndex;
    const marginLeft = isLastRow && col === 0 ? alignmentOffsetPx : 0;
    const isSelected = selectedIndex === index;
    const appearance = invertGradients ? visual.inverted : visual.normal;
    const hasTopNeighbor = index - rowCapacity >= 0;
    const hasBottomNeighbor = index + rowCapacity < gridCellCount;
    const hasLeftNeighbor = col > 0;
    const hasRightNeighbor = col < rowCapacity - 1 && index + 1 < gridCellCount && Math.floor((index + 1) / rowCapacity) === row;
    const topLeftRadius = (hasTopNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const topRightRadius = (hasTopNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const bottomLeftRadius = (hasBottomNeighbor || hasLeftNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const bottomRightRadius = (hasBottomNeighbor || hasRightNeighbor) ? 0 : CELL_CORNER_RADIUS_PX;
    const gradientStops = GRADIENT_BASE_DATA[index].stops;
    const borderRadiusValue = `${topLeftRadius}px ${topRightRadius}px ${bottomRightRadius}px ${bottomLeftRadius}px`;
    const fallbackBackground = appearance.cssFallback;
    return (
      <div
        key={`${visual.name}-${visual.tile}-${index}`}
        style={{
          width: `${cellSizePx}px`,
          height: `${cellSizePx}px`,
          flex: `0 0 ${cellSizePx}px`,
          borderRadius: borderRadiusValue,
          boxSizing: "border-box",
          marginLeft,
          cursor: "pointer",
          outline: "none",
          position: "relative",
          overflow: "hidden",
          backgroundImage: fallbackBackground,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={() => {
          if (selectedIndex === index) {
            if (stateAllowEmptySelection) {
              selectionGridActions.setSelectionGridSelectedIndex(gridId, null);
            }
            return;
          }
          selectionGridActions.setSelectionGridSelectedIndex(gridId, index);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectedIndex === index) {
              if (stateAllowEmptySelection) {
                selectionGridActions.setSelectionGridSelectedIndex(gridId, null);
              }
              return;
            }
            selectionGridActions.setSelectionGridSelectedIndex(gridId, index);
          }
        }}
      >
        <GradientTileCanvas
          mode={useTerrainTiles ? "terrain" : "plain"}
          tileUrl={useTerrainTiles ? visual.tileUrl : undefined}
          stops={gradientStops}
          invert={invertGradients}
          size={cellSizePx}
          borderRadius={borderRadiusValue}
        />
        {isSelected ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: borderRadiusValue,
              boxShadow: `inset 0 0 0 2px ${colorB}`,
              pointerEvents: "none",
            }}
          />
        ) : null}
      </div>
    );
  });

  const wrapperStyle: React.CSSProperties = {
    width: "min(80vw, 360px)",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: layoutGap,
    alignItems: "stretch",
  };

  const alignmentOptions: Array<{ value: "left" | "center" | "right"; label: string }> = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

  const buttonBackground = previewDarkMode ? flexoki.base["100"] : flexoki.base["700"];
  const buttonForeground = previewDarkMode ? flexoki.base["700"] : flexoki.base["50"];
  const buttonActiveBackground = previewDarkMode ? flexoki.base["200"] : flexoki.base["600"];
  const buttonActiveForeground = previewDarkMode ? flexoki.base["900"] : flexoki.base["50"];
  const terrainToggleButtonSize = Math.max(28, baseCellSize - 10);
  const terrainToggleIconSize = Math.max(terrainToggleButtonSize - 12, 12);
  const previewTextShadow = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)",
  ].join(", ");
  const previewIconFilter = [
    "drop-shadow(0 0 1px rgba(0, 0, 0, 0.6))",
    "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.7))",
  ].join(" ");

  const alignmentButtonStyle: React.CSSProperties = {
    background: buttonBackground,
    color: buttonForeground,
    padding: "0.35rem 0.9rem",
    borderRadius: 4,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 120ms ease, color 120ms ease, transform 120ms ease",
    boxShadow: "0 0 0 1px transparent",
  };

  const alignmentButtonActiveStyle: React.CSSProperties = {
    background: buttonActiveBackground,
    color: buttonActiveForeground,
    boxShadow: `0 0 0 1px ${buttonActiveBackground}`,
  };
  const terrainToggleButtonStyle: React.CSSProperties = {
    width: terrainToggleButtonSize,
    height: terrainToggleButtonSize,
    borderRadius: 3,
    border: "none",
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    transition: "color 120ms ease",
  };

  const resolvedMaxHeightUnits = typeof maxHeightUnits === "number" && Number.isFinite(maxHeightUnits) && maxHeightUnits > 0
    ? maxHeightUnits
    : null;
  const totalRowUnits = rowCount * squareScale;
  const gridMaxHeightPx = resolvedMaxHeightUnits != null ? resolvedMaxHeightUnits * baseCellSize : null;
  const clampGridHeight = resolvedMaxHeightUnits != null && totalRowUnits > resolvedMaxHeightUnits;

  const activeGradient = selectedIndex != null ? MATPLOTLIB_GRADIENTS[selectedIndex] : null;
  const previewGradient = activeGradient ? createGradientCss(activeGradient.stops, invertGradients) : "transparent";
  const previewLabelBase = activeGradient ? activeGradient.name : "None";
  const previewLabel =
    activeGradient == null
      ? previewLabelBase
      : invertGradients
        ? `<-${previewLabelBase}-<`
        : `>-${previewLabelBase}->`;

  return (
    <div style={wrapperStyle}>
      <div ref={sliderContainerRef} style={{ width: "100%" }}>
        <LFOSlider
          label="Square Size"
          min={1}
          max={4}
          step={1}
          defaultValue={squareScale}
          width={sliderBox.width}
          drawerFeatureEnabled={false}
          drawerHandle={false}
          mode="external"
          readExternal={() => squareScale}
          leftColor={buttonBackground}
          rightColor={buttonForeground}
          onUserChange={(value: number) => {
            selectionGridActions.setSelectionGridSquareScale(gridId, value);
          }}
          onAnimatedUpdate={(value: number) => {
            selectionGridActions.setSelectionGridSquareScale(gridId, value);
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {alignmentOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => selectionGridActions.setSelectionGridAlignment(gridId, option.value)}
            aria-pressed={squareAlignment === option.value}
            style={{
              ...alignmentButtonStyle,
              ...(squareAlignment === option.value ? alignmentButtonActiveStyle : {}),
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
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
              height: `${baseCellSize}px`,
              borderRadius: 3,
              boxSizing: "border-box",
              background: previewGradient,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 8px",
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
            <button
              type="button"
              aria-pressed={useTerrainTiles}
              aria-label={useTerrainTiles ? "Show plain gradients" : "Show terrain textures"}
              title={useTerrainTiles ? "Switch to gradient-only previews" : "Enable terrain textures"}
              style={{
                ...terrainToggleButtonStyle,
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onClick={(event) => {
                event.stopPropagation();
                selectionGridActions.setSelectionGridUseTerrainTiles(gridId, !useTerrainTiles);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                }
              }}
            >
              {useTerrainTiles ? (
                <Mountain
                  size={terrainToggleIconSize}
                  strokeWidth={2}
                  style={{
                    color: textColor,
                    filter: previewIconFilter,
                  }}
                />
              ) : (
                <Columns4
                  size={terrainToggleIconSize}
                  strokeWidth={2}
                  style={{
                    color: textColor,
                    filter: previewIconFilter,
                  }}
                />
              )}
            </button>
            <div
              style={{
                textAlign: "center",
                fontSize: Math.max(12, baseCellSize * 0.4),
                fontWeight: 600,
                textTransform: "capitalize",
                color: textColor,
                textShadow: previewTextShadow,
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {previewLabel}
            </div>
          </div>
          <div
            className="selection-grid__cells"
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              gap: 0,
              alignContent: "flex-start",
              width: "100%",
              ...(gridMaxHeightPx != null
                ? {
                  maxHeight: `${gridMaxHeightPx}px`,
                  overflowY: clampGridHeight ? "auto" : undefined,
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }
                : {}),
            }}
          >
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
}

function GradientTileCanvas({
  mode,
  tileUrl,
  stops,
  invert,
  size,
  borderRadius,
}: {
  mode: "terrain" | "plain";
  tileUrl?: string;
  stops: GradientDefinition['stops'];
  invert: boolean;
  size: number;
  borderRadius: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const contextRef = React.useRef<GPUCanvasContext | null>(null);
  const configuredSizeRef = React.useRef<{ width: number; height: number } | null>(null);
  const gradientTextureRef = React.useRef<GPUTexture | null>(null);
  const bindGroupRef = React.useRef<GPUBindGroup | null>(null);
  const heightKeyRef = React.useRef<string | null>(null);
  const [hasRendered, setHasRendered] = React.useState<boolean>(false);
  React.useEffect(() => {
    let disposed = false;

    const run = async () => {
      const root = await getSharedRoot();
      if (!root || disposed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const device = root.device;
      const format = navigator.gpu.getPreferredCanvasFormat();
      let context = contextRef.current;
      if (!context) {
        context = canvas.getContext('webgpu');
        contextRef.current = context;
      }
      if (!context) return;

      const dimension = Math.max(1, Math.floor(size));
      canvas.width = dimension;
      canvas.height = dimension;
      canvas.style.width = `${dimension}px`;
      canvas.style.height = `${dimension}px`;

      const previousSize = configuredSizeRef.current;
      if (!previousSize || previousSize.width !== dimension || previousSize.height !== dimension) {
        const usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST;
        try {
          context.configure({ device, format, alphaMode: 'opaque', usage });
          configuredSizeRef.current = { width: dimension, height: dimension };
        } catch (configurationError) {
          console.error("Failed to configure WebGPU context", configurationError);
          return;
        }
      }

      let heightEntry: { texture: GPUTexture; width: number; height: number } | null = null;
      if (mode === "terrain") {
        if (!tileUrl) return;
        heightEntry = await getTileTexture(device, tileUrl);
      } else {
        heightEntry = getLinearGradientTexture(device);
      }
      if (!heightEntry || disposed) return;

      const { pipeline, sampler } = getSharedPipeline(device, format);
      let gradientTexture = gradientTextureRef.current;
      if (!gradientTexture) {
        gradientTexture = device.createTexture({
          size: [256, 1, 1],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        gradientTextureRef.current = gradientTexture;
      }
      uploadGradientToTexture(device, gradientTexture, stops, invert);

      const nextHeightKey = mode === "terrain" ? `terrain:${tileUrl}` : "plain";
      if (heightKeyRef.current !== nextHeightKey) {
        bindGroupRef.current = null;
      }
      let bindGroup = bindGroupRef.current;
      if (!bindGroup) {
        bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: heightEntry.texture.createView() },
            { binding: 1, resource: sampler },
            { binding: 2, resource: gradientTexture.createView() },
          ],
        });
        bindGroupRef.current = bindGroup;
        heightKeyRef.current = nextHeightKey;
      }

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const pass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: textureView,
          loadOp: 'clear',
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          storeOp: 'store',
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6, 1, 0, 0);
      pass.end();
      device.queue.submit([commandEncoder.finish()]);

      if (!disposed) {
        setHasRendered(true);
      }
    };

    run().catch((error) => {
      console.error('Failed to render gradient preview', error);
    });

    return () => {
      disposed = true;
    };
  }, [mode, tileUrl, stops, invert, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: hasRendered ? 1 : 0,
        borderRadius,
        pointerEvents: 'none',
        transition: hasRendered ? 'opacity 40ms linear' : 'none',
      }}
    />
  );
}

export default function SelectionGrid(props: SelectionGridProps) {
  const context = React.useContext(SliderStoreContext);
  if (!context) {
    return (
      <SliderStoreProvider>
        <SelectionGridContent {...props} />
      </SliderStoreProvider>
    );
  }
  return <SelectionGridContent {...props} />;
}
