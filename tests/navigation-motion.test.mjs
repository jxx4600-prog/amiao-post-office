import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.resolve(import.meta.dirname,'../docs'),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname,target=path.join(root,decodeURIComponent(pathname==='/'?'/index.html':pathname));res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(await fs.readFile(target));}catch{res.writeHead(404).end();}}).listen(4203,'127.0.0.1');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const base=process.argv.includes('--live')?'https://jxx4600-prog.github.io/amiao-post-office/':'http://127.0.0.1:4203/';
const settled=page=>page.waitForFunction(()=>document.querySelector('#view>section')?.getAnimations().length===0);
try{
 for(const [width,height] of [[320,568],[390,844],[814,900],[390,450]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?qa=1&session=motion-nav');await page.waitForFunction(()=>window.miao);
  await page.click('#navigation [data-page="record"]');await settled(page);
  const geometry=await page.evaluate(()=>{const nav=document.querySelector('#navigation').getBoundingClientRect(),paper=document.querySelector('.paper-scroll').getBoundingClientRect(),footer=document.querySelector('.editor-footer').getBoundingClientRect();return{hidden:document.querySelector('#navigation').hidden,tabs:document.querySelectorAll('#navigation button').length,current:document.querySelector('#navigation [aria-current="page"]').dataset.page,navTop:nav.top,navBottom:nav.bottom,paperBottom:paper.bottom,paperHeight:paper.height,footerBottom:footer.bottom,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.equal(geometry.hidden,false);assert.equal(geometry.tabs,5);assert.equal(geometry.current,'record');assert.ok(geometry.navBottom<=height+1&&geometry.navTop>0&&!geometry.overflow,JSON.stringify(geometry));assert.ok(geometry.paperBottom<=geometry.navTop+1&&geometry.footerBottom<=geometry.navTop+1&&geometry.paperHeight>=80,JSON.stringify(geometry));
  await page.evaluate(()=>{const note=document.querySelector('#note');note.value='导航切换后，这份记录仍然保留。\n再写一行今天的小事。';note.dispatchEvent(new Event('input',{bubbles:true}));window.miao.state.draft.stickers.push({src:'assets/home-parts/head-0-v2.webp',x:10,y:50,w:20,kind:'sticker'});window.miao.save();document.querySelector('.paper-scroll').scrollTop=200;});
  await page.click('#navigation [data-page="todo"]');await settled(page);
  await page.click('#navigation [data-page="record"]');await settled(page);
  assert.equal(await page.locator('#note').inputValue(),'导航切换后，这份记录仍然保留。\n再写一行今天的小事。');assert.equal(await page.locator('.sticker').count(),1);assert.equal(await page.locator('#modal[open]').count(),0);
  assert.ok(await page.locator('.paper-scroll').evaluate(el=>el.scrollTop>0));
  // Active record tab is a no-op and does not rebuild the editor.
  await page.evaluate(()=>{document.querySelector('#note').dataset.identity='same-editor';});await page.click('#navigation [data-page="record"]');assert.equal(await page.locator('#note').getAttribute('data-identity'),'same-editor');
  await page.click('#navigation [data-page="home"]');await settled(page);await page.click('#navigation [data-page="record"]');await settled(page);assert.equal(await page.locator('#modal[open]').count(),0);assert.equal(await page.locator('.sticker').count(),1);
  if(width===390&&height===844)await page.screenshot({path:'E:/简历作品集/tmp/record-navigation-20261026.png'});
  // Both directions have a short slide; rapid navigation cancels the old one.
  const motion=await page.evaluate(()=>{window.miao.go('todo');const forward=document.querySelector('#view>section').getAnimations()[0]?.effect.getKeyframes()[0].transform;window.miao.go('clock');const reverse=document.querySelector('#view>section').getAnimations()[0]?.effect.getKeyframes()[0].transform;return{forward,reverse,count:document.querySelector('#view>section').getAnimations().length};});assert.match(motion.forward,/30px/);assert.match(motion.reverse,/-30px/);assert.equal(motion.count,1);await settled(page);
  await page.evaluate(()=>window.miao.open('<h2>向下展开</h2><p>设置内容</p>'));assert.ok(await page.locator('#modal-content').evaluate(el=>el.getAnimations().length===1));await page.click('#close-modal');
  await page.evaluate(()=>window.miao.open('<h2>来信</h2><div class="letter-scene"></div>'));assert.equal(await page.locator('#modal-content').evaluate(el=>el.getAnimations().length),0);await page.click('#close-modal');
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.miao.go('mine'));assert.equal(await page.locator('#view>section').evaluate(el=>el.getAnimations().length),0);await page.evaluate(()=>window.miao.open('<h2>设置</h2>'));assert.equal(await page.locator('#modal-content').evaluate(el=>el.getAnimations().length),0);await page.click('#close-modal');
  await page.reload();await page.waitForFunction(()=>window.miao);await page.click('#navigation [data-page="record"]');assert.equal(await page.locator('.sticker').count(),1);assert.match(await page.locator('#note').inputValue(),/导航切换后/);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,recordNavigation:'visible',draft:'retained after switching and reload',directionalMotion:'passed',reducedMotion:'passed'}));await page.close();
 }
}finally{await browser.close();server.close();}
