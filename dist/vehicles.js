import * as THREE from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';

// Real scene geometry, shared by the street cars and the garage turntable.
const geometries=new Map();
function rounded(w,h,d,r=.06){
 const key=[w,h,d,r].join(':');if(geometries.has(key))return geometries.get(key);
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const bevel=Math.min(r*.65,d/5),g=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:4});g.translate(0,0,-d/2+bevel);g.computeVertexNormals();g.userData.shared=true;geometries.set(key,g);return g;
}
function mat(color,roughness=.45,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
function part(parent,w,h,d,m,x,y,z,r=.035){const o=new THREE.Mesh(rounded(w,h,d,Math.min(r,w/4,h/4)),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function profileShape(parent,points,width,m){const shape=new THREE.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:width-.08,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.04,bevelThickness:.04,curveSegments:4});g.translate(0,0,-(width-.08)/2);g.rotateY(Math.PI/2);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function pane(parent,pts,m){const g=new THREE.BufferGeometry(),v=[];for(const i of [0,1,2,0,2,3])v.push(...pts[i]);g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);parent.add(mesh);return mesh;}
function batchParts(parent){
 const batches=new Map();for(const mesh of [...parent.children]){if(!mesh.isMesh)continue;mesh.updateMatrix();let geo=mesh.geometry.clone();if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}geo.applyMatrix4(mesh.matrix);geo.deleteAttribute('uv');if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(geo);parent.remove(mesh);if(!mesh.geometry.userData.shared)mesh.geometry.dispose();}
 for(const [material,geos]of batches){const merged=mergeGeometries(geos,false);for(const g of geos)g.dispose();merged.userData.shared=false;const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);}
}
export function makeVehicle(model,scale=1.7,paint='#ffc23d'){
 const van=model==='getaway-van',police=model==='police-car',race=model==='racer';
 const group=new THREE.Group(),root=new THREE.Group(),body=new THREE.Group();root.scale.setScalar(scale);root.add(body);group.add(root);
 const coating=new THREE.MeshPhysicalMaterial({color:police?'#e6edf2':paint,metalness:.34,roughness:.28,clearcoat:1,clearcoatRoughness:.16});
 const dark=mat('#111d2b',.43,.28),rubber=mat('#11151c',.9),chrome=mat('#c0cedc',.23,.8),glass=mat('#143649',.16,.48,{side:THREE.DoubleSide}),lamp=mat('#fff2c5',.2,.1,{emissive:'#ffe4a5',emissiveIntensity:1.7}),tail=mat('#fc394c',.25,.1,{emissive:'#ff1835',emissiveIntensity:.7}),stripe=mat(police?'#122b45':'#f1f1e6',.4,.12);
 const len=van?2.85:race?2.88:2.8,width=race?1.58:1.48;
 part(body,width,.46,len,coating,0,.57,0,.12);part(body,width+.025,.13,len-.03,dark,0,.35,0,.035);
 if(van){
  profileShape(body,[[-1.28,.72],[-1.24,1.52],[.7,1.52],[1.28,1.05],[1.31,.72]],1.37,coating);
  pane(body,[[-.60,1.46,.75],[.60,1.46,.75],[.62,1.06,1.25],[-.62,1.06,1.25]],glass);
  for(const side of [-1,1]){
   pane(body,[[side*.703,1.05,1.17],[side*.703,1.46,.66],[side*.703,1.46,-.12],[side*.703,1.05,-.12]],glass);
   part(body,.018,.13,2.48,stripe,side*.758,.8,-.025,.008);
   part(body,.016,.36,.017,dark,side*.729,1.04,-.21,.003);
   part(body,.035,.045,.16,chrome,side*.756,.94,-.28,.01);
   part(body,.035,.045,.17,chrome,side*.756,.95,-.82,.01);
  }
  part(body,1.18,.065,1.3,dark,0,1.61,-.43,.025);
  for(const z of [-.95,.08])part(body,1.42,.055,.05,chrome,0,1.68,z,.013);
  pane(body,[[-.56,1.08,-1.285],[.56,1.08,-1.285],[.56,1.4,-1.26],[-.56,1.4,-1.26]],glass);
  part(body,.018,.66,.027,chrome,0,1.08,-1.32,.005);
 }else{
  profileShape(body,[[-1.29,.72],[-.75,.85],[-.43,1.22],[.36,1.22],[.84,.79],[1.31,.71]],1.32,coating);
  pane(body,[[-.55,1.20,.39],[.55,1.20,.39],[.61,.82,.83],[-.61,.82,.83]],glass);
  pane(body,[[.56,1.2,-.45],[-.56,1.2,-.45],[-.62,.87,-.76],[.62,.87,-.76]],glass);
  for(const side of [-1,1]){
   pane(body,[[side*.683,.84,.69],[side*.683,1.17,.31],[side*.683,1.17,-.39],[side*.683,.86,-.66]],glass);
   part(body,.025,.32,.028,dark,side*.699,1.02,-.19,.004);
   part(body,.028,.045,.15,chrome,side*.758,.76,-.3,.012);
   part(body,.055,.075,1.18,coating,side*(width/2+.035),.35,0,.02);
  }
  // Split racing stripes follow the hood, roof, and rear deck.
  if(race)for(const x of [-.2,.2]){part(body,.13,.014,.47,stripe,x,.819,1.08,.003);part(body,.13,.012,.67,stripe,x,1.269,-.035,.003);}
  if(race||police){for(const x of [-.5,.5])part(body,.07,.2,.08,dark,x,.88,-1.16,.008);part(body,1.65,.075,.27,police?dark:coating,0,1,-1.15,.028);}
 }
 // Recessed lamps, chrome bumper, grille, mirrors, exhaust and plate.
 part(body,width+.06,.12,.14,chrome,0,.48,len/2+.025,.035);
 part(body,width+.04,.11,.12,chrome,0,.45,-len/2-.02,.03);
 part(body,.55,.19,.06,dark,0,.67,len/2+.025,.018);
 for(let i=-2;i<=2;i++)part(body,.45,.012,.013,chrome,0,.67+i*.028,len/2+.064,.003);
 for(const x of [-.52,.52]){
  part(body,.29,.21,.075,dark,x,.7,len/2+.006,.045);
  part(body,.22,.125,.083,lamp,x,.705,len/2+.025,.04);
  part(body,.27,.15,.06,tail,x,.65,-len/2-.013,.028);
  part(body,.20,.095,.055,chrome,Math.sign(x)*.79,van?1.04:.91,.59,.02);
 }
 part(body,.34,.105,.024,mat('#e6edf1'),0,.49,-len/2-.094,.012);
 part(body,.10,.08,.2,chrome,-.44,.29,-len/2-.045,.03);
 const wheels=[];
 for(const side of [-1,1])for(const z of [-.89,.91]){
  const pivot=new THREE.Group(),spin=new THREE.Group();pivot.position.set(side*(width/2-.01),.31,z);pivot.add(spin);root.add(pivot);
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,24,1),rubber);tire.rotation.z=Math.PI/2;tire.castShadow=true;spin.add(tire);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.225,.225,.235,16),chrome);rim.rotation.z=Math.PI/2;spin.add(rim);
  const inset=new THREE.Mesh(new THREE.CylinderGeometry(.178,.178,.239,16),dark);inset.rotation.z=Math.PI/2;spin.add(inset);
  for(let n=0;n<5;n++){const a=n*Math.PI*2/5;const spoke=part(spin,.248,.035,.15,chrome,0,Math.sin(a)*.097,Math.cos(a)*.097,.008);spoke.rotation.x=-a;}
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.253,12),chrome);hub.rotation.z=Math.PI/2;spin.add(hub);
  wheels.push({pivot,spin,front:z>0});
  // A thin arch lip follows the wheel without covering the tire.
  const arch=new THREE.Mesh(new THREE.TorusGeometry(.345,.033,6,24,Math.PI),coating);arch.rotation.y=Math.PI/2;arch.position.set(side*(width/2+.033),.31,z);body.add(arch);
 }
 const policeLights=[];
 if(police){
  part(body,1.06,.055,.23,dark,0,1.34,0,.02);
  for(const side of [-1,1]){const m=mat(side<0?'#fa3f65':'#43bfff',.2,0,{emissive:side<0?'#ff1745':'#268cff',emissiveIntensity:2});const l=part(body,.42,.12,.2,m,side*.26,1.41,0,.04);policeLights.push(l);}
  for(const x of [-.748,.748])part(body,.017,.29,1.25,dark,x,.59,.05,.01);
 }
 const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.8,4.2),new THREE.MeshBasicMaterial({color:'#ffedbd',transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide}));beam.rotation.x=-Math.PI/2;beam.position.set(0,.022,len/2+2.1);root.add(beam);
 batchParts(body);for(const wheel of wheels)batchParts(wheel.spin);
 return{group,root,body,wheels,tail,policeLights,pitch:0,roll:0};
}
export function animateVehicle(view,car,dt){
 view.group.position.set(car.x,.04+car.y,car.z);view.group.rotation.y=car.heading;
 const smooth=dt?1-Math.exp(-dt*11):1;
 view.pitch+=(THREE.MathUtils.clamp((car.acceleration||0)*-.0017-car.vy*.025,-.12,.12)-view.pitch)*smooth;
 view.roll+=(THREE.MathUtils.clamp((car.yawRate||0)*car.speed*.003,-.095,.095)-view.roll)*smooth;
 view.body.rotation.set(view.pitch,0,view.roll);
 for(const w of view.wheels){w.pivot.rotation.y=w.front?-(car.steering||0)*.48:0;w.spin.rotation.x=(car.wheelTravel||0)/(.32*view.root.scale.x);}
 view.tail.emissiveIntensity=car.braking?3.5:.65;
 view.policeLights.forEach((l,i)=>{l.material.emissiveIntensity=(Math.sin((car.wheelTravel||0)*2+i*Math.PI)>0)?3:.4;});
}
