import * as THREE from './assets/three.module.js';
import {ROAD} from './driving.mjs?v=17';

export function createPassengerActor(templates,person,stop,world){
 const source=templates['passenger-'+person.model],root=source.scene.clone(true),group=new THREE.Group();
 group.name='Passenger / '+person.name;group.userData.personId=person.id;root.scale.setScalar(.72);group.add(root);world.add(group);
 const alongX=ROAD.includes(stop.x),home=new THREE.Vector3(stop.x+(alongX?3.8:0),.16,stop.z+(alongX?0:3.8));
 const mixer=new THREE.AnimationMixer(root),actions=new Map();let playing='',phase='waiting',age=0,wave=0,exitPoint=null;
 function play(name){if(playing===name)return;const clip=source.animations.find(c=>c.name===name)||source.animations.find(c=>c.name==='idle');if(!clip)return;let action=actions.get(name);if(!action){action=mixer.clipAction(clip);actions.set(name,action);}for(const a of actions.values())if(a!==action)a.fadeOut(.15);action.reset().fadeIn(.15).play();playing=name;}
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;const ctx=canvas.getContext('2d');ctx.fillStyle='#162b32';ctx.fillRect(0,0,512,112);ctx.fillStyle=person.color;ctx.fillRect(0,0,8,112);ctx.textAlign='center';ctx.fillStyle='#f4eed9';ctx.font='bold 40px Arial';ctx.fillText(person.name,258,48,480);ctx.fillStyle=person.color;ctx.font='24px Arial';ctx.fillText('NEEDS A RIDE',258,86);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));tag.position.y=2.8;tag.scale.set(3.7,.81,1);group.add(tag);
 const door=car=>{const right=new THREE.Vector3(Math.cos(car.heading),0,-Math.sin(car.heading)),delta=home.clone().sub(new THREE.Vector3(car.x,0,car.z)),side=delta.dot(right)<0?-1:1;return new THREE.Vector3(car.x+right.x*side*1.55,.16,car.z+right.z*side*1.55);};
 function wait(){phase='waiting';age=0;group.position.copy(home);group.visible=true;tag.visible=true;play('idle');}
 function board(car,progress){phase=progress>0?'boarding':'waiting';group.visible=true;tag.visible=false;const end=door(car);group.position.lerpVectors(home,end,Math.min(1,progress));group.rotation.y=Math.atan2(end.x-home.x,end.z-home.z);play(progress>0?'walk':'idle');}
 function onboard(){phase='onboard';group.visible=false;tag.visible=false;}
 function leave(car,dest){phase='leaving';age=0;group.position.copy(door(car));const vertical=ROAD.some(x=>Math.abs(dest.x-x)<.1);exitPoint=new THREE.Vector3(dest.x+(vertical?4.1:2),.16,dest.z+(vertical?2:4.1));group.visible=true;tag.visible=false;play('walk');}
 function update(dt,car){mixer.update(dt);age+=dt;
  if(phase==='leaving'){const delta=exitPoint.clone().sub(group.position),distance=delta.length();if(distance>.1){group.position.addScaledVector(delta.normalize(),Math.min(distance,dt*1.9));group.rotation.y=Math.atan2(delta.x,delta.z);}else play('idle');if(age>6){phase='away';group.visible=false;}return;}
  if(phase!=='waiting')return;tag.visible=group.visible&&Math.hypot(car.x-home.x,car.z-home.z)<34;
  const near=Math.hypot(car.x-home.x,car.z-home.z)<16;if(near){group.rotation.y=Math.atan2(car.x-home.x,car.z-home.z);wave-=dt;if(wave<=0){play('interact-right');wave=6;}else if(wave<4.9)play('idle');}else play('idle');
 }
 wait();return{group,mixer,person,home,wait,board,onboard,leave,update,get phase(){return phase;}};
}
