(() => {
 'use strict';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),tabs=['home','clock','record','todo','mine'];
 let pageAnimation=null,dialogAnimation=null,navAnimation=null,accents=[];
 document.documentElement.classList.add('ui-motion-ready');
 function stop(){pageAnimation?.cancel();dialogAnimation?.cancel();navAnimation?.cancel();accents.forEach(a=>a.cancel());accents=[];}
 function stagger(elements){if(reduced.matches)return;[...elements].slice(0,6).forEach((el,i)=>{if(el.animate)accents.push(el.animate([{opacity:0,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,delay:i*28,easing:'ease-out',fill:'backwards'}));});}
 function alignMail(){
  const modal=document.querySelector('#modal');if(!modal?.open||!modal.hasAttribute('data-letter-view'))return;
  const app=document.querySelector('#app').getBoundingClientRect(),viewport=window.visualViewport,topEdge=viewport?.offsetTop||0,bottomEdge=topEdge+(viewport?.height||innerHeight),bar=document.querySelector('#view .bar')?.getBoundingClientRect(),nav=document.querySelector('#navigation');
  const top=Math.max(topEdge+16,app.top+16,bar?bar.bottom+10:0),bottom=Math.min(bottomEdge-16,nav&&!nav.hidden?nav.getBoundingClientRect().top-10:app.bottom-16),height=Math.max(120,bottom-top);
  modal.style.setProperty('--mail-top',(top+height/2)+'px');modal.style.setProperty('--mail-left',(app.left+app.width/2)+'px');modal.style.setProperty('--mail-max-height',height+'px');modal.style.setProperty('--mail-width',Math.max(240,Math.min(380,app.width-32,innerWidth-32))+'px');
 }
 window.addEventListener('resize',alignMail);window.visualViewport?.addEventListener('resize',alignMail);
 const changed=()=>{if(reduced.matches)stop();};
 if(reduced.addEventListener)reduced.addEventListener('change',changed);else reduced.addListener?.(changed);
 window.addEventListener('miao:navigate',({detail:{from,to}})=>{
  stop();if(reduced.matches||!from||from===to)return;
  const stage=document.querySelector('#view>section');if(!stage?.animate)return;
  const direction=to==='box'||to==='delivery'?1:from==='box'||from==='delivery'?-1:Math.sign(tabs.indexOf(to)-tabs.indexOf(from))||1;
  stage.dataset.motion=to==='home'?'home-reveal':to==='mine'?'mail-arrive':to==='record'?'paper-open':'page-slide';
  pageAnimation=stage.animate(to==='home'?[
   {opacity:.25,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}
  ]:[
   {opacity:.45,transform:`translateX(${direction*30}px)`},
   {opacity:1,transform:'translateX(0)'}
  ],{duration:240,easing:'cubic-bezier(.2,.75,.25,1)'});
  const art=document.querySelector(`#navigation button[data-page="${to}"] .nav-art`);
  if(art)navAnimation=art.animate([{transform:'translateY(2px)'},{transform:'translateY(-3px)',offset:.55},{transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  if(to==='mine')stagger(stage.querySelectorAll('.postbox-tools button,.box'));
  if(to==='record'){const sheet=stage.querySelector('.paper-scroll');if(sheet)accents.push(sheet.animate([{opacity:.2},{opacity:1}],{duration:220}));}
  alignMail();
 });
 window.addEventListener('miao:dialog',()=>{
  dialogAnimation?.cancel();accents.forEach(a=>a.cancel());accents=[];const modal=document.querySelector('#modal');alignMail();
  if(reduced.matches)return;
  if(modal.hasAttribute('data-letter-view')){if(modal.hasAttribute('data-inbox-view'))stagger(modal.querySelectorAll('.mail-list-row'));return;}
  const content=modal.querySelector('#modal-content');
  if(content?.animate)dialogAnimation=content.animate([{opacity:.35,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{duration:210,easing:'cubic-bezier(.2,.75,.25,1)'});
  const portrait=content.querySelector('.cat-intro>img');if(portrait?.animate)accents.push(portrait.animate([{transform:'rotate(-3deg)'},{transform:'rotate(2deg)',offset:.55},{transform:'rotate(0)'}],{duration:360,easing:'ease-out'}));
  stagger(content.querySelectorAll('.sticker-library>button,.paper-theme-picker>button,.weather-grid>button'));
 });
})();
