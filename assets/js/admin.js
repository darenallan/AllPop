/* =========================================================
   DASHBOARD ADMIN - NAVIGATION & DONNÉES RESTAURÉES
   ========================================================= */

// 1. DATA STORE (Mémoire locale pour l'affichage immédiat)
const Store = {
    users: JSON.parse(localStorage.getItem('ac_users') || '[]'),
    shops: JSON.parse(localStorage.getItem('ac_shops') || '[]'),
    promos: JSON.parse(localStorage.getItem('ac_promos') || '[]'),
    // Catégories par défaut
    categories: [
        { id: 'mode', name: 'Mode & Vêtements', icon: 'shirt' },
        { id: 'beaute', name: 'Beauté & Hygiène', icon: 'sparkles' },
        { id: 'electronique', name: 'Électronique', icon: 'smartphone' },
        { id: 'maison', name: 'Maison & Déco', icon: 'home' },
        { id: 'auto', name: 'Auto & Moto', icon: 'car' }
    ]
};

// 2. DONNÉES FICTIVES (Pour que le dashboard ne soit pas vide au démarrage)
function initMockData() {
    if (Store.shops.length === 0) {
        Store.shops = [
            { id: 's1', name: 'Luxe Motors', category: 'Auto & Moto', owner: 'vente.lll@gmail.com', status: 'active' },
            { id: 's2', name: 'Boutique Faso', category: 'Mode & Vêtements', owner: 'client.add@gmail.com', status: 'active' }
        ];
    }
    if (Store.users.length === 0) {
        Store.users = [
            { name: "Super Admin", email: "aurumcorporate.d@gmail.com", role: "superadmin" },
            { name: "Vendeur Test", email: "vendeur@test.com", role: "seller" }
        ];
    }
    // On ne sauvegarde pas dans le localStorage pour ne pas écraser les futures vraies données, 
    // on les garde juste en mémoire vive pour l'affichage de cette session.
}

// 3. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    // ON LANCE TOUT DE SUITE L'INTERFACE (Pas d'attente Firebase pour l'UI)
    initMockData();
    initDashboardFeatures();
    
    // On connecte Firebase en arrière-plan pour les vraies actions futures
    if(typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if(user) console.log("Admin connecté:", user.email);
        });
    }
});

// 4. FONCTIONNALITÉS
function initDashboardFeatures() {
    setupNavigation();
    renderStats();
    renderShops();
    renderUsers();
    renderPromos();
    renderCategories();
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Navigation (C'est ça qui répare les boutons !) ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    // Menu Mobile
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Clic sur les onglets
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;

            // 1. Retirer la classe active de tous les liens
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. Cacher toutes les sections
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none'; // Force hide
            });

            // 3. Afficher la section demandée
            const targetSection = document.getElementById('section-' + targetId);
            if(targetSection) {
                targetSection.style.display = 'block'; // Force show
                targetSection.classList.add('active');
            }
            
            // Fermer le menu sur mobile
            if(window.innerWidth < 900 && sidebar) sidebar.classList.remove('mobile-open');
        });
    });
}

// --- Affichage des Boutiques ---
function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;

    if(Store.shops.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune boutique.</p>';
        return;
    }

    container.innerHTML = Store.shops.map(shop => `
        <div class="admin-card" style="margin-bottom:10px; padding:15px; border-left: 4px solid var(--gold);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0;">${shop.name}</h4>
                <span class="status-badge status-badge--active">Active</span>
            </div>
            <div style="font-size:13px; color:#666; margin-top:5px;">
                ${shop.category} — ${shop.owner}
            </div>
            <div style="margin-top:10px;">
                <button class="btn btn-sm btn-danger">Supprimer</button>
            </div>
        </div>
    `).join('');
}

// --- Affichage des Utilisateurs ---
function renderUsers() {
    const div = document.getElementById('admin-users');
    if(!div) return;
    
    div.innerHTML = Store.users.map(u => `
        <div class="admin-card" style="margin-bottom:10px; padding:15px;">
            <strong>${u.name}</strong><br>
            <span class="text-muted">${u.email}</span>
            <span class="status-badge" style="float:right;">${u.role}</span>
        </div>
    `).join('');
}

// --- Affichage des Catégories ---
function renderCategories() {
    const div = document.getElementById('categories-management');
    if(!div) return;
    
    div.innerHTML = Store.categories.map(cat => `
        <div class="category-manage-card">
            <div class="category-manage-header">
                <i data-lucide="${cat.icon}" class="category-manage-icon"></i>
                <h4>${cat.name}</h4>
            </div>
            <button class="btn btn-sm btn-warning" style="width:100%; margin-top:10px;">Désactiver</button>
        </div>
    `).join('');
}

// --- Affichage des Promos ---
function renderPromos() {
    const div = document.getElementById('admin-promos');
    if(!div) return;
    div.innerHTML = `
        <div class="promo-card">
            <div class="promo-info">
                <div class="promo-code">AURUM10</div>
                <div class="promo-details">
                    <span class="promo-percent">-10%</span>
                    <span class="promo-status">Actif</span>
                </div>
            </div>
            <button class="btn btn-danger btn-sm">Supprimer</button>
        </div>
    `;
}

// --- Stats (Mise à jour avec Store) ---
function renderStats() {
    // Les stats sont déjà en dur dans le HTML pour l'instant, 
    // mais on pourrait les mettre à jour dynamiquement ici.
}
