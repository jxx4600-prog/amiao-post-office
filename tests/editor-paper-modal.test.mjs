import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'../docs'),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname,file=path.join(root,decodeURIComponent(name==='/'?'/index.html':name));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}}).listen(4207,'127.0.0.1');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=process.argv.includes('--live')?'https://jxx4600-prog.github.io/amiao-post-office/':'http://127.0.0.1:4207/';
try{
 for(const [width,height] of [[320,568],[390,844],[814,900]]){
  const page=await browser.newPage({viewport:{width,height}}),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?qa=1&session=paper-modal-v3');await page.waitForFunction(()=>window.miao);assert.equal(await page.locator('.daily-spark').count(),0);assert.ok(!requests.some(u=>u.includes('editor-parts')||u.includes('fonts-editor.css')),'editor resources loaded on homepage');
  // Block the large original atlases: paper textures must load independently.
  await page.route('**/assets/*-v1*.webp',route=>route.abort());
  await page.click('#navigation [data-page="record"]');await page.waitForFunction(()=>document.querySelector('.paper-material')?.complete&&document.querySelector('.paper-material').naturalWidth>0);
  const seen=[];
  await page.click('[data-action="layer-paper"]');
  for(const texture of ['rice','kraft','aged','smooth']){await page.selectOption('#layer-texture',texture);await page.waitForFunction(texture=>{const image=document.querySelector('.paper-material');return image.complete&&image.naturalWidth>0&&image.getAttribute('src').includes('material-'+texture);},texture);seen.push(await page.locator('.paper-material').getAttribute('src'));if(width===390){await page.click('#close-modal');await page.locator('.paper').screenshot({path:`E:/简历作品集/tmp/paper-${texture}-20261026.png`});await page.click('[data-action="layer-paper"]');}}
  assert.equal(new Set(seen).size,4);await page.check('input[name="layer-format"][value="postcard"]');await page.click('#close-modal');await page.waitForFunction(()=>document.querySelector('.paper')?.dataset.format==='postcard');
  const ratio=await page.locator('.paper').evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height;});assert.ok(Math.abs(ratio-1.5)<.03,'postcard ratio: '+ratio);
  await page.evaluate(()=>{window.miaoLayers.addTextAt({x:85,y:45,w:40,h:20});window.miaoLayers.setMode('text');});
  const boxes=await page.locator('.paper [data-text-layer]').evaluateAll(nodes=>nodes.filter(el=>getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect(),p=el.closest('.paper').getBoundingClientRect();return{right:(r.right-p.left)/p.width,bottom:(r.bottom-p.top)/p.height};}));assert.ok(boxes.every(b=>b.right<=.625),JSON.stringify(boxes));
  const count=await page.locator('[data-text-layer]').count(),paper=await page.locator('.paper').boundingBox();await page.mouse.click(paper.x+paper.width*.85,paper.y+paper.height*.6);assert.equal(await page.locator('[data-text-layer]').count(),count,'right side must not create text');
  await page.locator('[data-text-layer="main"] .layer-resize').focus();await page.keyboard.press('ArrowRight');assert.ok(await page.locator('[data-text-layer="main"]').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.closest('.paper').getBoundingClientRect();return r.right<=p.left+p.width*.625;}));
  assert.equal(await page.locator('.paper .postcard-stamp').evaluate(el=>getComputedStyle(el).display),'none');
  await page.evaluate(()=>{const l=window.miao.state.draft;l.text='今天的文字，只写在竖线左侧。';l.title='今日小记';l.textBlocks=[];window.miao.save();window.miao.render();});await page.waitForFunction(()=>document.querySelector('.paper-material')?.complete);
  if(width===390)await page.screenshot({path:'E:/简历作品集/tmp/postcard-editor-20261026.png'});
  // Export and preview follow the same left-hand text bounds.
  await page.evaluate(()=>{const l={...structuredClone(window.miao.state.draft),id:'postcard-check',courier:'白白',themeEnabled:false,date:'2026-10-26'};window.miaoLetters.openLetter(l);});
  await page.waitForFunction(()=>document.querySelector('.letter-scene')?.dataset.previewLayout==='fitted');
  assert.ok(await page.locator('.letter-text').evaluate(el=>{const r=el.getBoundingClientRect(),p=el.closest('.letter-scene').getBoundingClientRect();return r.right<=p.left+p.width*.625;}));await page.click('#close-modal');
  await page.click('#navigation [data-page="mine"]');await page.evaluate(()=>{window.miao.state.inbox=Array.from({length:12},(_,i)=>({id:'inbox-'+i,courier:['白白','莉莉','阿夜','大王'][i%4],date:'2026-10-26',text:'一封写给今天的小小来信。'.repeat(4),source:'cat',occasion:'邮路随记',stickers:[],paperWidth:350,paperRatio:.67}));});await page.click('[data-action="cat-inbox"]');
  const modal=await page.evaluate(()=>{const m=document.querySelector('#modal'),r=m.getBoundingClientRect(),bar=document.querySelector('#view .bar').getBoundingClientRect(),nav=document.querySelector('#navigation').getBoundingClientRect(),top=Math.max(16,document.querySelector('#app').getBoundingClientRect().top+16,bar.bottom+10),bottom=Math.min(innerHeight-16,nav.top-10);return{top:r.top,bottom:r.bottom,center:(r.top+r.bottom)/2,desired:(top+bottom)/2,barBottom:bar.bottom,navTop:nav.top,overflow:m.scrollHeight>m.clientHeight,rowWidth:m.querySelector('.mail-list-row').getBoundingClientRect().width,contentWidth:m.querySelector('.inbox-grid').getBoundingClientRect().width};});
  assert.ok(modal.top>=modal.barBottom+8&&modal.bottom<=modal.navTop-8,JSON.stringify(modal));assert.ok(Math.abs(modal.center-modal.desired)<1,JSON.stringify(modal));assert.ok(Math.abs(modal.rowWidth-modal.contentWidth)<1,JSON.stringify(modal));assert.ok(modal.overflow);
  await page.waitForFunction(()=>[...document.querySelectorAll('#modal .mail-list-row')].every(el=>el.getAnimations().length===0));
  if(width===390)await page.screenshot({path:'E:/简历作品集/tmp/cat-inbox-centered-20261026.png'});
  assert.ok(!requests.some(u=>/paper-materials-v11|literary-papers-v13|journal-stickers-v9|literary-postcards-v13/.test(u)),'original atlases requested');assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,textures:4,postcardRatio:ratio,leftOnlyText:true,inboxCentered:true,largeAtlasRequests:0}));await page.close();
 }
}finally{await browser.close();server.close();}
