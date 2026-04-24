"use strict";const b=require("react/jsx-runtime"),e=require("react"),st=require("lucide-react"),Ke=require("./animationSuspension-CaeFoamB.cjs"),Me=require("./LFOSlider-Dv5OaOtq.cjs"),jt=require("./frameLoop-BQNqp_Qp.cjs"),Lt=require("./flexoki-BtN-1xqJ.cjs"),fn=require("./panelGap-C0MXgSjL.cjs"),Vt=require("./IconButton-CqkPHVvp.cjs"),dn=require("./SegmentBar-BflaPbZe.cjs"),mn=require("typegpu"),Wt=require("./hooks-CPN0v2jj.cjs");let Rt=null,it=null;const pn=[.16,.47,.86],hn=[.02,.02,.04],Ht=24,xn=Ht*Float32Array.BYTES_PER_ELEMENT,Le=64,gn=.2,bn=4,vt=12,zt=.01,Mn=20,yn=80,Nt=(t,o,n)=>Math.max(o,Math.min(n,t)),Ot=(t,o)=>{if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:Math.max(0,Math.min(1,1-Math.exp(-d/n)))};async function Rn(){return navigator.gpu?Rt||(it||(it=mn.init().then(t=>(Rt=t,t)).catch(t=>(console.error("AudioFFTWindow: TypeGPU init failed",t),it=null,null))),it):null}function Ue(t){return Number.parseInt(t,16)/255}function qt(t,o=[0,0,0]){if(!t)return o;const n=t.trim();if(n.startsWith("#")){if(n.length===7)return[Ue(n.slice(1,3)),Ue(n.slice(3,5)),Ue(n.slice(5,7))];if(n.length===4)return[Ue(n[1]+n[1]),Ue(n[2]+n[2]),Ue(n[3]+n[3])]}return o}function vn(t){const o=t.createShaderModule({code:`
struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
  discreteMode : f32,
  rawBinCount : f32,
  frequencyMin : f32,
  frequencyMax : f32,
};

@group(0) @binding(0) var<storage, read> rawFft : array<f32>;
@group(0) @binding(1) var stateSrc : texture_storage_2d<rgba32float, read>;
@group(0) @binding(2) var stateDst : texture_storage_2d<rgba32float, write>;
@group(0) @binding(3) var<uniform> uniforms : Uniforms;

fn sampleRaw(position : f32) -> f32 {
  let maxIndex = max(0.0, uniforms.rawBinCount - 1.0);
  if (maxIndex <= 0.0) {
    return rawFft[0];
  }
  let clamped = clamp(position, 0.0, maxIndex);
  let lower = i32(floor(clamped));
  let upper = min(i32(maxIndex), lower + 1);
  let t = clamped - f32(lower);
  let lowerValue = rawFft[lower];
  let upperValue = rawFft[upper];
  return mix(lowerValue, upperValue, t);
}

@compute @workgroup_size(${Le})
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let binCount = max(1.0, uniforms.binCount);
  let index = gid.x;
  if (f32(index) >= binCount) {
    return;
  }
  let maxRawIndex = max(0.0, uniforms.rawBinCount - 1.0);
  if (maxRawIndex <= 0.0) {
    textureStore(stateDst, vec2<i32>(i32(index), 0), vec4<f32>(0.0, 0.0, 0.0, 0.0));
    return;
  }
  let minPos = uniforms.frequencyMin * maxRawIndex;
  let maxPos = uniforms.frequencyMax * maxRawIndex;
  var ratio = 0.5;
  if (binCount > 1.0) {
    ratio = f32(index) / (binCount - 1.0);
  }
  let position = mix(minPos, maxPos, ratio);
  let binSpan = max(1.0, binCount - 1.0);
  let deltaPos = (maxPos - minPos) / binSpan;
  var current = sampleRaw(position);
  if (uniforms.blurSigma > 0.001) {
    let radius = min(${vt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${vt}; offset = offset + 1) {
        if (offset > radius) { continue; }
        let distance = f32(offset);
        let weight = exp(-(distance * distance) / (2.0 * uniforms.blurSigma * uniforms.blurSigma));
        let delta = distance * deltaPos;
        accum = accum + sampleRaw(position + delta) * weight;
        accum = accum + sampleRaw(position - delta) * weight;
        weightSum = weightSum + 2.0 * weight;
      }
      current = accum / max(weightSum, 1e-4);
    }
  }
  let coord = vec2<i32>(i32(index), 0);
  let previous = textureLoad(stateSrc, coord);
  let prevValue = previous.x;
  let prevPeak = previous.y;
  let holdTimer = previous.z;
  let fallTimer = previous.w;
  let weight = select(uniforms.releaseWeight, uniforms.attackWeight, current >= prevValue);
  let smoothed = prevValue + (current - prevValue) * weight;
  var nextPeak = prevPeak;
  var nextHold = holdTimer;
  var nextFall = fallTimer;
  if (smoothed >= prevPeak) {
    nextPeak = smoothed;
    nextHold = uniforms.holdSeconds;
    nextFall = 0.0;
  } else if (holdTimer > 0.0) {
    nextHold = max(0.0, holdTimer - uniforms.deltaSeconds);
    nextFall = 0.0;
  } else {
    let elapsed = fallTimer + uniforms.deltaSeconds;
    nextFall = elapsed;
    let accel = 1.0 + uniforms.gravity * elapsed;
    let drop = uniforms.peakDecay * accel * uniforms.deltaSeconds;
    nextPeak = max(0.0, prevPeak - drop);
  }
  textureStore(stateDst, coord, vec4<f32>(smoothed, nextPeak, nextHold, nextFall));
}
`}),n=t.createShaderModule({code:`
const MAX_RADIUS : i32 = ${vt};

struct Uniforms {
  binCount : f32,
  playback : f32,
  blurSigma : f32,
  binStep : f32,
  colorActive : vec4<f32>,
  colorInactive : vec4<f32>,
  attackWeight : f32,
  releaseWeight : f32,
  deltaSeconds : f32,
  gravity : f32,
  peakDecay : f32,
  holdSeconds : f32,
  discreteMode : f32,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var stateTexture : texture_storage_2d<rgba32float, read>;

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

fn sampleStateNormalized(u : f32) -> vec2<f32> {
  let bins = max(1.0, uniforms.binCount);
  let maxIndex = max(0.0, bins - 1.0);
  let clamped = clamp(u, 0.0, 1.0);
  if (uniforms.discreteMode > 0.5 || maxIndex <= 0.0) {
    let scaled = clamp(floor(clamped * bins), 0.0, maxIndex);
    let discreteIdx = i32(scaled);
    return textureLoad(stateTexture, vec2<i32>(discreteIdx, 0)).xy;
  }
  let scaled = clamped * maxIndex;
  let lower = i32(floor(scaled));
  let upper = i32(min(maxIndex, f32(lower) + 1.0));
  let frac = scaled - f32(lower);
  let lowerSample = textureLoad(stateTexture, vec2<i32>(lower, 0)).xy;
  let upperSample = textureLoad(stateTexture, vec2<i32>(upper, 0)).xy;
  return lowerSample + (upperSample - lowerSample) * frac;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let normalizedX = in.uv.x;
  let sample = sampleStateNormalized(normalizedX);
  let amplitude = sample.x;
  let peak = sample.y;
  let y = 1.0 - in.uv.y;
  let edgeMask = smoothstep(amplitude - 0.01, amplitude, y);
  let activeMask = 1.0 - edgeMask;
  let activeColor = uniforms.colorActive.xyz;
  let inactiveColor = uniforms.colorInactive.xyz;
  var color = mix(inactiveColor, activeColor, activeMask);
  if (uniforms.playback >= 0.0 && uniforms.playback <= 1.0) {
    let playhead = uniforms.playback;
    let lineWidth = 0.004;
    let distance = abs(normalizedX - playhead);
    let lineFeather = smoothstep(lineWidth * 0.5, lineWidth, distance);
    let lineMask = 1.0 - lineFeather;
    let invertedColor = mix(activeColor, inactiveColor, activeMask);
    color = mix(color, invertedColor, lineMask);
  }
  if (peak > 0.01) {
    let peakY = clamp(peak, 0.0, 1.0);
    let peakLine = 1.0 - smoothstep(0.0, 0.01, abs(y - peakY));
    color = mix(color, activeColor, peakLine);
  }
  return vec4<f32>(color, 1.0);
}
`});return{computeModule:o,renderModule:n}}function Dt(t,o){return t.createTexture({size:[o,1,1],format:"rgba32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})}function wn(t){t&&(t.uniformBuffer.destroy(),t.rawBuffer.destroy(),t.stateTextures[0].destroy(),t.stateTextures[1].destroy())}function Cn(t,o,n,d){const M=o.getContext("webgpu");if(!M)return null;const u=navigator.gpu.getPreferredCanvasFormat();M.configure({device:t,format:u,alphaMode:"opaque"});const{computeModule:i,renderModule:C}=vn(t),m=t.createBuffer({size:xn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),B=t.createBuffer({size:Math.max(1,d)*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),x=[Dt(t,n),Dt(t,n)],l=x.map(y=>y.createView({dimension:"2d"})),f=t.createComputePipeline({layout:"auto",compute:{module:i,entryPoint:"cs_main"}}),F=t.createRenderPipeline({layout:"auto",vertex:{module:C,entryPoint:"vs_main"},fragment:{module:C,entryPoint:"fs_main",targets:[{format:u}]},primitive:{topology:"triangle-list"}}),k=f.getBindGroupLayout(0),P=F.getBindGroupLayout(0),V=[t.createBindGroup({layout:k,entries:[{binding:0,resource:{buffer:B}},{binding:1,resource:l[0]},{binding:2,resource:l[1]},{binding:3,resource:{buffer:m}}]}),t.createBindGroup({layout:k,entries:[{binding:0,resource:{buffer:B}},{binding:1,resource:l[1]},{binding:2,resource:l[0]},{binding:3,resource:{buffer:m}}]})],z=[t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[0]}]}),t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[1]}]})],L=Math.max(1,Math.ceil(n/Le));return{context:M,format:u,uniformBuffer:m,rawBuffer:B,rawCapacity:Math.max(1,d),stateTextures:x,stateStorageViews:l,computePipeline:f,renderPipeline:F,computeBindGroups:V,renderBindGroups:z,workgroupCount:L,binCapacity:n}}function Xt({heightUnits:t=6,unitSizePx:o,maxWidth:n,maxBins:d=1024,playbackRatio:M=0,showPlaybackIndicator:u=!0,onScrubStart:i,onScrub:C,onScrubEnd:m,activeColor:B,inactiveColor:x,peakDecay:l=.05,rawFftDataRef:f,rawFrameVersion:F,rawBinCount:k=0,attackMs:P=Mn,releaseMs:V=yn,blurSigma:z=0,discreteBins:L=!0,frequencyMin:y=0,frequencyMax:O=1,suspended:q}){const $=e.useRef(null),K=e.useRef(null),ne=e.useRef(null),[Q,X]=e.useState(()=>typeof navigator<"u"&&!!navigator.gpu),[E,D]=e.useState({width:480,height:Math.max(1,t)*o}),[de,me]=e.useState(()=>Math.max(1,Math.ceil(Math.max(1,Math.floor(d))/Le)*Le)),[pe,be]=e.useState(()=>Math.max(1,k||1)),J=e.useRef(Math.max(0,Math.min(1,M))),ce=e.useRef(Math.max(0,z)),le=e.useRef(Math.max(0,P)),re=e.useRef(Math.max(0,V)),oe=e.useRef(Math.max(5e-4,l)),j=e.useRef(L?1:0),R=e.useRef(Math.max(0,Math.min(1,y))),I=e.useRef(Math.max(0,Math.min(1,O))),_=e.useRef(Math.max(1,Math.floor(d))),p=e.useRef(!1),h=e.useRef(typeof performance<"u"?performance.now():Date.now()),g=e.useRef(new Float32Array(Ht)),a=e.useRef(null),s=e.useRef(0),A=e.useRef(null),v=e.useRef(null),W=e.useRef(null),H=Ke.useAnimationSuspended(q),ae=e.useRef(H),U=e.useRef({active:!1,pointerId:null}),Ae=e.useMemo(()=>qt(B,pn),[B]),Z=e.useMemo(()=>qt(x,hn),[x]),Re=e.useRef(Ae),Te=e.useRef(Z);e.useEffect(()=>{if(ae.current=H,H){v.current!==null&&(cancelAnimationFrame(v.current),v.current=null),h.current=typeof performance<"u"?performance.now():Date.now();return}W.current?.()},[H]),e.useEffect(()=>{J.current=Math.max(0,Math.min(1,M))},[M]),e.useEffect(()=>{ce.current=Math.max(0,z)},[z]),e.useEffect(()=>{le.current=Math.max(0,P)},[P]),e.useEffect(()=>{re.current=Math.max(0,V)},[V]),e.useEffect(()=>{oe.current=Math.max(5e-4,l)},[l]),e.useEffect(()=>{j.current=L?1:0},[L]),e.useEffect(()=>{R.current=Nt(y,0,Math.min(1,O-zt))},[y,O]),e.useEffect(()=>{I.current=Nt(O,Math.min(1,y+zt),1)},[O,y]),e.useEffect(()=>{p.current=!0},[y,O,d]),e.useEffect(()=>{_.current=Math.max(1,Math.floor(d));const c=Math.max(1,Math.ceil(_.current/Le)*Le);me(w=>w===c?w:c)},[d]),e.useEffect(()=>{!k||k<=0||be(c=>k>c?Math.max(k,c):c)},[k]),e.useEffect(()=>{p.current=!0},[F]),e.useEffect(()=>{Re.current=Ae},[Ae]),e.useEffect(()=>{Te.current=Z},[Z]),e.useEffect(()=>{const c=Math.max(1,t)*o;D(w=>({width:w.width,height:c}))},[t,o]),e.useEffect(()=>{const c=K.current;if(!c)return;const w=()=>{const he=c.getBoundingClientRect();he.width&&D(Fe=>({width:Math.round(he.width),height:Fe.height}))};w();const Y=typeof ResizeObserver<"u"?new ResizeObserver(w):null;return Y?Y.observe(c):window.addEventListener("resize",w),()=>{Y?.disconnect(),Y||window.removeEventListener("resize",w)}},[]);const se=e.useCallback(c=>{const w=K.current;if(!w)return null;const Y=w.getBoundingClientRect();if(!Y.width)return null;const he=(c-Y.left)/Y.width;return Math.max(0,Math.min(1,he))},[]),pt=e.useCallback(c=>{if(!C&&!m&&!i)return;const w=se(c.clientX);w!=null&&(U.current={active:!0,pointerId:c.pointerId},c.currentTarget.setPointerCapture(c.pointerId),c.preventDefault(),i?.(),C?.(w))},[se,C,m,i]),ht=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;const w=se(c.clientX);w!=null&&(c.preventDefault(),C?.(w))},[se,C]),Be=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const w=se(c.clientX);w!=null&&m?.(w)},[se,m]),Qe=e.useCallback(c=>{if(U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const w=se(c.clientX);w!=null&&m?.(w)},[se,m]);e.useEffect(()=>{if(!Q)return;let c=!1;async function w(){const Y=await Rn();if(!Y||c){Y||X(!1);return}const he=$.current;if(!he)return;const Fe=Cn(Y.device,he,de,pe);if(!Fe){X(!1);return}a.current=Fe,s.current=0,p.current=!0;const Ne=Oe=>{if(c)return;if(ae.current){v.current=null,h.current=Oe;return}const qe=Y.device,De=qe.queue,ee=a.current;if(!ee)return;const fe=$.current;if(!fe)return;const Ge=window.devicePixelRatio||1,Ze=Math.max(1,Math.floor(E.width*Ge)),Je=Math.max(1,Math.floor(E.height*Ge));(fe.width!==Ze||fe.height!==Je)&&(fe.width=Ze,fe.height=Je),fe.style.width!==`${Math.round(E.width)}px`&&(fe.style.width=`${Math.round(E.width)}px`),fe.style.height!==`${Math.round(E.height)}px`&&(fe.style.height=`${Math.round(E.height)}px`);const N=Math.max(5e-4,(Oe-h.current)/1e3);h.current=Oe;const $e=Math.max(1,_.current),je=$e>1?1/($e-1):1,S=g.current,We=Math.max(1,k||0);if(S[0]=$e,S[1]=u?J.current:-1,S[2]=ce.current,S[3]=je,S[4]=Re.current[0],S[5]=Re.current[1],S[6]=Re.current[2],S[7]=1,S[8]=Te.current[0],S[9]=Te.current[1],S[10]=Te.current[2],S[11]=1,S[12]=Ot(le.current,N),S[13]=Ot(re.current,N),S[14]=N,S[15]=bn,S[16]=oe.current,S[17]=gn,S[18]=j.current,S[19]=We,S[20]=R.current,S[21]=I.current,S[22]=0,S[23]=0,De.writeBuffer(ee.uniformBuffer,0,S.buffer,S.byteOffset,S.byteLength),p.current&&f?.current){const ie=f.current,xe=ee.rawCapacity;(!A.current||A.current.length!==xe)&&(A.current=new Float32Array(xe));const Ee=A.current,et=Math.min(xe,ie.length);for(let te=0;te<et;te+=1)Ee[te]=ie[te]/255;for(let te=et;te<xe;te+=1)Ee[te]=0;De.writeBuffer(ee.rawBuffer,0,Ee.buffer,Ee.byteOffset,Ee.byteLength),p.current=!1}const Ie=qe.createCommandEncoder();if(f?.current){const ie=Ie.beginComputePass(),xe=ee.computeBindGroups[s.current];ie.setPipeline(ee.computePipeline),ie.setBindGroup(0,xe),ie.dispatchWorkgroups(ee.workgroupCount,1,1),ie.end(),s.current=s.current===0?1:0}const ke=ee.context.getCurrentTexture().createView(),Pe=Ie.beginRenderPass({colorAttachments:[{view:ke,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});Pe.setPipeline(ee.renderPipeline);const gt=ee.renderBindGroups[s.current];Pe.setBindGroup(0,gt),Pe.draw(6,1,0,0),Pe.end(),De.submit([Ie.finish()]),v.current=requestAnimationFrame(Ne)};W.current=()=>{c||v.current!==null||(h.current=typeof performance<"u"?performance.now():Date.now(),v.current=requestAnimationFrame(Ne))},ae.current||W.current()}return w(),()=>{c=!0,v.current!==null&&(cancelAnimationFrame(v.current),v.current=null),W.current=null,wn(a.current),a.current=null}},[Q,E.width,E.height,de,pe,f,k,u]);const Ve=typeof n=="number"?`${n}px`:n??"100%",xt=Math.round(E.width),ze=Math.round(E.height);return b.jsx("div",{ref:K,className:"audio-fft-window",style:{width:"100%",maxWidth:Ve},children:b.jsxs("div",{className:"audio-fft-window__canvas-wrapper",style:{width:"100%",height:`${ze}px`,position:"relative",overflow:"hidden",background:"transparent"},children:[Q?b.jsx("canvas",{ref:$,width:xt,height:ze,style:{width:"100%",height:"100%",display:"block"}}):b.jsx("div",{className:"audio-fft-window__fallback",children:"WebGPU not available"}),b.jsx("div",{ref:ne,className:"audio-fft-window__interaction-layer",onPointerDown:pt,onPointerMove:ht,onPointerUp:Be,onPointerLeave:Be,onPointerCancel:Qe,role:"presentation"})]})})}const Ct=(t,o,n)=>Math.max(o,Math.min(n,t));function ft(){return{previous:null,scratch:null,length:0,hasHistory:!1}}function St(t,o){if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:Ct(1-Math.exp(-d/n),0,1)}function Yt(t,o,n,d,M,u){const i=t.length;n.length!==i&&(n.length=i,n.hasHistory=!1,n.previous=null,n.scratch=null);const C=n.previous&&n.previous.length===i?n.previous:null,m=n.scratch&&n.scratch.length===i?n.scratch:null,B=C??new Float32Array(i),x=m??new Float32Array(i),l=n.hasHistory&&C!==null,f=Math.max(0,o.dtSec),F=St(o.attackMs,f),k=St(o.releaseMs,f);for(let z=0;z<i;z+=1){const L=t[z]/255,y=l?B[z]:L,O=L>=y?F:k;x[z]=y+(L-y)*O}n.hasHistory=!0,n.previous=x,n.scratch=B;let P=x;o.blurSigma>.001&&(P=Sn(P,o.blurSigma,d,u));const V=Bn(P,o.targetBins,M,o.frequencyMin,o.frequencyMax);return{smoothedSnapshot:x,resampled:V}}function Sn(t,o,n,d){const M=Math.max(.001,o);let u=n.current;(!u||u.length!==t.length)&&(u=new Float32Array(t.length),n.current=u);const{radius:i,kernel:C}=An(M,d),m=t.length;for(let B=0;B<m;B+=1){let x=0;for(let l=-i;l<=i;l+=1){let f=B+l;f<0?f=0:f>=m&&(f=m-1),x+=t[f]*C[l+i]}u[B]=x}return u}function An(t,o){const n=Math.round(t*100)/100,d=o.get(n);if(d)return d;const M=Math.max(1,Math.floor(t*3)),u=M*2+1,i=new Float32Array(u),C=Math.max(Number.EPSILON,2*t*t);let m=0;for(let l=0;l<u;l+=1){const f=l-M,F=Math.exp(-(f*f)/C);i[l]=F,m+=F}const B=m||1;for(let l=0;l<u;l+=1)i[l]/=B;const x={radius:M,kernel:i};return o.set(n,x),x}function Bn(t,o,n,d,M){const u=Math.max(1,Math.round(o));let i=n.current;(!i||i.length!==u)&&(i=new Float32Array(u),n.current=i);const C=Math.max(0,t.length-1);if(C===0)return i.fill(t[0]??0),i;const m=Ct(d,0,1),B=Ct(M,Math.min(1,m+.001),1),x=m*C,l=B*C;if(u===1){const f=(x+l)*.5,F=Math.floor(f),k=Math.min(C,F+1),P=f-F,V=t[F]??0,z=t[k]??V;return i[0]=V+(z-V)*P,i}for(let f=0;f<u;f+=1){const F=f/(u-1),k=x+F*(l-x),P=Math.floor(k),V=Math.min(C,P+1),z=k-P,L=t[P]??0,y=t[V]??0;i[f]=L+(y-L)*z}return i}function kn(t,o){const n=Lt.flexoki.base[700],d=Lt.flexoki.base[100];return{safeA:t??n,safeB:o??d}}const ue=t=>Math.max(0,Math.min(1,t)),G=(t,o,n)=>Math.max(o,Math.min(n,t)),Pn=44100,Gt=Pn/2,ut=10,En=18,Ce=8,dt=10,ye=500,At=20,Bt=80,Tn=1/60,Fn=[{value:"discrete",label:"Step"},{value:"interpolated",label:"Interp"}],ct=t=>Math.round(ue(t)*10)/10,lt=t=>Math.round(G(t,0,3)*10)/10,Se=t=>Math.round(G(t,0,ye)/dt)*dt;function wt(t,o){return t==="discrete"||t==="interpolated"?t:o}function ge(t,o,n,d){const[M,u]=Wt.useControlValue(d),i=d!==void 0&&t===void 0,C=i?M:t,[m,B]=e.useState(o),x=C!==void 0,l=x?C:m,f=e.useCallback(F=>{x||B(F),i&&u(F),n?.(F)},[x,n,u,i]);return e.useEffect(()=>{!i||M!==void 0||u(o)},[o,u,i,M]),[l,f,x]}function $t(t){const o=t||16,d=o*.35,u=o*1;return Math.max(Math.round(u+d*2+2),Math.round(o+d*1.5),En)}function mt(t){!t||t.state==="closed"||t.close().catch(()=>{})}function In({ariaLabel:t="Audio controls",fontSize:o,colorA:n,colorB:d,borderStyle:M,source:u,heightUnits:i=6,suspended:C,audioAnalysisStore:m,controlIdPrefix:B,controlIds:x,defaultPlaying:l=!1,playing:f,onPlayingChange:F,defaultMuted:k=!0,muted:P,onMutedChange:V,defaultBinCount:z=256,binCount:L,onBinCountChange:y,defaultBinInterpolation:O="discrete",binInterpolation:q,onBinInterpolationChange:$,defaultFrequencyMin:K=0,frequencyMin:ne,onFrequencyMinChange:Q,defaultFrequencyMax:X=Gt,frequencyMax:E,onFrequencyMaxChange:D,defaultFftAttack:de=At,fftAttack:me,onFftAttackChange:pe,defaultFftRelease:be=Bt,fftRelease:J,onFftReleaseChange:ce,defaultFftBlurSigma:le=0,fftBlurSigma:re,onFftBlurSigmaChange:oe,defaultAnalyserSmoothing:j=.8,analyserSmoothing:R,onAnalyserSmoothingChange:I}){const _=Ke.useAnimationSuspended(C),p=fn.usePanelTheme(),h=o??p?.fontSize??12,g=M??p?.borderStyle??"a",{safeA:a,safeB:s}=kn(n??p?.colorA,d??p?.colorB),A=Me.useAudioAnalysisStore(),v=e.useRef(null),W=v.current??Me.createAudioAnalysisStore({bins:[],binCount:0,maxMagnitude:1});v.current||(v.current=W);const H=m??A??W,ae=e.useMemo(()=>({setAudioBins:H.setAudioBins,setAudioBinCount:H.setAudioBinCount,setAudioMaxMagnitude:H.setAudioMaxMagnitude}),[H]),U=u.type==="buffer",Ae=Wt.useResolvedControlIdPrefix(B,t),Z=e.useCallback(r=>{const T=x?.[r];if(T)return T;if(!(r==="playing"||r==="muted"))return Ae?`${Ae}.${r}`:void 0},[x,Ae]),[Re,Te]=ge(f,l,F,Z("playing")),[se,pt]=ge(P,k,V,Z("muted")),[ht,Be]=e.useState(0),[Qe,Ve]=e.useState(!1),[xt,ze]=e.useState(null),c=e.useRef(0),w=e.useCallback(r=>G(Math.round(r||0),1,1024),[]),[Y,he]=ge(L,w(z),y,Z("binCount")),[Fe,Ne]=ge(R,ct(ue(j)),I,Z("analyserSmoothing")),[Oe,qe]=ge(me,Se(de),pe,Z("fftAttack")),[De,ee]=ge(J,Se(be),ce,Z("fftRelease")),[fe,Ge]=ge(re,lt(le),oe,Z("fftBlurSigma")),[Ze,Je]=ge(q,wt(O,"discrete"),$,Z("binInterpolation")),[N,$e]=e.useState(Gt),[je,S]=ge(ne,K,Q,Z("frequencyMin")),[We,Ie]=ge(E,X,D,Z("frequencyMax")),ke=e.useRef(null),[Pe,gt]=e.useState({version:0,binCount:0}),ie=w(Y),xe=ct(ue(Fe)),Ee=Se(Oe),et=Se(De),te=lt(fe),kt=wt(Ze,"discrete"),Kt=kt==="discrete",ve=e.useMemo(()=>Math.min(ut,N),[N]),{freqMinHz:tt,freqMaxHz:nt}=e.useMemo(()=>{const r=Number.isFinite(je??Number.NaN)?je:0,T=Number.isFinite(We??Number.NaN)?We:N,Xe=G(T,ve,N),Ye=G(r,0,Math.max(0,Xe-ve)),at=G(Xe,Ye+ve,N);return{freqMinHz:Ye,freqMaxHz:at}},[je,We,ve,N]),Qt=N>0?tt/N:0,Zt=N>0?nt/N:1,bt=G(Qt,0,1),Mt=G(Zt,0,1),Pt=e.useCallback(r=>{const T=G(r,0,Math.max(0,nt-ve));S(T)},[nt,ve,S]),Et=e.useCallback(r=>{const T=G(r,Math.min(N,tt+ve),N);Ie(T)},[tt,ve,N,Ie]),Tt=e.useCallback(r=>{$e(Math.max(1,r/2))},[]),[yt,Ft]=e.useState(()=>$t(h)),It=e.useRef(null);e.useEffect(()=>{const r=$t(h);Ft(T=>Math.abs(T-r)<.5?T:r)},[h]),e.useLayoutEffect(()=>{const r=It.current;if(!r||typeof ResizeObserver>"u")return;const T=()=>{const Ye=r.getBoundingClientRect();if(!Ye.height)return;const at=Math.round(Ye.height);Ft(Ut=>Math.abs(Ut-at)<.5?Ut:at)};T();const Xe=new ResizeObserver(()=>T());return Xe.observe(r),()=>Xe.disconnect()},[]);const Jt=a,_e=g==="none"?0:1,we=g==="none"?"transparent":g==="b"?s:a,en=a,tn=Re?"playing":"paused",nn=se?"muted":"unmuted",rn=[{value:"paused",icon:b.jsx(st.Play,{strokeWidth:1.6}),ariaLabel:"Play audio analysis",title:"Play audio analysis"},{value:"playing",icon:b.jsx(st.Pause,{strokeWidth:1.6}),ariaLabel:"Pause audio analysis",title:"Pause audio analysis"}],on=[{value:"muted",icon:b.jsx(st.VolumeX,{strokeWidth:1.6}),ariaLabel:"Unmute audio output",title:"Unmute audio output"},{value:"unmuted",icon:b.jsx(st.Volume2,{strokeWidth:1.6}),ariaLabel:"Mute audio output",title:"Mute audio output"}],rt=G(Ee,0,ye),He=G(et,0,ye),an=Math.max(.001,St(He,Tn)*.25),ot=e.useCallback(r=>{const T=ue(r);c.current+=1,ze({ratio:T,token:c.current})},[]),_t=e.useCallback(r=>{r?.length&&((!ke.current||ke.current.length!==r.length)&&(ke.current=new Uint8Array(r.length)),ke.current.set(r),gt(T=>({version:T.version+1,binCount:r.length})))},[]),sn=e.useCallback(r=>{if(!U)return;const T=ue(r);Qe||Be(T)},[U,Qe]),un=e.useCallback(()=>{U&&Ve(!0)},[U]),cn=e.useCallback(r=>{if(!U)return;const T=ue(r);Be(T),ot(T)},[U,ot]),ln=e.useCallback(r=>{if(!U)return;const T=ue(r);Be(T),ot(T),Ve(!1)},[U,ot]);return e.useEffect(()=>{U||(Be(0),Ve(!1),ze(null))},[U]),b.jsx(Ke.AnimationSuspensionProvider,{suspended:_,children:b.jsxs("div",{style:{width:"100%",maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column"},children:[b.jsxs("div",{style:{width:"100%",minHeight:yt,borderTop:`1px solid ${we}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderBottom:`1px solid ${s}`,borderTopLeftRadius:3,borderTopRightRadius:3,background:s,display:"flex",alignItems:"center",overflow:"hidden",gap:Ce,padding:`0 ${Ce}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Ce,flexShrink:0},children:b.jsx(Vt.IconButton,{behavior:"cycle",value:tn,options:rn,onChange:r=>Te(r==="playing"),borderStyle:"none",fontSize:h,colorA:a,colorB:s})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Ce},children:[b.jsx("div",{ref:It,style:{display:"flex",minWidth:0},children:b.jsx(Me.LFOSlider,{label:"Bins",variant:"basic",min:1,max:1024,step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:ie,onUserChange:r=>{he(w(r))},onAnimatedUpdate:r=>{he(w(r))},style:{gap:0}})}),b.jsx(dn.SegmentBar,{ariaLabel:"Bin interpolation",showLabel:!1,options:Fn,value:kt,onChange:r=>{Je(wt(r,"discrete"))},colorA:a,colorB:s,borderStyle:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},fontSize:h,style:{gap:0,minWidth:0}}),b.jsx(Me.LFOSlider,{label:"Min",variant:"basic",min:0,max:Math.max(0,N-ut),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:tt,onUserChange:Pt,onAnimatedUpdate:Pt,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Max",variant:"basic",min:ut,max:Math.max(ut,N),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:nt,onUserChange:Et,onAnimatedUpdate:Et,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}})]})]}),u.type==="buffer"?b.jsx(_n,{src:u.src,loop:u.loop,playing:Re,analysisActions:ae,onProgress:sn,seekTarget:xt,analyserSmoothing:xe,attackMs:rt,releaseMs:He,blurSigma:te,targetBins:ie,onRawFftFrame:_t,frequencyMin:bt,frequencyMax:Mt,onSampleRateChange:Tt,muted:se,suspended:_}):b.jsx(Un,{source:u,playing:Re,analysisActions:ae,analyserSmoothing:xe,attackMs:rt,releaseMs:He,blurSigma:te,targetBins:ie,onRawFftFrame:_t,frequencyMin:bt,frequencyMax:Mt,onSampleRateChange:Tt,muted:se,suspended:_}),b.jsx("div",{style:{borderTop:`1px solid ${Jt}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderRadius:0,borderBottom:`1px solid ${s}`,overflow:"hidden",background:"linear-gradient(180deg, #0a0a0a, #1a1a1a)"},children:b.jsx(Xt,{heightUnits:i,unitSizePx:yt,maxWidth:"100%",maxBins:ie,peakDecay:an,playbackRatio:U?ht:0,showPlaybackIndicator:U,onScrubStart:U?un:void 0,onScrub:U?cn:void 0,onScrubEnd:U?ln:void 0,activeColor:a,inactiveColor:s,rawFftDataRef:ke,rawFrameVersion:Pe.version,rawBinCount:Pe.binCount,attackMs:rt,releaseMs:He,blurSigma:te,discreteBins:Kt,frequencyMin:bt,frequencyMax:Mt,suspended:_})}),b.jsxs("div",{style:{width:"100%",minHeight:yt,borderTop:`1px solid ${a}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderBottom:`1px solid ${we}`,borderBottomLeftRadius:3,borderBottomRightRadius:3,background:s,color:en,display:"flex",alignItems:"center",overflow:"hidden",gap:Ce,padding:`0 ${Ce}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Ce,flexShrink:0},children:b.jsx(Vt.IconButton,{behavior:"cycle",value:nn,options:on,onChange:r=>pt(r==="muted"),borderStyle:"none",fontSize:h,colorA:a,colorB:s})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Ce},children:[b.jsx(Me.LFOSlider,{label:"Atk",variant:"basic",min:0,max:ye,step:dt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:rt,onUserChange:r=>qe(Se(r)),onAnimatedUpdate:r=>qe(Se(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Rel",variant:"basic",min:0,max:ye,step:dt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:He,onUserChange:r=>ee(Se(r)),onAnimatedUpdate:r=>ee(Se(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Sm",variant:"basic",min:0,max:1,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:xe,onUserChange:r=>Ne(ct(r)),onAnimatedUpdate:r=>Ne(ct(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"σ",variant:"basic",min:0,max:3,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:te,onUserChange:r=>Ge(lt(r)),onAnimatedUpdate:r=>Ge(lt(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}})]})]})]})})}function _n({src:t,loop:o=!0,playing:n,analysisActions:d,seekTarget:M,onProgress:u,analyserSmoothing:i=.8,attackMs:C=At,releaseMs:m=Bt,blurSigma:B=0,targetBins:x=1024,onRawFftFrame:l,frequencyMin:f=0,frequencyMax:F=1,onSampleRateChange:k,muted:P=!0,suspended:V}){const z=Ke.useAnimationSuspended(V),{setAudioBins:L,setAudioBinCount:y,setAudioMaxMagnitude:O}=d,q=e.useRef(null),$=e.useRef(null),K=e.useRef(null),ne=e.useRef(null),Q=e.useRef(null),X=e.useRef(null),E=e.useRef(0),D=e.useRef(null),de=e.useRef(u),me=e.useRef(ue(i??.8)),pe=e.useRef(k),be=e.useRef(P),J=e.useRef(ft()),ce=e.useRef(null),le=e.useRef(null),re=e.useRef(new Map),oe=e.useRef(null);e.useEffect(()=>{de.current=u},[u]),e.useEffect(()=>{pe.current=k},[k]),e.useEffect(()=>{be.current=P;const g=Q.current,a=q.current;g&&a&&g.gain.setTargetAtTime(P?0:1,a.currentTime,.01)},[P]),e.useEffect(()=>{const g=ue(i??.8);me.current=g,$.current&&($.current.smoothingTimeConstant=g)},[i]);const j=e.useCallback(()=>X.current?.duration??0,[]),R=e.useCallback(g=>{const a=j();if(a<=0)return 0;const s=g%a,A=s<0?s+a:s,v=Math.min(a*.001,1e-4)||1e-4;return Math.min(A,Math.max(0,a-v))},[j]),I=e.useCallback(()=>{if(j()<=0)return 0;const a=R(E.current),s=D.current,A=q.current;if(!A||s==null)return a;const v=A.currentTime-s;return R(a+v)},[j,R]),_=e.useCallback(()=>{try{ne.current?.stop()}catch{}ne.current?.disconnect(),Q.current?.disconnect(),ne.current=null,Q.current=null},[]);e.useEffect(()=>{const g=re.current;let a=!1;async function s(){try{const A=new AudioContext;q.current=A,pe.current?.(A.sampleRate);const v=await fetch(t);if(!v.ok)throw new Error(`Failed to load audio sample: ${v.status}`);const W=await v.arrayBuffer(),H=await A.decodeAudioData(W);if(a){mt(A);return}X.current=H,E.current=0,D.current=null;const ae=A.createAnalyser();ae.fftSize=2048,ae.smoothingTimeConstant=me.current,$.current=ae,K.current=new Uint8Array(new ArrayBuffer(ae.frequencyBinCount)),y(ae.frequencyBinCount),O(1)}catch(A){console.error("Failed to load audio for FFT",A)}}return s(),()=>{a=!0,$.current=null,K.current=null,_(),mt(q.current),q.current=null,ne.current=null,Q.current=null,X.current=null,E.current=0,D.current=null,J.current=ft(),ce.current=null,le.current=null,g.clear(),oe.current=null}},[y,O,t,_]);const p=e.useCallback(()=>{E.current=I(),D.current=null,_()},[I,_]),h=e.useCallback(async g=>{if(!X.current||!q.current)return;const a=q.current;a.state==="suspended"&&await a.resume().catch(()=>{});const s=$.current??a.createAnalyser();s.fftSize=2048,s.smoothingTimeConstant=me.current,$.current=s;const A=R(typeof g=="number"?g:I());E.current=A,D.current=a.currentTime,_();const v=a.createBufferSource();v.buffer=X.current,v.loop=o;const W=a.createGain();W.gain.value=be.current?0:1,v.connect(s),s.connect(W),W.connect(a.destination),v.start(0,A),ne.current=v,Q.current=W,K.current||(K.current=new Uint8Array(new ArrayBuffer(s.frequencyBinCount)),y(s.frequencyBinCount))},[I,o,y,_,R]);return e.useEffect(()=>(n?h():p(),()=>{p()}),[n,h,p]),e.useEffect(()=>{if(!M)return;const g=j();if(g<=0)return;const a=ue(M.ratio),s=R(a*g);E.current=s,n&&X.current&&q.current?h(s):D.current=null},[j,n,M,h,R]),jt.useFrame(z?null:(g,a)=>{const s=$.current,A=K.current;if(s&&A){s.getByteFrequencyData(A),l&&l(A);const H=Yt(A,{attackMs:G(C,0,ye),releaseMs:G(m,0,ye),dtSec:a,blurSigma:Math.max(0,B||0),targetBins:G(Math.round(x||A.length),1,A.length),frequencyMin:f,frequencyMax:F},J.current,ce,le,re.current).resampled;L(Array.from(H)),oe.current!==H.length&&(oe.current=H.length,y(H.length))}const v=j();if(v>0){const W=I()/v;de.current?.(W)}}),null}function Un({source:t,playing:o,analysisActions:n,analyserSmoothing:d=.8,attackMs:M=At,releaseMs:u=Bt,blurSigma:i=0,targetBins:C=1024,onRawFftFrame:m,frequencyMin:B=0,frequencyMax:x=1,onSampleRateChange:l,muted:f=!0,suspended:F}){const k=Ke.useAnimationSuspended(F),{setAudioBins:P,setAudioBinCount:V,setAudioMaxMagnitude:z}=n,L=e.useRef(null),y=e.useRef(null),O=e.useRef(null),q=e.useRef(null),$=e.useRef(null),K=e.useRef(ue(d??.8)),ne=e.useRef(l),Q=e.useRef(f),X=e.useRef(!1),E=e.useRef(!1),D=e.useRef(!1),de=e.useRef(ft()),me=e.useRef(null),pe=e.useRef(null),be=e.useRef(new Map),J=e.useRef(null),ce=t.type==="mediaStream"?t.stream:null,le=t.type==="mediaStream"?t.context:void 0,re=t.type==="audioNode"?t.node:null;e.useEffect(()=>{ne.current=l},[l]),e.useEffect(()=>{Q.current=f;const R=q.current,I=L.current;R&&I&&R.gain.setTargetAtTime(f?0:1,I.currentTime,.01)},[f]),e.useEffect(()=>{const R=ue(d??.8);K.current=R,y.current&&(y.current.smoothingTimeConstant=R)},[d]);const oe=e.useCallback(()=>{if(E.current)return;const R=O.current,I=y.current,_=q.current,p=L.current;!R||!I||!_||!p||(R.connect(I),I.connect(_),_.connect(p.destination),E.current=!0)},[]),j=e.useCallback(()=>{if(E.current){try{const R=O.current,I=y.current;R&&I&&R.disconnect(I)}catch{}try{y.current?.disconnect()}catch{}try{q.current?.disconnect()}catch{}E.current=!1}},[]);return e.useEffect(()=>{let R=!1;async function I(){let p,h,g=!1;if(t.type==="mediaStream"){if(p=le??new AudioContext,g=!le,!ce)return;h=p.createMediaStreamSource(ce)}else{if(!re)return;h=re,p=re.context}if(R){g&&mt(p);return}X.current=g,L.current=p,O.current=h,ne.current?.(p.sampleRate);const a=p.createAnalyser();a.fftSize=2048,a.smoothingTimeConstant=K.current,y.current=a,$.current=new Uint8Array(new ArrayBuffer(a.frequencyBinCount)),J.current=a.frequencyBinCount,V(a.frequencyBinCount),z(1);const s=p.createGain();s.gain.value=Q.current?0:1,q.current=s,E.current=!1,D.current=!1}I();const _=be.current;return()=>{R=!0,j(),y.current=null,$.current=null,O.current=null,q.current=null,X.current&&mt(L.current),L.current=null,X.current=!1,de.current=ft(),me.current=null,pe.current=null,_.clear(),J.current=null,D.current=!1}},[oe,j,V,z,t.type,le,ce,re]),e.useEffect(()=>{const R=L.current;o?(R?.state==="suspended"&&R.resume().catch(()=>{}),oe(),D.current=!1):(j(),D.current=!1)},[oe,j,o]),jt.useFrame(k?null:(R,I)=>{if(!o||!E.current){if(!D.current){const h=J.current??0;h>0&&(P(new Array(h).fill(0)),V(h)),D.current=!0}return}const _=y.current,p=$.current;if(_&&p){_.getByteFrequencyData(p),m&&m(p);const g=Yt(p,{attackMs:G(M,0,ye),releaseMs:G(u,0,ye),dtSec:I,blurSigma:Math.max(0,i||0),targetBins:G(Math.round(C||p.length),1,p.length),frequencyMin:B,frequencyMax:x},de.current,me,pe,be.current).resampled;P(Array.from(g)),J.current!==g.length&&(J.current=g.length,V(g.length))}}),null}exports.AudioControls=In;exports.AudioFFTWindow=Xt;
//# sourceMappingURL=AudioControls-DHlG-9fB.cjs.map
