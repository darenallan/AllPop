/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — prime.js   v2
 * Scripts page-spécifiques — design system Awwwards
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ORDRE DE CHARGEMENT RECOMMANDÉ :
 *   1. firebase-app-compat.js / auth / firestore / storage
 *   2. config.js          → Firebase, window.auth, window.db, showToast,
 *                            updateCartBadge, Auth, AuthWall, formatFCFA
 *   3. header.js          → injecte le header, gère le cursor, cart badge
 *   4. footer.js          → injecte le footer, newsletter
 *   5. categories.js      → aurumCategories, getCategorySelection
 *   6. messaging.js       → openSellerChat, subscribeUserChats …
 *   7. admin.js           → dashboard vendeur (seller.html uniquement)
 *   8. app.js             → panier, wishlist, produits (pages client)
 *   9. prime.js  ← CE FICHIER
 *
 * STRUCTURE :
 *   §0  Cursor universel (module partagé)
 *   §1  Reveal on scroll universel
 *   §2  404.html
 *   §3  aide.html  (A.html — FAQ / CGU / Mentions légales)
 *   §4  apropos.html
 *   §5  boutique-list.html
 *   §6  boutique.html
 *   §7  cart.html     (logique Firestore & checkout)
 *   §8  catalogue.html
 *   §9  contact.html
 *   §10 delivery.html
 *   §11 index.html
 *   §12 login.html
 *   §13 messages.html
 *   §14 product.html  (fiche produit Firestore)
 *   §15 profile.html
 *   §16 register.html
 *   §17 seller-application.html
 *   §18 seller-onboarding.html
 *   §19 seller.html   (dashboard vendeur alternatif)
 *   §20 wishlist.html
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   §0  CURSOR UNIVERSEL
   Fonctionne sur toutes les pages qui ont #cur-ring / #cur-dot
   Préfixes supportés : cur, bp, ct, lg, pr, rg, wl, sd, dv, ch
   ══════════════════════════════════════════════════════════ */
(function initCursor() {
  // IDs possibles selon la page
  const PAIRS = [
    ['cur-ring', 'cur-dot'],
    ['bp-ring',  'bp-dot'],
    ['ct-ring',  'ct-dot'],
    ['lg-ring',  'lg-dot'],
    ['pr-ring',  'pr-dot'],
    ['rg-ring',  'rg-dot'],
    ['wl-ring',  'wl-dot'],
    ['sd-ring',  'sd-dot'],
    ['dv-ring',  'dv-dot'],
  ];

  // Classes hover possibles
  const HOVER_CLASSES = {
    'cur-ring': 'cur-h', 'bp-ring': 'bp-h', 'ct-ring': 'ct-h',
    'lg-ring':  'lg-h',  'pr-ring': 'pr-h', 'rg-ring': 'rg-h',
    'wl-ring':  'wl-h',  'sd-ring': 'sd-h', 'dv-ring': 'dv-h',
  };

  const HOVER_SEL = 'a,button,input,select,textarea,[onclick],[data-h],.bp-card,.inbox-conv-item,.color-swatch,.so-why-card,.so-req-card,.so-ps';

  let mx = 0, my = 0, rx = 0, ry = 0;
  let ringEl = null, dotEl = null, hoverClass = 'cur-h';
  let animStarted = false;

  function findElements() {
    for (const [rId, dId] of PAIRS) {
      const r = document.getElementById(rId);
      const d = document.getElementById(dId);
      if (r && d) {
        ringEl = r; dotEl = d;
        hoverClass = HOVER_CLASSES[rId] || 'cur-h';
        return true;
      }
    }
    return false;
  }

  function loop() {
    if (!ringEl) return;
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ringEl.style.left = rx + 'px';
    ringEl.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  }

  function start() {
    if (!findElements()) return;     // pas de cursor sur cette page
    if (animStarted) return;
    animStarted = true;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (dotEl) { dotEl.style.left = mx + 'px'; dotEl.style.top = my + 'px'; }
    });
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(HOVER_SEL)) document.body.classList.add(hoverClass);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(HOVER_SEL)) document.body.classList.remove(hoverClass);
    });

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();


/* ══════════════════════════════════════════════════════════
   §1  REVEAL ON SCROLL UNIVERSEL
   Observe tous les éléments .rv et ajoute .on à l'intersection
   ══════════════════════════════════════════════════════════ */
(function initReveal() {
  function run() {
    const els = document.querySelectorAll('.rv');
    if (!els.length) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
})();


/* ══════════════════════════════════════════════════════════
   §2  404.html
   Aucune logique supplémentaire — cursor + reveal suffisent.
   ══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════
   §3  aide.html  (anciennement A.html — FAQ / CGU / Mentions)
   ══════════════════════════════════════════════════════════ */
(function initAide() {
  var page = document.getElementById('hl-page') || document.querySelector('.hl-hero');
  if (!page) return;

  /* ── Tabs navigation ── */
  function switchTab(name) {
    document.querySelectorAll('.hl-tab').forEach(function (t) { t.classList.remove('on'); });
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('on'); });
    var tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('on');
    document.querySelectorAll('[data-tab="' + name + '"]').forEach(function (b) { b.classList.add('on'); });
    if (window.innerWidth < 1024) {
      var main = document.querySelector('.hl-main');
      if (main) main.scrollIntoView({ behavior: 'smooth' });
    }
  }
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });

  /* ── FAQ Accordion avec animation fluide ── */
  function ease(t) { return t < 0.5 ? 8*t*t*t*t : 1 - 8*(--t)*t*t*t; }
  function animH(el, from, to, dur, done) {
    var s = performance.now();
    (function step(now) {
      var p = Math.min((now - s) / dur, 1);
      el.style.maxHeight = from + (to - from) * ease(p) + 'px';
      p < 1 ? requestAnimationFrame(step) : (done && done());
    })(s);
  }

  document.querySelectorAll('.hl-faq-item').forEach(function (item) {
    var btn   = item.querySelector('.hl-faq-q');
    var ans   = item.querySelector('.hl-faq-a');
    var inner = item.querySelector('.hl-faq-a-inner');
    if (!btn || !ans || !inner) return;

    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');

      // Fermer les autres
      document.querySelectorAll('.hl-faq-item.open').forEach(function (other) {
        if (other === item) return;
        var oa   = other.querySelector('.hl-faq-a');
        var from = parseFloat(oa.style.maxHeight) || oa.scrollHeight;
        other.classList.remove('open');
        oa.style.opacity = '0';
        other.querySelector('.hl-faq-q').setAttribute('aria-expanded', 'false');
        animH(oa, from, 0, 300, function () { oa.style.maxHeight = '0'; });
      });

      if (open) {
        var from = parseFloat(ans.style.maxHeight) || ans.scrollHeight;
        item.classList.remove('open');
        ans.style.opacity = '0';
        btn.setAttribute('aria-expanded', 'false');
        animH(ans, from, 0, 300, function () { ans.style.maxHeight = '0'; });
      } else {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var to = inner.scrollHeight + 48;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            ans.style.opacity = '1';
            animH(ans, 0, to, 420, function () { ans.style.maxHeight = 'none'; });
          });
        });
      }
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
})();


/* ══════════════════════════════════════════════════════════
   §4  apropos.html
   ══════════════════════════════════════════════════════════ */
(function initApropos() {
  if (!document.querySelector('.ab-hero')) return;

  /* Compteurs animés depuis Firebase */
  function loadAproposStats() {
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
      var avg = rCount > 0 ? (totalRating / rCount).toFixed(1) : 4.5;
      setTarget('stats-products', prodsSnap.size || 500);
      setTarget('stats-shops',    shopsSnap.size || 25);
      setTarget('stats-rating',   avg);
    }).catch(setFallback);
  }

  function setFallback() {
    setTarget('stats-products', 500);
    setTarget('stats-shops',    25);
    setTarget('stats-rating',   4.5);
  }
  function setTarget(id, v) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('data-target', v);
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

  loadAproposStats();
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animCounter(e.target); cObs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  // Lance après chargement des stats
  setTimeout(function () {
    document.querySelectorAll('.counter').forEach(function (c) { cObs.observe(c); });
  }, 400);
})();

/* ══════════════════════════════════════════════════════════
   §5  boutique-list.html
   ══════════════════════════════════════════════════════════ */
(function initBoutiqueList() {
  var grid = document.getElementById('shops-grid');
  if (!grid) return;

  var FALLBACK_CATS = [
    'Mode & Accessoires','Beauté, Hygiène & Bien-être',
    'Électronique, Téléphonie & Informatique','Maison, Meubles & Décoration',
    'Bâtiment, Quincaillerie & Matériaux','Véhicules & Mobilité','Restauration & Boissons',
  ];
  var FALLBACK_SHOPS = [
    {id:'test-mode',   name:'Mode & Accessoires',   description:'Tendances premium.',              category:'Mode & Accessoires'},
    {id:'test-beaute', name:'Beauté & Bien-être',    description:'Cosmétiques d\'exception.',       category:'Beauté, Hygiène & Bien-être'},
    {id:'test-electro',name:'Électronique',          description:'High-Tech et téléphonie.',        category:'Électronique, Téléphonie & Informatique'},
  ];

  function renderShops(list) {
    if (!list || !list.length) {
      grid.innerHTML = '<div class="bl-empty" style="grid-column:1/-1"><h3 class="bl-empty-title">Aucune galerie trouvée</h3><p class="bl-empty-sub">Pas encore de boutiques dans cette catégorie.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function (shop, idx) {
      var logo   = shop.logo || shop.image || 'assets/img/placeholder-urban.svg';
      var banner = [shop.cover, shop.coverUrl, shop.banner, shop.bannerUrl, 'assets/img/cover.png']
                     .find(function (v) { return typeof v === 'string' && v.trim().length > 0; });
      var hasLogo = !!(shop.logo || shop.image);
      return '<a href="boutique.html?id=' + shop.id + '" class="bl-card" style="transition-delay:' + (idx * 0.05) + 's">'
        + '<div class="bl-card-banner" style="background-image:linear-gradient(135deg,rgba(11,10,8,.18),rgba(11,10,8,.42)),url(\'' + banner + '\');background-size:cover;background-position:center"></div>'
        + '<div class="bl-card-avatar">'
          + (hasLogo ? '<img src="' + logo + '" alt="' + (shop.name||'Boutique') + '" onerror="this.style.display=\'none\'">'
                     : '<i data-lucide="store"></i>')
        + '</div>'
        + '<div class="bl-card-body">'
          + '<span class="bl-card-cat">' + (shop.category||'Catégorie') + '</span>'
          + '<h3 class="bl-card-name">' + (shop.name||'Boutique') + '</h3>'
          + '<p class="bl-card-desc">' + (shop.description||'Visitez notre vitrine pour découvrir nos collections.') + '</p>'
          + '<div class="bl-card-footer"><span class="bl-card-btn">Explorer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></span></div>'
        + '</div></a>';
    }).join('');

    setTimeout(function () {
      document.querySelectorAll('.bl-card').forEach(function (el) { el.classList.add('on'); });
    }, 50);
    if (window.lucide) lucide.createIcons();
  }

  // Firebase check
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    renderShops(FALLBACK_SHOPS);
    return;
  }

  var db  = firebase.firestore();
  var sel = document.getElementById('category-filter');
  if (!sel) return;

  // Charger catégories
  db.collection('categories').get()
    .then(function (snap) {
      var cats = [];
      snap.forEach(function (d) { cats.push(d.data().name); });
      var all = cats.length ? cats : FALLBACK_CATS;
      sel.innerHTML = '<option value="">Toutes les galeries</option>'
        + all.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    })
    .catch(function () {
      sel.innerHTML = '<option value="">Toutes les galeries</option>'
        + FALLBACK_CATS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    });

  function loadShops(filterCat) {
    grid.innerHTML = '<div class="bl-loader" style="grid-column:1/-1"><span class="bl-loader-ring"></span><p class="bl-loader-txt">Recherche en cours</p></div>';
    var ref = filterCat ? db.collection('shops').where('category', '==', filterCat) : db.collection('shops');
    ref.get()
      .then(function (snap) {
        var shops = [];
        snap.forEach(function (d) { shops.push(Object.assign({ id: d.id }, d.data())); });
        renderShops(shops.length ? shops : (filterCat ? [] : FALLBACK_SHOPS));
      })
      .catch(function () { renderShops(filterCat ? [] : FALLBACK_SHOPS); });
  }

  sel.addEventListener('change', function (e) { loadShops(e.target.value || ''); });
  loadShops('');

  // Logout dans drawer (délegation — header.js gère déjà, garde en sécurité)
  var logoutBtn = document.getElementById('mobile-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      firebase.auth().signOut().then(function () { window.location.href = 'login.html'; });
    });
  }
})();


/* ══════════════════════════════════════════════════════════
   §6  boutique.html  (page profil d'une boutique)
   ══════════════════════════════════════════════════════════ */
(function initBoutique() {
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
})();


/* ══════════════════════════════════════════════════════════
   §7  cart.html  — logique Firestore complète
   ══════════════════════════════════════════════════════════ */
