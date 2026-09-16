import * as THREE from './assets/three.module.js';
import {CARS,PAINTS,dist} from './driving.mjs?v=34';
import {makeVehicle,animateVehicle,DETAILED_STAND_INS} from './vehicles.js?v=34';
import {HOMES} from './social-catalog.mjs?v=34';
import {HOME_UPGRADES,NEIGHBORHOOD_JOBS,ROOM_CAPACITY} from './world-catalog.mjs?v=34';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
export function createNeighborhood(api){
 let data={profile:null,home:null,rooms:[]},session=null,roomId=null,peers=[],seq=0,tab='servers',error='',busy=false,syncing=false,lastPoll=0,retryAt=0,failures=0,jobBusy=false,lastHome='',loaded=false,disposed=false;
 const views=new Map();let interiorUpdate=Promise.resolve();
 async function request(path,method='GET',body,keepalive=false){
  const response=await fetch('/api/world'+path,{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,keepalive,signal:keepalive?undefined:AbortSignal.timeout(8000)});
  const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error||'Could not reach your neighborhood.'),{status:response.status});return result;
 }
 function place(){return HOMES.find(p=>p.id===data.home?.homeId)||HOMES[0];}
 function address(home=data.home){const h=HOMES.find(p=>p.id===home?.homeId);return h?h.name+' · UNIT '+String(home.unit).padStart(3,'0'):'Your keys are waiting';}
 function applyHome(){const key=JSON.stringify(data.home);if(key===lastHome)return;lastHome=key;api.homeChanged(data.home,place());}
 async function load(){const next=await request('');data={...data,...next};loaded=true;applyHome();}
 function open(next='servers'){if(!api.canOpen())return;tab=next;api.pause();error='';render();if(!loaded){busy=true;render();load().catch(e=>{error=e.message;}).finally(()=>{busy=false;if(isOpen())render();});}}
 function isOpen(){return $('modalRoot').classList.contains('world-shade');}
 function homeBoard(){const home=data.home;
  if(!home)return '<div class="world-empty"><h3>YOUR FIRST SET OF KEYS</h3><p>Join a neighborhood to get a permanent in-game address and 120 home credits for your first upgrade.</p><button data-world-tab="servers" class="primary">FIND MY NEIGHBORHOOD</button></div>';
  return '<div class="world-banner"><span><strong>'+esc(address())+'</strong>LEVEL '+home.level+' · '+esc(HOME_UPGRADES[home.level].name)+'</span><span><strong>'+home.credits+' HOME CR</strong>'+home.deliveries+' NEIGHBORHOOD JOBS</span></div><div class="world-grid">'+HOME_UPGRADES.slice(1).map(u=>'<article class="world-card"><span class="world-badge">LEVEL '+u.level+'</span><h3>'+u.name+'</h3><p>'+u.description+'</p><button data-world-upgrade="'+u.level+'" '+(busy||u.level!==home.level+1||home.credits<u.cost?'disabled':'')+' class="'+(u.level===home.level+1?'primary':'small-btn')+'">'+(u.level<=home.level?'INSTALLED':u.level>home.level+1?'FINISH LEVEL '+(u.level-1)+' FIRST':u.cost+' HOME CR · UPGRADE')+'</button></article>').join('')+'</div><p class="world-note">Home credits come from neighborhood deliveries and stay with your account. Your upgrades appear inside your apartment.</p><button id="worldSeeHome" class="primary">GO TO MY APARTMENT →</button>';
 }
 function jobBoard(){const current=NEIGHBORHOOD_JOBS.find(j=>j.id===data.home?.job?.id);
  return (current?'<div class="world-banner"><span><strong>'+current.name+'</strong>'+(data.home.job.stage?'Deliver to '+current.to.name:'Collect from '+current.from.name)+'</span><button id="worldTrackJob" class="primary">TRACK JOB</button></div>':'<p>Explore the outer neighborhoods, help your neighbors, and earn upgrades for your place.</p>')+'<div class="world-grid">'+NEIGHBORHOOD_JOBS.map(j=>'<article class="world-card"><span class="world-badge">+'+j.reward+' HOME CR</span><h3>'+j.name+'</h3><p>'+j.description+'</p><p>'+j.from.name+' → '+j.to.name+'</p><button data-world-job="'+j.id+'" '+(!session||busy||current?'disabled':'')+' class="primary">TAKE THE JOB</button></article>').join('')+'</div>'+(!session?'<p class="world-note">Join an online neighborhood to take a job.</p>':'')+(current?'<button id="worldCancelJob" class="small-btn">CANCEL CURRENT JOB</button>':'');
 }
 function serverBoard(){
  if(!loaded)return error?'<p>Your online neighborhood could not load. Solo play is still available.</p><button id="worldRefresh" class="primary">TRY AGAIN</button>':'<p role="status">Finding your neighborhood…</p>';
  if(!data.profile)return '<p>Pick the name other drivers will see in the city.</p><form id="worldCreate" class="world-form"><label>PLAYER NAME<input id="worldName" required minlength="2" maxlength="24" autocomplete="nickname" placeholder="Your driver name"></label><button class="primary" '+(busy?'disabled':'')+'>CREATE MY DRIVER</button></form><p class="world-note">Players in your server can see your player name, car, and in-game address.</p>';
  return '<div class="world-banner"><span><strong>'+esc(data.profile.name)+'</strong>'+(session?'NEIGHBORHOOD '+String(roomId).padStart(2,'0')+' · '+(peers.length+1)+' / '+ROOM_CAPACITY+' PLAYERS':'READY TO MEET THE NEIGHBORS')+'</span><button id="worldJoin" class="primary" '+(busy?'disabled':'')+'>'+(session?'SWITCH SERVER':'JOIN A NEIGHBORHOOD')+'</button></div>'+(session?'<p class="world-note">Share the streets on foot or in your car. Open NEIGHBORHOOD for live home visits, chat, crew jobs and furnishing. Traffic and solo passenger shifts remain personal.</p><div class="world-row"><button id="worldCruise" class="primary">DRIVE WITH THE NEIGHBORS →</button><button id="worldLeave" class="small-btn">LEAVE SERVER</button></div><h3>IN YOUR NEIGHBORHOOD</h3>'+(peers.length?peers.map(p=>'<div class="world-row"><span><strong>'+esc(p.name)+'</strong><small>'+esc(address(p))+' · '+esc(p.mode)+'</small></span><button data-world-follow="'+esc(p.id)+'">SET ROUTE</button></div>').join(''):'<p>No other drivers are here yet. Friends with access to this Site can join Neighborhood '+String(roomId).padStart(2,'0')+'.</p>'):'<p>Drive together in 16-player neighborhoods. Your assigned home and its upgrades follow your account between servers.</p>')+'<h3>SERVER LIST</h3>'+(data.rooms.length?data.rooms.map(r=>'<div class="world-row"><span>'+esc(r.name)+'<small>'+r.players+' / '+r.capacity+' PLAYERS</small></span><button data-world-room="'+r.id+'" '+(busy||r.players>=r.capacity?'disabled':'')+'>JOIN</button></div>').join(''):'<p>The first neighborhood opens when you join.</p>')+'<div class="world-row"><a href="/crew/" class="small-btn">FRIENDS &amp; CREW →</a><button id="worldRefresh" class="small-btn">REFRESH SERVERS</button></div>';
 }
 function render(){
  api.modal('<div class="world-dialog"><button class="modal-close" data-close aria-label="Close neighborhoods">×</button><span class="world-badge">GETAWAY / THE NEIGHBORHOOD</span><h2 id="dialogTitle">MAKE YOURSELF AT HOME.</h2><div class="world-tabs">'+[['servers','ONLINE'],['home','MY HOME'],['jobs','JOBS']].map(([id,label])=>'<button data-world-tab="'+id+'" aria-pressed="'+(tab===id)+'">'+label+'</button>').join('')+'</div>'+(error?'<p class="world-error" role="alert">'+esc(error)+'</p>':'')+(tab==='home'?homeBoard():tab==='jobs'?jobBoard():serverBoard())+'</div>',true);
  $('modalRoot').classList.add('world-shade');
  document.querySelectorAll('[data-world-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.worldTab;render();});
  document.querySelectorAll('[data-world-room]').forEach(b=>b.onclick=()=>act(()=>join(Number(b.dataset.worldRoom))));
  document.querySelectorAll('[data-world-upgrade]').forEach(b=>b.onclick=()=>act(async()=>{const next=await request('/upgrade','POST',{level:Number(b.dataset.worldUpgrade)});data.home=next.home;applyHome();api.notify('HOME UPGRADED · '+HOME_UPGRADES[data.home.level].name);}));
  document.querySelectorAll('[data-world-job]').forEach(b=>b.onclick=()=>act(async()=>{await jobAction('start',b.dataset.worldJob);trackJob();}));
  document.querySelectorAll('[data-world-follow]').forEach(b=>b.onclick=()=>{const p=peers.find(p=>p.id===b.dataset.worldFollow);if(p){api.close();api.routeTo({...p,name:p.name});}});
  if($('worldCreate'))$('worldCreate').onsubmit=e=>{e.preventDefault();const name=$('worldName').value.trim();act(async()=>{const response=await fetch('/api/profile',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({name,avatar:'jules',status:'at-home',note:'',homeId:'last-exit'}),signal:AbortSignal.timeout(8000)});if(!response.ok){const r=await response.json();throw Error(r.error||'Could not create your driver.');}await load();});};
  if($('worldJoin'))$('worldJoin').onclick=()=>act(()=>join());
  if($('worldRefresh'))$('worldRefresh').onclick=()=>act(load);
  if($('worldLeave'))$('worldLeave').onclick=()=>act(leave);
  if($('worldCruise'))$('worldCruise').onclick=()=>{api.close();api.cruise(place());};
  if($('worldSeeHome'))$('worldSeeHome').onclick=()=>{api.close();api.goHome();};
  if($('worldTrackJob'))$('worldTrackJob').onclick=trackJob;
  if($('worldCancelJob'))$('worldCancelJob').onclick=()=>act(()=>jobAction('cancel',data.home.job.id));
 }
 async function act(fn){if(busy)return;busy=true;error='';render();try{await fn();}catch(e){error=e.message;}finally{busy=false;if(isOpen())render();refreshHUD();}}
 async function join(id){const result=await request('/join','POST',id?{roomId:id}:{});session=result.session;roomId=result.roomId;data.profile=result.profile;data.home=result.home;seq=0;lastPoll=Date.now();failures=0;error='';clearPeers();applyHome();await load();api.joined?.();api.notify('WELCOME HOME · '+address());}
 async function leave(){const old=session;session=null;roomId=null;clearPeers();refreshHUD();if(old)await request('/leave','POST',{session:old});}
 function disposePeer(p){p.view.group.removeFromParent();p.human?.dispose();p.view.root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});p.label.material.map.dispose();p.label.material.dispose();}
 function clearPeers(){peers=[];for(const p of views.values())disposePeer(p);views.clear();}
 function label(name){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#263f28';c.fillRect(0,0,512,96);c.fillStyle='#a2cb67';c.fillRect(0,0,512,10);c.strokeStyle='#1c2b1b';c.lineWidth=7;c.strokeRect(0,0,512,96);c.fillStyle='#fff1c7';c.textAlign='center';c.textBaseline='middle';c.font='700 34px monospace';c.fillText(name,256,53,465);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(6,1.125,1);sprite.position.y=4.5;sprite.renderOrder=30;return sprite;}
 function updatePeers(list){
  const before=JSON.stringify(peers.map(p=>[p.id,p.name,p.mode,p.homeId,p.unit]));
  peers=list.filter(p=>p.id!==data.profile?.id);const keep=new Set(peers.map(p=>p.id));
  for(const [id,p]of views)if(!keep.has(id)){disposePeer(p);views.delete(id);}
  for(const p of peers){let item=views.get(p.id);if(item&&(item.carId!==p.carId||item.name!==p.name||item.avatar!==p.avatar||item.style!==JSON.stringify(p.carStyle))){disposePeer(item);views.delete(p.id);item=null;}
   if(!item){const cfg=CARS[p.carId]||CARS.van,view=makeVehicle(DETAILED_STAND_INS[cfg.model]||cfg.model,cfg.scale,PAINTS[p.id.charCodeAt(0)%PAINTS.length],p.carStyle?{...p.carStyle,customPaint:p.carStyle.paint,underglowColor:p.carStyle.underglow}:null);view.group.userData.playerId=p.id;api.world.add(view.group);const tag=label(p.name);view.group.add(tag);const human=api.human?.(p.avatar);if(human){human.group.name='Neighbor / '+p.name;api.world.add(human.group);}item={view,human,avatar:p.avatar,style:JSON.stringify(p.carStyle),label:tag,carId:p.carId,name:p.name,current:{x:p.x,z:p.z,heading:p.heading},target:p};views.set(p.id,item);}item.target=p;
  }
  if(!busy&&tab==='servers'&&isOpen()&&before!==JSON.stringify(peers.map(p=>[p.id,p.name,p.mode,p.homeId,p.unit])))render();
 }
 async function sync(){
  if(!session||syncing||disposed)return;syncing=true;const token=session;
  try{await interiorUpdate;const s=api.state();const result=await request('/sync','POST',{session:token,seq:++seq,x:s.x,z:s.z,heading:s.heading,mode:s.mode,carId:s.carId,travel:s.travel,local:api.localPosition?.()?{x:api.localPosition().x,z:api.localPosition().z}:undefined});if(token!==session)return;data.home=result.home;applyHome();updatePeers(result.players);if(result.evicted)api.evicted?.();failures=0;error='';}
  catch(e){if(token!==session)return;failures++;if([401,409,422].includes(e.status)||failures>=4){session=null;roomId=null;clearPeers();error=e.message;api.notify('NEIGHBORHOOD DISCONNECTED · Open ONLINE to rejoin.');}else retryAt=Date.now()+2000;}
  finally{syncing=false;refreshHUD();}
 }
 async function jobAction(action,id){const result=await request('/jobs','POST',{session,action,id});data.home=result.home;applyHome();if(result.reward){api.notify('DELIVERY COMPLETE · +'+result.reward+' HOME CR');api.jobCompleted(result.reward);}return result;}
 function trackJob(){const job=NEIGHBORHOOD_JOBS.find(j=>j.id===data.home?.job?.id);if(!job)return;const point=data.home.job.stage?job.to:job.from;api.close();if(api.state().mode!=='driving')api.cruise(place());api.routeTo(point);refreshHUD();}
 function refreshHUD(){
  const button=$('worldButton');if(button){const title=session?'ONLINE · '+(peers.length+1)+' / '+ROOM_CAPACITY:'ONLINE / HOMES';if(button.textContent!==title)button.textContent=title;button.dataset.connected=String(!!session);button.title=session?'Neighborhood '+roomId:'Join a shared city and upgrade your home';}
  const target=$('worldTarget');if(!target)return;const s=api.state(),job=NEIGHBORHOOD_JOBS.find(j=>j.id===data.home?.job?.id);
  target.classList.toggle('hidden',!session||!job||s.mode!=='driving');if(!session||!job||s.mode!=='driving')return;
  const stage=data.home.job.stage,point=stage?job.to:job.from,near=dist(s,point)<12&&s.speed<2;
  const key=[job.id,stage,near,jobBusy,Math.round(dist(s,point)/10)].join(':');if(target.dataset.render===key)return;target.dataset.render=key;
  target.innerHTML='<strong>'+esc(job.name)+'</strong><small>'+(stage?'DELIVER TO ':'PICK UP AT ')+point.name+' · '+Math.round(dist(s,point))+' m</small><button id="worldJobAction" class="'+(near?'primary':'small-btn')+'" '+(jobBusy?'disabled':'')+'>'+(jobBusy?'SAVING…':near?stage?'COMPLETE DELIVERY · +'+job.reward+' HOME CR':'COLLECT PARCEL':'SET GPS ROUTE')+'</button>';
  $('worldJobAction').onclick=async()=>{if(jobBusy)return;if(!near){api.routeTo(point);return;}jobBusy=true;refreshHUD();try{await sync();if(!session)throw Error('Reconnect to your neighborhood first.');await jobAction(stage?'finish':'pickup',job.id);if(!stage)api.routeTo(job.to);}catch(e){api.notify(e.message);}finally{jobBusy=false;refreshHUD();}};
 }
 function update(dt){const now=Date.now();if(session&&!syncing&&now-lastPoll>900&&now>=retryAt&&!document.hidden){lastPoll=now;void sync();}const s=api.state();for(const item of views.values()){
 const t=item.target,c=item.current,inside=t.mode==='apartment'||t.mode==='garage',onFoot=inside||t.travel==='foot',parent=inside?api.roomScene?.():api.world,visible=inside?t.mode===s.mode&&t.hostId===api.roomOwner?.():s.mode==='driving'&&dist(s,t)<160;
 const tx=inside?t.localX:t.x,tz=inside?t.localZ:t.z,space=inside?t.mode+':'+t.hostId:'city';if(item.space!==space||Math.hypot(c.x-tx,c.z-tz)>100){c.x=tx;c.z=tz;item.space=space;}const f=1-Math.exp(-dt*8),moving=Math.hypot(c.x-tx,c.z-tz)>.06;c.x+=(tx-c.x)*f;c.z+=(tz-c.z)*f;c.heading+=Math.atan2(Math.sin(t.heading-c.heading),Math.cos(t.heading-c.heading))*f;
 item.view.group.visible=visible&&!onFoot;animateVehicle(item.view,{...c,y:0,vy:0,yawRate:0,speed:moving?8:0,steering:0,drifting:false,braking:!moving,boosting:false,config:CARS[item.carId],wheelTravel:now*.008},dt);
 if(item.human){const h=item.human;if(parent&&h.group.parent!==parent)parent.add(h.group);h.group.visible=visible&&onFoot;h.group.position.set(c.x,inside?(t.mode==='garage'?.035:.36):.18,c.z);h.group.rotation.y=c.heading;if(t.emoteAt!==item.emoteAt){item.emoteAt=t.emoteAt;h.emote(t.emote,t.emoteAt+3200);}h.update(dt,moving);if(onFoot){h.group.add(item.label);item.label.position.y=2.3;item.label.scale.set(2.1,.39,1);}else{item.view.group.add(item.label);item.label.position.y=4.5;item.label.scale.set(6,1.125,1);}}
 }refreshHUD();}
 $('worldButton').onclick=()=>open();
 addEventListener('pagehide',()=>{disposed=true;if(session)void request('/leave','POST',{session},true).catch(()=>{});});
 function enterInterior(mode){if(!session)return;const token=session;interiorUpdate=interiorUpdate.catch(()=>{}).then(()=>request('/interior','POST',{session:token,mode,hostId:api.roomOwner?.()})).catch(()=>{});lastPoll=Date.now()+400;}
 return {session:()=>session,profile:()=>data.profile,sync,open,update,load:()=>load().catch(()=>{}),enterInterior,connected:()=>!!session,peers:()=>peers,room:()=>roomId,home:()=>data.home,place,job:()=>data.home?.job,trackJob,state:()=>({connected:!!session,roomId,players:peers.length+(session?1:0),home:data.home,error}),join,leave};
}
