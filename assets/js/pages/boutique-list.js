/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/boutique-list.js
 * Page boutique-list.html — Listing des boutiques par catégorie
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

(()=>{
  const ring=document.getElementById('bl-ring'),dot=document.getElementById('bl-dot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
  (function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();
  document.addEventListener('mouseover',e=>{if(e.target.closest('a,button,select,[onclick],.bl-card'))document.body.classList.add('bl-h')});
  document.addEventListener('mouseout',e=>{if(e.target.closest('a,button,select,[onclick],.bl-card'))document.body.classList.remove('bl-h')});
})();

  function setupHeaderMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('close-btn');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('menu-overlay');

    const toggleMenu = () => {
      if (!drawer || !overlay) return;
      drawer.classList.toggle('active');
      overlay.classList.toggle('active');
      document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
    };

    if(menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);

    const cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
      if (count > 0) {
        badge.innerText = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupHeaderMenu();

    // Remise en place de ta fonction pour l'année !
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.innerText = new Date().getFullYear();
    }

    // Gestion de la déconnexion
    const logoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                window.location.href = "login.html";
            });
        });
    }

    // --- CHARGEMENT BOUTIQUES ---
    if(typeof firebase === 'undefined' || !firebase.apps.length) {
       document.getElementById('shops-grid').innerHTML = `
          <div class="bl-empty" style="grid-column: 1 / -1; border:none; background:transparent;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h3 class="bl-empty-title">Erreur de chargement</h3>
            <p class="bl-empty-sub">Firebase n'est pas initialisé.</p>
          </div>
       `;
       return;
    }

    const db = firebase.firestore();
    const categorySelect = document.getElementById('category-filter');
    const grid = document.getElementById('shops-grid');

    const fallbackCategories = [
      'Mode & Accessoires',
      'Beauté, Hygiène & Bien-être',
      'Électronique, Téléphonie & Informatique',
      'Maison, Meubles & Décoration',
      'Bâtiment, Quincaillerie & Matériaux',
      'Véhicules & Mobilité',
      'Restauration & Boissons'
    ];

    const fallbackShops = [
      { id:'test-mode', name:'Mode & Accessoires', description:'Tendances premium et pièces uniques.', category:'Mode & Accessoires' },
      { id:'test-beaute', name:'Beauté & Bien-être', description:'Cosmétiques, soins et parfums d\'exception.', category:'Beauté, Hygiène & Bien-être' },
      { id:'test-electro', name:'Électronique', description:'High-Tech, téléphonie et informatique.', category:'Électronique, Téléphonie & Informatique' }
    ];

    function renderShops(list) {
      if(!list || list.length === 0) {
        grid.innerHTML = `
          <div class="bl-empty" style="grid-column: 1 / -1; border:none; background:transparent;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
            <h3 class="bl-empty-title">Aucune galerie trouvée</h3>
            <p class="bl-empty-sub">Il n'y a pas encore de boutiques dans cette catégorie.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = list.map((shop, idx) => {
        const logo = shop.logo || shop.image || 'assets/img/placeholder-urban.svg';
        const banner = shop.banner || 'assets/img/hero.png';
        const hasLogo = Boolean(shop.logo || shop.image);
        return `
          <a href="boutique.html?id=${shop.id}" class="bl-card" style="transition-delay: ${idx * 0.05}s;">
            <div class="bl-card-banner" style="background-image: url('${banner}'); background-size: cover; background-position: center;"></div>
            <div class="bl-card-avatar">
              ${hasLogo 
                ? `<img src="${logo}" alt="${shop.name || 'Boutique'}" onerror="this.style.display='none';">`
                : `<i data-lucide="store"></i>`}
            </div>
            <div class="bl-card-body">
              <span class="bl-card-cat">${shop.category || 'Catégorie'}</span>
              <h3 class="bl-card-name">${shop.name || 'Boutique'}</h3>
              <p class="bl-card-desc">${shop.description || 'Visitez notre vitrine pour découvrir nos collections exclusives et nos nouveautés.'}</p>
              <div class="bl-card-footer">
                <span class="bl-card-btn">
                  Explorer 
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </a>
        `;
      }).join('');

      // Déclenche l'animation d'entrée
      setTimeout(() => {
        document.querySelectorAll('.bl-card').forEach(el => el.classList.add('on'));
      }, 50);

      if (window.lucide) lucide.createIcons();
    }

    async function loadCategories() {
      try {
        const snap = await db.collection('categories').get();
        const cats = [];
        snap.forEach(doc => cats.push(doc.data().name));
        const all = (cats.length ? cats : fallbackCategories);
        categorySelect.innerHTML = '<option value="">Toutes les galeries</option>' + all.map(c => `<option value="${c}">${c}</option>`).join('');
      } catch(err) {
        categorySelect.innerHTML = '<option value="">Toutes les galeries</option>' + fallbackCategories.map(c => `<option value="${c}">${c}</option>`).join('');
      }
    }

    async function loadShops(filterCat='') {
      grid.innerHTML = `
        <div class="bl-loader" style="grid-column: 1 / -1; border:none; background:transparent;">
          <span class="bl-loader-ring"></span>
          <p class="bl-loader-txt">Recherche en cours</p>
        </div>
      `;
      try {
        let ref = db.collection('shops');
        if(filterCat) ref = ref.where('category','==',filterCat);
        const snap = await ref.get();
        const shops = [];
        snap.forEach(doc => shops.push({ id: doc.id, ...doc.data() }));
        renderShops(shops.length ? shops : (filterCat ? [] : fallbackShops));
      } catch(err) {
        renderShops(filterCat ? [] : fallbackShops);
      }
    }

    categorySelect.addEventListener('change', (e) => {
      loadShops(e.target.value || '');
    });

    loadCategories();
    loadShops();
  });
