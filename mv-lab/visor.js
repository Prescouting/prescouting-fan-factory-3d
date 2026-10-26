import * as THREE from '../three.module.js';
import {GLTFLoader} from '../GLTFLoader.js';
const $=id=>document.getElementById(id);
const canvas=$('viewport');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.09;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1919);
scene.add(new THREE.HemisphereLight(0xf5f6e9,0x33452e,2.0));
const key=new THREE.DirectionalLight(0xffeacc,3.0);key.position.set(-3,5,5);scene.add(key);
const fill=new THREE.DirectionalLight(0xa2bedb,1.8);fill.position.set(3,2,1);scene.add(fill);
const rim=new THREE.DirectionalLight(0xd8efae,1.0);rim.position.set(2,5,-3);scene.add(rim);
const camera=new THREE.PerspectiveCamera(36,1,.05,50);
const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.26,.15,64),new THREE.MeshStandardMaterial({color:0x1d3027,metalness:.32,roughness:.67}));
platform.position.y=-.084;scene.add(platform);
const neon=new THREE.Mesh(new THREE.TorusGeometry(1.15,.012,8,76),new THREE.MeshBasicMaterial({color:0xd9fb19}));neon.rotation.x=-Math.PI/2;neon.position.y=-.005;scene.add(neon);
const root=new THREE.Group();scene.add(root);
let actor=null,mixer=null,actions=new Map(),activeAction=null,sex='female';
let requestSerial=0,zoom=3.60,targetZoom=3.60,yaw=.05,targetYaw=.05,spin=true,drag=null,lastTime=performance.now(),timer=0;
const loader=new GLTFLoader(),cache={};
const clips={female:[['Breathing','RESPIRAR'],['Wave','GESTO DE MANO'],['Celebrate','CELEBRAR'],['Walk','CAMINAR'],['Nod','ASENTIR']],male:[['Breathing','RESPIRAR'],['HandInPocket','GESTO SUTIL'],['Celebrate','CELEBRAR'],['Walk','CAMINAR'],['Nod','ASENTIR']]};
function status(s){$('status').textContent=s}
function sizing(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<600?42:37;camera.updateProjectionMatrix()}
function action(name){
 const a=actions.get(name);if(!a){status('MOVIMIENTO NO DISPONIBLE');return}
 if(activeAction && activeAction!==a)activeAction.fadeOut(.2);
 const isLoop=name==='Breathing'||name==='Walk';
 a.reset().enabled=true;a.setLoop(isLoop?THREE.LoopRepeat:THREE.LoopOnce,isLoop?Infinity:1);a.clampWhenFinished=!isLoop;a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);a.fadeIn(.20).play();
 activeAction=a;
 document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('selected',b.dataset.action===name));
 status(name==='Breathing'?'IDLE · MOVIMIENTO REAL':name.toUpperCase()+' · ANIMACIÓN');
 clearTimeout(timer);
 if(!isLoop){const thisMixer=mixer;timer=setTimeout(()=>{if(thisMixer===mixer&&activeAction===a)action('Breathing')},Math.min(3500,a.getClip().duration*1000+150))}
}
async function choose(gender){
 const token=++requestSerial;sex=gender;status('CARGANDO '+(gender==='female'?'ÁTICA':'VESPER')+'…');
 $('choose-female').classList.toggle('selected',sex==='female');
 $('choose-male').classList.toggle('selected',sex==='male');
 $('hero').textContent=sex==='female'?'ÁTICA':'VESPER';
 $('outfit').textContent=sex==='female'?'GORRO ROSA / CARGO ROSA':'SUDADERA AZUL / CARGO NEGRO';
 $('info').textContent=sex==='female'?'ÁTICA: gesto pequeño de mano, respiración, asentimiento, celebración y marcha sobre el sitio. Rig experimental, no definitivo.':'VESPER: respiración, movimiento con manos en bolsillos, asentimiento, celebración y marcha sobre el sitio. No se ha fingido un saludo que el modelo no puede hacer.';
 try{
  let gltf=cache[gender];
  if(!gltf){gltf=await loader.loadAsync('./'+(gender==='female'?'atica':'vesper')+'.glb');cache[gender]=gltf}
  if(requestSerial!==token)return;
  if(actor){root.remove(actor);if(mixer)mixer.stopAllAction();}
  actor=gltf.scene;
  const bb=new THREE.Box3().setFromObject(actor);const center=bb.getCenter(new THREE.Vector3());
  actor.position.set(-center.x,-bb.min.y,-center.z);
  actor.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
  root.add(actor);mixer=new THREE.AnimationMixer(actor);actions=new Map();
  for(const c of gltf.animations)actions.set(c.name,mixer.clipAction(c));
  const el=$('actions');el.replaceChildren();
  clips[gender].forEach(([name,label])=>{
   const b=document.createElement('button');b.type='button';b.dataset.action=name;b.textContent=label;
   b.disabled=!actions.has(name);
   b.onclick=()=>action(name);el.appendChild(b);
  });
  const skin=[];actor.traverse(o=>{if(o.isSkinnedMesh)skin.push(o.skeleton.bones.length)});
  status('GLB CARGADO · '+gltf.animations.length+' CLIPS · '+(skin[0]||0)+' HUESOS');
  action('Breathing');
  window.__PS_MV_LAB={model:actor,actions,mixer,renderer,scene,skin};
 }catch(e){console.error(e);status('ERROR EN LA CARGA: '+e.message.slice(0,50))}
}
const fps=1/28;let accumulator=0;function frame(t){
 requestAnimationFrame(frame);
 const dt=Math.min(.09,(t-lastTime)/1000);lastTime=t;
 accumulator+=dt;
 if(accumulator<fps)return;
 const delta=accumulator;accumulator=0;
 if(mixer)mixer.update(delta);
 if(spin&&!drag)targetYaw+=delta*.21;
 yaw+=(targetYaw-yaw)*Math.min(1,delta*7);
 zoom+=(targetZoom-zoom)*Math.min(1,delta*7);
 root.rotation.y=yaw;
 camera.position.set(.03,1.22,zoom);camera.lookAt(0,.91,0);
 renderer.render(scene,camera);
}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw:targetYaw};spin=false;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.008});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.min(5.5,Math.max(1.85,targetZoom+e.deltaY*.003))},{passive:false});
$('choose-female').onclick=()=>choose('female');$('choose-male').onclick=()=>choose('male');
$('front').onclick=()=>{spin=false;targetYaw=0};$('profile').onclick=()=>{spin=false;targetYaw=Math.PI/2};$('back').onclick=()=>{spin=false;targetYaw=Math.PI};
$('spin').onclick=()=>{spin=!spin;$('spin').textContent='GIRO: '+(spin?'ON':'OFF')};
$('zin').onclick=()=>targetZoom=Math.max(1.85,targetZoom-.33);
$('zout').onclick=()=>targetZoom=Math.min(5.5,targetZoom+.33);
window.addEventListener('resize',sizing);
sizing();choose('female');requestAnimationFrame(frame);
