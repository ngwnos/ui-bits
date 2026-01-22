/// <reference lib="webworker" />

type ImageRequest = {
  type: "image";
  id: string;
  src: string;
  size: number;
};

type GradientRequest = {
  type: "gradient";
  id: string;
  palette: Uint8ClampedArray;
  size: number;
  tileUrl?: string;
};

type AtlasItem =
  | { kind: "image"; src: string }
  | { kind: "color"; color: string };

type AtlasRequest = {
  type: "atlas";
  id: string;
  size: number;
  columns: number;
  items: AtlasItem[];
};

type GradientAtlasItem = {
  palette: Uint8ClampedArray;
  tileUrl?: string;
};

type GradientAtlasRequest = {
  type: "gradientAtlas";
  id: string;
  size: number;
  columns: number;
  items: GradientAtlasItem[];
};

type WorkerRequest = ImageRequest | GradientRequest | AtlasRequest | GradientAtlasRequest;

type WorkerResponse = {
  id: string;
  bitmap?: ImageBitmap;
  error?: string;
};

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;
  if (!payload) return;
  if (payload.type === "image") {
    handleImage(payload).catch((error) => {
      postError(payload.id, error);
    });
    return;
  }
  if (payload.type === "gradient") {
    handleGradient(payload).catch((error) => {
      postError(payload.id, error);
    });
    return;
  }
  if (payload.type === "atlas") {
    handleAtlas(payload).catch((error) => {
      postError(payload.id, error);
    });
    return;
  }
  if (payload.type === "gradientAtlas") {
    handleGradientAtlas(payload).catch((error) => {
      postError(payload.id, error);
    });
  }
};

function postError(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown worker error";
  const response: WorkerResponse = { id, error: message };
  workerScope.postMessage(response);
}

async function handleImage({ id, src, size }: ImageRequest) {
  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const blob = await response.blob();
  const bitmap = await createCoverBitmap(blob, size);
  const result: WorkerResponse = { id, bitmap };
  workerScope.postMessage(result, [bitmap]);
}

async function createCoverBitmap(blob: Blob, size: number): Promise<ImageBitmap> {
  const source = await createImageBitmap(blob);
  if (typeof OffscreenCanvas === "undefined") {
    const resized = await createImageBitmap(blob, {
      resizeWidth: size,
      resizeHeight: size,
      resizeQuality: "high",
    });
    source.close();
    return resized;
  }
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const resized = await createImageBitmap(blob, {
      resizeWidth: size,
      resizeHeight: size,
      resizeQuality: "high",
    });
    source.close();
    return resized;
  }
  const scale = Math.max(size / source.width, size / source.height);
  const drawWidth = Math.round(source.width * scale);
  const drawHeight = Math.round(source.height * scale);
  const dx = Math.round((size - drawWidth) / 2);
  const dy = Math.round((size - drawHeight) / 2);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(source, dx, dy, drawWidth, drawHeight);
  source.close();
  return canvas.transferToImageBitmap();
}

async function handleGradient({ id, palette, size, tileUrl }: GradientRequest) {
  const bitmap = tileUrl
    ? await renderTerrainPreview(tileUrl, palette, size)
    : await renderGradientPreview(palette, size);
  const result: WorkerResponse = { id, bitmap };
  workerScope.postMessage(result, [bitmap]);
}

async function handleAtlas({ id, size, columns, items }: AtlasRequest) {
  const bitmap = await renderAtlas(items, size, columns);
  const result: WorkerResponse = { id, bitmap };
  workerScope.postMessage(result, [bitmap]);
}

async function handleGradientAtlas({ id, size, columns, items }: GradientAtlasRequest) {
  const bitmap = await renderGradientAtlas(items, size, columns);
  const result: WorkerResponse = { id, bitmap };
  workerScope.postMessage(result, [bitmap]);
}

async function renderGradientPreview(palette: Uint8ClampedArray, size: number): Promise<ImageBitmap> {
  const imageData = new ImageData(size, size);
  const dest = imageData.data;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = size <= 1 ? 0 : x / (size - 1);
      const paletteIndex = Math.min(255, Math.max(0, Math.round(t * 255)));
      const srcOffset = paletteIndex * 4;
      const destOffset = (y * size + x) * 4;
      dest[destOffset] = palette[srcOffset];
      dest[destOffset + 1] = palette[srcOffset + 1];
      dest[destOffset + 2] = palette[srcOffset + 2];
      dest[destOffset + 3] = 255;
    }
  }
  return await createImageBitmap(imageData);
}

async function renderAtlas(items: AtlasItem[], size: number, columns: number): Promise<ImageBitmap> {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("OffscreenCanvas unsupported");
  }
  const safeColumns = Math.max(1, Math.floor(columns));
  const rows = Math.max(1, Math.ceil(items.length / safeColumns));
  const canvas = new OffscreenCanvas(safeColumns * size, rows * size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create atlas context");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const col = index % safeColumns;
    const row = Math.floor(index / safeColumns);
    const x = col * size;
    const y = row * size;
    if (item.kind === "color") {
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, size, size);
      continue;
    }
    try {
      const response = await fetch(item.src, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status})`);
      }
      const blob = await response.blob();
      const bitmap = await createCoverBitmap(blob, size);
      ctx.drawImage(bitmap, x, y, size, size);
      bitmap.close();
    } catch {
      ctx.clearRect(x, y, size, size);
    }
  }

  return canvas.transferToImageBitmap();
}

async function renderGradientAtlas(items: GradientAtlasItem[], size: number, columns: number): Promise<ImageBitmap> {
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("OffscreenCanvas unsupported");
  }
  const safeColumns = Math.max(1, Math.floor(columns));
  const rows = Math.max(1, Math.ceil(items.length / safeColumns));
  const canvas = new OffscreenCanvas(safeColumns * size, rows * size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create atlas context");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const col = index % safeColumns;
    const row = Math.floor(index / safeColumns);
    const x = col * size;
    const y = row * size;
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = item.tileUrl
        ? await renderTerrainPreview(item.tileUrl, item.palette, size)
        : await renderGradientPreview(item.palette, size);
    } catch {
      bitmap = await renderGradientPreview(item.palette, size);
    }
    ctx.drawImage(bitmap, x, y, size, size);
    bitmap.close();
  }

  return canvas.transferToImageBitmap();
}

async function renderTerrainPreview(tileUrl: string, palette: Uint8ClampedArray, size: number): Promise<ImageBitmap> {
  const response = await fetch(tileUrl, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to fetch terrain tile (${response.status})`);
  }
  if (typeof OffscreenCanvas === "undefined") {
    return await renderGradientPreview(palette, size);
  }
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return await renderGradientPreview(palette, size);
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const paletteOffset = gray * 4;
    data[i] = palette[paletteOffset];
    data[i + 1] = palette[paletteOffset + 1];
    data[i + 2] = palette[paletteOffset + 2];
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.transferToImageBitmap();
}
