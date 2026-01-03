/* =========================================================
   DASHBOARD ADMIN - LOGIQUE COMPLÈTE RESTAURÉE
   ========================================================= */

// 1. DATA STORE (Mémoire locale temporaire pour que l'admin fonctionne)
// Cela remplace la base de données en attendant que tu codes le backend complet
const Store = {
    users: JSON.parse(localStorage.getItem('ac_users') || '[]'),
    shops: JSON.parse(localStorage.getItem('ac_shops') || '[]'),
    promos: JSON.parse(localStorage.getItem('ac_promos') || '[]'),
    // Catégories par défaut
    categories: [
        { id: 'voitures', name: 'Véhicules', icon: 'car' },
        { id: 'immobilier', name: 'Immobilier', icon: 'home' },
        { id: 'mode', name: 'Mode', icon: 'shirt' },
        { id: 'electronique', name: 'Électronique', icon: 'smartphone' },
        { id: 'services', name: 'Services', icon: 'briefcase' }
    ]
};

// Fonction pour sauvegarder les changements
function saveStore() {
    localStorage.setItem('ac_users', JSON.stringify(Store.users));
    localStorage.setItem('ac_shops', JSON.stringify(Store.shops));
    localStorage.setItem('ac_promos', JSON.stringify(Store.promos));
}

// 2. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    
    // Vérification Firebase (Sécurité)
    firebase.auth().onAuthStateChanged((user) => {
        const guard = document.getElementById('admin-guard');
        const dash = document.getElementById('admin-dashboard');
        
        // Liste des admins autorisés
        const allowedAdmins = ["admin@aurum.com", "aurumcorporate.d@gmail.com"];

        if (user && allowedAdmins.includes(user.email)) {
            // Afficher le dashboard
            if(guard) guard.style.display = 'none';
            if(dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
            }
            
            // Lancer toutes les fonctions du dashboard
            initDashboardFeatures();
            console.log("✅ Admin connecté & chargé");
        } else {
            // Pas autorisé
            window.location.href = "login.html";
        }
    });
});

// 3. FONCTIONNALITÉS DU DASHBOARD
function initDashboardFeatures() {
    setupNavigation();
    renderStats();
    renderShops();
    renderUsers();
    renderPromos();
    populateCategorySelect();
    setupForms();
    lucide.createIcons(); // Rafraîchir les icônes
}

// --- Navigation (Onglets) ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    // Clic sur le menu burger
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Clic sur les liens
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;

            // 1. Cacher toutes les sections
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none';
            });

            // 2. Désactiver tous les liens
            navLinks.forEach(l => l.classList.remove('active'));

            // 3. Activer la cible
            document.getElementById('section-' + targetId).style.display = 'block';
            document.getElementById('section-' + targetId).classList.add('active');
            link.classList.add('active');

            // Fermer menu mobile
            if(window.innerWidth < 900) sidebar.classList.remove('mobile-open');
        });
    });
}

// --- Gestion des Boutiques ---
function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;

    if(Store.shops.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune boutique enregistrée.</p>';
        return;
    }

    container.innerHTML = Store.shops.map(shop => `
        <div class="shop-card" style="padding:15px; border:1px solid #eee; margin-bottom:10px; border-radius:8px;">
            <div style="display:flex; justify-content:space-between;">
                <strong>${shop.name}</strong>
                <span class="badge badge-gold">${shop.category}</span>
            </div>
            <p style="font-size:13px; color:#666;">Propriétaire: ${shop.owner}</p>
            <button class="btn btn-sm btn-danger" onclick="deleteShop('${shop.id}')">Supprimer</button>
        </div>
    `).join('');
}

window.deleteShop = function(id) {
    if(confirm("Supprimer cette boutique ?")) {
        Store.shops = Store.shops.filter(s => s.id !== id);
        saveStore();
        renderShops();
        renderStats();
    }
};

