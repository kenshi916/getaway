export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function overlaps(x,z,r,box){return x+r>box.x-box.w/2&&x-r<box.x+box.w/2&&z+r>box.z-box.d/2&&z-r<box.z+box.d/2;}
export function blocked(x,z,r,boxes){return x < -25+r || x > 25-r || z < -20+r || z > 23-r || boxes.some(b=>b.active!==false&&overlaps(x,z,r,b));}
export function moveBody(pos,dx,dz,r,boxes){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.22));
 for(let i=0;i<steps;i++){if(!blocked(pos.x+dx/steps,pos.z,r,boxes))pos.x+=dx/steps;if(!blocked(pos.x,pos.z+dz/steps,r,boxes))pos.z+=dz/steps;}
 return pos;
}
export function lineClear(x,z,tx,tz,boxes){
 const dist=Math.hypot(tx-x,tz-z),steps=Math.ceil(dist/.35);
 for(let i=1;i<steps;i++){const f=i/steps;if(boxes.some(b=>b.active!==false&&b.sight!==false&&overlaps(x+(tx-x)*f,z+(tz-z)*f,.02,b)))return false;}
 return true;
}
export function findPath(start,end,boxes){
 const step=1.25,key=(x,z)=>x+','+z,sx=Math.round(start.x/step),sz=Math.round(start.z/step),ex=Math.round(end.x/step),ez=Math.round(end.z/step);
 const queue=[[sx,sz]],seen=new Map([[key(sx,sz),null]]);let cursor=0,found=null;
 while(cursor<queue.length&&cursor<1900){const [x,z]=queue[cursor++];if(Math.abs(x-ex)+Math.abs(z-ez)<=1){found=[x,z];break;}
 for(const [dx,dz]of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||blocked(nx*step,nz*step,.42,boxes))continue;seen.set(k,[x,z]);queue.push([nx,nz]);}}
 if(!found)return [];const path=[];let p=found;
 while(p){path.push({x:p[0]*step,z:p[1]*step});p=seen.get(key(...p));}return path.reverse().slice(1);
}
export function createRun(){return{phase:'playing',time:300,health:100,stamina:100,loot:0,bags:0,vaultOpen:false,hack:0,smokes:3,damageTaken:0,elapsed:0,extraction:0};}
export function collectBag(run){if(run.phase!=='playing'||!run.vaultOpen||run.bags>=3)return false;run.bags++;run.loot+=2500;return true;}
export function extract(run){if(run.phase!=='playing'||run.bags<1)return false;run.phase='won';run.bonus=Math.floor(run.time)*10;return true;}
export function hurt(run,damage){if(run.phase!=='playing')return;run.health=Math.max(0,run.health-damage);run.damageTaken+=damage;if(run.health<=0)run.phase='lost';}
