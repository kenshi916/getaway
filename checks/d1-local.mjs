import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import path from 'node:path';
export function localD1(file=':memory:'){
 const db=new DatabaseSync(file);db.exec('PRAGMA foreign_keys=ON');
 for(const f of fs.readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
 const prepare=(sql,values=[])=>({bind(...args){return prepare(sql,args);},async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){const result=db.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes)}};}});
 return {prepare,close(){db.close();}};
}
