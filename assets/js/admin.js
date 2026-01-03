/* =========================================================
   DASHBOARD ADMIN - AFFICHAGE FORCÉ & DONNÉES FICTIVES
   ========================================================= */

// 1. STORE (Données mémoire)
const Store = {
    users: JSON.parse(localStorage.getItem('ac_users') || '[]'),
    shops: JSON.parse(localStorage.getItem('ac_shops') || '[]'),
    promos: JSON.parse(localStorage.getItem('ac_promos') || '[]'),
};

// 2. DONNÉES PAR DÉFAUT (Pour que ça ne soit pas vide)
function initMockData() {
    if (Store.shops.length === 0) {
        Store.shops = [
            { id: '1', name: 'Luxe Motors', category: 'Auto', owner: 'vente.lll@gmail.com', status: 'active' },
            { id: '2', name: 'Mode Faso', category: 'Mode', owner: 'client.add@gmail.com', status: 'active' }
        ];
    }
    if (Store.users.length === 0) {
        Store.users = [
            { name: "Admin", email: "admin@aurum.com", role: "superadmin" },
            { name: "Vendeur 1", email: "vendeur@test.com", role: "seller" }
        ];
    }
}

// 3. LANCEMENT IMMÉDIAT (Sans attendre Firebase)
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Admin Dashboard : Démarrage forcé");
    
    // Initialise les données
    initMockData();
    
    // Configure la navigation
    setupNavigation();
    
    // Affiche le contenu
    renderShops();
    renderUsers();
    renderPromos();
    
    // Cache le loader si présent
    const guard = document.getElementById('admin-guard');
    if(guard) guard.style.display = 'none';
    
    // Affiche le dashboard
    const dash = document.getElementById('admin-dashboard');
    if(dash) dash.style.display = 'block';
    
    // Icônes
    if(typeof lucide !== 'undefined') lucide.createIcons();
});

// --- NAVIGATION (Réparée) ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav-item');
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
            if(!targetId) return;

            // Gestion active liens
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Gestion affichage sections
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none'; // Force hide
            });

            const targetSection = document.getElementById('section-' + targetId);
            if(targetSection) {
                targetSection.style.display = 'block'; // Force show
                targetSection.classList.add('active');
            }
            
            // Fermer menu sur mobile
            if(window.innerWidth < 968 && sidebar) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });
}

// --- AFFICHAGE ---
function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;
    
    if(Store.shops.length === 0) {
        container.innerHTML = '<p>Aucune boutique.</p>';
        return;
    }

    container.innerHTML = Store.shops.map(shop => `
        <div style="padding:15px; border:1px solid #eee; margin-bottom:10px; border-radius:8px; background:#fff; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${shop.name}</strong> <br>
                <small>${shop.category} - ${shop.owner}</small>
            </div>
            <button class="btn btn-sm" style="background:#ffdddd; color:red; border:none; padding:5px 10px; cursor:pointer;" onclick="deleteItem('shops', '${shop.id}')">X</button>
        </div>
    `).join('');
}

function renderUsers() {
    const container = document.getElementById('admin-users');
    if(!container) return;
    
    container.innerHTML = Store.users.map(u => `
        <div style="padding:10px; border-bottom:1px solid #eee;">
            <strong>${u.name}</strong> (${u.role}) <br> ${u.email}
        </div>
    `).join('');
}

function renderPromos() {
    const container = document.getElementById('admin-promos');
    if(!container) return;
    container.innerHTML = '<p class="text-muted">Aucune promo active (Test).</p>';
}

// --- ACTIONS FORMULAIRES ---
// Créer Vendeur (Simulé + Firebase)
const sellerForm = document.getElementById('create-seller-form');
if(sellerForm) {
    sellerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = sellerForm.name.value;
        const email = sellerForm.email.value;
        
        // Ajout local pour affichage immédiat
        Store.users.push({ name, email, role: 'seller' });
        localStorage.setItem('ac_users', JSON.stringify(Store.users));
        
        alert("Vendeur créé (Simulation) !");
        renderUsers();
        sellerForm.reset();
    });
}

// Créer Boutique
const shopForm = document.getElementById('shop-form');
if(shopForm) {
    shopForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = shopForm.name.value;
        const owner = shopForm.ownerEmail.value;
        const cat = document.getElementById('shop-category-select').value;
        
        Store.shops.push({ id: Date.now().toString(), name, owner, category: cat, status: 'active' });
        localStorage.setItem('ac_shops', JSON.stringify(Store.shops));
        
        alert("Boutique créée !");
        renderShops();
        shopForm.reset();
    });
}

// Delete
window.deleteItem = function(type, id) {
    if(confirm("Supprimer ?")) {
        Store[type] = Store[type].filter(item => item.id !== id);
        localStorage.setItem('ac_' + type, JSON.stringify(Store[type]));
        if(type === 'shops') renderShops();
    }
};