(function initCart() {
  // Guard : uniquement sur cart.html
  if (!document.getElementById('ct')) return;

  if (!firebase.apps || !firebase.apps.length) {
    var loadEl = document.getElementById('loading');
    if (loadEl) loadEl.innerHTML = '<p style="color:#D94F4F;text-align:center;padding:40px;font-family:Syne,sans-serif">Firebase non initialisé.</p>';
    return;
  }

  var db   = firebase.firestore();
  var auth = firebase.auth();

  var loadingEl       = document.getElementById('loading');
  var emptyEl         = document.getElementById('cart-empty');
  var contentEl       = document.getElementById('cart-content');
  var listEl          = document.getElementById('cart-items-list');
  var countLabel      = document.getElementById('cart-count-label');
  var subtotalEl      = document.getElementById('subtotal-display');
  var totalEl         = document.getElementById('total-display');
  var checkoutBtn     = document.getElementById('btn-checkout');
  var shippingFeeEl   = document.getElementById('shipping-fee-display');
  var addressSelectEl = document.getElementById('delivery-address-select');
  var shippingNoteEl  = document.getElementById('shipping-note');

  var shippingRates = null, currentShippingFee = 0, currentAddress = null;
  var addressById = new Map();
  var cartProductsData = [];
  var cart = [];

  /* — Lire le cart localStorage — */
  try {
    var raw = localStorage.getItem('ac_cart');
    var rawCart = raw ? JSON.parse(raw) : [];
    cart = (Array.isArray(rawCart) ? rawCart : []).map(function (item) {
      if (!item) return null;
      if (item.pid) return item;
      if (item.product && item.product.id) return { pid: String(item.product.id), qty: item.quantity || 1, product: item.product };
      return null;
    }).filter(Boolean);
    if (cart.length !== rawCart.length) localStorage.setItem('ac_cart', JSON.stringify(cart));
  } catch (e) { localStorage.removeItem('ac_cart'); cart = []; }

  if (!cart.length) { showEmpty(); if (checkoutBtn) checkoutBtn.disabled = true; return; }

  /* — Charger depuis localStorage si produits présents — */
  var localProds = cart.filter(function (i) { return i.product && i.product.id; });
  if (localProds.length === cart.length) {
    cartProductsData = localProds.map(function (i) {
      return Object.assign({}, i.product, { shopId: i.product.shopId || i.product.sellerId || null, qty: parseInt(i.qty || i.quantity, 10) || 1 });
    });
    renderCart();
  } else {
    if (loadingEl) loadingEl.classList.add('show');
    Promise.all(cart.map(function (item) {
      return db.collection('products').doc(item.pid).get()
        .then(function (doc) { return { doc: doc }; })
        .catch(function () { return { doc: null }; });
    })).then(function (results) {
      results.forEach(function (r) {
        if (r.doc && r.doc.exists) {
          var pd = r.doc.data();
          var ci = cart.find(function (i) { return i.pid === r.doc.id; });
          cartProductsData.push(Object.assign({ id: r.doc.id }, pd, {
            shopId: pd.shopId || pd.sellerId || null,
            qty: ci ? parseInt(ci.qty || ci.quantity, 10) || 1 : 1,
          }));
        }
      });
      if (!cartProductsData.length) showEmpty();
      else renderCart();
    }).catch(function () {
      if (loadingEl) loadingEl.innerHTML = '<div style="text-align:center;padding:60px"><p style="color:#D94F4F;font-family:Syne,sans-serif">Erreur de chargement.</p></div>';
    });
  }

  function showEmpty() {
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl)   emptyEl.classList.add('show');
    if (contentEl) contentEl.classList.remove('show');
  }

  function ctFmt(n) { return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'; }

  function recalcTotal() {
    var total = 0, count = 0;
    document.querySelectorAll('.ct-item').forEach(function (row) {
      var price = Number(row.getAttribute('data-price') || 0);
      var qtyEl = row.querySelector('.ct-qty-val');
      var qty   = parseInt(qtyEl ? qtyEl.textContent : '1', 10) || 1;
      total += price * qty;
      count += qty;
    });
    if (subtotalEl) subtotalEl.textContent = ctFmt(total);
    if (totalEl)    totalEl.textContent    = ctFmt(total + (currentShippingFee || 0));
    if (countLabel) countLabel.textContent = count;
    if (checkoutBtn) checkoutBtn.disabled  = count === 0;
  }

  function renderCart() {
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl)   emptyEl.classList.remove('show');
    if (contentEl) contentEl.classList.add('show');
    if (!listEl)   return;
    listEl.innerHTML = '';

    cartProductsData.forEach(function (p, idx) {
      var qty      = parseInt(p.qty || p.quantity, 10) || 1;
      var price    = Number(String(p.price || 0).replace(/[^\d.-]/g, '')) || 0;
      var maxStock = parseInt(p.stock || 0, 10) || 999;
      var lineTotal = price * qty;
      var img = p.image || (p.images && p.images.length ? p.images[0] : 'assets/img/placeholder-product-1.svg');

      var div = document.createElement('div');
      div.className = 'ct-item';
      div.setAttribute('data-product-id', p.id);
      div.setAttribute('data-price',      price);
      div.setAttribute('data-stock',      maxStock);
      div.innerHTML =
        '<a href="product.html?id=' + p.id + '" class="ct-item-img-wrap">'
          + '<img src="' + img + '" class="ct-item-img" alt="' + (p.name||'') + '" onerror="this.src=\'assets/img/placeholder-product-1.svg\'">'
        + '</a>'
        + '<div class="ct-item-body">'
          + (p.category ? '<span class="ct-item-cat">' + p.category + '</span>' : '')
          + '<a href="product.html?id=' + p.id + '" class="ct-item-name">' + (p.name||'Produit sans nom') + '</a>'
          + (p.shopName ? '<span class="ct-item-shop">' + p.shopName + '</span>' : '')
          + '<span class="ct-item-unit">' + new Intl.NumberFormat('fr-FR').format(price) + ' FCFA / unité</span>'
        + '</div>'
        + '<div class="ct-item-right">'
          + '<span class="ct-item-total" id="line-total-' + p.id + '">' + new Intl.NumberFormat('fr-FR').format(lineTotal) + ' FCFA</span>'
          + '<div class="ct-qty">'
            + '<button class="ct-qty-btn" onclick="ctUpdateQty(\'' + p.id + '\',-1)">−</button>'
            + '<span class="ct-qty-val" id="qty-' + p.id + '">' + qty + '</span>'
            + '<button class="ct-qty-btn" onclick="ctUpdateQty(\'' + p.id + '\',1)"' + (qty >= maxStock ? ' disabled' : '') + '>+</button>'
          + '</div>'
          + '<button class="ct-del" onclick="ctRemoveItem(\'' + p.id + '\')" title="Supprimer">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
          + '</button>'
        + '</div>';
      listEl.appendChild(div);
      setTimeout(function () { div.classList.add('on'); }, 60 + idx * 80);
    });

    recalcTotal();
    if (window.updateCartBadge) window.updateCartBadge();
  }

  /* — Qty & remove globaux — */
  window.ctUpdateQty = function (productId, delta) {
    var row    = document.querySelector('.ct-item[data-product-id="' + productId + '"]');
    var qtyEl  = document.getElementById('qty-' + productId);
    var item   = cartProductsData.find(function (p) { return p.id === productId; });
    if (!row || !qtyEl || !item) return;
    var maxStock = parseInt(row.getAttribute('data-stock') || '999', 10) || 999;
    var cur = parseInt(qtyEl.textContent || '1', 10) || 1;
    var next = cur;
    if (delta > 0) {
      if (cur < maxStock) next = cur + 1;
      else { if (window.showToast) window.showToast('Stock limité à ' + maxStock + '.', 'warning'); return; }
    } else { next = Math.max(1, cur - 1); }
    if (next === cur) return;
    qtyEl.textContent = next;
    item.qty = next;
    var ci = cart.find(function (i) { return i.pid === productId; });
    if (ci) { ci.qty = next; ci.quantity = next; }
    localStorage.setItem('ac_cart', JSON.stringify(cart));
    var price = Number(row.getAttribute('data-price') || 0);
    var ltEl  = document.getElementById('line-total-' + productId);
    if (ltEl) ltEl.textContent = new Intl.NumberFormat('fr-FR').format(price * next) + ' FCFA';
    var plusBtn = row.querySelector('.ct-qty-btn:last-of-type');
    if (plusBtn) plusBtn.disabled = next >= maxStock;
    recalcTotal();
  };

  window.ctRemoveItem = function (productId) {
    var row = document.querySelector('.ct-item[data-product-id="' + productId + '"]');
    if (row) {
      row.style.transition = 'opacity .3s,transform .3s';
      row.style.opacity = '0'; row.style.transform = 'translateX(16px)';
      setTimeout(function () { row.remove(); }, 320);
    }
    cart = cart.filter(function (i) { return i.pid !== productId; });
    cartProductsData = cartProductsData.filter(function (p) { return p.id !== productId; });
    localStorage.setItem('ac_cart', JSON.stringify(cart));
    setTimeout(function () {
      if (!cart.length) showEmpty();
      else recalcTotal();
    }, 340);
    if (window.updateCartBadge) window.updateCartBadge();
  };
  window.updateQuantity = window.ctUpdateQty;
  window.removeItem     = window.ctRemoveItem;
  window.ctClearCart    = function () {
    if (!confirm('Vider tout le panier ?')) return;
    localStorage.removeItem('ac_cart');
    location.reload();
  };

  /* — Shipping — */
  function normCity(v) { return String(v || '').trim(); }
  function getShipFee(city) {
    if (!shippingRates) return null;
    var t = normCity(city).toLowerCase();
    if (!t) return null;
    var k = Object.keys(shippingRates).find(function (kk) { return kk.toLowerCase() === t; });
    return Number(k ? shippingRates[k] : shippingRates['default']) || 0;
  }
  function updateShipUI() {
    if (!shippingRates) {
      if (shippingFeeEl) shippingFeeEl.textContent = 'Tarif indisponible';
      currentShippingFee = 0; recalcTotal(); return;
    }
    if (!currentAddress) {
      if (shippingFeeEl) shippingFeeEl.textContent = 'Sélectionnez une adresse';
      if (shippingNoteEl) shippingNoteEl.textContent = '';
      currentShippingFee = 0; recalcTotal(); return;
    }
    var city = normCity(currentAddress.city);
    var fee  = getShipFee(city);
    if (fee === null) { if (shippingFeeEl) shippingFeeEl.textContent = 'Ville non reconnue'; currentShippingFee = Number(shippingRates['default']) || 0; }
    else              { if (shippingFeeEl) shippingFeeEl.textContent = ctFmt(fee); currentShippingFee = fee; }
    if (shippingNoteEl) shippingNoteEl.textContent = city ? 'Livraison vers ' + city : '';
    localStorage.setItem('ac_checkout_shipping', JSON.stringify({ addressId: currentAddress.id || null, city: currentAddress.city || '', fee: currentShippingFee }));
    recalcTotal();
  }
  function setAddressOptions(addresses) {
    if (!addressSelectEl) return;
    addressById.clear();
    if (!Array.isArray(addresses) || !addresses.length) {
      addressSelectEl.innerHTML = '<option value="">Aucune adresse enregistrée</option>';
      addressSelectEl.disabled = true;
      currentAddress = null; updateShipUI();
      if (shippingNoteEl) shippingNoteEl.innerHTML = '<a href="profile.html">+ Ajouter une adresse</a>';
      return;
    }
    addresses.forEach(function (a) { addressById.set(String(a.id), a); });
    addressSelectEl.disabled = false;
    addressSelectEl.innerHTML = '<option value="">Choisir une adresse</option>'
      + addresses.map(function (a) {
          return '<option value="' + a.id + '">' + [a.name||'Adresse', a.city, a.description].filter(Boolean).join(' · ') + '</option>';
        }).join('');
    var saved = localStorage.getItem('ac_selected_address_id');
    if (saved && addressById.has(saved)) { addressSelectEl.value = saved; currentAddress = addressById.get(saved); }
    else if (addresses.length === 1)     { addressSelectEl.value = addresses[0].id; currentAddress = addresses[0]; }
    else currentAddress = null;
    updateShipUI();
  }
  function loadShipRates() {
    db.collection('shipping_settings').doc('rates').get()
      .then(function (doc) { shippingRates = doc.exists ? doc.data() : null; })
      .catch(function () { shippingRates = null; })
      .finally(function () { updateShipUI(); });
  }
  function loadAddresses(user) {
    if (!user) { if (addressSelectEl) { addressSelectEl.innerHTML = '<option value="">Connectez-vous</option>'; addressSelectEl.disabled = true; } currentAddress = null; updateShipUI(); return; }
    db.collection('users').doc(user.uid).collection('addresses').get()
      .then(function (snap) { setAddressOptions(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })); })
      .catch(function () { if (addressSelectEl) { addressSelectEl.innerHTML = '<option value="">Erreur</option>'; addressSelectEl.disabled = true; } });
  }
  if (addressSelectEl) {
    addressSelectEl.addEventListener('change', function () {
      var id = addressSelectEl.value;
      localStorage.setItem('ac_selected_address_id', id || '');
      currentAddress = id && addressById.has(id) ? addressById.get(id) : null;
      updateShipUI();
    });
  }
  auth.onAuthStateChanged(function (user) { loadAddresses(user); });
  loadShipRates();

  /* — Checkout — */
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function () {
      var user = auth.currentUser || (firebase.auth && firebase.auth().currentUser) || null;
      if (!user) { alert('Veuillez vous connecter pour continuer.'); window.location.href = 'login.html?redirect=cart.html'; return; }
      try {
        checkoutBtn.disabled = true;
        var btnTxt = checkoutBtn.querySelector('.btn-txt');
        if (btnTxt) btnTxt.textContent = 'Traitement…';

        var mainOrderRef   = 'AUR-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        var invoiceNumber  = await getNextInvoiceNumber();
        var subtotal       = cartProductsData.reduce(function (acc, item) { return acc + item.price * item.qty; }, 0);

        var itemsBySeller = {};
        cartProductsData.forEach(function (item) {
          var sid = item.shopId || item.sellerId || 'unknown';
          if (!itemsBySeller[sid]) itemsBySeller[sid] = [];
          itemsBySeller[sid].push(item);
        });

        var sellerIds = Object.keys(itemsBySeller);
        var createdOrderIds = [];

        for (var i = 0; i < sellerIds.length; i++) {
          var sid         = sellerIds[i];
          var sellerItems = itemsBySeller[sid];
          var subRef      = sellerIds.length > 1 ? mainOrderRef + '-' + (i + 1) : mainOrderRef;
          var sellerSub   = sellerItems.reduce(function (acc, it) { return acc + it.price * it.qty; }, 0);
          var sellerFee   = sellerIds.length > 1 ? Math.round((sellerSub / subtotal) * currentShippingFee) : currentShippingFee;

          var orderData = {
            reference: subRef, mainOrderRef: mainOrderRef, invoiceNumber: invoiceNumber,
            userId: user.uid, userEmail: user.email, sellerId: sid,
            items: sellerItems.map(function (it) { return {
              productId: it.id, shopId: it.shopId || it.sellerId || null,
              name: it.name, price: it.price, qty: it.qty, image: it.image || '',
            }; }),
            subtotal: sellerSub, shippingFee: sellerFee, total: sellerSub + sellerFee,
            deliveryAddress: currentAddress || null,
            status: 'pending_admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          };
          var docRef = await db.collection('orders').add(orderData);
          createdOrderIds.push(docRef.id);
        }

        localStorage.setItem('ac_cart_checkout', JSON.stringify({
          orderId: createdOrderIds[0], mainOrderRef: mainOrderRef,
          items: cartProductsData, invoiceNumber: invoiceNumber, reference: mainOrderRef,
        }));
        localStorage.removeItem('ac_cart');
        window.location.href = 'invoice.html?orderId=' + createdOrderIds[0];
      } catch (err) {
        if (window.showToast) window.showToast('Erreur lors de la commande. Réessayez.', 'danger');
        checkoutBtn.disabled = false;
        var btnTxt = checkoutBtn.querySelector('.btn-txt');
        if (btnTxt) btnTxt.textContent = 'Procéder au paiement';
      }
    });
  }

  async function getNextInvoiceNumber() {
    var ref = db.collection('meta').doc('invoiceCounter');
    try {
      return await db.runTransaction(async function (t) {
        var doc = await t.get(ref);
        var next = (doc.exists ? doc.data().value || 0 : 0) + 1;
        t.set(ref, { value: next }, { merge: true });
        return next;
      });
    } catch {
      var c = Number(localStorage.getItem('ac_invoice_counter') || '0') + 1;
      localStorage.setItem('ac_invoice_counter', String(c));
      return c;
    }
  }
})();

