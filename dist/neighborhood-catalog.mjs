export const FURNITURE=[
 {id:'crafted-planter',name:'Neighborhood planter',model:'plant-small',cost:0,width:1.1,depth:1.1,reward:true},
 {id:'crafted-chair',name:'Reclaimed lounge chair',model:'chair-lounge',cost:0,width:1.2,depth:1.2,reward:true},
 {id:'fern',name:'Courtyard fern',model:'plant-small',cost:35,width:.8,depth:.8},
 {id:'armchair',name:'Sunday armchair',model:'chair-lounge',cost:100,width:1.2,depth:1.2},
 {id:'coffee-table',name:'Oak coffee table',model:'table-coffee',cost:85,width:1.4,depth:.8},
 {id:'bookshelf',name:'Collector shelf',model:'bookcase-closed',cost:140,career:'courier',rank:1,width:1.3,depth:.6},
 {id:'lamp',name:'Reading light',model:'lamp-standing',cost:70,width:.65,depth:.65},
 {id:'delivery-crate',name:'First delivery table',model:'table-coffee',cost:0,width:.8,depth:.8,reward:true},
 {id:'crew-trophy',name:'Neighborhood champion',model:'plant-small',cost:0,width:.7,depth:.7,reward:true}
];
export const WALLPAPERS=[{id:'brick',name:'Loft brick',color:'#bb8066',cost:0},{id:'mint',name:'Garden mint',color:'#74ad90',cost:75},{id:'midnight',name:'Midnight blue',color:'#344960',cost:100},{id:'sunshine',name:'Sunroom yellow',color:'#dabd62',cost:90}];
export const CAR_PARTS=[
 {id:'paint-coral',name:'Coral paint',slot:'paint',value:'#f16d60',cost:80},
 {id:'paint-forest',name:'Forest paint',slot:'paint',value:'#31826a',cost:80},
 {id:'paint-ice',name:'Glacier paint',slot:'paint',value:'#89cce0',cost:90},
 {id:'wheels-gold',name:'Gold wheels',slot:'wheelColor',value:'#dcac4e',cost:120},
 {id:'wheels-black',name:'Obsidian wheels',slot:'wheelColor',value:'#151d25',cost:100},
 {id:'kit-street',name:'Street aero kit',slot:'bodyKit',value:'street',cost:200,career:'mechanic',rank:1},
 {id:'interior-cream',name:'Cream upholstery',slot:'seatColor',value:'#d9c9a5',cost:120},
 {id:'neon-mint',name:'Mint underglow',slot:'underglow',value:'#7ee0a0',cost:180,career:'racer',rank:1}
];
export const EMOTES=[{id:'wave',name:'Wave',clip:'emote-yes',cost:0},{id:'cheer',name:'Celebrate',clip:'emote-yes',cost:0},{id:'dance',name:'Victory dance',clip:'walk',cost:80}];
export const CAREERS=[{id:'courier',name:'Courier',contact:'Mina',ranks:['New arrival','Route runner','City regular','Dispatch legend']},{id:'mechanic',name:'Mechanic',contact:'Rae',ranks:['Apprentice','Wrench hand','Tuner','Master builder']},{id:'racer',name:'Street racer',contact:'Theo',ranks:['Rookie','Club driver','Contender','Night champion']}];
export const rankFor=xp=>Math.min(3,Math.floor((xp||0)/100));
export const ACTIVITIES=[
 {id:'garden-run',name:'Fresh for the market',career:'courier',description:'Collect Mina’s plants and deliver them to the night market.',reward:85,xp:35,stops:[{x:90,z:-72,label:'Garden depot'},{x:90,z:36,label:'Night market'}]},
 {id:'tune-up',name:'Rae’s roadside rescue',career:'mechanic',description:'Collect parts, diagnose the engine, and fit the repair at the mechanic strip.',reward:95,xp:40,stops:[{x:36,z:54,label:'Last Exit parts counter'},{x:-90,z:36,label:'Mechanic strip'}],repair:['battery','coolant','ignition']},
 {id:'bay-sprint',name:'Boardwalk time trial',career:'racer',description:'Pass every gate in order. Your time starts at the first gate.',reward:100,xp:40,limit:120,stops:[{x:0,z:54,label:'Start gate'},{x:90,z:54,label:'East turn'},{x:90,z:342,label:'Harbor straight'},{x:0,z:342,label:'Finish gate'}]}
];
export const COOP_JOBS=[
 {id:'moving-day',name:'Moving day',description:'Bring the neighborhood’s first furniture delivery home together.',reward:120,xp:45,career:'courier',furniture:'delivery-crate',stops:[{x:36,z:54,label:'Collect at Last Exit'},{x:90,z:36,label:'Deliver to Market Apartments'}]},
 {id:'coast-convoy',name:'Coast convoy',description:'Stay together through three stops on the waterfront supply route.',reward:160,xp:55,career:'courier',stops:[{x:36,z:54,label:'Meet at Last Exit'},{x:0,z:342,label:'Harbor checkpoint'},{x:-90,z:342,label:'Coastal drop-off'}]},
 {id:'clean-getaway',name:'The clean getaway',description:'Pick up the crew, regroup at the market, and bring everyone to the safe house.',reward:180,xp:60,career:'racer',stops:[{x:90,z:-72,label:'Crew pickup'},{x:90,z:36,label:'Market rendezvous'},{x:-72,z:90,label:'West Court safe house'}]},
 {id:'motor-parts-run',name:'Rae’s parts convoy',description:'Meet outside the Motor Club, collect a shipment at Harbor Works, and bring it back together. Two to four drivers.',reward:150,xp:50,career:'mechanic',stops:[{x:-90,z:36,label:'Motor Club forecourt'},{x:-180,z:-198,label:'Harbor parts collection'},{x:-90,z:36,label:'Return to Rae’s Motor Club'}]}
];
export function weekInfo(now=Date.now()) {const d=new Date(now),day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);d.setUTCHours(0,0,0,0);const start=d.getTime(),week=Math.floor(start/604800000);return {id:d.toISOString().slice(0,10),endsAt:start+604800000,theme:['Harbor nights','Garden gathering','Market motors'][((week%3)+3)%3],career:['courier','mechanic','racer'][((week%3)+3)%3],target:3,reward:180,trophy:'crew-trophy',meet:{x:0,z:54,label:'Central Plaza car meet'}};}
export const HOME_EXPANSIONS=[{level:0,name:'Starter apartment',cost:0},{level:1,name:'Garden retreat',cost:120},{level:2,name:'Creative loft',cost:260},{level:3,name:'Penthouse studio',cost:480}];
export const freshNeighborhood=()=>({inventory:['fern'],placements:[],wallpapers:['brick'],wallpaper:'brick',parts:[],car:{},plate:'GETAWAY',emotes:['wave','cheer'],xp:{courier:0,mechanic:0,racer:0},weekly:{},receipts:[],activity:null,visits:0,homeOpen:false});

