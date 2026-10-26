(() => {
 function message(text){const state=document.querySelector('.startup-state');if(!state)return;const detail=state.querySelector('[data-startup-detail]');if(detail)detail.textContent=text;const retry=state.querySelector('[data-startup-retry]');if(retry)retry.hidden=false;}
 const timer=setTimeout(()=>message('连接有点慢，正在尝试读取本机记录。也可以重新打开邮局。'),8000);
 window.addEventListener('miao:render',()=>clearTimeout(timer),{once:true});
 window.addEventListener('error',()=>message('页面暂时未能打开，请点击下方重新加载。本机记录会保留。'));
 window.addEventListener('unhandledrejection',()=>message('页面连接遇到问题，请重新加载。本机记录会保留。'));
})();
