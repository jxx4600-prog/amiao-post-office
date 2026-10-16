import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
let state={inbox:[],futureLetters:[],profile:{nickname:'小鱼'}},mode=.9;
const math=Object.create(Math);math.random=()=>mode;
const window={miao:{get state(){return state;}},addEventListener(){},miaoPeople:{profile:s=>s.profile,personalize(l,p){l.text=l.text.replace('给今天的你：','给'+p.nickname+'：');}}};
const context=vm.createContext({window,Math:math,crypto:{randomUUID},document:{querySelector(){},addEventListener(){}},setInterval(){}});
for(const name of ['cat-mail-content.js','postbox.js'])vm.runInContext(await fs.readFile(new URL('../docs/'+name,import.meta.url),'utf8'),context);
const make=window.miaoPostbox.createMail;
for(const [index,cat] of ['白白','莉莉','阿夜','大王'].entries()){
 for(const [random,count,format] of [[.9,16,'letter'],[.1,12,'postcard']]){
  mode=random;const letters=Array.from({length:count*2},()=>make('2026-10-17','',index));
  for(let i=0;i<2;i++)assert.equal(new Set(letters.slice(i*count,(i+1)*count).map(l=>l.contentKey)).size,count,cat+'/'+format+' pool repeats before exhaustion');
  assert.notEqual(letters[count-1].contentKey,letters[count].contentKey,'repeat across refill');
  assert.ok(letters.every(l=>l.courier===cat&&l.text.length>20&&l.id&&l.source==='cat'));
 }
}
mode=.9;const couriers=Array.from({length:12},()=>make('2026-10-17','').courier);
for(let i=0;i<3;i++)assert.equal(new Set(couriers.slice(i*4,(i+1)*4)).size,4,'courier shuffle cycle');
const a=make('2026-10-17','',0);state=JSON.parse(JSON.stringify(state));const b=make('2026-10-17','',0);assert.notEqual(a.contentKey,b.contentKey,'persisted bag survives reload');
const birthday=make('2026-10-17','你的生日',0);assert.match(birthday.text,/生日/);assert.match(birthday.text,/给小鱼/);
console.log('PASS: 64 letters + 48 postcards, no repeated story within a pool cycle, no adjacent repeat across refill, persisted shuffle progress, four-courier cycles and birthday personalization.');

