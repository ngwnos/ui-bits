"use strict";const C=require("react/jsx-runtime"),e=require("react"),ut=require("lucide-react"),Ke=require("./animationSuspension-CaeFoamB.cjs"),Me=require("./LFOSlider-Dv5OaOtq.cjs"),Dt=require("./frameLoop-BQNqp_Qp.cjs"),Ft=require("./flexoki-BtN-1xqJ.cjs"),un=require("./panelGap-C0MXgSjL.cjs"),It=require("./IconButton-CqkPHVvp.cjs"),cn=require("typegpu"),Gt=require("./hooks-CPN0v2jj.cjs");let yt=null,it=null;const ln=[.16,.47,.86],fn=[.02,.02,.04],$t=24,dn=$t*Float32Array.BYTES_PER_ELEMENT,ze=64,mn=.2,pn=4,Rt=12,_t=.01,hn=20,xn=80,Ut=(t,o,n)=>Math.max(o,Math.min(n,t)),Lt=(t,o)=>{if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:Math.max(0,Math.min(1,1-Math.exp(-d/n)))};async function gn(){return navigator.gpu?yt||(it||(it=cn.init().then(t=>(yt=t,t)).catch(t=>(console.error("AudioFFTWindow: TypeGPU init failed",t),it=null,null))),it):null}function Ve(t){return Number.parseInt(t,16)/255}function Vt(t,o=[0,0,0]){if(!t)return o;const n=t.trim();if(n.startsWith("#")){if(n.length===7)return[Ve(n.slice(1,3)),Ve(n.slice(3,5)),Ve(n.slice(5,7))];if(n.length===4)return[Ve(n[1]+n[1]),Ve(n[2]+n[2]),Ve(n[3]+n[3])]}return o}function bn(t){const o=t.createShaderModule({code:`
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

@compute @workgroup_size(${ze})
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
`});return{computeModule:o,renderModule:n}}function zt(t,o){return t.createTexture({size:[o,1,1],format:"rgba32float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING})}function Mn(t){t&&(t.uniformBuffer.destroy(),t.rawBuffer.destroy(),t.stateTextures[0].destroy(),t.stateTextures[1].destroy())}function yn(t,o,n,d){const b=o.getContext("webgpu");if(!b)return null;const i=navigator.gpu.getPreferredCanvasFormat();b.configure({device:t,format:i,alphaMode:"opaque"});const{computeModule:u,renderModule:S}=bn(t),m=t.createBuffer({size:dn,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),k=t.createBuffer({size:Math.max(1,d)*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),h=[zt(t,n),zt(t,n)],l=h.map(M=>M.createView({dimension:"2d"})),f=t.createComputePipeline({layout:"auto",compute:{module:u,entryPoint:"cs_main"}}),F=t.createRenderPipeline({layout:"auto",vertex:{module:S,entryPoint:"vs_main"},fragment:{module:S,entryPoint:"fs_main",targets:[{format:i}]},primitive:{topology:"triangle-list"}}),B=f.getBindGroupLayout(0),P=F.getBindGroupLayout(0),V=[t.createBindGroup({layout:B,entries:[{binding:0,resource:{buffer:k}},{binding:1,resource:l[0]},{binding:2,resource:l[1]},{binding:3,resource:{buffer:m}}]}),t.createBindGroup({layout:B,entries:[{binding:0,resource:{buffer:k}},{binding:1,resource:l[1]},{binding:2,resource:l[0]},{binding:3,resource:{buffer:m}}]})],z=[t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[0]}]}),t.createBindGroup({layout:P,entries:[{binding:0,resource:{buffer:m}},{binding:1,resource:l[1]}]})],L=Math.max(1,Math.ceil(n/ze));return{context:b,format:i,uniformBuffer:m,rawBuffer:k,rawCapacity:Math.max(1,d),stateTextures:h,stateStorageViews:l,computePipeline:f,renderPipeline:F,computeBindGroups:V,renderBindGroups:z,workgroupCount:L,binCapacity:n}}function jt({heightUnits:t=6,unitSizePx:o,maxWidth:n,maxBins:d=1024,playbackRatio:b=0,showPlaybackIndicator:i=!0,onScrubStart:u,onScrub:S,onScrubEnd:m,activeColor:k,inactiveColor:h,peakDecay:l=.05,rawFftDataRef:f,rawFrameVersion:F,rawBinCount:B=0,attackMs:P=hn,releaseMs:V=xn,blurSigma:z=0,discreteBins:L=!0,frequencyMin:M=0,frequencyMax:O=1,suspended:q}){const $=e.useRef(null),K=e.useRef(null),ne=e.useRef(null),[Q,X]=e.useState(()=>typeof navigator<"u"&&!!navigator.gpu),[E,D]=e.useState({width:480,height:Math.max(1,t)*o}),[fe,de]=e.useState(()=>Math.max(1,Math.ceil(Math.max(1,Math.floor(d))/ze)*ze)),[me,xe]=e.useState(()=>Math.max(1,B||1)),J=e.useRef(Math.max(0,Math.min(1,b))),ue=e.useRef(Math.max(0,z)),ie=e.useRef(Math.max(0,P)),re=e.useRef(Math.max(0,V)),oe=e.useRef(Math.max(5e-4,l)),j=e.useRef(L?1:0),y=e.useRef(Math.max(0,Math.min(1,M))),I=e.useRef(Math.max(0,Math.min(1,O))),_=e.useRef(Math.max(1,Math.floor(d))),p=e.useRef(!1),x=e.useRef(typeof performance<"u"?performance.now():Date.now()),g=e.useRef(new Float32Array($t)),a=e.useRef(null),s=e.useRef(0),A=e.useRef(null),R=e.useRef(null),W=e.useRef(null),H=Ke.useAnimationSuspended(q),ae=e.useRef(H),U=e.useRef({active:!1,pointerId:null}),ke=e.useMemo(()=>Vt(k,ln),[k]),Z=e.useMemo(()=>Vt(h,fn),[h]),Re=e.useRef(ke),Fe=e.useRef(Z);e.useEffect(()=>{if(ae.current=H,H){R.current!==null&&(cancelAnimationFrame(R.current),R.current=null),x.current=typeof performance<"u"?performance.now():Date.now();return}W.current?.()},[H]),e.useEffect(()=>{J.current=Math.max(0,Math.min(1,b))},[b]),e.useEffect(()=>{ue.current=Math.max(0,z)},[z]),e.useEffect(()=>{ie.current=Math.max(0,P)},[P]),e.useEffect(()=>{re.current=Math.max(0,V)},[V]),e.useEffect(()=>{oe.current=Math.max(5e-4,l)},[l]),e.useEffect(()=>{j.current=L?1:0},[L]),e.useEffect(()=>{y.current=Ut(M,0,Math.min(1,O-_t))},[M,O]),e.useEffect(()=>{I.current=Ut(O,Math.min(1,M+_t),1)},[O,M]),e.useEffect(()=>{p.current=!0},[M,O,d]),e.useEffect(()=>{_.current=Math.max(1,Math.floor(d));const c=Math.max(1,Math.ceil(_.current/ze)*ze);de(v=>v===c?v:c)},[d]),e.useEffect(()=>{!B||B<=0||xe(c=>B>c?Math.max(B,c):c)},[B]),e.useEffect(()=>{p.current=!0},[F]),e.useEffect(()=>{Re.current=ke},[ke]),e.useEffect(()=>{Fe.current=Z},[Z]),e.useEffect(()=>{const c=Math.max(1,t)*o;D(v=>({width:v.width,height:c}))},[t,o]),e.useEffect(()=>{const c=K.current;if(!c)return;const v=()=>{const pe=c.getBoundingClientRect();pe.width&&D(Ie=>({width:Math.round(pe.width),height:Ie.height}))};v();const Y=typeof ResizeObserver<"u"?new ResizeObserver(v):null;return Y?Y.observe(c):window.addEventListener("resize",v),()=>{Y?.disconnect(),Y||window.removeEventListener("resize",v)}},[]);const se=e.useCallback(c=>{const v=K.current;if(!v)return null;const Y=v.getBoundingClientRect();if(!Y.width)return null;const pe=(c-Y.left)/Y.width;return Math.max(0,Math.min(1,pe))},[]),pt=e.useCallback(c=>{if(!S&&!m&&!u)return;const v=se(c.clientX);v!=null&&(U.current={active:!0,pointerId:c.pointerId},c.currentTarget.setPointerCapture(c.pointerId),c.preventDefault(),u?.(),S?.(v))},[se,S,m,u]),ht=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;const v=se(c.clientX);v!=null&&(c.preventDefault(),S?.(v))},[se,S]),Be=e.useCallback(c=>{if(!U.current.active||U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const v=se(c.clientX);v!=null&&m?.(v)},[se,m]),Qe=e.useCallback(c=>{if(U.current.pointerId!==c.pointerId)return;U.current={active:!1,pointerId:null};try{c.currentTarget.releasePointerCapture(c.pointerId)}catch{}const v=se(c.clientX);v!=null&&m?.(v)},[se,m]);e.useEffect(()=>{if(!Q)return;let c=!1;async function v(){const Y=await gn();if(!Y||c){Y||X(!1);return}const pe=$.current;if(!pe)return;const Ie=yn(Y.device,pe,fe,me);if(!Ie){X(!1);return}a.current=Ie,s.current=0,p.current=!0;const qe=De=>{if(c)return;if(ae.current){R.current=null,x.current=De;return}const Ge=Y.device,$e=Ge.queue,ee=a.current;if(!ee)return;const ce=$.current;if(!ce)return;const je=window.devicePixelRatio||1,Ze=Math.max(1,Math.floor(E.width*je)),G=Math.max(1,Math.floor(E.height*je));(ce.width!==Ze||ce.height!==G)&&(ce.width=Ze,ce.height=G),ce.style.width!==`${Math.round(E.width)}px`&&(ce.style.width=`${Math.round(E.width)}px`),ce.style.height!==`${Math.round(E.height)}px`&&(ce.style.height=`${Math.round(E.height)}px`);const We=Math.max(5e-4,(De-x.current)/1e3);x.current=De;const Pe=Math.max(1,_.current),Je=Pe>1?1/(Pe-1):1,w=g.current,et=Math.max(1,B||0);if(w[0]=Pe,w[1]=i?J.current:-1,w[2]=ue.current,w[3]=Je,w[4]=Re.current[0],w[5]=Re.current[1],w[6]=Re.current[2],w[7]=1,w[8]=Fe.current[0],w[9]=Fe.current[1],w[10]=Fe.current[2],w[11]=1,w[12]=Lt(ie.current,We),w[13]=Lt(re.current,We),w[14]=We,w[15]=pn,w[16]=oe.current,w[17]=mn,w[18]=j.current,w[19]=et,w[20]=y.current,w[21]=I.current,w[22]=0,w[23]=0,$e.writeBuffer(ee.uniformBuffer,0,w.buffer,w.byteOffset,w.byteLength),p.current&&f?.current){const le=f.current,ve=ee.rawCapacity;(!A.current||A.current.length!==ve)&&(A.current=new Float32Array(ve));const Ee=A.current,Te=Math.min(ve,le.length);for(let be=0;be<Te;be+=1)Ee[be]=le[be]/255;for(let be=Te;be<ve;be+=1)Ee[be]=0;$e.writeBuffer(ee.rawBuffer,0,Ee.buffer,Ee.byteOffset,Ee.byteLength),p.current=!1}const ge=Ge.createCommandEncoder();if(f?.current){const le=ge.beginComputePass(),ve=ee.computeBindGroups[s.current];le.setPipeline(ee.computePipeline),le.setBindGroup(0,ve),le.dispatchWorkgroups(ee.workgroupCount,1,1),le.end(),s.current=s.current===0?1:0}const tt=ee.context.getCurrentTexture().createView(),_e=ge.beginRenderPass({colorAttachments:[{view:tt,loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:1}}]});_e.setPipeline(ee.renderPipeline);const Ue=ee.renderBindGroups[s.current];_e.setBindGroup(0,Ue),_e.draw(6,1,0,0),_e.end(),$e.submit([ge.finish()]),R.current=requestAnimationFrame(qe)};W.current=()=>{c||R.current!==null||(x.current=typeof performance<"u"?performance.now():Date.now(),R.current=requestAnimationFrame(qe))},ae.current||W.current()}return v(),()=>{c=!0,R.current!==null&&(cancelAnimationFrame(R.current),R.current=null),W.current=null,Mn(a.current),a.current=null}},[Q,E.width,E.height,fe,me,f,B,i]);const Ne=typeof n=="number"?`${n}px`:n??"100%",xt=Math.round(E.width),Oe=Math.round(E.height);return C.jsx("div",{ref:K,className:"audio-fft-window",style:{width:"100%",maxWidth:Ne},children:C.jsxs("div",{className:"audio-fft-window__canvas-wrapper",style:{width:"100%",height:`${Oe}px`,position:"relative",overflow:"hidden",background:"transparent"},children:[Q?C.jsx("canvas",{ref:$,width:xt,height:Oe,style:{width:"100%",height:"100%",display:"block"}}):C.jsx("div",{className:"audio-fft-window__fallback",children:"WebGPU not available"}),C.jsx("div",{ref:ne,className:"audio-fft-window__interaction-layer",onPointerDown:pt,onPointerMove:ht,onPointerUp:Be,onPointerLeave:Be,onPointerCancel:Qe,role:"presentation"})]})})}function Rn(t,o){const n=Ft.flexoki.base[700],d=Ft.flexoki.base[100];return{safeA:t??n,safeB:o??d}}const te=t=>Math.max(0,Math.min(1,t)),N=(t,o,n)=>Math.max(o,Math.min(n,t)),vn=44100,Nt=vn/2,ct=10,wn=18,Se=8,dt=10,ye=500,wt=20,Ct=80,Cn=1/60,lt=t=>Math.round(te(t)*10)/10,ft=t=>Math.round(N(t,0,3)*10)/10,Ae=t=>Math.round(N(t,0,ye)/dt)*dt,vt=(t,o)=>{if(t<=0)return 1;const n=t/1e3,d=Math.max(0,o);return!Number.isFinite(n)||n<=0?1:te(1-Math.exp(-d/n))};function Ot(t,o){return t==="discrete"||t==="interpolated"?t:o}function he(t,o,n,d){const[b,i]=Gt.useControlValue(d),u=d!==void 0&&t===void 0,S=u?b:t,[m,k]=e.useState(o),h=S!==void 0,l=h?S:m,f=e.useCallback(F=>{h||k(F),u&&i(F),n?.(F)},[h,n,i,u]);return e.useEffect(()=>{!u||b!==void 0||i(o)},[o,i,u,b]),[l,f,h]}function qt(t){const o=t||16,d=o*.35,i=o*1;return Math.max(Math.round(i+d*2+2),Math.round(o+d*1.5),wn)}function mt(t){!t||t.state==="closed"||t.close().catch(()=>{})}function Sn({ariaLabel:t="Audio controls",fontSize:o,colorA:n,colorB:d,borderStyle:b,source:i,heightUnits:u=6,suspended:S,audioAnalysisStore:m,controlIdPrefix:k,controlIds:h,defaultPlaying:l=!1,playing:f,onPlayingChange:F,defaultMuted:B=!0,muted:P,onMutedChange:V,defaultBinCount:z=256,binCount:L,onBinCountChange:M,defaultBinInterpolation:O="discrete",binInterpolation:q,onBinInterpolationChange:$,defaultFrequencyMin:K=0,frequencyMin:ne,onFrequencyMinChange:Q,defaultFrequencyMax:X=Nt,frequencyMax:E,onFrequencyMaxChange:D,defaultFftAttack:fe=wt,fftAttack:de,onFftAttackChange:me,defaultFftRelease:xe=Ct,fftRelease:J,onFftReleaseChange:ue,defaultFftBlurSigma:ie=0,fftBlurSigma:re,onFftBlurSigmaChange:oe,defaultAnalyserSmoothing:j=.8,analyserSmoothing:y,onAnalyserSmoothingChange:I}){const _=Ke.useAnimationSuspended(S),p=un.usePanelTheme(),x=o??p?.fontSize??12,g=b??p?.borderStyle??"a",{safeA:a,safeB:s}=Rn(n??p?.colorA,d??p?.colorB),A=Me.useAudioAnalysisStore(),R=e.useRef(null),W=R.current??Me.createAudioAnalysisStore({bins:[],binCount:0,maxMagnitude:1});R.current||(R.current=W);const H=m??A??W,ae=e.useMemo(()=>({setAudioBins:H.setAudioBins,setAudioBinCount:H.setAudioBinCount,setAudioMaxMagnitude:H.setAudioMaxMagnitude}),[H]),U=i.type==="buffer",ke=Gt.useResolvedControlIdPrefix(k,t),Z=e.useCallback(r=>{const T=h?.[r];if(T)return T;if(!(r==="playing"||r==="muted"))return ke?`${ke}.${r}`:void 0},[h,ke]),[Re,Fe]=he(f,l,F,Z("playing")),[se,pt]=he(P,B,V,Z("muted")),[ht,Be]=e.useState(0),[Qe,Ne]=e.useState(!1),[xt,Oe]=e.useState(null),c=e.useRef(0),v=e.useCallback(r=>N(Math.round(r||0),1,1024),[]),[Y,pe]=he(L,v(z),M,Z("binCount")),[Ie,qe]=he(y,lt(te(j)),I,Z("analyserSmoothing")),[De,Ge]=he(de,Ae(fe),me,Z("fftAttack")),[$e,ee]=he(J,Ae(xe),ue,Z("fftRelease")),[ce,je]=he(re,ft(ie),oe,Z("fftBlurSigma")),[Ze]=he(q,Ot(O,"discrete"),$,Z("binInterpolation")),[G,We]=e.useState(Nt),[Pe,Je]=he(ne,K,Q,Z("frequencyMin")),[w,et]=he(E,X,D,Z("frequencyMax")),ge=e.useRef(null),[tt,_e]=e.useState({version:0,binCount:0}),Ue=v(Y),le=lt(te(Ie)),ve=Ae(De),Ee=Ae($e),Te=ft(ce),Ht=Ot(Ze,"discrete")==="discrete",we=e.useMemo(()=>Math.min(ct,G),[G]),{freqMinHz:nt,freqMaxHz:rt}=e.useMemo(()=>{const r=Number.isFinite(Pe??Number.NaN)?Pe:0,T=Number.isFinite(w??Number.NaN)?w:G,Xe=N(T,we,G),Ye=N(r,0,Math.max(0,Xe-we)),st=N(Xe,Ye+we,G);return{freqMinHz:Ye,freqMaxHz:st}},[Pe,w,we,G]),Xt=G>0?nt/G:0,Yt=G>0?rt/G:1,gt=N(Xt,0,1),bt=N(Yt,0,1),St=e.useCallback(r=>{const T=N(r,0,Math.max(0,rt-we));Je(T)},[rt,we,Je]),At=e.useCallback(r=>{const T=N(r,Math.min(G,nt+we),G);et(T)},[nt,we,G,et]),kt=e.useCallback(r=>{We(Math.max(1,r/2))},[]),[Mt,Bt]=e.useState(()=>qt(x)),Pt=e.useRef(null);e.useEffect(()=>{const r=qt(x);Bt(T=>Math.abs(T-r)<.5?T:r)},[x]),e.useLayoutEffect(()=>{const r=Pt.current;if(!r||typeof ResizeObserver>"u")return;const T=()=>{const Ye=r.getBoundingClientRect();if(!Ye.height)return;const st=Math.round(Ye.height);Bt(Tt=>Math.abs(Tt-st)<.5?Tt:st)};T();const Xe=new ResizeObserver(()=>T());return Xe.observe(r),()=>Xe.disconnect()},[]);const Kt=a,Le=g==="none"?0:1,Ce=g==="none"?"transparent":g==="b"?s:a,Qt=a,Zt=Re?"playing":"paused",Jt=se?"muted":"unmuted",en=[{value:"paused",icon:C.jsx(ut.Play,{strokeWidth:1.6}),ariaLabel:"Play audio analysis",title:"Play audio analysis"},{value:"playing",icon:C.jsx(ut.Pause,{strokeWidth:1.6}),ariaLabel:"Pause audio analysis",title:"Pause audio analysis"}],tn=[{value:"muted",icon:C.jsx(ut.VolumeX,{strokeWidth:1.6}),ariaLabel:"Unmute audio output",title:"Unmute audio output"},{value:"unmuted",icon:C.jsx(ut.Volume2,{strokeWidth:1.6}),ariaLabel:"Mute audio output",title:"Mute audio output"}],ot=N(ve,0,ye),He=N(Ee,0,ye),nn=Math.max(.001,vt(He,Cn)*.25),at=e.useCallback(r=>{const T=te(r);c.current+=1,Oe({ratio:T,token:c.current})},[]),Et=e.useCallback(r=>{r?.length&&((!ge.current||ge.current.length!==r.length)&&(ge.current=new Uint8Array(r.length)),ge.current.set(r),_e(T=>({version:T.version+1,binCount:r.length})))},[]),rn=e.useCallback(r=>{if(!U)return;const T=te(r);Qe||Be(T)},[U,Qe]),on=e.useCallback(()=>{U&&Ne(!0)},[U]),an=e.useCallback(r=>{if(!U)return;const T=te(r);Be(T),at(T)},[U,at]),sn=e.useCallback(r=>{if(!U)return;const T=te(r);Be(T),at(T),Ne(!1)},[U,at]);return e.useEffect(()=>{U||(Be(0),Ne(!1),Oe(null))},[U]),C.jsx(Ke.AnimationSuspensionProvider,{suspended:_,children:C.jsxs("div",{style:{width:"100%",maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column"},children:[C.jsxs("div",{style:{width:"100%",minHeight:Mt,borderTop:`1px solid ${Ce}`,borderLeft:`${Le}px solid ${Ce}`,borderRight:`${Le}px solid ${Ce}`,borderBottom:`1px solid ${s}`,borderTopLeftRadius:3,borderTopRightRadius:3,background:s,display:"flex",alignItems:"center",overflow:"hidden",gap:Se,padding:`0 ${Se}px`,boxSizing:"border-box"},children:[C.jsx("div",{style:{display:"flex",alignItems:"center",gap:Se,flexShrink:0},children:C.jsx(It.IconButton,{behavior:"cycle",value:Zt,options:en,onChange:r=>Fe(r==="playing"),borderStyle:"none",fontSize:x,colorA:a,colorB:s})}),C.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(3, minmax(0, 1fr))",gap:Se},children:[C.jsx("div",{ref:Pt,style:{display:"flex",minWidth:0},children:C.jsx(Me.LFOSlider,{label:"Bins",variant:"basic",min:1,max:1024,step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:Ue,onUserChange:r=>{pe(v(r))},onAnimatedUpdate:r=>{pe(v(r))},style:{gap:0}})}),C.jsx(Me.LFOSlider,{label:"Min",variant:"basic",min:0,max:Math.max(0,G-ct),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:nt,onUserChange:St,onAnimatedUpdate:St,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),C.jsx(Me.LFOSlider,{label:"Max",variant:"basic",min:ct,max:Math.max(ct,G),step:1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:rt,onUserChange:At,onAnimatedUpdate:At,formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}})]})]}),i.type==="buffer"?C.jsx(An,{src:i.src,loop:i.loop,playing:Re,analysisActions:ae,onProgress:rn,seekTarget:xt,analyserSmoothing:le,attackMs:ot,releaseMs:He,blurSigma:Te,targetBins:Ue,onRawFftFrame:Et,frequencyMin:gt,frequencyMax:bt,onSampleRateChange:kt,muted:se,suspended:_}):C.jsx(kn,{source:i,playing:Re,analysisActions:ae,analyserSmoothing:le,attackMs:ot,releaseMs:He,blurSigma:Te,targetBins:Ue,onRawFftFrame:Et,frequencyMin:gt,frequencyMax:bt,onSampleRateChange:kt,muted:se,suspended:_}),C.jsx("div",{style:{borderTop:`1px solid ${Kt}`,borderLeft:`${Le}px solid ${Ce}`,borderRight:`${Le}px solid ${Ce}`,borderRadius:0,borderBottom:`1px solid ${s}`,overflow:"hidden",background:"linear-gradient(180deg, #0a0a0a, #1a1a1a)"},children:C.jsx(jt,{heightUnits:u,unitSizePx:Mt,maxWidth:"100%",maxBins:Ue,peakDecay:nn,playbackRatio:U?ht:0,showPlaybackIndicator:U,onScrubStart:U?on:void 0,onScrub:U?an:void 0,onScrubEnd:U?sn:void 0,activeColor:a,inactiveColor:s,rawFftDataRef:ge,rawFrameVersion:tt.version,rawBinCount:tt.binCount,attackMs:ot,releaseMs:He,blurSigma:Te,discreteBins:Ht,frequencyMin:gt,frequencyMax:bt,suspended:_})}),C.jsxs("div",{style:{width:"100%",minHeight:Mt,borderTop:`1px solid ${a}`,borderLeft:`${Le}px solid ${Ce}`,borderRight:`${Le}px solid ${Ce}`,borderBottom:`1px solid ${Ce}`,borderBottomLeftRadius:3,borderBottomRightRadius:3,background:s,color:Qt,display:"flex",alignItems:"center",overflow:"hidden",gap:Se,padding:`0 ${Se}px`,boxSizing:"border-box"},children:[C.jsx("div",{style:{display:"flex",alignItems:"center",gap:Se,flexShrink:0},children:C.jsx(It.IconButton,{behavior:"cycle",value:Jt,options:tn,onChange:r=>pt(r==="muted"),borderStyle:"none",fontSize:x,colorA:a,colorB:s})}),C.jsxs("div",{style:{flex:1,minWidth:0,display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:Se},children:[C.jsx(Me.LFOSlider,{label:"Atk",variant:"basic",min:0,max:ye,step:dt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:ot,onUserChange:r=>Ge(Ae(r)),onAnimatedUpdate:r=>Ge(Ae(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),C.jsx(Me.LFOSlider,{label:"Rel",variant:"basic",min:0,max:ye,step:dt,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:He,onUserChange:r=>ee(Ae(r)),onAnimatedUpdate:r=>ee(Ae(r)),formatDisplayValue:r=>`${Math.round(r)}`,style:{gap:0}}),C.jsx(Me.LFOSlider,{label:"Sm",variant:"basic",min:0,max:1,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:le,onUserChange:r=>qe(lt(r)),onAnimatedUpdate:r=>qe(lt(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}}),C.jsx(Me.LFOSlider,{label:"σ",variant:"basic",min:0,max:3,step:.1,barStyle:"continuous",width:"100%",border:"a",borderMask:{top:!1,bottom:!1,right:!0,left:!0},colorA:a,colorB:s,fontSize:x,value:Te,onUserChange:r=>je(ft(r)),onAnimatedUpdate:r=>je(ft(r)),formatDisplayValue:r=>r.toFixed(1),style:{gap:0}})]})]})]})})}function An({src:t,loop:o=!0,playing:n,analysisActions:d,seekTarget:b,onProgress:i,analyserSmoothing:u=.8,attackMs:S=wt,releaseMs:m=Ct,blurSigma:k=0,targetBins:h=1024,onRawFftFrame:l,frequencyMin:f=0,frequencyMax:F=1,onSampleRateChange:B,muted:P=!0,suspended:V}){const z=Ke.useAnimationSuspended(V),{setAudioBins:L,setAudioBinCount:M,setAudioMaxMagnitude:O}=d,q=e.useRef(null),$=e.useRef(null),K=e.useRef(null),ne=e.useRef(null),Q=e.useRef(null),X=e.useRef(null),E=e.useRef(0),D=e.useRef(null),fe=e.useRef(i),de=e.useRef(te(u??.8)),me=e.useRef(B),xe=e.useRef(P),J=e.useRef({previous:null,scratch:null,length:0,hasHistory:!1}),ue=e.useRef(null),ie=e.useRef(null),re=e.useRef(new Map),oe=e.useRef(null);e.useEffect(()=>{fe.current=i},[i]),e.useEffect(()=>{me.current=B},[B]),e.useEffect(()=>{xe.current=P;const g=Q.current,a=q.current;g&&a&&g.gain.setTargetAtTime(P?0:1,a.currentTime,.01)},[P]),e.useEffect(()=>{const g=te(u??.8);de.current=g,$.current&&($.current.smoothingTimeConstant=g)},[u]);const j=e.useCallback(()=>X.current?.duration??0,[]),y=e.useCallback(g=>{const a=j();if(a<=0)return 0;const s=g%a,A=s<0?s+a:s,R=Math.min(a*.001,1e-4)||1e-4;return Math.min(A,Math.max(0,a-R))},[j]),I=e.useCallback(()=>{if(j()<=0)return 0;const a=y(E.current),s=D.current,A=q.current;if(!A||s==null)return a;const R=A.currentTime-s;return y(a+R)},[j,y]),_=e.useCallback(()=>{try{ne.current?.stop()}catch{}ne.current?.disconnect(),Q.current?.disconnect(),ne.current=null,Q.current=null},[]);e.useEffect(()=>{const g=re.current;let a=!1;async function s(){try{const A=new AudioContext;q.current=A,me.current?.(A.sampleRate);const R=await fetch(t);if(!R.ok)throw new Error(`Failed to load audio sample: ${R.status}`);const W=await R.arrayBuffer(),H=await A.decodeAudioData(W);if(a){mt(A);return}X.current=H,E.current=0,D.current=null;const ae=A.createAnalyser();ae.fftSize=2048,ae.smoothingTimeConstant=de.current,$.current=ae,K.current=new Uint8Array(new ArrayBuffer(ae.frequencyBinCount)),M(ae.frequencyBinCount),O(1)}catch(A){console.error("Failed to load audio for FFT",A)}}return s(),()=>{a=!0,$.current=null,K.current=null,_(),mt(q.current),q.current=null,ne.current=null,Q.current=null,X.current=null,E.current=0,D.current=null,J.current={previous:null,scratch:null,length:0,hasHistory:!1},ue.current=null,ie.current=null,g.clear(),oe.current=null}},[M,O,t,_]);const p=e.useCallback(()=>{E.current=I(),D.current=null,_()},[I,_]),x=e.useCallback(async g=>{if(!X.current||!q.current)return;const a=q.current;a.state==="suspended"&&await a.resume().catch(()=>{});const s=$.current??a.createAnalyser();s.fftSize=2048,s.smoothingTimeConstant=de.current,$.current=s;const A=y(typeof g=="number"?g:I());E.current=A,D.current=a.currentTime,_();const R=a.createBufferSource();R.buffer=X.current,R.loop=o;const W=a.createGain();W.gain.value=xe.current?0:1,R.connect(s),s.connect(W),W.connect(a.destination),R.start(0,A),ne.current=R,Q.current=W,K.current||(K.current=new Uint8Array(new ArrayBuffer(s.frequencyBinCount)),M(s.frequencyBinCount))},[I,o,M,_,y]);return e.useEffect(()=>(n?x():p(),()=>{p()}),[n,x,p]),e.useEffect(()=>{if(!b)return;const g=j();if(g<=0)return;const a=te(b.ratio),s=y(a*g);E.current=s,n&&X.current&&q.current?x(s):D.current=null},[j,n,b,x,y]),Dt.useFrame(z?null:(g,a)=>{const s=$.current,A=K.current;if(s&&A){s.getByteFrequencyData(A),l&&l(A);const H=Wt(A,{attackMs:N(S,0,ye),releaseMs:N(m,0,ye),dtSec:a,blurSigma:Math.max(0,k||0),targetBins:N(Math.round(h||A.length),1,A.length),frequencyMin:f,frequencyMax:F},J.current,ue,ie,re.current).resampled;L(Array.from(H)),oe.current!==H.length&&(oe.current=H.length,M(H.length))}const R=j();if(R>0){const W=I()/R;fe.current?.(W)}}),null}function kn({source:t,playing:o,analysisActions:n,analyserSmoothing:d=.8,attackMs:b=wt,releaseMs:i=Ct,blurSigma:u=0,targetBins:S=1024,onRawFftFrame:m,frequencyMin:k=0,frequencyMax:h=1,onSampleRateChange:l,muted:f=!0,suspended:F}){const B=Ke.useAnimationSuspended(F),{setAudioBins:P,setAudioBinCount:V,setAudioMaxMagnitude:z}=n,L=e.useRef(null),M=e.useRef(null),O=e.useRef(null),q=e.useRef(null),$=e.useRef(null),K=e.useRef(te(d??.8)),ne=e.useRef(l),Q=e.useRef(f),X=e.useRef(!1),E=e.useRef(!1),D=e.useRef(!1),fe=e.useRef({previous:null,scratch:null,length:0,hasHistory:!1}),de=e.useRef(null),me=e.useRef(null),xe=e.useRef(new Map),J=e.useRef(null),ue=t.type==="mediaStream"?t.stream:null,ie=t.type==="mediaStream"?t.context:void 0,re=t.type==="audioNode"?t.node:null;e.useEffect(()=>{ne.current=l},[l]),e.useEffect(()=>{Q.current=f;const y=q.current,I=L.current;y&&I&&y.gain.setTargetAtTime(f?0:1,I.currentTime,.01)},[f]),e.useEffect(()=>{const y=te(d??.8);K.current=y,M.current&&(M.current.smoothingTimeConstant=y)},[d]);const oe=e.useCallback(()=>{if(E.current)return;const y=O.current,I=M.current,_=q.current,p=L.current;!y||!I||!_||!p||(y.connect(I),I.connect(_),_.connect(p.destination),E.current=!0)},[]),j=e.useCallback(()=>{if(E.current){try{const y=O.current,I=M.current;y&&I&&y.disconnect(I)}catch{}try{M.current?.disconnect()}catch{}try{q.current?.disconnect()}catch{}E.current=!1}},[]);return e.useEffect(()=>{let y=!1;async function I(){let p,x,g=!1;if(t.type==="mediaStream"){if(p=ie??new AudioContext,g=!ie,!ue)return;x=p.createMediaStreamSource(ue)}else{if(!re)return;x=re,p=re.context}if(y){g&&mt(p);return}X.current=g,L.current=p,O.current=x,ne.current?.(p.sampleRate);const a=p.createAnalyser();a.fftSize=2048,a.smoothingTimeConstant=K.current,M.current=a,$.current=new Uint8Array(new ArrayBuffer(a.frequencyBinCount)),J.current=a.frequencyBinCount,V(a.frequencyBinCount),z(1);const s=p.createGain();s.gain.value=Q.current?0:1,q.current=s,E.current=!1,D.current=!1}I();const _=xe.current;return()=>{y=!0,j(),M.current=null,$.current=null,O.current=null,q.current=null,X.current&&mt(L.current),L.current=null,X.current=!1,fe.current={previous:null,scratch:null,length:0,hasHistory:!1},de.current=null,me.current=null,_.clear(),J.current=null,D.current=!1}},[oe,j,V,z,t.type,ie,ue,re]),e.useEffect(()=>{const y=L.current;o?(y?.state==="suspended"&&y.resume().catch(()=>{}),oe(),D.current=!1):(j(),D.current=!1)},[oe,j,o]),Dt.useFrame(B?null:(y,I)=>{if(!o||!E.current){if(!D.current){const x=J.current??0;x>0&&(P(new Array(x).fill(0)),V(x)),D.current=!0}return}const _=M.current,p=$.current;if(_&&p){_.getByteFrequencyData(p),m&&m(p);const g=Wt(p,{attackMs:N(b,0,ye),releaseMs:N(i,0,ye),dtSec:I,blurSigma:Math.max(0,u||0),targetBins:N(Math.round(S||p.length),1,p.length),frequencyMin:k,frequencyMax:h},fe.current,de,me,xe.current).resampled;P(Array.from(g)),J.current!==g.length&&(J.current=g.length,V(g.length))}}),null}function Wt(t,o,n,d,b,i){const u=t.length;n.length!==u&&(n.length=u,n.hasHistory=!1,n.previous=null,n.scratch=null);const S=n.previous&&n.previous.length===u?n.previous:null,m=n.scratch&&n.scratch.length===u?n.scratch:null,k=S??new Float32Array(u),h=m??new Float32Array(u),l=n.hasHistory&&S!==null,f=Math.max(0,o.dtSec),F=vt(o.attackMs,f),B=vt(o.releaseMs,f);for(let z=0;z<u;z+=1){const L=t[z]/255,M=l?k[z]:L,O=L>=M?F:B;h[z]=M+(L-M)*O}n.hasHistory=!0,n.previous=h,n.scratch=k;let P=h;o.blurSigma>.001&&(P=Bn(P,o.blurSigma,d,i));const V=En(P,o.targetBins,b,o.frequencyMin,o.frequencyMax);return{smoothedSnapshot:h,resampled:V}}function Bn(t,o,n,d){const b=Math.max(.001,o);let i=n.current;(!i||i.length!==t.length)&&(i=new Float32Array(t.length),n.current=i);const{radius:u,kernel:S}=Pn(b,d),m=t.length;for(let k=0;k<m;k+=1){let h=0;for(let l=-u;l<=u;l+=1){let f=k+l;f<0?f=0:f>=m&&(f=m-1),h+=t[f]*S[l+u]}i[k]=h}return i}function Pn(t,o){const n=Math.round(t*100)/100,d=o.get(n);if(d)return d;const b=Math.max(1,Math.floor(t*3)),i=b*2+1,u=new Float32Array(i),S=Math.max(Number.EPSILON,2*t*t);let m=0;for(let l=0;l<i;l+=1){const f=l-b,F=Math.exp(-(f*f)/S);u[l]=F,m+=F}const k=m||1;for(let l=0;l<i;l+=1)u[l]/=k;const h={radius:b,kernel:u};return o.set(n,h),h}function En(t,o,n,d,b){const i=Math.max(1,Math.round(o));let u=n.current;(!u||u.length!==i)&&(u=new Float32Array(i),n.current=u);const S=Math.max(0,t.length-1);if(S===0)return u.fill(t[0]??0),u;const m=N(d,0,1),k=N(b,Math.min(1,m+.001),1),h=m*S,l=k*S;if(i===1){const f=(h+l)*.5,F=Math.floor(f),B=Math.min(S,F+1),P=f-F,V=t[F]??0,z=t[B]??V;return u[0]=V+(z-V)*P,u}for(let f=0;f<i;f+=1){const F=f/(i-1),B=h+F*(l-h),P=Math.floor(B),V=Math.min(S,P+1),z=B-P,L=t[P]??0,M=t[V]??0;u[f]=L+(M-L)*z}return u}exports.AudioControls=Sn;exports.AudioFFTWindow=jt;
//# sourceMappingURL=AudioControls-BlICoUGj.cjs.map
