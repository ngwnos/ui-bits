import type { TerrainTileAsset } from "ui-bits";

const TILE_MODULES = import.meta.glob("./assets/terrain/tiles/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const terrainTileAssets: TerrainTileAsset[] = Object.entries(TILE_MODULES)
  .map(([path, url]) => ({
    name: path.split("/").pop() ?? path,
    url,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export async function loadDocsTerrainTileAssets(): Promise<TerrainTileAsset[]> {
  return terrainTileAssets;
}
