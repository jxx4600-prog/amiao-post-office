(() => {
 document.addEventListener('pointerdown',e=>{
  if(e.button!==0||!e.target.closest('#app,#modal')||e.target.closest('.paper,canvas,input,textarea,select'))return;
  const paw=document.createElement('span');paw.className='tap-paw';paw.setAttribute('aria-hidden','true');paw.style.left=e.clientX+'px';paw.style.top=e.clientY+'px';paw.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor" stroke="var(--paper)" stroke-width="1.2">${window.miaoIcons['paw-print']}</svg>`;document.body.append(paw);setTimeout(()=>paw.remove(),280);
 },true);
})();
