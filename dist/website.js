import {connectFooter} from './site-config.js?v=6';
connectFooter();
let showcase;
function start(){showcase??=import('./showcase.js?v=14').then(m=>m.startShowcase()).catch(error=>{console.error(error);const note=document.getElementById('cityLoading');if(note)note.innerHTML='EXPLORE THE CITY IN-GAME<span>Open GETAWAY to see the full map</span>';});}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();start();}},{rootMargin:'300px'});observer.observe(document.getElementById('city'));}else start();
