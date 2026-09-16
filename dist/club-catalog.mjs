export const CLUB={id:'last-hand',name:'Last Hand Casino',x:54,z:36,entrance:{x:59,z:36},radius:12};
export const TABLES=[{id:1,name:'Clover table',x:-4,z:-2},{id:2,name:'Diamond table',x:4,z:-2}];
export const DAILY_STOPS=[
 {id:'garden',name:'Help the community garden',x:90,z:-72,action:'Tidy the planting beds',material:'wood',quantity:3,credits:20},
 {id:'workshop',name:'Sort Rae’s spare parts',x:-90,z:36,action:'Sort the reusable parts',material:'scrap',quantity:3,credits:20},
 {id:'market',name:'Pack the market stalls',x:90,z:36,action:'Fold the spare canvas',material:'fabric',quantity:3,credits:20}
];
export const RECIPES=[
 {id:'crafted-planter',name:'Neighborhood planter',materials:{wood:3,scrap:1}},
 {id:'crafted-chair',name:'Reclaimed lounge chair',materials:{wood:3,fabric:3}}
];
export const utcDay=now=>new Date(now).toISOString().slice(0,10);
export function handValue(cards){let total=0,aces=0;for(const c of cards){const rank=c%13;total+=rank===0?11:Math.min(rank+1,10);if(rank===0)aces++;}while(total>21&&aces-->0)total-=10;return total;}
export const cardName=n=>n===null?'Hidden card':['A','2','3','4','5','6','7','8','9','10','J','Q','K'][n%13]+['♣','♦','♥','♠'][Math.floor(n/13)];
