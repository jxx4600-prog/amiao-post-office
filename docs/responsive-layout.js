(() => {
 // Mobile webviews can keep 100vh/dvh at the layout viewport after their
 // toolbar or keyboard changes. Size the app to the visible viewport instead.
 const viewport=window.visualViewport;
 function fitViewport(){
  if(viewport&&Math.abs(viewport.scale-1)>.05)return;
  document.documentElement.style.setProperty('--app-height',Math.round(viewport?.height||window.innerHeight)+'px');
 }
 window.addEventListener('resize',fitViewport);
 window.addEventListener('pageshow',fitViewport);
 viewport?.addEventListener('resize',fitViewport);
 fitViewport();
 let observer=null;
 window.addEventListener('miao:render',({detail})=>{
  observer?.disconnect();if(detail.page!=='home')return;
  const home=document.querySelector('.home'),info=document.querySelector('.home-info');if(!home||!info)return;
  const fit=()=>{if(!home.isConnected)return;const height=Math.max(540,Math.ceil((info.getBoundingClientRect().height+6)/.27));if(home.style.minHeight!==height+'px')home.style.minHeight=height+'px';};
  observer=new ResizeObserver(fit);observer.observe(info);fit();
 });
})();
