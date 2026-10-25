import * as THREE from '../three.module.js';
import {GLTFLoader} from '../GLTFLoader.js';
const $=id=>document.getElementById(id);
const canvas=$('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.45));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.37;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x091716);
scene.fog=new THREE.Fog(0x0b1717,10,22);
const camera=new THREE.PerspectiveCamera(37,1,.05,80);
const fill=new THREE.HemisphereLight(0xf1f5ed,0x24352d,2.7);scene.add(fill);
const key=new THREE.DirectionalLight(0xffe8c7,3.35);key.position.set(-3,7,5);scene.add(key);
const rim=new THREE.DirectionalLight(0xd4ff00,2.4);rim.position.set(3,4,-4);scene.add(rim);
const cool=new THREE.PointLight(0x70bdff,10,10);cool.position.set(2,1.8,3);scene.add(cool);
const material=(c,rough=.65,metal=.02)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal,side:THREE.DoubleSide});
const dark=material(0x0c1b19,.55,.5);
const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.24,1.37,.16,72),dark);
platform.position.y=-.097;scene.add(platform);
const stage=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.015,72),material(0x243a2d,.64,.4));stage.position.y=-.009;scene.add(stage);
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.22,.014,8,100),new THREE.MeshBasicMaterial({color:0xd5ff00}));ring.rotation.x=-Math.PI/2;ring.position.y=.001;scene.add(ring);
for(const side of [-1,1]){
  const column=new THREE.Mesh(new THREE.BoxGeometry(.028,3.3,.025),new THREE.MeshBasicMaterial({color:0x90c928}));
  column.position.set(side*1.44,1.65,-.9);scene.add(column);
}
const loader=new GLTFLoader();
const cache=new Map();
const actorHolder=new THREE.Group();scene.add(actorHolder);
const FACE={atica:{height:1.655,bone:'mixamorig:Head'},vesper:{height:1.606,bone:'Head'}};
const OUTFITS=[
 {id:'marfil',name:'Marfil',color:'#c9c4ae',shoe:'#f8eee0'},
 {id:'azul',name:'Azul',color:'#203e70',shoe:'#eaeff7'},
 {id:'negro',name:'Negro',color:'#181c23',shoe:'#f4f0e6'},
 {id:'rojo',name:'Rojo',color:'#c31c32',shoe:'#f5f1eb'},
 {id:'rosa',name:'Rosa',color:'#ec759e',shoe:'#fff5f8'},
 {id:'verde',name:'Verde',color:'#2a705b',shoe:'#efece0'},
 {id:'lila',name:'Lila',color:'#9575c4',shoe:'#f3ecff'},
 {id:'naranja',name:'Naranja',color:'#e17630',shoe:'#efeeee'}
];
const HAIRS=[['none','Sin pelo'],['spikes','Puntas'],['short','Corto'],['waves','Ondas'],['bob','Bob'],['ponytail','Coleta'],['bun','Moño'],['pigtails','Coletas'],['curls','Rizos']];
const HATS=[['none','Sin gorro'],['cap','Gorra'],['beanie','Beanie'],['bucket','Bucket']];
const EYES=[['none','Sin gafas'],['sun','Sol'],['round','Redondas'],['visor','Visor']];
const EXTRAS=[['none','Ninguno'],['earrings','Pendientes'],['headphones','Auriculares'],['chain','Cadena']];
const PRESETS=[
 ['Ática','atica','verde','bun','none','none','earrings','#b2b8d9'],
 ['Vesper','vesper','azul','spikes','none','sun','chain','#df8b52'],
 ['Rayo','vesper','rojo','none','cap','none','chain','#643631'],
 ['Luna','atica','lila','ponytail','none','round','earrings','#d9d5ee'],
 ['Nexo','vesper','verde','short','cap','none','headphones','#283b41'],
 ['Zeta','atica','naranja','waves','cap','none','chain','#c7a177'],
 ['Kaos','vesper','naranja','spikes','none','sun','chain','#b86c37'],
 ['Brisa','atica','rosa','waves','beanie','none','earrings','#eec6d6'],
 ['Titán','vesper','negro','short','none','none','chain','#393944'],
 ['Nimba','atica','verde','waves','cap','sun','earrings','#c89c71'],
 ['Pixel','vesper','azul','short','none','visor','headphones','#3796e4'],
 ['Nova','atica','rosa','pigtails','none','sun','earrings','#f0d4d0'],
 ['Drako','vesper','negro','none','cap','none','chain','#c9834d'],
 ['Alba','atica','naranja','curls','none','sun','earrings','#ac62af'],
 ['Fénix','vesper','rojo','spikes','none','none','chain','#f0a44f'],
 ['Órbita','vesper','marfil','none','bucket','sun','chain','#3a3e3e'],
 ['Cora','atica','rosa','bun','none','none','earrings','#e8c9ba'],
 ['Blaze','vesper','negro','none','cap','sun','chain','#393334'],
 ['Vega','atica','verde','waves','cap','none','earrings','#dcb88d'],
 ['Axel','vesper','rojo','none','cap','none','chain','#86543a']
];
let state={sex:'atica',palette:'marfil',hair:'bun',hairColor:'#b2b8d9',hat:'none',eye:'none',extra:'earrings',preset:0};
let current=null,mixer=null,actions=new Map(),currentAction=null,accRoot=null,headBone=null,runId=0;
let orbit=.12,targetOrbit=.12,zoom=3.27,targetZoom=3.27,spin=true,drag=null,scrollDelta=0,lastTime=performance.now(),lastFrame=0;
function label(id,el,entries,getVal,setVal){
  el.replaceChildren();for(const [value,name] of entries){
    const b=document.createElement('button');b.type='button';b.textContent=name;b.className=getVal()===value?'selected':'';
    b.addEventListener('click',()=>{setVal(value);state.preset=-1;renderControls();applyStyle()});el.appendChild(b);
  }
}
function renderControls(){
  for(const b of document.querySelectorAll('[data-base]'))b.classList.toggle('selected',b.dataset.base===state.sex);
  const presetEl=$('presets');presetEl.replaceChildren();
  PRESETS.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className=state.preset===i?'selected':'';b.innerHTML='<strong>'+String(i+1).padStart(2,'0')+'</strong>'+p[0];b.addEventListener('click',()=>setPreset(i));presetEl.appendChild(b)});
  const colorEl=$('outfits');colorEl.replaceChildren();
  OUTFITS.forEach(o=>{const b=document.createElement('button');b.title=o.name;b.type='button';b.style.background=o.color;b.setAttribute('aria-label',o.name);b.className=state.palette===o.id?'selected':'';b.addEventListener('click',()=>{state.palette=o.id;state.preset=-1;renderControls();applyStyle()});colorEl.appendChild(b)});
  label(null,$('hairs'),HAIRS,()=>state.hair,v=>state.hair=v);
  label(null,$('hats'),HATS,()=>state.hat,v=>state.hat=v);
  label(null,$('eyewear'),EYES,()=>state.eye,v=>state.eye=v);
  label(null,$('accessories'),EXTRAS,()=>state.extra,v=>state.extra=v);
  $('stampName').textContent=state.preset<0?state.sex==='atica'?'ÁTICA':'VESPER':PRESETS[state.preset][0].toUpperCase();
  $('stampNum').textContent=state.sex==='atica'?'FAN FACTORY · BASE FEMENINA':'FAN FACTORY · BASE MASCULINA';
  $('stampLook').textContent='EDICIÓN '+OUTFITS.find(x=>x.id===state.palette).name.toUpperCase();
}
function setPreset(i){
 const [name,sex,palette,hair,hat,eye,extra,hairColor]=PRESETS[i];
 state={sex,palette,hair,hat,eye,extra,hairColor,preset:i};renderControls();loadCharacter(sex);
}
function matColor(m,name,color){
 if(!m)return;if(m.name.includes(name)){m.color.set(color);m.roughness=.70;m.needsUpdate=true}
}
function splitFemaleHands(mesh){
 if(mesh.userData.skinSplitDone)return;
 const src=mesh.geometry,ind=src.index;if(!ind)return;
 const pos=src.attributes.position;const a=[],b=[];
 mesh.updateMatrixWorld(true);
 const q=new THREE.Vector3();let sample={skin:0,fabric:0};
 for(let i=0;i<ind.count;i+=3){
  const ids=[ind.getX(i),ind.getX(i+1),ind.getX(i+2)];
  let x=0,y=0;
  for(const id of ids){q.fromBufferAttribute(pos,id).applyMatrix4(mesh.matrixWorld);x+=q.x;y+=q.y;}
  x/=3;y/=3;
  const isBone=(Math.abs(x)>.32&&y>.65&&y<1.28)||y<.17;
  (isBone?b:a).push(...ids);
 }
 const geometry=src.clone();geometry.setIndex([...a,...b]);
 geometry.clearGroups();geometry.addGroup(0,a.length,0);geometry.addGroup(a.length,b.length,1);
 mesh.geometry=geometry;mesh.userData.skinSplitDone=true;
 console.log('FAN_SPLIT_CLOTH_AND_HANDS',a.length/3,b.length/3);
}
function recolor(){
 if(!current)return;
 const palette=OUTFITS.find(o=>o.id===state.palette);
 current.traverse(o=>{if(!o.isMesh)return;
  if(o.userData.originalMaterials===undefined){
   o.userData.originalMaterials=(Array.isArray(o.material)?o.material:[o.material]).map(m=>m?.clone());
  }
  const mats=o.userData.originalMaterials.map(m=>m?.clone());
  for(const m of mats){
   if(!m)continue;
   if((state.sex==='atica'&&o.name.includes('SKELETON_MASTER'))||(state.sex==='vesper'&&(m.name.includes('tailored indigo')||o.name.includes('SOURCE_3')))){
     m.map=null;m.color.set(palette.color);m.metalness=.06;m.roughness=.82;m.needsUpdate=true;
   }
   if(m.name.includes('original satin')||m.name.includes('ivory porcelain')){m.color.set('#eee6d8');m.map=null;m.roughness=.6;}
   if(m.name.includes('oval recessed eye cavity')||m.name.includes('almond sockets'))m.color.set('#15101a');
   if(m.name.includes('Shoes')){m.color.set(palette.shoe);m.roughness=.65;}
  }
  if(state.sex==='atica'&&o.name.includes('SKELETON_MASTER')&&o.userData.skinSplitDone){
    const skin=o.userData.originalMaterials[0].clone();
    skin.color.set('#f5eadb');
    o.material=[mats[0],skin];
  }else o.material=Array.isArray(o.material)?mats:mats[0];
 });
}
function mesh(name,geometry,mat,pos,rot,scale){
 const m=new THREE.Mesh(geometry,mat);m.name='ACCESORIO_REAL_'+name;
 if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);if(scale)m.scale.set(...scale);
 m.castShadow=false;accRoot.add(m);return m;
}
function curve(name,coords,rad,col,rough=.6){
 const c=new THREE.CatmullRomCurve3(coords.map(v=>new THREE.Vector3(...v)));
 return mesh(name,new THREE.TubeGeometry(c,Math.max(12,coords.length*6),rad,7,false),material(col,rough));
}
function sphere(name,p,r,col,rough=.63,metal=.02){
 return mesh(name,new THREE.SphereGeometry(1,20,14),material(col,rough,metal),p,null,r);
}
function buildHair(style,col){
 if(style==='none')return;
 const c=col;const capY=.120;
 if(style==='short'||style==='spikes'){
  for(let i=0;i<25;i++){
   const a=2*Math.PI*i/25,r=.048+(i%3)*.026;
   const x=r*Math.cos(a),z=r*Math.sin(a);
   const h=style==='spikes'?.084+(i%5)*.014:.040;
   const cc=style==='spikes'?new THREE.ConeGeometry(.020,h,8):new THREE.SphereGeometry(.025,9,6);
   mesh('pelo'+i,cc,material(c,.88),[x,capY+h*.25,z],[style==='spikes'?Math.sin(a)*.30:0,0,style==='spikes'?Math.cos(a)*.3:0]);
  }
 }else if(style==='bun'){
  for(let i=0;i<11;i++){
   const a=2*Math.PI*i/11;
   sphere('moño lateral',[.01+Math.cos(a)*.035,.17+Math.sin(a)*.021,-.042],[.034,.027,.034],c,.84);
  }
  sphere('cabello recogido',[0,.13,-.045],[.115,.051,.085],c,.83);
 }else if(style==='ponytail'){
  sphere('recogido alto',[0,.135,-.056],[.115,.051,.084],c,.83);
  for(let i=0;i<15;i++){const a=2*Math.PI*i/15,xx=.042*Math.cos(a),zz=-.115+.015*Math.sin(a);
   curve('coleta larga',[[xx,.15,zz],[xx*1.4,.025,zz-.035],[xx*1.8,-.17,zz-.032],[xx*1.1,-.30,zz-.065]],.012+(i%3)*.002,c,.83);}
 }else if(style==='pigtails'){
  sphere('cabellera',[0,.14,-.04],[.122,.044,.10],c,.84);
  for(const side of [-1,1])for(let i=0;i<9;i++){
   const u=(i-4)/9;
   curve('dos coletas',[[side*.10,.08,u*.07],[side*.16,-.05,u*.08],[side*.18,-.21,u*.07],[side*.17,-.28,u*.08]],.013,c,.82);
  }
 }else if(style==='bob'||style==='waves'||style==='curls'){
  sphere('raíz cabello',[0,.136,-.032],[.12,.055,.105],c,.87);
  let n=style==='curls'?42:32;
  for(let i=0;i<n;i++){
   const a=2*Math.PI*i/n,side=Math.cos(a),front=Math.sin(a);
   if(front>.5&&Math.abs(side)<.6)continue;
   const x=.119*side,z=-.017+.083*front;const length=style==='bob'?.20:style==='waves'?.38:.26;
   const bend=style==='curls'?.022:.008;
   const coords=[];
   for(let j=0;j<7;j++){const t=j/6;
     coords.push([x+side*.020*t+bend*Math.sin(t*11+a*2),.11-t*length,z+.015*Math.sin(t*8+a)]);
   }
   curve('mechón modelado',coords,style==='curls'?.010:.012,c,.88);
  }
 }
}
function buildHat(which){
 const brim=material(state.hat==='beanie'?0xe6677c:state.hat==='bucket'?0x243341:0x172f27,.88);
 if(which==='none')return;
 if(which==='beanie'){
  sphere('gorro tejido',[0,.138,0],[.14,.086,.130],brim.color.getHex());
  mesh('reborde de lana',new THREE.CylinderGeometry(.138,.143,.037,48),brim,[0,.104,0]);
  sphere('pompón',[0,.223,0],[.03,.03,.03],brim.color.getHex());
 }else if(which==='cap'){
  sphere('gorra baseball',[0,.112,-.008],[.138,.054,.128],brim.color.getHex());
  mesh('visera bordada',new THREE.CylinderGeometry(.10,.106,.012,24,1),brim,[0,.087,.13],[.08,0,0],[1,.8,1.2]);
  curve('costura panel',[[0,.165,-.03],[0,.17,.01],[0,.16,.08]],.0022,0xd6ff00);
 }else if(which==='bucket'){
  mesh('copa bucket',new THREE.CylinderGeometry(.103,.119,.098,48),brim,[0,.126,0]);
  mesh('ala bucket',new THREE.CylinderGeometry(.153,.148,.013,48),brim,[0,.065,0]);
  curve('detalle sombrero',[[-.09,.14,.03],[0,.148,.112],[.09,.14,.03]],.003,0xd5ff00);
 }
}
function buildEyes(type){
 if(type==='none')return;
 const lens=type==='round'?material(0x9bbbca,.40,.3):material(0x101f29,.18,.5);
 const frame=material(0xc2bcac,.3,.72);
 for(const s of [-1,1]){
  const x=s*.056;
  if(type==='visor')continue;
  mesh('lente',new THREE.SphereGeometry(1,26,16),lens,[x,.023,.119],null,[.041,type==='round'?.040:.029,.008]);
  mesh('montura',new THREE.TorusGeometry(.042,.0045,8,42),frame,[x,.02,.120],null,[1,type==='round'?1:.76,1]);
  curve('patilla lente',[[s*.087,.02,.122],[s*.123,.026,.088],[s*.134,.026,.02]],.004,0xb3b7b3);
 }
 if(type==='visor'){
  sphere('visor panorámico',[0,.016,.115],[.106,.043,.013],0x21424b,.3,.4);
  curve('visor silueta',[[-.1,.038,.115],[0,.052,.123],[.1,.038,.115]],.005,0xd5ff00);
 }else{curve('puente lentes',[[-.012,.026,.13],[0,.032,.136],[.012,.026,.13]],.003,0xbbbfb8);}
}
function buildExtra(type){
 if(type==='none')return;
 if(type==='earrings'){
  for(let s of [-1,1]){
   mesh('pendiente',new THREE.TorusGeometry(.018,.0035,8,32),material(0xd9bf75,.3,.85),[s*.137,-.044,.015],[0,0,0]);
  }
 }else if(type==='headphones'){
  const band=material(0x101923,.55,.5);const pad=material(0x2c3440,.7,.1);
  const ps=[];for(let i=0;i<=20;i++){let a=Math.PI*i/20;ps.push([.145*Math.cos(a),.032+.164*Math.sin(a),-.014]);}
  curve('diadema premium',ps,.008,0x15272a);
  for(let s of [-1,1])sphere('auricular',[s*.14,.025,.009],[.028,.057,.039],pad.color.getHex());
 }else if(type==='chain'){
  const ps=[];for(let i=0;i<=24;i++){let a=2*Math.PI*i/24;ps.push([.107*Math.cos(a),-.128+.063*Math.sin(a),.055]);}
  curve('cadena cuello',ps,.004,0xc0c4b5);
  sphere('medallón',[0,-.202,.104],[.025,.025,.006],0xf1cd56,.26,.8);
 }
}
function renderAccessories(){
 if(!current||!accRoot)return;
 accRoot.children.slice().forEach(ob=>{accRoot.remove(ob);ob.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const arr=Array.isArray(o.material)?o.material:[o.material];for(let m of arr)m.dispose()}})});
 buildHair(state.hair,state.hairColor);
 buildHat(state.hat);buildEyes(state.eye);buildExtra(state.extra);
}
function applyStyle(){recolor();renderAccessories();}
const aliases={PRESCOUTING_IDLE:'Idle',PRESCOUTING_PRESENT:'Wave',PRESCOUTING_BREAKING:'Cheer',PRESCOUTING_WALK:'Walk',PRESCOUTING_NOD:'Laugh',PRESCOUTING_POINT:'Point'};
function playAction(name){
 if(!mixer)return;const a=actions.get(name);if(!a)return;
 const previous=currentAction;if(previous&&previous!==a)previous.fadeOut(.15);
 a.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);a.setLoop(name==='Idle'||name==='Walk'?THREE.LoopRepeat:THREE.LoopOnce,name==='Idle'||name==='Walk'?Infinity:1);a.clampWhenFinished=true;a.fadeIn(.2).play();currentAction=a;
 document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('on',b.dataset.action===name));
 if(!['Idle','Walk'].includes(name)){
  const mixerThis=mixer;setTimeout(()=>{if(mixerThis===mixer&&currentAction===a)playAction('Idle')},Math.min(5000,a.getClip().duration*1000+150));
 }
}
async function loadCharacter(id){
 const token=++runId;
 $('loading').textContent='CARGANDO '+(id==='atica'?'ÁTICA':'VESPER')+'…';
 try{
  let data=cache.get(id);
  if(!data){
   const gltf=await loader.loadAsync('../v4/'+(id==='atica'?'atica-v4.glb':'vesper-v4.glb'));
   data={actor:gltf.scene,clips:gltf.animations};cache.set(id,data);
  }
  if(runId!==token)return;
  if(current){actorHolder.remove(current);if(mixer)mixer.stopAllAction();}
  const actor=data.actor;
  const bounds=new THREE.Box3().setFromObject(actor);
  const center=bounds.getCenter(new THREE.Vector3());
  actor.position.set(-center.x,-bounds.min.y,-center.z);
  actorHolder.add(actor);
  actor.updateMatrixWorld(true);
  actor.traverse(o=>{
   if(o.isSkinnedMesh)o.frustumCulled=false;
   if(o.isMesh&&/(?:FAN_V4_ORIGINAL__ATICA.*(?:cap|ribknit|hoop stud)|FAN_V4_ORIGINAL__VESPER.*(?:beret|brim thin|tailoring gold button))/i.test(o.name)){o.visible=false;}
  });
  current=actor;
  if(id==='atica'){actor.traverse(o=>{if(o.isMesh&&o.name.includes('SKELETON_MASTER'))splitFemaleHands(o)});}
  mixer=new THREE.AnimationMixer(actor);actions.clear();
  for(const clip of data.clips)actions.set(aliases[clip.name]||clip.name,mixer.clipAction(clip));
  const bone=actor.getObjectByName(FACE[id].bone);
  const headY=FACE[id].height-bounds.min.y;
  accRoot=new THREE.Group();accRoot.name='PRESCOUTING_MODULAR_WARDROBE';
  accRoot.position.set(-center.x,headY,-center.z);actorHolder.add(accRoot);
  actorHolder.updateMatrixWorld(true);
  if(bone){bone.updateMatrixWorld(true);bone.attach(accRoot);}
  // Old accessory group is automatically detached by actorHolder.remove on previous model.
  applyStyle();playAction('Idle');
  $('loading').textContent='3D REAL · PREPARADO';
  window.__FAN_FACTORY={state,actor,actions,mixer,accessories:accRoot};
 }catch(err){console.error(err);$('loading').textContent='ERROR DE CARGA';}
}
function resize(){
 let w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const pr=Math.min(window.devicePixelRatio||1,1.45);
 renderer.setPixelRatio(pr);renderer.setSize(w,h,false);
 camera.aspect=w/h;camera.fov=w<540?42:34;camera.updateProjectionMatrix();
}
function animate(t){
 requestAnimationFrame(animate);if(t-lastFrame<26)return;lastFrame=t;
 const dt=Math.min(.05,(t-lastTime)/1000);lastTime=t;
 if(mixer)mixer.update(dt);
 if(spin&&!drag)targetOrbit+=dt*.14;
 orbit+=(targetOrbit-orbit)*Math.min(1,dt*6);
 zoom+=(targetZoom-zoom)*Math.min(1,dt*6);
 actorHolder.rotation.y=orbit;
 camera.position.set(.05,1.32,zoom);camera.lookAt(0,.97,0);
 renderer.render(scene,camera);
}
for(const b of document.querySelectorAll('[data-base]'))b.addEventListener('click',()=>{state.sex=b.dataset.base;state.preset=-1;renderControls();loadCharacter(state.sex);});
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('click',()=>playAction(b.dataset.action));
$('spin').addEventListener('click',()=>{spin=!spin;$('spin').textContent='⟳ ROTACIÓN: '+(spin?'ON':'OFF')});
$('random').addEventListener('click',()=>setPreset(Math.floor(Math.random()*PRESETS.length)));
$('reset').addEventListener('click',()=>setPreset(state.sex==='atica'?0:1));
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,orbit:targetOrbit};canvas.setPointerCapture(e.pointerId);spin=false;$('spin').textContent='⟳ ROTACIÓN: OFF'});
canvas.addEventListener('pointermove',e=>{if(!drag)return;targetOrbit=drag.orbit+(e.clientX-drag.x)*.008});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.max(2.0,Math.min(5.2,targetZoom+e.deltaY*.003))},{passive:false});
window.addEventListener('resize',resize);
resize();setPreset(0);requestAnimationFrame(animate);
