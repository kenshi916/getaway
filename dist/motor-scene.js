import * as THREE from './assets/three.module.js';
import {createNeighbor} from './neighborhood-scenes.js?v=38';
import {createWalkingView} from './first-person.js?v=38';
import {findWalkPath} from './walk-navigation.mjs?v=38';
import {makeVehicle,DETAILED_STAND_INS} from './vehicles.js?v=38';
import {CARS} from './driving.mjs?v=38';
import {MOTOR_BAYS,MOTOR_SPOTS,MOTOR_SEATS} from './motor-catalog.mjs?v=38';

export function buildMotorClub(templates,appearance='jules'){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.08,160);scene.background=new THREE.Color('#223d46');scene.fog=new THREE.Fog('#223d46',55,100);
 const room=new THREE.Group();scene.add(room);const solids=[],materials=new Map(),cars=new Map(),labels=[];
 function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.76}));return materials.get(color);}
 function box(w,h,d,color,x,y,z,solid=false){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);if(solid)solids.push({x,z,w:w+.6,d:d+.6});return m;}
 function text(value,w,h,x,y,z,ink='#ffdc8f',bg='#284b60'){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(96,Math.round(1024*h/w));const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,canvas.height);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='700 '+Math.min(canvas.height*.66,1800/Math.max(1,value.length))+'px PixelArcade,monospace';c.fillText(value,512,canvas.height/2,984);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));m.position.set(x,y,z);room.add(m);return m;
 }
 function prop(id,x,z,w,rotation=0,y=.2){const source=templates['home-'+id];if(!source)return;const root=source.scene.clone(true),bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=w/Math.max(size.x,size.z);root.scale.setScalar(scale);root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);const g=new THREE.Group();g.add(root);g.position.set(x,y,z);g.rotation.y=rotation;room.add(g);return g;}
 scene.add(new THREE.HemisphereLight('#e8f7ee','#385849',2.1));const sun=new THREE.DirectionalLight('#ffe2af',3);sun.position.set(-12,23,17);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:70});sun.shadow.normalBias=.03;scene.add(sun);
 // Landscaped apron surrounds the cutaway instead of an empty grey void.
 box(90,.3,90,'#355d3c',0,-.3,0);box(37,.22,32,'#788d7a',0,-.07,0);box(30,.18,26,'#3b5056',0,.13,0);
 for(let x=-14;x<=14;x+=2)for(let z=-12;z<=12;z+=2)box(1.97,.035,1.97,(x+z)%4?'#536970':'#4c6066',x,.24,z);
 box(30,5.8,.35,'#25495e',0,3.1,-13,true);for(const x of [-15,15])box(.35,5.8,26,'#25495e',x,3.1,0,true);
 for(const y of [1.1,4.9]){box(30,.16,.15,'#eeb65e',0,y,-12.77);for(const x of [-14.77,14.77])box(.15,.16,26,'#eeb65e',x,y,0);}
 for(const x of [-14,-7,0,7,14]){box(.28,5.3,.4,'#acb3a1',x,2.9,-12.7);box(.45,.15,.6,'#f3d797',x,5.4,-12.4);}
 const ceiling=box(30,.15,26,'#334a51',0,6.1,0);ceiling.visible=false;
 for(const x of [-10.5,-3.5,3.5,10.5])for(const z of [-5,4]){box(2.8,.12,.55,'#e4e8ce',x,5.7,z);const l=new THREE.PointLight('#e6f2dc',16,10,2);l.position.set(x,5.4,z);scene.add(l);}
 text('RAE’S MOTOR CLUB',16,1.5,0,5,-12.55);text('TUNE UP. TEAM UP. HEAD OUT.',12,.48,0,3.96,-12.52,'#e2e9d3');
 for(const [i,b]of MOTOR_BAYS.entries()){
  box(5.7,.04,6.5,'#263d47',b.x,.28,b.z);
  for(const dx of [-2.86,2.86])box(.12,.03,6.5,'#dcaf61',b.x+dx,.31,b.z);
  box(5.8,.03,.12,'#dcaf61',b.x,.31,b.z-3.25);
  const number=text(String(i+1).padStart(2,'0'),1,.6,b.x-2,.33,b.z+2.7,'#e7c578','#263d47');number.rotation.x=-Math.PI/2;
  labels.push(text('OPEN BAY',4.3,.55,b.x,.35,b.z-2.8));labels[i].rotation.x=-Math.PI/2;
  solids.push({x:b.x,z:b.z,w:3.3,d:5.3});
 }
 // Workbench, parts wall and the crew board are real walking destinations.
 box(7,1,1.5,'#305971',0,.8,-11.8,true);box(7.2,.15,1.7,'#c9c8ae',0,1.38,-11.8);
 for(let n=0;n<8;n++){box(.07,.7,.1,'#bfcbbd',-2.7+n*.75,2.7,-12.5);box(.26,.12,.1,'#e6b665',-2.7+n*.75,3.04,-12.5);}
 text('PARTS & PAINT',5.4,.55,0,1.08,-10.97);prop('radio',2,-11.6,.8,0,1.48);
 box(6.3,3,.2,'#d9ad62',10.4,2.8,-12.55);text('CREW JOBS',5.8,.65,10.4,3.7,-12.4,'#233e4b','#d9ad62');
 for(const x of [8.8,10.5,12.2]){box(1.25,1.45,.06,'#e8e2c8',x,2.5,-12.35);for(let n=0;n<3;n++)box(.95,.07,.04,'#789385',x,2.8-n*.3,-12.3);}
 const rae=createNeighbor(templates,'rae');rae.group.position.set(-7,.28,-10.4);scene.add(rae.group);text('RAE / WORKSHOP',4,.5,-7,2.65,-12.5);
 // Two usable seats and a coffee counter face the shared car floor.
 box(5,.2,1.3,'#b76c48',-10,.73,10.25);box(5,1,.24,'#b76c48',-10,1.25,10.8);for(const x of [-12,-8])box(.18,.6,1.3,'#233e4b',x,.43,10.25);
 box(2.8,1.05,1.2,'#335d67',-13,.8,7.8,true);prop('kitchenCoffeeMachine',-13,7.8,1,0,1.34);prop('pottedPlant',-13.5,11.5,1.5);text('THE PIT STOP',4,.7,-10,2.3,11.1);
 box(5,.06,3,'#b19b69',10,.3,10);prop('loungeDesignSofaCorner',11,10.5,3.5);prop('pottedPlant',13.5,8.6,1.4);solids.push({x:11,z:10.5,w:4,d:2});
 for(const x of [-16.5,16.5])for(const z of [-10,0,10]){box(2.4,.6,2.4,'#859576',x,.25,z);prop('pottedPlant',x,z,2.5,0,.58);}
 const welcome=text('CITY EXIT',4.4,.8,0,.33,11.4,'#fce2a6','#335560');welcome.rotation.x=-Math.PI/2;
 const person=createNeighbor(templates,appearance),avatar=person.group;avatar.position.set(0,.28,10.4);scene.add(avatar);const walkingView=createWalkingView(camera,avatar),bounds={minX:-14.3,maxX:14.3,minZ:-12.2,maxZ:12.2};
 let route=[],seated=null,members=[];
 const blocked=(x,z)=>x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||solids.some(s=>Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2);
 function walkTo(id){seated=null;person.sit(false);const p=MOTOR_SPOTS.find(s=>s.id===id);if(p)route=findWalkPath(avatar.position,p,blocked,bounds)||[];}
 const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.28),hit=new THREE.Vector3();
 function clickAt(x,y,w,h){seated=null;person.sit(false);ray.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);if(ray.ray.intersectPlane(floor,hit))route=findWalkPath(avatar.position,hit,blocked,bounds)||[];}
 function nearest(){return MOTOR_SPOTS.filter(s=>!s.id.startsWith('bay-')||members[Number(s.id.slice(4))]).map(s=>({...s,d:Math.hypot(s.x-avatar.position.x,s.z-avatar.position.z)})).filter(s=>s.d<2).sort((a,b)=>a.d-b.d)[0];}
 function disposeCar(v){v.group.removeFromParent();const mats=new Set();v.group.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);if(!o.geometry.userData.shared)o.geometry.dispose();}});mats.forEach(m=>m.dispose());}
 function syncCars(list){members=[...list].sort((a,b)=>a.id.localeCompare(b.id)).slice(0,8);for(let i=0;i<8;i++){
  const p=members[i],old=cars.get(i),key=p?JSON.stringify([p.id,p.name,p.carId,p.carStyle]):'';if(!p&&!old||old?.key===key)continue;if(old){disposeCar(old.view);cars.delete(i);}const b=MOTOR_BAYS[i];labels[i].material.map.dispose();labels[i].material.dispose();labels[i].geometry.dispose();labels[i].removeFromParent();labels[i]=text(p?p.name.toUpperCase():'OPEN BAY',4.3,.55,b.x,.35,b.z-2.8);labels[i].rotation.x=-Math.PI/2;
  if(p){const cfg=CARS[p.carId]||CARS.van,style=p.carStyle||{},v=makeVehicle(DETAILED_STAND_INS[cfg.model]||cfg.model,cfg.scale,'#efba56',{...style,customPaint:style.paint,underglowColor:style.underglow});v.group.position.set(b.x,.34,b.z);v.group.rotation.y=Math.PI;v.group.name='Motor bay / '+p.id;scene.add(v.group);cars.set(i,{key,view:v});}
 }}
 function sit(id){seated=MOTOR_SEATS.find(s=>s.id===id)||null;route=[];person.sit(!!seated);if(seated){avatar.position.set(seated.x,.28,seated.z);avatar.rotation.y=seated.heading;}}
 function update(dt,input){const old=avatar.position.clone();let d=walkingView.movement(input,dt);if(d.x||d.z){route=[];sit(null);}if(route.length){const p=route[0],dx=p.x-avatar.position.x,dz=p.z-avatar.position.z,len=Math.hypot(dx,dz);if(len<.18)route.shift();else d={x:dx/len,z:dz/len};}const len=Math.hypot(d.x,d.z);if(len){const speed=3.8*dt,x=avatar.position.x+d.x/len*speed,z=avatar.position.z+d.z/len*speed;if(!blocked(x,avatar.position.z))avatar.position.x=x;if(!blocked(avatar.position.x,z))avatar.position.z=z;avatar.rotation.y=Math.atan2(d.x,d.z);}person.update(dt,old.distanceToSquared(avatar.position)>.00001);rae.update(dt);ceiling.visible=walkingView.enabled;if(walkingView.enabled)walkingView.update();else{camera.fov=49;const offset=camera.aspect<.8?34:24;camera.position.lerp(new THREE.Vector3(avatar.position.x*.3,offset,avatar.position.z*.25+offset),1-Math.exp(-dt*5));camera.lookAt(avatar.position.x*.35,0,avatar.position.z*.35-1);camera.updateProjectionMatrix();}}
 update(1,{});return {scene,camera,avatar,walkingView,look:walkingView.look,setFirstPerson:walkingView.set,resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();},update,clickAt,nearest,walkTo,syncCars,sit,get seated(){return seated?.id;},inspect:id=>members[Number(id.slice(4))],emote:id=>person.emote(id)};
}
