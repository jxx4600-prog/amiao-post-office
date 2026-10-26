(() => {
 'use strict';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),tabs=['home','clock','record','todo','mine'];
 let pageAnimation=null,dialogAnimation=null,navAnimation=null;
 document.documentElement.classList.add('ui-motion-ready');
 function stop(){pageAnimation?.cancel();dialogAnimation?.cancel();navAnimation?.cancel();}
 const changed=()=>{if(reduced.matches)stop();};
 if(reduced.addEventListener)reduced.addEventListener('change',changed);else reduced.addListener?.(changed);
 window.addEventListener('miao:navigate',({detail:{from,to}})=>{
  stop();if(reduced.matches||!from||from===to)return;
  const stage=document.querySelector('#view>section');if(!stage?.animate)return;
  const direction=to==='box'||to==='delivery'?1:from==='box'||from==='delivery'?-1:Math.sign(tabs.indexOf(to)-tabs.indexOf(from))||1;
  pageAnimation=stage.animate([
   {opacity:.45,transform:`translateX(${direction*30}px)`},
   {opacity:1,transform:'translateX(0)'}
  ],{duration:240,easing:'cubic-bezier(.2,.75,.25,1)'});
  const art=document.querySelector(`#navigation button[data-page="${to}"] .nav-art`);
  if(art)navAnimation=art.animate([{transform:'translateY(2px)'},{transform:'translateY(-3px)',offset:.55},{transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
 });
 window.addEventListener('miao:dialog',()=>{
  dialogAnimation?.cancel();const modal=document.querySelector('#modal');
  if(reduced.matches||modal.hasAttribute('data-letter-view'))return;
  const content=modal.querySelector('#modal-content');
  if(content?.animate)dialogAnimation=content.animate([{opacity:.35,transform:'translateY(-10px)'},{opacity:1,transform:'translateY(0)'}],{duration:210,easing:'cubic-bezier(.2,.75,.25,1)'});
 });
})();
