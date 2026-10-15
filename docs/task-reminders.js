(() => {
 const repeat=5*60*1000;let active='',player=null;
 const eligible=(task,now=Date.now())=>{if(task.done||task.reminderAcknowledged||!task.date||!task.time||Number(task.nextReminderAt||0)>now)return false;const clock=window.miaoClock.read(new Date(now),task.timeZone||'Asia/Shanghai');return clock.date>task.date||(clock.date===task.date&&clock.time>=task.time);};
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function stop(){player?.pause();player=null;}
 function check(now=Date.now()){
  if(!window.miao||document.visibilityState==='hidden'||active||document.querySelector('dialog[open]')||document.querySelector('.delivery-loading'))return;
  const task=window.miao.state.todos.find(t=>eligible(t,now));if(!task)return;active=task.id;task.nextReminderAt=now+repeat;window.miao.save();
  let dialog=document.getElementById('task-reminder');if(!dialog){dialog=document.createElement('dialog');dialog.id='task-reminder';document.body.append(dialog);dialog.addEventListener('close',()=>{const task=window.miao.state.todos.find(t=>t.id===active);if(task&&!task.done&&!task.reminderAcknowledged){task.nextReminderAt=Date.now()+repeat;window.miao.save();}active='';stop();});}
  dialog.innerHTML=`<button data-reminder="later" class="reminder-close" aria-label="关闭提醒" title="五分钟后再提醒">${window.miaoMotion.icon('plus')}</button><h2>${window.miaoMotion.icon('alarm-clock')}提醒事项到时间了</h2><p>${escape(task.text)}</p><small>${escape(task.date)} ${escape(task.time)}</small>${task.note?`<p class="reminder-note">${escape(task.note)}</p>`:''}<div class="letter-actions"><button data-reminder="ack">我知道了</button><button data-reminder="later">五分钟后提醒</button><button data-reminder="done">完成事项</button></div>`;dialog.showModal();
  if(task.sound){player=new Audio('assets/ring-meow-real-v3.wav');player.loop=true;player.volume=.65;player.play().catch(()=>{dialog.insertAdjacentHTML('beforeend','<small>浏览器未允许播放声音</small>');});}
 }
 document.addEventListener('click',e=>{const button=e.target.closest('[data-reminder]');if(!button)return;const task=window.miao.state.todos.find(t=>t.id===active);if(task){if(button.dataset.reminder==='ack')task.reminderAcknowledged=true;if(button.dataset.reminder==='done'){task.done=true;task.reminderAcknowledged=true;}window.miao.save();}document.getElementById('task-reminder').close();if(button.dataset.reminder==='done'&&window.miao.page==='todo')window.miao.render();});
 document.addEventListener('visibilitychange',()=>check());setInterval(check,1000);window.miaoTaskReminders={eligible,repeat};
})();
