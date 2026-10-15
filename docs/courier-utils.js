(() => {
 const profiles={
  '白白':{title:'慢慢来的陪伴者',description:'温柔、耐心，喜欢热牛奶和读书。每一件小事都会认真听。',motif:'star',color:'#bdb493',paper:'柔软星星信纸',comments:['今天的小事，我都认真收好啦。','不着急，咪陪你慢慢来。','给认真记录的你，留一杯热牛奶。','能把今天写下来，就很棒啦。']},
  '莉莉':{title:'收集灵感的探险家',description:'好奇、活泼，喜欢花草和新鲜点子，总能发现生活的小惊喜。',motif:'leaf',color:'#9eafa1',paper:'嫩芽花草信纸',comments:['这封信里藏着一颗灵感种子！','咪发现了一件宝藏：你今天的记录。','把这一页夹进小花书签，明天再来探险吧。','这件小事值得画一朵花，咪替你盖章。']},
  '阿夜':{title:'安静守信的夜班员',description:'沉静、细腻，喜欢月亮和夜里的小声倾诉，替你保管没说出口的心事。',motif:'moon',color:'#aaa4bb',paper:'月光星点信纸',comments:['信收到了。今晚，咪替你守着。','不必把每个想法都说清楚，这里留着位置。','这一页的心事，月亮和咪会好好保管。','晚风很轻，你的记录已经稳稳抵达。']},
  '大王':{title:'靠谱爽快的行动派',description:'直爽、热心，喜欢清单和小包裹，是说到做到的投递队长。',motif:'paw-print',color:'#c2a58b',paper:'爪印邮戳信纸',comments:['收到！这封信由本大王负责，妥妥送达。','今天的记录任务完成，奖励一个猫爪盖章！','大王巡查完毕：这一天值得收藏。','包裹已签收。下一件小事，我们一起搞定！']}
 };
 function comment(letter,random=Math.random){const p=profiles[letter.courier]||profiles['白白'];if(!letter.trace&&window.miaoLetters)letter.trace=window.miaoLetters.createTrace(letter,random);return p.comments[Math.min(p.comments.length-1,Math.floor(random()*p.comments.length))];}
 function calendar(year,month,letters){const start=new Date(year,month,1).getDay(),total=new Date(year,month+1,0).getDate();return Array.from({length:42},(_,i)=>{const day=i-start+1;if(day<1||day>total)return null;const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;return{day,date,letters:letters.filter(l=>l.date===date)};});}
 window.miaoCouriers={profiles,comment,calendar};
})();
