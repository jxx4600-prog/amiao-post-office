(() => {
 const names=['白白','莉莉','阿夜','大王'];
 const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
 const media=Promise.all([load('assets/courier-actions-v6.png'),load('assets/postal-elements-v6.png'),load('assets/courier-inbetweens-v7.png'),load('assets/weather-symbols-v8.png'),load('assets/sun-cloud-components-v9.png'),load('assets/home-rain-hd.png')]);
 let ticket=0,captionObserver=null;
 function alignCaptions(home){const top=home.getBoundingClientRect().top;for(const [caption,art,fraction,height] of [['.todo-caption','.home-calendar-illustration',.836,15],['.time-caption','.home-clock-illustration',.85,14],['.daily-caption','.home-window',.947,22]]){const text=home.querySelector(caption),ref=home.querySelector(art);if(!text||!ref)continue;const r=ref.getBoundingClientRect();Object.assign(text.style,{top:(r.top-top+r.height*fraction+3)+'px',height:height+'px',minHeight:'0',lineHeight:height+'px',left:r.left-home.getBoundingClientRect().left+'px',width:r.width+'px'});}}
 function removeSmallFragments(context,w,h){const d=context.getImageData(0,0,w,h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h);for(let p=0;p<seen.length;p++){if(seen[p]||d.data[p*4+3]<24)continue;let head=0,tail=1;seen[p]=1;queue[0]=p;while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!seen[n]&&d.data[n*4+3]>=24){seen[n]=1;queue[tail++]=n;}}if(tail<80)for(let i=0;i<tail;i++)d.data[queue[i]*4+3]=0;}context.putImageData(d,0,0);}
 const spriteCache=new WeakMap();
 function sprite(image,row,col){
  if(!spriteCache.has(image)){
   const source=document.createElement('canvas');source.width=image.width;source.height=image.height;const context=source.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
   const pixels=context.getImageData(0,0,source.width,source.height),w=source.width,h=source.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=[];
   for(let p=0;p<seen.length;p++){if(seen[p]||pixels.data[p*4+3]<24)continue;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;seen[p]=1;queue[0]=p;
    while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!seen[n]&&pixels.data[n*4+3]>=24){seen[n]=1;queue[tail++]=n;}}
    if(tail>3000)groups.push({x0,y0,x1,y1,size:tail,points:queue.slice(0,tail)});
   }
   const scale=440/Math.max(...groups.map(g=>Math.max(g.x1-g.x0+1,g.y1-g.y0+1))),frames=[];
   for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const group=groups.filter(g=>Math.floor((g.x0+g.x1)/2/w*4)===c&&Math.floor((g.y0+g.y1)/2/h*4)===r).sort((a,b)=>b.size-a.size)[0],out=document.createElement('canvas');out.width=out.height=512;
    if(group){const crop=document.createElement('canvas');crop.width=group.x1-group.x0+1;crop.height=group.y1-group.y0+1;const data=crop.getContext('2d').createImageData(crop.width,crop.height);for(const k of group.points){const x=k%w-group.x0,y=Math.floor(k/w)-group.y0,d=(y*crop.width+x)*4;for(let j=0;j<4;j++)data.data[d+j]=pixels.data[k*4+j];}crop.getContext('2d').putImageData(data,0,0);out.getContext('2d').drawImage(crop,(512-crop.width*scale)/2,480-crop.height*scale,crop.width*scale,crop.height*scale);}
    frames.push(out);
   }spriteCache.set(image,frames);
  }return spriteCache.get(image)[row*4+col];
 }
 function cleanEdges(ctx){const d=ctx.getImageData(0,0,512,512);for(let i=3;i<d.data.length;i+=4)if(d.data[i]<24)d.data[i]=0;const seen=new Uint8Array(512*512),queue=new Int32Array(512*512);for(let p=0;p<seen.length;p++){if(seen[p]||d.data[p*4+3]<24)continue;let head=0,tail=1,minY=511,maxY=0;queue[0]=p;seen[p]=1;while(head<tail){const k=queue[head++],y=Math.floor(k/512),x=k%512;minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x>0?k-1:-1,x<511?k+1:-1,y>0?k-512:-1,y<511?k+512:-1])if(n>=0&&!seen[n]&&d.data[n*4+3]>=24){seen[n]=1;queue[tail++]=n;}}if((minY<80&&maxY-minY<60)||(minY>420&&maxY-minY<55))for(let i=0;i<tail;i++)d.data[queue[i]*4+3]=0;}ctx.putImageData(d,0,0);}
 function cell(image,x,y,w,h,align=false){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),scale=448/Math.max(w,h);ctx.drawImage(image,x,y,w,h,(512-w*scale)/2,(512-h*scale)/2,w*scale,h*scale);if(align){cleanEdges(ctx);const d=ctx.getImageData(0,0,512,512);let bottom=480;for(let row=511;row>=0;row--){let count=0;for(let col=0;col<512;col++)if(d.data[(row*512+col)*4+3]>100)count++;if(count>8){bottom=row;break;}}const copy=document.createElement('canvas');copy.width=copy.height=512;copy.getContext('2d').drawImage(c,0,480-bottom);return copy;}return c;}
 async function decorate(){
  captionObserver?.disconnect();const current=++ticket,home=document.querySelector('.home');if(!home)return;
  const puppet=home.querySelector('.courier-puppet'),name=puppet.getAttribute('aria-label').replace('动态陪伴',''),row=names.indexOf(name);
  await window.miaoAssets.ready;if(current!==ticket||!home.isConnected)return;
  puppet.innerHTML=`<img class="courier-still" src="${window.miaoAssets.body(name)}" alt="">`;
  const [atlas,elements,between,sky,components,originalRain]=await media;if(current!==ticket||!home.isConnected)return;
  const boundaries=[0,315,640,925,1280],sy=boundaries[row]/1280*atlas.height,sh=(boundaries[row+1]-boundaries[row])/1280*atlas.height;
  const frames=Array.from({length:4},(_,i)=>[sprite(atlas,row,i),sprite(between,row,i)]).flat();
  const canvas=document.createElement('canvas');canvas.className='courier-frames';canvas.width=canvas.height=512;canvas.setAttribute('aria-hidden','true');puppet.replaceChildren(canvas);const ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),sequence=[0,0,0,0,0,0,0,0,1,2,3,4,5,6,6,6,7],start=performance.now();let last=-1;
  function paint(now){if(current!==ticket||!canvas.isConnected)return;const frame=reduced.matches?0:sequence[Math.floor(Math.max(0,now-start)/125)%sequence.length];if(frame!==last){ctx.clearRect(0,0,512,512);ctx.drawImage(frames[frame],0,0);canvas.dataset.frame=frame;last=frame;}if(!reduced.matches)requestAnimationFrame(paint);}
  paint(start);
  const deco=index=>{const c=cell(elements,index%2*elements.width/2,Math.floor(index/2)*elements.height/2,elements.width/2,elements.height/2);window.miaoAssetUtils.isolate(c.getContext('2d'),index===2?4:1,40);return c.toDataURL('image/webp',.94);};
  const weather=home.querySelector('.home-weather');
  const choice=weather.dataset.weather||'sun';
  function originalPart(x,y,w,h,opaque=false){const c=document.createElement('canvas');c.width=w;c.height=h;const context=c.getContext('2d');context.drawImage(originalRain,x,y,w,h,0,0,w,h);const d=context.getImageData(0,0,w,h),background=k=>d.data[k*4]>230&&d.data[k*4+1]>220&&d.data[k*4+2]>180;if(opaque){const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;const push=k=>{if(k>=0&&k<w*h&&!seen[k]&&background(k)){seen[k]=1;queue[tail++]=k;}};for(let col=0;col<w;col++){push(col);push((h-1)*w+col);}for(let row=0;row<h;row++){push(row*w);push(row*w+w-1);}while(head<tail){const k=queue[head++],col=k%w,row=Math.floor(k/w);d.data[k*4+3]=0;if(col>0)push(k-1);if(col<w-1)push(k+1);if(row>0)push(k-w);if(row<h-1)push(k+w);}}else for(let k=0;k<w*h;k++)if(background(k))d.data[k*4+3]=0;context.putImageData(d,0,0);window.miaoAssetUtils.isolate(context,opaque?1:3,24);return c.toDataURL('image/webp',.96);}
  const sun=cell(components,0,0,components.width/2,components.height).toDataURL('image/webp',.95),cloud=originalPart(95,150,430,254,true),catRain=originalPart(110,397,380,111);weather.dataset.weather=choice;
  if(choice==='sun')weather.innerHTML=`<img class="sky-sun" src="${sun}" alt="晴天太阳"><img class="sky-cloud sunny" src="${cloud}" alt="猫云">`;
  else if(choice==='rainbow'){const arch=cell(sky,sky.width/2,0,sky.width/2,sky.height);arch.getContext('2d').clearRect(0,285,512,227);weather.innerHTML=`<img class="sky-arch" src="${arch.toDataURL('image/webp',.95)}" alt="彩虹"><img class="sky-cloud rainbow-left" src="${cloud}" alt="猫云"><img class="sky-cloud rainbow-right" src="${cloud}" alt="">`;}
  else weather.innerHTML=`<img class="sky-cloud rainy" src="${cloud}" alt="雨天猫云"><img class="rain-cat-word" src="${catRain}" alt="CAT"><span class="rain-field" aria-hidden="true">${Array.from({length:9},(_,i)=>`<i style="left:${8+i*10}%;animation-delay:${-i*.21}s"></i>`).join('')}</span>`;
  home.insertAdjacentHTML('beforeend',`<span class="todo-caption">Cat's to do</span>`);
  home.insertAdjacentHTML('beforeend',`<div class="postal-doodles" aria-hidden="true"><img src="${deco(row===2?2:1)}"><span>邮局营业中</span><i></i></div>`);
  const notes=['小事也有自己的邮戳。','今天的云，暂时不赶路。','把一小段时间，留给窗外。','没有新鲜事，也可以寄一封信。','路过的风，已经替你签收。','此刻没答案，先夹进书里。','日子慢一点，细节就多一点。','一朵花的进度，也算进度。'];
  home.querySelector('.home-window').insertAdjacentHTML('beforeend',`<span class="window-note">${notes[Math.floor(Math.random()*notes.length)]}</span>`);
  const tips=['眼睛申请放风三十秒。批准！','喝口水，别把自己晾成小鱼干。','待办很多？先捞最小的一条。','灵感还没到？先放它出去溜一圈。','肩膀别加班，放松一下。','记录不用写满，留点空白给明天。','杯子空了，水分补给站开门啦。','今天先完成一件，剩下的排队。','伸个懒腰，给骨头放个短假。','手机也累了，让它坐一会儿。','走两步，没准灵感就在门口。','饭要趁热，烦恼可以晚点处理。','先吃饭，再和难题对线。','文件记得存，猫猫不负责撤回。','给自己五分钟空档，不用填满。','困了就休息，不和哈欠较劲。','窗外有免费天气，去看两眼。','桌面收一小块，就算今日胜利。','大计划切小块，像分小鱼干。','没写完的句子，明天接着写。','这封信不用满分，寄出就算数。','再忙也要给水杯续个杯。','任务有队列，你也有休息时间。','别急，猫猫还没系好邮袋。'];home.querySelector('.home-tip p').textContent=tips[Math.floor(Math.random()*tips.length)];alignCaptions(home);captionObserver=new ResizeObserver(()=>alignCaptions(home));captionObserver.observe(home);
 }
 window.addEventListener('miao:render',({detail})=>{ticket++;if(detail.page==='home')decorate();});
})();
