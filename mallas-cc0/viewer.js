import * as THREE from '../three.module.js';
import {GLTFLoader} from '../GLTFLoader.js';
const $=id=>document.getElementById(id);
const canvas=$('viewer');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x0b1911,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x576044,3.3));
let lamp=new THREE.DirectionalLight(0xfff1cc,3);lamp.position.set(-2,5,5);scene.add(lamp);
let lamp2=new THREE.DirectionalLight(0xd3dcfc,1.6);lamp2.position.set(3,1,0);scene.add(lamp2);
const camera=new THREE.PerspectiveCamera(36,1,.03,50);
const group=new THREE.Group();scene.add(group);
let current=null,requestId=0,yaw=0,targetYaw=0,zoom=3.12,targetZoom=3.12,drag=null;let spin=true;let last=performance.now();
const loader=new GLTFLoader(),cache={};
function size(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<520?45:36;camera.updateProjectionMatrix()}}
function paint(){camera.position.set(0,1.11,zoom);camera.lookAt(0,.86,0);renderer.render(scene,camera)}
async function choose(who){
 const key=++requestId;
 $('atica').classList.toggle('active',who==='atica');$('vesper').classList.toggle('active',who==='vesper');
 $('state').textContent='CARGANDO '+who.toUpperCase()+'…';
 try{
  let gltf=cache[who];
  if(!gltf){gltf=await loader.loadAsync('./'+who+'-base-limpia.glb');cache[who]=gltf}
  if(key!==requestId)return;
  if(current)group.remove(current);
  current=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(current);
  const center=bounds.getCenter(new THREE.Vector3());
  current.position.x-=center.x;current.position.y-=bounds.min.y;current.position.z-=center.z;
  current.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
  group.add(current);size();paint();
  const n=[];current.traverse(o=>{if(o.isSkinnedMesh)n.push(o.skeleton.bones.length)});
  $('state').textContent=who.toUpperCase()+' · '+(n[0]||'—')+' HUESOS · MALLA BASE';
  window.__PS_CC0_QA={renderer,current,scene,camera,rig:n};
 }catch(e){$('state').textContent='ERROR CARGANDO LA MALLA';console.error(e)}
}
canvas.addEventListener('pointerdown',e=>{spin=false;drag={x:e.clientX,yaw:targetYaw};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.008});
canvas.addEventListener('pointerup',()=>drag=null);
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.max(1.6,Math.min(5.8,targetZoom+e.deltaY*.004))},{passive:false});
$('atica').onclick=()=>choose('atica');$('vesper').onclick=()=>choose('vesper');
$('front').onclick=()=>{targetYaw=0;spin=false};
$('side').onclick=()=>{targetYaw=Math.PI/2;spin=false};
$('back').onclick=()=>{targetYaw=Math.PI;spin=false};
window.addEventListener('resize',()=>{size();paint()});
function loop(t){
 const d=Math.min(.1,(t-last)/1000);last=t;
 if(spin&&!drag)targetYaw+=d*.14;
 yaw+=(targetYaw-yaw)*Math.min(1,d*8);zoom+=(targetZoom-zoom)*Math.min(1,d*8);
 group.rotation.y=yaw;
 if(current)paint();
 requestAnimationFrame(loop)
}
size();choose('atica');requestAnimationFrame(loop);
// Keeps the model visible in embedded and headless contexts where RAF is throttled.
setInterval(()=>{if(current)paint()},450);
