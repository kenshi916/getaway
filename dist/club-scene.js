import * as THREE from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {createNeighbor} from './neighborhood-scenes.js?v=38';
import {createWalkingView} from './first-person.js?v=38';
import {findWalkPath} from './walk-navigation.mjs?v=38';
import {CLUB,TABLES} from './club-catalog.mjs?v=38';
export function buildClub(templates,appearance='jules'){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.08,180);
 scene.background=new THREE.Color('#122924');scene.fog=new THREE.Fog('#122924',70,145);
 const room=new THREE.Group();room.name='Last Hand / Grand Casino';scene.add(room);
 const solids=[],materials=new Map(),geometries=[],textures=[],rigs=[],chandeliers=[],reels=[];
 const gold='#c49a51',cream='#efe2bb',green='#124c3b',wine='#632438',dark='#132b29';
 const mat=(color,glow=false)=>{const key=color+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:glow?.28:.68,metalness:color===gold?.45:0,...(glow?{emissive:color,emissiveIntensity:.65}: {})}));return materials.get(key);};
 function mesh(g,color,x,y,z,parent=room,glow=false){geometries.push(g);const m=new THREE.Mesh(g,mat(color,glow));m.position.set(x,y,z);m.castShadow=!glow;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,color,x,y,z,solid=false,parent=room,glow=false){const m=mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent,glow);if(solid)solids.push({x,z,w:w+.65,d:d+.65});return m;}
 function cylinder(r,h,color,x,y,z,segments=16){return mesh(new THREE.CylinderGeometry(r,r,h,segments),color,x,y,z);}
 function text(value,w,h,x,y,z,ink=cream,bg=dark,parent=room){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(96,Math.round(1024*h/w));const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=gold;ctx.lineWidth=5;ctx.strokeRect(8,8,c.width-16,c.height-16);ctx.fillStyle=ink;ctx.font='700 '+Math.min(c.height*.58,1700/Math.max(1,value.length))+'px PixelArcade,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,512,c.height/2,970);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.set(value+materials.size,material);const g=new THREE.PlaneGeometry(w,h);geometries.push(g);const m=new THREE.Mesh(g,material);m.position.set(x,y,z);parent.add(m);return m;
 }
 function prop(id,x,z,w,rot=0,y=.23){const template=templates['home-'+id];if(!template)return;const root=template.scene.clone(true),bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=w/Math.max(size.x,size.z);root.scale.setScalar(scale);root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);const group=new THREE.Group();group.add(root);group.position.set(x,y,z);group.rotation.y=rot;room.add(group);return group;}
 function personAt(look,x,z,heading=0){const r=createNeighbor(templates,look);r.group.position.set(x,.23,z);r.group.rotation.y=heading;scene.add(r.group);rigs.push(r);return r;}
 function planter(x,z){box(1.5,.8,1.5,dark,x,.6,z,true);box(1.57,.12,1.57,gold,x,1.04,z);prop('pottedPlant',x,z,1.6,0,1.08);}
 function lamp(x,z){cylinder(.38,.12,gold,x,.29,z);cylinder(.055,2.8,gold,x,1.65,z,8);box(.85,.55,.85,cream,x,3.05,z,false,room,true);}
 scene.add(new THREE.HemisphereLight('#f3dfb1','#233a31',1.35));
 const sun=new THREE.DirectionalLight('#ffe0ac',2.4);sun.position.set(-18,30,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-33,right:33,top:30,bottom:-30,near:1,far:90});sun.shadow.normalBias=.035;scene.add(sun);
 // Six times the former floor area, with a complete carpeted hall and marble lobby.
 box(130,.3,120,'#284a34',0,-.35,0);box(64,.22,54,'#81816a',0,-.08,0);box(54,.2,44,dark,0,.09,0);box(52,.035,42,green,0,.21,0);
 for(let x=-24;x<=24;x+=2)for(let z=-19;z<=19;z+=2){const d=box(.17,.012,.17,'#4c7760',x,.235,z);d.rotation.y=Math.PI/4;}
 for(const x of [-20.5,-7,7,20.5])box(.11,.02,35,gold,x,.25,-2);for(const z of [-14,0,13])box(41,.02,.11,gold,0,.25,z);
 for(let x=-25;x<=25;x+=2)for(let z=16;z<=20;z+=2)box(1.97,.03,1.97,(x+z)%4?'#ccc4a9':'#e4dcc4',x,.24,z);
 box(7,.04,43,wine,0,.27,0);for(const x of [-3.44,3.44])box(.13,.02,43,gold,x,.295,0);
 for(const z of [-16,0,15]){const d=box(2,.02,2,gold,0,.3,z);d.rotation.y=Math.PI/4;const c=box(1.64,.02,1.64,wine,0,.32,z);c.rotation.y=Math.PI/4;}
 const crest=text('LH',3,3,0,.34,16.9,gold,wine);crest.rotation.x=-Math.PI/2;
 // Tall panelled walls and deep illuminated Art Deco arches.
 box(54,8.2,.4,dark,0,4.3,-22,true);for(const x of [-27,27])box(.4,8.2,44,dark,x,4.3,0,true);
 const frontWall=new THREE.Group();room.add(frontWall);box(23,8,.35,dark,-15.5,4.2,22,false,frontWall);box(23,8,.35,dark,15.5,4.2,22,false,frontWall);box(8,3.4,.35,dark,0,6.5,22,false,frontWall);
 for(const y of [1.15,6.9,8.15]){box(54,.15,.18,gold,0,y,-21.72);for(const x of [-26.72,26.72])box(.18,.15,44,gold,x,y,0);}
 for(const x of [-24,-18,-12,-6,0,6,12,18,24]){box(.4,7.6,.5,gold,x,4.35,-21.6);box(5.1,4.9,.15,'#215241',x,4.25,-21.75);const diamond=box(.7,.7,.2,gold,x,6.3,-21.5);diamond.rotation.z=Math.PI/4;}
 for(const side of [-1,1])for(const z of [-18,-10,-2,6,14]){box(.22,6,5.5,'#235346',side*26.7,4,z);box(.3,5.7,.16,gold,side*26.5,4,z-2.7);box(.3,5.7,.16,gold,side*26.5,4,z+2.7);box(.35,.18,5.5,gold,side*26.5,6.9,z);box(.45,1.4,.36,cream,side*26.25,4.8,z,false,room,true);}
 text('LAST HAND',16,2,0,6.55,-21.36);text('THE GRAND ROOM',9,.6,0,5.02,-21.32,gold);
 for(const x of [-20,20])text(x<0?'THE LATE CUP':'VELVET LOUNGE',10,1.1,x,4.6,-21.3,gold);
 const ceiling=box(54,.2,44,'#173b31',0,8.55,0);ceiling.visible=false;
 for(const x of [-14,0,14])for(const z of [-7,6]){const g=new THREE.Group();g.position.set(x,0,z);room.add(g);chandeliers.push(g);box(.07,1.1,.07,gold,0,7.7,0,false,g);for(const [r,y]of [[2.4,7.15],[1.6,6.65],[.85,6.18]]){const ring=mesh(new THREE.TorusGeometry(r,.075,6,24),gold,0,y,0,g);ring.rotation.x=Math.PI/2;for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.14,.55,.14,cream,Math.cos(a)*r,y-.3,Math.sin(a)*r,false,g,true);}}}
 for(const x of [-14,14]){const l=new THREE.PointLight('#ffd68a',80,31,2);l.position.set(x,6.1,0);scene.add(l);}
 for(const t of TABLES){
  box(7,.3,4.6,'#392725',t.x,1.02,t.z,true);box(6.65,.09,4.24,gold,t.x,1.21,t.z);box(6.35,.04,3.94,'#17705a',t.x,1.29,t.z);
  for(const dx of [-2.7,2.7])box(.4,.85,2.9,dark,t.x+dx,.64,t.z);
  const l=text(t.suit+' '+t.name.toUpperCase(),4,.55,t.x,1.32,t.z-.7,cream,'#17705a');l.rotation.x=-Math.PI/2;const rule=text('BLACKJACK / FREE PLAY',3.9,.38,t.x,1.325,t.z+.35,gold,'#17705a');rule.rotation.x=-Math.PI/2;
  for(const dx of [-2.1,-.7,.7,2.1]){prop('chairModernCushion',t.x+dx,t.z+3,.95,Math.PI);for(let n=0;n<4;n++)cylinder(.13,.045,n%2?'#bd6b5c':cream,t.x+dx,1.36+n*.05,t.z+.9,12);const card=box(.33,.018,.5,cream,t.x+dx+.28,1.34,t.z+.65);card.rotation.y=.16;}
  personAt(t.id%2?'rae':'theo',t.x,t.z-2.8);text(String(t.id).padStart(2,'0'),.8,.6,t.x+3.4,2.1,t.z+.15,gold);
 }
 // Arcade displays animate as decor; the six blackjack tables are playable.
 for(const side of [-1,1])for(let i=0;i<5;i++){const g=new THREE.Group();g.position.set(side*24.9,0,-12+i*4.8);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;room.add(g);box(1.55,1.1,1.25,'#281b2b',0,.78,0,false,g);box(1.65,1.5,.72,wine,0,2.08,-.2,false,g);box(1.48,.12,.84,gold,0,2.88,-.18,false,g);box(1.48,.12,.84,gold,0,1.29,-.18,false,g);text(['LUCKY SEVEN','DIAMOND CLUB','NIGHT LIGHTS'][i%3],1.45,.35,0,2.6,.19,cream,wine,g);for(let n=0;n<3;n++)text(['7','◆','★'][(n+i)%3],.4,.52,(n-1)*.45,2.07,.2,wine,cream,g);box(1.25,.12,.75,gold,0,1.33,.23,false,g);box(.25,.06,.25,'#e8b664',.43,1.43,.33,false,g,true);box(.35,.08,.15,'#182520',-.32,1.41,.38,false,g);reels.push(box(.18,.18,.1,'#efc964',0,3.12,-.12,false,g,true));solids.push({x:side*24.9,z:-12+i*4.8,w:1.8,d:1.95});}
 // Reception islands and velvet ropes leave a clear central entrance.
 for(const x of [-9,9]){box(6.7,1.1,1.75,dark,x,.79,18,true);box(6.9,.14,1.95,gold,x,1.42,18);for(const dx of [-2,0,2])box(.1,.8,.09,gold,x+dx,.85,18.91);text(x<0?'WELCOME':'CLOAKROOM',5,.6,x,2.8,20.9,gold);prop('laptop',x,18,.85,Math.PI,1.51);}
 personAt('mina',-9,19.6,Math.PI);planter(-17,18);planter(17,18);
 for(const side of [-1,1]){for(const z of [14.4,17.2,20]){cylinder(.14,.12,gold,side*4.25,.3,z);cylinder(.065,1.25,gold,side*4.25,.95,z);cylinder(.16,.16,gold,side*4.25,1.65,z);}box(.1,.12,5.6,wine,side*4.25,1.4,17.2);}
 box(11,1.2,2.1,wine,0,.85,-17.4,true);box(11.3,.18,2.4,gold,0,1.52,-17.4);prop('kitchenCoffeeMachine',-3.4,-17.5,1.3,0,1.63);
 for(const x of [-4,-2,0,2,4])for(const y of [2.6,3.65]){box(1.8,.1,.65,gold,x,y,-21.05);for(const dx of [-.55,0,.55]){box(.18,.46,.18,['#638d75','#aa694d','#d4b16a'][Math.round((dx+.55)/.55)],x+dx,y+.28,-20.9);box(.09,.15,.09,gold,x+dx,y+.58,-20.9);}}
 for(const x of [-4,0,4]){cylinder(.42,.16,wine,x,.95,-15.3);cylinder(.07,.68,gold,x,.56,-15.3);}personAt('theo',3,-19.2);
 for(const x of [-19,19]){box(11,.035,7,'#3b2833',x,.26,-17.3);for(const z of [-20.6,-14])box(11,.02,.1,gold,x,.29,z);prop('loungeDesignSofaCorner',x,-18.3,5.5);solids.push({x,z:-18.3,w:6,d:3});prop('tableCoffeeGlass',x,-15.7,2);solids.push({x,z:-15.7,w:2.3,d:1.7});prop('loungeChairRelax',x+(x<0?4:-4),-15.7,1.5,x<0?-.6:.6);lamp(x+(x<0?-4:4),-19.5);planter(x+(x<0?4:-4),-20.5);}
 for(const side of [-1,1])for(const z of [-23,23]){planter(side*29,z);prop('pottedPlant',side*24,z,2);}
 text('CITY / EXIT',5,.8,0,3.1,21.5,gold,wine);text('BLACKJACK',7,.65,-14,3.5,-3.9,gold);text('BLACKJACK',7,.65,14,3.5,-3.9,gold);
 const person=createNeighbor(templates,appearance),avatar=person.group;avatar.position.set(CLUB.spawn.x,.23,CLUB.spawn.z);scene.add(avatar);
 const walkingView=createWalkingView(camera,avatar),bounds=CLUB.bounds;
 const blocked=(x,z)=>x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||solids.some(s=>Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2);
 const spots=[...TABLES.map(t=>({id:t.id,x:t.x,z:t.z+3,label:'PLAY '+t.name.toUpperCase()})),{id:'lounge',x:19,z:-12.5,label:'LOUNGE & CHAT'},{id:'bar',x:0,z:-14,label:'MEET AT THE BAR'},{id:'exit',x:0,z:20.5,label:'RETURN TO THE CITY'}];
 let route=[],time=0;const target=new THREE.Vector3(),cameraTarget=new THREE.Vector3();
 function walkTo(id){const p=spots.find(s=>s.id===id);if(p)route=findWalkPath(avatar.position,p,blocked,bounds)||[];}
 const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.23),point=new THREE.Vector3();
 function clickAt(x,y,w,h){ray.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);if(ray.ray.intersectPlane(floor,point))route=findWalkPath(avatar.position,point,blocked,bounds)||[];}
 function nearest(){return spots.filter(p=>Math.hypot(avatar.position.x-p.x,avatar.position.z-p.z)<2.4).sort((a,b)=>Math.hypot(avatar.position.x-a.x,avatar.position.z-a.z)-Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z))[0];}
 function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
 function update(dt,input){time+=dt;const old=avatar.position.clone();let d=walkingView.movement(input,dt);if(d.x||d.z)route=[];if(route.length){const p=route[0],dx=p.x-avatar.position.x,dz=p.z-avatar.position.z,len=Math.hypot(dx,dz);if(len<.18)route.shift();else d={x:dx/len,z:dz/len};}const len=Math.hypot(d.x,d.z);if(len){const speed=5.4*dt,x=avatar.position.x+d.x/len*speed,z=avatar.position.z+d.z/len*speed;if(!blocked(x,avatar.position.z))avatar.position.x=x;if(!blocked(avatar.position.x,z))avatar.position.z=z;avatar.rotation.y=Math.atan2(d.x,d.z);}person.update(dt,old.distanceToSquared(avatar.position)>.00001);rigs.forEach(r=>r.update(dt));ceiling.visible=frontWall.visible=walkingView.enabled;chandeliers.forEach(g=>{g.visible=walkingView.enabled||Math.hypot(g.position.x-avatar.position.x,g.position.z-avatar.position.z)>5;});reels.forEach((m,i)=>m.scale.setScalar(.9+Math.sin(time*2+i)*.1));if(walkingView.enabled)walkingView.update();else{camera.fov=49;const offset=camera.aspect<.8?27:23;cameraTarget.set(avatar.position.x*.72,0,avatar.position.z*.75-3);target.set(cameraTarget.x,offset,cameraTarget.z+offset);camera.position.lerp(target,1-Math.exp(-dt*6));camera.lookAt(cameraTarget);camera.updateProjectionMatrix();}}
 // Merge the static shell and carpet by material, keeping moving props separate.
 room.updateMatrixWorld(true);const batches=new Map();
 for(const o of [...room.children])if(o.isMesh&&o.visible&&o!==ceiling&&!o.material.map){const list=batches.get(o.material)||[];list.push(o);batches.set(o.material,list);}
 for(const [material,list]of batches){if(list.length<2)continue;const pieces=list.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);return g;});const g=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(g){geometries.push(g);const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;room.add(m);list.forEach(o=>o.removeFromParent());}}
 update(1,{});
 return {scene,camera,avatar,walkingView,spots,bounds,blocked,look:walkingView.look,setFirstPerson:walkingView.set,resize,update,clickAt,nearest,walkTo,emote:id=>person.emote(id),dispose(){person.dispose();rigs.forEach(r=>r.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.dispose();scene.clear();}};
}
