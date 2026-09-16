import {verifyMessage,id as hashId} from '../dist/assets/ethers.min.js';
import runtime from './generated/testnet-runtime.js';
import {TESTNET,TESTNET_ITEMS} from '../dist/testnet-items.mjs';
import {ensureAccount} from './neighborhood.js';
const valid=v=>typeof v==='string'&&/^0x[0-9a-f]{40}$/i.test(v)&&!/^0x0{40}$/.test(v);
const word=a=>a.slice(2).toLowerCase().padStart(64,'0');
export async function chainRpc(method,params=[]){const response=await fetch(TESTNET.rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(12000)});if(!response.ok)throw Object.assign(Error('Robinhood testnet is unavailable. Try again shortly.'),{status:503});const value=await response.json();if(value.error||value.result===undefined)throw Object.assign(Error('Could not verify the testnet transaction yet.'),{status:503});return value.result;}
export function matchesRuntime(code,artifact){let actual=code.slice(2).toLowerCase(),expected=artifact.runtime.slice(2).toLowerCase();if(actual.length!==expected.length)return false;for(const refs of Object.values(artifact.immutable||{}))for(const r of refs){actual=actual.slice(0,r.start*2)+'0'.repeat(r.length*2)+actual.slice((r.start+r.length)*2);expected=expected.slice(0,r.start*2)+'0'.repeat(r.length*2)+expected.slice((r.start+r.length)*2);}return actual===expected;}
export async function testnetApi(request,{db,owner,me,body,json,fail,url}){
 const now=Date.now(),path=url.pathname.replace('/api/testnet','')||'/',b=request.method==='GET'?{}:await body(request);
 await db.prepare('INSERT INTO testnet_accounts (owner_id,updated_at) VALUES (?,?) ON CONFLICT DO NOTHING').bind(owner,now).run();
 const account=await db.prepare('SELECT * FROM testnet_accounts WHERE owner_id=?').bind(owner).first();
 const configuration=()=>({enabled:!!account.registry,testnet:true,chainId:TESTNET.hexChainId,chainName:TESTNET.name,rpc:TESTNET.rpc,token:account.token,registry:account.registry,symbol:TESTNET.symbol,decimals:18,explorer:TESTNET.explorer,launchpad:TESTNET.faucet,status:account.registry?'Testnet collection · test tokens only':'Set up your testnet collection',wallet:account.wallet});
 if(path==='/config'&&request.method==='GET')return json(configuration());
 if(path==='/setup'&&request.method==='POST'){
  if(!valid(b.registry))fail('Enter the deployed unlock-shop address.');
  const [network,code,tokenWord]=await Promise.all([chainRpc('eth_chainId'),chainRpc('eth_getCode',[b.registry,'latest']),chainRpc('eth_call',[{to:b.registry,data:'0xfc0c546a'},'latest'])]);
  if(Number(BigInt(network))!==TESTNET.chainId||!matchesRuntime(code,runtime.GetawayNeighborhoodUnlocks))fail('This is not the GETAWAY Neighborhoods testnet shop.',400);
  const token='0x'+tokenWord.slice(-40);if(!valid(token)||!matchesRuntime(await chainRpc('eth_getCode',[token,'latest']),runtime.GetawayTestToken))fail('This shop does not use the GETAWAY test token.',400);
  await db.prepare('UPDATE testnet_accounts SET registry=?,token=?,updated_at=? WHERE owner_id=?').bind(b.registry.toLowerCase(),token.toLowerCase(),now,owner).run();account.registry=b.registry.toLowerCase();account.token=token.toLowerCase();return json(configuration());
 }
 if(path==='/challenge'&&request.method==='POST'){
  if(!valid(b.wallet))fail('Connect your wallet first.');const nonce=crypto.randomUUID(),expires=now+300000;
  const message='GETAWAY testnet collection\nSite: '+url.origin+'\nWallet: '+b.wallet.toLowerCase()+'\nChain: '+TESTNET.chainId+'\nNonce: '+nonce+'\nExpires: '+new Date(expires).toISOString()+'\nLink this wallet to my game account. No payment or token approval.';
  await db.prepare('UPDATE testnet_accounts SET nonce=?,expires_at=?,updated_at=? WHERE owner_id=?').bind(message,expires,now,owner).run();return json({message});
 }
 if(path==='/link'&&request.method==='POST'){
  if(!account.nonce||account.expires_at<now||typeof b.signature!=='string'||b.signature.length>300)fail('Your wallet link expired. Try linking again.',409);
  let wallet;try{wallet=verifyMessage(account.nonce,b.signature).toLowerCase();}catch{fail('The wallet signature could not be verified.',400);}
  if(!account.nonce.includes('\nWallet: '+wallet+'\n'))fail('Sign with the wallet you selected.',403);
  const r=await db.prepare('UPDATE testnet_accounts SET wallet=?,nonce=NULL,expires_at=0,updated_at=? WHERE owner_id=? AND nonce=? AND expires_at>?').bind(wallet,now,owner,account.nonce,now).run();if(!r.meta.changes)fail('This wallet link was already used.',409);return json({wallet});
 }
 if(path==='/claim'&&request.method==='POST'){
  if(!me||!await db.prepare('SELECT profile_id FROM residences WHERE profile_id=?').bind(me.id).first())fail('Create your player name and join a neighborhood before claiming game items.',409);
  if(!account.registry||!account.wallet)fail('Set up a test shop and link your wallet first.',409);
  const item=TESTNET_ITEMS.find(i=>i.itemId===b.itemId);if(!item||typeof b.hash!=='string'||!/^0x[0-9a-f]{64}$/i.test(b.hash))fail('Choose a confirmed unlock transaction.');
  const receipt=await chainRpc('eth_getTransactionReceipt',[b.hash]);if(!receipt)fail('The transaction is still pending. Check again after confirmation.',409);
  if(BigInt(receipt.status)!==1n||receipt.to?.toLowerCase()!==account.registry)fail('This transaction did not unlock an item from your test shop.',400);
  const block=BigInt(await chainRpc('eth_blockNumber'));if(block-BigInt(receipt.blockNumber)<1n)fail('Waiting for a second testnet block. Check again shortly.',409);
  const event=hashId('Unlocked(address,uint256,uint256)').toLowerCase(),cost=BigInt(item.cost)*10n**18n;
  const eventFound=receipt.logs.some(log=>log.address.toLowerCase()===account.registry&&log.topics[0]?.toLowerCase()===event&&log.topics[1]?.toLowerCase()==='0x'+word(account.wallet)&&BigInt(log.topics[2]||'0')===BigInt(item.itemId)&&BigInt(log.data||'0')===cost);
  if(!eventFound)fail('The receipt does not match your wallet, item and exact burn cost.',400);
  const mask=BigInt(await chainRpc('eth_call',[{to:account.registry,data:'0xa850f89d'+word(account.wallet)},'latest']));if(!(mask&(1n<<BigInt(item.itemId))))fail('Ownership has not been confirmed on the testnet.',409);
  const saved=await ensureAccount(db,me.id,now),state=JSON.parse(saved.data),key='testnet:'+account.registry+':'+account.wallet+':'+item.itemId;
  if(state.receipts.includes(key))return json({ok:true,item:item.name});
  state.receipts=[...state.receipts,key].slice(-200);state.testUnlocks=[...new Set([...(state.testUnlocks||[]),item.itemId])];
  if(item.itemId===10)state.inventory=[...new Set([...state.inventory,'bookshelf','lamp','armchair'])];
  if(item.itemId===11){state.garageThemes=['midnight'];state.garageTheme='midnight';}
  if(item.itemId===12)state.emotes=[...new Set([...state.emotes,'dance'])];
  if(item.itemId===13){state.outfits=['mina'];state.outfit='mina';}
  if(item.itemId===14)state.parts=[...new Set([...state.parts,'paint-ice','interior-cream'])];
  const changed=await db.prepare('UPDATE neighborhood_accounts SET data=?,revision=revision+1,updated_at=? WHERE profile_id=? AND revision=?').bind(JSON.stringify(state),now,me.id,saved.revision).run();if(!changed.meta.changes)fail('Your collection changed. Check this confirmed transaction again.',409);
  return json({ok:true,item:item.name});
 }
 fail('Page not found.',404);
}
