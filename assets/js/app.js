"use strict";

/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — app.js  v3
 * Logique client : panier, wishlist, fiche produit, catalogue
 * ═══════════════════════════════════════════════════════════════
 * À charger APRÈS config.js
 * ═══════════════════════════════════════════════════════════════
 */

// ── GUARD : window.Store disponible (hydraté par data.js ou config.js) ──
const Store = window.Store || {};

// Cache Firestore pour les produits
window.allProducts = window.allProducts || [];

// ── HELPERS ───────────────────────────────────────────────────────

/** Garantit que productId est toujours une string. */
function safeProductId(id) {
  return String(id || '').trim();
}

// ── PANIER ────────────────────────────────────────────────────────

function getCartItems() {
  try {
    const raw  = localStorage.getItem('ac_cart') || '[]';
    const cart = JSON.parse(raw);
    return cart
      .filter(item => item && item.product && item.product.id)
      .map(item => ({
        product:  item.product,
        quantity: parseInt(item.quantity || item.qty || 1, 10),
      }));
  } catch { return []; }
}

function addToCart(productIdOrObj, qty = 1, productObj = null) {
  // Permettre addToCart(event, productId) depuis les onclick inline
  if (productIdOrObj && typeof productIdOrObj === 'object' && typeof productIdOrObj.preventDefault === 'function') {
    productIdOrObj.preventDefault();
    productIdOrObj.stopPropagation();
    productIdOrObj = qty;
    qty = 1;
    productObj = null;
  }
  // addToCart(productObj) sans id séparé
  if (productIdOrObj && typeof productIdOrObj === 'object' && !productObj) {
    productObj    = productIdOrObj;
    productIdOrObj = productObj.id;
  }
  const pid = safeProductId(productIdOrObj || productObj?.id);
  if (!pid) { window.showToast('Produit invalide', 'danger'); return; }

  // Chercher le produit dans toutes les sources
  const storeProds = Array.isArray(window.Store?.products) ? window.Store.products : [];
  let prod = storeProds.find(p => safeProductId(p.id) === pid)
          || (window.allProducts || []).find(p => safeProductId(p.id) === pid);
  if (!prod && window.currentProduct && safeProductId(window.currentProduct.id) === pid) prod = window.currentProduct;
  if (!prod && productObj && safeProductId(productObj.id) === pid) prod = productObj;

  if (!prod) { window.showToast('Produit introuvable', 'danger'); return; }

  // Assurer la cohérence shopId
  if (!prod.shopId && prod.sellerId) prod = { ...prod, shopId: prod.sellerId };

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('ac_cart') || '[]').filter(i => i?.product?.id); }
  catch { cart = []; }

  const existing = cart.find(i => safeProductId(i.product.id) === pid);
  if (existing) {
    existing.quantity = (existing.quantity || existing.qty || 0) + qty;
    existing.qty      = existing.quantity;
  } else {
    cart.push({ pid, product: prod, quantity: qty, qty });
  }
  localStorage.setItem('ac_cart', JSON.stringify(cart));
  window.updateCartBadge?.();
}

function updateCartQty(productId, newQty) {
  const pid  = safeProductId(productId);
  let   cart = [];
  try { cart = JSON.parse(localStorage.getItem('ac_cart') || '[]'); } catch { return; }
  const item = cart.find(i => safeProductId(i.product?.id) === pid);
  if (item) { item.quantity = Math.max(1, newQty); item.qty = item.quantity; }
  localStorage.setItem('ac_cart', JSON.stringify(cart));
  window.updateCartBadge?.();
}

function removeFromCart(productId) {
  const pid  = safeProductId(productId);
  let   cart = [];
  try { cart = JSON.parse(localStorage.getItem('ac_cart') || '[]'); } catch { return; }
  localStorage.setItem('ac_cart', JSON.stringify(cart.filter(i => safeProductId(i.product?.id) !== pid)));
  window.updateCartBadge?.();
}

