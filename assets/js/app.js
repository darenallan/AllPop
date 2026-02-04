"use strict";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * AURUM CORP - APP.JS (CLIENT/MARKETPLACE)
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Fusionne:
 * - Logique panier (cart.js) avec FIX ANTI-CRASH "pid string"
 * - Fiche produit (product.js)
 * - Wishlist (whishlist.js)
 * - Footer injection (footer.js)
 * 
 * À charger APRÈS config.js
 */

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION DATA STORE & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Alias pour accéder au Store global
const Store = window.Store;

let currentUser = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');

/**
 * FIX ANTI-CRASH: "pid string" bug
 * Assurez-vous que pid est toujours converti en string pour éviter les comparaisons d'objet
 */
function safeProductId(id) {
    return String(id || '').trim();
}

// Helpers pour la gestion du panier
function getCartItems() {
    const cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
    return cart.map(item => ({
        product: item.product,
        quantity: item.quantity
    }));
}

function addToCart(productId, qty = 1) {
    // FIX ANTI-CRASH: Convertir en string
    const pid = safeProductId(productId);
    if (!pid) return window.showToast('Produit invalide', 'danger');
    
    let cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
    const prod = Store.products.find(p => String(p.id) === pid);
    
    if (!prod) {
        window.showToast('Produit non trouvé', 'danger');
        return;
    }
    
    const existingItem = cart.find(item => String(item.product.id) === pid);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({ product: prod, quantity: qty });
    }
    
    localStorage.setItem('ac_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartQty(productId, newQty) {
    const pid = safeProductId(productId);
    if (!pid) return;
    
    let cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
    const item = cart.find(i => String(i.product.id) === pid);
    
    if (item) {
        item.quantity = Math.max(1, newQty);
        localStorage.setItem('ac_cart', JSON.stringify(cart));
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    const pid = safeProductId(productId);
    if (!pid) return;
    
    let cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
    cart = cart.filter(item => String(item.product.id) !== pid);
    localStorage.setItem('ac_cart', JSON.stringify(cart));
    updateCartBadge();
}

function clearCart() {
    localStorage.removeItem('ac_cart');
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const items = getCartItems();
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = count > 0 ? count : '0';
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

// Helpers Wishlist
function getWishlistItems() {
    const wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
    return wishlist.map(id => Store.products.find(p => String(p.id) === String(id))).filter(Boolean);
}

function toggleWishlist(productId) {
    const pid = safeProductId(productId);
    if (!pid) return;
    
    let wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
    const index = wishlist.findIndex(id => String(id) === pid);
    
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(pid);
    }
    
    localStorage.setItem('ac_wishlist', JSON.stringify(wishlist));
}

function isInWishlist(productId) {
    const pid = safeProductId(productId);
    const wishlist = JSON.parse(localStorage.getItem('ac_wishlist') || '[]');
    return wishlist.some(id => String(id) === pid);
}

function clearWishlist() {
    localStorage.removeItem('ac_wishlist');
}

// Update cart buttons on page
function updateCartButtons() {
    const items = getCartItems();
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
        const pid = btn.getAttribute('data-add-to-cart');
        const isInCart = items.some(item => String(item.product.id) === String(pid));
        btn.disabled = isInCart;
        btn.classList.toggle('added', isInCart);
    });
}

