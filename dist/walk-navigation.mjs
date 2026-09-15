export function clearWalkSegment(a,b,blocked){const length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/.12));for(let i=0;i<=n;i++){const t=i/n;if(blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
export function findWalkPath(start,goal,blocked,bounds,step=.35){
 if(blocked(start.x,start.z)||blocked(goal.x,goal.z))return null;
 if(clearWalkSegment(start,goal,blocked))return [{x:goal.x,z:goal.z}];
 const width=Math.floor((bounds.maxX-bounds.minX)/step)+1,height=Math.floor((bounds.maxZ-bounds.minZ)/step)+1;
 const point=id=>({x:bounds.minX+(id%width)*step,z:bounds.minZ+Math.floor(id/width)*step});
 const closest=p=>{let best=-1,d=Infinity;const cx=Math.round((p.x-bounds.minX)/step),cz=Math.round((p.z-bounds.minZ)/step);for(let z=cz-3;z<=cz+3;z++)for(let x=cx-3;x<=cx+3;x++){if(x<0||z<0||x>=width||z>=height)continue;const id=z*width+x,q=point(id),dist=Math.hypot(q.x-p.x,q.z-p.z);if(dist<d&&clearWalkSegment(p,q,blocked)){best=id;d=dist;}}return best;};
 const first=closest(start),last=closest(goal);if(first<0||last<0)return null;
 const previous=new Int32Array(width*height).fill(-2),queue=[first];previous[first]=-1;let head=0;
 while(head<queue.length&&previous[last]===-2){const id=queue[head++],x=id%width,z=Math.floor(id/width),a=point(id);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=width||nz>=height)continue;const next=nz*width+nx;if(previous[next]!==-2||!clearWalkSegment(a,point(next),blocked))continue;previous[next]=id;queue.push(next);}}
 if(previous[last]===-2)return null;const raw=[{x:goal.x,z:goal.z}];for(let id=last;id!==-1;id=previous[id])raw.push(point(id));raw.push({x:start.x,z:start.z});raw.reverse();
 const path=[];let cursor=0;while(cursor<raw.length-1){let next=raw.length-1;while(next>cursor+1&&!clearWalkSegment(raw[cursor],raw[next],blocked))next--;path.push(raw[next]);cursor=next;}return path;
}
