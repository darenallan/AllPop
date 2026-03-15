# 📄 Reference Rapide - Spécifications Techniques

Tous les extraits de code pour imprimer ou garder à portée de main.

---

## 1️⃣ INITIALISATION (Au chargement page)

```javascript
// Auto-called au DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initSpecifications();
    }, 500);
});
```

---

## 2️⃣ AJOUTER UNE LIGNE

```javascript
window.addSpecRow = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
        <input type="text" class="spec-key input" placeholder="Ex: Marque, Couleur, RAM...">
        <input type="text" class="spec-value input" placeholder="Ex: Apple, Noir, 8 Go...">
        <button type="button" class="remove-spec" onclick="this.parentElement.remove(); if(typeof lucide !== 'undefined') lucide.createIcons();">
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    container.appendChild(row);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};
```

---

## 3️⃣ RÉCUPÉRER LES SPÉCIFICATIONS

```javascript
window.getSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return {};

    const specs = {};
    const rows = container.querySelectorAll('.spec-row');

    rows.forEach(row => {
        const keyInput = row.querySelector('.spec-key');
        const valueInput = row.querySelector('.spec-value');

        if (keyInput && valueInput) {
            const key = keyInput.value.trim();
            const value = valueInput.value.trim();

            if (key && value) {
                specs[key] = value;
            }
        }
    });

    return specs;
};
```

**Résultat type**:
```javascript
{
    "Marque": "Apple",
    "RAM": "8 Go",
    "Stockage": "256 GB",
    "Couleur": "Noir"
}
```

---

## 4️⃣ INITIALISATION

```javascript
window.initSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;
    window.addSpecRow();  // Ajoute 1 ligne vide par défaut
};
```

---

## 5️⃣ SAUVEGARDE FIRESTORE

```javascript
window.db.collection('products').add({
    shopId: currentShop.id,
    shopName: currentShop.name,
    name: name,
    price: Number(price),
    description: desc,
    image: productImages[0] || img || 'assets/img/placeholder.png',
    images: productImages.length ? productImages.slice(0, 5) : undefined,
    sku: sku,
    stock: stock,
    minStock: minStock,
    category: category,
    specifications: window.getSpecifications(),  // ← NOUVEAU
    createdAt: new Date()
}).then(() => {
    window.showToast("✅ Produit ajouté avec succès !", 'success');
    e.target.reset();
    productImages = [];
    renderProductGallery();
    btn.innerText = "Mettre en ligne";
    btn.disabled = false;
}).catch(err => {
    console.error(err);
    window.showToast("Erreur: " + err.message, 'danger');
    btn.disabled = false;
});
```

---

## 6️⃣ AFFICHAGE CLIENT (product.html)

```javascript
/**
 * Affiche les spécifications d'un produit
 */
function renderProductSpecifications(product) {
    const specsContainer = document.getElementById('specs-list');
    if (!specsContainer) return;

    const specs = product.specifications || {};
    
    if (Object.keys(specs).length === 0) {
        const section = document.getElementById('product-specs');
        if (section) section.style.display = 'none';
        return;
    }

    specsContainer.innerHTML = Object.entries(specs).map(([key, value]) => `
        <div style="
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.2s;
        "
        onmouseover="this.style.background='#f0f1f3'; this.style.borderColor='#dee2e6';"
        onmouseout="this.style.background='#f8f9fa'; this.style.borderColor='#e9ecef';">
            <div style="font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                ${escapeHtml(key)}
            </div>
            <div style="font-size: 15px; color: #333; font-weight: 500;">
                ${escapeHtml(value)}
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## 7️⃣ CSS STYLES

```css
/* Spécifications Techniques */
.spec-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s;
}

.spec-row:hover {
  background: #f0f1f3;
  border-color: #dee2e6;
}

.spec-row .input {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  transition: border-color 0.2s;
}

.spec-row .input::placeholder {
  color: #999;
}

.spec-row .input:focus {
  outline: none;
  border-color: #D4AF37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.spec-row .input.spec-key {
  flex: 0 0 35%;
}

.spec-row .input.spec-value {
  flex: 1;
}

.remove-spec {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  padding: 0;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0;
  transition: all 0.2s;
}

.remove-spec:hover {
  background: #fecaca;
  border-color: #fca5a5;
  transform: scale(1.05);
}

.remove-spec i {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.btn-secondary:active {
  transform: scale(0.98);
}
```

---

## 8️⃣ HTML SELLER

```html
<!-- SECTION 4: Spécifications Techniques -->
<div style="border-left: 4px solid #f97316; padding-left: 16px; margin-bottom: 24px;">
    <h3 style="margin-top: 0; color: #333;">🛠️ Caractéristiques Techniques <span style="font-weight: 400; color: #999;">(Optionnel)</span></h3>
    <p style="font-size: 13px; color: #666; margin-bottom: 16px;">Ajoutez les spécifications de votre produit (Marque, Couleur, Taille, RAM, etc.)</p>
    
    <div id="specs-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;"></div>
    
    <button type="button" class="btn-secondary" onclick="addSpecRow()" style="width: fit-content; display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        <span>+ Ajouter une caractéristique</span>
    </button>
</div>
```

