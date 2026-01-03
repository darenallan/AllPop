/* =========================================================
   DASHBOARD ADMIN - VERSION PRODUCTION (DATABASE EN LIGNE)
   ========================================================= */

// Configuration Firestore (Base de données)
const db = firebase.firestore();

// Variables globales
let currentShops = [];
let currentUsers = [];

// 1. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
    // Vérification Admin
    firebase.auth().onAuthStateChanged((user) => {
        const guard = document.getElementById('admin-guard');
        const dash = document.getElementById('admin-dashboard');
        
        // Liste des admins (Ajoute les emails qui ont le droit d'accéder)
        const allowedAdmins = ["aurumcorporate.d@gmail.com", "admin@aurum.com"];

        if (user && allowedAdmins.includes(user.email)) {
            // Afficher le dashboard
            if(guard) guard.style.display = 'none';
            if(dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
            }
            
            console.log("✅ Connecté à la Base de Données en tant que :", user.email);
            initRealDashboard(); // On lance la vraie machine
        } else {
            window.location.href = "login.html";
        }
    });
});

function initRealDashboard() {
    setupNavigation();
    
    // On écoute la base de données EN TEMPS RÉEL
    // Dès qu'une donnée change chez Google, elle change sur ton écran
    listenToShops();
    listenToUsers();
    
    setupForms();
    lucide.createIcons();
}

// --- Navigation ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    if(mobileToggle) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;
            sections.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
            navLinks.forEach(l => l.classList.remove('active'));
            
            document.getElementById('section-' + targetId).style.display = 'block';
            document.getElementById('section-' + targetId).classList.add('active');
            link.classList.add('active');
            
            if(window.innerWidth < 900) sidebar.classList.remove('mobile-open');
        });
    });
}

// --- ÉCOUTEURS DE DONNÉES (Le coeur du système) ---

function listenToShops() {
    // On demande à Firebase : "Donne-moi la collection 'shops'"
    db.collection("shops").onSnapshot((snapshot) => {
        currentShops = [];
        snapshot.forEach((doc) => {
            currentShops.push({ id: doc.id, ...doc.data() });
        });
        // Quand on reçoit les données, on met à jour l'écran
        renderShops();
        renderStats();
    });
}

function listenToUsers() {
    db.collection("users").onSnapshot((snapshot) => {
        currentUsers = [];
        snapshot.forEach((doc) => {
            currentUsers.push({ id: doc.id, ...doc.data() });
        });
        renderUsers();
        renderStats();
    });
}

// --- AFFICHAGE ---

function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;

    if (currentShops.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune boutique en ligne. Créez-en une !</p>';
        return;
    }

    container.innerHTML = currentShops.map(shop => `
        <div class="shop-card">
            <div class="shop-card-header">
                <span class="shop-category-badge">
                    <i data-lucide="store" class="cat-icon"></i> ${shop.category || 'Général'}
                </span>
                <span class="shop-status status-active">Active</span>
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
    const div = document.getElementById('admin-users');
    if(!div) return;
    
    div.innerHTML = currentUsers.map(u => `
        <div style="background:#fff; padding:16px; border-bottom:1px solid #eee; margin-bottom:5px;">
            <strong>${u.name || 'Utilisateur'}</strong> <br> 
            <small>${u.email}</small> <span class="badge">${u.role}</span>
        </div>
    `).join('');
}

function renderStats() {
    const statsDiv = document.getElementById('admin-stats');
    if(statsDiv) {
        statsDiv.innerHTML = `
            <div class="admin-stat-card">
                <div class="admin-stat-label">Boutiques Actives</div>
                <div class="admin-stat-value">${currentShops.length}</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-label">Utilisateurs</div>
                <div class="admin-stat-value">${currentUsers.length}</div>
            </div>
        `;
    }
}

// --- ACTIONS (Sauvegarde en ligne) ---

function setupForms() {
    // 1. CRÉER VENDEUR (Création réelle de compte + Donnée)
    const createSellerForm = document.getElementById('create-seller-form');
    if(createSellerForm) {
        createSellerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = createSellerForm.email.value;
            const password = createSellerForm.password.value;
            const name = createSellerForm.name.value;
            const btn = createSellerForm.querySelector('button');

            btn.innerText = "Traitement...";
            btn.disabled = true;

            // On utilise la fonction spéciale auth-firebase.js
            if(Auth.createSeller) {
                Auth.createSeller(email, password, name).then(res => {
                    if(res.success) {
                        // En plus de l'auth, on sauvegarde l'info dans la base de données "users"
                        db.collection("users").add({
                            name: name,
                            email: email,
                            role: 'seller',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        alert("✅ Vendeur créé et enregistré !");
                        createSellerForm.reset();
                    } else {
                        alert("Erreur : " + res.message);
                    }
                    btn.innerText = "Créer le compte vendeur";
                    btn.disabled = false;
                });
            }
        });
    }

    // 2. CRÉER BOUTIQUE (Sauvegarde dans Firestore)
    const shopForm = document.getElementById('shop-form');
    if(shopForm) {
        shopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = shopForm.name.value;
            const owner = shopForm.ownerEmail.value;
            const cat = shopForm.categoryId.value; // Assure-toi que le select a des options

            db.collection("shops").add({
                name: name,
                ownerEmail: owner,
                category: cat || 'Non classé',
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("✅ Boutique mise en ligne !");
                shopForm.reset();
            }).catch((err) => {
                alert("Erreur : " + err.message);
            });
        });
    }
}

// Suppression réelle
window.deleteShop = function(id) {
    if(confirm("Voulez-vous vraiment supprimer cette boutique définitivement ?")) {
        db.collection("shops").doc(id).delete().then(() => {
            alert("Boutique supprimée.");
        });
    }
};
