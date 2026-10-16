(() => {
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=scope=>['letters','inbox','futureLetters'].includes(scope);
 let pending=null;
 function trash(){const state=window.miao.state;state.letterTrash??=[];return state.letterTrash;}
 function openTrash(){window.miao.open(`<h2>废纸篓</h2><div class="mail-trash-list">${trash().slice().reverse().map(item=>`<div class="trash-letter"><div><strong>${esc(item.letter.title||item.letter.courier||'我的信件')}</strong><small>${esc(item.letter.date)}</small><p>${esc(String(item.letter.text||'图文信件').slice(0,45))}</p></div><button data-mail-restore="${esc(item.id)}">恢复</button></div>`).join('')||'<p class="empty">这里没有已删除的信件。</p>'}</div>`);}
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-mail-delete],[data-mail-confirm],[data-mail-cancel],[data-mail-trash],[data-mail-restore]');if(!button||!window.miao)return;
  e.preventDefault();e.stopImmediatePropagation();const m=window.miao;
  if(button.hasAttribute('data-mail-trash')){openTrash();return;}
  if(button.dataset.mailDelete){const [scope,id]=button.dataset.mailDelete.split(':');if(!valid(scope)||!m.state[scope]?.some(l=>l.id===id))return;pending={scope,id,html:$('#modal').open?$('#modal-content').innerHTML:null,scroll:$('#modal').scrollTop};m.open('<h2>将这封信移入废纸篓？</h2><p>之后可以在“我的”废纸篓中恢复。</p><div class="letter-actions"><button data-mail-confirm>移入废纸篓</button><button data-mail-cancel>保留信件</button></div>');return;}
  if(button.hasAttribute('data-mail-cancel')){const previous=pending;pending=null;if(previous?.html){m.open(previous.html);const l=m.state[previous.scope]?.find(l=>l.id===previous.id);if(l&&$('.letter-scene'))window.miaoLetters?.decoratePreview(l);$('#modal').scrollTop=previous.scroll;}else $('#modal').close();return;}
  if(button.hasAttribute('data-mail-confirm')&&pending){const {scope,id}=pending,list=m.state[scope],index=list?.findIndex(l=>l.id===id);if(index>=0){trash().push({id:crypto.randomUUID(),scope,letter:list.splice(index,1)[0],deletedAt:new Date().toISOString()});m.save();}pending=null;$('#modal').close();m.render();if(scope==='inbox')window.miaoPostbox.openInbox();m.toast('信件已移入废纸篓');return;}
  if(button.dataset.mailRestore){const index=trash().findIndex(item=>item.id===button.dataset.mailRestore);if(index<0)return;const item=trash()[index];if(!valid(item.scope))return;m.state[item.scope]??=[];if(!m.state[item.scope].some(l=>l.id===item.letter.id))m.state[item.scope].push(item.letter);trash().splice(index,1);m.save();m.render();openTrash();m.toast('信件已恢复');}
 },true);
 function listActions(){document.querySelectorAll('#view button[data-letter]').forEach(button=>{if(button.parentElement.classList.contains('mail-list-row'))return;const row=document.createElement('div');row.className='mail-list-row';button.replaceWith(row);row.append(button);button.style.marginBottom='0';row.insertAdjacentHTML('beforeend',`<button class="mail-list-delete" data-mail-delete="letters:${esc(button.dataset.letter)}" title="删除信件" aria-label="删除这封信">${window.miaoMotion.icon('trash-2')}<span>删除</span></button>`);});}
 window.addEventListener('miao:render',({detail})=>{listActions();if(detail.page==='mine')queueMicrotask(()=>{$('.mail-trash-entry')?.remove();$('.page .content')?.insertAdjacentHTML('beforeend',`<button class="mail-trash-entry" data-mail-trash>${window.miaoMotion.icon('trash-2')}废纸篓${trash().length?' · '+trash().length:''}</button>`);});});
})();
