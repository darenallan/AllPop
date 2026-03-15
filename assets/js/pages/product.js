/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/product.js
 * Page product.html — Fiche produit détaillée avec avis
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('ax-root')) return;

  var db     = window.db;
  var fmt    = function (n) { return new Intl.NumberFormat('fr-FR').format(n); };
  var starH  = function (r) { return '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r)); };

  function showErr(m) {
    var root = document.getElementById('ax-root');
    if (root) root.innerHTML = '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:40px;text-align:center"><p style="font-family:\'Instrument Serif\',serif;font-size:88px;color:rgba(200,168,75,.1)">!</p><h2 style="font-family:\'Instrument Serif\',serif;font-size:30px;color:rgba(254,252,248,.55)">' + m + '</h2><a href="catalogue.html" style="margin-top:10px;padding:13px 30px;border:1px solid rgba(200,168,75,.28);color:#C8A84B;text-decoration:none;font-size:9px;letter-spacing:.22em;text-transform:uppercase;font-family:\'Unbounded\',sans-serif;font-weight:800">← Catalogue</a></div>';
  }

  if (!db) { showErr('Firebase non disponible.'); return; }

  var pid = (new URLSearchParams(location.search).get('id') || '').trim();
  if (!pid) { showErr('Aucun produit spécifié.'); return; }

  (async function () {
    try {
      var snap = await db.collection('products').doc(pid).get();
      if (!snap.exists) throw new Error('Produit introuvable');

      var product = Object.assign({ id: snap.id }, snap.data());

      // Incrémenter les vues
      db.collection('products').doc(pid).update({ views: firebase.firestore.FieldValue.increment(1) }).catch(function(){});

      var shopId  = product.shopId || 'unknown';
      var shopData= {};
      if (shopId !== 'unknown') {
        try { var s = await db.collection('shops').doc(shopId).get(); if (s.exists) shopData = s.data(); } catch(e){}
      }

      var reviews = [];
      try {
        var rs = await db.collection('reviews').where('productId','==',pid).limit(20).get();
        rs.forEach(function (d) { 
          var rev = Object.assign({ id: d.id }, d.data());
          reviews.push(rev);
        });
        reviews.sort(function(a,b) { 
          var aTime = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
          var bTime = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
          return bTime - aTime;
        });
        reviews = reviews.slice(0, 10);
      } catch(e){ console.error('Erreur chargement avis:', e); }

      // Couleurs / tailles
      var colors = [], sizes = [], ts = 0;
      if (Array.isArray(product.variants)) {
        var cs = new Set(), ss = new Set();
        product.variants.forEach(function (v) { if(v.color) cs.add(v.color); if(v.size) ss.add(v.size); if(v.qty) ts += v.qty; });
        colors = [...cs].sort(); sizes = [...ss].sort();
      }
      if (!colors.length) colors = Array.isArray(product.colors) ? product.colors : (typeof product.color==='string' ? product.color.split(/[;,|]/).map(function(c){return c.trim();}).filter(Boolean) : []);
      if (!sizes.length)  sizes  = Array.isArray(product.sizes)  ? product.sizes  : (typeof product.size ==='string' ? product.size.split(/[;,|]/).map(function(s){return s.trim();}).filter(Boolean) : []);
      product.colors = colors; product.sizes = sizes;
      if (!product.stock) product.stock = ts || 15;

      window.currentProduct  = product;
      window.currentShopId   = shopId;
      window.currentShopData = shopData || {};
      window.currentImages   = Array.isArray(product.images) ? product.images : [product.image || 'assets/img/placeholder-product-1.svg'];

      renderProduit(product, shopId, shopData, reviews);
    } catch (err) { console.error(err); showErr(err.message); }
  })();

  function renderProduit(product, shopId, shopData, reviews) {
    var imgs  = window.currentImages;
    var hd    = product.originalPrice && product.originalPrice > product.price;
    var disc  = hd ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    var avg   = reviews.length ? (reviews.reduce(function(s,r){return s+(r.rating||0);},0)/reviews.length).toFixed(1) : product.rating || 0;
    var stk   = product.stock;
    var sc    = stk > 10 ? 'ok' : stk > 0 ? 'low' : 'out';
    var smsg  = stk > 10 ? 'En stock — ' + stk + ' disponibles' : stk > 0 ? 'Stock limité — ' + stk + ' restants' : 'Rupture de stock';
    var scol  = sc==='ok' ? 'var(--ok)' : sc==='low' ? 'var(--warn)' : 'var(--danger)';

    var mqData = [
      product.category && { k:'Catégorie', v:product.category },
      { k:'Stock', v:stk + ' unités' },
      (product.vehicleBrand||product.techBrand||product.beautyBrand||product.btpBrand) && { k:'Marque', v:product.vehicleBrand||product.techBrand||product.beautyBrand||product.btpBrand },
      product.vehicleYear && { k:'Année', v:product.vehicleYear },
      product.vehicleFuel && { k:'Carburant', v:product.vehicleFuel },
      product.vehicleMileage !== undefined && { k:'Kilométrage', v:fmt(product.vehicleMileage)+' km' },
      product.colors && product.colors.length && { k:'Couleurs', v:product.colors.length },
      product.sizes  && product.sizes.length  && { k:'Tailles',  v:product.sizes.join(' / ') },
      (product.sku||product.id) && { k:'Réf', v:product.sku||product.id },
    ].filter(Boolean);

    var mqHTML    = [...mqData,...mqData].map(function(i){return '<div class="ax-mqi">'+i.k+' <strong>'+i.v+'</strong></div>';}).join('');
    var dspecs    = mqData.map(function(i){return '<div class="ax-dsrow"><span class="ax-dsk">'+i.k+'</span><span class="ax-dsv">'+i.v+'</span></div>';}).join('');
    var colorsHTML= product.colors && product.colors.length ? '<div class="rv rv3"><p class="ax-varlabel">Couleur</p><div class="ax-colors">' + product.colors.map(function(c,i){return '<div class="ax-csw'+(i===0?' on':'')+'" style="background:'+c+'" data-vt="color" data-val="'+c+'" title="'+c+'" onclick="axVar(\'color\',\''+c+'\',this)" data-h></div>';}).join('') + '</div></div>' : '';
    var sizesHTML = product.sizes  && product.sizes.length  ? '<div class="rv rv3"><p class="ax-varlabel">Taille</p><div class="ax-sizes">' + product.sizes.map(function(s,i){return '<button class="ax-spill'+(i===0?' on':'')+'" data-vt="size" data-val="'+s+'" onclick="axVar(\'size\',\''+s+'\',this)">'+s+'</button>';}).join('') + '</div></div>' : '';
    var savaHTML  = shopData && shopData.logo ? '<img src="'+shopData.logo+'" alt="">' : (shopData.name||'B').charAt(0).toUpperCase();

    var root = document.getElementById('ax-root');
    if (!root) return;

    root.innerHTML =
      '<section class="ax-hero">'
        + '<div class="ax-gal" id="ax-gal">'
          + (hd ? '<div class="ax-disc-flag">−'+disc+'%</div>' : '')
          + '<img src="'+imgs[0]+'" alt="'+product.name+'" class="ax-gal-img" id="ax-main-img" onerror="this.src=\'assets/img/placeholder-product-1.svg\'" onload="document.getElementById(\'ax-gal\').classList.add(\'ld\')">'
          + (imgs.length > 1 ? '<div class="ax-thumbs">' + imgs.map(function(img,i){return '<div class="ax-t'+(i===0?' on':'')+'" onclick="axImg('+i+')"><img src="'+img+'" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"></div>';}).join('') + '</div>' : '')
          + '<div class="ax-gal-num"><strong>01</strong>/ '+String(imgs.length).padStart(2,'0')+'</div>'
        + '</div>'
        + '<div class="ax-info">'
          + '<p class="ax-eyebrow rv">' + (product.category||'Collection Premium') + '</p>'
          + '<h1 class="ax-pname rv rv1">' + product.name + '</h1>'
          + '<div class="ax-rrow rv rv2"><span class="ax-stars">' + starH(avg) + '</span><span class="ax-rmeta">' + avg + '/5 &nbsp;·&nbsp; <a href="#ax-tabs">' + reviews.length + ' avis</a></span></div>'
          + '<div class="ax-pblock rv rv2"><p class="ax-plabel">Prix</p><div class="ax-pprice">' + fmt(product.price) + '<small>FCFA</small></div>' + (hd ? '<div class="ax-pstrike">' + fmt(product.originalPrice) + ' FCFA <span class="ax-save">−'+disc+'%</span></div>' : '') + '</div>'
          + colorsHTML + sizesHTML
          + '<div class="ax-sline rv rv3"><div class="ax-sdot '+sc+'"></div><span style="color:'+scol+'">'+smsg+'</span></div>'
          + '<div class="ax-ctarow rv rv4">'
            + '<div class="ax-qty"><button class="ax-qbtn" onclick="axQty(-1)">−</button><input type="number" class="ax-qnum" id="ax-qty" value="1" min="1" max="'+(stk||999)+'"><button class="ax-qbtn" onclick="axQty(1)">+</button></div>'
            + '<button class="ax-bcart" onclick="axCart()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span>Ajouter au panier</span></button>'
            + '<button class="ax-bwish" id="ax-wish" onclick="axWish()"><span style="font-family:\'Unbounded\',sans-serif; font-weight:700; font-size:11px; letter-spacing:.15em; text-transform:uppercase;">FAV</span></button>'
          + '</div>'
          + '<div class="ax-seller rv"><div class="ax-sava">' + savaHTML + '</div><div><div class="ax-sname">Vendu par ' + (shopData.name||'Boutique Sanhia') + '</div><div class="ax-ssub"><span style="color:var(--gold)">' + starH(shopData.rating||0) + '</span><span>📍 '+(shopData.city||shopData.address||'Ouagadougou')+'</span><span>🚚 Livraison 48–72h</span></div></div>'
            + '<button class="ax-bvisit" onclick="location.href=\'boutique.html?id='+shopId+'\'">Voir la boutique →</button>'
            + '<button class="ax-bvisit" style="margin-top:6px;border-color:rgba(200,168,75,.1);color:rgba(200,168,75,.7)" onclick="axContactSeller()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:6px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Contacter le vendeur</button>'
          + '</div>'
          + '<div class="ax-trust rv"><div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Paiement sécurisé</div><div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg> Retour 7 jours</div><div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> Support client</div></div>'
        + '</div>'
      + '</section>'
      + '<div class="ax-mq"><div class="ax-mqt">' + mqHTML + '</div></div>'
      + '<section class="ax-tabs" id="ax-tabs"><div class="ax-ti">'
        + '<div class="ax-tnav rv"><button class="ax-tbtn on" onclick="axTab(\'desc\',this)">Description</button><button class="ax-tbtn" onclick="axTab(\'rev\',this)">Avis clients ('+reviews.length+')</button></div>'
        + '<div class="ax-tpanel on" id="ax-p-desc"><div class="ax-desc-grid rv"><p class="ax-dtxt">'+(product.description||'<em style="opacity:.4">Aucune description.</em>').replace(/\n/g,'<br>')+'</p>'+(dspecs?'<div class="ax-dspecs">'+dspecs+'</div>':'')+'</div></div>'
        + '<div class="ax-tpanel" id="ax-p-rev"><div class="ax-rl"><div class="ax-rs rv"><div class="ax-avghuge">'+avg+'</div><div class="ax-avgstars">'+starH(avg)+'</div><div class="ax-avgcnt">'+reviews.length+' avis</div></div>'
          + '<div class="rv rv1"><div class="ax-rform"><h3 class="ax-rftitle">Partagez votre expérience</h3><div class="ax-authwarn" id="ax-authwarn">⚠ Vous devez être <a href="login.html">connecté</a> pour laisser un avis.</div><div class="ax-rffield"><label class="ax-rflabel">Votre nom</label><input type="text" id="ax-rname" class="ax-rfinput" placeholder="Nom complet"></div><div class="ax-rffield"><label class="ax-rflabel">Note</label><div class="ax-spick" id="ax-spick"><span onmouseover="axHS(1)" onclick="axSS(1)">★</span><span onmouseover="axHS(2)" onclick="axSS(2)">★</span><span onmouseover="axHS(3)" onclick="axSS(3)">★</span><span onmouseover="axHS(4)" onclick="axSS(4)">★</span><span onmouseover="axHS(5)" onclick="axSS(5)">★</span></div><input type="hidden" id="ax-rrating" value="5"></div><div class="ax-rffield"><label class="ax-rflabel">Votre avis</label><textarea id="ax-rcomment" class="ax-rfarea" placeholder="Décrivez votre expérience…"></textarea></div><button class="ax-rfsubmit" onclick="axReview(event)"><span>Soumettre mon avis</span></button></div>'
          + (reviews.length ? reviews.map(function(r){return '<div class="ax-rcard"><div class="ax-rchead"><div class="ax-rcwho"><div class="ax-rcava">'+(r.userName||'A').charAt(0).toUpperCase()+'</div><div><div class="ax-rcname">'+(r.userName||'Anonyme')+'</div><div class="ax-rcdate">'+(r.createdAt?new Date(r.createdAt.seconds*1000).toLocaleDateString('fr-FR'):'')+'</div></div></div><div class="ax-rcstars">'+starH(r.rating||5)+'</div></div><p class="ax-rctxt">'+(r.comment||'')+'</p></div>';}).join('') : '<div class="ax-norev"><div class="ax-nrevbig">✦</div><p>Soyez le premier à partager votre expérience.</p></div>')
        + '</div></div></div>'
      + '</div></section>'
      + '<section class="ax-rel"><div class="ax-relhead rv"><h2 class="ax-sectitle">Vous aimerez<br><em>aussi</em></h2><a href="catalogue.html'+(product.category?'?category='+encodeURIComponent(product.category):'')+'" class="ax-seeall">Voir tout →</a></div><div class="ax-relgrid" id="ax-relgrid">'
        + [1,2,3,4].map(function(){return '<div class="ax-rcard2"><div class="ax-rimgbox ax-sk" style="height:290px"></div><div class="ax-rbody"><div class="ax-sk" style="height:9px;width:48%;margin-bottom:10px"></div><div class="ax-sk" style="height:19px;width:72%;margin-bottom:12px"></div></div></div>';}).join('')
      + '</div></section>';

    // Auth warning
    firebase.auth().onAuthStateChanged(function (u) {
      var w = document.getElementById('ax-authwarn');
      if (w) w.style.display = u ? 'none' : 'block';
    });

    // Reveal + produits similaires
    if (typeof window.watchReveal === 'function') window.watchReveal();
    else document.querySelectorAll('.rv').forEach(function (el) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }); }, { threshold: 0.1 });
      io.observe(el);
    });
    loadRelated(product, shopId);
  }

  /* — Interactions globales — */
  window.axImg = function (idx) {
    var m = document.getElementById('ax-main-img'), n = document.querySelector('.ax-gal-num');
    if (m) m.src = window.currentImages[idx];
    if (n) n.innerHTML = '<strong>' + String(idx+1).padStart(2,'0') + '</strong>/ ' + String(window.currentImages.length).padStart(2,'0');
    document.querySelectorAll('.ax-t').forEach(function (t, i) { t.classList.toggle('on', i===idx); });
  };
  window.axVar = function (type, val, el) {
    el.parentElement.querySelectorAll('[data-vt="'+type+'"]').forEach(function (s) { s.classList.remove('on'); });
    el.classList.add('on');
  };
  window.axQty = function (d) {
    var i = document.getElementById('ax-qty');
    if (i) i.value = Math.max(1, Math.min(parseInt(i.value||1)+d, parseInt(i.max)||999));
  };
  window.axCart = function () {
    try {
      if (!window.currentProduct) { if (window.showToast) window.showToast('Produit indisponible', 'danger'); return; }
      var qty = Math.max(1, parseInt(document.getElementById('ax-qty')?.value)||1);
      var p   = window.currentProduct;
      if (typeof addToCart === 'function') {
        addToCart(String(p.id||''), qty, p);
      } else {
        var cart = []; try { cart = JSON.parse(localStorage.getItem('ac_cart')||'[]'); } catch(_){ cart=[]; }
        var color = document.querySelector('[data-vt="color"].on')?.dataset.val;
        var size  = document.querySelector('[data-vt="size"].on')?.dataset.val;
        var vars  = {}; if (color) vars.color=color; if (size) vars.size=size;
        var item  = { id:p.id, name:p.name, price:p.price, image:p.image||window.currentImages?.[0], quantity:qty, shopId:window.currentShopId, variants:vars };
        var ei    = cart.findIndex(function(c){ return c.id===item.id && JSON.stringify(c.variants)===JSON.stringify(item.variants); });
        if (ei > -1) cart[ei].quantity += qty; else cart.push(item);
        localStorage.setItem('ac_cart', JSON.stringify(cart));
        if (window.updateCartBadge) window.updateCartBadge();
      }
      if (window.showToast) window.showToast('✓ Ajouté au panier', 'success');
    } catch (err) { console.error(err); if (window.showToast) window.showToast('Impossible d\'ajouter au panier', 'danger'); }
  };
  window.axWish = function () {
    var b = document.getElementById('ax-wish');
    if (b && !b.querySelector('svg')) {
      b.innerHTML = '<span style="font-family:\'Unbounded\',sans-serif; font-weight:700; font-size:11px; letter-spacing:.15em; text-transform:uppercase;">FAV</span>';
    }
    if (b) b.classList.toggle('on');
    if (window.showToast) window.showToast(b && b.classList.contains('on') ? '♥ Ajouté aux favoris' : '♡ Retiré des favoris');
  };
  window.axTab = function (n, btn) {
    document.querySelectorAll('.ax-tbtn').forEach(function(b){ b.classList.remove('on'); });
    document.querySelectorAll('.ax-tpanel').forEach(function(p){ p.classList.remove('on'); });
    btn.classList.add('on');
    var panel = document.getElementById('ax-p-' + n);
    if (panel) panel.classList.add('on');
  };
  window.axHS = function (r) { document.querySelectorAll('#ax-spick span').forEach(function(s,i){ s.style.color = i<r ? 'var(--gold)' : 'rgba(11,10,8,.18)'; }); };
  window.axSS = function (r) { var el = document.getElementById('ax-rrating'); if(el) el.value=r; window.axHS(r); };
  window.axReview = async function (e) {
    var btn     = e.target.closest('button');
    var name    =  document.getElementById('ax-rname')?.value.trim();
    var rating  = parseInt(document.getElementById('ax-rrating')?.value)||5;
    var comment = document.getElementById('ax-rcomment')?.value.trim();
    if (!name)    { if (window.showToast) window.showToast('⚠ Entrez votre nom', 'danger'); return; }
    if (!comment) { if (window.showToast) window.showToast('⚠ Entrez votre avis', 'danger'); return; }
    var user = firebase.auth().currentUser;
    if (!user) { if (window.showToast) window.showToast('⚠ Connexion requise', 'danger'); return; }
    try {
      btn.disabled = true; var sp = btn.querySelector('span'); if(sp) sp.textContent = 'Publication…';
      await firebase.firestore().collection('reviews').add({ userId:user.uid, userName:name, productId:window.currentProduct.id, shopId:window.currentShopId||'', rating:rating, comment:comment, createdAt:firebase.firestore.Timestamp.now() });
      if (window.showToast) window.showToast('✓ Avis publié avec succès!', 'success');
      if(sp) sp.textContent = '✓ Avis publié';
      document.getElementById('ax-rname').value = ''; document.getElementById('ax-rcomment').value = ''; window.axSS(5);
      setTimeout(function(){ location.reload(); }, 3000);
    } catch (err) { 
      btn.disabled = false; 
      var sp = btn.querySelector('span'); 
      if(sp) sp.textContent='Soumettre mon avis';
      if(window.showToast) window.showToast('❌ '+err.message,'danger'); 
    }
  };
  window.axContactSeller = async function () {
    if (typeof window.initChatModalBindings === 'function') window.initChatModalBindings();
    if (typeof window.openSellerChat !== 'function') { if(window.showToast) window.showToast('Messagerie indisponible.','danger'); return; }
    try {
      var shop = window.currentShopData||{}, p = window.currentProduct||{};
      await window.openSellerChat({ shopId:window.currentShopId||p.shopId||'', sellerId:shop.ownerId||shop.sellerId||p.sellerId||p.ownerId||'', shopName:shop.name||'Boutique', sellerName:shop.ownerName||shop.sellerName||shop.name||'Vendeur', productId:p.id||'' });
    } catch (err) { if(window.showToast) window.showToast(err.message||'Impossible d\'ouvrir la conversation.','danger'); }
  };

  async function loadRelated(product, shopId) {
    var relGrid = document.getElementById('ax-relgrid');
    if (!relGrid) return;
    try {
      var q = product.category ? db.collection('products').where('category','==',product.category).limit(9) : db.collection('products').limit(9);
      var snap3 = await q.get();
      var items = [];
      snap3.forEach(function(d){ if(d.id!==product.id) items.push(Object.assign({id:d.id},d.data())); });
      if (items.length < 2 && shopId && shopId !== 'unknown') {
        var ss = await db.collection('products').where('shopId','==',shopId).limit(6).get();
        ss.forEach(function(d){ if(d.id!==product.id && !items.find(function(r){return r.id===d.id;})) items.push(Object.assign({id:d.id},d.data())); });
      }
      items = items.sort(function(){return Math.random()-.5;}).slice(0,4);
      if (!items.length) { relGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--smoke);font-size:11px">Aucun produit similaire</div>'; return; }
      relGrid.innerHTML = items.map(function(p2){
        var img2 = (Array.isArray(p2.images)?p2.images[0]:null)||p2.image||'assets/img/placeholder-product-1.svg';
        var hd2  = p2.originalPrice && p2.originalPrice>p2.price;
        var d2   = hd2 ? Math.round(((p2.originalPrice-p2.price)/p2.originalPrice)*100) : 0;
        return '<div class="ax-rcard2 rv" onclick="location.href=\'product.html?id='+p2.id+'\'" data-h>'
          + '<div class="ax-rimgbox">'+(hd2?'<div class="ax-rdisc">−'+d2+'%</div>':'')+'<img src="'+img2+'" alt="'+p2.name+'" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"><div class="ax-roverlay"><button class="ax-rquick" onclick="event.stopPropagation();axQuick(\''+p2.id+'\')">+ Ajouter au panier</button></div></div>'
          + '<div class="ax-rbody"><p class="ax-rcat">'+(p2.category||'Produit')+'</p><p class="ax-rname">'+p2.name+'</p><div class="ax-rfoot"><span class="ax-rprice">'+fmt(p2.price)+' <small>FCFA</small></span><span class="ax-rstars">'+starH(p2.rating||0)+'</span></div></div>'
        + '</div>';
      }).join('');

      document.querySelectorAll('.ax-rcard2.rv').forEach(function (el) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);} }); }, {threshold:0.05});
        io.observe(el);
      });
    } catch(err) { console.warn('[produit] loadRelated:', err); }
  }
});
