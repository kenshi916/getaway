import * as THREE from './assets/three.module.js';
export function buildMotorExterior(parent,{block,ground,label,tree}){
 const g=new THREE.Group();g.name='Rae’s Motor Club';g.position.set(-108,0,36);g.rotation.y=Math.PI/2;parent.add(g);
 const blue='#284b60',cream='#d8d2b6',orange='#efab48';
 const shell=block(25.5,6,25.5,blue,0,3.25,0,g);block(26,.28,26,cream,0,6.4,0,g);block(24,.3,23,'#536567',0,6.65,-.4,g);
 for(const y of [1,5.7])block(25.8,.18,25.8,orange,0,y,0,g);
 const doors=[];
 for(const x of [-8,0,8]){
  block(6.2,4,.18,'#112c37',x,2.35,12.83,g);
  for(const side of [-1,1])block(.28,4.3,.5,cream,x+side*3.2,2.4,13,g);
  block(6.7,.2,.5,cream,x,4.6,13,g);
  const door=new THREE.Group();door.position.set(x,2.25,13.04);g.add(door);
  // Transparent material keeps the moving shutter out of static geometry batches.
  block(5.9,3.65,.12,'#52717d',0,0,0,door,{transparent:true});
  for(let n=0;n<10;n++)block(5.8,.045,.06,'#9fafaa',0,-1.6+n*.35,.1,door,{transparent:true});
  doors.push(door);label(x===0?'ENTER':'DISPLAY BAY',5.7,.65,x,5.1,13.07,orange,blue,0,g);
  ground(5.8,3,'#4c5e5b',x,14,.38,g);for(const side of [-1,1])ground(.13,3,orange,x+side*2.95,14,.4,g);
 }
 block(23,2,.4,blue,0,7.8,9.8,g);label('MOTOR CLUB',22.4,1.75,0,7.8,10.03,'#ffdfa0',blue,0,g);
 label('RAE’S / TUNE · MEET · DRIVE',19,.6,0,6.02,13.04,'#ffe4ac',blue,0,g);
 for(const side of [-1,1]){tree(side*12.6,14,3,g);label('WORKSHOP',15,1.7,side*12.85,4,0,orange,blue,side*Math.PI/2,g);}
 g.updateMatrixWorld(true);return {box:new THREE.Box3().setFromObject(shell),update(time,focus){const amount=focus&&Math.hypot(focus.x+90,focus.z-36)<22?1:0;for(const door of doors){door.scale.y=THREE.MathUtils.lerp(door.scale.y,1-amount*.88,.075);door.position.y=4.075-1.825*door.scale.y;}}};
}
