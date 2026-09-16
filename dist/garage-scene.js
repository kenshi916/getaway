import {addHomeSurroundings,createHomeDesign} from './home-design.js?v=36';
import {createWalkingView} from './first-person.js?v=36';
import * as THREE from './assets/three.module.js';
import {buildGarageRoom} from './garage-room.js?v=36';
import {findWalkPath} from './walk-navigation.mjs?v=36';
import {makeVehicle} from './vehicles.js?v=36';
import {CARS,PAINTS} from './driving.mjs?v=36';
export function buildGarage(templates){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1115');addHomeSurroundings(scene,true);scene.fog=new THREE.Fog('#324b3a',65,150);
 const camera=new THREE.PerspectiveCamera(41,1,.1,80);
 scene.add(new THREE.HemisphereLight('#e0d9c6','#1a2630',1.1));
 const key=new THREE.DirectionalLight('#ffedd0',2.45);key.position.set(-3,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:35});key.shadow.normalBias=.025;scene.add(key);
 for(const [color,intensity,x,y,z]of [['#ffe0a2',95,-7,4,-5],['#dceaf1',85,7,5,-4],['#fff2d5',125,0,5.6,1]]){const light=new THREE.PointLight(color,intensity,20,2);light.position.set(x,y,z);scene.add(light);}
 const {room,props,mat,box,sign,floor,walls}=buildGarageRoom(scene,templates);
 let design;
 let display=null,angle=.3,auto=true,currentId=null,currentSkin=null,lastSkin=null,lastPaint=PAINTS[0];
 const ghosts=[];
 function parkGhost(id,x){const v=makeVehicle(CARS[id].model,1.65,id==='coupe'?'#a8afb0':'#686f5e');v.group.position.set(x,.035,-3.7);v.group.rotation.y=0;scene.add(v.group);v.group.userData.garageCar=id;v.group.userData.garageX=x;return v;}
 for(const [id,x]of [['coupe',-7.55],['suv',7.55]])ghosts.push(parkGhost(id,x));
 function dispose(v){const gs=new Set(),ms=new Set();v.group.traverse(o=>{if(o.isMesh){if(!o.geometry.userData.shared)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 function select(id,skin=null,paint=PAINTS[0]){if(!CARS[id])return;const k=JSON.stringify(skin)+':'+paint;if(currentId===id&&currentSkin===k)return;currentId=id;currentSkin=k;lastSkin=skin;lastPaint=paint;if(display){scene.remove(display.group);dispose(display);}display=makeVehicle(CARS[id].model,CARS[id].scale,paint,skin);display.group.position.set(0,.15,0);display.group.rotation.y=angle;scene.add(display.group);}
 function upgrade(model){ghosts.forEach((v,i)=>{if(v.standIn!==model)return;const id=v.group.userData.garageCar,x=v.group.userData.garageX;scene.remove(v.group);dispose(v);ghosts[i]=parkGhost(id,x);});if(display?.standIn===model){const id=currentId;currentId=null;select(id,lastSkin,lastPaint);}}
 const bounds={minX:-10.8,maxX:10.8,minZ:-7.7,maxZ:10.5},spawn={x:-4.9,z:7.5},colliders=[];
 room.updateMatrixWorld(true);for(const object of [...props,...ghosts.map(v=>v.group)]){object.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object);if(b.max.y<.3||b.min.y>2)continue;colliders.push({minX:b.min.x-.32,maxX:b.max.x+.32,minZ:b.min.z-.32,maxZ:b.max.z+.32});}
 function blocked(x,z){return !Number.isFinite(x)||!Number.isFinite(z)||x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||Math.hypot(x,z)<4.85||colliders.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);}
 const hotspots=[{id:'inspect',x:0,z:5.65,label:'INSPECT THIS RIDE'},{id:'upstairs',x:-9.7,z:7.2,label:'GO UPSTAIRS'},{id:'drive',x:9.6,z:7.2,label:'TEST DRIVE THIS CAR'}];
 function door(x,z,color,rotation,text){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.16,3.15,.32),mat('#4a5659'));post.position.set(side*1.05,1.57,0);g.add(post);}const panel=new THREE.Mesh(new THREE.BoxGeometry(1.95,2.9,.12),mat(color));panel.position.y=1.45;g.add(panel);const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.1,.15,.35),mat('#ebd8a1',{emissive:'#ffce78',emissiveIntensity:.8}));stripe.position.y=3.13;g.add(stripe);sign(text,2.9,.6,0,0,0);const label=room.children.at(-1);g.add(label);label.position.set(0,3.65,.08);label.rotation.y=0;g.userData.garageAction=text==='LIFT / HOME'?'upstairs':'drive';return g;}
 const doors=[door(-11.2,7.2,'#3b494e',Math.PI/2,'LIFT / HOME'),door(11.2,7.2,'#494a3b',-Math.PI/2,'CITY EXIT')];
 const avatar=new THREE.Group();avatar.position.set(spawn.x,.035,spawn.z);scene.add(avatar);let character=null,mixer=null,actions={},animation='',driverTemplate=null;
 const fpShell=new THREE.Group();fpShell.name='first-person-garage-shell';fpShell.visible=false;scene.add(fpShell);
 for(const x of [-11.8,11.8])box(.4,6.5,9.3,'#343b3d',x,3.5,7.3,{},fpShell);
 box(24,6.8,.4,'#434c4e',0,3.3,12.5,{},fpShell);const ceiling=box(24,.16,21.2,'#3c4548',0,6.78,2.1,{},fpShell);ceiling.castShadow=false;
 design=createHomeDesign({scene,room,floor,walls:[...walls,...fpShell.children],garage:true});
 let emoteUntil=0,emoteName='';const walkingView=createWalkingView(camera,avatar);
 function setFirstPerson(value){walkingView.set(value);if(inspection)setInspection(false);resize(viewport.w,viewport.h);}
 const halo=new THREE.Mesh(new THREE.RingGeometry(.36,.43,32),new THREE.MeshBasicMaterial({color:'#f0d194',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.025;avatar.add(halo);
 function play(name){if(animation===name)return;for(const action of Object.values(actions))action.fadeOut(.16);actions[name]?.reset().fadeIn(.16).play();animation=name;}
 function setCharacter(template){if(driverTemplate===template)return;driverTemplate=template;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(character);avatar.remove(character);}character=template.scene.clone(true);character.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(character),scale=1.8/(b.max.y-b.min.y);character.scale.setScalar(scale);character.position.y=-b.min.y*scale;avatar.add(character);mixer=new THREE.AnimationMixer(character);actions={};for(const name of ['idle','walk','emote-yes']){const clip=template.animations.find(c=>c.name===name);if(clip)actions[name]=mixer.clipAction(clip);}animation='';play('idle');}
 setCharacter(templates.suit);
 for(const h of hotspots){const ring=new THREE.Mesh(new THREE.RingGeometry(.43,.51,32),new THREE.MeshBasicMaterial({color:h.id==='drive'?'#e2cf9e':'#f1ce71',transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(h.x,.04,h.z);scene.add(ring);h.ring=ring;}
 let inspection=false,viewport={w:1280,h:800},route=[],routeTarget=null,arrived=null,pendingCar=null;
 const canInteract=(id)=>{const h=hotspots.find(h=>h.id===id);return !!h&&Math.hypot(h.x-avatar.position.x,h.z-avatar.position.z)<1.25;};
 const nearest=()=>hotspots.find(h=>canInteract(h.id))||null;
 function walkTo(id,point=null,carId=null){const h=id?hotspots.find(h=>h.id===id):point;if(!h)return false;const path=findWalkPath(avatar.position,h,blocked,bounds);if(!path)return false;setInspection(false);route=path;routeTarget=id;arrived=null;pendingCar=carId;return true;}
 const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
 function clickAt(x,y,w,h){if(inspection)return false;raycaster.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);const meshes=[display?.group,...ghosts.map(v=>v.group),...doors].filter(Boolean),hits=raycaster.intersectObjects(meshes,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.garageAction&&!o.userData.garageCar)o=o.parent;return walkTo(o?.userData.garageAction||'inspect',null,o?.userData.garageCar||null);}if(raycaster.ray.intersectPlane(plane,hit))return walkTo(null,hit);return false;}
 function walkCamera(smooth=1){fpShell.visible=walkingView.enabled;if(walkingView.enabled){walkingView.update();return;}avatar.visible=true;const x=avatar.position.x,z=avatar.position.z,target=new THREE.Vector3(x,.9,z),eye=new THREE.Vector3(x+6.5,9.2,z+11.8);camera.position.lerp(eye,smooth);camera.lookAt(target);camera.updateMatrixWorld();}
 function resize(w,h){viewport={w,h};camera.aspect=w/h;camera.clearViewOffset();camera.fov=inspection?41:46;if(walkingView.enabled&&!inspection){walkingView.set(true);return;}if(inspection){const portrait=w<=720;camera.position.set(portrait?8.2:8,portrait?6.2:5.5,portrait?12.5:11);camera.lookAt(0,1,0);camera.setViewOffset(w,h,portrait?0:w*.16,portrait?h*.22:0,w,h);}else{if(w<=720)camera.setViewOffset(w,h,0,h*.05,w,h);walkCamera(1);}camera.updateProjectionMatrix();}
 function setInspection(value){inspection=!!value;fpShell.visible=walkingView.enabled&&!inspection;avatar.visible=!inspection&&!walkingView.enabled;route=[];routeTarget=null;arrived=null;pendingCar=null;resize(viewport.w,viewport.h);}
 function resetSpawn(){avatar.position.set(spawn.x,.035,spawn.z);route=[];arrived=null;routeTarget=null;setInspection(false);}
 function update(dt,input={},time=0){const manual=!!(input.up||input.down||input.left||input.right);if(manual){if(inspection)setInspection(false);route=[];routeTarget=null;arrived=null;pendingCar=null;}if(!inspection){const direction=walkingView.movement(input,dt);let dx=direction.x,dz=direction.z,distance=3.5*dt;
  if(!manual&&route.length){while(route.length&&Math.hypot(route[0].x-avatar.position.x,route[0].z-avatar.position.z)<.025)route.shift();if(route.length){dx=route[0].x-avatar.position.x;dz=route[0].z-avatar.position.z;distance=Math.min(distance,Math.hypot(dx,dz));}else{arrived=routeTarget;routeTarget=null;}}
  const before=avatar.position.clone(),length=Math.hypot(dx,dz);if(length){const sx=dx/length*distance,sz=dz/length*distance;if(!blocked(avatar.position.x+sx,avatar.position.z))avatar.position.x+=sx;if(!blocked(avatar.position.x,avatar.position.z+sz))avatar.position.z+=sz;avatar.rotation.y=Math.atan2(dx,dz);}play(Date.now()<emoteUntil?(emoteName==='dance'?'walk':'emote-yes'):before.distanceTo(avatar.position)>.0001?'walk':'idle');mixer?.update(dt);walkCamera(1-Math.exp(-dt*7));
 }else if(auto)angle+=dt*.12;if(display)display.group.rotation.y=angle;for(const h of hotspots){h.ring.visible=!inspection;h.ring.material.opacity=canInteract(h.id)?.7:.28+Math.sin(time*2)*.07;}}
 return {emote(id){emoteName=id;emoteUntil=Date.now()+3200;},setDecor:design.apply,upgrade,scene,camera,props,ghosts,avatar,walkingView,setFirstPerson,look:walkingView.look,colliders,hotspots,bounds,spawn,blocked,nearest,canInteract,walkTo,clickAt,setCharacter,resetSpawn,setInspection,select,resize,update,rotate(dx){auto=false;angle+=dx*.012;if(display)display.group.rotation.y=angle},setAuto(){auto=!auto;return auto},takeSelectedCar(){const id=pendingCar;pendingCar=null;return id;},takeArrival(){const id=arrived;arrived=null;return id;},get inspection(){return inspection},get navigating(){return route.length>0},get auto(){return auto},get display(){return display},get selected(){return currentId}};
}
