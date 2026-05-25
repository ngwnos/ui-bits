import { jsxs as Tt, jsx as N } from "react/jsx-runtime";
import c, { createContext as ko, useContext as Po, useReducer as To, useMemo as Qt, useEffect as Lo } from "react";
import { F as Oo } from "./Folder-B-XHBECm.js";
import { Mountain as Fo, Columns4 as zo } from "lucide-react";
import { I as Do } from "./IconButton-BvvMagK1.js";
import { c as Ht, v as _t } from "./lfo-DJ5JkDXn.js";
import { f as S } from "./flexoki-DpJ9ZEpp.js";
function No(e) {
  const t = e.trim().replace("#", "");
  if (t.length !== 6)
    return [0, 0, 0];
  const o = Number.parseInt(t, 16);
  if (Number.isNaN(o)) return [0, 0, 0];
  const s = o >> 16 & 255, a = o >> 8 & 255, w = o & 255;
  return [s, a, w];
}
function yo(e, t) {
  const o = e.map((s) => ({
    ...s,
    rgb: No(s.color)
  }));
  return t ? o.slice().reverse().map((s) => ({
    ...s,
    stop: 100 - s.stop
  })) : o;
}
function Kt(e, t = !1) {
  return `linear-gradient(90deg, ${yo(e, t).map((a) => `${a.color} ${a.stop}%`).join(", ")})`;
}
function Yt(e, t = !1) {
  const o = yo(e, t), s = new Uint8ClampedArray(256 * 4), a = new Array(256);
  for (let w = 0; w < o.length - 1; w += 1) {
    const b = o[w], C = o[w + 1], v = Math.round(b.stop / 100 * 255), h = Math.round(C.stop / 100 * 255), H = Math.max(1, h - v);
    for (let k = v; k <= h; k += 1) {
      const be = (k - v) / H, x = Math.round(b.rgb[0] + (C.rgb[0] - b.rgb[0]) * be), $ = Math.round(b.rgb[1] + (C.rgb[1] - b.rgb[1]) * be), ue = Math.round(b.rgb[2] + (C.rgb[2] - b.rgb[2]) * be), Z = k * 4;
      s[Z] = x, s[Z + 1] = $, s[Z + 2] = ue, s[Z + 3] = 255, a[k] = `rgb(${x}, ${$}, ${ue})`;
    }
  }
  for (let w = 0; w < 256; w += 1) {
    const b = w * 4;
    if (a[w]) continue;
    if (!a.find((v) => v !== void 0))
      a[w] = "rgb(0, 0, 0)", s[b] = 0, s[b + 1] = 0, s[b + 2] = 0, s[b + 3] = 255;
    else {
      let v = w - 1;
      for (; v >= 0 && !a[v]; ) v -= 1;
      let h = w + 1;
      for (; h < 256 && !a[h]; ) h += 1;
      const H = v >= 0 ? v : h, k = H * 4;
      a[w] = a[H], s[b] = s[k], s[b + 1] = s[k + 1], s[b + 2] = s[k + 2], s[b + 3] = 255;
    }
  }
  return { data: s, css: a };
}
const So = [
  {
    name: "Viridis",
    stops: [
      { color: "#440154", stop: 0 },
      { color: "#3b528b", stop: 25 },
      { color: "#21918c", stop: 50 },
      { color: "#5ec962", stop: 75 },
      { color: "#fde725", stop: 100 }
    ]
  },
  {
    name: "Plasma",
    stops: [
      { color: "#0d0887", stop: 0 },
      { color: "#7e03a8", stop: 25 },
      { color: "#cc4778", stop: 50 },
      { color: "#f89441", stop: 75 },
      { color: "#f0f921", stop: 100 }
    ]
  },
  {
    name: "Inferno",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#420a68", stop: 25 },
      { color: "#932667", stop: 50 },
      { color: "#dd513a", stop: 75 },
      { color: "#fba40a", stop: 100 }
    ]
  },
  {
    name: "Magma",
    stops: [
      { color: "#000004", stop: 0 },
      { color: "#3b0f70", stop: 20 },
      { color: "#8c2981", stop: 40 },
      { color: "#de4968", stop: 65 },
      { color: "#fe9f6d", stop: 85 },
      { color: "#fcfdbf", stop: 100 }
    ]
  },
  {
    name: "Cividis",
    stops: [
      { color: "#00204c", stop: 0 },
      { color: "#2d708e", stop: 35 },
      { color: "#a2a929", stop: 70 },
      { color: "#f9f7a5", stop: 100 }
    ]
  },
  {
    name: "Turbo",
    stops: [
      { color: "#30123b", stop: 0 },
      { color: "#4145ab", stop: 20 },
      { color: "#4686f4", stop: 40 },
      { color: "#38bf6b", stop: 60 },
      { color: "#d7e21c", stop: 80 },
      { color: "#fca107", stop: 90 },
      { color: "#d62f27", stop: 100 }
    ]
  },
  {
    name: "Blues",
    stops: [
      { color: "#f7fbff", stop: 0 },
      { color: "#c6dbef", stop: 25 },
      { color: "#6aaed6", stop: 50 },
      { color: "#2070b4", stop: 75 },
      { color: "#08306b", stop: 100 }
    ]
  },
  {
    name: "BuGn",
    stops: [
      { color: "#f7fcfd", stop: 0 },
      { color: "#ccece6", stop: 25 },
      { color: "#65c2a3", stop: 50 },
      { color: "#228a44", stop: 75 },
      { color: "#00441b", stop: 100 }
    ]
  },
  {
    name: "BuPu",
    stops: [
      { color: "#f7fcfd", stop: 0 },
      { color: "#bfd3e6", stop: 25 },
      { color: "#8c95c6", stop: 50 },
      { color: "#88409c", stop: 75 },
      { color: "#4d004b", stop: 100 }
    ]
  },
  {
    name: "GnBu",
    stops: [
      { color: "#f7fcf0", stop: 0 },
      { color: "#ccebc5", stop: 25 },
      { color: "#7accc4", stop: 50 },
      { color: "#2a8bbe", stop: 75 },
      { color: "#084081", stop: 100 }
    ]
  },
  {
    name: "Greens",
    stops: [
      { color: "#f7fcf5", stop: 0 },
      { color: "#c7e9c0", stop: 25 },
      { color: "#73c476", stop: 50 },
      { color: "#228a44", stop: 75 },
      { color: "#00441b", stop: 100 }
    ]
  },
  {
    name: "Oranges",
    stops: [
      { color: "#fff5eb", stop: 0 },
      { color: "#fdd0a2", stop: 25 },
      { color: "#fd8c3b", stop: 50 },
      { color: "#d84801", stop: 75 },
      { color: "#7f2704", stop: 100 }
    ]
  },
  {
    name: "OrRd",
    stops: [
      { color: "#fff7ec", stop: 0 },
      { color: "#fdd49e", stop: 25 },
      { color: "#fc8c59", stop: 50 },
      { color: "#d62f1e", stop: 75 },
      { color: "#7f0000", stop: 100 }
    ]
  },
  {
    name: "PuBu",
    stops: [
      { color: "#fff7fb", stop: 0 },
      { color: "#d0d1e6", stop: 25 },
      { color: "#73a9cf", stop: 50 },
      { color: "#056faf", stop: 75 },
      { color: "#023858", stop: 100 }
    ]
  },
  {
    name: "PuBuGn",
    stops: [
      { color: "#fff7fb", stop: 0 },
      { color: "#d0d1e6", stop: 25 },
      { color: "#66a9cf", stop: 50 },
      { color: "#028189", stop: 75 },
      { color: "#014636", stop: 100 }
    ]
  },
  {
    name: "PuRd",
    stops: [
      { color: "#f7f4f9", stop: 0 },
      { color: "#d4b9da", stop: 25 },
      { color: "#df64af", stop: 50 },
      { color: "#cd1256", stop: 75 },
      { color: "#67001f", stop: 100 }
    ]
  },
  {
    name: "Purples",
    stops: [
      { color: "#fcfbfd", stop: 0 },
      { color: "#dadaeb", stop: 25 },
      { color: "#9e9ac8", stop: 50 },
      { color: "#6950a3", stop: 75 },
      { color: "#3f007d", stop: 100 }
    ]
  },
  {
    name: "RdPu",
    stops: [
      { color: "#fff7f3", stop: 0 },
      { color: "#fcc5c0", stop: 25 },
      { color: "#f767a1", stop: 50 },
      { color: "#ad017e", stop: 75 },
      { color: "#49006a", stop: 100 }
    ]
  },
  {
    name: "Reds",
    stops: [
      { color: "#fff5f0", stop: 0 },
      { color: "#fcbba1", stop: 25 },
      { color: "#fb694a", stop: 50 },
      { color: "#ca181d", stop: 75 },
      { color: "#67000d", stop: 100 }
    ]
  },
  {
    name: "YlGn",
    stops: [
      { color: "#ffffe5", stop: 0 },
      { color: "#d9f0a3", stop: 25 },
      { color: "#77c679", stop: 50 },
      { color: "#228343", stop: 75 },
      { color: "#004529", stop: 100 }
    ]
  },
  {
    name: "YlGnBu",
    stops: [
      { color: "#ffffd9", stop: 0 },
      { color: "#c6e9b4", stop: 25 },
      { color: "#40b5c4", stop: 50 },
      { color: "#225da8", stop: 75 },
      { color: "#081d58", stop: 100 }
    ]
  },
  {
    name: "YlOrBr",
    stops: [
      { color: "#ffffe5", stop: 0 },
      { color: "#fee390", stop: 25 },
      { color: "#fe9829", stop: 50 },
      { color: "#cb4b02", stop: 75 },
      { color: "#662506", stop: 100 }
    ]
  },
  {
    name: "YlOrRd",
    stops: [
      { color: "#ffffcc", stop: 0 },
      { color: "#fed976", stop: 25 },
      { color: "#fd8c3c", stop: 50 },
      { color: "#e2191c", stop: 75 },
      { color: "#800026", stop: 100 }
    ]
  },
  {
    name: "Bone",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#38384e", stop: 25 },
      { color: "#707b90", stop: 50 },
      { color: "#a9c8c8", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Pink",
    stops: [
      { color: "#1e0000", stop: 0 },
      { color: "#a16868", stop: 25 },
      { color: "#d0ac94", stop: 50 },
      { color: "#e9e9b6", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Spring",
    stops: [
      { color: "#ff00ff", stop: 0 },
      { color: "#ff40bf", stop: 25 },
      { color: "#ff807f", stop: 50 },
      { color: "#ffc03f", stop: 75 },
      { color: "#ffff00", stop: 100 }
    ]
  },
  {
    name: "Summer",
    stops: [
      { color: "#008066", stop: 0 },
      { color: "#40a066", stop: 25 },
      { color: "#80c066", stop: 50 },
      { color: "#c0e066", stop: 75 },
      { color: "#ffff66", stop: 100 }
    ]
  },
  {
    name: "Autumn",
    stops: [
      { color: "#ff0000", stop: 0 },
      { color: "#ff4000", stop: 25 },
      { color: "#ff8000", stop: 50 },
      { color: "#ffc000", stop: 75 },
      { color: "#ffff00", stop: 100 }
    ]
  },
  {
    name: "Winter",
    stops: [
      { color: "#0000ff", stop: 0 },
      { color: "#0040df", stop: 25 },
      { color: "#0080bf", stop: 50 },
      { color: "#00c09f", stop: 75 },
      { color: "#00ff80", stop: 100 }
    ]
  },
  {
    name: "Cool",
    stops: [
      { color: "#00ffff", stop: 0 },
      { color: "#40bfff", stop: 25 },
      { color: "#807fff", stop: 50 },
      { color: "#c03fff", stop: 75 },
      { color: "#ff00ff", stop: 100 }
    ]
  },
  {
    name: "Wistia",
    stops: [
      { color: "#e4ff7a", stop: 0 },
      { color: "#ffe81a", stop: 25 },
      { color: "#ffbd00", stop: 50 },
      { color: "#ffa000", stop: 75 },
      { color: "#fc7f00", stop: 100 }
    ]
  },
  {
    name: "Hot",
    stops: [
      { color: "#0b0000", stop: 0 },
      { color: "#b30000", stop: 25 },
      { color: "#ff5c00", stop: 50 },
      { color: "#ffff07", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Afmhot",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#800000", stop: 25 },
      { color: "#ff8001", stop: 50 },
      { color: "#ffff81", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Gist Heat",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#600000", stop: 25 },
      { color: "#c00100", stop: 50 },
      { color: "#ff8103", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Copper",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#4f3220", stop: 25 },
      { color: "#9e6440", stop: 50 },
      { color: "#ed9660", stop: 75 },
      { color: "#ffc77f", stop: 100 }
    ]
  },
  {
    name: "Gist Earth",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#2b737e", stop: 25 },
      { color: "#5ea04b", stop: 50 },
      { color: "#bdab62", stop: 75 },
      { color: "#fdfbfb", stop: 100 }
    ]
  },
  {
    name: "Terrain",
    stops: [
      { color: "#333399", stop: 0 },
      { color: "#01cc66", stop: 25 },
      { color: "#fefe98", stop: 50 },
      { color: "#815e56", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Ocean",
    stops: [
      { color: "#008000", stop: 0 },
      { color: "#002040", stop: 25 },
      { color: "#004080", stop: 50 },
      { color: "#42a0c0", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Gist Stern",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#404080", stop: 25 },
      { color: "#8080fd", stop: 50 },
      { color: "#c0c011", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Brg",
    stops: [
      { color: "#0000ff", stop: 0 },
      { color: "#80007f", stop: 25 },
      { color: "#fe0100", stop: 50 },
      { color: "#7e8100", stop: 75 },
      { color: "#00ff00", stop: 100 }
    ]
  },
  {
    name: "CMRmap",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#4d26bf", stop: 25 },
      { color: "#ff4126", stop: 50 },
      { color: "#e6c01c", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Cubehelix",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#16534c", stop: 25 },
      { color: "#a1794a", stop: 50 },
      { color: "#c6b4ee", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Gnuplot",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#8004ff", stop: 25 },
      { color: "#b52000", stop: 50 },
      { color: "#dd6d00", stop: 75 },
      { color: "#ffff00", stop: 100 }
    ]
  },
  {
    name: "Gnuplot2",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#0100ff", stop: 25 },
      { color: "#c92ad5", stop: 50 },
      { color: "#ffaa55", stop: 75 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Nipy Spectral",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#0078dd", stop: 25 },
      { color: "#00bc00", stop: 50 },
      { color: "#ffc900", stop: 75 },
      { color: "#cccccc", stop: 100 }
    ]
  },
  {
    name: "Gist Ncar",
    stops: [
      { color: "#000080", stop: 0 },
      { color: "#00fbb0", stop: 25 },
      { color: "#dbff20", stop: 50 },
      { color: "#ff0047", stop: 75 },
      { color: "#fef8fe", stop: 100 }
    ]
  },
  {
    name: "Twilight",
    stops: [
      { color: "#e2d9ff", stop: 0 },
      { color: "#b8a0ff", stop: 15 },
      { color: "#8469f0", stop: 30 },
      { color: "#5b3fa8", stop: 45 },
      { color: "#3b1f65", stop: 60 },
      { color: "#5a375e", stop: 70 },
      { color: "#8c675d", stop: 80 },
      { color: "#c39d6a", stop: 90 },
      { color: "#f1d9a7", stop: 100 }
    ]
  },
  {
    name: "Coolwarm",
    stops: [
      { color: "#3b4cc0", stop: 0 },
      { color: "#6f92f3", stop: 25 },
      { color: "#f7f7f7", stop: 50 },
      { color: "#f49d7c", stop: 75 },
      { color: "#b40426", stop: 100 }
    ]
  },
  {
    name: "Spectral",
    stops: [
      { color: "#9e0142", stop: 0 },
      { color: "#f46d43", stop: 20 },
      { color: "#fee08b", stop: 40 },
      { color: "#e6f598", stop: 60 },
      { color: "#66c2a5", stop: 80 },
      { color: "#5e4fa2", stop: 100 }
    ]
  },
  {
    name: "Rainbow",
    stops: [
      { color: "#6e40aa", stop: 0 },
      { color: "#4178d4", stop: 20 },
      { color: "#1fa187", stop: 40 },
      { color: "#73d055", stop: 60 },
      { color: "#fde725", stop: 80 },
      { color: "#f97306", stop: 100 }
    ]
  },
  {
    name: "Monochrome",
    stops: [
      { color: "#000000", stop: 0 },
      { color: "#ffffff", stop: 100 }
    ]
  },
  {
    name: "Flexoki Monochrome",
    stops: [
      { color: "#100f0f", stop: 0 },
      { color: "#fffcf0", stop: 100 }
    ]
  }
], Xt = "selection-grid", vo = '(function(){"use strict";const h=self;h.onmessage=n=>{const t=n.data;if(t){if(t.type==="imageTile"){w(t).catch(a=>{u(t.id,a)});return}t.type==="gradientTile"&&p(t).catch(a=>{u(t.id,a)})}};function u(n,t){const a=t instanceof Error?t.message:"Unknown worker error",e={id:n,error:a};h.postMessage(e)}async function w({id:n,src:t,size:a}){const e=await fetch(t,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch image (${e.status})`);const c=await e.blob(),r=await l(c,a),i={id:n,bitmap:r};h.postMessage(i,[r])}async function l(n,t){const a=await createImageBitmap(n);if(typeof OffscreenCanvas>"u"){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const e=new OffscreenCanvas(t,t),c=e.getContext("2d");if(!c){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const r=Math.max(t/a.width,t/a.height),i=Math.round(a.width*r),f=Math.round(a.height*r),d=Math.round((t-i)/2),o=Math.round((t-f)/2);return c.clearRect(0,0,t,t),c.drawImage(a,d,o,i,f),a.close(),e.transferToImageBitmap()}async function p({id:n,palette:t,size:a,tileUrl:e}){const c=e?await y(e,t,a):await g(t,a),r={id:n,bitmap:c};h.postMessage(r,[c])}async function g(n,t){const a=new ImageData(t,t),e=a.data;for(let c=0;c<t;c+=1)for(let r=0;r<t;r+=1){const i=t<=1?0:r/(t-1),d=Math.min(255,Math.max(0,Math.round(i*255)))*4,o=(c*t+r)*4;e[o]=n[d],e[o+1]=n[d+1],e[o+2]=n[d+2],e[o+3]=255}return await createImageBitmap(a)}async function y(n,t,a){const e=await fetch(n,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch terrain tile (${e.status})`);if(typeof OffscreenCanvas>"u")return await g(t,a);const c=await e.blob(),r=await createImageBitmap(c),i=new OffscreenCanvas(a,a),f=i.getContext("2d");if(!f)return await g(t,a);f.drawImage(r,0,0,a,a),r.close();const d=f.getImageData(0,0,a,a),o=d.data;for(let s=0;s<o.length;s+=4){const I=o[s],M=o[s+1],x=o[s+2],m=Math.round(.2126*I+.7152*M+.0722*x)*4;o[s]=t[m],o[s+1]=t[m+1],o[s+2]=t[m+2],o[s+3]=255}return f.putImageData(d,0,0),i.transferToImageBitmap()}})();\n//# sourceMappingURL=selectionGrid.worker-By4geu6o.js.map\n', uo = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", vo], { type: "text/javascript;charset=utf-8" });
function Mo(e) {
  let t;
  try {
    if (t = uo && (self.URL || self.webkitURL).createObjectURL(uo), !t) throw "";
    const o = new Worker(t, {
      name: e?.name
    });
    return o.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), o;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(vo),
      {
        name: e?.name
      }
    );
  }
}
const Ye = 3, xo = "var(--ui-bits-color-a, #2f2f2f)", Ro = "var(--ui-bits-color-b, #f0f0f0)", $o = 4096, Eo = 6;
function ft(e, t, o, s, a) {
  const w = s / 2, b = Math.min(w, Math.max(0, a.tl)), C = Math.min(w, Math.max(0, a.tr)), v = Math.min(w, Math.max(0, a.br)), h = Math.min(w, Math.max(0, a.bl));
  e.beginPath(), e.moveTo(t + b, o), e.lineTo(t + s - C, o), C > 0 ? e.quadraticCurveTo(t + s, o, t + s, o + C) : e.lineTo(t + s, o), e.lineTo(t + s, o + s - v), v > 0 ? e.quadraticCurveTo(t + s, o + s, t + s - v, o + s) : e.lineTo(t + s, o + s), e.lineTo(t + h, o + s), h > 0 ? e.quadraticCurveTo(t, o + s, t, o + s - h) : e.lineTo(t, o + s), e.lineTo(t, o + b), b > 0 ? e.quadraticCurveTo(t, o, t + b, o) : e.lineTo(t, o), e.closePath();
}
function Vt(e, t) {
  const o = typeof window > "u" ? void 0 : window.location.href;
  if (!o) return e;
  try {
    return new URL(e, o).href;
  } catch {
    return e;
  }
}
function Co(e, t, o = $o) {
  const s = Math.max(1, Math.floor(t)), a = Math.max(1, Math.floor(o)), w = Math.max(1, Math.floor(a / s)), b = Math.max(1, Math.floor(a / s));
  return e <= 0 ? 1 : Math.min(w, Math.max(1, Math.ceil(e / b)));
}
function Ao(e, t) {
  if (typeof document > "u") return null;
  const o = document.createElement("canvas");
  return o.width = e, o.height = t, o;
}
function _o() {
  return new Mo();
}
function dr(e) {
  const {
    items: t,
    folders: o,
    selectionSlots: s,
    getKey: a,
    getPreview: w,
    getLabel: b,
    selectedKey: C,
    defaultSelectedKey: v = null,
    onSelect: h,
    allowEmptySelection: H = !1,
    squareScale: k = 1,
    squareAlignment: be = "left",
    colorA: x = xo,
    colorB: $ = Ro,
    layoutGap: ue = "6px",
    maxHeightUnits: Z = 24,
    fontSize: Ee,
    maxWidth: Et = 360,
    className: fe,
    style: Lt
  } = e, [Ot, pe] = c.useState(v), [Q, pt] = c.useState({}), [ht, Pe] = c.useState({}), [Ce, Te] = c.useState({}), _ = c.useRef(null), Xe = C !== void 0, te = Xe ? C ?? null : Ot, mt = Number.isFinite(k) && k > 0 ? k : 1, Le = be ?? "left", Ve = c.useMemo(() => t ?? [], [t]), U = c.useMemo(() => o ?? [], [o]), V = U.length > 0, Qe = c.useMemo(() => s ?? [], [s]), he = Qe.length > 0, me = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return V && U.forEach((n) => {
      const l = ht[n.id] ?? [];
      l.length === 0 ? r.set(n.id, n.items) : r.set(n.id, [...n.items, ...l]);
    }), r;
  }, [ht, U, V]), K = c.useMemo(() => {
    if (V) {
      const r = [];
      let n = 0;
      return U.forEach((l) => {
        (me.get(l.id) ?? l.items).forEach((f) => {
          const u = a(f, n);
          r.push({ item: f, index: n, key: u }), n += 1;
        });
      }), r;
    }
    return Ve.map((r, n) => ({
      item: r,
      index: n,
      key: a(r, n)
    }));
  }, [a, me, U, Ve, V]), ye = c.useMemo(
    () => K.map((r) => r.key),
    [K]
  );
  c.useEffect(() => {
    Xe || he || te != null && (ye.includes(te) || pe(null));
  }, [ye, Xe, te, he]), c.useEffect(() => {
    V && pt((r) => {
      let n = !1;
      const l = { ...r };
      return U.forEach((d) => {
        d.collapsed === void 0 && l[d.id] === void 0 && d.defaultCollapsed !== void 0 && (l[d.id] = d.defaultCollapsed, n = !0);
      }), n ? l : r;
    });
  }, [U, V]), c.useEffect(() => {
    he && Te((r) => {
      let n = !1;
      const l = { ...r };
      return Qe.forEach((d) => {
        d.selectedKey === void 0 && l[d.id] === void 0 && d.defaultSelectedKey !== void 0 && (l[d.id] = d.defaultSelectedKey, n = !0);
      }), n ? l : r;
    });
  }, [Qe, he]);
  const Ae = c.useRef(null), ge = c.useRef(null), Oe = c.useRef(null), [Je, Ze] = c.useState(360);
  c.useEffect(() => {
    const r = Ae.current;
    if (!r) return;
    const n = () => {
      const d = r.getBoundingClientRect();
      if (!d.width) return;
      const f = Math.round(d.width);
      Ze((u) => Math.abs(u - f) < 0.5 ? u : f);
    };
    n();
    let l = null;
    return typeof ResizeObserver < "u" ? (l = new ResizeObserver(n), l.observe(r)) : window.addEventListener("resize", n), () => {
      l?.disconnect(), window.removeEventListener("resize", n);
    };
  }, [Pe]);
  const We = Ee ?? 16, Ct = 1, et = We * 0.35, gt = We * Ct, tt = Math.max(
    Math.round(gt + et * 2 + 2),
    Math.round(We + et * 1.5)
  ), R = tt * mt, ot = tt, oe = Je ? Math.max(1, Math.floor(Je / R)) : 1, Ie = oe * R, Fe = c.useMemo(() => {
    if (!V)
      return K.map((l) => ({ type: "item", ...l }));
    const r = [];
    let n = 0;
    return U.forEach((l) => {
      if (l.collapsed ?? Q[l.id] ?? !1) {
        const u = me.get(l.id) ?? l.items;
        n += u.length;
        return;
      }
      (me.get(l.id) ?? l.items).forEach((u) => {
        const g = a(u, n);
        r.push({ type: "item", item: u, index: n, key: g }), n += 1;
      }), l.addTile && r.push({ type: "add", folderId: l.id, key: `add:${l.id}` });
    }), r;
  }, [K, a, Q, me, U, V]), wt = c.useMemo(() => {
    if (!V)
      return K.map((l) => ({ type: "item", ...l }));
    const r = [];
    let n = 0;
    return U.forEach((l) => {
      (me.get(l.id) ?? l.items).forEach((f) => {
        const u = a(f, n);
        r.push({ type: "item", item: f, index: n, key: u }), n += 1;
      }), l.addTile && r.push({ type: "add", folderId: l.id, key: `add:${l.id}` });
    }), r;
  }, [K, a, me, U, V]), Se = Fe.length, Re = wt.length, W = c.useMemo(() => {
    const r = [];
    let n = 0;
    if (!V) {
      for (let d = 0; d < Se; d += oe) {
        const f = Math.min(oe, Se - d), u = oe - f, g = u > 0 ? Le === "center" ? u * R / 2 : Le === "right" ? u * R : 0 : 0;
        r.push({
          type: "items",
          startIndex: d,
          count: f,
          alignmentOffsetPx: g,
          height: R,
          top: n
        }), n += R;
      }
      return r;
    }
    let l = 0;
    return U.forEach((d, f) => {
      if (r.push({
        type: "header",
        folderIndex: f,
        alignmentOffsetPx: 0,
        height: ot,
        top: n
      }), n += ot, d.collapsed ?? Q[d.id] ?? !1) return;
      const E = (me.get(d.id) ?? d.items).length + (d.addTile ? 1 : 0);
      for (let M = 0; M < E; M += oe) {
        const B = Math.min(oe, E - M), q = oe - B, z = q > 0 ? Le === "center" ? q * R / 2 : Le === "right" ? q * R : 0 : 0;
        r.push({
          type: "items",
          startIndex: l + M,
          count: B,
          alignmentOffsetPx: z,
          height: R,
          top: n
        }), n += R;
      }
      l += E;
    }), r;
  }, [
    R,
    Se,
    ot,
    Q,
    me,
    U,
    Le,
    oe,
    V
  ]), G = W.length, P = G > 0 ? W[G - 1].top + W[G - 1].height : 0, ze = typeof Z == "number" && Number.isFinite(Z) && Z > 0 ? Z : null, bt = W.reduce((r, n) => r + n.height / tt, 0), qe = ze != null ? ze * tt : null, rt = ze != null && bt > ze, Dt = {
    width: "100%",
    maxWidth: typeof Et == "number" ? `${Et}px` : Et,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: ue,
    alignItems: "stretch",
    ...Lt ?? {}
  }, nt = (r, n, l) => {
    Xe || pe(r), h?.(r, n, l);
  }, De = c.useMemo(
    () => Qe.map((r) => ({
      ...r,
      selectedKey: r.selectedKey ?? Ce[r.id] ?? null
    })),
    [Ce, Qe]
  ), st = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return De.forEach((n) => {
      const l = n.selectedKey;
      l != null && (r.has(l) || r.set(l, { slotId: n.id, color: n.color }));
    }), r;
  }, [De]), At = c.useCallback(
    (r, n, l, d) => {
      const f = De.find((u) => u.id === r);
      f && (f.selectedKey === void 0 && Te((u) => {
        const g = { ...u, [r]: n };
        return n != null && De.forEach((E) => {
          E.id !== r && E.selectedKey === void 0 && g[E.id] === n && (g[E.id] = null);
        }), g;
      }), n != null && (_.current = r), f.onSelect?.(n, l, d));
    },
    [De]
  ), It = c.useCallback((r) => {
    if (r.length === 0) return null;
    const n = _.current;
    if (!n) return r[0] ?? null;
    const l = r.findIndex((f) => f.id === n);
    if (l === -1) return r[0] ?? null;
    const d = (l + 1) % r.length;
    return r[d] ?? null;
  }, []), Nt = c.useRef(null), Gt = c.useRef(/* @__PURE__ */ new Map()), Bt = c.useRef(/* @__PURE__ */ new Map()), ve = c.useRef(/* @__PURE__ */ new Map()), Me = c.useRef(/* @__PURE__ */ new Set()), Ne = c.useRef(/* @__PURE__ */ new Set()), Ge = c.useRef([]), He = c.useRef(/* @__PURE__ */ new Map()), yt = c.useRef(null), re = c.useRef(null), St = c.useRef(null), lt = c.useRef(0), kt = c.useRef(null), vt = c.useRef(null), i = c.useRef([]), y = c.useRef(() => {
  }), p = c.useCallback((r, n) => {
    n ? Gt.current.set(r, n) : Gt.current.delete(r);
  }, []), L = c.useCallback((r) => {
    const n = Gt.current.get(r);
    n && n.click();
  }, []), T = c.useCallback((r, n) => {
    const l = r.addTile;
    if (!l || (l.onAdd?.(n), !l.createItem)) return;
    const d = Array.from(n), f = d.map((M) => URL.createObjectURL(M)), u = d.map((M, B) => l.createItem?.(M, f[B])).filter(Boolean), g = l.autoAppend !== !1, E = l.revokeObjectUrls ?? g;
    if (u.length > 0 && (l.onAddItems?.(u, d), g && Pe((M) => ({
      ...M,
      [r.id]: [...M[r.id] ?? [], ...u]
    }))), E) {
      const M = Bt.current.get(r.id) ?? /* @__PURE__ */ new Set();
      f.forEach((B) => M.add(B)), Bt.current.set(r.id, M);
    }
  }, [Pe]);
  c.useEffect(() => {
    const r = Bt.current;
    return () => {
      r.forEach((n) => {
        n.forEach((l) => URL.revokeObjectURL(l));
      }), r.clear();
    };
  }, []);
  const O = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return U.forEach((n) => {
      r.set(n.id, {
        colorA: n.colorA ?? x,
        colorB: n.colorB ?? $
      });
    }), r;
  }, [x, $, U]), F = c.useCallback(() => {
    if (typeof window > "u") return;
    lt.current += 1;
    const r = lt.current;
    window.requestAnimationFrame(() => {
      r === lt.current && y.current();
    });
  }, []), xe = c.useCallback(() => {
    const r = Nt.current;
    if (r)
      for (; Me.current.size < Eo && Ge.current.length > 0; ) {
        const n = Ge.current.shift();
        if (!n) break;
        if (Ne.current.delete(n), Me.current.has(n)) continue;
        const l = He.current.get(n);
        l && (Me.current.add(n), r.postMessage({
          type: "imageTile",
          id: n,
          src: l.src,
          size: l.size
        }));
      }
  }, []);
  c.useEffect(() => {
    if (typeof window > "u") return;
    const r = _o();
    Nt.current = r, r.onmessage = (f) => {
      const { id: u, bitmap: g, error: E } = f.data ?? {};
      if (!u) return;
      Me.current.delete(u);
      const M = ve.current.get(u);
      M?.bitmap && M.bitmap !== g && M.bitmap.close(), E ? (ve.current.set(u, { status: "error" }), g?.close()) : g && ve.current.set(u, { status: "ready", bitmap: g }), xe(), F();
    };
    const n = ve.current, l = Me.current, d = He.current;
    return () => {
      r.terminate(), Nt.current = null, n.forEach((f) => f.bitmap?.close()), n.clear(), l.clear(), Ne.current.clear(), Ge.current = [], d.clear(), yt.current = null, re.current = null, St.current = null, kt.current = null, vt.current = null, i.current = [];
    };
  }, [xe, F]), c.useEffect(() => {
    F();
  }, [
    wt,
    Fe,
    te,
    Je,
    R,
    x,
    $,
    oe,
    G,
    Se,
    F
  ]), c.useEffect(() => {
    const r = ge.current;
    if (!r) return;
    const n = () => F();
    return r.addEventListener("scroll", n, { passive: !0 }), () => r.removeEventListener("scroll", n);
  }, [F]);
  const ne = (r) => {
    if (W.length === 0) return -1;
    let n = 0, l = W.length - 1;
    for (; n <= l; ) {
      const d = Math.floor((n + l) / 2), f = W[d];
      if (r < f.top)
        l = d - 1;
      else if (r >= f.top + f.height)
        n = d + 1;
      else
        return d;
    }
    return Math.max(0, Math.min(W.length - 1, n));
  };
  y.current = () => {
    const r = Oe.current, n = ge.current;
    if (!r || !n) return;
    const l = r.getContext("2d");
    if (!l) return;
    const d = Math.max(1, Math.round(n.clientWidth || Ie)), f = Math.max(1, Math.round(n.clientHeight || P)), u = Math.max(0, (d - Ie) / 2), g = typeof window < "u" && window.devicePixelRatio || 1, E = Math.max(1, Math.round(d * g)), M = Math.max(1, Math.round(f * g));
    if ((r.width !== E || r.height !== M) && (r.width = E, r.height = M, r.style.width = `${d}px`, r.style.height = `${f}px`), l.setTransform(g, 0, 0, g, 0, 0), l.clearRect(0, 0, d, f), Se === 0 && Re === 0) return;
    const B = n.scrollTop, q = Math.max(0, ne(B) - 1), z = Math.min(G - 1, ne(B + f) + 1), D = Math.max(1, Math.round(R * g)), se = new Array(Re), ee = new Array(Re), $e = /* @__PURE__ */ new Map(), le = /* @__PURE__ */ new Set();
    for (let m = 0; m < Re; m += 1) {
      const A = wt[m];
      if ($e.set(A.key, m), A.type === "add") {
        const j = O.get(A.folderId);
        se[m] = { type: "color", color: j?.colorA ?? x }, ee[m] = `add:${A.folderId}|${D}`;
        continue;
      }
      const I = w(A.item, A.index);
      if (se[m] = I, I.type === "color")
        ee[m] = `color:${I.color}`;
      else {
        const j = Vt(I.src), Y = `image:${j}|${D}`;
        ee[m] = Y, le.add(Y), He.current.set(Y, { src: j, size: D });
      }
    }
    const ke = Co(Math.max(1, Re), D), _e = Math.max(1, Math.ceil(Math.max(1, Re) / ke)), ce = `${D}|${ke}|${ee.join("|")}`;
    if (kt.current !== ce) {
      if (kt.current = ce, vt.current = null, Re === 0)
        yt.current = null, re.current = null, St.current = null, i.current = [];
      else {
        const m = ke * D, A = _e * D, I = Ao(m, A);
        if (yt.current = I, re.current = I?.getContext("2d") ?? null, St.current = {
          key: ce,
          columns: ke,
          rows: _e,
          tileSize: D
        }, i.current = new Array(Re).fill(""), re.current) {
          re.current.clearRect(0, 0, m, A);
          for (let j = 0; j < Re; j += 1) {
            const Y = se[j];
            if (Y.type !== "color") continue;
            const X = j % ke * D, ie = Math.floor(j / ke) * D;
            re.current.fillStyle = Y.color, re.current.fillRect(X, ie, D, D), i.current[j] = ee[j];
          }
        }
      }
      ve.current.forEach((m, A) => {
        le.has(A) || (m.bitmap?.close(), ve.current.delete(A));
      }), Me.current.forEach((m) => {
        le.has(m) || Me.current.delete(m);
      }), Ge.current = Ge.current.filter((m) => le.has(m)), Ne.current = new Set(Ge.current), He.current.forEach((m, A) => {
        le.has(A) || He.current.delete(A);
      });
    }
    for (let m = q; m <= z; m += 1) {
      const A = W[m];
      if (!A || A.type !== "items") continue;
      const I = u + A.alignmentOffsetPx, j = A.count, Y = A.startIndex, X = A.top - B;
      for (let ie = 0; ie < j; ie += 1) {
        const it = Y + ie;
        if (it >= Se) break;
        const at = Fe[it], Zt = at?.key ?? String(it), dt = at.type === "add", eo = !dt && he ? st.get(Zt) : null, Bo = !dt && (he ? !!eo : te != null && Zt === te), to = m > 0 ? W[m - 1] : null, oo = m + 1 < W.length ? W[m + 1] : null, ro = to?.type === "items" && ie < to.count, no = oo?.type === "items" && ie < oo.count, so = ie > 0, lo = ie < j - 1, $t = {
          tl: ro || so ? 0 : Ye,
          tr: ro || lo ? 0 : Ye,
          br: no || lo ? 0 : Ye,
          bl: no || so ? 0 : Ye
        }, Mt = I + ie * R, co = dt ? O.get(at.folderId) : null, we = $e.get(at.key), ut = we != null ? se[we] : dt ? { type: "color", color: co?.colorA ?? x } : w(at.item, at.index);
        let ae = we != null ? ee[we] : "";
        if (!ae) {
          if (ut.type === "color")
            ae = `color:${ut.color}`;
          else if (dt)
            ae = `add:${at.folderId}|${D}`;
          else if (ut.type === "image") {
            const J = Vt(ut.src);
            ae = `image:${J}|${D}`, le.add(ae), He.current.set(ae, { src: J, size: D });
          }
        }
        const io = yt.current, de = St.current, ao = re.current;
        let qt = we != null && i.current[we] === ae;
        if (!dt && ut.type === "image") {
          const J = ve.current.get(ae);
          if (J?.status === "ready" && J.bitmap && ao && de && !qt && we != null) {
            const je = we % de.columns * de.tileSize, xt = Math.floor(we / de.columns) * de.tileSize;
            ao.drawImage(J.bitmap, je, xt, de.tileSize, de.tileSize), i.current[we] = ae, qt = !0;
          }
          J || ve.current.set(ae, { status: "loading" }), (!J || J.status === "loading") && !Me.current.has(ae) && !Ne.current.has(ae) && (Ge.current.push(ae), Ne.current.add(ae));
        }
        if (io && de && qt && we != null) {
          const J = we % de.columns * de.tileSize, je = Math.floor(we / de.columns) * de.tileSize;
          l.save(), ft(l, Mt, X, R, $t), l.clip(), l.drawImage(
            io,
            J,
            je,
            de.tileSize,
            de.tileSize,
            Mt,
            X,
            R,
            R
          ), l.restore();
        } else ut.type === "color" ? (ft(l, Mt, X, R, $t), l.fillStyle = ut.color, l.fill()) : (ft(l, Mt, X, R, $t), l.fillStyle = x, l.fill());
        if (Bo && (l.save(), l.strokeStyle = he ? eo?.color ?? $ : $, l.lineWidth = 2, ft(l, Mt + 1, X + 1, R - 2, $t), l.stroke(), l.restore()), dt) {
          const J = Mt + R / 2, je = X + R / 2, xt = R * 0.22;
          l.save(), l.strokeStyle = co?.colorB ?? $, l.lineWidth = Math.max(1.5, R * 0.08), l.lineCap = "round", l.beginPath(), l.moveTo(J - xt, je), l.lineTo(J + xt, je), l.moveTo(J, je - xt), l.lineTo(J, je + xt), l.stroke(), l.restore();
        }
      }
    }
    if (vt.current !== ce) {
      vt.current = ce;
      for (let m = 0; m < Se; m += 1) {
        const A = Fe[m], I = A ? $e.get(A.key) : null;
        if (I == null || se[I].type !== "image") continue;
        const Y = ee[I], X = ve.current.get(Y);
        X?.status === "ready" || X?.status === "error" || X?.status === "loading" || Me.current.has(Y) || Ne.current.has(Y) || (Ge.current.push(Y), Ne.current.add(Y), ve.current.set(Y, { status: "loading" }));
      }
    }
    xe();
  };
  const ct = (r) => {
    const n = Oe.current, l = ge.current;
    if (!n || !l) return;
    const d = n.getBoundingClientRect(), f = r.clientX - d.left, u = r.clientY - d.top + l.scrollTop;
    if (f < 0 || u < 0) return;
    const g = ne(u);
    if (g < 0 || g >= G) return;
    const E = W[g];
    if (!E || E.type !== "items") return;
    const M = l.clientWidth || Ie, q = Math.max(0, (M - Ie) / 2) + E.alignmentOffsetPx, z = E.count;
    if (f < q || f > q + z * R) return;
    const D = Math.floor((f - q) / R);
    if (D < 0 || D >= z) return;
    const se = E.startIndex + D;
    if (se < 0 || se >= Fe.length) return;
    const ee = Fe[se];
    if (ee.type === "add") {
      L(ee.folderId);
      return;
    }
    const $e = ee.item, le = ee.key ?? String(se);
    if (he) {
      const _e = st.get(le);
      if (_e) {
        H && At(_e.slotId, null, null, null);
        return;
      }
      const ce = De.find((m) => m.selectedKey == null) ?? It(De);
      if (!ce) return;
      At(ce.id, le, $e, se);
      return;
    }
    if (te != null && le === te) {
      H && nt(null, null, null);
      return;
    }
    nt(le, $e, se);
  }, Ke = c.useMemo(() => {
    if (he || !b || te == null) return;
    const r = K.find((n) => n.key === te);
    if (r)
      return b(r.item, r.index);
  }, [K, b, te, he]), Be = c.useMemo(() => V ? W.flatMap((r, n) => r.type === "header" ? [{ rowIndex: n, folderIndex: r.folderIndex, top: r.top, height: r.height }] : []) : [], [W, V]);
  return /* @__PURE__ */ Tt("div", { ref: Ae, className: fe, style: Dt, children: [
    /* @__PURE__ */ N("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ N(
      "div",
      {
        style: {
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          borderRadius: 3,
          overflow: "hidden"
        },
        children: /* @__PURE__ */ Tt(
          "div",
          {
            ref: ge,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: rt && qe != null ? `${qe}px` : `${P}px`,
              maxHeight: qe != null ? `${qe}px` : void 0,
              overflowY: rt ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            title: Ke,
            children: [
              /* @__PURE__ */ N(
                "div",
                {
                  style: {
                    position: "sticky",
                    top: 0,
                    left: 0,
                    height: 0,
                    overflow: "visible",
                    zIndex: 1
                  },
                  children: /* @__PURE__ */ N(
                    "canvas",
                    {
                      ref: Oe,
                      className: "selection-grid__canvas",
                      style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        touchAction: "manipulation"
                      },
                      onPointerDown: ct
                    }
                  )
                }
              ),
              V && Be.length > 0 && /* @__PURE__ */ N(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${P}px`,
                    pointerEvents: "none",
                    zIndex: 2
                  },
                  children: Be.map((r) => {
                    const n = U[r.folderIndex];
                    if (!n) return null;
                    const l = n.collapsed ?? Q[n.id] ?? !1;
                    return /* @__PURE__ */ N(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          top: `${r.top}px`,
                          left: 0,
                          width: "100%",
                          height: `${r.height}px`,
                          pointerEvents: "auto"
                        },
                        children: /* @__PURE__ */ N(
                          Oo,
                          {
                            label: n.label,
                            collapsed: l,
                            onCollapseChange: (d) => {
                              n.collapsed === void 0 && pt((f) => ({ ...f, [n.id]: d })), n.onCollapseChange?.(d);
                            },
                            colorA: n.colorA ?? x,
                            colorB: n.colorB ?? $,
                            borderStyle: n.borderStyle ?? "none",
                            fontSize: We,
                            headerHeight: r.height,
                            padding: 0,
                            verticalGap: 0,
                            keepMounted: !1,
                            showBody: !1,
                            style: { height: `${r.height}px` }
                          }
                        )
                      },
                      `${n.id}-${r.rowIndex}`
                    );
                  })
                }
              ),
              /* @__PURE__ */ N("div", { style: { width: "100%", height: `${P}px` } })
            ]
          }
        )
      }
    ) }),
    V && U.length > 0 && /* @__PURE__ */ N("div", { style: { display: "none" }, children: U.map((r) => r.addTile ? /* @__PURE__ */ N(
      "input",
      {
        ref: (n) => p(r.id, n),
        type: "file",
        accept: r.addTile.accept,
        multiple: r.addTile.multiple,
        "aria-label": typeof r.addTile.label == "string" ? r.addTile.label : "Add items",
        onChange: (n) => {
          const l = n.currentTarget.files;
          l && l.length > 0 && T(r, l), n.currentTarget.value = "";
        }
      },
      `add-input-${r.id}`
    ) : null) })
  ] });
}
const Jt = ko(void 0);
function Ue() {
  const e = Po(Jt);
  if (!e) throw new Error("useSliderStore must be used within a SliderStoreProvider");
  return e;
}
const Wt = 1024, Uo = Wt, Io = 1, Wo = -1, qo = 1, Go = Yt(So[0].stops, !1).css, Rt = {
  selectedIndex: 0,
  squareScale: 1,
  squareAlignment: "left",
  invertGradients: !1,
  allowEmptySelection: !1,
  colorPalette: [...Go],
  previewMode: "terrainHeight",
  sunAltitudeDeg: 45,
  sunAzimuthDeg: 315
};
function jt(e, t) {
  return e.selectedIndex === t.selectedIndex && e.squareScale === t.squareScale && e.squareAlignment === t.squareAlignment && e.invertGradients === t.invertGradients && e.allowEmptySelection === t.allowEmptySelection && e.colorPalette.length === t.colorPalette.length && e.colorPalette.every((o, s) => o === t.colorPalette[s]) && e.previewMode === t.previewMode && e.sunAltitudeDeg === t.sunAltitudeDeg && e.sunAzimuthDeg === t.sunAzimuthDeg;
}
function Pt(e) {
  const t = (h) => Number.isFinite(h) ? Math.min(4, Math.max(1, Math.round(h))) : 1, o = (h) => Number.isFinite(h ?? Number.NaN) ? Math.min(90, Math.max(0, Number(h))) : Rt.sunAltitudeDeg, s = (h) => Number.isFinite(h ?? Number.NaN) ? (Number(h) % 360 + 360) % 360 : Rt.sunAzimuthDeg, a = (h) => h === "center" || h === "right" ? h : "left", w = (h) => h === "gradient" || h === "terrainHeight" ? h : h === "terrainHillshade" ? "terrainHeight" : typeof h == "boolean" ? h ? "terrainHeight" : "gradient" : "terrainHeight", b = e.previewMode, C = e.useTerrainTiles, v = {
    selectedIndex: e.selectedIndex,
    squareScale: t(e.squareScale),
    squareAlignment: a(e.squareAlignment),
    invertGradients: !!e.invertGradients,
    allowEmptySelection: !!e.allowEmptySelection,
    colorPalette: Array.isArray(e.colorPalette) && e.colorPalette.length === 256 ? [...e.colorPalette] : [...Go],
    previewMode: w(b ?? C),
    sunAltitudeDeg: o(e.sunAltitudeDeg),
    sunAzimuthDeg: s(e.sunAzimuthDeg)
  };
  return !v.allowEmptySelection && v.selectedIndex == null && (v.selectedIndex = 0), v;
}
function fo({ min: e, max: t, step: o }) {
  const s = Number.isFinite(e) ? e : 0, a = Number.isFinite(t) ? t : s, w = Math.max(0, a - s), b = o > 0 && Number.isFinite(o) ? o : w || 1;
  if (w === 0 || !Number.isFinite(w)) return s;
  const C = Math.max(1, Math.floor(w / b)), v = Math.floor(Math.random() * (C + 1)), h = s + v * b, H = (() => {
    const k = b.toString();
    if (k.includes("e-")) {
      const [, x] = k.split("e-");
      return Number(x ?? "0");
    }
    const [, be] = k.split(".");
    return be?.length ?? 0;
  })();
  return Number(h.toFixed(H));
}
const po = [0.2, 0.4, 0.6, 0.8];
function ho() {
  const e = Math.floor(Math.random() * po.length);
  return po[e];
}
function mo() {
  return Math.random();
}
const Ut = ["sine", "triangle", "saw", "square", "audio"], go = [
  {
    hue: "base",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Base 500/50", colorA: S.base[500], colorB: S.base[50] },
      { key: "600-100", label: "Base 600/100" },
      { key: "700-200", label: "Base 700/200", colorA: S.base[700], colorB: S.base[200] }
    ]
  },
  {
    hue: "red",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Red 500/50", colorA: S.red[500], colorB: S.red[50] },
      { key: "600-100", label: "Red 600/100" },
      { key: "700-200", label: "Red 700/200", colorA: S.red[700], colorB: S.red[200] }
    ]
  },
  {
    hue: "orange",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Orange 500/50", colorA: S.orange[500], colorB: S.orange[50] },
      { key: "600-100", label: "Orange 600/100" },
      { key: "700-200", label: "Orange 700/200", colorA: S.orange[700], colorB: S.orange[200] }
    ]
  },
  {
    hue: "yellow",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Yellow 500/50", colorA: S.yellow[500], colorB: S.yellow[50] },
      { key: "600-100", label: "Yellow 600/100" },
      { key: "700-200", label: "Yellow 700/200", colorA: S.yellow[700], colorB: S.yellow[200] }
    ]
  },
  {
    hue: "green",
    min: -10,
    max: 10,
    step: 0.5,
    width: 260,
    variants: [
      { key: "500-50", label: "Green 500/50", colorA: S.green[500], colorB: S.green[50] },
      { key: "600-100", label: "Green 600/100" },
      { key: "700-200", label: "Green 700/200", colorA: S.green[700], colorB: S.green[200] }
    ]
  },
  {
    hue: "cyan",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Cyan 500/50", colorA: S.cyan[500], colorB: S.cyan[50] },
      { key: "600-100", label: "Cyan 600/100" },
      { key: "700-200", label: "Cyan 700/200", colorA: S.cyan[700], colorB: S.cyan[200] }
    ]
  },
  {
    hue: "blue",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Blue 500/50", colorA: S.blue[500], colorB: S.blue[50] },
      { key: "600-100", label: "Blue 600/100" },
      { key: "700-200", label: "Blue 700/200", colorA: S.blue[700], colorB: S.blue[200] }
    ]
  },
  {
    hue: "purple",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Purple 500/50", colorA: S.purple[500], colorB: S.purple[50] },
      { key: "600-100", label: "Purple 600/100" },
      { key: "700-200", label: "Purple 700/200", colorA: S.purple[700], colorB: S.purple[200] }
    ]
  },
  {
    hue: "magenta",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Magenta 500/50", colorA: S.magenta[500], colorB: S.magenta[50] },
      { key: "600-100", label: "Magenta 600/100" },
      { key: "700-200", label: "Magenta 700/200", colorA: S.magenta[700], colorB: S.magenta[200] }
    ]
  }
];
function Ho() {
  const e = {}, t = {}, o = [], s = {}, a = [], w = Array.from({ length: Wt }, () => 0), b = go[0]?.variants.length ?? 0;
  for (let k = 0; k < b; k += 1) {
    const be = [];
    go.forEach((x) => {
      const $ = x.variants[k];
      if (!$) return;
      const ue = `${x.hue}-${$.key}`, Z = $.colorA ?? S[x.hue][600], Ee = $.colorB ?? S[x.hue][100];
      e[ue] = {
        id: ue,
        label: $.label,
        hue: x.hue,
        min: x.min,
        max: x.max,
        step: x.step,
        width: x.width,
        drawerHandle: !0
      }, t[ue] = {
        value: fo({ min: x.min, max: x.max, step: x.step }),
        colorA: Z,
        colorB: Ee,
        border: "none",
        drawerFeatureEnabled: e[ue].drawerHandle,
        drawerLines: [
          _t(Math.random(), x.min, x.max, x.step),
          _t(Math.random(), x.min, x.max, x.step)
        ],
        drawerOpen: !1,
        lfoEnabled: !0,
        waveform: Ut[Math.floor(Math.random() * Ut.length)],
        frequency: ho(),
        phase: mo(),
        audioResponse: 0,
        audioSamplePosition: 0.5
      }, be.push(ue);
    }), o.push({ id: `column-${k}`, sliderIds: be });
  }
  const C = "custom-primary", v = 0, h = 100, H = 1;
  return e[C] = {
    id: C,
    label: "Custom colors",
    hue: "base",
    min: v,
    max: h,
    step: H,
    width: 320,
    drawerHandle: !0
  }, t[C] = {
    value: fo({ min: v, max: h, step: H }),
    colorA: "#205EA6",
    colorB: "#ECCB60",
    border: "none",
    drawerFeatureEnabled: e[C].drawerHandle,
    drawerLines: [
      _t(Math.random(), v, h, H),
      _t(Math.random(), v, h, H)
    ],
    drawerOpen: !0,
    lfoEnabled: !0,
    waveform: Ut[Math.floor(Math.random() * Ut.length)],
    frequency: ho(),
    phase: mo(),
    audioResponse: 0,
    audioSamplePosition: 0.5
  }, s[Xt] = Pt({
    ...Rt
  }), a.push(Xt), {
    definitions: e,
    sliders: t,
    columns: o,
    customSliderId: C,
    selectionGrids: s,
    selectionGridIds: a,
    audioBins: w,
    audioBinCount: Uo,
    audioMaxMagnitude: Io
  };
}
function Ko(e, t) {
  switch (t.type) {
    case "setValue":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            value: Ht(t.value, e.definitions[t.id].min, e.definitions[t.id].max)
          }
        }
      };
    case "setColors":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            colorA: t.colorA,
            colorB: t.colorB
          }
        }
      };
    case "setBorder":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            border: t.border
          }
        }
      };
    case "setDrawerLines":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            drawerLines: t.lines
          }
        }
      };
    case "setDrawerFeatureEnabled": {
      const o = e.sliders[t.id];
      if (!o) return e;
      const s = t.enabled ? { ...o, drawerFeatureEnabled: !0 } : { ...o, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 };
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: s
        }
      };
    }
    case "setDrawerOpen": {
      const o = e.sliders[t.id];
      if (!o) return e;
      const s = o.drawerFeatureEnabled ? t.open : !1;
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...o,
            drawerOpen: s
          }
        }
      };
    }
    case "setLfoEnabled":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            lfoEnabled: t.enabled
          }
        }
      };
    case "setWaveform":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            waveform: t.waveform
          }
        }
      };
    case "setFrequency":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            frequency: t.frequency
          }
        }
      };
    case "setPhase":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            phase: t.phase
          }
        }
      };
    case "setAudioResponse":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            audioResponse: Ht(t.audioResponse, Wo, qo)
          }
        }
      };
    case "setAudioSamplePosition":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            audioSamplePosition: Ht(t.audioSamplePosition, 0, 1)
          }
        }
      };
    case "setDrawerOpenBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((s) => {
        const a = o[s];
        if (!a) return;
        const w = a.drawerFeatureEnabled ? t.open : !1;
        o[s] = { ...a, drawerOpen: w };
      }), { ...e, sliders: o };
    }
    case "setDrawerFeatureEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((s) => {
        const a = o[s];
        a && (o[s] = t.enabled ? { ...a, drawerFeatureEnabled: !0 } : { ...a, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 });
      }), { ...e, sliders: o };
    }
    case "setLfoEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((s) => {
        const a = o[s];
        a && (o[s] = { ...a, lfoEnabled: t.enabled });
      }), { ...e, sliders: o };
    }
    case "swapColorsAll": {
      const o = Object.fromEntries(
        Object.entries(e.sliders).map(([s, a]) => [
          s,
          { ...a, colorA: a.colorB, colorB: a.colorA }
        ])
      );
      return { ...e, sliders: o };
    }
    case "swapColorsColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((s) => {
        const a = o[s];
        a && (o[s] = { ...a, colorA: a.colorB, colorB: a.colorA });
      }), { ...e, sliders: o };
    }
    case "setBorderColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((s) => {
        const a = o[s];
        a && (o[s] = { ...a, border: t.border });
      }), { ...e, sliders: o };
    }
    case "registerSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (o) {
        const a = Pt({ ...o, ...t.initialState ?? {} });
        return jt(a, o) ? e : {
          ...e,
          selectionGrids: {
            ...e.selectionGrids,
            [t.id]: a
          }
        };
      }
      const s = Pt({ ...Rt, ...t.initialState ?? {} });
      return {
        ...e,
        selectionGridIds: e.selectionGridIds.includes(t.id) ? e.selectionGridIds : [...e.selectionGridIds, t.id],
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: s
        }
      };
    }
    case "updateSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const s = Pt({ ...o, ...t.patch });
      return jt(s, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: s
        }
      };
    }
    case "toggleSelectionGridInvert": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const s = { ...o, invertGradients: !o.invertGradients };
      return {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: s
        }
      };
    }
    case "setSelectionGridPalette": {
      const o = e.selectionGrids[t.id];
      return !o || o.colorPalette.length === t.palette.length && o.colorPalette.every((s, a) => s === t.palette[a]) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: {
            ...o,
            colorPalette: [...t.palette]
          }
        }
      };
    }
    case "setSelectionGridPreviewMode": {
      const o = e.selectionGrids[t.id];
      if (!o || o.previewMode === t.previewMode)
        return e;
      const s = Pt({ ...o, previewMode: t.previewMode });
      return jt(s, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: s
        }
      };
    }
    case "setAudioBins": {
      const o = Array.from({ length: Wt }, (s, a) => t.bins[a] ?? 0);
      return {
        ...e,
        audioBins: o
      };
    }
    case "setAudioBinCount": {
      const o = Math.max(0, Math.min(Wt, Math.floor(t.count)));
      return e.audioBinCount === o ? e : {
        ...e,
        audioBinCount: o
      };
    }
    case "setAudioMaxMagnitude": {
      const o = Number.isFinite(t.magnitude) && t.magnitude > 0 ? t.magnitude : Io;
      return e.audioMaxMagnitude === o ? e : {
        ...e,
        audioMaxMagnitude: o
      };
    }
    default:
      return e;
  }
}
function jo({ children: e }) {
  const [t, o] = To(Ko, void 0, Ho), s = Qt(() => ({ state: t, dispatch: o }), [t, o]);
  return /* @__PURE__ */ N(Jt.Provider, { value: s, children: e });
}
const Yo = {
  ...Rt,
  colorPalette: [...Rt.colorPalette]
};
function ur(e) {
  const { state: t } = Ue(), o = t.definitions[e];
  if (!o) throw new Error(`Slider definition not found for id "${e}"`);
  return o;
}
function fr(e) {
  const { state: t } = Ue(), o = t.sliders[e];
  if (!o) throw new Error(`Slider state not found for id "${e}"`);
  return o;
}
function pr() {
  const { state: e } = Ue();
  return { columns: e.columns, customSliderId: e.customSliderId };
}
function hr() {
  const { state: e } = Ue();
  return e;
}
function mr() {
  const { state: e } = Ue();
  return e.selectionGridIds;
}
function gr(e) {
  const { state: t } = Ue(), o = t.columns.find((s) => s.id === e);
  if (!o) throw new Error(`Slider column not found for id "${e}"`);
  return o;
}
function wr() {
  const { dispatch: e } = Ue();
  return Qt(() => ({
    setSliderValue: (t, o) => e({ type: "setValue", id: t, value: o }),
    setSliderColors: (t, o, s) => e({ type: "setColors", id: t, colorA: o, colorB: s }),
    setSliderBorder: (t, o) => e({ type: "setBorder", id: t, border: o }),
    setSliderDrawerLines: (t, o) => e({ type: "setDrawerLines", id: t, lines: o }),
    setSliderDrawerFeatureEnabled: (t, o) => e({ type: "setDrawerFeatureEnabled", id: t, enabled: o }),
    setSliderDrawerOpen: (t, o) => e({ type: "setDrawerOpen", id: t, open: o }),
    setSliderLfoEnabled: (t, o) => e({ type: "setLfoEnabled", id: t, enabled: o }),
    setSliderWaveform: (t, o) => e({ type: "setWaveform", id: t, waveform: o }),
    setSliderFrequency: (t, o) => e({ type: "setFrequency", id: t, frequency: o }),
    setSliderPhase: (t, o) => e({ type: "setPhase", id: t, phase: o }),
    setSliderAudioResponse: (t, o) => e({ type: "setAudioResponse", id: t, audioResponse: o }),
    setSliderAudioSamplePosition: (t, o) => e({ type: "setAudioSamplePosition", id: t, audioSamplePosition: o }),
    setColumnDrawerOpen: (t, o) => e({ type: "setDrawerOpenBatch", ids: t, open: o }),
    setColumnDrawerFeatureEnabled: (t, o) => e({ type: "setDrawerFeatureEnabledBatch", ids: t, enabled: o }),
    setColumnLfoEnabled: (t, o) => e({ type: "setLfoEnabledBatch", ids: t, enabled: o }),
    swapAllSliderColors: () => e({ type: "swapColorsAll" }),
    swapColumnSliderColors: (t) => e({ type: "swapColorsColumn", ids: t }),
    setColumnBorder: (t, o) => e({ type: "setBorderColumn", ids: t, border: o }),
    setAudioBins: (t) => e({ type: "setAudioBins", bins: t }),
    setAudioBinCount: (t) => e({ type: "setAudioBinCount", count: t }),
    setAudioMaxMagnitude: (t) => e({ type: "setAudioMaxMagnitude", magnitude: t })
  }), [e]);
}
function Xo(e) {
  const { state: t, dispatch: o } = Ue(), s = t.selectionGrids[e];
  return Lo(() => {
    s || o({ type: "registerSelectionGrid", id: e });
  }, [s, e, o]), s || Yo;
}
function Vo() {
  const { dispatch: e } = Ue();
  return Qt(() => ({
    registerSelectionGrid: (t, o) => e({ type: "registerSelectionGrid", id: t, initialState: o }),
    setSelectionGridSelectedIndex: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { selectedIndex: o } }),
    setSelectionGridSquareScale: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { squareScale: o } }),
    setSelectionGridAlignment: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { squareAlignment: o } }),
    setSelectionGridAllowEmpty: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { allowEmptySelection: o } }),
    setSelectionGridInvert: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { invertGradients: o } }),
    toggleSelectionGridInvert: (t) => e({ type: "toggleSelectionGridInvert", id: t }),
    setSelectionGridPreviewMode: (t, o) => e({ type: "setSelectionGridPreviewMode", id: t, previewMode: o }),
    setSelectionGridPalette: (t, o) => e({ type: "setSelectionGridPalette", id: t, palette: o }),
    setSelectionGridSunAltitude: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { sunAltitudeDeg: o } }),
    setSelectionGridSunAzimuth: (t, o) => e({ type: "updateSelectionGrid", id: t, patch: { sunAzimuthDeg: o } })
  }), [e]);
}
function Qo() {
  return new Mo();
}
const Jo = ["gradient", "terrainHeight"], Zo = {
  gradient: zo,
  terrainHeight: Fo
}, wo = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews"
};
function er(e) {
  const t = [...e];
  for (let o = t.length - 1; o > 0; o -= 1) {
    const s = Math.floor(Math.random() * (o + 1)), a = t[o];
    t[o] = t[s], t[s] = a;
  }
  return t;
}
function tr(e, t) {
  return t ? e.slice().reverse().map((o) => ({
    ...o,
    stop: 100 - o.stop
  })) : e;
}
function or(e, t, o, s, a, w) {
  const b = e.createLinearGradient(t, o, t + s, o);
  tr(a, w).forEach((v) => {
    b.addColorStop(v.stop / 100, v.color);
  }), e.fillStyle = b, e.fillRect(t, o, s, s);
}
function bo({
  gridId: e = Xt,
  previewDarkMode: t,
  gradients: o = So,
  terrainAssets: s,
  layoutGap: a = "6px",
  colorA: w = xo,
  colorB: b = Ro,
  allowEmptySelection: C = !1,
  maxHeightUnits: v = 24,
  fontSize: h,
  maxWidth: H = 360,
  className: k,
  style: be
}) {
  const [x, $] = c.useState([]), [ue, Z] = c.useState({}), Ee = c.useMemo(() => o.map((i) => ({
    name: i.name,
    stops: i.stops,
    normal: Yt(i.stops, !1),
    inverted: Yt(i.stops, !0)
  })), [o]), Et = Xo(e), fe = Vo(), {
    squareScale: Lt,
    squareAlignment: Ot,
    selectedIndex: pe,
    invertGradients: Q,
    allowEmptySelection: pt,
    previewMode: ht
  } = Et, Pe = ht === "gradient" ? "plain" : "height", Ce = Pe !== "plain";
  c.useEffect(() => {
    let i = !1;
    if (!Ce) {
      $([]);
      return;
    }
    return (typeof s == "function" ? s() : Promise.resolve(s ?? [])).then((p) => {
      i || $(p);
    }).catch(() => {
      i || $([]);
    }), () => {
      i = !0;
    };
  }, [s, Ce]), c.useEffect(() => {
    if (!Ce) {
      Z({});
      return;
    }
    const i = x;
    if (i.length === 0) {
      Z({});
      return;
    }
    const y = er(i), p = y.length > 0 ? y : i, L = {};
    Ee.forEach((T, O) => {
      const F = p[O % p.length];
      L[T.name] = F;
    }), Z(L);
  }, [Ee, x, Ce]);
  const Te = c.useMemo(() => Ee.map((i) => {
    const y = Ce ? ue[i.name] : void 0, p = y?.url ?? "", L = y?.name ?? p.split("/").pop() ?? p;
    return {
      name: i.name,
      tile: L,
      tileUrl: p,
      normal: {
        paletteCss: [...i.normal.css],
        cssFallback: Kt(i.stops, !1)
      },
      inverted: {
        paletteCss: [...i.inverted.css],
        cssFallback: Kt(i.stops, !0)
      }
    };
  }), [Ee, ue, Ce]), _ = Te.length, Xe = c.useRef(null), te = c.useRef(null), mt = c.useRef(null), Le = c.useRef(null), [Ve, U] = c.useState(360), [V, Qe] = c.useState(h ?? 16), he = c.useRef(null), me = c.useRef(null), K = c.useRef(/* @__PURE__ */ new Map()), ye = c.useRef(/* @__PURE__ */ new Set()), Ae = c.useRef(/* @__PURE__ */ new Set()), ge = c.useRef([]), Oe = c.useRef(
    /* @__PURE__ */ new Map()
  ), Je = c.useRef(null), Ze = c.useRef(null), We = c.useRef(null), Ct = c.useRef(0), Ft = c.useRef(null), et = c.useRef(null), gt = c.useRef([]), tt = c.useRef(() => {
  }), R = c.useCallback(() => {
    if (typeof window > "u") return;
    Ct.current += 1;
    const i = Ct.current;
    window.requestAnimationFrame(() => {
      i === Ct.current && tt.current();
    });
  }, []), ot = c.useCallback(() => {
    const i = me.current;
    if (i)
      for (; ye.current.size < Eo && ge.current.length > 0; ) {
        const y = ge.current.shift();
        if (!y) break;
        if (Ae.current.delete(y), ye.current.has(y)) continue;
        const p = Oe.current.get(y);
        p && (ye.current.add(y), i.postMessage({
          type: "gradientTile",
          id: y,
          palette: p.palette,
          size: p.size,
          tileUrl: p.tileUrl
        }));
      }
  }, []);
  c.useEffect(() => {
    fe.registerSelectionGrid(e, { allowEmptySelection: C });
  }, [e, C, fe]), c.useEffect(() => {
    if (typeof window > "u") return;
    const i = Qo();
    me.current = i, i.onmessage = (T) => {
      const { id: O, bitmap: F, error: xe } = T.data ?? {};
      if (!O) return;
      ye.current.delete(O);
      const ne = K.current.get(O);
      ne?.bitmap && ne.bitmap !== F && ne.bitmap.close(), xe ? (K.current.set(O, { status: "error" }), F?.close()) : F && K.current.set(O, { status: "ready", bitmap: F }), ot(), R();
    };
    const y = K.current, p = ye.current, L = Oe.current;
    return () => {
      i.terminate(), me.current = null, y.forEach((T) => T.bitmap?.close()), y.clear(), p.clear(), Ae.current.clear(), ge.current = [], L.clear(), Je.current = null, Ze.current = null, We.current = null, Ft.current = null, et.current = null, gt.current = [];
    };
  }, [ot, R]), c.useEffect(() => {
    C !== void 0 && pt !== C && fe.setSelectionGridAllowEmpty(e, C);
  }, [C, e, fe, pt]), c.useEffect(() => {
    const i = Xe.current;
    if (!i) return;
    const y = () => {
      const L = i.getBoundingClientRect();
      if (!L.width) return;
      const T = Math.round(L.width);
      U((O) => Math.abs(O - T) < 0.5 ? O : T);
    };
    y();
    let p = null;
    return typeof ResizeObserver < "u" ? (p = new ResizeObserver(y), p.observe(i)) : window.addEventListener("resize", y), () => {
      p?.disconnect(), window.removeEventListener("resize", y);
    };
  }, []), c.useEffect(() => {
    const i = te.current;
    if (!i) return;
    const y = () => {
      const L = i.getBoundingClientRect();
      L.height && Qe((T) => Math.abs(T - L.height) < 0.5 ? T : L.height);
    };
    y();
    let p = null;
    return typeof ResizeObserver < "u" ? (p = new ResizeObserver(y), p.observe(i), () => {
      p?.disconnect();
    }) : (window.addEventListener("resize", y), () => {
      window.removeEventListener("resize", y);
    });
  }, [pe, Q, t, Ve, ht]);
  const oe = c.useMemo(() => {
    if (pe == null || Te[pe] === void 0) return null;
    const i = Te[pe];
    return Q ? i.inverted.paletteCss : i.normal.paletteCss;
  }, [Te, Q, pe]);
  c.useEffect(() => {
    if (!oe) return;
    const i = oe.join("|");
    i !== he.current && (he.current = i, fe.setSelectionGridPalette(e, oe));
  }, [e, oe, fe]);
  const Ie = h ?? 16, Fe = 1, wt = 0.35, Se = Ie * wt, Re = V || Ie * Fe, W = Math.max(
    Math.round(Re + Se * 2 + 2),
    // extra room for 1px borders
    Math.round(Ie + Se * 1.5)
  ), G = W * Lt, P = Ve ? Math.max(1, Math.floor(Ve / G)) : 1, ze = P ? Math.ceil(_ / P) : _, bt = P >= _ ? _ : _ % P || P, qe = P > bt ? P - bt : 0, rt = P ? Math.floor((_ - 1) / P) : 0, zt = qe > 0 ? Ot === "center" ? qe * G / 2 : Ot === "right" ? qe * G : 0 : 0, Dt = P * G, nt = typeof v == "number" && Number.isFinite(v) && v > 0 ? v : null, De = ze * Lt, st = nt != null ? nt * W : null, At = nt != null && De > nt, It = ze * G;
  c.useEffect(() => {
    R();
  }, [
    Te,
    pe,
    Q,
    Ve,
    G,
    Pe,
    zt,
    R
  ]), c.useEffect(() => {
    const i = mt.current;
    if (!i) return;
    const y = () => R();
    return i.addEventListener("scroll", y, { passive: !0 }), () => i.removeEventListener("scroll", y);
  }, [R]), tt.current = () => {
    const i = Le.current, y = mt.current;
    if (!i || !y) return;
    const p = i.getContext("2d");
    if (!p) return;
    const L = Math.max(1, Math.round(Dt)), T = Math.max(1, Math.round(y.clientHeight || It)), O = typeof window < "u" && window.devicePixelRatio || 1, F = Math.max(1, Math.round(L * O)), xe = Math.max(1, Math.round(T * O));
    if ((i.width !== F || i.height !== xe) && (i.width = F, i.height = xe, i.style.width = `${L}px`, i.style.height = `${T}px`), p.setTransform(O, 0, 0, O, 0, 0), p.clearRect(0, 0, L, T), _ === 0) return;
    const ne = y.scrollTop, ct = Math.max(0, Math.floor(ne / G) - 1), Ke = Math.min(ze - 1, Math.floor((ne + T) / G) + 1), Be = Math.max(1, Math.round(G * O)), r = Co(_, Be), n = Math.max(1, Math.ceil(_ / r)), l = new Array(_), d = /* @__PURE__ */ new Set();
    for (let u = 0; u < _; u += 1) {
      const g = Ee[u], E = Te[u], M = Q ? g.inverted.data : g.normal.data, B = Pe === "height" && Ce && E.tileUrl ? Vt(E.tileUrl) : void 0, q = `${g.name}|${Q ? "inv" : "norm"}|${Pe}|${Be}|${B ?? "plain"}`;
      l[u] = q, d.add(q), Oe.current.set(q, { palette: M, size: Be, tileUrl: B });
    }
    const f = `${Pe}|${Q ? "inv" : "norm"}|${Be}|${r}|${l.join("|")}`;
    if (Ft.current !== f) {
      Ft.current = f, et.current = null;
      const u = r * Be, g = n * Be, E = Ao(u, g);
      Je.current = E, Ze.current = E?.getContext("2d") ?? null, We.current = {
        key: f,
        columns: r,
        rows: n,
        tileSize: Be
      }, gt.current = new Array(_).fill(""), Ze.current && Ze.current.clearRect(0, 0, u, g), K.current.forEach((M, B) => {
        d.has(B) || (M.bitmap?.close(), K.current.delete(B));
      }), ye.current.forEach((M) => {
        d.has(M) || ye.current.delete(M);
      }), ge.current = ge.current.filter((M) => d.has(M)), Ae.current = new Set(ge.current), Oe.current.forEach((M, B) => {
        d.has(B) || Oe.current.delete(B);
      });
    }
    for (let u = ct; u <= Ke; u += 1) {
      const g = u === rt ? zt : 0, E = u === rt ? bt : P, M = u * P, B = u * G - ne;
      for (let q = 0; q < E; q += 1) {
        const z = M + q;
        if (z >= _) break;
        const D = Ee[z], se = pe === z, ee = z - P >= 0, $e = z + P < _, le = q > 0, ke = q < P - 1 && z + 1 < _ && Math.floor((z + 1) / P) === u, _e = {
          tl: ee || le ? 0 : Ye,
          tr: ee || ke ? 0 : Ye,
          br: $e || ke ? 0 : Ye,
          bl: $e || le ? 0 : Ye
        }, ce = g + q * G, m = l[z], A = Je.current, I = We.current, j = Ze.current;
        let Y = gt.current[z] === m;
        const X = K.current.get(m);
        if (X?.status === "ready" && X.bitmap && j && I && !Y) {
          const ie = z % I.columns * I.tileSize, it = Math.floor(z / I.columns) * I.tileSize;
          j.drawImage(X.bitmap, ie, it, I.tileSize, I.tileSize), gt.current[z] = m, Y = !0;
        }
        if (X || K.current.set(m, { status: "loading" }), (!X || X.status === "loading") && !ye.current.has(m) && !Ae.current.has(m) && (ge.current.push(m), Ae.current.add(m)), A && I && Y) {
          const ie = z % I.columns * I.tileSize, it = Math.floor(z / I.columns) * I.tileSize;
          p.save(), ft(p, ce, B, G, _e), p.clip(), p.drawImage(
            A,
            ie,
            it,
            I.tileSize,
            I.tileSize,
            ce,
            B,
            G,
            G
          ), p.restore();
        } else
          p.save(), ft(p, ce, B, G, _e), p.clip(), or(p, ce, B, G, D.stops, Q), p.restore();
        se && (p.save(), p.strokeStyle = b, p.lineWidth = 2, ft(p, ce + 1, B + 1, G - 2, _e), p.stroke(), p.restore());
      }
    }
    if (et.current !== f) {
      et.current = f;
      for (let u = 0; u < _; u += 1) {
        const g = l[u], E = K.current.get(g);
        E?.status === "ready" || E?.status === "error" || E?.status === "loading" || ye.current.has(g) || Ae.current.has(g) || (ge.current.push(g), Ae.current.add(g), K.current.set(g, { status: "loading" }));
      }
    }
    ot();
  };
  const Gt = {
    width: "100%",
    maxWidth: typeof H == "number" ? `${H}px` : H,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: a,
    alignItems: "stretch",
    ...be ?? {}
  }, Bt = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)"
  ].join(", "), ve = [
    "drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))",
    "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))"
  ].join(" "), Me = Math.max(Math.round(W - 4), Math.round(Ie + Se)), Ne = Math.max(8, Math.round((Me - 2) / (1 + wt * 2))), Ge = Math.max(Math.round(Me * 0.6), 12), He = {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    filter: ve
  }, yt = Jo.map((i) => ({
    value: i,
    icon: c.createElement(Zo[i], { size: Ge, strokeWidth: 2 }),
    ariaLabel: wo[i],
    title: wo[i]
  })), re = pe != null ? o[pe] : null, St = re ? Kt(re.stops, Q) : "transparent", lt = re ? re.name : "None", kt = re == null ? lt : Q ? `<-${lt}-<` : `>-${lt}->`, vt = (i) => {
    const y = Le.current, p = mt.current;
    if (!y || !p) return;
    const L = y.getBoundingClientRect(), T = i.clientX - L.left, O = i.clientY - L.top + p.scrollTop;
    if (T < 0 || O < 0) return;
    const F = Math.floor(O / G);
    if (F < 0 || F >= ze) return;
    const xe = F === rt ? zt : 0, ne = F === rt ? bt : P;
    if (T < xe || T > xe + ne * G) return;
    const ct = Math.floor((T - xe) / G);
    if (ct < 0 || ct >= ne) return;
    const Ke = F * P + ct;
    if (!(Ke < 0 || Ke >= _)) {
      if (pe === Ke) {
        pt && fe.setSelectionGridSelectedIndex(e, null);
        return;
      }
      fe.setSelectionGridSelectedIndex(e, Ke);
    }
  };
  return /* @__PURE__ */ N("div", { ref: Xe, className: k, style: Gt, children: /* @__PURE__ */ N("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ Tt(
    "div",
    {
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: `${Dt}px`,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ Tt(
          "div",
          {
            style: {
              width: "100%",
              borderRadius: 3,
              boxSizing: "border-box",
              background: St,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${Se}px 8px`,
              minHeight: `${W}px`,
              position: "relative"
            },
            "aria-label": "Selected gradient preview",
            role: "button",
            tabIndex: 0,
            "aria-pressed": Q,
            onClick: () => {
              fe.toggleSelectionGridInvert(e);
            },
            onKeyDown: (i) => {
              (i.key === "Enter" || i.key === " ") && (i.preventDefault(), fe.toggleSelectionGridInvert(e));
            },
            children: [
              /* @__PURE__ */ N(
                Do,
                {
                  behavior: "cycle",
                  options: yt,
                  value: ht,
                  fontSize: Ne,
                  colorA: w,
                  colorB: "transparent",
                  borderStyle: "none",
                  style: He,
                  onChange: (i) => {
                    fe.setSelectionGridPreviewMode(e, i);
                  },
                  onClick: (i) => {
                    i.stopPropagation();
                  },
                  onKeyDown: (i) => {
                    (i.key === "Enter" || i.key === " ") && i.stopPropagation();
                  }
                }
              ),
              /* @__PURE__ */ N(
                "div",
                {
                  ref: te,
                  style: {
                    textAlign: "center",
                    fontSize: Ie,
                    lineHeight: Fe,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: w,
                    textShadow: Bt,
                    userSelect: "none",
                    pointerEvents: "none"
                  },
                  children: kt
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ Tt(
          "div",
          {
            ref: mt,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: At && st != null ? `${st}px` : `${It}px`,
              maxHeight: st != null ? `${st}px` : void 0,
              overflowY: At ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            children: [
              /* @__PURE__ */ N(
                "div",
                {
                  style: {
                    position: "sticky",
                    top: 0,
                    left: 0,
                    height: 0,
                    overflow: "visible",
                    zIndex: 1
                  },
                  children: /* @__PURE__ */ N(
                    "canvas",
                    {
                      ref: Le,
                      className: "selection-grid__canvas",
                      style: {
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        touchAction: "manipulation"
                      },
                      onPointerDown: vt
                    }
                  )
                }
              ),
              /* @__PURE__ */ N("div", { style: { width: "100%", height: `${It}px` } })
            ]
          }
        )
      ]
    }
  ) }) });
}
function br(e) {
  return c.useContext(Jt) ? /* @__PURE__ */ N(bo, { ...e }) : /* @__PURE__ */ N(jo, { children: /* @__PURE__ */ N(bo, { ...e }) });
}
export {
  Xt as D,
  br as G,
  So as M,
  dr as S,
  jo as a,
  Yt as b,
  Kt as c,
  Vo as d,
  mr as e,
  Xo as f,
  wr as g,
  gr as h,
  ur as i,
  pr as j,
  fr as k,
  hr as l,
  Ue as u
};
//# sourceMappingURL=SelectionGridGradient-BgugjwNm.js.map
