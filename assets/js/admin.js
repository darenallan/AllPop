/* =========================================================
   DASHBOARD ADMIN - VRAIES DONNÉES (FIRESTORE)
   ========================================================= */

const db = firebase.firestore();
const auth = firebase.auth();

// STORE (Miroir des données en ligne)
let Store = {
    users: [],
    shops: [],
    promos: [],
    categories: [
        { id: 'mode', name: 'Mode & Vêtements', icon: 'shirt' },
        { id: 'beaute', name: 'Beauté & Hygiène', icon: 'sparkles' },
        { id: 'maison', name: 'Maison & Déco', icon: 'home' },
        { id: 'auto', name: 'Auto & Moto', icon: 'car' },
        { id: 'tech', name: 'Électronique', icon: 'smartphone' }
    ]
};

// 1. DÉMARRAGE
document.addEventListener('DOMContentLoaded', () => {
    
    // Écouteur d'authentification
    auth.onAuthStateChanged((user) => {
        const loader = document.getElementById('admin-loader');
        const dash = document.getElementById('admin-dashboard');
        
        // Liste des admins autorisés
        const admins = ["aurumcorporate.d@gmail.com", "admin@aurum.com"];

        if (user && admins.includes(user.email)) {
            // Afficher le dashboard
            if(loader) loader.style.display = 'none';
            if(dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
            }
            console.log("✅ Connecté :", user.email);
            
            // Lancer la synchro avec la base de données
            initRealTimeSync();
            setupNavigation();
            setupForms();
            
        } else {
            // Pas connecté -> Redirection Login
            window.location.href = "login.html";
        }
    });
});

// 2. SYNCHRONISATION TEMPS RÉEL (C'est ça qui remplace tes données fictives)
function initRealTimeSync() {
    
    // BOUTIQUES
    db.collection('shops').onSnapshot(snap => {
        Store.shops = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderShops();
        renderStats();
    });

    // UTILISATEURS
    db.collection('users').onSnapshot(snap => {
        Store.users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers();
        renderStats();
    });

    // PROMOS
    db.collection('promos').onSnapshot(snap => {
        Store.promos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPromos();
        renderStats();
    });

    // Affichage initial des éléments statiques
    populateCategorySelect();
    renderCategories();
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// 3. NAVIGATION (Onglets)
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    if(mobileToggle) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if(link.classList.contains('logout-link')) return; // Laisser le lien Quitter agir

            e.preventDefault();
            const targetId = link.dataset.section;
            if(!targetId) return;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none'; // Force hide
            });

            const target = document.getElementById('section-' + targetId);
            if(target) {
                target.style.display = 'block'; // Force show
                target.classList.add('active');
            }
            
            if(window.innerWidth < 900) sidebar.classList.remove('mobile-open');
        });
    });
}

// 4. RENDU VISUEL (HTML Injection)

function renderStats() {
    const div = document.getElementById('admin-stats');
    if(!div) return;
    
    // Calculs réels basés sur la base de données
    div.innerHTML = `
        <div class="admin-stat-card">
            <div class="admin-stat-label">Boutiques Actives</div>
            <div class="admin-stat-value">${Store.shops.length}</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-label">Comptes Utilisateurs</div>
            <div class="admin-stat-value">${Store.users.length}</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-label">Promos Actives</div>
            <div class="admin-stat-value">${Store.promos.length}</div>
        </div>
    `;
}

function renderShops() {
    const div = document.getElementById('admin-shops');
    if(!div) return;
    
    if(Store.shops.length === 0) {
        div.innerHTML = '<p class="text-muted">Aucune boutique. Créez-en une !</p>';
        return;
    }

    div.innerHTML = Store.shops.map(s => `
        <div class="admin-card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="margin:0; font-size:16px;">${s.name}</h4>
                <div style="font-size:13px; color:#666;">${s.category} — ${s.ownerEmail}</div>
            </div>
            <div style="text-align:right;">
                <span style="font-size:11px; padding:2px 6px; background:#e6fffa; color:#00a3c4; border-radius:4px;">${s.status}</span>
                <br>
                <button class="btn btn-sm" style="color:red; margin-top:5px; background:none; border:none; cursor:pointer;" onclick="deleteItem('shops', '${s.id}')">Supprimer</button>
            </div>
        </div>
    `).join('');
}

