/* =========================================================
   ESPACE VENDEUR - LOGIQUE CONNECTÉE FIREBASE
   ========================================================= */

const db = firebase.firestore();
const auth = firebase.auth();

// Variables globales
let currentShop = null; // Stockera les infos de TA boutique
let currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. VÉRIFICATION CONNEXION
    auth.onAuthStateChanged((user) => {
        const loader = document.getElementById('loader');
        const content = document.getElementById('seller-content');
        const warning = document.getElementById('no-shop-warning');

        if (user) {
            console.log("👤 Vendeur connecté :", user.email);
            
            // 2. CHERCHER LA BOUTIQUE ASSOCIÉE À CET EMAIL
            db.collection('shops').where('ownerEmail', '==', user.email).get()
            .then((querySnapshot) => {
                loader.style.display = 'none';

                if (!querySnapshot.empty) {
                    // BOUTIQUE TROUVÉE !
                    const doc = querySnapshot.docs[0];
                    currentShop = { id: doc.id, ...doc.data() };
                    
                    console.log("🏪 Boutique chargée :", currentShop.name);
                    
                    // Afficher le dashboard
                    content.classList.remove('hidden');
                    content.style.display = 'block';
                    
                    // Remplir les infos
                    initDashboard();
                } else {
                    // PAS DE BOUTIQUE POUR CET EMAIL
                    warning.classList.remove('hidden');
                    warning.style.display = 'block';
                    document.getElementById('user-email-display').innerText = user.email;
                }
            })
            .catch((error) => {
                console.error("Erreur chargement boutique:", error);
                alert("Erreur de connexion base de données.");
            });

        } else {
            // Pas connecté -> Login
            window.location.href = "login.html";
        }
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
});

// --- INITIALISATION DU DASHBOARD ---
function initDashboard() {
    // 1. Mettre à jour les titres
    document.getElementById('shop-name-title').innerText = currentShop.name;
    document.getElementById('set-shop-name').value = currentShop.name;
    document.getElementById('set-shop-desc').value = currentShop.description || '';

    // 2. Charger les produits de CETTE boutique uniquement
    listenToProducts();
    
    // 3. Activer la navigation
    setupNavigation();
    
    // 4. Activer les formulaires
    setupForms();
}

// --- GESTION DES PRODUITS ---
function listenToProducts() {
    // Écoute temps réel des produits liés à l'ID de la boutique
    db.collection('products').where('shopId', '==', currentShop.id)
    .onSnapshot((snapshot) => {
        currentProducts = [];
        const list = document.getElementById('products-list');
        list.textContent = ""; // Clear safely
        
        snapshot.forEach((doc) => {
            currentProducts.push({ id: doc.id, ...doc.data() });
        });

        // Mise à jour stats
        document.getElementById('stat-products').textContent = currentProducts.length;

        // Affichage liste
        if (currentProducts.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-muted';
            emptyMsg.textContent = 'Aucun produit en ligne. Ajoutez-en un !';
            list.appendChild(emptyMsg);
        } else {
            currentProducts.forEach(prod => {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;';
                
                const leftDiv = document.createElement('div');
                leftDiv.style.cssText = 'display:flex; gap:15px; align-items:center;';
                
                const imgContainer = document.createElement('div');
                imgContainer.style.cssText = 'width:50px; height:50px; background:#eee; border-radius:8px; overflow:hidden;';
                const img = document.createElement('img');
                img.src = prod.image || 'assets/img/placeholder.png';
                img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                imgContainer.appendChild(img);
                
                const infoDiv = document.createElement('div');
                const nameStrong = document.createElement('strong');
                nameStrong.textContent = prod.name;
                infoDiv.appendChild(nameStrong);
                infoDiv.appendChild(document.createElement('br'));
                const priceSpan = document.createElement('span');
                priceSpan.style.cssText = 'color:#D4AF37; font-weight:bold;';
                priceSpan.textContent = `${prod.price} FCFA`;
                infoDiv.appendChild(priceSpan);
                
                leftDiv.appendChild(imgContainer);
                leftDiv.appendChild(infoDiv);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm';
                deleteBtn.style.cssText = 'color:red; background:none; border:none; cursor:pointer;';
                deleteBtn.onclick = () => deleteProduct(prod.id);
                deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
                
                listItem.appendChild(leftDiv);
                listItem.appendChild(deleteBtn);
                list.appendChild(listItem);
            });
            lucide.createIcons();
        }
    });
}

// --- FORMULAIRES ---
function setupForms() {
    
    // AJOUTER UN PRODUIT
    document.getElementById('form-add-product').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const desc = document.getElementById('prod-desc').value;
        const img = document.getElementById('prod-img').value;
        
        const btn = e.target.querySelector('button');
        btn.innerText = "Ajout en cours...";
        btn.disabled = true;

        // Envoi vers Firestore
        db.collection('products').add({
            shopId: currentShop.id, // LIEN CRUCIAL AVEC LA BOUTIQUE
            shopName: currentShop.name,
            name: name,
            price: Number(price),
            description: desc,
            image: img,
            category: currentShop.category, // Hérite de la catégorie de la boutique
            createdAt: new Date()
        }).then(() => {
            alert("✅ Produit ajouté avec succès !");
            e.target.reset();
            btn.innerText = "Mettre en ligne";
            btn.disabled = false;
            // Redirection vers la liste
            nav('products', document.querySelectorAll('.admin-nav-item')[1]);
        }).catch(err => {
            console.error(err);
            alert("Erreur: " + err.message);
            btn.disabled = false;
        });
    });

    // PARAMÈTRES BOUTIQUE
    document.getElementById('form-settings').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('set-shop-name').value;
        const newDesc = document.getElementById('set-shop-desc').value;

        db.collection('shops').doc(currentShop.id).update({
            name: newName,
            description: newDesc
        }).then(() => {
            alert("Paramètres mis à jour !");
            document.getElementById('shop-name-title').innerText = newName;
        });
    });
}

// --- NAVIGATION ---
window.nav = function(tabId, btn) {
    // Cacher toutes les sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active')); // CSS fix
    
    // Afficher la cible
    const target = document.getElementById('sec-' + tabId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        target.style.display = 'block'; // Force display
    }

    // Gestion boutons menu
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Fermer mobile
    if(window.innerWidth < 900) {
        document.getElementById('seller-sidebar').classList.remove('mobile-open');
    }
};

// --- SUPPRESSION ---
window.deleteProduct = function(id) {
    if(confirm("Supprimer ce produit ?")) {
        db.collection('products').doc(id).delete();
    }
};
