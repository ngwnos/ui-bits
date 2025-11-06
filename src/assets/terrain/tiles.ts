export type TerrainTileAsset = {
  name: string;
  url: string;
};

const terrainTileModules = import.meta.glob<string>("./dem_tiles/*.tif", {
  eager: true,
  import: "default",
});

const entries = Object.entries(terrainTileModules).map(([path, url]) => {
  const name = path.split("/").pop() ?? path;
  return { name, url };
}).sort((a, b) => a.name.localeCompare(b.name));

export const TERRAIN_TILE_ASSETS: TerrainTileAsset[] = entries;
export const TERRAIN_TILE_URLS: string[] = entries.map((entry) => entry.url);
