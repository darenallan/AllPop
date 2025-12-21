
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

  const sessionHTML = user ? `
    <div class="user-session">
      <a href="order.html" class="icon-btn user-btn" aria-label="Mon compte" title="Mon compte">
        <i data-lucide="user" class="lucide-icon"></i>
        <span class="icon-label">Compte</span>
      </a>
      <button class="btn btn-sm" id="logout-btn" aria-label="Déconnexion">
        <i data-lucide="log-out" class="lucide-icon lucide-sm"></i>
        <span class="btn-text">Déconnexion</span>
      </button>
    </div>
  ` : `
    <div class="auth-btns">
      <a href="login.html" class="btn btn-outline btn-sm">
        <i data-lucide="log-in" class="lucide-icon lucide-sm"></i>
        <span class="btn-text">Connexion</span>
      </a>
      <a href="register.html" class="btn btn-gold btn-sm">
        <i data-lucide="user-plus" class="lucide-icon lucide-sm"></i>
        <span class="btn-text">Inscription</span>
      </a>
    </div>
  `;

  h.innerHTML = `
  <nav class="navbar" aria-label="Barre de navigation">
    <a href="index.html" class="brand" aria-label="Accueil Aurum">
      <div class="brand-logo-img" aria-hidden="true">
        <img src="assets/img/logo.jpg" alt="" />
      </div>
      <div>
        <div class="brand-name">Aurum</div>
        <div class="tagline">L'Excellence à Votre Portée</div>
      </div>
    </a>

    <button class="menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
      <i data-lucide="menu" class="lucide-icon menu-icon"></i>
      <i data-lucide="x" class="lucide-icon close-icon"></i>
    </button>

    <div class="nav-actions">
      <a href="seller.html" class="icon-btn" aria-label="Espace vendeur" title="Espace vendeur">
        <i data-lucide="store" class="lucide-icon"></i>
        <span class="icon-label">Vendeur</span>
      </a>

      <a href="wishlist.html" class="icon-btn heart-btn" id="wl-btn" aria-label="Favoris" title="Favoris">
        <i data-lucide="heart" class="lucide-icon heart-icon"></i>
        <span class="badge heart-badge" id="wl-badge" aria-label="Nombre de favoris">0</span>
        <span class="icon-label">Favoris</span>
      </a>

      <a href="cart.html" class="icon-btn cart-btn" id="cart-btn" aria-label="Panier" title="Panier">
        <i data-lucide="shopping-bag" class="lucide-icon"></i>
        <span class="badge cart-badge" id="cart-badge" aria-label="Articles dans le panier">0</span>
        <span class="icon-label">Panier</span>
      </a>

      <a href="order.html" class="icon-btn orders-btn" aria-label="Mes commandes" title="Mes commandes">
        <i data-lucide="package" class="lucide-icon"></i>
        <span class="icon-label">Commandes</span>
      </a>

      ${sessionHTML}
    </div>
  </nav>

  <div class="search-bar">
    <form class="search-form" action="catalogue.html" method="get" role="search">
      <button type="button" class="search-back-btn" aria-label="Retour">
        <i data-lucide="arrow-left" class="lucide-icon"></i>
      </button>
      <input name="q" placeholder="Rechercher un produit ou une catégorie..." aria-label="Recherche" />
      <button type="submit" class="search-submit-btn" aria-label="Rechercher">
        <i data-lucide="search" class="lucide-icon"></i>
      </button>
    </form>
  </div>

  `;

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
      setTimeout(()=> location.href = '../index.html', 700);
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
      <p><a href="#">Instagram</a> · <a href="#">TikTok</a></p>
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

