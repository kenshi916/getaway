import {connectFooter} from './site-config.js?v=23';
connectFooter();
let showcase;
function start(){showcase??=import('./showcase.js?v=23').then(m=>m.startShowcase()).catch(error=>{console.error(error);const note=document.getElementById('cityLoading');if(note)note.innerHTML='EXPLORE THE CITY IN-GAME<span>Open GETAWAY to see the full map</span>';});}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();start();}},{rootMargin:'300px'});observer.observe(document.getElementById('city'));}else start();

const sectionTabs=[...document.querySelectorAll('[data-site-tab]')];let tabsPending=false;function markTab(){tabsPending=false;const marker=Math.min(innerHeight*.4,280),selected=sectionTabs.find(tab=>{const section=document.getElementById(tab.dataset.siteTab),r=section?.getBoundingClientRect();return r&&r.top<=marker&&r.bottom>marker;});for(const tab of sectionTabs){if(tab===selected)tab.setAttribute('aria-current','location');else tab.removeAttribute('aria-current');}}function queueTab(){if(!tabsPending){tabsPending=true;requestAnimationFrame(markTab);}}addEventListener('scroll',queueTab,{passive:true});addEventListener('resize',queueTab);markTab();
