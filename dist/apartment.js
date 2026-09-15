import {createWalkingView} from './first-person.js?v=29';
import * as THREE from './assets/three.module.js';
import {HOME_SPAWN,HOME_SPOTS,HOME_BOUNDS,homeRoom} from './home-layout.mjs?v=29';
export {HOME_SPAWN,HOME_SPOTS} from './home-layout.mjs?v=29';
export const APARTMENT_ASSETS=['bedDouble','cabinetBedDrawer','lampRoundTable','loungeDesignSofaCorner','loungeChairRelax','pillowBlue','tableCoffeeGlass','cabinetTelevision','televisionModern','books','laptop','desk','chairDesk','bookcaseClosedDoors','pottedPlant','plantSmall1','kitchenCabinetDrawer','kitchenSink','kitchenStove','kitchenFridge','hoodModern','kitchenCabinetUpperDouble','kitchenCoffeeMachine','tableRound','chairModernCushion','showerRound','toiletSquare','bathroomSinkSquare','bathroomMirror','washer','coatRackStanding','rugDoormat','lampRoundFloor','sideTable','trashcan','radio'];

export function buildApartment(templates,position=HOME_SPAWN,life={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#111c2a');
 const room=new THREE.Group();scene.add(room);const colliders=[],hotspots=[],occluders=[],furniture=[],materials=new Map();
 scene.add(new THREE.HemisphereLight('#d3e7f6','#7c7264',1.75));
 const sun=new THREE.DirectionalLight('#ffe6c5',2.6);sun.position.set(-7,14,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:55});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);
 const light=(color,intensity,range,x,y,z)=>{const l=new THREE.PointLight(color,intensity,range,2);l.position.set(x,y,z);scene.add(l);return l;};
 light('#ffdbab',45,17,-5,3.2,-5.5);light('#ffba7d',28,11,4.6,2,-7.2);light('#b9dcff',26,14,-9.5,2.8,2);light('#cceef3',28,10,8.7,2.8,3.5);
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
 box(21.9,.44,16.3,'#243844',0,-.02,0);box(21.6,.14,16,'#654e3d',0,.2,0);
 const planks=[];for(let row=0;row<44;row++){const z=-7.84+row*.36;for(let i=-1;i<16;i++){const a=Math.max(-10.68,-10.68+i*1.5+(row%3)*.5),b=Math.min(10.68,-10.68+(i+1)*1.5+(row%3)*.5);if(b>a+.02)planks.push({x:(a+b)/2,z,w:b-a-.018});}}
 const floor=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.026,.35),mat('#a28161'),planks.length),stamp=new THREE.Object3D(),wood=['#9f7d5e','#ae8a66','#977353','#a3805e'];planks.forEach((p,i)=>{stamp.position.set(p.x,.28,p.z);stamp.scale.set(p.w,1,1);stamp.updateMatrix();floor.setMatrixAt(i,stamp.matrix);floor.setColorAt(i,new THREE.Color(wood[i%4]));});floor.receiveShadow=true;room.add(floor);
 function tiles(x,z,w,d,a,b,step=.5){const count=Math.ceil(w/step)*Math.ceil(d/step),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.035,1),mat('#ffffff'),count);let i=0;for(let row=0;row<Math.ceil(d/step);row++)for(let col=0;col<Math.ceil(w/step);col++){const tw=Math.min(step,w-col*step),td=Math.min(step,d-row*step);stamp.position.set(x-w/2+col*step+tw/2,.305,z-d/2+row*step+td/2);stamp.scale.set(tw-.017,1,td-.017);stamp.updateMatrix();mesh.setMatrixAt(i,stamp.matrix);mesh.setColorAt(i++,new THREE.Color((row+col)%2?a:b));}mesh.receiveShadow=true;room.add(mesh);}
 tiles(-4.6,-6.18,12.25,3.5,'#bcc1b8','#c4c9be',.56);tiles(8.7,4.55,4.05,6.65,'#8ca6a0','#dce1d5',.46);
 // Larger room footprints keep furniture at human scale and open up the circulation.
 wall(12.4,3.35,.2,-4.6,-8,'#b9c1b9');wall(2.55,3.35,.2,2.875,-8,'#65807d');wall(2.3,3.35,.2,9.65,-8,'#65807d');
 wall(4.35,.92,.2,6.325,-8,'#65807d');wall(4.35,.45,.2,6.325,-8,'#65807d',3.38);
 wall(.2,3.35,6.4,-10.8,-4.8,'#afbdb9');wall(.2,3.35,3.9,-10.8,6.05,'#afbdb9');wall(.2,.92,5.7,-10.8,1.25,'#afbdb9');wall(.2,.45,5.7,-10.8,1.25,'#afbdb9',3.38);
 wall(.2,.7,16,10.8,0,'#c3c5b8');wall(13.7,.7,.2,-3.95,8,'#c3c5b8');wall(6.1,.7,.2,7.75,8,'#c3c5b8');
 box(21.55,.15,.1,'#eee5d0',0,.42,-7.86);box(.1,.15,15.95,'#eee5d0',-10.65,.42,0);box(.1,.14,15.95,'#e7dcc7',10.66,.42,0);
 function windowUnit(x,z,width,rotation=0){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;room.add(group);const b=(w,h,d,c,xx,y,zz,e={})=>box(w,h,d,c,xx,y,zz,e,group);
  b(width,2.06,.06,'#294b68',0,2.16,-.03,{emissive:'#5a91b4',emissiveIntensity:.38});for(const xx of [-width/2,0,width/2])b(.095,2.2,.18,'#e9e0cc',xx,2.15,.12);for(const yy of [1.08,2.08,3.2])b(width+.12,.1,.18,'#e9e0cc',0,yy,.12);b(width+.42,.12,.47,'#d8d3bd',0,1.04,.15);
  for(let i=0;i<12;i++){const h=.3+(i*7%8)*.11,xx=-width/2+.16+i*(width-.3)/12;b((width-.3)/13,h,.035,'#26364d',xx,1.18+h/2,.015);for(let j=0;j<3;j++)if(h>j*.22)b(.045,.055,.02,'#e9c58a',xx,1.28+j*.22,.045,{emissive:'#ffc36d',emissiveIntensity:.55});}
  b(width+.65,.06,.08,'#67574d',0,3.34,.22);for(const side of [-1,1])for(let i=0;i<5;i++)b(.105,2.42,.1,'#d7c6a8',side*(width/2+.04-i*.09),2.12,.25+i%2*.06);
 }
 windowUnit(6.325,-7.92,4.35);windowUnit(-10.72,1.25,5.7,Math.PI/2);
 // Bedroom partition and a real hallway door opening, with a low front wall for visibility.
 wall(.18,3.2,9.1,1.6,-3.45,'#b7c0b2');wall(.85,1.15,.18,2.025,1.1,'#b7c0b2');wall(6.15,1.15,.18,7.725,1.1,'#b7c0b2');
 function doorway(x,z,width,rotation=0,door=false){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;room.add(group);for(const xx of [-width/2,width/2])box(.13,2.7,.22,'#e3d4b8',xx,1.62,0,{},group);box(width+.13,.15,.22,'#e3d4b8',0,3,0,{},group);box(width,.045,.28,'#c8a779',0,.32,0,{},group);if(door){const panel=box(width-.15,2.58,.12,'#2d4852',0,1.59,0,{},group);panel.userData.homeAction='door';panel.material=panel.material.clone();panel.material.transparent=true;occluders.push(panel);box(.07,.07,.15,'#d8b571',width*.31,1.45,.12,{metalness:.65,roughness:.35},group);}}
 doorway(3.55,1.1,2.2);wall(.18,1.2,2.3,6.6,2.25,'#90aba4');wall(.18,1.2,2.4,6.6,6.8,'#90aba4');doorway(6.6,4.5,2.2,Math.PI/2);doorway(3.8,7.96,1.8,0,true);const addressLabel=label('04',.75,.3,3.8,2.24,8.05,0,'#e6c784','#2d4852');
 // The apartment's garage lift changes to the downstairs car bay.
 for(const x of [-.78,1.18])box(.14,2.95,.2,'#6b9297',x,1.74,7.78);
 box(2.1,.16,.2,'#93d7c4',.2,3.24,7.78,{emissive:'#6dbba8',emissiveIntensity:.35});
 const garageDoor=box(1.8,2.7,.1,'#314e5b',.2,1.68,7.82);garageDoor.userData.homeAction='garage';
 box(.025,2.7,.13,'#8ba2a3',.2,1.68,7.74);label('GARAGE / B1',1.6,.36,.2,2.68,7.7,Math.PI,'#dbedca','#25424f');
 const garageCall=box(.2,.37,.08,'#9bbaae',1.5,1.6,7.77);garageCall.userData.homeAction='garage';
 // A longer fitted kitchen, with a four-seat dining area and wide aisles.
 const kitchen={wood:'#365963',woodDark:'#29434b',metal:'#d0d6d1'};
 prop('kitchenFridge',-9.75,-7.22,1.25,{height:2.65,colors:{wood:'#b9c5c5'}});
 for(const [name,x]of [['kitchenStove',-8.3],['kitchenSink',-7],['kitchenCabinetDrawer',-5.7],['kitchenCabinetDrawer',-4.4],['kitchenCabinetDrawer',-3.1],['kitchenCabinetDrawer',-1.8]])prop(name,x,-7.2,1.27,{colors:kitchen});
 for(let row=0;row<3;row++)for(let col=0;col<25;col++)box(.29,.2,.035,(row+col)%3?'#e2dfcd':'#b5c8bc',-8.95+col*.31,1.8+row*.22,-7.865);
 prop('hoodModern',-8.3,-7.42,1.27,{y:2.35,collision:false});for(const x of [-7,-5.7,-4.4,-3.1,-1.8]){prop('kitchenCabinetUpperDouble',x,-7.57,1.27,{y:2.18,collision:false,colors:kitchen});box(1.16,.025,.18,'#ffe8af',x,2.17,-7.37,{emissive:'#ffd29c',emissiveIntensity:1.9});}
 prop('kitchenCoffeeMachine',-1.85,-7.06,.48,{y:1.63,collision:false});prop('plantSmall1',-4.5,-7.18,.31,{y:1.63,collision:false});
 const dining=prop('tableRound',-5,-3.3,2.4,{height:1.3});for(const [x,z,rotation]of [[-6.65,-3.3,Math.PI/2],[-3.35,-3.3,-Math.PI/2],[-5,-5.05,0],[-5,-1.55,Math.PI]])prop('chairModernCushion',x,z,.67,{height:1.1,rotation});prop('plantSmall1',-5,-3.3,.28,{y:dining.top,collision:false});
 // Spacious lounge: the original furniture retains its proportions.
 box(8.2,.025,6.2,'#a5ad9a',-6,.32,3.7);box(7.87,.012,5.87,'#586e71',-6,.34,3.7);for(let i=0;i<10;i++)box(7.6,.006,.025,'#8b9e91',-6,.349,1.44+i*.49);
 prop('loungeDesignSofaCorner',-7.5,3.4,3.6,{height:1.3,rotation:Math.PI,colors:{carpetBlue:'#456d85'}});
 const coffee=prop('tableCoffeeGlass',-4.6,3.7,1.65,{height:.65});prop('books',-4.8,3.7,.52,{y:coffee.top,collision:false});prop('radio',-4.35,3.77,.32,{y:coffee.top,collision:false});
 prop('loungeChairRelax',-7.9,.05,1.1,{height:1.3,rotation:.35,colors:{carpet:'#b67755'}});prop('lampRoundFloor',-9.85,5.05,.56,{height:2.5});light('#ffc483',24,11,-9.85,2.2,5.05);
 const media=prop('cabinetTelevision',-10.26,1,2.25,{rotation:Math.PI/2,height:.95});const tv=prop('televisionModern',-10.24,1,1.62,{rotation:Math.PI/2,y:media.top,collision:false});prop('pottedPlant',-9.95,-3.65,.7,{height:1.8});
 // Larger bedroom with a clear work area and room to walk around the bed.
 box(6.3,.025,5,'#a9aa8d',6.65,.315,-5.5);box(6.04,.015,4.75,'#babc9f',6.65,.335,-5.5);
 prop('bedDouble',6.55,-6.3,2.8,{colors:{carpet:'#587d75',wood:'#6b5143',carpetWhite:'#f1ead8'}});
 for(const x of [4.59,8.51]){const cabinet=prop('cabinetBedDrawer',x,-7.22,.75,{height:.85,colors:{wood:'#856b50'}});prop('lampRoundTable',x,-7.22,.42,{y:cabinet.top,height:.58,collision:false});}
 for(const z of [-2,0])prop('bookcaseClosedDoors',10.15,z,1.45,{height:2.8,rotation:-Math.PI/2,colors:{wood:'#859180',woodDark:'#55685e'}});
 const desk=prop('desk',2.42,-1.8,2.05,{height:1.2,rotation:Math.PI/2,colors:{wood:'#aa8761'}});prop('laptop',2.45,-1.95,.64,{y:desk.top,rotation:Math.PI/2,collision:false});prop('chairDesk',3.44,-1.8,.66,{height:1.2,rotation:Math.PI/2,collision:false});prop('books',2.44,-1.1,.4,{y:desk.top,rotation:Math.PI/2,collision:false});prop('pottedPlant',10.1,-7.2,.7,{height:1.8});
 // Bathroom and entry gain wider circulation and proper separation between fixtures.
 for(let row=0;row<3;row++)for(let col=0;col<12;col++)box(.305,.275,.026,(row+col)%2?'#becdc1':'#9db6ac',6.87+col*.31,.47+row*.285,1.212);
 prop('showerRound',9.8,2.35,1.6,{height:2.7,rotation:Math.PI});prop('bathroomSinkSquare',7.5,1.75,1.02,{height:1.2});prop('bathroomMirror',7.5,1.29,.92,{y:1.63,height:1.03,collision:false});prop('toiletSquare',10.05,6.82,.9,{height:1.15,rotation:-Math.PI/2});prop('washer',7.45,7.25,.98,{height:1.2});box(.7,.06,.42,'#dfd6b9',7.45,1.45,7.25);box(.63,.065,.38,'#95aea0',7.45,1.51,7.25);
 prop('rugDoormat',3.8,7.1,1.8,{collision:false,colors:{carpet:'#7c705e'}});prop('coatRackStanding',6,7.38,.55,{height:2.25});prop('sideTable',2.15,3.1,.65,{height:.9});label('LAST EXIT',.6,.16,2.15,1.2,3.03,0,'#ddc294','#564c43');prop('pottedPlant',5.8,1.95,.65,{height:1.7});
 for(const [x,y,z,w,h,c]of [[.2,2.25,-7.865,.9,1.15,'#596c76'],[3.5,2.62,-7.865,.7,.9,'#ba996a']]){box(w+.1,h+.1,.06,'#665342',x,y,z);box(w,h,.025,c,x,y,z+.045);box(w*.55,.035,.026,'#dec79e',x,y-.1,z+.064);}
 // Activity state keeps a walkable return position even while sitting or lying down.
 let activity=null,routePoints=[],routeTarget=null,arrived=null,notice=null,viewMode='room',viewport={width:1280,height:800},zoom=1,tvOn=life.tvOn===true;
 const completed=new Set(Array.isArray(life.completed)?life.completed.filter(id=>['sofa','coffee','shower','bed'].includes(id)):[]);
 const avatar=new THREE.Group();avatar.position.set(position.x,.36,position.z);scene.add(avatar);let character,mixer,actions={},currentAnimation='';
 function playAnimation(name){name=actions[name]?name:'idle';if(currentAnimation===name)return;for(const action of Object.values(actions))action.fadeOut(.15);actions[name]?.reset().fadeIn(.15).play();currentAnimation=name;}
 function setCharacter(template){if(mixer){mixer.stopAllAction();mixer.uncacheRoot(character);avatar.remove(character);}character=template.scene.clone(true);character.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(character),s=b.getSize(new THREE.Vector3()),scale=1.8/s.y;character.scale.setScalar(scale);character.position.y=-b.min.y*scale;avatar.add(character);mixer=new THREE.AnimationMixer(character);actions={};for(const name of ['static','idle','walk','sit','interact-right','holding-right','emote-yes']){const clip=template.animations.find(a=>a.name===name);if(clip)actions[name]=mixer.clipAction(clip);}currentAnimation='';playAnimation('idle');}
 setCharacter(templates.suit);
 const interactive=[];const mappings={laptop:'laptop',desk:'laptop',bookcaseClosedDoors:'wardrobe',bedDouble:'bed',kitchenCoffeeMachine:'coffee',televisionModern:'tv',cabinetTelevision:'tv',loungeDesignSofaCorner:'sofa',showerRound:'shower',rugDoormat:'door'};
 for(const prop of furniture){const id=mappings[prop.name];if(id){prop.group.userData.homeAction=id;interactive.push(prop.group);}}
 room.traverse(o=>{if(['door','garage'].includes(o.userData.homeAction)&&!interactive.includes(o))interactive.push(o);});
 for(const spot of HOME_SPOTS){const ring=new THREE.Mesh(new THREE.RingGeometry(.28,.34,32),new THREE.MeshBasicMaterial({color:'#aeeed4',transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(spot.x,.37,spot.z);scene.add(ring);const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.1),new THREE.MeshBasicMaterial({color:'#ffdb96'}));diamond.position.set(spot.x,2.2,spot.z);scene.add(diamond);hotspots.push({...spot,ring,diamond});}
 const radius=.23;
 function blocked(x,z){return !Number.isFinite(x)||!Number.isFinite(z)||x<HOME_BOUNDS.minX||x>HOME_BOUNDS.maxX||z<HOME_BOUNDS.minZ||z>HOME_BOUNDS.maxZ||colliders.some(b=>x+radius>b.x-b.w/2&&x-radius<b.x+b.w/2&&z+radius>b.z-b.d/2&&z-radius<b.z+b.d/2);}
 function stopActivity(done=false){if(!activity)return;const old=activity;activity=null;avatar.position.set(old.origin.x,.36,old.origin.z);character.rotation.x=0;character.visible=true;playAnimation('idle');if(done){completed.add(old.id);notice={id:old.id,text:{coffee:'COFFEE READY. TAKE YOUR TIME.',shower:'FRESHENED UP.',bed:'WELL RESTED. PROGRESS SAVED.',sofa:'A LITTLE TIME OFF.'}[old.id]};}}
 function setPosition(p){stopActivity();routePoints=[];routeTarget=null;arrived=null;avatar.position.set(p.x,.36,p.z);if(blocked(p.x,p.z))avatar.position.set(HOME_SPAWN.x,.36,HOME_SPAWN.z);}
 setPosition(position);
 const camera=new THREE.PerspectiveCamera(44,1,.1,140);
 const fpShell=new THREE.Group();fpShell.name='first-person-room-shell';fpShell.visible=false;scene.add(fpShell);
 for(const wallMesh of occluders){const {width,height,depth}=wallMesh.geometry.parameters;if(height<1.3&&wallMesh.position.z>-7.9&&wallMesh.position.x>-10.7){const bottom=wallMesh.position.y+height/2,extraHeight=3.6-bottom;const m=new THREE.Mesh(new THREE.BoxGeometry(width,extraHeight,depth),wallMesh.material.clone());m.position.set(wallMesh.position.x,bottom+extraHeight/2,wallMesh.position.z);m.receiveShadow=true;fpShell.add(m);}}
 const ceiling=box(21.6,.14,16,'#d2d3c4',0,3.68,0,{},fpShell);ceiling.castShadow=false;box(1.8,.55,.2,'#c3c5b8',3.8,3.35,8,{},fpShell);
 const walkingView=createWalkingView(camera,avatar,{eyeHeight:()=>activity?.id==='bed'?.3:activity?.id==='sofa'?.95:1.62});
 function setFirstPerson(value){fpShell.visible=!!value;viewMode=value?'first':'room';walkingView.set(value);resize(viewport.width,viewport.height);}
 const tvCanvas=document.createElement('canvas');tvCanvas.width=512;tvCanvas.height=256;const tvContext=tvCanvas.getContext('2d'),tvTexture=new THREE.CanvasTexture(tvCanvas);tvTexture.colorSpace=THREE.SRGBColorSpace;const broadcast=new THREE.Mesh(new THREE.PlaneGeometry(1.39,.72),new THREE.MeshBasicMaterial({map:tvTexture}));broadcast.rotation.y=Math.PI/2;broadcast.position.set(-10.065,media.top+.65,1);room.add(broadcast);let tvFrame=-1;
 const tvLight=light('#8bc9ff',0,5,-9.6,1.9,1),tvMaterials=[];
 tv.group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.color.getHSL({}).l<.3)tvMaterials.push(m);});
 function setTV(on){tvOn=on;broadcast.visible=on;tvLight.intensity=tvOn?10:0;for(const m of tvMaterials){m.emissive.set(tvOn?'#66a6d1':'#000000');m.emissiveIntensity=tvOn?.9:0;}}
 setTV(tvOn);
 const steam=new THREE.Group();room.add(steam);for(let i=0;i<5;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.055,5,4),new THREE.MeshBasicMaterial({color:'#e0e9e9',transparent:true,opacity:.3,depthWrite:false}));puff.position.set(-1.85,2.02+i*.12,-6.97);steam.add(puff);}steam.visible=false;
 const water=new THREE.Group();room.add(water);for(let i=0;i<24;i++){const drop=new THREE.Mesh(new THREE.BoxGeometry(.018,.12,.018),new THREE.MeshBasicMaterial({color:'#b8efff',transparent:true,opacity:.65}));drop.position.set(9.8+(i%6-2.5)*.11,1+(i%7)*.2,2.35+(Math.floor(i/6)-1.5)*.13);water.add(drop);}water.visible=false;
 function interact(id){if(activity){stopActivity(activity.id==='sofa');return 'BACK ON YOUR FEET.';}if(id==='tv'){setTV(!tvOn);return tvOn?'TV ON · THE CITY CAN WAIT.':'TV OFF';}
  const specs={sofa:{title:'WATCHING TV',seconds:0,pose:'sit'},coffee:{title:'MAKING COFFEE',seconds:4,pose:'interact-right'},shower:{title:'FRESHENING UP',seconds:5,pose:'idle'},bed:{title:'RESTING',seconds:5,pose:'static'}};const spec=specs[id];if(!spec)return null;
  activity={...spec,id,elapsed:0,origin:{x:avatar.position.x,z:avatar.position.z}};routePoints=[];routeTarget=null;playAnimation(spec.pose);
  if(id==='sofa'){setTV(true);avatar.position.set(-7.2,.72,2.28);avatar.rotation.y=-Math.PI/2;}
  if(id==='bed'){avatar.position.set(6.55,1.18,-5.28);avatar.rotation.y=0;character.rotation.x=-Math.PI/2;}
  if(id==='coffee'){avatar.rotation.y=Math.PI;}
  if(id==='shower'){avatar.position.set(9.8,.4,2.35);avatar.rotation.y=Math.PI;}
  return {sofa:'FEET UP. E OR MOVE TO STAND.',coffee:'COFFEE’S ON.',shower:'SHOWER ON.',bed:'RESTING. YOUR PROGRESS IS SAVED.'}[id];
 }
 function segmentHits(a,b,r){let min=0,max=1;for(const axis of ['x','z']){const delta=b[axis]-a[axis],half=(axis==='x'?r.w:r.d)/2;if(Math.abs(delta)<.00001){if(a[axis]<r[axis]-half||a[axis]>r[axis]+half)return false;}else{let lo=(r[axis]-half-a[axis])/delta,hi=(r[axis]+half-a[axis])/delta;if(lo>hi)[lo,hi]=[hi,lo];min=Math.max(min,lo);max=Math.min(max,hi);if(min>max)return false;}}return true;}
 function canInteract(id,p=avatar.position){const h=hotspots.find(h=>h.id===id);return !!h&&Math.hypot(p.x-h.x,p.z-h.z)<1.05&&!colliders.some(b=>b.name==='wall'&&segmentHits(p,h,b));}
 function nearest(){return hotspots.filter(h=>canInteract(h.id)).sort((a,b)=>Math.hypot(avatar.position.x-a.x,avatar.position.z-a.z)-Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z))[0]||null;}
 // Find a walkable route through the real openings, never through furniture.
 function walkTo(id,point=null){stopActivity();const target=id?hotspots.find(h=>h.id===id):point;if(!target)return false;const origin={x:avatar.position.x,z:avatar.position.z},nodes=[{...origin,parent:-1,gx:0,gz:0}],seen=new Set(['0,0']);let found=-1;
  for(let i=0;i<nodes.length&&i<12000;i++){const p=nodes[i];if(Math.hypot(p.x-target.x,p.z-target.z)<(id ? .55 : .2)&&(!id||canInteract(id,p))){found=i;break;}
   for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const gx=p.gx+dx,gz=p.gz+dz,key=gx+','+gz,x=origin.x+gx*.2,z=origin.z+gz*.2;if(seen.has(key)||blocked(x,z)||blocked((x+p.x)/2,(z+p.z)/2))continue;seen.add(key);nodes.push({x,z,gx,gz,parent:i});}
  }if(found<0)return false;const path=[];for(let i=found;i>0;i=nodes[i].parent)path.unshift({x:nodes[i].x,z:nodes[i].z});routePoints=path;routeTarget=id||null;arrived=path.length?null:id;return true;
 }
 const picker=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-.34),pickPoint=new THREE.Vector3();
 function clickAt(x,y){scene.updateMatrixWorld(true);picker.setFromCamera(new THREE.Vector2(x,y),camera);const hits=picker.intersectObjects(interactive,true);if(hits.length){let group=hits[0].object;while(group&&!group.userData.homeAction)group=group.parent;if(group?.userData.homeAction)return walkTo(group.userData.homeAction);}
  if(picker.ray.intersectPlane(ground,pickPoint)&&!blocked(pickPoint.x,pickPoint.z))return walkTo(null,pickPoint);return false;
 }
 // The default camera is close enough to fill the viewport with the apartment.
 // The floor-plan view is a deliberate secondary view, with no reserved side gutter.
 room.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(room),corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
 const roomLook=new THREE.Vector3(),desiredEye=new THREE.Vector3(),ray=new THREE.Ray(),hit=new THREE.Vector3();
 function positionRoomCamera(smooth){const focus=avatar.position,wide=viewport.width/viewport.height>1.9?.88:1;const narrow=viewport.width/viewport.height<.85;roomLook.set(THREE.MathUtils.clamp(focus.x,narrow?-10:-7.7,narrow?10:7.75),.85,THREE.MathUtils.clamp(focus.z,-5.7,narrow?7.1:4.4));desiredEye.set(roomLook.x+5.1*zoom*wide,roomLook.y+6.65*zoom*wide,roomLook.z+7.0*zoom*wide);camera.position.lerp(desiredEye,smooth);camera.lookAt(roomLook);camera.updateMatrixWorld();}
 function resize(width,height){viewport={width,height};camera.aspect=width/height;camera.clearViewOffset();camera.fov=44;camera.updateProjectionMatrix();if(walkingView.enabled){walkingView.set(true);return;}if(viewMode==='room'){if(width<=650)camera.setViewOffset(width,height,0,-height*.16,width,height);positionRoomCamera(1);return;}
  let distance=.6;for(let i=0;i<9;i++){camera.position.set(15.5,19.5,22).multiplyScalar(distance);camera.lookAt(0,1,0);camera.updateMatrixWorld();const points=corners.map(v=>v.clone().project(camera)),ratio=Math.max((Math.max(...points.map(v=>v.x))-Math.min(...points.map(v=>v.x)))/1.9,(Math.max(...points.map(v=>v.y))-Math.min(...points.map(v=>v.y)))/1.76);if(ratio<=1)break;distance*=ratio*1.01;}
  camera.far=Math.max(140,camera.position.length()+35);camera.updateProjectionMatrix();
 }
 function toggleView(){fpShell.visible=false;walkingView.set(false);viewMode=viewMode==='overview'?'room':'overview';resize(viewport.width,viewport.height);return viewMode;}
 function zoomBy(delta){fpShell.visible=false;walkingView.set(false);viewMode='room';zoom=THREE.MathUtils.clamp(zoom+delta,.7,1.2);resize(viewport.width,viewport.height);}
 function update(dt,input={},step=6,time=0){const before=avatar.position.clone(),manual=!!(input.right||input.left||input.down||input.up);if(manual){if(activity)stopActivity(activity.id==='sofa');routePoints=[];routeTarget=null;arrived=null;}
  if(activity){activity.elapsed+=dt;if(activity.seconds&&activity.elapsed>=activity.seconds)stopActivity(true);}
  const direction=walkingView.movement(input,dt);let dx=direction.x,dz=direction.z,distance=3.4*dt;
  if(!manual&&!activity&&routePoints.length){while(routePoints.length&&Math.hypot(routePoints[0].x-avatar.position.x,routePoints[0].z-avatar.position.z)<.025)routePoints.shift();if(routePoints.length){dx=routePoints[0].x-avatar.position.x;dz=routePoints[0].z-avatar.position.z;distance=Math.min(distance,Math.hypot(dx,dz));}else{arrived=routeTarget;routeTarget=null;}}
  const len=Math.hypot(dx,dz);if(!activity&&len){const x=dx/len*distance,z=dz/len*distance;if(!blocked(avatar.position.x+x,avatar.position.z))avatar.position.x+=x;if(!blocked(avatar.position.x,avatar.position.z+z))avatar.position.z+=z;avatar.rotation.y=Math.atan2(dx,dz);}
  const moved=before.distanceTo(avatar.position);if(!activity)playAnimation(moved>.0001?'walk':'idle');mixer.update(dt);
  const near=nearest();for(const h of hotspots){const tutorial=step===1?h.id==='laptop':step===2?h.id==='door':false,focused=tutorial||near===h||routeTarget===h.id;h.diamond.visible=focused&&!activity;h.ring.material.opacity=focused?.7:.12;h.diamond.position.y=2.2+Math.sin(time*2)*.07;h.diamond.rotation.y=time;}
  if(walkingView.enabled)walkingView.update();else if(viewMode==='room')positionRoomCamera(1-Math.exp(-dt*8));const aim=new THREE.Vector3(avatar.position.x,1.15,avatar.position.z);ray.set(camera.position,aim.clone().sub(camera.position).normalize());for(const mesh of occluders){mesh.updateWorldMatrix(true,false);const b=new THREE.Box3().setFromObject(mesh),intersects=ray.intersectBox(b,hit),fade=viewMode==='room'&&intersects&&hit.distanceTo(camera.position)<aim.distanceTo(camera.position)-.2;mesh.material.opacity=walkingView.enabled?1:THREE.MathUtils.damp(mesh.material.opacity,fade?.08:1,9,dt);mesh.material.depthWrite=mesh.material.opacity>.98;mesh.castShadow=!fade;}
  steam.visible=activity?.id==='coffee';steam.children.forEach((p,i)=>{p.position.y=1.98+((time*.3+i*.13)%.55);p.material.opacity=Math.max(0,.35-(p.position.y-1.98)*.5);});water.visible=activity?.id==='shower';water.children.forEach((p,i)=>{p.position.y=.7+((i*.091-time*1.65)%1.7+1.7)%1.7;});if(tvOn){for(const m of tvMaterials)m.emissiveIntensity=.8+Math.sin(time*2)*.15;const frame=Math.floor(time*8);if(frame!==tvFrame){tvFrame=frame;const c=tvContext;c.fillStyle='#142638';c.fillRect(0,0,512,256);c.fillStyle='#9be1cd';c.fillRect(0,0,512,44);c.font='bold 23px monospace';c.fillStyle='#182e36';c.fillText('LAST EXIT TV / LIVE',18,30);for(let i=0;i<16;i++){const h=25+(i*23%85);c.fillStyle=i%2?'#355667':'#456879';c.fillRect(i*34,200-h,28,h);}c.fillStyle='#ffe3a0';c.font='bold 32px monospace';c.fillText(['CITY AFTER DARK','TAKE THE LONG WAY','THE NIGHT IS YOURS'][Math.floor(time/6)%3],20,96);c.fillStyle='#c4e0d8';c.font='20px monospace';c.fillText('20:46  /  DOWNTOWN',20,237);c.fillStyle='#f3c68b';c.fillRect((time*55)%560-40,185,38,13);tvTexture.needsUpdate=true;}}
  return activity||before.y!==.36?0:moved;
 }
 const homeLayers=[new THREE.Group(),new THREE.Group(),new THREE.Group()];
 homeLayers.forEach((g,i)=>{g.name='Home upgrade '+(i+1);room.add(g);g.visible=false;});
 const addUpgradeProp=(level,name,x,z,width,options={})=>{const p=prop(name,x,z,width,{...options,collision:false});homeLayers[level-1].add(p.group);};
 const rug=box(7.84,.018,5.82,'#6c8c45',-6,.365,3.7,{},homeLayers[0]);
 for(let n=0;n<10;n++)box(7.6,.006,.065,n%2?'#c5d98a':'#94b262',-6,.378,1.1+n*.57,{},homeLayers[0]);
 addUpgradeProp(1,'pottedPlant',-10.12,5.65,.75,{height:1.65});addUpgradeProp(1,'pottedPlant',9.75,-6.8,.7,{height:1.5});
 box(3.4,.13,.6,'#94693e',-6.5,2.35,7.65,{},homeLayers[1]);
 addUpgradeProp(2,'books',-7.35,7.55,.5,{y:2.42});addUpgradeProp(2,'radio',-6.3,7.55,.6,{y:2.42});addUpgradeProp(2,'plantSmall1',-5.45,7.6,.45,{y:2.42});
 box(3.25,.04,.09,'#ffdf87',-6.5,2.27,7.4,{emissive:'#ffd780',emissiveIntensity:1.4},homeLayers[1]);
 box(2.1,2.65,.04,'#b69958',9.55,1.91,-7.87,{metalness:.28,roughness:.48},homeLayers[2]);
 for(let n=0;n<8;n++)box(.045,2.65,.045,'#e0c77d',8.65+n*.25,1.91,-7.83,{},homeLayers[2]);
 const trophy=new THREE.Mesh(new THREE.CylinderGeometry(.23,.17,.34,6),mat('#d9b456',{metalness:.65,roughness:.35}));trophy.position.set(-6.1,2.82,7.55);homeLayers[2].add(trophy);box(.46,.12,.4,'#2e4431',-6.1,2.49,7.55,{},homeLayers[2]);box(.09,.18,.09,'#d9b456',-6.1,2.61,7.55,{},homeLayers[2]);
 let homeLevel=0;
 function setHomeLevel(level,unit){homeLevel=Math.max(0,Math.min(3,Number(level)||0));homeLayers.forEach((g,i)=>g.visible=homeLevel>i);floor.material.color.set(homeLevel>=3?'#d6c4a7':'#a28161');if(unit){const c=addressLabel.material.map.image,ctx=c.getContext('2d');ctx.fillStyle='#2d4852';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#e6c784';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 80px monospace';ctx.fillText(String(unit).padStart(3,'0'),c.width/2,c.height/2,c.width-30);addressLabel.material.map.needsUpdate=true;}}
 return {scene,camera,avatar,walkingView,setHomeLevel,homeLayers,get homeLevel(){return homeLevel;},setFirstPerson,look:walkingView.look,colliders,hotspots,furniture,update,nearest,canInteract,setPosition,blocked,resize,setCharacter,toggleView,zoomBy,interact,walkTo,clickAt,stopActivity,
  takeArrival(){const id=arrived;arrived=null;return id;},takeNotice(){const value=notice;notice=null;return value;},get activity(){return activity;},get navigating(){return routePoints.length>0;},get savedPosition(){return activity?{...activity.origin}:{x:avatar.position.x,z:avatar.position.z};},get lifeState(){return {tvOn,completed:[...completed]};},get viewMode(){return viewMode;},get roomName(){return homeRoom(avatar.position.x,avatar.position.z);}};
}
