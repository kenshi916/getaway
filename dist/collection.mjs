// Stable item IDs are shared with the burn registry. Demo ownership is device-local.
export const SKINS=[
 {id:'stock',name:'FACTORY PAINT',kind:'skin',itemId:0,cost:0,color:null,description:'Your original paint. Always in the collection.'},
 {id:'afterglow',name:'AFTERGLOW',kind:'skin',itemId:1,cost:600,color:'#27e3c1',accent:'#e4ffed',metalness:.55,roughness:.25,description:'Electric mint paint. Pearl-white wheels.'},
 {id:'midnight',name:'MIDNIGHT',kind:'skin',itemId:2,cost:1200,color:'#25264c',accent:'#a381ff',metalness:.7,roughness:.23,description:'Deep violet bodywork with lavender trim.'},
 {id:'heatwave',name:'HEATWAVE',kind:'skin',itemId:3,cost:1800,color:'#f55230',accent:'#ffd178',metalness:.6,roughness:.27,description:'Candy-orange paint and warm gold wheels.'},
 {id:'chrome',name:'GHOST CHROME',kind:'skin',itemId:4,cost:2500,color:'#dcebf2',accent:'#343c4b',metalness:.94,roughness:.15,description:'Silver bodywork. Graphite wheels. A clean escape.'}
];
export const DRIVERS=[
 {id:'suit',name:'THE REGULAR',kind:'driver',itemId:0,cost:0,model:'suit',description:'Your original driver. Ready for the night shift.'},
 {id:'robber',name:'NIGHT BANDIT',kind:'driver',itemId:5,cost:900,model:'robber',description:'Masked up and ready for the next pickup.'},
 {id:'officer',name:'OFF DUTY',kind:'driver',itemId:6,cost:1400,model:'police-officer',description:'A familiar uniform with a new side job.'}
];
export const BURN_CARS={
 hatch:{id:'hatch',name:'ALLEY CAT',kind:'car',itemId:7,cost:2500,price:0,model:'hatchback',speed:25,accel:24,grip:13,steer:2.85,seats:2,health:85,scale:1.7,description:'Small footprint. Sharp turns. Made for backstreets.'},
 cab:{id:'cab',name:'NIGHT CAB',kind:'car',itemId:8,cost:4000,price:0,model:'taxi',speed:24,accel:19,grip:11.5,steer:2.45,seats:4,health:115,scale:1.7,description:'Four seats. More fares. The city’s hardest worker.'},
 suv:{id:'suv',name:'IRONHIDE',kind:'car',itemId:9,cost:6000,price:0,model:'suv',speed:23,accel:17,grip:12,steer:2.2,seats:3,health:165,scale:1.65,description:'Heavy armor for a rough night. Keep rolling.'}
};
export const BURN_ITEMS=[...SKINS,...DRIVERS,...Object.values(BURN_CARS)].filter(i=>i.itemId>0);
export const DEMO_START=25000;
export const defaultCollection=()=>({version:1,balance:DEMO_START,owned:[],skin:'stock',driver:'suit',history:[]});
export function cleanCollection(raw){const c=defaultCollection();if(!raw||raw.version!==1)return c;c.balance=Number.isFinite(raw.balance)?Math.max(0,Math.min(DEMO_START,Math.floor(raw.balance))):DEMO_START;c.owned=[...new Set(Array.isArray(raw.owned)?raw.owned:[])].filter(id=>BURN_ITEMS.some(i=>i.itemId===id));if(SKINS.some(i=>i.id===raw.skin))c.skin=raw.skin;if(DRIVERS.some(i=>i.id===raw.driver))c.driver=raw.driver;c.history=(Array.isArray(raw.history)?raw.history:[]).filter(h=>h&&BURN_ITEMS.some(i=>i.itemId===h.itemId)&&Number.isFinite(h.at)).slice(-30).map(h=>({itemId:h.itemId,at:h.at,cost:BURN_ITEMS.find(i=>i.itemId===h.itemId).cost}));return c;}
export function ownsItem(collection,item,mask=null){return !item.itemId||(mask===null?collection.owned.includes(item.itemId):(mask&(1n<<BigInt(item.itemId)))!==0n);}
export function burnDemo(collection,itemId,now=Date.now()){
 const item=BURN_ITEMS.find(i=>i.itemId===itemId);if(!item)throw Error('This item is not in the collection.');
 if(ownsItem(collection,item))throw Error('You already own this item.');if(collection.balance<item.cost)throw Error('Not enough demo tokens.');
 collection.balance-=item.cost;collection.owned.push(itemId);collection.history.push({itemId,at:now,cost:item.cost});collection.history=collection.history.slice(-30);return item;
}
