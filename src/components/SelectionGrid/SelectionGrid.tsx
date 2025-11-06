import React from "react";
import tgpu from "typegpu";
import { Columns4, Mountain, MountainSnow } from "lucide-react";
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
import { loadHeightTexture, type HeightTextureEntry } from "../../utils/loadHeightTexture";
import { TERRAIN_TILE_ASSETS } from "../../assets/terrain/tiles";
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

type TileAssignment = {
  url: string;
  name: string;
};

const PREVIEW_MODE_SEQUENCE: SelectionGridPreviewMode[] = ["gradient", "terrainHeight", "terrainHillshade"];
const PREVIEW_MODE_ICON: Record<SelectionGridPreviewMode, typeof Columns4> = {
  gradient: Columns4,
  terrainHeight: Mountain,
  terrainHillshade: MountainSnow,
};
const PREVIEW_MODE_TITLE: Record<SelectionGridPreviewMode, string> = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews",
  terrainHillshade: "Terrain hillshade previews",
};

type TypeGpuRoot = Awaited<ReturnType<typeof tgpu.init>>;
let sharedRoot: TypeGpuRoot | null = null;
let sharedRootPromise: Promise<TypeGpuRoot | null> | null = null;

let sharedPipeline: {
  renderPipeline: GPURenderPipeline;
  sampler: GPUSampler;
  format: GPUTextureFormat;
  device: GPUDevice;
} | null = null;
let sharedLinearHeightTexture: HeightTextureEntry | null = null;

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

