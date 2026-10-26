(() => {
 const right=l=>l.format==='postcard'?61:100;
 function box(l,b={x:7,y:20,w:54,h:68}){if(l.format!=='postcard')return b;const x=Math.max(2,Math.min(55,Number(b.x)||7)),y=Math.max(2,Math.min(88,Number(b.y)||20));return{...b,x,y,w:Math.max(4,Math.min(61-x,Number(b.w)||54)),h:Math.max(4,Math.min(94-y,Number(b.h)||12))};}
 function constrain(l){if(l.format!=='postcard')return;l.textBox=box(l,l.textBox);l.titleBox=box(l,l.titleBox||{x:7,y:4,w:54,h:12});for(const block of l.textBlocks||[])block.box=box(l,block.box);}
 window.miaoPostcard={right,box,constrain};
 function fitCanvas(){const l=window.miao?.state.draft,paper=document.querySelector('.paper'),canvas=paper?.querySelector('canvas');if(l?.format!=='postcard'||!canvas)return;const ratio=devicePixelRatio||1,width=Math.round(paper.clientWidth*ratio),height=Math.round(paper.clientHeight*ratio);if(canvas.width!==width||canvas.height!==height){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.getContext('2d').drawImage(canvas,0,0);canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(copy,0,0,width,height);}l.paperWidth=paper.getBoundingClientRect().width;l.paperRatio=1.5;}
 window.addEventListener('miao:render',({detail})=>{if(detail.page==='record')requestAnimationFrame(fitCanvas);});
 window.addEventListener('resize',()=>requestAnimationFrame(fitCanvas));
 document.addEventListener('input',e=>{if(e.target.name==='layer-format')requestAnimationFrame(fitCanvas);});
})();
