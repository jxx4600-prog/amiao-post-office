import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'../docs'),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,target=path.join(root,decodeURIComponent(pathname==='/'?'/index.html':pathname));res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(await fs.readFile(target));}catch{res.writeHead(404).end();}}).listen(4201,'127.0.0.1');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const results=[];
try{
 for(const width of [320,390,814]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.argv.includes('--live')?'https://jxx4600-prog.github.io/amiao-post-office/?qa=1&session=mail-fixes':'http://127.0.0.1:4201/?qa=1&session=mail-fixes');
  await page.waitForFunction(()=>window.miao&&window.miaoPostbox?.createMail);
  await page.evaluate(()=>{const s=window.miao.state;s.letters=[{id:'saved-a',courier:'白白',date:'2026-10-15',text:'第一封自己的记录',stickers:[]},{id:'saved-b',courier:'白白',date:'2026-10-16',text:'第二封自己的记录',stickers:[]}];s.inbox=[0,1,2,3].map(i=>{const l=window.miaoPostbox.createMail('2026-10-17','',i);return {...l,id:'cat-'+i,format:'letter',paperRatio:.67,textBox:{x:8,y:17,w:84,h:73}};});s.letterTrash=[];window.miao.go('mine');});
  // Open real inbox entries and inspect consecutive animation frames after art loads.
  await page.locator('[data-action="cat-inbox"]').last().click();
  for(let i=0;i<4;i++){
   await page.click(`[data-inbox-letter="cat-${i}"]`);
   await page.waitForFunction(()=>document.querySelector('.theme-overlay')?.complete);
   await page.evaluate(()=>document.fonts.ready);
   const frames=await page.evaluate(async()=>{const out=[];for(let n=0;n<45;n++){await new Promise(requestAnimationFrame);const d=document.querySelector('#modal'),s=d.querySelector('.letter-scene'),r=d.getBoundingClientRect();out.push([r.x,r.y,r.width,r.height,s.clientWidth,s.clientHeight,d.scrollTop]);}return out;});
   assert.equal(new Set(frames.map(JSON.stringify)).size,1,`${width}/cat-${i}: dialog moves or resizes repeatedly`);
   assert.equal(await page.locator('#modal').evaluate(el=>el.getAnimations().length),0);
   if(i===3&&width===390)await page.screenshot({path:'E:/简历作品集/tmp/cat-letter-stable.png'});
   await page.locator('[data-action="cat-inbox"]').last().click();
  }
  // Check all four preprinted stamp frames and dates using actual postcard rendering.
  for(let i=0;i<4;i++){
   await page.evaluate(i=>{const l=window.miao.state.inbox[i];Object.assign(l,{format:'postcard',text:'邮路上的小风景，今天也分给你一点。',textBox:{x:7,y:20,w:54,h:68},paperRatio:1.5,fontSize:12,lineHeight:18});window.miaoPostbox.openInbox();},i);
   await page.click(`[data-inbox-letter="cat-${i}"]`);
   await page.waitForFunction(()=>document.querySelector('.postcard-stamp img')?.complete&&document.querySelector('.theme-overlay')?.complete);
   const metrics=await page.evaluate(()=>{const scene=document.querySelector('.letter-scene'),stamp=scene.querySelector('.postcard-stamp'),date=scene.querySelector('.postcard-date'),im=stamp.querySelector('img'),r=scene.getBoundingClientRect(),a=stamp.getBoundingClientRect(),b=date.getBoundingClientRect(),c=im.getBoundingClientRect();return{border:getComputedStyle(stamp).borderWidth,date:date.textContent,stampCenter:a.x+a.width/2,imageCenter:c.x+c.width/2,dateCenter:b.x+b.width/2,inside:b.x>=r.x&&b.right<=r.right&&b.bottom<=r.bottom,oneLine:b.height<parseFloat(getComputedStyle(date).lineHeight)*1.5,overflow:scene.scrollWidth>scene.clientWidth};});
   assert.equal(metrics.border,'0px');assert.equal(metrics.date,'2026-10-17');assert.ok(metrics.inside&&metrics.oneLine&&!metrics.overflow,JSON.stringify({width,i,metrics}));assert.ok(Math.abs(metrics.stampCenter-metrics.imageCenter)<1&&Math.abs(metrics.stampCenter-metrics.dateCenter)<1);
   if(width===390){
    await page.locator('.letter-scene').screenshot({path:`E:/简历作品集/tmp/postcard-aligned-${i}.png`});
    const downloadPromise=page.waitForEvent('download');await page.click(`[data-inbox-download="cat-${i}"]`);const download=await downloadPromise;await download.saveAs(`E:/简历作品集/tmp/postcard-export-${i}.png`);assert.equal(await download.failure(),null);
   }
   await page.locator('[data-action="cat-inbox"]').last().click();
  }
  // Inbox delete cancellation keeps the list. Confirmation deletes only the target.
  await page.click('[data-mail-delete="inbox:cat-1"]');await page.click('[data-mail-cancel]');assert.equal(await page.locator('[data-inbox-letter]').count(),4);
  await page.click('[data-mail-delete="inbox:cat-1"]');await page.click('[data-mail-confirm]');assert.equal(await page.locator('[data-inbox-letter]').count(),3);assert.equal(await page.locator('[data-inbox-letter="cat-1"]').count(),0);
  await page.click('#close-modal');await page.click('[data-box="白白"]');
  assert.equal(await page.locator('#view .mail-list-delete').count(),2);
  await page.click('[data-mail-delete="letters:saved-a"]');await page.click('[data-mail-cancel]');assert.equal(await page.locator('[data-letter]').count(),2);
  await page.click('[data-mail-delete="letters:saved-a"]');await page.click('[data-mail-confirm]');assert.equal(await page.locator('[data-letter]').count(),1);assert.equal(await page.locator('[data-letter="saved-b"]').count(),1);
  if(width===390)await page.screenshot({path:'E:/简历作品集/tmp/mail-list-delete.png'});
  await page.click('.bar [data-page="mine"]');await page.click('[data-mail-trash]');
  assert.equal(await page.locator('[data-mail-restore]').count(),2);await page.locator('[data-mail-restore]').first().click();
  assert.equal(await page.locator('[data-mail-restore]').count(),1);
  const counts=await page.evaluate(()=>({letters:window.miao.state.letters.length,inbox:window.miao.state.inbox.length,trash:window.miao.state.letterTrash.length}));assert.deepEqual(counts,{letters:2,inbox:3,trash:1});
  await page.reload();await page.waitForFunction(()=>window.miao);assert.deepEqual(await page.evaluate(()=>({letters:window.miao.state.letters.length,inbox:window.miao.state.inbox.length,trash:window.miao.state.letterTrash.length})),counts);
  assert.deepEqual(errors,[]);results.push({width,stableLetterPreviews:4,alignedPostcards:4,deleteCancelRestoreReload:'passed'});await page.close();
 }
 console.log(JSON.stringify(results));
}finally{await browser.close();server.close();}
