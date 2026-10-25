import * as THREE from '../three.module.js';
import { GLTFLoader } from '../GLTFLoader.js';
const $=id=>document.getElementById(id);
const canvas=$('character');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x071315);
scene.fog=new THREE.FogExp2(0x081315,.044);
const camera=new THREE.PerspectiveCamera(41,1,.05,55);
scene.add(new THREE.HemisphereLight(0xe4f2f2,0x25332b,2.25));
const key=new THREE.DirectionalLight(0xffead0,3.35);
key.position.set(-2.6,5.8,6.5);scene.add(key);
const fill=new THREE.PointLight(0x81cce6,14,8);
fill.position.set(-3,2.8,1.4);scene.add(fill);
const rim=new THREE.PointLight(0xd6ff00,17,8);
rim.position.set(2.5,3.7,-2.7);scene.add(rim);
const stageMat=new THREE.MeshStandardMaterial({color:0x182423,roughness:.56,metalness:.53});
const base=new THREE.Mesh(new THREE.CylinderGeometry(1.37,1.50,.16,74),stageMat);
base.position.y=-.092;scene.add(base);
const stageTop=new THREE.Mesh(new THREE.CylinderGeometry(1.17,1.19,.013,68),new THREE.MeshStandardMaterial({color:0x233129,roughness:.68,metalness:.24}));
stageTop.position.y=-.004;scene.add(stageTop);
const neon=new THREE.Mesh(new THREE.TorusGeometry(1.33,.013,8,80),new THREE.MeshBasicMaterial({color:0xd6ff00}));
neon.rotation.x=-Math.PI/2;neon.position.y=.002;scene.add(neon);
for(const side of [-1,1]){
  const strip=new THREE.Mesh(new THREE.BoxGeometry(.037,3.9,.04),new THREE.MeshBasicMaterial({color:0xa6d221}));
  strip.position.set(side*1.55,1.9,-1.20);scene.add(strip);
  const metal=new THREE.Mesh(new THREE.BoxGeometry(.08,3.95,.08),stageMat);
  metal.position.set(side*1.63,1.9,-1.23);scene.add(metal);
}
const topStrip=new THREE.Mesh(new THREE.BoxGeometry(3.35,.034,.06),new THREE.MeshBasicMaterial({color:0xb6e931}));
topStrip.position.set(0,3.88,-1.2);scene.add(topStrip);

const characterRoot=new THREE.Group();scene.add(characterRoot);
let model=null,mixer=null,actions=new Map(),lastAction=null,nowAction='Idle';
let zoom=window.innerWidth<650?3.0:3.4,targetZoom=window.innerWidth<650?3.0:3.4,orbit=.08,targetOrbit=.08,drag=null,spin=true,camMode='free',camSince=0;
let frameTime=0,lastTime=performance.now(),lastResizeX=0,lastResizeY=0,actionTimeout=0;

