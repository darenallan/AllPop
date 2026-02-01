/* =========================================================
   AURUM - APP.JS (VERSION OPTIMISÉE)
   Code GLOBAL uniquement : Menu, Panier, Wishlist, Auth UI
   ========================================================= */

// --- NETTOYAGE PRÉVENTIF LOCALSTORAGE ---
function cleanupStorage() {
    try {
        // Ne garder QUE ac_cart et ac_wishlist
        const cart = localStorage.getItem('ac_cart');
        const wishlist = localStorage.getItem('ac_wishlist');
        
        // Si la taille commence à approcher la limite, nettoyer les vieilles données
        let storageSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                storageSize += localStorage[key].length + key.length;
            }
        }
        
        // Si > 4 MB, supprimer tout sauf panier et wishlist
        if (storageSize > 4194304) {
            console.warn('⚠️ Stockage > 4 MB, nettoyage...');
            localStorage.clear();
            if (cart) localStorage.setItem('ac_cart', cart);
            if (wishlist) localStorage.setItem('ac_wishlist', wishlist);
        }
    } catch(e) {
        console.warn('Erreur cleanup storage:', e.message);
    }
}

// Nettoyer au démarrage
cleanupStorage();

// --- VARIABLES GLOBALES ---
let currentUser = null;
window.Cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
window.Wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');

function persistCart() { 
    // Optimisation : ne stocker que pid et qty (pas l'objet entier)
    const minimalCart = window.Cart.map(item => ({ pid: item.pid, qty: item.qty }));
    const cartJson = JSON.stringify(minimalCart);
    
    console.log('💾 persistCart() appelée, contenu:', minimalCart);
    console.log('📊 Taille JSON:', cartJson.length, 'bytes');
    
    try {
        localStorage.setItem('ac_cart', cartJson);
        console.log('✅ Panier sauvegardé dans localStorage');
        updateCartBadge();
    } catch(e) {
        console.error('❌ Erreur persistCart:', e.name, e.message);
        
        if (e.name === 'QuotaExceededError') {
            console.error('❌ localStorage quota dépassé!');
            
            // Stratégie 1 : Nettoyer tout SAUF le panier
            try {
                localStorage.clear();
                localStorage.setItem('ac_cart', cartJson);
                console.log('✅ localStorage nettoyé, panier sauvegardé');
                updateCartBadge();
                return;
            } catch(e2) {
                console.error('❌ Impossible même après nettoyage:', e2.message);
                
                // Stratégie 2 : Réduire le panier au strict minimum
                const tinyCart = minimalCart.slice(0, 5); // Garder que les 5 premiers
                try {
                    localStorage.clear();
                    localStorage.setItem('ac_cart', JSON.stringify(tinyCart));
                    window.Cart = tinyCart;
                    console.log('⚠️ Panier réduit à 5 articles maximum');
                    updateCartBadge();
                } catch(e3) {
                    console.error('❌ localStorage complètement indisponible');
                    showToast('⚠️ Stockage local saturé, utilisez sessionStorage', 'warning');
                }
            }
        } else {
            console.error('Erreur inconnue dans persistCart');
        }
    }
}

function persistWishlist() { 
    localStorage.setItem('ac_wishlist', JSON.stringify(window.Wishlist)); 
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
    const count = window.Cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    badge.innerText = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function addToCart(pid, qty = 1) {
    // ===== VALIDATION CRITIQUE =====
    // Vérifier que le PID existe et est valide
    if (!pid || typeof pid !== 'string' || pid.trim() === '') {
        console.error('❌ ERREUR addToCart: PID manquant ou invalide!', { pid, qty });
        showToast('❌ Erreur: ID produit manquant. Impossible d\'ajouter au panier.', 'error');
        return false;
    }
    
    // Vérifier que qty est un nombre positif
    if (typeof qty !== 'number' || qty < 1) {
        console.warn('⚠️ Quantité invalide, utilisation de 1 par défaut');
        qty = 1;
    }
    
    console.log(`✅ addToCart appelée avec pid="${pid}", qty=${qty}`);
    
    // Vérifier que window.Cart existe
    if (!Array.isArray(window.Cart)) {
        console.warn('⚠️ window.Cart n\'existe pas, initialisation');
        window.Cart = [];
    }
    
    // Chercher si le produit existe déjà
    const existing = window.Cart.find(it => it && it.pid === pid);
    
    if (existing) {
        existing.qty = (existing.qty || 1) + qty;
        console.log(`📦 Produit ${pid} mis à jour: qty = ${existing.qty}`);
    } else {
        // Créer un nouvel objet article avec validation
        const newItem = { pid: pid.trim(), qty: qty };
        window.Cart.push(newItem);
        console.log(`🆕 Nouveau produit ajouté:`, newItem);
    }
    
    // Sauvegarder et mettre à jour l'interface
    persistCart();
    showToast(`Produit ajouté au panier ! (${qty} unité(s))`, 'success');
    
    return true;
}

function removeFromCart(pid) {
    const idx = window.Cart.findIndex(it => it.pid === pid);
    if (idx !== -1) {
        window.Cart.splice(idx, 1);
        persistCart();
        showToast('Produit retiré.', 'info');
    }
}

function toggleWishlist(pid) {
    const idx = window.Wishlist.indexOf(pid);
    if (idx === -1) {
        window.Wishlist.push(pid);
        showToast('Ajouté aux favoris ❤️', 'success');
    } else {
        window.Wishlist.splice(idx, 1);
        showToast('Retiré des favoris', 'info');
    }
    persistWishlist();
}

function isInWishlist(pid) {
    return window.Wishlist.includes(pid);
}

function clearCart() {
    window.Cart.length = 0;
    persistCart();
}

function clearWishlist() {
    window.Wishlist.length = 0;
    persistWishlist();
}

function getCartItems() {
    return window.Cart;
}

function getWishlistItems() {
    return window.Wishlist;
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
