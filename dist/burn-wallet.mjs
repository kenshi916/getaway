import {BURN_CONFIG} from './burn-config.js?v=19';
import {BURN_ITEMS} from './collection.mjs?v=19';
import {METHODS} from './burn-methods.mjs?v=19';

const address=v=>typeof v==='string'&&/^0x[0-9a-f]{40}$/i.test(v)&&!/^0x0{40}$/i.test(v);
const word=v=>BigInt(v).toString(16).padStart(64,'0');
const accountWord=v=>v.slice(2).toLowerCase().padStart(64,'0');
export function createBurnWallet(config=BURN_CONFIG,provider=globalThis.ethereum){
 const live=config.enabled===true;
 let account=null,mask=0n,balance=0n,busy=false,revision=0;
 const request=(method,params=[])=>provider.request({method,params});
 const call=(to,data)=>request('eth_call',[{to,data},'latest']);
 const state=()=>({live,account,mask,balance,busy});
 function configured(){if(!live||!address(config.token)||!address(config.registry)||!/^0x[0-9a-f]+$/i.test(config.chainId)||!Number.isInteger(config.decimals)||config.decimals<0||config.decimals>36)throw Error('Live burns are not configured. Use the demo collection for now.');if(!provider?.request)throw Error('Open this page in an Ethereum wallet browser or use a wallet extension.');}
 async function identity(expected=account){const [accounts,chain]=await Promise.all([request('eth_accounts'),request('eth_chainId')]);if(!expected||account?.toLowerCase()!==expected.toLowerCase()||accounts[0]?.toLowerCase()!==expected.toLowerCase())throw Error('Wallet changed. Connect again before continuing.');if(BigInt(chain)!==BigInt(config.chainId))throw Error('Switch your wallet to the configured game network.');return expected;}
 async function sync(){configured();const current=await identity();const rev=revision;const [owned,funds]=await Promise.all([call(config.registry,METHODS.ownedMask+accountWord(current)),call(config.token,'0x70a08231'+accountWord(current))]);if(rev!==revision)throw Error('Wallet changed. Connect again.');mask=BigInt(owned);balance=BigInt(funds);return state();}
 async function connect(){configured();const accounts=await request('eth_requestAccounts');if(!address(accounts[0]))throw Error('No wallet account selected.');account=accounts[0];await identity();const [token,code,decimals]=await Promise.all([call(config.registry,METHODS.token),request('eth_getCode',[config.registry,'latest']),call(config.token,'0x313ce567')]);if(Number(BigInt(decimals))!==config.decimals)throw Error('The configured token decimals do not match the contract.');if(code==='0x'||('0x'+token.slice(-40)).toLowerCase()!==config.token.toLowerCase())throw Error('The unlock contract does not match the configured token.');return sync();}
 async function quote(itemId){configured();const item=BURN_ITEMS.find(i=>i.itemId===itemId);if(!item)throw Error('Unknown collection item.');await identity();const price=BigInt(await call(config.registry,METHODS.prices+word(itemId)));if(price<=0n)throw Error('This item is not available.');return price;}
 async function receipt(hash,onStatus){for(let i=0;i<60;i++){const r=await request('eth_getTransactionReceipt',[hash]);if(r){if(BigInt(r.status)!==1n)throw Error('Transaction failed. The item was not unlocked.');return r;}onStatus('Waiting for confirmation…');await new Promise(resolve=>setTimeout(resolve,2000));}throw Error('Transaction is still pending. Reconnect to refresh ownership before trying again.');}
 async function unlock(itemId,expectedPrice,onStatus=()=>{}){
  configured();if(busy)throw Error('Another burn is in progress.');busy=true;const actor=account,rev=revision;
  try{await identity(actor);const price=await quote(itemId);if(price!==expectedPrice)throw Error('The price changed. Review this item again.');await sync();if(mask&(1n<<BigInt(itemId)))throw Error('You already own this item.');if(balance<price)throw Error('Not enough tokens in this wallet.');
   const allowance=BigInt(await call(config.token,'0xdd62ed3e'+accountWord(actor)+accountWord(config.registry)));
   const send=async(to,data)=>{if(rev!==revision)throw Error('Wallet changed. Review the item again.');await identity(actor);return request('eth_sendTransaction',[{from:actor,to,data,value:'0x0'}]);};
   if(allowance<price){if(allowance>0n){onStatus('Reset the old allowance in your wallet.');await receipt(await send(config.token,'0x095ea7b3'+accountWord(config.registry)+word(0)),onStatus);}onStatus('Approve only the exact token amount in your wallet.');await receipt(await send(config.token,'0x095ea7b3'+accountWord(config.registry)+word(price)),onStatus);}
   onStatus('Confirm the burn and unlock in your wallet.');const hash=await send(config.registry,METHODS.unlock+word(itemId)+word(price));await receipt(hash,onStatus);await sync();if(!(mask&(1n<<BigInt(itemId))))throw Error('Ownership has not been verified yet. Reconnect to refresh.');return {hash,itemId};
  }catch(error){if(error?.code===4001)throw Error('Cancelled in your wallet. No unlock was granted.');throw error;}finally{busy=false;}
 }
 const invalidate=()=>{revision++;account=null;mask=0n;balance=0n;};provider?.on?.('accountsChanged',invalidate);provider?.on?.('chainChanged',invalidate);provider?.on?.('disconnect',invalidate);
 return {state,connect,sync,quote,unlock,config};
}
