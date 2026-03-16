/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/wishlist.js
 * Page wishlist.html — Favoris (chargement Firestore)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var loaderEl  = document.getElementById('wl-loader');
  var emptyEl   = document.getElementById('wl-empty');
  var contentEl = document.getElementById('wl-content');
  var gridEl    = document.getElementById('wl-grid');
  var filtersEl = document.getElementById('wl-filters');
  var sortEl    = document.getElementById('wl-sort');
  if (!gridEl)   return;

  var db2        = window.db;
  var allProducts= [];
  var activeFilter = 'all';

  function showEmpty() {
    if (loaderEl) loaderEl.style.display='none';
    if (filtersEl && filtersEl.parentElement) filtersEl.style.display='none';
    if (emptyEl)   emptyEl.classList.add('show');
    if (contentEl) contentEl.classList.remove('show');
    var countEl = document.getElementById('wl-count'); if(countEl) countEl.textContent='0';
  }

  function buildFilters() {
    if (!filtersEl) return;
    var cats = [...new Set(allProducts.map(function(p){return p.category;}).filter(Boolean))];
    if (cats.length < 2) { filtersEl.style.display='none'; return; }
    filtersEl.innerHTML = '<button class="wl-filter on" data-cat="all">Tous</button>'
      + cats.map(function(c){ return '<button class="wl-filter" data-cat="'+c+'">'+c+'</button>'; }).join('');
    filtersEl.querySelectorAll('.wl-filter').forEach(function(btn){
      btn.addEventListener('click', function(){
        filtersEl.querySelectorAll('.wl-filter').forEach(function(b){ b.classList.remove('on'); });
        btn.classList.add('on');
        activeFilter = btn.getAttribute('data-cat');
        renderWl();
      });
    });
  }

  var wlFmt = function(n){ return new Intl.NumberFormat('fr-FR').format(n)+' FCFA'; };

  function renderWl() {
    if (loaderEl)  loaderEl.style.display='none';
    if (emptyEl)   emptyEl.classList.remove('show');
    if (contentEl) contentEl.classList.add('show');
    var toolbar = document.getElementById('wl-toolbar'); if(toolbar) toolbar.style.display='flex';

    var products = allProducts.slice();
    if (activeFilter !== 'all') products = products.filter(function(p){ return p.category===activeFilter; });
    if (sortEl) {
      var sort = sortEl.value;
      if (sort==='price-asc')  products.sort(function(a,b){ return (a.price||0)-(b.price||0); });
      if (sort==='price-desc') products.sort(function(a,b){ return (b.price||0)-(a.price||0); });
      if (sort==='name')       products.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
    }

    var countEl = document.getElementById('wl-count'); if(countEl) countEl.textContent=allProducts.length;

    gridEl.innerHTML = '';
    products.forEach(function(p, idx) {
      var price = Number(String(p.price||0).replace(/[^\d.-]/g,'')||0);
      var op    = Number(String(p.originalPrice||0).replace(/[^\d.-]/g,'')||0);
      var hasD  = op > price && op > 0;
      var stock = parseInt(p.stock||0,10);
      var stLbl = stock===0?'Épuisé':stock<=5?'Plus que '+stock:'En stock';
      var stCls = stock===0?'out':stock<=5?'low':'ok';
      var img   = p.image||((p.images&&p.images.length)?p.images[0]:'assets/img/placeholder-product-1.svg');

      var card = document.createElement('div');
      card.className = 'wl-card';
      card.setAttribute('data-id', p.id);
      card.innerHTML =
        '<a href="product.html?id='+p.id+'" class="wl-card-img-wrap">'
          + '<img src="'+img+'" class="wl-card-img" alt="'+(p.name||'')+'" onerror="this.src=\'assets/img/placeholder-product-1.svg\'">'
          + (hasD ? '<div class="wl-card-badge sale">-'+Math.round((1-price/op)*100)+'%</div>' : '')
          + '<button class="wl-card-remove" onclick="wlRemove(\''+p.id+'\',event)" title="Retirer des favoris"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>'
          + '<div class="wl-card-overlay"><button class="wl-card-add-btn" onclick="wlAddToCart(\''+p.id+'\',event)" '+(stock===0?'disabled':'')+''+(stock===0?' style="opacity:.4;pointer-events:none"':'')+'>+ '+(stock===0?'Épuisé':'Ajouter au panier')+'</button></div>'
        + '</a>'
        + '<div class="wl-card-body">'
          + (p.category?'<span class="wl-card-cat">'+p.category+'</span>':'')
          + '<a href="product.html?id='+p.id+'" class="wl-card-name">'+(p.name||'Produit sans nom')+'</a>'
          + (p.shopName?'<span class="wl-card-shop">'+p.shopName+'</span>':'')
          + '<div class="wl-card-footer"><div><div class="wl-card-price">'+wlFmt(price)+'</div>'+(hasD?'<div class="wl-card-original">'+wlFmt(op)+'</div>':'')+'</div><span class="wl-card-stock '+stCls+'">'+stLbl+'</span></div>'
        + '</div>';
      gridEl.appendChild(card);
      setTimeout(function(){ card.classList.add('on'); }, 40 + idx*55);
    });

    if (!products.length && allProducts.length) {
      gridEl.innerHTML = '<p style="padding:40px;text-align:center;color:var(--smoke)">Aucun produit dans cette catégorie.</p>';
    }
  }

  async function loadWishlistFirestore() {
    var ids = [];
    try { ids = JSON.parse(localStorage.getItem('ac_wishlist')||'[]').filter(Boolean); } catch { ids=[]; }
    if (!ids.length) { showEmpty(); return; }
    if (!db2) { showEmpty(); return; }

    try {
      var products = [];
      var chunks   = [];
      for (var i=0; i<ids.length; i+=10) chunks.push(ids.slice(i,i+10));
      
      // Timeout de 8 secondes pour éviter le chargement infini
      var timeoutId = setTimeout(function() {
        console.warn('[wishlist] Timeout Firestore - affichage du fallback');
        if (!allProducts.length) showEmpty();
      }, 8000);
      
      for (var chunk of chunks) {
        var snap = await db2.collection('products').where(firebase.firestore.FieldPath.documentId(),'in',chunk).get();
        snap.docs.forEach(function(d){ products.push(Object.assign({id:d.id},d.data())); });
      }
      
      clearTimeout(timeoutId);
      allProducts = ids.map(function(id){ return products.find(function(p){ return p.id===id; }); }).filter(Boolean);
      if (!allProducts.length) { showEmpty(); return; }
      buildFilters();
      renderWl();
    } catch(e){ 
      console.error('[wishlist] Erreur Firebase:', e); 
      showEmpty(); 
    }
  }

  window.wlRemove = function(id, e) {
    if (e) e.preventDefault();
    var card = document.querySelector('.wl-card[data-id="'+id+'"]');
    if (card) { card.style.transition='opacity .3s,transform .3s'; card.style.opacity='0'; card.style.transform='scale(.92)'; setTimeout(function(){ card.remove(); },320); }
    var ids = []; try { ids=JSON.parse(localStorage.getItem('ac_wishlist')||'[]'); } catch{}
    localStorage.setItem('ac_wishlist', JSON.stringify(ids.filter(function(i){ return i!==id; })));
    allProducts = allProducts.filter(function(p){ return p.id!==id; });
    setTimeout(function(){ if (!allProducts.length) showEmpty(); else { var countEl=document.getElementById('wl-count'); if(countEl) countEl.textContent=allProducts.length; renderWl(); } }, 340);
    if (window.showToast) window.showToast('Retiré des favoris','warn');
    if (window.updateCartBadge) window.updateCartBadge();
  };
  window.removeFromWishlist = window.wlRemove;

  window.wlAddToCart = function(id, e) {
    if (e) e.preventDefault();
    var cart = []; try { cart=JSON.parse(localStorage.getItem('ac_cart')||'[]'); } catch{}
    var p = allProducts.find(function(p){ return p.id===id; }); if(!p) return;
    var existing = cart.find(function(i){ return i.pid===id||i.id===id; });
    if (existing) { existing.qty=(existing.qty||existing.quantity||1)+1; existing.quantity=existing.qty; }
    else cart.push({ pid:id, qty:1, quantity:1, product:p });
    localStorage.setItem('ac_cart', JSON.stringify(cart));
    if (window.showToast) window.showToast((p.name||'Produit')+' ajouté au panier','success');
    if (window.updateCartBadge) window.updateCartBadge();
  };
  window.addToCart = window.wlAddToCart;

  window.wlClearAll = function() {
    if (!confirm('Vider tous vos favoris ?')) return;
    localStorage.removeItem('ac_wishlist');
    allProducts = [];
    showEmpty();
    if (window.showToast) window.showToast('Favoris vidés');
  };

  if (sortEl) sortEl.addEventListener('change', renderWl);

  loadWishlistFirestore();
});
