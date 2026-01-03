/* =========================================================
   AURUM - APPLICATION PRINCIPALE (APP.JS)
   Gère : Recherche, Menu, Panier, Wishlist, Catalogue
   ========================================================= */

// --- 1. VARIABLES GLOBALES & UTILITAIRES ---
let currentUser = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');

// Récupération des données locales (pour le panier/wishlist invité)
const Cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
const Wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');

function persistCart() { localStorage.setItem('ac_cart', JSON.stringify(Cart)); updateCartBadge(); }
function persistWishlist() { localStorage.setItem('ac_wishlist', JSON.stringify(Wishlist)); }

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    toast.style.background = type === 'success' ? '#1F8A70' : '#333';
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.marginTop = '10px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    toast.style.animation = 'fadeIn 0.3s forwards';
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 2. INITIALISATION DOM ---
document.addEventListener('DOMContentLoaded', () => {
    
    // A. MENU BURGER & DRAWER (Mobile)
    const burgerBtn = document.getElementById('burger-btn'); // Bouton dans le header
    const closeBtn = document.getElementById('close-btn');   // Croix dans le menu
    const drawer = document.getElementById('mobile-drawer'); // Le menu lui-même
    const overlay = document.getElementById('menu-overlay'); // Fond gris

    function toggleMenu() {
        if(drawer && overlay) {
            drawer.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    }

    if(burgerBtn) burgerBtn.addEventListener('click', toggleMenu);
    if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);

    // B. AUTHENTIFICATION UI (Adapter le menu si connecté)
    if(typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            currentUser = user;
            const guestLinks = document.getElementById('auth-guest');
            const userLinks = document.getElementById('auth-user');
            const desktopAuth = document.getElementById('desktop-auth-link');

            if (user) {
                // Connecté
                if(guestLinks) guestLinks.style.display = 'none';
                if(userLinks) userLinks.style.display = 'block';
                if(desktopAuth) {
                    desktopAuth.innerText = "Mon Compte";
                    desktopAuth.href = "profile.html"; // ou seller.html si vendeur
                }
                
                // Bouton Déconnexion
                const logoutBtn = document.getElementById('logout-btn');
                if(logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        firebase.auth().signOut().then(() => window.location.reload());
                    });
                }
            } else {
                // Visiteur
                if(guestLinks) guestLinks.style.display = 'block';
                if(userLinks) userLinks.style.display = 'none';
                if(desktopAuth) {
                    desktopAuth.innerText = "Connexion";
                    desktopAuth.href = "login.html";
                }
            }
        });
    }

    // C. RECHERCHE (Ton code original préservé)
    const searchBtn = document.querySelector('[data-search-btn]');
    // Si tu as un bouton loupe spécifique dans le header pour ouvrir la recherche
    // Sinon, la logique est gérée par catalogue.html
    
    // D. CATALOGUE & ACCUEIL (Init)
    if(document.getElementById('catalogue-list')) {
        initCatalogue(); // Charge les filtres
        initLoadMore();  // Charge la pagination
    }
    
    // E. MISES À JOUR BADGES
    updateCartBadge();
    
    // F. NEWSLETTER
    setupNewsletter();

    // G. ICÔNES
    if(typeof lucide !== 'undefined') lucide.createIcons();
});


// --- 3. GESTION PANIER & WISHLIST ---

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = Cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    badge.innerText = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function addToCart(pid, qty = 1) {
    const existing = Cart.find(it => it.pid === pid);
    if (existing) {
        existing.qty = (existing.qty || 1) + qty;
    } else {
        Cart.push({ pid, qty });
    }
    persistCart();
    showToast('Produit ajouté au panier !', 'success');
}

function removeFromCart(pid) {
    const idx = Cart.findIndex(it => it.pid === pid);
    if (idx !== -1) {
        Cart.splice(idx, 1);
        persistCart();
        showToast('Produit retiré.', 'info');
    }
}

function toggleWishlist(pid) {
    const idx = Wishlist.indexOf(pid);
    if (idx === -1) {
        Wishlist.push(pid);
        showToast('Ajouté aux favoris ❤️', 'success');
    } else {
        Wishlist.splice(idx, 1);
        showToast('Retiré des favoris', 'info');
    }
    persistWishlist();
}

function isInWishlist(pid) {
    return Wishlist.includes(pid);
}


// --- 4. CATALOGUE & FILTRES (Ton code adapté) ---

function initCatalogue() {
    // Cette fonction gère l'affichage des options de filtres
    // Note : Le rendu des produits est géré par le script dans catalogue.html (Firebase)
    // Ici on gère juste l'interface UI des filtres
    
    const fc = document.getElementById('filter-category');
    
    // Affichage conditionnel des sous-filtres
    if(fc) {
        fc.addEventListener('change', () => {
            const val = fc.value;
            // Logique pour afficher/masquer les filtres spécifiques (Tech, Beauté...)
            // Reprise de ta logique existante :
            document.querySelectorAll('.beauty-filter, .tech-filter, .home-filter').forEach(el => el.classList.add('hidden'));
            
            if(val === 'Beauté, Hygiène & Bien-être') document.querySelectorAll('.beauty-filter').forEach(el => el.classList.remove('hidden'));
            if(val === 'Électronique') document.querySelectorAll('.tech-filter').forEach(el => el.classList.remove('hidden'));
            // ... autres conditions
        });
    }
}

// --- 5. LOAD MORE (Pagination Visuelle) ---
function initLoadMore() {
    const btn = document.getElementById('load-more-btn');
    const container = document.getElementById('catalogue-list'); // ou 'catalogue-grid' selon ton HTML
    
    if(btn && container) {
        btn.addEventListener('click', () => {
            // Ici, idéalement on chargerait plus de produits depuis Firebase
            // Pour l'instant, on peut juste simuler ou afficher les éléments cachés
            const hiddenItems = container.querySelectorAll('.hidden-item');
            hiddenItems.forEach((el, index) => {
                if(index < 4) el.classList.remove('hidden-item'); // Affiche 4 de plus
            });
            if(container.querySelectorAll('.hidden-item').length === 0) btn.style.display = 'none';
        });
    }
}

// --- 6. NEWSLETTER ---
function setupNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input').value;
            if(email) {
                // Sauvegarde simple (ou Firebase si tu veux)
                showToast("Merci pour votre inscription !", "success");
                form.reset();
            }
        });
    }
}
