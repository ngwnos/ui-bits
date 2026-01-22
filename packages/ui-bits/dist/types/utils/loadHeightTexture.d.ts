export type HeightTextureEntry = {
    texture: GPUTexture;
    width: number;
    height: number;
    min: number;
    max: number;
};
export declare function loadHeightTexture(device: GPUDevice, tileUrl: string): Promise<HeightTextureEntry | null>;
