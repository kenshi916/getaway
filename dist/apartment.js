import * as THREE from './assets/three.module.js';
import {HOME_SPAWN,HOME_SPOTS,HOME_BOUNDS,homeRoom} from './home-layout.mjs?v=9';
export {HOME_SPAWN,HOME_SPOTS} from './home-layout.mjs?v=9';
export const APARTMENT_ASSETS=['bedDouble','cabinetBedDrawer','lampRoundTable','loungeDesignSofaCorner','loungeChairRelax','pillowBlue','tableCoffeeGlass','cabinetTelevision','televisionModern','books','laptop','desk','chairDesk','bookcaseClosedDoors','pottedPlant','plantSmall1','kitchenCabinetDrawer','kitchenSink','kitchenStove','kitchenFridge','hoodModern','kitchenCabinetUpperDouble','kitchenCoffeeMachine','tableRound','chairModernCushion','showerRound','toiletSquare','bathroomSinkSquare','bathroomMirror','washer','coatRackStanding','rugDoormat','lampRoundFloor','sideTable','trashcan','radio'];

export function buildApartment(templates,position=HOME_SPAWN){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#111c2a');
 const room=new THREE.Group();scene.add(room);const colliders=[],hotspots=[],occluders=[],furniture=[],materials=new Map();
 scene.add(new THREE.HemisphereLight('#d3e7f6','#7c7264',1.75));
 const sun=new THREE.DirectionalLight('#ffe6c5',2.6);sun.position.set(-7,14,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:45});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);
 const light=(color,intensity,range,x,y,z)=>{const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);return l;};
 light('#ffdbab',32,13,-3.8,3.2,-3.4);light('#ffba7d',22,9,2.5,2,-4.6);light('#b9dcff',20,11,-6.5,2.8,1.5);light('#cceef3',24,8,6,2.8,2.1);
 function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.82,...extra}));return materials.get(key);}
 function box(w,h,d,color,x,y,z,extra={},parent=room){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const solid=(x,z,w,d,name='wall')=>colliders.push({x,z,w,d,name});
 function wall(w,h,d,x,z,color='#c6c5b6',y=.25+h/2){const mesh=box(w,h,d,color,x,y,z);mesh.material=mesh.material.clone();mesh.material.transparent=true;occluders.push(mesh);solid(x,z,w,d);return mesh;}
 function label(value,w,h,x,y,z,rot=0,ink='#eee6d4',bg='#283a42'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.max(128,Math.round(768*h/w));const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.min(canvas.height*.58,1100/value.length)}px PixelArcade,monospace`;c.fillText(value,384,canvas.height/2,720);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:.8,side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rot;room.add(mesh);return mesh;
 }
 // Furniture keeps the source pack's modeled doors, handles, upholstery, and fixtures.
 function prop(name,x,z,width,options={}){
  const template=templates['home-'+name];if(!template)throw Error('Missing interior model: '+name);
  const asset=template.scene.clone(true),group=new THREE.Group();asset.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const scale=Math.min(width/size.x,(options.height||10)/size.y);
  asset.scale.setScalar(scale);asset.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);group.add(asset);group.position.set(x,options.y??.27,z);group.rotation.y=options.rotation||0;room.add(group);
  const copies=new Map();asset.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const recolor=m=>{if(!copies.has(m)){const clone=m.clone();clone.roughness=.78;if(options.colors?.[m.name])clone.color.set(options.colors[m.name]);if(m.name==='glass'){clone.transparent=true;clone.opacity=.32;clone.roughness=.15;clone.depthWrite=false;}copies.set(m,clone);}return copies.get(m);};o.material=Array.isArray(o.material)?o.material.map(recolor):recolor(o.material);});
  group.updateMatrixWorld(true);const actual=new THREE.Box3().setFromObject(group),s=actual.getSize(new THREE.Vector3()),c=actual.getCenter(new THREE.Vector3());if(options.collision!==false)solid(c.x,c.z,s.x,s.z,name);furniture.push({name,group,bounds:actual});return{group,bounds:actual,top:actual.max.y};
 }
 // A continuous foundation and staggered walnut boards across the apartment.
 box(15.5,.44,11.5,'#243844',0,-.02,0);box(15.2,.14,11.2,'#654e3d',0,.2,0);
 const planks=[];for(let row=0;row<30;row++){const z=-5.48+row*.37;for(let i=-1;i<11;i++){const a=Math.max(-7.48,-7.48+i*1.5+(row%3)*.5),b=Math.min(7.48,-7.48+(i+1)*1.5+(row%3)*.5);if(b>a+.02)planks.push({x:(a+b)/2,z,w:b-a-.018});}}
 const floor=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.026,.35),mat('#a28161'),planks.length),stamp=new THREE.Object3D(),wood=['#9f7d5e','#ae8a66','#977353','#a3805e'];planks.forEach((p,i)=>{stamp.position.set(p.x,.28,p.z);stamp.scale.set(p.w,1,1);stamp.updateMatrix();floor.setMatrixAt(i,stamp.matrix);floor.setColorAt(i,new THREE.Color(wood[i%4]));});floor.receiveShadow=true;room.add(floor);
 function tiles(x,z,w,d,a,b,step=.5){const count=Math.ceil(w/step)*Math.ceil(d/step),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.035,1),mat('#ffffff'),count);let i=0;for(let row=0;row<Math.ceil(d/step);row++)for(let col=0;col<Math.ceil(w/step);col++){const tw=Math.min(step,w-col*step),td=Math.min(step,d-row*step);stamp.position.set(x-w/2+col*step+tw/2,.305,z-d/2+row*step+td/2);stamp.scale.set(tw-.017,1,td-.017);stamp.updateMatrix();mesh.setMatrixAt(i,stamp.matrix);mesh.setColorAt(i++,new THREE.Color((row+col)%2?a:b));}mesh.receiveShadow=true;room.add(mesh);}
 tiles(-3.2,-4.08,8.25,2.72,'#bcc1b8','#c4c9be',.56);tiles(6.05,3.12,2.9,4.6,'#8ca6a0','#dce1d5',.46);
 // Exterior walls, with genuine openings for two large windows.
 wall(9.2,3.35,.2,-3,-5.6,'#b9c1b9');wall(1.5,3.35,.2,2.25,-5.6,'#65807d');wall(1.25,3.35,.2,6.975,-5.6,'#65807d');
 wall(3.35,.92,.2,4.675,-5.6,'#65807d');wall(3.35,.45,.2,4.675,-5.6,'#65807d',3.38);
 wall(.2,3.35,4.5,-7.6,-3.35,'#afbdb9');wall(.2,3.35,2.2,-7.6,4.5,'#afbdb9');wall(.2,.92,4.45,-7.6,1.125,'#afbdb9');wall(.2,.45,4.45,-7.6,1.125,'#afbdb9',3.38);
 // Cutaway outer edges retain skirting and wall thickness without hiding the rooms.
 wall(.2,.7,11.2,7.6,0,'#c3c5b8');wall(9.35,.7,.2,-2.925,5.6,'#c3c5b8');wall(4.25,.7,.2,5.475,5.6,'#c3c5b8');
 box(15.15,.15,.1,'#eee5d0',0,.42,-5.46);box(.1,.15,11.15,'#eee5d0',-7.45,.42,0);box(.1,.14,11.15,'#e7dcc7',7.46,.42,0);
 function windowUnit(x,z,width,rotation=0){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;room.add(group);const b=(w,h,d,c,xx,y,zz,e={})=>box(w,h,d,c,xx,y,zz,e,group);
  b(width,2.06,.06,'#294b68',0,2.16,-.03,{emissive:'#5a91b4',emissiveIntensity:.38});for(const xx of [-width/2,0,width/2])b(.095,2.2,.18,'#e9e0cc',xx,2.15,.12);for(const yy of [1.08,2.08,3.2])b(width+.12,.1,.18,'#e9e0cc',0,yy,.12);b(width+.42,.12,.47,'#d8d3bd',0,1.04,.15);
  for(let i=0;i<12;i++){const h=.3+(i*7%8)*.11,xx=-width/2+.16+i*(width-.3)/12;b((width-.3)/13,h,.035,'#26364d',xx,1.18+h/2,.015);for(let j=0;j<3;j++)if(h>j*.22)b(.045,.055,.02,'#e9c58a',xx,1.28+j*.22,.045,{emissive:'#ffc36d',emissiveIntensity:.55});}
  b(width+.65,.06,.08,'#67574d',0,3.34,.22);for(const side of [-1,1])for(let i=0;i<5;i++)b(.105,2.42,.1,'#d7c6a8',side*(width/2+.04-i*.09),2.12,.25+i%2*.06);
 }
 windowUnit(4.675,-5.52,3.35);windowUnit(-7.52,1.125,4.45,Math.PI/2);
 // Bedroom partition and a real hallway door opening, with a low front wall for visibility.
 wall(.18,3.2,6.45,1.35,-2.375,'#b7c0b2');wall(.8,1.15,.18,1.75,.85,'#b7c0b2');wall(3.65,1.15,.18,5.775,.85,'#b7c0b2');
 function doorway(x,z,width,rotation=0,door=false){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;room.add(group);for(const xx of [-width/2,width/2])box(.13,2.7,.22,'#e3d4b8',xx,1.62,0,{},group);box(width+.13,.15,.22,'#e3d4b8',0,3,0,{},group);box(width,.045,.28,'#c8a779',0,.32,0,{},group);if(door){const panel=box(width-.15,2.58,.12,'#2d4852',0,1.59,0,{},group);panel.material=panel.material.clone();panel.material.transparent=true;occluders.push(panel);box(.07,.07,.15,'#d8b571',width*.31,1.45,.12,{metalness:.65,roughness:.35},group);}}
 doorway(3.05,.85,1.8);wall(.18,1.2,1.45,4.5,1.575,'#90aba4');wall(.18,1.2,1.5,4.5,4.85,'#90aba4');doorway(4.5,3.2,1.8,Math.PI/2);doorway(2.65,5.56,1.4,0,true);label('04',.35,.25,2.65,2.24,5.65,0,'#e6c784','#2d4852');
 // Kitchen: a complete run of cabinetry, range, sink, refrigerator and coffee counter.
 const kitchen={wood:'#365963',woodDark:'#29434b',metal:'#d0d6d1'};
 prop('kitchenFridge',-6.68,-4.82,1.25,{height:2.65,colors:{wood:'#b9c5c5'}});
 for(const [name,x]of [['kitchenStove',-5.24],['kitchenSink',-3.95],['kitchenCabinetDrawer',-2.66],['kitchenCabinetDrawer',-1.37]])prop(name,x,-4.8,1.27,{colors:kitchen});
 // Pale tile backsplash and task lights belong to the wall above the worktop.
 for(let row=0;row<3;row++)for(let col=0;col<18;col++)box(.29,.2,.035,(row+col)%3?'#e2dfcd':'#b5c8bc',-5.98+col*.31,1.8+row*.22,-5.465);
 prop('hoodModern',-5.24,-5.02,1.27,{y:2.35,collision:false});for(const x of [-3.95,-2.66,-1.37]){prop('kitchenCabinetUpperDouble',x,-5.17,1.27,{y:2.18,collision:false,colors:kitchen});box(1.16,.025,.18,'#ffe8af',x,2.17,-4.97,{emissive:'#ffd29c',emissiveIntensity:1.9});}
 prop('kitchenCoffeeMachine',-1.4,-4.66,.48,{y:1.63,collision:false});prop('plantSmall1',-2.75,-4.78,.31,{y:1.63,collision:false});
 const dining=prop('tableRound',-3.8,-2.17,1.7,{height:1.12});prop('chairModernCushion',-5,-2.17,.67,{height:1.1,rotation:Math.PI/2});prop('chairModernCushion',-2.55,-2.17,.67,{height:1.1,rotation:-Math.PI/2});prop('plantSmall1',-3.8,-2.17,.28,{y:dining.top,collision:false});
 // Living room: an upholstered sectional, glass table, media cabinet and reading corner.
 box(5.8,.025,4.6,'#a5ad9a',-3.52,.32,2.55);box(5.47,.012,4.27,'#586e71',-3.52,.34,2.55);for(let i=0;i<7;i++)box(5.2,.006,.025,'#8b9e91',-3.52,.349,1.02+i*.49);
 prop('loungeDesignSofaCorner',-4.8,2.9,3.6,{height:1.3,rotation:Math.PI,colors:{carpetBlue:'#456d85'}});
 const coffee=prop('tableCoffeeGlass',-2.1,3.15,1.65,{height:.65});prop('books',-2.3,3.15,.52,{y:coffee.top,collision:false});prop('radio',-1.85,3.22,.32,{y:coffee.top,collision:false});
 prop('loungeChairRelax',-4.88,-.16,1.1,{height:1.3,rotation:.35,colors:{carpet:'#b67755'}});prop('lampRoundFloor',-6.85,4.55,.56,{height:2.5});light('#ffc483',20,8,-6.85,2.2,4.55);
 const media=prop('cabinetTelevision',-7.06,-.38,2.25,{rotation:Math.PI/2,height:.95});const tv=prop('televisionModern',-7.04,-.38,1.62,{rotation:Math.PI/2,y:media.top,collision:false});prop('pottedPlant',-6.75,-2.65,.63,{height:1.6});
 // Bedroom: separate sleeping and work areas, nightstands, wardrobe, linens and a rug.
 box(4.9,.025,4.15,'#a9aa8d',4.55,.315,-3.15);box(4.64,.015,3.9,'#babc9f',4.55,.335,-3.15);
 prop('bedDouble',4.42,-3.53,2.6,{colors:{carpet:'#587d75',wood:'#6b5143',carpetWhite:'#f1ead8'}});
 for(const x of [2.58,6.23]){const cabinet=prop('cabinetBedDrawer',x,-4.63,.68,{height:.85,colors:{wood:'#856b50'}});prop('lampRoundTable',x,-4.63,.42,{y:cabinet.top,height:.58,collision:false});}
 prop('bookcaseClosedDoors',6.94,-.45,1.45,{height:2.8,rotation:-Math.PI/2,colors:{wood:'#859180',woodDark:'#55685e'}});
 const desk=prop('desk',2.06,-1.05,2.05,{height:1.2,rotation:Math.PI/2,colors:{wood:'#aa8761'}});const laptop=prop('laptop',2.09,-1.2,.64,{y:desk.top,rotation:Math.PI/2,collision:false});prop('chairDesk',3.08,-1.05,.66,{height:1.2,rotation:Math.PI/2,collision:false});prop('books',2.08,-.35,.4,{y:desk.top,rotation:Math.PI/2,collision:false});prop('pottedPlant',6.9,-4.8,.57,{height:1.65});
 // Bathroom: enclosed tile, shower, vanity, mirror, toilet and laundry.
 for(let row=0;row<3;row++)for(let col=0;col<9;col++)box(.305,.275,.026,(row+col)%2?'#becdc1':'#9db6ac',4.76+col*.31,.47+row*.285,.962);
 prop('showerRound',6.68,1.9,1.45,{height:2.7,rotation:Math.PI});const vanity=prop('bathroomSinkSquare',5.2,1.45,1.02,{height:1.2});prop('bathroomMirror',5.2,1.04,.92,{y:1.63,height:1.03,collision:false});prop('toiletSquare',6.9,4.55,.9,{height:1.15,rotation:-Math.PI/2});prop('washer',5.22,4.79,.98,{height:1.2});box(.7,.06,.42,'#dfd6b9',5.22,1.45,4.79);box(.63,.065,.38,'#95aea0',5.22,1.51,4.79);
 // Entry has an actual threshold, coat stand, shoe shelf and a runner.
 prop('rugDoormat',2.65,4.68,1.55,{collision:false,colors:{carpet:'#7c705e'}});prop('coatRackStanding',3.9,4.95,.55,{height:2.25});prop('sideTable',1.86,2.13,.65,{height:.9});label('LAST EXIT',.6,.16,1.86,1.2,2.06,0,'#ddc294','#564c43');
 // Lampshades and framed details give the walls human-scale references.
 for(const [x,y,z,w,h,c]of [[-.25,2.25,-5.465,.7,.95,'#596c76'],[3.5,2.62,-5.465,.56,.7,'#ba996a']]){box(w+.1,h+.1,.06,'#665342',x,y,z);box(w,h,.025,c,x,y,z+.045);box(w*.55,.035,.026,'#dec79e',x,y-.1,z+.064);}
 // Driver skins reuse the exact animated character assets from the collection.
 const avatar=new THREE.Group();avatar.position.set(position.x,.36,position.z);scene.add(avatar);let character,mixer,actions={},walking=false;
 function setCharacter(template){if(mixer){mixer.stopAllAction();mixer.uncacheRoot(character);avatar.remove(character);}character=template.scene.clone(true);character.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(character),s=b.getSize(new THREE.Vector3()),scale=1.8/s.y;character.scale.setScalar(scale);character.position.y=-b.min.y*scale;avatar.add(character);mixer=new THREE.AnimationMixer(character);actions={};for(const name of ['idle','walk']){const clip=template.animations.find(a=>a.name===name);if(clip)actions[name]=mixer.clipAction(clip);}actions.idle?.play();walking=false;}
 setCharacter(templates.suit);
 for(const spot of HOME_SPOTS){const ring=new THREE.Mesh(new THREE.RingGeometry(.28,.34,32),new THREE.MeshBasicMaterial({color:'#aeeed4',transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(spot.x,.37,spot.z);scene.add(ring);const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.1),new THREE.MeshBasicMaterial({color:'#ffdb96'}));diamond.position.set(spot.x,2.2,spot.z);scene.add(diamond);hotspots.push({...spot,ring,diamond});}
 const radius=.23;
 function blocked(x,z){return !Number.isFinite(x)||!Number.isFinite(z)||x<HOME_BOUNDS.minX||x>HOME_BOUNDS.maxX||z<HOME_BOUNDS.minZ||z>HOME_BOUNDS.maxZ||colliders.some(b=>x+radius>b.x-b.w/2&&x-radius<b.x+b.w/2&&z+radius>b.z-b.d/2&&z-radius<b.z+b.d/2);}
 function setPosition(p){avatar.position.set(p.x,.36,p.z);if(blocked(p.x,p.z))avatar.position.set(HOME_SPAWN.x,.36,HOME_SPAWN.z);}
 setPosition(position);
 const camera=new THREE.PerspectiveCamera(40,1,.1,140);let viewMode='overview',viewport={width:1280,height:800},tvOn=false,coffeeTime=0;
 const tvLight=light('#8bc9ff',0,5,-6.4,1.9,-.38);const tvMaterials=[];tv.group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.color.getHSL({}).l<.3)tvMaterials.push(m);});
 const steam=new THREE.Group();room.add(steam);for(let i=0;i<4;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.055,5,4),new THREE.MeshBasicMaterial({color:'#e0e9e9',transparent:true,opacity:.3,depthWrite:false}));puff.position.set(-1.4,2.02+i*.12,-4.57);steam.add(puff);}steam.visible=false;
 function interact(id){if(id==='tv'){tvOn=!tvOn;tvLight.intensity=tvOn?10:0;for(const m of tvMaterials){m.emissive.set(tvOn?'#66a6d1':'#000000');m.emissiveIntensity=tvOn?.9:0;}return tvOn?'TV ON · THE CITY CAN WAIT.':'TV OFF';}if(id==='coffee'){coffeeTime=4;return 'COFFEE’S ON. MAKE YOURSELF AT HOME.';}return null;}
 function nearest(){return hotspots.filter(h=>Math.hypot(avatar.position.x-h.x,avatar.position.z-h.z)<1.05&&!colliders.some(b=>b.name==='wall'&&segmentHits(avatar.position,h,b))).sort((a,b)=>Math.hypot(avatar.position.x-a.x,avatar.position.z-a.z)-Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z))[0]||null;}
 function segmentHits(a,b,r){let min=0,max=1;for(const axis of ['x','z']){const delta=b[axis]-a[axis],half=(axis==='x'?r.w:r.d)/2;if(Math.abs(delta)<.00001){if(a[axis]<r[axis]-half||a[axis]>r[axis]+half)return false;}else{let lo=(r[axis]-half-a[axis])/delta,hi=(r[axis]+half-a[axis])/delta;if(lo>hi)[lo,hi]=[hi,lo];min=Math.max(min,lo);max=Math.min(max,hi);if(min>max)return false;}}return true;}
 // Overview shows a floor plan; room view follows the character at a closer distance.
 room.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(room),corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
 function resize(width,height){viewport={width,height};camera.aspect=width/height;camera.clearViewOffset();camera.fov=40;camera.updateProjectionMatrix();if(viewMode==='room'){camera.setViewOffset(width,height,width<=650?0:-140,width<=650?-92:0,width,height);positionRoomCamera(1);return;}
  const phone=width<=650,short=height<=560&&!phone,area=phone?{left:12,right:width-12,top:305,bottom:height-133}:{left:short?260:width>1100?330:315,right:width-20,top:92,bottom:height-100};if(area.bottom-area.top<110)area.top=area.bottom-110;let distance=1,projected;
  for(let i=0;i<8;i++){camera.position.set(15.5,19.5,22).multiplyScalar(distance);camera.lookAt(0,.55,0);camera.updateMatrixWorld();const points=corners.map(v=>v.clone().project(camera));projected={left:Math.min(...points.map(v=>(v.x+1)*width/2)),right:Math.max(...points.map(v=>(v.x+1)*width/2)),top:Math.min(...points.map(v=>(1-v.y)*height/2)),bottom:Math.max(...points.map(v=>(1-v.y)*height/2))};const ratio=Math.max((projected.right-projected.left)/(area.right-area.left),(projected.bottom-projected.top)/(area.bottom-area.top));if(ratio<=1)break;distance*=ratio*1.012;}
  camera.far=Math.max(140,camera.position.length()+35);camera.setViewOffset(width,height,(projected.left+projected.right-area.left-area.right)/2,(projected.top+projected.bottom-area.top-area.bottom)/2,width,height);camera.updateProjectionMatrix();
 }
 const roomLook=new THREE.Vector3(),desiredEye=new THREE.Vector3(),ray=new THREE.Ray(),hit=new THREE.Vector3();
 function positionRoomCamera(smooth){const phone=viewport.width<=650;roomLook.set(avatar.position.x,.8,avatar.position.z);desiredEye.set(roomLook.x+(phone?6.5:7),9.4,roomLook.z+9.5);camera.position.lerp(desiredEye,smooth);camera.lookAt(roomLook);camera.updateMatrixWorld();}
 function toggleView(){viewMode=viewMode==='overview'?'room':'overview';resize(viewport.width,viewport.height);return viewMode;}
 function update(dt,input={},step=6,time=0){const dx=(input.right?1:0)-(input.left?1:0),dz=(input.down?1:0)-(input.up?1:0),len=Math.hypot(dx,dz),before=avatar.position.clone();if(len){const x=dx/len*3.4*dt,z=dz/len*3.4*dt;if(!blocked(avatar.position.x+x,avatar.position.z))avatar.position.x+=x;if(!blocked(avatar.position.x,avatar.position.z+z))avatar.position.z+=z;avatar.rotation.y=Math.atan2(dx,dz);}
  const moving=before.distanceTo(avatar.position)>.0001;if(moving!==walking){walking=moving;const a=moving?actions.walk:actions.idle,b=moving?actions.idle:actions.walk;if(a){a.reset().fadeIn(.14).play();b?.fadeOut(.14);}}mixer.update(dt);
  const near=nearest();for(const h of hotspots){const tutorial=step===1?h.id==='laptop':step===2?h.id==='door':false,focused=tutorial||near===h;h.diamond.visible=focused;h.ring.material.opacity=focused?.65:.12;h.diamond.position.y=2.2+Math.sin(time*2)*.07;h.diamond.rotation.y=time;}
  if(viewMode==='room')positionRoomCamera(1-Math.exp(-dt*6));const aim=new THREE.Vector3(avatar.position.x,1.15,avatar.position.z);ray.set(camera.position,aim.clone().sub(camera.position).normalize());for(const mesh of occluders){mesh.updateWorldMatrix(true,false);const b=new THREE.Box3().setFromObject(mesh),intersects=ray.intersectBox(b,hit),fade=viewMode==='room'&&intersects&&hit.distanceTo(camera.position)<aim.distanceTo(camera.position)-.2;mesh.material.opacity=THREE.MathUtils.damp(mesh.material.opacity,fade?.12:1,9,dt);mesh.material.depthWrite=mesh.material.opacity>.98;mesh.castShadow=!fade;}
  coffeeTime=Math.max(0,coffeeTime-dt);steam.visible=coffeeTime>0;steam.children.forEach((p,i)=>{p.position.y=1.98+((time*.3+i*.13)%.55);p.material.opacity=Math.max(0,.35-(p.position.y-1.98)*.5);});return before.distanceTo(avatar.position);
 }
 return {scene,camera,avatar,colliders,hotspots,furniture,update,nearest,setPosition,blocked,resize,setCharacter,toggleView,interact,get viewMode(){return viewMode;},get roomName(){return homeRoom(avatar.position.x,avatar.position.z);}};
}
