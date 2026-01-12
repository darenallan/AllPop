/* =========================================================
   ESPACE ADMIN - GESTION GLOBALE AURUM (OPTIMISÉ)
   ========================================================= */

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
    authDomain: "aurum-bf.firebaseapp.com",
    projectId: "aurum-bf",
    storageBucket: "aurum-bf.firebasestorage.app",
    messagingSenderId: "858318726586",
    appId: "1:858318726586:web:14687fff6d4d08527a6983",
    measurementId: "G-SY7DY6WV97"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- 1. LES DONNÉES DE BASE (A injecter dans Firebase si vide) ---
const INITIAL_DATA = {
    shops: [
        { name: 'Luxe Motors', category: 'Auto & Moto', ownerEmail: 'vente.lll@gmail.com', status: 'active', itemLimit: 50, createdAt: new Date() },
        { name: 'Boutique Faso', category: 'Mode & Vêtements', ownerEmail: 'client.add@gmail.com', status: 'active', itemLimit: 100, createdAt: new Date() },
        { name: 'Electro World', category: 'Électronique', ownerEmail: 'tech@store.bf', status: 'active', itemLimit: 200, createdAt: new Date() }
    ],
    users: [
        { name: "Super Admin", email: "aurumcorporate.d@gmail.com", role: "superadmin", phone: "+226 00 00 00 00" },
        { name: "Vendeur Auto", email: "vente.lll@gmail.com", role: "seller", phone: "+226 70 00 00 01" },
        { name: "Client Test", email: "client.add@gmail.com", role: "client", phone: "+226 70 00 00 02" }
    ],
    promos: [
        { code: "AURUM10", percent: 10, expires: "2025-12-31", status: "active" },
        { code: "BIENVENUE", percent: 15, expires: "2025-06-01", status: "active" }
    ]
};

// Variables pour l'affichage
let Store = { shops: [], users: [], promos: [] };

// --- 2. DÉMARRAGE ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Force l'affichage immédiat pour éviter l'écran blanc
    const dash = document.getElementById('admin-dashboard');
    if(dash) {
        dash.classList.remove('hidden');
        dash.style.display = 'block';
    }

    // Vérification connexion
    auth.onAuthStateChanged((user) => {
        const guard = document.getElementById('admin-guard');
        
        // Liste des admins
        const admins = ["aurumcorporate.d@gmail.com", "admin@aurum.com"];

        if (user && admins.includes(user.email)) {
            if(guard) guard.style.display = 'none';
            console.log("✅ Connecté :", user.email);
            
            // Lancer la machine
            checkAndSeedDatabase(); // Vérifie et remplit si vide
            startRealTimeSync();    // Affiche les données
            setupNavigation();
            setupForms();
            
        } else {
            // Si pas connecté, on redirige
            // window.location.href = "login.html"; // Décommente pour activer la sécurité
            console.log("⚠️ Mode visiteur (Non connecté)");
            // On lance quand même l'affichage pour que tu voies le design
            startRealTimeSync();
            setupNavigation();
        }
    });
});

// --- 3. AUTO-REMPLISSAGE (SEEDING) ---
async function checkAndSeedDatabase() {
    // On vérifie si la collection 'shops' est vide
    const snapshot = await db.collection('shops').limit(1).get();
    
    if (snapshot.empty) {
        console.log("⚡ Base de données vide -> Injection des données de démo...");
        
        // Injection Boutiques
        INITIAL_DATA.shops.forEach(shop => {
            db.collection('shops').add(shop);
        });

        // Injection Users
        INITIAL_DATA.users.forEach(user => {
            db.collection('users').add(user);
        });

        // Injection Promos
        INITIAL_DATA.promos.forEach(promo => {
            db.collection('promos').add(promo);
        });
        
        alert("🎉 Base de données initialisée avec vos données de démo !");
    } else {
        console.log("👍 Base de données déjà remplie.");
    }
}

// --- 4. SYNCHRONISATION (Lecture Firebase) ---
function startRealTimeSync() {
    
    // Écoute Boutiques
    db.collection('shops').onSnapshot(snap => {
        Store.shops = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderShops();
        renderStats();
    });

    // Écoute Users
    db.collection('users').onSnapshot(snap => {
        Store.users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers();
        renderStats();
    });

    // Écoute Promos
    db.collection('promos').onSnapshot(snap => {
        Store.promos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPromos();
    });

    // Icônes
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// --- 5. NAVIGATION ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-link');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    if(mobileToggle) mobileToggle.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if(link.classList.contains('logout-link')) return;

            e.preventDefault();
            const targetId = link.dataset.section;
            if(!targetId) return;

            // Active Link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show Section
            sections.forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });

            const target = document.getElementById('section-' + targetId);
            if(target) {
                target.style.display = 'block';
                target.classList.add('active');
            }
            
            if(window.innerWidth < 900 && sidebar) sidebar.classList.remove('mobile-open');
        });
    });
}

// --- 6. AFFICHAGE (Render) ---

function renderStats() {
    const div = document.getElementById('admin-stats');
    if(!div) return;
    
    // Ces chiffres sont maintenant RÉELS (basés sur le nombre d'éléments dans Firebase)
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
        div.innerHTML = '<p class="text-muted">Chargement ou aucune boutique...</p>';
        return;
    }

    div.innerHTML = Store.shops.map(s => `
        <div class="admin-card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4 style="margin:0; font-size:16px;">${s.name}</h4>
                <div style="font-size:13px; color:#666;">${s.category} — ${s.ownerEmail}</div>
            </div>
            <div style="text-align:right;">
                <span class="status-pill online">${s.status}</span>
                <br>
                <button class="btn btn-sm" style="color:red; margin-top:5px; background:none; border:none; cursor:pointer;" onclick="deleteItem('shops', '${s.id}')">Supprimer</button>
            </div>
        </div>
    `).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderUsers() {
    const div = document.getElementById('admin-users');
    if(!div) return;
    div.innerHTML = Store.users.map(u => `
        <div class="admin-card" style="padding:15px; margin-bottom:10px;">
            <strong>${u.name}</strong> <span class="badge-gold">${u.role}</span><br>
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

// --- 7. FORMULAIRES (Ajout réel) ---
function setupForms() {
    // Créer Boutique
    const shopForm = document.getElementById('shop-form');
    if(shopForm) {
        shopForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = shopForm.name.value;
            const email = shopForm.ownerEmail.value;
            const cat = shopForm.querySelector('select[name="categoryId"]')?.value || "Général";

            db.collection('shops').add({
                name: name,
                ownerEmail: email,
                category: cat,
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
                code: data.get('code'),
                percent: data.get('percent'),
                expires: data.get('expires'),
                status: 'active'
            });
            alert("Promo créée !");
            promoForm.reset();
        });
    }
}

// --- GLOBAL DELETE ---
window.deleteItem = function(col, id) {
    if(confirm("Supprimer définitivement ?")) {
        db.collection(col).doc(id).delete();
    }
};
