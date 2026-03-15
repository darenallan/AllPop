/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/boutique.js
 * Page boutique.html — Profil d'une boutique
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var shopNameEl = document.getElementById('shop-name');
  if (!shopNameEl) return;

  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    shopNameEl.innerText = 'Erreur Firebase';
    return;
  }

  var db     = firebase.firestore();
  var params = new URLSearchParams(window.location.search);
  var shopId = params.get('id');

  var els = {
    banner:     document.getElementById('shop-banner'),
    logo:       document.getElementById('shop-logo'),
    name:       document.getElementById('shop-name'),
    slogan:     document.getElementById('shop-slogan'),
    desc:       document.getElementById('shop-desc'),
    verified:   document.getElementById('badge-verified'),
    contactBtn: document.getElementById('contact-btn'),
    grid:       document.getElementById('shop-products-grid'),
    search:     document.getElementById('shop-search-input'),
  };

  if (!shopId) {
    if (els.name) els.name.innerText = 'Boutique introuvable';
    return;
  }

  var allShopProducts = [];
  var currentShopData = {};

  // Infos boutique
  db.collection('shops').doc(shopId).get().then(function (doc) {
    if (!doc.exists) {
      if (els.name) els.name.innerText = 'Boutique fermée ou inexistante';
      return;
    }
    var data = doc.data();
    currentShopData = data || {};
    if (els.name)     els.name.innerText    = data.name || 'Boutique';
    if (els.slogan)   els.slogan.innerText  = data.slogan || '';
    if (els.desc)     els.desc.innerText    = data.description || 'Bienvenue dans notre galerie.';
    if (els.banner && data.banner) els.banner.src = data.banner;
    if (els.logo   && data.logo)   els.logo.src   = data.logo;
    if (els.verified && data.status === 'active') els.verified.style.display = 'inline-flex';

    if (els.contactBtn) {
      els.contactBtn.addEventListener('click', function () {
        if (typeof window.initChatModalBindings === 'function') window.initChatModalBindings();
        if (typeof window.openSellerChat !== 'function') {
          if (window.showToast) window.showToast('Messagerie indisponible pour le moment.', 'danger');
          return;
        }
        window.openSellerChat({
          shopId:     shopId,
          sellerId:   data.ownerId || data.sellerId || data.ownerUid || data.userId || '',
          shopName:   data.name || 'Boutique',
          sellerName: data.ownerName || data.sellerName || data.name || 'Vendeur',
        }).catch(function (err) {
          if (window.showToast) window.showToast(err.message || 'Impossible d\'ouvrir la conversation.', 'danger');
        });
      });
    }
  });

  // Produits
  db.collection('products').where('shopId', '==', shopId).get().then(function (snap) {
    if (!els.grid) return;
    els.grid.innerHTML = '';
    if (snap.empty) {
      els.grid.innerHTML = '<p class="bp-msg">Cette boutique n\'a pas encore ajouté de pièces.</p>';
      return;
    }
    snap.forEach(function (doc) {
      var p = Object.assign({ id: doc.id }, doc.data());
      allShopProducts.push(p);
      renderBoutiqueCard(p, els.grid);
    });
    if (window.lucide) lucide.createIcons();
  });

  function renderBoutiqueCard(p, container) {
    var price    = new Intl.NumberFormat('fr-FR').format(p.price);
    var img      = p.imageURL || p.image || (p.images && p.images[0]) || 'assets/img/placeholder-product-1.svg';
    var shopName = p.shopName || 'Aurum';
    var isFav    = typeof isInWishlist === 'function' ? isInWishlist(p.id) : false;
    var div = document.createElement('div');
    div.innerHTML =
      '<a href="product.html?id=' + p.id + '" class="bp-card">'
      + '<div class="bp-card-img-wrap">'
        + '<button class="bp-card-wishlist' + (isFav ? ' active' : '') + '" type="button" onclick="event.stopPropagation();event.preventDefault();if(typeof toggleWishlist===\'function\')toggleWishlist(event,\'' + p.id + '\');return false;">'
          + '<i data-lucide="heart" style="width:16px;height:16px;fill:' + (isFav ? 'currentColor' : 'none') + '"></i>'
        + '</button>'
        + '<img src="' + img + '" alt="' + (p.name||'Produit') + '" class="bp-card-img">'
      + '</div>'
      + '<div class="bp-card-body">'
        + '<span class="bp-card-brand">' + shopName + '</span>'
        + '<h3 class="bp-card-title">' + (p.name||'Pièce Unique') + '</h3>'
        + '<div class="bp-card-rating">★★★★★</div>'
        + '<div class="bp-card-footer">'
          + '<span class="bp-card-price">' + price + ' FCFA</span>'
          + '<button class="bp-card-add" type="button" onclick="event.stopPropagation();event.preventDefault();if(typeof addToCart===\'function\')addToCart(\'' + p.id + '\');return false;">'
            + '<i data-lucide="shopping-bag" style="width:14px;height:14px"></i> Ajouter'
          + '</button>'
        + '</div>'
      + '</div>'
    + '</a>';
    container.appendChild(div.firstElementChild);
  }

  // Recherche
  if (els.search) {
    els.search.addEventListener('input', function (e) {
      var term = e.target.value.toLowerCase();
      if (!els.grid) return;
      els.grid.innerHTML = '';
      var filtered = allShopProducts.filter(function (p) {
        return (p.name || '').toLowerCase().includes(term);
      });
      if (!filtered.length) {
        els.grid.innerHTML = '<p class="bp-msg">Aucune pièce ne correspond à votre recherche.</p>';
      } else {
        filtered.forEach(function (p) { renderBoutiqueCard(p, els.grid); });
        if (window.lucide) lucide.createIcons();
      }
    });
  }
});
