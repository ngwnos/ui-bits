import { jsxs as Tt, jsx as D } from "react/jsx-runtime";
import c, { createContext as Po, useContext as To, useReducer as Lo, useMemo as Jt, useEffect as Oo } from "react";
import { F as Fo } from "./Folder-B-XHBECm.js";
import { Mountain as zo, Columns4 as Do } from "lucide-react";
import { I as No } from "./IconButton-BvvMagK1.js";
import { c as Kt, v as zt } from "./lfo-DJ5JkDXn.js";
import { f as S } from "./flexoki-DpJ9ZEpp.js";
function $o(e) {
  const t = e.trim().replace("#", "");
  if (t.length !== 6)
    return [0, 0, 0];
  const o = Number.parseInt(t, 16);
  if (Number.isNaN(o)) return [0, 0, 0];
  const l = o >> 16 & 255, a = o >> 8 & 255, b = o & 255;
  return [l, a, b];
}
function vo(e, t) {
  const o = e.map((l) => ({
    ...l,
    rgb: $o(l.color)
  }));
  return t ? o.slice().reverse().map((l) => ({
    ...l,
    stop: 100 - l.stop
  })) : o;
}
function jt(e, t = !1) {
  return `linear-gradient(90deg, ${vo(e, t).map((a) => `${a.color} ${a.stop}%`).join(", ")})`;
}
function Xt(e, t = !1) {
  const o = vo(e, t), l = new Uint8ClampedArray(256 * 4), a = new Array(256);
  for (let b = 0; b < o.length - 1; b += 1) {
    const m = o[b], I = o[b + 1], M = Math.round(m.stop / 100 * 255), g = Math.round(I.stop / 100 * 255), H = Math.max(1, g - M);
    for (let k = M; k <= g; k += 1) {
      const ce = (k - M) / H, x = Math.round(m.rgb[0] + (I.rgb[0] - m.rgb[0]) * ce), _ = Math.round(m.rgb[1] + (I.rgb[1] - m.rgb[1]) * ce), re = Math.round(m.rgb[2] + (I.rgb[2] - m.rgb[2]) * ce), ie = k * 4;
      l[ie] = x, l[ie + 1] = _, l[ie + 2] = re, l[ie + 3] = 255, a[k] = `rgb(${x}, ${_}, ${re})`;
    }
  }
  for (let b = 0; b < 256; b += 1) {
    const m = b * 4;
    if (a[b]) continue;
    if (!a.find((M) => M !== void 0))
      a[b] = "rgb(0, 0, 0)", l[m] = 0, l[m + 1] = 0, l[m + 2] = 0, l[m + 3] = 255;
    else {
      let M = b - 1;
      for (; M >= 0 && !a[M]; ) M -= 1;
      let g = b + 1;
      for (; g < 256 && !a[g]; ) g += 1;
      const H = M >= 0 ? M : g, k = H * 4;
      a[b] = a[H], l[m] = l[k], l[m + 1] = l[k + 1], l[m + 2] = l[k + 2], l[m + 3] = 255;
    }
  }
  return { data: l, css: a };
}
const Zt = [
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
], Vt = "selection-grid", Mo = '(function(){"use strict";const h=self;h.onmessage=n=>{const t=n.data;if(t){if(t.type==="imageTile"){w(t).catch(a=>{u(t.id,a)});return}t.type==="gradientTile"&&p(t).catch(a=>{u(t.id,a)})}};function u(n,t){const a=t instanceof Error?t.message:"Unknown worker error",e={id:n,error:a};h.postMessage(e)}async function w({id:n,src:t,size:a}){const e=await fetch(t,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch image (${e.status})`);const c=await e.blob(),r=await l(c,a),i={id:n,bitmap:r};h.postMessage(i,[r])}async function l(n,t){const a=await createImageBitmap(n);if(typeof OffscreenCanvas>"u"){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const e=new OffscreenCanvas(t,t),c=e.getContext("2d");if(!c){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const r=Math.max(t/a.width,t/a.height),i=Math.round(a.width*r),f=Math.round(a.height*r),d=Math.round((t-i)/2),o=Math.round((t-f)/2);return c.clearRect(0,0,t,t),c.drawImage(a,d,o,i,f),a.close(),e.transferToImageBitmap()}async function p({id:n,palette:t,size:a,tileUrl:e}){const c=e?await y(e,t,a):await g(t,a),r={id:n,bitmap:c};h.postMessage(r,[c])}async function g(n,t){const a=new ImageData(t,t),e=a.data;for(let c=0;c<t;c+=1)for(let r=0;r<t;r+=1){const i=t<=1?0:r/(t-1),d=Math.min(255,Math.max(0,Math.round(i*255)))*4,o=(c*t+r)*4;e[o]=n[d],e[o+1]=n[d+1],e[o+2]=n[d+2],e[o+3]=255}return await createImageBitmap(a)}async function y(n,t,a){const e=await fetch(n,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch terrain tile (${e.status})`);if(typeof OffscreenCanvas>"u")return await g(t,a);const c=await e.blob(),r=await createImageBitmap(c),i=new OffscreenCanvas(a,a),f=i.getContext("2d");if(!f)return await g(t,a);f.drawImage(r,0,0,a,a),r.close();const d=f.getImageData(0,0,a,a),o=d.data;for(let s=0;s<o.length;s+=4){const I=o[s],M=o[s+1],x=o[s+2],m=Math.round(.2126*I+.7152*M+.0722*x)*4;o[s]=t[m],o[s+1]=t[m+1],o[s+2]=t[m+2],o[s+3]=255}return f.putImageData(d,0,0),i.transferToImageBitmap()}})();\n//# sourceMappingURL=selectionGrid.worker-By4geu6o.js.map\n', po = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", Mo], { type: "text/javascript;charset=utf-8" });
function xo(e) {
  let t;
  try {
    if (t = po && (self.URL || self.webkitURL).createObjectURL(po), !t) throw "";
    const o = new Worker(t, {
      name: e?.name
    });
    return o.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), o;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(Mo),
      {
        name: e?.name
      }
    );
  }
}
const Je = 3, Ro = "var(--ui-bits-color-a, #2f2f2f)", Eo = "var(--ui-bits-color-b, #f0f0f0)", _o = 4096, Co = 6;
function lt(e, t, o, l, a) {
  const b = l / 2, m = Math.min(b, Math.max(0, a.tl)), I = Math.min(b, Math.max(0, a.tr)), M = Math.min(b, Math.max(0, a.br)), g = Math.min(b, Math.max(0, a.bl));
  e.beginPath(), e.moveTo(t + m, o), e.lineTo(t + l - I, o), I > 0 ? e.quadraticCurveTo(t + l, o, t + l, o + I) : e.lineTo(t + l, o), e.lineTo(t + l, o + l - M), M > 0 ? e.quadraticCurveTo(t + l, o + l, t + l - M, o + l) : e.lineTo(t + l, o + l), e.lineTo(t + g, o + l), g > 0 ? e.quadraticCurveTo(t, o + l, t, o + l - g) : e.lineTo(t, o + l), e.lineTo(t, o + m), m > 0 ? e.quadraticCurveTo(t, o, t + m, o) : e.lineTo(t, o), e.closePath();
}
function Qt(e, t) {
  const o = typeof window > "u" ? void 0 : window.location.href;
  if (!o) return e;
  try {
    return new URL(e, o).href;
  } catch {
    return e;
  }
}
function Ao(e, t, o = _o) {
  const l = Math.max(1, Math.floor(t)), a = Math.max(1, Math.floor(o)), b = Math.max(1, Math.floor(a / l)), m = Math.max(1, Math.floor(a / l));
  return e <= 0 ? 1 : Math.min(b, Math.max(1, Math.ceil(e / m)));
}
function Io(e, t) {
  if (typeof document > "u") return null;
  const o = document.createElement("canvas");
  return o.width = e, o.height = t, o;
}
function Uo() {
  return new xo();
}
function ur(e) {
  const {
    items: t,
    folders: o,
    selectionSlots: l,
    getKey: a,
    getPreview: b,
    getLabel: m,
    selectedKey: I,
    defaultSelectedKey: M = null,
    onSelect: g,
    allowEmptySelection: H = !1,
    squareScale: k = 1,
    squareAlignment: ce = "left",
    colorA: x = Ro,
    colorB: _ = Eo,
    layoutGap: re = "6px",
    maxHeightUnits: ie = 24,
    fontSize: J,
    maxWidth: ct = 360,
    className: Lt,
    style: fe
  } = e, [ae, it] = c.useState(M), [ke, Ue] = c.useState({}), [Ee, Ce] = c.useState({}), [N, St] = c.useState({}), vt = c.useRef(null), Pe = I !== void 0, Z = Pe ? I ?? null : ae, at = Number.isFinite(k) && k > 0 ? k : 1, Ze = ce ?? "left", Ot = c.useMemo(() => t ?? [], [t]), $ = c.useMemo(() => o ?? [], [o]), U = $.length > 0, Te = c.useMemo(() => l ?? [], [l]), F = Te.length > 0, W = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return U && $.forEach((n) => {
      const s = Ee[n.id] ?? [];
      s.length === 0 ? r.set(n.id, n.items) : r.set(n.id, [...n.items, ...s]);
    }), r;
  }, [Ee, $, U]), X = c.useMemo(() => {
    if (U) {
      const r = [];
      let n = 0;
      return $.forEach((s) => {
        (W.get(s.id) ?? s.items).forEach((u) => {
          const h = a(u, n);
          r.push({ item: u, index: n, key: h }), n += 1;
        });
      }), r;
    }
    return Ot.map((r, n) => ({
      item: r,
      index: n,
      key: a(r, n)
    }));
  }, [a, W, $, Ot, U]), be = c.useMemo(
    () => X.map((r) => r.key),
    [X]
  );
  c.useEffect(() => {
    Pe || F || Z != null && (be.includes(Z) || it(null));
  }, [be, Pe, Z, F]), c.useEffect(() => {
    U && Ue((r) => {
      let n = !1;
      const s = { ...r };
      return $.forEach((i) => {
        i.collapsed === void 0 && s[i.id] === void 0 && i.defaultCollapsed !== void 0 && (s[i.id] = i.defaultCollapsed, n = !0);
      }), n ? s : r;
    });
  }, [$, U]), c.useEffect(() => {
    F && St((r) => {
      let n = !1;
      const s = { ...r };
      return Te.forEach((i) => {
        i.selectedKey === void 0 && s[i.id] === void 0 && i.defaultSelectedKey !== void 0 && (s[i.id] = i.defaultSelectedKey, n = !0);
      }), n ? s : r;
    });
  }, [Te, F]);
  const We = c.useRef(null), qe = c.useRef(null), Le = c.useRef(null), [et, Mt] = c.useState(360);
  c.useEffect(() => {
    const r = We.current;
    if (!r) return;
    const n = () => {
      const i = r.getBoundingClientRect();
      if (!i.width) return;
      const u = Math.round(i.width);
      Mt((h) => Math.abs(h - u) < 0.5 ? h : u);
    };
    n();
    let s = null;
    return typeof ResizeObserver < "u" ? (s = new ResizeObserver(n), s.observe(r)) : window.addEventListener("resize", n), () => {
      s?.disconnect(), window.removeEventListener("resize", n);
    };
  }, [Ce]);
  const He = J ?? 16, dt = 1, Rt = He * 0.35, Ke = He * dt, je = Math.max(
    Math.round(Ke + Rt * 2 + 2),
    Math.round(He + Rt * 1.5)
  ), C = je * at, Oe = je, pe = et ? Math.max(1, Math.floor(et / C)) : 1, tt = pe * C, ye = c.useMemo(() => {
    if (!U)
      return X.map((s) => ({ type: "item", ...s }));
    const r = [];
    let n = 0;
    return $.forEach((s) => {
      if (s.collapsed ?? ke[s.id] ?? !1) {
        const h = W.get(s.id) ?? s.items;
        n += h.length;
        return;
      }
      (W.get(s.id) ?? s.items).forEach((h) => {
        const y = a(h, n);
        r.push({ type: "item", item: h, index: n, key: y }), n += 1;
      }), s.addTile && r.push({ type: "add", folderId: s.id, key: `add:${s.id}` });
    }), r;
  }, [X, a, ke, W, $, U]), Et = c.useMemo(() => {
    if (!U)
      return X.map((s) => ({ type: "item", ...s }));
    const r = [];
    let n = 0;
    return $.forEach((s) => {
      (W.get(s.id) ?? s.items).forEach((u) => {
        const h = a(u, n);
        r.push({ type: "item", item: u, index: n, key: h }), n += 1;
      }), s.addTile && r.push({ type: "add", folderId: s.id, key: `add:${s.id}` });
    }), r;
  }, [X, a, W, $, U]), he = ye.length, A = Et.length, R = c.useMemo(() => {
    const r = [];
    let n = 0;
    if (!U) {
      for (let i = 0; i < he; i += pe) {
        const u = Math.min(pe, he - i), h = pe - u, y = h > 0 ? Ze === "center" ? h * C / 2 : Ze === "right" ? h * C : 0 : 0;
        r.push({
          type: "items",
          startIndex: i,
          count: u,
          alignmentOffsetPx: y,
          height: C,
          top: n
        }), n += C;
      }
      return r;
    }
    let s = 0;
    return $.forEach((i, u) => {
      if (r.push({
        type: "header",
        folderIndex: u,
        alignmentOffsetPx: 0,
        height: Oe,
        top: n
      }), n += Oe, i.collapsed ?? ke[i.id] ?? !1) return;
      const v = (W.get(i.id) ?? i.items).length + (i.addTile ? 1 : 0);
      for (let E = 0; E < v; E += pe) {
        const B = Math.min(pe, v - E), xe = pe - B, Ve = xe > 0 ? Ze === "center" ? xe * C / 2 : Ze === "right" ? xe * C : 0 : 0;
        r.push({
          type: "items",
          startIndex: s + E,
          count: B,
          alignmentOffsetPx: Ve,
          height: C,
          top: n
        }), n += C;
      }
      s += v;
    }), r;
  }, [
    C,
    he,
    Oe,
    ke,
    W,
    $,
    Ze,
    pe,
    U
  ]), Se = R.length, Fe = Se > 0 ? R[Se - 1].top + R[Se - 1].height : 0, Ye = typeof ie == "number" && Number.isFinite(ie) && ie > 0 ? ie : null, ut = R.reduce((r, n) => r + n.height / je, 0), Xe = Ye != null ? Ye * je : null, Ct = Ye != null && ut > Ye, _t = {
    width: "100%",
    maxWidth: typeof ct == "number" ? `${ct}px` : ct,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: re,
    alignItems: "stretch",
    ...fe ?? {}
  }, ot = (r, n, s) => {
    Pe || it(r), g?.(r, n, s);
  }, Ae = c.useMemo(
    () => Te.map((r) => ({
      ...r,
      selectedKey: r.selectedKey ?? N[r.id] ?? null
    })),
    [N, Te]
  ), ft = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return Ae.forEach((n) => {
      const s = n.selectedKey;
      s != null && (r.has(s) || r.set(s, { slotId: n.id, color: n.color }));
    }), r;
  }, [Ae]), Ut = c.useCallback(
    (r, n, s, i) => {
      const u = Ae.find((h) => h.id === r);
      u && (u.selectedKey === void 0 && St((h) => {
        const y = { ...h, [r]: n };
        return n != null && Ae.forEach((v) => {
          v.id !== r && v.selectedKey === void 0 && y[v.id] === n && (y[v.id] = null);
        }), y;
      }), n != null && (vt.current = r), u.onSelect?.(n, s, i));
    },
    [Ae]
  ), Wt = c.useCallback((r) => {
    if (r.length === 0) return null;
    const n = vt.current;
    if (!n) return r[0] ?? null;
    const s = r.findIndex((u) => u.id === n);
    if (s === -1) return r[0] ?? null;
    const i = (s + 1) % r.length;
    return r[i] ?? null;
  }, []), It = c.useRef(null), Gt = c.useRef(/* @__PURE__ */ new Map()), pt = c.useRef(/* @__PURE__ */ new Map()), me = c.useRef(/* @__PURE__ */ new Map()), ve = c.useRef(/* @__PURE__ */ new Set()), ze = c.useRef(/* @__PURE__ */ new Set()), Ie = c.useRef([]), ge = c.useRef(/* @__PURE__ */ new Map()), ht = c.useRef(null), we = c.useRef(null), mt = c.useRef(null), Bt = c.useRef(0), d = c.useRef(null), w = c.useRef(null), f = c.useRef([]), P = c.useRef(() => {
  }), T = c.useCallback((r, n) => {
    n ? Gt.current.set(r, n) : Gt.current.delete(r);
  }, []), z = c.useCallback((r) => {
    const n = Gt.current.get(r);
    n && n.click();
  }, []), K = c.useCallback((r, n) => {
    const s = r.addTile;
    if (!s || (s.onAdd?.(n), !s.createItem)) return;
    const i = Array.from(n), u = i.map((E) => URL.createObjectURL(E)), h = i.map((E, B) => s.createItem?.(E, u[B])).filter(Boolean), y = s.autoAppend !== !1, v = s.revokeObjectUrls ?? y;
    if (h.length > 0 && (s.onAddItems?.(h, i), y && Ce((E) => ({
      ...E,
      [r.id]: [...E[r.id] ?? [], ...h]
    }))), v) {
      const E = pt.current.get(r.id) ?? /* @__PURE__ */ new Set();
      u.forEach((B) => E.add(B)), pt.current.set(r.id, E);
    }
  }, [Ce]);
  c.useEffect(() => {
    const r = pt.current;
    return () => {
      r.forEach((n) => {
        n.forEach((s) => URL.revokeObjectURL(s));
      }), r.clear();
    };
  }, []);
  const Me = c.useMemo(() => {
    const r = /* @__PURE__ */ new Map();
    return $.forEach((n) => {
      r.set(n.id, {
        colorA: n.colorA ?? x,
        colorB: n.colorB ?? _
      });
    }), r;
  }, [x, _, $]), j = c.useCallback(() => {
    if (typeof window > "u") return;
    Bt.current += 1;
    const r = Bt.current;
    window.requestAnimationFrame(() => {
      r === Bt.current && P.current();
    });
  }, []), De = c.useCallback(() => {
    const r = It.current;
    if (r)
      for (; ve.current.size < Co && Ie.current.length > 0; ) {
        const n = Ie.current.shift();
        if (!n) break;
        if (ze.current.delete(n), ve.current.has(n)) continue;
        const s = ge.current.get(n);
        s && (ve.current.add(n), r.postMessage({
          type: "imageTile",
          id: n,
          src: s.src,
          size: s.size
        }));
      }
  }, []);
  c.useEffect(() => {
    if (typeof window > "u") return;
    const r = Uo();
    It.current = r, r.onmessage = (u) => {
      const { id: h, bitmap: y, error: v } = u.data ?? {};
      if (!h) return;
      ve.current.delete(h);
      const E = me.current.get(h);
      E?.bitmap && E.bitmap !== y && E.bitmap.close(), v ? (me.current.set(h, { status: "error" }), y?.close()) : y && me.current.set(h, { status: "ready", bitmap: y }), De(), j();
    };
    const n = me.current, s = ve.current, i = ge.current;
    return () => {
      r.terminate(), It.current = null, n.forEach((u) => u.bitmap?.close()), n.clear(), s.clear(), ze.current.clear(), Ie.current = [], i.clear(), ht.current = null, we.current = null, mt.current = null, d.current = null, w.current = null, f.current = [];
    };
  }, [De, j]), c.useEffect(() => {
    j();
  }, [
    Et,
    ye,
    Z,
    et,
    C,
    x,
    _,
    pe,
    Se,
    he,
    j
  ]), c.useEffect(() => {
    const r = qe.current;
    if (!r) return;
    const n = () => j();
    return r.addEventListener("scroll", n, { passive: !0 }), () => r.removeEventListener("scroll", n);
  }, [j]);
  const Ge = (r) => {
    if (R.length === 0) return -1;
    let n = 0, s = R.length - 1;
    for (; n <= s; ) {
      const i = Math.floor((n + s) / 2), u = R[i];
      if (r < u.top)
        s = i - 1;
      else if (r >= u.top + u.height)
        n = i + 1;
      else
        return i;
    }
    return Math.max(0, Math.min(R.length - 1, n));
  };
  P.current = () => {
    const r = Le.current, n = qe.current;
    if (!r || !n) return;
    const s = r.getContext("2d");
    if (!s) return;
    const i = Math.max(1, Math.round(n.clientWidth || tt)), u = Math.max(1, Math.round(n.clientHeight || Fe)), h = Math.max(0, (i - tt) / 2), y = typeof window < "u" && window.devicePixelRatio || 1, v = Math.max(1, Math.round(i * y)), E = Math.max(1, Math.round(u * y));
    if ((r.width !== v || r.height !== E) && (r.width = v, r.height = E, r.style.width = `${i}px`, r.style.height = `${u}px`), s.setTransform(y, 0, 0, y, 0, 0), s.clearRect(0, 0, i, u), he === 0 && A === 0) return;
    const B = n.scrollTop, xe = Math.max(0, Ge(B) - 1), Ve = Math.min(Se - 1, Ge(B + u) + 1), O = Math.max(1, Math.round(C * y)), ee = new Array(A), te = new Array(A), $e = /* @__PURE__ */ new Map(), oe = /* @__PURE__ */ new Set();
    for (let p = 0; p < A; p += 1) {
      const G = Et[p];
      if ($e.set(G.key, p), G.type === "add") {
        const L = Me.get(G.folderId);
        ee[p] = { type: "color", color: L?.colorA ?? x }, te[p] = `add:${G.folderId}|${O}`;
        continue;
      }
      const Y = b(G.item, G.index);
      if (ee[p] = Y, Y.type === "color")
        te[p] = `color:${Y.color}`;
      else {
        const L = Qt(Y.src), q = `image:${L}|${O}`;
        te[p] = q, oe.add(q), ge.current.set(q, { src: L, size: O });
      }
    }
    const de = Ao(Math.max(1, A), O), ne = Math.max(1, Math.ceil(Math.max(1, A) / de)), Re = `${O}|${de}|${te.join("|")}`;
    if (d.current !== Re) {
      if (d.current = Re, w.current = null, A === 0)
        ht.current = null, we.current = null, mt.current = null, f.current = [];
      else {
        const p = de * O, G = ne * O, Y = Io(p, G);
        if (ht.current = Y, we.current = Y?.getContext("2d") ?? null, mt.current = {
          key: Re,
          columns: de,
          rows: ne,
          tileSize: O
        }, f.current = new Array(A).fill(""), we.current) {
          we.current.clearRect(0, 0, p, G);
          for (let L = 0; L < A; L += 1) {
            const q = ee[L];
            if (q.type !== "color") continue;
            const V = L % de * O, Be = Math.floor(L / de) * O;
            we.current.fillStyle = q.color, we.current.fillRect(V, Be, O, O), f.current[L] = te[L];
          }
        }
      }
      me.current.forEach((p, G) => {
        oe.has(G) || (p.bitmap?.close(), me.current.delete(G));
      }), ve.current.forEach((p) => {
        oe.has(p) || ve.current.delete(p);
      }), Ie.current = Ie.current.filter((p) => oe.has(p)), ze.current = new Set(Ie.current), ge.current.forEach((p, G) => {
        oe.has(G) || ge.current.delete(G);
      });
    }
    for (let p = xe; p <= Ve; p += 1) {
      const G = R[p];
      if (!G || G.type !== "items") continue;
      const Y = h + G.alignmentOffsetPx, L = G.count, q = G.startIndex, V = G.top - B;
      for (let Be = 0; Be < L; Be += 1) {
        const qt = q + Be;
        if (qt >= he) break;
        const rt = ye[qt], to = rt?.key ?? String(qt), nt = rt.type === "add", oo = !nt && F ? ft.get(to) : null, ko = !nt && (F ? !!oo : Z != null && to === Z), ro = p > 0 ? R[p - 1] : null, no = p + 1 < R.length ? R[p + 1] : null, so = ro?.type === "items" && Be < ro.count, lo = no?.type === "items" && Be < no.count, co = Be > 0, io = Be < L - 1, Ft = {
          tl: so || co ? 0 : Je,
          tr: so || io ? 0 : Je,
          br: lo || io ? 0 : Je,
          bl: lo || co ? 0 : Je
        }, wt = Y + Be * C, ao = nt ? Me.get(rt.folderId) : null, ue = $e.get(rt.key), st = ue != null ? ee[ue] : nt ? { type: "color", color: ao?.colorA ?? x } : b(rt.item, rt.index);
        let se = ue != null ? te[ue] : "";
        if (!se) {
          if (st.type === "color")
            se = `color:${st.color}`;
          else if (nt)
            se = `add:${rt.folderId}|${O}`;
          else if (st.type === "image") {
            const Q = Qt(st.src);
            se = `image:${Q}|${O}`, oe.add(se), ge.current.set(se, { src: Q, size: O });
          }
        }
        const uo = ht.current, le = mt.current, fo = we.current;
        let Ht = ue != null && f.current[ue] === se;
        if (!nt && st.type === "image") {
          const Q = me.current.get(se);
          if (Q?.status === "ready" && Q.bitmap && fo && le && !Ht && ue != null) {
            const Qe = ue % le.columns * le.tileSize, bt = Math.floor(ue / le.columns) * le.tileSize;
            fo.drawImage(Q.bitmap, Qe, bt, le.tileSize, le.tileSize), f.current[ue] = se, Ht = !0;
          }
          Q || me.current.set(se, { status: "loading" }), (!Q || Q.status === "loading") && !ve.current.has(se) && !ze.current.has(se) && (Ie.current.push(se), ze.current.add(se));
        }
        if (uo && le && Ht && ue != null) {
          const Q = ue % le.columns * le.tileSize, Qe = Math.floor(ue / le.columns) * le.tileSize;
          s.save(), lt(s, wt, V, C, Ft), s.clip(), s.drawImage(
            uo,
            Q,
            Qe,
            le.tileSize,
            le.tileSize,
            wt,
            V,
            C,
            C
          ), s.restore();
        } else st.type === "color" ? (lt(s, wt, V, C, Ft), s.fillStyle = st.color, s.fill()) : (lt(s, wt, V, C, Ft), s.fillStyle = x, s.fill());
        if (ko && (s.save(), s.strokeStyle = F ? oo?.color ?? _ : _, s.lineWidth = 2, lt(s, wt + 1, V + 1, C - 2, Ft), s.stroke(), s.restore()), nt) {
          const Q = wt + C / 2, Qe = V + C / 2, bt = C * 0.22;
          s.save(), s.strokeStyle = ao?.colorB ?? _, s.lineWidth = Math.max(1.5, C * 0.08), s.lineCap = "round", s.beginPath(), s.moveTo(Q - bt, Qe), s.lineTo(Q + bt, Qe), s.moveTo(Q, Qe - bt), s.lineTo(Q, Qe + bt), s.stroke(), s.restore();
        }
      }
    }
    if (w.current !== Re) {
      w.current = Re;
      for (let p = 0; p < he; p += 1) {
        const G = ye[p], Y = G ? $e.get(G.key) : null;
        if (Y == null || ee[Y].type !== "image") continue;
        const q = te[Y], V = me.current.get(q);
        V?.status === "ready" || V?.status === "error" || V?.status === "loading" || ve.current.has(q) || ze.current.has(q) || (Ie.current.push(q), ze.current.add(q), me.current.set(q, { status: "loading" }));
      }
    }
    De();
  };
  const Ne = (r) => {
    const n = Le.current, s = qe.current;
    if (!n || !s) return;
    const i = n.getBoundingClientRect(), u = r.clientX - i.left, h = r.clientY - i.top + s.scrollTop;
    if (u < 0 || h < 0) return;
    const y = Ge(h);
    if (y < 0 || y >= Se) return;
    const v = R[y];
    if (!v || v.type !== "items") return;
    const E = s.clientWidth || tt, xe = Math.max(0, (E - tt) / 2) + v.alignmentOffsetPx, Ve = v.count;
    if (u < xe || u > xe + Ve * C) return;
    const O = Math.floor((u - xe) / C);
    if (O < 0 || O >= Ve) return;
    const ee = v.startIndex + O;
    if (ee < 0 || ee >= ye.length) return;
    const te = ye[ee];
    if (te.type === "add") {
      z(te.folderId);
      return;
    }
    const $e = te.item, oe = te.key ?? String(ee);
    if (F) {
      const ne = ft.get(oe);
      if (ne) {
        H && Ut(ne.slotId, null, null, null);
        return;
      }
      const Re = Ae.find((p) => p.selectedKey == null) ?? Wt(Ae);
      if (!Re) return;
      Ut(Re.id, oe, $e, ee);
      return;
    }
    if (Z != null && oe === Z) {
      H && ot(null, null, null);
      return;
    }
    ot(oe, $e, ee);
  }, gt = c.useMemo(() => {
    if (F || !m || Z == null) return;
    const r = X.find((n) => n.key === Z);
    if (r)
      return m(r.item, r.index);
  }, [X, m, Z, F]), kt = c.useMemo(() => U ? R.flatMap((r, n) => r.type === "header" ? [{ rowIndex: n, folderIndex: r.folderIndex, top: r.top, height: r.height }] : []) : [], [R, U]);
  return /* @__PURE__ */ Tt("div", { ref: We, className: Lt, style: _t, children: [
    /* @__PURE__ */ D("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ D(
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
            ref: qe,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Ct && Xe != null ? `${Xe}px` : `${Fe}px`,
              maxHeight: Xe != null ? `${Xe}px` : void 0,
              overflowY: Ct ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            title: gt,
            children: [
              /* @__PURE__ */ D(
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
                  children: /* @__PURE__ */ D(
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
                      onPointerDown: Ne
                    }
                  )
                }
              ),
              U && kt.length > 0 && /* @__PURE__ */ D(
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
                  children: kt.map((r) => {
                    const n = $[r.folderIndex];
                    if (!n) return null;
                    const s = n.collapsed ?? ke[n.id] ?? !1;
                    return /* @__PURE__ */ D(
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
                        children: /* @__PURE__ */ D(
                          Fo,
                          {
                            label: n.label,
                            collapsed: s,
                            onCollapseChange: (i) => {
                              n.collapsed === void 0 && Ue((u) => ({ ...u, [n.id]: i })), n.onCollapseChange?.(i);
                            },
                            colorA: n.colorA ?? x,
                            colorB: n.colorB ?? _,
                            borderStyle: n.borderStyle ?? "none",
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
                      `${n.id}-${r.rowIndex}`
                    );
                  })
                }
              ),
              /* @__PURE__ */ D("div", { style: { width: "100%", height: `${Fe}px` } })
            ]
          }
        )
      }
    ) }),
    U && $.length > 0 && /* @__PURE__ */ D("div", { style: { display: "none" }, children: $.map((r) => r.addTile ? /* @__PURE__ */ D(
      "input",
      {
        ref: (n) => T(r.id, n),
        type: "file",
        accept: r.addTile.accept,
        multiple: r.addTile.multiple,
        "aria-label": typeof r.addTile.label == "string" ? r.addTile.label : "Add items",
        onChange: (n) => {
          const s = n.currentTarget.files;
          s && s.length > 0 && K(r, s), n.currentTarget.value = "";
        }
      },
      `add-input-${r.id}`
    ) : null) })
  ] });
}
const eo = Po(void 0);
function _e() {
  const e = To(eo);
  if (!e) throw new Error("useSliderStore must be used within a SliderStoreProvider");
  return e;
}
const $t = 1024, Wo = $t, Go = 1, qo = -1, Ho = 1, Bo = Xt(Zt[0].stops, !1).css, yt = {
  selectedIndex: 0,
  squareScale: 1,
  squareAlignment: "left",
  invertGradients: !1,
  allowEmptySelection: !1,
  colorPalette: [...Bo],
  previewMode: "terrainHeight",
  sunAltitudeDeg: 45,
  sunAzimuthDeg: 315
};
function Yt(e, t) {
  return e.selectedIndex === t.selectedIndex && e.squareScale === t.squareScale && e.squareAlignment === t.squareAlignment && e.invertGradients === t.invertGradients && e.allowEmptySelection === t.allowEmptySelection && e.colorPalette.length === t.colorPalette.length && e.colorPalette.every((o, l) => o === t.colorPalette[l]) && e.previewMode === t.previewMode && e.sunAltitudeDeg === t.sunAltitudeDeg && e.sunAzimuthDeg === t.sunAzimuthDeg;
}
function Pt(e) {
  const t = (g) => Number.isFinite(g) ? Math.min(4, Math.max(1, Math.round(g))) : 1, o = (g) => Number.isFinite(g ?? Number.NaN) ? Math.min(90, Math.max(0, Number(g))) : yt.sunAltitudeDeg, l = (g) => Number.isFinite(g ?? Number.NaN) ? (Number(g) % 360 + 360) % 360 : yt.sunAzimuthDeg, a = (g) => g === "center" || g === "right" ? g : "left", b = (g) => g === "gradient" || g === "terrainHeight" ? g : g === "terrainHillshade" ? "terrainHeight" : typeof g == "boolean" ? g ? "terrainHeight" : "gradient" : "terrainHeight", m = e.previewMode, I = e.useTerrainTiles, M = {
    selectedIndex: e.selectedIndex,
    squareScale: t(e.squareScale),
    squareAlignment: a(e.squareAlignment),
    invertGradients: !!e.invertGradients,
    allowEmptySelection: !!e.allowEmptySelection,
    colorPalette: Array.isArray(e.colorPalette) && e.colorPalette.length === 256 ? [...e.colorPalette] : [...Bo],
    previewMode: b(m ?? I),
    sunAltitudeDeg: o(e.sunAltitudeDeg),
    sunAzimuthDeg: l(e.sunAzimuthDeg)
  };
  return !M.allowEmptySelection && M.selectedIndex == null && (M.selectedIndex = 0), M;
}
function ho({ min: e, max: t, step: o }) {
  const l = Number.isFinite(e) ? e : 0, a = Number.isFinite(t) ? t : l, b = Math.max(0, a - l), m = o > 0 && Number.isFinite(o) ? o : b || 1;
  if (b === 0 || !Number.isFinite(b)) return l;
  const I = Math.max(1, Math.floor(b / m)), M = Math.floor(Math.random() * (I + 1)), g = l + M * m, H = (() => {
    const k = m.toString();
    if (k.includes("e-")) {
      const [, x] = k.split("e-");
      return Number(x ?? "0");
    }
    const [, ce] = k.split(".");
    return ce?.length ?? 0;
  })();
  return Number(g.toFixed(H));
}
const mo = [0.2, 0.4, 0.6, 0.8];
function go() {
  const e = Math.floor(Math.random() * mo.length);
  return mo[e];
}
function wo() {
  return Math.random();
}
const Dt = ["sine", "triangle", "saw", "square", "audio"], bo = [
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
function Ko() {
  const e = {}, t = {}, o = [], l = {}, a = [], b = Array.from({ length: $t }, () => 0), m = bo[0]?.variants.length ?? 0;
  for (let k = 0; k < m; k += 1) {
    const ce = [];
    bo.forEach((x) => {
      const _ = x.variants[k];
      if (!_) return;
      const re = `${x.hue}-${_.key}`, ie = _.colorA ?? S[x.hue][600], J = _.colorB ?? S[x.hue][100];
      e[re] = {
        id: re,
        label: _.label,
        hue: x.hue,
        min: x.min,
        max: x.max,
        step: x.step,
        width: x.width,
        drawerHandle: !0
      }, t[re] = {
        value: ho({ min: x.min, max: x.max, step: x.step }),
        colorA: ie,
        colorB: J,
        border: "none",
        drawerFeatureEnabled: e[re].drawerHandle,
        drawerLines: [
          zt(Math.random(), x.min, x.max, x.step),
          zt(Math.random(), x.min, x.max, x.step)
        ],
        drawerOpen: !1,
        lfoEnabled: !0,
        waveform: Dt[Math.floor(Math.random() * Dt.length)],
        frequency: go(),
        phase: wo(),
        audioResponse: 0,
        audioSamplePosition: 0.5
      }, ce.push(re);
    }), o.push({ id: `column-${k}`, sliderIds: ce });
  }
  const I = "custom-primary", M = 0, g = 100, H = 1;
  return e[I] = {
    id: I,
    label: "Custom colors",
    hue: "base",
    min: M,
    max: g,
    step: H,
    width: 320,
    drawerHandle: !0
  }, t[I] = {
    value: ho({ min: M, max: g, step: H }),
    colorA: "#205EA6",
    colorB: "#ECCB60",
    border: "none",
    drawerFeatureEnabled: e[I].drawerHandle,
    drawerLines: [
      zt(Math.random(), M, g, H),
      zt(Math.random(), M, g, H)
    ],
    drawerOpen: !0,
    lfoEnabled: !0,
    waveform: Dt[Math.floor(Math.random() * Dt.length)],
    frequency: go(),
    phase: wo(),
    audioResponse: 0,
    audioSamplePosition: 0.5
  }, l[Vt] = Pt({
    ...yt
  }), a.push(Vt), {
    definitions: e,
    sliders: t,
    columns: o,
    customSliderId: I,
    selectionGrids: l,
    selectionGridIds: a,
    audioBins: b,
    audioBinCount: Wo,
    audioMaxMagnitude: Go
  };
}
function jo(e, t) {
  switch (t.type) {
    case "setValue":
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...e.sliders[t.id],
            value: Kt(t.value, e.definitions[t.id].min, e.definitions[t.id].max)
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
      const l = t.enabled ? { ...o, drawerFeatureEnabled: !0 } : { ...o, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 };
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: l
        }
      };
    }
    case "setDrawerOpen": {
      const o = e.sliders[t.id];
      if (!o) return e;
      const l = o.drawerFeatureEnabled ? t.open : !1;
      return {
        ...e,
        sliders: {
          ...e.sliders,
          [t.id]: {
            ...o,
            drawerOpen: l
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
            audioResponse: Kt(t.audioResponse, qo, Ho)
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
            audioSamplePosition: Kt(t.audioSamplePosition, 0, 1)
          }
        }
      };
    case "setDrawerOpenBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((l) => {
        const a = o[l];
        if (!a) return;
        const b = a.drawerFeatureEnabled ? t.open : !1;
        o[l] = { ...a, drawerOpen: b };
      }), { ...e, sliders: o };
    }
    case "setDrawerFeatureEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((l) => {
        const a = o[l];
        a && (o[l] = t.enabled ? { ...a, drawerFeatureEnabled: !0 } : { ...a, drawerFeatureEnabled: !1, drawerOpen: !1, lfoEnabled: !1 });
      }), { ...e, sliders: o };
    }
    case "setLfoEnabledBatch": {
      const o = { ...e.sliders };
      return t.ids.forEach((l) => {
        const a = o[l];
        a && (o[l] = { ...a, lfoEnabled: t.enabled });
      }), { ...e, sliders: o };
    }
    case "swapColorsAll": {
      const o = Object.fromEntries(
        Object.entries(e.sliders).map(([l, a]) => [
          l,
          { ...a, colorA: a.colorB, colorB: a.colorA }
        ])
      );
      return { ...e, sliders: o };
    }
    case "swapColorsColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((l) => {
        const a = o[l];
        a && (o[l] = { ...a, colorA: a.colorB, colorB: a.colorA });
      }), { ...e, sliders: o };
    }
    case "setBorderColumn": {
      const o = { ...e.sliders };
      return t.ids.forEach((l) => {
        const a = o[l];
        a && (o[l] = { ...a, border: t.border });
      }), { ...e, sliders: o };
    }
    case "registerSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (o) {
        const a = Pt({ ...o, ...t.initialState ?? {} });
        return Yt(a, o) ? e : {
          ...e,
          selectionGrids: {
            ...e.selectionGrids,
            [t.id]: a
          }
        };
      }
      const l = Pt({ ...yt, ...t.initialState ?? {} });
      return {
        ...e,
        selectionGridIds: e.selectionGridIds.includes(t.id) ? e.selectionGridIds : [...e.selectionGridIds, t.id],
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: l
        }
      };
    }
    case "updateSelectionGrid": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const l = Pt({ ...o, ...t.patch });
      return Yt(l, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: l
        }
      };
    }
    case "toggleSelectionGridInvert": {
      const o = e.selectionGrids[t.id];
      if (!o) return e;
      const l = { ...o, invertGradients: !o.invertGradients };
      return {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: l
        }
      };
    }
    case "setSelectionGridPalette": {
      const o = e.selectionGrids[t.id];
      return !o || o.colorPalette.length === t.palette.length && o.colorPalette.every((l, a) => l === t.palette[a]) ? e : {
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
      const l = Pt({ ...o, previewMode: t.previewMode });
      return Yt(l, o) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [t.id]: l
        }
      };
    }
    case "setAudioBins": {
      const o = Array.from({ length: $t }, (l, a) => t.bins[a] ?? 0);
      return {
        ...e,
        audioBins: o
      };
    }
    case "setAudioBinCount": {
      const o = Math.max(0, Math.min($t, Math.floor(t.count)));
      return e.audioBinCount === o ? e : {
        ...e,
        audioBinCount: o
      };
    }
    case "setAudioMaxMagnitude": {
      const o = Number.isFinite(t.magnitude) && t.magnitude > 0 ? t.magnitude : Go;
      return e.audioMaxMagnitude === o ? e : {
        ...e,
        audioMaxMagnitude: o
      };
    }
    default:
      return e;
  }
}
function Yo({ children: e }) {
  const [t, o] = Lo(jo, void 0, Ko), l = Jt(() => ({ state: t, dispatch: o }), [t, o]);
  return /* @__PURE__ */ D(eo.Provider, { value: l, children: e });
}
const Xo = {
  ...yt,
  colorPalette: [...yt.colorPalette]
};
function fr(e) {
  const { state: t } = _e(), o = t.definitions[e];
  if (!o) throw new Error(`Slider definition not found for id "${e}"`);
  return o;
}
function pr(e) {
  const { state: t } = _e(), o = t.sliders[e];
  if (!o) throw new Error(`Slider state not found for id "${e}"`);
  return o;
}
function hr() {
  const { state: e } = _e();
  return { columns: e.columns, customSliderId: e.customSliderId };
}
function mr() {
  const { state: e } = _e();
  return e;
}
function gr() {
  const { state: e } = _e();
  return e.selectionGridIds;
}
function wr(e) {
  const { state: t } = _e(), o = t.columns.find((l) => l.id === e);
  if (!o) throw new Error(`Slider column not found for id "${e}"`);
  return o;
}
function br() {
  const { dispatch: e } = _e();
  return Jt(() => ({
    setSliderValue: (t, o) => e({ type: "setValue", id: t, value: o }),
    setSliderColors: (t, o, l) => e({ type: "setColors", id: t, colorA: o, colorB: l }),
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
function Vo(e) {
  const { state: t, dispatch: o } = _e(), l = t.selectionGrids[e];
  return Oo(() => {
    l || o({ type: "registerSelectionGrid", id: e });
  }, [l, e, o]), l || Xo;
}
function Qo() {
  const { dispatch: e } = _e();
  return Jt(() => ({
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
function Jo() {
  return new xo();
}
const Zo = ["gradient", "terrainHeight"], er = {
  gradient: Do,
  terrainHeight: zo
}, yo = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews"
};
function tr(e) {
  const t = [...e];
  for (let o = t.length - 1; o > 0; o -= 1) {
    const l = Math.floor(Math.random() * (o + 1)), a = t[o];
    t[o] = t[l], t[l] = a;
  }
  return t;
}
function or(e, t) {
  return t ? e.slice().reverse().map((o) => ({
    ...o,
    stop: 100 - o.stop
  })) : e;
}
function rr(e, t, o, l, a, b) {
  const m = e.createLinearGradient(t, o, t + l, o);
  or(a, b).forEach((M) => {
    m.addColorStop(M.stop / 100, M.color);
  }), e.fillStyle = m, e.fillRect(t, o, l, l);
}
const Nt = Zt.map((e) => ({
  name: e.name,
  stops: e.stops,
  normal: Xt(e.stops, !1),
  inverted: Xt(e.stops, !0)
}));
function So({
  gridId: e = Vt,
  previewDarkMode: t,
  terrainAssets: o,
  layoutGap: l = "6px",
  colorA: a = Ro,
  colorB: b = Eo,
  allowEmptySelection: m = !1,
  maxHeightUnits: I = 24,
  fontSize: M,
  maxWidth: g = 360,
  className: H,
  style: k
}) {
  const [ce, x] = c.useState([]), [_, re] = c.useState({}), ie = Vo(e), J = Qo(), {
    squareScale: ct,
    squareAlignment: Lt,
    selectedIndex: fe,
    invertGradients: ae,
    allowEmptySelection: it,
    previewMode: ke
  } = ie, Ue = ke === "gradient" ? "plain" : "height", Ee = Ue !== "plain";
  c.useEffect(() => {
    let d = !1;
    if (!Ee) {
      x([]);
      return;
    }
    return (typeof o == "function" ? o() : Promise.resolve(o ?? [])).then((f) => {
      d || x(f);
    }).catch(() => {
      d || x([]);
    }), () => {
      d = !0;
    };
  }, [o, Ee]), c.useEffect(() => {
    if (!Ee) {
      re({});
      return;
    }
    const d = ce;
    if (d.length === 0) {
      re({});
      return;
    }
    const w = tr(d), f = w.length > 0 ? w : d, P = {};
    Nt.forEach((T, z) => {
      const K = f[z % f.length];
      P[T.name] = K;
    }), re(P);
  }, [ce, Ee]);
  const Ce = c.useMemo(() => Nt.map((d) => {
    const w = Ee ? _[d.name] : void 0, f = w?.url ?? "", P = w?.name ?? f.split("/").pop() ?? f;
    return {
      name: d.name,
      tile: P,
      tileUrl: f,
      normal: {
        paletteCss: [...d.normal.css],
        cssFallback: jt(d.stops, !1)
      },
      inverted: {
        paletteCss: [...d.inverted.css],
        cssFallback: jt(d.stops, !0)
      }
    };
  }), [_, Ee]), N = Ce.length, St = c.useRef(null), vt = c.useRef(null), Pe = c.useRef(null), Z = c.useRef(null), [at, Ze] = c.useState(360), [Ot, $] = c.useState(M ?? 16), U = c.useRef(null), Te = c.useRef(null), F = c.useRef(/* @__PURE__ */ new Map()), W = c.useRef(/* @__PURE__ */ new Set()), X = c.useRef(/* @__PURE__ */ new Set()), be = c.useRef([]), We = c.useRef(
    /* @__PURE__ */ new Map()
  ), qe = c.useRef(null), Le = c.useRef(null), et = c.useRef(null), Mt = c.useRef(0), He = c.useRef(null), dt = c.useRef(null), xt = c.useRef([]), Rt = c.useRef(() => {
  }), Ke = c.useCallback(() => {
    if (typeof window > "u") return;
    Mt.current += 1;
    const d = Mt.current;
    window.requestAnimationFrame(() => {
      d === Mt.current && Rt.current();
    });
  }, []), je = c.useCallback(() => {
    const d = Te.current;
    if (d)
      for (; W.current.size < Co && be.current.length > 0; ) {
        const w = be.current.shift();
        if (!w) break;
        if (X.current.delete(w), W.current.has(w)) continue;
        const f = We.current.get(w);
        f && (W.current.add(w), d.postMessage({
          type: "gradientTile",
          id: w,
          palette: f.palette,
          size: f.size,
          tileUrl: f.tileUrl
        }));
      }
  }, []);
  c.useEffect(() => {
    J.registerSelectionGrid(e, { allowEmptySelection: m });
  }, [e, m, J]), c.useEffect(() => {
    if (typeof window > "u") return;
    const d = Jo();
    Te.current = d, d.onmessage = (T) => {
      const { id: z, bitmap: K, error: Me } = T.data ?? {};
      if (!z) return;
      W.current.delete(z);
      const j = F.current.get(z);
      j?.bitmap && j.bitmap !== K && j.bitmap.close(), Me ? (F.current.set(z, { status: "error" }), K?.close()) : K && F.current.set(z, { status: "ready", bitmap: K }), je(), Ke();
    };
    const w = F.current, f = W.current, P = We.current;
    return () => {
      d.terminate(), Te.current = null, w.forEach((T) => T.bitmap?.close()), w.clear(), f.clear(), X.current.clear(), be.current = [], P.clear(), qe.current = null, Le.current = null, et.current = null, He.current = null, dt.current = null, xt.current = [];
    };
  }, [je, Ke]), c.useEffect(() => {
    m !== void 0 && it !== m && J.setSelectionGridAllowEmpty(e, m);
  }, [m, e, J, it]), c.useEffect(() => {
    const d = St.current;
    if (!d) return;
    const w = () => {
      const P = d.getBoundingClientRect();
      if (!P.width) return;
      const T = Math.round(P.width);
      Ze((z) => Math.abs(z - T) < 0.5 ? z : T);
    };
    w();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(w), f.observe(d)) : window.addEventListener("resize", w), () => {
      f?.disconnect(), window.removeEventListener("resize", w);
    };
  }, []), c.useEffect(() => {
    const d = vt.current;
    if (!d) return;
    const w = () => {
      const P = d.getBoundingClientRect();
      P.height && $((T) => Math.abs(T - P.height) < 0.5 ? T : P.height);
    };
    w();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(w), f.observe(d), () => {
      f?.disconnect();
    }) : (window.addEventListener("resize", w), () => {
      window.removeEventListener("resize", w);
    });
  }, [fe, ae, t, at, ke]);
  const C = c.useMemo(() => {
    if (fe == null || Ce[fe] === void 0) return null;
    const d = Ce[fe];
    return ae ? d.inverted.paletteCss : d.normal.paletteCss;
  }, [Ce, ae, fe]);
  c.useEffect(() => {
    if (!C) return;
    const d = C.join("|");
    d !== U.current && (U.current = d, J.setSelectionGridPalette(e, C));
  }, [e, C, J]);
  const Oe = M ?? 16, pe = 1, tt = 0.35, ye = Oe * tt, Et = Ot || Oe * pe, he = Math.max(
    Math.round(Et + ye * 2 + 2),
    // extra room for 1px borders
    Math.round(Oe + ye * 1.5)
  ), A = he * ct, R = at ? Math.max(1, Math.floor(at / A)) : 1, Se = R ? Math.ceil(N / R) : N, Fe = R >= N ? N : N % R || R, Ye = R > Fe ? R - Fe : 0, ut = R ? Math.floor((N - 1) / R) : 0, Xe = Ye > 0 ? Lt === "center" ? Ye * A / 2 : Lt === "right" ? Ye * A : 0 : 0, Ct = R * A, At = typeof I == "number" && Number.isFinite(I) && I > 0 ? I : null, _t = Se * ct, ot = At != null ? At * he : null, Ae = At != null && _t > At, ft = Se * A;
  c.useEffect(() => {
    Ke();
  }, [
    Ce,
    fe,
    ae,
    at,
    A,
    Ue,
    Xe,
    Ke
  ]), c.useEffect(() => {
    const d = Pe.current;
    if (!d) return;
    const w = () => Ke();
    return d.addEventListener("scroll", w, { passive: !0 }), () => d.removeEventListener("scroll", w);
  }, [Ke]), Rt.current = () => {
    const d = Z.current, w = Pe.current;
    if (!d || !w) return;
    const f = d.getContext("2d");
    if (!f) return;
    const P = Math.max(1, Math.round(Ct)), T = Math.max(1, Math.round(w.clientHeight || ft)), z = typeof window < "u" && window.devicePixelRatio || 1, K = Math.max(1, Math.round(P * z)), Me = Math.max(1, Math.round(T * z));
    if ((d.width !== K || d.height !== Me) && (d.width = K, d.height = Me, d.style.width = `${P}px`, d.style.height = `${T}px`), f.setTransform(z, 0, 0, z, 0, 0), f.clearRect(0, 0, P, T), N === 0) return;
    const j = w.scrollTop, De = Math.max(0, Math.floor(j / A) - 1), Ge = Math.min(Se - 1, Math.floor((j + T) / A) + 1), Ne = Math.max(1, Math.round(A * z)), gt = Ao(N, Ne), kt = Math.max(1, Math.ceil(N / gt)), r = new Array(N), n = /* @__PURE__ */ new Set();
    for (let i = 0; i < N; i += 1) {
      const u = Nt[i], h = Ce[i], y = ae ? u.inverted.data : u.normal.data, v = Ue === "height" && Ee && h.tileUrl ? Qt(h.tileUrl) : void 0, E = `${u.name}|${ae ? "inv" : "norm"}|${Ue}|${Ne}|${v ?? "plain"}`;
      r[i] = E, n.add(E), We.current.set(E, { palette: y, size: Ne, tileUrl: v });
    }
    const s = `${Ue}|${ae ? "inv" : "norm"}|${Ne}|${gt}|${r.join("|")}`;
    if (He.current !== s) {
      He.current = s, dt.current = null;
      const i = gt * Ne, u = kt * Ne, h = Io(i, u);
      qe.current = h, Le.current = h?.getContext("2d") ?? null, et.current = {
        key: s,
        columns: gt,
        rows: kt,
        tileSize: Ne
      }, xt.current = new Array(N).fill(""), Le.current && Le.current.clearRect(0, 0, i, u), F.current.forEach((y, v) => {
        n.has(v) || (y.bitmap?.close(), F.current.delete(v));
      }), W.current.forEach((y) => {
        n.has(y) || W.current.delete(y);
      }), be.current = be.current.filter((y) => n.has(y)), X.current = new Set(be.current), We.current.forEach((y, v) => {
        n.has(v) || We.current.delete(v);
      });
    }
    for (let i = De; i <= Ge; i += 1) {
      const u = i === ut ? Xe : 0, h = i === ut ? Fe : R, y = i * R, v = i * A - j;
      for (let E = 0; E < h; E += 1) {
        const B = y + E;
        if (B >= N) break;
        const xe = Nt[B], Ve = fe === B, O = B - R >= 0, ee = B + R < N, te = E > 0, $e = E < R - 1 && B + 1 < N && Math.floor((B + 1) / R) === i, oe = {
          tl: O || te ? 0 : Je,
          tr: O || $e ? 0 : Je,
          br: ee || $e ? 0 : Je,
          bl: ee || te ? 0 : Je
        }, de = u + E * A, ne = r[B], Re = qe.current, p = et.current, G = Le.current;
        let Y = xt.current[B] === ne;
        const L = F.current.get(ne);
        if (L?.status === "ready" && L.bitmap && G && p && !Y) {
          const q = B % p.columns * p.tileSize, V = Math.floor(B / p.columns) * p.tileSize;
          G.drawImage(L.bitmap, q, V, p.tileSize, p.tileSize), xt.current[B] = ne, Y = !0;
        }
        if (L || F.current.set(ne, { status: "loading" }), (!L || L.status === "loading") && !W.current.has(ne) && !X.current.has(ne) && (be.current.push(ne), X.current.add(ne)), Re && p && Y) {
          const q = B % p.columns * p.tileSize, V = Math.floor(B / p.columns) * p.tileSize;
          f.save(), lt(f, de, v, A, oe), f.clip(), f.drawImage(
            Re,
            q,
            V,
            p.tileSize,
            p.tileSize,
            de,
            v,
            A,
            A
          ), f.restore();
        } else
          f.save(), lt(f, de, v, A, oe), f.clip(), rr(f, de, v, A, xe.stops, ae), f.restore();
        Ve && (f.save(), f.strokeStyle = b, f.lineWidth = 2, lt(f, de + 1, v + 1, A - 2, oe), f.stroke(), f.restore());
      }
    }
    if (dt.current !== s) {
      dt.current = s;
      for (let i = 0; i < N; i += 1) {
        const u = r[i], h = F.current.get(u);
        h?.status === "ready" || h?.status === "error" || h?.status === "loading" || W.current.has(u) || X.current.has(u) || (be.current.push(u), X.current.add(u), F.current.set(u, { status: "loading" }));
      }
    }
    je();
  };
  const Wt = {
    width: "100%",
    maxWidth: typeof g == "number" ? `${g}px` : g,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: l,
    alignItems: "stretch",
    ...k ?? {}
  }, It = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)"
  ].join(", "), Gt = [
    "drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))",
    "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))"
  ].join(" "), pt = Math.max(Math.round(he - 4), Math.round(Oe + ye)), me = Math.max(8, Math.round((pt - 2) / (1 + tt * 2))), ve = Math.max(Math.round(pt * 0.6), 12), ze = {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    filter: Gt
  }, Ie = Zo.map((d) => ({
    value: d,
    icon: c.createElement(er[d], { size: ve, strokeWidth: 2 }),
    ariaLabel: yo[d],
    title: yo[d]
  })), ge = fe != null ? Zt[fe] : null, ht = ge ? jt(ge.stops, ae) : "transparent", we = ge ? ge.name : "None", mt = ge == null ? we : ae ? `<-${we}-<` : `>-${we}->`, Bt = (d) => {
    const w = Z.current, f = Pe.current;
    if (!w || !f) return;
    const P = w.getBoundingClientRect(), T = d.clientX - P.left, z = d.clientY - P.top + f.scrollTop;
    if (T < 0 || z < 0) return;
    const K = Math.floor(z / A);
    if (K < 0 || K >= Se) return;
    const Me = K === ut ? Xe : 0, j = K === ut ? Fe : R;
    if (T < Me || T > Me + j * A) return;
    const De = Math.floor((T - Me) / A);
    if (De < 0 || De >= j) return;
    const Ge = K * R + De;
    if (!(Ge < 0 || Ge >= N)) {
      if (fe === Ge) {
        it && J.setSelectionGridSelectedIndex(e, null);
        return;
      }
      J.setSelectionGridSelectedIndex(e, Ge);
    }
  };
  return /* @__PURE__ */ D("div", { ref: St, className: H, style: Wt, children: /* @__PURE__ */ D("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ Tt(
    "div",
    {
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: `${Ct}px`,
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
              background: ht,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${ye}px 8px`,
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
            onKeyDown: (d) => {
              (d.key === "Enter" || d.key === " ") && (d.preventDefault(), J.toggleSelectionGridInvert(e));
            },
            children: [
              /* @__PURE__ */ D(
                No,
                {
                  behavior: "cycle",
                  options: Ie,
                  value: ke,
                  fontSize: me,
                  colorA: a,
                  colorB: "transparent",
                  borderStyle: "none",
                  style: ze,
                  onChange: (d) => {
                    J.setSelectionGridPreviewMode(e, d);
                  },
                  onClick: (d) => {
                    d.stopPropagation();
                  },
                  onKeyDown: (d) => {
                    (d.key === "Enter" || d.key === " ") && d.stopPropagation();
                  }
                }
              ),
              /* @__PURE__ */ D(
                "div",
                {
                  ref: vt,
                  style: {
                    textAlign: "center",
                    fontSize: Oe,
                    lineHeight: pe,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: a,
                    textShadow: It,
                    userSelect: "none",
                    pointerEvents: "none"
                  },
                  children: mt
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ Tt(
          "div",
          {
            ref: Pe,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Ae && ot != null ? `${ot}px` : `${ft}px`,
              maxHeight: ot != null ? `${ot}px` : void 0,
              overflowY: Ae ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            children: [
              /* @__PURE__ */ D(
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
                  children: /* @__PURE__ */ D(
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
                      onPointerDown: Bt
                    }
                  )
                }
              ),
              /* @__PURE__ */ D("div", { style: { width: "100%", height: `${ft}px` } })
            ]
          }
        )
      ]
    }
  ) }) });
}
function yr(e) {
  return c.useContext(eo) ? /* @__PURE__ */ D(So, { ...e }) : /* @__PURE__ */ D(Yo, { children: /* @__PURE__ */ D(So, { ...e }) });
}
export {
  Vt as D,
  yr as G,
  Zt as M,
  ur as S,
  Yo as a,
  Xt as b,
  jt as c,
  Qo as d,
  gr as e,
  Vo as f,
  br as g,
  wr as h,
  fr as i,
  hr as j,
  pr as k,
  mr as l,
  _e as u
};
//# sourceMappingURL=SelectionGridGradient-CtSFvGfu.js.map
