import * as THREE from './assets/three.module.js';

// Building details share the city's static material batches. All balcony pieces
// are above pedestrian head height; trees stay inside existing park quadrants.
export function createCityFinish({block,ground,model}){
 const stats={facades:0,balconies:0,roofGardens:0,parkTrees:0};
 function facade(box,name,seed,parent){
  const x=(box.min.x+box.max.x)/2,z=(box.min.z+box.max.z)/2,w=box.max.x-box.min.x,d=box.max.z-box.min.z,h=box.max.y;
  if(!name.startsWith('building-')||h<7||w<4||d<4)return;
  if(Math.hypot(x,z)>130&&seed%3!==0)return;
  stats.facades++;
  const trim=seed%2?'#c6c3b5':'#9caeb0',tower=name.includes('skyscraper');
  for(const side of [-1,1]){
   block(w+.16,.16,.2,trim,x,h-.24,z+side*(d/2-.01),parent);
   block(.2,.16,d,trim,x+side*(w/2-.01),h-.24,z,parent);
   block(.12,h-.5,.13,'#647779',x+side*(w/2-.14),h/2+.2,z+d/2-.06,parent);
  }
  if(tower){
   for(let y=5;y<h-2;y+=4)for(const side of [-1,1])block(w,.095,.08,'#c1ccc5',x,y,z+side*(d/2+.012),parent);
  }else if(w>6&&d>5){
   for(let y=5.1;y<Math.min(h-1.8,13);y+=3.2){
    const bx=x+(seed%2?-.22:.22)*w,bz=box.max.z+.33;
    block(2.35,.15,.85,trim,bx,y,bz,parent);
    block(2.35,.075,.055,'#354c52',bx,y+.82,bz+.4,parent);
    for(const dx of [-1.1,-.55,0,.55,1.1])block(.035,.82,.045,'#354c52',bx+dx,y+.42,bz+.4,parent);
    for(const dx of [-1.15,1.15])block(.055,.075,.82,'#354c52',bx+dx,y+.82,bz,parent);
    block(.7,.24,.23,'#925f47',bx+.68,y+.2,bz+.21,parent);
    block(.72,.2,.27,'#507a45',bx+.68,y+.4,bz+.21,parent);
    stats.balconies++;
   }
  }
  // Parapets and planted roof terraces break up plain roof silhouettes.
  if(w>7&&d>6&&seed%4===0){
   ground(w*.47,d*.4,'#506f47',x-w*.16,z,.018+h,parent);
   for(const side of [-1,1])block(w*.48,.36,.16,'#afb4a2',x-w*.16,h+.17,z+side*d*.21,parent);
   for(const dx of [-.32,0]){block(.9,.35,1.1,'#8d806a',x+dx*w,h+.19,z,parent);model('nature/plant_bushDetailed',x+dx*w,z,.85,1.05,.75,0,parent).root.position.y=h+.4;}
   stats.roofGardens++;
  }
 }
 function park(b,parent,seed){
  if(!b.park)return;
  for(const side of [-1,1]){
   const x=b.x+side*5.1,z=b.z-side*7.5;
   const t=model('nature/tree_oak',x,z,3.4,3.4,4.8+(seed%3)*.5,.2*seed,parent);t.root.position.y=.4;stats.parkTrees++;
   ground(3.2,3.2,'#617f3d',x,z,.382,parent);
  }
 }
 return {facade,park,stats};
}

// A lightweight sky sphere gives the city a warm horizon and clear blue upper sky.
export function addCitySky(scene){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(200,24,12),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{horizonColor:{value:scene.fog?.color||new THREE.Color('#92a9aa')},upperColor:{value:new THREE.Color('#345976')}},
  vertexShader:'varying vec3 vSky; void main(){vSky=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 horizonColor; uniform vec3 upperColor; varying vec3 vSky; void main(){float y=normalize(vSky).y; vec3 c=mix(horizonColor,upperColor,smoothstep(0.,.65,y)); float glow=pow(max(0.,dot(normalize(vSky),normalize(vec3(-.6,.12,.6)))),20.); c+=vec3(.14,.055,.01)*glow; gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
 }));sky.name='City sky';sky.frustumCulled=false;sky.renderOrder=-100;sky.onBeforeRender=(_renderer,_scene,camera)=>{sky.position.copy(camera.position);sky.updateMatrixWorld();};scene.add(sky);return sky;
}
