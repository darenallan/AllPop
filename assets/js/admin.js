/* =========================================================
   DASHBOARD ADMIN - NAVIGATION DIRECTE
   ========================================================= */

// 1. STORE (Données mémoire)
const Store = {
    users: JSON.parse(localStorage.getItem('ac_users') || '[]'),
    shops: JSON.parse(localStorage.getItem('ac_shops') || '[]'),
    promos: JSON.parse(localStorage.getItem('ac_promos') || '[]'),
};

// 2. DONNÉES PAR DÉFAUT (Pour éviter le vide)
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

// 3. LANCEMENT
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Admin chargé");
    initMockData();
    setupNavigation();
    renderShops();
    renderUsers();
    renderPromos();
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
});

// --- NAVIGATION (Le point critique) ---
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
            // Ignorer si c'est le lien Quitter
            if(link.getAttribute('href').includes('index.html')) return;

            e.preventDefault();
            const targetId = link.dataset.section;
            if(!targetId) return;

            console.log("Clic sur :", targetId);

            // 1. Reset
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.style.display = 'none'; // Force hide
            });

            // 2. Activate
            link.classList.add('active');
            const targetSection = document.getElementById('section-' + targetId);
            if(targetSection) {
                targetSection.style.display = 'block'; // Force show
                setTimeout(() => targetSection.classList.add('active'), 10);
            } else {
                console.error("Section introuvable : section-" + targetId);
            }
            
            // Mobile close
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
    container.innerHTML = '<p class="text-muted">Aucune promo active.</p>';
}

// --- ACTIONS ---
const sellerForm = document.getElementById('create-seller-form');
if(sellerForm) {
    sellerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulation sauvegarde
        alert("Vendeur créé (Simulation) !");
        sellerForm.reset();
    });
}

const shopForm = document.getElementById('shop-form');
if(shopForm) {
    shopForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = shopForm.name.value;
        Store.shops.push({ id: Date.now(), name: name, category: 'Nouveau', owner: 'Moi', status: 'active' });
        renderShops();
        alert("Boutique créée !");
        shopForm.reset();
    });
}

window.deleteItem = function(type, id) {
    if(confirm("Supprimer ?")) {
        Store[type] = Store[type].filter(item => item.id != id);
        if(type === 'shops') renderShops();
    }
};
