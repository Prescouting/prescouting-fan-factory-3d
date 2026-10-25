import * as THREE from '../three.module.js';import{GLTFLoader}from'../GLTFLoader.js';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({canvas:$('render'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.42;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x071719);scene.fog=new THREE.FogExp2(0x081819,.032);
const camera=new THREE.PerspectiveCamera(36,1,.05,40);
scene.add(new THREE.HemisphereLight(0xfcfaff,0x344139,2.5));
const k=new THREE.DirectionalLight(0xffeed6,3.2);k.position.set(-3,6,5);scene.add(k);
const cool=new THREE.PointLight(0x649cff,10,9);cool.position.set(3,3,3);scene.add(cool);
const rim=new THREE.DirectionalLight(0xd7ff00,2.8);rim.position.set(1,3,-5);scene.add(rim);
const st=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.35,.14,72),new THREE.MeshStandardMaterial({color:0x16251d,metalness:.42,roughness:.68}));st.position.y=-.08;scene.add(st);
const torus=new THREE.Mesh(new THREE.TorusGeometry(1.23,.016,8,100),new THREE.MeshBasicMaterial({color:0xd7ff00}));torus.rotation.x=-Math.PI/2;torus.position.y=.006;scene.add(torus);
const root=new THREE.Group();scene.add(root);const loader=new GLTFLoader(),cache={};
let model=null,mixer=null,actions=new Map(),cur=null,profile='male',last=performance.now(),orbit=.08,targetOrbit=.08,zoom=3.25,targetZoom=3.25,spin=true,drag=null,req=0;
const names={male:{title:'VESPER',sub:'CABELLO RUBIO · SUDADERA AZUL · CARGO NEGRO',desc:'Cráneo anatómico esculpido en piezas, gafas de sol oscuras, cabello rubio levantado, sudadera azul y zapatillas deportivas azules.'},female:{title:'ÁTICA',sub:'GORRO ROSA · MELENA RUBIA · CARGO ROSA',desc:'Cráneo anatómico, gorro tejido rosa, melena rubia ondulada, camiseta corta negra, costillas óseas a la vista y pantalones cargo rosas.'}};
function resize(){const c=$('render');const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<550?42:36;camera.updateProjectionMatrix();}
async function load(id){const token=++req;profile=id;$('status').textContent='CARGANDO '+id.toUpperCase()+'…';
 try{let data=cache[id];if(!data){const g=await loader.loadAsync('./'+id+'-hunyuan2-projected.glb');const actor=g.scene;
 const box=new THREE.Box3().setFromObject(actor);const center=box.getCenter(new THREE.Vector3());actor.position.set(-center.x,-box.min.y,-center.z);
 actor.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});data=cache[id]={actor,clips:g.animations};}
 if(token!==req)return;if(model){model.visible=false;if(mixer)mixer.stopAllAction();}
 model=data.actor;if(!model.parent)root.add(model);model.visible=true;
 mixer=new THREE.AnimationMixer(model);actions.clear();
 const aliases={PRESCOUTING_IDLE:'Idle',PRESCOUTING_PRESENT:'Wave',PRESCOUTING_BREAKING:'Cheer',PRESCOUTING_WALK:'Walk',PRESCOUTING_NOD:'Laugh',PRESCOUTING_POINT:'Point'};
 for(const clip of data.clips)actions.set(aliases[clip.name]||clip.name,mixer.clipAction(clip));
 $('reference-image').src='./ref_'+id+'.png';$('hero').textContent=names[id].title;$('subtitle').textContent=names[id].sub;$('desc').textContent=names[id].desc;
 document.querySelectorAll('[data-model]').forEach(b=>b.classList.toggle('on',b.dataset.model===id));
 $('status').textContent='GEOMETRÍA HUNYUAN 2.0 · SIN RIG';
 setAction('Idle');targetOrbit=.08;
 window.__PRESCOUTING_MODEL={model,actions,mixer,renderer,scene,camera};
 }catch(e){console.error(e);$('status').textContent='ERROR DE MODELO';}
}
function setAction(n){const a=actions.get(n);if(!a){return;}if(cur&&cur!==a)cur.fadeOut(.15);
 a.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);a.setLoop(n==='Idle'||n==='Walk'?THREE.LoopRepeat:THREE.LoopOnce,n==='Idle'||n==='Walk'?Infinity:1);a.clampWhenFinished=true;a.fadeIn(.15).play();cur=a;
 document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('on',b.dataset.action===n));
}
function tick(t){requestAnimationFrame(tick);if(t-last<25)return;const dt=Math.min(.055,(t-last)/1000);last=t;
 if(mixer)mixer.update(dt);
 if(spin&&!drag)targetOrbit+=dt*.14;
 orbit+=(targetOrbit-orbit)*Math.min(1,dt*7);zoom+=(targetZoom-zoom)*Math.min(1,dt*6);
 root.rotation.y=orbit;camera.position.set(.04,1.32,zoom);camera.lookAt(0,.89,0);renderer.render(scene,camera);
}
for(const b of document.querySelectorAll('[data-model]'))b.addEventListener('click',()=>load(b.dataset.model));
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('click',()=>setAction(b.dataset.action));
if($('rotate'))$('rotate').addEventListener('click',()=>{spin=!spin;$('rotate').classList.toggle('on',spin)});
$('front').addEventListener('click',()=>{spin=false;targetOrbit=0});
$('side').addEventListener('click',()=>{spin=false;targetOrbit=Math.PI/2});
$('back').addEventListener('click',()=>{spin=false;targetOrbit=Math.PI});
$('zoom').addEventListener('click',()=>{targetZoom=targetZoom<2.5?3.25:2.1});
const cvs=$('render');
cvs.addEventListener('pointerdown',e=>{drag={x:e.clientX,start:targetOrbit};cvs.setPointerCapture(e.pointerId);spin=false;if($('rotate'))$('rotate').classList.remove('on')});
cvs.addEventListener('pointermove',e=>{if(drag)targetOrbit=drag.start+(e.clientX-drag.x)*.008});
cvs.addEventListener('pointerup',()=>drag=null);cvs.addEventListener('pointercancel',()=>drag=null);
cvs.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.max(1.75,Math.min(5.1,targetZoom+e.deltaY*.003))},{passive:false});
window.addEventListener('resize',resize);resize();load('male');requestAnimationFrame(tick);
