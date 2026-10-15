(() => {
 const nickname=value=>Array.from(String(value||'').trim().replace(/[\r\n\t]/g,' ')).slice(0,20).join('');
 function birthday(value,today=new Date().toLocaleDateString('sv-SE')){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';const date=new Date(value+'T12:00:00Z');return !Number.isNaN(+date)&&date.toISOString().slice(0,10)===value&&value<=today?value:'';}
 function profile(state={},user=null){const metadata=user?.user_metadata||{},local=state.profile||{};return{nickname:nickname(metadata.nickname??local.nickname),birthday:birthday(metadata.birthday??local.birthday??state.birthday)};}
 function personalize(letter,details){const name=nickname(details.nickname);if(!name)return letter;const text=String(letter.text||'');letter.text=text.startsWith('给今天的你：')?text.replace('给今天的你：',`给${name}：`):`给${name}：\n\n${text}`;letter.recipientNickname=name;return letter;}
 window.miaoPeople={nickname,birthday,profile,personalize};
})();
