"use strict";const b=require("react/jsx-runtime"),e=require("react"),st=require("lucide-react"),Ke=require("./animationSuspension-CaeFoamB.cjs"),Me=require("./LFOSlider-Dv5OaOtq.cjs"),Gt=require("./frameLoop-BQNqp_Qp.cjs"),_t=require("./flexoki-BtN-1xqJ.cjs"),cn=require("./panelGap-C0MXgSjL.cjs"),Ut=require("./IconButton-CqkPHVvp.cjs"),ln=require("./SegmentBar-BflaPbZe.cjs"),fn=require("typegpu"),$t=require("./hooks-CPN0v2jj.cjs");let yt=null,ut=null;const dn=[.16,.47,.86],mn=[.02,.02,.04],jt=24,pn=jt*Float32Array.BYTES_PER_ELEMENT,Le=64,hn=.2,xn=4,Rt=12,Lt=.01,gn=20,bn=80,Vt=(t,o,n)=>Math.max(o,Math.min(n,t)),zt=(t,o)=>{if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:Math.max(0,Math.min(1,1-Math.exp(-d/n)))};async function Mn(){return navigator.gpu?yt||(ut||(ut=fn.init().then(t=>(yt=t,t)).catch(t=>(console.error("AudioFFTWindow: TypeGPU init failed",t),ut=null,null))),ut):null}function Ue(t){return Number.parseInt(t,16)/255}function Nt(t,o=[0,0,0]){if(!t)return o;const n=t.trim();if(n.startsWith("#")){if(n.length===7)return[Ue(n.slice(1,3)),Ue(n.slice(3,5)),Ue(n.slice(5,7))];if(n.length===4)return[Ue(n[1]+n[1]),Ue(n[2]+n[2]),Ue(n[3]+n[3])]}return o}function yn(t){const o=t.createShaderModule({code:`
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
    let radius = min(${Rt}, i32(ceil(uniforms.blurSigma * 3.0)));
    if (radius > 0) {
      var accum = current;
      var weightSum = 1.0;
      for (var offset = 1; offset <= ${Rt}; offset = offset + 1) {
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
const MAX_RADIUS : i32 = ${Rt};

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
`});return{computeModule:o,renderModule:n}}function Ot(t,o){return t.createTexture({size:[o,1,1],format:"rgba32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})}function Rn(t){t&&(t.uniformBuffer.destroy(),t.rawBuffer.destroy(),t.stateTextures[0].destroy(),t.stateTextures[1].destroy())}function vn(t,o,n,d){const M=o.getContext("webgpu");if(!M)return null;const i=navigator.gpu.getPreferredCanvasFormat();M.configure({device:t,format:i,alphaMode:"opaque"});const{computeModule:u,renderModule:C}=yn(t),m=t.createBuffer({size:pn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),B=t.createBuffer({size:Math.max(1,d)*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),x=[Ot(t,n),Ot(t,n)],l=x.map(y=>y.createView({dimension:"2d"})),f=t.createComputePipeline({layout:"auto",compute:{module:u,entryPoint:"cs_main"}}),F=t.createRenderPipeline({layout:"auto",vertex:{module:C,entryPoint:"vs_main"},fragment:{module:C,entryPoint:"fs_main",targets:[{format:i}]},primitive:{topology:"triangle-list"}}),k=f.getBindGroupLayout(0),P=F.getBindGroupLayout(0),V=[t.createBindGroup({layout:k,entries:[{binding:0,resource:{buffer:B}},{binding:1,resource:l[0]},{binding:2,resource:l[1]},{binding:3,resource:{buffer:m}}]}),t.createBindGroup({layout:k,entries:[{binding:0,resource:{buffer:B}},{binding:1,resource:l[1]},{binding:2,resource:l[0]},{binding:3,resource:{buffer:m}}]})],z=[t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[0]}]}),t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[1]}]})],L=Math.max(1,Math.ceil(n/Le));return{context:M,format:i,uniformBuffer:m,rawBuffer:B,rawCapacity:Math.max(1,d),stateTextures:x,stateStorageViews:l,computePipeline:f,renderPipeline:F,computeBindGroups:V,renderBindGroups:z,workgroupCount:L,binCapacity:n}}function Wt({heightUnits:t=6,unitSizePx:o,maxWidth:n,maxBins:d=1024,playbackRatio:M=0,showPlaybackIndicator:i=!0,onScrubStart:u,onScrub:C,onScrubEnd:m,activeColor:B,inactiveColor:x,peakDecay:l=.05,rawFftDataRef:f,rawFrameVersion:F,rawBinCount:k=0,attackMs:P=gn,releaseMs:V=bn,blurSigma:z=0,discreteBins:L=!0,frequencyMin:y=0,frequencyMax:q=1,suspended:D}){const $=e.useRef(null),K=e.useRef(null),re=e.useRef(null),[Q,X]=e.useState(()=>typeof navigator<"u"&&!!navigator.gpu),[E,G]=e.useState({width:480,height:Math.max(1,t)*o}),[de,me]=e.useState(()=>Math.max(1,Math.ceil(Math.max(1,Math.floor(d))/Le)*Le)),[pe,be]=e.useState(()=>Math.max(1,k||1)),J=e.useRef(Math.max(0,Math.min(1,M))),ce=e.useRef(Math.max(0,z)),le=e.useRef(Math.max(0,P)),oe=e.useRef(Math.max(0,V)),ae=e.useRef(Math.max(5e-4,l)),j=e.useRef(L?1:0),R=e.useRef(Math.max(0,Math.min(1,y))),I=e.useRef(Math.max(0,Math.min(1,q))),_=e.useRef(Math.max(1,Math.floor(d))),p=e.useRef(!1),h=e.useRef(typeof performance<"u"?performance.now():Date.now()),g=e.useRef(new Float32Array(jt)),a=e.useRef(null),s=e.useRef(0),A=e.useRef(null),v=e.useRef(null),W=e.useRef(null),H=Ke.useAnimationSuspended(D),se=e.useRef(H),U=e.useRef({active:!1,pointerId:null}),Ae=e.useMemo(()=>Nt(B,dn),[B]),Z=e.useMemo(()=>Nt(x,mn),[x]),Re=e.useRef(Ae),Te=e.useRef(Z);e.useEffect(()=>{if(se.current=H,H){v.current!==null&&(cancelAnimationFrame(v.current),v.current=null),h.current=typeof performance<"u"?performance.now():Date.now();return}W.current?.()},[H]),e.useEffect(()=>{J.current=Math.max(0,Math.min(1,M))},[M]),e.useEffect(()=>{ce.current=Math.max(0,z)},[z]),e.useEffect(()=>{le.current=Math.max(0,P)},[P]),e.useEffect(()=>{oe.current=Math.max(0,V)},[V]),e.useEffect(()=>{ae.current=Math.max(5e-4,l)},[l]),e.useEffect(()=>{j.current=L?1:0},[L]),e.useEffect(()=>{R.current=Vt(y,0,Math.min(1,q-Lt))},[y,q]),e.useEffect(()=>{I.current=Vt(q,Math.min(1,y+Lt),1)},[q,y]),e.useEffect(()=>{p.current=!0},[y,q,d]),e.useEffect(()=>{_.current=Math.max(1,Math.floor(d));const c=Math.max(1,Math.ceil(_.current/Le)*Le);me(w=>w===c?w:c)},[d]),e.useEffect(()=>{!k||k<=0||be(c=>k>c?Math.max(k,c):c)},[k]),e.useEffect(()=>{p.current=!0},[F]),e.useEffect(()=>{Re.current=Ae},[Ae]),e.useEffect(()=>{Te.current=Z},[Z]),e.useEffect(()=>{const c=Math.max(1,t)*o;G(w=>({width:w.width,height:c}))},[t,o]),e.useEffect(()=>{const c=K.current;if(!c)return;const w=()=>{const he=c.getBoundingClientRect();he.width&&G(Fe=>({width:Math.round(he.width),height:Fe.height}))};w();const Y=typeof ResizeObserver<"u"?new ResizeObserver(w):null;return Y?Y.observe(c):window.addEventListener("resize",w),()=>{Y?.disconnect(),Y||window.removeEventListener("resize",w)}},[]);const ue=e.useCallback(c=>{const w=K.current;if(!w)return null;const Y=w.getBoundingClientRect();if(!Y.width)return null;const he=(c-Y.left)/Y.width;return Math.max(0,Math.min(1,he))},[]),mt=e.useCallback(c=>{if(!C&&!m&&!u)return;const w=ue(c.clientX);w!=null&&(U.current={active:!0,pointerId:c.pointerId},c.currentTarget.setPointerCapture(c.pointerId),c.preventDefault(),u?.(),C?.(w))},[ue,C,m,u]),pt=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;const w=ue(c.clientX);w!=null&&(c.preventDefault(),C?.(w))},[ue,C]),Be=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const w=ue(c.clientX);w!=null&&m?.(w)},[ue,m]),Qe=e.useCallback(c=>{if(U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const w=ue(c.clientX);w!=null&&m?.(w)},[ue,m]);e.useEffect(()=>{if(!Q)return;let c=!1;async function w(){const Y=await Mn();if(!Y||c){Y||X(!1);return}const he=$.current;if(!he)return;const Fe=vn(Y.device,he,de,pe);if(!Fe){X(!1);return}a.current=Fe,s.current=0,p.current=!0;const Ne=Oe=>{if(c)return;if(se.current){v.current=null,h.current=Oe;return}const qe=Y.device,De=qe.queue,ee=a.current;if(!ee)return;const fe=$.current;if(!fe)return;const Ge=window.devicePixelRatio||1,Ze=Math.max(1,Math.floor(E.width*Ge)),Je=Math.max(1,Math.floor(E.height*Ge));(fe.width!==Ze||fe.height!==Je)&&(fe.width=Ze,fe.height=Je),fe.style.width!==`${Math.round(E.width)}px`&&(fe.style.width=`${Math.round(E.width)}px`),fe.style.height!==`${Math.round(E.height)}px`&&(fe.style.height=`${Math.round(E.height)}px`);const O=Math.max(5e-4,(Oe-h.current)/1e3);h.current=Oe;const $e=Math.max(1,_.current),je=$e>1?1/($e-1):1,S=g.current,We=Math.max(1,k||0);if(S[0]=$e,S[1]=i?J.current:-1,S[2]=ce.current,S[3]=je,S[4]=Re.current[0],S[5]=Re.current[1],S[6]=Re.current[2],S[7]=1,S[8]=Te.current[0],S[9]=Te.current[1],S[10]=Te.current[2],S[11]=1,S[12]=zt(le.current,O),S[13]=zt(oe.current,O),S[14]=O,S[15]=xn,S[16]=ae.current,S[17]=hn,S[18]=j.current,S[19]=We,S[20]=R.current,S[21]=I.current,S[22]=0,S[23]=0,De.writeBuffer(ee.uniformBuffer,0,S.buffer,S.byteOffset,S.byteLength),p.current&&f?.current){const ie=f.current,xe=ee.rawCapacity;(!A.current||A.current.length!==xe)&&(A.current=new Float32Array(xe));const Ee=A.current,et=Math.min(xe,ie.length);for(let te=0;te<et;te+=1)Ee[te]=ie[te]/255;for(let te=et;te<xe;te+=1)Ee[te]=0;De.writeBuffer(ee.rawBuffer,0,Ee.buffer,Ee.byteOffset,Ee.byteLength),p.current=!1}const Ie=qe.createCommandEncoder();if(f?.current){const ie=Ie.beginComputePass(),xe=ee.computeBindGroups[s.current];ie.setPipeline(ee.computePipeline),ie.setBindGroup(0,xe),ie.dispatchWorkgroups(ee.workgroupCount,1,1),ie.end(),s.current=s.current===0?1:0}const ke=ee.context.getCurrentTexture().createView(),Pe=Ie.beginRenderPass({colorAttachments:[{view:ke,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});Pe.setPipeline(ee.renderPipeline);const xt=ee.renderBindGroups[s.current];Pe.setBindGroup(0,xt),Pe.draw(6,1,0,0),Pe.end(),De.submit([Ie.finish()]),v.current=requestAnimationFrame(Ne)};W.current=()=>{c||v.current!==null||(h.current=typeof performance<"u"?performance.now():Date.now(),v.current=requestAnimationFrame(Ne))},se.current||W.current()}return w(),()=>{c=!0,v.current!==null&&(cancelAnimationFrame(v.current),v.current=null),W.current=null,Rn(a.current),a.current=null}},[Q,E.width,E.height,de,pe,f,k,i]);const Ve=typeof n=="number"?`${n}px`:n??"100%",ht=Math.round(E.width),ze=Math.round(E.height);return b.jsx("div",{ref:K,className:"audio-fft-window",style:{width:"100%",maxWidth:Ve},children:b.jsxs("div",{className:"audio-fft-window__canvas-wrapper",style:{width:"100%",height:`${ze}px`,position:"relative",overflow:"hidden",background:"transparent"},children:[Q?b.jsx("canvas",{ref:$,width:ht,height:ze,style:{width:"100%",height:"100%",display:"block"}}):b.jsx("div",{className:"audio-fft-window__fallback",children:"WebGPU not available"}),b.jsx("div",{ref:re,className:"audio-fft-window__interaction-layer",onPointerDown:mt,onPointerMove:pt,onPointerUp:Be,onPointerLeave:Be,onPointerCancel:Qe,role:"presentation"})]})})}function wn(t,o){const n=_t.flexoki.base[700],d=_t.flexoki.base[100];return{safeA:t??n,safeB:o??d}}const ne=t=>Math.max(0,Math.min(1,t)),N=(t,o,n)=>Math.max(o,Math.min(n,t)),Cn=44100,qt=Cn/2,it=10,Sn=18,Ce=8,ft=10,ye=500,Ct=20,St=80,An=1/60,Bn=[{value:"discrete",label:"Step"},{value:"interpolated",label:"Interp"}],ct=t=>Math.round(ne(t)*10)/10,lt=t=>Math.round(N(t,0,3)*10)/10,Se=t=>Math.round(N(t,0,ye)/ft)*ft,wt=(t,o)=>{if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:ne(1-Math.exp(-d/n))};function vt(t,o){return t==="discrete"||t==="interpolated"?t:o}function ge(t,o,n,d){const[M,i]=$t.useControlValue(d),u=d!==void 0&&t===void 0,C=u?M:t,[m,B]=e.useState(o),x=C!==void 0,l=x?C:m,f=e.useCallback(F=>{x||B(F),u&&i(F),n?.(F)},[x,n,i,u]);return e.useEffect(()=>{!u||M!==void 0||i(o)},[o,i,u,M]),[l,f,x]}function Dt(t){const o=t||16,d=o*.35,i=o*1;return Math.max(Math.round(i+d*2+2),Math.round(o+d*1.5),Sn)}function dt(t){!t||t.state==="closed"||t.close().catch(()=>{})}function kn({ariaLabel:t="Audio controls",fontSize:o,colorA:n,colorB:d,borderStyle:M,source:i,heightUnits:u=6,suspended:C,audioAnalysisStore:m,controlIdPrefix:B,controlIds:x,defaultPlaying:l=!1,playing:f,onPlayingChange:F,defaultMuted:k=!0,muted:P,onMutedChange:V,defaultBinCount:z=256,binCount:L,onBinCountChange:y,defaultBinInterpolation:q="discrete",binInterpolation:D,onBinInterpolationChange:$,defaultFrequencyMin:K=0,frequencyMin:re,onFrequencyMinChange:Q,defaultFrequencyMax:X=qt,frequencyMax:E,onFrequencyMaxChange:G,defaultFftAttack:de=Ct,fftAttack:me,onFftAttackChange:pe,defaultFftRelease:be=St,fftRelease:J,onFftReleaseChange:ce,defaultFftBlurSigma:le=0,fftBlurSigma:oe,onFftBlurSigmaChange:ae,defaultAnalyserSmoothing:j=.8,analyserSmoothing:R,onAnalyserSmoothingChange:I}){const _=Ke.useAnimationSuspended(C),p=cn.usePanelTheme(),h=o??p?.fontSize??12,g=M??p?.borderStyle??"a",{safeA:a,safeB:s}=wn(n??p?.colorA,d??p?.colorB),A=Me.useAudioAnalysisStore(),v=e.useRef(null),W=v.current??Me.createAudioAnalysisStore({bins:[],binCount:0,maxMagnitude:1});v.current||(v.current=W);const H=m??A??W,se=e.useMemo(()=>({setAudioBins:H.setAudioBins,setAudioBinCount:H.setAudioBinCount,setAudioMaxMagnitude:H.setAudioMaxMagnitude}),[H]),U=i.type==="buffer",Ae=$t.useResolvedControlIdPrefix(B,t),Z=e.useCallback(r=>{const T=x?.[r];if(T)return T;if(!(r==="playing"||r==="muted"))return Ae?`${Ae}.${r}`:void 0},[x,Ae]),[Re,Te]=ge(f,l,F,Z("playing")),[ue,mt]=ge(P,k,V,Z("muted")),[pt,Be]=e.useState(0),[Qe,Ve]=e.useState(!1),[ht,ze]=e.useState(null),c=e.useRef(0),w=e.useCallback(r=>N(Math.round(r||0),1,1024),[]),[Y,he]=ge(L,w(z),y,Z("binCount")),[Fe,Ne]=ge(R,ct(ne(j)),I,Z("analyserSmoothing")),[Oe,qe]=ge(me,Se(de),pe,Z("fftAttack")),[De,ee]=ge(J,Se(be),ce,Z("fftRelease")),[fe,Ge]=ge(oe,lt(le),ae,Z("fftBlurSigma")),[Ze,Je]=ge(D,vt(q,"discrete"),$,Z("binInterpolation")),[O,$e]=e.useState(qt),[je,S]=ge(re,K,Q,Z("frequencyMin")),[We,Ie]=ge(E,X,G,Z("frequencyMax")),ke=e.useRef(null),[Pe,xt]=e.useState({version:0,binCount:0}),ie=w(Y),xe=ct(ne(Fe)),Ee=Se(Oe),et=Se(De),te=lt(fe),At=vt(Ze,"discrete"),Xt=At==="discrete",ve=e.useMemo(()=>Math.min(it,O),[O]),{freqMinHz:tt,freqMaxHz:nt}=e.useMemo(()=>{const r=Number.isFinite(je??Number.NaN)?je:0,T=Number.isFinite(We??Number.NaN)?We:O,Xe=N(T,ve,O),Ye=N(r,0,Math.max(0,Xe-ve)),at=N(Xe,Ye+ve,O);return{freqMinHz:Ye,freqMaxHz:at}},[je,We,ve,O]),Yt=O>0?tt/O:0,Kt=O>0?nt/O:1,gt=N(Yt,0,1),bt=N(Kt,0,1),Bt=e.useCallback(r=>{const T=N(r,0,Math.max(0,nt-ve));S(T)},[nt,ve,S]),kt=e.useCallback(r=>{const T=N(r,Math.min(O,tt+ve),O);Ie(T)},[tt,ve,O,Ie]),Pt=e.useCallback(r=>{$e(Math.max(1,r/2))},[]),[Mt,Et]=e.useState(()=>Dt(h)),Tt=e.useRef(null);e.useEffect(()=>{const r=Dt(h);Et(T=>Math.abs(T-r)<.5?T:r)},[h]),e.useLayoutEffect(()=>{const r=Tt.current;if(!r||typeof ResizeObserver>"u")return;const T=()=>{const Ye=r.getBoundingClientRect();if(!Ye.height)return;const at=Math.round(Ye.height);Et(It=>Math.abs(It-at)<.5?It:at)};T();const Xe=new ResizeObserver(()=>T());return Xe.observe(r),()=>Xe.disconnect()},[]);const Qt=a,_e=g==="none"?0:1,we=g==="none"?"transparent":g==="b"?s:a,Zt=a,Jt=Re?"playing":"paused",en=ue?"muted":"unmuted",tn=[{value:"paused",icon:b.jsx(st.Play,{strokeWidth:1.6}),ariaLabel:"Play audio analysis",title:"Play audio analysis"},{value:"playing",icon:b.jsx(st.Pause,{strokeWidth:1.6}),ariaLabel:"Pause audio analysis",title:"Pause audio analysis"}],nn=[{value:"muted",icon:b.jsx(st.VolumeX,{strokeWidth:1.6}),ariaLabel:"Unmute audio output",title:"Unmute audio output"},{value:"unmuted",icon:b.jsx(st.Volume2,{strokeWidth:1.6}),ariaLabel:"Mute audio output",title:"Mute audio output"}],rt=N(Ee,0,ye),He=N(et,0,ye),rn=Math.max(.001,wt(He,An)*.25),ot=e.useCallback(r=>{const T=ne(r);c.current+=1,ze({ratio:T,token:c.current})},[]),Ft=e.useCallback(r=>{r?.length&&((!ke.current||ke.current.length!==r.length)&&(ke.current=new Uint8Array(r.length)),ke.current.set(r),xt(T=>({version:T.version+1,binCount:r.length})))},[]),on=e.useCallback(r=>{if(!U)return;const T=ne(r);Qe||Be(T)},[U,Qe]),an=e.useCallback(()=>{U&&Ve(!0)},[U]),sn=e.useCallback(r=>{if(!U)return;const T=ne(r);Be(T),ot(T)},[U,ot]),un=e.useCallback(r=>{if(!U)return;const T=ne(r);Be(T),ot(T),Ve(!1)},[U,ot]);return e.useEffect(()=>{U||(Be(0),Ve(!1),ze(null))},[U]),b.jsx(Ke.AnimationSuspensionProvider,{suspended:_,children:b.jsxs("div",{style:{width:"100%",maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column"},children:[b.jsxs("div",{style:{width:"100%",minHeight:Mt,borderTop:`1px solid ${we}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderBottom:`1px solid ${s}`,borderTopLeftRadius:3,borderTopRightRadius:3,background:s,display:"flex",alignItems:"center",overflow:"hidden",gap:Ce,padding:`0 ${Ce}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Ce,flexShrink:0},children:b.jsx(Ut.IconButton,{behavior:"cycle",value:Jt,options:tn,onChange:r=>Te(r==="playing"),borderStyle:"none",fontSize:h,colorA:a,colorB:s})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Ce},children:[b.jsx("div",{ref:Tt,style:{display:"flex",minWidth:0},children:b.jsx(Me.LFOSlider,{label:"Bins",variant:"basic",min:1,max:1024,step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:ie,onUserChange:r=>{he(w(r))},onAnimatedUpdate:r=>{he(w(r))},style:{gap:0}})}),b.jsx(ln.SegmentBar,{ariaLabel:"Bin interpolation",showLabel:!1,options:Bn,value:At,onChange:r=>{Je(vt(r,"discrete"))},colorA:a,colorB:s,borderStyle:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},fontSize:h,style:{gap:0,minWidth:0}}),b.jsx(Me.LFOSlider,{label:"Min",variant:"basic",min:0,max:Math.max(0,O-it),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:tt,onUserChange:Bt,onAnimatedUpdate:Bt,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Max",variant:"basic",min:it,max:Math.max(it,O),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:nt,onUserChange:kt,onAnimatedUpdate:kt,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}})]})]}),i.type==="buffer"?b.jsx(Pn,{src:i.src,loop:i.loop,playing:Re,analysisActions:se,onProgress:on,seekTarget:ht,analyserSmoothing:xe,attackMs:rt,releaseMs:He,blurSigma:te,targetBins:ie,onRawFftFrame:Ft,frequencyMin:gt,frequencyMax:bt,onSampleRateChange:Pt,muted:ue,suspended:_}):b.jsx(En,{source:i,playing:Re,analysisActions:se,analyserSmoothing:xe,attackMs:rt,releaseMs:He,blurSigma:te,targetBins:ie,onRawFftFrame:Ft,frequencyMin:gt,frequencyMax:bt,onSampleRateChange:Pt,muted:ue,suspended:_}),b.jsx("div",{style:{borderTop:`1px solid ${Qt}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderRadius:0,borderBottom:`1px solid ${s}`,overflow:"hidden",background:"linear-gradient(180deg, #0a0a0a, #1a1a1a)"},children:b.jsx(Wt,{heightUnits:u,unitSizePx:Mt,maxWidth:"100%",maxBins:ie,peakDecay:rn,playbackRatio:U?pt:0,showPlaybackIndicator:U,onScrubStart:U?an:void 0,onScrub:U?sn:void 0,onScrubEnd:U?un:void 0,activeColor:a,inactiveColor:s,rawFftDataRef:ke,rawFrameVersion:Pe.version,rawBinCount:Pe.binCount,attackMs:rt,releaseMs:He,blurSigma:te,discreteBins:Xt,frequencyMin:gt,frequencyMax:bt,suspended:_})}),b.jsxs("div",{style:{width:"100%",minHeight:Mt,borderTop:`1px solid ${a}`,borderLeft:`${_e}px solid ${we}`,borderRight:`${_e}px solid ${we}`,borderBottom:`1px solid ${we}`,borderBottomLeftRadius:3,borderBottomRightRadius:3,background:s,color:Zt,display:"flex",alignItems:"center",overflow:"hidden",gap:Ce,padding:`0 ${Ce}px`,boxSizing:"border-box"},children:[b.jsx("div",{style:{display:"flex",alignItems:"center",gap:Ce,flexShrink:0},children:b.jsx(Ut.IconButton,{behavior:"cycle",value:en,options:nn,onChange:r=>mt(r==="muted"),borderStyle:"none",fontSize:h,colorA:a,colorB:s})}),b.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Ce},children:[b.jsx(Me.LFOSlider,{label:"Atk",variant:"basic",min:0,max:ye,step:ft,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:rt,onUserChange:r=>qe(Se(r)),onAnimatedUpdate:r=>qe(Se(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Rel",variant:"basic",min:0,max:ye,step:ft,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:He,onUserChange:r=>ee(Se(r)),onAnimatedUpdate:r=>ee(Se(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"Sm",variant:"basic",min:0,max:1,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:xe,onUserChange:r=>Ne(ct(r)),onAnimatedUpdate:r=>Ne(ct(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}}),b.jsx(Me.LFOSlider,{label:"σ",variant:"basic",min:0,max:3,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:h,value:te,onUserChange:r=>Ge(lt(r)),onAnimatedUpdate:r=>Ge(lt(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}})]})]})]})})}function Pn({src:t,loop:o=!0,playing:n,analysisActions:d,seekTarget:M,onProgress:i,analyserSmoothing:u=.8,attackMs:C=Ct,releaseMs:m=St,blurSigma:B=0,targetBins:x=1024,onRawFftFrame:l,frequencyMin:f=0,frequencyMax:F=1,onSampleRateChange:k,muted:P=!0,suspended:V}){const z=Ke.useAnimationSuspended(V),{setAudioBins:L,setAudioBinCount:y,setAudioMaxMagnitude:q}=d,D=e.useRef(null),$=e.useRef(null),K=e.useRef(null),re=e.useRef(null),Q=e.useRef(null),X=e.useRef(null),E=e.useRef(0),G=e.useRef(null),de=e.useRef(i),me=e.useRef(ne(u??.8)),pe=e.useRef(k),be=e.useRef(P),J=e.useRef({previous:null,scratch:null,length:0,hasHistory:!1}),ce=e.useRef(null),le=e.useRef(null),oe=e.useRef(new Map),ae=e.useRef(null);e.useEffect(()=>{de.current=i},[i]),e.useEffect(()=>{pe.current=k},[k]),e.useEffect(()=>{be.current=P;const g=Q.current,a=D.current;g&&a&&g.gain.setTargetAtTime(P?0:1,a.currentTime,.01)},[P]),e.useEffect(()=>{const g=ne(u??.8);me.current=g,$.current&&($.current.smoothingTimeConstant=g)},[u]);const j=e.useCallback(()=>X.current?.duration??0,[]),R=e.useCallback(g=>{const a=j();if(a<=0)return 0;const s=g%a,A=s<0?s+a:s,v=Math.min(a*.001,1e-4)||1e-4;return Math.min(A,Math.max(0,a-v))},[j]),I=e.useCallback(()=>{if(j()<=0)return 0;const a=R(E.current),s=G.current,A=D.current;if(!A||s==null)return a;const v=A.currentTime-s;return R(a+v)},[j,R]),_=e.useCallback(()=>{try{re.current?.stop()}catch{}re.current?.disconnect(),Q.current?.disconnect(),re.current=null,Q.current=null},[]);e.useEffect(()=>{const g=oe.current;let a=!1;async function s(){try{const A=new AudioContext;D.current=A,pe.current?.(A.sampleRate);const v=await fetch(t);if(!v.ok)throw new Error(`Failed to load audio sample: ${v.status}`);const W=await v.arrayBuffer(),H=await A.decodeAudioData(W);if(a){dt(A);return}X.current=H,E.current=0,G.current=null;const se=A.createAnalyser();se.fftSize=2048,se.smoothingTimeConstant=me.current,$.current=se,K.current=new Uint8Array(new ArrayBuffer(se.frequencyBinCount)),y(se.frequencyBinCount),q(1)}catch(A){console.error("Failed to load audio for FFT",A)}}return s(),()=>{a=!0,$.current=null,K.current=null,_(),dt(D.current),D.current=null,re.current=null,Q.current=null,X.current=null,E.current=0,G.current=null,J.current={previous:null,scratch:null,length:0,hasHistory:!1},ce.current=null,le.current=null,g.clear(),ae.current=null}},[y,q,t,_]);const p=e.useCallback(()=>{E.current=I(),G.current=null,_()},[I,_]),h=e.useCallback(async g=>{if(!X.current||!D.current)return;const a=D.current;a.state==="suspended"&&await a.resume().catch(()=>{});const s=$.current??a.createAnalyser();s.fftSize=2048,s.smoothingTimeConstant=me.current,$.current=s;const A=R(typeof g=="number"?g:I());E.current=A,G.current=a.currentTime,_();const v=a.createBufferSource();v.buffer=X.current,v.loop=o;const W=a.createGain();W.gain.value=be.current?0:1,v.connect(s),s.connect(W),W.connect(a.destination),v.start(0,A),re.current=v,Q.current=W,K.current||(K.current=new Uint8Array(new ArrayBuffer(s.frequencyBinCount)),y(s.frequencyBinCount))},[I,o,y,_,R]);return e.useEffect(()=>(n?h():p(),()=>{p()}),[n,h,p]),e.useEffect(()=>{if(!M)return;const g=j();if(g<=0)return;const a=ne(M.ratio),s=R(a*g);E.current=s,n&&X.current&&D.current?h(s):G.current=null},[j,n,M,h,R]),Gt.useFrame(z?null:(g,a)=>{const s=$.current,A=K.current;if(s&&A){s.getByteFrequencyData(A),l&&l(A);const H=Ht(A,{attackMs:N(C,0,ye),releaseMs:N(m,0,ye),dtSec:a,blurSigma:Math.max(0,B||0),targetBins:N(Math.round(x||A.length),1,A.length),frequencyMin:f,frequencyMax:F},J.current,ce,le,oe.current).resampled;L(Array.from(H)),ae.current!==H.length&&(ae.current=H.length,y(H.length))}const v=j();if(v>0){const W=I()/v;de.current?.(W)}}),null}function En({source:t,playing:o,analysisActions:n,analyserSmoothing:d=.8,attackMs:M=Ct,releaseMs:i=St,blurSigma:u=0,targetBins:C=1024,onRawFftFrame:m,frequencyMin:B=0,frequencyMax:x=1,onSampleRateChange:l,muted:f=!0,suspended:F}){const k=Ke.useAnimationSuspended(F),{setAudioBins:P,setAudioBinCount:V,setAudioMaxMagnitude:z}=n,L=e.useRef(null),y=e.useRef(null),q=e.useRef(null),D=e.useRef(null),$=e.useRef(null),K=e.useRef(ne(d??.8)),re=e.useRef(l),Q=e.useRef(f),X=e.useRef(!1),E=e.useRef(!1),G=e.useRef(!1),de=e.useRef({previous:null,scratch:null,length:0,hasHistory:!1}),me=e.useRef(null),pe=e.useRef(null),be=e.useRef(new Map),J=e.useRef(null),ce=t.type==="mediaStream"?t.stream:null,le=t.type==="mediaStream"?t.context:void 0,oe=t.type==="audioNode"?t.node:null;e.useEffect(()=>{re.current=l},[l]),e.useEffect(()=>{Q.current=f;const R=D.current,I=L.current;R&&I&&R.gain.setTargetAtTime(f?0:1,I.currentTime,.01)},[f]),e.useEffect(()=>{const R=ne(d??.8);K.current=R,y.current&&(y.current.smoothingTimeConstant=R)},[d]);const ae=e.useCallback(()=>{if(E.current)return;const R=q.current,I=y.current,_=D.current,p=L.current;!R||!I||!_||!p||(R.connect(I),I.connect(_),_.connect(p.destination),E.current=!0)},[]),j=e.useCallback(()=>{if(E.current){try{const R=q.current,I=y.current;R&&I&&R.disconnect(I)}catch{}try{y.current?.disconnect()}catch{}try{D.current?.disconnect()}catch{}E.current=!1}},[]);return e.useEffect(()=>{let R=!1;async function I(){let p,h,g=!1;if(t.type==="mediaStream"){if(p=le??new AudioContext,g=!le,!ce)return;h=p.createMediaStreamSource(ce)}else{if(!oe)return;h=oe,p=oe.context}if(R){g&&dt(p);return}X.current=g,L.current=p,q.current=h,re.current?.(p.sampleRate);const a=p.createAnalyser();a.fftSize=2048,a.smoothingTimeConstant=K.current,y.current=a,$.current=new Uint8Array(new ArrayBuffer(a.frequencyBinCount)),J.current=a.frequencyBinCount,V(a.frequencyBinCount),z(1);const s=p.createGain();s.gain.value=Q.current?0:1,D.current=s,E.current=!1,G.current=!1}I();const _=be.current;return()=>{R=!0,j(),y.current=null,$.current=null,q.current=null,D.current=null,X.current&&dt(L.current),L.current=null,X.current=!1,de.current={previous:null,scratch:null,length:0,hasHistory:!1},me.current=null,pe.current=null,_.clear(),J.current=null,G.current=!1}},[ae,j,V,z,t.type,le,ce,oe]),e.useEffect(()=>{const R=L.current;o?(R?.state==="suspended"&&R.resume().catch(()=>{}),ae(),G.current=!1):(j(),G.current=!1)},[ae,j,o]),Gt.useFrame(k?null:(R,I)=>{if(!o||!E.current){if(!G.current){const h=J.current??0;h>0&&(P(new Array(h).fill(0)),V(h)),G.current=!0}return}const _=y.current,p=$.current;if(_&&p){_.getByteFrequencyData(p),m&&m(p);const g=Ht(p,{attackMs:N(M,0,ye),releaseMs:N(i,0,ye),dtSec:I,blurSigma:Math.max(0,u||0),targetBins:N(Math.round(C||p.length),1,p.length),frequencyMin:B,frequencyMax:x},de.current,me,pe,be.current).resampled;P(Array.from(g)),J.current!==g.length&&(J.current=g.length,V(g.length))}}),null}function Ht(t,o,n,d,M,i){const u=t.length;n.length!==u&&(n.length=u,n.hasHistory=!1,n.previous=null,n.scratch=null);const C=n.previous&&n.previous.length===u?n.previous:null,m=n.scratch&&n.scratch.length===u?n.scratch:null,B=C??new Float32Array(u),x=m??new Float32Array(u),l=n.hasHistory&&C!==null,f=Math.max(0,o.dtSec),F=wt(o.attackMs,f),k=wt(o.releaseMs,f);for(let z=0;z<u;z+=1){const L=t[z]/255,y=l?B[z]:L,q=L>=y?F:k;x[z]=y+(L-y)*q}n.hasHistory=!0,n.previous=x,n.scratch=B;let P=x;o.blurSigma>.001&&(P=Tn(P,o.blurSigma,d,i));const V=In(P,o.targetBins,M,o.frequencyMin,o.frequencyMax);return{smoothedSnapshot:x,resampled:V}}function Tn(t,o,n,d){const M=Math.max(.001,o);let i=n.current;(!i||i.length!==t.length)&&(i=new Float32Array(t.length),n.current=i);const{radius:u,kernel:C}=Fn(M,d),m=t.length;for(let B=0;B<m;B+=1){let x=0;for(let l=-u;l<=u;l+=1){let f=B+l;f<0?f=0:f>=m&&(f=m-1),x+=t[f]*C[l+u]}i[B]=x}return i}function Fn(t,o){const n=Math.round(t*100)/100,d=o.get(n);if(d)return d;const M=Math.max(1,Math.floor(t*3)),i=M*2+1,u=new Float32Array(i),C=Math.max(Number.EPSILON,2*t*t);let m=0;for(let l=0;l<i;l+=1){const f=l-M,F=Math.exp(-(f*f)/C);u[l]=F,m+=F}const B=m||1;for(let l=0;l<i;l+=1)u[l]/=B;const x={radius:M,kernel:u};return o.set(n,x),x}function In(t,o,n,d,M){const i=Math.max(1,Math.round(o));let u=n.current;(!u||u.length!==i)&&(u=new Float32Array(i),n.current=u);const C=Math.max(0,t.length-1);if(C===0)return u.fill(t[0]??0),u;const m=N(d,0,1),B=N(M,Math.min(1,m+.001),1),x=m*C,l=B*C;if(i===1){const f=(x+l)*.5,F=Math.floor(f),k=Math.min(C,F+1),P=f-F,V=t[F]??0,z=t[k]??V;return u[0]=V+(z-V)*P,u}for(let f=0;f<i;f+=1){const F=f/(i-1),k=x+F*(l-x),P=Math.floor(k),V=Math.min(C,P+1),z=k-P,L=t[P]??0,y=t[V]??0;u[f]=L+(y-L)*z}return u}exports.AudioControls=kn;exports.AudioFFTWindow=Wt;
//# sourceMappingURL=AudioControls-CrDxifJy.cjs.map
