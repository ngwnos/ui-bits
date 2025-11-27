export type TerrainTileAsset = {
  name: string;
  url: string;
};

const baseUrl = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const manifestUrl = `${baseUrl}/terrain/dem_tiles.json`;
const tileBasePath = `${baseUrl}/terrain/dem_tiles`;

let cachedAssets: TerrainTileAsset[] | null = null;
let inFlight: Promise<TerrainTileAsset[]> | null = null;

async function fetchTerrainTileAssets(): Promise<TerrainTileAsset[]> {
  if (cachedAssets) return cachedAssets;
  if (inFlight) return inFlight;

  if (typeof fetch === "undefined") {
    console.warn("Terrain tiles cannot load because fetch is unavailable in this environment.");
    cachedAssets = [];
    return cachedAssets;
  }

  inFlight = fetch(manifestUrl)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load terrain tile manifest (${response.status})`);
      }
      const names = (await response.json()) as string[];
      cachedAssets = names
        .map((name) => ({ name, url: `${tileBasePath}/${name}` }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return cachedAssets;
    })
    .catch((error) => {
      console.error("Unable to load terrain tiles", error);
      cachedAssets = [];
      return cachedAssets;
    })
    .finally(() => {
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
