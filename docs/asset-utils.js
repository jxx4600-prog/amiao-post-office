(() => {
 function isolate(context,keep=1,threshold=24,trim=false){
  const {width:w,height:h}=context.canvas,d=context.getImageData(0,0,w,h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),groups=[];
  for(let p=0;p<seen.length;p++){if(seen[p]||d.data[p*4+3]<threshold)continue;let head=0,tail=1,x0=w,y0=h,x1=0,y1=0;seen[p]=1;queue[0]=p;
   while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!seen[n]&&d.data[n*4+3]>=threshold){seen[n]=1;queue[tail++]=n;}}
   groups.push({points:queue.slice(0,tail),size:tail,x0,y0,x1,y1});
  }
  const selected=groups.sort((a,b)=>b.size-a.size).slice(0,keep),mask=new Uint8Array(w*h);for(const g of selected)for(const k of g.points)mask[k]=1;
  for(let k=0;k<mask.length;k++)if(!mask[k])d.data[k*4+3]=0;context.putImageData(d,0,0);
  if(!trim||!selected.length)return context.canvas;
  const x=Math.min(...selected.map(g=>g.x0)),y=Math.min(...selected.map(g=>g.y0)),right=Math.max(...selected.map(g=>g.x1)),bottom=Math.max(...selected.map(g=>g.y1)),out=document.createElement('canvas');out.width=right-x+9;out.height=bottom-y+9;out.getContext('2d').drawImage(context.canvas,x,y,right-x+1,bottom-y+1,4,4,right-x+1,bottom-y+1);return out;
 }
 function sticker(image,rect){const [x,y,w,h]=rect,c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);const ctx=c.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,c.width,c.height);return isolate(ctx,1,60,true).toDataURL('image/webp',.96);}
 function visiblePosition(width=28,ratio=1){const paper=document.querySelector('.paper'),scroll=document.querySelector('.paper-scroll');if(!paper)return{x:50-width/2,y:35};const r=paper.getBoundingClientRect(),v=(scroll||paper).getBoundingClientRect(),top=Math.max(r.top,v.top),bottom=Math.min(r.bottom,v.bottom),size=r.width*width/100*ratio;return{x:Math.max(0,(100-width)/2),y:Math.max(0,Math.min(100-size/r.height*100,((top+bottom)/2-r.top-size/2)/r.height*100))};}
 window.miaoAssetUtils={isolate,sticker,visiblePosition};
})();
