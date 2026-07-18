"use strict";const p=require("react/jsx-runtime"),u=require("react"),pe=require("typegpu"),ge=require("./animationSuspension-CaeFoamB.cjs"),xe=require("./frameLoop-DMd5EqQq.cjs");let z=null,O=null;const _e=6,Me=2e3,be=6,ye=128,Re=18,Ne="#f2f0e5",Ae="#1c1b1a",k=21,Be=108,J=16,Ee=J*Float32Array.BYTES_PER_ELEMENT;async function we(){return navigator.gpu?z||(O||(O=pe.init().then(e=>(z=e,e)).catch(e=>(console.error("Sequencer: TypeGPU init failed",e),O=null,null))),O):null}function Te(e){const t=e*.35,M=e*1;return Math.max(Math.round(M+t*2+2),Math.round(e+t*1.5),Re)}function _(e){return Number.parseInt(e,16)/255}function K(e,o=[0,0,0]){if(!e)return o;const t=e.trim();if(t.startsWith("#")){if(t.length===7)return[_(t.slice(1,3)),_(t.slice(3,5)),_(t.slice(5,7))];if(t.length===4)return[_(t[1]+t[1]),_(t[2]+t[2]),_(t[3]+t[3])]}return o}const Ue=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];function Q(e){const o=e.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);if(!o)return null;const[,t,l,M]=o,S=t.toUpperCase(),A=Ue.findIndex(c=>c[0]===S&&c.length===1);if(A<0)return null;const B=Number(M);if(!Number.isFinite(B))return null;let b=A;l==="#"&&(b+=1),l==="b"&&(b-=1);const C=(b%12+12)%12;return(B+1)*12+C}function Z(e,o=k){if(typeof e=="number"&&Number.isFinite(e))return Math.max(0,Math.min(127,Math.round(e)));if(typeof e=="string"){const t=Q(e);if(t!=null)return Math.max(0,Math.min(127,t))}return o}function Pe(e,o,t){const l=e.createShaderModule({code:`
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
`});return e.createRenderPipeline({layout:"auto",vertex:{module:l,entryPoint:"vs_main"},fragment:{module:l,entryPoint:"fs_main",targets:[{format:o}]},primitive:{topology:"triangle-list"}})}const ee=u.forwardRef(({heightUnits:e=_e,fontSize:o=12,header:t,footer:l,colorA:M,colorB:S,minNote:A,maxNote:B,durationMs:b=Me,eventRadius:C=be,maxEvents:c=ye,suspended:te,className:ne,style:re,ariaLabel:ie="Sequencer timeline"},se)=>{const I=u.useRef(null),E=u.useRef(null),d=u.useRef([]),g=u.useRef(null),w=u.useRef(c),[oe,Y]=u.useState(!1),ce=ge.useAnimationSuspended(te),G=Z(A,k),ue=Math.max(G+1,Z(B,Be)),$=Te(o),ae=Math.max(1,Math.round(e)),T=M??Ne,U=S??Ae,W=u.useRef(new Float32Array(Math.max(1,c)*2));u.useEffect(()=>{w.current=c,W.current=new Float32Array(Math.max(1,c)*2),d.current=d.current.slice(-c)},[c]),u.useImperativeHandle(se,()=>({recordNote(m,n){const r=n??performance.now(),f=typeof m=="number"?m:Q(m);f!=null&&(d.current.push({timeMs:r,note:f}),d.current.length>w.current&&d.current.splice(0,d.current.length-w.current),g.current||(g.current=r))},clear(){d.current=[]}}),[]),u.useEffect(()=>{let m=!1;return(async()=>{const r=I.current;if(!r)return;const f=await we();if(!f||m)return;const i=f.device,D=r.getContext("webgpu");if(!D)return;const P=navigator.gpu.getPreferredCanvasFormat(),y=Pe(i,P,Math.max(1,c)),R=i.createBuffer({size:Ee,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=i.createBuffer({size:Math.max(1,c)*2*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),v=i.createBindGroup({layout:y.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:R}},{binding:1,resource:{buffer:h}}]});E.current={context:D,format:P,uniformBuffer:R,eventBuffer:h,renderPipeline:y,bindGroup:v,width:0,height:0,device:i},Y(!0)})(),()=>{m=!0;const r=E.current;if(r)try{r.uniformBuffer.destroy(),r.eventBuffer.destroy()}catch{}E.current=null,Y(!1)}},[c]),xe.useFrame(oe&&!ce?m=>{const n=E.current,r=I.current;if(!n||!r)return;const f=m*1e3;g.current||(g.current=f);const i=Math.max(50,b),P=((f-(g.current??f))%i+i)%i/i,y=r.getBoundingClientRect(),R=window.devicePixelRatio||1,h=Math.max(1,Math.round(y.width*R)),v=Math.max(1,Math.round(y.height*R));(h!==n.width||v!==n.height)&&(r.width=h,r.height=v,n.context.configure({device:n.device,format:n.format,alphaMode:"premultiplied"}),n.width=h,n.height=v);const fe=Math.max(1,Math.min(h,v)),le=C/fe,j=K(T,[1,1,1]),x=K(U,[0,0,0]),H=d.current,q=W.current,de=Math.max(1,ue-G),F=Math.min(H.length,w.current);for(let N=0;N<F;N+=1){const V=H[H.length-F+N],he=((V.timeMs-(g.current??V.timeMs))%i+i)%i/i,ve=1-Math.min(1,Math.max(0,(V.note-G)/de));q[N*2]=he,q[N*2+1]=ve}const me=F*2*Float32Array.BYTES_PER_ELEMENT;n.device.queue.writeBuffer(n.eventBuffer,0,q.buffer,q.byteOffset,me);const s=new Float32Array(J);s[0]=h,s[1]=v,s[2]=P,s[3]=le,s[4]=F,s[8]=j[0],s[9]=j[1],s[10]=j[2],s[11]=1,s[12]=x[0],s[13]=x[1],s[14]=x[2],s[15]=1,n.device.queue.writeBuffer(n.uniformBuffer,0,s);const X=n.device.createCommandEncoder(),L=X.beginRenderPass({colorAttachments:[{view:n.context.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:x[0],g:x[1],b:x[2],a:1},storeOp:"store"}]});L.setPipeline(n.renderPipeline),L.setBindGroup(0,n.bindGroup),L.draw(6,1,0,0),L.end(),n.device.queue.submit([X.finish()])}:null);const a={...re};return a["--ui-bits-color-a"]=T,a["--ui-bits-color-b"]=U,a["--seq-font-size"]=`${o}px`,a["--seq-header-height"]=`${$}px`,a["--seq-body-height"]=`${$*ae}px`,a["--seq-header-bg"]=U,a["--seq-header-text"]=T,a["--seq-border"]=T,a["--seq-bg"]=U,p.jsxs("div",{className:["ui-bits-sequencer",ne].filter(Boolean).join(" "),style:a,"aria-label":ie,children:[p.jsx("div",{className:"ui-bits-sequencer__header",children:p.jsx("div",{className:"ui-bits-sequencer__header-inner",children:t??null})}),p.jsx("div",{className:"ui-bits-sequencer__body",children:p.jsx("canvas",{ref:I,className:"ui-bits-sequencer__canvas"})}),p.jsx("div",{className:"ui-bits-sequencer__footer",children:p.jsx("div",{className:"ui-bits-sequencer__footer-inner",children:l??null})})]})});ee.displayName="Sequencer";exports.Sequencer=ee;
//# sourceMappingURL=Sequencer-Rxbc_c5E.cjs.map
