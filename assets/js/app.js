/* =========================================================
   AURUM - APP.JS (VERSION OPTIMISÉE)
   Code GLOBAL uniquement : Menu, Panier, Wishlist, Auth UI
   ========================================================= */

// --- VARIABLES GLOBALES ---
let currentUser = null;
const Cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
const Wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');

function persistCart() { 
    localStorage.setItem('ac_cart', JSON.stringify(Cart)); 
    updateCartBadge(); 
}

function persistWishlist() { 
    localStorage.setItem('ac_wishlist', JSON.stringify(Wishlist)); 
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    toast.style.cssText = `
        background: ${type === 'success' ? '#1F8A70' : '#333'};
        color: #fff; padding: 12px 20px; border-radius: 8px;
        margin-top: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- MENU BURGER GLOBAL ---
function setupMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('menu-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('close-btn');

    function closeDrawer() {
        if (!drawer || !overlay) return;
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function toggleDrawer() {
        if (!drawer || !overlay) return;
        const isActive = drawer.classList.contains('active');
        if (isActive) {
            closeDrawer();
        } else {
            drawer.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeDrawer(); // Reset initial

    if (menuToggle) menuToggle.addEventListener('click', toggleDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
}

// --- AUTH UI GLOBAL ---
function setupAuthUI() {
    if (typeof firebase === 'undefined') return;
    
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        const mobileLogin = document.getElementById('mobile-login-btn');
        const mobileLogout = document.getElementById('mobile-logout-btn');

        if (user) {
            if (mobileLogin) mobileLogin.style.display = 'none';
            if (mobileLogout) mobileLogout.style.display = 'block';
        } else {
            if (mobileLogin) mobileLogin.style.display = 'block';
            if (mobileLogout) mobileLogout.style.display = 'none';
        }
    });

    const logoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            firebase.auth().signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
    }
}

// --- PANIER & WISHLIST ---
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

function clearCart() {
    Cart.length = 0;
    persistCart();
}

function clearWishlist() {
    Wishlist.length = 0;
    persistWishlist();
}

function getCartItems() {
    return Cart;
}

function getWishlistItems() {
    return Wishlist;
}

// --- INIT GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupAuthUI();
    updateCartBadge();
    initScrollReveal();
    if (typeof lucide !== 'undefined') lucide.createIcons();
});

// --- SCROLL REVEAL ANIMATION ---
function initScrollReveal() {
    // Sélectionner automatiquement les éléments à animer
    const selectors = [
        'section',
        '.card',
        '.cart-item',
        '.footer-col',
        'h1',
        'h2',
        '.hero-banner'
    ];
    
    // Récupérer tous les éléments correspondants
    const elements = document.querySelectorAll(selectors.join(', '));
    
    // Configuration de l'IntersectionObserver
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Ajouter la classe visible quand élément entre dans le viewport
                entry.target.classList.add('reveal-visible');
            } else {
                // Retirer la classe quand élément sort du viewport
                entry.target.classList.remove('reveal-visible');
            }
        });
    }, observerOptions);
    
    // Ajouter la classe reveal-element et observer chaque élément
    elements.forEach(element => {
        element.classList.add('reveal-element');
        observer.observe(element);
    });
    
    console.log(`🎬 Scroll Reveal initialisé sur ${elements.length} éléments (bidirectionnel)`);
}
