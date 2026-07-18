"use strict";const b=require("react/jsx-runtime"),e=require("react"),it=require("lucide-react"),tt=require("./animationSuspension-CaeFoamB.cjs"),Ce=require("./LFOSlider-DY9JoEeX.cjs"),jt=require("./frameLoop-DMd5EqQq.cjs"),Lt=require("./flexoki-BtN-1xqJ.cjs"),cn=require("./panelGap-C0MXgSjL.cjs"),Vt=require("./IconButton-CqkPHVvp.cjs"),ln=require("./SegmentBar-C3YGFdKe.cjs"),fn=require("typegpu"),Wt=require("./hooks-CPN0v2jj.cjs");let vt=null,ct=null;const dn=[.16,.47,.86],mn=[.02,.02,.04],Ht=24,pn=Ht*Float32Array.BYTES_PER_ELEMENT,Oe=64,hn=.2,xn=4,wt=12,zt=.01,gn=20,bn=80,Nt=(t,o,n)=>Math.max(o,Math.min(n,t)),Ot=(t,o)=>{if(t<=0)return 1;const n=t/1e3,f=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:Math.max(0,Math.min(1,1-Math.exp(-f/n)))};async function Mn(){return navigator.gpu?vt||(ct||(ct=fn.init().then(t=>(vt=t,t)).catch(t=>(console.error("AudioFFTWindow: TypeGPU init failed",t),ct=null,null))),ct):null}function Ne(t){return Number.parseInt(t,16)/255}function qt(t,o=[0,0,0]){if(!t)return o;const n=t.trim();if(n.startsWith("#")){if(n.length===7)return[Ne(n.slice(1,3)),Ne(n.slice(3,5)),Ne(n.slice(5,7))];if(n.length===4)return[Ne(n[1]+n[1]),Ne(n[2]+n[2]),Ne(n[3]+n[3])]}return o}function yn(t){const o=t.createShaderModule({code:`
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

@compute @workgroup_size(${Oe})
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
    let radius = min(${wt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${wt}; offset = offset + 1) {
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
const MAX_RADIUS : i32 = ${wt};

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
`});return{computeModule:o,renderModule:n}}function Dt(t,o){return t.createTexture({size:[o,1,1],format:"rgba32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})}function Rn(t){t&&(t.uniformBuffer.destroy(),t.rawBuffer.destroy(),t.stateTextures[0].destroy(),t.stateTextures[1].destroy())}function vn(t,o,n,f){const M=o.getContext("webgpu");if(!M)return null;const s=navigator.gpu.getPreferredCanvasFormat();M.configure({device:t,format:s,alphaMode:"opaque"});const{computeModule:u,renderModule:k}=yn(t),p=t.createBuffer({size:pn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),C=t.createBuffer({size:Math.max(1,f)*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),x=[Dt(t,n),Dt(t,n)],c=x.map(E=>E.createView({dimension:"2d"})),d=t.createComputePipeline({layout:"auto",compute:{module:u,entryPoint:"cs_main"}}),P=t.createRenderPipeline({layout:"auto",vertex:{module:k,entryPoint:"vs_main"},fragment:{module:k,entryPoint:"fs_main",targets:[{format:s}]},primitive:{topology:"triangle-list"}}),q=d.getBindGroupLayout(0),y=P.getBindGroupLayout(0),O=[t.createBindGroup({layout:q,entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:c[0]},{binding:2,resource:c[1]},{binding:3,resource:{buffer:p}}]}),t.createBindGroup({layout:q,entries:[{binding:0,resource:{buffer:C}},{binding:1,resource:c[1]},{binding:2,resource:c[0]},{binding:3,resource:{buffer:p}}]})],z=[t.createBindGroup({layout:y,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:c[0]}]}),t.createBindGroup({layout:y,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:c[1]}]})],D=Math.max(1,Math.ceil(n/Oe));return{context:M,format:s,uniformBuffer:p,rawBuffer:C,rawCapacity:Math.max(1,f),stateTextures:x,stateStorageViews:c,computePipeline:d,renderPipeline:P,computeBindGroups:O,renderBindGroups:z,workgroupCount:D,binCapacity:n}}function Xt({heightUnits:t=6,unitSizePx:o,maxWidth:n,maxBins:f=1024,playbackRatio:M=0,playbackRatioRef:s,showPlaybackIndicator:u=!0,onScrubStart:k,onScrub:p,onScrubEnd:C,activeColor:x,inactiveColor:c,peakDecay:d=.05,rawFftDataRef:P,rawFrameVersion:q,rawBinCount:y=0,rawFftMetaRef:O,attackMs:z=gn,releaseMs:D=bn,blurSigma:E=0,discreteBins:G=!0,frequencyMin:Y=0,frequencyMax:L=1,suspended:H}){const K=e.useRef(null),Z=e.useRef(null),ae=e.useRef(null),[X,j]=e.useState(()=>typeof navigator<"u"&&!!navigator.gpu),[F,pe]=e.useState({width:480,height:Math.max(1,t)*o}),[fe,ve]=e.useState(()=>Math.max(1,Math.ceil(Math.max(1,Math.floor(f))/Oe)*Oe)),[he,ne]=e.useState(()=>Math.max(1,y||1)),se=e.useRef(Math.max(0,Math.min(1,M))),de=e.useRef(Math.max(0,E)),ue=e.useRef(Math.max(0,z)),re=e.useRef(Math.max(0,D)),J=e.useRef(Math.max(5e-4,d)),R=e.useRef(G?1:0),A=e.useRef(Math.max(0,Math.min(1,Y))),N=e.useRef(Math.max(0,Math.min(1,L))),i=e.useRef(Math.max(1,Math.floor(f))),V=e.useRef(!1),m=e.useRef(null),a=e.useRef(typeof performance<"u"?performance.now():Date.now()),h=e.useRef(new Float32Array(Ht)),v=e.useRef(null),w=e.useRef(0),T=e.useRef(null),I=e.useRef(null),S=e.useRef(null),ee=tt.useAnimationSuspended(H),te=e.useRef(ee),ie=e.useRef({active:!1,pointerId:null}),qe=e.useMemo(()=>qt(x,dn),[x]),Pe=e.useMemo(()=>qt(c,mn),[c]),_e=e.useRef(qe),xe=e.useRef(Pe);e.useEffect(()=>{if(te.current=ee,ee){I.current!==null&&(cancelAnimationFrame(I.current),I.current=null),a.current=typeof performance<"u"?performance.now():Date.now();return}S.current?.()},[ee]),e.useEffect(()=>{se.current=Math.max(0,Math.min(1,M))},[M]),e.useEffect(()=>{de.current=Math.max(0,E)},[E]),e.useEffect(()=>{ue.current=Math.max(0,z)},[z]),e.useEffect(()=>{re.current=Math.max(0,D)},[D]),e.useEffect(()=>{J.current=Math.max(5e-4,d)},[d]),e.useEffect(()=>{R.current=G?1:0},[G]),e.useEffect(()=>{A.current=Nt(Y,0,Math.min(1,L-zt))},[Y,L]),e.useEffect(()=>{N.current=Nt(L,Math.min(1,Y+zt),1)},[L,Y]),e.useEffect(()=>{V.current=!0},[Y,L,f]),e.useEffect(()=>{i.current=Math.max(1,Math.floor(f));const l=Math.max(1,Math.ceil(i.current/Oe)*Oe);ve(B=>B===l?B:l)},[f]),e.useEffect(()=>{!y||y<=0||ne(l=>y>l?Math.max(y,l):l)},[y]),e.useEffect(()=>{V.current=!0},[q]),e.useEffect(()=>{_e.current=qe},[qe]),e.useEffect(()=>{xe.current=Pe},[Pe]),e.useEffect(()=>{const l=Math.max(1,t)*o;pe(B=>({width:B.width,height:l}))},[t,o]),e.useEffect(()=>{const l=Z.current;if(!l)return;const B=()=>{const ge=l.getBoundingClientRect();ge.width&&pe(Ue=>({width:Math.round(ge.width),height:Ue.height}))};B();const Q=typeof ResizeObserver<"u"?new ResizeObserver(B):null;return Q?Q.observe(l):window.addEventListener("resize",B),()=>{Q?.disconnect(),Q||window.removeEventListener("resize",B)}},[]);const me=e.useCallback(l=>{const B=Z.current;if(!B)return null;const Q=B.getBoundingClientRect();if(!Q.width)return null;const ge=(l-Q.left)/Q.width;return Math.max(0,Math.min(1,ge))},[]),De=e.useCallback(l=>{if(!p&&!C&&!k)return;const B=me(l.clientX);B!=null&&(ie.current={active:!0,pointerId:l.pointerId},l.currentTarget.setPointerCapture(l.pointerId),l.preventDefault(),k?.(),p?.(B))},[me,p,C,k]),xt=e.useCallback(l=>{if(!ie.current.active||ie.current.pointerId!==l.pointerId)return;const B=me(l.clientX);B!=null&&(l.preventDefault(),p?.(B))},[me,p]),Ge=e.useCallback(l=>{if(!ie.current.active||ie.current.pointerId!==l.pointerId)return;ie.current={active:!1,pointerId:null};try{l.currentTarget.releasePointerCapture(l.pointerId)}catch{}const B=me(l.clientX);B!=null&&C?.(B)},[me,C]),nt=e.useCallback(l=>{if(ie.current.pointerId!==l.pointerId)return;ie.current={active:!1,pointerId:null};try{l.currentTarget.releasePointerCapture(l.pointerId)}catch{}const B=me(l.clientX);B!=null&&C?.(B)},[me,C]);e.useEffect(()=>{if(!X)return;let l=!1;async function B(){const Q=await Mn();if(!Q||l){Q||j(!1);return}const ge=K.current;if(!ge)return;const Ue=vn(Q.device,ge,fe,he);if(!Ue){j(!1);return}v.current=Ue,w.current=0,V.current=!0;const je=We=>{if(l)return;if(te.current){I.current=null,a.current=We;return}const He=Q.device,Xe=He.queue,oe=v.current;if(!oe)return;const U=K.current;if(!U)return;const rt=window.devicePixelRatio||1,Le=Math.max(1,Math.floor(F.width*rt)),Ye=Math.max(1,Math.floor(F.height*rt));(U.width!==Le||U.height!==Ye)&&(U.width=Le,U.height=Ye),U.style.width!==`${Math.round(F.width)}px`&&(U.style.width=`${Math.round(F.width)}px`),U.style.height!==`${Math.round(F.height)}px`&&(U.style.height=`${Math.round(F.height)}px`);const Ee=Math.max(5e-4,(We-a.current)/1e3);a.current=We;const Ve=Math.max(1,i.current),Te=Ve>1?1/(Ve-1):1;s&&(se.current=Math.max(0,Math.min(1,s.current??0)));const be=O?.current;if(be&&(be.version!==m.current&&(m.current=be.version,V.current=!0),be.binCount>oe.rawCapacity)){const ce=be.binCount;ne($=>ce>$?Math.max(ce,$):$)}const g=h.current,Ke=Math.max(1,(be?be.binCount:y)||0);if(g[0]=Ve,g[1]=u?se.current:-1,g[2]=de.current,g[3]=Te,g[4]=_e.current[0],g[5]=_e.current[1],g[6]=_e.current[2],g[7]=1,g[8]=xe.current[0],g[9]=xe.current[1],g[10]=xe.current[2],g[11]=1,g[12]=Ot(ue.current,Ee),g[13]=Ot(re.current,Ee),g[14]=Ee,g[15]=xn,g[16]=J.current,g[17]=hn,g[18]=R.current,g[19]=Ke,g[20]=A.current,g[21]=N.current,g[22]=0,g[23]=0,Xe.writeBuffer(oe.uniformBuffer,0,g.buffer,g.byteOffset,g.byteLength),V.current&&P?.current){const ce=P.current,$=oe.rawCapacity;(!T.current||T.current.length!==$)&&(T.current=new Float32Array($));const Me=T.current,Ie=Math.min($,ce.length);for(let ye=0;ye<Ie;ye+=1)Me[ye]=ce[ye]/255;for(let ye=Ie;ye<$;ye+=1)Me[ye]=0;Xe.writeBuffer(oe.rawBuffer,0,Me.buffer,Me.byteOffset,Me.byteLength),V.current=!1}const Qe=He.createCommandEncoder();if(P?.current){const ce=Qe.beginComputePass(),$=oe.computeBindGroups[w.current];ce.setPipeline(oe.computePipeline),ce.setBindGroup(0,$),ce.dispatchWorkgroups(oe.workgroupCount,1,1),ce.end(),w.current=w.current===0?1:0}const bt=oe.context.getCurrentTexture().createView(),we=Qe.beginRenderPass({colorAttachments:[{view:bt,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});we.setPipeline(oe.renderPipeline);const ot=oe.renderBindGroups[w.current];we.setBindGroup(0,ot),we.draw(6,1,0,0),we.end(),Xe.submit([Qe.finish()]),I.current=requestAnimationFrame(je)};S.current=()=>{l||I.current!==null||(a.current=typeof performance<"u"?performance.now():Date.now(),I.current=requestAnimationFrame(je))},te.current||S.current()}return B(),()=>{l=!0,I.current!==null&&(cancelAnimationFrame(I.current),I.current=null),S.current=null,Rn(v.current),v.current=null}},[X,F.width,F.height,fe,he,P,O,y,s,u]);const Fe=typeof n=="number"?`${n}px`:n??"100%",gt=Math.round(F.width),$e=Math.round(F.height);return b.jsx("div",{ref:Z,className:"audio-fft-window",style:{width:"100%",maxWidth:Fe},children:b.jsxs("div",{className:"audio-fft-window__canvas-wrapper",style:{width:"100%",height:`${$e}px`,position:"relative",overflow:"hidden",background:"transparent"},children:[X?b.jsx("canvas",{ref:K,width:gt,height:$e,style:{width:"100%",height:"100%",display:"block"}}):b.jsx("div",{className:"audio-fft-window__fallback",children:"WebGPU not available"}),b.jsx("div",{ref:ae,className:"audio-fft-window__interaction-layer",onPointerDown:De,onPointerMove:xt,onPointerUp:Ge,onPointerLeave:Ge,onPointerCancel:nt,role:"presentation"})]})})}const St=(t,o,n)=>Math.max(o,Math.min(n,t));function mt(){return{previous:null,scratch:null,length:0,hasHistory:!1}}function At(t,o){if(t<=0)return 1;const n=t/1e3,f=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:St(1-Math.exp(-f/n),0,1)}function Yt(t,o,n,f,M,s){const u=t.length;n.length!==u&&(n.length=u,n.hasHistory=!1,n.previous=null,n.scratch=null);const k=n.previous&&n.previous.length===u?n.previous:null,p=n.scratch&&n.scratch.length===u?n.scratch:null,C=k??new Float32Array(u),x=p??new Float32Array(u),c=n.hasHistory&&k!==null,d=Math.max(0,o.dtSec),P=At(o.attackMs,d),q=At(o.releaseMs,d);for(let z=0;z<u;z+=1){const D=t[z]/255,E=c?C[z]:D,G=D>=E?P:q;x[z]=E+(D-E)*G}n.hasHistory=!0,n.previous=x,n.scratch=C;let y=x;o.blurSigma>.001&&(y=wn(y,o.blurSigma,f,s));const O=Sn(y,o.targetBins,M,o.frequencyMin,o.frequencyMax);return{smoothedSnapshot:x,resampled:O}}function wn(t,o,n,f){const M=Math.max(.001,o);let s=n.current;(!s||s.length!==t.length)&&(s=new Float32Array(t.length),n.current=s);const{radius:u,kernel:k}=Cn(M,f),p=t.length;for(let C=0;C<p;C+=1){let x=0;for(let c=-u;c<=u;c+=1){let d=C+c;d<0?d=0:d>=p&&(d=p-1),x+=t[d]*k[c+u]}s[C]=x}return s}function Cn(t,o){const n=Math.round(t*100)/100,f=o.get(n);if(f)return f;const M=Math.max(1,Math.floor(t*3)),s=M*2+1,u=new Float32Array(s),k=Math.max(Number.EPSILON,2*t*t);let p=0;for(let c=0;c<s;c+=1){const d=c-M,P=Math.exp(-(d*d)/k);u[c]=P,p+=P}const C=p||1;for(let c=0;c<s;c+=1)u[c]/=C;const x={radius:M,kernel:u};return o.set(n,x),x}function Sn(t,o,n,f,M){const s=Math.max(1,Math.round(o));let u=n.current;(!u||u.length!==s)&&(u=new Float32Array(s),n.current=u);const k=Math.max(0,t.length-1);if(k===0)return u.fill(t[0]??0),u;const p=St(f,0,1),C=St(M,Math.min(1,p+.001),1),x=p*k,c=C*k;if(s===1){const d=(x+c)*.5,P=Math.floor(d),q=Math.min(k,P+1),y=d-P,O=t[P]??0,z=t[q]??O;return u[0]=O+(z-O)*y,u}for(let d=0;d<s;d+=1){const P=d/(s-1),q=x+P*(c-x),y=Math.floor(q),O=Math.min(k,y+1),z=q-y,D=t[y]??0,E=t[O]??0;u[d]=D+(E-D)*z}return u}function An(t,o){const n=Lt.flexoki.base[700],f=Lt.flexoki.base[100];return{safeA:t??n,safeB:o??f}}const le=t=>Math.max(0,Math.min(1,t)),W=(t,o,n)=>Math.max(o,Math.min(n,t)),Bn=44100,Gt=Bn/2,lt=10,kn=18,Be=8,pt=10,Se=500,Bt=20,kt=80,Pn=1/60,En=[{value:"discrete",label:"Step"},{value:"interpolated",label:"Interp"}],ft=t=>Math.round(le(t)*10)/10,dt=t=>Math.round(W(t,0,3)*10)/10,ke=t=>Math.round(W(t,0,Se)/pt)*pt;function Ct(t,o){return t==="discrete"||t==="interpolated"?t:o}function Re(t,o,n,f){const[M,s]=Wt.useControlValue(f),u=f!==void 0&&t===void 0,k=u?M:t,[p,C]=e.useState(o),x=k!==void 0,c=x?k:p,d=e.useCallback(P=>{x||C(P),u&&s(P),n?.(P)},[x,n,s,u]);return e.useEffect(()=>{!u||M!==void 0||s(o)},[o,s,u,M]),[c,d,x]}function $t(t){const o=t||16,f=o*.35,s=o*1;return Math.max(Math.round(s+f*2+2),Math.round(o+f*1.5),kn)}function ht(t){!t||t.state==="closed"||t.close().catch(()=>{})}function Tn({ariaLabel:t="Audio controls",fontSize:o,colorA:n,colorB:f,borderStyle:M,source:s,heightUnits:u=6,suspended:k,audioAnalysisStore:p,controlIdPrefix:C,controlIds:x,defaultPlaying:c=!1,playing:d,onPlayingChange:P,defaultMuted:q=!0,muted:y,onMutedChange:O,defaultBinCount:z=256,binCount:D,onBinCountChange:E,defaultBinInterpolation:G="discrete",binInterpolation:Y,onBinInterpolationChange:L,defaultFrequencyMin:H=0,frequencyMin:K,onFrequencyMinChange:Z,defaultFrequencyMax:ae=Gt,frequencyMax:X,onFrequencyMaxChange:j,defaultFftAttack:F=Bt,fftAttack:pe,onFftAttackChange:fe,defaultFftRelease:ve=kt,fftRelease:he,onFftReleaseChange:ne,defaultFftBlurSigma:se=0,fftBlurSigma:de,onFftBlurSigmaChange:ue,defaultAnalyserSmoothing:re=.8,analyserSmoothing:J,onAnalyserSmoothingChange:R}){const A=tt.useAnimationSuspended(k),N=cn.usePanelTheme(),i=o??N?.fontSize??12,V=M??N?.borderStyle??"a",{safeA:m,safeB:a}=An(n??N?.colorA,f??N?.colorB),h=Ce.useAudioAnalysisStore(),v=e.useRef(null),w=v.current??Ce.createAudioAnalysisStore({bins:[],binCount:0,maxMagnitude:1});v.current||(v.current=w);const T=p??h??w,I=e.useMemo(()=>({setAudioBins:T.setAudioBins,setAudioBinCount:T.setAudioBinCount,setAudioMaxMagnitude:T.setAudioMaxMagnitude,getBinCount:()=>T.getSnapshot().bins.length}),[T]),S=s.type==="buffer",ee=Wt.useResolvedControlIdPrefix(C,t),te=e.useCallback(r=>{const _=x?.[r];if(_)return _;if(!(r==="playing"||r==="muted"))return ee?`${ee}.${r}`:void 0},[x,ee]),[ie,qe]=Re(d,c,P,te("playing")),[Pe,_e]=Re(y,q,O,te("muted")),xe=e.useRef(0),[me,De]=e.useState(!1),[xt,Ge]=e.useState(null),nt=e.useRef(0),Fe=e.useCallback(r=>W(Math.round(r||0),1,1024),[]),[gt,$e]=Re(D,Fe(z),E,te("binCount")),[l,B]=Re(J,ft(le(re)),R,te("analyserSmoothing")),[Q,ge]=Re(pe,ke(F),fe,te("fftAttack")),[Ue,je]=Re(he,ke(ve),ne,te("fftRelease")),[We,He]=Re(de,dt(se),ue,te("fftBlurSigma")),[Xe,oe]=Re(Y,Ct(G,"discrete"),L,te("binInterpolation")),[U,rt]=e.useState(Gt),[Le,Ye]=Re(K,H,Z,te("frequencyMin")),[Ee,Ve]=Re(X,ae,j,te("frequencyMax")),Te=e.useRef(null),be=e.useRef({version:0,binCount:0}),g=Fe(gt),Ke=ft(le(l)),Qe=ke(Q),bt=ke(Ue),we=dt(We),ot=Ct(Xe,"discrete"),ce=ot==="discrete",$=e.useMemo(()=>Math.min(lt,U),[U]),{freqMinHz:Me,freqMaxHz:Ie}=e.useMemo(()=>{const r=Number.isFinite(Le??Number.NaN)?Le:0,_=Number.isFinite(Ee??Number.NaN)?Ee:U,Je=W(_,$,U),et=W(r,0,Math.max(0,Je-$)),ut=W(Je,et+$,U);return{freqMinHz:et,freqMaxHz:ut}},[Le,Ee,$,U]),ye=U>0?Me/U:0,Kt=U>0?Ie/U:1,Mt=W(ye,0,1),yt=W(Kt,0,1),Pt=e.useCallback(r=>{const _=W(r,0,Math.max(0,Ie-$));Ye(_)},[Ie,$,Ye]),Et=e.useCallback(r=>{const _=W(r,Math.min(U,Me+$),U);Ve(_)},[Me,$,U,Ve]),Tt=e.useCallback(r=>{rt(Math.max(1,r/2))},[]),[Rt,It]=e.useState(()=>$t(i)),_t=e.useRef(null);e.useEffect(()=>{const r=$t(i);It(_=>Math.abs(_-r)<.5?_:r)},[i]),e.useLayoutEffect(()=>{const r=_t.current;if(!r||typeof ResizeObserver>"u")return;const _=()=>{const et=r.getBoundingClientRect();if(!et.height)return;const ut=Math.round(et.height);It(Ut=>Math.abs(Ut-ut)<.5?Ut:ut)};_();const Je=new ResizeObserver(()=>_());return Je.observe(r),()=>Je.disconnect()},[]);const Qt=m,ze=V==="none"?0:1,Ae=V==="none"?"transparent":V==="b"?a:m,Zt=m,Jt=ie?"playing":"paused",en=Pe?"muted":"unmuted",tn=[{value:"paused",icon:b.jsx(it.Play,{strokeWidth:1.6}),ariaLabel:"Play audio analysis",title:"Play audio analysis"},{value:"playing",icon:b.jsx(it.Pause,{strokeWidth:1.6}),ariaLabel:"Pause audio analysis",title:"Pause audio analysis"}],nn=[{value:"muted",icon:b.jsx(it.VolumeX,{strokeWidth:1.6}),ariaLabel:"Unmute audio output",title:"Unmute audio output"},{value:"unmuted",icon:b.jsx(it.Volume2,{strokeWidth:1.6}),ariaLabel:"Mute audio output",title:"Mute audio output"}],at=W(Qe,0,Se),Ze=W(bt,0,Se),rn=Math.max(.001,At(Ze,Pn)*.25),st=e.useCallback(r=>{const _=le(r);nt.current+=1,Ge({ratio:_,token:nt.current})},[]),Ft=e.useCallback(r=>{if(!r?.length)return;(!Te.current||Te.current.length!==r.length)&&(Te.current=new Uint8Array(r.length)),Te.current.set(r);const _=be.current;_.version+=1,_.binCount=r.length},[]),on=e.useCallback(r=>{if(!S)return;const _=le(r);me||(xe.current=_)},[S,me]),an=e.useCallback(()=>{S&&De(!0)},[S]),sn=e.useCallback(r=>{if(!S)return;const _=le(r);xe.current=_,st(_)},[S,st]),un=e.useCallback(r=>{if(!S)return;const _=le(r);xe.current=_,st(_),De(!1)},[S,st]);return e.useEffect(()=>{S||(xe.current=0,De(!1),Ge(null))},[S]),b.jsx(tt.AnimationSuspensionProvider,{suspended:A,children:b.jsxs("div",{style:{width:"100%",maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column"},children:[b.jsxs("div",{style:{width:"100%",minHeight:Rt,borderTop:`1px solid ${Ae}`,borderLeft:`${ze}px solid ${Ae}`,borderRight:`${ze}px solid ${Ae}`,borderBottom:`1px solid ${a}`,borderTopLeftRadius:3,borderTopRightRadius:3,background:a,display:"flex",alignItems:"center",overflow:"hidden",gap:Be,padding:`0 ${Be}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Be,flexShrink:0},children:b.jsx(Vt.IconButton,{behavior:"cycle",value:Jt,options:tn,onChange:r=>qe(r==="playing"),borderStyle:"none",fontSize:i,colorA:m,colorB:a})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Be},children:[b.jsx("div",{ref:_t,style:{display:"flex",minWidth:0},children:b.jsx(Ce.LFOSlider,{label:"Bins",variant:"basic",min:1,max:1024,step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:g,onUserChange:r=>{$e(Fe(r))},onAnimatedUpdate:r=>{$e(Fe(r))},style:{gap:0}})}),b.jsx(ln.SegmentBar,{ariaLabel:"Bin interpolation",showLabel:!1,options:En,value:ot,onChange:r=>{oe(Ct(r,"discrete"))},colorA:m,colorB:a,borderStyle:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},fontSize:i,style:{gap:0,minWidth:0}}),b.jsx(Ce.LFOSlider,{label:"Min",variant:"basic",min:0,max:Math.max(0,U-lt),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:Me,onUserChange:Pt,onAnimatedUpdate:Pt,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Ce.LFOSlider,{label:"Max",variant:"basic",min:lt,max:Math.max(lt,U),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:Ie,onUserChange:Et,onAnimatedUpdate:Et,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}})]})]}),s.type==="buffer"?b.jsx(In,{src:s.src,loop:s.loop,playing:ie,analysisActions:I,onProgress:on,seekTarget:xt,analyserSmoothing:Ke,attackMs:at,releaseMs:Ze,blurSigma:we,targetBins:g,onRawFftFrame:Ft,frequencyMin:Mt,frequencyMax:yt,onSampleRateChange:Tt,muted:Pe,suspended:A}):b.jsx(_n,{source:s,playing:ie,analysisActions:I,analyserSmoothing:Ke,attackMs:at,releaseMs:Ze,blurSigma:we,targetBins:g,onRawFftFrame:Ft,frequencyMin:Mt,frequencyMax:yt,onSampleRateChange:Tt,muted:Pe,suspended:A}),b.jsx("div",{style:{borderTop:`1px solid ${Qt}`,borderLeft:`${ze}px solid ${Ae}`,borderRight:`${ze}px solid ${Ae}`,borderRadius:0,borderBottom:`1px solid ${a}`,overflow:"hidden",background:"linear-gradient(180deg, #0a0a0a, #1a1a1a)"},children:b.jsx(Xt,{heightUnits:u,unitSizePx:Rt,maxWidth:"100%",maxBins:g,peakDecay:rn,playbackRatioRef:xe,showPlaybackIndicator:S,onScrubStart:S?an:void 0,onScrub:S?sn:void 0,onScrubEnd:S?un:void 0,activeColor:m,inactiveColor:a,rawFftDataRef:Te,rawFftMetaRef:be,attackMs:at,releaseMs:Ze,blurSigma:we,discreteBins:ce,frequencyMin:Mt,frequencyMax:yt,suspended:A})}),b.jsxs("div",{style:{width:"100%",minHeight:Rt,borderTop:`1px solid ${m}`,borderLeft:`${ze}px solid ${Ae}`,borderRight:`${ze}px solid ${Ae}`,borderBottom:`1px solid ${Ae}`,borderBottomLeftRadius:3,borderBottomRightRadius:3,background:a,color:Zt,display:"flex",alignItems:"center",overflow:"hidden",gap:Be,padding:`0 ${Be}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Be,flexShrink:0},children:b.jsx(Vt.IconButton,{behavior:"cycle",value:en,options:nn,onChange:r=>_e(r==="muted"),borderStyle:"none",fontSize:i,colorA:m,colorB:a})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Be},children:[b.jsx(Ce.LFOSlider,{label:"Atk",variant:"basic",min:0,max:Se,step:pt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:at,onUserChange:r=>ge(ke(r)),onAnimatedUpdate:r=>ge(ke(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Ce.LFOSlider,{label:"Rel",variant:"basic",min:0,max:Se,step:pt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:Ze,onUserChange:r=>je(ke(r)),onAnimatedUpdate:r=>je(ke(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Ce.LFOSlider,{label:"Sm",variant:"basic",min:0,max:1,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:Ke,onUserChange:r=>B(ft(r)),onAnimatedUpdate:r=>B(ft(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}}),b.jsx(Ce.LFOSlider,{label:"σ",variant:"basic",min:0,max:3,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:m,colorB:a,fontSize:i,value:we,onUserChange:r=>He(dt(r)),onAnimatedUpdate:r=>He(dt(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}})]})]})]})})}function In({src:t,loop:o=!0,playing:n,analysisActions:f,seekTarget:M,onProgress:s,analyserSmoothing:u=.8,attackMs:k=Bt,releaseMs:p=kt,blurSigma:C=0,targetBins:x=1024,onRawFftFrame:c,frequencyMin:d=0,frequencyMax:P=1,onSampleRateChange:q,muted:y=!0,suspended:O}){const z=tt.useAnimationSuspended(O),{setAudioBins:D,setAudioBinCount:E,setAudioMaxMagnitude:G,getBinCount:Y}=f,L=e.useRef(null),H=e.useRef(null),K=e.useRef(null),Z=e.useRef(null),ae=e.useRef(null),X=e.useRef(null),j=e.useRef(0),F=e.useRef(null),pe=e.useRef(s),fe=e.useRef(le(u??.8)),ve=e.useRef(q),he=e.useRef(y),ne=e.useRef(mt()),se=e.useRef(null),de=e.useRef(null),ue=e.useRef(new Map),re=e.useRef(null),J=e.useRef(!1);e.useEffect(()=>{pe.current=s},[s]),e.useEffect(()=>{ve.current=q},[q]),e.useEffect(()=>{he.current=y;const a=ae.current,h=L.current;a&&h&&a.gain.setTargetAtTime(y?0:1,h.currentTime,.01)},[y]),e.useEffect(()=>{const a=le(u??.8);fe.current=a,H.current&&(H.current.smoothingTimeConstant=a)},[u]);const R=e.useCallback(()=>X.current?.duration??0,[]),A=e.useCallback(a=>{const h=R();if(h<=0)return 0;const v=a%h,w=v<0?v+h:v,T=Math.min(h*.001,1e-4)||1e-4;return Math.min(w,Math.max(0,h-T))},[R]),N=e.useCallback(()=>{if(R()<=0)return 0;const h=A(j.current),v=F.current,w=L.current;if(!w||v==null)return h;const T=w.currentTime-v;return A(h+T)},[R,A]),i=e.useCallback(()=>{try{Z.current?.stop()}catch{}Z.current?.disconnect(),ae.current?.disconnect(),Z.current=null,ae.current=null},[]);e.useEffect(()=>{const a=ue.current;let h=!1;async function v(){try{const w=new AudioContext;L.current=w,ve.current?.(w.sampleRate);const T=await fetch(t);if(!T.ok)throw new Error(`Failed to load audio sample: ${T.status}`);const I=await T.arrayBuffer(),S=await w.decodeAudioData(I);if(h){ht(w);return}X.current=S,j.current=0,F.current=null;const ee=w.createAnalyser();ee.fftSize=2048,ee.smoothingTimeConstant=fe.current,H.current=ee,K.current=new Uint8Array(new ArrayBuffer(ee.frequencyBinCount)),E(ee.frequencyBinCount),G(1)}catch(w){console.error("Failed to load audio for FFT",w)}}return v(),()=>{h=!0,H.current=null,K.current=null,i(),ht(L.current),L.current=null,Z.current=null,ae.current=null,X.current=null,j.current=0,F.current=null,ne.current=mt(),se.current=null,de.current=null,a.clear(),re.current=null,J.current=!1}},[E,G,t,i]);const V=e.useCallback(()=>{j.current=N(),F.current=null,i()},[N,i]),m=e.useCallback(async a=>{if(!X.current||!L.current)return;const h=L.current;h.state==="suspended"&&await h.resume().catch(()=>{});const v=H.current??h.createAnalyser();v.fftSize=2048,v.smoothingTimeConstant=fe.current,H.current=v;const w=A(typeof a=="number"?a:N());j.current=w,F.current=h.currentTime,i();const T=h.createBufferSource();T.buffer=X.current,T.loop=o;const I=h.createGain();I.gain.value=he.current?0:1,T.connect(v),v.connect(I),I.connect(h.destination),T.start(0,w),Z.current=T,ae.current=I,K.current||(K.current=new Uint8Array(new ArrayBuffer(v.frequencyBinCount)),E(v.frequencyBinCount))},[N,o,E,i,A]);return e.useEffect(()=>(n?m():V(),()=>{V()}),[n,m,V]),e.useEffect(()=>{if(!M)return;const a=R();if(a<=0)return;const h=le(M.ratio),v=A(h*a);j.current=v,n&&X.current&&L.current?m(v):F.current=null},[R,n,M,m,A]),jt.useFrame(z?null:(a,h)=>{if(!n){if(!J.current){const I=re.current??Y();I>0&&(D(new Array(I).fill(0)),E(I));const S=K.current;S&&c&&(S.fill(0),c(S)),J.current=!0}return}J.current=!1;const v=H.current,w=K.current;if(v&&w){v.getByteFrequencyData(w),c&&c(w);const S=Yt(w,{attackMs:W(k,0,Se),releaseMs:W(p,0,Se),dtSec:h,blurSigma:Math.max(0,C||0),targetBins:W(Math.round(x||w.length),1,w.length),frequencyMin:d,frequencyMax:P},ne.current,se,de,ue.current).resampled;D(Array.from(S)),re.current!==S.length&&(re.current=S.length,E(S.length))}const T=R();if(T>0){const I=N()/T;pe.current?.(I)}}),null}function _n({source:t,playing:o,analysisActions:n,analyserSmoothing:f=.8,attackMs:M=Bt,releaseMs:s=kt,blurSigma:u=0,targetBins:k=1024,onRawFftFrame:p,frequencyMin:C=0,frequencyMax:x=1,onSampleRateChange:c,muted:d=!0,suspended:P}){const q=tt.useAnimationSuspended(P),{setAudioBins:y,setAudioBinCount:O,setAudioMaxMagnitude:z,getBinCount:D}=n,E=e.useRef(null),G=e.useRef(null),Y=e.useRef(null),L=e.useRef(null),H=e.useRef(null),K=e.useRef(le(f??.8)),Z=e.useRef(c),ae=e.useRef(d),X=e.useRef(!1),j=e.useRef(!1),F=e.useRef(!1),pe=e.useRef(mt()),fe=e.useRef(null),ve=e.useRef(null),he=e.useRef(new Map),ne=e.useRef(null),se=t.type==="mediaStream"?t.stream:null,de=t.type==="mediaStream"?t.context:void 0,ue=t.type==="audioNode"?t.node:null;e.useEffect(()=>{Z.current=c},[c]),e.useEffect(()=>{ae.current=d;const R=L.current,A=E.current;R&&A&&R.gain.setTargetAtTime(d?0:1,A.currentTime,.01)},[d]),e.useEffect(()=>{const R=le(f??.8);K.current=R,G.current&&(G.current.smoothingTimeConstant=R)},[f]);const re=e.useCallback(()=>{if(j.current)return;const R=Y.current,A=G.current,N=L.current,i=E.current;!R||!A||!N||!i||(R.connect(A),A.connect(N),N.connect(i.destination),j.current=!0)},[]),J=e.useCallback(()=>{if(j.current){try{const R=Y.current,A=G.current;R&&A&&R.disconnect(A)}catch{}try{G.current?.disconnect()}catch{}try{L.current?.disconnect()}catch{}j.current=!1}},[]);return e.useEffect(()=>{let R=!1;async function A(){let i,V,m=!1;if(t.type==="mediaStream"){if(i=de??new AudioContext,m=!de,!se)return;V=i.createMediaStreamSource(se)}else{if(!ue)return;V=ue,i=ue.context}if(R){m&&ht(i);return}X.current=m,E.current=i,Y.current=V,Z.current?.(i.sampleRate);const a=i.createAnalyser();a.fftSize=2048,a.smoothingTimeConstant=K.current,G.current=a,H.current=new Uint8Array(new ArrayBuffer(a.frequencyBinCount)),ne.current=a.frequencyBinCount,O(a.frequencyBinCount),z(1);const h=i.createGain();h.gain.value=ae.current?0:1,L.current=h,j.current=!1,F.current=!1}A();const N=he.current;return()=>{R=!0,J(),G.current=null,H.current=null,Y.current=null,L.current=null,X.current&&ht(E.current),E.current=null,X.current=!1,pe.current=mt(),fe.current=null,ve.current=null,N.clear(),ne.current=null,F.current=!1}},[re,J,O,z,t.type,de,se,ue]),e.useEffect(()=>{const R=E.current;o?(R?.state==="suspended"&&R.resume().catch(()=>{}),re(),F.current=!1):(J(),F.current=!1)},[re,J,o]),jt.useFrame(q?null:(R,A)=>{if(!o||!j.current){if(!F.current){const V=ne.current??D();V>0&&(y(new Array(V).fill(0)),O(V));const m=H.current;m&&p&&(m.fill(0),p(m)),F.current=!0}return}const N=G.current,i=H.current;if(N&&i){N.getByteFrequencyData(i),p&&p(i);const m=Yt(i,{attackMs:W(M,0,Se),releaseMs:W(s,0,Se),dtSec:A,blurSigma:Math.max(0,u||0),targetBins:W(Math.round(k||i.length),1,i.length),frequencyMin:C,frequencyMax:x},pe.current,fe,ve,he.current).resampled;y(Array.from(m)),ne.current!==m.length&&(ne.current=m.length,O(m.length))}}),null}exports.AudioControls=Tn;exports.AudioFFTWindow=Xt;
//# sourceMappingURL=AudioControls-CFqAvREW.cjs.map
