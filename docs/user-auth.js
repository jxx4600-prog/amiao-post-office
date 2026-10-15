(() => {
 'use strict';
 const config=window.miaoAuthConfig,$=s=>document.querySelector(s);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let client=null,user=null,problem='',initialized=false,switching=false,onboardingShown=false;
 const cooldownKey='miao-auth-mail-sent-v1';
 const suffix=id=>id&&/^[a-f0-9-]{36}$/i.test(id)?':user:'+id:'';
 function cleanCallback(){
  const url=new URL(location.href);
  for(const key of ['code','error','error_code','error_description'])url.searchParams.delete(key);
  if(/(?:access_token|refresh_token|error_description)=/.test(url.hash))url.hash='';
  history.replaceState(null,'',url.pathname+url.search+url.hash);
 }
 function status(text){const el=$('#auth-status');if(el)el.textContent=text;}
 function friendly(error){
  const code=error?.code||'';
  if(/rate_limit|over_email_send_rate_limit/.test(code)||error?.status===429)return '邮件发送过于频繁，请稍后再试。';
  if(code==='email_address_not_authorized')return '邮件服务暂未向此邮箱开放，请联系站点管理员。';
  if(/expired|otp_expired|flow_state_not_found|bad_code_verifier/.test(code))return '登录链接已失效，或不是在发起登录的浏览器中打开，请重新获取。';
  return '登录服务暂时无法连接，请稍后重试。';
 }
 function accountRow(){
  if(!window.miao||window.miao.page!=='mine')return;
  const details=window.miaoPeople.profile(window.miao.state,user);
  $('.account-row')?.remove();
  $('.page .content')?.insertAdjacentHTML('afterbegin',`<div class="account-row"><div><strong>${escape(details.nickname)||(user?'我的账号':'访客')}</strong><small>${user?escape(user.email):'记录保存在当前浏览器'}</small></div><button data-auth="open">${user?'账号':'登录'}</button></div>`);
  if(user&&(!details.nickname||!details.birthday)&&!onboardingShown&&!$('#modal[open]')){onboardingShown=true;openProfile();}
 }
 function openProfile(){
  const details=window.miaoPeople.profile(window.miao.state,user),today=window.miaoClock.read(new Date(),'Asia/Shanghai').date;
  window.miao.open(`<h2>${details.nickname?'我的资料':'让猫猫认识你'}</h2><form id="auth-profile-form"><label>昵称<input name="nickname" autocomplete="nickname" maxlength="40" value="${escape(details.nickname)}" required></label><label>生日<input name="birthday" type="date" max="${today}" value="${escape(details.birthday)}" required></label><button class="primary" type="submit">保存资料</button></form><p class="auth-note">${user?'资料会保存到你的 Supabase 账号，用于猫猫称呼和生日来信。':'资料仅保存在当前浏览器，用于猫猫称呼和生日来信。'}</p><p id="auth-status" role="status" aria-live="polite"></p>`);
 }
 function openAccount(){
  window.miao.snapshot();
  if(user){
   window.miao.open(`<h2>我的账号</h2><div class="account-profile"><img src="assets/白白.png" alt=""><strong>${escape(user.email)}</strong></div><p class="auth-note">当前记录保存在此浏览器，暂不跨设备同步。</p><div class="auth-actions"><button data-auth="profile">昵称与生日</button><button data-auth="export">备份当前记录</button><button data-auth="logout">退出登录</button></div><p id="auth-status" role="status" aria-live="polite"></p>`);
   return;
  }
  window.miao.open(`<h2>登录阿喵事务局</h2><form id="auth-email-form"><label>邮箱<input type="email" name="email" autocomplete="email" placeholder="name@example.com" required maxlength="254"></label><button class="primary" type="submit" ${client?'':'disabled'}>发送登录链接</button></form><p class="auth-note">邮箱将发送给 Supabase 用于身份验证。首次验证后创建账号；请在当前浏览器打开邮件中的链接。</p><p class="auth-note">访客记录保留在此浏览器，登录后单独保存，暂不跨设备同步。</p><p id="auth-status" role="status" aria-live="polite">${escape(problem)}</p>`);
 }
 function reloadAccount(){
  if(switching)return;switching=true;
  window.miao?.snapshot();window.miao?.save();
  location.reload();
 }
 async function initialize(){
  try{
   if(!window.supabase?.createClient)throw new Error('sdk_unavailable');
   client=window.supabase.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storageKey:'amiao-auth-v1'},global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal||AbortSignal.timeout(15000)})}});
   const callback=new URLSearchParams(location.search).has('code');
   const {data:sessionData,error:sessionError}=await client.auth.getSession();
   if(sessionError)throw sessionError;
   if(sessionData.session){const {data,error}=await client.auth.getUser();if(error)throw error;user=data.user;}
   if(callback&&!user)problem='登录链接未能验证，请重新获取并在原浏览器打开。';
   if(new URLSearchParams(location.search).has('error'))problem='登录链接无效或已过期，请重新获取。';
   cleanCallback();
   client.auth.onAuthStateChange((event,session)=>{
    if(!initialized||event==='INITIAL_SESSION')return;
    // Run outside the SDK's auth lock before requesting a verified identity.
    setTimeout(async()=>{
     if(event==='SIGNED_OUT'){if(user)reloadAccount();return;}
     if(!session)return;
     try{const {data,error}=await client.auth.getUser();if(!error&&data.user?.id!==user?.id)reloadAccount();}catch{}
    },0);
   });
  }catch(error){problem=friendly(error);cleanCallback();}
  initialized=true;
 }
 document.addEventListener('submit',async e=>{
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
 window.miaoAuth={ready:null,get user(){return user},get storageSuffix(){return suffix(user?.id)},suffix,friendly,openProfile};
 window.miaoAuth.ready=initialize().then(()=>{if(problem)setTimeout(()=>window.miao?.toast(problem),1000);});
})();
