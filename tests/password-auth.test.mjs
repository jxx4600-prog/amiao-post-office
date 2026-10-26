import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../docs/user-auth.js',import.meta.url),'utf8');
async function setup(identity=null){
 const events={},calls=[],status={textContent:''},storage=new Map();let reloads=0;
 const auth={getSession:async()=>({data:{session:identity?{}:null}}),getUser:async()=>({data:{user:identity}}),onAuthStateChange(){},signInWithPassword:async payload=>{calls.push({method:'login',payload});return{}},signUp:async payload=>{calls.push({method:'signup',payload});return{data:{session:null}}},resetPasswordForEmail:async(...payload)=>{calls.push({method:'reset',payload});return{}},updateUser:async payload=>{calls.push({method:'update',payload});return{data:{user:identity}}}};
 const window={miaoAuthConfig:{url:'https://test.supabase.co',publishableKey:'public-test',redirectUrl:'https://jxx4600-prog.github.io/amiao-post-office/'},supabase:{createClient:(url,key,options)=>{assert.equal(options.auth.persistSession,true);return{auth}}},addEventListener(){}};
 const document={addEventListener:(kind,fn)=>events[kind]=fn,querySelector:s=>s==='#auth-status'?status:null};
 const ctx={window,document,URL,URLSearchParams,location:{href:'https://jxx4600-prog.github.io/amiao-post-office/',search:'',origin:'https://jxx4600-prog.github.io',reload(){reloads++}},history:{replaceState(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem(){},removeItem(){}},AbortSignal,fetch(){throw Error('No real network permitted')},setTimeout(){},clearTimeout(){},FormData:class{constructor(form){this.form=form}get(key){return this.form.fields[key]??null}}};
 vm.runInNewContext(source,ctx);await window.miaoAuth.ready;window.miao={snapshot(){},save(){}};
 async function submit(mode,fields,id='auth-credentials-form'){
  const button={disabled:false,isConnected:true},form={id,dataset:{mode},fields,querySelector:()=>button,reportValidity:()=>true,reset(){}};
  await events.submit({target:form,preventDefault(){},stopImmediatePropagation(){}});
 }
 return{calls,status,submit,api:window.miaoAuth,get reloads(){return reloads}};
}
const guest=await setup();
await guest.submit('login',{email:'test@example.com',password:'example-only-password'});
assert.equal(guest.calls[0].method,'login');assert.equal(guest.reloads,1);
const signup=await setup();await signup.submit('signup',{email:'test@example.com',password:'abcdefgh',confirm:'different'});assert.equal(signup.calls.length,0);assert.match(signup.status.textContent,/不一致/);
await signup.submit('signup',{email:'test@example.com',password:'abcdefgh',confirm:'abcdefgh'});assert.equal(signup.calls[0].method,'signup');assert.match(signup.status.textContent,/首次验证/);
await signup.submit('reset',{email:'test@example.com'});assert.equal(signup.calls.length,1);assert.match(signup.status.textContent,/一分钟/);
const reset=await setup();await reset.submit('reset',{email:'test@example.com'});assert.match(reset.calls[0].payload[1].redirectTo,/auth=recovery/);
const user=await setup({id:'c0d116b4-3c0b-4e41-b1e3-84b2c20d6df0'});await user.submit('password',{password:'abcdefgh',confirm:'abcdefgh'},'auth-password-form');assert.equal(user.calls[0].method,'update');assert.match(user.status.textContent,/密码已设置/);
const denied=await setup();await denied.submit('password',{password:'abcdefgh',confirm:'abcdefgh'},'auth-password-form');assert.equal(denied.calls.length,0);
assert.match(guest.api.friendly({code:'invalid_credentials'}),/邮箱或密码/);
console.log('PASS: password sign-in, confirmation mismatch, signup, mail cooldown, recovery redirect, verified-user password update and guest rejection. No live accounts or emails changed.');
