(() => {
 'use strict';
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let client,user,key,metaKey,meta={revision:0,dirty:false},pending='',ack='',status='访客 · 仅保存在当前浏览器',timer,busy=false,conflict=false,remoteVersion=null,retry=0,blocked=false,reloading=false,initialSnapshot=null,cacheAvailable=true;
 const valid=s=>s&&Array.isArray(s.letters)&&Array.isArray(s.todos)&&Array.isArray(s.alarms)&&s.draft&&typeof s.draft.text==='string';
 function persistMeta(){if(!metaKey)return;try{localStorage.setItem(metaKey,JSON.stringify(meta));}catch{}}
 function setStatus(text){status=text;document.querySelectorAll('[data-cloud-status]').forEach(el=>el.textContent=status);}
 function readCache(){try{return localStorage.getItem(key)||'';}catch{return '';}}
 function deadline(work,ms=5000){let timer;return Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('cloud_startup_timeout')),ms);})]).finally(()=>clearTimeout(timer));}
 function fail(error){
  if(error?.code==='40001'||String(error?.message).includes('amiao_revision_conflict')){conflict=true;setStatus('账号有更新 · 需要处理版本冲突');return;}
  if(['PGRST205','PGRST202','42P01','42883','42501'].includes(error?.code)){blocked=true;setStatus(cacheAvailable?'账号存储尚未就绪 · 已在当前浏览器保存':'账号存储未就绪且本机缓存不足 · 请立即导出备份');return;}
  setStatus(cacheAvailable?'当前浏览器已保存 · 账号保存待重试':'账号保存失败且本机缓存不足 · 请立即导出备份');
  if(navigator.onLine){clearTimeout(timer);timer=setTimeout(flush,Math.min(60000,5000*2**Math.min(retry++,4)));}
 }
 async function fetchRemote(){const {data,error}=await client.from('amiao_user_state').select('payload,revision,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;if(data&&!valid(data.payload))throw Error('账号数据格式异常');return data;}
 function download(data,name='amiao-backup.json'){
  const blob=new Blob([JSON.stringify({format:'amiao-backup-v1',savedAt:new Date().toISOString(),data})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 async function initialize(){
  await window.miaoAuth.ready;user=window.miaoAuth.user;client=window.miaoAuth.client;
  const offlineId=window.miaoAuth.offlineUserId;
  if(!user&&!offlineId)return;
  key='miao-refined-v1'+window.miaoAuth.storageSuffix;metaKey='amiao-cloud-meta-v1:'+(user?.id||offlineId);
  try{const saved=JSON.parse(localStorage.getItem(metaKey));if(saved&&Number.isSafeInteger(saved.revision)&&saved.revision>=0)meta=saved;}catch{}
  if(!user||!client){setStatus('账号暂未连接 · 修改保存在当前浏览器');return;}
  pending=meta.dirty?readCache():'';setStatus('正在读取账号记录…');
  try{
   const remote=await deadline(fetchRemote());remoteVersion=remote;
   if(remote){
    if(meta.dirty&&pending&&Number(remote.revision)!==meta.revision){conflict=true;setStatus('账号有更新 · 需要处理版本冲突');return;}
    if(!meta.dirty){initialSnapshot=remote.payload;const json=JSON.stringify(remote.payload);try{localStorage.setItem(key,json);}catch{cacheAvailable=false;}ack=json;}
    meta.revision=Number(remote.revision);meta.updatedAt=remote.updated_at;persistMeta();
    setStatus(meta.dirty?'当前浏览器已保存 · 等待保存到账号':cacheAvailable?'已保存到账号':'账号记录已读取 · 本机缓存空间不足');
   }else{meta.revision=0;const cached=readCache();if(cached){const parsed=JSON.parse(cached);if(valid(parsed)){pending=cached;meta.dirty=true;persistMeta();}}setStatus(pending?'当前浏览器已保存 · 等待保存到账号':'账号已连接 · 尚无记录');}
  }catch(error){fail(error);}
 }
 function queue(json,options={}){
  if(reloading||(!user&&!window.miaoAuth?.offlineUserId)||new URLSearchParams(location.search).get('qa')==='1')return;
  if(json===ack&&!meta.dirty)return;
  cacheAvailable=options.cached!==false;pending=json;meta.dirty=true;persistMeta();
  if(!user){setStatus(cacheAvailable?'账号暂未连接 · 修改保存在当前浏览器':'本机缓存不足 · 请立即导出备份');return;}
  if(!conflict&&!blocked)setStatus(cacheAvailable?'当前浏览器已保存 · 等待保存到账号':'本机缓存空间不足 · 正在准备账号保存，请勿关闭');
  clearTimeout(timer);if(!conflict&&!blocked)timer=setTimeout(flush,1200);
 }
 async function flush(){timer=null;
  if(!user||!client||busy||conflict||blocked||!pending)return;
  if(!navigator.onLine){setStatus(cacheAvailable?'离线 · 当前浏览器已保存':'离线且本机缓存不足 · 请立即导出备份');return;}
  const json=pending;
  if(new Blob([json]).size>8*1024*1024){setStatus('记录超过账号单次保存上限 · 请导出备份并减少图片');return;}
  busy=true;setStatus('正在保存到账号…');
  try{
   const {data,error}=await client.rpc('save_amiao_state',{p_expected_revision:meta.revision,p_snapshot:JSON.parse(json)});if(error)throw error;
   const saved=Array.isArray(data)?data[0]:data;if(!saved||!Number.isSafeInteger(Number(saved.revision)))throw Error('保存结果未确认');
   meta.revision=Number(saved.revision);meta.updatedAt=saved.updated_at;ack=json;retry=0;
   if(pending===json){pending='';meta.dirty=false;setStatus(cacheAvailable?'已保存到账号':'已保存到账号 · 本机缓存空间不足');}else{meta.dirty=true;setStatus('当前浏览器有新修改 · 等待保存到账号');}
   persistMeta();
  }catch(error){fail(error);}finally{busy=false;}
  if(pending&&!conflict&&!blocked&&!timer)timer=setTimeout(flush,1200);
 }
 function conflictDialog(){window.miao.open(`<h2>账号记录有新版本</h2><p>另一台设备可能保存了新的内容。当前浏览器的修改仍然保留，尚未覆盖账号版本。</p><div class="auth-actions"><button data-cloud="export">备份此浏览器内容</button><button data-cloud="use-remote-confirm">读取账号版本</button><button data-cloud="keep-local-confirm">将此浏览器版本保存到账号</button></div><p id="cloud-message" role="status"></p>`);}
 function reloadWith(snapshot,revision,updatedAt){reloading=true;clearTimeout(timer);try{localStorage.setItem(key,JSON.stringify(snapshot));meta={revision:Number(revision),dirty:false,updatedAt};pending='';persistMeta();location.reload();}catch(error){reloading=false;throw error;}}
 async function inspect(){
  if(!user)return window.miaoAuth.openAccount();
  if(conflict)return conflictDialog();
  if(meta.dirty){blocked=false;await flush();if(conflict)conflictDialog();return;}
  try{const remote=await fetchRemote();if(remote&&Number(remote.revision)!==meta.revision){remoteVersion=remote;conflictDialog();}else setStatus('已保存到账号');}catch(error){fail(error);}
 }
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-cloud]');if(!b||!window.miao)return;e.preventDefault();e.stopImmediatePropagation();
  const action=b.dataset.cloud;
  if(action==='inspect'){await inspect();return;}
  if(action==='export'){window.miao.snapshot();download(window.miao.state);return;}
  if(action==='use-remote-confirm'||action==='keep-local-confirm'){
   window.miao.open(`<h2>${action==='use-remote-confirm'?'读取账号版本？':'保存此浏览器版本？'}</h2><p>${action==='use-remote-confirm'?'这会替换当前浏览器的记录，请先备份当前内容。':'这会替换账号中另一版本的全部记录。继续前会下载账号版本作为备份，请妥善保管。'}</p><div class="auth-actions"><button data-cloud="export">导出此浏览器备份</button><button data-cloud="${action==='use-remote-confirm'?'use-remote':'keep-local'}">确认继续</button></div><p id="cloud-message" role="status"></p>`);return;
  }
  if(action==='import-guest'){
   window.miao.open('<h2>导入访客记录？</h2><p>会将这个浏览器的访客内容替换到当前账号。请先导出当前账号记录，访客副本仍保留在本机。</p><div class="auth-actions"><button data-cloud="export">备份当前账号内容</button><button data-cloud="import-guest-confirm">确认导入</button></div><p id="cloud-message" role="status"></p>');return;
  }
  b.disabled=true;
  try{
   if(action==='import-guest-confirm'){
    const guest=JSON.parse(localStorage.getItem('miao-refined-v1'));if(!valid(guest))throw Error('当前浏览器没有可导入的访客记录。');
    if(busy)throw Error('当前保存尚未结束，请稍后重试。');window.miao.snapshot();clearTimeout(timer);const current=await fetchRemote();if(current)download(current.payload,'amiao-account-before-import.json');
    const {data,error}=await client.rpc('save_amiao_state',{p_expected_revision:Number(current?.revision)||0,p_snapshot:guest});if(error)throw error;const saved=Array.isArray(data)?data[0]:data;if(!saved?.revision)throw Error('账号未确认保存结果。');reloadWith(guest,saved.revision,saved.updated_at);return;
   }
   const remote=await fetchRemote();
   if(action==='use-remote'){
    if(!remote)throw Error('账号中还没有记录。');reloadWith(remote.payload,remote.revision,remote.updated_at);
   }
   if(action==='keep-local'){
    if(remote)download(remote.payload,'amiao-account-before-replace.json');window.miao.snapshot();const json=JSON.stringify(window.miao.state);
    meta.revision=Number(remote?.revision)||0;conflict=false;blocked=false;queue(json);await flush();if(meta.dirty)throw Error(status);$('#modal').close();
   }
  }catch(error){if($('#cloud-message'))$('#cloud-message').textContent=error.message||'操作失败，请重试。';}finally{if(b.isConnected)b.disabled=false;}
 },true);
 window.addEventListener('miao:render',()=>{if(pending&&!timer&&!conflict&&!blocked)timer=setTimeout(flush,1200);document.querySelectorAll('[data-cloud-status]').forEach(el=>el.textContent=status);});
 window.addEventListener('online',()=>{retry=0;blocked=false;flush();});window.addEventListener('pagehide',()=>{persistMeta();flush();});
 window.miaoCloud={ready:initialize(),queue,flush,inspect,download,get initialSnapshot(){return initialSnapshot},get reloading(){return reloading},get status(){return status},get dirty(){return meta.dirty},get conflict(){return conflict},get signedIn(){return!!user}};
})();
