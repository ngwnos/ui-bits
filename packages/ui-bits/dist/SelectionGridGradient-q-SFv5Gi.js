import { jsxs as kt, jsx as N } from "react/jsx-runtime";
import c, { createContext as ko, useContext as To, useReducer as Po, useMemo as Zt, useEffect as Lo } from "react";
import { F as Oo } from "./Folder-B-XHBECm.js";
import { Mountain as Fo, Columns4 as $o } from "lucide-react";
import { I as No } from "./IconButton-BvvMagK1.js";
import { c as jt, v as Ot } from "./lfo-DJ5JkDXn.js";
import { f as v } from "./flexoki-DpJ9ZEpp.js";
function Do(e) {
  const t = e.trim().replace("#", "");
  if (t.length !== 6)
    return [0, 0, 0];
  const o = Number.parseInt(t, 16);
  if (Number.isNaN(o)) return [0, 0, 0];
  const n = o >> 16 & 255, i = o >> 8 & 255, w = o & 255;
  return [n, i, w];
}
function Co(e, t) {
  const o = e.map((n) => ({
    ...n,
    rgb: Do(n.color)
  }));
  return t ? o.slice().reverse().map((n) => ({
    ...n,
    stop: 100 - n.stop
  })) : o;
}
function Xt(e, t = !1) {
  return `linear-gradient(90deg, ${Co(e, t).map((i) => `${i.color} ${i.stop}%`).join(", ")})`;
}
function Qt(e, t = !1) {
  const o = Co(e, t), n = new Uint8ClampedArray(256 * 4), i = new Array(256);
  for (let w = 0; w < o.length - 1; w += 1) {
    const h = o[w], E = o[w + 1], S = Math.round(h.stop / 100 * 255), m = Math.round(E.stop / 100 * 255), H = Math.max(1, m - S);
    for (let k = S; k <= m; k += 1) {
      const ce = (k - S) / H, x = Math.round(h.rgb[0] + (E.rgb[0] - h.rgb[0]) * ce), z = Math.round(h.rgb[1] + (E.rgb[1] - h.rgb[1]) * ce), re = Math.round(h.rgb[2] + (E.rgb[2] - h.rgb[2]) * ce), ie = k * 4;
      n[ie] = x, n[ie + 1] = z, n[ie + 2] = re, n[ie + 3] = 255, i[k] = `rgb(${x}, ${z}, ${re})`;
    }
  }
  for (let w = 0; w < 256; w += 1) {
    const h = w * 4;
    if (i[w]) continue;
    if (!i.find((S) => S !== void 0))
      i[w] = "rgb(0, 0, 0)", n[h] = 0, n[h + 1] = 0, n[h + 2] = 0, n[h + 3] = 255;
    else {
      let S = w - 1;
      for (; S >= 0 && !i[S]; ) S -= 1;
      let m = w + 1;
      for (; m < 256 && !i[m]; ) m += 1;
      const H = S >= 0 ? S : m, k = H * 4;
      i[w] = i[H], n[h] = n[k], n[h + 1] = n[k + 1], n[h + 2] = n[k + 2], n[h + 3] = 255;
    }
  }
  return { data: n, css: i };
}
const eo = [
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
], Jt = "selection-grid", Eo = '(function(){"use strict";const h=self;h.onmessage=n=>{const t=n.data;if(t){if(t.type==="imageTile"){w(t).catch(a=>{u(t.id,a)});return}t.type==="gradientTile"&&p(t).catch(a=>{u(t.id,a)})}};function u(n,t){const a=t instanceof Error?t.message:"Unknown worker error",e={id:n,error:a};h.postMessage(e)}async function w({id:n,src:t,size:a}){const e=await fetch(t,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch image (${e.status})`);const c=await e.blob(),r=await l(c,a),i={id:n,bitmap:r};h.postMessage(i,[r])}async function l(n,t){const a=await createImageBitmap(n);if(typeof OffscreenCanvas>"u"){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const e=new OffscreenCanvas(t,t),c=e.getContext("2d");if(!c){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const r=Math.max(t/a.width,t/a.height),i=Math.round(a.width*r),f=Math.round(a.height*r),d=Math.round((t-i)/2),o=Math.round((t-f)/2);return c.clearRect(0,0,t,t),c.drawImage(a,d,o,i,f),a.close(),e.transferToImageBitmap()}async function p({id:n,palette:t,size:a,tileUrl:e}){const c=e?await y(e,t,a):await g(t,a),r={id:n,bitmap:c};h.postMessage(r,[c])}async function g(n,t){const a=new ImageData(t,t),e=a.data;for(let c=0;c<t;c+=1)for(let r=0;r<t;r+=1){const i=t<=1?0:r/(t-1),d=Math.min(255,Math.max(0,Math.round(i*255)))*4,o=(c*t+r)*4;e[o]=n[d],e[o+1]=n[d+1],e[o+2]=n[d+2],e[o+3]=255}return await createImageBitmap(a)}async function y(n,t,a){const e=await fetch(n,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch terrain tile (${e.status})`);if(typeof OffscreenCanvas>"u")return await g(t,a);const c=await e.blob(),r=await createImageBitmap(c),i=new OffscreenCanvas(a,a),f=i.getContext("2d");if(!f)return await g(t,a);f.drawImage(r,0,0,a,a),r.close();const d=f.getImageData(0,0,a,a),o=d.data;for(let s=0;s<o.length;s+=4){const I=o[s],M=o[s+1],x=o[s+2],m=Math.round(.2126*I+.7152*M+.0722*x)*4;o[s]=t[m],o[s+1]=t[m+1],o[s+2]=t[m+2],o[s+3]=255}return f.putImageData(d,0,0),i.transferToImageBitmap()}})();\n//# sourceMappingURL=selectionGrid.worker-By4geu6o.js.map\n', ho = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Eo], { type: "text/javascript;charset=utf-8" });
function Ao(e) {
  let t;
  try {
    if (t = ho && (self.URL || self.webkitURL).createObjectURL(ho), !t) throw "";
    const o = new Worker(t, {
      name: e?.name
    });
    return o.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), o;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Eo),
      {
        name: e?.name
      }
    );
  }
}
const Ft = 3, _o = "var(--ui-bits-color-a, #2f2f2f)", zo = "var(--ui-bits-color-b, #f0f0f0)", mo = 4096, Uo = 6;
function $t(e, t, o, n, i) {
  const w = n / 2, h = Math.min(w, Math.max(0, i.tl)), E = Math.min(w, Math.max(0, i.tr)), S = Math.min(w, Math.max(0, i.br)), m = Math.min(w, Math.max(0, i.bl));
  e.beginPath(), e.moveTo(t + h, o), e.lineTo(t + n - E, o), E > 0 ? e.quadraticCurveTo(t + n, o, t + n, o + E) : e.lineTo(t + n, o), e.lineTo(t + n, o + n - S), S > 0 ? e.quadraticCurveTo(t + n, o + n, t + n - S, o + n) : e.lineTo(t + n, o + n), e.lineTo(t + m, o + n), m > 0 ? e.quadraticCurveTo(t, o + n, t, o + n - m) : e.lineTo(t, o + n), e.lineTo(t, o + h), h > 0 ? e.quadraticCurveTo(t, o, t + h, o) : e.lineTo(t, o), e.closePath();
}
function go(e) {
  if (typeof window > "u") return e;
  try {
    return new URL(e, window.location.href).href;
  } catch {
    return e;
  }
}
function qo(e, t) {
  const o = Math.max(1, Math.floor(t)), n = Math.max(1, Math.floor(mo / o)), i = Math.max(1, Math.floor(mo / o));
  return e <= 0 ? 1 : Math.min(n, Math.max(1, Math.ceil(e / i)));
}
function Wo(e, t) {
  if (typeof document > "u") return null;
  const o = document.createElement("canvas");
  return o.width = e, o.height = t, o;
}
function Ho() {
  return new Ao();
}
function yr(e) {
  const {
    items: t,
    folders: o,
    selectionSlots: n,
    getKey: i,
    getPreview: w,
    getLabel: h,
    selectedKey: E,
    defaultSelectedKey: S = null,
    onSelect: m,
    allowEmptySelection: H = !1,
    squareScale: k = 1,
    squareAlignment: ce = "left",
    colorA: x = _o,
    colorB: z = zo,
    layoutGap: re = "6px",
    maxHeightUnits: ie = 24,
    fontSize: J,
    maxWidth: st = 360,
    className: Tt,
    style: fe
  } = e, [ae, lt] = c.useState(S), [ke, Ue] = c.useState({}), [Ce, Ee] = c.useState({}), [D, bt] = c.useState({}), St = c.useRef(null), Te = E !== void 0, Z = Te ? E ?? null : ae, ct = Number.isFinite(k) && k > 0 ? k : 1, Je = ce ?? "left", Pt = c.useMemo(() => t ?? [], [t]), _ = c.useMemo(() => o ?? [], [o]), U = _.length > 0, Pe = c.useMemo(() => n ?? [], [n]), F = Pe.length > 0, q = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return U && _.forEach((s) => {
      const l = Ce[s.id] ?? [];
      l.length === 0 ? r.set(s.id, s.items) : r.set(s.id, [...s.items, ...l]);
    }), r;
  }, [Ce, _, U]), Y = c.useMemo(() => {
    if (U) {
      const r = [];
      let s = 0;
      return _.forEach((l) => {
        (q.get(l.id) ?? l.items).forEach((d) => {
          const g = i(d, s);
          r.push({ item: d, index: s, key: g }), s += 1;
        });
      }), r;
    }
    return Pt.map((r, s) => ({
      item: r,
      index: s,
      key: i(r, s)
    }));
  }, [i, q, _, Pt, U]), be = c.useMemo(
    () => Y.map((r) => r.key),
    [Y]
  );
  c.useEffect(() => {
    Te || F || Z != null && (be.includes(Z) || lt(null));
  }, [be, Te, Z, F]), c.useEffect(() => {
    U && Ue((r) => {
      let s = !1;
      const l = { ...r };
      return _.forEach((a) => {
        a.collapsed === void 0 && l[a.id] === void 0 && a.defaultCollapsed !== void 0 && (l[a.id] = a.defaultCollapsed, s = !0);
      }), s ? l : r;
    });
  }, [_, U]), c.useEffect(() => {
    F && bt((r) => {
      let s = !1;
      const l = { ...r };
      return Pe.forEach((a) => {
        a.selectedKey === void 0 && l[a.id] === void 0 && a.defaultSelectedKey !== void 0 && (l[a.id] = a.defaultSelectedKey, s = !0);
      }), s ? l : r;
    });
  }, [Pe, F]);
  const qe = c.useRef(null), We = c.useRef(null), Le = c.useRef(null), [Ze, yt] = c.useState(360);
  c.useEffect(() => {
    const r = qe.current;
    if (!r) return;
    const s = () => {
      const a = r.getBoundingClientRect();
      if (!a.width) return;
      const d = Math.round(a.width);
      yt((g) => Math.abs(g - d) < 0.5 ? g : d);
    };
    s();
    let l = null;
    return typeof ResizeObserver < "u" ? (l = new ResizeObserver(s), l.observe(r)) : window.addEventListener("resize", s), () => {
      l?.disconnect(), window.removeEventListener("resize", s);
    };
  }, [Ee]);
  const He = J ?? 16, it = 1, Mt = He * 0.35, Ke = He * it, je = Math.max(
    Math.round(Ke + Mt * 2 + 2),
    Math.round(He + Mt * 1.5)
  ), A = je * ct, Oe = je, pe = Ze ? Math.max(1, Math.floor(Ze / A)) : 1, et = pe * A, Se = c.useMemo(() => {
    if (!U)
      return Y.map((l) => ({ type: "item", ...l }));
    const r = [];
    let s = 0;
    return _.forEach((l) => {
      if (l.collapsed ?? ke[l.id] ?? !1) {
        const g = q.get(l.id) ?? l.items;
        s += g.length;
        return;
      }
      (q.get(l.id) ?? l.items).forEach((g) => {
        const y = i(g, s);
        r.push({ type: "item", item: g, index: s, key: y }), s += 1;
      }), l.addTile && r.push({ type: "add", folderId: l.id, key: `add:${l.id}` });
    }), r;
  }, [Y, i, ke, q, _, U]), xt = c.useMemo(() => {
    if (!U)
      return Y.map((l) => ({ type: "item", ...l }));
    const r = [];
    let s = 0;
    return _.forEach((l) => {
      (q.get(l.id) ?? l.items).forEach((d) => {
        const g = i(d, s);
        r.push({ type: "item", item: d, index: s, key: g }), s += 1;
      }), l.addTile && r.push({ type: "add", folderId: l.id, key: `add:${l.id}` });
    }), r;
  }, [Y, i, q, _, U]), he = Se.length, I = xt.length, R = c.useMemo(() => {
    const r = [];
    let s = 0;
    if (!U) {
      for (let a = 0; a < he; a += pe) {
        const d = Math.min(pe, he - a), g = pe - d, y = g > 0 ? Je === "center" ? g * A / 2 : Je === "right" ? g * A : 0 : 0;
        r.push({
          type: "items",
          startIndex: a,
          count: d,
          alignmentOffsetPx: y,
          height: A,
          top: s
        }), s += A;
      }
      return r;
    }
    let l = 0;
    return _.forEach((a, d) => {
      if (r.push({
        type: "header",
        folderIndex: d,
        alignmentOffsetPx: 0,
        height: Oe,
        top: s
      }), s += Oe, a.collapsed ?? ke[a.id] ?? !1) return;
      const M = (q.get(a.id) ?? a.items).length + (a.addTile ? 1 : 0);
      for (let C = 0; C < M; C += pe) {
        const B = Math.min(pe, M - C), xe = pe - B, Ve = xe > 0 ? Je === "center" ? xe * A / 2 : Je === "right" ? xe * A : 0 : 0;
        r.push({
          type: "items",
          startIndex: l + C,
          count: B,
          alignmentOffsetPx: Ve,
          height: A,
          top: s
        }), s += A;
      }
      l += M;
    }), r;
  }, [
    A,
    he,
    Oe,
    ke,
    q,
    _,
    Je,
    pe,
    U
  ]), ye = R.length, Fe = ye > 0 ? R[ye - 1].top + R[ye - 1].height : 0, Xe = typeof ie == "number" && Number.isFinite(ie) && ie > 0 ? ie : null, at = R.reduce((r, s) => r + s.height / je, 0), Ye = Xe != null ? Xe * je : null, Rt = Xe != null && at > Xe, Ut = {
    width: "100%",
    maxWidth: typeof st == "number" ? `${st}px` : st,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: re,
    alignItems: "stretch",
    ...fe ?? {}
  }, tt = (r, s, l) => {
    Te || lt(r), m?.(r, s, l);
  }, Ae = c.useMemo(
    () => Pe.map((r) => ({
      ...r,
      selectedKey: r.selectedKey ?? D[r.id] ?? null
    })),
    [D, Pe]
  ), ut = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return Ae.forEach((s) => {
      const l = s.selectedKey;
      l != null && (r.has(l) || r.set(l, { slotId: s.id, color: s.color }));
    }), r;
  }, [Ae]), qt = c.useCallback(
    (r, s, l, a) => {
      const d = Ae.find((g) => g.id === r);
      d && (d.selectedKey === void 0 && bt((g) => {
        const y = { ...g, [r]: s };
        return s != null && Ae.forEach((M) => {
          M.id !== r && M.selectedKey === void 0 && y[M.id] === s && (y[M.id] = null);
        }), y;
      }), s != null && (St.current = r), d.onSelect?.(s, l, a));
    },
    [Ae]
  ), Wt = c.useCallback((r) => {
    if (r.length === 0) return null;
    const s = St.current;
    if (!s) return r[0] ?? null;
    const l = r.findIndex((d) => d.id === s);
    if (l === -1) return r[0] ?? null;
    const a = (l + 1) % r.length;
    return r[a] ?? null;
  }, []), Et = c.useRef(null), At = c.useRef(/* @__PURE__ */ new Map()), dt = c.useRef(/* @__PURE__ */ new Map()), me = c.useRef(/* @__PURE__ */ new Map()), ve = c.useRef(/* @__PURE__ */ new Set()), $e = c.useRef(/* @__PURE__ */ new Set()), Ie = c.useRef([]), ge = c.useRef(/* @__PURE__ */ new Map()), ft = c.useRef(null), we = c.useRef(null), pt = c.useRef(null), It = c.useRef(0), u = c.useRef(null), b = c.useRef(null), f = c.useRef([]), T = c.useRef(() => {
  }), P = c.useCallback((r, s) => {
    s ? At.current.set(r, s) : At.current.delete(r);
  }, []), $ = c.useCallback((r) => {
    const s = At.current.get(r);
    s && s.click();
  }, []), K = c.useCallback((r, s) => {
    const l = r.addTile;
    if (!l || (l.onAdd?.(s), !l.createItem)) return;
    const a = Array.from(s), d = a.map((C) => URL.createObjectURL(C)), g = a.map((C, B) => l.createItem?.(C, d[B])).filter(Boolean), y = l.autoAppend !== !1, M = l.revokeObjectUrls ?? y;
    if (g.length > 0 && (l.onAddItems?.(g, a), y && Ee((C) => ({
      ...C,
      [r.id]: [...C[r.id] ?? [], ...g]
    }))), M) {
      const C = dt.current.get(r.id) ?? /* @__PURE__ */ new Set();
      d.forEach((B) => C.add(B)), dt.current.set(r.id, C);
    }
  }, [Ee]);
  c.useEffect(() => {
    const r = dt.current;
    return () => {
      r.forEach((s) => {
        s.forEach((l) => URL.revokeObjectURL(l));
      }), r.clear();
    };
  }, []);
  const Me = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return _.forEach((s) => {
      r.set(s.id, {
        colorA: s.colorA ?? x,
        colorB: s.colorB ?? z
      });
    }), r;
  }, [x, z, _]), j = c.useCallback(() => {
    if (typeof window > "u") return;
    It.current += 1;
    const r = It.current;
    window.requestAnimationFrame(() => {
      r === It.current && T.current();
    });
  }, []), Ne = c.useCallback(() => {
    const r = Et.current;
    if (r)
      for (; ve.current.size < Uo && Ie.current.length > 0; ) {
        const s = Ie.current.shift();
        if (!s) break;
        if ($e.current.delete(s), ve.current.has(s)) continue;
        const l = ge.current.get(s);
        l && (ve.current.add(s), r.postMessage({
          type: "imageTile",
          id: s,
          src: l.src,
          size: l.size
        }));
      }
  }, []);
  c.useEffect(() => {
    if (typeof window > "u") return;
    const r = Ho();
    Et.current = r, r.onmessage = (d) => {
      const { id: g, bitmap: y, error: M } = d.data ?? {};
      if (!g) return;
      ve.current.delete(g);
      const C = me.current.get(g);
      C?.bitmap && C.bitmap !== y && C.bitmap.close(), M ? (me.current.set(g, { status: "error" }), y?.close()) : y && me.current.set(g, { status: "ready", bitmap: y }), Ne(), j();
    };
    const s = me.current, l = ve.current, a = ge.current;
    return () => {
      r.terminate(), Et.current = null, s.forEach((d) => d.bitmap?.close()), s.clear(), l.clear(), $e.current.clear(), Ie.current = [], a.clear(), ft.current = null, we.current = null, pt.current = null, u.current = null, b.current = null, f.current = [];
    };
  }, [Ne, j]), c.useEffect(() => {
    j();
  }, [
    xt,
    Se,
    Z,
    Ze,
    A,
    x,
    z,
    pe,
    ye,
    he,
    j
  ]), c.useEffect(() => {
    const r = We.current;
    if (!r) return;
    const s = () => j();
    return r.addEventListener("scroll", s, { passive: !0 }), () => r.removeEventListener("scroll", s);
  }, [j]);
  const Ge = (r) => {
    if (R.length === 0) return -1;
    let s = 0, l = R.length - 1;
    for (; s <= l; ) {
      const a = Math.floor((s + l) / 2), d = R[a];
      if (r < d.top)
        l = a - 1;
      else if (r >= d.top + d.height)
        s = a + 1;
      else
        return a;
    }
    return Math.max(0, Math.min(R.length - 1, s));
  };
  T.current = () => {
    const r = Le.current, s = We.current;
    if (!r || !s) return;
    const l = r.getContext("2d");
    if (!l) return;
    const a = Math.max(1, Math.round(s.clientWidth || et)), d = Math.max(1, Math.round(s.clientHeight || Fe)), g = Math.max(0, (a - et) / 2), y = typeof window < "u" && window.devicePixelRatio || 1, M = Math.max(1, Math.round(a * y)), C = Math.max(1, Math.round(d * y));
    if ((r.width !== M || r.height !== C) && (r.width = M, r.height = C, r.style.width = `${a}px`, r.style.height = `${d}px`), l.setTransform(y, 0, 0, y, 0, 0), l.clearRect(0, 0, a, d), he === 0 && I === 0) return;
    const B = s.scrollTop, xe = Math.max(0, Ge(B) - 1), Ve = Math.min(ye - 1, Ge(B + d) + 1), O = Math.max(1, Math.round(A * y)), ee = new Array(I), te = new Array(I), _e = /* @__PURE__ */ new Map(), oe = /* @__PURE__ */ new Set();
    for (let p = 0; p < I; p += 1) {
      const G = xt[p];
      if (_e.set(G.key, p), G.type === "add") {
        const L = Me.get(G.folderId);
        ee[p] = { type: "color", color: L?.colorA ?? x }, te[p] = `add:${G.folderId}|${O}`;
        continue;
      }
      const X = w(G.item, G.index);
      if (ee[p] = X, X.type === "color")
        te[p] = `color:${X.color}`;
      else {
        const L = go(X.src), W = `image:${L}|${O}`;
        te[p] = W, oe.add(W), ge.current.set(W, { src: L, size: O });
      }
    }
    const ue = qo(Math.max(1, I), O), ne = Math.max(1, Math.ceil(Math.max(1, I) / ue)), Re = `${O}|${ue}|${te.join("|")}`;
    if (u.current !== Re) {
      if (u.current = Re, b.current = null, I === 0)
        ft.current = null, we.current = null, pt.current = null, f.current = [];
      else {
        const p = ue * O, G = ne * O, X = Wo(p, G);
        if (ft.current = X, we.current = X?.getContext("2d") ?? null, pt.current = {
          key: Re,
          columns: ue,
          rows: ne,
          tileSize: O
        }, f.current = new Array(I).fill(""), we.current) {
          we.current.clearRect(0, 0, p, G);
          for (let L = 0; L < I; L += 1) {
            const W = ee[L];
            if (W.type !== "color") continue;
            const V = L % ue * O, Be = Math.floor(L / ue) * O;
            we.current.fillStyle = W.color, we.current.fillRect(V, Be, O, O), f.current[L] = te[L];
          }
        }
      }
      me.current.forEach((p, G) => {
        oe.has(G) || (p.bitmap?.close(), me.current.delete(G));
      }), ve.current.forEach((p) => {
        oe.has(p) || ve.current.delete(p);
      }), Ie.current = Ie.current.filter((p) => oe.has(p)), $e.current = new Set(Ie.current), ge.current.forEach((p, G) => {
        oe.has(G) || ge.current.delete(G);
      });
    }
    for (let p = xe; p <= Ve; p += 1) {
      const G = R[p];
      if (!G || G.type !== "items") continue;
      const X = g + G.alignmentOffsetPx, L = G.count, W = G.startIndex, V = G.top - B;
      for (let Be = 0; Be < L; Be += 1) {
        const Ht = W + Be;
        if (Ht >= he) break;
        const ot = Se[Ht], oo = ot?.key ?? String(Ht), rt = ot.type === "add", ro = !rt && F ? ut.get(oo) : null, Bo = !rt && (F ? !!ro : Z != null && oo === Z), no = p > 0 ? R[p - 1] : null, so = p + 1 < R.length ? R[p + 1] : null, lo = no?.type === "items" && Be < no.count, co = so?.type === "items" && Be < so.count, io = Be > 0, ao = Be < L - 1, Lt = {
          tl: lo || io ? 0 : Ft,
          tr: lo || ao ? 0 : Ft,
          br: co || ao ? 0 : Ft,
          bl: co || io ? 0 : Ft
        }, mt = X + Be * A, uo = rt ? Me.get(ot.folderId) : null, de = _e.get(ot.key), nt = de != null ? ee[de] : rt ? { type: "color", color: uo?.colorA ?? x } : w(ot.item, ot.index);
        let se = de != null ? te[de] : "";
        if (!se) {
          if (nt.type === "color")
            se = `color:${nt.color}`;
          else if (rt)
            se = `add:${ot.folderId}|${O}`;
          else if (nt.type === "image") {
            const Q = go(nt.src);
            se = `image:${Q}|${O}`, oe.add(se), ge.current.set(se, { src: Q, size: O });
          }
        }
        const fo = ft.current, le = pt.current, po = we.current;
        let Kt = de != null && f.current[de] === se;
        if (!rt && nt.type === "image") {
          const Q = me.current.get(se);
          if (Q?.status === "ready" && Q.bitmap && po && le && !Kt && de != null) {
            const Qe = de % le.columns * le.tileSize, gt = Math.floor(de / le.columns) * le.tileSize;
            po.drawImage(Q.bitmap, Qe, gt, le.tileSize, le.tileSize), f.current[de] = se, Kt = !0;
          }
          Q || me.current.set(se, { status: "loading" }), (!Q || Q.status === "loading") && !ve.current.has(se) && !$e.current.has(se) && (Ie.current.push(se), $e.current.add(se));
        }
        if (fo && le && Kt && de != null) {
          const Q = de % le.columns * le.tileSize, Qe = Math.floor(de / le.columns) * le.tileSize;
          l.save(), $t(l, mt, V, A, Lt), l.clip(), l.drawImage(
            fo,
            Q,
            Qe,
            le.tileSize,
            le.tileSize,
            mt,
            V,
            A,
            A
          ), l.restore();
        } else nt.type === "color" ? ($t(l, mt, V, A, Lt), l.fillStyle = nt.color, l.fill()) : ($t(l, mt, V, A, Lt), l.fillStyle = x, l.fill());
        if (Bo && (l.save(), l.strokeStyle = F ? ro?.color ?? z : z, l.lineWidth = 2, $t(l, mt + 1, V + 1, A - 2, Lt), l.stroke(), l.restore()), rt) {
          const Q = mt + A / 2, Qe = V + A / 2, gt = A * 0.22;
          l.save(), l.strokeStyle = uo?.colorB ?? z, l.lineWidth = Math.max(1.5, A * 0.08), l.lineCap = "round", l.beginPath(), l.moveTo(Q - gt, Qe), l.lineTo(Q + gt, Qe), l.moveTo(Q, Qe - gt), l.lineTo(Q, Qe + gt), l.stroke(), l.restore();
        }
      }
    }
    if (b.current !== Re) {
      b.current = Re;
      for (let p = 0; p < he; p += 1) {
        const G = Se[p], X = G ? _e.get(G.key) : null;
        if (X == null || ee[X].type !== "image") continue;
        const W = te[X], V = me.current.get(W);
        V?.status === "ready" || V?.status === "error" || V?.status === "loading" || ve.current.has(W) || $e.current.has(W) || (Ie.current.push(W), $e.current.add(W), me.current.set(W, { status: "loading" }));
      }
    }
    Ne();
  };
  const De = (r) => {
    const s = Le.current, l = We.current;
    if (!s || !l) return;
    const a = s.getBoundingClientRect(), d = r.clientX - a.left, g = r.clientY - a.top + l.scrollTop;
    if (d < 0 || g < 0) return;
    const y = Ge(g);
    if (y < 0 || y >= ye) return;
    const M = R[y];
    if (!M || M.type !== "items") return;
    const C = l.clientWidth || et, xe = Math.max(0, (C - et) / 2) + M.alignmentOffsetPx, Ve = M.count;
    if (d < xe || d > xe + Ve * A) return;
    const O = Math.floor((d - xe) / A);
    if (O < 0 || O >= Ve) return;
    const ee = M.startIndex + O;
    if (ee < 0 || ee >= Se.length) return;
    const te = Se[ee];
    if (te.type === "add") {
      $(te.folderId);
      return;
    }
    const _e = te.item, oe = te.key ?? String(ee);
    if (F) {
      const ne = ut.get(oe);
      if (ne) {
        H && qt(ne.slotId, null, null, null);
        return;
      }
      const Re = Ae.find((p) => p.selectedKey == null) ?? Wt(Ae);
      if (!Re) return;
      qt(Re.id, oe, _e, ee);
      return;
    }
    if (Z != null && oe === Z) {
      H && tt(null, null, null);
      return;
    }
    tt(oe, _e, ee);
  }, ht = c.useMemo(() => {
    if (F || !h || Z == null) return;
    const r = Y.find((s) => s.key === Z);
    if (r)
      return h(r.item, r.index);
  }, [Y, h, Z, F]), Gt = c.useMemo(() => U ? R.flatMap((r, s) => r.type === "header" ? [{ rowIndex: s, folderIndex: r.folderIndex, top: r.top, height: r.height }] : []) : [], [R, U]);
  return /* @__PURE__ */ kt("div", { ref: qe, className: Tt, style: Ut, children: [
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
        children: /* @__PURE__ */ kt(
          "div",
          {
            ref: We,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Rt && Ye != null ? `${Ye}px` : `${Fe}px`,
              maxHeight: Ye != null ? `${Ye}px` : void 0,
              overflowY: Rt ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            title: ht,
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
                      onPointerDown: De
                    }
                  )
                }
              ),
              U && Gt.length > 0 && /* @__PURE__ */ N(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${Fe}px`,
                    pointerEvents: "none",
                    zIndex: 2
                  },
                  children: Gt.map((r) => {
                    const s = _[r.folderIndex];
                    if (!s) return null;
                    const l = s.collapsed ?? ke[s.id] ?? !1;
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
                            label: s.label,
                            collapsed: l,
                            onCollapseChange: (a) => {
                              s.collapsed === void 0 && Ue((d) => ({ ...d, [s.id]: a })), s.onCollapseChange?.(a);
                            },
                            colorA: s.colorA ?? x,
                            colorB: s.colorB ?? z,
                            borderStyle: s.borderStyle ?? "none",
                            fontSize: He,
                            headerHeight: r.height,
                            padding: 0,
                            verticalGap: 0,
                            keepMounted: !1,
                            showBody: !1,
                            style: { height: `${r.height}px` }
                          }
                        )
                      },
                      `${s.id}-${r.rowIndex}`
                    );
                  })
                }
              ),
              /* @__PURE__ */ N("div", { style: { width: "100%", height: `${Fe}px` } })
            ]
          }
        )
      }
    ) }),
    U && _.length > 0 && /* @__PURE__ */ N("div", { style: { display: "none" }, children: _.map((r) => r.addTile ? /* @__PURE__ */ N(
      "input",
      {
        ref: (s) => P(r.id, s),
        type: "file",
        accept: r.addTile.accept,
        multiple: r.addTile.multiple,
        "aria-label": typeof r.addTile.label == "string" ? r.addTile.label : "Add items",
        onChange: (s) => {
          const l = s.currentTarget.files;
          l && l.length > 0 && K(r, l), s.currentTarget.value = "";
        }
      },
      `add-input-${r.id}`
    ) : null) })
  ] });
}
const to = ko(void 0);
function ze() {
  const e = To(to);
  if (!e) throw new Error("useSliderStore must be used within a SliderStoreProvider");
  return e;
}
const zt = 1024, Ko = zt, Io = 1, jo = -1, Xo = 1, Go = Qt(eo[0].stops, !1).css, wt = {
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
function Yt(e, t) {
  return e.selectedIndex === t.selectedIndex && e.squareScale === t.squareScale && e.squareAlignment === t.squareAlignment && e.invertGradients === t.invertGradients && e.allowEmptySelection === t.allowEmptySelection && e.colorPalette.length === t.colorPalette.length && e.colorPalette.every((o, n) => o === t.colorPalette[n]) && e.previewMode === t.previewMode && e.sunAltitudeDeg === t.sunAltitudeDeg && e.sunAzimuthDeg === t.sunAzimuthDeg;
}
function Bt(e) {
  const t = (m) => Number.isFinite(m) ? Math.min(4, Math.max(1, Math.round(m))) : 1, o = (m) => Number.isFinite(m ?? Number.NaN) ? Math.min(90, Math.max(0, Number(m))) : wt.sunAltitudeDeg, n = (m) => Number.isFinite(m ?? Number.NaN) ? (Number(m) % 360 + 360) % 360 : wt.sunAzimuthDeg, i = (m) => m === "center" || m === "right" ? m : "left", w = (m) => m === "gradient" || m === "terrainHeight" ? m : m === "terrainHillshade" ? "terrainHeight" : typeof m == "boolean" ? m ? "terrainHeight" : "gradient" : "terrainHeight", h = e.previewMode, E = e.useTerrainTiles, S = {
    selectedIndex: e.selectedIndex,
    squareScale: t(e.squareScale),
    squareAlignment: i(e.squareAlignment),
    invertGradients: !!e.invertGradients,
    allowEmptySelection: !!e.allowEmptySelection,
    colorPalette: Array.isArray(e.colorPalette) && e.colorPalette.length === 256 ? [...e.colorPalette] : [...Go],
    previewMode: w(h ?? E),
    sunAltitudeDeg: o(e.sunAltitudeDeg),
    sunAzimuthDeg: n(e.sunAzimuthDeg)
  };
  return !S.allowEmptySelection && S.selectedIndex == null && (S.selectedIndex = 0), S;
}
function wo({ min: e, max: t, step: o }) {
  const n = Number.isFinite(e) ? e : 0, i = Number.isFinite(t) ? t : n, w = Math.max(0, i - n), h = o > 0 && Number.isFinite(o) ? o : w || 1;
  if (w === 0 || !Number.isFinite(w)) return n;
  const E = Math.max(1, Math.floor(w / h)), S = Math.floor(Math.random() * (E + 1)), m = n + S * h, H = (() => {
    const k = h.toString();
    if (k.includes("e-")) {
      const [, x] = k.split("e-");
      return Number(x ?? "0");
    }
    const [, ce] = k.split(".");
    return ce?.length ?? 0;
  })();
  return Number(m.toFixed(H));
}
const bo = [0.2, 0.4, 0.6, 0.8];
function So() {
  const e = Math.floor(Math.random() * bo.length);
  return bo[e];
}
function yo() {
  return Math.random();
}
const Nt = ["sine", "triangle", "saw", "square", "audio"], vo = [
  {
    hue: "base",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Base 500/50", colorA: v.base[500], colorB: v.base[50] },
      { key: "600-100", label: "Base 600/100" },
      { key: "700-200", label: "Base 700/200", colorA: v.base[700], colorB: v.base[200] }
    ]
  },
  {
    hue: "red",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Red 500/50", colorA: v.red[500], colorB: v.red[50] },
      { key: "600-100", label: "Red 600/100" },
      { key: "700-200", label: "Red 700/200", colorA: v.red[700], colorB: v.red[200] }
    ]
  },
  {
    hue: "orange",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Orange 500/50", colorA: v.orange[500], colorB: v.orange[50] },
      { key: "600-100", label: "Orange 600/100" },
      { key: "700-200", label: "Orange 700/200", colorA: v.orange[700], colorB: v.orange[200] }
    ]
  },
  {
    hue: "yellow",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Yellow 500/50", colorA: v.yellow[500], colorB: v.yellow[50] },
      { key: "600-100", label: "Yellow 600/100" },
      { key: "700-200", label: "Yellow 700/200", colorA: v.yellow[700], colorB: v.yellow[200] }
    ]
  },
  {
    hue: "green",
    min: -10,
    max: 10,
    step: 0.5,
    width: 260,
    variants: [
      { key: "500-50", label: "Green 500/50", colorA: v.green[500], colorB: v.green[50] },
      { key: "600-100", label: "Green 600/100" },
      { key: "700-200", label: "Green 700/200", colorA: v.green[700], colorB: v.green[200] }
    ]
  },
  {
    hue: "cyan",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Cyan 500/50", colorA: v.cyan[500], colorB: v.cyan[50] },
      { key: "600-100", label: "Cyan 600/100" },
      { key: "700-200", label: "Cyan 700/200", colorA: v.cyan[700], colorB: v.cyan[200] }
    ]
  },
  {
    hue: "blue",
    min: 0,
    max: 1,
    step: 0.01,
    width: 260,
    variants: [
      { key: "500-50", label: "Blue 500/50", colorA: v.blue[500], colorB: v.blue[50] },
      { key: "600-100", label: "Blue 600/100" },
      { key: "700-200", label: "Blue 700/200", colorA: v.blue[700], colorB: v.blue[200] }
    ]
  },
  {
    hue: "purple",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Purple 500/50", colorA: v.purple[500], colorB: v.purple[50] },
      { key: "600-100", label: "Purple 600/100" },
      { key: "700-200", label: "Purple 700/200", colorA: v.purple[700], colorB: v.purple[200] }
    ]
  },
  {
    hue: "magenta",
    min: 0,
    max: 100,
    step: 1,
    width: 260,
    variants: [
      { key: "500-50", label: "Magenta 500/50", colorA: v.magenta[500], colorB: v.magenta[50] },
      { key: "600-100", label: "Magenta 600/100" },
      { key: "700-200", label: "Magenta 700/200", colorA: v.magenta[700], colorB: v.magenta[200] }
    ]
  }
];
function Yo() {
  const e = {}, t = {}, o = [], n = {}, i = [], w = Array.from({ length: zt }, () => 0), h = vo[0]?.variants.length ?? 0;
  for (let k = 0; k < h; k += 1) {
    const ce = [];
    vo.forEach((x) => {
      const z = x.variants[k];
      if (!z) return;
      const re = `${x.hue}-${z.key}`, ie = z.colorA ?? v[x.hue][600], J = z.colorB ?? v[x.hue][100];
      e[re] = {
        id: re,
        label: z.label,
        hue: x.hue,
        min: x.min,
        max: x.max,
        step: x.step,
        width: x.width,
        drawerHandle: !0
      }, t[re] = {
        value: wo({ min: x.min, max: x.max, step: x.step }),
        colorA: ie,
        colorB: J,
        border: "none",
        drawerFeatureEnabled: e[re].drawerHandle,
        drawerLines: [
          Ot(Math.random(), x.min, x.max, x.step),
          Ot(Math.random(), x.min, x.max, x.step)
        ],
        drawerOpen: !1,
        lfoEnabled: !0,
        waveform: Nt[Math.floor(Math.random() * Nt.length)],
        frequency: So(),
        phase: yo(),
        audioResponse: 0,
        audioSamplePosition: 0.5
      }, ce.push(re);
    }), o.push({ id: `column-${k}`, sliderIds: ce });
  }
  const E = "custom-primary", S = 0, m = 100, H = 1;
  return e[E] = {
    id: E,
    label: "Custom colors",
    hue: "base",
    min: S,
    max: m,
    step: H,
    width: 320,
    drawerHandle: !0
  }, t[E] = {
    value: wo({ min: S, max: m, step: H }),
    colorA: "#205EA6",
    colorB: "#ECCB60",
    border: "none",
    drawerFeatureEnabled: e[E].drawerHandle,
    drawerLines: [
      Ot(Math.random(), S, m, H),
      Ot(Math.random(), S, m, H)
    ],
    drawerOpen: !0,
    lfoEnabled: !0,
    waveform: Nt[Math.floor(Math.random() * Nt.length)],
    frequency: So(),
    phase: yo(),
    audioResponse: 0,
    audioSamplePosition: 0.5
  }, n[Jt] = Bt({
    ...wt
  }), i.push(Jt), {
    definitions: e,
    sliders: t,
    columns: o,
    customSliderId: E,
    selectionGrids: n,
    selectionGridIds: i,
    audioBins: w,
    audioBinCount: Ko,
    audioMaxMagnitude: Io
  };
}
function Vo(e, t) {
  switch (t.type) {
    case "setValue":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            value: jt(t.value, e.definitions[t.id].min, e.definitions[t.id].max)
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
      const n = t.enabled ? { ...o, drawerFeatureEnabled: !0 } : { ...o, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 };
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: n
        }
      };
    }
    case "setDrawerOpen": {
      const o = e.sliders[t.id];
      if (!o) return e;
      const n = o.drawerFeatureEnabled ? t.open : !1;
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...o,
            drawerOpen: n
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
            audioResponse: jt(t.audioResponse, jo, Xo)
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
            audioSamplePosition: jt(t.audioSamplePosition, 0, 1)
          }
        }
      };
    case "setDrawerOpenBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((n) => {
        const i = o[n];
        if (!i) return;
        const w = i.drawerFeatureEnabled ? t.open : !1;
        o[n] = { ...i, drawerOpen: w };
      }), { ...e, sliders: o };
    }
    case "setDrawerFeatureEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((n) => {
        const i = o[n];
        i && (o[n] = t.enabled ? { ...i, drawerFeatureEnabled: !0 } : { ...i, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 });
      }), { ...e, sliders: o };
    }
    case "setLfoEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((n) => {
        const i = o[n];
        i && (o[n] = { ...i, lfoEnabled: t.enabled });
      }), { ...e, sliders: o };
    }
    case "swapColorsAll": {
      const o = Object.fromEntries(
        Object.entries(e.sliders).map(([n, i]) => [
          n,
          { ...i, colorA: i.colorB, colorB: i.colorA }
        ])
      );
      return { ...e, sliders: o };
    }
    case "swapColorsColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((n) => {
        const i = o[n];
        i && (o[n] = { ...i, colorA: i.colorB, colorB: i.colorA });
      }), { ...e, sliders: o };
    }
    case "setBorderColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((n) => {
        const i = o[n];
        i && (o[n] = { ...i, border: t.border });
      }), { ...e, sliders: o };
    }
    case "registerSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (o) {
        const i = Bt({ ...o, ...t.initialState ?? {} });
        return Yt(i, o) ? e : {
          ...e,
          selectionGrids: {
            ...e.selectionGrids,
            [t.id]: i
          }
        };
      }
      const n = Bt({ ...wt, ...t.initialState ?? {} });
      return {
        ...e,
        selectionGridIds: e.selectionGridIds.includes(t.id) ? e.selectionGridIds : [...e.selectionGridIds, t.id],
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: n
        }
      };
    }
    case "updateSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const n = Bt({ ...o, ...t.patch });
      return Yt(n, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: n
        }
      };
    }
    case "toggleSelectionGridInvert": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const n = { ...o, invertGradients: !o.invertGradients };
      return {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: n
        }
      };
    }
    case "setSelectionGridPalette": {
      const o = e.selectionGrids[t.id];
      return !o || o.colorPalette.length === t.palette.length && o.colorPalette.every((n, i) => n === t.palette[i]) ? e : {
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
      const n = Bt({ ...o, previewMode: t.previewMode });
      return Yt(n, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: n
        }
      };
    }
    case "setAudioBins": {
      const o = Array.from({ length: zt }, (n, i) => t.bins[i] ?? 0);
      return {
        ...e,
        audioBins: o
      };
    }
    case "setAudioBinCount": {
      const o = Math.max(0, Math.min(zt, Math.floor(t.count)));
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
function Qo({ children: e }) {
  const [t, o] = Po(Vo, void 0, Yo), n = Zt(() => ({ state: t, dispatch: o }), [t, o]);
  return /* @__PURE__ */ N(to.Provider, { value: n, children: e });
}
const Jo = {
  ...wt,
  colorPalette: [...wt.colorPalette]
};
function vr(e) {
  const { state: t } = ze(), o = t.definitions[e];
  if (!o) throw new Error(`Slider definition not found for id "${e}"`);
  return o;
}
function Mr(e) {
  const { state: t } = ze(), o = t.sliders[e];
  if (!o) throw new Error(`Slider state not found for id "${e}"`);
  return o;
}
function xr() {
  const { state: e } = ze();
  return { columns: e.columns, customSliderId: e.customSliderId };
}
function Rr() {
  const { state: e } = ze();
  return e;
}
function Cr() {
  const { state: e } = ze();
  return e.selectionGridIds;
}
function Er(e) {
  const { state: t } = ze(), o = t.columns.find((n) => n.id === e);
  if (!o) throw new Error(`Slider column not found for id "${e}"`);
  return o;
}
function Ar() {
  const { dispatch: e } = ze();
  return Zt(() => ({
    setSliderValue: (t, o) => e({ type: "setValue", id: t, value: o }),
    setSliderColors: (t, o, n) => e({ type: "setColors", id: t, colorA: o, colorB: n }),
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
function Zo(e) {
  const { state: t, dispatch: o } = ze(), n = t.selectionGrids[e];
  return Lo(() => {
    n || o({ type: "registerSelectionGrid", id: e });
  }, [n, e, o]), n || Jo;
}
function er() {
  const { dispatch: e } = ze();
  return Zt(() => ({
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
const Dt = 3, tr = "var(--ui-bits-color-a, #2f2f2f)", or = "var(--ui-bits-color-b, #f0f0f0)", Mo = 4096, rr = 6;
function nr(e) {
  if (typeof window > "u") return e;
  try {
    return new URL(e, window.location.href).href;
  } catch {
    return e;
  }
}
function sr(e, t) {
  const o = Math.max(1, Math.floor(t)), n = Math.max(1, Math.floor(Mo / o)), i = Math.max(1, Math.floor(Mo / o));
  return e <= 0 ? 1 : Math.min(n, Math.max(1, Math.ceil(e / i)));
}
function lr(e, t) {
  if (typeof document > "u") return null;
  const o = document.createElement("canvas");
  return o.width = e, o.height = t, o;
}
function Vt(e, t, o, n, i) {
  const w = n / 2, h = Math.min(w, Math.max(0, i.tl)), E = Math.min(w, Math.max(0, i.tr)), S = Math.min(w, Math.max(0, i.br)), m = Math.min(w, Math.max(0, i.bl));
  e.beginPath(), e.moveTo(t + h, o), e.lineTo(t + n - E, o), E > 0 ? e.quadraticCurveTo(t + n, o, t + n, o + E) : e.lineTo(t + n, o), e.lineTo(t + n, o + n - S), S > 0 ? e.quadraticCurveTo(t + n, o + n, t + n - S, o + n) : e.lineTo(t + n, o + n), e.lineTo(t + m, o + n), m > 0 ? e.quadraticCurveTo(t, o + n, t, o + n - m) : e.lineTo(t, o + n), e.lineTo(t, o + h), h > 0 ? e.quadraticCurveTo(t, o, t + h, o) : e.lineTo(t, o), e.closePath();
}
function cr() {
  return new Ao();
}
const ir = ["gradient", "terrainHeight"], ar = {
  gradient: $o,
  terrainHeight: Fo
}, xo = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews"
};
function ur(e) {
  const t = [...e];
  for (let o = t.length - 1; o > 0; o -= 1) {
    const n = Math.floor(Math.random() * (o + 1)), i = t[o];
    t[o] = t[n], t[n] = i;
  }
  return t;
}
function dr(e, t) {
  return t ? e.slice().reverse().map((o) => ({
    ...o,
    stop: 100 - o.stop
  })) : e;
}
function fr(e, t, o, n, i, w) {
  const h = e.createLinearGradient(t, o, t + n, o);
  dr(i, w).forEach((S) => {
    h.addColorStop(S.stop / 100, S.color);
  }), e.fillStyle = h, e.fillRect(t, o, n, n);
}
const _t = eo.map((e) => ({
  name: e.name,
  stops: e.stops,
  normal: Qt(e.stops, !1),
  inverted: Qt(e.stops, !0)
}));
function Ro({
  gridId: e = Jt,
  previewDarkMode: t,
  terrainAssets: o,
  layoutGap: n = "6px",
  colorA: i = tr,
  colorB: w = or,
  allowEmptySelection: h = !1,
  maxHeightUnits: E = 24,
  fontSize: S,
  maxWidth: m = 360,
  className: H,
  style: k
}) {
  const [ce, x] = c.useState([]), [z, re] = c.useState({}), ie = Zo(e), J = er(), {
    squareScale: st,
    squareAlignment: Tt,
    selectedIndex: fe,
    invertGradients: ae,
    allowEmptySelection: lt,
    previewMode: ke
  } = ie, Ue = ke === "gradient" ? "plain" : "height", Ce = Ue !== "plain";
  c.useEffect(() => {
    let u = !1;
    if (!Ce) {
      x([]);
      return;
    }
    return (typeof o == "function" ? o() : Promise.resolve(o ?? [])).then((f) => {
      u || x(f);
    }).catch(() => {
      u || x([]);
    }), () => {
      u = !0;
    };
  }, [o, Ce]), c.useEffect(() => {
    if (!Ce) {
      re({});
      return;
    }
    const u = ce;
    if (u.length === 0) {
      re({});
      return;
    }
    const b = ur(u), f = b.length > 0 ? b : u, T = {};
    _t.forEach((P, $) => {
      const K = f[$ % f.length];
      T[P.name] = K;
    }), re(T);
  }, [ce, Ce]);
  const Ee = c.useMemo(() => _t.map((u) => {
    const b = Ce ? z[u.name] : void 0, f = b?.url ?? "", T = b?.name ?? f.split("/").pop() ?? f;
    return {
      name: u.name,
      tile: T,
      tileUrl: f,
      normal: {
        paletteCss: [...u.normal.css],
        cssFallback: Xt(u.stops, !1)
      },
      inverted: {
        paletteCss: [...u.inverted.css],
        cssFallback: Xt(u.stops, !0)
      }
    };
  }), [z, Ce]), D = Ee.length, bt = c.useRef(null), St = c.useRef(null), Te = c.useRef(null), Z = c.useRef(null), [ct, Je] = c.useState(360), [Pt, _] = c.useState(S ?? 16), U = c.useRef(null), Pe = c.useRef(null), F = c.useRef(/* @__PURE__ */ new Map()), q = c.useRef(/* @__PURE__ */ new Set()), Y = c.useRef(/* @__PURE__ */ new Set()), be = c.useRef([]), qe = c.useRef(
    /* @__PURE__ */ new Map()
  ), We = c.useRef(null), Le = c.useRef(null), Ze = c.useRef(null), yt = c.useRef(0), He = c.useRef(null), it = c.useRef(null), vt = c.useRef([]), Mt = c.useRef(() => {
  }), Ke = c.useCallback(() => {
    if (typeof window > "u") return;
    yt.current += 1;
    const u = yt.current;
    window.requestAnimationFrame(() => {
      u === yt.current && Mt.current();
    });
  }, []), je = c.useCallback(() => {
    const u = Pe.current;
    if (u)
      for (; q.current.size < rr && be.current.length > 0; ) {
        const b = be.current.shift();
        if (!b) break;
        if (Y.current.delete(b), q.current.has(b)) continue;
        const f = qe.current.get(b);
        f && (q.current.add(b), u.postMessage({
          type: "gradientTile",
          id: b,
          palette: f.palette,
          size: f.size,
          tileUrl: f.tileUrl
        }));
      }
  }, []);
  c.useEffect(() => {
    J.registerSelectionGrid(e, { allowEmptySelection: h });
  }, [e, h, J]), c.useEffect(() => {
    if (typeof window > "u") return;
    const u = cr();
    Pe.current = u, u.onmessage = (P) => {
      const { id: $, bitmap: K, error: Me } = P.data ?? {};
      if (!$) return;
      q.current.delete($);
      const j = F.current.get($);
      j?.bitmap && j.bitmap !== K && j.bitmap.close(), Me ? (F.current.set($, { status: "error" }), K?.close()) : K && F.current.set($, { status: "ready", bitmap: K }), je(), Ke();
    };
    const b = F.current, f = q.current, T = qe.current;
    return () => {
      u.terminate(), Pe.current = null, b.forEach((P) => P.bitmap?.close()), b.clear(), f.clear(), Y.current.clear(), be.current = [], T.clear(), We.current = null, Le.current = null, Ze.current = null, He.current = null, it.current = null, vt.current = [];
    };
  }, [je, Ke]), c.useEffect(() => {
    h !== void 0 && lt !== h && J.setSelectionGridAllowEmpty(e, h);
  }, [h, e, J, lt]), c.useEffect(() => {
    const u = bt.current;
    if (!u) return;
    const b = () => {
      const T = u.getBoundingClientRect();
      if (!T.width) return;
      const P = Math.round(T.width);
      Je(($) => Math.abs($ - P) < 0.5 ? $ : P);
    };
    b();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(b), f.observe(u)) : window.addEventListener("resize", b), () => {
      f?.disconnect(), window.removeEventListener("resize", b);
    };
  }, []), c.useEffect(() => {
    const u = St.current;
    if (!u) return;
    const b = () => {
      const T = u.getBoundingClientRect();
      T.height && _((P) => Math.abs(P - T.height) < 0.5 ? P : T.height);
    };
    b();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(b), f.observe(u), () => {
      f?.disconnect();
    }) : (window.addEventListener("resize", b), () => {
      window.removeEventListener("resize", b);
    });
  }, [fe, ae, t, ct, ke]);
  const A = c.useMemo(() => {
    if (fe == null || Ee[fe] === void 0) return null;
    const u = Ee[fe];
    return ae ? u.inverted.paletteCss : u.normal.paletteCss;
  }, [Ee, ae, fe]);
  c.useEffect(() => {
    if (!A) return;
    const u = A.join("|");
    u !== U.current && (U.current = u, J.setSelectionGridPalette(e, A));
  }, [e, A, J]);
  const Oe = S ?? 16, pe = 1, et = 0.35, Se = Oe * et, xt = Pt || Oe * pe, he = Math.max(
    Math.round(xt + Se * 2 + 2),
    // extra room for 1px borders
    Math.round(Oe + Se * 1.5)
  ), I = he * st, R = ct ? Math.max(1, Math.floor(ct / I)) : 1, ye = R ? Math.ceil(D / R) : D, Fe = R >= D ? D : D % R || R, Xe = R > Fe ? R - Fe : 0, at = R ? Math.floor((D - 1) / R) : 0, Ye = Xe > 0 ? Tt === "center" ? Xe * I / 2 : Tt === "right" ? Xe * I : 0 : 0, Rt = R * I, Ct = typeof E == "number" && Number.isFinite(E) && E > 0 ? E : null, Ut = ye * st, tt = Ct != null ? Ct * he : null, Ae = Ct != null && Ut > Ct, ut = ye * I;
  c.useEffect(() => {
    Ke();
  }, [
    Ee,
    fe,
    ae,
    ct,
    I,
    Ue,
    Ye,
    Ke
  ]), c.useEffect(() => {
    const u = Te.current;
    if (!u) return;
    const b = () => Ke();
    return u.addEventListener("scroll", b, { passive: !0 }), () => u.removeEventListener("scroll", b);
  }, [Ke]), Mt.current = () => {
    const u = Z.current, b = Te.current;
    if (!u || !b) return;
    const f = u.getContext("2d");
    if (!f) return;
    const T = Math.max(1, Math.round(Rt)), P = Math.max(1, Math.round(b.clientHeight || ut)), $ = typeof window < "u" && window.devicePixelRatio || 1, K = Math.max(1, Math.round(T * $)), Me = Math.max(1, Math.round(P * $));
    if ((u.width !== K || u.height !== Me) && (u.width = K, u.height = Me, u.style.width = `${T}px`, u.style.height = `${P}px`), f.setTransform($, 0, 0, $, 0, 0), f.clearRect(0, 0, T, P), D === 0) return;
    const j = b.scrollTop, Ne = Math.max(0, Math.floor(j / I) - 1), Ge = Math.min(ye - 1, Math.floor((j + P) / I) + 1), De = Math.max(1, Math.round(I * $)), ht = sr(D, De), Gt = Math.max(1, Math.ceil(D / ht)), r = new Array(D), s = /* @__PURE__ */ new Set();
    for (let a = 0; a < D; a += 1) {
      const d = _t[a], g = Ee[a], y = ae ? d.inverted.data : d.normal.data, M = Ue === "height" && Ce && g.tileUrl ? nr(g.tileUrl) : void 0, C = `${d.name}|${ae ? "inv" : "norm"}|${Ue}|${De}|${M ?? "plain"}`;
      r[a] = C, s.add(C), qe.current.set(C, { palette: y, size: De, tileUrl: M });
    }
    const l = `${Ue}|${ae ? "inv" : "norm"}|${De}|${ht}|${r.join("|")}`;
    if (He.current !== l) {
      He.current = l, it.current = null;
      const a = ht * De, d = Gt * De, g = lr(a, d);
      We.current = g, Le.current = g?.getContext("2d") ?? null, Ze.current = {
        key: l,
        columns: ht,
        rows: Gt,
        tileSize: De
      }, vt.current = new Array(D).fill(""), Le.current && Le.current.clearRect(0, 0, a, d), F.current.forEach((y, M) => {
        s.has(M) || (y.bitmap?.close(), F.current.delete(M));
      }), q.current.forEach((y) => {
        s.has(y) || q.current.delete(y);
      }), be.current = be.current.filter((y) => s.has(y)), Y.current = new Set(be.current), qe.current.forEach((y, M) => {
        s.has(M) || qe.current.delete(M);
      });
    }
    for (let a = Ne; a <= Ge; a += 1) {
      const d = a === at ? Ye : 0, g = a === at ? Fe : R, y = a * R, M = a * I - j;
      for (let C = 0; C < g; C += 1) {
        const B = y + C;
        if (B >= D) break;
        const xe = _t[B], Ve = fe === B, O = B - R >= 0, ee = B + R < D, te = C > 0, _e = C < R - 1 && B + 1 < D && Math.floor((B + 1) / R) === a, oe = {
          tl: O || te ? 0 : Dt,
          tr: O || _e ? 0 : Dt,
          br: ee || _e ? 0 : Dt,
          bl: ee || te ? 0 : Dt
        }, ue = d + C * I, ne = r[B], Re = We.current, p = Ze.current, G = Le.current;
        let X = vt.current[B] === ne;
        const L = F.current.get(ne);
        if (L?.status === "ready" && L.bitmap && G && p && !X) {
          const W = B % p.columns * p.tileSize, V = Math.floor(B / p.columns) * p.tileSize;
          G.drawImage(L.bitmap, W, V, p.tileSize, p.tileSize), vt.current[B] = ne, X = !0;
        }
        if (L || F.current.set(ne, { status: "loading" }), (!L || L.status === "loading") && !q.current.has(ne) && !Y.current.has(ne) && (be.current.push(ne), Y.current.add(ne)), Re && p && X) {
          const W = B % p.columns * p.tileSize, V = Math.floor(B / p.columns) * p.tileSize;
          f.save(), Vt(f, ue, M, I, oe), f.clip(), f.drawImage(
            Re,
            W,
            V,
            p.tileSize,
            p.tileSize,
            ue,
            M,
            I,
            I
          ), f.restore();
        } else
          f.save(), Vt(f, ue, M, I, oe), f.clip(), fr(f, ue, M, I, xe.stops, ae), f.restore();
        Ve && (f.save(), f.strokeStyle = w, f.lineWidth = 2, Vt(f, ue + 1, M + 1, I - 2, oe), f.stroke(), f.restore());
      }
    }
    if (it.current !== l) {
      it.current = l;
      for (let a = 0; a < D; a += 1) {
        const d = r[a], g = F.current.get(d);
        g?.status === "ready" || g?.status === "error" || g?.status === "loading" || q.current.has(d) || Y.current.has(d) || (be.current.push(d), Y.current.add(d), F.current.set(d, { status: "loading" }));
      }
    }
    je();
  };
  const Wt = {
    width: "100%",
    maxWidth: typeof m == "number" ? `${m}px` : m,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: n,
    alignItems: "stretch",
    ...k ?? {}
  }, Et = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)"
  ].join(", "), At = [
    "drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))",
    "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))"
  ].join(" "), dt = Math.max(Math.round(he - 4), Math.round(Oe + Se)), me = Math.max(8, Math.round((dt - 2) / (1 + et * 2))), ve = Math.max(Math.round(dt * 0.6), 12), $e = {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    filter: At
  }, Ie = ir.map((u) => ({
    value: u,
    icon: c.createElement(ar[u], { size: ve, strokeWidth: 2 }),
    ariaLabel: xo[u],
    title: xo[u]
  })), ge = fe != null ? eo[fe] : null, ft = ge ? Xt(ge.stops, ae) : "transparent", we = ge ? ge.name : "None", pt = ge == null ? we : ae ? `<-${we}-<` : `>-${we}->`, It = (u) => {
    const b = Z.current, f = Te.current;
    if (!b || !f) return;
    const T = b.getBoundingClientRect(), P = u.clientX - T.left, $ = u.clientY - T.top + f.scrollTop;
    if (P < 0 || $ < 0) return;
    const K = Math.floor($ / I);
    if (K < 0 || K >= ye) return;
    const Me = K === at ? Ye : 0, j = K === at ? Fe : R;
    if (P < Me || P > Me + j * I) return;
    const Ne = Math.floor((P - Me) / I);
    if (Ne < 0 || Ne >= j) return;
    const Ge = K * R + Ne;
    if (!(Ge < 0 || Ge >= D)) {
      if (fe === Ge) {
        lt && J.setSelectionGridSelectedIndex(e, null);
        return;
      }
      J.setSelectionGridSelectedIndex(e, Ge);
    }
  };
  return /* @__PURE__ */ N("div", { ref: bt, className: H, style: Wt, children: /* @__PURE__ */ N("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ kt(
    "div",
    {
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: `${Rt}px`,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ kt(
          "div",
          {
            style: {
              width: "100%",
              borderRadius: 3,
              boxSizing: "border-box",
              background: ft,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${Se}px 8px`,
              minHeight: `${he}px`,
              position: "relative"
            },
            "aria-label": "Selected gradient preview",
            role: "button",
            tabIndex: 0,
            "aria-pressed": ae,
            onClick: () => {
              J.toggleSelectionGridInvert(e);
            },
            onKeyDown: (u) => {
              (u.key === "Enter" || u.key === " ") && (u.preventDefault(), J.toggleSelectionGridInvert(e));
            },
            children: [
              /* @__PURE__ */ N(
                No,
                {
                  behavior: "cycle",
                  options: Ie,
                  value: ke,
                  fontSize: me,
                  colorA: i,
                  colorB: "transparent",
                  borderStyle: "none",
                  style: $e,
                  onChange: (u) => {
                    J.setSelectionGridPreviewMode(e, u);
                  },
                  onClick: (u) => {
                    u.stopPropagation();
                  },
                  onKeyDown: (u) => {
                    (u.key === "Enter" || u.key === " ") && u.stopPropagation();
                  }
                }
              ),
              /* @__PURE__ */ N(
                "div",
                {
                  ref: St,
                  style: {
                    textAlign: "center",
                    fontSize: Oe,
                    lineHeight: pe,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: i,
                    textShadow: Et,
                    userSelect: "none",
                    pointerEvents: "none"
                  },
                  children: pt
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ kt(
          "div",
          {
            ref: Te,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Ae && tt != null ? `${tt}px` : `${ut}px`,
              maxHeight: tt != null ? `${tt}px` : void 0,
              overflowY: Ae ? "auto" : "hidden",
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
                      ref: Z,
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
                      onPointerDown: It
                    }
                  )
                }
              ),
              /* @__PURE__ */ N("div", { style: { width: "100%", height: `${ut}px` } })
            ]
          }
        )
      ]
    }
  ) }) });
}
function Ir(e) {
  return c.useContext(to) ? /* @__PURE__ */ N(Ro, { ...e }) : /* @__PURE__ */ N(Qo, { children: /* @__PURE__ */ N(Ro, { ...e }) });
}
export {
  Jt as D,
  Ir as G,
  eo as M,
  yr as S,
  Qo as a,
  Qt as b,
  Xt as c,
  er as d,
  Cr as e,
  Zo as f,
  Ar as g,
  Er as h,
  vr as i,
  xr as j,
  Mr as k,
  Rr as l,
  ze as u
};
//# sourceMappingURL=SelectionGridGradient-q-SFv5Gi.js.map
