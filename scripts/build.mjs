import fs from 'node:fs/promises';import path from 'node:path';
const root=process.cwd(),dist=path.join(root,'dist');
for(const name of ['client','server']){const target=path.resolve(dist,name);if(!target.startsWith(path.resolve(root)+path.sep))throw new Error('Invalid build path');await fs.rm(target,{recursive:true,force:true});await fs.mkdir(target,{recursive:true});}
for(const entry of await fs.readdir(dist,{withFileTypes:true})){if(['client','server','.openai'].includes(entry.name))continue;await fs.cp(path.join(dist,entry.name),path.join(dist,'client',entry.name),{recursive:true});}
await fs.writeFile('dist/server/index.js',(await fs.readFile('worker/index.js','utf8')).replace("from '../dist/social-catalog.mjs'","from './social-catalog.mjs'"));await fs.copyFile('dist/social-catalog.mjs','dist/server/social-catalog.mjs');await fs.writeFile('dist/server/world.js',(await fs.readFile('worker/world.js','utf8')).replaceAll("from '../dist/","from './"));await fs.copyFile('dist/world-catalog.mjs','dist/server/world-catalog.mjs');await fs.mkdir('dist/.openai',{recursive:true});await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');await fs.cp('drizzle','dist/.openai/drizzle',{recursive:true});
await fs.writeFile('dist/server/wrangler.json',JSON.stringify({name:'getaway',main:'index.js',compatibility_date:'2026-09-01',assets:{directory:'../client',binding:'ASSETS',not_found_handling:'none',run_worker_first:['/api/*']},d1_databases:[{binding:'DB',database_name:'getaway-local',database_id:'00000000-0000-0000-0000-000000000000',migrations_dir:'../../drizzle'}]},null,2));
console.log('Built GETAWAY static client, Crew Worker, and D1 migrations.');
await fs.writeFile('dist/server/first-hour.js',(await fs.readFile('worker/first-hour.js','utf8')).replaceAll("from '../dist/","from './"));
await fs.copyFile('dist/first-hour.mjs','dist/server/first-hour.mjs');
await fs.writeFile('dist/server/neighborhood.js',(await fs.readFile('worker/neighborhood.js','utf8')).replaceAll("from '../dist/","from './"));
await fs.copyFile('dist/neighborhood-catalog.mjs','dist/server/neighborhood-catalog.mjs');
await fs.writeFile('dist/server/testnet.js',(await fs.readFile('worker/testnet.js','utf8')).replaceAll("from '../dist/","from './"));
await fs.cp('worker/generated','dist/server/generated',{recursive:true});
await fs.mkdir('dist/server/assets',{recursive:true});await fs.copyFile('dist/assets/ethers.min.js','dist/server/assets/ethers.min.js');
for(const name of ['testnet-items.mjs','collection.mjs','home-placement.mjs'])await fs.writeFile('dist/server/'+name,(await fs.readFile('dist/'+name,'utf8')).replace(/\?v=\d+/g,''));
await fs.writeFile('dist/server/club.js',(await fs.readFile('worker/club.js','utf8')).replaceAll("from '../dist/","from './"));
await fs.copyFile('dist/club-catalog.mjs','dist/server/club-catalog.mjs');
await fs.copyFile('dist/motor-catalog.mjs','dist/server/motor-catalog.mjs');

// Workers resolve exact module names; browser cache suffixes are not file names.
for(const entry of await fs.readdir('dist/server')){
 if(!/\.(mjs|js)$/.test(entry))continue;
 const source=await fs.readFile('dist/server/'+entry,'utf8');
 for(const match of source.matchAll(/from\s*['"](\.[^'"]+)['"]/g))await fs.access(path.resolve('dist/server',match[1]));
}
console.log('Exact Worker module paths verified.');
