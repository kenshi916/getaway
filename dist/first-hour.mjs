// Cosmetic story progression. Arcade rewards never represent tokens or cash.
export const FIRST_JOBS=[
 {id:'supper',stop:'diner',dest:'south',chapter:0,name:'A warm welcome',person:'Jules',copy:'Meet Jules at the diner. Bring supper to Riverside Homes, open the door, and finish the handoff inside.',after:'Jules put in a good word with Mina. She has something green for your new place.'},
 {id:'cuttings',stop:'market',dest:'gardens',chapter:0,name:'Room to grow',person:'Mina',copy:'Mina is waiting at Night Market. Take her seedlings to North Gardens and help at the potting table.',after:'The gardens are ready. Rae can help you give your garage a new finish.'},
 {id:'workshop',stop:'roadhouse',dest:'southyard',chapter:1,name:'Make it yours',person:'Rae',copy:'Collect Rae from Roadhouse. Try a clean boost on the way to South Motor Yard, then check the work order inside.',after:'Your housewarming kit is ready. Bank your haul at Last Exit to collect it.'}
];
export const HOME_THEMES=[
 {id:'cedar',name:'Cedar & cream',wall:'#dfc49a',wood:'#b28a58',fabric:'#cb754e',rug:'#cd9e62',garage:'#233e43',accent:'#ffc55c'},
 {id:'garden',name:'Garden studio',wall:'#b5ce9e',wood:'#b49560',fabric:'#538a71',rug:'#78994c',garage:'#20463e',accent:'#a7e267'},
 {id:'coastal',name:'Coastal blue',wall:'#adcbd4',wood:'#c5ad85',fabric:'#477aa7',rug:'#718fb1',garage:'#223d60',accent:'#77d6ff'},
 {id:'sunset',name:'Sunset loft',wall:'#d7aaa0',wood:'#a77a56',fabric:'#9c5c75',rug:'#a77582',garage:'#4c2940',accent:'#ffb477'}
];
export const CAR_COLORS=[{name:'Gold',color:'#ffc23d'},{name:'Mint',color:'#21cbbb'},{name:'Coral',color:'#ed5949'},{name:'Cobalt',color:'#6494ff'},{name:'Pearl',color:'#eae5d5'},{name:'Plum',color:'#744b84'}];
export const WHEEL_FINISHES=[{id:'graphite',name:'Graphite',color:'#303b40'},{id:'silver',name:'Polished silver',color:'#c7d9df'},{id:'gold',name:'Brushed gold',color:'#d5b16b'}];
export const DEFAULT_DECOR={theme:'cedar',garageFloor:'teal',floor:'oak',rug:'woven',plants:true,art:'city',lamp:'warm',paint:0,wheels:'graphite',underglow:false};
export function cleanDecor(raw={}){const d={...DEFAULT_DECOR};for(const [key,values]of Object.entries({theme:HOME_THEMES.map(t=>t.id),garageFloor:['teal','terracotta','midnight'],floor:['oak','walnut','sand'],rug:['woven','stripe','none'],art:['city','records','botanical'],lamp:['warm','mint','rose'],wheels:WHEEL_FINISHES.map(w=>w.id)}))if(values.includes(raw?.[key]))d[key]=raw[key];if(Number.isInteger(raw?.paint)&&raw.paint>=0&&raw.paint<CAR_COLORS.length)d.paint=raw.paint;for(const key of ['plants','underglow'])if(typeof raw?.[key]==='boolean')d[key]=raw[key];return d;}
export function firstHourState(raw={}){return {movedIn:raw?.movedIn===true,starter:raw?.starter===true,completed:Math.max(0,Math.min(3,Math.floor(Number(raw?.completed)||0))),banked:raw?.banked===true,reward:raw?.reward===true,decorated:raw?.decorated===true,invited:raw?.invited===true,decor:cleanDecor(raw?.decor)};}
export function nextChapter(s){return !s.movedIn?'move':!s.starter?'starter':s.completed<3?'jobs':!s.banked?'bank':!s.reward?'reward':!s.decorated?'decorate':!s.invited?'invite':'complete';}
export function advanceFirstHour(raw,event){const s=firstHourState(raw);switch(event?.type){
 case 'move':s.movedIn=true;break;
 case 'starter':if(!s.movedIn)throw Error('Collect your apartment keys first.');s.starter=true;break;
 case 'delivery':{if(!s.starter)throw Error('Choose your starter ride first.');const i=FIRST_JOBS.findIndex(j=>j.id===event.job);if(i<0||i>s.completed)throw Error('Finish the current story job first.');if(i===s.completed)s.completed++;break;}
 case 'bank':if(s.completed===3)s.banked=true;break;
 case 'reward':if(!s.banked)throw Error('Finish the three jobs and bank your haul first.');s.reward=true;break;
 case 'decorate':if(s.reward)s.decorated=true;break;
 case 'invite':if(s.decorated)s.invited=true;break;
 default:throw Error('Choose a valid chapter action.');
 }return s;}
export function chapterInfo(s){const phase=nextChapter(s);return {
 move:['YOUR NEW KEYS','Meet Jules outside, follow the marked path, and open your apartment door to collect your keys.','MEET JULES'],
 starter:['YOUR FIRST RIDE','Choose a paint finish for your free Workhorse in the garage.','CHOOSE STARTER'],
 jobs:[FIRST_JOBS[s.completed]?.name,FIRST_JOBS[s.completed]?.copy,'CONTINUE STORY'],
 bank:['BRING IT HOME','Return to Last Exit and bank your haul to earn the housewarming kit.','ROUTE TO GARAGE'],
 reward:['A PLACE OF YOUR OWN','You earned a planter collection, a feature rug, and garage lighting.','CLAIM HOUSEWARMING KIT'],
 decorate:['PUT YOUR STAMP ON IT','Choose your walls, floors, rug, artwork, lighting, and car finish.','CUSTOMIZE MY PLACE'],
 invite:['ROOM FOR COMPANY','Create a home-tour link and invite a friend to see your saved design.','INVITE A FRIEND'],
 complete:['WELCOME TO THE NEIGHBORHOOD','Your first chapter is complete. Keep making this place yours.','CUSTOMIZE MY PLACE']
 }[phase];}
