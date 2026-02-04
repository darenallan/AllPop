"use strict";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * AURUM CORP - ADMIN.JS (ADMIN & VENDEUR)
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Fusionne:
 * - Espace vendeur (seller.js)
 * - Formulaire produit (product-form.js)
 * - Gestion des commandes (order.js)
 * - Gestion des factures (invoice.js)
 * 
 * À charger APRÈS config.js
 * Vérifie que l'utilisateur est admin/vendeur avant d'exécuter
 */

// ─────────────────────────────────────────────────────────────────────────────
// VÉRIFICATION ROLE UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────

const currentAdminUser = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');

function isAdminOrSeller() {
    if (!currentAdminUser) return false;
    const role = currentAdminUser.role || '';
    return ['admin', 'superadmin', 'seller', 'maintainer'].includes(role);
}

function requireAdminOrSeller() {
    if (!isAdminOrSeller()) {
        console.warn("Accès refusé: utilisateur n'est pas admin/vendeur");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE ESPACE VENDEUR (seller.js fusionné)
// ─────────────────────────────────────────────────────────────────────────────

let currentShop = null;
let currentProducts = [];

function initSellerDashboard() {
    if (!requireAdminOrSeller()) return;

    // Vérification connexion
    window.auth.onAuthStateChanged((user) => {
        const loader = document.getElementById('loader');
        const content = document.getElementById('seller-content');
        const warning = document.getElementById('no-shop-warning');

        if (user) {
            console.log("👤 Vendeur connecté :", user.email);

            // Chercher la boutique associée à cet email
            window.db.collection('shops').where('ownerEmail', '==', user.email).get()
                .then((querySnapshot) => {
                    if (loader) loader.style.display = 'none';

                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        currentShop = { id: doc.id, ...doc.data() };

                        console.log("🏪 Boutique chargée :", currentShop.name);

                        if (content) {
                            content.classList.remove('hidden');
                            content.style.display = 'block';
                        }

                        initSellerDashboardUI();
                    } else {
                        if (warning) {
                            warning.classList.remove('hidden');
                            warning.style.display = 'block';
                        }
                        const emailDisplay = document.getElementById('user-email-display');
                        if (emailDisplay) emailDisplay.innerText = user.email;
                    }
                })
                .catch((error) => {
                    console.error("Erreur chargement boutique:", error);
                    alert("Erreur de connexion base de données.");
                });

        } else {
            window.location.href = "login.html";
        }
    });
}

function initSellerDashboardUI() {
    const shopNameTitle = document.getElementById('shop-name-title');
    if (shopNameTitle) shopNameTitle.innerText = currentShop.name;

    const setShopName = document.getElementById('set-shop-name');
    if (setShopName) setShopName.value = currentShop.name;

    const setShopDesc = document.getElementById('set-shop-desc');
    if (setShopDesc) setShopDesc.value = currentShop.description || '';

    listenToSellerProducts();
    setupSellerNavigation();
    setupSellerForms();
}

function listenToSellerProducts() {
    window.db.collection('products').where('shopId', '==', currentShop.id)
        .onSnapshot((snapshot) => {
            currentProducts = [];
            const list = document.getElementById('products-list');
            if (!list) return;

            list.innerHTML = "";

            snapshot.forEach((doc) => {
                currentProducts.push({ id: doc.id, ...doc.data() });
            });

            const statProducts = document.getElementById('stat-products');
            if (statProducts) statProducts.innerText = currentProducts.length;

            if (currentProducts.length === 0) {
                list.innerHTML = '<p class="text-muted">Aucun produit en ligne. Ajoutez-en un !</p>';
            } else {
                currentProducts.forEach(prod => {
                    list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                        <div style="display:flex; gap:15px; align-items:center;">
                            <div style="width:50px; height:50px; background:#eee; border-radius:8px; overflow:hidden;">
                                <img src="${prod.image || 'assets/img/placeholder.png'}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                            <div>
                                <strong>${prod.name}</strong><br>
                                <span style="color:#D4AF37; font-weight:bold;">${prod.price} FCFA</span>
                            </div>
                        </div>
                        <button class="btn btn-sm" onclick="deleteSellerProduct('${prod.id}')" style="color:red; background:none; border:none; cursor:pointer;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>`;
                });

                if (typeof lucide !== 'undefined') lucide.createIcons();
                if (window.fixLucideIcons) window.fixLucideIcons();
            }
        });
}

function setupSellerNavigation() {
    window.navigateSellerTab = function(tabId, btn) {
        document.querySelectorAll('.admin-section').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });

        const target = document.getElementById('sec-' + tabId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            target.style.display = 'block';
        }

        document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        if (window.innerWidth < 900) {
            const sidebar = document.getElementById('seller-sidebar');
            if (sidebar) sidebar.classList.remove('mobile-open');
        }
    };
}