// Data store persistence
function saveStore() {
    localStorage.setItem('ac_products', JSON.stringify(Store.products));
    localStorage.setItem('ac_shops', JSON.stringify(Store.shops));
    localStorage.setItem('ac_orders', JSON.stringify(Store.orders));
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE PANIER (cart.js fusionné)
// ─────────────────────────────────────────────────────────────────────────────

function initCart() {
    const itemsEl = document.getElementById('cart-items');
    const clearBtn = document.getElementById('clear-cart-btn');
    const deliveryAddressInput = document.getElementById('delivery-address');
    const promoInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo-btn');

    const countEl = document.getElementById('summary-count');
    const subtotalEl = document.getElementById('summary-subtotal');
    const discountEl = document.getElementById('summary-discount');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    let appliedPromo = null;
    let deliveryAddress = '';

    function getShippingFee() {
        return { name: 'Standard', fee: 0, msg: 'Déterminé par le livreur' };
    }

    function render() {
        const items = getCartItems();
        if (items.length === 0) {
            itemsEl.innerHTML = `
                <div class="card"><div class="info">
                    Votre panier est vide. <a href="catalogue.html">Voir le catalogue</a>
                </div></div>`;
        } else {
            itemsEl.innerHTML = items.map(it => {
                const p = it.product;
                const max = p.stock || 999;
                const safePid = safeProductId(p.id);
                return `
                    <div class="card mb-2">
                        <div class="info cart-item">
                            <img src="${p.images && p.images[0] ? p.images[0] : 'assets/img/placeholder-product-1.svg'}" alt="${p.name}" />
                            <div>
                                <div class="title">${p.name}</div>
                                <div class="meta">${p.color || ''} · ${p.size || ''} · ${window.formatFCFA(p.price)}</div>
                                <div class="mt-2" style="display:flex;align-items:center;gap:8px">
                                    <button class="qty-btn" data-minus="${safePid}" aria-label="Diminuer">–</button>
                                    <span class="qty-val" id="val-${safePid}">${it.quantity}</span>
                                    <button class="qty-btn" data-plus="${safePid}" aria-label="Augmenter">+</button>
                                    <small class="text-muted-foreground">${max} en stock</small>
                                </div>
                            </div>
                            <div>
                                <div style="font-weight:700">${window.formatFCFA(p.price * it.quantity)}</div>
                                <button class="btn mt-2 icon-btn remove-btn" data-remove="${safePid}" title="Supprimer">
                                    <i data-lucide="trash-2" class="lucide-icon"></i>
                                    <span class="icon-label">Supprimer</span>
                                </button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }
        updateSummary();
        bindEvents();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.fixLucideIcons) window.fixLucideIcons();
    }

    function bindEvents() {
        itemsEl.querySelectorAll('[data-minus]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-minus');
                const valEl = document.getElementById('val-' + pid);
                const current = parseInt(valEl.textContent || '1', 10);
                const next = Math.max(1, current - 1);
                updateCartQty(pid, next);
                valEl.textContent = next;
                updateSummary();
            });
        });

        itemsEl.querySelectorAll('[data-plus]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-plus');
                const valEl = document.getElementById('val-' + pid);
                const current = parseInt(valEl.textContent || '1', 10);
                const prod = Store.products.find(p => String(p.id) === String(pid));
                const max = prod ? (prod.stock || 999) : 999;
                const next = Math.min(max, current + 1);
                updateCartQty(pid, next);
                valEl.textContent = next;
                updateSummary();
            });
        });

        itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-remove');
                removeFromCart(pid);
                render();
            });
        });
    }

    function computeDiscount(subtotal) {
        if (!appliedPromo) return 0;
        const percent = appliedPromo.percent || 0;
        return Math.round(subtotal * percent / 100);
    }

    function updateSummary() {
        const items = getCartItems();
        const count = items.reduce((s, it) => s + it.quantity, 0);
        const subtotal = items.reduce((s, it) => s + it.product.price * it.quantity, 0);
        const discount = computeDiscount(subtotal);
        const zone = getShippingFee();
        const shipping = zone.fee;
        const total = Math.max(0, subtotal - discount + shipping);

        if (countEl) countEl.textContent = count;
        if (subtotalEl) subtotalEl.textContent = window.formatFCFA(subtotal);
        if (discountEl) discountEl.textContent = window.formatFCFA(discount);
        if (shippingEl) shippingEl.textContent = zone.msg;
        if (totalEl) totalEl.textContent = window.formatFCFA(total);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearCart();
            render();
        });
    }

    if (deliveryAddressInput) {
        deliveryAddressInput.addEventListener('input', (e) => {
            deliveryAddress = e.target.value;
            updateSummary();
        });
    }

    if (promoInput && applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const code = (promoInput.value || '').trim();
            if (!code) return window.showToast('Entrez un code promo', 'warning');
            const promo = Store.promos.find(pr => pr.code.toUpperCase() === code.toUpperCase());
            if (!promo) return window.showToast('Code promo invalide', 'danger');
            if (Date.now() > promo.expires) return window.showToast('Ce code est expiré', 'danger');
            appliedPromo = { code: promo.code, percent: promo.percent };
            localStorage.setItem('ac_last_promo', JSON.stringify(appliedPromo));
            window.showToast(`Code ${promo.code} appliqué (-${promo.percent}%)`, 'success');
            updateSummary();
        });
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');
            if (!user) {
                window.showToast('Veuillez vous connecter pour continuer', 'warning');
                return location.href = 'login.html';
            }

            const cartItems = getCartItems();
            if (cartItems.length === 0) return window.showToast('Votre panier est vide', 'warning');
            if (!deliveryAddress.trim()) return window.showToast('Veuillez entrer une adresse de livraison', 'warning');

            const subtotal = cartItems.reduce((s, it) => s + it.product.price * it.quantity, 0);
            const promo = JSON.parse(localStorage.getItem('ac_last_promo') || 'null');
            const discount = promo ? Math.round(subtotal * (promo.percent || 0) / 100) : 0;
            const zone = getShippingFee();
            const shipping = zone.fee;
            const total = Math.max(0, subtotal - discount + shipping);

            const order = {
                id: 'O' + Date.now(),
                userEmail: user.email,
                date: Date.now(),
                status: 'paid',
                items: cartItems.map(it => ({
                    pid: safeProductId(it.product.id),
                    name: it.product.name,
                    price: it.product.price,
                    qty: it.quantity,
                    image: it.product.images && it.product.images[0] ? it.product.images[0] : 'assets/img/placeholder-product-1.svg'
                })),
                subtotal, discount, shipping, total,
                promoCode: promo ? promo.code : null,
                address: deliveryAddress,
                zone: zone.name,
                meta: { method: 'Standard' }
            };

            Store.orders.push(order);
            saveStore();

            order.items.forEach(it => {
                const p = Store.products.find(x => String(x.id) === it.pid);
                if (p) {
                    p.sales = (p.sales || 0) + it.qty;
                    p.stock = Math.max(0, (p.stock || 0) - it.qty);
                }
            });
            saveStore();

            clearCart();
            localStorage.removeItem('ac_last_promo');

            window.showToast('Commande créée avec succès', 'success');
            setTimeout(() => location.href = `invoice.html?orderId=${order.id}`, 800);
        });
    }

    render();
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE FICHE PRODUIT (product.js fusionné - simplifié)
// ─────────────────────────────────────────────────────────────────────────────

function initProduct() {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const container = document.getElementById('product-detail');

    if (!id || !container) {
        if (container) container.innerHTML = '<p>Produit introuvable.</p>';
        return;
    }

    const p = Store.products.find(x => String(x.id) === String(id));
    if (!p) {
        container.innerHTML = `
            <div class="center" style="padding:48px 0">
                <div>
                    <h1 class="mb-2">Produit non trouvé</h1>
                    <a href="catalogue.html">Retour au catalogue</a>
                </div>
            </div>`;
        return;
    }

    // Increment views
    p.views = (p.views || 0) + 1;
    saveStore();

    const images = Array.isArray(p.images) && p.images.length ? p.images : ["assets/img/placeholder-product-1.svg"];
    let quantity = 1;

    const qtyVal = container.querySelector('#qty-val');
    if (qtyVal) {
        container.querySelector('#qty-minus').addEventListener('click', () => {
            quantity = Math.max(1, quantity - 1);
            qtyVal.textContent = quantity;
        });
        container.querySelector('#qty-plus').addEventListener('click', () => {
            quantity = Math.min(p.stock || 1, quantity + 1);
            qtyVal.textContent = quantity;
        });
    }

    // Add to cart
    const addBtn = container.querySelector('#add-cart');
    const stickyAddBtn = container.querySelector('#sticky-add-cart');

    const updateAddButtons = (added = false) => {
        const btnHTML = added
            ? '<i data-lucide="check" class="lucide-icon lucide-sm"></i><span>Dans le panier</span>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span>Ajouter au panier</span>';
        if (addBtn) {
            addBtn.disabled = added;
            addBtn.innerHTML = btnHTML;
        }
        if (stickyAddBtn) {
            stickyAddBtn.disabled = added;
            stickyAddBtn.innerHTML = btnHTML;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        updateCartBadge();
    };

    addBtn && addBtn.addEventListener('click', () => {
        if (p.stock === 0) return window.showToast('Article indisponible', 'warning');
        addToCart(safeProductId(p.id), quantity);
        updateAddButtons(true);
    });

    stickyAddBtn && stickyAddBtn.addEventListener('click', () => {
        if (p.stock === 0) return window.showToast('Article indisponible', 'warning');
        addToCart(safeProductId(p.id), quantity);
        updateAddButtons(true);
    });

    // Wishlist
    const wlBtn = container.querySelector('#toggle-wl');
    if (wlBtn) {
        wlBtn.addEventListener('click', () => {
            toggleWishlist(safeProductId(p.id));
            const isWl = isInWishlist(safeProductId(p.id));
            wlBtn.classList.toggle('btn-bordeaux', isWl);
            wlBtn.classList.toggle('btn-outline-dark', !isWl);
            wlBtn.setAttribute('aria-pressed', isWl ? 'true' : 'false');
            wlBtn.classList.add('pulse');
            setTimeout(() => wlBtn.classList.remove('pulse'), 400);
        });
    }

    // Share
    const shareBtn = container.querySelector('#share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            window.copyToClipboard(location.href);
        });
    }

    // Similar products
    const similar = Store.products
        .filter(x => x.category === p.category && String(x.id) !== String(p.id) && !x.hidden)
        .slice(0, 4);

    const simEl = document.getElementById('similar-list');
    if (simEl && similar.length > 0) {
        simEl.innerHTML = similar.map(prod => {
            const img = prod.images && prod.images[0] ? prod.images[0] : "assets/img/placeholder-product-1.svg";
            return `
                <a href="product.html?id=${encodeURIComponent(prod.id)}" class="product-card">
                    <div class="product-image-wrap">
                        <img src="${img}" alt="${prod.name}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${prod.name}</h3>
                        <div class="product-price">${window.formatFCFA(prod.price)}</div>
                    </div>
                </a>`;
        }).join('');
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    if (window.fixLucideIcons) {
        window.fixLucideIcons();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE WISHLIST (whishlist.js fusionné)
// ─────────────────────────────────────────────────────────────────────────────

function initWishlist() {
    const itemsEl = document.getElementById('wishlist-items');
    const clearBtn = document.getElementById('clear-wishlist-btn');

    if (!itemsEl) return;

    function render() {
        const items = getWishlistItems();
        if (items.length === 0) {
            itemsEl.innerHTML = `
                <div class="card"><div class="info">
                    Votre wishlist est vide. <a href="catalogue.html">Voir le catalogue</a>
                </div></div>`;
            return;
        }

        itemsEl.innerHTML = items.map(p => {
            const safePid = safeProductId(p.id);
            const img = p.images && p.images[0] ? p.images[0] : 'assets/img/placeholder-product-1.svg';
            return `
                <div class="card mb-2">
                    <div class="info wishlist-item">
                        <img src="${img}" alt="${p.name}" />
                        <div>
                            <div class="title">${p.name}</div>
                            <div class="meta">${p.color || ''} · ${p.size || ''} · ${window.formatFCFA(p.price)}</div>
                            <div class="mt-2" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                                <a href="product.html?id=${encodeURIComponent(p.id)}" class="icon-btn" title="Voir le produit">
                                    <i data-lucide="eye" class="lucide-icon"></i>
                                    <span class="icon-label">Voir</span>
                                </a>
                                <button class="btn btn-dark icon-btn" data-add="${safePid}" title="Ajouter au panier">
                                    <i data-lucide="shopping-bag" class="lucide-icon"></i>
                                    <span class="icon-label">Ajouter</span>
                                </button>
                                <button class="btn icon-btn" data-remove="${safePid}" title="Retirer de la wishlist">
                                    <i data-lucide="trash-2" class="lucide-icon"></i>
                                    <span class="icon-label">Retirer</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <div style="font-weight:700">${window.formatFCFA(p.price)}</div>
                        </div>
                    </div>
                </div>`;
        }).join('');

        bindEvents();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.fixLucideIcons) window.fixLucideIcons();
    }

    function bindEvents() {
        itemsEl.querySelectorAll('[data-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-add');
                addToCart(pid, 1);
                window.showToast('Ajouté au panier depuis la wishlist', 'success');
                updateCartBadge();
            });
        });

        itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-remove');
                toggleWishlist(pid);
                render();
            });
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearWishlist();
            render();
        });
    }

    render();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING AUTOMATIQUE - Initialise les modules selon la page
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart if cart page
    if (document.getElementById('cart-items-list') || document.getElementById('cart-items')) {
        initCart();
    }

    // Initialize product if product page
    if (document.getElementById('product-page') || document.getElementById('product-detail')) {
        initProduct();
    }

    // Initialize wishlist if wishlist page
    if (document.getElementById('wishlist-items')) {
        initWishlist();
    }

    // Update cart badge on every page
    updateCartBadge();
    updateCartButtons();

    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    if (window.fixLucideIcons) {
        window.fixLucideIcons();
    }
});

console.log("✅ App.js chargé - Panier, Produits & Wishlist OK");

function getWishlistItems() {
    return Wishlist;
}

// --- INIT GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.setupMobileMenu) window.setupMobileMenu();
    if (window.setupAuthUI) window.setupAuthUI();
    updateCartBadge();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (window.fixLucideIcons) window.fixLucideIcons();
});
