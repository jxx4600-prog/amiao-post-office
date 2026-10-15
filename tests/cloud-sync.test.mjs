import {readFile} from 'node:fs/promises';import vm from 'node:vm';import assert from 'node:assert/strict';
const code=await readFile(new URL('../docs/cloud-sync.js',import.meta.url),'utf8');
const snapshot=text=>({letters:[],todos:[],alarms:[],draft:{text}}),id='11111111-1111-4111-8111-111111111111',key='miao-refined-v1:user:'+id,metaKey='amiao-cloud-meta-v1:'+id;
async function setup({guest=false,remote=null,cache=new Map(),fail=false,online=true}={}){
 let calls=0,writes=0,current=remote;const timers=new Map(),listeners={};
 const client={from(){calls++;return{select(){return this},eq(k,v){assert.equal(v,id);return this},async maybeSingle(){return fail?{error:{code:'network'}}:{data:current}}}},async rpc(name,args){writes++;assert.equal(name,'save_amiao_state');if(fail)return{error:{code:'network'}};if(args.p_expected_revision!==(current?.revision||0))return{error:{code:'40001',message:'amiao_revision_conflict'}};current={payload:args.p_snapshot,revision:(current?.revision||0)+1,updated_at:'2026-10-15T10:00:00Z'};return{data:[{revision:current.revision,updated_at:current.updated_at}]};}};
 const window={miaoAuth:{ready:Promise.resolve(),user:guest?null:{id},client,storageSuffix:':user:'+id},addEventListener(k,v){listeners[k]=v}};
 const context={window,document:{querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}},navigator:{onLine:online},location:{search:''},localStorage:{getItem(k){return cache.get(k)||null},setItem(k,v){cache.set(k,v)}},setTimeout(fn){const n=timers.size+1;timers.set(n,fn);return n},clearTimeout(n){timers.delete(n)},Blob,URLSearchParams,console};
 vm.runInNewContext(code,context);await window.miaoCloud.ready;
 return{sync:window.miaoCloud,cache,listeners,get calls(){return calls},get writes(){return writes},get remote(){return current},setRemote(v){current=v}};
}
let a=await setup({guest:true});a.sync.queue(JSON.stringify(snapshot('guest')));await a.sync.flush();assert.equal(a.calls,0);assert.equal(a.writes,0);
a=await setup({remote:{payload:snapshot('account version'),revision:4,updated_at:'then'}});assert.equal(JSON.parse(a.cache.get(key)).draft.text,'account version');assert.equal(a.sync.status,'已保存到账号');
a.sync.queue(JSON.stringify(snapshot('new edit')));assert.equal(a.sync.dirty,true);assert.notEqual(a.sync.status,'已保存到账号');await a.sync.flush();assert.equal(a.remote.revision,5);assert.equal(a.remote.payload.draft.text,'new edit');assert.equal(a.sync.dirty,false);assert.equal(a.sync.status,'已保存到账号');
a.sync.queue(JSON.stringify(snapshot('local conflict')));a.setRemote({payload:snapshot('other device'),revision:6});await a.sync.flush();assert.equal(a.sync.conflict,true);assert.equal(a.remote.payload.draft.text,'other device');assert.equal(a.sync.dirty,true);
const cache=new Map([[key,JSON.stringify(snapshot('offline edit'))],[metaKey,JSON.stringify({revision:2,dirty:true})]]);
a=await setup({cache,remote:{payload:snapshot('new remote'),revision:3}});assert.equal(a.sync.conflict,true);assert.equal(JSON.parse(cache.get(key)).draft.text,'offline edit');assert.equal(a.writes,0);
a=await setup({fail:true});a.sync.queue(JSON.stringify(snapshot('network pending')));await a.sync.flush();assert.equal(a.sync.dirty,true);assert.notEqual(a.sync.status,'已保存到账号');assert.equal(JSON.parse(a.cache.get(metaKey)).dirty,true);
a=await setup({online:false});a.sync.queue(JSON.stringify(snapshot('offline')));await a.sync.flush();assert.equal(a.writes,0);assert.equal(a.sync.dirty,true);
console.log('PASS: guest stays local, account hydration, acknowledgement-only saved state, revision conflicts, dirty cache preservation, offline/network failures.');
