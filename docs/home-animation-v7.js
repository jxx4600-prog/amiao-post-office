(() => {
 const names=['白白','莉莉','阿夜','大王'];
 const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
 let ticket=0,captionObserver=null;
 function alignCaptions(home){
  const origin=home.getBoundingClientRect();
  for(const [caption,art,fraction,height] of [['.time-caption','.home-clock-illustration',.85,14],['.daily-caption','.home-window',.947,22]]){
   const text=home.querySelector(caption),ref=home.querySelector(art);if(!text||!ref)continue;
   const r=ref.getBoundingClientRect();Object.assign(text.style,{top:(r.top-origin.top+r.height*fraction+3)+'px',height:height+'px',minHeight:'0',lineHeight:height+'px',left:r.left-origin.left+'px',width:r.width+'px'});
  }
 }
 // Visible alpha bottoms measured from the prepared 384px images. Move the
 // transparent padding above the drawing so every pose rests on one baseline.
 const frameBottoms=[[359,360,360,360,359,359,359,360],[360,360,360,360,359,359,360,359],[359,359,358,359,359,359,359,359],[360,359,359,360,360,360,360,360]],stillBottoms=[365,365,343,342];

 function removeSmallFragments(context,w,h){const d=context.getImageData(0,0,w,h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h);for(let p=0;p<seen.length;p++){if(seen[p]||d.data[p*4+3]<24)continue;let head=0,tail=1;seen[p]=1;queue[0]=p;while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!seen[n]&&d.data[n*4+3]>=24){seen[n]=1;queue[tail++]=n;}}if(tail<80)for(let i=0;i<tail;i++)d.data[queue[i]*4+3]=0;}context.putImageData(d,0,0);}
 function cleanEdges(ctx){const d=ctx.getImageData(0,0,512,512);for(let i=3;i<d.data.length;i+=4)if(d.data[i]<24)d.data[i]=0;const seen=new Uint8Array(512*512),queue=new Int32Array(512*512);for(let p=0;p<seen.length;p++){if(seen[p]||d.data[p*4+3]<24)continue;let head=0,tail=1,minY=511,maxY=0;queue[0]=p;seen[p]=1;while(head<tail){const k=queue[head++],y=Math.floor(k/512),x=k%512;minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [x>0?k-1:-1,x<511?k+1:-1,y>0?k-512:-1,y<511?k+512:-1])if(n>=0&&!seen[n]&&d.data[n*4+3]>=24){seen[n]=1;queue[tail++]=n;}}if((minY<80&&maxY-minY<60)||(minY>420&&maxY-minY<55))for(let i=0;i<tail;i++)d.data[queue[i]*4+3]=0;}ctx.putImageData(d,0,0);}
 function cell(image,x,y,w,h,align=false){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),scale=448/Math.max(w,h);ctx.drawImage(image,x,y,w,h,(512-w*scale)/2,(512-h*scale)/2,w*scale,h*scale);if(align){cleanEdges(ctx);const d=ctx.getImageData(0,0,512,512);let bottom=480;for(let row=511;row>=0;row--){let count=0;for(let col=0;col<512;col++)if(d.data[(row*512+col)*4+3]>100)count++;if(count>8){bottom=row;break;}}const copy=document.createElement('canvas');copy.width=copy.height=512;copy.getContext('2d').drawImage(c,0,480-bottom);return copy;}return c;}
 async function decorate(){
  captionObserver?.disconnect();const current=++ticket,home=document.querySelector('.home');if(!home)return;
  const puppet=home.querySelector('.courier-puppet'),name=puppet.getAttribute('aria-label').replace('动态陪伴',''),row=names.indexOf(name);
  home.insertAdjacentHTML('beforeend',`<span class="todo-caption">Cat's to do</span>`);
  alignCaptions(home);captionObserver=new ResizeObserver(()=>alignCaptions(home));captionObserver.observe(home);
  await window.miaoAssets.ready;if(current!==ticket||!home.isConnected)return;
  puppet.innerHTML=`<img class="courier-still" style="top:${(384-stillBottoms[row])/384*100}%" src="${window.miaoAssets.body(name)}" alt="">`;

  const deco=index=>`assets/home-parts/postal-${index}.webp`;
  const weather=home.querySelector('.home-weather');
  const choice=weather.dataset.weather||'sun';
  const sun='assets/home-parts/sun.webp',cloud='assets/home-parts/cloud.webp',catRain='assets/home-parts/cat-rain.webp';weather.dataset.weather=choice;
  if(choice==='sun')weather.innerHTML=`<img class="sky-sun" src="${sun}" alt="晴天太阳"><img class="sky-cloud sunny" src="${cloud}" alt="猫云">`;
  else if(choice==='rainbow')weather.innerHTML=`<img class="sky-arch" src="assets/home-parts/arch.webp" alt="彩虹"><img class="sky-cloud rainbow-left" src="${cloud}" alt="猫云"><img class="sky-cloud rainbow-right" src="${cloud}" alt="">`;
  else weather.innerHTML=`<img class="sky-cloud rainy" src="${cloud}" alt="雨天猫云"><img class="rain-cat-word" src="${catRain}" alt="CAT"><span class="rain-field" aria-hidden="true">${Array.from({length:9},(_,i)=>`<i style="left:${8+i*10}%;animation-delay:${-i*.21}s"></i>`).join('')}</span>`;
  home.insertAdjacentHTML('beforeend',`<div class="postal-doodles" aria-hidden="true"><img src="${deco(row===2?2:1)}"><span>邮局营业中</span><i></i></div>`);
  const notes=['小事也有自己的邮戳。','今天的云，暂时不赶路。','把一小段时间，留给窗外。','没有新鲜事，也可以寄一封信。','路过的风，已经替你签收。','此刻没答案，先夹进书里。','日子慢一点，细节就多一点。','一朵花的进度，也算进度。'];
  home.querySelector('.home-window').insertAdjacentHTML('beforeend',`<span class="window-note">${notes[Math.floor(Math.random()*notes.length)]}</span>`);
  const tips=['眼睛申请放风三十秒。批准！','喝口水，别把自己晾成小鱼干。','待办很多？先捞最小的一条。','灵感还没到？先放它出去溜一圈。','肩膀别加班，放松一下。','记录不用写满，留点空白给明天。','杯子空了，水分补给站开门啦。','今天先完成一件，剩下的排队。','伸个懒腰，给骨头放个短假。','手机也累了，让它坐一会儿。','走两步，没准灵感就在门口。','饭要趁热，烦恼可以晚点处理。','先吃饭，再和难题对线。','文件记得存，猫猫不负责撤回。','给自己五分钟空档，不用填满。','困了就休息，不和哈欠较劲。','窗外有免费天气，去看两眼。','桌面收一小块，就算今日胜利。','大计划切小块，像分小鱼干。','没写完的句子，明天接着写。','这封信不用满分，寄出就算数。','再忙也要给水杯续个杯。','任务有队列，你也有休息时间。','别急，猫猫还没系好邮袋。'];home.querySelector('.home-tip p').textContent=tips[Math.floor(Math.random()*tips.length)];alignCaptions(home);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  await new Promise(resolve=>{if(window.requestIdleCallback)window.requestIdleCallback(resolve,{timeout:500});else setTimeout(resolve,100);});if(current!==ticket||!home.isConnected)return;
  let frames;try{frames=await Promise.all(Array.from({length:4},(_,i)=>[load(`assets/frames/main-${row}-${i}.webp`),load(`assets/frames/between-${row}-${i}.webp`)]).flat());}catch{return;}if(current!==ticket||!home.isConnected)return;
  const canvas=document.createElement('canvas');canvas.className='courier-frames';canvas.width=canvas.height=512;canvas.setAttribute('aria-hidden','true');puppet.replaceChildren(canvas);const ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),sequence=[0,0,0,0,0,0,0,0,1,2,3,4,5,6,6,6,7],start=performance.now();let last=-1;
  function paint(now){if(current!==ticket||!canvas.isConnected)return;const frame=reduced.matches?0:sequence[Math.floor(Math.max(0,now-start)/125)%sequence.length];if(frame!==last){ctx.clearRect(0,0,512,512);ctx.drawImage(frames[frame],0,(384-frameBottoms[row][frame])*512/384,512,512);canvas.dataset.frame=frame;last=frame;}if(!reduced.matches)setTimeout(()=>requestAnimationFrame(paint),document.hidden?500:125);}
  paint(start);
 }
 window.addEventListener('miao:render',({detail})=>{ticket++;if(detail.page==='home')decorate();});
})();
