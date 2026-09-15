import * as THREE from './assets/three.module.js';
import {findWalkPath} from './walk-navigation.mjs?v=19';
import {makeVehicle} from './vehicles.js?v=19';
import {CARS,PAINTS} from './driving.mjs?v=19';
export function buildGarage(templates){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#101b28');scene.fog=new THREE.Fog('#101b28',24,60);
 const camera=new THREE.PerspectiveCamera(41,1,.1,70),room=new THREE.Group();scene.add(room);
 scene.add(new THREE.HemisphereLight('#c5e5f5','#263242',2));
 const key=new THREE.DirectionalLight('#ffe3bd',3.8);key.position.set(-3,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:35});key.shadow.normalBias=.035;scene.add(key);
 const fill=new THREE.PointLight('#58d7c0',85,22,2);fill.position.set(5,4,-4);scene.add(fill);
 const mats=new Map(),props=[];
 const mat=(color,extra={})=>{const k=color+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.72,...extra}));return mats.get(k)};
 function box(w,h,d,color,x,y,z,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);return m;}
 function prop(name,x,z,width,rotation=0){const source=templates['home-'+name];if(!source)return;const root=source.scene.clone(true),group=new THREE.Group();root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=width/size.x;root.scale.setScalar(scale);root.position.set(-c.x*scale,-b.min.y*scale,-c.z*scale);group.add(root);group.position.set(x,.13,z);group.rotation.y=rotation;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});room.add(group);props.push(group);}
 function sign(text,w,h,x,y,z){const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#18343d';c.fillRect(0,0,1024,256);c.strokeStyle='#73caba';c.lineWidth=8;c.strokeRect(8,8,1008,240);c.fillStyle='#e5e8c9';c.textAlign='center';c.textBaseline='middle';c.font='bold 82px PixelArcade,monospace';c.fillText(text,512,128,920);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:'#ffffff',emissiveIntensity:.3}));mesh.position.set(x,y,z);room.add(mesh);}
 box(24,.25,23,'#283c47',0,-.13,0);box(24,6.8,.3,'#253e4b',0,3.3,-8.5);
 for(const x of [-11.8,11.8])box(.4,6.8,12,'#243b47',x,3.3,-2.6);
 for(let n=-11;n<12;n+=2){box(.035,.015,23,'#42555d',n,.006,0);box(24,.015,.035,'#42555d',0,.007,n);}
 box(24,.18,.16,'#6ad5c0',0,1.55,-8.28,{emissive:'#64d4bf',emissiveIntensity:.55});
 for(const x of [-10.8,0,10.8]){box(.32,6.8,.6,'#708088',x,3.3,-8.1);box(.37,1.5,.65,'#e5bd6d',x,.75,-8.08);for(let y=.2;y<1.4;y+=.4)box(.38,.18,.67,'#26333b',x,y,-8.07);}
 box(7,4.3,.12,'#2f4753',0,2.15,-8.2);for(let n=0;n<17;n++)box(6.8,.035,.035,'#5a737c',0,.2+n*.24,-8.1);
 sign('LAST EXIT / B1',7,1.75,0,5.55,-8.03);
 for(const x of [-5,5]){box(5,.12,.34,'#c4cfc5',x,6.15,-1);box(4.8,.045,.29,'#fff3c8',x,6.05,-1,{emissive:'#fff0b4',emissiveIntensity:2});}
 prop('desk',-8,-6.9,3.4);prop('bookcaseClosedDoors',-10.6,-6.7,1.6);prop('radio',-8.4,-6.8,.5);props.at(-1).position.y=1.68;prop('trashcan',-6.15,-7,.6);
 prop('bookcaseClosedDoors',9.7,-6.8,2.3);prop('chairDesk',7.8,-6.5,.7);prop('lampRoundFloor',6.4,-7.6,.65);
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(4.4,4.65,.22,64),mat('#3b505b',{metalness:.4,roughness:.48}));deck.position.y=.12;deck.receiveShadow=true;room.add(deck);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(4.42,.035,6,64),new THREE.MeshBasicMaterial({color:'#8cd9c0'}));rim.rotation.x=-Math.PI/2;rim.position.y=.24;room.add(rim);
 for(const side of [-1,1]){box(.13,.015,9.5,'#d9b674',side*4.9,.03,0);box(3.4,.018,.13,'#d9b674',side*3.2,.03,5);}
 let display=null,angle=.3,auto=true,currentId=null,currentSkin=null;
 const ghosts=[];
 for(const [id,x]of [['coupe',-7.2],['suv',7.2]]){const v=makeVehicle(CARS[id].model,1.25,'#536778');v.group.position.set(x,.15,-3.8);v.group.rotation.y=.4;scene.add(v.group);v.group.userData.garageCar=id;ghosts.push(v);}
 function dispose(v){const gs=new Set(),ms=new Set();v.group.traverse(o=>{if(o.isMesh){if(!o.geometry.userData.shared)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 function select(id,skin=null,paint=PAINTS[0]){if(!CARS[id])return;const k=skin?.id+':'+paint;if(currentId===id&&currentSkin===k)return;currentId=id;currentSkin=k;if(display){scene.remove(display.group);dispose(display);}display=makeVehicle(CARS[id].model,CARS[id].scale,paint,skin);display.group.position.set(0,.28,0);display.group.rotation.y=angle;scene.add(display.group);}
 const bounds={minX:-10.8,maxX:10.8,minZ:-7.7,maxZ:10.5},spawn={x:-4.9,z:7.5},colliders=[];
 room.updateMatrixWorld(true);for(const object of [...props,...ghosts.map(v=>v.group)]){object.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object);if(b.max.y<.3)continue;colliders.push({minX:b.min.x-.32,maxX:b.max.x+.32,minZ:b.min.z-.32,maxZ:b.max.z+.32});}
 function blocked(x,z){return !Number.isFinite(x)||!Number.isFinite(z)||x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||Math.hypot(x,z)<4.85||colliders.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ);}
 const hotspots=[{id:'inspect',x:0,z:5.65,label:'INSPECT THIS RIDE'},{id:'upstairs',x:-9.7,z:7.2,label:'GO UPSTAIRS'},{id:'drive',x:9.6,z:7.2,label:'DRIVE OUT'}];
 function door(x,z,color,rotation,text){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);for(const side of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.16,3.15,.32),mat('#678994'));post.position.set(side*1.05,1.57,0);g.add(post);}const panel=new THREE.Mesh(new THREE.BoxGeometry(1.95,2.9,.12),mat(color));panel.position.y=1.45;g.add(panel);const stripe=new THREE.Mesh(new THREE.BoxGeometry(2.1,.15,.35),mat('#b0ead0',{emissive:'#75d8c0',emissiveIntensity:.6}));stripe.position.y=3.13;g.add(stripe);sign(text,2.9,.6,0,0,0);const label=room.children.at(-1);g.add(label);label.position.set(0,3.65,.08);label.rotation.y=0;g.userData.garageAction=text==='LIFT / HOME'?'upstairs':'drive';return g;}
 const doors=[door(-11.2,7.2,'#31505f',Math.PI/2,'LIFT / HOME'),door(11.2,7.2,'#254d45',-Math.PI/2,'CITY EXIT')];
 const avatar=new THREE.Group();avatar.position.set(spawn.x,.035,spawn.z);scene.add(avatar);let character=null,mixer=null,actions={},animation='',driverTemplate=null;
 const halo=new THREE.Mesh(new THREE.RingGeometry(.36,.43,32),new THREE.MeshBasicMaterial({color:'#c0ffdc',transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.025;avatar.add(halo);
 function play(name){if(animation===name)return;for(const action of Object.values(actions))action.fadeOut(.16);actions[name]?.reset().fadeIn(.16).play();animation=name;}
 function setCharacter(template){if(driverTemplate===template)return;driverTemplate=template;if(mixer){mixer.stopAllAction();mixer.uncacheRoot(character);avatar.remove(character);}character=template.scene.clone(true);character.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(character),scale=1.8/(b.max.y-b.min.y);character.scale.setScalar(scale);character.position.y=-b.min.y*scale;avatar.add(character);mixer=new THREE.AnimationMixer(character);actions={};for(const name of ['idle','walk']){const clip=template.animations.find(c=>c.name===name);if(clip)actions[name]=mixer.clipAction(clip);}animation='';play('idle');}
 setCharacter(templates.suit);
 for(const h of hotspots){const ring=new THREE.Mesh(new THREE.RingGeometry(.43,.51,32),new THREE.MeshBasicMaterial({color:h.id==='drive'?'#ffdb90':'#9ce4cc',transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(h.x,.04,h.z);scene.add(ring);h.ring=ring;}
 let inspection=false,viewport={w:1280,h:800},route=[],routeTarget=null,arrived=null,pendingCar=null;
 const canInteract=(id)=>{const h=hotspots.find(h=>h.id===id);return !!h&&Math.hypot(h.x-avatar.position.x,h.z-avatar.position.z)<1.25;};
 const nearest=()=>hotspots.find(h=>canInteract(h.id))||null;
 function walkTo(id,point=null,carId=null){const h=id?hotspots.find(h=>h.id===id):point;if(!h)return false;const path=findWalkPath(avatar.position,h,blocked,bounds);if(!path)return false;setInspection(false);route=path;routeTarget=id;arrived=null;pendingCar=carId;return true;}
 const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
 function clickAt(x,y,w,h){if(inspection)return false;raycaster.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);const meshes=[display?.group,...ghosts.map(v=>v.group),...doors].filter(Boolean),hits=raycaster.intersectObjects(meshes,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.garageAction&&!o.userData.garageCar)o=o.parent;return walkTo(o?.userData.garageAction||'inspect',null,o?.userData.garageCar||null);}if(raycaster.ray.intersectPlane(plane,hit))return walkTo(null,hit);return false;}
 function walkCamera(smooth=1){const x=avatar.position.x,z=avatar.position.z,target=new THREE.Vector3(x,.9,z),eye=new THREE.Vector3(x+6.5,9.2,z+11.8);camera.position.lerp(eye,smooth);camera.lookAt(target);camera.updateMatrixWorld();}
 function resize(w,h){viewport={w,h};camera.aspect=w/h;camera.clearViewOffset();camera.fov=inspection?41:46;if(inspection){const portrait=w<=720;camera.position.set(portrait?8.2:8,portrait?6.2:5.5,portrait?12.5:11);camera.lookAt(0,1,0);camera.setViewOffset(w,h,portrait?0:w*.16,portrait?h*.22:0,w,h);}else{if(w<=720)camera.setViewOffset(w,h,0,h*.05,w,h);walkCamera(1);}camera.updateProjectionMatrix();}
 function setInspection(value){inspection=!!value;avatar.visible=!inspection;route=[];routeTarget=null;arrived=null;pendingCar=null;resize(viewport.w,viewport.h);}
 function resetSpawn(){avatar.position.set(spawn.x,.035,spawn.z);route=[];arrived=null;routeTarget=null;setInspection(false);}
 function update(dt,input={},time=0){const manual=!!(input.up||input.down||input.left||input.right);if(manual){if(inspection)setInspection(false);route=[];routeTarget=null;arrived=null;pendingCar=null;}if(!inspection){let dx=(input.right?1:0)-(input.left?1:0),dz=(input.down?1:0)-(input.up?1:0),distance=3.5*dt;
  if(!manual&&route.length){while(route.length&&Math.hypot(route[0].x-avatar.position.x,route[0].z-avatar.position.z)<.025)route.shift();if(route.length){dx=route[0].x-avatar.position.x;dz=route[0].z-avatar.position.z;distance=Math.min(distance,Math.hypot(dx,dz));}else{arrived=routeTarget;routeTarget=null;}}
  const before=avatar.position.clone(),length=Math.hypot(dx,dz);if(length){const sx=dx/length*distance,sz=dz/length*distance;if(!blocked(avatar.position.x+sx,avatar.position.z))avatar.position.x+=sx;if(!blocked(avatar.position.x,avatar.position.z+sz))avatar.position.z+=sz;avatar.rotation.y=Math.atan2(dx,dz);}play(before.distanceTo(avatar.position)>.0001?'walk':'idle');mixer?.update(dt);walkCamera(1-Math.exp(-dt*7));
 }else if(auto)angle+=dt*.12;if(display)display.group.rotation.y=angle;for(const h of hotspots){h.ring.visible=!inspection;h.ring.material.opacity=canInteract(h.id)?.7:.28+Math.sin(time*2)*.07;}}
 return {scene,camera,props,ghosts,avatar,colliders,hotspots,bounds,spawn,blocked,nearest,canInteract,walkTo,clickAt,setCharacter,resetSpawn,setInspection,select,resize,update,rotate(dx){auto=false;angle+=dx*.012;if(display)display.group.rotation.y=angle},setAuto(){auto=!auto;return auto},takeSelectedCar(){const id=pendingCar;pendingCar=null;return id;},takeArrival(){const id=arrived;arrived=null;return id;},get inspection(){return inspection},get navigating(){return route.length>0},get auto(){return auto},get display(){return display},get selected(){return currentId}};
}
