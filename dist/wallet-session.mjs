// EIP-6963 discovery + EIP-1193 connection. No signing, approvals, or transactions.
// References: https://eips.ethereum.org/EIPS/eip-6963 and /EIPS/eip-1193
export const WALLET_STORAGE_KEY='getaway-wallet-v1';
export const validWalletAddress=value=>typeof value==='string'&&/^0x[0-9a-f]{40}$/i.test(value)&&!/^0x0{40}$/i.test(value);
const chain=value=>typeof value==='string'&&/^0x[0-9a-f]+$/i.test(value)?'0x'+BigInt(value).toString(16):null;
export function walletError(error){if(error?.code===4001)return 'Connection cancelled. Choose a wallet to try again.';if(error?.code===-32002)return 'A request is already open. Check your wallet extension, then try again.';if(error?.code===4100)return 'Your wallet has not allowed this account. Connect again to grant access.';if(error?.code===4900||error?.code===4901)return 'Your wallet is offline. Open it and check the network connection.';return 'Could not connect. Unlock your wallet and try again.';}
export function createWalletSession(host=globalThis){
 let storage;try{storage=host.localStorage;}catch{}let preference=null;try{preference=JSON.parse(storage?.getItem(WALLET_STORAGE_KEY)||'null');}catch{}
 const records=[],subscribers=new Set(),restoring=new Set();let active=null,detach=()=>{},epoch=0,started=false;
 let value={status:'disconnected',account:null,chainId:null,walletName:null,error:''};
 const state=()=>({...value}),notify=()=>{for(const f of subscribers)f(state());};
 function remember(record){preference=record?{rdns:record.rdns,name:record.name}:null;try{if(preference)storage?.setItem(WALLET_STORAGE_KEY,JSON.stringify(preference));else storage?.removeItem(WALLET_STORAGE_KEY);}catch{}}
 function reset(message='',forget=true){epoch++;detach();active=null;value={status:'disconnected',account:null,chainId:null,walletName:null,error:message};if(forget)remember(null);notify();}
 function bind(record){detach();active=record;const provider=record.provider;
  const onAccounts=accounts=>{if(active!==record||value.status!=='connected')return;if(!Array.isArray(accounts)||!validWalletAddress(accounts[0])){reset('Your wallet is locked or disconnected.');return;}value.account=accounts[0];value.error='';notify();};
  const onChain=id=>{if(active!==record)return;value.chainId=chain(id);notify();};
  const onDisconnect=()=>{if(active===record)reset('Your wallet disconnected.');};
  provider.on?.('accountsChanged',onAccounts);provider.on?.('chainChanged',onChain);provider.on?.('disconnect',onDisconnect);
  detach=()=>{provider.removeListener?.('accountsChanged',onAccounts);provider.removeListener?.('chainChanged',onChain);provider.removeListener?.('disconnect',onDisconnect);};
 }
 async function read(record,token){const [accounts,network]=await Promise.all([record.provider.request({method:'eth_accounts'}),record.provider.request({method:'eth_chainId'})]);if(token!==epoch||active!==record)return false;if(!Array.isArray(accounts)||!validWalletAddress(accounts[0]))return false;const chainId=chain(network);if(!chainId)throw Error('Invalid wallet network');value={status:'connected',account:accounts[0],chainId,walletName:record.name,error:''};remember(record);notify();return true;}
 async function restoreRecord(record){if(active||!preference||restoring.has(record.provider))return;restoring.add(record.provider);const token=++epoch;bind(record);try{if(!await read(record,token)&&token===epoch)reset('',false);}catch{if(token===epoch)reset('',false);}}
 function matches(record){return preference&&(preference.rdns?record.rdns===preference.rdns:record.name===preference.name);}
 function add(provider,info={}){if(!info||typeof info!=='object')info={};if(!provider||typeof provider.request!=='function')return;let record=records.find(r=>r.provider===provider);
  const fallback=provider.isMetaMask?'MetaMask':provider.isCoinbaseWallet?'Coinbase Wallet':provider.isBraveWallet?'Brave Wallet':'Browser wallet';
  const name=typeof info.name==='string'?info.name.slice(0,60):fallback,rdns=typeof info.rdns==='string'?info.rdns.slice(0,120):'';
  if(record){if(rdns&&(record.name!==name||record.rdns!==rdns)){record.name=name;record.rdns=rdns;record.icon=info.icon;notify();}if(!active&&matches(record))void restoreRecord(record);return;}
  record={id:'wallet-'+records.length,provider,name,rdns,icon:typeof info.icon==='string'?info.icon:''};records.push(record);notify();if(matches(record))void restoreRecord(record);
 }
 const announce=event=>{const detail=event?.detail;if(detail&&typeof detail==='object')add(detail.provider,detail.info);};
 function scan(){if(!started){started=true;host.addEventListener?.('eip6963:announceProvider',announce);host.addEventListener?.('ethereum#initialized',scan);host.addEventListener?.('storage',onStorage);}const EventType=host.Event||globalThis.Event;if(EventType)host.dispatchEvent?.(new EventType('eip6963:requestProvider'));const injected=host.ethereum;if(Array.isArray(injected?.providers))for(const provider of injected.providers)add(provider);else add(injected);return list();}
 function list(){return records.map(({id,name,rdns,icon})=>({id,name,rdns,icon}));}
 async function connect(id){if(value.status==='connecting')return state();const record=records.find(r=>r.id===id);if(!record)throw Error('Choose an available wallet.');const token=++epoch;bind(record);value={status:'connecting',account:null,chainId:null,walletName:record.name,error:''};notify();try{await record.provider.request({method:'eth_requestAccounts'});if(token!==epoch)return state();if(!await read(record,token)&&token===epoch)throw Error('No account selected');}catch(error){if(token===epoch)reset(walletError(error));}return state();}
 function onStorage(event){if(event.key===WALLET_STORAGE_KEY&&event.newValue===null)reset('',false);}
 const getProvider=()=>value.status==='connected'?active?.provider:null;
 return {state,list,scan,connect,getProvider,disconnect:()=>reset(),subscribe(fn){subscribers.add(fn);fn(state());return()=>subscribers.delete(fn);},dispose(){epoch++;detach();subscribers.clear();host.removeEventListener?.('eip6963:announceProvider',announce);host.removeEventListener?.('ethereum#initialized',scan);host.removeEventListener?.('storage',onStorage);}};
}
let singleton;
export function getWalletSession(){if(!singleton){singleton=createWalletSession();singleton.scan();}return singleton;}
export function networkLabel(chainId){const networks={'0x1':'Ethereum','0xa':'Optimism','0x38':'BNB Smart Chain','0x89':'Polygon','0x2105':'Base','0xa4b1':'Arbitrum One','0xaa36a7':'Sepolia testnet'};return networks[chainId]||(chainId?'Chain '+BigInt(chainId).toString():'Network unavailable');}