// --- Formulaires ---
function setupForms() {
    
    // 1. Créer Vendeur (Firebase Auth)
    const createSellerForm = document.getElementById('create-seller-form');
    if(createSellerForm) {
        createSellerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = createSellerForm.email.value;
            const password = createSellerForm.password.value;
            const name = createSellerForm.name.value;
            const btn = createSellerForm.querySelector('button');

            btn.innerText = "Création...";
            
            // Appel à notre fonction spéciale dans auth-firebase.js
            if(Auth.createSeller) {
                Auth.createSeller(email, password, name).then(res => {
                    btn.innerText = "Créer le compte vendeur";
                    if(res.success) {
                        alert("✅ Vendeur créé avec succès !");
                        createSellerForm.reset();
                        // Ajouter à la liste locale pour affichage
                        Store.users.push({ name, email, role: 'vendeur', date: new Date().toLocaleDateString() });
                        saveStore();
                        renderUsers();
                    } else {
                        alert("❌ Erreur : " + res.message);
                    }
                });
            }
        });
    }

    // 2. Créer Boutique (Local Store)
    const shopForm = document.getElementById('shop-form');
    if(shopForm) {
        shopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newShop = {
                id: Date.now().toString(),
                name: shopForm.name.value,
                owner: shopForm.ownerEmail.value,
                category: shopForm.categoryId.value
            };
            Store.shops.push(newShop);
            saveStore();
            alert("Boutique ajoutée !");
            renderShops();
            renderStats();
            shopForm.reset();
        });
    }

    // 3. Créer Promo
    const promoForm = document.getElementById('promo-form');
    if(promoForm) {
        promoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPromo = {
                code: promoForm.code.value.toUpperCase(),
                percent: promoForm.percent.value
            };
            Store.promos.push(newPromo);
            saveStore();
            renderPromos();
            promoForm.reset();
        });
    }
}

// --- Helpers d'affichage ---

function populateCategorySelect() {
    const select = document.getElementById('shop-category-select');
    if(!select) return;
    select.innerHTML = '<option value="">Choisir une catégorie</option>';
    Store.categories.forEach(cat => {
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
}

function renderStats() {
    const statsContainer = document.getElementById('admin-stats');
    if(statsContainer) {
        statsContainer.innerHTML = `
            <div class="admin-card" style="text-align:center;">
                <h3 style="margin:0; font-size:14px; color:#666;">Boutiques</h3>
                <p style="font-size:28px; font-weight:bold; margin:5px 0; color:#D4AF37;">${Store.shops.length}</p>
            </div>
            <div class="admin-card" style="text-align:center;">
                <h3 style="margin:0; font-size:14px; color:#666;">Utilisateurs</h3>
                <p style="font-size:28px; font-weight:bold; margin:5px 0;">${Store.users.length}</p>
            </div>
            <div class="admin-card" style="text-align:center;">
                <h3 style="margin:0; font-size:14px; color:#666;">Promos Actives</h3>
                <p style="font-size:28px; font-weight:bold; margin:5px 0;">${Store.promos.length}</p>
            </div>
        `;
    }
}

function renderUsers() {
    const div = document.getElementById('admin-users');
    if(!div) return;
    if(Store.users.length === 0) {
        div.innerHTML = '<p class="text-muted">Aucun utilisateur récent.</p>';
        return;
    }
    div.innerHTML = Store.users.map(u => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span><strong>${u.name}</strong> <br> <small>${u.email}</small></span>
            <span class="badge">${u.role || 'Membre'}</span>
        </div>
    `).join('');
}

function renderPromos() {
    const div = document.getElementById('admin-promos');
    if(!div) return;
    div.innerHTML = Store.promos.map(p => `
        <div style="background:#f9f9f9; padding:10px; margin-bottom:5px; border-radius:5px; display:flex; justify-content:space-between;">
            <strong>${p.code}</strong>
            <span>-${p.percent}%</span>
        </div>
    `).join('');
}
