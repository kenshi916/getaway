// Shared catalog, kept dependency-free for the Worker and the game client.
export const WORLD_LIMIT=390;
export const ROOM_CAPACITY=16;
export const WORLD_TTL=20000;
export const HOME_UPGRADES=[
 {level:0,name:'Starter keys',cost:0,description:'Your own address, a furnished apartment, and garage access.'},
 {level:1,name:'Garden retreat',cost:120,description:'Indoor planters, a green woven rug, and fresh color in your living room.'},
 {level:2,name:'Creative loft',cost:260,description:'An expanded display shelf, a music corner, and warm accent lighting.'},
 {level:3,name:'Penthouse finish',cost:480,description:'Premium flooring, a golden feature wall, and your neighborhood trophy.'}
];
export const NEIGHBORHOOD_JOBS=[
 {id:'garden-supply',name:'Flowers for the neighbors',from:{x:90,z:-72,name:'NORTH GARDENS'},to:{x:342,z:36,name:'CITRUS GARDEN HOUSE'},reward:70,description:'Collect a flower delivery and bring it to Citrus Estate.'},
 {id:'pine-pantry',name:'Stock the lodge',from:{x:36,z:-54,name:'NIGHT MARKET'},to:{x:36,z:-342,name:'PINE RIDGE LODGE'},reward:75,description:'The lodge needs groceries. Pick up a box at Night Market.'},
 {id:'sunshore',name:'Sunshore housewarming',from:{x:0,z:54,name:'24H DINER'},to:{x:36,z:342,name:'SUNSHORE APARTMENT'},reward:75,description:'Take a dinner box to the new neighbors on the south side.'},
 {id:'coast-courier',name:'Coast to coast',from:{x:342,z:0,name:'CITRUS CORNER STORE'},to:{x:-342,z:36,name:'COASTAL COTTAGE'},reward:120,description:'A long cross-city parcel run to the cottages on the coast.'}
];