/* ══════════════════════════════════════════════════════════
   §8  catalogue.html
   ══════════════════════════════════════════════════════════ */
(function initCatalogue() {
  if (!document.getElementById('catalogue-grid')) return;

  // Utilitaires locaux
  function fmt(n) { return new Intl.NumberFormat('fr-FR').format(n); }
  function skeletons(n) {
    return Array(n).fill(0).map(function () {
      return '<div class="prd-card prd-skeleton"><div class="prd-img-wrap"></div><div class="prd-body"><div class="skel-line" style="width:50%"></div><div class="skel-line" style="width:85%;height:14px"></div><div class="skel-line" style="width:42%;height:12px;margin-top:14px"></div></div></div>';
    }).join('');
  }

  window.toggleFg = function (el) { el.classList.toggle('collapsed'); };

  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
    document.getElementById('catalogue-grid').innerHTML = '<div class="cat-empty"><div class="cat-empty-title">Firebase non initialisé</div></div>';
    return;
  }

  var db          = firebase.firestore();
  var params      = new URLSearchParams(window.location.search);
  var allProducts = [];
  var allColors   = new Set();
  var searchTimer = null;

  var searchInput     = document.getElementById('search-input');
  var searchAuto      = document.getElementById('search-autocomplete');
  var priceMin        = document.getElementById('price-min');
  var priceMax        = document.getElementById('price-max');
  var priceRMin       = document.getElementById('price-range-min');
  var priceRMax       = document.getElementById('price-range-max');
  var locationSel     = document.getElementById('location-select');
  var sortSel         = document.getElementById('sort-select');
  var grid            = document.getElementById('catalogue-grid');
  var activeFiltersDiv= document.getElementById('active-filters');
  var resetBtn        = document.getElementById('reset-filters');
  var toggleBtn       = document.getElementById('toggle-filters');
  var fabBtn          = document.getElementById('mobile-filter-fab');
  var sidebar         = document.getElementById('filters-sidebar');
  var overlay         = document.getElementById('filter-overlay');
  var filtersSlot     = document.getElementById('filters-slot');
  var countEl         = document.getElementById('cat-count-num');

  grid.innerHTML = skeletons(6);

  async function init() {
    try {
      var results      = await Promise.all([db.collection('shops').get(), db.collection('products').get()]);
      var shopsSnap    = results[0], productsSnap = results[1];
      var shopsMap     = new Map();
      shopsSnap.forEach(function (d) { shopsMap.set(d.id, d.data()); });

      if (productsSnap.empty) {
        grid.innerHTML = '<div class="cat-empty"><div class="cat-empty-num">∅</div><div class="cat-empty-title">Catalogue vide</div></div>';
        if (countEl) countEl.textContent = '0';
        return;
      }

      productsSnap.forEach(function (doc) {
        var p    = doc.data();
        var shop = shopsMap.get(p.shopId || '') || {};
        if (p.colors && Array.isArray(p.colors)) p.colors.forEach(function (c) { allColors.add(c); });
        allProducts.push(Object.assign({ id: doc.id, shopId: p.shopId || '', shopName: shop.name || 'Boutique', shopRating: shop.rating || 0, shopCity: shop.city || shop.address || '' }, p));
      });

      if (countEl) countEl.textContent = allProducts.length;

      var prices = allProducts.map(function (p) { return p.price || 0; }).filter(function (p) { return p > 0; });
      var pMin = prices.length ? Math.min.apply(null, prices) : 0;
      var pMax = prices.length ? Math.max.apply(null, prices) : 1000000;
      if (priceMin) { priceMin.value = pMin; priceMin.placeholder = pMin; }
      if (priceMax) { priceMax.value = pMax; priceMax.placeholder = pMax; }
      if (priceRMin) { priceRMin.min = pMin; priceRMin.max = pMax; priceRMin.value = pMin; }
      if (priceRMax) { priceRMax.min = pMin; priceRMax.max = pMax; priceRMax.value = pMax; }

      renderCatFilters();
      if (locationSel) locationSel.addEventListener('change', applyFilters);

      var initialSearch = (params.get('q') || '').trim();
      if (initialSearch && searchInput) searchInput.value = initialSearch;

      var urlCat = params.get('category');
      if (urlCat) {
        setTimeout(function () {
          var cb = Array.from(document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]')).find(function (c) { return c.value === urlCat; });
          if (cb) { cb.checked = true; applyFilters(); }
        }, 150);
      } else { applyFilters(); }

    } catch (err) {
      grid.innerHTML = '<div class="cat-empty"><div class="cat-empty-title">Erreur de chargement</div><div class="cat-empty-sub">' + (err.message || '') + '</div><button class="cat-empty-btn" onclick="location.reload()">Réessayer</button></div>';
    }
  }

  function renderCatFilters() {
    if (typeof window.renderCategoryFilters === 'function') {
      window.renderCategoryFilters('category-filters-dynamic');
      setTimeout(function () {
        document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]').forEach(function (cb) {
          cb.addEventListener('change', applyFilters);
        });
      }, 200);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      var term = e.target.value.trim().toLowerCase();
      clearTimeout(searchTimer);
      if (term.length >= 2) {
        searchTimer = setTimeout(function () { showAuto(term); }, 300);
      } else {
        hideAuto();
        if (!term) applyFilters();
      }
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { hideAuto(); applyFilters(); }
    });
    document.addEventListener('click', function (e) {
      var box = document.getElementById('cat-search-box');
      if (box && !box.contains(e.target)) hideAuto();
    });
  }

  function showAuto(term) {
    if (!searchAuto) return;
    var matches = allProducts.filter(function (p) {
      return (p.name && p.name.toLowerCase().includes(term))
          || (p.category && p.category.toLowerCase().includes(term));
    }).slice(0, 8);
    if (!matches.length) { searchAuto.innerHTML = '<div class="ac-empty">Aucun résultat pour «\u00a0' + term + '\u00a0»</div>'; searchAuto.classList.add('show'); return; }
    searchAuto.innerHTML = matches.map(function (p) {
      var img = (Array.isArray(p.images) ? p.images[0] : null) || p.image || 'assets/img/placeholder-product-1.svg';
      return '<div class="ac-item" onclick="location.href=\'product.html?id=' + p.id + '\'"'
        + '<img class="ac-img" src="' + img + '" alt="" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"/>'
        + '<div><div class="ac-name">' + (p.name||'') + '</div><div class="ac-price">' + fmt(p.price||0) + ' FCFA</div>'
        + (p.category ? '<div class="ac-cat">' + p.category + '</div>' : '') + '</div></div>';
    }).join('');
    searchAuto.classList.add('show');
  }
  function hideAuto() { if (searchAuto) { searchAuto.classList.remove('show'); searchAuto.innerHTML = ''; } }

  function applyFilters() {
    var term  = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var minP  = parseFloat(priceMin ? priceMin.value : 0) || 0;
    var maxP  = parseFloat(priceMax ? priceMax.value : 0) || Infinity;
    var selCats = typeof window.getSelectedCategoryFilters === 'function'
      ? window.getSelectedCategoryFilters()
      : Array.from(document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]:checked')).map(function (c) { return c.value; });
    var r4    = document.getElementById('rating-4plus') && document.getElementById('rating-4plus').checked;
    var r3    = document.getElementById('rating-3plus') && document.getElementById('rating-3plus').checked;
    var selLoc= locationSel ? locationSel.value : '';
    var sortBy= sortSel ? sortSel.value : '';

    var filtered = allProducts.filter(function (p) {
      var pP = parseFloat(p.price) || 0;
      var mSearch = !term || (p.name && p.name.toLowerCase().includes(term)) || (p.category && p.category.toLowerCase().includes(term)) || (p.description && p.description.toLowerCase().includes(term));
      var mPrice  = pP >= minP && pP <= maxP;
      var mCat    = !selCats.length || (p.category && selCats.some(function (c) { return p.category === c || p.category.startsWith(c + ' >'); }));
      var mRating = r4 ? (p.shopRating||0) >= 4 : r3 ? (p.shopRating||0) >= 3 : true;
      var mLoc    = !selLoc || p.shopCity === selLoc;
      return mSearch && mPrice && mCat && mRating && mLoc;
    });

    if (sortBy === 'price-asc')  filtered.sort(function (a, b) { return (a.price||0) - (b.price||0); });
    else if (sortBy === 'price-desc') filtered.sort(function (a, b) { return (b.price||0) - (a.price||0); });
    else if (sortBy === 'popular')    filtered.sort(function (a, b) { return (b.views||0) - (a.views||0); });
    else if (sortBy === 'recent')     filtered.sort(function (a, b) { return ((b.createdAt && b.createdAt.seconds)||0) - ((a.createdAt && a.createdAt.seconds)||0); });

    renderProducts(filtered);
  }
  window.applyFilters = applyFilters;

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML = '<div class="cat-empty"><div class="cat-empty-num">∅</div><div class="cat-empty-title">Aucun résultat</div><div class="cat-empty-sub">Modifiez vos critères.</div><button class="cat-empty-btn" onclick="document.getElementById(\'reset-filters\').click()">Réinitialiser</button></div>';
      return;
    }
    var wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
    grid.innerHTML = products.map(function (p, i) {
      var img    = (Array.isArray(p.images) ? p.images[0] : null) || p.image || 'assets/img/placeholder-product-1.svg';
      var hasDisc= p.originalPrice && p.originalPrice > p.price;
      var disc   = hasDisc ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
      var inWish = wishlist.some(function (w) { return (w.id||w) === p.id; });
      var delay  = 'style="animation-delay:' + (i%6)*0.06 + 's"';
      var safeName = (p.name||'').replace(/'/g, "\\'");
      return '<div class="prd-card rv" ' + delay + '>'
        + '<a href="product.html?id=' + p.id + '">'
          + '<div class="prd-img-wrap">'
            + (hasDisc ? '<span class="prd-disc-badge">-' + disc + '%</span>' : '')
            + '<img class="prd-img" src="' + img + '" alt="' + (p.name||'') + '" loading="lazy" onerror="this.src=\'assets/img/placeholder-product-1.svg\'">'
            + '<div class="prd-overlay"><button class="prd-quick" onclick="event.preventDefault();event.stopPropagation();if(typeof window.quickAdd===\'function\')window.quickAdd(\'' + p.id + '\',\'' + safeName + '\',' + (p.price||0) + ',\'' + img + '\',\'' + p.shopId + '\')"><span>+ Ajouter au panier</span></button></div>'
            + '<button class="prd-wish' + (inWish ? ' on' : '') + '" onclick="event.preventDefault();event.stopPropagation();toggleWish(\'' + p.id + '\',this,\'' + safeName + '\',' + (p.price||0) + ',\'' + img + '\')" title="Favoris"><svg viewBox="0 0 24 24" fill="' + (inWish ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>'
          + '</div></a>'
          + '<div class="prd-body">'
            + '<div class="prd-shop"><a class="prd-shop-name" href="boutique.html?id=' + p.shopId + '">' + p.shopName + '</a></div>'
            + '<a href="product.html?id=' + p.id + '"><div class="prd-name">' + (p.name||'Produit') + '</div></a>'
            + '<div class="prd-price-row"><span class="prd-price">' + fmt(p.price||0) + '<span style="font-size:10px;font-family:\'Syne\';font-weight:400;margin-left:3px">FCFA</span></span>'
              + (hasDisc ? '<span class="prd-price-orig">' + fmt(p.originalPrice) + ' FCFA</span>' : '') + '</div>'
            + (p.shopCity ? '<div class="prd-city">📍 ' + p.shopCity + '</div>' : '')
          + '</div>'
        + '</div>';
    }).join('');

    requestAnimationFrame(function () {
      var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io2.unobserve(e.target); } }); }, { threshold: 0.05 });
      document.querySelectorAll('.prd-card.rv').forEach(function (el) { io2.observe(el); });
    });
  }

  window.quickAdd = function (id, name, price, image, shopId) {
    if (typeof addToCart === 'function') {
      addToCart(String(id), 1, { id: id, name: name, price: price, image: image, shopId: shopId, quantity: 1, variants: {} });
    } else {
      var c = JSON.parse(localStorage.getItem('ac_cart') || '[]');
      var ei = c.findIndex(function (x) { return (x.id||x.productId) === id; });
      if (ei > -1) c[ei].quantity = (c[ei].quantity||1) + 1;
      else c.push({ id: id, name: name, price: price, image: image, shopId: shopId, quantity: 1, variants: {} });
      localStorage.setItem('ac_cart', JSON.stringify(c));
      if (window.updateCartBadge) window.updateCartBadge();
    }
    if (window.showToast) window.showToast('✓ ' + name + ' ajouté au panier', 'success');
  };

  window.toggleWish = function (id, btn, name, price, image) {
    var wish = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
    var idx  = wish.findIndex(function (w) { return (w.id||w) === id; });
    if (idx > -1) { wish.splice(idx, 1); btn.classList.remove('on'); btn.querySelector('svg').setAttribute('fill','none'); if (window.showToast) window.showToast('Retiré des favoris'); }
    else { wish.push({ id: id, name: name, price: price, image: image }); btn.classList.add('on'); btn.querySelector('svg').setAttribute('fill','currentColor'); if (window.showToast) window.showToast('Ajouté aux favoris ♡', 'success'); }
    localStorage.setItem('ac_wishlist', JSON.stringify(wish));
  };

  window.resetPriceFilter = function () {
    var prices = allProducts.map(function (p) { return p.price||0; }).filter(function (p) { return p > 0; });
    var mn = prices.length ? Math.min.apply(null, prices) : 0;
    var mx = prices.length ? Math.max.apply(null, prices) : 1000000;
    if (priceMin)  priceMin.value  = mn;
    if (priceMax)  priceMax.value  = mx;
    if (priceRMin) priceRMin.value = mn;
    if (priceRMax) priceRMax.value = mx;
    applyFilters();
  };
  window.uncheckCat = function (cat) {
    var cb = Array.from(document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]')).find(function (c) { return c.value === cat; });
    if (cb) { cb.checked = false; applyFilters(); }
  };

  if (priceMin)  priceMin.addEventListener('input',  function () { if (priceRMin) priceRMin.value = priceMin.value; applyFilters(); });
  if (priceMax)  priceMax.addEventListener('input',  function () { if (priceRMax) priceRMax.value = priceMax.value; applyFilters(); });
  if (priceRMin) priceRMin.addEventListener('input', function () { if (priceMin) priceMin.value = priceRMin.value; applyFilters(); });
  if (priceRMax) priceRMax.addEventListener('input', function () { if (priceMax) priceMax.value = priceRMax.value; applyFilters(); });
  if (sortSel)   sortSel.addEventListener('change',  applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]').forEach(function (c) { c.checked = false; });
      ['rating-4plus','rating-3plus'].forEach(function (id) { var el = document.getElementById(id); if (el) el.checked = false; });
      if (locationSel) locationSel.value = '';
      window.resetPriceFilter();
    });
  }

  function isSmall() { return window.matchMedia('(max-width:1024px)').matches; }
  function positionSidebar() {
    if (!sidebar) return;
    if (!isSmall()) { if (filtersSlot && sidebar.parentElement !== filtersSlot) filtersSlot.appendChild(sidebar); }
    else { if (sidebar.parentElement !== document.body) document.body.appendChild(sidebar); }
  }
  function openSidebar()  { if (isSmall() && sidebar) sidebar.classList.add('show'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { if (sidebar) sidebar.classList.remove('show'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; }
  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (fabBtn)    fabBtn.addEventListener('click',    openSidebar);
  if (overlay)   overlay.addEventListener('click',   closeSidebar);
  positionSidebar();
  window.addEventListener('resize', positionSidebar);

  init();
})();


/* ══════════════════════════════════════════════════════════
   §9  contact.html
   ══════════════════════════════════════════════════════════ */
(function initContact() {
  if (!document.getElementById('ct') && !document.querySelector('.ct-wrapper')) return;
  // Formulaire de contact (simulation — remplacer par un vrai envoi si besoin)
  window.handleContactSubmit = function (event) {
    event.preventDefault();
    var btn = event.target.querySelector('button[type="submit"]');
    var orig = btn.innerHTML;
    btn.innerHTML = '<span>Envoi en cours…</span>';
    setTimeout(function () {
      if (window.showToast) window.showToast('Message envoyé avec succès. Nous vous contacterons très vite.', 'success');
      else alert('Message envoyé !');
      event.target.reset();
      btn.innerHTML = orig;
    }, 1500);
  };
})();


/* ══════════════════════════════════════════════════════════
   §10 delivery.html  — logique livreur
   NB : Firebase déjà initialisé par config.js, pas de
        re-initialisation ici.
   ══════════════════════════════════════════════════════════ */
(function initDelivery() {
  if (!document.getElementById('tab-pending')) return;

  // Réutilise window.db et window.auth de config.js
  var db   = window.db;
  var auth = window.auth;

  /* — Helpers format — */
  function fmtMoney(v) { return new Intl.NumberFormat('fr-FR').format(v||0) + ' FCFA'; }
  function fmtDate(ts) {
    if (!ts) return '—';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
  function isToday(ts) {
    if (!ts) return false;
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toDateString() === new Date().toDateString();
  }
  function ordRef(order) { return order.reference || 'AUR-' + order.id.slice(-6).toUpperCase(); }

  /* — Date topbar — */
  (function () {
    var el = document.getElementById('topbar-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  })();

  /* — Navigation tabs — */
  var TAB_TITLES = { pending: 'Livraisons <em>en attente</em>', history: 'Historique <em>complet</em>', profile: 'Mon <em>profil</em>' };
  window.navTo = function (tabId, btn) {
    document.querySelectorAll('.dv-section').forEach(function (s) { s.classList.remove('active'); });
    var target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.dv-nav-item').forEach(function (n) { n.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var tt = document.getElementById('topbar-title');
    if (tt) tt.innerHTML = TAB_TITLES[tabId] || '';
    var sb = document.querySelector('.dv-sidebar');
    if (sb) sb.classList.remove('open');
  };

  window.doLogout = function () {
    auth.signOut().then(function () { window.location.href = 'index.html'; });
  };

  /* — Modal confirm — */
  var _pendingOrderId = null;
  window.openModal = function (orderId, ref) {
    _pendingOrderId = orderId;
    var refEl = document.getElementById('dv-modal-ref');
    if (refEl) refEl.textContent = ref || orderId.slice(-8).toUpperCase();
    var modal = document.getElementById('dv-modal');
    if (modal) modal.classList.add('open');
  };
  window.closeModal = function () {
    _pendingOrderId = null;
    var modal = document.getElementById('dv-modal');
    if (modal) modal.classList.remove('open');
  };
  var okBtn = document.getElementById('dv-modal-ok');
  if (okBtn) {
    okBtn.addEventListener('click', async function () {
      if (!_pendingOrderId) return;
      okBtn.disabled = true;
      try {
        await db.collection('orders').doc(_pendingOrderId).update({
          status: 'delivered',
          deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
          deliveredBy: auth.currentUser.uid,
          updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (window.showToast) window.showToast('Livraison confirmée ✓', 'success');
        window.closeModal();
      } catch (err) {
        if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
        okBtn.disabled = false;
      }
    });
  }

  /* — Render pending — */
  function renderPending(orders) {
    var el    = document.getElementById('pending-list');
    var badge = document.getElementById('badge-pending');
    var stat  = document.getElementById('stat-pending');
    if (badge) { badge.textContent = orders.length; badge.classList.toggle('show', orders.length > 0); }
    if (stat)  stat.textContent = orders.length;
    if (!el) return;
    if (!orders.length) {
      el.innerHTML = '<div class="dv-empty"><div class="dv-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="dv-empty-title">Aucune livraison</div><div class="dv-empty-sub">Les nouvelles commandes apparaîtront ici.</div></div>';
      return;
    }
    el.innerHTML = orders.map(function (o) {
      var addr = o.deliveryAddress ? [o.deliveryAddress.street, o.deliveryAddress.city, o.deliveryAddress.sector].filter(Boolean).join(', ') : 'Adresse non spécifiée';
      var items = (o.items||[]).map(function (i) { return '<li class="dv-item"><strong>' + (i.qty||1) + '×</strong>' + (i.name||'Article') + '</li>'; }).join('');
      return '<div class="dv-order-card">'
        + '<div class="dv-order-head"><div><div class="dv-order-ref">' + ordRef(o) + '</div><div class="dv-order-meta"><span>' + fmtDate(o.readyForDeliveryAt||o.updatedAt) + '</span><span>' + (o.userEmail||o.userName||'Client') + '</span></div></div>'
        + '<div class="dv-order-right"><div class="dv-order-total">' + fmtMoney(o.total) + '</div><span class="dv-chip ready">Prêt</span></div></div>'
        + '<div class="dv-order-body"><div class="dv-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg><div class="dv-address-text"><strong>Adresse de livraison</strong>' + addr + '</div></div>'
        + (items ? '<ul class="dv-items-list">' + items + '</ul>' : '')
        + '<button class="dv-confirm-btn" onclick="openModal(\'' + o.id + '\',\'' + ordRef(o) + '\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg><span>Confirmer la livraison</span></button></div></div>';
    }).join('');
  }

  /* — Render history — */
  function renderHistory(orders, todayCount) {
    var el    = document.getElementById('history-list');
    var today = document.getElementById('stat-done-today');
    var total = document.getElementById('stat-total');
    if (today) today.textContent = todayCount;
    if (total) total.textContent = orders.length;
    if (!el) return;
    if (!orders.length) { el.innerHTML = '<div class="dv-empty"><div class="dv-empty-title">Aucune livraison</div></div>'; return; }
    el.innerHTML = orders.map(function (o) {
      return '<div class="dv-history-item">'
        + '<div><div class="dv-history-ref">' + ordRef(o) + '</div><div class="dv-history-date">Livré le ' + fmtDate(o.deliveredAt) + '</div></div>'
        + '<div style="text-align:right"><div class="dv-history-total">' + fmtMoney(o.total) + '</div><span class="dv-chip delivered">Livré</span></div>'
      + '</div>';
    }).join('');
  }

  /* — Render profile — */
  function renderProfile(userData, email) {
    var el = document.getElementById('profile-grid');
    if (!el) return;
    var certDate = userData.certifiedAt ? new Date(userData.certifiedAt.toDate ? userData.certifiedAt.toDate() : userData.certifiedAt).toLocaleDateString('fr-FR') : 'N/A';
    var blocks = [
      { label: 'Nom complet', value: userData.name || '—' },
      { label: 'Email',        value: email || userData.email || '—' },
      { label: 'Téléphone',    value: userData.phone || '—' },
      { label: 'Zone de livraison', value: userData.zone || '—' },
      { label: 'Statut',       value: userData.status === 'active' ? 'Actif' : 'Inactif', gold: userData.status === 'active' },
      { label: 'Certifié le',  value: certDate },
    ];
    el.innerHTML = blocks.map(function (b) {
      return '<div class="dv-profile-block"><div class="dv-profile-label">' + b.label + '</div><div class="dv-profile-value' + (b.gold ? ' gold' : '') + '">' + b.value + '</div></div>';
    }).join('');
  }

  /* — Bootstrap auth — */
  auth.onAuthStateChanged(async function (user) {
    if (!user) { if (window.AuthWall) window.AuthWall.deny({ redirectUrl: 'login.html', redirectLabel: 'Se connecter', reason: 'Connexion requise.' }); else window.location.href = 'login.html'; return; }
    try {
      var userDoc  = await db.collection('users').doc(user.uid).get();
      var userData = userDoc.exists ? userDoc.data() : {};
      if (userData.role !== 'livreur') {
        if (window.AuthWall) window.AuthWall.deny({ email: user.email, role: userData.role||'client', reason: 'Espace réservé aux livreurs certifiés Aurum.' });
        else window.location.href = 'index.html';
        return;
      }

      var sbName  = document.getElementById('sb-user-name');
      var sbEmail = document.getElementById('sb-user-email');
      if (sbName)  sbName.textContent  = userData.name || user.displayName || '—';
      if (sbEmail) sbEmail.textContent = user.email || '—';

      // Commandes en attente — realtime
      db.collection('orders').where('status', '==', 'ready_for_delivery')
        .onSnapshot(function (snap) { renderPending(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })); },
          function (err) { console.error('[delivery] pending:', err.message); });

      // Historique — realtime
      db.collection('orders')
        .where('status', '==', 'delivered')
        .where('deliveredBy', '==', user.uid)
        .orderBy('deliveredAt', 'desc').limit(100)
        .onSnapshot(function (snap) {
          var orders = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
          renderHistory(orders, orders.filter(function (o) { return isToday(o.deliveredAt); }).length);
        }, function (err) { console.error('[delivery] history:', err.message); });

      renderProfile(userData, user.email);
      setTimeout(function () { if (window.AuthWall) window.AuthWall.reveal(); }, 350);
    } catch (err) {
      console.error('[delivery] bootstrap:', err);
      if (window.AuthWall) window.AuthWall.deny({ reason: 'Erreur de vérification : ' + err.message });
    }
  });
})();

/* ══════════════════════════════════════════════════════════
   §11 index.html
   ══════════════════════════════════════════════════════════ */
(function initIndex() {
  var heroEl = document.querySelector('.hero');
  if (!heroEl) return;

  /* — Hero search — */
  var input = document.querySelector('.hero-search-input');
  var btn   = document.querySelector('.hero-search-btn');
  function goSearch() {
    var q = (input ? input.value : '').trim();
    window.location.href = q ? 'catalogue.html?q=' + encodeURIComponent(q) : 'catalogue.html';
  }
  if (btn)   btn.addEventListener('click', goSearch);
  if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); goSearch(); } });

  /* — Skeleton → grid — */
  var skel = document.getElementById('skel-products');
  var grid = document.getElementById('products-container');
  if (grid && skel) {
    var mo = new MutationObserver(function () {
      if (grid.children.length > 0 && !(grid.children.length === 1 && grid.firstChild.tagName === 'P')) {
        skel.style.display = 'none'; grid.style.display = 'grid';
      }
    });
    mo.observe(grid, { childList: true });
  }

  /* — Newsletter (index) — */
  var nlForm = document.getElementById('nl-form');
  if (nlForm) {
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = e.target.querySelector('input');
      if (!em || !em.value) return;
      // Délègue au footer.js via l'API Firestore de config.js
      var db = window.db;
      if (!db) { if (window.showToast) window.showToast('Merci pour votre inscription !', 'success'); e.target.reset(); return; }
      var email = em.value.trim().toLowerCase();
      db.collection('newsletter').where('email', '==', email).get().then(function (snap) {
        if (!snap.empty) { if (window.showToast) window.showToast('Vous êtes déjà inscrit(e) !', 'warn'); return; }
        return db.collection('newsletter').add({
          email: email, subscribedAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'active',
        }).then(function () { if (window.showToast) window.showToast('Merci pour votre inscription !', 'success'); e.target.reset(); });
      }).catch(function () { if (window.showToast) window.showToast("Une erreur est survenue. Réessayez.", 'danger'); });
    });
  }

  /* — Charger les produits via app.js — */
  if (typeof window.loadProducts === 'function') window.loadProducts();
  if (typeof lucide !== 'undefined') lucide.createIcons();
})();


