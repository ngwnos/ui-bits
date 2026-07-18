"use strict";const G=require("react/jsx-runtime"),s=require("react"),dt=require("typegpu"),pt=require("./panelGap-C0MXgSjL.cjs"),mt=require("./SegmentBar-C3YGFdKe.cjs"),gt="var(--ui-bits-color-a, #2f2f2f)",bt="var(--ui-bits-color-b, #f0f0f0)",Ge="#ffffff",xt=1,vt=.35,Rt=1,Mt=6,ne=.4,oe=360,ce=512,De=8,Xe=8,Ye=12,wt=Ye*Float32Array.BYTES_PER_ELEMENT;let xe=null,re=null;async function _t(){return typeof navigator>"u"||!navigator.gpu?null:xe||(re||(re=dt.init().then(t=>(xe=t,t)).catch(t=>(console.error("ColorFieldPicker: TypeGPU init failed",t),re=null,null))),re)}function yt(){return`
const LUT_WIDTH : u32 = ${oe}u;
const LUT_HEIGHT : u32 = ${ce}u;
const OKLCH_MAX_CHROMA : f32 = ${ne};

@group(0) @binding(0) var<storage, read_write> lut : array<f32>;

fn oklchToLinearRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let hRad = h * 3.14159265359 / 180.0;
  let a = c * cos(hRad);
  let b = c * sin(hRad);
  let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = l - 0.0894841775 * a - 1.291485548 * b;
  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;
  return vec3<f32>(
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  );
}

fn isInGamut(l: f32, c: f32, h: f32) -> bool {
  let rgb = oklchToLinearRgb(l, c, h);
  let epsilon = 0.0001;
  return rgb.x >= -epsilon && rgb.x <= (1.0 + epsilon)
    && rgb.y >= -epsilon && rgb.y <= (1.0 + epsilon)
    && rgb.z >= -epsilon && rgb.z <= (1.0 + epsilon);
}

fn findMaxChroma(l: f32, h: f32, targetC: f32) -> f32 {
  if (isInGamut(l, targetC, h)) {
    return targetC;
  }
  var lo = 0.0;
  var hi = targetC;
  for (var i = 0u; i < 12u; i = i + 1u) {
    let mid = (lo + hi) * 0.5;
    if (isInGamut(l, mid, h)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

fn lutIndex(lIndex: u32, hIndex: u32) -> u32 {
  return lIndex * LUT_WIDTH + hIndex;
}

@compute @workgroup_size(${De}, ${Xe}, 1)
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let hIndex = gid.x;
  let lIndex = gid.y;
  if (hIndex >= LUT_WIDTH || lIndex >= LUT_HEIGHT) {
    return;
  }
  let l = f32(lIndex) / f32(LUT_HEIGHT - 1u);
  let h = f32(hIndex) / f32(LUT_WIDTH) * 360.0;
  lut[lutIndex(lIndex, hIndex)] = findMaxChroma(l, h, OKLCH_MAX_CHROMA);
}
`}function Ct(){return`
const LUT_WIDTH : u32 = ${oe}u;
const LUT_HEIGHT : u32 = ${ce}u;
const OKLCH_MAX_CHROMA : f32 = ${ne};
const EPSILON : f32 = 0.0001;

struct Uniforms {
  viewport : vec4<f32>,
  state0 : vec4<f32>,
  state1 : vec4<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> lut : array<f32>;

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0)
  );
  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );
  var out : VertexOutput;
  out.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
  out.uv = uvs[vertexIndex];
  return out;
}

fn clamp01(value: f32) -> f32 {
  return clamp(value, 0.0, 1.0);
}

fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3<f32> {
  let normalizedHue = h - 360.0 * floor(h / 360.0);
  let c = v * s;
  let hp = normalizedHue / 60.0;
  let x = c * (1.0 - abs((hp - 2.0 * floor(hp * 0.5)) - 1.0));
  var rgb = vec3<f32>(0.0, 0.0, 0.0);
  if (hp >= 0.0 && hp < 1.0) {
    rgb = vec3<f32>(c, x, 0.0);
  } else if (hp >= 1.0 && hp < 2.0) {
    rgb = vec3<f32>(x, c, 0.0);
  } else if (hp >= 2.0 && hp < 3.0) {
    rgb = vec3<f32>(0.0, c, x);
  } else if (hp >= 3.0 && hp < 4.0) {
    rgb = vec3<f32>(0.0, x, c);
  } else if (hp >= 4.0 && hp < 5.0) {
    rgb = vec3<f32>(x, 0.0, c);
  } else {
    rgb = vec3<f32>(c, 0.0, x);
  }
  let m = v - c;
  return rgb + vec3<f32>(m, m, m);
}

fn linearToSrgb(value: f32) -> f32 {
  let clamped = clamp(value, 0.0, 1.0);
  if (clamped <= 0.0031308) {
    return clamped * 12.92;
  }
  return 1.055 * pow(clamped, 1.0 / 2.4) - 0.055;
}

fn oklchToLinearRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let hRad = h * 3.14159265359 / 180.0;
  let a = c * cos(hRad);
  let b = c * sin(hRad);
  let l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = l - 0.0894841775 * a - 1.291485548 * b;
  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;
  return vec3<f32>(
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  );
}

fn oklchToRgb(l: f32, c: f32, h: f32) -> vec3<f32> {
  let linear = oklchToLinearRgb(l, c, h);
  return vec3<f32>(
    linearToSrgb(linear.x),
    linearToSrgb(linear.y),
    linearToSrgb(linear.z),
  );
}

fn lutIndex(lIndex: u32, hIndex: u32) -> u32 {
  return lIndex * LUT_WIDTH + hIndex;
}

fn sampleMaxChroma(l: f32, h: f32) -> f32 {
  let lScaled = clamp01(l) * f32(LUT_HEIGHT - 1u);
  let hWrapped = h - 360.0 * floor(h / 360.0);
  let hScaled = hWrapped / 360.0 * f32(LUT_WIDTH);

  let l0 = u32(floor(lScaled));
  let l1 = min(LUT_HEIGHT - 1u, l0 + 1u);
  let h0 = u32(floor(hScaled)) % LUT_WIDTH;
  let h1 = (h0 + 1u) % LUT_WIDTH;

  let tl = fract(lScaled);
  let th = fract(hScaled);

  let c00 = lut[lutIndex(l0, h0)];
  let c10 = lut[lutIndex(l0, h1)];
  let c01 = lut[lutIndex(l1, h0)];
  let c11 = lut[lutIndex(l1, h1)];

  let c0 = mix(c00, c10, th);
  let c1 = mix(c01, c11, th);
  return mix(c0, c1, tl);
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let width = max(1.0, uniforms.viewport.x);
  let height = max(1.0, uniforms.viewport.y);
  let barHeight = clamp(uniforms.viewport.z, 1.0, height);
  let mode = uniforms.viewport.w;

  let planeHeight = max(1.0, height - barHeight);
  let maxX = max(1.0, width - 1.0);
  let maxY = max(1.0, planeHeight - 1.0);

  let xPx = clamp(in.uv.x * width, 0.0, width - 1.0);
  let yPx = clamp(in.uv.y * height, 0.0, height - 1.0);
  let xRatio = xPx / maxX;
  let isBar = yPx >= planeHeight;

  var color = vec3<f32>(0.0, 0.0, 0.0);

  if (mode < 0.5) {
    if (isBar) {
      color = hsvToRgb(xRatio * 360.0, clamp01(uniforms.state1.y), clamp01(uniforms.state1.z));
    } else {
      let v = 1.0 - clamp01(yPx / maxY);
      color = hsvToRgb(uniforms.state1.w, xRatio, v);
    }
  } else if (mode < 1.5) {
    if (isBar) {
      color = vec3<f32>(
        clamp(uniforms.state0.z, 0.0, 255.0) / 255.0,
        clamp(uniforms.state0.w, 0.0, 255.0) / 255.0,
        xRatio,
      );
    } else {
      color = vec3<f32>(
        xRatio,
        1.0 - clamp01(yPx / maxY),
        clamp(uniforms.state1.x, 0.0, 255.0) / 255.0,
      );
    }
  } else {
    if (isBar) {
      let nextL = xRatio;
      let maxC = sampleMaxChroma(nextL, uniforms.state1.w);
      let mappedC = min(clamp(uniforms.state0.y, 0.0, OKLCH_MAX_CHROMA), maxC);
      color = oklchToRgb(nextL, mappedC, uniforms.state1.w);
    } else {
      let h = xRatio * 360.0;
      let row = floor(yPx);
      let rowC = clamp01(1.0 - row / maxY) * OKLCH_MAX_CHROMA;
      let rowCBelow = clamp01(1.0 - (row + 1.0) / maxY) * OKLCH_MAX_CHROMA;
      let maxC = sampleMaxChroma(clamp01(uniforms.state0.x), h);
      if (rowC <= maxC + EPSILON) {
        color = oklchToRgb(clamp01(uniforms.state0.x), rowC, h);
      } else if (rowCBelow <= maxC + EPSILON) {
        color = vec3<f32>(0.0, 0.0, 0.0);
      } else {
        color = oklchToRgb(clamp01(uniforms.state0.x), min(rowC, maxC), h);
      }
    }
  }

  return vec4<f32>(clamp(color, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
`}function ve(t){t&&(t.uniformBuffer.destroy(),t.lutBuffer.destroy(),t.width=0,t.height=0)}function Ht(t,i){if(typeof navigator>"u"||!navigator.gpu)return null;const a=i.getContext("webgpu");if(!a)return null;const o=navigator.gpu.getPreferredCanvasFormat();a.configure({device:t,format:o,alphaMode:"opaque"});const n=t.createBuffer({size:wt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),l=t.createBuffer({size:oe*ce*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE}),u=t.createShaderModule({code:yt()}),x=t.createShaderModule({code:Ct()}),p=t.createComputePipeline({layout:"auto",compute:{module:u,entryPoint:"cs_main"}}),m=t.createRenderPipeline({layout:"auto",vertex:{module:x,entryPoint:"vs_main"},fragment:{module:x,entryPoint:"fs_main",targets:[{format:o}]},primitive:{topology:"triangle-list"}}),v=t.createBindGroup({layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}}]}),y=t.createBindGroup({layout:m.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:l}}]}),A=t.createCommandEncoder(),T=A.beginComputePass();return T.setPipeline(p),T.setBindGroup(0,v),T.dispatchWorkgroups(Math.ceil(oe/De),Math.ceil(ce/Xe),1),T.end(),t.queue.submit([A.finish()]),{device:t,context:a,format:o,uniformBuffer:n,lutBuffer:l,computePipeline:p,renderPipeline:m,computeBindGroup:v,renderBindGroup:y,width:0,height:0}}function Tt(t){if(t!=null)return typeof t=="number"?`${t}px`:t}function Re(t){const i=t*(xt+vt*2);return Math.round(i+Rt*2)}function He(t){const i=t.trim(),a=/^#([0-9a-fA-F]{3})$/,o=/^#([0-9a-fA-F]{6})$/,n=i.match(a);return n?`#${n[1].split("").map(l=>l+l).join("")}`:o.test(i)?i:null}function Me(t){const i=He(t);if(!i)return null;const a=i.slice(1),o=parseInt(a.slice(0,2),16),n=parseInt(a.slice(2,4),16),l=parseInt(a.slice(4,6),16);return[o,n,l].some(u=>Number.isNaN(u))?null:{r:o,g:n,b:l}}function It(t){return Number.isFinite(t)?Math.min(16777215,Math.max(0,Math.round(t))):0}function Ie(t){return`#${It(t).toString(16).padStart(6,"0")}`}function Lt(t,i,a){const o=(t%360+360)%360,n=a*i,l=o/60,u=n*(1-Math.abs(l%2-1));let x=0,p=0,m=0;l>=0&&l<1?(x=n,p=u):l>=1&&l<2?(x=u,p=n):l>=2&&l<3?(p=n,m=u):l>=3&&l<4?(p=u,m=n):l>=4&&l<5?(x=u,m=n):l>=5&&l<6&&(x=n,m=u);const v=a-n;return{r:Math.round((x+v)*255),g:Math.round((p+v)*255),b:Math.round((m+v)*255)}}function we(t,i,a){const o=t/255,n=i/255,l=a/255,u=Math.max(o,n,l),x=Math.min(o,n,l),p=u-x;let m=0;const v=u,y=u===0?0:p/u;if(p!==0)switch(u){case o:m=((n-l)/p+(n<l?6:0))*60;break;case n:m=((l-o)/p+2)*60;break;default:m=((o-n)/p+4)*60;break}return{h:m,s:y,v}}function Ae(t,i,a){const o=Lt(t,i,a),n=o.r<<16|o.g<<8|o.b;return Ie(n)}function R(t){return Math.min(1,Math.max(0,t))}function _e(t){return Number.isFinite(t)?Math.min(255,Math.max(0,Math.round(t))):0}function ze(t,i,a){const o=_e(t),n=_e(i),l=_e(a),u=o<<16|n<<8|l;return Ie(u)}function ye(t){const i=t/255;return i<=.04045?i/12.92:Math.pow((i+.055)/1.055,2.4)}function Ce(t){const i=Math.min(1,Math.max(0,t));return i<=.0031308?i*12.92:1.055*Math.pow(i,1/2.4)-.055}function Ve(t,i,a){const o=ye(t),n=ye(i),l=ye(a),u=.4122214708*o+.5363325363*n+.0514459929*l,x=.2119034982*o+.6806995451*n+.1073969566*l,p=.0883024619*o+.2817188376*n+.6299787005*l,m=Math.cbrt(u),v=Math.cbrt(x),y=Math.cbrt(p),A=.2104542553*m+.793617785*v-.0040720468*y,T=1.9779984951*m-2.428592205*v+.4505937099*y,Y=.0259040371*m+.7827717662*v-.808675766*y,ie=Math.sqrt(T*T+Y*Y),le=(Math.atan2(Y,T)*180/Math.PI+360)%360;return{l:A,c:ie,h:le}}function Fe(t,i,a,o){const n=Ve(t,i,a);return n.c<.001?{...n,h:o}:n}function $e(t,i,a){const o=a*Math.PI/180,n=i*Math.cos(o),l=i*Math.sin(o),u=t+.3963377774*n+.2158037573*l,x=t-.1055613458*n-.0638541728*l,p=t-.0894841775*n-1.291485548*l,m=u*u*u,v=x*x*x,y=p*p*p;return{r:4.0767416621*m-3.3077115913*v+.2309699292*y,g:-1.2684380046*m+2.6097574011*v-.3413193965*y,b:-.0041960863*m-.7034186147*v+1.707614701*y}}function Te(t,i,a){const o=$e(t,i,a),n=1e-4;return o.r>=-n&&o.r<=1+n&&o.g>=-n&&o.g<=1+n&&o.b>=-n&&o.b<=1+n}function Pt(t,i,a){if(Te(t,a,i))return a;let o=0,n=a;for(let l=0;l<12;l+=1){const u=(o+n)/2;Te(t,u,i)?o=u:n=u}return o}function Ne(t,i,a){const o=$e(t,i,a);return{r:Math.round(Ce(o.r)*255),g:Math.round(Ce(o.g)*255),b:Math.round(Ce(o.b)*255)}}function kt(t,i,a){if(Te(t,i,a))return Ne(t,i,a);const o=Pt(t,a,i);return Ne(t,o,a)}function We(t,i,a){const o=kt(t,i,a),n=o.r<<16|o.g<<8|o.b;return Ie(n)}const qe=s.forwardRef((t,i)=>{const{value:a,defaultValue:o=Ge,onChange:n,mode:l,defaultMode:u="oklch",onModeChange:x,colorA:p,colorB:m,borderStyle:v,fontSize:y,heightUnits:A,width:T,className:Y,style:ie,...le}=t,q=pt.usePanelTheme(),se=p??q?.colorA??gt,ae=m??q?.colorB??bt,ue=v??q?.borderStyle??"a",P=y??q?.fontSize??12,Ke=Math.max(1,Math.round(A??Mt)),je=Tt(T),Le=He(o)??Ge,fe=a!==void 0,[Ze,Je]=s.useState(Le),z=He(fe?a??"":Ze)??Le,he=l!==void 0,[Qe,et]=s.useState(u),I=he?l:Qe,de=s.useRef(new Set),Pe=s.useCallback(e=>{const c=de.current;if(c.add(e),c.size>256){const r=c.values().next().value;r!==void 0&&c.delete(r)}},[]),S=s.useCallback((e,c)=>{c?.localInteraction&&Pe(e),fe||Je(e),n?.(e)},[fe,n,Pe]),tt=s.useCallback(e=>{he||et(e),x?.(e)},[he,x]),rt=Re(P)*Ke,nt=ue==="a"?se:ue==="b"?ae:"transparent",ot=Math.max(2,Math.round(P*.25)),V=typeof navigator<"u"&&!!navigator.gpu,[K,F]=s.useState(()=>V?"loading":"unsupported"),E=K==="ready",N=s.useRef(null),[j,ct]=s.useState(null),ke=s.useRef(null),Se=s.useRef(null),k=s.useRef(null),it=s.useRef(new Float32Array(Ye)),W=s.useRef(null),Z=s.useRef(null),$=s.useRef(!1),pe=s.useRef(null),J=s.useRef(null),Q=s.useRef(null),[ee,lt]=s.useState({width:0,height:0,barHeight:0}),te=s.useRef(ee),O=s.useRef(I),U=s.useRef(Me(z)??{r:255,g:255,b:255}),C=s.useRef(U.current),H=s.useRef(we(U.current.r,U.current.g,U.current.b)),w=s.useRef(Ve(U.current.r,U.current.g,U.current.b)),M=s.useCallback(()=>{typeof window>"u"||W.current===null&&(W.current=window.requestAnimationFrame(()=>{W.current=null,Z.current?.()}))},[]);s.useEffect(()=>{F(e=>V?e==="unsupported"?"loading":e:"unsupported")},[V]),s.useEffect(()=>{te.current=ee},[ee]);const Ee=s.useCallback(()=>{const e=ke.current,c=Se.current;if(!e||!c)return;const r=te.current;if(r.width<=0||r.height<=0){e.style.opacity="0",c.style.opacity="0";return}const f=O.current,h=Math.max(1,r.height-r.barHeight),d=f==="oklch"?R(w.current.h/360)*r.width:f==="rgb"?R(C.current.r/255)*r.width:R(H.current.s)*r.width,B=f==="oklch"?R(1-w.current.c/ne)*h:f==="rgb"?R(1-C.current.g/255)*h:R(1-H.current.v)*h,D=f==="oklch"?w.current.l:f==="rgb"?C.current.b/255:H.current.h/360,X=R(D)*r.width;e.style.left=`${d}px`,e.style.top=`${B}px`,e.style.opacity="1",c.style.left=`${X}px`,c.style.top=`${Math.max(1,r.height-r.barHeight)+r.barHeight/2}px`,c.style.opacity="1"},[]);s.useEffect(()=>{O.current=I,M()},[I,M]),s.useEffect(()=>{if($.current)return;const e=de.current;if(e.size>0&&e.has(z)){M();return}e.size>0&&e.clear();const c=Me(z);if(!c)return;const r=we(c.r,c.g,c.b);H.current=r,C.current=c;const f=Fe(c.r,c.g,c.b,w.current.h);w.current=f,M()},[z,M]);const Oe=s.useRef(I);s.useEffect(()=>{if(Oe.current===I)return;Oe.current=I;const e=Me(z);if(e){if(I==="oklch"){const c=Fe(e.r,e.g,e.b,w.current.h);w.current=c}else if(I==="rgb")C.current=e;else{const c=we(e.r,e.g,e.b);H.current=c}M()}},[I,z,M]);const me=s.useCallback(()=>{if(Ee(),typeof window>"u")return;const e=k.current,c=N.current;if(!e||!c)return;const r=te.current;if(r.width<=0||r.height<=0)return;const f=window.devicePixelRatio||1,h=Math.max(1,Math.round(r.width*f)),d=Math.max(1,Math.round(r.height*f)),B=Math.max(1,Math.round(r.barHeight*f));(c.width!==h||c.height!==d)&&(c.width=h,c.height=d),(e.width!==h||e.height!==d)&&(e.context.configure({device:e.device,format:e.format,alphaMode:"opaque"}),e.width=h,e.height=d);const D=O.current==="hsv"?0:O.current==="rgb"?1:2,X=O.current==="oklch"?w.current.h:O.current==="hsv"?H.current.h:0,b=it.current;b[0]=h,b[1]=d,b[2]=B,b[3]=D,b[4]=w.current.l,b[5]=w.current.c,b[6]=C.current.r,b[7]=C.current.g,b[8]=C.current.b,b[9]=H.current.s,b[10]=H.current.v,b[11]=X,e.device.queue.writeBuffer(e.uniformBuffer,0,b.buffer,b.byteOffset,b.byteLength);const g=e.device.createCommandEncoder(),L=g.beginRenderPass({colorAttachments:[{view:e.context.getCurrentTexture().createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});L.setPipeline(e.renderPipeline),L.setBindGroup(0,e.renderBindGroup),L.draw(6,1,0,0),L.end(),e.device.queue.submit([g.finish()])},[Ee]);s.useEffect(()=>(Z.current=me,()=>{Z.current===me&&(Z.current=null)}),[me]),s.useEffect(()=>{if(typeof window>"u")return;if(!V){F("unsupported");return}const e=j??N.current;if(!e)return;let c=!1,r=null;return F(h=>h==="ready"?h:"loading"),(async()=>{const h=await _t();if(c)return;if(!h){F("error");return}const d=Ht(h.device,e);if(c){ve(d);return}if(!d){F("error");return}r=d,k.current=d,F("ready"),M()})(),()=>{c=!0,k.current&&k.current===r&&(ve(k.current),k.current=null)}},[j,M,V]),s.useEffect(()=>{if(typeof window>"u")return;const e=j??N.current;if(!e)return;const c=()=>{const f=e.getBoundingClientRect(),h={width:f.width,height:f.height,barHeight:Re(P)};lt(d=>d.width===h.width&&d.height===h.height&&d.barHeight===h.barHeight?d:h),J.current=null,M()};c();let r=null;return typeof ResizeObserver<"u"&&(r=new ResizeObserver(c),r.observe(e)),window.addEventListener("resize",c),()=>{r?.disconnect(),window.removeEventListener("resize",c)}},[j,P,M]),s.useEffect(()=>{M()},[ee,M]),s.useEffect(()=>(()=>{typeof window<"u"&&W.current!==null&&window.cancelAnimationFrame(W.current),W.current=null,ve(k.current),k.current=null}),[]);const st=s.useCallback(e=>{N.current=e,ct(e)},[]),ge=s.useCallback(()=>{if(!N.current)return null;const e=N.current.getBoundingClientRect(),c=te.current.barHeight||Re(P),r=Math.max(1,e.height-c),f={left:e.left,top:e.top,width:e.width,height:e.height,planeHeight:r};return J.current=f,f},[P]),be=s.useCallback((e,c)=>{const r=J.current??ge();if(!r)return;const f=Math.min(Math.max(e-r.left,0),r.width),h=Math.min(Math.max(c-r.top,0),r.height),d=O.current,B=pe.current??(h>=r.planeHeight?"hue":"plane"),D=Math.round(f),X=Math.round(h),b=Q.current;if(!(b&&b.x===D&&b.y===X&&b.region===B&&b.mode===d)){if(Q.current={x:D,y:X,region:B,mode:d},B==="plane")if(d==="oklch"){const g=R(r.width>0?f/r.width:0),L=R(r.planeHeight>0?h/r.planeHeight:0),_={...w.current,h:g*360,c:(1-L)*ne};w.current=_,S(We(_.l,_.c,_.h),{localInteraction:!0})}else if(d==="rgb"){const g=R(r.width>0?f/r.width:0),L=R(r.planeHeight>0?h/r.planeHeight:0),_={...C.current,r:g*255,g:(1-L)*255};C.current=_,S(ze(_.r,_.g,_.b),{localInteraction:!0})}else{const g=R(r.width>0?f/r.width:0),L=R(r.planeHeight>0?h/r.planeHeight:0),_={...H.current,s:g,v:1-L};H.current=_,S(Ae(_.h,_.s,_.v),{localInteraction:!0})}else if(d==="oklch"){const g={...w.current,l:R(r.width>0?f/r.width:0)};w.current=g,S(We(g.l,g.c,g.h),{localInteraction:!0})}else if(d==="rgb"){const g={...C.current,b:R(r.width>0?f/r.width:0)*255};C.current=g,S(ze(g.r,g.g,g.b),{localInteraction:!0})}else{const g={...H.current,h:R(r.width>0?f/r.width:0)*360};H.current=g,S(Ae(g.h,g.s,g.v),{localInteraction:!0})}M()}},[ge,S,M]),at=e=>{if(!E||e.button!==0)return;const c=ge();if(!c)return;de.current.clear(),Q.current=null;const r=Math.min(Math.max(e.clientY-c.top,0),c.height);pe.current=r>=c.planeHeight?"hue":"plane",$.current=!0,e.currentTarget.setPointerCapture(e.pointerId),be(e.clientX,e.clientY)},ut=e=>{E&&$.current&&be(e.clientX,e.clientY)},Ue=(e,c)=>{if($.current){c&&E&&be(e.clientX,e.clientY),$.current=!1,pe.current=null,J.current=null,Q.current=null;try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}}},ft=e=>{Ue(e,!0)},ht=e=>{Ue(e,!1)},Be=K==="unsupported"?"WebGPU is required for this color picker.":K==="error"?"WebGPU initialization failed.":K==="loading"?"Initializing WebGPU...":null;return G.jsxs("div",{ref:i,className:["ui-bits-color-field-picker",Y].filter(Boolean).join(" "),style:{width:je,height:rt,borderRadius:ot,borderStyle:"solid",borderWidth:1,borderColor:nt,background:se,boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden",...ie??{}},...le,children:[G.jsx(mt.SegmentBar,{options:[{value:"hsv",label:"HSV"},{value:"rgb",label:"RGB"},{value:"oklch",label:"OKLCH"}],value:I,onChange:e=>tt(e),colorA:se,colorB:ae,borderStyle:ue,borderMask:{top:!1,left:!1,right:!1,bottom:!0},fontSize:P}),G.jsxs("div",{style:{flex:1,position:"relative",overflow:"hidden",touchAction:"none",cursor:E?"crosshair":"default"},onPointerDown:at,onPointerMove:ut,onPointerUp:ft,onPointerCancel:ht,children:[G.jsx("canvas",{ref:st,style:{display:"block",width:"100%",height:"100%",opacity:E?1:.5}}),G.jsx("div",{ref:ke,style:{position:"absolute",left:0,top:0,width:10,height:10,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.85)",boxShadow:"0 0 0 1px rgba(0,0,0,0.5)",transform:"translate(-50%, -50%)",pointerEvents:"none",opacity:0,display:E?"block":"none"}}),G.jsx("div",{ref:Se,style:{position:"absolute",left:0,top:0,width:10,height:10,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.85)",boxShadow:"0 0 0 1px rgba(0,0,0,0.5)",transform:"translate(-50%, -50%)",pointerEvents:"none",opacity:0,display:E?"block":"none"}}),Be?G.jsx("div",{role:"status","aria-live":"polite",style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",textAlign:"center",pointerEvents:"none",color:ae,background:"rgba(0,0,0,0.35)",fontSize:Math.max(10,Math.round(P*.9)),lineHeight:1.2},children:Be}):null]})]})});qe.displayName="ColorFieldPicker";exports.ColorFieldPicker=qe;
//# sourceMappingURL=ColorFieldPicker-DoIqKp7P.cjs.map
