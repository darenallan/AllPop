
// Utilitaires généraux (toasts, header/footer, formatage)
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Fix Lucide icons visibility - force stroke attributes (global function)
window.fixLucideIcons = function() {
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    // Target all SVGs that Lucide creates
    document.querySelectorAll('svg').forEach(svg => {
      // Check if it's a Lucide icon (has lucide class or is inside icon-btn)
      const isLucide = svg.classList.contains('lucide') || 
                       svg.className.baseVal?.includes('lucide') ||
                       svg.closest('.icon-btn') ||
                       svg.closest('.nav-actions') ||
                       svg.closest('.header') ||
                       svg.closest('.navbar') ||
                       svg.closest('.btn');
      
      if (isLucide) {
        // Force attributes on SVG
        svg.setAttribute('stroke', '#0F0F0F');
        svg.setAttribute('stroke-width', '2.5');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.style.cssText = `
          stroke: #0F0F0F !important;
          stroke-width: 2.5 !important;
          width: 24px !important;
          height: 24px !important;
          min-width: 24px !important;
          min-height: 24px !important;
          max-width: 24px !important;
          max-height: 24px !important;
          color: #0F0F0F !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          flex-shrink: 0 !important;
        `;
        
        // Also fix all child elements (path, line, circle, etc.)
        svg.querySelectorAll('path, line, circle, polyline, polygon, rect').forEach(child => {
          child.setAttribute('stroke', '#0F0F0F');
          child.setAttribute('stroke-width', '2.5');
          child.style.cssText = 'stroke: #0F0F0F !important; stroke-width: 2.5 !important; visibility: visible !important;';
        });
      }
    });
  });
};

// Re-apply icon fixes on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    window.fixLucideIcons();
  }, 100);
});

// Observer pour re-fixer les icones quand le DOM change
const iconObserver = new MutationObserver((mutations) => {
  let shouldFix = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && (node.tagName === 'SVG' || node.querySelector?.('svg'))) {
          shouldFix = true;
          break;
        }
      }
    }
    if (shouldFix) break;
  }
  if (shouldFix && window.fixLucideIcons) {
    setTimeout(window.fixLucideIcons, 50);
  }
});

// Demarrer l'observer quand le DOM est pret
document.addEventListener('DOMContentLoaded', () => {
  iconObserver.observe(document.body, { childList: true, subtree: true });
});

