import { loadTilePixels } from "./tileColorize";

export type HeightTextureEntry = {
  texture: GPUTexture;
  width: number;
  height: number;
  min: number;
  max: number;
};

const heightTextureCache = new Map<string, HeightTextureEntry>();

const TYPE_SIZES: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  12: 8, // DOUBLE
};

function readUInt16(view: DataView, offset: number, little: boolean): number {
  return view.getUint16(offset, little);
}

function readUInt32(view: DataView, offset: number, little: boolean): number {
  return view.getUint32(offset, little);
}

function readValues(
  view: DataView,
  type: number,
  count: number,
  valueOffset: number,
  little: boolean,
): number[] {
  const size = TYPE_SIZES[type];
  if (!size) throw new Error(`Unsupported TIFF field type ${type}`);
  const totalSize = size * count;
  const offset = totalSize <= 4 ? valueOffset : readUInt32(view, valueOffset, little);
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const entryOffset = offset + i * size;
    switch (type) {
      case 3:
        values.push(readUInt16(view, entryOffset, little));
        break;
      case 4:
        values.push(readUInt32(view, entryOffset, little));
        break;
      case 5: {
        const numerator = readUInt32(view, entryOffset, little);
        const denominator = readUInt32(view, entryOffset + 4, little);
        values.push(denominator !== 0 ? numerator / denominator : 0);
        break;
      }
      case 12: {
        values.push(view.getFloat64(entryOffset, little));
        break;
      }
      default:
        values.push(view.getUint8(entryOffset));
    }
  }
  return values;
}

type ParsedTiff = {
  data: Float32Array;
  width: number;
  height: number;
  min: number;
  max: number;
};

async function decompressDeflate(data: ArrayBuffer): Promise<ArrayBuffer> {
  const ctor = (globalThis as unknown as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
  if (typeof ctor === "function") {
    const ds = new ctor("deflate");
    const stream = new Response(data).body?.pipeThrough(ds);
    if (!stream) throw new Error("Failed to create deflate stream");
    return await new Response(stream).arrayBuffer();
  }
  throw new Error("Deflate decompression unsupported in this environment");
}

async function parseGeoTiff(buffer: ArrayBuffer): Promise<ParsedTiff> {
  const view = new DataView(buffer);
  const byteOrder = view.getUint16(0, false);
  const little = byteOrder === 0x4949;
  const magic = readUInt16(view, 2, little);
  if (magic !== 42) throw new Error("Unsupported TIFF magic number");

  let ifdOffset = readUInt32(view, 4, little);
  if (ifdOffset === 0) throw new Error("TIFF has no IFD");

  const directory: Record<number, number[]> = {};
  const visited = new Set<number>();

  while (ifdOffset && !visited.has(ifdOffset)) {
    visited.add(ifdOffset);
    const numEntries = readUInt16(view, ifdOffset, little);
    let entryOffset = ifdOffset + 2;
    for (let entryIndex = 0; entryIndex < numEntries; entryIndex += 1) {
      const tag = readUInt16(view, entryOffset, little);
      const type = readUInt16(view, entryOffset + 2, little);
      const count = readUInt32(view, entryOffset + 4, little);
      const valueOffset = entryOffset + 8;
      directory[tag] = readValues(view, type, count, valueOffset, little);
      entryOffset += 12;
    }
    ifdOffset = readUInt32(view, entryOffset, little);
  }

  const width = directory[256]?.[0];
  const height = directory[257]?.[0];
  const bitsPerSample = directory[258]?.[0] ?? 32;
  const compression = directory[259]?.[0] ?? 1;
  const rowsPerStrip = directory[278]?.[0] ?? height;
  const stripOffsets = directory[273] ?? [];
  const stripByteCounts = directory[279] ?? [];
  const sampleFormat = directory[339]?.[0] ?? 1;

  if (!width || !height || stripOffsets.length === 0 || stripByteCounts.length === 0) {
    throw new Error("Incomplete GeoTIFF metadata");
  }
  if (bitsPerSample !== 32 || sampleFormat !== 3) {
    throw new Error(`Unsupported GeoTIFF sample format (bitsPerSample=${bitsPerSample}, sampleFormat=${sampleFormat})`);
  }
  if (compression !== 1 && compression !== 8) {
    throw new Error(`Unsupported GeoTIFF compression (${compression})`);
  }

  const floatData = new Float32Array(width * height);
  let outOffset = 0;
  let remainingRows = height;

  for (let i = 0; i < stripOffsets.length; i += 1) {
    const stripOffset = stripOffsets[i];
    const byteCount = stripByteCounts[i];
    const rows = Math.min(rowsPerStrip, remainingRows);
    const expectedBytes = rows * width * 4;
    const stripSlice = buffer.slice(stripOffset, stripOffset + byteCount);

    let stripBuffer: ArrayBuffer;
    if (compression === 8) {
      stripBuffer = await decompressDeflate(stripSlice);
    } else {
      stripBuffer = stripSlice;
    }

    if (stripBuffer.byteLength < expectedBytes) {
      throw new Error("Strip byte count smaller than expected");
    }

    const rowView = new DataView(stripBuffer);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const sampleOffset = (row * width + col) * 4;
        floatData[outOffset + row * width + col] = rowView.getFloat32(sampleOffset, little);
      }
    }
    outOffset += rows * width;
    remainingRows -= rows;
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < floatData.length; i += 1) {
    const value = floatData[i];
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0;
    max = 1;
  }

  return { data: floatData, width, height, min, max };
}