---

## 9️⃣ HTML PRODUCT (Affichage)

```html
<!-- Spécifications Techniques -->
<div id="product-specs" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
    <h3 style="margin-top: 0; margin-bottom: 16px; color: #333; font-size: 18px; font-weight: 600;">
        🛠️ Spécifications Techniques
    </h3>
    <div id="specs-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <!-- Rempli par renderProductSpecifications(product) -->
    </div>
</div>
```

---

## 🔟 CONSOLE TEST

```javascript
// Vérifier que les fonctions existent
typeof window.addSpecRow              // "function"
typeof window.getSpecifications       // "function"
typeof window.initSpecifications      // "function"

// Tester ajout manuel
window.addSpecRow()                    // Ajoute une ligne
window.addSpecRow()                    // Ajoute une 2ème

// Tester recueil
window.getSpecifications()             // Retourne objet

// Tester suppression
document.querySelectorAll('.spec-row')[0].remove()

// Vérifier container
document.getElementById('specs-container')
```

---

## 🕚 EXEMPLE COMPLET: iPhone

### Données saisies
```
Marque                    → Apple
Modèle                    → iPhone 15 Pro
Capacité                  → 256 GB
Couleur                   → Titane Noir
RAM                       → 8 Go
Appareil photo principal  → 48 MP
Batterie                  → 3582 mAh
Écran                     → 6.1" AMOLED
```

### JS compile
```javascript
window.getSpecifications()
// Retourne:
{
    "Marque": "Apple",
    "Modèle": "iPhone 15 Pro",
    "Capacité": "256 GB",
    "Couleur": "Titane Noir",
    "RAM": "8 Go",
    "Appareil photo principal": "48 MP",
    "Batterie": "3582 mAh",
    "Écran": "6.1\" AMOLED"
}
```

### Firestore écrit
```json
{
  "id": "prod_iphone15pro_x",
  "name": "iPhone 15 Pro",
  "price": 1299,
  "specifications": {
    "Marque": "Apple",
    "Modèle": "iPhone 15 Pro",
    "Capacité": "256 GB",
    "Couleur": "Titane Noir",
    "RAM": "8 Go",
    "Appareil photo principal": "48 MP",
    "Batterie": "3582 mAh",
    "Écran": "6.1\" AMOLED"
  }
}
```

### Affichage client
8 cartes en grille:
```
┌─────────────────────┐ ┌─────────────────────┐
│ MARQUE              │ │ MODÈLE              │
│ Apple               │ │ iPhone 15 Pro       │
└─────────────────────┘ └─────────────────────┘

┌─────────────────────┐ ┌─────────────────────┐
│ CAPACITÉ            │ │ COULEUR             │
│ 256 GB              │ │ Titane Noir         │
└─────────────────────┘ └─────────────────────┘

...etc
```

---

## Commandes Utiles

### Vider toutes les specs
```javascript
document.getElementById('specs-container').innerHTML = '';
window.initSpecifications();  // Ajoute 1 nouvelle ligne vide
```

### Préremplir des données
```javascript
// Ajouter 3 lignes préremplies
const data = {
  "Marque": "Apple",
  "RAM": "8 Go",
  "Stockage": "256 GB"
};

Object.entries(data).forEach(([key, value]) => {
  window.addSpecRow();
  const rows = document.querySelectorAll('.spec-row');
  const lastRow = rows[rows.length - 1];
  lastRow.querySelector('.spec-key').value = key;
  lastRow.querySelector('.spec-value').value = value;
});
```

---

## Troubleshooting Rapide

| Problème | Commande Debug |
|----------|---|
| Fonction pas trouvée | `console.log(typeof window.addSpecRow)` |
| Container manquant | `console.log(document.getElementById('specs-container'))` |
| Données pas sauvegardées | `console.log(window.getSpecifications())` |
| Icônes manquantes | `lucide.createIcons()` |
| Ligne pas ajoutée | `document.querySelectorAll('.spec-row').length` |

---

## 📊 Structure Firestore

```
products/
├── produit_1
│   ├── name: "iPhone 15 Pro"
│   ├── price: 1299
│   ├── specifications: {
│   │   "Marque": "Apple",
│   │   "RAM": "8 Go"
│   │   ...
│   │ }
│   └── ...autres champs
│
├── produit_2
│   ├── name: "T-Shirt Mode"
│   ├── specifications: {
│   │   "Marque": "Calvin Klein",
│   │   "Taille": "M"
│   │   ...
│   │ }
│   └── ...
```

---

**Version**: Quick Reference 1.0  
**Pour imprimer**: Ctrl+P si besoin!  
**Dernière mise à jour**: Février 2026