export const ADVANCED_ACTIVITIES=[
 {id:'courier-express',name:'Mina’s coastal express',career:'courier',rank:1,description:'Trusted couriers carry fresh supplies from the gardens to the waterfront.',reward:145,xp:55,stops:[{x:90,z:-72,label:'Mina’s garden depot'},{x:90,z:36,label:'Market stockroom'},{x:0,z:342,label:'Waterfront delivery'}]},
 {id:'mechanic-restoration',name:'Rae’s restoration run',career:'mechanic',rank:1,description:'Source rare parts and restore a collector’s ride with Rae.',reward:155,xp:60,stops:[{x:-90,z:36,label:'Rae’s workshop'},{x:-90,z:-180,label:'Salvage parts counter'},{x:36,z:54,label:'Last Exit restoration bay'}],repair:['suspension','brakes','road-test']},
 {id:'racer-circuit',name:'Theo’s city circuit',career:'racer',rank:1,description:'A longer club circuit for drivers who have earned their first rank.',reward:165,xp:60,limit:150,stops:[{x:0,z:54,label:'Central Plaza start'},{x:-90,z:54,label:'West bend'},{x:-90,z:342,label:'Coast gate'},{x:90,z:342,label:'East harbor gate'},{x:90,z:54,label:'Club finish'}]}
];
export function cityActivities(now=Date.now()){
 const w=weekInfo(now),index=['Harbor nights','Garden gathering','Market motors'].indexOf(w.theme),stops=[
 [{x:36,z:54,label:'Last Exit supplies'},{x:-90,z:342,label:'West harbor pier'},{x:90,z:342,label:'Harbor show delivery'}],
 [{x:90,z:-72,label:'Garden nursery'},{x:-72,z:90,label:'Riverside neighbors'},{x:90,z:36,label:'Market garden party'}],
 [{x:-90,z:36,label:'Mechanic strip'},{x:90,z:36,label:'Night market display'},{x:0,z:54,label:'Central Plaza car show'}]
 ][index];return [...ACTIVITIES,...ADVANCED_ACTIVITIES,{id:'weekly-route',name:w.theme+' supply run',career:'courier',description:'This week’s route visits three neighborhood stops. The route changes every Monday.',reward:130,xp:50,stops}];
}
