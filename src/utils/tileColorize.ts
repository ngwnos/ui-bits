export async function loadTilePixels(src: string): Promise<{ data: Uint8Array; width: number; height: number }> {
  if (typeof document === "undefined") {
    return { data: new Uint8Array(), width: 0, height: 0 };
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to get 2d context"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      const srcData = ctx.getImageData(0, 0, width, height).data;
      const values = new Uint8Array(width * height);
      for (let index = 0; index < values.length; index += 1) {
        const offset = index * 4;
        const r = srcData[offset];
        const g = srcData[offset + 1];
        const b = srcData[offset + 2];
        const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        values[index] = gray;
      }
      resolve({ data: values, width, height });
    };
    image.onerror = (error) => reject(error);
  });
}

export function colorizeTile(tile: { data: Uint8Array; width: number; height: number }, palette: Uint8ClampedArray): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = tile.width;
  canvas.height = tile.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const imageData = ctx.createImageData(tile.width, tile.height);
  const dest = imageData.data;
  for (let index = 0; index < tile.data.length; index += 1) {
    const value = tile.data[index];
    const srcOffset = value * 4;
    const destOffset = index * 4;
    dest[destOffset] = palette[srcOffset];
    dest[destOffset + 1] = palette[srcOffset + 1];
    dest[destOffset + 2] = palette[srcOffset + 2];
    dest[destOffset + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
