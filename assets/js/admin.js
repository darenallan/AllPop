// Dashboard Admin - Logique
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. VÉRIFICATION SÉCURISÉE AVEC FIREBASE
    // On attend que Firebase dise "Oui, il est connecté"
    firebase.auth().onAuthStateChanged((user) => {
        const guard = document.getElementById('admin-guard');
        const dash = document.getElementById('admin-dashboard');

        // Liste des emails autorisés (Ajoute le tien ici)
        const admins = ["admin@aurum.com", "aurumcorporate.d@gmail.com"];

        if (user && admins.includes(user.email)) {
            // C'est un admin -> On affiche le dashboard
            if(guard) guard.style.display = 'none';
            if(dash) {
                dash.classList.remove('hidden');
                dash.style.display = 'block';
            }
            console.log("Admin connecté :", user.email);
            
            // On lance l'initialisation du reste (Navigation, stats, etc.)
            initAdminDashboard(); 
        } else {
            // Pas admin -> Dehors
            window.location.href = "login.html";
        }
    });
});

// Fonction qui contient toute la logique (lancée seulement si connecté)
function initAdminDashboard() {
    
    // === Navigation Latérale ===
    const navLinks = document.querySelectorAll('.admin-nav-link[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileToggle = document.getElementById('admin-mobile-toggle');

    // Fonction pour changer de section
    const showSection = (sectionKey) => {
        sections.forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none'; // Force hide
            if (sec.id === `section-${sectionKey}`) {
                sec.classList.add('active');
                sec.style.display = 'block'; // Force show
            }
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionKey);
        });
        
        // Mobile : fermer menu
        if(sidebar && window.innerWidth < 900) {
            sidebar.classList.remove('mobile-open');
        }
    };

    // Clics sur le menu
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.section;
            if(target) showSection(target);
        });
    });

    // Menu Mobile Burger
    if(mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Afficher Dashboard par défaut
    showSection('dashboard');

    // === Logique Stats / Data (Basée sur localStorage pour l'instant) ===
    // Tu pourras migrer ça vers Firebase Database plus tard
    renderStats();
    renderShops();
}

// --- Fonctions d'affichage (Simples) ---

function renderStats() {
    const statsDiv = document.getElementById('admin-stats');
    if(!statsDiv) return;
    
    // On récupère les données simulées ou localStorage
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const shops = JSON.parse(localStorage.getItem('shops') || '[]');
    
    statsDiv.innerHTML = `
        <div class="admin-card">
            <h3>Ventes Totales</h3>
            <p style="font-size: 24px; font-weight: bold; color: var(--gold);">0 FCFA</p>
        </div>
        <div class="admin-card">
            <h3>Boutiques Actives</h3>
            <p style="font-size: 24px; font-weight: bold;">${shops.length}</p>
        </div>
        <div class="admin-card">
            <h3>Produits en ligne</h3>
            <p style="font-size: 24px; font-weight: bold;">${products.length}</p>
        </div>
    `;
}

function renderShops() {
    const container = document.getElementById('admin-shops');
    if(!container) return;
    
    // Exemple de rendu vide si pas de boutiques
    container.innerHTML = '<p class="text-muted">Aucune boutique pour le moment.</p>';
}

// Gestion Formulaire Création Vendeur (ADMIN -> FIREBASE)
const createSellerForm = document.getElementById('create-seller-form');
if(createSellerForm) {
    createSellerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = createSellerForm.email.value;
        const pass = createSellerForm.password.value;
        const name = createSellerForm.name.value;
        
        // Ici on utilise ta fonction spéciale Auth.createSeller si elle est dispo
        // Sinon, simple alerte pour l'instant
        if(typeof Auth !== 'undefined' && Auth.createSeller) {
            Auth.createSeller(email, pass, name).then(res => {
                if(res.success) alert("Vendeur créé !");
                else alert("Erreur : " + res.message);
            });
        } else {
            alert("Fonction de création en cours d'intégration...");
        }
    });
}
