export type TerrainTileAsset = {
  name: string;
  url: string;
};

const TILE_MODULES: Record<string, string> = import.meta.glob(
  "./tiles/*.png",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
const EMBEDDED_ASSETS: TerrainTileAsset[] = Object.entries(TILE_MODULES)
  .map(([path, url]) => ({
    name: path.split("/").pop() ?? path,
    url,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

let cachedAssets: TerrainTileAsset[] | null = null;
let inFlight: Promise<TerrainTileAsset[]> | null = null;

async function fetchTerrainTileAssets(): Promise<TerrainTileAsset[]> {
  if (cachedAssets) return cachedAssets;
  if (inFlight) return inFlight;
  inFlight = Promise.resolve(EMBEDDED_ASSETS).then((assets) => {
    cachedAssets = assets;
    return assets;
  }).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function loadTerrainTileAssets(): Promise<TerrainTileAsset[]> {
  return fetchTerrainTileAssets();
}

export async function loadTerrainTileUrls(): Promise<string[]> {
  const assets = await fetchTerrainTileAssets();
  return assets.map((asset) => asset.url);
}
