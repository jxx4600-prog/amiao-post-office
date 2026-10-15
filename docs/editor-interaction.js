(() => {
 const $=s=>document.querySelector(s),draft=()=>window.miao.state.draft;
 function selectObject(el){
  document.querySelectorAll('.layer-box.selected').forEach(n=>n.classList.remove('selected'));
  el.focus();window.miaoLayers.selectObject(Number(el.dataset.object));const s=draft().stickers[Number(el.dataset.object)];if(!s)return;
  let tools=$('.object-properties');if(!tools){tools=document.createElement('div');tools.className='object-properties';$('.shape-tools').after(tools);}
  tools.dataset.objectIndex=el.dataset.object;
  tools.innerHTML=`<label>大小<input data-object-prop="w" type="range" min="8" max="90" value="${s.w||28}" aria-label="素材大小"></label><label>角度<input data-object-prop="rotation" type="range" min="-180" max="180" value="${s.rotation||0}" aria-label="素材角度"></label>${s.kind==='shape'?`<label>颜色<input data-object-prop="fill" type="color" value="${s.fill||'#d5dfcc'}" aria-label="形状颜色"></label>`:''}`;
 }
 function objectAt(paper,x,y){
  // Hit testing follows the same persisted creation order as painting.
  return [...paper.querySelectorAll('[data-object]')].sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex)).find(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;});
 }
 function textAt(paper,x,y){
  const ctx=document.createElement('canvas').getContext('2d');
  return [...paper.querySelectorAll('[data-text-layer]')].sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex)).find(frame=>{
   const field=frame.querySelector('textarea,input'),r=field.getBoundingClientRect();if(!r.width||x<r.left||x>r.right||y<r.top||y>r.bottom)return false;
   const style=getComputedStyle(field),line=parseFloat(style.lineHeight)||36;ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
   if(!field.value)return y-r.top<line;
   const rows=[];for(const para of field.value.split('\n')){let row='';for(const ch of para){if(row&&ctx.measureText(row+ch).width>r.width){rows.push(row);row=ch;}else row+=ch;}rows.push(row);}
   const row=rows[Math.floor((y-r.top+field.scrollTop)/line)];if(row===undefined)return false;
   const width=ctx.measureText(row).width+row.length*(parseFloat(style.letterSpacing)||0),offset=style.textAlign==='center'?(r.width-width)/2:0;return x-r.left>=offset-5&&x-r.left<=offset+width+12;
  });
 }
 function moveText(frame,e){
  e.preventDefault();e.stopImmediatePropagation();
  const id=frame.dataset.textLayer,l=draft(),model=id==='main'||id==='title'?l:l.textBlocks.find(b=>b.id===id),key=id==='main'?'textBox':id==='title'?'titleBox':'box';if(!model)return;
  const box={x:parseFloat(frame.style.left),y:parseFloat(frame.style.top),w:parseFloat(frame.style.width),h:frame.getBoundingClientRect().height/frame.closest('.paper').getBoundingClientRect().height*100},r=frame.closest('.paper').getBoundingClientRect(),x=e.clientX,y=e.clientY;
  frame.setPointerCapture(e.pointerId);
  const move=ev=>{model[key]={...box,x:Math.max(0,Math.min(100-box.w,box.x+(ev.clientX-x)/r.width*100)),y:Math.max(0,Math.min(100-box.h,box.y+(ev.clientY-y)/r.height*100))};frame.style.left=model[key].x+'%';frame.style.top=model[key].y+'%';};
  const end=()=>{frame.removeEventListener('pointermove',move);frame.removeEventListener('pointerup',end);frame.removeEventListener('pointercancel',end);window.miao.save();};frame.addEventListener('pointermove',move);frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
 }
 document.addEventListener('pointerdown',e=>{
  const paper=e.target.closest('.paper');if(!paper||e.button!==0||e.target.closest('button,.object-properties'))return;
  const mode=paper.dataset.mode||'select';if(mode==='draw')return;let written=textAt(paper,e.clientX,e.clientY);const topObject=objectAt(paper,e.clientX,e.clientY);if(written&&topObject&&Number(topObject.style.zIndex)>Number(written.style.zIndex))written=null;
  if(mode==='select'&&written){document.querySelectorAll('.layer-box.selected').forEach(n=>n.classList.remove('selected'));written.classList.add('selected');window.miaoLayers.selectText(written.dataset.textLayer);$('.object-properties')?.replaceChildren();if(e.pointerType!=='touch')moveText(written,e);return;}
  if(written?.querySelector('textarea,input').value){document.querySelectorAll('.layer-box.selected').forEach(n=>n.classList.remove('selected'));written.classList.add('selected');window.miaoLayers.selectText(written.dataset.textLayer);$('.object-properties')?.replaceChildren();written.querySelector('textarea,input').focus();if(e.target.closest('[data-text-layer]')!==written){e.preventDefault();e.stopImmediatePropagation();}return;}
  const object=objectAt(paper,e.clientX,e.clientY);
  if(object){selectObject(object);if(e.target.closest('[data-object]'))return;e.preventDefault();e.stopImmediatePropagation();
   const s=draft().stickers[Number(object.dataset.object)],r=paper.getBoundingClientRect(),x=e.clientX,y=e.clientY,sx=s.x,sy=s.y;
   object.setPointerCapture(e.pointerId);
   const move=ev=>{s.x=Math.max(0,Math.min(100-(s.w||28),sx+(ev.clientX-x)/r.width*100));s.y=Math.max(0,Math.min(95,sy+(ev.clientY-y)/r.height*100));object.style.left=s.x+'%';object.style.top=s.y+'%';};
   const end=()=>{object.removeEventListener('pointermove',move);object.removeEventListener('pointerup',end);object.removeEventListener('pointercancel',end);window.miao.save();};object.addEventListener('pointermove',move);object.addEventListener('pointerup',end);object.addEventListener('pointercancel',end);return;
  }
  if(paper.classList.contains('draw'))return;
  if(mode!=='text'){document.querySelectorAll('.layer-box.selected').forEach(n=>n.classList.remove('selected'));$('.object-properties')?.replaceChildren();document.activeElement?.blur();return;}
  $('.object-properties')?.replaceChildren();const frame=textAt(paper,e.clientX,e.clientY);
  document.querySelectorAll('.layer-box.selected').forEach(n=>n.classList.remove('selected'));
  if(frame){frame.classList.add('selected');window.miaoLayers.selectText(frame.dataset.textLayer);frame.querySelector('textarea,input').focus();if(e.target.closest('[data-text-layer]')===frame)return;}
  if(frame)return;
  const place=(clientX,clientY)=>{const r=paper.getBoundingClientRect(),x=Math.max(2,Math.min(78,(clientX-r.left)/r.width*100)),y=Math.max(2,Math.min(88,(clientY-r.top)/r.height*100));window.miaoLayers.addTextAt({x,y,w:Math.min(70,96-x),h:Math.max(9,Math.min(20,96-y))});};
  if(e.pointerType==='touch'){
   const id=e.pointerId,x=e.clientX,y=e.clientY;let moved=false;
   const track=ev=>{if(ev.pointerId===id&&Math.hypot(ev.clientX-x,ev.clientY-y)>8)moved=true;};
   const finish=ev=>{if(ev.pointerId!==id)return;document.removeEventListener('pointermove',track,true);document.removeEventListener('pointerup',finish,true);document.removeEventListener('pointercancel',finish,true);if(ev.type==='pointerup'&&!moved&&Math.hypot(ev.clientX-x,ev.clientY-y)<=8&&paper.isConnected)place(ev.clientX,ev.clientY);};
   document.addEventListener('pointermove',track,true);document.addEventListener('pointerup',finish,true);document.addEventListener('pointercancel',finish,true);return;
  }
  e.preventDefault();e.stopImmediatePropagation();place(e.clientX,e.clientY);
 },true);
 document.addEventListener('input',e=>{
  const key=e.target.dataset.objectProp;if(!key)return;const tools=e.target.closest('.object-properties'),index=Number(tools.dataset.objectIndex),s=draft().stickers[index],el=$(`.sticker[data-object="${index}"]`);if(!s||!el)return;
  s[key]=key==='fill'?e.target.value:Number(e.target.value);
  if(key==='fill'){const doc=new DOMParser().parseFromString(decodeURIComponent(s.src.split(',').slice(1).join(',')),'image/svg+xml');doc.documentElement.setAttribute('fill',s.fill);s.src='data:image/svg+xml,'+encodeURIComponent(new XMLSerializer().serializeToString(doc));el.querySelector('img').src=s.src;}
  el.style.width=(s.w||28)+'%';el.style.transform=`rotate(${s.rotation||0}deg)`;window.miao.save();
 });
 window.addEventListener('miao:render',({detail})=>{if(detail.page==='record')queueMicrotask(()=>{if(!$('.object-properties'))$('.shape-tools')?.insertAdjacentHTML('afterend','<div class="object-properties"></div>');window.miaoLayers.setMode($('.paper').dataset.mode||'select');});});
})();
