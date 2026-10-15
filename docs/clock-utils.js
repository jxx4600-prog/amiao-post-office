(() => {
 const zones=[['Asia/Shanghai','北京时间'],['Asia/Tokyo','东京'],['Asia/Seoul','首尔'],['Asia/Singapore','新加坡'],['Europe/Paris','巴黎'],['Europe/Rome','意大利 · 罗马'],['Europe/London','伦敦'],['America/New_York','纽约'],['America/Los_Angeles','洛杉矶'],['UTC','UTC']];
 function read(date=new Date(),zone=window.miao?.state.timeZone||'Asia/Shanghai'){
  if(!zones.some(([id])=>id===zone))zone='Asia/Shanghai';
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',weekday:'short',timeZoneName:'shortOffset'}).formatToParts(date).map(p=>[p.type,p.value]));
  return{time:`${parts.hour}:${parts.minute}`,seconds:parts.second,date:`${parts.year}-${parts.month}-${parts.day}`,weekday:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),zone,label:zones.find(([id])=>id===zone)[1],offset:parts.timeZoneName.replace('GMT','UTC')};
 }
 function nextAlarm(alarms,date=new Date(),zone){const now=read(date,zone),minutes=Number(now.time.slice(0,2))*60+Number(now.time.slice(3));let best=null;alarms.forEach((alarm,index)=>{if(!alarm.on||!/^([01]\d|2[0-3]):[0-5]\d$/.test(alarm.time))return;const target=Number(alarm.time.slice(0,2))*60+Number(alarm.time.slice(3));for(let daysAhead=0;daysAhead<=7;daysAhead++){if(alarm.days?.length&&!alarm.days.includes((now.weekday+daysAhead)%7))continue;const distance=daysAhead*1440+target-minutes;if(distance<=0)continue;if(!best||distance<best.distance)best={...alarm,index,distance,daysAhead};break;}});return best;}
 window.miaoClock={read,zones,nextAlarm};
})();
