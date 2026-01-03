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
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- Navigation ---
function setupNavigation() {
    // On sélectionne tous les liens du menu
    const navLinks = document.querySelectorAll('.admin-nav-item, .admin-nav-link'); 
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    if(mobileToggle) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Si c'est le lien "Quitter", on laisse faire (ne pas empêcher la redirection)
            if (link.getAttribute('href') === 'index.html' || link.classList.contains('logout-link')) return;

            e.preventDefault();
            const targetId = link.dataset.section;
            
            if(!targetId) return; // Sécurité

            // Masquer toutes les sections
            sections.forEach(s => { 
                s.classList.remove('active'); 
                s.style.display = 'none'; 
            });
            
            // Désactiver tous les liens
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Afficher la section demandée
            const targetSection = document.getElementById('section-' + targetId);
            if(targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');
            }
            
            link.classList.add('active');
            
            if(window.innerWidth < 900 && sidebar) sidebar.classList.remove('mobile-open');
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
        <div class="shop-card" style="padding:15px; border:1px solid #eee; margin-bottom:10px; border-radius:8px; background:white;">
            <div class="shop-card-header" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span class="shop-category-badge" style="background:#f0f0f0; padding:2px 8px; border-radius:10px; font-size:12px;">
                    <i data-lucide="store" class="cat-icon" style="width:12px;"></i> ${shop.category || 'Général'}
                </span>
                <span class="shop-status status-active" style="color:green; font-weight:bold; font-size:12px;">Active</span>
            </div>
            <h4 class="shop-name" style="margin:0; font-size:16px;">${shop.name}</h4>
            <div class="shop-meta" style="font-size:13px; color:#666; margin:5px 0;">
                <span><i data-lucide="mail" style="width:12px;"></i> ${shop.ownerEmail}</span>
            </div>
            <div class="shop-actions" style="margin-top:10px;">
                <button class="btn btn-sm btn-danger" style="background:#ffdddd; color:red; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;" onclick="deleteShop('${shop.id}')">Supprimer</button>
            </div>
        </div>
    `).join('');
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderUsers() {
    const div = document.getElementById('admin-users');
    if(!div) return;
    
    if(currentUsers.length === 0) {
        div.innerHTML = '<p>Aucun utilisateur enregistré via l\'admin.</p>';
        return;
    }

    div.innerHTML = currentUsers.map(u => `
        <div style="background:#fff; padding:16px; border-bottom:1px solid #eee; margin-bottom:5px;">
            <strong>${u.name || 'Utilisateur'}</strong> <br> 
            <small>${u.email}</small> <span class="badge" style="background:#eee; padding:2px 5px; border-radius:4px;">${u.role}</span>
        </div>
    `).join('');
}

function renderStats() {
    const statsDiv = document.getElementById('admin-stats');
    if(statsDiv) {
        statsDiv.innerHTML = `
            <div class="admin-stat-card" style="background:white; padding:20px; border-radius:12px; border-left:4px solid #D4AF37; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <div class="admin-stat-label" style="text-transform:uppercase; font-size:11px; color:#666;">Boutiques Actives</div>
                <div class="admin-stat-value" style="font-size:24px; font-weight:bold;">${currentShops.length}</div>
            </div>
            <div class="admin-stat-card" style="background:white; padding:20px; border-radius:12px; border-left:4px solid #D4AF37; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <div class="admin-stat-label" style="text-transform:uppercase; font-size:11px; color:#666;">Utilisateurs</div>
                <div class="admin-stat-value" style="font-size:24px; font-weight:bold;">${currentUsers.length}</div>
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
            // Sécurité si le select est vide ou mal chargé
            const select = shopForm.querySelector('select[name="categoryId"]');
            const cat = select ? select.value : 'Général';

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
    
    // Remplir le select catégorie (Simple)
    const catSelect = document.getElementById('shop-category-select');
    if(catSelect) {
        const cats = ['Mode', 'Électronique', 'Maison', 'Beauté', 'Auto'];
        catSelect.innerHTML = '<option value="">Choisir...</option>';
        cats.forEach(c => {
            catSelect.innerHTML += `<option value="${c}">${c}</option>`;
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
