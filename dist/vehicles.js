import * as THREE from './assets/three.module.js';

// Licensed imported vehicle models; see assets/LICENSES.txt for source credits.
// Geometry and wheel pivots come from the pack; driving state stays in driving.mjs.
export const VEHICLE_ASSETS={
 'getaway-van':'../concept/traffic-crossover',coupe:'../concept/traffic-coupe',racer:'../concept/traffic-hyper','police-car':'../concept/traffic-coupe',
 taxi:'../concept/traffic-crossover',suv:'../concept/traffic-suv',hatchback:'../concept/traffic-gt',
 'concept-gt':'../concept/concept-gt','concept-coupe':'../concept/concept-coupe','concept-hyper':'../concept/concept-hyper',
 'concept-crossover':'../concept/concept-crossover','concept-cab':'../concept/concept-crossover','concept-suv':'../concept/concept-suv'
};
// Detailed player cars (3-11 MB each) stream in after the lightweight pack so pages draw immediately.
// Traffic uses optimized versions of the same detailed shapes. These also show while showroom detail loads.
export const DETAILED_STAND_INS={'concept-gt':'hatchback','concept-coupe':'coupe','concept-hyper':'racer','concept-crossover':'getaway-van','concept-cab':'taxi','concept-suv':'suv'};
const templates=new Map(),streams=new Map(),listeners=new Set(),files=new Map();
function serviceTrim(scene,id){
 if(!['police-car','taxi','concept-cab'].includes(id))return;
 const body=scene.getObjectByName('Body'),bounds=new THREE.Box3().setFromObject(scene),roof=bounds.max.y;
 function piece(name,color,w,h,d,x,y,z,glow=false){const m=new THREE.MeshStandardMaterial({name,color,roughness:.38,metalness:.3,emissive:glow?color:'#000000',emissiveIntensity:glow?.7:0});const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);body.add(mesh);}
 if(id==='police-car'){
  scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='paint'){o.material=m.clone();o.material.color.set('#e2e6de');}});
  piece('lightbar','#202830',.76,.05,.2,0,roof+.025,-.05);piece('police-red','#ff344b',.32,.1,.17,-.2,roof+.1,-.05,true);piece('police-blue','#308bff',.32,.1,.17,.2,roof+.1,-.05,true);
 }else{
  piece('taxi-sign','#ffda62',.46,.17,.13,0,roof+.1,0,true);
  for(let n=0;n<4;n++)piece('taxi-checker',n%2?'#ffdc72':'#23333a',.075,.045,.012,-.115+n*.075,roof+.09,.071);
 }
}
async function loadTemplate(loader,id){
 const file=VEHICLE_ASSETS[id];if(!files.has(file))files.set(file,loader.loadAsync('/assets/models/rgsdev/'+file+'.glb'));const original=await files.get(file),gltf={scene:original.scene.clone(true)};serviceTrim(gltf.scene,id);
 const body=gltf.scene.getObjectByName('Body');let wheels=0;
 gltf.scene.traverse(o=>{if(o.userData.wheel)wheels++;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.geometry.userData.shared=true;}});
 if(!body||wheels!==4)throw new Error('Incomplete vehicle model: '+file);
 templates.set(id,gltf.scene);
}
// detailed:'background' (pages) resolves once the core pack is ready; 'eager' (checks) also waits for detailed cars.
export async function loadVehiclePack(loader,{detailed='background'}={}){
 await Promise.all(Object.keys(VEHICLE_ASSETS).filter(id=>!DETAILED_STAND_INS[id]).map(id=>loadTemplate(loader,id)));
 for(const id of Object.keys(DETAILED_STAND_INS)){
  if(templates.has(id)||streams.has(id))continue;
  streams.set(id,loadTemplate(loader,id).then(()=>{for(const listener of listeners){try{listener(id);}catch(error){console.error(error);}}},error=>{console.warn('Keeping the stand-in for '+id+':',error);}));
 }
 if(detailed==='eager')await Promise.all(streams.values());
}
export function vehicleReady(model){return streams.get(model)||Promise.resolve();}
export function onVehicleLoaded(listener){listeners.add(listener);return()=>listeners.delete(listener);}
let underglowMap;
function glowMap(){if(underglowMap)return underglowMap;const data=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);data.set([255,255,255,Math.round(Math.max(0,1-r)**1.3*220)],i);}underglowMap=new THREE.DataTexture(data,64,64);underglowMap.magFilter=THREE.LinearFilter;underglowMap.needsUpdate=true;return underglowMap;}
export function makeVehicle(model,scale=1.7,paint=null,skin=null){
 let source=templates.get(model),standIn=null;
 if(!source&&DETAILED_STAND_INS[model]){source=templates.get(DETAILED_STAND_INS[model]);standIn=model;}
 if(!source)throw new Error('Vehicle is not loaded: '+model);
 const group=new THREE.Group(),root=new THREE.Group(),asset=source.clone(true);
 group.add(root);root.add(asset);root.scale.setScalar(scale);
 const body=asset.getObjectByName('Body'),wheels=[],materialCopies=new Map(),policeLights=[];
 let tail=null;
 const cloneMaterial=original=>{
  if(materialCopies.has(original))return materialCopies.get(original);
  const m=original.clone();materialCopies.set(original,m);
  if(m.name==='paint'){if(['taxi','concept-cab'].includes(model))m.color.set('#e3b43e');else if(paint)m.color.set(paint);}
  if(skin?.color&&m.name==='paint'){m.color.set(skin.color);m.metalness=skin.metalness;m.roughness=skin.roughness;}
  if(skin?.accent&&['chrome','rim'].includes(m.name)){m.color.set(skin.accent);m.metalness=.75;m.roughness=.27;}
  if(skin?.customPaint&&m.name==='paint')m.color.set(skin.customPaint);
  if(skin?.wheelColor&&['chrome','rim'].includes(m.name))m.color.set(skin.wheelColor);
  if(m.name==='brake')tail=m;
  if(m.name==='police-red')policeLights[0]={material:m};
  if(m.name==='police-blue')policeLights[1]={material:m};
  return m;
 };
 asset.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(cloneMaterial):cloneMaterial(o.material);if(o.userData.wheel)wheels.push({pivot:o,front:o.userData.front,radius:o.userData.radius});});
 for(const w of wheels){const spin=new THREE.Group();for(const child of [...w.pivot.children])spin.add(child);w.pivot.add(spin);w.spin=spin;}
 if(skin?.underglow){const glow=new THREE.Mesh(new THREE.PlaneGeometry(4.2,6.2),new THREE.MeshBasicMaterial({map:glowMap(),color:skin.underglowColor||'#a9ec79',transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.y=.055;group.add(glow);}
 return{group,root,body,wheels,tail,policeLights,pitch:0,roll:0,spring:0,springVelocity:0,bodyY:body.position.y,model,standIn};
}
export function animateVehicle(view,car,dt){
 view.group.position.set(car.x,.04+car.y,car.z);view.group.rotation.y=car.heading;
 const smooth=dt?1-Math.exp(-dt*11):1;
 view.pitch+=(THREE.MathUtils.clamp((car.acceleration||0)*-.0017-car.vy*.025,-.12,.12)-view.pitch)*smooth;
 view.roll+=(THREE.MathUtils.clamp((car.yawRate||0)*car.speed*.003,-.095,.095)-view.roll)*smooth;
 if(car.landed)view.springVelocity=-.95;
 const springTarget=car.y<.1?Math.sin((car.wheelTravel||0)*1.8)*Math.min(car.speed*.00035,.009):0;
 view.springVelocity+=((springTarget-view.spring)*85-view.springVelocity*13)*dt;view.spring=THREE.MathUtils.clamp(view.spring+view.springVelocity*dt,-.1,.065);view.body.position.y=view.bodyY+view.spring;
 view.body.rotation.set(view.pitch,0,view.roll);
 for(const w of view.wheels){w.pivot.rotation.y=w.front?-(car.steering||0)*.48:0;w.spin.rotation.x=(car.wheelTravel||0)/(w.radius*view.root.scale.x);}
 if(view.tail)view.tail.emissiveIntensity=car.braking?3.5:.65;
 view.policeLights.forEach((l,i)=>{l.material.emissiveIntensity=Math.sin((car.wheelTravel||0)*2+i*Math.PI)>0?3:.4;});
}
