/**
 * seller-onboarding.js
 * Page présentation vendeurs avec compteurs animés
 * Section §18 de prime.js
 */

(()=>{
  const ring=document.getElementById('cur-ring'),dot=document.getElementById('cur-dot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
  (function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();
  document.addEventListener('mouseover',e=>{if(e.target.closest('a,button,.so-why-card,.so-req-card,.so-ps'))document.body.classList.add('ch')});
  document.addEventListener('mouseout',e=>{if(e.target.closest('a,button,.so-why-card,.so-req-card,.so-ps'))document.body.classList.remove('ch')});
})();
(()=>{
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.07});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));
})();

// Compteurs animés depuis Firebase
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof firebase==='undefined'||!firebase.apps||!firebase.apps.length)return;
  const db=firebase.firestore();
  Promise.all([
    db.collection('shops').get(),
    db.collection('products').get()
  ]).then(([shops,products])=>{
    const sc=shops.size,pc=products.size;
    animCount(document.getElementById('met-sellers'),sc||25);
    animCount(document.getElementById('met-products'),pc||500);
    animCount(document.getElementById('stat-sellers'),sc||25);
    animCount(document.getElementById('stat-products'),pc||500);
  }).catch(()=>{
    ['met-sellers','stat-sellers'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='25+'});
    ['met-products','stat-products'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='500+'});
  });
});
function animCount(el,target){
  if(!el)return;
  const suffix=target>=500?'+':'';
  let start=0;const dur=2200;const s=performance.now();
  function step(now){
    const t=Math.min((now-s)/dur,1);
    const ease=1-Math.pow(1-t,4);
    el.textContent=Math.round(ease*target)+(t<1?'':suffix);
    if(t<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}