function setupSellerForms() {
    const formAddProduct = document.getElementById('form-add-product');
    if (formAddProduct) {
        formAddProduct.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('prod-name').value;
            const price = document.getElementById('prod-price').value;
            const desc = document.getElementById('prod-desc').value;
            const img = document.getElementById('prod-img').value;

            const btn = e.target.querySelector('button');
            btn.innerText = "Ajout en cours...";
            btn.disabled = true;

            window.db.collection('products').add({
                shopId: currentShop.id,
                shopName: currentShop.name,
                name: name,
                price: Number(price),
                description: desc,
                image: img,
                category: currentShop.category,
                createdAt: new Date()
            }).then(() => {
                window.showToast("✅ Produit ajouté avec succès !", 'success');
                e.target.reset();
                btn.innerText = "Mettre en ligne";
                btn.disabled = false;
            }).catch(err => {
                console.error(err);
                window.showToast("Erreur: " + err.message, 'danger');
                btn.disabled = false;
            });
        });
    }

    const formSettings = document.getElementById('form-settings');
    if (formSettings) {
        formSettings.addEventListener('submit', (e) => {
            e.preventDefault();

            const newName = document.getElementById('set-shop-name').value;
            const newDesc = document.getElementById('set-shop-desc').value;

            window.db.collection('shops').doc(currentShop.id).update({
                name: newName,
                description: newDesc
            }).then(() => {
                window.showToast("Paramètres mis à jour !", 'success');
                const shopNameTitle = document.getElementById('shop-name-title');
                if (shopNameTitle) shopNameTitle.innerText = newName;
            }).catch(err => {
                window.showToast("Erreur: " + err.message, 'danger');
            });
        });
    }
}

