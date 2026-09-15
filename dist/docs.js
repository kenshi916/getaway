import {connectFooter} from './site-config.js?v=17';
connectFooter();
const links=[...document.querySelectorAll('.docs-sidebar nav a')];
function highlight(id){for(const link of links){if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible.length)highlight(visible[0].target.id);},{rootMargin:'-120px 0px -58% 0px'});for(const section of document.querySelectorAll('.docs-content section'))observer.observe(section);}
for(const link of links)link.addEventListener('click',()=>highlight(link.hash.slice(1)));
highlight(location.hash.slice(1)||'overview');
