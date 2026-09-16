import * as THREE from './assets/three.module.js';
import {createNeighbor} from './neighborhood-scenes.js?v=35';
import {createWalkingView} from './first-person.js?v=35';
import {findWalkPath} from './walk-navigation.mjs?v=35';
import {TABLES} from './club-catalog.mjs?v=35';
export function buildClub(templates,appearance='jules'){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,120);scene.background=new THREE.Color('#102b25');scene.fog=new THREE.Fog('#102b25',38,75);
 const solids=[],materials=new Map(),geometries=[],textures=[],rigs=[];const room=new THREE.Group();scene.add(room);
 const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.72}));return materials.get(color);};
 function box(w,h,d,color,x,y,z,solid=false){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const m=new THREE.Mesh(g,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);if(solid)solids.push({x,z,w:w+.6,d:d+.6});return m;}
 function text(value,w,h,x,y,z,color='#efd192',bg='#183d33'){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(96,Math.round(1024*h/w));const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,1024,c.height);ctx.fillStyle=color;ctx.font='700 '+Math.min(c.height*.65,1600/value.length)+'px PixelArcade,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,512,c.height/2,980);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.set(value+materials.size,material);const g=new THREE.PlaneGeometry(w,h);geometries.push(g);const m=new THREE.Mesh(g,material);m.position.set(x,y,z);room.add(m);return m;}
 function prop(id,x,z,w,rot=0,y=.13){const template=templates['home-'+id];if(!template)return;const root=template.scene.clone(true),bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=w/Math.max(size.x,size.z);root.scale.setScalar(scale);root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);const group=new THREE.Group();group.add(root);group.position.set(x,y,z);group.rotation.y=rot;room.add(group);return group;}
 scene.add(new THREE.HemisphereLight('#eedbc1','#264d42',2));const sun=new THREE.DirectionalLight('#ffddb0',2.8);sun.position.set(-8,16,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:50});scene.add(sun);
 // The interior extends into a planted courtyard, so the cutaway has a finished edge.
 box(70,.3,70,'#244e34',0,-.28,0);box(26,.18,24,'#a18b64',0,-.03,0);box(22,.1,18,'#392631',0,.05,0);
 for(let x=-10;x<=10;x+=2)for(let z=-8;z<=8;z+=2){box(1.96,.025,1.96,(x+z)%4?'#533344':'#62414a',x,.115,z);box(.1,.03,.1,'#d6b777',x,.13,z);}
 box(22,4.5,.3,'#214c3d',0,2.3,-9,true);for(const x of [-11,11])box(.3,4.5,18,'#214c3d',x,2.3,0,true);
 for(const x of [-10,-7,-3,3,7,10]){box(.13,4.4,.16,'#c6a46a',x,2.3,-8.8);box(.24,.18,.24,'#e4c18a',x,4.3,-8.7);}
 box(22,.12,.2,'#d7b372',0,1.15,-8.76);box(22,.12,.2,'#d7b372',0,4.4,-8.76);
 text('LAST HAND',8.5,1.3,0,3.15,-8.7);text('CARDS • COFFEE • GOOD COMPANY',7,.4,0,2.2,-8.68);
 for(const side of [-1,1]){for(const z of [-5,2,6]){box(.08,2.8,2.4,'#0c282c',side*10.78,2.55,z);box(.12,.1,2.4,'#d4b975',side*10.7,2.55,z);}for(const z of [-10,10]){prop('pottedPlant',side*10,z,1.3);box(2,.4,2,'#696b49',side*10,.3,z);}}
 // Two four-seat tables, with raised rails and inlaid playing surfaces.
 for(const t of TABLES){box(5.6,.26,3.4,'#342923',t.x,1.05,t.z,true);box(5.2,.05,3,'#277356',t.x,1.21,t.z);box(4.9,.012,2.7,'#368866',t.x,1.244,t.z);for(const dx of [-2,2])box(.3,.9,2.2,'#b6955c',t.x+dx,.53,t.z);const l=text(t.name.toUpperCase(),2.8,.45,t.x,1.26,t.z+.15,'#f3dd9d','#368866');l.rotation.x=-Math.PI/2;
  for(const [dx,dz,rot]of [[-1.6,2.4,Math.PI],[1.6,2.4,Math.PI],[-3.3,0,-Math.PI/2],[3.3,0,Math.PI/2]])prop('chairModernCushion',t.x+dx,t.z+dz,.85,rot);
  for(const dx of [-1.6,0,1.6])for(let n=0;n<3;n++){const g=new THREE.CylinderGeometry(.12,.12,.05,8);geometries.push(g);const m=new THREE.Mesh(g,mat(dx===0?'#efd296':'#af485c'));m.position.set(t.x+dx,1.3+n*.05,t.z-.6);room.add(m);}
  const dealer=createNeighbor(templates,t.id===1?'rae':'theo');dealer.group.position.set(t.x,.15,t.z-2.5);scene.add(dealer.group);rigs.push(dealer);
 }
 // Espresso bar and a seating corner leave the center aisle open.
 box(5.8,1.1,1.5,'#9b6948',-6.8,.65,-6.7,true);box(6,.15,1.7,'#dbc28f',-6.8,1.27,-6.7);prop('kitchenCoffeeMachine',-7.8,-6.7,.9,0,1.36);prop('radio',-5.4,-6.7,.7,0,1.36);text('THE LATE CUP',4,.6,-6.8,2.4,-8.7);
 prop('loungeDesignSofaCorner',7,-6.6,4.2);solids.push({x:7,z:-6.6,w:4.7,d:2.5});prop('tableCoffeeGlass',7,-4.6,1.5);prop('lampRoundFloor',9.8,-7.5,.85);prop('pottedPlant',-9.6,-4.1,1.1);
 const rug=box(7,.035,3,'#c5a673',0,.15,5.7);for(let x=-3;x<=3;x+=.5)box(.12,.015,2.8,'#533344',x,.18,5.7);
 const welcome=text('WELCOME / FREE PLAY',4,.45,0,.2,5.5);welcome.rotation.x=-Math.PI/2;
 for(const x of [-7,7]){prop('loungeChairRelax',x-1,5.5,1.45,-.5);prop('loungeChairRelax',x+1,5.5,1.45,.5);prop('tableRound',x,3.5,1.25);solids.push({x:x-1,z:5.5,w:1.6,d:1.6},{x:x+1,z:5.5,w:1.6,d:1.6},{x,z:3.5,w:1.45,d:1.45});prop('pottedPlant',x,7.5,1.1);}
 const ceiling=box(22,.1,18,'#214438',0,4.6,0);ceiling.visible=false;
 for(const x of [-4,4]){box(1.9,.1,1.9,'#b59154',x,4.35,-2);const light=new THREE.PointLight('#ffd397',30,9,2);light.position.set(x,3.8,-2);scene.add(light);}
 const person=createNeighbor(templates,appearance),avatar=person.group;avatar.position.set(0,.16,6);scene.add(avatar);const walkingView=createWalkingView(camera,avatar);const bounds={minX:-10.4,maxX:10.4,minZ:-8.3,maxZ:8.3};
 const blocked=(x,z)=>x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||solids.some(s=>Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2);let route=[];
 const spots=[...TABLES.map(t=>({id:t.id,x:t.x,z:t.z+2.3,label:'PLAY '+t.name.toUpperCase()})),{id:'lounge',x:7,z:4.7,label:'HANG OUT & CHAT'},{id:'exit',x:0,z:7.8,label:'RETURN TO THE CITY'}];
 function walkTo(id){const p=spots.find(s=>s.id===id);if(p)route=findWalkPath(avatar.position,p,blocked,bounds)||[];}
 const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.16),point=new THREE.Vector3();
 function clickAt(x,y,w,h){ray.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);if(ray.ray.intersectPlane(floor,point))route=findWalkPath(avatar.position,point,blocked,bounds)||[];}
 function nearest(){return spots.find(p=>Math.hypot(avatar.position.x-p.x,avatar.position.z-p.z)<2.5);}
 function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
 function update(dt,input){const old=avatar.position.clone();let d=walkingView.movement(input,dt);if(d.x||d.z)route=[];if(route.length){const p=route[0],dx=p.x-avatar.position.x,dz=p.z-avatar.position.z,len=Math.hypot(dx,dz);if(len<.18)route.shift();else d={x:dx/len,z:dz/len};}const len=Math.hypot(d.x,d.z);if(len){const speed=3.8*dt,x=avatar.position.x+d.x/len*speed,z=avatar.position.z+d.z/len*speed;if(!blocked(x,avatar.position.z))avatar.position.x=x;if(!blocked(avatar.position.x,z))avatar.position.z=z;avatar.rotation.y=Math.atan2(d.x,d.z);}person.update(dt,old.distanceToSquared(avatar.position)>.00001);rigs.forEach(r=>r.update(dt));ceiling.visible=walkingView.enabled;if(walkingView.enabled)walkingView.update();else{camera.fov=48;const offset=camera.aspect<.8?25:18;camera.position.lerp(new THREE.Vector3(avatar.position.x*.35,offset,avatar.position.z*.3+offset),1-Math.exp(-dt*5));camera.lookAt(avatar.position.x*.4,0,avatar.position.z*.4-1);camera.updateProjectionMatrix();}}
 update(1,{});
 return {scene,camera,avatar,walkingView,look:walkingView.look,setFirstPerson:walkingView.set,resize,update,clickAt,nearest,walkTo,emote:id=>person.emote(id),dispose(){person.dispose();rigs.forEach(r=>r.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.dispose();scene.clear();}};
}
