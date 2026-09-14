// Replace these values with the project's announced profile and contract at launch.
export const SITE_CONFIG={twitterUrl:'https://x.com/',contractAddress:''};
export function connectFooter(){
 for(const link of document.querySelectorAll('[data-twitter]'))link.href=SITE_CONFIG.twitterUrl;
 const address=SITE_CONFIG.contractAddress.trim();
 for(const value of document.querySelectorAll('[data-contract]'))value.textContent=address||'COMING AT LAUNCH';
 for(const button of document.querySelectorAll('[data-copy-contract]')){button.hidden=!address;button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(address);button.textContent='COPIED';setTimeout(()=>button.textContent='COPY CA',1800);}catch{button.textContent='SELECT TO COPY';}});}
}