/* ══════════════════════════════════════════════════════════
   §12 login.html
   ══════════════════════════════════════════════════════════ */
(function initLogin() {
  var form = document.getElementById('form-login');
  if (!form) return;

  var btn       = document.getElementById('btn-submit');
  var forgotLnk = document.getElementById('forgot-password-link');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var orig = btn ? btn.innerHTML : '';
      if (btn) { btn.innerHTML = '<span>Connexion…</span>'; btn.disabled = true; }

      var email = document.getElementById('login-email').value;
      var pass  = document.getElementById('login-pass').value;

      window.auth.signInWithEmailAndPassword(email, pass)
        .then(function (cred) {
          var finishRedirect = function () {
            var redirectWithRole = function (role) {
              var returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
              if (returnUrl) { window.location.href = returnUrl; return; }
              var ADMIN_MAIL = 'aurumcorporate.d@gmail.com';
              if (email === ADMIN_MAIL || role === 'superadmin' || role === 'admin' || role === 'maintainer') {
                window.location.href = 'theking.html';
              } else if (role === 'seller') {
                window.location.href = 'seller.html';
              } else if (role === 'livreur') {
                window.location.href = 'delivery.html';
              } else {
                window.location.href = 'index.html'; // ✅ les clients vont sur l'accueil
              }
            };

            if (window.db && cred.user && cred.user.uid) {
              window.db.collection('users').doc(cred.user.uid).get()
                .then(function (doc) { redirectWithRole(doc.exists ? doc.data().role || '' : ''); })
                .catch(function () { redirectWithRole(''); });
            } else { redirectWithRole(''); }
          };

          if (typeof window.syncCurrentUser === 'function') {
            window.syncCurrentUser(cred.user).then(finishRedirect).catch(finishRedirect);
          } else { finishRedirect(); }
        })
        .catch(function (error) {
          var msgs = {
            'auth/user-not-found':  'Compte introuvable.',
            'auth/wrong-password':  'Mot de passe incorrect.',
            'auth/invalid-email':   'Email invalide.',
            'auth/user-disabled':   'Compte désactivé.',
            'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
          };
          var msg = msgs[error.code] || 'Erreur de connexion.';
          if (window.showToast) window.showToast('⚠ ' + msg, 'danger');
          else alert('⚠ ' + msg);
          if (btn) { btn.innerHTML = orig; btn.disabled = false; }
        });
    });
  }

  if (forgotLnk) {
    forgotLnk.addEventListener('click', function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('login-email');
      var email   = emailEl ? emailEl.value : '';
      if (!email) { if (window.showToast) window.showToast('Entrez votre email d\'abord.', 'warn'); return; }
      firebase.auth().sendPasswordResetEmail(email)
        .then(function () { if (window.showToast) window.showToast('Email de réinitialisation envoyé à ' + email, 'success'); })
        .catch(function (err) { if (window.showToast) window.showToast('⚠ ' + (err.code === 'auth/user-not-found' ? 'Compte introuvable.' : err.message), 'danger'); });
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
})();


