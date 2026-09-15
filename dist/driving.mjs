import {HOME_VERSION,HOME_SPAWN,HOME_BOUNDS} from './home-layout.mjs?v=11';
import {BURN_CARS,defaultCollection,cleanCollection} from './collection.mjs?v=8';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ROAD=[-90,-54,-18,18,54,90],LIMIT=102;
export const HOME={x:36,z:54,name:'LAST EXIT GARAGE'};
export const CARS={
 van:{id:'van',name:'THE WORKHORSE',model:'getaway-van',price:0,speed:22,accel:18,grip:11,steer:2.35,seats:3,health:120,scale:1.7,description:'Three seats. Built to take a hit.'},
 coupe:{id:'coupe',name:'NIGHT RUNNER',model:'coupe',price:6000,speed:26,accel:22,grip:12,steer:2.55,seats:2,health:100,scale:1.7,description:'Quick off the line. Easy in the corners.'},
 racer:{id:'racer',name:'REDLINE',model:'racer',price:14000,speed:31,accel:26,grip:13,steer:2.65,seats:1,health:90,scale:1.65,description:'One seat. Ridiculous speed.'},
 ...BURN_CARS
};
export const PAINTS=['#ffc23d','#21cbbb','#ed5949','#6494ff'];
export const BLOCKS=[
 {x:-36,z:-36,w:26,d:25,h:10,color:'#547786',name:'UNION TRUST'},
 {x:0,z:-36,w:27,d:25,h:14,color:'#6b748f',name:'THE REGENT'},
 {x:36,z:-36,w:25,d:26,h:8,color:'#358b96',name:'NIGHT MARKET'},
 {x:-36,z:0,w:25,d:27,h:13,color:'#b06a63',name:'MOTEL 86'},
 {x:-9,z:0,w:8,d:25,h:8,color:'#4d818f',name:'RECORDS'},
 {x:9,z:0,w:8,d:25,h:9,color:'#976a93',name:'ARCADE'},
 {x:36,z:0,w:26,d:25,h:16,color:'#596e89',name:'GRAND HOTEL'},
 {x:-36,z:28,w:25,d:10,h:9,color:'#89795f',name:'PAWN SHOP'},
 {x:-36,z:44,w:25,d:10,h:7,color:'#508b88',name:'LAUNDROMAT'},
 {x:0,z:36,w:26,d:26,h:12,color:'#ba7564',name:'24H DINER'},
 {x:36,z:35,w:25,d:19,h:6,color:'#385d78',name:'LAST EXIT'},

 {x:-72,z:-72,w:25,d:25,h:9,color:'#c59969',name:'HARBOR STORAGE',district:'docks'},
 {x:-36,z:-72,w:26,d:26,h:13,color:'#c77c62',name:'BRICKWORKS',district:'north'},
 {x:0,z:-72,w:27,d:24,h:14,color:'#c6d5b9',name:'CENTRAL STATION',district:'north'},
 {x:36,z:-72,w:26,d:25,h:16,color:'#bf9bb8',name:'STARLIGHT CINEMA',district:'north'},
 {x:72,z:-72,w:25,d:25,h:10,color:'#62a185',name:'NORTH GARDENS',district:'park',park:true},
 {x:-72,z:-36,w:25,d:25,h:9,color:'#93acb8',name:'PORT AUTHORITY',district:'docks'},
 {x:72,z:-36,w:26,d:26,h:26,color:'#a7bfd8',name:'SKYLINE PLAZA',district:'east'},
 {x:-72,z:0,w:25,d:25,h:11,color:'#5ea896',name:'PIER MARKET',district:'docks'},
 {x:72,z:0,w:25,d:26,h:12,color:'#b5a080',name:'EAST WAREHOUSE',district:'east'},
 {x:-72,z:36,w:25,d:25,h:8,color:'#68a482',name:'RIVERSIDE PARK',district:'park',park:true},
 {x:72,z:36,w:26,d:25,h:12,color:'#d59374',name:'EAST END',district:'east'},
 {x:-72,z:72,w:25,d:25,h:10,color:'#acc4a6',name:'WEST COURT',district:'south'},
 {x:-36,z:72,w:25,d:24,h:9,color:'#d4aa81',name:'RIVERSIDE CAFE',district:'south'},
 {x:0,z:72,w:25,d:25,h:10,color:'#b49aaa',name:'SOUTH AUTOS',district:'south'},
 {x:36,z:72,w:25,d:25,h:10,color:'#c0b098',name:'FUEL STOP',district:'south'},
 {x:72,z:72,w:25,d:25,h:11,color:'#ce9778',name:'ROADHOUSE',district:'south'}
];
export const STOPS=[
 {id:'bank',x:-36,z:-54,name:'UNION TRUST',type:3},
 {id:'hotel',x:0,z:-54,name:'THE REGENT',type:2},
 {id:'market',x:36,z:-54,name:'NIGHT MARKET',type:1},
 {id:'motel',x:-54,z:0,name:'MOTEL 86',type:2},
 {id:'arcade',x:18,z:0,name:'ARCADE ALLEY',type:1},
 {id:'grand',x:54,z:0,name:'GRAND HOTEL',type:3},
 {id:'pawn',x:-54,z:36,name:'PAWN SHOP',type:2},
 {id:'diner',x:0,z:54,name:'24H DINER',type:1},
 {id:'station',x:0,z:-90,name:'CENTRAL STATION',type:1},
 {id:'cinema',x:36,z:-90,name:'STARLIGHT CINEMA',type:2},
 {id:'docks',x:-90,z:-36,name:'PORT AUTHORITY',type:3},
 {id:'roadhouse',x:72,z:90,name:'ROADHOUSE',type:2}
];
export const DESTS=[
 {id:'west',x:-54,z:-36,name:'WESTSIDE LOCKUP'},
 {id:'north',x:18,z:-36,name:'NORTHSIDE LOFT'},
 {id:'east',x:54,z:36,name:'EASTSIDE HIDEOUT'},
 {id:'south',x:-18,z:36,name:'SOUTHERN SAFEHOUSE'},
 {id:'bay',x:-36,z:18,name:'LOADING BAY'},
 {id:'loft',x:36,z:-18,name:'ROOFTOP LOFT'},
 {id:'northyard',x:-36,z:-90,name:'NORTH YARD'},
 {id:'pier',x:-90,z:0,name:'PIER LOCKUP'},
 {id:'skyline',x:90,z:-36,name:'SKYLINE SAFEHOUSE'},
 {id:'southyard',x:0,z:90,name:'SOUTH MOTOR YARD'}
];
export const RAMPS=[{x:0,z:0,w:5,d:10,dir:-1,h:2.6},{x:-36,z:36,w:10,d:4.8,dir:1,axis:'x',h:2.2}];
export function dist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function overlaps(x,z,r,b){return x+r>b.x-b.w/2&&x-r<b.x+b.w/2&&z+r>b.z-b.d/2&&z-r<b.z+b.d/2;}
export function blocked(x,z,r=.9,boxes=BLOCKS){return Math.abs(x)>LIMIT-r||Math.abs(z)>LIMIT-r||boxes.some(b=>b.active!==false&&overlaps(x,z,r,b));}
export function visible(a,b,boxes=BLOCKS){const n=Math.ceil(dist(a,b)/1.5);for(let i=1;i<n;i++)if(boxes.some(box=>overlaps(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.03,box)))return false;return true;}
export function closestRoad(p){let best=null;for(const n of ROAD)for(const q of [{x:clamp(p.x,ROAD[0],ROAD.at(-1)),z:n},{x:n,z:clamp(p.z,ROAD[0],ROAD.at(-1))}])if(!best||dist(p,q)<dist(p,best))best=q;return best;}
function linksFor(p){const q=closestRoad(p),result=[];ROAD.forEach((x,i)=>ROAD.forEach((z,j)=>{if(Math.abs(q.x-x)<.01||Math.abs(q.z-z)<.01)result.push({id:i*ROAD.length+j,cost:Math.abs(q.x-x)+Math.abs(q.z-z)});}));return{q,links:result};}
export function route(a,b){
 const sa=linksFor(a),sb=linksFor(b);if((Math.abs(sa.q.x-sb.q.x)<.01||Math.abs(sa.q.z-sb.q.z)<.01)&&visible(sa.q,sb.q))return [sa.q,sb.q,{x:b.x,z:b.z}];
 const width=ROAD.length,totalNodes=width*width,costs=Array(totalNodes).fill(Infinity),prev=Array(totalNodes).fill(-1),done=new Set();for(const l of sa.links)costs[l.id]=l.cost;
 for(let n=0;n<totalNodes;n++){let u=-1;for(let i=0;i<totalNodes;i++)if(!done.has(i)&&(u<0||costs[i]<costs[u]))u=i;if(u<0||!Number.isFinite(costs[u]))break;done.add(u);const ix=Math.floor(u/width),iz=u%width;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=ix+dx,z=iz+dz;if(x<0||x>=width||z<0||z>=width)continue;const v=x*width+z;if(costs[v]>costs[u]+36){costs[v]=costs[u]+36;prev[v]=u;}}}
 let end=-1,total=Infinity;for(const l of sb.links)if(costs[l.id]+l.cost<total){end=l.id;total=costs[l.id]+l.cost;}
 const points=[];while(end>=0){points.push({x:ROAD[Math.floor(end/width)],z:ROAD[end%width]});end=prev[end];}return[sa.q,...points.reverse(),sb.q,{x:b.x,z:b.z}].filter((p,i,arr)=>!i||dist(p,arr[i-1])>.1);
}
export function rampHeight(p){for(const r of RAMPS){if(Math.abs(p.x-r.x)<r.w/2&&Math.abs(p.z-r.z)<r.d/2){const length=r.axis==='x'?r.w:r.d,along=r.axis==='x'?p.x-r.x:p.z-r.z;return(r.dir*along/length+.5)*r.h;}}return 0;}
export function createCar(config=CARS.van,x=HOME.x,z=HOME.z,heading=Math.PI/2){return{x,z,heading,vx:0,vz:0,y:0,vy:0,ground:0,health:config.health,nitro:100,config,impact:0,airtime:0,landed:false,speed:0,drifting:false,steering:0,yawRate:0,acceleration:0,wheelTravel:0,braking:false,reverseDelay:0};}
export function drive(car,input,dt,boxes=BLOCKS){
 dt=clamp(dt,0,.05);car.impact=0;car.landed=false;if(!dt)return car;
 const config=car.config,oldSpeed=car.speed,oldHeading=car.heading;
 const throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1),air=car.y>car.ground+.15;
 let longitudinal=car.vx*Math.sin(oldHeading)+car.vz*Math.cos(oldHeading);
 let lateral=car.vx*Math.cos(oldHeading)-car.vz*Math.sin(oldHeading);
 // Keyboard and touch inputs feed the same progressive steering rack.
 car.steering+=(steer-car.steering)*(1-Math.exp(-dt*(steer?12:17)));
 const boosting=throttle>0&&!!input.boost&&car.nitro>1&&!air;
 car.boosting=boosting;car.nitro=clamp(car.nitro+(boosting?-30:10)*dt,0,100);
 car.braking=throttle<0&&longitudinal>.15;
 if(throttle<0&&longitudinal>0){longitudinal=Math.max(0,longitudinal-38*dt);car.reverseDelay=.2;}
 else if(throttle<0){car.reverseDelay=Math.max(0,car.reverseDelay-dt);if(car.reverseDelay===0)longitudinal-=config.accel*.7*dt;}
 else if(throttle>0){car.reverseDelay=0;longitudinal+=config.accel*(boosting?1.55:longitudinal<0?1.5:1)*dt;}
 else {car.reverseDelay=0;const loss=(1.8+Math.abs(longitudinal)*.16)*dt;longitudinal=Math.sign(longitudinal)*Math.max(0,Math.abs(longitudinal)-loss);}
 const slip=!!input.brake&&Math.abs(longitudinal)>5&&!air;
 if(input.brake)longitudinal*=Math.exp(-dt*(slip?.42:2.8));
 const cap=config.speed*(boosting?1.4:1);
 // Boost tapers back to cruising speed instead of snapping on release.
 if(longitudinal>cap)longitudinal=Math.max(cap,longitudinal-18*dt);
 longitudinal=Math.max(-config.speed*.32,longitudinal);
 const speedRatio=clamp(Math.abs(longitudinal)/5,0,1);
 const stability=1/(1+Math.pow(Math.abs(longitudinal)/25,2)*.46);
 const desiredYaw=-car.steering*config.steer*speedRatio*stability*Math.sign(longitudinal)*(slip?1.45:1)*(air?.2:1);
 car.yawRate+=(desiredYaw-car.yawRate)*(1-Math.exp(-dt*(slip?9:15)));
 car.heading+=car.yawRate*dt;
 // Retain momentum through the corner; tire grip brings the rear into line.
 const turn=car.heading-oldHeading,c=Math.cos(turn),sn=Math.sin(turn);
 const f=longitudinal*c+lateral*sn;
 lateral=(lateral*c-longitudinal*sn)*Math.exp(-dt*(air?.15:slip?2.1:config.grip));
 longitudinal=f;
 car.vx=Math.sin(car.heading)*longitudinal+Math.cos(car.heading)*lateral;
 car.vz=Math.cos(car.heading)*longitudinal-Math.sin(car.heading)*lateral;
 car.drifting=slip&&Math.abs(car.steering)>.16;
 car.acceleration=(Math.hypot(car.vx,car.vz)-oldSpeed)/dt;
 car.wheelTravel+=longitudinal*dt;
 const steps=Math.max(1,Math.ceil(Math.hypot(car.vx,car.vz)*dt/.42));
 for(let i=0;i<steps;i++){
  const clear=(x,z)=>[-1.05,0,1.05].every(offset=>!blocked(x+Math.sin(car.heading)*offset,z+Math.cos(car.heading)*offset,.85,boxes));
  let nx=car.x+car.vx*dt/steps;if(clear(nx,car.z))car.x=nx;else{car.impact=Math.max(car.impact,Math.abs(car.vx));car.vx*=-.12;car.vz*=.94;}
  let nz=car.z+car.vz*dt/steps;if(clear(car.x,nz))car.z=nz;else{car.impact=Math.max(car.impact,Math.abs(car.vz));car.vz*=-.12;car.vx*=.94;}
 }
 const ground=rampHeight(car);const speed=Math.hypot(car.vx,car.vz);
 if(car.ground-ground>1&&car.y>=car.ground-.15&&speed>7&&car.vy===0)car.vy=3.6+speed*.17;
 if(car.y>ground+.05||car.vy!==0){car.vy-=17*dt;car.y+=car.vy*dt;car.airtime+=dt;if(car.y<=ground){car.y=ground;car.vy=0;car.landed=car.airtime>.4;car.airtime=0;}}
 else car.y=ground;car.ground=ground;car.speed=Math.hypot(car.vx,car.vz);return car;
}
export function defaultProfile(){return{credits:0,best:0,runs:0,deliveries:0,unlocked:['van'],selected:'van',paint:0,muted:false,camera:'chase',tutorialStep:0,trackedQuest:'first-night',homeVersion:HOME_VERSION,home:{...HOME_SPAWN},homeLife:{tvOn:false,completed:[]},checkpoint:null,collection:defaultCollection()};}
export function cleanProfile(raw){const p=defaultProfile();if(!raw||typeof raw!=='object')return p;for(const k of ['credits','best','runs','deliveries'])if(Number.isFinite(raw[k]))p[k]=clamp(Math.floor(raw[k]),0,1e9);p.collection=cleanCollection(raw.collection);p.unlocked=['van',...Object.values(BURN_CARS).filter(c=>p.collection.owned.includes(c.itemId)).map(c=>c.id),...['coupe','racer'].filter(k=>Array.isArray(raw.unlocked)&&raw.unlocked.includes(k))];if(p.unlocked.includes(raw.selected))p.selected=raw.selected;p.paint=Number.isInteger(raw.paint)?clamp(raw.paint,0,PAINTS.length-1):0;p.muted=raw.muted===true;p.camera=raw.camera==='high'?'high':'chase';p.tutorialStep=Number.isInteger(raw.tutorialStep)?clamp(raw.tutorialStep,0,6):0;if(raw.homeVersion===HOME_VERSION&&Number.isFinite(raw.home?.x)&&Number.isFinite(raw.home?.z))p.home={x:clamp(raw.home.x,HOME_BOUNDS.minX,HOME_BOUNDS.maxX),z:clamp(raw.home.z,HOME_BOUNDS.minZ,HOME_BOUNDS.maxZ)};p.trackedQuest=['first-night','ten-fares','big-bank','five-shifts','home-comforts'].includes(raw.trackedQuest)?raw.trackedQuest:'first-night';p.homeLife={tvOn:raw.homeLife?.tvOn===true,completed:Array.isArray(raw.homeLife?.completed)?['sofa','coffee','shower','bed'].filter(id=>raw.homeLife.completed.includes(id)):[]};p.checkpoint=raw.checkpoint?.version===1?raw.checkpoint:null;return p;}
export function buyCar(profile,id){const c=CARS[id];if(!c||c.itemId||profile.unlocked.includes(id)||profile.credits<c.price)return false;profile.credits-=c.price;profile.unlocked.push(id);profile.selected=id;return true;}
export function createRun(){return{phase:'driving',time:150,haul:0,deliveries:0,combo:1,wanted:0,heat:0,escape:0,passengers:[],pickups:0,nearMisses:0,crashes:0,airJumps:0,drift:0,style:0,busted:0,banked:false,elapsed:0,roadblockCount:0};}
export function makeJob(stop,index=0,rng=Math.random){const pool=DESTS.filter(d=>dist(stop,d)>48);const dest=pool[Math.floor(rng()*pool.length)%pool.length];const level=stop.type;return{id:stop.id+'-'+index,stopId:stop.id,name:['','LATE SHIFT','HOT PICKUP','BIG SCORE'][level],level,value:[0,850,1450,2100][level],dest:{...dest},picked:false,cooldown:0};}
export function pickup(run,job,config){if(run.phase!=='driving'||job.picked||job.cooldown>0||run.passengers.length>=config.seats)return false;job.picked=true;run.passengers.push({...job});run.pickups++;run.time=Math.min(180,run.time+10);run.wanted=clamp(run.wanted+job.level-1+(job.level===1?.4:0),0,5);return true;}
export function deliver(run,id){if(run.phase!=='driving')return null;const index=run.passengers.findIndex(p=>p.id===id);if(index<0)return null;const [p]=run.passengers.splice(index,1);const payment=Math.round(p.value*run.combo);run.haul+=payment;run.deliveries++;run.combo=Math.min(3,1+run.deliveries*.25);run.time=Math.min(180,run.time+40);return{payment,passenger:p};}
export function settleRun(run,profile,success){if(run.banked||run.phase==='banked'||run.phase==='busted')return false;run.phase=success?'banked':'busted';run.banked=true;profile.runs++;profile.deliveries+=run.deliveries;if(success){const total=Math.floor(run.haul+run.style);profile.credits+=total;profile.best=Math.max(profile.best,total);run.total=total;}else run.total=0;return true;}
