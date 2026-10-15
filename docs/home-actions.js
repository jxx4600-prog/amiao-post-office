(() => {
 const names=['白白','莉莉','阿夜','大王'];
 const actions=[
  '<span class="book-leaf"><i></i><i></i><i></i></span>',
  '<span class="letter-flight"><i></i></span><span class="petal petal-one"></span><span class="petal petal-two"></span>',
  '<span class="fish-bubble one"></span><span class="fish-bubble two"></span>',
  '<span class="parcel-spark one"></span><span class="parcel-spark two"></span>'
 ];
 async function decorate(){
  const home=document.querySelector('.home');if(!home)return;
  const puppet=home.querySelector('.courier-puppet');
  const name=puppet.getAttribute('aria-label').replace('动态陪伴','');
  await window.miaoAssets.ready;
  if(!home.isConnected)return;
  const index=names.indexOf(name),src=window.miaoAssets.body(name);
  puppet.dataset.courier=name;
  puppet.innerHTML=`<img class="courier-whole" src="${src}" alt=""><img class="courier-face" src="${src}" alt=""><span class="courier-action" aria-hidden="true">${actions[index]}</span>`;
  // Render the same hand-drawn prop separately so its movement stays tied to the character.
  if(index===2)puppet.insertAdjacentHTML('beforeend',`<img class="courier-fish" src="${src}" alt="">`);
  if(index===3)puppet.insertAdjacentHTML('beforeend',`<img class="courier-parcel" src="${src}" alt="">`);
  const weather=home.querySelector('.home-weather');
  if(weather.dataset.weather==='sun'){
   const source=weather.querySelector('img'),canvas=document.createElement('canvas');
   canvas.className='sun-disc';canvas.width=canvas.height=240;
   const paint=()=>{if(!home.isConnected)return;const c=canvas.getContext('2d');c.save();c.beginPath();c.arc(120,120,119,0,Math.PI*2);c.clip();c.drawImage(source,295,220,150,150,0,0,240,240);c.restore();};
   if(source.complete&&source.naturalWidth)paint();else source.addEventListener('load',paint,{once:true});
   weather.append(canvas);
  }
 }
 window.addEventListener('miao:render',({detail})=>{if(detail.page==='home')decorate();});
})();
