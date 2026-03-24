
/* ── CURSOR ─────────────────────────────────── */
(()=>{
  const ring=document.getElementById('cur-ring'),dot=document.getElementById('cur-dot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{
    mx=e.clientX;my=e.clientY;
    dot.style.left=mx+'px';dot.style.top=my+'px';
  });
  (function loop(){
    rx+=(mx-rx)*.1;ry+=(my-ry)*.1;
    ring.style.left=rx+'px';ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover',e=>{
    if(e.target.closest('a,button,[onclick],input,textarea'))document.body.classList.add('cur-h');
  });
  document.addEventListener('mouseout',e=>{
    if(e.target.closest('a,button,[onclick],input,textarea'))document.body.classList.remove('cur-h');
  });
})();

/* ── REVEAL ON SCROLL ────────────────────────── */
(()=>{
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')});
  },{threshold:.12});
  document.querySelectorAll('.rv').forEach(el=>obs.observe(el));
})();

/* ── HERO SEARCH ─────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const input=document.querySelector('.hero-search-input');
  const btn=document.querySelector('.hero-search-btn');
  const go=()=>{
    const q=(input?.value||'').trim();
    window.location.href=q?`/catalogue?q=${encodeURIComponent(q)}`:`/catalogue`;
  };
  btn?.addEventListener('click',go);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});

  /* Newsletter "Cercle" */
  document.getElementById('nl-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const email = (input?.value || '').trim().toLowerCase();
    if (!email) {
      if(typeof window.showToast==='function') window.showToast('Veuillez entrer un email','warn');
      return;
    }

    const btn = e.target.querySelector('button');
    const originalText = btn?.textContent || 'Je rejoins';
    if (btn) {
      btn.disabled = true;
      btn.textContent = '…';
    }

    try {
      // Vérifier que Firestore est disponible
      if (!window.db || typeof window.db.collection !== 'function') {
        throw new Error('Firestore non disponible');
      }

      // Vérifier si déjà inscrit
      const existing = await window.db.collection('newsletter').where('email', '==', email).limit(1).get();
      if (!existing.empty) {
        if(typeof window.showToast==='function') window.showToast('Vous êtes déjà inscrit(e) !','warn');
        return;
      }

      // Ajouter à newsletter
      await window.db.collection('newsletter').add({
        email,
        subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active',
      });

      if(typeof window.showToast==='function') window.showToast('Merci pour votre inscription ✓','success');
      input.value = '';
    } catch (err) {
      console.error('[Newsletter] Erreur:', err);
      if(typeof window.showToast==='function') window.showToast('Une erreur est survenue. Réessayez.','err');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  });

  /* Products loaded — hide skeleton, show grid */
  const skel=document.getElementById('skel-products');
  const grid=document.getElementById('products-container');
  const observer=new MutationObserver(()=>{
    if(grid.children.length>0&&!(grid.children.length===1&&grid.firstChild.tagName==='P')){
      skel.style.display='none';
      grid.style.display='grid';
    }
  });
  if(grid) observer.observe(grid,{childList:true});

  /* loadProducts from data.js */
  if(typeof window.loadProducts==='function') window.loadProducts();
  if(typeof lucide!=='undefined') lucide.createIcons();
});

/* ── HERO STATS FROM FIREBASE ────────────────── */
document.addEventListener('DOMContentLoaded',function() {
  function loadHeroStats() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      setFallback();
      return;
    }
    var db = firebase.firestore();
    Promise.all([
      db.collectionGroup('products').get(),
      db.collection('shops').get(),
    ]).then(function (results) {
      var prodsSnap = results[0], shopsSnap = results[1];
      var totalRating = 0, rCount = 0;
      prodsSnap.forEach(function (d) {
        if (d.data().rating) { totalRating += d.data().rating; rCount++; }
      });
      var avg = rCount > 0 ? (totalRating / rCount).toFixed(1) : 4.8;
      setTarget('stats-products', prodsSnap.size || 500);
      setTarget('stats-shops',    shopsSnap.size || 25);
      setTarget('stats-rating',   avg);
    }).catch(setFallback);
  }

  function setFallback() {
    setTarget('stats-products', 500);
    setTarget('stats-shops',    25);
    setTarget('stats-rating',   4.8);
  }
  
  function setTarget(id, v) {
    var el = document.getElementById(id);
    if (el) {
      el.setAttribute('data-target', v);
      el.textContent = '';
    }
  }

  function animCounter(el) {
    var target  = parseFloat(el.getAttribute('data-target'));
    var suffix  = el.getAttribute('data-suffix') || '';
    var isFloat = !Number.isInteger(target);
    var dur = 2200, start = performance.now();
    (function step(now) {
      var p    = Math.min((now - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 4);
      el.textContent = (isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease)) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    })(start);
  }

  loadHeroStats();
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animCounter(e.target); cObs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  // Launch counter animation after loading stats
  setTimeout(function () {
    document.querySelectorAll('.counter').forEach(function (c) { cObs.observe(c); });
  }, 400);
});
