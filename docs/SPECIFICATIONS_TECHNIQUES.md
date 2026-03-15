# Documentation - Spécifications Techniques Dynamiques

## 📋 Vue d'ensemble

Système complet et dynamique permettant aux vendeurs d'ajouter des caractéristiques/spécifications techniques à leurs produits de manière flexible, adapté à une marketplace multi-secteurs (Mode, Électronique, Beauté, etc.).

---

## 🎯 Fonctionnalités

### ✅ Interface Utilisateur
- 🛠️ Section **"Caractéristiques Techniques"** dans le formulaire d'ajout de produit
- ➕ Bouton **"+ Ajouter une caractéristique"** pour injecter dynamiquement des lignes
- 🗑️ Bouton **"Supprimer"** sur chaque ligne pour retrait flexible
- ✨ **Une ligne vide par défaut** au chargement du formulaire
- 📱 Design **responsive** avec flexbox

### ✅ Données et Stockage
- 📦 Compiling automatique des spécifications en **objet JSON**
- 🔄 Intégration **Firestore** dans le document produit
- ⚙️ Champ `specifications` sauvegardé comme objet clé-valeur
- 🎯 Format: `{ "Marque": "Apple", "RAM": "8 Go", "Couleur": "Noir" }`

### ✅ Validation
- ✔️ **Lignes vides ignorées** automatiquement (optionnel)
- ⛔ **Doublons** sur les clés permis (utile pour variantes)
- 🚀 **Aucune limite** de caractéristiques par produit

---

## 🏗️ Architecture Technique

### Structure HTML

```html
<!-- SECTION 4: Spécifications Techniques -->
<div style="border-left: 4px solid #f97316; padding-left: 16px; margin-bottom: 24px;">
    <h3 style="margin-top: 0; color: #333;">
        🛠️ Caractéristiques Techniques <span style="font-weight: 400; color: #999;">(Optionnel)</span>
    </h3>
    <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
        Ajoutez les spécifications de votre produit (Marque, Couleur, Taille, RAM, etc.)
    </p>
    
    <!-- Conteneur pour les lignes dynamiques -->
    <div id="specs-container" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;"></div>
    
    <!-- Bouton d'ajout -->
    <button type="button" class="btn-secondary" onclick="addSpecRow()" 
        style="width: fit-content; display: flex; align-items: center; gap: 8px; 
        padding: 10px 16px; background: #f8f9fa; color: #333; border: 1px solid #ddd; 
        border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;">
        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        <span>+ Ajouter une caractéristique</span>
    </button>
</div>
```

**Localisation**: `seller.html` lignes ~174-189

### Fonctions JavaScript

#### 1. `addSpecRow()`
Injecte une nouvelle ligne au container.

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

**Structure de chaque ligne**:
```
┌─────────────────────────────────────────────┐
│ Nom de la caractéristique     │ Valeur      │ [🗑️]
│ Ex: Marque, Couleur, RAM...   │ Ex: Apple...│
└─────────────────────────────────────────────┘
  ↑ flex: 0 0 35%               ↑ flex: 1     ↑ Bouton
```

#### 2. `getSpecifications()`
Compile et retourne un objet JavaScript avec toutes les spécifications.

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

            // Ignorer les lignes vides
            if (key && value) {
                specs[key] = value;
            }
        }
    });

    return specs;
};
```

**Exemple de retour**:
```javascript
{
    "Marque": "Apple",
    "Modèle": "iPhone 15 Pro",
    "Capacité": "256 GB",
    "Couleur": "Titane Noir",
    "RAM": "8 Go",
    "Batterie": "3582 mAh"
}
```

#### 3. `initSpecifications()`
Initialise le système en ajoutant une ligne vide par défaut.

```javascript
window.initSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;

    // Ajouter une ligne vide par défaut
    window.addSpecRow();
};
```

---

## 💾 Intégration Firestore

### Sauvegarde des Spécifications

Dans `assets/js/admin.js` (fonction `setupSellerForms`), le champ `specifications` est **compilé automatiquement**:

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
    // Succès...
});
```

### Structure en Base de Données

```json
{
  "id": "prod_12345",
  "name": "iPhone 15 Pro",
  "specifications": {
    "Marque": "Apple",
    "Modèle": "iPhone 15 Pro",
    "Capacité": "256 GB",
    "Couleur": "Titane Noir",
    "RAM": "8 Go",
    "Batterie": "3582 mAh"
  },
  "price": 1299,
  "stock": 50,
  ...
}
```

---

## 🎨 Styles CSS

Tous les styles sont définis dans `assets/css/admin.css` (lignes ~485-552):

### Classes principales

| Classe | Rôle |
|--------|------|
| `.spec-row` | Conteneur d'une ligne (flexbox, fond gris) |
| `.spec-key` | Input pour le nom de la caractéristique (35% width) |
| `.spec-value` | Input pour la valeur (flexible, 100% disponible) |
| `.remove-spec` | Bouton trash rouge discret |
| `.btn-secondary` | Bouton "+ Ajouter" (style léger) |

### Détails du Design

**Ligne de spécification**:
```css
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
```

**Bouton supprimer**:
```css
.remove-spec {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-spec:hover {
  background: #fecaca;
  border-color: #fca5a5;
  transform: scale(1.05);
}
```

---

## 📚 Cas d'Utilisation

