import * as THREE from './assets/three.module.js';
// Camera orientation is independent of the animated body. Movement stays on the
// scene's existing collision-tested floor; looking never moves the player.
export function createWalkingView(camera,avatar,{eyeHeight=1.62,yaw=Math.PI}={}){
 let enabled=false,pitch=0;const target=new THREE.Vector3();
 function update(){if(!enabled)return;avatar.visible=false;camera.position.copy(avatar.position);camera.position.y+=typeof eyeHeight==='function'?eyeHeight():eyeHeight;const horizontal=Math.cos(pitch);target.set(camera.position.x+Math.sin(yaw)*horizontal,camera.position.y+Math.sin(pitch),camera.position.z+Math.cos(yaw)*horizontal);camera.lookAt(target);camera.updateMatrixWorld();}
 function look(dx,dy){if(!enabled)return;yaw-=dx*.004;pitch=THREE.MathUtils.clamp(pitch-dy*.004,-1.05,1.05);update();}
 function movement(input,dt){let x=(input.right?1:0)-(input.left?1:0),z=(input.down?1:0)-(input.up?1:0);if(enabled){yaw+=((input.turnLeft?1:0)-(input.turnRight?1:0))*dt*1.8;pitch=THREE.MathUtils.clamp(pitch+((input.lookUp?1:0)-(input.lookDown?1:0))*dt*1.2,-1.05,1.05);const forward=-z,side=x;x=forward*Math.sin(yaw)-side*Math.cos(yaw);z=forward*Math.cos(yaw)+side*Math.sin(yaw);}return{x,z};}
 return {get enabled(){return enabled;},get yaw(){return yaw;},get pitch(){return pitch;},set(value){enabled=!!value;avatar.visible=!enabled;if(enabled){camera.clearViewOffset();camera.fov=74;camera.near=.045;camera.updateProjectionMatrix();update();}else camera.near=.1;},look,movement,update,recenter(){yaw=avatar.rotation.y;pitch=0;update();}};
}
