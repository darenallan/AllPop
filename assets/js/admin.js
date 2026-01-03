/* =========================================================
   AURUM ADMIN - CONNEXION RÉELLE FIREBASE (FIRESTORE)
   ========================================================= */

// Initialisation de la base de données
const db = firebase.firestore();

// STORE GLOBAL (Tes données vivantes)
const Store = {
    users: [],
    shops: [],
    promos: [],
    categories: [
        { id: 'mode', name: 'Mode', icon: 'shirt' },
        { id: 'auto', name: 'Auto', icon: 'car' },
        { id: 'maison', name: 'Maison', icon: 'home' },
        { id: 'tech', name: 'Tech', icon: 'smartphone' }
    ]
};

// --- 1. DÉMARRAGE SÉCURISÉ ---
document.addEventListener('DOMContentLoaded', () => {
    
    // On surveille la connexion de l'admin
    firebase.auth().onAuthStateChanged((user) => {
        const guard = document.getElementById('admin-guard');
        const dash = document.getElementById('admin-dashboard');

        // Liste des admins autorisés
        const admins = ["aurumcorporate.d@gmail.com", "admin@aurum.com"];

        if (user && admins.includes(user.email)) {
            // Admin reconnu -> On ouvre l'accès
            if(guard) guard.style.display = 'none';
            if(dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
            }
            
            console.log("✅ Admin connecté :", user.email);
            
            // ON LANCE LA RÉCUPÉRATION DES DONNÉES RÉELLES
            startRealTimeData();
            
            // On active la navigation
            setupNavigation();
            setupForms();
            
        } else {
            // Pas connecté ? -> Login
            window.location.href = "login.html";
        }
    });
});

// --- 2. RÉCUPÉRATION DONNÉES TEMPS RÉEL (Firestore) ---
function startRealTimeData() {
    
    // Écoute les BOUTIQUES
    db.collection('shops').onSnapshot(snapshot => {
        Store.shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderShops();
        renderStats(); // Met à jour les stats
    });

    // Écoute les UTILISATEURS
    db.collection('users').onSnapshot(snapshot => {
        Store.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers();
        renderStats();
    });

    // Écoute les PROMOS
    db.collection('promos').onSnapshot(snapshot => {
        Store.promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPromos();
    });
    
    // Initialiser les catégories (Statiques pour l'instant)
    renderCategoriesManagement();
    populateCategorySelect();
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- 3. NAVIGATION (Ton code, réparé) ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    if(mobileToggle) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;

            // Gestion Active
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Affichage Section
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none'; // Force masquage
            });

            const target = document.getElementById('section-' + targetId);
            if(target) {
                target.style.display = 'block'; // Force affichage
                setTimeout(() => target.classList.add('active'), 10);
            }
            
            // Fermer menu mobile
            if(window.innerWidth < 900 && sidebar) sidebar.classList.remove('mobile-open');
        });
    });
}

// --- 4. RENDU DES DONNÉES (Affichage) ---

function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;

    if (Store.shops.length === 0) {
        container.innerHTML = '<div class="empty-state-card"><p>Aucune boutique en ligne.</p></div>';
        return;
    }

    container.innerHTML = Store.shops.map(shop => `
        <div class="shop-card" style="position: relative;">
            <div class="shop-card-header">
                <span class="shop-category-badge">
                    <i data-lucide="store"></i> ${shop.category}
                </span>
                <span class="shop-status ${shop.status === 'active' ? 'status-active' : 'status-blocked'}">${shop.status}</span>
            </div>
            <h4 class="shop-name">${shop.name}</h4>
            <div class="shop-meta">
                <span><i data-lucide="mail"></i> ${shop.ownerEmail}</span>
            </div>
            <div class="shop-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteShop('${shop.id}')">Supprimer</button>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderUsers() {
    const container = document.getElementById('admin-users');
    if(!container) return;
    
    container.innerHTML = Store.users.map(u => `
        <div class="admin-card" style="padding: 15px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${u.name || 'Utilisateur'}</strong><br>
                <span class="text-muted">${u.email}</span>
            </div>
            <span class="badge" style="background:#eee;">${u.role}</span>
        </div>
    `).join('');
}

function renderPromos() {
    const container = document.getElementById('admin-promos');
    if(!container) return;
    
    if (Store.promos.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune promo.</p>';
        return;
    }

    container.innerHTML = Store.promos.map(p => `
        <div class="promo-card">
            <div class="promo-info">
                <div class="promo-code">${p.code}</div>
                <div class="promo-details">
                    <span class="promo-percent">-${p.percent}%</span>
                </div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('promos', '${p.id}')">X</button>
        </div>
    `).join('');
}

function renderStats() {
    const statsDiv = document.getElementById('admin-stats');
    if(statsDiv) {
        statsDiv.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-label">Boutiques</div>
                <div class="admin-stat-value">${Store.shops.length}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">Comptes</div>
                <div class="admin-stat-value">${Store.users.length}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">Promos</div>
                <div class="admin-stat-value">${Store.promos.length}</div>
            </div>
        `;
    }
}

// --- 5. FORMULAIRES (Envoi vers Firestore) ---

function setupForms() {
    
    // CRÉER VENDEUR
    const sellerForm = document.getElementById('create-seller-form');
    if(sellerForm) {
        sellerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = sellerForm.name.value;
            const email = sellerForm.email.value;
            const pass = sellerForm.password.value;
            
            // Appel Auth (Création compte) + Firestore (Sauvegarde data)
            Auth.createSeller(email, pass, name).then(res => {
                if(res.success) {
                    db.collection('users').add({
                        name: name, email: email, role: 'seller', createdAt: new Date()
                    });
                    alert("✅ Vendeur créé !");
                    sellerForm.reset();
                } else {
                    alert("Erreur: " + res.message);
                }
            });
        });
    }

    // CRÉER BOUTIQUE
    const shopForm = document.getElementById('shop-form');
    if(shopForm) {
        shopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = shopForm.name.value;
            const email = shopForm.ownerEmail.value;
            const cat = shopForm.categoryId.value;

            db.collection('shops').add({
                name: name,
                ownerEmail: email,
                category: cat,
                status: 'active',
                createdAt: new Date()
            }).then(() => {
                alert("✅ Boutique créée en ligne !");
                shopForm.reset();
            });
        });
    }
}

// --- HELPER CATEGORIES ---
function populateCategorySelect() {
    const select = document.getElementById('shop-category-select');
    if(!select) return;
    select.innerHTML = '<option value="">Choisir catégorie</option>';
    Store.categories.forEach(c => {
        select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
}

function renderCategoriesManagement() {
    const div = document.getElementById('categories-management');
    if(div) {
        div.innerHTML = Store.categories.map(c => `
            <div class="category-manage-card">
                <h4>${c.name}</h4>
                <button class="btn btn-sm btn-outline">Gérer</button>
            </div>
        `).join('');
    }
}

// --- GLOBAL DELETE ---
window.deleteShop = function(id) {
    if(confirm("Supprimer cette boutique ?")) {
        db.collection('shops').doc(id).delete();
    }
};

window.deleteItem = function(col, id) {
    if(confirm("Supprimer ?")) {
        db.collection(col).doc(id).delete();
    }
};
