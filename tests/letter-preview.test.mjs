import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'file:///C:/Users/win11/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const output='E:/简历作品集/tmp/miao-preview-fix';await fs.mkdir(output,{recursive:true});
const results=[];
try{
 for(const width of [320,390,525]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4181/');
  await page.waitForFunction(()=>window.miaoEditor&&window.miaoJournal&&window.miaoLetters);
  await page.evaluate(()=>document.fonts.ready);
  for(const kind of ['letter','legacy-long','postcard','cat']){
   const fixture={id:'preview-regression',date:'2026-10-16',courier:'莉莉',title:'Little Joys\n今天也值得记录',text:'今天也值得被记录。\n冷天里也有小惊喜。\n文字应该完整显示在信纸上。',fontFamily:'dancing',fontSize:19,lineHeight:36,paperWidth:350,paperRatio:350/900,paperHeight:900,format:'letter',template:'dot',textBox:{x:8,y:17,w:65,h:5},titleBox:{x:10,y:4,w:80,h:3},textBlocks:[{id:'extra',text:'独立文本框也要完整显示。\n第二行。\n第三行。',box:{x:10,y:42,w:70,h:2},fontSize:17}],stickers:[]};
   if(kind==='legacy-long'){delete fixture.paperWidth;fixture.text=fixture.text.repeat(16);fixture.textBlocks=[];}
   if(kind==='postcard'){fixture.format='postcard';fixture.paperRatio=1.5;fixture.textBox={x:7,y:25,w:50,h:6};fixture.textBlocks=[];}
   if(kind==='cat'){delete fixture.paperWidth;fixture.source='cat';fixture.text=fixture.text.repeat(8);fixture.textBlocks=[];}
   await page.evaluate(l=>{document.querySelector('#modal').close();window.miaoJournal.confirm(l);},fixture);
   await page.waitForFunction(()=>document.querySelector('.letter-scene')?.dataset.previewLayout==='fitted');
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>{const scene=document.querySelector('.letter-scene'),rect=scene.getBoundingClientRect();return {scene:{height:scene.clientHeight,width:scene.clientWidth},blocks:[...scene.querySelectorAll('.letter-text,.journal-title,.extra-letter-text')].map(el=>({scroll:el.scrollHeight,height:el.clientHeight,bottom:el.getBoundingClientRect().bottom-rect.top,overflow:getComputedStyle(el).overflow,font:parseFloat(getComputedStyle(el).fontSize)}))};});
   for(const block of metrics.blocks){assert.ok(block.scroll<=block.height+1,`${width}/${kind}: clipped inner text`);assert.ok(block.bottom<=metrics.scene.height+2,`${width}/${kind}: text below sheet`);assert.equal(block.overflow,'visible');}
   if(kind==='letter'){
    assert.ok(Math.abs(metrics.blocks[0].font-19*metrics.scene.width/350)<.1,'preview font follows saved paper width');
    const before=JSON.stringify([fixture.textBox,fixture.titleBox,fixture.paperWidth,fixture.paperHeight,fixture.textBlocks]);
    const persisted=await page.evaluate(()=>{const l=window.miao.state.pendingDelivery;return JSON.stringify([l.textBox,l.titleBox,l.paperWidth,l.paperHeight,l.textBlocks.map(({layerOrder,...b})=>b)]);});
    assert.equal(persisted,before,'preview does not rewrite saved text layout');
    await page.screenshot({path:output+`/delivery-${width}.png`});
    await page.evaluate(()=>{const l=window.miao.state.pendingDelivery;document.querySelector('#modal').close();window.miaoLetters.openLetter(l);});
    assert.equal(await page.locator('.letter-text').textContent(),fixture.text,'mailbox reopen retains full content');
    await page.setViewportSize({width:width===320?525:320,height:850});
    await page.waitForFunction(()=>{const s=document.querySelector('.letter-scene'),p=s.querySelector('.letter-text');return Math.abs(parseFloat(getComputedStyle(p).fontSize)-19*s.clientWidth/350)<.1;});
    await page.setViewportSize({width,height:850});
   }
   results.push({width,kind,...metrics});
  }
  await page.close();
 }
 await fs.writeFile(output+'/checks.json',JSON.stringify(results,null,2));
 console.log('PASS: 12 delivery previews across 320/390/525px; long and legacy mail, postcards, cat letters, title and extra blocks, font scaling, mailbox reopen, saved layout unchanged.');
}finally{await browser.close();}
