(() => {
 const $=s=>document.querySelector(s);
 function hasContentBelow(next,old){const l=window.miao.state.draft,p=$('.paper'),rect=p.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d');for(const item of [{...l,text:l.text,box:l.textBox||{x:8,y:17,w:84,h:10}},...(l.textBlocks||[]).map(b=>({...l,...b})),{...l,...l.titleStyleProps,text:l.title,box:l.titleBox||{x:10,y:4,w:80,h:9},fontSize:l.titleSize||22}]){if(!item.text?.trim())continue;const fs=Number(item.fontSize)||19;ctx.font=`700 ${fs}px ${window.miaoJournal.font(item)}`;const width=rect.width*item.box.w/100;let rows=0;for(const para of item.text.split('\n')){let line='';rows++;for(const ch of para){if(line&&ctx.measureText(line+ch).width+(line.length+1)*(Number(item.charSpacing)||0)>width){rows++;line=ch;}else line+=ch;}}if(old*item.box.y/100+rows*window.miaoJournal.line(item)+10>next)return true;}for(const el of p.querySelectorAll('.sticker'))if(el.getBoundingClientRect().bottom-rect.top>next-4)return true;if(l.drawing){const c=$('#canvas'),cutoff=Math.floor(c.height*next/old),pixels=c.getContext('2d').getImageData(0,cutoff,c.width,c.height-cutoff).data;if(pixels.some((v,i)=>i%4===3&&v>0))return true;}return false;}
 function extend(amount=500){
  const p=$('.paper'),l=window.miao.state.draft;if(!p)return;const before=p.getBoundingClientRect(),canvas=$('#canvas'),copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);
  const old=before.height,next=Math.max(900,Math.min(6000,old+amount)),ratio=old/next;if(next===old)return;if(amount<0&&hasContentBelow(next,old)){window.miao.toast('下方还有内容，请先移走或删除，再缩短信纸');return;}
  l.textBox??={x:8,y:17,w:84,h:10};l.titleBox??={x:10,y:4,w:80,h:9};
  for(const b of [l.textBox,l.titleBox,...(l.textBlocks||[]).map(t=>t.box)]){b.y*=ratio;b.h=Math.min(98-b.y,b.h*ratio);}
  for(const s of l.stickers||[])s.y*=ratio;
  l.ruleStart=(l.ruleStart??17)*ratio;l.paperHeight=next;l.paperRatio=before.width/next;l.paperWidth=before.width;p.style.height=next+'px';p.style.setProperty('--rule-start',l.ruleStart+'%');
  for(const f of p.querySelectorAll('[data-text-layer]')){const id=f.dataset.textLayer,b=id==='main'?l.textBox:id==='title'?l.titleBox:l.textBlocks.find(t=>t.id===id)?.box;if(b){f.style.top=b.y+'%';f.style.height=b.h+'%';}}
  for(const el of p.querySelectorAll('.sticker'))el.style.top=l.stickers[Number(el.dataset.object)].y+'%';
  canvas.height=Math.round(copy.height/old*next);canvas.getContext('2d').drawImage(copy,0,0);if(l.drawing)l.drawing=canvas.toDataURL();$('[data-action="shorten-paper"]').disabled=next<=900;window.miao.save();
 }
 window.addEventListener('miao:render',({detail})=>{if(detail.page!=='record')return;queueMicrotask(()=>{
  const p=$('.paper'),l=window.miao.state.draft;if(!p)return;const height=p.getBoundingClientRect().height,wrap=document.createElement('div');wrap.className='paper-scroll';p.replaceWith(wrap);wrap.append(p);p.style.height=height+'px';p.style.setProperty('--rule-start',(l.ruleStart??17)+'%');
  wrap.insertAdjacentHTML('beforeend',`<div class="paper-length-controls"><button class="extend-paper" data-action="extend-paper" title="向下续一页" aria-label="向下续一页">${window.miaoMotion.icon('plus')}</button><button class="extend-paper" data-action="shorten-paper" title="删除末尾空白延长" aria-label="缩短信纸">${window.miaoMotion.icon('minus')}</button></div>`);
  let timer;wrap.addEventListener('scroll',()=>{l.paperScrollTop=wrap.scrollTop;clearTimeout(timer);timer=setTimeout(()=>window.miao.save(),180);});
  if(l.format==='postcard')return;
  if(l.paperHeight){p.style.height=l.paperHeight+'px';const canvas=$('#canvas'),dpr=devicePixelRatio||1;canvas.width=Math.round(p.clientWidth*dpr);canvas.height=Math.round(p.clientHeight*dpr);if(l.drawing){const image=new Image();image.onload=()=>canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.src=l.drawing;}}
  else if(l.drawing){const image=new Image();image.onload=()=>{if(!p.isConnected)return;$('#canvas').getContext('2d').drawImage(image,0,0,$('#canvas').width,$('#canvas').height);extend(Math.max(0,900-height));};image.src=l.drawing;}
  else extend(Math.max(0,900-height));
  wrap.scrollTop=l.paperScrollTop||0;$('[data-action="shorten-paper"]').disabled=(l.paperHeight||900)<=900;
 });});
 document.addEventListener('click',e=>{const button=e.target.closest('[data-action="extend-paper"],[data-action="shorten-paper"]');if(!button)return;extend(button.dataset.action==='shorten-paper'?-500:500);});
 document.addEventListener('input',e=>{if(!e.target.matches('.paper textarea'))return;const p=$('.paper'),f=e.target.closest('[data-text-layer]'),r=p.getBoundingClientRect(),b=f.getBoundingClientRect();if(b.bottom>r.bottom-70)extend();});
})();
