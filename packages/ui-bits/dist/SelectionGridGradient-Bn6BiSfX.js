import { jsxs as Pt, jsx as L } from "react/jsx-runtime";
import c, { createContext as yo, useContext as Mo, useReducer as xo, useMemo as ao, useEffect as Ro } from "react";
import { F as Co } from "./Folder-B-XHBECm.js";
import { Mountain as Eo, Columns4 as Go } from "lucide-react";
import { I as Io } from "./IconButton-BvvMagK1.js";
function Ao(e) {
  const r = e.trim().replace("#", "");
  if (r.length !== 6)
    return [0, 0, 0];
  const s = Number.parseInt(r, 16);
  if (Number.isNaN(s)) return [0, 0, 0];
  const l = s >> 16 & 255, h = s >> 8 & 255, M = s & 255;
  return [l, h, M];
}
function uo(e, r) {
  const s = e.map((l) => ({
    ...l,
    rgb: Ao(l.color)
  }));
  return r ? s.slice().reverse().map((l) => ({
    ...l,
    stop: 100 - l.stop
  })) : s;
}
function Wt(e, r = !1) {
  return `linear-gradient(90deg, ${uo(e, r).map((h) => `${h.color} ${h.stop}%`).join(", ")})`;
}
function _t(e, r = !1) {
  const s = uo(e, r), l = new Uint8ClampedArray(256 * 4), h = new Array(256);
  for (let M = 0; M < s.length - 1; M += 1) {
    const g = s[M], $ = s[M + 1], C = Math.round(g.stop / 100 * 255), v = Math.round($.stop / 100 * 255), ye = Math.max(1, v - C);
    for (let U = C; U <= v; U += 1) {
      const Fe = (U - C) / ye, J = Math.round(g.rgb[0] + ($.rgb[0] - g.rgb[0]) * Fe), oe = Math.round(g.rgb[1] + ($.rgb[1] - g.rgb[1]) * Fe), Ne = Math.round(g.rgb[2] + ($.rgb[2] - g.rgb[2]) * Fe), pe = U * 4;
      l[pe] = J, l[pe + 1] = oe, l[pe + 2] = Ne, l[pe + 3] = 255, h[U] = `rgb(${J}, ${oe}, ${Ne})`;
    }
  }
  for (let M = 0; M < 256; M += 1) {
    const g = M * 4;
    if (h[M]) continue;
    if (!h.find((C) => C !== void 0))
      h[M] = "rgb(0, 0, 0)", l[g] = 0, l[g + 1] = 0, l[g + 2] = 0, l[g + 3] = 255;
    else {
      let C = M - 1;
      for (; C >= 0 && !h[C]; ) C -= 1;
      let v = M + 1;
      for (; v < 256 && !h[v]; ) v += 1;
      const ye = C >= 0 ? C : v, U = ye * 4;
      h[M] = h[ye], l[g] = l[U], l[g + 1] = l[U + 1], l[g + 2] = l[U + 2], l[g + 3] = 255;
    }
  }
  return { data: l, css: h };
}
const Kt = [
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
], Ut = "selection-grid", fo = '(function(){"use strict";const h=self;h.onmessage=n=>{const t=n.data;if(t){if(t.type==="imageTile"){w(t).catch(a=>{u(t.id,a)});return}t.type==="gradientTile"&&p(t).catch(a=>{u(t.id,a)})}};function u(n,t){const a=t instanceof Error?t.message:"Unknown worker error",e={id:n,error:a};h.postMessage(e)}async function w({id:n,src:t,size:a}){const e=await fetch(t,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch image (${e.status})`);const c=await e.blob(),r=await l(c,a),i={id:n,bitmap:r};h.postMessage(i,[r])}async function l(n,t){const a=await createImageBitmap(n);if(typeof OffscreenCanvas>"u"){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const e=new OffscreenCanvas(t,t),c=e.getContext("2d");if(!c){const s=await createImageBitmap(n,{resizeWidth:t,resizeHeight:t,resizeQuality:"high"});return a.close(),s}const r=Math.max(t/a.width,t/a.height),i=Math.round(a.width*r),f=Math.round(a.height*r),d=Math.round((t-i)/2),o=Math.round((t-f)/2);return c.clearRect(0,0,t,t),c.drawImage(a,d,o,i,f),a.close(),e.transferToImageBitmap()}async function p({id:n,palette:t,size:a,tileUrl:e}){const c=e?await y(e,t,a):await g(t,a),r={id:n,bitmap:c};h.postMessage(r,[c])}async function g(n,t){const a=new ImageData(t,t),e=a.data;for(let c=0;c<t;c+=1)for(let r=0;r<t;r+=1){const i=t<=1?0:r/(t-1),d=Math.min(255,Math.max(0,Math.round(i*255)))*4,o=(c*t+r)*4;e[o]=n[d],e[o+1]=n[d+1],e[o+2]=n[d+2],e[o+3]=255}return await createImageBitmap(a)}async function y(n,t,a){const e=await fetch(n,{cache:"force-cache"});if(!e.ok)throw new Error(`Failed to fetch terrain tile (${e.status})`);if(typeof OffscreenCanvas>"u")return await g(t,a);const c=await e.blob(),r=await createImageBitmap(c),i=new OffscreenCanvas(a,a),f=i.getContext("2d");if(!f)return await g(t,a);f.drawImage(r,0,0,a,a),r.close();const d=f.getImageData(0,0,a,a),o=d.data;for(let s=0;s<o.length;s+=4){const I=o[s],M=o[s+1],x=o[s+2],m=Math.round(.2126*I+.7152*M+.0722*x)*4;o[s]=t[m],o[s+1]=t[m+1],o[s+2]=t[m+2],o[s+3]=255}return f.putImageData(d,0,0),i.transferToImageBitmap()}})();\n//# sourceMappingURL=selectionGrid.worker-By4geu6o.js.map\n', co = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", fo], { type: "text/javascript;charset=utf-8" });
function po(e) {
  let r;
  try {
    if (r = co && (self.URL || self.webkitURL).createObjectURL(co), !r) throw "";
    const s = new Worker(r, {
      name: e?.name
    });
    return s.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(r);
    }), s;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(fo),
      {
        name: e?.name
      }
    );
  }
}
const Ve = 3, ho = "var(--ui-bits-color-a, #2f2f2f)", mo = "var(--ui-bits-color-b, #f0f0f0)", To = 4096, go = 6;
function st(e, r, s, l, h) {
  const M = l / 2, g = Math.min(M, Math.max(0, h.tl)), $ = Math.min(M, Math.max(0, h.tr)), C = Math.min(M, Math.max(0, h.br)), v = Math.min(M, Math.max(0, h.bl));
  e.beginPath(), e.moveTo(r + g, s), e.lineTo(r + l - $, s), $ > 0 ? e.quadraticCurveTo(r + l, s, r + l, s + $) : e.lineTo(r + l, s), e.lineTo(r + l, s + l - C), C > 0 ? e.quadraticCurveTo(r + l, s + l, r + l - C, s + l) : e.lineTo(r + l, s + l), e.lineTo(r + v, s + l), v > 0 ? e.quadraticCurveTo(r, s + l, r, s + l - v) : e.lineTo(r, s + l), e.lineTo(r, s + g), g > 0 ? e.quadraticCurveTo(r, s, r + g, s) : e.lineTo(r, s), e.closePath();
}
function qt(e, r) {
  const s = typeof window > "u" ? void 0 : window.location.href;
  if (!s) return e;
  try {
    return new URL(e, s).href;
  } catch {
    return e;
  }
}
function wo(e, r, s = To) {
  const l = Math.max(1, Math.floor(r)), h = Math.max(1, Math.floor(s)), M = Math.max(1, Math.floor(h / l)), g = Math.max(1, Math.floor(h / l));
  return e <= 0 ? 1 : Math.min(M, Math.max(1, Math.ceil(e / g)));
}
function vo(e, r) {
  if (typeof document > "u") return null;
  const s = document.createElement("canvas");
  return s.width = e, s.height = r, s;
}
function Po() {
  return new po();
}
function Xo(e) {
  const {
    items: r,
    folders: s,
    selectionSlots: l,
    getKey: h,
    getPreview: M,
    getLabel: g,
    selectedKey: $,
    defaultSelectedKey: C = null,
    onSelect: v,
    allowEmptySelection: ye = !1,
    squareScale: U = 1,
    squareAlignment: Fe = "left",
    colorA: J = ho,
    colorB: oe = mo,
    layoutGap: Ne = "6px",
    maxHeightUnits: pe = 24,
    fontSize: re,
    maxWidth: ct = 360,
    className: kt,
    style: le
  } = e, [ne, lt] = c.useState(C), [Ie, De] = c.useState({}), [Me, xe] = c.useState({}), [B, vt] = c.useState({}), St = c.useRef(null), Ae = $ !== void 0, Y = Ae ? $ ?? null : ne, it = Number.isFinite(U) && U > 0 ? U : 1, Qe = Fe ?? "left", zt = c.useMemo(() => r ?? [], [r]), O = c.useMemo(() => s ?? [], [s]), F = O.length > 0, Te = c.useMemo(() => l ?? [], [l]), k = Te.length > 0, N = c.useMemo(() => {
    const t = /* @__PURE__ */ new Map();
    return F && O.forEach((o) => {
      const n = Me[o.id] ?? [];
      n.length === 0 ? t.set(o.id, o.items) : t.set(o.id, [...o.items, ...n]);
    }), t;
  }, [Me, O, F]), q = c.useMemo(() => {
    if (F) {
      const t = [];
      let o = 0;
      return O.forEach((n) => {
        (N.get(n.id) ?? n.items).forEach((u) => {
          const p = h(u, o);
          t.push({ item: u, index: o, key: p }), o += 1;
        });
      }), t;
    }
    return zt.map((t, o) => ({
      item: t,
      index: o,
      key: h(t, o)
    }));
  }, [h, N, O, zt, F]), he = c.useMemo(
    () => q.map((t) => t.key),
    [q]
  );
  c.useEffect(() => {
    Ae || k || Y != null && (he.includes(Y) || lt(null));
  }, [he, Ae, Y, k]), c.useEffect(() => {
    F && De((t) => {
      let o = !1;
      const n = { ...t };
      return O.forEach((i) => {
        i.collapsed === void 0 && n[i.id] === void 0 && i.defaultCollapsed !== void 0 && (n[i.id] = i.defaultCollapsed, o = !0);
      }), o ? n : t;
    });
  }, [O, F]), c.useEffect(() => {
    k && vt((t) => {
      let o = !1;
      const n = { ...t };
      return Te.forEach((i) => {
        i.selectedKey === void 0 && n[i.id] === void 0 && i.defaultSelectedKey !== void 0 && (n[i.id] = i.defaultSelectedKey, o = !0);
      }), o ? n : t;
    });
  }, [Te, k]);
  const We = c.useRef(null), He = c.useRef(null), Pe = c.useRef(null), [Je, bt] = c.useState(360);
  c.useEffect(() => {
    const t = We.current;
    if (!t) return;
    const o = () => {
      const i = t.getBoundingClientRect();
      if (!i.width) return;
      const u = Math.round(i.width);
      bt((p) => Math.abs(p - u) < 0.5 ? p : u);
    };
    o();
    let n = null;
    return typeof ResizeObserver < "u" ? (n = new ResizeObserver(o), n.observe(t)) : window.addEventListener("resize", o), () => {
      n?.disconnect(), window.removeEventListener("resize", o);
    };
  }, [xe]);
  const _e = re ?? 16, at = 1, Mt = _e * 0.35, Ue = _e * at, qe = Math.max(
    Math.round(Ue + Mt * 2 + 2),
    Math.round(_e + Mt * 1.5)
  ), x = qe * it, ke = qe, ie = Je ? Math.max(1, Math.floor(Je / x)) : 1, Ze = ie * x, me = c.useMemo(() => {
    if (!F)
      return q.map((n) => ({ type: "item", ...n }));
    const t = [];
    let o = 0;
    return O.forEach((n) => {
      if (n.collapsed ?? Ie[n.id] ?? !1) {
        const p = N.get(n.id) ?? n.items;
        o += p.length;
        return;
      }
      (N.get(n.id) ?? n.items).forEach((p) => {
        const w = h(p, o);
        t.push({ type: "item", item: p, index: o, key: w }), o += 1;
      }), n.addTile && t.push({ type: "add", folderId: n.id, key: `add:${n.id}` });
    }), t;
  }, [q, h, Ie, N, O, F]), xt = c.useMemo(() => {
    if (!F)
      return q.map((n) => ({ type: "item", ...n }));
    const t = [];
    let o = 0;
    return O.forEach((n) => {
      (N.get(n.id) ?? n.items).forEach((u) => {
        const p = h(u, o);
        t.push({ type: "item", item: u, index: o, key: p }), o += 1;
      }), n.addTile && t.push({ type: "add", folderId: n.id, key: `add:${n.id}` });
    }), t;
  }, [q, h, N, O, F]), ae = me.length, R = xt.length, b = c.useMemo(() => {
    const t = [];
    let o = 0;
    if (!F) {
      for (let i = 0; i < ae; i += ie) {
        const u = Math.min(ie, ae - i), p = ie - u, w = p > 0 ? Qe === "center" ? p * x / 2 : Qe === "right" ? p * x : 0 : 0;
        t.push({
          type: "items",
          startIndex: i,
          count: u,
          alignmentOffsetPx: w,
          height: x,
          top: o
        }), o += x;
      }
      return t;
    }
    let n = 0;
    return O.forEach((i, u) => {
      if (t.push({
        type: "header",
        folderIndex: u,
        alignmentOffsetPx: 0,
        height: ke,
        top: o
      }), o += ke, i.collapsed ?? Ie[i.id] ?? !1) return;
      const S = (N.get(i.id) ?? i.items).length + (i.addTile ? 1 : 0);
      for (let y = 0; y < S; y += ie) {
        const G = Math.min(ie, S - y), Se = ie - G, Ye = Se > 0 ? Qe === "center" ? Se * x / 2 : Qe === "right" ? Se * x : 0 : 0;
        t.push({
          type: "items",
          startIndex: n + y,
          count: G,
          alignmentOffsetPx: Ye,
          height: x,
          top: o
        }), o += x;
      }
      n += S;
    }), t;
  }, [
    x,
    ae,
    ke,
    Ie,
    N,
    O,
    Qe,
    ie,
    F
  ]), ge = b.length, ze = ge > 0 ? b[ge - 1].top + b[ge - 1].height : 0, Ke = typeof pe == "number" && Number.isFinite(pe) && pe > 0 ? pe : null, ut = b.reduce((t, o) => t + o.height / qe, 0), je = Ke != null ? Ke * qe : null, Rt = Ke != null && ut > Ke, Bt = {
    width: "100%",
    maxWidth: typeof ct == "number" ? `${ct}px` : ct,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: Ne,
    alignItems: "stretch",
    ...le ?? {}
  }, et = (t, o, n) => {
    Ae || lt(t), v?.(t, o, n);
  }, Re = c.useMemo(
    () => Te.map((t) => ({
      ...t,
      selectedKey: t.selectedKey ?? B[t.id] ?? null
    })),
    [B, Te]
  ), tt = c.useMemo(() => {
    const t = /* @__PURE__ */ new Map();
    return Re.forEach((o) => {
      const n = o.selectedKey;
      n != null && (t.has(n) || t.set(n, { slotId: o.id, color: o.color }));
    }), t;
  }, [Re]), Ot = c.useCallback(
    (t, o, n, i) => {
      const u = Re.find((p) => p.id === t);
      u && (u.selectedKey === void 0 && vt((p) => {
        const w = { ...p, [t]: o };
        return o != null && Re.forEach((S) => {
          S.id !== t && S.selectedKey === void 0 && w[S.id] === o && (w[S.id] = null);
        }), w;
      }), o != null && (St.current = t), u.onSelect?.(o, n, i));
    },
    [Re]
  ), Ft = c.useCallback((t) => {
    if (t.length === 0) return null;
    const o = St.current;
    if (!o) return t[0] ?? null;
    const n = t.findIndex((u) => u.id === o);
    if (n === -1) return t[0] ?? null;
    const i = (n + 1) % t.length;
    return t[i] ?? null;
  }, []), Et = c.useRef(null), Gt = c.useRef(/* @__PURE__ */ new Map()), ft = c.useRef(/* @__PURE__ */ new Map()), ue = c.useRef(/* @__PURE__ */ new Map()), we = c.useRef(/* @__PURE__ */ new Set()), Le = c.useRef(/* @__PURE__ */ new Set()), Ce = c.useRef([]), fe = c.useRef(/* @__PURE__ */ new Map()), dt = c.useRef(null), de = c.useRef(null), pt = c.useRef(null), It = c.useRef(0), a = c.useRef(null), m = c.useRef(null), f = c.useRef([]), I = c.useRef(() => {
  }), A = c.useCallback((t, o) => {
    o ? Gt.current.set(t, o) : Gt.current.delete(t);
  }, []), z = c.useCallback((t) => {
    const o = Gt.current.get(t);
    o && o.click();
  }, []), W = c.useCallback((t, o) => {
    const n = t.addTile;
    if (!n || (n.onAdd?.(o), !n.createItem)) return;
    const i = Array.from(o), u = i.map((y) => URL.createObjectURL(y)), p = i.map((y, G) => n.createItem?.(y, u[G])).filter(Boolean), w = n.autoAppend !== !1, S = n.revokeObjectUrls ?? w;
    if (p.length > 0 && (n.onAddItems?.(p, i), w && xe((y) => ({
      ...y,
      [t.id]: [...y[t.id] ?? [], ...p]
    }))), S) {
      const y = ft.current.get(t.id) ?? /* @__PURE__ */ new Set();
      u.forEach((G) => y.add(G)), ft.current.set(t.id, y);
    }
  }, [xe]);
  c.useEffect(() => {
    const t = ft.current;
    return () => {
      t.forEach((o) => {
        o.forEach((n) => URL.revokeObjectURL(n));
      }), t.clear();
    };
  }, []);
  const ve = c.useMemo(() => {
    const t = /* @__PURE__ */ new Map();
    return O.forEach((o) => {
      t.set(o.id, {
        colorA: o.colorA ?? J,
        colorB: o.colorB ?? oe
      });
    }), t;
  }, [J, oe, O]), H = c.useCallback(() => {
    if (typeof window > "u") return;
    It.current += 1;
    const t = It.current;
    window.requestAnimationFrame(() => {
      t === It.current && I.current();
    });
  }, []), $e = c.useCallback(() => {
    const t = Et.current;
    if (t)
      for (; we.current.size < go && Ce.current.length > 0; ) {
        const o = Ce.current.shift();
        if (!o) break;
        if (Le.current.delete(o), we.current.has(o)) continue;
        const n = fe.current.get(o);
        n && (we.current.add(o), t.postMessage({
          type: "imageTile",
          id: o,
          src: n.src,
          size: n.size
        }));
      }
  }, []);
  c.useEffect(() => {
    if (typeof window > "u") return;
    const t = Po();
    Et.current = t, t.onmessage = (u) => {
      const { id: p, bitmap: w, error: S } = u.data ?? {};
      if (!p) return;
      we.current.delete(p);
      const y = ue.current.get(p);
      y?.bitmap && y.bitmap !== w && y.bitmap.close(), S ? (ue.current.set(p, { status: "error" }), w?.close()) : w && ue.current.set(p, { status: "ready", bitmap: w }), $e(), H();
    };
    const o = ue.current, n = we.current, i = fe.current;
    return () => {
      t.terminate(), Et.current = null, o.forEach((u) => u.bitmap?.close()), o.clear(), n.clear(), Le.current.clear(), Ce.current = [], i.clear(), dt.current = null, de.current = null, pt.current = null, a.current = null, m.current = null, f.current = [];
    };
  }, [$e, H]), c.useEffect(() => {
    H();
  }, [
    xt,
    me,
    Y,
    tt,
    Je,
    x,
    J,
    oe,
    ie,
    ge,
    ae,
    H
  ]), c.useEffect(() => {
    const t = He.current;
    if (!t) return;
    const o = () => H();
    return t.addEventListener("scroll", o, { passive: !0 }), () => t.removeEventListener("scroll", o);
  }, [H]);
  const Ee = (t) => {
    if (b.length === 0) return -1;
    let o = 0, n = b.length - 1;
    for (; o <= n; ) {
      const i = Math.floor((o + n) / 2), u = b[i];
      if (t < u.top)
        n = i - 1;
      else if (t >= u.top + u.height)
        o = i + 1;
      else
        return i;
    }
    return Math.max(0, Math.min(b.length - 1, o));
  };
  I.current = () => {
    const t = Pe.current, o = He.current;
    if (!t || !o) return;
    const n = t.getContext("2d");
    if (!n) return;
    const i = Math.max(1, Math.round(o.clientWidth || Ze)), u = Math.max(1, Math.round(o.clientHeight || ze)), p = Math.max(0, (i - Ze) / 2), w = typeof window < "u" && window.devicePixelRatio || 1, S = Math.max(1, Math.round(i * w)), y = Math.max(1, Math.round(u * w));
    if ((t.width !== S || t.height !== y) && (t.width = S, t.height = y, t.style.width = `${i}px`, t.style.height = `${u}px`), n.setTransform(w, 0, 0, w, 0, 0), n.clearRect(0, 0, i, u), ae === 0 && R === 0) return;
    const G = o.scrollTop, Se = Math.max(0, Ee(G) - 1), Ye = Math.min(ge - 1, Ee(G + u) + 1), P = Math.max(1, Math.round(x * w)), X = new Array(R), V = new Array(R), Oe = /* @__PURE__ */ new Map(), Q = /* @__PURE__ */ new Set();
    for (let d = 0; d < R; d += 1) {
      const E = xt[d];
      if (Oe.set(E.key, d), E.type === "add") {
        const T = ve.get(E.folderId);
        X[d] = { type: "color", color: T?.colorA ?? J }, V[d] = `add:${E.folderId}|${P}`;
        continue;
      }
      const _ = M(E.item, E.index);
      if (X[d] = _, _.type === "color")
        V[d] = `color:${_.color}`;
      else {
        const T = qt(_.src), D = `image:${T}|${P}`;
        V[d] = D, Q.add(D), fe.current.set(D, { src: T, size: P });
      }
    }
    const se = wo(Math.max(1, R), P), Z = Math.max(1, Math.ceil(Math.max(1, R) / se)), be = `${P}|${se}|${V.join("|")}`;
    if (a.current !== be) {
      if (a.current = be, m.current = null, R === 0)
        dt.current = null, de.current = null, pt.current = null, f.current = [];
      else {
        const d = se * P, E = Z * P, _ = vo(d, E);
        if (dt.current = _, de.current = _?.getContext("2d") ?? null, pt.current = {
          key: be,
          columns: se,
          rows: Z,
          tileSize: P
        }, f.current = new Array(R).fill(""), de.current) {
          de.current.clearRect(0, 0, d, E);
          for (let T = 0; T < R; T += 1) {
            const D = X[T];
            if (D.type !== "color") continue;
            const K = T % se * P, Ge = Math.floor(T / se) * P;
            de.current.fillStyle = D.color, de.current.fillRect(K, Ge, P, P), f.current[T] = V[T];
          }
        }
      }
      ue.current.forEach((d, E) => {
        Q.has(E) || (d.bitmap?.close(), ue.current.delete(E));
      }), we.current.forEach((d) => {
        Q.has(d) || we.current.delete(d);
      }), Ce.current = Ce.current.filter((d) => Q.has(d)), Le.current = new Set(Ce.current), fe.current.forEach((d, E) => {
        Q.has(E) || fe.current.delete(E);
      });
    }
    for (let d = Se; d <= Ye; d += 1) {
      const E = b[d];
      if (!E || E.type !== "items") continue;
      const _ = p + E.alignmentOffsetPx, T = E.count, D = E.startIndex, K = E.top - G;
      for (let Ge = 0; Ge < T; Ge += 1) {
        const Nt = D + Ge;
        if (Nt >= ae) break;
        const ot = me[Nt], Xt = ot?.key ?? String(Nt), rt = ot.type === "add", Vt = !rt && k ? tt.get(Xt) : null, bo = !rt && (k ? !!Vt : Y != null && Xt === Y), Qt = d > 0 ? b[d - 1] : null, Jt = d + 1 < b.length ? b[d + 1] : null, Zt = Qt?.type === "items" && Ge < Qt.count, eo = Jt?.type === "items" && Ge < Jt.count, to = Ge > 0, oo = Ge < T - 1, Lt = {
          tl: Zt || to ? 0 : Ve,
          tr: Zt || oo ? 0 : Ve,
          br: eo || oo ? 0 : Ve,
          bl: eo || to ? 0 : Ve
        }, mt = _ + Ge * x, ro = rt ? ve.get(ot.folderId) : null, ce = Oe.get(ot.key), nt = ce != null ? X[ce] : rt ? { type: "color", color: ro?.colorA ?? J } : M(ot.item, ot.index);
        let ee = ce != null ? V[ce] : "";
        if (!ee) {
          if (nt.type === "color")
            ee = `color:${nt.color}`;
          else if (rt)
            ee = `add:${ot.folderId}|${P}`;
          else if (nt.type === "image") {
            const j = qt(nt.src);
            ee = `image:${j}|${P}`, Q.add(ee), fe.current.set(ee, { src: j, size: P });
          }
        }
        const no = dt.current, te = pt.current, so = de.current;
        let Dt = ce != null && f.current[ce] === ee;
        if (!rt && nt.type === "image") {
          const j = ue.current.get(ee);
          if (j?.status === "ready" && j.bitmap && so && te && !Dt && ce != null) {
            const Xe = ce % te.columns * te.tileSize, gt = Math.floor(ce / te.columns) * te.tileSize;
            so.drawImage(j.bitmap, Xe, gt, te.tileSize, te.tileSize), f.current[ce] = ee, Dt = !0;
          }
          j || ue.current.set(ee, { status: "loading" }), (!j || j.status === "loading") && !we.current.has(ee) && !Le.current.has(ee) && (Ce.current.push(ee), Le.current.add(ee));
        }
        if (no && te && Dt && ce != null) {
          const j = ce % te.columns * te.tileSize, Xe = Math.floor(ce / te.columns) * te.tileSize;
          n.save(), st(n, mt, K, x, Lt), n.clip(), n.drawImage(
            no,
            j,
            Xe,
            te.tileSize,
            te.tileSize,
            mt,
            K,
            x,
            x
          ), n.restore();
        } else nt.type === "color" ? (st(n, mt, K, x, Lt), n.fillStyle = nt.color, n.fill()) : (st(n, mt, K, x, Lt), n.fillStyle = J, n.fill());
        if (bo && (n.save(), n.strokeStyle = k ? Vt?.color ?? oe : oe, n.lineWidth = 2, st(n, mt + 1, K + 1, x - 2, Lt), n.stroke(), n.restore()), rt) {
          const j = mt + x / 2, Xe = K + x / 2, gt = x * 0.22;
          n.save(), n.strokeStyle = ro?.colorB ?? oe, n.lineWidth = Math.max(1.5, x * 0.08), n.lineCap = "round", n.beginPath(), n.moveTo(j - gt, Xe), n.lineTo(j + gt, Xe), n.moveTo(j, Xe - gt), n.lineTo(j, Xe + gt), n.stroke(), n.restore();
        }
      }
    }
    if (m.current !== be) {
      m.current = be;
      for (let d = 0; d < ae; d += 1) {
        const E = me[d], _ = E ? Oe.get(E.key) : null;
        if (_ == null || X[_].type !== "image") continue;
        const D = V[_], K = ue.current.get(D);
        K?.status === "ready" || K?.status === "error" || K?.status === "loading" || we.current.has(D) || Le.current.has(D) || (Ce.current.push(D), Le.current.add(D), ue.current.set(D, { status: "loading" }));
      }
    }
    $e();
  };
  const Be = (t) => {
    const o = Pe.current, n = He.current;
    if (!o || !n) return;
    const i = o.getBoundingClientRect(), u = t.clientX - i.left, p = t.clientY - i.top + n.scrollTop;
    if (u < 0 || p < 0) return;
    const w = Ee(p);
    if (w < 0 || w >= ge) return;
    const S = b[w];
    if (!S || S.type !== "items") return;
    const y = n.clientWidth || Ze, Se = Math.max(0, (y - Ze) / 2) + S.alignmentOffsetPx, Ye = S.count;
    if (u < Se || u > Se + Ye * x) return;
    const P = Math.floor((u - Se) / x);
    if (P < 0 || P >= Ye) return;
    const X = S.startIndex + P;
    if (X < 0 || X >= me.length) return;
    const V = me[X];
    if (V.type === "add") {
      z(V.folderId);
      return;
    }
    const Oe = V.item, Q = V.key ?? String(X);
    if (k) {
      const Z = tt.get(Q);
      if (Z) {
        ye && Ot(Z.slotId, null, null, null);
        return;
      }
      const be = Re.find((d) => d.selectedKey == null) ?? Ft(Re);
      if (!be) return;
      Ot(be.id, Q, Oe, X);
      return;
    }
    if (Y != null && Q === Y) {
      ye && et(null, null, null);
      return;
    }
    et(Q, Oe, X);
  }, ht = c.useMemo(() => {
    if (k || !g || Y == null) return;
    const t = q.find((o) => o.key === Y);
    if (t)
      return g(t.item, t.index);
  }, [q, g, Y, k]), At = c.useMemo(() => F ? b.flatMap((t, o) => t.type === "header" ? [{ rowIndex: o, folderIndex: t.folderIndex, top: t.top, height: t.height }] : []) : [], [b, F]);
  return /* @__PURE__ */ Pt("div", { ref: We, className: kt, style: Bt, children: [
    /* @__PURE__ */ L("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ L(
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
        children: /* @__PURE__ */ Pt(
          "div",
          {
            ref: He,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Rt && je != null ? `${je}px` : `${ze}px`,
              maxHeight: je != null ? `${je}px` : void 0,
              overflowY: Rt ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            title: ht,
            children: [
              /* @__PURE__ */ L(
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
                  children: /* @__PURE__ */ L(
                    "canvas",
                    {
                      ref: Pe,
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
                      onPointerDown: Be
                    }
                  )
                }
              ),
              F && At.length > 0 && /* @__PURE__ */ L(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${ze}px`,
                    pointerEvents: "none",
                    zIndex: 2
                  },
                  children: At.map((t) => {
                    const o = O[t.folderIndex];
                    if (!o) return null;
                    const n = o.collapsed ?? Ie[o.id] ?? !1;
                    return /* @__PURE__ */ L(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          top: `${t.top}px`,
                          left: 0,
                          width: "100%",
                          height: `${t.height}px`,
                          pointerEvents: "auto"
                        },
                        children: /* @__PURE__ */ L(
                          Co,
                          {
                            label: o.label,
                            collapsed: n,
                            onCollapseChange: (i) => {
                              o.collapsed === void 0 && De((u) => ({ ...u, [o.id]: i })), o.onCollapseChange?.(i);
                            },
                            colorA: o.colorA ?? J,
                            colorB: o.colorB ?? oe,
                            borderStyle: o.borderStyle ?? "none",
                            fontSize: _e,
                            headerHeight: t.height,
                            padding: 0,
                            verticalGap: 0,
                            keepMounted: !1,
                            showBody: !1,
                            style: { height: `${t.height}px` }
                          }
                        )
                      },
                      `${o.id}-${t.rowIndex}`
                    );
                  })
                }
              ),
              /* @__PURE__ */ L("div", { style: { width: "100%", height: `${ze}px` } })
            ]
          }
        )
      }
    ) }),
    F && O.length > 0 && /* @__PURE__ */ L("div", { style: { display: "none" }, children: O.map((t) => t.addTile ? /* @__PURE__ */ L(
      "input",
      {
        ref: (o) => A(t.id, o),
        type: "file",
        accept: t.addTile.accept,
        multiple: t.addTile.multiple,
        "aria-label": typeof t.addTile.label == "string" ? t.addTile.label : "Add items",
        onChange: (o) => {
          const n = o.currentTarget.files;
          n && n.length > 0 && W(t, n), o.currentTarget.value = "";
        }
      },
      `add-input-${t.id}`
    ) : null) })
  ] });
}
const jt = yo(void 0);
function Yt() {
  const e = Mo(jt);
  if (!e) throw new Error("useSliderStore must be used within a SliderStoreProvider");
  return e;
}
const So = _t(Kt[0].stops, !1).css, wt = {
  selectedIndex: 0,
  squareScale: 1,
  squareAlignment: "left",
  invertGradients: !1,
  allowEmptySelection: !1,
  colorPalette: [...So],
  previewMode: "terrainHeight",
  sunAltitudeDeg: 45,
  sunAzimuthDeg: 315
};
function Ht(e, r) {
  return e.selectedIndex === r.selectedIndex && e.squareScale === r.squareScale && e.squareAlignment === r.squareAlignment && e.invertGradients === r.invertGradients && e.allowEmptySelection === r.allowEmptySelection && e.colorPalette.length === r.colorPalette.length && e.colorPalette.every((s, l) => s === r.colorPalette[l]) && e.previewMode === r.previewMode && e.sunAltitudeDeg === r.sunAltitudeDeg && e.sunAzimuthDeg === r.sunAzimuthDeg;
}
function Tt(e) {
  const r = (v) => Number.isFinite(v) ? Math.min(4, Math.max(1, Math.round(v))) : 1, s = (v) => Number.isFinite(v ?? Number.NaN) ? Math.min(90, Math.max(0, Number(v))) : wt.sunAltitudeDeg, l = (v) => Number.isFinite(v ?? Number.NaN) ? (Number(v) % 360 + 360) % 360 : wt.sunAzimuthDeg, h = (v) => v === "center" || v === "right" ? v : "left", M = (v) => v === "gradient" || v === "terrainHeight" ? v : v === "terrainHillshade" ? "terrainHeight" : typeof v == "boolean" ? v ? "terrainHeight" : "gradient" : "terrainHeight", g = e.previewMode, $ = e.useTerrainTiles, C = {
    selectedIndex: e.selectedIndex,
    squareScale: r(e.squareScale),
    squareAlignment: h(e.squareAlignment),
    invertGradients: !!e.invertGradients,
    allowEmptySelection: !!e.allowEmptySelection,
    colorPalette: Array.isArray(e.colorPalette) && e.colorPalette.length === 256 ? [...e.colorPalette] : [...So],
    previewMode: M(g ?? $),
    sunAltitudeDeg: s(e.sunAltitudeDeg),
    sunAzimuthDeg: l(e.sunAzimuthDeg)
  };
  return !C.allowEmptySelection && C.selectedIndex == null && (C.selectedIndex = 0), C;
}
function ko() {
  const e = {}, r = [];
  return e[Ut] = Tt({
    ...wt
  }), r.push(Ut), {
    selectionGrids: e,
    selectionGridIds: r
  };
}
function zo(e, r) {
  switch (r.type) {
    case "registerSelectionGrid": {
      const s = e.selectionGrids[r.id];
      if (s) {
        const h = Tt({ ...s, ...r.initialState ?? {} });
        return Ht(h, s) ? e : {
          ...e,
          selectionGrids: {
            ...e.selectionGrids,
            [r.id]: h
          }
        };
      }
      const l = Tt({ ...wt, ...r.initialState ?? {} });
      return {
        ...e,
        selectionGridIds: e.selectionGridIds.includes(r.id) ? e.selectionGridIds : [...e.selectionGridIds, r.id],
        selectionGrids: {
          ...e.selectionGrids,
          [r.id]: l
        }
      };
    }
    case "updateSelectionGrid": {
      const s = e.selectionGrids[r.id];
      if (!s) return e;
      const l = Tt({ ...s, ...r.patch });
      return Ht(l, s) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [r.id]: l
        }
      };
    }
    case "toggleSelectionGridInvert": {
      const s = e.selectionGrids[r.id];
      if (!s) return e;
      const l = { ...s, invertGradients: !s.invertGradients };
      return {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [r.id]: l
        }
      };
    }
    case "setSelectionGridPalette": {
      const s = e.selectionGrids[r.id];
      return !s || s.colorPalette.length === r.palette.length && s.colorPalette.every((l, h) => l === r.palette[h]) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [r.id]: {
            ...s,
            colorPalette: [...r.palette]
          }
        }
      };
    }
    case "setSelectionGridPreviewMode": {
      const s = e.selectionGrids[r.id];
      if (!s || s.previewMode === r.previewMode)
        return e;
      const l = Tt({ ...s, previewMode: r.previewMode });
      return Ht(l, s) ? e : {
        ...e,
        selectionGrids: {
          ...e.selectionGrids,
          [r.id]: l
        }
      };
    }
    default:
      return e;
  }
}
function Lo({ children: e }) {
  const [r, s] = xo(zo, void 0, ko), l = ao(() => ({ state: r, dispatch: s }), [r, s]);
  return /* @__PURE__ */ L(jt.Provider, { value: l, children: e });
}
const $o = {
  ...wt,
  colorPalette: [...wt.colorPalette]
};
function Vo() {
  const { state: e } = Yt();
  return e.selectionGridIds;
}
function Bo(e) {
  const { state: r, dispatch: s } = Yt(), l = r.selectionGrids[e];
  return Ro(() => {
    l || s({ type: "registerSelectionGrid", id: e });
  }, [l, e, s]), l || $o;
}
function Oo() {
  const { dispatch: e } = Yt();
  return ao(() => ({
    registerSelectionGrid: (r, s) => e({ type: "registerSelectionGrid", id: r, initialState: s }),
    setSelectionGridSelectedIndex: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { selectedIndex: s } }),
    setSelectionGridSquareScale: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { squareScale: s } }),
    setSelectionGridAlignment: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { squareAlignment: s } }),
    setSelectionGridAllowEmpty: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { allowEmptySelection: s } }),
    setSelectionGridInvert: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { invertGradients: s } }),
    toggleSelectionGridInvert: (r) => e({ type: "toggleSelectionGridInvert", id: r }),
    setSelectionGridPreviewMode: (r, s) => e({ type: "setSelectionGridPreviewMode", id: r, previewMode: s }),
    setSelectionGridPalette: (r, s) => e({ type: "setSelectionGridPalette", id: r, palette: s }),
    setSelectionGridSunAltitude: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { sunAltitudeDeg: s } }),
    setSelectionGridSunAzimuth: (r, s) => e({ type: "updateSelectionGrid", id: r, patch: { sunAzimuthDeg: s } })
  }), [e]);
}
function Fo() {
  return new po();
}
const No = ["gradient", "terrainHeight"], Do = {
  gradient: Go,
  terrainHeight: Eo
}, lo = {
  gradient: "Gradient previews",
  terrainHeight: "Terrain height previews"
};
function Wo(e) {
  const r = [...e];
  for (let s = r.length - 1; s > 0; s -= 1) {
    const l = Math.floor(Math.random() * (s + 1)), h = r[s];
    r[s] = r[l], r[l] = h;
  }
  return r;
}
function Ho(e, r) {
  return r ? e.slice().reverse().map((s) => ({
    ...s,
    stop: 100 - s.stop
  })) : e;
}
function _o(e, r, s, l, h, M) {
  const g = e.createLinearGradient(r, s, r + l, s);
  Ho(h, M).forEach((C) => {
    g.addColorStop(C.stop / 100, C.color);
  }), e.fillStyle = g, e.fillRect(r, s, l, l);
}
const $t = Kt.map((e) => ({
  name: e.name,
  stops: e.stops,
  normal: _t(e.stops, !1),
  inverted: _t(e.stops, !0)
}));
function io({
  gridId: e = Ut,
  previewDarkMode: r,
  terrainAssets: s,
  layoutGap: l = "6px",
  colorA: h = ho,
  colorB: M = mo,
  allowEmptySelection: g = !1,
  maxHeightUnits: $ = 24,
  fontSize: C,
  maxWidth: v = 360,
  className: ye,
  style: U
}) {
  const [Fe, J] = c.useState([]), [oe, Ne] = c.useState({}), pe = Bo(e), re = Oo(), {
    squareScale: ct,
    squareAlignment: kt,
    selectedIndex: le,
    invertGradients: ne,
    allowEmptySelection: lt,
    previewMode: Ie
  } = pe, De = Ie === "gradient" ? "plain" : "height", Me = De !== "plain";
  c.useEffect(() => {
    let a = !1;
    if (!Me) {
      J([]);
      return;
    }
    return (typeof s == "function" ? s() : Promise.resolve(s ?? [])).then((f) => {
      a || J(f);
    }).catch(() => {
      a || J([]);
    }), () => {
      a = !0;
    };
  }, [s, Me]), c.useEffect(() => {
    if (!Me) {
      Ne({});
      return;
    }
    const a = Fe;
    if (a.length === 0) {
      Ne({});
      return;
    }
    const m = Wo(a), f = m.length > 0 ? m : a, I = {};
    $t.forEach((A, z) => {
      const W = f[z % f.length];
      I[A.name] = W;
    }), Ne(I);
  }, [Fe, Me]);
  const xe = c.useMemo(() => $t.map((a) => {
    const m = Me ? oe[a.name] : void 0, f = m?.url ?? "", I = m?.name ?? f.split("/").pop() ?? f;
    return {
      name: a.name,
      tile: I,
      tileUrl: f,
      normal: {
        paletteCss: [...a.normal.css],
        cssFallback: Wt(a.stops, !1)
      },
      inverted: {
        paletteCss: [...a.inverted.css],
        cssFallback: Wt(a.stops, !0)
      }
    };
  }), [oe, Me]), B = xe.length, vt = c.useRef(null), St = c.useRef(null), Ae = c.useRef(null), Y = c.useRef(null), [it, Qe] = c.useState(360), [zt, O] = c.useState(C ?? 16), F = c.useRef(null), Te = c.useRef(null), k = c.useRef(/* @__PURE__ */ new Map()), N = c.useRef(/* @__PURE__ */ new Set()), q = c.useRef(/* @__PURE__ */ new Set()), he = c.useRef([]), We = c.useRef(
    /* @__PURE__ */ new Map()
  ), He = c.useRef(null), Pe = c.useRef(null), Je = c.useRef(null), bt = c.useRef(0), _e = c.useRef(null), at = c.useRef(null), yt = c.useRef([]), Mt = c.useRef(() => {
  }), Ue = c.useCallback(() => {
    if (typeof window > "u") return;
    bt.current += 1;
    const a = bt.current;
    window.requestAnimationFrame(() => {
      a === bt.current && Mt.current();
    });
  }, []), qe = c.useCallback(() => {
    const a = Te.current;
    if (a)
      for (; N.current.size < go && he.current.length > 0; ) {
        const m = he.current.shift();
        if (!m) break;
        if (q.current.delete(m), N.current.has(m)) continue;
        const f = We.current.get(m);
        f && (N.current.add(m), a.postMessage({
          type: "gradientTile",
          id: m,
          palette: f.palette,
          size: f.size,
          tileUrl: f.tileUrl
        }));
      }
  }, []);
  c.useEffect(() => {
    re.registerSelectionGrid(e, { allowEmptySelection: g });
  }, [e, g, re]), c.useEffect(() => {
    if (typeof window > "u") return;
    const a = Fo();
    Te.current = a, a.onmessage = (A) => {
      const { id: z, bitmap: W, error: ve } = A.data ?? {};
      if (!z) return;
      N.current.delete(z);
      const H = k.current.get(z);
      H?.bitmap && H.bitmap !== W && H.bitmap.close(), ve ? (k.current.set(z, { status: "error" }), W?.close()) : W && k.current.set(z, { status: "ready", bitmap: W }), qe(), Ue();
    };
    const m = k.current, f = N.current, I = We.current;
    return () => {
      a.terminate(), Te.current = null, m.forEach((A) => A.bitmap?.close()), m.clear(), f.clear(), q.current.clear(), he.current = [], I.clear(), He.current = null, Pe.current = null, Je.current = null, _e.current = null, at.current = null, yt.current = [];
    };
  }, [qe, Ue]), c.useEffect(() => {
    g !== void 0 && lt !== g && re.setSelectionGridAllowEmpty(e, g);
  }, [g, e, re, lt]), c.useEffect(() => {
    const a = vt.current;
    if (!a) return;
    const m = () => {
      const I = a.getBoundingClientRect();
      if (!I.width) return;
      const A = Math.round(I.width);
      Qe((z) => Math.abs(z - A) < 0.5 ? z : A);
    };
    m();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(m), f.observe(a)) : window.addEventListener("resize", m), () => {
      f?.disconnect(), window.removeEventListener("resize", m);
    };
  }, []), c.useEffect(() => {
    const a = St.current;
    if (!a) return;
    const m = () => {
      const I = a.getBoundingClientRect();
      I.height && O((A) => Math.abs(A - I.height) < 0.5 ? A : I.height);
    };
    m();
    let f = null;
    return typeof ResizeObserver < "u" ? (f = new ResizeObserver(m), f.observe(a), () => {
      f?.disconnect();
    }) : (window.addEventListener("resize", m), () => {
      window.removeEventListener("resize", m);
    });
  }, [le, ne, r, it, Ie]);
  const x = c.useMemo(() => {
    if (le == null || xe[le] === void 0) return null;
    const a = xe[le];
    return ne ? a.inverted.paletteCss : a.normal.paletteCss;
  }, [xe, ne, le]);
  c.useEffect(() => {
    if (!x) return;
    const a = x.join("|");
    a !== F.current && (F.current = a, re.setSelectionGridPalette(e, x));
  }, [e, x, re]);
  const ke = C ?? 16, ie = 1, Ze = 0.35, me = ke * Ze, xt = zt || ke * ie, ae = Math.max(
    Math.round(xt + me * 2 + 2),
    // extra room for 1px borders
    Math.round(ke + me * 1.5)
  ), R = ae * ct, b = it ? Math.max(1, Math.floor(it / R)) : 1, ge = b ? Math.ceil(B / b) : B, ze = b >= B ? B : B % b || b, Ke = b > ze ? b - ze : 0, ut = b ? Math.floor((B - 1) / b) : 0, je = Ke > 0 ? kt === "center" ? Ke * R / 2 : kt === "right" ? Ke * R : 0 : 0, Rt = b * R, Ct = typeof $ == "number" && Number.isFinite($) && $ > 0 ? $ : null, Bt = ge * ct, et = Ct != null ? Ct * ae : null, Re = Ct != null && Bt > Ct, tt = ge * R;
  c.useEffect(() => {
    Ue();
  }, [
    xe,
    le,
    ne,
    it,
    R,
    De,
    je,
    Ue
  ]), c.useEffect(() => {
    const a = Ae.current;
    if (!a) return;
    const m = () => Ue();
    return a.addEventListener("scroll", m, { passive: !0 }), () => a.removeEventListener("scroll", m);
  }, [Ue]), Mt.current = () => {
    const a = Y.current, m = Ae.current;
    if (!a || !m) return;
    const f = a.getContext("2d");
    if (!f) return;
    const I = Math.max(1, Math.round(Rt)), A = Math.max(1, Math.round(m.clientHeight || tt)), z = typeof window < "u" && window.devicePixelRatio || 1, W = Math.max(1, Math.round(I * z)), ve = Math.max(1, Math.round(A * z));
    if ((a.width !== W || a.height !== ve) && (a.width = W, a.height = ve, a.style.width = `${I}px`, a.style.height = `${A}px`), f.setTransform(z, 0, 0, z, 0, 0), f.clearRect(0, 0, I, A), B === 0) return;
    const H = m.scrollTop, $e = Math.max(0, Math.floor(H / R) - 1), Ee = Math.min(ge - 1, Math.floor((H + A) / R) + 1), Be = Math.max(1, Math.round(R * z)), ht = wo(B, Be), At = Math.max(1, Math.ceil(B / ht)), t = new Array(B), o = /* @__PURE__ */ new Set();
    for (let i = 0; i < B; i += 1) {
      const u = $t[i], p = xe[i], w = ne ? u.inverted.data : u.normal.data, S = De === "height" && Me && p.tileUrl ? qt(p.tileUrl) : void 0, y = `${u.name}|${ne ? "inv" : "norm"}|${De}|${Be}|${S ?? "plain"}`;
      t[i] = y, o.add(y), We.current.set(y, { palette: w, size: Be, tileUrl: S });
    }
    const n = `${De}|${ne ? "inv" : "norm"}|${Be}|${ht}|${t.join("|")}`;
    if (_e.current !== n) {
      _e.current = n, at.current = null;
      const i = ht * Be, u = At * Be, p = vo(i, u);
      He.current = p, Pe.current = p?.getContext("2d") ?? null, Je.current = {
        key: n,
        columns: ht,
        rows: At,
        tileSize: Be
      }, yt.current = new Array(B).fill(""), Pe.current && Pe.current.clearRect(0, 0, i, u), k.current.forEach((w, S) => {
        o.has(S) || (w.bitmap?.close(), k.current.delete(S));
      }), N.current.forEach((w) => {
        o.has(w) || N.current.delete(w);
      }), he.current = he.current.filter((w) => o.has(w)), q.current = new Set(he.current), We.current.forEach((w, S) => {
        o.has(S) || We.current.delete(S);
      });
    }
    for (let i = $e; i <= Ee; i += 1) {
      const u = i === ut ? je : 0, p = i === ut ? ze : b, w = i * b, S = i * R - H;
      for (let y = 0; y < p; y += 1) {
        const G = w + y;
        if (G >= B) break;
        const Se = $t[G], Ye = le === G, P = G - b >= 0, X = G + b < B, V = y > 0, Oe = y < b - 1 && G + 1 < B && Math.floor((G + 1) / b) === i, Q = {
          tl: P || V ? 0 : Ve,
          tr: P || Oe ? 0 : Ve,
          br: X || Oe ? 0 : Ve,
          bl: X || V ? 0 : Ve
        }, se = u + y * R, Z = t[G], be = He.current, d = Je.current, E = Pe.current;
        let _ = yt.current[G] === Z;
        const T = k.current.get(Z);
        if (T?.status === "ready" && T.bitmap && E && d && !_) {
          const D = G % d.columns * d.tileSize, K = Math.floor(G / d.columns) * d.tileSize;
          E.drawImage(T.bitmap, D, K, d.tileSize, d.tileSize), yt.current[G] = Z, _ = !0;
        }
        if (T || k.current.set(Z, { status: "loading" }), (!T || T.status === "loading") && !N.current.has(Z) && !q.current.has(Z) && (he.current.push(Z), q.current.add(Z)), be && d && _) {
          const D = G % d.columns * d.tileSize, K = Math.floor(G / d.columns) * d.tileSize;
          f.save(), st(f, se, S, R, Q), f.clip(), f.drawImage(
            be,
            D,
            K,
            d.tileSize,
            d.tileSize,
            se,
            S,
            R,
            R
          ), f.restore();
        } else
          f.save(), st(f, se, S, R, Q), f.clip(), _o(f, se, S, R, Se.stops, ne), f.restore();
        Ye && (f.save(), f.strokeStyle = M, f.lineWidth = 2, st(f, se + 1, S + 1, R - 2, Q), f.stroke(), f.restore());
      }
    }
    if (at.current !== n) {
      at.current = n;
      for (let i = 0; i < B; i += 1) {
        const u = t[i], p = k.current.get(u);
        p?.status === "ready" || p?.status === "error" || p?.status === "loading" || N.current.has(u) || q.current.has(u) || (he.current.push(u), q.current.add(u), k.current.set(u, { status: "loading" }));
      }
    }
    qe();
  };
  const Ft = {
    width: "100%",
    maxWidth: typeof v == "number" ? `${v}px` : v,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: l,
    alignItems: "stretch",
    ...U ?? {}
  }, Et = [
    "0 0 4px rgba(0, 0, 0, 0.7)",
    "0 1px 3px rgba(0, 0, 0, 0.85)"
  ].join(", "), Gt = [
    "drop-shadow(0 0 4px rgba(0, 0, 0, 0.7))",
    "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))"
  ].join(" "), ft = Math.max(Math.round(ae - 4), Math.round(ke + me)), ue = Math.max(8, Math.round((ft - 2) / (1 + Ze * 2))), we = Math.max(Math.round(ft * 0.6), 12), Le = {
    position: "absolute",
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    filter: Gt
  }, Ce = No.map((a) => ({
    value: a,
    icon: c.createElement(Do[a], { size: we, strokeWidth: 2 }),
    ariaLabel: lo[a],
    title: lo[a]
  })), fe = le != null ? Kt[le] : null, dt = fe ? Wt(fe.stops, ne) : "transparent", de = fe ? fe.name : "None", pt = fe == null ? de : ne ? `<-${de}-<` : `>-${de}->`, It = (a) => {
    const m = Y.current, f = Ae.current;
    if (!m || !f) return;
    const I = m.getBoundingClientRect(), A = a.clientX - I.left, z = a.clientY - I.top + f.scrollTop;
    if (A < 0 || z < 0) return;
    const W = Math.floor(z / R);
    if (W < 0 || W >= ge) return;
    const ve = W === ut ? je : 0, H = W === ut ? ze : b;
    if (A < ve || A > ve + H * R) return;
    const $e = Math.floor((A - ve) / R);
    if ($e < 0 || $e >= H) return;
    const Ee = W * b + $e;
    if (!(Ee < 0 || Ee >= B)) {
      if (le === Ee) {
        lt && re.setSelectionGridSelectedIndex(e, null);
        return;
      }
      re.setSelectionGridSelectedIndex(e, Ee);
    }
  };
  return /* @__PURE__ */ L("div", { ref: vt, className: ye, style: Ft, children: /* @__PURE__ */ L("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ Pt(
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
        /* @__PURE__ */ Pt(
          "div",
          {
            style: {
              width: "100%",
              borderRadius: 3,
              boxSizing: "border-box",
              background: dt,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `${me}px 8px`,
              minHeight: `${ae}px`,
              position: "relative"
            },
            "aria-label": "Selected gradient preview",
            role: "button",
            tabIndex: 0,
            "aria-pressed": ne,
            onClick: () => {
              re.toggleSelectionGridInvert(e);
            },
            onKeyDown: (a) => {
              (a.key === "Enter" || a.key === " ") && (a.preventDefault(), re.toggleSelectionGridInvert(e));
            },
            children: [
              /* @__PURE__ */ L(
                Io,
                {
                  behavior: "cycle",
                  options: Ce,
                  value: Ie,
                  fontSize: ue,
                  colorA: h,
                  colorB: "transparent",
                  borderStyle: "none",
                  style: Le,
                  onChange: (a) => {
                    re.setSelectionGridPreviewMode(e, a);
                  },
                  onClick: (a) => {
                    a.stopPropagation();
                  },
                  onKeyDown: (a) => {
                    (a.key === "Enter" || a.key === " ") && a.stopPropagation();
                  }
                }
              ),
              /* @__PURE__ */ L(
                "div",
                {
                  ref: St,
                  style: {
                    textAlign: "center",
                    fontSize: ke,
                    lineHeight: ie,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    color: h,
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
        /* @__PURE__ */ Pt(
          "div",
          {
            ref: Ae,
            className: "selection-grid__scroll",
            style: {
              position: "relative",
              width: "100%",
              height: Re && et != null ? `${et}px` : `${tt}px`,
              maxHeight: et != null ? `${et}px` : void 0,
              overflowY: Re ? "auto" : "hidden",
              msOverflowStyle: "none",
              scrollbarWidth: "none"
            },
            children: [
              /* @__PURE__ */ L(
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
                  children: /* @__PURE__ */ L(
                    "canvas",
                    {
                      ref: Y,
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
              /* @__PURE__ */ L("div", { style: { width: "100%", height: `${tt}px` } })
            ]
          }
        )
      ]
    }
  ) }) });
}
function Qo(e) {
  return c.useContext(jt) ? /* @__PURE__ */ L(io, { ...e }) : /* @__PURE__ */ L(Lo, { children: /* @__PURE__ */ L(io, { ...e }) });
}
export {
  Ut as D,
  Qo as G,
  Kt as M,
  Xo as S,
  Lo as a,
  _t as b,
  Wt as c,
  Oo as d,
  Vo as e,
  Bo as f,
  Yt as u
};
//# sourceMappingURL=SelectionGridGradient-Bn6BiSfX.js.map
