import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const before=process.argv.includes('--before'),root=before?'E:/简历作品集/.tmp/amiao-github-checkout/docs':path.resolve(import.meta.dirname,'../docs');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,target=path.join(root,decodeURIComponent(pathname==='/'?'/index.html':pathname));res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(await fs.readFile(target));}catch{res.writeHead(404).end();}}).listen(4205,'127.0.0.1');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const id='11111111-1111-4111-8111-111111111111',cacheKey='miao-refined-v1:user:'+id,metaKey='amiao-cloud-meta-v1:'+id;
async function mock(page,mode){await page.addInitScript(({id,mode})=>{
 window.testWrites=0;window.testReads=0;
 const forever=()=>new Promise(()=>{}),data=text=>({weather:'晴天',letters:[],todos:[],alarms:[],inbox:[],futureLetters:[],draft:{text,stickers:[],drawing:''},mailDays:{[new Date().toLocaleDateString('sv-SE')]:true}});
 const key='miao-refined-v1:user:'+id;
 if(!localStorage.getItem('test-seeded')){localStorage.setItem('amiao-auth-v1',JSON.stringify({user:{id}}));localStorage.setItem(key,JSON.stringify(data('账号的本机草稿')));localStorage.setItem('miao-refined-v1',JSON.stringify(data('访客草稿保持原样')));localStorage.setItem('amiao-cloud-meta-v1:'+id,JSON.stringify({revision:3,dirty:false}));localStorage.setItem('test-seeded','1');}
 const client={auth:{getSession:mode==='auth-stall'?forever:async()=>({data:{session:{}}}),getUser:async()=>({data:{user:{id,email:'test-only@example.invalid',user_metadata:{nickname:'测试',birthday:'2000-01-01'}}}}),onAuthStateChange(){}},from(){window.testReads++;return{select(){return this},eq(){return this},maybeSingle:mode==='cloud-stall'?forever:async()=>({data:{payload:data('新的账号版本'),revision:4,updated_at:'now'}})};},async rpc(){window.testWrites++;return{error:{code:'40001'}};}};
 Object.defineProperty(window,'supabase',{configurable:true,get:()=>({createClient:()=>client}),set(){}});
 },{id,mode});}
try{
 const offline=await browser.newPage();await mock(offline,'auth-stall');await offline.goto('http://127.0.0.1:4205/');
 if(before){await offline.waitForTimeout(4500);console.log(JSON.stringify({reproducedBlank:await offline.locator('#view').evaluate(el=>el.children.length===0),appInitialized:await offline.evaluate(()=>!!window.miao)}));await offline.close();}
 else{
  assert.equal(await offline.locator('.startup-state').count(),1,'loading state visible while auth is pending');await offline.waitForFunction(()=>window.miao,{},{timeout:6500});assert.equal(await offline.locator('.home').count(),1);
  assert.equal(await offline.evaluate(()=>window.miaoAuth.user),null,'cached identity is not treated as verified');assert.equal(await offline.evaluate(()=>window.miaoAuth.offlineUserId),id);
  assert.equal(await offline.evaluate(()=>window.miao.state.draft.text),'账号的本机草稿');assert.equal(await offline.evaluate(()=>window.testWrites+window.testReads),0);
  const guest=await offline.evaluate(()=>localStorage.getItem('miao-refined-v1'));
  await offline.evaluate(()=>{window.miao.state.draft.text='离线修改必须保留';window.miao.save();});
  assert.equal(await offline.evaluate(k=>JSON.parse(localStorage.getItem(k)).dirty,metaKey),true);assert.equal(await offline.evaluate(()=>localStorage.getItem('miao-refined-v1')),guest);
  await offline.reload();await offline.waitForFunction(()=>window.miao,{},{timeout:6500});assert.equal(await offline.evaluate(()=>window.miao.state.draft.text),'离线修改必须保留');
  // Reconnect with a newer remote version: keep local edits and flag a conflict.
  const storage=await offline.context().storageState();const recoveryContext=await browser.newContext({storageState:storage});const recovery=await recoveryContext.newPage();await mock(recovery,'recovered');await recovery.goto('http://127.0.0.1:4205/');await recovery.waitForFunction(()=>window.miao);assert.equal(await recovery.evaluate(()=>window.miao.state.draft.text),'离线修改必须保留');assert.equal(await recovery.evaluate(()=>window.miaoCloud.conflict),true);assert.equal(await recovery.evaluate(()=>window.testWrites),0);await recoveryContext.close();await offline.close();
  const cloud=await browser.newPage();await mock(cloud,'cloud-stall');await cloud.goto('http://127.0.0.1:4205/');await cloud.waitForFunction(()=>window.miao,{},{timeout:7000});assert.equal(await cloud.locator('.home').count(),1);assert.equal(await cloud.evaluate(()=>window.miao.state.draft.text),'账号的本机草稿');await cloud.close();
  const blocked=await browser.newPage();await blocked.route('**/site.js?*',route=>route.abort());await blocked.goto('http://127.0.0.1:4205/');assert.equal(await blocked.locator('.startup-state').count(),1);await blocked.close();
  const normal=await browser.newPage();await normal.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=query=>{const result=original(query);return{matches:result.matches,addListener:fn=>result.addListener(fn)};};});await normal.goto('http://127.0.0.1:4205/');await normal.waitForFunction(()=>window.miao);
  for(const name of ['白白','莉莉','阿夜','大王']){await normal.evaluate(async name=>{const puppet=document.querySelector('.courier-puppet');puppet?.setAttribute('aria-label',name+'动态陪伴');await window.miaoAssets.introduce();},name);assert.equal(await normal.locator('.cat-intro small').count(),0);assert.match(await normal.locator('.cat-intro h2').textContent(),new RegExp(name));assert.ok((await normal.locator('.cat-intro p').textContent()).length>10);await normal.click('#close-modal');}
  await normal.close();console.log('PASS: stalled authentication and cloud reads cannot leave a blank page; cached account stays isolated, offline edits survive reload and reconnect conflicts; failed bundle shows loading/retry UI; legacy matchMedia works; all four cat introductions omit paper labels.');
 }
}finally{await browser.close();server.close();}
