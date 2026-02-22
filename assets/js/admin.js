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

function getStoredUser() {
    return JSON.parse(localStorage.getItem('ac_currentUser') || 'null');
}

function isAdminOrSeller(user = getStoredUser()) {
    if (!user) return false;
    const role = user.role || '';
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
let productImages = [];
let logoBase64 = "";
let bannerBase64 = "";

function initSellerDashboard() {
    // ON SUPPRIME LA VÉRIFICATION BLOQUANTE SYNCHRONE ICI
    
    window.auth.onAuthStateChanged((user) => {
        const loader = document.getElementById('loader');
        const content = document.getElementById('seller-content');
        const warning = document.getElementById('no-shop-warning');

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const timeoutId = setTimeout(() => {
            if (loader) loader.style.display = 'none';
            if (warning) {
                warning.classList.remove('hidden');
                warning.style.display = 'block';
            }
            const emailDisplay = document.getElementById('user-email-display');
            if (emailDisplay) emailDisplay.innerText = user.email;
        }, 10000);

        // Vérification sécurisée via Firestore
        window.db.collection('users').doc(user.uid).get().then((doc) => {
            const userData = doc.exists ? (doc.data() || {}) : {};
            const role = userData.role || '';

            const isRoleAllowed = ['admin', 'superadmin', 'seller', 'maintainer'].includes(role);

            const loadShopAndProceed = () => {
                console.log("👤 Vendeur identifié :", user.email);

                window.db.collection('shops').where('ownerEmail', '==', user.email).get()
                    .then((snapshot) => {
                        clearTimeout(timeoutId);
                        if (loader) loader.style.display = 'none';
                        if (!snapshot.empty) {
                            const doc = snapshot.docs[0];
                            currentShop = { id: doc.id, ...doc.data() };
                            updateShopUI(currentShop);
                            if (content) {
                                content.classList.remove('hidden');
                                content.style.display = 'block';
                            }
                            populateSellerCategories();
                            listenToSellerProducts();
                            loadSellerOrders(user.uid);
                            setupSellerNavigation();
                            setupSellerForms();
                            setupProductUpload();
                            setupProfileUpload();
                        } else {
                            console.warn("Aucune boutique trouvée.");
                            if (warning) {
                                warning.classList.remove('hidden');
                                warning.style.display = 'block';
                            }
                            const emailDisplay = document.getElementById('user-email-display');
                            if (emailDisplay) emailDisplay.innerText = user.email;
                        }
                    });
            };

            if (isRoleAllowed) {
                loadShopAndProceed();
                return;
            }

            // Fallback: si rôle absent/incorrect mais une boutique existe, on autorise
            window.db.collection('shops').where('ownerEmail', '==', user.email).get()
                .then((snapshot) => {
                    if (!snapshot.empty) {
                        loadShopAndProceed();
                        return;
                    }

                    console.warn("⛔ Accès refusé : Rôle insuffisant");
                    window.location.href = "index.html";
                });
        });
    });
}

function populateSellerCategories() {
    const catSelect = document.getElementById('p-cat');
    if (!catSelect) return;

    const categories = (window.Store && Array.isArray(window.Store.categories))
        ? window.Store.categories
        : [];

    const options = ['<option value="">-- Sélectionner --</option>']
        .concat(categories.map(cat => `<option value="${cat}">${cat}</option>`));

    catSelect.innerHTML = options.join('');
}

function setupProductUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('p-files');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleProductFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => handleProductFiles(fileInput.files));
}

function handleProductFiles(files) {
    if (productImages.length + files.length > 5) {
        window.showToast('Maximum 5 images autorisées.', 'warning');
        return;
    }

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            productImages.push(e.target.result);
            renderProductGallery();
        };
        reader.readAsDataURL(file);
    });
}

