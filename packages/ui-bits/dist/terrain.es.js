async function k(n) {
  return typeof document > "u" ? { data: new Uint8Array(), width: 0, height: 0 } : new Promise((e, h) => {
    const r = new Image();
    r.crossOrigin = "anonymous", r.src = n, r.onload = () => {
      const i = r.naturalWidth || r.width, a = r.naturalHeight || r.height, o = document.createElement("canvas");
      o.width = i, o.height = a;
      const f = o.getContext("2d");
      if (!f) {
        h(new Error("Unable to get 2d context"));
        return;
      }
      f.drawImage(r, 0, 0, i, a);
      const t = f.getImageData(0, 0, i, a).data, c = new Uint8Array(i * a);
      for (let s = 0; s < c.length; s += 1) {
        const l = s * 4, g = t[l], d = t[l + 1], I = t[l + 2], b = Math.round(0.2126 * g + 0.7152 * d + 0.0722 * I);
        c[s] = b;
      }
      e({ data: c, width: i, height: a });
    }, r.onerror = (i) => h(i);
  });
}
const D = /* @__PURE__ */ new Map(), A = {
  1: 1,
  // BYTE
  2: 1,
  // ASCII
  3: 2,
  // SHORT
  4: 4,
  // LONG
  5: 8,
  // RATIONAL
  12: 8
  // DOUBLE
};
function E(n, e, h) {
  return n.getUint16(e, h);
}
function m(n, e, h) {
  return n.getUint32(e, h);
}
function C(n, e, h, r, i) {
  const a = A[e];
  if (!a) throw new Error(`Unsupported TIFF field type ${e}`);
  const f = a * h <= 4 ? r : m(n, r, i), t = [];
  for (let c = 0; c < h; c += 1) {
    const s = f + c * a;
    switch (e) {
      case 3:
        t.push(E(n, s, i));
        break;
      case 4:
        t.push(m(n, s, i));
        break;
      case 5: {
        const l = m(n, s, i), g = m(n, s + 4, i);
        t.push(g !== 0 ? l / g : 0);
        break;
      }
      case 12: {
        t.push(n.getFloat64(s, i));
        break;
      }
      default:
        t.push(n.getUint8(s));
    }
  }
  return t;
}
async function Y(n) {
  const e = globalThis.DecompressionStream;
  if (typeof e == "function") {
    const h = new e("deflate"), r = new Response(n).body?.pipeThrough(h);
    if (!r) throw new Error("Failed to create deflate stream");
    return await new Response(r).arrayBuffer();
  }
  throw new Error("Deflate decompression unsupported in this environment");
}
async function z(n) {
  const e = new DataView(n), r = e.getUint16(0, !1) === 18761;
  if (E(e, 2, r) !== 42) throw new Error("Unsupported TIFF magic number");
  let a = m(e, 4, r);
  if (a === 0) throw new Error("TIFF has no IFD");
  const o = {}, f = /* @__PURE__ */ new Set();
  for (; a && !f.has(a); ) {
    f.add(a);
    const w = E(e, a, r);
    let u = a + 2;
    for (let U = 0; U < w; U += 1) {
      const p = E(e, u, r), O = E(e, u + 2, r), P = m(e, u + 4, r), y = u + 8;
      o[p] = C(e, O, P, y, r), u += 12;
    }
    a = m(e, u, r);
  }
  const t = o[256]?.[0], c = o[257]?.[0], s = o[258]?.[0] ?? 32, l = o[259]?.[0] ?? 1, g = o[278]?.[0] ?? c, d = o[273] ?? [], I = o[279] ?? [], b = o[339]?.[0] ?? 1;
  if (!t || !c || d.length === 0 || I.length === 0)
    throw new Error("Incomplete GeoTIFF metadata");
  if (s !== 32 || b !== 3)
    throw new Error(`Unsupported GeoTIFF sample format (bitsPerSample=${s}, sampleFormat=${b})`);
  if (l !== 1 && l !== 8)
    throw new Error(`Unsupported GeoTIFF compression (${l})`);
  const x = new Float32Array(t * c);
  let G = 0, _ = c;
  for (let w = 0; w < d.length; w += 1) {
    const u = d[w], U = I[w], p = Math.min(g, _), O = p * t * 4, P = n.slice(u, u + U);
    let y;
    if (l === 8 ? y = await Y(P) : y = P, y.byteLength < O)
      throw new Error("Strip byte count smaller than expected");
    const B = new DataView(y);
    for (let N = 0; N < p; N += 1)
      for (let S = 0; S < t; S += 1) {
        const R = (N * t + S) * 4;
        x[G + N * t + S] = B.getFloat32(R, r);
      }
    G += p * t, _ -= p;
  }
  let T = Number.POSITIVE_INFINITY, F = Number.NEGATIVE_INFINITY;
  for (let w = 0; w < x.length; w += 1) {
    const u = x[w];
    Number.isFinite(u) && (u < T && (T = u), u > F && (F = u));
  }
  return (!Number.isFinite(T) || !Number.isFinite(F)) && (T = 0, F = 1), { data: x, width: t, height: c, min: T, max: F };
}
async function V(n, e) {
  if (e.includes("/rejected/"))
    return console.warn(`Skipping rejected tile ${e}`), null;
  const h = e.toLowerCase(), r = h.endsWith(".png") ? e.replace(/\.png$/i, ".tif") : e, i = r, a = D.get(i);
  if (a) return a;
  try {
    const o = await fetch(r, { cache: "force-cache" });
    if (!o.ok) throw new Error("Failed to fetch GeoTIFF");
    const f = await o.arrayBuffer(), t = await z(f), c = n.createTexture({
      size: [t.width, t.height, 1],
      format: "r32float",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    n.queue.writeTexture(
      { texture: c },
      t.data.buffer,
      {
        offset: t.data.byteOffset,
        bytesPerRow: t.width * Float32Array.BYTES_PER_ELEMENT
      },
      [t.width, t.height, 1]
    );
    const s = {
      texture: c,
      width: t.width,
      height: t.height,
      min: t.min,
      max: t.max
    };
    return D.set(i, s), s;
  } catch (o) {
    console.error("Failed to load GeoTIFF height texture", o);
  }
  if (h.endsWith(".png"))
    try {
      const o = await k(e), { width: f, height: t, data: c } = o, s = new Float32Array(f * t);
      for (let d = 0; d < c.length; d += 1)
        s[d] = c[d] / 255;
      const l = n.createTexture({
        size: [f, t, 1],
        format: "r32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      });
      n.queue.writeTexture(
        { texture: l },
        s.buffer,
        {
          offset: s.byteOffset,
          bytesPerRow: f * Float32Array.BYTES_PER_ELEMENT
        },
        [f, t, 1]
      );
      const g = { texture: l, width: f, height: t, min: 0, max: 1 };
      return D.set(i, g), g;
    } catch (o) {
      console.error("Failed to load fallback PNG height texture", o);
    }
  return null;
}
export {
  V as loadHeightTexture
};
//# sourceMappingURL=terrain.es.js.map