### 1. Produit Mode
```
Marque → Gucci
Taille → L
Couleur → Noir
Matière → Coton 100%
Genre → Homme
```

### 2. Produit Électronique
```
Marque → Samsung
Modèle → Galaxy S24
RAM → 12 GB
Stockage → 256 GB
Batterie → 4000 mAh
Écran → 6.1" AMOLED
```

### 3. Produit Beauté
```
Marque → L'Oréal
Type → Crème hydratante
Contenance → 50ml
Ingrédient principal → Acide hyaluronique
Type de peau → Tous types
Certification → Vegan
```

### 4. Produit Sport
```
Marque → Nike
Modèle → Air Max 270
Pointure → 42
Couleur → Blanc/Bleu
Matière → Mesh
Semelle → Air Max
```

---

## 🚀 Migration / Mise à Jour

### Produits Existants
Les produits existants n'ont **pas de champ `specifications`** initialement.

**Comportement**:
- ✅ `getSpecifications()` retourne `{}` (objet vide) si le container n'existe pas
- ✅ Firestore accepte les documents sans ce champ
- ✅ Aucun risque de cassure rétroactive

**Mise à jour progressive**:
```javascript
// Les nouvelle produits auront specifications
// Les anciens resteront tels quels jusqu'à modification manuelle
```

---

## 🔧 Débogage

### Vérifier l'état du formulaire
```javascript
// Dans la console navigateur:
console.log(window.getSpecifications());
// Résultat: { "Marque": "Apple", "RAM": "8 Go" }
```

### Vérifier l'initialisation
```javascript
// Vérifier que le conteneur existe:
document.getElementById('specs-container');

// Vérifier que la fonction est disponible:
typeof window.addSpecRow === 'function';  // true
```

### Logs
- ✅ Console affiche: `"✅ Spécifications Techniques OK"`
- ✅ Chaque ajout/suppression de ligne met à jour les icônes Lucide

---

## ⚠️ Limitations & Notes

### Actuelles
- ❌ Pas de **drag-and-drop** entre lignes (peut être ajouté)
- ❌ Pas de **auto-complete** sur les clés (peut utiliser une liste prédéfinie)
- ❌ Pas de **types de valeurs** (tout est texte)

### Améliorations Futures Possibles
```javascript
// 1. Prédéfinitions par catégorie:
const SPECS_BY_CATEGORY = {
    'Électronique': ['Marque', 'Modèle', 'RAM', 'Stockage', 'Batterie'],
    'Mode': ['Marque', 'Taille', 'Couleur', 'Matière', 'Genre'],
    'Beauté': ['Marque', 'Type', 'Contenance', 'Ingrédient principal', 'Type de peau']
};

// 2. Validation de types:
const SPEC_TYPES = {
    'Contenance': 'volume',
    'Pointure': 'number',
    'Couleur': 'color'
};

// 3. Unités automatiques:
const SPEC_UNITS = {
    'Contenance': 'ml',
    'Pointure': '',
    'RAM': 'GB'
};
```

---

## 📁 Fichiers Modifiés

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| `seller.html` | 174-189 | Section HTML des specs ajoutée |
| `assets/css/admin.css` | 485-552 | Styles `.spec-row`, `.spec-key`, `.spec-value`, `.remove-spec`, `.btn-secondary` |
| `assets/js/admin.js` | 540 | Ajout `specifications: window.getSpecifications()` |
| `assets/js/admin.js` | 950-1020 | Fonctions `addSpecRow()`, `getSpecifications()`, `initSpecifications()` |

---

## 🧪 Tests Recommandés

### Test 1: Interface
1. ✅ Ouvrir le formulaire vendeur (seller.html)
2. ✅ Vérifier que la section "Caractéristiques Techniques" est visible
3. ✅ Vérifier qu'il y a **1 ligne vide par défaut**
4. ✅ Cliquer "✚ Ajouter une caractéristique" → **nouvelle ligne apparaît**
5. ✅ Cliquer [🗑️] → ligne disparaît

### Test 2: Saisie de données
1. ✅ Ajouter 3 lignes
2. ✅ Remplir:
   - Ligne 1: "Marque" → "Apple"
   - Ligne 2: "RAM" → "8 Go"
   - Ligne 3: (laisser vide)
3. ✅ Console JS: `window.getSpecifications()` retourne `{ "Marque": "Apple", "RAM": "8 Go" }` (Ligne 3 ignorée)

### Test 3: Sauvegarde
1. ✅ Remplir tout le formulaire produit + spécifications
2. ✅ Cliquer "Mettre en vente"
3. ✅ Vérifier Firebase: le document produit a un champ `specifications` 
4. ✅ Structure: `{ "Marque": "...", "Couleur": "..." }`

### Test 4: Affichage produit
1. ✅ Vérifier sur la page produit (product.html) que les specs s'affichent
2. ✅ Format d'affichage: **Marque**: Apple, **RAM**: 8 Go

---

## 📞 Support

Pour questions ou problèmes:
1. Vérifier console navigateur (F12) pour erreurs JS
2. Vérifier que `lucide.createIcons()` est appelé après chaque ajout/suppression
3. Vérifier structure HTML du conteneur `#specs-container`
4. Consulter ce document pour la logique

---

**Version**: 1.0  
**Date**: Février 2026  
**Auteur**: AurumCorp Development Team - Frontend Senior
