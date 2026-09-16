import * as THREE from './assets/three.module.js';
import {findWalkPath} from './walk-navigation.mjs?v=32';

// A walkable arrival courtyard. The same character assets are used inside the home.
export const ARRIVAL_SPAWN={x:-9,z:10},ARRIVAL_DOOR={x:4,z:-1.15};
export function buildArrival(templates){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#a8cbd5');scene.fog=new THREE.Fog('#a8cbd5',65,125);
 const camera=new THREE.PerspectiveCamera(43,1,.1,160),root=new THREE.Group();scene.add(root);
 scene.add(new THREE.HemisphereLight('#ebf7ff','#61784a',2.1));
 const sun=new THREE.DirectionalLight('#ffe3b1',3);sun.position.set(-18,28,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:26,bottom:-26,near:1,far:90});sun.shadow.normalBias=.025;scene.add(sun);
 const materials=new Map(),colliders=[],bounds={minX:-14,maxX:17,minZ:-2,maxZ:13};
 const mat=(c,e={})=>{const key=c+JSON.stringify(e);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.85,...e}));return materials.get(key);};
 function box(w,h,d,c,x,y,z,parent=root,e={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,e));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function text(value,x,y,z,w=5,h=.65,bg='#274b43',ink='#fff2c7'){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.min(c.height*.5,1500/value.length)+'px monospace';ctx.fillText(value,c.width/2,c.height/2,c.width*.94);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.85}));m.position.set(x,y,z);root.add(m);return m;
 }
 box(240,.3,240,'#65854b',0,-.35,0);box(45,.2,20,'#c7bfa1',0,-.09,6);box(240,.1,8,'#344852',0,-.16,19);
 for(let x=-110;x<110;x+=5)box(2.4,.015,.14,'#e4cf87',x,-.09,19);
 for(let x=-24;x<25;x+=.9)box(.85,.15,.3,'#e1d9bd',x,0,14.1);
 for(let x=-16;x<20;x+=1.15)for(let z=-2;z<14;z+=1.15)box(1.11,.024,1.11,(Math.round(x*10)+Math.round(z*10))%3?'#d1c8ab':'#babda4',x,.025,z);
 function tree(x,z,s=1){box(.35*s,3*s,.35*s,'#725239',x,1.5*s,z);box(2.4*s,2*s,2.2*s,'#56804b',x,3.2*s,z);box(1.8*s,1.5*s,1.8*s,'#86a85b',x-.35*s,4.35*s,z);box(1.5*s,1.5*s,1.5*s,'#73994d',x+.7*s,3.5*s,z+.4*s);}
 function planter(x,z,w,d){box(w,.4,d,'#a17955',x,.2,z);box(w-.2,.12,d-.2,'#647f40',x,.44,z);colliders.push({x,z,w:w+.5,d:d+.5});for(let i=0;i<12;i++){const xx=x-w*.42+(i*1.27%1)*w*.84,zz=z-d*.38+(i*.618%1)*d*.76;box(.065,.28,.065,'#4f7444',xx,.6,zz);box(.15,.09,.15,i%3?'#f1cb79':'#e9a799',xx,.76,zz);}}
 planter(-4.6,5,4.2,3.7);tree(-4.6,5,.8);planter(11,6,4,4.5);tree(11,6,1.05);planter(-11.4,-.2,3.5,2.1);
 for(const [x,z,s]of [[-19,9,1.4],[22,5,1.4],[-20,-9,1.2],[23,-14,1.6],[-12,28,1.5],[15,29,1.3],[-29,29,1.7],[32,30,1.6]])tree(x,z,s);
 // The facade has deep window reveals, balconies, a sheltered doorway and planting.
 function building(x,z,w,h,c){box(w,h,8,c,x,h/2,z);box(w+.35,.28,8.3,'#eee2c9',x,h+.12,z);box(w+.4,.5,8.4,'#d7c7ad',x,.25,z);
  for(let y=2;y<h-1;y+=3.1)for(let xx=x-w/2+1.8;xx<x+w/2-1;xx+=3.1){if(z===-8&&Math.abs(xx-4)<2&&y<3)continue;box(2.25,2,.2,'#e9d9b9',xx,y,z+4.04);box(1.96,1.7,.1,'#587e88',xx,y,z+4.17);box(.07,1.75,.07,'#f2e4c8',xx,y,z+4.24);box(2.3,.12,.44,'#d5c7a8',xx,y-.94,z+4.18);box(1.84,.07,.04,'#bad5cb',xx,y+.55,z+4.24);
   if(y>3){box(2.55,.18,1.2,'#d6b793',xx,y-.95,z+4.52);box(2.5,.08,.08,'#334e51',xx,y-.15,z+5.03);for(let k=-1;k<=1;k++)box(.07,.75,.07,'#334e51',xx+k,y-.55,z+5.03);box(.5,.32,.45,'#ad7859',xx+.7,y-.74,z+4.66);box(.65,.42,.6,'#6c9951',xx+.7,y-.4,z+4.66);}
  }
 }
 building(4,-8,22,10.8,'#c59b76');building(-24,-15,13,15,'#778f8d');building(25,-13,15,13.8,'#b88474');building(-4,-26,18,19,'#8d9aa4');building(17,-30,16,22,'#afad91');
 for(let y=.9;y<3.9;y+=.3)for(let x=-6.5;x<14.8;x+=1.15)if(Math.abs(x-4)>1.7)box(1.1,.025,.025,'#a88466',x,y,-3.976);
 box(3.4,3.55,.24,'#ecdcc0',4,1.78,-3.7);box(2.85,3.26,.15,'#243f40',4,1.65,-3.54);
 const door=new THREE.Group();door.position.set(2.63,.08,-3.4);root.add(door);box(2.7,3.05,.13,'#426353',1.35,1.53,0,door);box(2.34,1.75,.04,'#8cbbb0',1.35,1.99,.08,door);box(.07,1.76,.1,'#f3d8a0',1.35,1.99,.12,door);box(.075,.45,.14,'#e4bd6a',2.4,1.18,.12,door);
 box(5,.25,2.5,'#3d6658',4,3.8,-2.75);for(let i=0;i<10;i++)box(.45,.13,2.5,i%2?'#a4b986':'#6d9165',1.78+i*.49,3.97,-2.75);
 text('YOUR NEW HOME',4,3.8,-1.48,4.6,.27);text('LAST EXIT RESIDENCES',4,10.1,-3.85,7.8,.64);box(3.2,.055,1.65,'#ae8d61',4,.055,-2.5);
 for(const x of [1,7]){box(.35,.5,.25,'#355049',x,2.65,-3.72);box(.22,.32,.26,'#ffe3aa',x,2.66,-3.56,root,{emissive:'#ffd48a',emissiveIntensity:1.1});}
 planter(.1,-2.3,1.2,1.25);planter(8.1,-2.3,1.2,1.25);
 for(const x of [-9,17]){box(.14,4,.14,'#304a48',x,2,12);box(.8,.2,.6,'#304a48',x,4,12);box(.64,.12,.48,'#ffe5b7',x,3.88,12,root,{emissive:'#ffd6a2',emissiveIntensity:.8});}
 for(const x of [-10.4,15.4]){for(let i=0;i<4;i++)box(2.6,.11,.14,'#937252',x,.62,4.8+i*.19);for(let i=0;i<3;i++)box(2.6,.12,.12,'#a88b63',x,1.05+i*.16,5.43);for(const dx of [-1,1])box(.12,.62,.78,'#34504b',x+dx,.3,5.05);colliders.push({x,z:5.1,w:3,d:1.3});}
 const marker=new THREE.Group();marker.position.set(4,0,-1.15);root.add(marker);const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.91,4),new THREE.MeshBasicMaterial({color:'#f7d978',side:THREE.DoubleSide,transparent:true,opacity:.85}));ring.rotation.set(-Math.PI/2,0,Math.PI/4);ring.position.y=.07;marker.add(ring);const diamond=box(.24,.24,.24,'#ffe693',0,2.5,0,marker,{emissive:'#eed66e',emissiveIntensity:.6});diamond.rotation.z=Math.PI/4;
 const trail=new THREE.Group();root.add(trail);
 function actor(source,x,z){const avatar=new THREE.Group(),model=source.scene.clone(true);model.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(model),scale=1.85/b.getSize(new THREE.Vector3()).y;model.scale.setScalar(scale);model.position.y=-b.min.y*scale;model.traverse(o=>{if(o.isMesh)o.castShadow=true;});avatar.add(model);avatar.position.set(x,.06,z);root.add(avatar);const mixer=new THREE.AnimationMixer(model),actions=new Map();let current='';function play(name){if(current===name)return;const clip=source.animations.find(a=>a.name===name)||source.animations.find(a=>a.name==='idle');if(!clip)return;let a=actions.get(name);if(!a){a=mixer.clipAction(clip);actions.set(name,a);}for(const other of actions.values())other.fadeOut(.15);a.reset().fadeIn(.15).play();current=name;}play('idle');return{avatar,mixer,play};}
 const player=actor(templates.suit,ARRIVAL_SPAWN.x,ARRIVAL_SPAWN.z),guide=actor(templates['passenger-k'],-7,9.3);guide.avatar.rotation.y=-1;
 const blocked=(x,z)=>x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ||colliders.some(c=>Math.abs(x-c.x)<c.w/2+.23&&Math.abs(z-c.z)<c.d/2+.23);
 let trailStart=ARRIVAL_SPAWN;for(const next of findWalkPath(ARRIVAL_SPAWN,ARRIVAL_DOOR,blocked,bounds)||[]){const length=Math.hypot(next.x-trailStart.x,next.z-trailStart.z);for(let d=.6;d<length;d+=1.15)box(.19,.018,.3,'#f0d482',trailStart.x+(next.x-trailStart.x)*d/length,.061,trailStart.z+(next.z-trailStart.z)*d/length,trail);trailStart=next;}
 let path=[],guidePath=[],walking=false,opening=false,viewport={width:1440,height:900};
 function reset(){player.avatar.position.set(ARRIVAL_SPAWN.x,.06,ARRIVAL_SPAWN.z);player.avatar.rotation.y=1.95;guide.avatar.position.set(-7,.06,9.3);guide.avatar.rotation.y=-1;path=[];guidePath=[];walking=false;opening=false;door.rotation.y=0;guide.play('interact-right');positionCamera(1);}
 function begin(){walking=true;guidePath=findWalkPath(guide.avatar.position,{x:6.3,z:-.8},blocked,bounds)||[];}
 function walkTo(point=ARRIVAL_DOOR){if(!walking||opening)return false;const route=findWalkPath(player.avatar.position,point,blocked,bounds);if(!route)return false;path=route;return true;}
 const raycaster=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.06),point=new THREE.Vector3();
 function clickAt(x,y,w,h){if(!walking||opening)return;scene.updateMatrixWorld(true);raycaster.setFromCamera(new THREE.Vector2(x/w*2-1,1-y/h*2),camera);if(raycaster.intersectObject(door,true).length)return walkTo();if(raycaster.ray.intersectPlane(ground,point)&&!blocked(point.x,point.z))return walkTo(point);}
 function move(actor,dx,dz,amount){const len=Math.hypot(dx,dz);if(!len)return false;const p=actor.avatar.position,x=dx/len*amount,z=dz/len*amount;let moved=false;if(!blocked(p.x+x,p.z)){p.x+=x;moved=!!x;}if(!blocked(p.x,p.z+z)){p.z+=z;moved=moved||!!z;}if(moved)actor.avatar.rotation.y=Math.atan2(dx,dz);return moved;}
 function follow(actor,route,dt){while(route.length&&Math.hypot(route[0].x-actor.avatar.position.x,route[0].z-actor.avatar.position.z)<.035)route.shift();if(!route.length)return false;const dx=route[0].x-actor.avatar.position.x,dz=route[0].z-actor.avatar.position.z;return move(actor,dx,dz,Math.min(dt*3.4,Math.hypot(dx,dz)));}
 function positionCamera(smooth){const p=player.avatar.position,narrow=viewport.width/viewport.height<.85,look=new THREE.Vector3(narrow?p.x:p.x*.48+1.5,.9,narrow?p.z-2:p.z*.6-1);camera.position.lerp(new THREE.Vector3(look.x+6,look.y+(narrow?15:13),look.z+(narrow?18:17)),smooth);camera.lookAt(look);camera.updateMatrixWorld();}
 function update(dt,input={},time=0){let moved=false;if(walking&&!opening){const dx=(input.right?1:0)-(input.left?1:0),dz=(input.down?1:0)-(input.up?1:0);if(dx||dz){path=[];moved=move(player,dx,dz,dt*3.4);}else moved=follow(player,path,dt);}player.play(moved?'walk':'idle');if(walking){const following=follow(guide,guidePath,dt*.82);guide.play(following?'walk':'idle');if(!following)guide.avatar.rotation.y=Math.atan2(player.avatar.position.x-guide.avatar.position.x,player.avatar.position.z-guide.avatar.position.z);}player.mixer.update(dt);guide.mixer.update(dt);diamond.position.y=2.5+Math.sin(time*2)*.12;diamond.rotation.y=time*.6;marker.visible=walking;trail.visible=walking;door.rotation.y=THREE.MathUtils.damp(door.rotation.y,opening?-Math.PI*.5:0,5,dt);positionCamera(1-Math.exp(-dt*6));}
 function resize(width,height){viewport={width,height};camera.aspect=width/height;camera.updateProjectionMatrix();positionCamera(1);}
 reset();return{scene,camera,avatar:player.avatar,guide:guide.avatar,reset,begin,walkTo,clickAt,blocked,colliders,bounds,update,resize,openDoor:()=>{opening=true;path=[];},get distance(){return Math.hypot(player.avatar.position.x-ARRIVAL_DOOR.x,player.avatar.position.z-ARRIVAL_DOOR.z);},get nearDoor(){return this.distance<1.25;},get navigating(){return path.length>0;}};
}
