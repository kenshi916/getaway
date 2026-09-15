import * as THREE from './assets/three.module.js';
import {GLTFLoader} from './assets/GLTFLoader.js';
import {loadCityPack,buildCity} from './city.js?v=14';
import {loadVehiclePack,makeVehicle,animateVehicle} from './vehicles.js?v=8';
import {CARS,PAINTS,createCar} from './driving.mjs?v=14';
const VIEWS={
 downtown:{eye:[145,148,175],target:[0,0,0],number:'01 / DOWNTOWN',title:'A BIGGER NIGHT OUT',text:'From the north station to the south motor yards. Twelve characters, thirty-six story chapters, and fourteen destinations across the city.'},
 neon:{eye:[41,45,62],target:[0,3,0],number:'02 / NEON ROW',title:'BRIGHT LIGHTS. TIGHT TURNS.',text:'Find the arcade gateway, slip through the center alley, and take the ramp to shake the pursuit.'},
 garage:{eye:[79,49,101],target:[34,1,46],number:'03 / LAST EXIT',title:'BRING IT BACK IN ONE PIECE',text:'Home is the lit garage on the southeast road. Stop here to bank your haul and finish the shift.'}
};
export async function startShowcase(){
 const host=document.getElementById('cityScene'),loading=document.getElementById('cityLoading');
 const loader=new GLTFLoader();await Promise.all([loadCityPack(loader),loadVehiclePack(loader),document.fonts?.load('700 16px PixelArcade')||Promise.resolve()]);
 renderRides();
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}catch{loading.innerHTML='THE CITY IS WAITING<span>Open the game on a device with 3D graphics</span>';return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#586f85');scene.fog=new THREE.Fog('#586f85',165,420);
 scene.add(new THREE.HemisphereLight('#c5ddeb','#303a43',1.5));const sun=new THREE.DirectionalLight('#ffd3a1',2.75);sun.position.set(-65,115,80);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-118,right:118,top:118,bottom:-118,near:1,far:300});sun.shadow.normalBias=.05;sun.shadow.bias=-.0001;scene.add(sun);
 const world=new THREE.Group();scene.add(world);const city=buildCity(world),camera=new THREE.PerspectiveCamera(42,1,.5,550),look=new THREE.Vector3(0,0,0);let active='downtown';camera.position.fromArray(VIEWS.downtown.eye);camera.lookAt(look);
 const cars=[];for(const [name,x,z,h]of [['coupe',18,37,0],['getaway-van',-54,27,0],['taxi',40,-54,Math.PI/2],['hatchback',-28,90,Math.PI/2],['suv',90,-44,0]]){const view=makeVehicle(name,1.65,PAINTS[cars.length%4]);world.add(view.group);cars.push({view,car:{...createCar(CARS.coupe,x,z,h),speed:7},initial:{x,z,h}});}
 host.appendChild(renderer.domElement);loading.remove();
 for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{active=button.dataset.view;const view=VIEWS[active];for(const item of document.querySelectorAll('[data-view]'))item.setAttribute('aria-pressed',String(item===button));document.getElementById('districtNumber').textContent=view.number;document.getElementById('districtTitle').textContent=view.title;document.getElementById('districtText').textContent=view.text;});
 function resize(){const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
 let inView=true,last=0,elapsed=0;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;});observer.observe(host);
 const desiredEye=new THREE.Vector3(),desiredLook=new THREE.Vector3();
 function frame(now){requestAnimationFrame(frame);if(!inView||document.hidden){last=now;return;}if(now-last<32)return;const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;const view=VIEWS[active];desiredEye.fromArray(view.eye);if(active==='downtown'&&camera.aspect<1.2)desiredEye.multiplyScalar(1.35);if(!reduced){desiredEye.x+=Math.sin(elapsed*.06)*3;desiredEye.z+=Math.cos(elapsed*.06)*2;}desiredLook.fromArray(view.target);const smooth=1-Math.exp(-dt*3);camera.position.lerp(desiredEye,smooth);look.lerp(desiredLook,smooth);camera.lookAt(look);city.update(elapsed);
  for(const item of cars){const {car,initial}=item,move=reduced?0:(elapsed*7)%140-70;car.x=initial.x+Math.sin(initial.h)*move;car.z=initial.z+Math.cos(initial.h)*move;if(Math.abs(car.x)>98||Math.abs(car.z)>98){item.view.group.visible=false;continue;}item.view.group.visible=true;car.wheelTravel=elapsed*7;animateVehicle(item.view,car,dt);}
  renderer.render(scene,camera);
 }requestAnimationFrame(frame);
}
function renderRides(){
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch{return;}
 renderer.setSize(640,365,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#1c292f');scene.add(new THREE.HemisphereLight('#e1f0ff','#243831',2.9));const sun=new THREE.DirectionalLight('#ffe4b2',4.2);sun.position.set(-3,7,5);scene.add(sun);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshStandardMaterial({color:'#1c292f',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
 const camera=new THREE.PerspectiveCamera(34,640/365,.1,40);camera.position.set(3.9,2.7,5.2);camera.lookAt(0,.6,0);
 for(const [i,container]of [...document.querySelectorAll('[data-car-preview]')].entries()){const config=CARS[container.dataset.carPreview],vehicle=makeVehicle(config.model,1,PAINTS[i%PAINTS.length]);scene.add(vehicle.group);renderer.render(scene,camera);const image=new Image();image.src=renderer.domElement.toDataURL('image/png');image.alt=config.name+' — actual in-game vehicle';image.width=640;image.height=365;container.replaceChildren(image);scene.remove(vehicle.group);}
 renderer.dispose();renderer.forceContextLoss();
}