/* ══════════════════════════════════════════════════════════
   §13 messages.html  — Inbox controller
   Fonctionne avec messaging.js v2
   ══════════════════════════════════════════════════════════ */
(function initMessages() {
  if (!document.getElementById('inbox-sidebar')) return;

  var sidebar    = document.getElementById('inbox-sidebar');
  var convListEl = document.getElementById('inbox-conv-list');
  var countBadge = document.getElementById('inbox-count');
  var emptyState = document.getElementById('inbox-empty-state');
  var threadPanel= document.getElementById('inbox-thread');
  var threadInner= document.getElementById('inbox-thread-inner');
  var messagesWrap=document.getElementById('inbox-messages-wrap');
  var threadName = document.getElementById('inbox-thread-name');
  var threadSub  = document.getElementById('inbox-thread-sub');
  var threadAvatar=document.getElementById('inbox-thread-avatar');
  var shopLink   = document.getElementById('inbox-shop-link');
  var backBtn    = document.getElementById('inbox-back-btn');
  var compose    = document.getElementById('inbox-compose');
  var inputEl    = document.getElementById('inbox-input');
  var charCount  = document.getElementById('inbox-char-count');
  var sendBtn    = document.getElementById('inbox-send-btn');

  var currentUser = null, activeChat = null, chatsCache = [], activeTab = 'all', searchTerm = '';
  var unsubChats = null, unsubMessages = null;

  var params     = new URLSearchParams(location.search);
  var initChatId = params.get('chatId')   || '';
  var initShopId = params.get('shopId')   || '';
  var initSelId  = params.get('sellerId') || '';
  var initProdId = params.get('productId')|| '';

  function avatarLetters(name) {
    return String(name||'?').trim().split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0,2);
  }
  function fmt(ts) { return window.formatChatTime ? window.formatChatTime(ts) : ''; }
  function esc(s)  {
    return window._aurumMsg ? window._aurumMsg.escapeHtml(s) : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function fmtLabel(ts) { return window._aurumMsg ? window._aurumMsg.formatDateLabel(ts) : ''; }

  function renderList() {
    var chats = chatsCache.slice();
    if (activeTab === 'buyer')  chats = chats.filter(function (c) { return c.buyerId === currentUser.uid; });
    if (activeTab === 'seller') chats = chats.filter(function (c) { return c.sellerId === currentUser.uid || c.shopId; });
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      chats = chats.filter(function (c) {
        return (c.shopName||'').toLowerCase().includes(q) || (c.buyerName||'').toLowerCase().includes(q) || (c.lastMessage||'').toLowerCase().includes(q);
      });
    }

    var totalUnread = chatsCache.reduce(function (acc, c) {
      return acc + (c.buyerId === currentUser.uid ? (c.unreadBuyer||0) : (c.unreadSeller||0));
    }, 0);
    if (countBadge) { countBadge.textContent = totalUnread > 99 ? '99+' : totalUnread; countBadge.classList.toggle('show', totalUnread > 0); }

    if (!chats.length) {
      convListEl.innerHTML = '<div class="inbox-conv-empty"><p>' + (searchTerm ? 'Aucun résultat.' : 'Aucune conversation.') + '</p>'
        + (!searchTerm ? '<a href="catalogue.html">Explorer la marketplace →</a>' : '') + '</div>';
      return;
    }

    convListEl.innerHTML = chats.map(function (chat) {
      var isBuyer  = chat.buyerId === currentUser.uid;
      var partner  = isBuyer ? chat.shopName||'Boutique' : chat.buyerName||'Client';
      var unread   = isBuyer ? (chat.unreadBuyer||0) : (chat.unreadSeller||0);
      var preview  = chat.lastMessage || 'Aucun message.';
      if (preview.length > 56) preview = preview.slice(0,56) + '…';
      var time   = fmt(chat.lastMessageAt || chat.updatedAt);
      var isAct  = activeChat && activeChat.id === chat.id;
      return '<button class="inbox-conv-item' + (isAct?' active':'') + (unread>0?' has-unread':'') + '" data-cid="' + chat.id + '" type="button">'
        + '<div class="inbox-conv-avatar">' + avatarLetters(partner) + (unread > 0 ? '<span class="unread-pip">' + (unread>9?'9+':unread) + '</span>' : '') + '</div>'
        + '<div class="inbox-conv-body">'
          + '<div class="inbox-conv-top"><span class="inbox-conv-name">' + esc(partner) + '</span><span class="inbox-conv-time">' + esc(time) + '</span></div>'
          + '<div><span class="inbox-conv-role-tag ' + (isBuyer?'buyer':'seller') + '">' + (isBuyer?'Achat':'Vente') + '</span></div>'
          + '<p class="inbox-conv-preview">' + esc(preview) + '</p>'
        + '</div></button>';
    }).join('');

    convListEl.querySelectorAll('[data-cid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var chat = chatsCache.find(function (c) { return c.id === btn.dataset.cid; });
        if (chat) openThread(chat);
      });
    });
  }

  function openThread(chat) {
    activeChat = chat;
    var isBuyer = chat.buyerId === currentUser.uid;
    var partner = isBuyer ? chat.shopName||'Boutique' : chat.buyerName||'Client';
    if (threadAvatar) threadAvatar.textContent = avatarLetters(partner);
    if (threadName)   threadName.textContent   = partner;
    if (threadSub)    threadSub.textContent    = isBuyer ? 'Boutique Sanhia' : 'Client · ' + (chat.buyerEmail||'');
    if (shopLink) { if (chat.shopId && isBuyer) { shopLink.href = 'boutique.html?id=' + chat.shopId; shopLink.style.display = ''; } else { shopLink.style.display = 'none'; } }

    var url = new URL(window.location.href);
    url.searchParams.set('chatId', chat.id);
    history.replaceState({}, '', url.toString());

    if (sidebar)      sidebar.classList.add('mobile-hidden');
    if (threadPanel)  threadPanel.classList.add('mobile-show');
    if (emptyState)   emptyState.style.display = 'none';
    if (threadInner)  threadInner.style.display = 'flex';

    renderList();
    listenMessages(chat.id);
    if (inputEl) inputEl.focus();
  }

  function listenMessages(chatId) {
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    if (messagesWrap) messagesWrap.innerHTML = '<div class="inbox-loading"><div class="inbox-spinner"></div></div>';
    unsubMessages = window.subscribeMessages(chatId, function (msgs) { renderMessages(msgs); },
      function (err) { if (messagesWrap) messagesWrap.innerHTML = '<p class="inbox-msg-error">Impossible de charger les messages.</p>'; console.error(err); });
    if (window._aurumMsg && window._aurumMsg.markConversationRead) window._aurumMsg.markConversationRead(chatId);
  }

  function renderMessages(msgs) {
    if (!messagesWrap) return;
    if (!msgs.length) { messagesWrap.innerHTML = '<div class="inbox-thread-empty">Envoyez le premier message.</div>'; return; }
    var html = '', lastLabel = '';
    msgs.forEach(function (msg) {
      var isMine = msg.senderId === currentUser.uid;
      var label  = fmtLabel(msg.createdAt);
      if (label && label !== lastLabel) { html += '<div class="inbox-date-sep"><span>' + esc(label) + '</span></div>'; lastLabel = label; }
      var lock = msg.hasMaskedContent ? '<span class="inbox-masked-badge" title="Coordonnées masquées">🔒</span>' : '';
      html += '<div class="inbox-bubble-row ' + (isMine?'mine':'theirs') + '"><div class="inbox-bubble ' + (isMine?'mine':'theirs') + '"><p>' + esc(msg.text) + '</p><div class="inbox-bubble-meta">' + lock + '<span>' + esc(fmt(msg.createdAt)) + '</span></div></div></div>';
    });
    messagesWrap.innerHTML = html;
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
  }

  if (compose) {
    compose.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!activeChat) return;
      var raw = inputEl ? inputEl.value.trim() : '';
      if (!raw) return;
      if (sendBtn) sendBtn.disabled = true;
      try {
        if (activeChat._stub) {
          var chatId = await window.sendMessage(activeChat.shopId, raw, {
            sellerId: activeChat.sellerId||'', shopName: activeChat.shopName||'',
            sellerName: activeChat.sellerName||'', productId: activeChat.productId||'',
          });
          activeChat._stub = false; activeChat.id = chatId;
          listenMessages(chatId);
        } else { await window.sendReply(activeChat.id, raw); }
        if (inputEl)   { inputEl.value = ''; inputEl.style.height = 'auto'; }
        if (charCount)   charCount.textContent = '0 / 1200';
        if (inputEl)     inputEl.focus();
      } catch (err) { if (window.showToast) window.showToast(err.message||'Envoi impossible.', 'danger'); }
      finally { if (sendBtn) sendBtn.disabled = false; }
    });
  }

  if (inputEl) {
    inputEl.addEventListener('input', function () {
      var len = inputEl.value.length;
      if (charCount) { charCount.textContent = len + ' / 1200'; charCount.style.color = len > 1100 ? '#D94F4F' : ''; }
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (compose) compose.dispatchEvent(new Event('submit')); }
    });
  }

  document.querySelectorAll('.inbox-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.inbox-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderList();
    });
  });

  var searchEl = document.getElementById('inbox-search');
  if (searchEl) searchEl.addEventListener('input', function (e) { searchTerm = e.target.value.trim(); renderList(); });

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (sidebar)     sidebar.classList.remove('mobile-hidden');
      if (threadPanel) threadPanel.classList.remove('mobile-show');
      if (emptyState)  emptyState.style.display = '';
      if (threadInner) threadInner.style.display = 'none';
      activeChat = null;
      if (unsubMessages) { unsubMessages(); unsubMessages = null; }
      renderList();
    });
  }

  /* — Bootstrap from URL — */
  async function bootstrapFromUrl() {
    if (!initChatId && !initShopId) return;
    if (initChatId) {
      var found = chatsCache.find(function (c) { return c.id === initChatId; });
      if (found) { openThread(found); return; }
      try {
        var snap = await firebase.firestore().collection('conversations').doc(initChatId).get();
        if (snap.exists) { openThread(Object.assign({ id: snap.id }, snap.data())); return; }
      } catch (_) {}
    }
    if (initShopId) {
      var stub = { id: initChatId || window.buildChatId(currentUser.uid, initShopId), shopId: initShopId, sellerId: initSelId, productId: initProdId, shopName: '', sellerName: 'Vendeur', buyerId: currentUser.uid, participants: [currentUser.uid, initSelId||initShopId], unreadBuyer: 0, unreadSeller: 0, _stub: true };
      try {
        var shopSnap = await firebase.firestore().collection('shops').doc(initShopId).get();
        if (shopSnap.exists) { stub.shopName = shopSnap.data().name||''; stub.sellerId = stub.sellerId || shopSnap.data().ownerId||shopSnap.data().ownerUid||''; }
      } catch (_) {}
      chatsCache = [stub].concat(chatsCache.filter(function (c) { return c.id !== stub.id; }));
      renderList();
      openThread(stub);
    }
  }

  firebase.auth().onAuthStateChanged(async function (user) {
    if (!user) { window.location.href = 'login.html?returnUrl=' + encodeURIComponent(location.pathname + location.search); return; }
    currentUser = user;
    if (unsubChats) { unsubChats(); unsubChats = null; }
    unsubChats = window.subscribeUserChats(currentUser.uid, function (chats) {
      chatsCache = chats;
      if (activeChat && !activeChat._stub) {
        var updated = chats.find(function (c) { return c.id === activeChat.id; });
        if (updated) activeChat = Object.assign({}, activeChat, updated);
      }
      renderList();
    }, function (err) {
      convListEl.innerHTML = '<div class="inbox-conv-empty"><p>Impossible de charger les conversations.<br>' + err.message + '</p></div>';
    });
    setTimeout(bootstrapFromUrl, 450);
  });

  window.addEventListener('beforeunload', function () { if (unsubChats) unsubChats(); if (unsubMessages) unsubMessages(); });
})();

/* ══════════════════════════════════════════════════════════
   §14 product.html  (fiche produit — chargement Firestore)
   ══════════════════════════════════════════════════════════ */