function renderUsers() {
    const div = document.getElementById('admin-users');
    if(!div) return;
    div.innerHTML = Store.users.map(u => `
        <div class="admin-card" style="padding:15px; margin-bottom:10px;">
            <strong>${u.name || 'Utilisateur'}</strong> <span style="font-size:12px; background:#eee; padding:2px 5px;">${u.role}</span><br>
            <span class="text-muted">${u.email}</span>
        </div>
    `).join('');
}

function renderPromos() {
    const div = document.getElementById('admin-promos');
    if(!div) return;
    div.innerHTML = Store.promos.map(p => `
        <div class="admin-card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between;">
            <strong>${p.code}</strong>
            <span>-${p.percent}%</span>
            <button onclick="deleteItem('promos', '${p.id}')" style="color:red; background:none; border:none; cursor:pointer;">X</button>
        </div>
    `).join('');
}

function renderCategories() {
    const div = document.getElementById('categories-management');
    if(!div) return;
    div.innerHTML = Store.categories.map(c => `
        <div class="admin-card" style="text-align:center; padding:15px;">
            <i data-lucide="${c.icon}" style="color:var(--gold); width:24px; height:24px;"></i>
            <div style="margin-top:5px; font-weight:600;">${c.name}</div>
        </div>
    `).join('');
}

function populateCategorySelect() {
    const select = document.getElementById('shop-category-select');
    if(!select) return;
    select.innerHTML = '<option value="">Choisir catégorie</option>';
    Store.categories.forEach(c => select.innerHTML += `<option value="${c.name}">${c.name}</option>`);
}

// 5. GESTION DES FORMULAIRES (Envoi vers Firestore)

function setupForms() {
    // Créer Vendeur (Auth + DB)
    const sellerForm = document.getElementById('create-seller-form');
    if(sellerForm) {
        sellerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = sellerForm.querySelector('button');
            const data = new FormData(sellerForm);
            
            btn.innerText = "Création...";
            btn.disabled = true;

            // Création compte Auth + sauvegarde DB
            Auth.createSeller(data.get('email'), data.get('password'), data.get('name')).then(res => {
                if(res.success) {
                    db.collection('users').add({
                        name: data.get('name'),
                        email: data.get('email'),
                        phone: data.get('phone'),
                        role: 'seller',
                        createdAt: new Date()
                    });
                    alert("✅ Compte Vendeur créé !");
                    sellerForm.reset();
                } else {
                    alert("Erreur: " + res.message);
                }
                btn.innerText = "Créer le compte";
                btn.disabled = false;
            });
        });
    }

    // Créer Boutique
    const shopForm = document.getElementById('shop-form');
    if(shopForm) {
        shopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(shopForm);
            
            db.collection('shops').add({
                name: data.get('name'),
                ownerEmail: data.get('ownerEmail'),
                category: data.get('categoryId'),
                status: 'active',
                createdAt: new Date()
            }).then(() => {
                alert("✅ Boutique ajoutée !");
                shopForm.reset();
            });
        });
    }

    // Créer Promo
    const promoForm = document.getElementById('promo-form');
    if(promoForm) {
        promoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(promoForm);
            
            db.collection('promos').add({
                code: data.get('code').toUpperCase(),
                percent: data.get('percent'),
                createdAt: new Date()
            }).then(() => {
                alert("Promo ajoutée !");
                promoForm.reset();
            });
        });
    }
}

// GLOBAL DELETE
window.deleteItem = function(collection, id) {
    if(confirm("Confirmer la suppression ?")) {
        db.collection(collection).doc(id).delete();
    }
};