function showToast(message, type = 'info'){
  const c = document.getElementById('toast-container');
  if(!c) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderLeft = `4px solid ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : type === 'danger' ? 'var(--danger)' : 'var(--gold)'}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(()=> t.remove(), 3500);
}

function formatFCFA(amount){
  try { return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'; }
  catch(e){ return (Number(amount) || 0).toFixed(2) + ' FCFA'; }
}

async function copyToClipboard(text){
  try {
    await navigator.clipboard.writeText(text);
    showToast('Lien copié dans le presse-papier', 'success');
  } catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    showToast('Lien copié', 'success');
  }
}

function injectHeader(){
  const h = document.getElementById('app-header');
  if(!h) return;

  const user = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');

  h.innerHTML = `
  <nav class="navbar" aria-label="Barre de navigation principale">
    <a href="index.html" class="brand" aria-label="Accueil Aurum">
      <div class="brand-logo-img">
        <img src="assets/img/logo.jpg" alt="Logo Aurum" />
      </div>
      <div>
        <div class="brand-name">Aurum</div>
        <div class="tagline">Excellence à Votre Portée</div>
      </div>
    </a>

    <div class="nav-actions">
      <button class="icon-btn" id="search-btn" data-search-btn aria-label="Rechercher" title="Rechercher">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>

      <a href="cart.html" class="icon-btn" id="cart-btn" aria-label="Panier">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="badge" id="cart-badge" aria-label="Articles dans le panier">0</span>
      </a>

      <button class="icon-btn" id="burger-btn" data-burger-btn aria-label="Menu" title="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  </nav>

  <!-- Search Overlay -->
  <div id="search-overlay"></div>

  <!-- Search Container -->
  <div class="search-container">
    <input type="text" id="search-input" placeholder="Rechercher un produit..." aria-label="Recherche produits" />
    <button class="search-close-btn" aria-label="Fermer la recherche">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- Search Results -->
  <div id="search-results"></div>

  <!-- Mobile Menu -->
  <div class="mobile-menu">
    <a href="index.html" class="mobile-menu-item">🏠 Accueil</a>
    <a href="catalogue.html" class="mobile-menu-item">🛍️ Catalogue</a>
    <a href="seller.html" class="mobile-menu-item">🏪 Espace Vendeur</a>
    <a href="wishlist.html" class="mobile-menu-item">❤️ Favoris</a>
    <a href="order.html" class="mobile-menu-item">📦 Mes Commandes</a>
    <div class="mobile-menu-divider"></div>
    ${user ? `
      <a href="order.html" class="mobile-menu-item">👤 Mon Compte</a>
      <button id="mobile-logout-btn" class="mobile-menu-item" style="text-align: left; width: 100%; cursor: pointer;">🚪 Déconnexion</button>
    ` : `
      <a href="login.html" class="mobile-menu-item">🔐 Connexion</a>
      <a href="register.html" class="mobile-menu-item">✍️ Inscription</a>
    `}
  </div>
  `;

  // Logout handlers
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('ac_currentUser');
      showToast('Déconnecté', 'success');
      setTimeout(() => location.href = 'index.html', 700);
    });
  }


  // Initialize Lucide icons with enhanced visibility
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke': '#0F0F0F',
        'stroke-width': '2.5',
        'width': '24',
        'height': '24'
      }
    });
    // Force icon visibility after creation
    window.fixLucideIcons();
  }

  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      localStorage.removeItem('ac_currentUser');
      showToast('Déconnecté', 'success');
      setTimeout(()=> location.href = 'index.html', 700);
    });
  }
}

function injectFooter(){
  const f = document.getElementById('app-footer');
  if(!f) return;
  f.innerHTML = `
  <div class="container cols">
    <div>
      <h3>À propos</h3>
      <p>Start-up burkinabè: Qualité, Courtoisie, Efficacité.</p>
    </div>
    <div>
      <h3>Liens</h3>
      <p><a href="index.html">Accueil</a></p>
      <p><a href="catalogue.html">Catalogue</a></p>
      <p><a href="faq.html">FAQ</a></p>
      <p><a href="cgu.html">Règles d'utilisation</a></p>
      <p><a href="seller.html">Espace vendeur</a></p>
      <p><a href="admin.html">Dashboard Admin</a></p>
    </div>
    <div>
      <h3>Suivez-nous</h3>
      <p><a href="https://www.instagram.com/aurum_bf?igsh=NXNkaXExeTVhNXgy" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.tiktok.com/@aurum_bf?_r=1&_t=ZM-92ULkdEQuCK" target="_blank" rel="noopener">TikTok</a></p>
    </div>
  </div>
  <div class="center mt-4">© ${new Date().getFullYear()} Aurum — Tous droits réservés.</div>`;
}

function updateCartBadge(){
  const el = document.getElementById('cart-badge');
  if(!el) return;
  const count = (typeof getItemCount === 'function') ? getItemCount() : 0;
  const prevCount = parseInt(el.textContent) || 0;
  el.textContent = count;
  el.setAttribute('data-count', count);
  
  // Animate badge on change
  if (count !== prevCount && count > 0) {
    el.classList.remove('updated');
    void el.offsetWidth; // Force reflow
    el.classList.add('updated');
  }
}

function updateWishlistBadge(){
  const el = document.getElementById('wl-badge');
  if(!el) return;
  const count = (typeof getWishlistCount === 'function') ? getWishlistCount() : 0;
  const prevCount = parseInt(el.textContent) || 0;
  el.textContent = count;
  el.setAttribute('data-count', count);
  
  // Animate badge on change
  if (count !== prevCount && count > 0) {
    el.classList.remove('updated');
    void el.offsetWidth; // Force reflow
    el.classList.add('updated');
  }
  
  // Update heart icon fill state
  const heartBtn = document.getElementById('wl-btn');
  if (heartBtn) {
    heartBtn.classList.toggle('active', count > 0);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  injectHeader(); injectFooter();
  updateCartBadge();
  updateWishlistBadge();
  
  // Initialize Lucide icons after DOM loaded
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke': '#0F0F0F',
        'stroke-width': '2.5',
        'width': '24',
        'height': '24'
      }
    });
    window.fixLucideIcons();
  }

  // Mobile menu toggle: show nav links and categories on small screens
  const menuToggle = document.querySelector('.menu-toggle');
  const navbar = document.querySelector('.navbar');
  const searchBar = document.querySelector('.search-bar');
  const catRow = document.querySelector('.categories-row');
  if(menuToggle && navbar){
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      const opened = document.documentElement.classList.toggle('nav-open');
      menuToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
      menuToggle.classList.toggle('open', opened);
      navbar.classList.toggle('mobile-open', opened);
      searchBar && searchBar.classList.toggle('open', opened);
      catRow && catRow.classList.toggle('open', opened);
    });

    document.addEventListener('click', (ev)=>{
      if(document.documentElement.classList.contains('nav-open') && !navbar.contains(ev.target) && !catRow?.contains(ev.target) && !searchBar?.contains(ev.target)){
        document.documentElement.classList.remove('nav-open');
        navbar.classList.remove('mobile-open');
        searchBar && searchBar.classList.remove('open');
        catRow && catRow.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded','false');
      }
    });
  }
});

