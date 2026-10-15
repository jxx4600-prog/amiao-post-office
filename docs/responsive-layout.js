(() => {
 let observer=null;
 window.addEventListener('miao:render',({detail})=>{
  observer?.disconnect();if(detail.page!=='home')return;
  const home=document.querySelector('.home'),info=document.querySelector('.home-info');if(!home||!info)return;
  const fit=()=>{if(!home.isConnected)return;const height=Math.max(540,Math.ceil((info.getBoundingClientRect().height+6)/.27));if(home.style.minHeight!==height+'px')home.style.minHeight=height+'px';};
  observer=new ResizeObserver(fit);observer.observe(info);fit();
 });
})();