function clearCart() {
  localStorage.removeItem('ac_cart');
  window.updateCartBadge?.();
}

// ── WISHLIST ──────────────────────────────────────────────────────

function isInWishlist(productId) {
  const pid = safeProductId(productId);
  try { return JSON.parse(localStorage.getItem('ac_wishlist') || '[]').some(id => String(id) === pid); }
  catch { return false; }
}

function toggleWishlist(productIdOrEvent, productIdFallback) {
  let pid;
  if (productIdOrEvent && typeof productIdOrEvent === 'object' && typeof productIdOrEvent.preventDefault === 'function') {
    productIdOrEvent.preventDefault();
    productIdOrEvent.stopPropagation();
    pid = safeProductId(productIdFallback);
    if (productIdOrEvent.currentTarget) {
      const isWl = isInWishlist(pid);
      productIdOrEvent.currentTarget.classList.toggle('active', !isWl);
    }
  } else {
    pid = safeProductId(productIdOrEvent);
  }
  if (!pid) return false;
  let wl = [];
  try { wl = JSON.parse(localStorage.getItem('ac_wishlist') || '[]'); } catch { wl = []; }
  const idx = wl.findIndex(id => String(id) === pid);
  if (idx > -1) wl.splice(idx, 1); else wl.push(pid);
  localStorage.setItem('ac_wishlist', JSON.stringify(wl));
  return isInWishlist(pid);
}

function clearWishlist() {
  localStorage.removeItem('ac_wishlist');
}

// ── LOAD PRODUCTS (page d'accueil) ────────────────────────────────