(function initProduit() {
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
    var name    = document.getElementById('ax-rname')?.value.trim();
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
  window.axQuick = async function (pid2) {
    try {
      var snap2 = await db.collection('products').doc(pid2).get();
      if (!snap2.exists) { if(window.showToast) window.showToast('Produit introuvable','danger'); return; }
      var p2 = Object.assign({ id:snap2.id }, snap2.data());
      if (typeof addToCart === 'function') addToCart(String(p2.id),1,p2);
      else { var c2=[]; try{c2=JSON.parse(localStorage.getItem('ac_cart')||'[]');}catch(_){c2=[];} var ei2=c2.findIndex(function(x){return x.id===p2.id;}); if(ei2>-1)c2[ei2].quantity+=1;else c2.push({id:p2.id,name:p2.name,price:p2.price,image:p2.image,quantity:1,shopId:p2.shopId,variants:{}}); localStorage.setItem('ac_cart',JSON.stringify(c2)); if(window.updateCartBadge)window.updateCartBadge(); }
      if(window.showToast) window.showToast('✓ '+p2.name+' ajouté','success');
    } catch(e) { if(window.showToast) window.showToast('Erreur','danger'); }
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
})();

/* ══════════════════════════════════════════════════════════
   §15 profile.html
   ══════════════════════════════════════════════════════════ */
(function initProfile() {
  if (!document.getElementById('pr-hero-name') && !document.getElementById('tab-infos')) return;

  var auth    = window.auth;
  var db      = window.db;
  var storage = firebase.storage ? firebase.storage() : null;
  var DEFAULT_RETENTION = 30;

  /* ── Tabs ── */
  function switchTab(name) {
    document.querySelectorAll('.pr-tab').forEach(function(t){ t.classList.remove('on'); });
    document.querySelectorAll('.pr-aside-btn[data-tab]').forEach(function(b){ b.classList.remove('on'); });
    var tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('on');
    var btn = document.querySelector('.pr-aside-btn[data-tab="' + name + '"]');
    if (btn) btn.classList.add('on');
    if (name === 'messages' && auth.currentUser) initMessages(auth.currentUser.uid);
  }
  document.querySelectorAll('.pr-aside-btn[data-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){ switchTab(btn.dataset.tab); });
  });

  /* ── Auth guard ── */
  auth.onAuthStateChanged(async function(user){
    if (!user) { window.location.href = 'login.html'; return; }
    await loadProfile(user);
    await loadOrders(user.uid);
    await loadAddresses(user.uid);
    setupPhotoUpload(user);
    initRetention(user.uid);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  /* ── Profil ── */
  async function loadProfile(user) {
    try {
      var shopSnap = await db.collection('shops').where('ownerEmail','==',user.email).get();
      var role     = shopSnap.empty ? 'Client' : 'Vendeur';
      var docRef   = db.collection('users').doc(user.uid);
      var doc      = await docRef.get();
      var data     = doc.exists ? Object.assign({ name:user.displayName||'', email:user.email, role:role.toLowerCase() }, doc.data()) : { name:user.displayName||'', email:user.email, role:role.toLowerCase() };
      if (!doc.exists) await docRef.set(Object.assign({}, data, { createdAt:new Date() }), { merge:true });

      var name    = data.name || 'Utilisateur';
      var initials= name.split(' ').map(function(n){ return n[0]; }).join('').toUpperCase().slice(0,2) || 'AU';
      var setEl   = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
      var setHtml = function(id,v){ var el=document.getElementById(id); if(el) el.innerHTML=v; };

      setHtml('pr-hero-name', (name.split(' ')[0]||'Bon') + '<br><em>' + (name.split(' ').slice(1).join(' ')||'retour') + '</em>');
      setEl('pr-hero-role',  role);
      setEl('pr-hero-email', user.email);
      setEl('pr-wm',         initials);
      setEl('pr-initials',   initials);

      var nameEl = document.getElementById('pr-name');   if(nameEl) nameEl.value = name;
      var emailEl= document.getElementById('pr-email');  if(emailEl) emailEl.value = user.email;
      var roleEl = document.getElementById('pr-role-input'); if(roleEl) roleEl.value = role;

      if (user.photoURL) {
        var img = document.getElementById('pr-avatar-img');
        var ini = document.getElementById('pr-initials');
        if (img) { img.src = user.photoURL; img.style.display = 'block'; }
        if (ini) ini.style.display = 'none';
      }
    } catch(e){ console.error('[profil] loadProfile:', e); }
  }

  var saveBtn = document.getElementById('pr-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async function(){
      var user = auth.currentUser; if(!user) return;
      var newName = (document.getElementById('pr-name')?.value||'').trim();
      if (!newName) { if(window.showToast) window.showToast('Le nom ne peut pas être vide.','danger'); return; }
      var sp = saveBtn.querySelector('span'); if(sp) sp.textContent='Enregistrement…';
      saveBtn.disabled = true;
      try {
        await user.updateProfile({ displayName:newName });
        await db.collection('users').doc(user.uid).update({ name:newName });
        var initials = newName.split(' ').map(function(n){return n[0];}).join('').toUpperCase().slice(0,2);
        var hnn = document.getElementById('pr-hero-name'); if(hnn) hnn.innerHTML = (newName.split(' ')[0]||'Bon')+'<br><em>'+(newName.split(' ').slice(1).join(' ')||'retour')+'</em>';
        var wm  = document.getElementById('pr-wm');        if(wm)  wm.textContent = initials;
        if(window.showToast) window.showToast('Profil mis à jour !','success');
      } catch(e){ if(window.showToast) window.showToast('Erreur de mise à jour.','danger'); }
      finally { saveBtn.disabled=false; if(sp) sp.textContent='Enregistrer les modifications'; }
    });
  }

  /* ── Photo ── */
  function setupPhotoUpload(user) {
    var uploadBtn = document.getElementById('pr-upload-btn');
    var fileInput = document.getElementById('pr-file-input');
    if (!uploadBtn || !fileInput || !storage) return;
    uploadBtn.addEventListener('click', function(e){ e.preventDefault(); fileInput.click(); });
    fileInput.addEventListener('change', async function(e){
      var file = e.target.files[0]; if(!file) return;
      if (!file.type.startsWith('image/'))       { if(window.showToast) window.showToast('Format non supporté.','danger'); return; }
      if (file.size > 2*1024*1024)               { if(window.showToast) window.showToast('Image trop lourde (max 2 Mo).','danger'); return; }
      uploadBtn.style.opacity = '.4'; uploadBtn.style.pointerEvents = 'none';
      try {
        var ref  = storage.ref('users/' + user.uid + '/profile.jpg');
        var snap = await ref.put(file);
        var url  = await snap.ref.getDownloadURL();
        await user.updateProfile({ photoURL:url });
        await db.collection('users').doc(user.uid).update({ photoURL:url });
        var img = document.getElementById('pr-avatar-img');
        var ini = document.getElementById('pr-initials');
        if (img) { img.src = url; img.style.display = 'block'; }
        if (ini) ini.style.display = 'none';
        if(window.showToast) window.showToast('Photo mise à jour !','success');
      } catch(err){ if(window.showToast) window.showToast('Erreur upload.','danger'); }
      finally { uploadBtn.style.opacity='1'; uploadBtn.style.pointerEvents='auto'; e.target.value=''; }
    });
  }

  /* ── Déconnexion ── */
  var logoutBtn = document.getElementById('pr-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(){
      if (confirm('Se déconnecter ?')) { await auth.signOut(); window.location.href = 'login.html'; }
    });
  }

  /* ── Orders ── */
  function getRetention() { var v=Number(localStorage.getItem('ac_order_retention_days')); return Number.isFinite(v)&&v>=1?v:DEFAULT_RETENTION; }
  function initRetention(uid) {
    var inp = document.getElementById('pr-retention-input'); if(!inp) return;
    inp.value = getRetention();
    inp.addEventListener('change', async function(){
      var val = Math.max(7, Math.min(180, Number(inp.value)||DEFAULT_RETENTION));
      localStorage.setItem('ac_order_retention_days', String(val)); inp.value = val;
      await loadOrders(uid);
    });
  }
  async function purgeOrders(uid, days) {
    try {
      var cutoff = new Date(Date.now() - days*864e5);
      var snap   = await db.collection('orders').where('userId','==',uid).get();
      for (var doc of snap.docs) {
        var o = doc.data(), st = (o.status||'').toLowerCase();
        if (!['delivered','cancelled'].some(function(s){ return st.includes(s[0]); })) continue;
        var d = o.updatedAt?.toDate?.() ?? o.createdAt?.toDate?.() ?? new Date(0);
        if (d < cutoff) await db.collection('orders').doc(doc.id).delete();
      }
    } catch(e){}
  }
  async function loadOrders(uid) {
    try {
      await purgeOrders(uid, getRetention());
      var snap;
      try { snap = await db.collection('orders').where('userId','==',uid).orderBy('createdAt','desc').get(); }
      catch { snap = await db.collection('orders').where('userId','==',uid).get(); }
      var orders     = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var totalSpent = orders.reduce(function(s,o){ return s+(o.total||0); },0);
      var wishlist   = JSON.parse(localStorage.getItem('ac_wishlist')||'[]').length;
      var setEl = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
      setEl('pr-stat-orders',  orders.length);
      setEl('pr-stat-spent',   new Intl.NumberFormat('fr-FR').format(totalSpent)+' FCFA');
      setEl('pr-stat-wishlist',wishlist);
      renderOrders(orders);
    } catch(e){ console.error('[profil] loadOrders:', e); }
  }

  function statusBadge(status) {
    var s = (status||'pending').toLowerCase();
    if (s.includes('livr')||s==='delivered')  return { label:'Livré',          cls:'st-done'   };
    if (s.includes('annul')||s==='cancelled') return { label:'Annulé',         cls:'st-cancel' };
    if (s.includes('expéd')||s==='shipped')   return { label:'Expédié',        cls:'st-ship'   };
    if (s.includes('prép')||s.includes('seller')) return { label:'En préparation',cls:'st-prep' };
    return { label:'En attente', cls:'st-wait' };
  }
  function renderOrders(orders) {
    var c = document.getElementById('pr-orders-list'); if(!c) return;
    if (!orders.length) { c.innerHTML='<div class="pr-empty"><div class="pr-empty-icon">∅</div><p>Aucune commande.</p><a href="catalogue.html">Découvrir le catalogue →</a></div>'; if(typeof lucide!=='undefined')lucide.createIcons(); return; }
    c.innerHTML = orders.map(function(o){
      var date  = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : '—';
      var total = new Intl.NumberFormat('fr-FR').format(o.total||0);
      var b     = statusBadge(o.status);
      var items = o.items?.length||0;
      return '<div class="pr-order-item"><div><div class="pr-order-id">#'+o.id.slice(0,8).toUpperCase()+'</div><div class="pr-order-title">'+items+' article'+(items>1?'s':'')+'</div><div class="pr-order-meta">'+date+'</div></div><div class="pr-order-right"><div class="pr-order-price">'+total+' FCFA</div><span class="pr-badge-status '+b.cls+'">'+b.label+'</span></div></div>';
    }).join('');
  }

  /* ── Adresses ── */
  async function loadAddresses(uid) {
    var snap = await db.collection('users').doc(uid).collection('addresses').get();
    var c    = document.getElementById('pr-addr-list'); if(!c) return;
    if (snap.empty) { c.innerHTML='<div class="pr-empty" style="grid-column:1/-1"><div class="pr-empty-icon">⌂</div><p>Aucune adresse.</p></div>'; if(typeof lucide!=='undefined')lucide.createIcons(); return; }
    c.innerHTML = snap.docs.map(function(doc){
      var a = doc.data();
      return '<div class="pr-addr-card"><button class="pr-addr-del" onclick="prDeleteAddr(\''+doc.id+'\')"><i data-lucide="trash-2"></i></button><div class="pr-addr-tag">Adresse</div><div class="pr-addr-name">'+a.name+'</div><div class="pr-addr-detail"><i data-lucide="phone"></i> '+a.phone+'</div><div class="pr-addr-detail"><i data-lucide="map-pin"></i> '+a.city+'</div><div class="pr-addr-detail"><i data-lucide="navigation"></i> '+(a.description||a.desc||'')+'</div></div>';
    }).join('');
    if(typeof lucide!=='undefined')lucide.createIcons();
  }
  window.prDeleteAddr = async function(id) {
    if (!confirm('Supprimer cette adresse ?')) return;
    await db.collection('users').doc(auth.currentUser.uid).collection('addresses').doc(id).delete();
    loadAddresses(auth.currentUser.uid);
    if(window.showToast) window.showToast('Adresse supprimée.','success');
  };

  var modal     = document.getElementById('pr-addr-modal');
  var addBtn    = document.getElementById('pr-add-addr-btn');
  var closeBtn2 = document.getElementById('pr-modal-close');
  var cancelBtn = document.getElementById('pr-modal-cancel');
  var addrForm  = document.getElementById('pr-addr-form');
  if (addBtn)    addBtn.addEventListener('click',   function(){ if(modal) modal.classList.add('on'); });
  if (closeBtn2) closeBtn2.addEventListener('click', function(){ if(modal) modal.classList.remove('on'); });
  if (cancelBtn) cancelBtn.addEventListener('click', function(){ if(modal) modal.classList.remove('on'); });
  if (addrForm) {
    addrForm.addEventListener('submit', async function(e){
      e.preventDefault();
      var user = auth.currentUser; if(!user) return;
      var btn  = e.target.querySelector('[type=submit]');
      var sp   = btn?.querySelector('span'); if(sp) sp.textContent='Sauvegarde…';
      if(btn) btn.disabled=true;
      try {
        await db.collection('users').doc(user.uid).collection('addresses').add({
          name:        document.getElementById('addr-name')?.value.trim()||'',
          phone:       document.getElementById('addr-phone')?.value.trim()||'',
          city:        document.getElementById('addr-city')?.value||'',
          description: document.getElementById('addr-desc')?.value.trim()||'',
          createdAt:   new Date(),
        });
        if(modal) modal.classList.remove('on');
        e.target.reset();
        loadAddresses(user.uid);
        if(window.showToast) window.showToast('Adresse ajoutée !','success');
      } catch(err){ if(window.showToast) window.showToast('Erreur d\'ajout.','danger'); }
      finally { if(btn) btn.disabled=false; if(sp) sp.textContent='Enregistrer'; }
    });
  }

  /* ── Messages dans profil ── */
  function initMessages(uid) {
    if (typeof window.subscribeUserChats !== 'function') return;
    var badge = document.getElementById('pr-msg-badge');
    window.subscribeUserChats(uid, function(chats){
      if (badge) { badge.textContent=chats.length; badge.style.display=chats.length?'inline':'none'; }
      var c = document.getElementById('pr-msg-list'); if(!c) return;
      if (!chats.length) { c.innerHTML='<div class="pr-empty"><div class="pr-empty-icon">✉</div><p>Aucun message</p></div>'; if(typeof lucide!=='undefined')lucide.createIcons(); return; }
      c.innerHTML = chats.map(function(ch){
        var isBuyer = ch.buyerId === uid;
        var partner = isBuyer ? ch.shopName||'Vendeur' : ch.buyerName||'Client';
        var init    = partner.slice(0,2).toUpperCase();
        return '<a href="messages.html?chatId='+ch.id+'" class="pr-msg-item"><div class="pr-msg-av">'+init+'</div><div class="pr-msg-body"><div class="pr-msg-shop">'+partner+'</div><div class="pr-msg-last">'+(ch.lastMessage||'…')+'</div></div><div class="pr-msg-arrow"><i data-lucide="arrow-right"></i></div></a>';
      }).join('');
      if(typeof lucide!=='undefined')lucide.createIcons();
    }, function(err){ console.warn('[profil] messages:', err); });
  }
})();


