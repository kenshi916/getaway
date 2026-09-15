import fs from 'node:fs';
import assert from 'node:assert/strict';
import solc from 'solc';
import ganache from 'ganache';
import {BrowserProvider,ContractFactory,parseUnits} from 'ethers';
import {BURN_ITEMS} from '../dist/collection.mjs';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('contracts/GetawayUnlocks.sol',root),'utf8');
const mock=`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
contract TestToken is ERC20Burnable { constructor() ERC20("Test only", "TEST") {_mint(msg.sender,100000e18);} }
contract NoBurnToken is ERC20 { constructor() ERC20("No burn", "NO") {_mint(msg.sender,100000e18);} function burnFrom(address,uint256) external {} }
`;
const output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'GetawayUnlocks.sol':{content:source},'TestToken.sol':{content:mock}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.methodIdentifiers']}}}}),{import:path=>{try{return{contents:fs.readFileSync(new URL('node_modules/'+path,root),'utf8')}}catch{return{error:'Missing import '+path}}}}));
assert.equal((output.errors||[]).filter(e=>e.severity==='error').length,0,JSON.stringify(output.errors));
const artifact=output.contracts['GetawayUnlocks.sol'].GetawayUnlocks;
fs.mkdirSync(new URL('contracts/artifacts/',root),{recursive:true});
fs.writeFileSync(new URL('contracts/artifacts/GetawayUnlocks.json',root),JSON.stringify({compiler:solc.version(),evmVersion:'shanghai',optimizer:{enabled:true,runs:200},abi:artifact.abi,bytecode:'0x'+artifact.evm.bytecode.object},null,2)+'\n');
const methods=Object.fromEntries(['token()','ownedMask(address)','prices(uint256)','unlock(uint256,uint256)'].map(signature=>[signature.split('(')[0],'0x'+artifact.evm.methodIdentifiers[signature]]));
fs.writeFileSync(new URL('dist/burn-methods.mjs',root),'// Generated from GetawayUnlocks.sol by checks/burn-contract.mjs.\nexport const METHODS='+JSON.stringify(methods)+';\n');

const rpc=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:3},chain:{hardfork:'shanghai'}}),provider=new BrowserProvider(rpc);provider.pollingInterval=10;
try{
 const alice=await provider.getSigner(0),bob=await provider.getSigner(1),owner=await alice.getAddress();
 const deploy=async(a,args=[])=>{const c=await new ContractFactory(a.abi,'0x'+a.evm.bytecode.object,alice).deploy(...args);await c.waitForDeployment();return c;};
 const token=await deploy(output.contracts['TestToken.sol'].TestToken),costs=BURN_ITEMS.sort((a,b)=>a.itemId-b.itemId).map(i=>parseUnits(String(i.cost),18));
 const registry=await deploy(artifact,[await token.getAddress(),costs]),registryAddress=await registry.getAddress();
 const initial=await token.totalSupply();
 await assert.rejects(registry.unlock.staticCall(1,costs[0]),'missing allowance must revert');assert.equal(await registry.ownedMask(owner),0n);
 await token.approve(registryAddress,costs[0]);await assert.rejects(registry.unlock.staticCall(1,costs[0]+1n));
 await (await registry.unlock(1,costs[0])).wait();assert.equal(await token.totalSupply(),initial-costs[0]);assert.equal(await token.balanceOf(owner),initial-costs[0]);assert.equal(await registry.ownedMask(owner),2n);assert.equal(await token.allowance(owner,registryAddress),0n);
 await assert.rejects(registry.unlock.staticCall(1,costs[0]),'cannot burn twice for an owned item');assert.equal(await registry.ownedMask(await bob.getAddress()),0n);
 await assert.rejects(registry.unlock.staticCall(0,1));await assert.rejects(registry.unlock.staticCall(10,1));
 for(let i=2;i<=9;i++){await (await token.approve(registryAddress,costs[i-1])).wait();await (await registry.unlock(i,costs[i-1])).wait();}
 assert.equal(await registry.ownedMask(owner),1022n);assert.equal(initial-await token.totalSupply(),costs.reduce((a,b)=>a+b,0n));
 const fake=await deploy(output.contracts['TestToken.sol'].NoBurnToken),guarded=await deploy(artifact,[await fake.getAddress(),costs]);await fake.approve(await guarded.getAddress(),costs[0]);await assert.rejects(guarded.unlock.staticCall(1,costs[0]),'no-op burns must revert');assert.equal(await guarded.ownedMask(owner),0n);
 // Exercise the browser's actual EIP-1193 adapter against the same local chain.
 const {createBurnWallet}=await import('../dist/burn-wallet.mjs');
 const bobAddress=await bob.getAddress(),sent=[],handlers={};let reject=false;
 await (await token.transfer(bobAddress,parseUnits('6000',18))).wait();
 const walletProvider={on:(name,fn)=>{handlers[name]=fn;},request:async({method,params=[]})=>{if(method==='eth_requestAccounts'||method==='eth_accounts')return[bobAddress];if(method==='eth_sendTransaction'){if(reject)throw Object.assign(new Error('Rejected'),{code:4001});sent.push(params[0]);}return rpc.request({method,params});}};
 const config={enabled:true,token:await token.getAddress(),registry:registryAddress,chainId:await rpc.request({method:'eth_chainId',params:[]}),decimals:18,symbol:'TEST'};
 const wallet=createBurnWallet(config,walletProvider);await wallet.connect();const quote=await wallet.quote(1);assert.equal(quote,costs[0]);await wallet.unlock(1,quote);assert.equal(wallet.state().mask,2n);assert.equal(sent.length,2,'wallet sends exact approval then burn');assert.equal(BigInt('0x'+sent[0].data.slice(-64)),quote);assert.equal(await token.allowance(bobAddress,registryAddress),0n);
 reject=true;await assert.rejects(wallet.unlock(2,costs[1]),/Cancelled/);assert.equal(await registry.ownedMask(bobAddress),2n);
 handlers.accountsChanged([]);assert.equal(wallet.state().mask,0n);assert.equal(wallet.state().account,null);await assert.rejects(wallet.unlock(2,costs[1]),/Wallet changed/);
 const wrongChain=createBurnWallet({...config,chainId:'0x1'},walletProvider);await assert.rejects(wrongChain.connect(),/Switch your wallet/);
 const preview=createBurnWallet({enabled:false},{request:()=>{throw Error('Preview must never request wallet access');}});await assert.rejects(preview.connect(),/not configured/);
 console.log('Wallet integration passed: actual approval and burn on a local EVM, ownership refresh, rejection, account-change clearing, wrong-network blocking, and preview isolation.');
 console.log('Local EVM checks passed: all nine unlocks destroy the exact token amount; exact approvals, failed / duplicate burns, wallet ownership, immutable prices, and no-op token rejection. No public network or real funds used.');
}finally{await rpc.disconnect();}