function renderProductGallery() {
    const gallery = document.getElementById('preview-gallery');
    if (!gallery) return;
    gallery.innerHTML = "";
    productImages.forEach((img, index) => {
        gallery.innerHTML += `
            <div class="preview-item">
                <img src="${img}">
                <button type="button" class="preview-remove" onclick="removeProductImage(${index})">&times;</button>
            </div>`;
    });
}

window.removeProductImage = (index) => {
    productImages.splice(index, 1);
    renderProductGallery();
};

function setupProfileUpload() {
    const logoZone = document.getElementById('upload-logo');
    const logoInput = document.getElementById('file-logo');
    if (logoZone && logoInput) {
        logoZone.addEventListener('click', () => logoInput.click());
        logoInput.addEventListener('change', () => {
            if (logoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    logoBase64 = e.target.result;
                    const preview = document.getElementById('preview-logo');
                    if (preview) preview.src = logoBase64;
                };
                reader.readAsDataURL(logoInput.files[0]);
            }
        });
    }

    const bannerZone = document.getElementById('upload-banner');
    const bannerInput = document.getElementById('file-banner');
    if (bannerZone && bannerInput) {
        bannerZone.addEventListener('click', () => bannerInput.click());
        bannerInput.addEventListener('change', () => {
            if (bannerInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    bannerBase64 = e.target.result;
                    const preview = document.getElementById('preview-banner');
                    if (preview) preview.src = bannerBase64;
                };
                reader.readAsDataURL(bannerInput.files[0]);
            }
        });
    }
}

function updateShopUI(shop) {
    // On essaie plusieurs IDs possibles pour être sûr de trouver le titre
    const titleEl = document.getElementById('shop-name-title') || document.getElementById('shop-title-display') || document.querySelector('.shop-name-display');
    const inputName = document.getElementById('set-shop-name') || document.getElementById('set-name');
    const inputDesc = document.getElementById('set-shop-desc') || document.getElementById('set-desc');
    const inputSlogan = document.getElementById('set-slogan');
    const inputPhone = document.getElementById('set-phone');
    const inputEmail = document.getElementById('set-email');
    const statusEl = document.getElementById('shop-status-display');
    const categoryEl = document.getElementById('shop-category-display');
    
    if (titleEl) {
        titleEl.innerText = shop.name;
        titleEl.style.color = "var(--gold-primary)"; // Force la couleur or
    }
    if (inputName) inputName.value = shop.name;
    if (inputDesc) inputDesc.value = shop.description || '';
    if (inputSlogan) inputSlogan.value = shop.slogan || '';
    if (inputPhone) inputPhone.value = shop.phone || '';
    if (inputEmail) inputEmail.value = shop.ownerEmail || shop.email || '';

    if (statusEl) statusEl.innerText = shop.status || 'Actif';
    if (categoryEl) categoryEl.innerText = shop.category || '...';

    updateShopRemainingDays(shop);
    
    // Afficher le contenu principal
    const content = document.getElementById('seller-content');
    if (content) content.style.display = 'block';
}

function updateShopRemainingDays(shop) {
    const displayEl = document.getElementById('shop-days-remaining');
    if (!displayEl || !shop) return;

    if (!shop.expiresAt) {
        displayEl.innerText = '(Durée non définie)';
        displayEl.style.color = '#999';
        return;
    }

    try {
        const expiryDate = shop.expiresAt.toDate ? shop.expiresAt.toDate() : new Date(shop.expiresAt);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            displayEl.innerText = '(Expirée)';
            displayEl.style.color = '#b91c1c';
        } else if (diffDays === 0) {
            displayEl.innerText = '(Expire aujourd\'hui)';
            displayEl.style.color = '#d97706';
        } else if (diffDays <= 7) {
            displayEl.innerText = `(${diffDays} jour${diffDays > 1 ? 's' : ''} restant${diffDays > 1 ? 's' : ''})`;
            displayEl.style.color = '#d97706';
        } else {
            displayEl.innerText = `(${diffDays} jours restants)`;
            displayEl.style.color = '#666';
        }
    } catch (e) {
        console.error('Erreur calcul jours restants:', e);
        displayEl.innerText = '';
    }
}