window.deleteSellerProduct = function(id) {
    if (confirm("Supprimer ce produit ?")) {
        window.db.collection('products').doc(id).delete()
            .then(() => {
                window.showToast("Produit supprimé", 'success');
            })
            .catch(err => {
                window.showToast("Erreur: " + err.message, 'danger');
            });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE FORMULAIRE PRODUIT (product-form.js fusionné - simplifié)
// ─────────────────────────────────────────────────────────────────────────────

let productVariants = [];

function setupDynamicAttributes() {
    const catSelect = document.getElementById('p-cat');
    const container = document.getElementById('dynamic-fields');

    if (!catSelect || !container) return;

    catSelect.addEventListener('change', () => {
        const category = catSelect.value;
        container.innerHTML = '';
        productVariants = [];

        if (!category) return;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'border-left: 4px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;';
        wrapper.innerHTML = '<h3 style="margin-top: 0; color: #333;">⚙️ Spécifications</h3>';

        if (category === 'Beauté & Hygiène') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Type de produit</label>
                        <select class="input" id="spec-beauty-type">
                            <option value="">-- Sélectionner --</option>
                            <option value="Soin visage">Soin visage</option>
                            <option value="Soin corps">Soin corps</option>
                            <option value="Maquillage">Maquillage</option>
                            <option value="Parfum">Parfum</option>
                            <option value="Hygiène">Hygiène</option>
                        </select>
                    </div>
                    <div>
                        <label>Date d'expiration</label>
                        <input type="date" class="input" id="spec-expiry-date">
                    </div>
                </div>
            `;
        } else if (category === 'Mode & Vêtements') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Type</label>
                        <select class="input" id="spec-clothing-type">
                            <option value="">-- Sélectionner --</option>
                            <option value="Haut">Haut</option>
                            <option value="Bas">Bas</option>
                            <option value="Chaussure">Chaussure</option>
                            <option value="Accessoire">Accessoire</option>
                        </select>
                    </div>
                    <div>
                        <label>Genre</label>
                        <select class="input" id="spec-gender">
                            <option value="">-- Sélectionner --</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Unisexe">Unisexe</option>
                        </select>
                    </div>
                    <div>
                        <label>Matière</label>
                        <input type="text" class="input" id="spec-material" placeholder="Ex: Coton 100%">
                    </div>
                </div>
            `;
        }

        container.appendChild(wrapper);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE COMMANDES (order.js fusionné - simplifié)
// ─────────────────────────────────────────────────────────────────────────────

function initOrderManagement() {
    const orderList = document.getElementById('orders-content');
    if (!orderList) return;

    const orders = Store.orders || [];

    if (orders.length === 0) {
        orderList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package-x"></i>
                <h3>Aucune commande</h3>
                <p>Vous n'avez pas encore de commande.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const sortedOrders = [...orders].sort((a, b) => b.date - a.date);

    orderList.innerHTML = sortedOrders.map((order, index) => {
        const date = new Date(order.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const receiptNum = String(sortedOrders.length - index).padStart(5, '0');

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <span class="order-number">Reçu N° ${receiptNum}</span>
                        <span class="order-date">${date}</span>
                    </div>
                    <span class="status-pill">${order.status || 'processing'}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image || 'assets/img/placeholder-product-1.svg'}" alt="${item.name}" class="order-item-img">
                            <div class="order-item-details">
                                <span class="order-item-name">${item.name}</span>
                                <span class="order-item-qty">Quantité: ${item.qty}</span>
                            </div>
                            <span class="order-item-price">${window.formatFCFA(item.price * item.qty)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">
                        <span>Total</span>
                        <strong>${window.formatFCFA(order.total)}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (window.fixLucideIcons) window.fixLucideIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE FACTURES (invoice.js fusionné - simplifié)
// ─────────────────────────────────────────────────────────────────────────────

function generateInvoice(order) {
    if (!order) return;

    const receiptNum = String(Store.orders.indexOf(order) + 1).padStart(5, '0');
    const date = new Date(order.date).toLocaleDateString('fr-FR');

    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = order.discount || 0;

    const invoiceHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>AURUM CORP - Reçu N° ${receiptNum}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .invoice-document { background: white; padding: 40px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
        .company-info { display: flex; gap: 20px; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
        .company-info h2 { margin: 0; font-size: 32px; color: #1C2233; }
        .customer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .invoice-line { border: 1px solid #eee; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .invoice-total { border-top: 2px solid #D4AF37; padding-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
        .spec-value { color: #333; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="invoice-document">
        <div class="company-info">
            <div>
                <h2>Aurum</h2>
                <div>Ouagadougou, Burkina Faso</div>
                <div>Email: aurumcorporate.d@gmail.com</div>
            </div>
        </div>

        <div class="customer-info">
            <div>
                <strong>Client:</strong>
                <div class="spec-value">${order.userEmail}</div>
            </div>
            <div>
                <strong>Adresse de livraison:</strong>
                <div class="spec-value">${order.address || 'Non spécifiée'}</div>
            </div>
        </div>

        <div class="invoice-details">
            <div><strong>Référence:</strong> AUR-${receiptNum}</div>
            <div><strong>Date:</strong> ${date}</div>
            <div><strong>Statut:</strong> ${order.status || 'En cours'}</div>
        </div>

        <div class="invoice-line">
            <h3>Produits commandés</h3>
            ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div>
                        <div><strong>${item.name}</strong></div>
                        <div class="spec-value">Quantité: ${item.qty}</div>
                    </div>
                    <div style="text-align: right;">
                        <div>${window.formatFCFA(item.price)} x ${item.qty}</div>
                        <div style="font-weight: bold;">${window.formatFCFA(item.price * item.qty)}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="invoice-total">
            <div>Sous-total: ${window.formatFCFA(subtotal)}</div>
            ${discount > 0 ? `<div>Remise: -${window.formatFCFA(discount)}</div>` : ''}
            <div style="font-size: 22px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                Total: ${window.formatFCFA(order.total)}
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>Merci pour votre achat! © 2026 Aurum Marketplace</p>
        </div>
    </div>

    <script>
        window.print();
    </script>
</body>
</html>
    `;

    const invoiceWindow = window.open('', '', 'width=800,height=600');
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING AUTOMATIQUE
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (!isAdminOrSeller()) {
        console.warn("Utilisateur non autorisé pour l'interface admin");
        return;
    }

    // Initialize seller dashboard if seller page
    if (document.getElementById('seller-content') || document.getElementById('products-list')) {
        initSellerDashboard();
    }

    // Initialize order management if order page
    if (document.getElementById('orders-content')) {
        initOrderManagement();
    }

    // Initialize dynamic product form attributes
    setupDynamicAttributes();

    // Initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    if (window.fixLucideIcons) {
        window.fixLucideIcons();
    }
});

console.log("✅ Admin.js chargé - Vendeur, Produits, Commandes & Factures OK");
