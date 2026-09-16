import {getWalletSession} from './wallet-session.mjs?v=38';
import {BURN_CONFIG} from './burn-config.js?v=38';
import {BURN_ITEMS} from './collection.mjs?v=38';
import {METHODS} from './burn-methods.mjs?v=38';

const address=v=>typeof v==='string'&&/^0x[0-9a-f]{40}$/i.test(v)&&!/^0x0{40}$/i.test(v);
const word=v=>BigInt(v).toString(16).padStart(64,'0');
const accountWord=v=>v.slice(2).toLowerCase().padStart(64,'0');
export function createBurnWallet(config=BURN_CONFIG,provider){
 const session=provider?null:getWalletSession(),currentProvider=()=>provider||session.getProvider();
 let live=config.enabled===true;
 let account=null,mask=0n,balance=0n,busy=false,revision=0;
 const request=(method,params=[])=>{const p=currentProvider();if(!p?.request)throw Error('Connect a wallet from the GETAWAY website first.');return p.request({method,params});};
 const call=(to,data)=>request('eth_call',[{to,data},'latest']);
 const state=()=>({live,account,mask,balance,busy});
 function configured(allowUnconnected=false){if(!live||!address(config.token)||!address(config.registry)||!/^0x[0-9a-f]+$/i.test(config.chainId)||!Number.isInteger(config.decimals)||config.decimals<0||config.decimals>36)throw Error('Live burns are not configured. Use the demo collection for now.');if(!allowUnconnected&&!currentProvider()?.request)throw Error('Connect a wallet from the GETAWAY website first.');}
 async function identity(expected=account){const [accounts,chain]=await Promise.all([request('eth_accounts'),request('eth_chainId')]);if(!expected||account?.toLowerCase()!==expected.toLowerCase()||accounts[0]?.toLowerCase()!==expected.toLowerCase())throw Error('Wallet changed. Connect again before continuing.');if(BigInt(chain)!==BigInt(config.chainId))throw Error('Switch your wallet to the configured game network.');return expected;}
 async function sync(){configured();const current=await identity();const rev=revision;const [owned,funds]=await Promise.all([call(config.registry,METHODS.ownedMask+accountWord(current)),call(config.token,'0x70a08231'+accountWord(current))]);if(rev!==revision)throw Error('Wallet changed. Connect again.');mask=BigInt(owned);balance=BigInt(funds);return state();}
 async function connect(){configured(true);if(session&&!session.getProvider()){session.scan();const options=session.list();if(options.length!==1)throw Error('Choose your wallet using Connect Wallet on the GETAWAY website.');await session.connect(options[0].id);}configured();const accounts=await request(session?'eth_accounts':'eth_requestAccounts');if(!address(accounts[0]))throw Error('No wallet account selected.');account=accounts[0];await identity();const [token,code,decimals]=await Promise.all([call(config.registry,METHODS.token),request('eth_getCode',[config.registry,'latest']),call(config.token,'0x313ce567')]);if(Number(BigInt(decimals))!==config.decimals)throw Error('The configured token decimals do not match the contract.');if(code==='0x'||('0x'+token.slice(-40)).toLowerCase()!==config.token.toLowerCase())throw Error('The unlock contract does not match the configured token.');return sync();}
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
 let sessionIdentity='';session?.subscribe(s=>{const key=[s.account,s.chainId,s.walletName].join(':');if(key!==sessionIdentity){sessionIdentity=key;invalidate();}});
 async function refreshConfig(){if(provider||config!==BURN_CONFIG)return;try{const r=await fetch('/api/testnet/config',{credentials:'same-origin',signal:AbortSignal.timeout(8000)});if(r.ok){const next=await r.json();if(next.enabled&&next.testnet&&next.chainId==='0xb626'){Object.assign(config,next);live=true;}}}catch{}}
 if(!provider&&config===BURN_CONFIG&&typeof location!=='undefined')void refreshConfig();
 return {state,connect,sync,quote,unlock,config,refreshConfig};
}
