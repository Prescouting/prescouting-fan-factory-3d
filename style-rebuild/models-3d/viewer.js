import * as THREE from '../../three.module.js';
import {GLTFLoader} from '../../GLTFLoader.js';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.77;
renderer.setClearColor(0x10211a);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x455b4c,2.6));
const light=new THREE.DirectionalLight(0xffeed4,2.4);light.position.set(-3,4,5);scene.add(light);
const fill=new THREE.DirectionalLight(0xc3e0ff,1.3);fill.position.set(3,2,-2);scene.add(fill);
const camera=new THREE.PerspectiveCamera(36,1,.05,50);
const turntable=new THREE.Group();scene.add(turntable);
const loader=new GLTFLoader(),cache={};
const map={FACE:'CRÁNEO ORIGINAL',HAIR:'MELENA Y VOLUMEN DE PELO',PANTS:'PANTALÓN CARGO',UPPER:'PRENDA SUPERIOR',SHOES:'ZAPATILLAS'};
let actor=null,serial=0,rotating=false,yaw=0,targetYaw=0,zoom=3.35,targetZoom=3.35,drag=null,last=performance.now();
let hidden=new Set();
function size(){let w=$('c').clientWidth,h=$('c').clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<420?45:36;camera.updateProjectionMatrix()}
function draw(){camera.position.set(0,1.08,zoom);camera.lookAt(0,.91,0);renderer.render(scene,camera)}
function parts(){
 if(!actor)return;
 actor.traverse(o=>{if(!o.isMesh)return;o.visible=![...hidden].some(k=>o.name.toUpperCase().includes(map[k]))});
 document.querySelectorAll('[data-part]').forEach(el=>el.classList.toggle('active',!hidden.has(el.dataset.part)));
 draw();
}
async function choose(who){
 const token=++serial;hidden.clear();
 $('choose-atica').classList.toggle('active',who==='atica');
 $('choose-vesper').classList.toggle('active',who==='vesper');
 $('loading').textContent='CARGANDO '+who.toUpperCase();
 // 3D-only mode: no reference images are downloaded or displayed.
 $('details').textContent=who==='atica'?'Ática: siete grupos independientes — gorro, melena, cráneo, brazos, top, cargo y zapatillas. Pose original, aún sin rigging funcional.':'Vesper: seis grupos — pelo, cráneo, brazos, hoodie, cargo y zapatillas. Pose original, aún sin rigging funcional.';
 $('dlglb').href='./'+who+'.glb';
 $('dlglb').textContent='Descargar '+who.toUpperCase()+' · GLB editable';
 $('dlblend').textContent='Descargar '+who.toUpperCase()+' · proyecto Blender';
 $('dlblend').href='https://github.com/Prescouting/prescouting-fan-factory-3d/releases/download/style-ateliers-20261026/'+who+'-design-v3.blend';
 try{
  let gltf=cache[who];
  if(!gltf){gltf=await loader.loadAsync('./'+who+'.glb');cache[who]=gltf}
  if(token!==serial)return;
  if(actor)turntable.remove(actor);
  actor=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(actor);
  const mid=bounds.getCenter(new THREE.Vector3());
  actor.position.set(-mid.x,-bounds.min.y,-mid.z);
  turntable.add(actor);
  actor.traverse(o=>{if(o.isMesh)o.frustumCulled=false});
  $('loading').textContent=who.toUpperCase()+' · GEOMETRÍA EDITABLE';
  size();parts();
  window.__PS_STYLE_QA={actor,renderer,scene,camera};
 }catch(err){console.error(err);$('loading').textContent='ERROR CARGANDO EL GLB'}
}
$('choose-atica').onclick=()=>choose('atica');
$('choose-vesper').onclick=()=>choose('vesper');
$('front').onclick=()=>{rotating=false;targetYaw=0};
$('side').onclick=()=>{rotating=false;targetYaw=Math.PI/2};
$('back').onclick=()=>{rotating=false;targetYaw=Math.PI};
$('spin').onclick=()=>{rotating=!rotating;$('spin').textContent='ROTAR: '+(rotating?'SÍ':'NO')};
$('zin').onclick=()=>targetZoom=Math.max(1.8,targetZoom-.25);
$('zout').onclick=()=>targetZoom=Math.min(6.3,targetZoom+.25);
document.querySelectorAll('[data-part]').forEach(el=>el.onclick=()=>{let k=el.dataset.part;hidden.has(k)?hidden.delete(k):hidden.add(k);parts()});
const c=$('c');c.addEventListener('pointerdown',e=>{rotating=false;drag={x:e.clientX,yaw:targetYaw};c.setPointerCapture(e.pointerId)});
c.addEventListener('pointermove',e=>{if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.008});
c.addEventListener('pointerup',()=>drag=null);
c.addEventListener('pointercancel',()=>drag=null);
c.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.max(1.8,Math.min(6.3,targetZoom+e.deltaY*.003))},{passive:false});
window.addEventListener('resize',()=>{size();draw()});
function frame(t){if(t-last<65){requestAnimationFrame(frame);return} const dt=Math.min(.12,(t-last)/1000);last=t;if(rotating&&!drag)targetYaw+=dt*.13;const oy=yaw,oz=zoom;yaw+=(targetYaw-yaw)*Math.min(1,dt*8);zoom+=(targetZoom-zoom)*Math.min(1,dt*8);turntable.rotation.y=yaw;if(actor&&(rotating||Math.abs(oy-yaw)>.0002||Math.abs(oz-zoom)>.0002))draw();requestAnimationFrame(frame)}
size();choose(new URLSearchParams(window.location.search).get('character')==='vesper'?'vesper':'atica');requestAnimationFrame(frame);
setInterval(()=>{if(actor&&document.visibilityState==='visible')draw()},1200);
