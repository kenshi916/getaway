import * as THREE from './assets/three.module.js';

// Low, opaque foliage shares geometry batches with each city block.
export function createCityLandscape({block,ground}){
 const placements=[],lawns=[],stats={grassTufts:0,flowerBeds:0,verges:0,roadDetails:0};
 const bladeColors=['#6f963d','#91b952','#4d7837','#a5bb5a'].map(c=>new THREE.Color(c));
 function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return(state>>>8)/16777216;};}
 function texture(seed,grass){const data=new Uint8Array(128*128*4),random=rng(seed);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const noise=random(),tile=((x>>3)+(y>>3)*5)%7,v=grass?Math.floor(191+noise*43+tile*2):Math.floor(197+noise*53);data.set([v,v,grass?v-9:v,255],(y*128+x)*4);}const t=new THREE.DataTexture(data,128,128);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
 const grassTexture=texture(68112,true),pathTexture=texture(89612,false),grassMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,side:THREE.DoubleSide,roughness:1,flatShading:true});
 grassMaterial.userData.landscapeGrass=true;
 function record(kind,x,z,w,d,y,height,b){placements.push({kind,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:y,maxY:y+height,blockX:b.x,blockZ:b.z});}
 function lawn(b,parent){ground(b.w-.12,b.d-.12,'#82a84c',b.x,b.z,.378,parent,{map:grassTexture,roughness:1});lawns.push({x:b.x,z:b.z,w:b.w-.12,d:b.d-.12});}
 function patch(x,z,w,d,parent,color='#789a46'){ground(w,d,color,x,z,.38,parent,{map:grassTexture,roughness:1});}
 function flowerBed(b,parent,x,z,w=2.5,d=1.15,seed=1){const y=.38;block(w+.18,.21,d+.18,'#b7b19a',x,y+.08,z,parent);block(w,.035,d,'#4d4935',x,y+.21,z,parent);const random=rng(seed),colors=['#e7c765','#d77d70','#dad5ad'];for(let n=0;n<6;n++){const fx=x+(n%3-1)*w*.3,fz=z+(Math.floor(n/3)-.5)*d*.45,h=.22+random()*.16;block(.045,h,.045,'#517336',fx,y+.22+h/2,fz,parent);block(.18,.1,.13,colors[n%3],fx,y+.25+h,fz,parent);block(.11,.1,.22,colors[n%3],fx,y+.25+h,fz,parent);block(.075,.11,.075,'#dbb43e',fx,y+.27+h,fz,parent);block(.16,.035,.07,'#738c42',fx+.05,y+.25+h*.4,fz,parent);}record('flower-bed',x,z,w+.18,d+.18,y,.85,b);stats.flowerBeds++;}
 function scatter(b,parent,rect,count,seed,exclude=()=>false,scale=1){const random=rng(seed),positions=[],colors=[];for(let n=0,tries=0;n<count&&tries<count*8;tries++){const x=rect.x+(random()-.5)*rect.w,z=rect.z+(random()-.5)*rect.d,r=.23*scale;if(exclude(x,z,r))continue;n++;const h=(.22+random()*.28)*scale,rotation=random()*Math.PI,color=bladeColors[Math.floor(random()*bladeColors.length)];for(let j=0;j<3;j++){const a=rotation+j*Math.PI/3,width=(.11+random()*.06)*scale,dx=Math.cos(a)*width,dz=Math.sin(a)*width,lean=(random()-.5)*.12*scale;positions.push(x-dx,.388,z-dz,x+dx,.388,z+dz,x+lean,.388+h*(.8+random()*.2),z+lean);for(let k=0;k<3;k++)colors.push(color.r,color.g,color.b);}record('grass-tuft',x,z,r*2,r*2,.388,h,b);stats.grassTufts++;}if(!positions.length)return;const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,grassMaterial);mesh.receiveShadow=true;mesh.castShadow=false;parent.add(mesh);}
 function dress(b,parent,kind,seed,boxes=[]){
  const insideBuilding=(x,z,r)=>boxes.some(box=>x+r+.18>box.min.x&&x-r-.18<box.max.x&&z+r+.18>box.min.z&&z-r-.18<box.max.z);
  if(kind==='park'){
   const inner=!b.outer,path=inner?1.9:1.5,tree=inner?8:8.5,bedX=inner?9.4:9.3,bedZ=inner?3.1:3.8;
   for(const dx of [-bedX,bedX])for(const dz of [-bedZ,bedZ])flowerBed(b,parent,b.x+dx,b.z+dz,2.35,1.05,seed+Math.round(dx+dz));
   const avoid=(x,z,r)=>{const dx=x-b.x,dz=z-b.z;if(Math.abs(dx)<path+r||Math.abs(dz)<path+r||Math.hypot(dx,dz)<(inner?4.35:1.8)+r)return true;for(const tx of [-tree,tree])for(const tz of [-tree,tree])if(Math.hypot(dx-tx,dz-tz)<2.3)return true;for(const bx of [-bedX,bedX])for(const bz of [-bedZ,bedZ])if(Math.abs(dx-bx)<1.5+r&&Math.abs(dz-bz)<.9+r)return true;const benches=inner?[[-6.4,-4],[-6.4,4],[6.4,-4],[6.4,4]]:[[-4,3],[4,-3]];return benches.some(([bx,bz])=>Math.hypot(dx-bx,dz-bz)<1.95);};
   scatter(b,parent,{x:b.x,z:b.z,w:b.w-2.3,d:b.d-2.3},420,seed,avoid,1);
  }else if(kind==='residential'&&b.outer){
   flowerBed(b,parent,b.x-2.7,b.z+9.3,2.15,1.05,seed);flowerBed(b,parent,b.x+10,b.z+9.25,1.9,1.05,seed+1);
   const avoid=(x,z,r)=>{const dx=x-b.x,dz=z-b.z;return insideBuilding(x,z,r)||Math.abs(dx-6.1)<1.05+r||Math.abs(dx+6.1)<1.05+r||[-9.6,2.6].some(s=>Math.abs(dx-s)<1.8+r&&Math.abs(dz-9.7)<1.05+r)||[[-2.7,9.3],[10,9.25]].some(([a,c])=>Math.abs(dx-a)<1.4+r&&Math.abs(dz-c)<.8+r);};
   scatter(b,parent,{x:b.x,z:b.z+9.3,w:23.9,d:3.9},110,seed,avoid,.8);
   scatter(b,parent,{x:b.x,z:b.z-10.6,w:23.4,d:3.1},34,seed+41,(x,z,r)=>insideBuilding(x,z,r)||(Math.abs(x-b.x+10.9)<1.1+r&&Math.abs(z-b.z+10.5)<1.1+r),.9);
  }else if(kind==='residential'){
   scatter(b,parent,{x:b.x,z:b.z,w:b.w-1.2,d:b.d-1.2},100,seed,(x,z,r)=>insideBuilding(x,z,r)||[-1,1].some(side=>Math.abs(x-b.x-side*(b.w/2-1.25))<1.1+r&&Math.abs(z-b.z+b.d/2-.8)<1.1+r)||Math.abs(x-b.x)<1.4||boxes.some(box=>Math.abs(x-(box.min.x+box.max.x)/2)<.9),.7);
  }else if(kind==='commercial'&&b.outer){
   for(const side of [-1,1]){const x=b.x+side*13.01;patch(x,b.z,.43,15,parent,'#779543');scatter(b,parent,{x,z:b.z,w:.12,d:14.7},24,seed+(side+1)*15,()=>false,.45);stats.verges++;}
  }else if(kind==='industrial'&&b.outer){
   patch(b.x-10.95,b.z+7,1.4,2.2,parent,'#6f8146');scatter(b,parent,{x:b.x-10.95,z:b.z+7,w:1.05,d:1.85},13,seed,insideBuilding,.6);
  }
 }
 function roadDetail(x,z,parent,seed){const y=.043;const cover=new THREE.Mesh(new THREE.CylinderGeometry(.46,.46,.018,12),new THREE.MeshStandardMaterial({color:'#303e43',roughness:.85}));cover.position.set(x,y,z);cover.receiveShadow=true;parent.add(cover);for(let n=0;n<4;n++)ground(.57,.035,'#75807b',x,z-.2+n*.13,y+.012,parent);record('flat-road-cover',x,z,.95,.95,y,.03,{x,z});stats.roadDetails++;if(seed%3===0){ground(1.1,2.1,'#3b444b',x-2.3,z+3,.028,parent);for(const side of [-1,1])ground(1.17,.04,'#535b5d',x-2.3,z+3+side*1.08,.029,parent);}}
 return {grassTexture,pathTexture,lawn,dress,roadDetail,placements,lawns,stats};
}