async function loadProducts() {
  const container = document.getElementById('products-container');
  if (!container || !window.db) return;

  container.innerHTML = '<p style="padding:40px;text-align:center;color:#7A7570">Chargement…</p>';

  try {
    const snap = await window.db.collection('products')
      .orderBy('createdAt', 'desc').limit(8).get();

    if (snap.empty) { container.innerHTML = '<p style="padding:40px;text-align:center">Aucun produit disponible.</p>'; return; }

    window.allProducts = [];
    let html = '';
    snap.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      window.allProducts.push(p);
      const img  = p.image || (Array.isArray(p.images) && p.images[0]) || 'assets/img/placeholder.png';
      const inWl = isInWishlist(doc.id);
      html += `
        <div class="product-card-glass" onclick="window.location.href='product.html?id=${doc.id}'">
          <div class="card-image-header">
            <button class="wishlist-btn${inWl ? ' active' : ''}" type="button"
              onclick="event.stopPropagation();toggleWishlist(event,'${doc.id}');return false;">
              <i data-lucide="heart"></i>
            </button>
            <img src="${img}" alt="${p.name || 'Produit Sanhia'}" loading="lazy">
          </div>
          <div class="card-content">
            <small class="brand">${p.shopName || 'Boutique'}</small>
            <h3 class="title">${p.name || 'Produit Sanhia'}</h3>
            <div class="card-footer">
              <span class="price">${window.formatFCFA(p.price)}</span>
            </div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('[app.js] loadProducts:', err);
    container.innerHTML = '<p style="padding:40px;text-align:center;color:#D94F4F">Erreur de chargement.</p>';
  }
}

// ── PANIER PAGE ────────────────────────────────────────────────────

function initCart() {
  // Support des deux structures de page (cart.html Awwwards + ancienne)
  const itemsEl     = document.getElementById('cart-items-list') || document.getElementById('cart-items');
  const clearBtn    = document.getElementById('clear-cart-btn');
  const promoInput  = document.getElementById('promo-code');
  const applyPromo  = document.getElementById('apply-promo-btn');

  if (!itemsEl) return;

  let appliedPromo = null;

  function getShipping() { return { name: 'Standard', fee: 0, msg: 'Déterminé par le livreur' }; }

  function computeDiscount(sub) {
    return appliedPromo ? Math.round(sub * (appliedPromo.percent || 0) / 100) : 0;
  }

  function updateSummary() {
    const items   = getCartItems();
    const count   = items.reduce((s, i) => s + i.quantity, 0);
    const sub     = items.reduce((s, i) => s + (i.product.price || 0) * i.quantity, 0);
    const disc    = computeDiscount(sub);
    const zone    = getShipping();
    const total   = Math.max(0, sub - disc + zone.fee);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('summary-count',    count);
    set('summary-subtotal', window.formatFCFA(sub));
    set('summary-discount', window.formatFCFA(disc));
    set('summary-shipping', zone.msg);
    set('summary-total',    window.formatFCFA(total));
    set('cart-count-label', count);
    set('subtotal-display', window.formatFCFA(sub));
    set('total-display',    window.formatFCFA(total));
  }

  function render() {
    const items = getCartItems();
    if (!items.length) {
      itemsEl.innerHTML = `<div class="card"><p style="padding:20px">
        Votre panier est vide. <a href="catalogue.html">Voir le catalogue</a>
      </p></div>`;
    } else {
      itemsEl.innerHTML = items.map(it => {
        const p   = it.product;
        const pid = safeProductId(p.id);
        const max = parseInt(p.stock || 0, 10) || 999;
        return `
          <div class="card mb-2">
            <div class="info cart-item" data-pid="${pid}" data-stock="${max}" data-price="${p.price || 0}">
              <img src="${(Array.isArray(p.images) && p.images[0]) || p.image || 'assets/img/placeholder.png'}" alt="${p.name}">
              <div>
                <div class="title">${p.name}</div>
                <div class="meta">${p.color || ''} ${p.size ? '· '+p.size : ''} · ${window.formatFCFA(p.price)}</div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                  <button class="qty-btn" data-minus="${pid}">–</button>
                  <span id="val-${pid}">${it.quantity}</span>
                  <button class="qty-btn" data-plus="${pid}" ${it.quantity >= max ? 'disabled' : ''}>+</button>
                  <small style="color:#7A7570">${max} en stock</small>
                </div>
              </div>
              <div>
                <div style="font-weight:700" id="line-${pid}">${window.formatFCFA((p.price || 0) * it.quantity)}</div>
                <button data-remove="${pid}" title="Supprimer" style="background:none;border:none;color:#D94F4F;cursor:pointer;margin-top:8px">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>`;
      }).join('');
      // Bind events
      itemsEl.querySelectorAll('[data-minus]').forEach(btn => btn.addEventListener('click', () => {
        const pid = btn.dataset.minus;
        const val = document.getElementById('val-' + pid);
        const cur = parseInt(val?.textContent || '1', 10);
        const nxt = Math.max(1, cur - 1);
        updateCartQty(pid, nxt);
        if (val) val.textContent = nxt;
        const row = btn.closest('.cart-item');
        const lineEl = document.getElementById('line-' + pid);
        if (lineEl && row) lineEl.textContent = window.formatFCFA((Number(row.dataset.price)||0) * nxt);
        updateSummary();
      }));
      itemsEl.querySelectorAll('[data-plus]').forEach(btn => btn.addEventListener('click', () => {
        const pid  = btn.dataset.plus;
        const val  = document.getElementById('val-' + pid);
        const row  = btn.closest('.cart-item');
        const max  = parseInt(row?.dataset.stock || '999', 10) || 999;
        const cur  = parseInt(val?.textContent || '1', 10);
        if (cur >= max) { window.showToast(`Stock limité : ${max} exemplaires`, 'warning'); return; }
        const nxt  = cur + 1;
        updateCartQty(pid, nxt);
        if (val) val.textContent = nxt;
        if (nxt >= max) btn.disabled = true;
        const lineEl = document.getElementById('line-' + pid);
        if (lineEl && row) lineEl.textContent = window.formatFCFA((Number(row.dataset.price)||0) * nxt);
        updateSummary();
      }));
      itemsEl.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.remove); render();
      }));
    }
    updateSummary();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  if (clearBtn) clearBtn.addEventListener('click', () => { clearCart(); render(); });

  if (promoInput && applyPromo) {
    applyPromo.addEventListener('click', () => {
      const code  = (promoInput.value || '').trim().toUpperCase();
      if (!code) { window.showToast('Entrez un code promo', 'warning'); return; }
      const promos = Array.isArray(window.Store?.promos) ? window.Store.promos : [];
      const promo  = promos.find(p => (p.code || '').toUpperCase() === code);
      if (!promo) { window.showToast('Code promo invalide', 'danger'); return; }
      if (promo.expires && Date.now() > promo.expires) { window.showToast('Code expiré', 'danger'); return; }
      appliedPromo = { code: promo.code, percent: promo.percent };
      localStorage.setItem('ac_last_promo', JSON.stringify(appliedPromo));
      window.showToast(`Code ${promo.code} appliqué (−${promo.percent}%)`, 'success');
      updateSummary();
    });
  }

  render();
}

// ── WISHLIST PAGE ─────────────────────────────────────────────────

function initWishlist() {
  const itemsEl  = document.getElementById('wishlist-items');
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if (!itemsEl) return;

  function render() {
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem('ac_wishlist') || '[]'); } catch { ids = []; }
    if (!ids.length) {
      itemsEl.innerHTML = `<div class="card"><p style="padding:20px">
        Votre wishlist est vide. <a href="catalogue.html">Voir le catalogue</a>
      </p></div>`;
      return;
    }
    // Chercher les produits dans toutes les sources disponibles
    const all = [
      ...((window.Store?.products) || []),
      ...(window.allProducts || []),
    ];
    const items = ids
      .map(id => all.find(p => safeProductId(p.id) === String(id)))
      .filter(Boolean);

    if (!items.length) {
      itemsEl.innerHTML = `<p style="padding:20px;color:#7A7570">
        Produits introuvables dans le catalogue local. <a href="catalogue.html">Catalogue</a>
      </p>`;
      return;
    }

    itemsEl.innerHTML = items.map(p => {
      const pid = safeProductId(p.id);
      const img = (Array.isArray(p.images) && p.images[0]) || p.image || 'assets/img/placeholder.png';
      return `
        <div class="card mb-2">
          <div class="info wishlist-item">
            <img src="${img}" alt="${p.name}">
            <div>
              <div class="title">${p.name}</div>
              <div class="meta">${window.formatFCFA(p.price)}</div>
              <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn">Voir</a>
                <button data-add="${pid}" class="btn btn-dark">Ajouter au panier</button>
                <button data-rm="${pid}" class="btn">Retirer</button>
              </div>
            </div>
            <div style="font-weight:700">${window.formatFCFA(p.price)}</div>
          </div>
        </div>`;
    }).join('');

    itemsEl.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
      addToCart(btn.dataset.add, 1);
      window.showToast('Ajouté au panier', 'success');
    }));
    itemsEl.querySelectorAll('[data-rm]').forEach(btn => btn.addEventListener('click', () => {
      toggleWishlist(btn.dataset.rm); render();
    }));
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  if (clearBtn) clearBtn.addEventListener('click', () => { clearWishlist(); render(); });
  render();
}

// ── INIT PAGE FICHE PRODUIT ───────────────────────────────────────
// NOTE : Le rendu principal de la fiche produit est géré par product.html lui-même.
// Cette fonction s'occupe des boutons panier/wishlist/partage présents dans la page.
function initProduct() {
  const container = document.getElementById('product-detail') || document.getElementById('product-page');
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const id     = params.get('id');
  if (!id) return;

  // Incrémenter les vues Firestore
  if (window.db) {
    window.db.collection('products').doc(id)
      .update({ views: firebase.firestore.FieldValue.increment(1) })
      .catch(() => {});
  }

  // Bouton ajout au panier (délégation si le produit est chargé dynamiquement)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[id="add-cart"], [id="sticky-add-cart"]');
    if (!btn) return;
    const pid = btn.dataset.pid || id;
    if (window.currentProduct) {
      addToCart(pid, 1, window.currentProduct);
    } else {
      addToCart(pid, 1);
    }
    btn.disabled = true;
    btn.textContent = 'Dans le panier ✓';
    window.showToast('Ajouté au panier', 'success');
  });

  // Bouton wishlist
  document.addEventListener('click', e => {
    const btn = e.target.closest('#toggle-wl');
    if (!btn) return;
    const isWl = toggleWishlist(id);
    btn.classList.toggle('active', isWl);
    window.showToast(isWl ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success');
  });

  // Partage
  document.addEventListener('click', e => {
    if (e.target.closest('#share-btn')) window.copyToClipboard(location.href);
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────
function initScrollReveal() {
  // Cibler uniquement les éléments volumineux pour éviter de surcharger l'observer
  const targets = document.querySelectorAll('.rv, section.reveal, .card-reveal');
  if (!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  targets.forEach(el => io.observe(el));
}

// ── VALIDATION FORMULAIRES FR ─────────────────────────────────────
function initFrenchValidation() {
  const msgs = (f) => {
    const v = f.validity, t = (f.type || '').toLowerCase();
    if (v.valueMissing)    return t === 'checkbox' ? 'Cochez cette case.' : t === 'select-one' ? 'Sélectionnez une option.' : 'Champ requis.';
    if (v.typeMismatch)    return t === 'email' ? 'Email invalide.' : t === 'url' ? 'URL invalide.' : 'Valeur invalide.';
    if (v.tooShort)        return `Minimum ${f.minLength} caractères.`;
    if (v.tooLong)         return `Maximum ${f.maxLength} caractères.`;
    if (v.patternMismatch) return 'Format invalide.';
    if (v.rangeUnderflow)  return `Valeur ≥ ${f.min}.`;
    if (v.rangeOverflow)   return `Valeur ≤ ${f.max}.`;
    return 'Vérifiez ce champ.';
  };
  document.addEventListener('invalid', e => {
    const f = e.target;
    if (f.tagName && ['INPUT','TEXTAREA','SELECT'].includes(f.tagName)) f.setCustomValidity(msgs(f));
  }, true);
  document.addEventListener('input',  e => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); }, true);
  document.addEventListener('change', e => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); }, true);
}

// ── ROUTING AUTOMATIQUE ───────────────────────────────────────────
// Un seul DOMContentLoaded, tout centralisé.
document.addEventListener('DOMContentLoaded', () => {

  // Panier
  if (document.getElementById('cart-items-list') || document.getElementById('cart-items')) initCart();

  // Wishlist
  if (document.getElementById('wishlist-items')) initWishlist();

  // Fiche produit
  if (document.getElementById('product-detail') || document.getElementById('product-page')) initProduct();

  // Page d'accueil
  if (document.getElementById('products-container')) loadProducts();

  // Badge panier universel (cart-count ET cart-badge)
  window.updateCartBadge?.();

  // Animations
  initScrollReveal();

  // Validation FR
  initFrenchValidation();

  // Icônes
  if (typeof lucide !== 'undefined') lucide.createIcons();
  window.fixLucideIcons?.();

});

// ── EXPORTS GLOBAUX ───────────────────────────────────────────────
window.addToCart       = addToCart;
window.removeFromCart  = removeFromCart;
window.updateCartQty   = updateCartQty;
window.clearCart       = clearCart;
window.getCartItems    = getCartItems;
window.toggleWishlist  = toggleWishlist;
window.isInWishlist    = isInWishlist;
window.clearWishlist   = clearWishlist;
window.loadProducts    = loadProducts;

console.log("✅ app.js v3 chargé");