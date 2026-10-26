import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const sharp=createRequire(import.meta.url)('../miao-cloud/node_modules/sharp');
const assets=path.join(import.meta.dirname,'docs/assets'),out=path.join(assets,'editor-parts');await fs.mkdir(out,{recursive:true});
async function cell(file,rect,name,width=384){const input=path.join(assets,file),m=await sharp(input).metadata();const [x,y,w,h]=rect(m).map(Math.round);await sharp(input).extract({left:x,top:y,width:w,height:h}).resize({width,withoutEnlargement:true}).webp({quality:88,alphaQuality:100}).toFile(path.join(out,name+'.webp'));}
for(const [i,name] of ['kraft','rice','aged','smooth'].entries())await cell('paper-materials-v11.webp',m=>{const half=Math.floor(m.width/2);return[i%2*half,Math.floor(i/2)*half,half,half];},'material-'+name,512);
for(let i=0;i<8;i++)await cell('literary-papers-v13.webp',m=>[i%4*m.width/4,Math.floor(i/4)*m.height/2,m.width/4,m.height/2],'paper-'+i);
for(let i=0;i<4;i++)await cell('literary-postcards-v13.webp',m=>[i%2*m.width/2,Math.floor(i/2)*m.height/2,m.width/2,m.height/2],'postcard-'+i,512);
// Isolate the main sticker component at build time, keeping the original pixels.
const rectangles=[[20,150,520,220],[540,30,480,400],[1008,150,510,230],[30,450,495,495],[525,495,530,460],[1060,400,455,545]];
for(const [i,rect] of rectangles.entries()){
 const [x,y,w,h]=rect,{data,info}=await sharp(path.join(assets,'journal-stickers-v9.webp')).extract({left:x,top:y,width:w,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true}),seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=[];
 for(let p=0;p<seen.length;p++){if(seen[p]||data[p*4+3]<60)continue;let head=0,tail=1;seen[p]=1;queue[0]=p;while(head<tail){const k=queue[head++],col=k%w,row=Math.floor(k/w);for(const n of [col?k-1:-1,col<w-1?k+1:-1,row?k-w:-1,row<h-1?k+w:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=60){seen[n]=1;queue[tail++]=n;}}if(tail>best.length)best=queue.slice(0,tail);}
 const keep=new Uint8Array(w*h);for(const p of best)keep[p]=1;for(let p=0;p<keep.length;p++)if(!keep[p])data[p*4+3]=0;
 await sharp(data,{raw:info}).trim().resize({width:384,height:384,fit:'inside',withoutEnlargement:true}).extend({top:4,bottom:4,left:4,right:4,background:'#00000000'}).webp({quality:92,alphaQuality:100}).toFile(path.join(out,'sticker-'+i+'.webp'));
}
const files=await fs.readdir(out);let bytes=0;for(const file of files)bytes+=(await fs.stat(path.join(out,file))).size;console.log(JSON.stringify({files:files.length,bytes}));