export async function loadHeightTexture(device: GPUDevice, tileUrl: string): Promise<HeightTextureEntry | null> {
  if (tileUrl.includes("/rejected/")) {
    console.warn(`Skipping rejected tile ${tileUrl}`);
    return null;
  }
  const normalizedUrl = tileUrl.toLowerCase();
  const heightUrl = normalizedUrl.endsWith(".png") ? tileUrl.replace(/\.png$/i, ".tif") : tileUrl;
  const cacheKey = heightUrl;
  const cached = heightTextureCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(heightUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error("Failed to fetch GeoTIFF");
    const buffer = await response.arrayBuffer();
    const parsed = await parseGeoTiff(buffer);
    const texture = device.createTexture({
      size: [parsed.width, parsed.height, 1],
      format: "r32float",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      { texture },
      parsed.data.buffer,
      {
        offset: parsed.data.byteOffset,
        bytesPerRow: parsed.width * Float32Array.BYTES_PER_ELEMENT,
      },
      [parsed.width, parsed.height, 1],
    );
    const entry: HeightTextureEntry = {
      texture,
      width: parsed.width,
      height: parsed.height,
      min: parsed.min,
      max: parsed.max,
    };
    heightTextureCache.set(cacheKey, entry);
    return entry;
  } catch (error) {
    console.error("Failed to load GeoTIFF height texture", error);
  }

  if (normalizedUrl.endsWith(".png")) {
    try {
      const raster = await loadTilePixels(tileUrl);
      const { width, height, data } = raster;
      const floatData = new Float32Array(width * height);
      for (let i = 0; i < data.length; i += 1) {
        floatData[i] = data[i] / 255;
      }
      const texture = device.createTexture({
        size: [width, height, 1],
        format: "r32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
    device.queue.writeTexture(
      { texture },
      floatData.buffer,
      {
        offset: floatData.byteOffset,
        bytesPerRow: width * Float32Array.BYTES_PER_ELEMENT,
      },
      [width, height, 1],
    );
      const entry: HeightTextureEntry = { texture, width, height, min: 0, max: 1 };
      heightTextureCache.set(cacheKey, entry);
      return entry;
    } catch (error) {
      console.error("Failed to load fallback PNG height texture", error);
    }
  }

  return null;
}
