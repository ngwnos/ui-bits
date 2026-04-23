"use strict";const p=require("react/jsx-runtime"),c=require("react"),pe=require("typegpu"),ge=require("./animationSuspension-CaeFoamB.cjs"),xe=require("./frameLoop-BQNqp_Qp.cjs");let z=null,L=null;const _e=6,Me=2e3,be=6,ye=128,Re=18,Ne="#f2f0e5",Ae="#1c1b1a",k=21,Ee=108,J=16,Be=J*Float32Array.BYTES_PER_ELEMENT;async function we(){return navigator.gpu?z||(L||(L=pe.init().then(e=>(z=e,e)).catch(e=>(console.error("Sequencer: TypeGPU init failed",e),L=null,null))),L):null}function Te(e){const t=e*.35,M=e*1;return Math.max(Math.round(M+t*2+2),Math.round(e+t*1.5),Re)}function _(e){return Number.parseInt(e,16)/255}function K(e,s=[0,0,0]){if(!e)return s;const t=e.trim();if(t.startsWith("#")){if(t.length===7)return[_(t.slice(1,3)),_(t.slice(3,5)),_(t.slice(5,7))];if(t.length===4)return[_(t[1]+t[1]),_(t[2]+t[2]),_(t[3]+t[3])]}return s}const Ue=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];function Q(e){const s=e.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);if(!s)return null;const[,t,l,M]=s,O=t.toUpperCase(),A=Ue.findIndex(o=>o[0]===O&&o.length===1);if(A<0)return null;const E=Number(M);if(!Number.isFinite(E))return null;let b=A;l==="#"&&(b+=1),l==="b"&&(b-=1);const S=(b%12+12)%12;return(E+1)*12+S}function Z(e,s=k){if(typeof e=="number"&&Number.isFinite(e))return Math.max(0,Math.min(127,Math.round(e)));if(typeof e=="string"){const t=Q(e);if(t!=null)return Math.max(0,Math.min(127,t))}return s}function Pe(e,s,t){const l=e.createShaderModule({code:`
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

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

struct Uniforms {
  params0 : vec4<f32>,
  params1 : vec4<f32>,
  colorA : vec4<f32>,
  colorB : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> events : array<vec2<f32>>;

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  let resolution = max(uniforms.params0.xy, vec2<f32>(1.0, 1.0));
  let playhead = uniforms.params0.z;
  let radius = uniforms.params0.w;
  let eventCount = uniforms.params1.x;
  let uv = in.uv;
  var intensity = 0.0;
  let lineWidth = 1.0 / resolution.x;
  let line = smoothstep(lineWidth * 1.5, 0.0, abs(uv.x - playhead));
  intensity = max(intensity, line);
  for (var i = 0u; i < ${t}u; i = i + 1u) {
    if (f32(i) >= eventCount) { break; }
    let pos = events[i];
    let dist = distance(uv, pos);
    let hit = smoothstep(radius, 0.0, dist);
    intensity = max(intensity, hit);
  }
  return mix(uniforms.colorB, uniforms.colorA, intensity);
}
`});return e.createRenderPipeline({layout:"auto",vertex:{module:l,entryPoint:"vs_main"},fragment:{module:l,entryPoint:"fs_main",targets:[{format:s}]},primitive:{topology:"triangle-list"}})}const ee=c.forwardRef(({heightUnits:e=_e,fontSize:s=12,header:t,footer:l,colorA:M,colorB:O,minNote:A,maxNote:E,durationMs:b=Me,eventRadius:S=be,maxEvents:o=ye,suspended:te,className:ne,style:re,ariaLabel:ie="Sequencer timeline"},se)=>{const C=c.useRef(null),I=c.useRef(null),d=c.useRef([]),g=c.useRef(null),B=c.useRef(o),[oe,Y]=c.useState(!1),ce=ge.useAnimationSuspended(te),G=Z(A,k),ue=Math.max(G+1,Z(E,Ee)),$=Te(s),ae=Math.max(1,Math.round(e)),w=M??Ne,T=O??Ae,W=c.useRef(new Float32Array(Math.max(1,o)*2));c.useEffect(()=>{B.current=o,W.current=new Float32Array(Math.max(1,o)*2),d.current=d.current.slice(-o)},[o]),c.useImperativeHandle(se,()=>({recordNote(m,n){const a=n??performance.now(),f=typeof m=="number"?m:Q(m);f!=null&&(d.current.push({timeMs:a,note:f}),d.current.length>B.current&&d.current.splice(0,d.current.length-B.current),g.current||(g.current=a))},clear(){d.current=[]}}),[]),c.useEffect(()=>{let m=!1;return(async()=>{const a=C.current;if(!a)return;const f=await we();if(!f||m)return;const r=f.device,D=a.getContext("webgpu");if(!D)return;const U=navigator.gpu.getPreferredCanvasFormat(),y=Pe(r,U,Math.max(1,o)),R=r.createBuffer({size:Be,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=r.createBuffer({size:Math.max(1,o)*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),v=r.createBindGroup({layout:y.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:R}},{binding:1,resource:{buffer:h}}]});I.current={context:D,format:U,uniformBuffer:R,eventBuffer:h,renderPipeline:y,bindGroup:v,width:0,height:0,device:r},Y(!0)})(),()=>{m=!0,I.current=null,Y(!1)}},[o]),xe.useFrame(oe&&!ce?m=>{const n=I.current,a=C.current;if(!n||!a)return;const f=m*1e3;g.current||(g.current=f);const r=Math.max(50,b),U=((f-(g.current??f))%r+r)%r/r,y=a.getBoundingClientRect(),R=window.devicePixelRatio||1,h=Math.max(1,Math.round(y.width*R)),v=Math.max(1,Math.round(y.height*R));(h!==n.width||v!==n.height)&&(a.width=h,a.height=v,n.context.configure({device:n.device,format:n.format,alphaMode:"premultiplied"}),n.width=h,n.height=v);const fe=Math.max(1,Math.min(h,v)),le=S/fe,j=K(w,[1,1,1]),x=K(T,[0,0,0]),H=d.current,P=W.current,de=Math.max(1,ue-G),q=Math.min(H.length,B.current);for(let N=0;N<q;N+=1){const V=H[H.length-q+N],he=((V.timeMs-(g.current??V.timeMs))%r+r)%r/r,ve=1-Math.min(1,Math.max(0,(V.note-G)/de));P[N*2]=he,P[N*2+1]=ve}const me=q*2*Float32Array.BYTES_PER_ELEMENT;n.device.queue.writeBuffer(n.eventBuffer,0,P.buffer,P.byteOffset,me);const i=new Float32Array(J);i[0]=h,i[1]=v,i[2]=U,i[3]=le,i[4]=q,i[8]=j[0],i[9]=j[1],i[10]=j[2],i[11]=1,i[12]=x[0],i[13]=x[1],i[14]=x[2],i[15]=1,n.device.queue.writeBuffer(n.uniformBuffer,0,i);const X=n.device.createCommandEncoder(),F=X.beginRenderPass({colorAttachments:[{view:n.context.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:x[0],g:x[1],b:x[2],a:1},storeOp:"store"}]});F.setPipeline(n.renderPipeline),F.setBindGroup(0,n.bindGroup),F.draw(6,1,0,0),F.end(),n.device.queue.submit([X.finish()])}:null);const u={...re};return u["--ui-bits-color-a"]=w,u["--ui-bits-color-b"]=T,u["--seq-font-size"]=`${s}px`,u["--seq-header-height"]=`${$}px`,u["--seq-body-height"]=`${$*ae}px`,u["--seq-header-bg"]=T,u["--seq-header-text"]=w,u["--seq-border"]=w,u["--seq-bg"]=T,p.jsxs("div",{className:["ui-bits-sequencer",ne].filter(Boolean).join(" "),style:u,"aria-label":ie,children:[p.jsx("div",{className:"ui-bits-sequencer__header",children:p.jsx("div",{className:"ui-bits-sequencer__header-inner",children:t??null})}),p.jsx("div",{className:"ui-bits-sequencer__body",children:p.jsx("canvas",{ref:C,className:"ui-bits-sequencer__canvas"})}),p.jsx("div",{className:"ui-bits-sequencer__footer",children:p.jsx("div",{className:"ui-bits-sequencer__footer-inner",children:l??null})})]})});ee.displayName="Sequencer";exports.Sequencer=ee;
//# sourceMappingURL=Sequencer-Cks0pv4P.cjs.map
