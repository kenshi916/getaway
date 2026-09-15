import {DISTRICTS,LANDMARKS,BLOCKS,ROAD,LIMIT,HOME,STOPS,districtAt,closestRoad,route,dist,clamp} from './driving.mjs?v=20';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createCityAtlas(api){
 let filter='all',selected=null,center={x:0,z:0},span=592,drag=null;
 const $=id=>document.getElementById(id);
 function pois(state){return [{...HOME,id:'garage',kind:'garage'},...LANDMARKS.map(p=>({...p,kind:'waypoint'})),...state.jobs.map(j=>({...STOPS.find(p=>p.id===j.id),kind:'pickup',job:j.job})),...state.passengers.map(j=>({...j.dest,id:j.id,kind:'drop',job:j}))];}
 const shown=p=>filter==='all'||filter==='jobs'&&['pickup','drop'].includes(p.kind)||filter==='districts'&&p.kind==='waypoint'||p.kind==='garage';
 function svg(state){
  const focus=selected||state.origin,points=selected?route(state.origin,focus):state.route;
  const colors={garage:'#f4d985',pickup:'#8ee4ba',drop:'#81caff',waypoint:'#b9a4f7'};
  return '<svg id="atlasMap" viewBox="'+[center.x-span/2,center.z-span/2,span,span].join(' ')+'" role="img" aria-label="Interactive city atlas. Drag to pan; select a landmark below or click a road to set a waypoint.">'+
  '<rect x="-296" y="-296" width="592" height="592" fill="#122934"/>'+
  DISTRICTS.map(d=>'<rect x="'+(d.x-90)+'" y="'+(d.z-90)+'" width="180" height="180" fill="'+d.color+'" opacity=".07"/>').join('')+
  BLOCKS.map(b=>'<rect x="'+(b.x-b.w/2)+'" y="'+(b.z-b.d/2)+'" width="'+b.w+'" height="'+b.d+'" fill="'+(b.park?'#356c55':districtAt(b).color)+'" opacity="'+(b.park?'.8':'.34')+'"/>').join('')+
  ROAD.map(n=>'<path d="M-282 '+n+'H282 M'+n+' -282V282" stroke="#29434e" stroke-width="9"/>').join('')+
  '<path d="'+(points||[]).map((p,i)=>(i?'L':'M')+p.x+' '+p.z).join(' ')+'" fill="none" stroke="#ffe599" stroke-width="2.8" stroke-linejoin="round"/>'+
  DISTRICTS.map(d=>'<text x="'+d.x+'" y="'+(d.z-48)+'" text-anchor="middle" fill="'+d.color+'" font-family="Arial,sans-serif" font-size="10" font-weight="700" stroke="#122934" stroke-width="3" paint-order="stroke">'+d.name+'</text>').join('')+
  pois(state).filter(shown).map(p=>'<circle cx="'+p.x+'" cy="'+p.z+'" r="'+(p.kind==='garage'?6:4)+'" fill="'+colors[p.kind]+'" stroke="#101d29" stroke-width="2"/>').join('')+
  (selected?'<circle cx="'+selected.x+'" cy="'+selected.z+'" r="9" fill="none" stroke="#fff0bb" stroke-width="2"/><path d="M'+(selected.x-3)+' '+selected.z+'h6M'+selected.x+' '+(selected.z-3)+'v6" stroke="#fff0bb"/>':'')+
  '<g transform="translate('+state.origin.x+' '+state.origin.z+') rotate('+(-state.origin.heading*180/Math.PI||0)+')"><circle r="9" fill="#132632" stroke="#fff6d2"/><path d="M0 7L-5 -5L0 -2L5 -5Z" fill="#fff6d2"/></g></svg>';
 }
 function render(){
  const state=api.state(),list=pois(state).filter(shown),distance=selected?Math.round(route(state.origin,selected).reduce((n,p,i,a)=>n+(i?dist(a[i-1],p):0),0)):0;
  api.modal('<button class="modal-close" data-close aria-label="Close city atlas">×</button><header class="atlas-heading"><span>GETAWAY / CITY ATLAS</span><h2 id="dialogTitle">THE WHOLE NIGHT.</h2><p>9 districts · 256 junctions · '+(state.driving?'SHIFT PAUSED':'AT HOME')+'</p></header><div class="atlas-layout"><div class="atlas-cartography"><div class="atlas-tools"><button id="atlasOut" aria-label="Zoom out">−</button><button id="atlasIn" aria-label="Zoom in">+</button><button id="atlasFit">Full city</button><button id="atlasLocate">My car</button><b>N ↑</b></div><div class="atlas-map-wrap">'+svg(state)+'</div><div class="atlas-legend"><span>▲ YOU</span><span>● PICKUPS</span><span>◆ DISTRICTS</span><span>■ GARAGE</span></div><p class="atlas-hint">Drag to pan. Click a road to place a waypoint.</p></div><aside class="atlas-sidebar"><div class="atlas-filters">'+[['all','All'],['jobs','Jobs'],['districts','Districts']].map(([id,label])=>'<button data-atlas-filter="'+id+'" aria-pressed="'+(filter===id)+'">'+label+'</button>').join('')+'</div><div class="atlas-places">'+list.map(p=>'<button data-atlas-poi="'+p.kind+':'+p.id+'" aria-pressed="'+(selected?.id===p.id)+'"><span>'+esc(p.name)+'</span><small>'+esc(p.kind==='waypoint'?'DISTRICT':p.kind==='garage'?'BANK YOUR HAUL':p.kind==='drop'?'DROP-OFF':'PICKUP')+' · '+Math.round(dist(state.origin,p))+' m</small></button>').join('')+'</div><div class="atlas-selection"><span>'+(selected?'DESTINATION':'CURRENT DISTRICT')+'</span><h3>'+esc(selected?.name||districtAt(state.origin).name)+'</h3><p>'+esc(selected?(districtAt(selected).description):'Choose a district, pickup, or any road to plan your next drive.')+'</p>'+(selected?'<b>'+distance+' m BY ROAD</b><button id="atlasGo" class="primary">'+(state.driving?'SET ROUTE':'SAVE ROUTE & GO DOWNSTAIRS')+'</button>':'')+'<button id="atlasClear" class="small-btn">CLEAR WAYPOINT</button></div></aside></div>',true);
  $('modalRoot').classList.add('atlas-shade');
  document.querySelectorAll('[data-atlas-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.atlasFilter;render()});
  document.querySelectorAll('[data-atlas-poi]').forEach(b=>b.onclick=()=>{selected=pois(api.state()).find(p=>p.kind+':'+p.id===b.dataset.atlasPoi);center={x:selected.x,z:selected.z};span=216;render()});
  $('atlasIn').onclick=()=>{span=Math.max(108,span/1.6);render()};
  $('atlasOut').onclick=()=>{span=Math.min(592,span*1.6);render()};
  $('atlasFit').onclick=()=>{span=592;center={x:0,z:0};render()};
  $('atlasLocate').onclick=()=>{center={...state.origin};span=180;render()};
  $('atlasClear').onclick=()=>{selected=null;api.clear();render()};
  if(selected)$('atlasGo').onclick=()=>api.navigate(selected);
  const map=$('atlasMap');
  map.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;drag={x:e.clientX,y:e.clientY,center:{...center}};map.setPointerCapture?.(e.pointerId)});
  map.addEventListener('pointermove',e=>{if(!drag)return;const r=map.getBoundingClientRect(),scale=span/r.width;center={x:clamp(drag.center.x-(e.clientX-drag.x)*scale,-LIMIT,LIMIT),z:clamp(drag.center.z-(e.clientY-drag.y)*scale,-LIMIT,LIMIT)};map.setAttribute('viewBox',[center.x-span/2,center.z-span/2,span,span].join(' '))});
  map.addEventListener('pointerup',e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);drag=null;if(moved<6){const r=map.getBoundingClientRect(),point={x:center.x+(e.clientX-r.left)/r.width*span-span/2,z:center.z+(e.clientY-r.top)/r.height*span-span/2};const near=pois(state).filter(shown).find(p=>dist(p,point)<span*.025);selected=near||{...closestRoad(point),id:'custom',kind:'waypoint',name:'STREET WAYPOINT'};}render()});
  map.addEventListener('pointercancel',()=>{drag=null;render()});
 }
 return {open(){selected=null;center={x:0,z:0};span=592;filter='all';render()},isOpen:()=>document.getElementById('modalRoot')?.classList.contains('atlas-shade')};
}