function getSharedPipeline(device: GPUDevice, format: GPUTextureFormat): { renderPipeline: GPURenderPipeline; sampler: GPUSampler } {
  if (sharedPipeline && sharedPipeline.device === device && sharedPipeline.format === format) {
    return { renderPipeline: sharedPipeline.renderPipeline, sampler: sharedPipeline.sampler };
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

struct RenderUniforms {
  params0 : vec4<f32>,
  params1 : vec4<f32>,
  params2 : vec4<f32>,
};

@group(0) @binding(0) var heightTexture : texture_2d<f32>;
@group(0) @binding(1) var tileSampler : sampler;
@group(0) @binding(2) var gradientTexture : texture_2d<f32>;
@group(0) @binding(3) var<uniform> uniforms : RenderUniforms;

fn quantizeUv(uv : vec2<f32>, texelSize : vec2<f32>) -> vec2<i32> {
  let width = max(1, i32(round(1.0 / texelSize.x)));
  let height = max(1, i32(round(1.0 / texelSize.y)));
  let x = clamp(i32(round(uv.x * f32(width - 1))), 0, width - 1);
  let y = clamp(i32(round(uv.y * f32(height - 1))), 0, height - 1);
  return vec2<i32>(x, y);
}

fn sampleHeight(uv : vec2<f32>, texelSize : vec2<f32>) -> f32 {
  let coords = quantizeUv(uv, texelSize);
  return textureLoad(heightTexture, coords, 0).r;
}

fn safeSample(uv : vec2<f32>) -> vec2<f32> {
  return clamp(uv, vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0));
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let useHillshade = uniforms.params0.x;
  let texelSize = uniforms.params0.yz;
  let heightScale = uniforms.params0.w;
  let lightDir = normalize(uniforms.params1.xyz);
  let heightMin = uniforms.params1.w;
  let heightRange = max(uniforms.params2.x, 1e-6);
  let ambient = uniforms.params2.y;
  let contrast = uniforms.params2.z;
  let uv = safeSample(in.uv);

  let offset = vec2<f32>(texelSize.x, texelSize.y);

  let hC = sampleHeight(uv, texelSize);
  let hN = sampleHeight(safeSample(vec2<f32>(uv.x, uv.y + offset.y)), texelSize);
  let hS = sampleHeight(safeSample(vec2<f32>(uv.x, uv.y - offset.y)), texelSize);
  let hE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y)), texelSize);
  let hW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y)), texelSize);
  let hNE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y + offset.y)), texelSize);
  let hNW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y + offset.y)), texelSize);
  let hSE = sampleHeight(safeSample(vec2<f32>(uv.x + offset.x, uv.y - offset.y)), texelSize);
  let hSW = sampleHeight(safeSample(vec2<f32>(uv.x - offset.x, uv.y - offset.y)), texelSize);

  let dzdx = ((hNE + 2.0 * hE + hSE) - (hNW + 2.0 * hW + hSW)) * heightScale;
  let dzdy = ((hSW + 2.0 * hS + hSE) - (hNW + 2.0 * hN + hNE)) * heightScale;

  let normal = normalize(vec3<f32>(-dzdx, -dzdy, 1.0));
  let shade = clamp(ambient + dot(normal, lightDir) * contrast, 0.0, 1.0);

  let hillshadeColor = textureSample(gradientTexture, tileSampler, vec2<f32>(shade, 0.5));
  if (useHillshade > 0.5) {
    return hillshadeColor;
  }

  let normalizedHeight = clamp((hC - heightMin) / heightRange, 0.0, 1.0);
  let remapped = textureSample(gradientTexture, tileSampler, vec2<f32>(normalizedHeight, 0.5));
  return remapped;
}
`,
  });

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  const sampler = device.createSampler({ magFilter: 'nearest', minFilter: 'nearest' });
  sharedPipeline = {
    renderPipeline,
    sampler,
    format,
    device,
  };
  return { renderPipeline, sampler };
}

function getLinearHeightTexture(device: GPUDevice): HeightTextureEntry {
  if (sharedLinearHeightTexture) return sharedLinearHeightTexture;
  const size = 256;
  const data = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const value = x / (size - 1);
      data[y * size + x] = value;
    }
  }
  const texture = device.createTexture({
    size: [size, size, 1],
    format: "r32float",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture },
    data,
    { bytesPerRow: size * Float32Array.BYTES_PER_ELEMENT },
    [size, size, 1],
  );
  sharedLinearHeightTexture = {
    texture,
    width: size,
    height: size,
    min: 0,
    max: 1,
  };
  return sharedLinearHeightTexture;
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

export type SelectionGridProps = {
  gridId?: SelectionGridId;
  previewDarkMode: boolean;
  layoutGap: string;
  colorB: string;
  textColor: string;
  allowEmptySelection?: boolean;
  maxHeightUnits?: number;
  fontSize?: number;
};

function SelectionGridContent({
  gridId = DEFAULT_SELECTION_GRID_ID,
  previewDarkMode,
  layoutGap,
  colorB,
  textColor,
  allowEmptySelection = false,
  maxHeightUnits = 24,
  fontSize,
}: SelectionGridProps) {
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
    sunAltitudeDeg,
    sunAzimuthDeg,
  } = selectionGridState;

  const renderMode: "plain" | "height" | "hillshade" = previewMode === "gradient"
    ? "plain"
    : previewMode === "terrainHeight"
      ? "height"
      : "hillshade";
  const usesTerrainTiles = renderMode !== "plain";

  React.useEffect(() => {
    if (!usesTerrainTiles) {
      setTileAssignments({});
      return;
    }
    const tiles = TERRAIN_TILE_ASSETS;
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
  }, [usesTerrainTiles]);

  const gradientVisuals = React.useMemo<GradientVisual[]>(() => GRADIENT_BASE_DATA.map((base) => {
    const assignment = usesTerrainTiles ? tileAssignments[base.name] : undefined;
    const tileUrl = assignment?.url ?? "";
    const tileName = assignment?.name ?? (tileUrl.split("/").pop() ?? tileUrl);
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
  }), [tileAssignments, usesTerrainTiles]);

  const gridCellCount = gradientVisuals.length;
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const labelRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(360);
  const [labelLineHeight, setLabelLineHeight] = React.useState<number>(fontSize ?? 16);
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
          ...(usesTerrainTiles
            ? {}
            : {
              backgroundImage: fallbackBackground,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }),
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
        {renderMode !== "plain" ? (
          <GradientTileCanvas
            mode={renderMode}
            tileUrl={usesTerrainTiles ? visual.tileUrl : undefined}
            stops={gradientStops}
            invert={invertGradients}
            size={cellSizePx}
            borderRadius={borderRadiusValue}
            fallbackBackground={fallbackBackground}
            sunAltitudeDeg={sunAltitudeDeg}
            sunAzimuthDeg={sunAzimuthDeg}
          />
        ) : null}
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

  const previewModeIndex = PREVIEW_MODE_SEQUENCE.indexOf(previewMode);
  const nextPreviewMode = PREVIEW_MODE_SEQUENCE[(previewModeIndex + 1) % PREVIEW_MODE_SEQUENCE.length];
  const PreviewModeIcon = PREVIEW_MODE_ICON[previewMode];
  const previewModeTitle = PREVIEW_MODE_TITLE[previewMode];
  const nextModeTitle = PREVIEW_MODE_TITLE[nextPreviewMode];

  const terrainToggleButtonSize = Math.max(Math.round(baseCellSize - 4), Math.round(previewFontSize + previewPaddingPx));
  const terrainToggleIconSize = Math.max(Math.round(terrainToggleButtonSize * 0.6), 12);
  const previewTextShadow = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)",
  ].join(", ");
  const previewIconFilter = previewDarkMode
    ? [
      "drop-shadow(0 0 1px rgba(255, 255, 255, 0.45))",
      "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))",
    ].join(" ")
    : [
      "drop-shadow(0 0 1px rgba(0, 0, 0, 0.6))",
      "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.7))",
    ].join(" ");

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
    <div ref={wrapperRef} style={wrapperStyle}>
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
            <button
              type="button"
              aria-label={`Switch to ${nextModeTitle.toLowerCase()}`}
              title={`${previewModeTitle} (click to switch to ${nextModeTitle.toLowerCase()})`}
              style={{
                ...terrainToggleButtonStyle,
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onClick={(event) => {
                event.stopPropagation();
                selectionGridActions.setSelectionGridPreviewMode(gridId, nextPreviewMode);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                }
              }}
            >
              <PreviewModeIcon
                size={terrainToggleIconSize}
                strokeWidth={2}
                style={{
                  color: textColor,
                  filter: previewIconFilter,
                }}
              />
            </button>
            <div
              ref={labelRef}
              style={{
                textAlign: "center",
                fontSize: previewFontSize,
                lineHeight: previewLineHeight,
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
  fallbackBackground,
  sunAltitudeDeg,
  sunAzimuthDeg,
}: {
  mode: "plain" | "height" | "hillshade";
  tileUrl?: string;
  stops: GradientDefinition['stops'];
  invert: boolean;
  size: number;
  borderRadius: string;
  fallbackBackground: string;
  sunAltitudeDeg: number;
  sunAzimuthDeg: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const hasRenderedRef = React.useRef(false);
  const contextRef = React.useRef<GPUCanvasContext | null>(null);
  const configuredSizeRef = React.useRef<{ width: number; height: number } | null>(null);
  const resourcesRef = React.useRef<{
    gradientTexture: GPUTexture;
    uniformBuffer: GPUBuffer;
    uniformSize: number;
  } | null>(null);
  const [hasRendered, setHasRendered] = React.useState<boolean>(false);
  const [terrainReady, setTerrainReady] = React.useState(mode === "plain");
  const isPlainMode = mode === "plain";

  React.useEffect(() => {
    if (!tileUrl || isPlainMode) return;
    let cancelled = false;
    (async () => {
      const root = await getSharedRoot();
      if (!root || cancelled) return;
      await loadHeightTexture(root.device, tileUrl).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [tileUrl, isPlainMode]);
  React.useEffect(() => {
    if (isPlainMode) {
      setTerrainReady(true);
    } else if (!hasRenderedRef.current) {
      setTerrainReady(false);
    }
  }, [isPlainMode, mode]);
  React.useEffect(() => {
    if (isPlainMode) {
      return;
    }
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
      if (canvas.width !== dimension || canvas.height !== dimension) {
        canvas.width = dimension;
        canvas.height = dimension;
      }
      if (canvas.style.width !== `${dimension}px`) {
        canvas.style.width = `${dimension}px`;
      }
      if (canvas.style.height !== `${dimension}px`) {
        canvas.style.height = `${dimension}px`;
      }

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

      let heightEntry: HeightTextureEntry | null = null;
      if (mode === "height" || mode === "hillshade") {
        if (!tileUrl) return;
        heightEntry = await loadHeightTexture(device, tileUrl);
      } else {
        heightEntry = getLinearHeightTexture(device);
      }
      if (!heightEntry || disposed) return;

      const { renderPipeline, sampler } = getSharedPipeline(device, format);
      const targetWidth = Math.max(1, heightEntry.width);
      const targetHeight = Math.max(1, heightEntry.height);

      const gradientTexture = device.createTexture({
        size: [256, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      uploadGradientToTexture(device, gradientTexture, stops, invert);

      const heightMin = heightEntry.min;
      const heightRange = Math.max(1e-6, heightEntry.max - heightEntry.min);
      const texelSizeX = 1 / targetWidth;
      const texelSizeY = 1 / targetHeight;
      const cellSizeMeters = 3;
      const verticalExaggeration = 8;
      const heightScale = verticalExaggeration / (cellSizeMeters * 8);
      const altitude = (sunAltitudeDeg * Math.PI) / 180;
      const azimuth = (sunAzimuthDeg * Math.PI) / 180;
      const lightDir = [
        Math.sin(azimuth) * Math.cos(altitude),
        Math.cos(azimuth) * Math.cos(altitude),
        Math.sin(altitude),
      ];
      const ambient = 0.2;
      const contrast = 0.9;
      const hillshadeFlag = mode === "hillshade" ? 1 : 0;
      const uniformArray = new Float32Array(16);
      uniformArray[0] = hillshadeFlag;
      uniformArray[1] = texelSizeX;
      uniformArray[2] = texelSizeY;
      uniformArray[3] = heightScale;
      uniformArray[4] = lightDir[0];
      uniformArray[5] = lightDir[1];
      uniformArray[6] = lightDir[2];
      uniformArray[7] = heightMin;
      uniformArray[8] = heightRange;
      uniformArray[9] = ambient;
      uniformArray[10] = contrast;
      const uniformData = uniformArray;
      let resources = resourcesRef.current;
      if (!resources || resources.uniformSize !== uniformData.byteLength) {
        if (resources) {
          resources.gradientTexture.destroy();
          resources.uniformBuffer.destroy();
        }
        const gradientTexture = device.createTexture({
          size: [256, 1, 1],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        const uniformBuffer = device.createBuffer({
          size: uniformData.byteLength,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        resources = {
          gradientTexture,
          uniformBuffer,
          uniformSize: uniformData.byteLength,
        };
        resourcesRef.current = resources;
      }
      uploadGradientToTexture(device, resources.gradientTexture, stops, invert);
      device.queue.writeBuffer(resources.uniformBuffer, 0, uniformData);

      const renderBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: heightEntry.texture.createView() },
          { binding: 1, resource: sampler },
          { binding: 2, resource: resources.gradientTexture.createView() },
          { binding: 3, resource: { buffer: resources.uniformBuffer } },
        ],
      });

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const pass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: textureView,
          loadOp: 'load',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, renderBindGroup);
      pass.draw(6, 1, 0, 0);
      pass.end();
      device.queue.submit([commandEncoder.finish()]);

      if (!disposed && !hasRenderedRef.current) {
        hasRenderedRef.current = true;
        setHasRendered(true);
      }
      if (!disposed) {
        setTerrainReady(true);
      }
    };

    run().catch((error) => {
      console.error('Failed to render gradient preview', error);
    });

    return () => {
      disposed = true;
      const resources = resourcesRef.current;
      if (resources) {
        resources.gradientTexture.destroy();
        resources.uniformBuffer.destroy();
        resourcesRef.current = null;
      }
    };
  }, [mode, tileUrl, stops, invert, size, isPlainMode, sunAltitudeDeg, sunAzimuthDeg]);

  if (isPlainMode) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius,
          pointerEvents: 'none',
          backgroundImage: fallbackBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: terrainReady ? 0 : 1,
          transition: 'opacity 80ms ease',
        }}
      />
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
    </>
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