function setText(msg){$('state-label').textContent=msg;}
function choose(name,{forceLoop=false,returnToIdle=true}={}){
 const action=actions.get(name);
 if(!action){setText('GESTO NO DISPONIBLE');return;}
 clearTimeout(actionTimeout);
 const previous=lastAction;
 const loop=forceLoop || name==='Idle' || name==='Walk';
 if(previous && previous!==action)previous.fadeOut(.20);
 action.reset();
 action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
 action.clampWhenFinished=!loop;
 action.enabled=true;action.setEffectiveTimeScale(1);action.setEffectiveWeight(1);
 action.fadeIn(.17).play();
 lastAction=action;nowAction=name;
 for(const btn of document.querySelectorAll('[data-action]'))btn.classList.toggle('active',btn.dataset.action===name);
 setText(name==='Idle'?'RESPIRACIÓN EN TIEMPO REAL':'ACTUACIÓN: '+name.toUpperCase());
 if(!loop && returnToIdle){
   const activeMixer=mixer;
   actionTimeout=setTimeout(()=>{if(mixer===activeMixer&&lastAction===action)choose('Idle')},Math.min(6200,action.getClip().duration*1000+130));
 }
}
function zoomTo(value){targetZoom=Math.max(1.70,Math.min(6.2,value));}
function resize(){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||w===lastResizeX&&h===lastResizeY)return;
 lastResizeX=w;lastResizeY=h;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<650?1.05:1.35));
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 camera.fov=window.innerWidth<650?46:36;
 camera.updateProjectionMatrix();
}
function tick(t){
 requestAnimationFrame(tick);
 if(t-frameTime<32)return;
 frameTime=t;
 const dt=Math.min(.067,Math.max(.001,(t-lastTime)/1000));lastTime=t;
 if(camMode==='fancam'){
   const pct=Math.min(1,(t-camSince)/4300);
   targetOrbit=-2.8+pct*3.15;
   zoomTo(5.35-(3.1*(pct*pct*(3-2*pct))));
   if(pct>=1){
     camMode='spotlight';spin=false;targetOrbit=.23;
     setText('◉ FAN CAM · '+FAN_MODELS[profile].name+' TE SALUDA');
     $('camera-status').textContent='FAN CAM activada. Ática está en primer plano, saludando.';
     choose('Wave');
   }
 }else if(spin&&drag===null&&camMode==='free'){targetOrbit+=dt*.16;}
 orbit+=(targetOrbit-orbit)*Math.min(1,dt*6);
 zoom+=(targetZoom-zoom)*Math.min(1,dt*6);
 characterRoot.rotation.y=orbit;
 camera.position.set(.12,1.31,zoom);
 camera.lookAt(0,1.06,0);
 if(mixer)mixer.update(dt);
 renderer.render(scene,camera);
}
const FAN_MODELS={
  atica:{path:'../maestros/female-animated-mv-v2.glb',name:'ÁTICA',number:'FAN FACTORY · 01 / 02',
    outfit:'GORRO ROSA · MELENA RUBIA · CARGO ROSA',size:'3D',
    desc:'Ática. Geometría nueva Hunyuan3D 2.0 a partir de referencias multivista, con 18 huesos y cinco clips. Texturas proyectadas desde 4 ángulos. Aún requiere retoque de cara y cabellos: prueba técnica funcional, no modelo premium aprobado.'},
  vesper:{path:'../maestros/male-animated-mv-v2.glb',name:'VESPER',number:'FAN FACTORY · 02 / 02',
    outfit:'GAFAS OSCURAS · PELO RUBIO · STREET AZUL',size:'3D',
    desc:'Vesper. Geometría nueva Hunyuan3D 2.0 multivista, con 18 huesos y cinco clips. Texturas proyectadas desde frontal, perfil y espalda. Aún requiere limpieza y rig profesional: prueba técnica funcional, no personaje final.'}
};
const profileCache=new Map();
let profile='atica',loadRequest=0;
function materialGloves(character){
 character.traverse(o=>{
  if(!o.isMesh)return;
  const single=Array.isArray(o.material)?o.material:[o.material];
  const updated=single.map(m=>{
    if(m?.name!=='Skin')return m;
    // Textile glove treatment on exposed anatomically skinned hands.
    const glove=m.clone();glove.name='Genuine structured black leather gloves';
    glove.map=null;glove.color=new THREE.Color(0x242a27);
    glove.metalness=.10;glove.roughness=.57;glove.needsUpdate=true;return glove;
  });
  o.material=Array.isArray(o.material)?updated:updated[0];
 });
}
async function loadProfile(id){
 if(!FAN_MODELS[id])return;
 const token=++loadRequest;
 setText('CARGANDO '+FAN_MODELS[id].name+' EN 3D...');
 $('camera-status').textContent='Descargando malla y animaciones del personaje...';
 try{
   let data=profileCache.get(id);
   if(!data){
      const gltf=await new GLTFLoader().loadAsync('./'+FAN_MODELS[id].path);
      const actor=gltf.scene;
      const bounds=new THREE.Box3().setFromObject(actor);
      const center=bounds.getCenter(new THREE.Vector3());
      actor.position.set(-center.x,-bounds.min.y,-center.z);
      materialGloves(actor);
      actor.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
      data={actor,clips:gltf.animations};
      profileCache.set(id,data);
   }
   if(token!==loadRequest)return;
   if(mixer)mixer.stopAllAction();
   if(model)model.visible=false;
   model=data.actor;
   if(!model.parent)characterRoot.add(model);
   model.visible=true;
   mixer=new THREE.AnimationMixer(model);
   actions=new Map();
   const clipAliases={
     PRESCOUTING_IDLE:'Idle',
     PRESCOUTING_PRESENT:'Wave',
     PRESCOUTING_BREAKING:'Cheer',
     PRESCOUTING_WALK:'Walk',
     PRESCOUTING_NOD:'Laugh',
     PRESCOUTING_POINT:'Point'
   };
   for(const clip of data.clips)actions.set(clipAliases[clip.name]||clip.name,mixer.clipAction(clip));
   if(!actions.has('Idle'))throw new Error('Missing Idle for '+id);
   lastAction=null;profile=id;
   camMode='free';spin=true;targetZoom=window.innerWidth<650?3.0:3.4;targetOrbit=.08;
   $('hero-number').textContent=FAN_MODELS[id].number;
   $('hero-name').innerHTML=FAN_MODELS[id].name+'<span>°</span>';
   $('hero-outfit').textContent=FAN_MODELS[id].outfit;
   $('stats-name').textContent=FAN_MODELS[id].name;
   $('fan-size').textContent=FAN_MODELS[id].size;
   $('fan-description').textContent=FAN_MODELS[id].desc;
   document.querySelectorAll('[data-fan]').forEach(b=>b.classList.toggle('chosen',b.dataset.fan===id));
   choose('Idle');
   setText('3D CARGADO · 18 HUESOS · '+data.clips.length+' ACCIONES');
   $('camera-status').textContent='Modelo cargado. Arrastra para girarlo o prueba las animaciones.';
   window.__ATICA_QA={sceneBody:model,mixer,actions,camera,scene,renderer,profile:id};
 }catch(error){
   console.error('PRESCOUTING_FAN_LOAD_ERROR',error);
   setText('ERROR AL CARGAR '+FAN_MODELS[id].name);
   $('camera-status').textContent='No se ha podido cargar el archivo 3D. Comprueba la conexión.';
 }
}
async function init(){resize();requestAnimationFrame(tick);await loadProfile('atica');}
document.querySelectorAll('[data-fan]').forEach(btn=>btn.addEventListener('click',()=>loadProfile(btn.dataset.fan)));
for(const btn of document.querySelectorAll('[data-action]')){
 btn.addEventListener('click',()=>{camMode='free';choose(btn.dataset.action);});
}
$('zoom-in').addEventListener('click',()=>zoomTo(targetZoom-.34));
$('zoom-out').addEventListener('click',()=>zoomTo(targetZoom+.34));
$('spin-toggle').addEventListener('click',()=>{
 camMode='free';spin=!spin;
 $('spin-toggle').classList.toggle('active',spin);
 $('camera-status').textContent=spin?'Giro automático activado.':'Giro manual: arrastra el personaje.';
});
$('fancam').addEventListener('click',()=>{
 if(!model)return;
 camMode='fancam';camSince=performance.now();spin=false;
 $('spin-toggle').classList.remove('active');
 $('camera-status').textContent='FAN CAM: buscando una nueva aficionada...';
 choose('Idle');
});
canvas.addEventListener('pointerdown',ev=>{drag={x:ev.clientX,y:ev.clientY};camMode='free';spin=false;$('spin-toggle').classList.remove('active');canvas.setPointerCapture(ev.pointerId);});
canvas.addEventListener('pointermove',ev=>{if(!drag)return;targetOrbit+=(ev.clientX-drag.x)*.012;drag={x:ev.clientX,y:ev.clientY};});
canvas.addEventListener('pointerup',()=>{drag=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('wheel',ev=>{ev.preventDefault();zoomTo(targetZoom+ev.deltaY*.006);},{passive:false});
window.addEventListener('resize',resize);
init();
