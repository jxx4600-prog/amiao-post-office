(() => {
 'use strict';
 const config=window.miaoAuthConfig,$=s=>document.querySelector(s);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let client=null,user=null,problem='',initialized=false,switching=false,onboardingShown=false,offlineId='';
 let recovery=new URL(location.href).searchParams.get('auth')==='recovery';
 try{recovery=recovery||sessionStorage.getItem('miao-password-recovery')==='1';}catch{}
 const cooldownKey='miao-auth-mail-sent-v1';
 const suffix=id=>id&&/^[a-f0-9-]{36}$/i.test(id)?':user:'+id:'';
 function deadline(work,ms=4000){let timer;return Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('auth_startup_timeout')),ms);})]).finally(()=>clearTimeout(timer));}
 function cachedId(){try{const saved=JSON.parse(localStorage.getItem('amiao-auth-v1'));return suffix(saved?.user?.id)?saved.user.id:'';}catch{return '';}}
 function cleanCallback(){
  const url=new URL(location.href);
  for(const key of ['code','error','error_code','error_description','auth'])url.searchParams.delete(key);
  if(/(?:access_token|refresh_token|error_description)=/.test(url.hash))url.hash='';
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 }
 function status(text){const el=$('#auth-status');if(el)el.textContent=text;}
 function friendly(error){
  const code=error?.code||'';
  if(/rate_limit|over_email_send_rate_limit/.test(code)||error?.status===429)return '邮件发送过于频繁，请稍后再试。';
  if(code==='email_address_not_authorized')return '邮件服务暂未向此邮箱开放，请联系站点管理员。';
  if(code==='invalid_credentials')return '邮箱或密码不正确。若此前使用邮件链接登录，请先通过“设置或找回密码”设置密码。';
  if(code==='email_not_confirmed')return '请先完成首次注册的邮箱验证，之后即可使用密码登录。';
  if(code==='weak_password')return '密码不符合账号要求，请使用更长、更难猜的密码。';
  if(code==='same_password')return '请设置一个与当前密码不同的新密码。';
  if(/expired|otp_expired|flow_state_not_found|bad_code_verifier/.test(code))return '登录链接已失效，或不是在发起登录的浏览器中打开，请重新获取。';
  return '登录服务暂时无法连接，请稍后重试。';
 }
 function accountRow(){
  if(!window.miao||window.miao.page!=='mine')return;
  const details=window.miaoPeople.profile(window.miao.state,user);
  $('.account-row')?.remove();
  $('.page .content')?.insertAdjacentHTML('afterbegin',`<div class="account-row"><div><strong>${escape(details.nickname)||(user?'我的账号':offlineId?'账号待连接':'访客')}</strong><small>${user?escape(user.email):offlineId?'正在使用此账号的本机记录':'记录保存在当前浏览器'}</small></div><button data-auth="open">${user||offlineId?'账号':'登录'}</button></div>`);
  if(user&&!recovery&&(!details.nickname||!details.birthday)&&!onboardingShown&&!$('#modal[open]')){onboardingShown=true;openProfile();}
 }
 function openProfile(){
  const details=window.miaoPeople.profile(window.miao.state,user),today=window.miaoClock.read(new Date(),'Asia/Shanghai').date;
  window.miao.open(`<h2>${details.nickname?'我的资料':'让猫猫认识你'}</h2><form id="auth-profile-form"><label>昵称<input name="nickname" autocomplete="nickname" maxlength="40" value="${escape(details.nickname)}" required></label><label>生日<input name="birthday" type="date" max="${today}" value="${escape(details.birthday)}" required></label><button class="primary" type="submit">保存资料</button></form><p class="auth-note">${user?'资料会保存到你的 Supabase 账号，用于猫猫称呼和生日来信。':'资料仅保存在当前浏览器，用于猫猫称呼和生日来信。'}</p><p id="auth-status" role="status" aria-live="polite"></p>`);
 }
 function openPassword(){
  if(!user){openAccount('reset');return;}
  window.miao.open(`<h2>设置账号密码</h2><form id="auth-password-form"><label>新密码<input type="password" name="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label>确认新密码<input type="password" name="confirm" autocomplete="new-password" minlength="8" maxlength="128" required></label><button class="primary" type="submit">保存密码</button></form><p class="auth-note">至少8位。设置后，可使用当前邮箱和密码登录。</p><p id="auth-status" role="status" aria-live="polite"></p>`);
 }
 function openAccount(mode='login',credentials=false){
  window.miao.snapshot();
  if(offlineId&&!credentials){window.miao.open(`<h2>账号暂未连接</h2><p class="auth-note">目前显示此账号在当前浏览器保留的记录。新修改会先保存在本机，连接恢复后会检查版本再同步。</p><strong data-cloud-status>${escape(window.miaoCloud?.status||'账号连接待重试')}</strong><div class="auth-actions"><button data-auth="retry">重新连接</button><button data-auth="export">备份当前记录</button><button data-auth="login">重新登录</button></div>`);return;}
  if(user){
   window.miao.open(`<h2>我的账号</h2><div class="account-profile"><img src="assets/白白.png" alt=""><strong>${escape(user.email)}</strong></div><p class="auth-note">账号记录通过 Supabase 保存；请以同步状态为准。离线或保存失败时，修改暂存当前浏览器。<br><strong data-cloud-status>${escape(window.miaoCloud?.status||'正在检查账号记录')}</strong><button data-cloud="inspect">检查账号记录 / 重试保存</button><button data-cloud="import-guest">导入此浏览器访客记录</button></p><div class="auth-actions"><button data-auth="profile">昵称与生日</button><button data-auth="password">设置或修改密码</button><button data-auth="export">备份当前记录</button><button data-auth="logout">退出登录</button></div><p id="auth-status" role="status" aria-live="polite"></p>`);
   return;
  }
  const registering=mode==='signup',resetting=mode==='reset';
  window.miao.open(`<h2>${resetting?'设置或找回密码':registering?'注册阿喵账号':'登录阿喵事务局'}</h2><form id="auth-credentials-form" data-mode="${mode}"><label>邮箱<input type="email" name="email" autocomplete="username" placeholder="name@example.com" required maxlength="254"></label>${resetting?'':`<label>密码<input type="password" name="password" autocomplete="${registering?'new-password':'current-password'}" ${registering?'minlength="8"':''} maxlength="128" required></label>${registering?'<label>确认密码<input type="password" name="confirm" autocomplete="new-password" minlength="8" maxlength="128" required></label>':''}`}<button class="primary" type="submit" ${client?'':'disabled'}>${resetting?'发送设置密码邮件':registering?'注册账号':'登录'}</button></form><div class="auth-actions"><button data-auth="login">密码登录</button><button data-auth="signup">注册账号</button><button data-auth="reset">设置或找回密码</button></div><p class="auth-note">${resetting?'此前用邮件链接登录的账号，也可通过此处设置密码。请在发起操作的浏览器中打开邮件。':registering?'首次注册可能需要验证邮箱，完成后使用邮箱和密码登录。':'登录后会保留登录状态，无需每次打开邮件。'}</p><p class="auth-note">访客记录保留在当前浏览器，登录后可在账号面板中手动导入。</p><p id="auth-status" role="status" aria-live="polite">${escape(problem)}</p>`);
 }
 function reloadAccount(){
  if(switching)return;switching=true;
  window.miao?.snapshot();window.miao?.save();
  location.reload();
 }
 async function initialize(){
  const localId=cachedId();
  try{
   if(!window.supabase?.createClient)throw new Error('sdk_unavailable');
   client=window.supabase.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storageKey:'amiao-auth-v1'},global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal||AbortSignal.timeout(15000)})}});
   const callback=new URLSearchParams(location.search).has('code');
   user=await deadline((async()=>{const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError)throw sessionError;if(!sessionData.session)return null;const {data,error}=await client.auth.getUser();if(error)throw error;return data.user;})());
   if(callback&&!user)problem='登录链接未能验证，请重新获取并在原浏览器打开。';
   if(new URLSearchParams(location.search).has('error'))problem='登录链接无效或已过期，请重新获取。';
   cleanCallback();
   client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){recovery=true;try{sessionStorage.setItem('miao-password-recovery','1');}catch{}if(initialized)setTimeout(()=>{if(user&&window.miao)openPassword();},0);}
    if(!initialized||event==='INITIAL_SESSION')return;
    // Run outside the SDK's auth lock before requesting a verified identity.
    setTimeout(async()=>{
     if(event==='SIGNED_OUT'){if(user)reloadAccount();return;}
     if(!session)return;
     try{const {data,error}=await client.auth.getUser();if(!error&&data.user?.id!==user?.id)reloadAccount();}catch{}
    },0);
   });
  }catch(error){offlineId=localId;problem=offlineId?'账号连接暂时较慢，已打开此账号的本机记录。可在“我的”中重新连接。':friendly(error);cleanCallback();}
  initialized=true;
 }
 document.addEventListener('submit',async e=>{
  if(e.target.id==='auth-credentials-form'||e.target.id==='auth-password-form'){
   e.preventDefault();e.stopImmediatePropagation();
   const form=e.target,button=form.querySelector('button'),fields=new FormData(form),mode=form.dataset.mode||'password',email=String(fields.get('email')||'').trim(),password=String(fields.get('password')||'');
   if(!client||!form.reportValidity())return;
   if((mode==='signup'||mode==='password')&&password!==fields.get('confirm')){status('两次输入的密码不一致。');return;}
   if((mode==='signup'||mode==='password')&&password.length<8){status('密码至少需要8位。');return;}
   if(mode==='reset'||mode==='signup'){
    if(location.origin!==new URL(config.redirectUrl).origin){status('注册或找回密码请在正式网站操作，以便邮件返回同一站点。');return;}
    let last=0;try{last=Number(localStorage.getItem(cooldownKey));}catch{}
    if(Date.now()-last<60000){status('请等待一分钟后再申请邮件。');return;}
   }
   button.disabled=true;status('正在处理…');
   try{
    if(mode==='login'){
     const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;reloadAccount();
    }else if(mode==='signup'){
     const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:config.redirectUrl}});if(error)throw error;
     if(data.session)reloadAccount();else{try{localStorage.setItem(cooldownKey,String(Date.now()));}catch{}status('若邮箱可用，注册验证邮件已发送。完成首次验证后即可密码登录。');}
    }else if(mode==='reset'){
     const redirect=new URL(config.redirectUrl);redirect.searchParams.set('auth','recovery');
     const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect.href});if(error)throw error;
     try{localStorage.setItem(cooldownKey,String(Date.now()));}catch{}status('若账号可用，设置密码邮件已发送，请检查收件箱。');
    }else{
     if(!user){status('请先登录或完成设置密码邮件的验证。');return;}
     const {error}=await client.auth.updateUser({password});if(error)throw error;
     recovery=false;try{sessionStorage.removeItem('miao-password-recovery');}catch{}form.reset();status('密码已设置，下次可直接使用邮箱和密码登录。');
    }
   }catch(error){status(friendly(error));}
   finally{if(button.isConnected)button.disabled=false;}
   return;
  }
  if(e.target.id==='auth-profile-form'){
   e.preventDefault();e.stopImmediatePropagation();const form=e.target,button=form.querySelector('button'),data=new FormData(form),nickname=window.miaoPeople.nickname(data.get('nickname')),birthday=window.miaoPeople.birthday(data.get('birthday'));
   if(!nickname||!birthday){status('请填写昵称和有效生日，生日不能晚于今天。');return;}
   button.disabled=true;status('正在保存…');
   try{
    if(user){const {data:result,error}=await client.auth.updateUser({data:{nickname,birthday}});if(error)throw error;user=result.user;}
    window.miao.state.profile={nickname,birthday};window.miao.state.birthday=birthday;window.miao.save();$('#modal').close();window.miao.render();window.miaoPostbox?.check();window.miao.toast('资料已保存');
   }catch(error){status('资料未能保存，请检查网络后重试。');button.disabled=false;}
   return;
  }
  if(e.target.id!=='auth-email-form')return;
  e.preventDefault();e.stopImmediatePropagation();
  const form=e.target,button=form.querySelector('button'),email=new FormData(form).get('email')?.trim();
  if(!client||!form.reportValidity())return;
  if(location.origin!==new URL(config.redirectUrl).origin){status('请从线上阿喵事务局打开登录，避免邮件回跳到不同站点。');return;}
  let last=0;try{last=Number(localStorage.getItem(cooldownKey));}catch{}
  if(Date.now()-last<60000){status('请等待一分钟后再获取登录链接。');return;}
  button.disabled=true;status('正在发送登录链接…');
  try{
   const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:config.redirectUrl,shouldCreateUser:true}});
   if(error)throw error;
   try{localStorage.setItem(cooldownKey,String(Date.now()));}catch{}
   status('若邮箱可用，登录邮件已发送，请检查收件箱或垃圾邮件。');
  }catch(error){status(friendly(error));}
  finally{if(button.isConnected)button.disabled=false;}
 },true);
 document.addEventListener('click',async e=>{
  const button=e.target.closest('[data-auth]');if(!button||!window.miao)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(button.dataset.auth==='open'){openAccount();return;}
  if(button.dataset.auth==='retry'){reloadAccount();return;}
  if(['login','signup','reset'].includes(button.dataset.auth)){openAccount(button.dataset.auth,true);return;}
  if(button.dataset.auth==='password'){openPassword();return;}
  if(button.dataset.auth==='profile'){openProfile();return;}
  if(button.dataset.auth==='export'){
   window.miao.snapshot();const blob=new Blob([JSON.stringify({format:'amiao-backup-v1',savedAt:new Date().toISOString(),data:window.miao.state})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='amiao-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
  if(button.dataset.auth==='logout'){
   button.disabled=true;window.miao.snapshot();
   try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;reloadAccount();}
   catch(error){status(friendly(error));button.disabled=false;}
  }
 },true);
 window.addEventListener('miao:render',({detail})=>{if(detail.page==='mine')queueMicrotask(accountRow);});
 window.miaoAuth={ready:null,get user(){return user},get offlineUserId(){return offlineId},get storageSuffix(){return suffix(user?.id||offlineId)},suffix,friendly,openProfile,openAccount,get client(){return client}};
 window.miaoAuth.ready=initialize().then(()=>{if(problem)setTimeout(()=>window.miao?.toast(problem),1000);if(recovery&&user)setTimeout(()=>{if(window.miao)openPassword();},500);});
})();