/* ══════════════════════════════════════════════════════════
   §16 register.html
   ══════════════════════════════════════════════════════════ */
(function initRegister() {
  var btn = document.getElementById('btn-register');
  if (!btn) return;

  btn.addEventListener('click', function() {
    var name        = (document.getElementById('reg-name')?.value||'').trim();
    var email       = (document.getElementById('reg-email')?.value||'').trim();
    var pass        = document.getElementById('reg-pass')?.value||'';
    var passConfirm = document.getElementById('reg-pass-confirm')?.value||'';
    var errorDiv    = document.getElementById('error-message');

    function showErr(msg) { if(errorDiv) errorDiv.textContent=msg; if(window.showToast) window.showToast(msg,'danger'); }

    if (!name||!email||!pass) { showErr('Veuillez remplir tous les champs.'); return; }
    if (pass !== passConfirm)  { showErr('Les mots de passe ne correspondent pas.'); return; }
    if (pass.length < 6)       { showErr('Mot de passe trop court (min 6 caractères).'); return; }

    var orig = btn.innerHTML;
    btn.innerHTML = '<span>Création en cours…</span>'; btn.disabled = true;

    window.auth.createUserWithEmailAndPassword(email, pass)
      .then(function(cred) {
        return cred.user.updateProfile({ displayName:name })
          .then(function(){
            return window.db.collection('users').doc(cred.user.uid).set({
              name:name, email:email, role:'client', createdAt:new Date(),
            });
          })
          .then(function(){
            var finish = function(){ if(window.showToast) window.showToast('Compte créé avec succès !','success'); setTimeout(function(){ window.location.href='index.html'; },1000); };
            if (typeof window.syncCurrentUser === 'function') window.syncCurrentUser(cred.user).then(finish).catch(finish);
            else finish();
          });
      })
      .catch(function(error) {
        var msgs = {
          'auth/email-already-in-use': 'Cet email est déjà associé à un compte.',
          'auth/invalid-email':        'Format d\'email invalide.',
          'auth/weak-password':        'Mot de passe trop faible.',
        };
        showErr(msgs[error.code] || 'Erreur lors de la création.');
        btn.innerHTML = orig; btn.disabled = false;
      });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
})();


/* ══════════════════════════════════════════════════════════
   §17 seller-application.html
   ══════════════════════════════════════════════════════════ */
(function initSellerApplication() {
  if (!document.getElementById('sa-form')) return;

  var currentStep = 1;

  window.saGoTo = function(step) {
    if (step > currentStep) {
      var cur    = document.querySelector('.sa-section[data-section="'+currentStep+'"]');
      var inputs = cur ? cur.querySelectorAll('[required]') : [];
      var valid  = true;
      inputs.forEach(function(inp){ if(!inp.value.trim()){ valid=false; inp.style.borderBottomColor='var(--danger)'; setTimeout(function(){inp.style.borderBottomColor='';},2000); } });
      if (!valid) { if(window.showToast) window.showToast('Veuillez remplir tous les champs obligatoires.','danger'); return; }
    }
    var from = document.querySelector('.sa-section[data-section="'+currentStep+'"]');
    var to   = document.querySelector('.sa-section[data-section="'+step+'"]');
    if (from) from.classList.remove('active');
    if (to)   to.classList.add('active');
    document.querySelectorAll('.sa-step').forEach(function(s){
      var n = parseInt(s.dataset.step);
      s.classList.remove('active','done');
      if (n===step) s.classList.add('active');
      else if (n<step) s.classList.add('done');
    });
    currentStep = step;
    var stepsWrap = document.querySelector('.sa-steps-wrap');
    if (stepsWrap) window.scrollTo({ top:stepsWrap.offsetTop-10, behavior:'smooth' });
  };

  window.saFile = function(input, areaId, lblId) {
    if (input.files && input.files[0]) {
      var f  = input.files[0];
      var nm = f.name.length > 20 ? f.name.substring(0,20)+'…' : f.name;
      var sz = (f.size/1024/1024).toFixed(2);
      var lbl = document.getElementById(lblId); if(lbl) lbl.textContent = nm+' ('+sz+' MB)';
      var area= document.getElementById(areaId); if(area) area.classList.add('done');
    }
  };

  window.toggleCk = function(cb) { cb.closest('.sa-ck').classList.toggle('checked', cb.checked); };

  document.getElementById('sa-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (typeof firebase === 'undefined') { if(window.showToast) window.showToast('Firebase non détecté.','danger'); return; }
    var submitBtn = document.getElementById('sa-submit');
    var prog      = document.getElementById('sa-prog');
    var fill      = document.getElementById('sa-prog-fill');
    var txt       = document.getElementById('sa-prog-txt');
    if (submitBtn) submitBtn.style.display = 'none';
    if (prog)      prog.style.display = 'block';

    try {
      var db2     = firebase.firestore();
      var storage = firebase.storage();
      var fd      = new FormData(e.target);
      var shopName= (fd.get('shop_name')||'boutique').replace(/\s+/g,'_').toLowerCase();
      var ts      = Date.now();
      var folder  = 'candidatures/' + shopName + '_' + ts;

      var pm = [];
      ['payment_mobile_money','payment_cash','payment_card','payment_transfer'].forEach(function(n){ if(fd.get(n)) pm.push(fd.get(n)); });

      var data = {
        shop_name:      fd.get('shop_name'), legal_status: fd.get('legal_status'),
        rccm:           fd.get('rccm')||'',  ifu_num:      fd.get('ifu')||'',
        owner_name:     fd.get('owner_name'),owner_role:   fd.get('owner_role'),
        phone:          fd.get('phone'),     email:        fd.get('email'),
        address:        fd.get('address'),   bank_account: fd.get('bank_account')||'',
        payment_methods:pm, billing_address:fd.get('billing_address')||'',
        categories:     fd.get('categories'),brand_story:  fd.get('brand_story'),
        delivery_time:  fd.get('delivery_time')||'', return_policy:fd.get('return_policy')||'',
        social_instagram:fd.get('social_instagram')||'', social_website:fd.get('social_website')||'',
        status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (txt) txt.textContent = 'Envoi des fichiers…';
      var files = [
        { id:'inp-logo', field:'logo_url',     name:'logo'    },
        { id:'inp-id',   field:'id_card_url',  name:'id_card' },
        { id:'inp-rccm', field:'rccm_doc_url', name:'rccm_doc'},
        { id:'inp-ifu',  field:'ifu_doc_url',  name:'ifu_doc' },
      ];
      var active = files.filter(function(f){ return document.getElementById(f.id) && document.getElementById(f.id).files.length>0; });
      var done   = 0;
      for (var fi of active) {
        var file = document.getElementById(fi.id).files[0];
        var ext  = file.name.split('.').pop();
        var ref  = storage.ref(folder+'/'+fi.name+'.'+ext);
        var task = ref.put(file);
        await new Promise(function(res,rej){ task.on('state_changed', function(snap){ if(fill) fill.style.width=((done+snap.bytesTransferred/snap.totalBytes)/active.length*100)+'%'; }, rej, async function(){ data[fi.field]=await task.snapshot.ref.getDownloadURL(); done++; res(); }); });
      }
      if (txt)  txt.textContent = 'Finalisation…';
      if (fill) fill.style.width = '100%';
      await db2.collection('seller_applications').add(data);

      e.target.style.display = 'none';
      if (prog) prog.style.display = 'none';
      var success = document.getElementById('sa-success');
      if (success) { success.style.display='block'; success.scrollIntoView({behavior:'smooth',block:'center'}); }
    } catch(err){
      console.error(err);
      if(window.showToast) window.showToast('Erreur : '+err.message,'danger');
      if(submitBtn) submitBtn.style.display='inline-flex';
      if(prog) prog.style.display='none';
    }
  });
})();


/* ══════════════════════════════════════════════════════════
   §18 seller-onboarding.html
   ══════════════════════════════════════════════════════════ */
(function initSellerOnboarding() {
  if (!document.querySelector('.so-hero')) return;

  function animCount(el, target) {
    if (!el) return;
    var suffix = target >= 500 ? '+' : '';
    var dur = 2200, s = performance.now();
    (function step(now) {
      var t    = Math.min((now - s) / dur, 1);
      var ease = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(ease * target) + (t < 1 ? '' : suffix);
      if (t < 1) requestAnimationFrame(step);
    })(s);
  }

  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    var db2 = firebase.firestore();
    Promise.all([db2.collection('shops').get(), db2.collection('products').get()])
      .then(function(results) {
        var sc = results[0].size, pc = results[1].size;
        ['met-sellers','stat-sellers'].forEach(function(id){ animCount(document.getElementById(id), sc||25); });
        ['met-products','stat-products'].forEach(function(id){ animCount(document.getElementById(id), pc||500); });
      })
      .catch(function() {
        ['met-sellers','stat-sellers'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent='25+'; });
        ['met-products','stat-products'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent='500+'; });
      });
  }
})();


/* ══════════════════════════════════════════════════════════
   §19 seller.html  (dashboard vendeur alternatif)
   La logique principale est dans admin.js.
   Ce module gère uniquement les éléments UI spécifiques
   à seller.html (tabs, format helpers, messages sidebar).
   ══════════════════════════════════════════════════════════ */
