export type TerrainTileAsset = {
    name: string;
    url: string;
};
export declare function loadTerrainTileAssets(): Promise<TerrainTileAsset[]>;
export declare function loadTerrainTileUrls(): Promise<string[]>;