// Nouvelle fonction dédiée aux commandes pour éviter le chargement infini
function loadSellerOrders(userId) {
    const loader = document.getElementById('orders-loader');
    const container = document.getElementById('orders-container');
    const list = document.getElementById('orders-list');

    if (!container || !list) return;

    if (loader) loader.style.display = 'block';
    container.style.display = 'none';
    list.innerHTML = '<div class="text-center" style="padding:20px;">Recherche des commandes...</div>';

    // On cherche les commandes où l'utilisateur est VENDEUR ou ACHETEUR
    // Note: Pour un vrai système multi-vendeur, il faudrait filtrer par 'items.shopId'
    // Ici on simplifie en prenant toutes les commandes pour la démo
    
    const orders = window.Store.orders || []; 
    // Si tu veux utiliser Firebase en direct, décommente la ligne ci-dessous :
    // window.db.collection('orders').where('sellerId', '==', userId).get()...

    if (orders.length === 0) {
        list.innerHTML = `
            <div class="card" style="padding:40px; text-align:center;">
                <i data-lucide="package-x" style="font-size:40px; color:var(--text-muted); margin-bottom:10px;"></i>
                <h3>Aucune commande</h3>
                <p style="color:var(--text-muted)">Vos ventes apparaîtront ici.</p>
            </div>`;
    } else {
        list.innerHTML = orders.map(order => {
            const date = new Date(order.date).toLocaleDateString();
            return `
            <div class="card" style="margin-bottom:15px; padding:20px; border-left:4px solid var(--gold-primary);">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <div>
                        <strong>Commande #${order.id.substr(-6)}</strong>
                        <div style="font-size:0.9em; color:var(--text-muted);">${date}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:bold; color:var(--gold-primary);">${window.formatFCFA(order.total)}</div>
                        <span class="badge">${order.status || 'En cours'}</span>
                    </div>
                </div>
                <div style="border-top:1px solid var(--border-dark); padding-top:10px;">
                    ${order.items.map(item => `
                        <div style="display:flex; justify-content:space-between; font-size:0.9em; margin-bottom:5px;">
                            <span>${item.qty}x ${item.name}</span>
                            <span>${window.formatFCFA(item.price)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    }

    if (loader) loader.style.display = 'none';
    container.style.display = 'block';
    
    if (window.lucide) window.lucide.createIcons();
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

    // Alias utilisé par le HTML (onclick="nav(...)" )
    window.nav = function(tabId, btn) {
        if (typeof window.navigateSellerTab === 'function') {
            window.navigateSellerTab(tabId, btn);
        }
    };
}

// Déconnexion (utilisé dans seller.html)
window.logout = function() {
    if (window.Auth && typeof window.Auth.logout === 'function') {
        window.Auth.logout();
        return;
    }
    if (window.auth && typeof window.auth.signOut === 'function') {
        window.auth.signOut().then(() => window.location.href = "login.html");
        return;
    }
    window.location.href = "login.html";
};

function setupSellerForms() {
    // ════════════════════════════════════════════════════════════════════
    // Initialiser le système de catégories en cascade
    // ════════════════════════════════════════════════════════════════════
    if (typeof window.initCategoryCascade === 'function') {
        window.initCategoryCascade({
            mainCategoryId: 'p-cat-main',
            subCategoryId: 'p-cat-sub',
            subSubCategoryId: 'p-cat-subsub',
            containerId: 'category-cascade-container'
        });
    } else {
        console.warn('⚠️ categories.js non chargé - système de cascade indisponible');
    }

    const formAddProduct = document.getElementById('form-add-product');
    if (formAddProduct) {
        formAddProduct.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('p-name') || document.getElementById('prod-name');
            const priceInput = document.getElementById('p-price') || document.getElementById('prod-price');
            const descInput = document.getElementById('p-desc') || document.getElementById('prod-desc');
            const imgInput = document.getElementById('prod-img');

            const name = nameInput ? nameInput.value : '';
            const price = priceInput ? priceInput.value : '';
            const desc = descInput ? descInput.value : '';
            const img = imgInput ? imgInput.value : '';

            // ════════════════════════════════════════════════════════════════
            // Récupération de la catégorie depuis le système en cascade
            // ════════════════════════════════════════════════════════════════
            let category = '';
            if (typeof window.getCategorySelection === 'function') {
                const categoryData = window.getCategorySelection({
                    mainCategoryId: 'p-cat-main',
                    subCategoryId: 'p-cat-sub',
                    subSubCategoryId: 'p-cat-subsub'
                });
                category = categoryData.fullPath; // Ex: "Mode > Homme > T-shirts"
            } else {
                // Fallback si categories.js n'est pas chargé
                const catInput = document.getElementById('p-cat');
                category = catInput ? catInput.value : (currentShop ? currentShop.category : '');
            }

            const skuInput = document.getElementById('p-sku');
            const stockInput = document.getElementById('p-stock');
            const minStockInput = document.getElementById('p-min-stock');

            const sku = skuInput ? skuInput.value : '';
            const stock = stockInput ? Number(stockInput.value || 0) : 0;
            const minStock = minStockInput ? Number(minStockInput.value || 0) : 0;

            const btn = e.target.querySelector('button');

            if (!name || !price || !desc || !category) {
                window.showToast('Veuillez remplir tous les champs requis.', 'warning');
                btn.disabled = false;
                btn.innerText = "Mettre en ligne";
                return;
            }
            btn.innerText = "Ajout en cours...";
            btn.disabled = true;

            window.db.collection('products').add({
                shopId: currentShop.id,
                shopName: currentShop.name,
                name: name,
                price: Number(price),
                description: desc,
                image: productImages[0] || img || 'assets/img/placeholder.png',
                images: productImages.length ? productImages.slice(0, 5) : undefined,
                sku: sku,
                stock: stock,
                minStock: minStock,
                category: category,
                createdAt: new Date()
            }).then(() => {
                window.showToast("✅ Produit ajouté avec succès !", 'success');
                e.target.reset();
                productImages = [];
                renderProductGallery();
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

            const nameInput = document.getElementById('set-shop-name') || document.getElementById('set-name');
            const descInput = document.getElementById('set-shop-desc') || document.getElementById('set-desc');
            const sloganInput = document.getElementById('set-slogan');
            const phoneInput = document.getElementById('set-phone');

            const newName = nameInput ? nameInput.value : '';
            const newDesc = descInput ? descInput.value : '';
            const newSlogan = sloganInput ? sloganInput.value : '';
            const newPhone = phoneInput ? phoneInput.value : '';

            window.db.collection('shops').doc(currentShop.id).update({
                name: newName,
                description: newDesc,
                slogan: newSlogan,
                phone: newPhone,
                ...(logoBase64 ? { logo: logoBase64 } : {}),
                ...(bannerBase64 ? { banner: bannerBase64 } : {})
            }).then(() => {
                window.showToast("Paramètres mis à jour !", 'success');
                const shopNameTitle = document.getElementById('shop-name-title') || document.getElementById('shop-title-display');
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

        if (category === 'Beauté & Hygiène' || category === 'Beauté, Hygiène & Bien-être') {
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
    const isSellerPage = Boolean(document.getElementById('seller-content') || document.getElementById('products-list'));

    let authUser = null;

    const initAfterAuth = () => {
        if (!isSellerPage && !isAdminOrSeller()) {
            console.warn("Utilisateur non autorisé pour l'interface admin");
            window.location.href = "login.html";
            return;
        }

        // Initialize seller dashboard if seller page
        if (isSellerPage) {
            initSellerDashboard();
        }

        // Initialize order management if order page
        if (document.getElementById('orders-content')) {
            const userId = authUser ? authUser.uid : null;
            loadSellerOrders(userId);
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
    };

    if (window.auth && typeof window.auth.onAuthStateChanged === 'function') {
        window.auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "login.html";
                return;
            }

            authUser = user;

            const finalize = () => initAfterAuth();

            if (typeof window.syncCurrentUser === 'function') {
                window.syncCurrentUser(user).then(finalize).catch(finalize);
            } else {
                finalize();
            }
        });
    } else {
        initAfterAuth();
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// PARTIE 2 : WORKFLOW VENDEUR - COMMANDES PRÊTES POUR LIVRAISON
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Charge les commandes en attente de préparation par le vendeur
 * Filtre: status === 'pending_seller'
 */
window.loadPendingSellerOrders = function(shopId) {
    if (!window.db) {
        console.error('Firestore non initialisé');
        return;
    }

    const container = document.getElementById('seller-orders-pending');
    if (!container) return;

    container.innerHTML = '<p style="padding:20px; text-align:center;">Chargement des commandes...</p>';

    // Écoute en temps réel des commandes pending_seller
    window.db.collection('orders')
        .where('status', '==', 'pending_seller')
        .onSnapshot((snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (orders.length === 0) {
                container.innerHTML = `
                    <div style="padding:40px; text-align:center; color:#999;">
                        <i data-lucide="package-check" style="width:64px; height:64px; margin-bottom:16px; opacity:0.5;"></i>
                        <p>Aucune commande en préparation</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            // Afficher les commandes
            container.innerHTML = orders.map(order => {
                const createdAt = order.createdAt ? 
                    (order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt)) : 
                    new Date();
                const dateStr = createdAt.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });

                const total = new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF'
                }).format(order.total || 0);

                const items = order.items || [];
                const itemsList = items.map(item => 
                    `<li>${item.qty}x ${item.name}</li>`
                ).join('');

                return `
                    <div class="card" style="margin-bottom:15px; padding:20px; border-left:4px solid #007bff;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                            <div>
                                <strong>Commande ${order.reference || order.id.substr(-6)}</strong>
                                <div style="font-size:0.9em; color:#666;">${dateStr}</div>
                                <div style="font-size:0.85em; color:#666;">Client: ${order.userEmail || 'N/A'}</div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:bold; color:#007bff; font-size:1.2em;">${total}</div>
                                <span style="background:#007bff; color:white; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;">
                                    EN PRÉPARATION
                                </span>
                            </div>
                        </div>
                        <div style="border-top:1px solid #ddd; padding-top:10px; margin-bottom:15px;">
                            <strong>Articles:</strong>
                            <ul style="margin:5px 0; padding-left:20px;">${itemsList}</ul>
                        </div>
                        <button onclick="markAsReadyForDelivery('${order.id}')" 
                            class="btn-gold" 
                            style="width:100%; padding:12px; font-weight:600;">
                            📦 Marquer comme Prêt pour Expédition
                        </button>
                    </div>
                `;
            }).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, (error) => {
            console.error('Erreur chargement commandes vendeur:', error);
            container.innerHTML = `
                <div style="padding:20px; text-align:center; color:#dc2626;">
                    <p>❌ Erreur de chargement</p>
                    <p style="font-size:12px;">${error.message}</p>
                </div>
            `;
        });
};

/**
 * PARTIE 2 : Marque une commande comme prête pour livraison
 * Statut: pending_seller → ready_for_delivery
 */
window.markAsReadyForDelivery = async function(orderId) {
    if (!confirm('Confirmer que cette commande est prête pour expédition ?')) {
        return;
    }

    try {
        await window.db.collection('orders').doc(orderId).update({
            status: 'ready_for_delivery',
            readyForDeliveryAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Commande marquée prête pour livraison:', orderId);
        alert('✅ Commande prête pour expédition ! Le livreur peut maintenant la prendre en charge.');

    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur lors de la mise à jour: ' + error.message);
    }
};

console.log("✅ Admin.js chargé - Vendeur, Produits, Commandes & Factures OK");