(function initSellerDashboard() {
  if (!document.getElementById('sd')) return;

  /* — Tab switch — */
  window.sdSwitchTab = function(name) {
    document.querySelectorAll('#sd .sd-tab').forEach(function(t){ t.classList.remove('on'); });
    document.querySelectorAll('#sd .sd-nav-item[data-tab]').forEach(function(l){ l.classList.remove('on'); });
    var tab  = document.getElementById('sd-tab-'+name);
    if (tab) tab.classList.add('on');
    var link = document.querySelector('#sd .sd-nav-item[data-tab="'+name+'"]');
    if (link) link.classList.add('on');
    var TITLES = { overview:'Vue d\'ensemble', products:'Mes Produits', 'add-product':'Ajouter un produit', orders:'Commandes', settings:'Paramètres', messages:'Messagerie' };
    var el = document.getElementById('sd-topbar-section'); if(el) el.textContent = TITLES[name]||name;
    var sb = document.getElementById('sd-sidebar'); if(sb) sb.classList.remove('open');
  };

  // Initialize SD nav item click listeners
  function initSDNavListeners() {
    var items = document.querySelectorAll('#sd .sd-nav-item[data-tab]');
    if (items.length === 0) {
      // If items don't exist yet, wait for DOMContentLoaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSDNavListeners);
      } else {
        // Wait a bit and retry
        setTimeout(initSDNavListeners, 100);
      }
      return;
    }
    items.forEach(function(link){
      link.addEventListener('click', function(e){ e.preventDefault(); window.sdSwitchTab(link.getAttribute('data-tab')); });
    });
  }

  // Try to initialize immediately, then on DOMContentLoaded as fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSDNavListeners);
  } else {
    initSDNavListeners();
  }

  window.sdLogout = function() {
    if (!confirm('Se déconnecter ?')) return;
    firebase.auth().signOut().then(function(){ window.location.href='login.html'; });
  };

  // Delegated event listener for nav items (more reliable)
  var sdNav = document.getElementById('sd-sidebar') || document.querySelector('#sd .sd-nav');
  if (sdNav) {
    sdNav.addEventListener('click', function(e) {
      var link = e.target.closest('.sd-nav-item[data-tab]');
      if (link) {
        e.preventDefault();
        window.sdSwitchTab(link.getAttribute('data-tab'));
      }
    });
  }

  var sdFmt     = function(n){ return new Intl.NumberFormat('fr-FR').format(n); };
  var sdFmtDate = function(ts){ try{ var d=ts?.toDate?ts.toDate():new Date(ts?.seconds?ts.seconds*1000:ts); return d.toLocaleDateString('fr-FR'); }catch{return '';} };

  function sdStatus(status) {
    var s = (status||'').toLowerCase();
    if (s==='pending_admin'||s==='pending')        return { label:'En attente',    cls:'warn' };
    if (s==='pending_seller')                      return { label:'En préparation',cls:'info' };
    if (s==='ready_for_delivery')                  return { label:'En livraison',  cls:'info' };
    if (s==='delivered'||s.includes('livr'))       return { label:'Livré',         cls:'ok'   };
    if (s==='cancelled'||s.includes('annul'))      return { label:'Annulé',        cls:'err'  };
    if (s==='shipped'||s.includes('expéd'))        return { label:'Expédié',       cls:'info' };
    return { label:'En cours', cls:'info' };
  }

  /* — Image preview — */
  var fpImages = document.getElementById('fp-images');
  if (fpImages) {
    fpImages.addEventListener('change', function() {
      var preview = document.getElementById('sd-img-preview'); if(!preview) return;
      preview.innerHTML = '';
      Array.from(this.files).forEach(function(file) {
        var r = new FileReader();
        r.onload = function(e2){
          var div = document.createElement('div'); div.className='sd-img-thumb';
          div.innerHTML='<img src="'+e2.target.result+'" alt=""><button class="sd-img-thumb-del" type="button" onclick="this.parentElement.remove()" title="Supprimer">×</button>';
          preview.appendChild(div);
        };
        r.readAsDataURL(file);
      });
    });
  }
  window.sdResetForm = function() { var f=document.getElementById('sd-product-form'); if(f) f.reset(); var p=document.getElementById('sd-img-preview'); if(p) p.innerHTML=''; window.sdSwitchTab('products'); };

  /* — Dashboard Firebase — */
  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
  var db2  = firebase.firestore();
  var auth = firebase.auth();
  var storage = firebase.storage ? firebase.storage() : null;
  var currentShopId = null, currentShopData = null;

  auth.onAuthStateChanged(async function(user){
    if (!user) { window.location.href='login.html'; return; }
    try {
      var snap = await db2.collection('shops').where('ownerEmail','==',user.email).limit(1).get();
      if (snap.empty) { if(window.showToast) window.showToast('Aucune boutique trouvée.','danger'); return; }
      var doc = snap.docs[0];
      currentShopId   = doc.id;
      currentShopData = Object.assign({ id:doc.id }, doc.data());
      initSdDashboard(user, currentShopData);
    } catch(e){ if(window.showToast) window.showToast('Erreur chargement boutique.','danger'); console.error(e); }
  });

  async function initSdDashboard(user, shop) {
    var name = shop.name||'Ma Boutique';
    var setEl= function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
    setEl('sd-shop-name',    name);
    setEl('sd-topbar-shop',  name);
    setEl('sd-shop-initial', name.charAt(0).toUpperCase());
    if (shop.logo) { var img=document.getElementById('sd-shop-logo'); if(img){img.src=shop.logo;img.style.display='block';} var ini=document.getElementById('sd-shop-initial'); if(ini)ini.style.display='none'; }
    var isActive  = shop.status==='active'||shop.status==='Active';
    var statusHtml= '<span class="sd-status-badge '+(isActive?'ok':'warn')+'">'+(isActive?'● Active':'○ Inactive')+'</span>';
    ['sd-shop-status-block','sd-shop-status-inline'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerHTML=statusHtml; });
    setEl('sd-shop-category', shop.category||'—');
    ['name','category','city','phone','description'].forEach(function(k){ var el=document.getElementById('sp-'+k); if(el) el.value=shop[k]||''; });

    await Promise.all([sdLoadProducts(), sdLoadOrders(), sdLoadStats()]);
    sdLoadMessages(user);
  }

  async function sdLoadProducts() {
    try {
      var snap = await db2.collection('products').where('shopId','==',currentShopId).get();
      var products = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var badge = document.getElementById('sd-products-badge');
      if (badge) { badge.textContent=products.length; badge.style.display=products.length?'flex':'none'; }
      var tbody = document.getElementById('sd-products-tbody'); if(!tbody) return;
      if (!products.length) { tbody.innerHTML='<tr><td colspan="6"><div class="sd-empty"><div class="sd-empty-title">Aucun produit</div></div></td></tr>'; return; }
      tbody.innerHTML = products.map(function(p){
        var img = (Array.isArray(p.images)?p.images[0]:null)||p.image||'assets/img/placeholder-product-1.svg';
        var st  = sdStatus(p.status||'active');
        return '<tr><td><div class="sd-prod-cell"><div class="sd-prod-thumb"><img src="'+img+'" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"></div><div><div class="sd-prod-name">'+(p.name||'—')+'</div><div class="sd-prod-cat">'+(p.category||'')+'</div></div></div></td><td class="price">'+sdFmt(p.price||0)+' FCFA</td><td style="color:'+(p.stock<5?'var(--warn)':'rgba(254,252,248,.6)')+';">'+(p.stock||0)+'</td><td>'+(p.category||'—')+'</td><td><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></td><td><div class="sd-table-actions"><button class="sd-tbl-btn" onclick="sdEditProduct(\''+p.id+'\')">Modifier</button><button class="sd-tbl-btn del" onclick="sdDeleteProduct(\''+p.id+'\',\''+(p.name||'').replace(/'/g,"\\'")+'\')">&times; Supprimer</button></div></td></tr>';
      }).join('');
    } catch(e){ console.error('[sd] sdLoadProducts:', e); }
  }

  async function sdLoadOrders() {
    try {
      var snap = await db2.collection('orders').where('sellerId','==',currentShopId).orderBy('createdAt','desc').limit(20).get()
        .catch(function(){ return db2.collection('orders').where('sellerId','==',currentShopId).limit(20).get(); });
      var orders  = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var badge   = document.getElementById('sd-orders-badge');
      var pending = orders.filter(function(o){ return !['delivered','cancelled'].includes((o.status||'').toLowerCase()); }).length;
      if (badge) { badge.textContent=pending; badge.style.display=pending?'flex':'none'; }
      var c = document.getElementById('sd-orders-list'); if(c) c.innerHTML = orders.length
        ? orders.map(function(o){ var st=sdStatus(o.status); return '<div class="sd-order-row"><div><div class="sd-order-ref">#'+(o.reference||o.id.substring(0,8).toUpperCase())+'</div><div class="sd-order-meta">'+sdFmtDate(o.createdAt)+'</div></div><div><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></div><div style="font-family:\'Unbounded\',sans-serif;font-size:13px;color:var(--g);font-weight:700">'+sdFmt(o.total||0)+' FCFA</div><div><select class="sd-input" style="padding:6px 28px 6px 10px;font-size:11px;background:var(--i3)" onchange="sdUpdateOrderStatus(\''+o.id+'\',this.value)"><option value="pending_admin"'+(o.status==='pending_admin'?' selected':'')+'>En attente</option><option value="pending_seller"'+(o.status==='pending_seller'?' selected':'')+'>En préparation</option><option value="ready_for_delivery"'+(o.status==='ready_for_delivery'?' selected':'')+'>En livraison</option><option value="delivered"'+(o.status==='delivered'?' selected':'')+'>Livré</option><option value="cancelled"'+(o.status==='cancelled'?' selected':'')+'>Annulé</option></select></div><div></div></div>'; }).join('')
        : '<div class="sd-empty"><div class="sd-empty-title">Aucune commande</div></div>';
      var cr = document.getElementById('sd-recent-orders'); if(cr) cr.innerHTML = orders.slice(0,5).map(function(o){ var st=sdStatus(o.status); return '<div class="sd-order-row"><div><div class="sd-order-ref">#'+(o.reference||o.id.substring(0,8).toUpperCase())+'</div><div class="sd-order-meta">'+sdFmtDate(o.createdAt)+'</div></div><div><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></div><div style="font-family:\'Unbounded\',sans-serif;font-size:13px;color:var(--g);font-weight:700">'+sdFmt(o.total||0)+' FCFA</div><div></div><div></div></div>'; }).join('');
    } catch(e){ console.error('[sd] sdLoadOrders:', e); }
  }

  async function sdLoadStats() {
    try {
      var snap = await db2.collection('orders').where('sellerId','==',currentShopId).get()
        .catch(function(){ return db2.collection('orders').where('shopId','==',currentShopId).get(); });
      var totalSales = snap.docs.map(function(d){return d.data();}).filter(function(o){return o.status==='delivered';}).reduce(function(s,o){return s+(o.total||0);},0);
      var psnap      = await db2.collection('products').where('shopId','==',currentShopId).get();
      var setEl      = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
      setEl('sd-stat-products', sdFmt(psnap.size));
      setEl('sd-stat-sales',    sdFmt(totalSales));
      setEl('sd-stat-views',    sdFmt(currentShopData.views||0));
    } catch(e){ ['sd-stat-products','sd-stat-sales','sd-stat-views'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='—';}); }
  }

  window.sdUpdateOrderStatus = async function(orderId, newStatus) {
    try {
      await db2.collection('orders').doc(orderId).update({ status:newStatus, updatedAt:firebase.firestore.FieldValue.serverTimestamp() });
      if(window.showToast) window.showToast('Statut mis à jour','success');
    } catch(e){ if(window.showToast) window.showToast('Erreur mise à jour','danger'); }
  };

  window.sdEditProduct = function(pid) {
    window.sdSwitchTab('add-product');
    db2.collection('products').doc(pid).get().then(function(doc){ if(!doc.exists) return; var p=doc.data(); ['name','category','price','original-price','stock','sku','description'].forEach(function(k){ var el=document.getElementById('fp-'+k.replace('-','_').replace('original_price','original-price')); if(el) el.value=p[k.replace('-','Price').replace('_','')]||p[k]||''; }); var fp=document.getElementById('sd-product-form'); if(fp) fp.dataset.editId=pid; });
  };
  window.sdDeleteProduct = async function(pid, name) {
    if (!confirm('Supprimer "'+name+'" ?')) return;
    try { await db2.collection('products').doc(pid).delete(); if(window.showToast) window.showToast('Produit supprimé','success'); sdLoadProducts(); }
    catch(e){ if(window.showToast) window.showToast('Erreur suppression','danger'); }
  };

  var sdProductForm = document.getElementById('sd-product-form');
  if (sdProductForm) {
    sdProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('sd-submit-btn'); if(btn) { btn.disabled=true; var sp=btn.querySelector('span'); if(sp) sp.textContent='Publication…'; }
      try {
        var editId = e.target.dataset.editId;
        var g = function(id){ return document.getElementById(id)?.value||''; };
        var data = {
          name:g('fp-name'), category:g('fp-category'), price:Number(g('fp-price'))||0,
          stock:Number(g('fp-stock'))||0, sku:g('fp-sku'), description:g('fp-description'),
          colors:g('fp-colors').split(',').map(function(c){return c.trim();}).filter(Boolean),
          sizes: g('fp-sizes').split(',').map(function(s){return s.trim();}).filter(Boolean),
          shopId:currentShopId, shopName:currentShopData?.name||'',
          updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
        };
        var op = Number(g('fp-original-price'))||0; if(op) data.originalPrice=op;
        // Upload images si présentes
        var fileInput = document.getElementById('fp-images');
        if (fileInput && fileInput.files.length > 0 && storage) {
          var urls=[]; for(var file of fileInput.files){ var ref2=storage.ref('products/'+currentShopId+'/'+Date.now()+'_'+file.name); var sn=await ref2.put(file); urls.push(await sn.ref.getDownloadURL()); } data.images=urls; data.image=urls[0];
        }
        if (editId) { await db2.collection('products').doc(editId).update(data); delete e.target.dataset.editId; if(window.showToast) window.showToast('Produit mis à jour','success'); }
        else { data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db2.collection('products').add(data); if(window.showToast) window.showToast('Produit publié avec succès','success'); }
        e.target.reset(); var prev=document.getElementById('sd-img-preview'); if(prev) prev.innerHTML=''; window.sdSwitchTab('products'); sdLoadProducts();
      } catch(err){ if(window.showToast) window.showToast('Erreur : '+err.message,'danger'); console.error(err); }
      finally { if(btn){ btn.disabled=false; var sp=btn.querySelector('span'); if(sp) sp.textContent='Publier le produit'; } }
    });
  }

  var sdSettingsForm = document.getElementById('sd-settings-form');
  if (sdSettingsForm) {
    sdSettingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        var g = function(id){ return document.getElementById(id)?.value||''; };
        var updates = { name:g('sp-name'), category:g('sp-category'), city:g('sp-city'), phone:g('sp-phone'), description:g('sp-description'), updatedAt:firebase.firestore.FieldValue.serverTimestamp() };
        var logoFile = document.getElementById('sp-logo-file')?.files[0];
        if (logoFile && storage) { var ref3=storage.ref('shops/'+currentShopId+'/logo_'+Date.now()+'.jpg'); var sn2=await ref3.put(logoFile); updates.logo=await sn2.ref.getDownloadURL(); }
        await db2.collection('shops').doc(currentShopId).update(updates);
        if(window.showToast) window.showToast('Boutique mise à jour','success');
        ['sd-shop-name','sd-topbar-shop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=updates.name; });
        var ini=document.getElementById('sd-shop-initial'); if(ini) ini.textContent=updates.name.charAt(0).toUpperCase();
      } catch(err){ if(window.showToast) window.showToast('Erreur : '+err.message,'danger'); }
    });
  }

  var spLogoFile = document.getElementById('sp-logo-file');
  if (spLogoFile) {
    spLogoFile.addEventListener('change', function() {
      var prev = document.getElementById('sp-logo-preview'); if(!prev||!this.files[0]) return;
      var r = new FileReader(); r.onload=function(e2){ prev.innerHTML='<div class="sd-img-thumb" style="width:80px;height:80px"><img src="'+e2.target.result+'"></div>'; }; r.readAsDataURL(this.files[0]);
    });
  }

  function sdLoadMessages(user) {
    var container = document.getElementById('sd-messages-list'); if(!container) return;
    if (typeof window.subscribeUserChats !== 'function') { container.innerHTML='<div class="sd-empty"><div class="sd-empty-sub">Messagerie indisponible.</div></div>'; return; }
    window.subscribeUserChats(user.uid, function(chats){
      var badge = document.getElementById('sd-msg-badge');
      if (badge) { badge.textContent=chats.length; badge.style.display=chats.length?'flex':'none'; }
      if (!chats.length) { container.innerHTML='<div class="sd-empty"><div class="sd-empty-title">Aucune discussion</div></div>'; return; }
      container.innerHTML = chats.map(function(chat){
        var buyer   = chat.buyerName||'Client';
        var initials= buyer.split(' ').map(function(w){return w[0];}).join('').toUpperCase().substring(0,2);
        var preview = chat.lastMessage ? (chat.lastMessage.length>60?chat.lastMessage.substring(0,60)+'…':chat.lastMessage) : 'Aucun message';
        var time    = chat.lastMessageAt||chat.updatedAt;
        if (time) { var d=time.toDate?time.toDate():new Date(time.seconds?time.seconds*1000:time); var diff=Math.floor((Date.now()-d)/1000); time = diff<60?'À l\'instant':diff<3600?Math.floor(diff/60)+'min':diff<86400?Math.floor(diff/3600)+'h':d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); } else time='';
        var p = new URLSearchParams({ chatId:chat.id, shopId:chat.shopId||'', sellerId:chat.sellerId||'' });
        return '<a href="messages.html?'+p.toString()+'" class="sd-disc-item"><div class="sd-disc-avatar">'+initials+'</div><div style="flex:1;min-width:0"><div class="sd-disc-name">'+buyer+'</div><div class="sd-disc-preview">'+preview+'</div></div><div class="sd-disc-time">'+time+'</div></a>';
      }).join('');
    }, function(){ container.innerHTML='<div class="sd-empty"><div class="sd-empty-sub">Impossible de charger les discussions.</div></div>'; });
  }
})();


/* ══════════════════════════════════════════════════════════
   §20 wishlist.html  — chargement Firestore
   La logique générale est dans app.js (initWishlist).
   Ce module gère le chargement Firestore des IDs locaux.
   ══════════════════════════════════════════════════════════ */
(function initWishlistFirestore() {
  var loaderEl  = document.getElementById('wl-loader');
  var emptyEl   = document.getElementById('wl-empty');
  var contentEl = document.getElementById('wl-content');
  var gridEl    = document.getElementById('wl-grid');
  var filtersEl = document.getElementById('wl-filters');
  var sortEl    = document.getElementById('wl-sort');
  if (!gridEl)   return;   // pas sur wishlist.html

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
      for (var chunk of chunks) {
        var snap = await db2.collection('products').where(firebase.firestore.FieldPath.documentId(),'in',chunk).get();
        snap.docs.forEach(function(d){ products.push(Object.assign({id:d.id},d.data())); });
      }
      // Préserver l'ordre du localStorage
      allProducts = ids.map(function(id){ return products.find(function(p){ return p.id===id; }); }).filter(Boolean);
      if (!allProducts.length) { showEmpty(); return; }
      buildFilters();
      renderWl();
    } catch(e){ console.error('[wishlist]', e); showEmpty(); }
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
})();

/* ══════════════════════════════════════════════════════════
   FIN — prime.js v2
   ══════════════════════════════════════════════════════════ */