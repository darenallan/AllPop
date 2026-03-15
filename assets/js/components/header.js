/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — header.js  v3
 * Composant header universel — design system Awwwards
 * ═══════════════════════════════════════════════════════════════
 *
 * UTILISATION :
 *   <div id="header-placeholder"></div>
 *   <script src="assets/js/components/header.js"></script>
 *
 * MODES :
 *   Par défaut  → header dark (obsidian/gold) — convient aux pages dark
 *   data-theme="light" sur <html> → header light (sable/gold)
 *   Les pages dark n'ont plus besoin d'overrides CSS !
 *
 * FONCTIONS PUBLIQUES :
 *   window.refreshCartCount()  → recalcule le badge panier
 *   window.refreshMsgBadge()   → recalcule le badge messages (si Firebase dispo)
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (window.__aurumHeaderInjected) return;
  window.__aurumHeaderInjected = true;

  /* ── CSS injecté une seule fois ──────────────────────────────── */
  const CSS = `
    :root {
      --hdr-h: 72px;
      --hdr-bg-dark: rgba(11,10,8,0);
      --hdr-bg-dark-scrolled: rgba(11,10,8,.95);
      --hdr-bg-light: rgba(242,237,228,0);
      --hdr-bg-light-scrolled: rgba(242,237,228,.96);
    }

    /* ── BASE ── */
    .aurum-glass-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--hdr-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 40px;
      z-index: 9000;
      transition: background .4s ease, border-color .4s ease, backdrop-filter .4s ease;
      border-bottom: 1px solid transparent;
    }

    /* ── DARK MODE (défaut) ── */
    .aurum-glass-header {
      background: var(--hdr-bg-dark);
    }
    .aurum-glass-header.scrolled {
      background: var(--hdr-bg-dark-scrolled) !important;
      backdrop-filter: blur(22px) !important;
      -webkit-backdrop-filter: blur(22px) !important;
      border-bottom-color: rgba(200,168,75,.12) !important;
      box-shadow: 0 1px 40px rgba(0,0,0,.35);
    }

    /* ── LIGHT MODE ── */
    html[data-theme="light"] .aurum-glass-header {
      background: var(--hdr-bg-light);
    }
    html[data-theme="light"] .aurum-glass-header.scrolled {
      background: var(--hdr-bg-light-scrolled) !important;
      border-bottom-color: rgba(200,168,75,.18) !important;
      box-shadow: 0 1px 24px rgba(0,0,0,.08);
    }

    /* ── LOGO ── */
    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .header-logo {
      width: 32px; height: 32px;
      flex-shrink: 0;
    }
    .header-logo img {
      width: 100%; height: 100%;
      object-fit: contain;
    }
    .header-brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .header-brand-name {
      font-family: 'Unbounded', sans-serif;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .28em;
      text-transform: uppercase;
      color: #FEFCF8;
      line-height: 1;
      transition: color .25s;
    }
    html[data-theme="light"] .header-brand-name {
      color: #0B0A08;
    }
    .header-tagline {
      font-family: 'Syne', sans-serif;
      font-size: 7px;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: #C8A84B;
      font-weight: 600;
      line-height: 1;
    }

    /* ── NAV ── */
    .header-center {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .header-link {
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      text-decoration: none;
      color: rgba(254,252,248,.75);
      transition: color .25s;
      position: relative;
    }
    .header-link::after {
      content: '';
      position: absolute;
      bottom: -3px; left: 0; right: 0;
      height: 1px;
      background: #C8A84B;
      transform: scaleX(0);
      transition: transform .3s cubic-bezier(.16,1,.3,1);
    }
    .header-link:hover { color: #FEFCF8; }
    .header-link:hover::after { transform: scaleX(1); }
    .header-link.active { color: #C8A84B; }
    .header-link.active::after { transform: scaleX(1); }
    html[data-theme="light"] .header-link { color: rgba(11,10,8,.65); }
    html[data-theme="light"] .header-link:hover { color: #0B0A08; }

    /* ── ICONES DROITE ── */
    .header-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .header-icon-btn {
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      position: relative;
      transition: background .2s;
      background: none; border: none; cursor: pointer;
    }
    .header-icon-btn:hover {
      background: rgba(200,168,75,.1);
    }
    .header-icon-btn svg {
      width: 18px; height: 18px;
      stroke: rgba(254,252,248,.8);
      fill: none;
      transition: stroke .25s;
    }
    .header-icon-btn:hover svg { stroke: #C8A84B; }
    html[data-theme="light"] .header-icon-btn svg { stroke: rgba(11,10,8,.7); }
    html[data-theme="light"] .header-icon-btn:hover svg { stroke: #0B0A08; }

    /* Cart badge */
    .header-cart-badge {
      position: absolute;
      top: 4px; right: 4px;
      min-width: 16px; height: 16px;
      background: #C8A84B; color: #0B0A08;
      border-radius: 8px; padding: 0 4px;
      font-family: 'Unbounded', sans-serif;
      font-size: 8px; font-weight: 900;
      display: none; align-items: center; justify-content: center;
      line-height: 1;
    }
    .header-cart-badge.show { display: flex; }

    /* Messages badge */
    .header-msg-badge {
      position: absolute;
      top: 4px; right: 4px;
      width: 8px; height: 8px;
      background: #D94F4F;
      border-radius: 50%;
      display: none;
    }
    .header-msg-badge.show { display: block; }

    /* ── BURGER ── */
    .mobile-burger {
      display: none;
      width: 38px; height: 38px;
      background: none; border: none;
      align-items: center; justify-content: center;
      flex-direction: column; gap: 5px;
      cursor: pointer; padding: 8px;
    }
    .mobile-burger span {
      display: block;
      width: 20px; height: 1.5px;
      background: #FEFCF8;
      transition: all .3s cubic-bezier(.16,1,.3,1);
      transform-origin: center;
    }
    html[data-theme="light"] .mobile-burger span { background: #0B0A08; }
    .mobile-burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .mobile-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .mobile-burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    /* ── MOBILE DRAWER ── */
    .mobile-drawer {
      position: fixed;
      top: 0; right: 0;
      width: min(320px, 85vw);
      height: 100vh;
      background: #1A1916;
      border-left: 1px solid rgba(200,168,75,.1);
      z-index: 9002;
      transform: translateX(100%);
      transition: transform .38s cubic-bezier(.16,1,.3,1);
      display: flex; flex-direction: column;
      overflow-y: auto;
    }
    .mobile-drawer::-webkit-scrollbar { width: 0; }
    .mobile-drawer.active { transform: translateX(0); }

    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 24px 20px;
      border-bottom: 1px solid rgba(200,168,75,.08);
      flex-shrink: 0;
    }
    .drawer-brand {
      font-family: 'Unbounded', sans-serif;
      font-size: 11px; font-weight: 900;
      letter-spacing: .28em; text-transform: uppercase;
      color: #FEFCF8;
    }
    .drawer-brand span { color: #C8A84B; }
    .drawer-close-btn {
      width: 32px; height: 32px;
      background: none; border: 1px solid rgba(200,168,75,.15);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: border-color .2s;
    }
    .drawer-close-btn:hover { border-color: rgba(200,168,75,.4); }
    .drawer-close-btn svg { width: 14px; height: 14px; stroke: #7A7570; }

    .drawer-nav { padding: 16px 0; flex: 1; }
    .drawer-section-label {
      font-family: 'Unbounded', sans-serif;
      font-size: 7.5px; letter-spacing: .22em;
      text-transform: uppercase; color: #4A4540;
      font-weight: 700; padding: 12px 24px 6px;
    }
    .drawer-link {
      display: flex; align-items: center; gap: 13px;
      padding: 13px 24px;
      font-family: 'Syne', sans-serif;
      font-size: 13px; font-weight: 500;
      color: rgba(254,252,248,.65);
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: all .2s;
    }
    .drawer-link:hover {
      color: #FEFCF8;
      border-left-color: #C8A84B;
      background: rgba(200,168,75,.05);
    }
    .drawer-link svg { width: 16px; height: 16px; stroke: #7A7570; flex-shrink: 0; transition: stroke .2s; }
    .drawer-link:hover svg { stroke: #C8A84B; }
    .drawer-link-gold { color: #C8A84B !important; }
    .drawer-link-gold svg { stroke: #C8A84B !important; }
    .drawer-link-danger { color: rgba(217,79,79,.75) !important; }
    .drawer-link-danger svg { stroke: rgba(217,79,79,.75) !important; }
    .drawer-link-danger:hover { color: #D94F4F !important; border-left-color: #D94F4F !important; }
    .drawer-divider {
      height: 1px; background: rgba(255,255,255,.05);
      margin: 8px 24px;
    }

    .drawer-user-card {
      margin: 0 16px 16px;
      padding: 14px 16px;
      background: rgba(200,168,75,.05);
      border: 1px solid rgba(200,168,75,.12);
    }
    .drawer-user-name { font-size: 13px; font-weight: 600; color: #FEFCF8; margin-bottom: 3px; }
    .drawer-user-email { font-size: 11px; color: #7A7570; }

    .mobile-drawer-overlay {
      position: fixed; inset: 0;
      background: rgba(11,10,8,.7);
      z-index: 9001;
      backdrop-filter: blur(2px);
      opacity: 0; pointer-events: none;
      transition: opacity .35s ease;
    }
    .mobile-drawer-overlay.active { opacity: 1; pointer-events: all; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .aurum-glass-header { padding: 0 16px; }
      .header-center { display: none; }
      .mobile-burger { display: flex; }
      .header-brand-text { display: none; }
      .header-tagline { display: none; }
    }
    @media (max-width: 480px) {
      .header-icon-btn { width: 34px; height: 34px; }
      .header-icon-btn svg { width: 16px; height: 16px; }
    }
  `;

  /* ── Inject styles ───────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('aurum-header-styles')) return;
    const style = document.createElement('style');
    style.id = 'aurum-header-styles';
    style.textContent = CSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /* ── Template HTML ───────────────────────────────────────────── */
  function buildHTML() {
    return `
      <header class="aurum-glass-header" id="aurum-header">

        <!-- Logo gauche -->
        <a href="index.html" class="header-brand">
          <div class="header-logo">
            <img src="assets/img/Logo.png" alt="Aurum" onerror="this.style.display='none'"/>
          </div>
          <div class="header-brand-text">
            <span class="header-brand-name">AURUM</span>
            <span class="header-tagline">Excellence à votre portée</span>
          </div>
        </a>

        <!-- Nav centrale (desktop) -->
        <nav class="header-center" aria-label="Navigation principale">
          <a href="index.html"           class="header-link" data-page="index">Accueil</a>
          <a href="catalogue.html"       class="header-link" data-page="catalogue">Catalogue</a>
          <a href="boutique-list.html"   class="header-link" data-page="boutique-list">Boutiques</a>
          <a href="seller-onboarding.html" class="header-link" data-page="seller-onboarding">Vendre</a>
          <a href="apropos.html"         class="header-link" data-page="apropos">À propos</a>
        </nav>

        <!-- Actions droite -->
        <div class="header-right">

          <!-- Recherche -->
          <a href="catalogue.html" class="header-icon-btn" aria-label="Rechercher">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </a>

          <!-- Messages -->
          <a href="messages.html" class="header-icon-btn" id="header-msg-btn" aria-label="Messages">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span class="header-msg-badge" id="header-msg-badge"></span>
          </a>

          <!-- Favoris -->
          <a href="wishlist.html" class="header-icon-btn" aria-label="Favoris">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </a>

          <!-- Panier -->
          <a href="cart.html" class="header-icon-btn" aria-label="Panier">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span class="header-cart-badge" id="cart-count"></span>
          </a>

          <!-- Profil -->
          <a href="profil.html" class="header-icon-btn" id="header-profile-btn" aria-label="Mon profil">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>

          <!-- Burger mobile -->
          <button class="mobile-burger" id="mobile-burger-btn" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>

        </div>
      </header>

      <!-- Drawer mobile -->
      <div class="mobile-drawer" id="mobile-drawer" role="dialog" aria-label="Menu de navigation">
        <div class="drawer-header">
          <span class="drawer-brand">AUR<span>U</span>M</span>
          <button class="drawer-close-btn" id="drawer-close-btn" aria-label="Fermer">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="drawer-user-card" id="drawer-user-card" style="display:none">
          <div class="drawer-user-name" id="drawer-user-name">—</div>
          <div class="drawer-user-email" id="drawer-user-email">—</div>
        </div>

        <nav class="drawer-nav" aria-label="Navigation mobile">
          <div class="drawer-section-label">Navigation</div>
          <a href="index.html" class="drawer-link" data-page="index">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Accueil
          </a>
          <a href="catalogue.html" class="drawer-link" data-page="catalogue">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Catalogue
          </a>
          <a href="boutique-list.html" class="drawer-link" data-page="boutique-list">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            Boutiques
          </a>
          <a href="apropos.html" class="drawer-link" data-page="apropos">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            À propos
          </a>

          <div class="drawer-divider"></div>
          <div class="drawer-section-label">Mon compte</div>

          <a href="wishlist.html" class="drawer-link">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            Mes favoris
          </a>
          <a href="cart.html" class="drawer-link">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            Panier
          </a>
          <a href="messages.html" class="drawer-link">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Messages
          </a>
          <a href="profil.html" class="drawer-link" id="drawer-profile-link">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Mon profil
          </a>

          <div class="drawer-divider"></div>
          <div class="drawer-section-label">Vendeur</div>

          <a href="seller-onboarding.html" class="drawer-link drawer-link-gold">
            <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Devenir vendeur
          </a>
          <a href="seller.html" class="drawer-link">
            <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Espace vendeur
          </a>

          <div class="drawer-divider"></div>

          <a href="login.html" id="drawer-login-link" class="drawer-link" style="display:none">
            <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Connexion
          </a>
          <a href="#" id="drawer-logout-link" class="drawer-link drawer-link-danger" style="display:none">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Déconnexion
          </a>
        </nav>
      </div>

      <!-- Overlay drawer -->
      <div class="mobile-drawer-overlay" id="drawer-overlay"></div>
    `;
  }

  /* ── Active link ─────────────────────────────────────────────── */
  function setActiveLinks() {
    const page = window.location.pathname.split('/').pop().replace('.html','') || 'index';
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  }

  /* ── Scroll effect ───────────────────────────────────────────── */
  function setupScroll() {
    const header = document.getElementById('aurum-header');
    if (!header) return;
    const check = () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ── Cart badge ──────────────────────────────────────────────── */
  function updateCartCount() {
    try {
      const raw = localStorage.getItem('ac_cart') || localStorage.getItem('cart') || '[]';
      const cart = JSON.parse(raw);
      const total = cart.reduce((s, i) => s + (parseInt(i.qty) || parseInt(i.quantity) || 1), 0);
      const badge = document.getElementById('cart-count');
      if (!badge) return;
      badge.textContent = total > 99 ? '99+' : total;
      badge.classList.toggle('show', total > 0);
    } catch (_) {}
  }
  window.refreshCartCount = updateCartCount;

  /* ── Messages badge (Firebase) ───────────────────────────────── */
  function setupMsgBadge(uid) {
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    try {
      firebase.firestore()
        .collection('conversations')
        .where('participants', 'array-contains', uid)
        .where('archived', '==', false)
        .onSnapshot(snap => {
          const unread = snap.docs.reduce((acc, d) => {
            const data = d.data();
            return acc + (data.buyerId === uid ? (data.unreadBuyer || 0) : (data.unreadSeller || 0));
          }, 0);
          const badge = document.getElementById('header-msg-badge');
          if (badge) badge.classList.toggle('show', unread > 0);
        }, () => {});
    } catch (_) {}
  }
  window.refreshMsgBadge = function() {};

  /* ── Auth ────────────────────────────────────────────────────── */
  function setupAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;

    const loginLink   = document.getElementById('drawer-login-link');
    const logoutLink  = document.getElementById('drawer-logout-link');
    const profileBtn  = document.getElementById('header-profile-btn');
    const userCard    = document.getElementById('drawer-user-card');
    const userNameEl  = document.getElementById('drawer-user-name');
    const userEmailEl = document.getElementById('drawer-user-email');

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        if (loginLink)  loginLink.style.display  = 'none';
        if (logoutLink) logoutLink.style.display  = 'flex';
        if (profileBtn) profileBtn.href = 'profil.html';
        if (userCard) {
          userCard.style.display = 'block';
          if (userNameEl)  userNameEl.textContent  = user.displayName || 'Mon compte';
          if (userEmailEl) userEmailEl.textContent = user.email || '';
        }
        setupMsgBadge(user.uid);
        // Mettre à jour window.refreshMsgBadge
        window.refreshMsgBadge = () => setupMsgBadge(user.uid);
      } else {
        if (loginLink)  loginLink.style.display  = 'flex';
        if (logoutLink) logoutLink.style.display  = 'none';
        if (profileBtn) profileBtn.href = 'login.html';
        if (userCard)   userCard.style.display = 'none';
        const badge = document.getElementById('header-msg-badge');
        if (badge) badge.classList.remove('show');
      }
    });

    if (logoutLink) {
      logoutLink.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
          firebase.auth().signOut().then(() => { window.location.href = 'index.html'; });
        }
      });
    }
  }

  /* ── Mobile drawer ───────────────────────────────────────────── */
  function setupDrawer() {
    const burger  = document.getElementById('mobile-burger-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const drawer  = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('drawer-overlay');

    if (!burger || !drawer) return;

    const open = () => {
      drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
      burger.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    burger.addEventListener('click', () => drawer.classList.contains('active') ? close() : open());
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay)  overlay.addEventListener('click', close);

    // Fermer au clic sur un lien (sauf logout)
    drawer.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', e => {
        if (link.id !== 'drawer-logout-link') close();
      });
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('active')) close();
    });
  }

  /* ── Storage listener (panier depuis d'autres onglets) ──────── */
  window.addEventListener('storage', e => {
    if (e.key === 'ac_cart' || e.key === 'cart') updateCartCount();
  });

  /* ── INJECT ──────────────────────────────────────────────────── */
  function injectHeader() {
    const ph = document.getElementById('header-placeholder');
    if (!ph) { console.warn('[Aurum Header] #header-placeholder introuvable.'); return; }

    injectStyles();
    ph.innerHTML = buildHTML();

    setActiveLinks();
    setupScroll();
    updateCartCount();
    setupDrawer();
    setupAuth();
  }

  window.injectHeader = injectHeader;
  window.refreshCartCount = updateCartCount;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

})();