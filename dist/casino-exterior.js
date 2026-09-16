import * as THREE from './assets/three.module.js';

// Fits East End's existing solid footprint; the entrance faces the road at x=54.
export function buildCasinoExterior(parent,{block,ground,label,pole,tree,bench}){
 const g=new THREE.Group();g.name='Last Hand Casino';g.position.set(72,0,36);g.rotation.y=-Math.PI/2;parent.add(g);
 const green='#244c43',dark='#193c36',gold='#d7b66d',cream='#e1d5b3',glow={emissive:'#ffce77',emissiveIntensity:.8};
 block(25,.32,26,'#727b69',0,.27,0,g);
 const shell=block(24.6,7.5,25.4,green,0,4.1,-.2,g);
 for(const y of [.75,3.7,7.5])block(25,.24,25.8,gold,0,y,-.2,g);
 block(25,.45,26,cream,0,8,-.2,g);
 block(17,2.3,17,dark,0,9.25,-2.7,g);
 block(17.6,.24,17.6,gold,0,10.5,-2.7,g);
 block(11,.35,11,cream,0,10.8,-2.7,g);
 // Art-deco piers and inset glazed bays wrap both street-facing sides.
 for(const x of [-11.5,-7.8,7.8,11.5]){
  block(.7,6.7,.45,cream,x,4,12.65,g);
  block(.16,5.8,.14,gold,x,4.2,12.95,g,glow);
 }
 for(const x of [-5.8,5.8]){
  block(3.1,2.5,.18,'#132d2d',x,2,12.6,g);
  block(2.7,2.1,.08,'#bb995c',x,2,12.73,g,{emissive:'#e7b968',emissiveIntensity:.3,roughness:.25});
  for(const dx of [-.9,0,.9])block(.07,2.1,.09,gold,x+dx,2,12.8,g);
  label(x<0?'CARDS':'LOUNGE',2.9,.55,x,3.2,12.83,cream,dark,0,g);
 }
 for(const side of [-1,1])for(const z of [-9,-3,3,9]){
  block(.15,3.9,3.4,dark,side*12.35,3.5,z,g);
  block(.16,3.35,2.8,'#62766c',side*12.46,3.5,z,g,{emissive:'#d6b16c',emissiveIntensity:.14});
  for(const dz of [-1.5,0,1.5])block(.22,3.7,.09,gold,side*12.5,3.5,z+dz,g);
  block(.3,6.4,.55,cream,side*12.4,4,z+2,g);
 }
 // Oversized rooftop lettering is legible from the default driving camera.
 block(20,3.3,.48,dark,0,10,9.9,g);
 block(20.4,.16,.62,gold,0,11.7,9.9,g,glow);
 block(20.4,.16,.62,gold,0,8.3,9.9,g,glow);
 label('CASINO',19.7,3.05,0,10,10.16,'#ffe7a2',dark,0,g);
 // South-facing sign makes the building recognizable on the garage approach.
 block(.44,2.2,15,dark,-12.35,6.15,-.2,g);
 label('LAST HAND',14.5,1.85,-12.59,6.15,-.2,'#ffe7a2',dark,-Math.PI/2,g);
 for(const side of [-1,1]){
  const diamond=block(1.35,1.35,.28,gold,side*10.1,10,10.22,g,glow);diamond.rotation.z=Math.PI/4;
  block(1.1,9,1.1,dark,side*11,4.9,11.4,g);
  block(1.4,.25,1.4,gold,side*11,9.5,11.4,g);
 }
 // Double doors, lit marquee, carpet and rope rails make the walk-in point clear.
 block(5.5,3.3,.2,gold,0,1.98,12.66,g);
 for(const x of [-1.3,1.3]){
  block(2.45,2.95,.15,'#173c3c',x,1.91,12.81,g,{roughness:.2,metalness:.25});
  block(2.15,1.75,.04,'#849b87',x,2.25,12.91,g,{emissive:'#f4d48c',emissiveIntensity:.2});
  block(.07,.7,.12,gold,x-Math.sign(x)*.6,1.7,13.02,g);
 }
 block(14,.58,3.6,dark,0,4,12.7,g);
 block(14.2,.12,3.8,gold,0,4.34,12.7,g,glow);
 label('LAST HAND',13.4,1.35,0,5.1,12.94,'#ffe7a2',green,0,g);
 label('FREE PLAY',6,.57,0,3.96,14.52,'#fff1c0',dark,0,g);
 for(let x=-6.5;x<=6.5;x+=.65)block(.16,.16,.12,'#fff1b6',x,3.9,14.57,g,glow);
 ground(4.4,3.2,'#853b43',0,14.1,.45,g);
 for(const x of [-2.28,2.28]){
  ground(.12,3.4,gold,x,14.1,.46,g);
  for(const z of [13.1,15.45]){pole(.085,1.1,gold,x,1,z,g);pole(.18,.1,gold,x,.49,z,g);}
  block(.06,.08,2.3,'#853b43',x,1.47,14.25,g);
 }
 for(const x of [-9.2,9.2]){tree(x,13.5,3.7,g,true);}
 bench(-8,-13.1,Math.PI,g);bench(8,-13.1,Math.PI,g);
 label('ENTER',3.2,.75,0,2.3,15.3,'#ffe7a2',dark,0,g);
 const light=new THREE.PointLight('#ffdf9e',18,12,2);light.position.set(0,3,15);g.add(light);
 g.updateMatrixWorld(true);
 return {group:g,box:new THREE.Box3().setFromObject(shell),light};
}
