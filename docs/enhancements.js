(() => {
 'use strict';
 const $=s=>document.querySelector(s), api=()=>window.miao;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const icons={pen:'<path d="m4 20 4-1L20 7l-4-4L4 15Z M14 5l4 4"/>',music:'<path d="M9 18V5l12-2v13 M9 8l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',undo:'<path d="m8 3-5 5 5 5 M3 8h10a7 7 0 0 1 0 14"/>',redo:'<path d="m16 3 5 5-5 5 M21 8H11a7 7 0 0 0 0 14"/>',type:'<path d="M4 4h16 M12 4v17 M8 21h8"/>',stickers:'<path d="M20 13V4H4v16h9Z M13 20v-7h7"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 4-7 4 6"/>'};
 const svg=k=>window.miaoMotion.icon(({pen:'pencil',music:'music',undo:'undo-2',redo:'redo-2',type:'type',stickers:'sticker',image:'image'})[k]||k);
 let generation=0,pen=false,editorMode='select',mode='铅笔',size=3,color='#7b4728',undo=[],redo=[],player=new Audio(),ambient=null,selected=null,ringUpload='',delivering=false;
 const weatherArt=name=>window.miaoMotion.weatherArt(name);
 async function animateCat(canvas,file,ticket){
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  try{
   if(!('ImageDecoder' in window))throw new Error('decoder');
   const response=await fetch('assets/'+file),decoder=new ImageDecoder({data:await response.arrayBuffer(),type:'image/gif'});await decoder.tracks.ready;
   const count=decoder.tracks.selectedTrack.frameCount;let i=0;
   while(ticket===generation&&canvas.isConnected){
    const {image}=await decoder.decode({frameIndex:i});canvas.width=image.displayWidth;canvas.height=image.displayHeight;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    for(let p=0;p<pixels.data.length;p+=4){if(Math.max(pixels.data[p],pixels.data[p+1],pixels.data[p+2])<40)pixels.data[p+3]=0;}
    ctx.putImageData(pixels,0,0);const delay=Math.max(40,(image.duration||100000)/1000);image.close();i=(i+1)%count;await new Promise(r=>setTimeout(r,delay));
   }decoder.close();
  }catch(e){if(canvas.isConnected){const image=document.createElement('img');image.src='assets/'+file;image.alt='动态猫咪';image.style.cssText='max-width:100%;max-height:100%;mix-blend-mode:screen;background:#7b4728';canvas.replaceWith(image);}}
 }
 function stickers(){
  const target=$('#stickers');if(!target)return;
  const adding=target.children.length<api().state.draft.stickers.length;
  target.innerHTML=api().state.draft.stickers.map((s,i)=>`<div tabindex="0" class="sticker" data-object="${i}" style="left:${s.x}%;top:${s.y}%;width:${s.w||28}%;transform:rotate(${Number(s.rotation)||0}deg)"><img src="${esc(s.src)}" alt="日记图片" draggable="false"><button class="remove-handle" data-remove="${i}" aria-label="删除图片" title="删除图片">×</button><button class="resize-handle" aria-label="缩放图片" title="拖动缩放"></button>${s.kind==='shape'?'':`<button class="crop-handle" data-crop-object="${i}" aria-label="裁切素材" title="裁切素材">${svg('crop')}</button>`}<button class="rotate-handle" aria-label="旋转图片" title="拖动旋转，方向键微调">${svg('rotate-cw')}</button></div>`).join('');
  target.querySelectorAll('[data-object]').forEach(el=>el.addEventListener('pointerdown',e=>{
   if(e.target.closest('[data-remove],[data-crop-object]'))return;e.preventDefault();el.focus();const s=api().state.draft.stickers[+el.dataset.object],rect=$('.paper').getBoundingClientRect(),box=el.getBoundingClientRect(),center={x:box.x+box.width/2,y:box.y+box.height/2},start={x:e.clientX,y:e.clientY,sx:s.x,sy:s.y,w:s.w||28,rotation:Number(s.rotation)||0,angle:Math.atan2(e.clientY-center.y,e.clientX-center.x)},resizing=!!e.target.closest('.resize-handle'),rotating=!!e.target.closest('.rotate-handle');el.setPointerCapture(e.pointerId);
   const move=ev=>{if(rotating){s.rotation=Math.round(start.rotation+(Math.atan2(ev.clientY-center.y,ev.clientX-center.x)-start.angle)*180/Math.PI);el.style.transform=`rotate(${s.rotation}deg)`;}else if(resizing){const angle=start.rotation*Math.PI/180,delta=(ev.clientX-start.x)*Math.cos(angle)+(ev.clientY-start.y)*Math.sin(angle);s.w=Math.max(8,Math.min(100-s.x,start.w+delta/rect.width*100));el.style.width=s.w+'%';}else{s.x=Math.max(0,Math.min(100-(s.w||28),start.sx+(ev.clientX-start.x)/rect.width*100));s.y=Math.max(0,Math.min(90,start.sy+(ev.clientY-start.y)/rect.height*100));el.style.left=s.x+'%';el.style.top=s.y+'%';}};
   const end=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('pointercancel',end);api().save();};el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  }));
  if(adding)target.lastElementChild?.focus();
 }
 function refreshCanvas(){const c=$('#canvas');if(c){const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;api().state.draft.drawing=pixels.some((v,i)=>i%4===3&&v>0)?c.toDataURL():'';}api().save();}
 function restore(image){const c=$('#canvas'),ctx=c.getContext('2d'),im=new Image();im.onload=()=>{ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);refreshCanvas();};im.src=image;}
 function brush(){const c=$('#canvas'),ctx=c.getContext('2d');let active=false,last=null;
  const pos=e=>{const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};};
  c.addEventListener('pointerdown',e=>{if(!pen)return;e.stopImmediatePropagation();undo.push(c.toDataURL());if(undo.length>25)undo.shift();redo=[];active=true;last=pos(e);c.setPointerCapture(e.pointerId);},{capture:true});
  c.addEventListener('pointermove',e=>{if(!active)return;e.stopImmediatePropagation();const p=pos(e),scale=c.width/c.getBoundingClientRect().width;ctx.globalCompositeOperation=mode==='橡皮'?'destination-out':'source-over';ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=mode==='马克笔'?.25:mode==='铅笔'?.55:1;ctx.lineWidth=size*scale*(mode==='马克笔'||mode==='橡皮'?3:mode==='钢笔'?(.5+Math.max(.2,e.pressure||.5)):1);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();
   if(mode==='蜡笔'){const distance=Math.hypot(p.x-last.x,p.y-last.y);ctx.globalAlpha=.35;for(let n=0;n<distance*2;n++){const t=Math.random();ctx.fillRect(last.x+(p.x-last.x)*t+(Math.random()-.5)*size*scale*2,last.y+(p.y-last.y)*t+(Math.random()-.5)*size*scale*2,scale,scale);}}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';last=p;
  },{capture:true});
  const finish=e=>{if(active){e.stopImmediatePropagation();active=false;refreshCanvas();}};c.addEventListener('pointerup',finish,{capture:true});c.addEventListener('pointercancel',finish,{capture:true});
 }
 function setPen(on,next='select'){pen=on;editorMode=on?'draw':next;window.miaoLayers?.setMode(editorMode);$('.paper')?.classList.toggle('draw',on);$('#brush-controls').hidden=!on;document.querySelectorAll('[data-action=pen],[data-action=type]').forEach(b=>{const active=b.dataset.action==='pen'?on:editorMode==='text';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});if(editorMode!=='text'&&$('.paper')?.contains(document.activeElement))document.activeElement.blur();}
 function scene(l){const courier=l.courier||(api().page==='delivery'?api().courier:''),profile=window.miaoCouriers.profiles[courier];return `<div class="letter-preview" data-courier="${esc(courier)}"><div class="letter-scene" data-courier="${esc(courier)}" data-template="${esc(l.template||'lines')}" style="aspect-ratio:${Number(l.paperRatio)||.67};${l.template==='plain'?'background-color:var(--paper)':''}">${profile?`<span class="stationery-mark" aria-hidden="true">${window.miaoMotion.icon(profile.motif)}</span>`:''}<p>${esc(l.text)}</p>${l.drawing?`<img class="ink-layer" src="${esc(l.drawing)}" alt="涂鸦">`:''}${(l.stickers||[]).map(s=>`<img class="saved-sticker" src="${esc(s.src)}" alt="贴纸" style="left:${s.x}%;top:${s.y}%;width:${s.w||28}%;transform:rotate(${Number(s.rotation)||0}deg)">`).join('')}${profile?`<span class="stationery-stamp"><img src="assets/${esc(courier)}.png" alt="">${esc(courier)}已送达</span>`:''}</div><small class="letter-weather">${weatherArt(l.weather||api().state.weather)}${esc(l.date)} · ${esc(l.weather||api().state.weather)}</small>${l.comment?`<aside class="cat-comment"><img src="assets/${esc(courier)}.png" alt="${esc(courier)}"><p>${esc(l.comment)}</p></aside>`:''}</div>`;}
 function music(){api().open(`<h2>咪的音乐角</h2><div class="music-controls"><label>上传音乐<input id="music-upload" type="file" accept="audio/*"></label><p id="track-name">${esc(selected?.name||'尚未选择音乐')}</p><audio id="music-player" controls ${selected?`src="${esc(selected.src)}"`:''}></audio><label>音量<input id="music-volume" type="range" min="0" max="1" step=".05" value="${player.volume}"></label><label style="display:flex;align-items:center"><input id="music-loop" type="checkbox" style="width:20px" ${player.loop?'checked':''}>循环播放</label><div class="music-actions"><button data-ambience="rain">雨声</button><button data-ambience="stop">停止雨声</button></div></div>`);const el=$('#music-player');el.currentTime=player.currentTime;el.volume=player.volume;el.loop=player.loop;el.onplay=()=>{player.pause();};el.onpause=()=>{};}
 function stopAmbient(){if(ambient){ambient.close();ambient=null;}}
 function rain(){stopAmbient();ambient=new AudioContext();const buffer=ambient.createBuffer(1,ambient.sampleRate*3,ambient.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.16;const source=ambient.createBufferSource(),filter=ambient.createBiquadFilter();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=1100;source.connect(filter).connect(ambient.destination);source.start();}
 function alarmEditor(index){const a=api().state.alarms[index]||{time:'08:00',note:'',ring:'风铃',days:[]};ringUpload=a.ringtone||'';api().open(`<h2>${index>=0?'编辑闹钟':'新建闹钟'}</h2><form id="enhanced-alarm" data-index="${index}"><label>时间<input name="time" type="time" value="${esc(a.time)}" required></label><label>提醒<input name="note" maxlength="40" value="${esc(a.note)}" required></label><label>铃声<select name="ring">${['风铃','喵喵叫','呼噜噜','自定义'].map(r=>`<option ${a.ring===r?'selected':''}>${r}</option>`).join('')}</select></label><label>上传铃声<input id="ring-upload" type="file" accept="audio/*"></label><fieldset><legend>重复日期（不选为每天）</legend>${['日','一','二','三','四','五','六'].map((d,i)=>`<label style="display:inline-flex;margin:4px"><input style="width:18px" name="days" value="${i}" type="checkbox" ${(a.days||[]).includes(i)?'checked':''}>${d}</label>`).join('')}</fieldset><button class="primary">保存</button></form>`);}
 window.addEventListener('miao:render',({detail})=>{
  generation++;pen=false;const s=api().state;
  if(detail.page==='home'){
   window.miaoMotion.renderHome($('.home'));window.miaoMotion.homeSummary();
  }
  if(detail.page==='clock'){document.querySelectorAll('.line-item .grow').forEach((el,i)=>{el.innerHTML=`<button class="alarm-edit" data-edit-alarm="${i}">${el.innerHTML}</button>`;});}
  if(detail.page==='record'){
   undo=[];redo=[];document.querySelectorAll('.tool[data-action]').forEach(b=>{if(icons[b.dataset.action])b.innerHTML=svg(b.dataset.action);});$('.tool[title="添加图片"]').childNodes[0].replaceWith(document.createRange().createContextualFragment(svg('image')));
   $('.send').insertAdjacentHTML('beforebegin',`<button class="tool" data-action="redo" aria-label="重做" title="重做">${svg('redo')}</button><button class="tool" data-action="music" aria-label="音乐" title="音乐">${svg('music')}</button>`);
   $('.record-date').insertAdjacentHTML('beforebegin',`<div class="brush-controls" id="brush-controls" hidden><select id="brush-mode" aria-label="画笔">${['蜡笔','铅笔','钢笔','马克笔'].map(m=>`<option ${m===mode?'selected':''}>${m}</option>`).join('')}</select><input id="brush-size" title="画笔或橡皮粗细" aria-label="画笔粗细" type="range" min="1" max="12" value="${size}"><input id="brush-color" aria-label="画笔颜色" type="color" value="${color}"><button data-action="eraser" class="eraser-tool ${mode==='橡皮'?'active':''}" title="橡皮" aria-label="橡皮">${svg('eraser')}</button></div><div class="paper-controls" role="group" aria-label="信纸选择"><strong>信纸</strong>${[['lines','横线'],['plain','留白'],['dot','点阵']].map(([id,name])=>`<button data-paper="${id}" aria-pressed="${(s.draft.template||'lines')===id}"><span class="paper-swatch ${id}" aria-hidden="true"></span>${name}</button>`).join('')}</div>`);
   $('.record-date span').innerHTML=`<button data-action="weather" title="心情天气">${esc(s.draft.weather||s.weather)} ▾</button>`;$('.paper').dataset.template=s.draft.template||'lines';brush();stickers();
  }
  if(detail.page==='record')setPen(editorMode==='draw',editorMode);
  if(detail.page==='delivery'){$('.letter-preview').outerHTML=scene(s.draft);window.miaoMotion.courierChoice();}
 });
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!api())return;const action=b.dataset.action;let handled=true;
  if(b.dataset.page&&api().page==='record'){const r=$('.paper').getBoundingClientRect();api().state.draft.paperRatio=r.width/r.height;api().state.draft.paperWidth=r.width;}
  if(b.dataset.remove!==undefined){api().state.draft.stickers.splice(+b.dataset.remove,1);$('.object-properties')?.replaceChildren();api().save();stickers();}
  else if(b.dataset.editAlarm!==undefined)alarmEditor(+b.dataset.editAlarm);
  else if(action==='alarm')alarmEditor(-1);
  else if(action==='cat')window.miaoAssets.introduce();
  else if(action==='pen')setPen(!pen);
  else if(action==='eraser'){mode=mode==='橡皮'?$('#brush-mode').value:'橡皮';b.classList.toggle('active',mode==='橡皮');}
  else if(b.dataset.paper){api().state.draft.template=b.dataset.paper;$('.paper').dataset.template=b.dataset.paper;document.querySelectorAll('[data-paper]').forEach(el=>el.setAttribute('aria-pressed',el===b?'true':'false'));api().save();}
  else if(action==='type')setPen(false,editorMode==='text'?'select':'text');
  else if(action==='undo'||action==='redo'){const from=action==='undo'?undo:redo,to=action==='undo'?redo:undo;if(from.length){to.push($('#canvas').toDataURL());restore(from.pop());}}
  else if(action==='music')music();
  else if(b.dataset.ambience){b.dataset.ambience==='rain'?rain():stopAmbient();}
  else if(action==='templates'){api().open('<h2>信纸模板</h2><div class="template-picker"><button data-template="lines">横线</button><button data-template="plain">留白</button><button data-template="dot">点阵</button></div>');}
  else if(b.dataset.template){api().state.draft.template=b.dataset.template;$('.paper').dataset.template=b.dataset.template;api().save();$('#modal').close();}
  else if(action==='weather')api().open(`<h2>今天的心情天气</h2><div class="weather-grid">${window.miaoMotion.weatherNames.map(w=>`<button data-mood="${w}" aria-pressed="${api().state.weather===w}">${weatherArt(w)}${w}</button>`).join('')}</div>`);
  else if(b.dataset.mood){const s=api().state;s.weather=b.dataset.mood;s.draft.weather=b.dataset.mood;api().save();$('#modal').close();if(api().page==='record')$('.record-date span').innerHTML=`<button data-action="weather">${esc(s.weather)} ▾</button>`;}
  else if(action==='stickers')window.miaoAssets.openStickers();
  else if(b.dataset.userSticker){api().state.draft.stickers.push({src:b.dataset.userSticker,...window.miaoAssetUtils.visiblePosition(25),w:25,kind:'sticker'});api().save();$('#modal').close();stickers();}
  else if(b.dataset.letter){const l=api().state.letters.find(l=>l.id===b.dataset.letter);api().open(`<h2>${esc(l.courier)}送来的信</h2>${scene(l)}<button class="primary" data-edit-letter="${l.id}">编辑这封信</button>`);}
  else if(action==='deliver'){
   const a=api(),s=a.state;if(delivering||!a.courier)return;if(!s.draft.text.trim()&&!(s.draft.textBlocks||[]).some(b=>b.text?.trim())&&!s.draft.stickers.length&&!s.draft.drawing){a.toast('先写一点今天的故事吧');return;}delivering=true;
   $('#view').inert=true;$('#app').insertAdjacentHTML('beforeend','<div class="delivery-loading" role="status" aria-label="信件正在投递"><div class="loading-heads"><img src="assets/白白.png" alt="白白"><img src="assets/莉莉.png" alt="莉莉"><img src="assets/阿夜.png" alt="阿夜"></div><p class="loading-copy">猫猫正在投递中</p><div class="loading-stripe"></div></div>');
   setTimeout(()=>{const l={...structuredClone(s.draft),weather:s.draft.weather||s.weather,courier:a.courier,id:crypto.randomUUID()};delete l.editing;l.comment=window.miaoCouriers.comment(l);const nickname=window.miaoPeople.profile(s,window.miaoAuth?.user).nickname;if(nickname)l.comment=nickname+'，'+l.comment;delivering=false;$('.delivery-loading').remove();$('#view').inert=false;window.miaoJournal.confirm(l);},1500);
  }else handled=false;
  if(handled){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 document.addEventListener('change',async e=>{
  const el=e.target;if(!api())return;
  if(el.id==='brush-mode'){mode=el.value;$('.eraser-tool')?.classList.remove('active');}if(el.id==='brush-color')color=el.value;
  if(['upload','custom-sticker','ring-upload','music-upload'].includes(el.id)&&el.files[0]){
   e.stopImmediatePropagation();const file=el.files[0],intoSlot=el.dataset.slot==='1';el.dataset.slot='0';if(file.size>8*1024*1024){api().toast('请选择小于 8 MB 的文件');return;}
   if(el.id==='music-upload'){if(!file.type.startsWith('audio/'))return;selected={name:file.name,src:URL.createObjectURL(file)};player.src=selected.src;$('#music-player').src=selected.src;$('#track-name').textContent=file.name;return;}
   const reader=new FileReader();reader.onload=()=>{
    if(el.id==='ring-upload'){ringUpload=reader.result;$('#enhanced-alarm select').value='自定义';return;}
    const image=new Image();image.onload=()=>{const c=document.createElement('canvas'),scale=Math.min(1,1200/image.width,1200/image.height);c.width=image.width*scale;c.height=image.height*scale;c.getContext('2d').drawImage(image,0,0,c.width,c.height);api().state.draft.stickers.push({src:c.toDataURL('image/webp',.88),...window.miaoAssetUtils.visiblePosition(40),w:40,kind:el.id==='upload'?'image':'sticker'});if(el.id==='upload'&&intoSlot&&api().state.draft.layout){const s=api().state.draft.stickers.at(-1);Object.assign(s,api().state.draft.layout==='photo-top'?{x:22,y:18,w:56}:api().state.draft.layout==='photo-side'?{x:8,y:23,w:34}:{});}api().save();if(el.id==='custom-sticker')$('#modal').close();stickers();};image.src=reader.result;
   };reader.readAsDataURL(file);
  }
  if(el.id==='music-loop'){$('#music-player').loop=el.checked;player.loop=el.checked;}
 },true);
 document.addEventListener('input',e=>{if(e.target.id==='brush-size')size=+e.target.value;if(e.target.id==='music-volume'){$('#music-player').volume=+e.target.value;player.volume=+e.target.value;}});
 document.addEventListener('submit',e=>{if(e.target.id!=='enhanced-alarm')return;e.preventDefault();e.stopImmediatePropagation();const data=new FormData(e.target),index=+e.target.dataset.index,alarm={time:data.get('time'),note:data.get('note'),ring:data.get('ring'),days:data.getAll('days').map(Number),ringtone:ringUpload,on:true};if(alarm.ring==='自定义'&&!ringUpload){api().toast('请先上传铃声');return;}if(index>=0)api().state.alarms[index]=alarm;else api().state.alarms.push(alarm);api().save();$('#modal').close();api().render();},true);
 document.addEventListener('close',e=>{if(e.target.id!=='modal')return;const el=$('#music-player');if(el&&selected){player.src=selected.src;player.currentTime=el.currentTime;player.volume=el.volume;player.loop=el.loop;if(!el.paused){el.pause();player.play().catch(()=>{});}}},true);
 document.addEventListener('keydown',e=>{const handle=e.target.closest('.rotate-handle');if(!handle||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const el=handle.closest('[data-object]'),s=api().state.draft.stickers[+el.dataset.object];s.rotation=(Number(s.rotation)||0)+(e.key==='ArrowRight'?5:-5);el.style.transform=`rotate(${s.rotation}deg)`;api().save();});
 window.miaoPreview=scene;
 document.addEventListener('pointerdown',e=>{if(e.target.closest('label[title="添加图片"]'))$('#upload').dataset.slot='0';},true);
})();
