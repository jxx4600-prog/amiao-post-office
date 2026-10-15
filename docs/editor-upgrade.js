(() => {
 'use strict';
 const $=s=>document.querySelector(s),previous=new WeakMap();
 let scheduled=false,observer,resizeObserver,wrapped=false,fitting=false;
 function normalize(l){
  if(!l)return;
  const models=[...(l.textBlocks||[]),...(l.stickers||[])];
  let clock=Math.max(Number(l.layerClock)||0,Number(l.mainLayerOrder)||0,Number(l.titleLayerOrder)||0,Number(l.drawingLayerOrder)||0,...models.map(x=>Number(x.layerOrder)||0));
  const next=()=>++clock;
  l.mainLayerOrder??=next();l.titleLayerOrder??=next();
  if(previous.get(l)?.titleDeleted&&!l.titleDeleted)l.titleLayerOrder=next();
  for(const model of models)model.layerOrder??=next();
  if(l.drawing&&!l.drawingLayerOrder)l.drawingLayerOrder=next();
  l.layerClock=clock;previous.set(l,{titleDeleted:l.titleDeleted});
 }
 function layers(l){
  normalize(l);
  return [!l.mainDeleted&&{type:'text',key:'main',order:l.mainLayerOrder,model:l,box:l.textBox||{x:8,y:17,w:84,h:10}},!l.titleDeleted&&{type:'title',key:'title',order:l.titleLayerOrder,model:window.miaoTypography.title(l),box:l.titleBox||{x:10,y:4,w:80,h:9}},...(l.textBlocks||[]).map(b=>({type:'text',key:b.id,model:{...l,...b},box:b.box,order:b.layerOrder})),...(l.stickers||[]).map((s,index)=>({type:'image',key:String(index),model:s,order:s.layerOrder})),l.drawing&&{type:'drawing',model:l,order:l.drawingLayerOrder}].filter(Boolean).sort((a,b)=>a.order-b.order);
 }
 function modelFor(frame){const l=window.miao?.state.draft,id=frame.dataset.textLayer;if(!l)return null;return {l,model:id==='main'||id==='title'?l:l.textBlocks.find(b=>b.id===id),key:id==='main'?'textBox':id==='title'?'titleBox':'box'};}
 function fit(frame){
  const field=frame?.querySelector('textarea,input'),paper=frame?.closest('.paper'),entry=frame&&modelFor(frame);
  if(!field||!paper||!entry?.model||!frame.getBoundingClientRect().width||frame.style.display==='none')return;
  const {l,model,key}=entry;
  let rect=paper.getBoundingClientRect();
  model[key]??={x:parseFloat(frame.style.left)||8,y:parseFloat(frame.style.top)||4,w:parseFloat(frame.style.width)||80,h:8};
  const b=model[key],style=getComputedStyle(field),line=parseFloat(style.lineHeight)||36;
  field.style.height='1px';const height=Math.max(line+4,field.scrollHeight+4);field.style.height='100%';
  if(l.format!=='postcard'&&rect.height*b.y/100+height>rect.height-20&&rect.height<6000&&window.miaoPaper){
   window.miaoPaper.extend(Math.max(500,Math.ceil((rect.height*b.y/100+height+30-rect.height)/500)*500));rect=paper.getBoundingClientRect();
  }
  b.h=height/rect.height*100;frame.style.height=height+'px';
  // Data is stored in percentages so preview/export retains the same layout.
  l.paperWidth=rect.width;l.paperRatio=rect.width/rect.height;
 }
 function applyOrders(paper,l){
  for(const item of layers(l)){
   const el=item.type==='image'?paper.querySelector(`[data-object="${item.key}"]`):item.type==='drawing'?paper.querySelector('#canvas'):paper.querySelector(`[data-text-layer="${item.key}"]`);
   if(el)el.style.zIndex=String(10+item.order);
  }
 }
 function refresh(){
  scheduled=false;if(fitting||window.miao?.page!=='record')return;
  const p=$('.paper');if(!p)return;fitting=true;
  try{const l=window.miao.state.draft,geometry=()=>JSON.stringify([l.textBox,l.titleBox,(l.textBlocks||[]).map(b=>b.box),l.paperWidth,l.paperRatio]),before=geometry();p.querySelectorAll('[data-text-layer]').forEach(fit);applyOrders(p,l);if(geometry()!==before)window.miao.save();}finally{fitting=false;}
 }
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(refresh);}
 function preview(scene,l){
  const ordered=layers(l),stickers=[...scene.querySelectorAll('.saved-sticker')];
  const texts=[...scene.querySelectorAll('.extra-letter-text')];
  for(const item of ordered){const el=item.type==='image'?stickers[Number(item.key)]:item.type==='drawing'?scene.querySelector('.ink-layer'):item.type==='title'?scene.querySelector('.journal-title'):item.key==='main'?scene.querySelector('.letter-text'):texts[(l.textBlocks||[]).findIndex(b=>b.id===item.key)];if(el)el.style.zIndex=String(10+item.order);}
 }
 const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('素材加载失败'));im.src=window.miaoAssets.resolve(src);});
 function wrap(ctx,text,width){const out=[];for(const p of String(text||'').split('\n')){let row='';for(const ch of new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(p)){if(row&&ctx.measureText(row+ch.segment).width>width){out.push(row);row=ch.segment;}else row+=ch.segment;}out.push(row);}return out;}
 async function paintLayers(ctx,l,{x,y,w,h,scale}){
  const all=layers(l);
  await Promise.all(all.filter(a=>a.type==='text'||a.type==='title').map(a=>document.fonts.load(`${(Number(a.model.fontSize)||19)*scale}px ${window.miaoJournal.font(a.model)}`,a.type==='title'?l.title||'田Ag':a.model.text||'田Ag')));
  for(const item of all){
   if(item.type==='drawing'){ctx.drawImage(await load(l.drawing),x,y,w,h);continue;}
   if(item.type==='image'){
    const s=item.model,im=await load(s.src),size=(s.w||28)/100*w;
    ctx.save();ctx.translate(x+s.x/100*w+size/2,y+s.y/100*h+size/2);ctx.rotate((Number(s.rotation)||0)*Math.PI/180);const fit=Math.min(size/im.width,size/im.height);ctx.drawImage(im,-im.width*fit/2,-im.height*fit/2,im.width*fit,im.height*fit);ctx.restore();continue;
   }
   const b=item.model,text=item.type==='title'?l.title:b.text;if(!text)continue;
   const fs=(Number(b.fontSize)||19)*scale,line=window.miaoJournal.line(b)*scale,box=item.box;
   ctx.font=`700 ${fs}px ${window.miaoJournal.font(b)}`;ctx.letterSpacing=(Number(b.charSpacing)||0)*scale+'px';
   const m=ctx.measureText('田Ag'),baseline=(line-(m.fontBoundingBoxAscent||fs*.8)-(m.fontBoundingBoxDescent||fs*.2))/2+(m.fontBoundingBoxAscent||fs*.8);
   ctx.fillStyle=b.textColor||'#7b4728';ctx.textBaseline='alphabetic';ctx.textAlign=item.type==='title'?'center':'left';
   wrap(ctx,text,w*box.w/100).forEach((row,i)=>ctx.fillText(row,x+(box.x+(item.type==='title'?box.w/2:0))/100*w,y+box.y/100*h+baseline+i*line));
  }
  ctx.textAlign='left';
 }
 document.addEventListener('input',e=>{if(e.target.closest('.paper')&&e.target.matches('textarea,input'))queue();if(e.target.id?.startsWith('layer-')){queue();if(e.target.id==='layer-font'){const p=$('.font-preview');if(p){p.style.fontFamily=window.miaoTypography.fonts[e.target.value];document.fonts.load(`22px ${p.style.fontFamily}`,p.textContent).then(queue);}}}});
 document.addEventListener('focusin',e=>{const f=e.target.closest('[data-text-layer]');if(f&&window.miaoLayers){document.querySelectorAll('.layer-box.selected').forEach(other=>{if(other!==f)other.classList.remove('selected');});window.miaoLayers.selectText(f.dataset.textLayer);f.classList.add('selected');}});
 document.addEventListener('keydown',e=>{const handle=e.target.closest('.layer-resize');if(!handle||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const frame=handle.closest('[data-text-layer]'),entry=modelFor(frame),box=entry.model[entry.key];box.w=Math.max(20,Math.min(100-box.x,box.w+(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?5:1)));frame.style.width=box.w+'%';fit(frame);window.miao.save();});
 document.addEventListener('pointerup',e=>{if(window.miao?.page==='record'&&e.target.closest('.paper'))queue();});
 document.fonts.addEventListener('loadingdone',queue);
 window.addEventListener('resize',queue);
 window.addEventListener('miao:render',({detail})=>{
  if(!wrapped&&window.miao){wrapped=true;const save=window.miao.save;window.miao.save=()=>{normalize(window.miao.state.draft);save();};}
  observer?.disconnect();resizeObserver?.disconnect();
  if(detail.page!=='record')return;
  normalize(window.miao.state.draft);
  queueMicrotask(()=>{const p=$('.paper');if(!p)return;observer=new MutationObserver(queue);observer.observe(p,{childList:true,subtree:true});resizeObserver=new ResizeObserver(queue);resizeObserver.observe(p);queue();});
 });
 window.miaoEditor={fit,refresh,normalize,layers,preview,paintLayers};
})();
