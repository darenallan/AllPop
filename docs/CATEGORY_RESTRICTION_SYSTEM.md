# 🔒 Système de Restriction des Catégories - Documentation Complète

## 📋 Vue d'ensemble

Le système de restriction des catégories de produits est conçu pour **limiter les choix disponibles** pour un vendeur en fonction de la **catégorie de sa boutique**. Cela garantit une cohérence de catalogue et prévient les abus.

### Exemple concret
```
Boutique: "Mode & Vêtements"
    ↓
Catégories produits autorisées: ["Mode"]
    ↓
Vendeur ne peut ajouter que des produits dans: Mode > Homme, Mode > Femme, Mode > Enfant
    ✗ Impossible d'ajouter: Électronique, Beauté, High-Tech, etc.

---

Boutique: "Général / Hypermarché"
    ↓
Catégories produits autorisées: [ALL - "Mode", "Électronique", "Beauté & Santé", "High-Tech & Gadgets", "Jeux, Jouets & Bébé"]
    ↓
Vendeur peut ajouter des produits dans TOUTES les catégories
```

---

## 🏗️ Architecture du Système

### 1. **Dictionnaire de Mapping** (dans `categories.js`)

```javascript
window.shopCategoryToProductCategories = {
    "Mode & Vêtements": ["Mode"],
    "Mode & Accessoires": ["Mode"],
    "Électronique": ["Électronique", "High-Tech & Gadgets"],
    "Beauté & Cosmétiques": ["Beauté & Santé"],
    "Beauté & Santé": ["Beauté & Santé"],
    "Jouets & Puériculture": ["Jeux, Jouets & Bébé"],
    "Jeux, Jouets & Bébé": ["Jeux, Jouets & Bébé"],
    "Général / Hypermarché": Object.keys(window.aurumCategories), // ALL
    "Général": Object.keys(window.aurumCategories),
    "Multimarques": Object.keys(window.aurumCategories),
    "High-Tech": ["Électronique", "High-Tech & Gadgets"],
    "High-Tech & Gadgets": ["High-Tech & Gadgets"]
};
```

**Comment ça marche:**
- Clé = Catégorie de **boutique** (Firestore `shops.category`)
- Valeur = Tableau des catégories de **produits** autorisées

### 2. **Fonction Helper** (dans `categories.js`)

```javascript
window.getAllowedProductCategories(shopCategory)
```

**Paramètres:**
- `shopCategory` (string): La catégorie de la boutique du vendeur

**Retour:**
- Array: Les catégories de produits autorisées

**Logique:**
1. Si pas de catégorie boutique → accès à **TOUTES** les catégories
2. Cherche une **correspondance exacte** dans le mapping
3. Si pas trouvée, cherche une **correspondance partielle** (ex: "Mode" dans "Mode & Vêtements")
4. Par défaut → accès à **TOUTES** les catégories (fallback sécurisé)

**Exemple:**
```javascript
// Mode de développement
let allowed = window.getAllowedProductCategories("Mode & Vêtements");
// Retour: ["Mode"]

allowed = window.getAllowedProductCategories("Électronique");
// Retour: ["Électronique", "High-Tech & Gadgets"]

allowed = window.getAllowedProductCategories("Catégorie inconnue");
// Retour: ["Mode", "Électronique", "Beauté & Santé", "High-Tech & Gadgets", "Jeux, Jouets & Bébé"]
```

### 3. **Initialisation de la Cascade en Cascade** (dans `admin.js`)

```javascript
// Dans setupSellerForms()
let allowedCategories = null;

if (currentShop && currentShop.category && typeof window.getAllowedProductCategories === 'function') {
    allowedCategories = window.getAllowedProductCategories(currentShop.category);
    console.log(`🔒 Catégorie boutique: "${currentShop.category}"`, allowedCategories);
}

window.initCategoryCascade({
    mainCategoryId: 'p-cat-main',
    subCategoryId: 'p-cat-sub',
    subSubCategoryId: 'p-cat-subsub',
    containerId: 'category-cascade-container',
    allowedCategories: allowedCategories // ← NOUVEAU PARAMÈTRE
});
```

**Nouveau paramètre:**
- `allowedCategories` (Array|null): Les catégories principales à afficher
  - Si `null` → affiche **TOUTES** les catégories
  - Si Array (ex: `["Mode", "Électronique"]`) → affiche **UNIQUEMENT** ces catégories

---

## 🔄 Flux Complet

```
┌──────────────────────────────────────────────┐
│ 1. Vendeur ouvre son espace (seller.html)    │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 2. JavaScript charge admin.js                │
│    → initSellerDashboard()                   │
│    → Récupère shop depuis Firestore          │
│    → currentShop.category = "Mode..."        │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 3. Vendeur clique "Ajouter un produit"       │
│    → setupSellerForms() s'exécute            │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 4. JavaScript appelle:                       │
│    getAllowedProductCategories(               │
│      currentShop.category                     │
│    )                                          │
│    → Retour: ["Mode"]                        │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 5. JavaScript appelle:                       │
│    initCategoryCascade({                     │
│      ...                                      │
│      allowedCategories: ["Mode"]             │
│    })                                         │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 6. Dropdown "Catégorie principale"           │
│    affiche UNIQUEMENT "Mode"                 │
│    (pas Électronique, Beauté, etc.)          │
└──────────────────────────────────────────────┘
```

---

## 📝 Exemples d'Utilisation

### Exemple 1: Vendeur Mode

```javascript
// currentShop = { id: '...', category: 'Mode & Vêtements', name: 'La Mode 2026', ... }

// Dans setupSellerForms():
let allowed = window.getAllowedProductCategories("Mode & Vêtements");
// allowed = ["Mode"]

window.initCategoryCascade({
    ...
    allowedCategories: ["Mode"]
});

// Résultat:
// - Dropdown "Catégorie principale" affiche: "Mode"
// - Sous-catégories possibles: Homme, Femme, Enfant
// - Produits possibles: T-shirts, Chemises, Robes, Bijoux, etc.
// ✗ IMPOSSIBLE: Ajouter Électronique, Beauté, Jeux, etc.
```

### Exemple 2: Vendeur Général/Hypermarché

```javascript
// currentShop = { id: '...', category: 'Général / Hypermarché', name: 'Super Marché', ... }

let allowed = window.getAllowedProductCategories("Général / Hypermarché");
// allowed = ["Mode", "Électronique", "Beauté & Santé", "High-Tech & Gadgets", "Jeux, Jouets & Bébé"]

window.initCategoryCascade({
    ...
    allowedCategories: ["Mode", "Électronique", "Beauté & Santé", "High-Tech & Gadgets", "Jeux, Jouets & Bébé"]
});

// Résultat:
// - Dropdown "Catégorie principale" affiche: Mode, Électronique, Beauté & Santé, High-Tech & Gadgets, Jeux, Jouets & Bébé
// ✅ CAN ADD: Tout type de produit!
```

### Exemple 3: Vendeur Électronique

```javascript
// currentShop = { id: '...', category: 'Électronique', name: 'Tech Store', ... }

let allowed = window.getAllowedProductCategories("Électronique");
// allowed = ["Électronique", "High-Tech & Gadgets"]

window.initCategoryCascade({
    ...
    allowedCategories: ["Électronique", "High-Tech & Gadgets"]
});

// Résultat:
// - Dropdown "Catégorie principale" affiche: Électronique, High-Tech & Gadgets
// - Sous-catégories possibles: Téléphones, Ordinateurs, Smart home, Drones, etc.
// ✗ IMPOSSIBLE: Ajouter Mode, Beauté, Jeux, etc.
```

---

## 🛠️ Comment Modifier le Mapping

### Scénario: Ajouter une nouvelle catégorie boutique

**Situation:** Vous créez une nouvelle boutique avec la catégorie `"Sports & Fitness"`

**Solution:**

1. **Ouvrir** `assets/js/categories.js`

2. **Localiser** la section `shopCategoryToProductCategories`

3. **Ajouter** la ligne:
```javascript
window.shopCategoryToProductCategories = {
    // ... lignes existantes ...
    "Sports & Fitness": ["High-Tech & Gadgets"], // Permet vente d'équipements tech sportifs
    // ... ou si on veut tout:
    "Sports & Fitness": Object.keys(window.aurumCategories)
};
```

4. **Sauvegarder** et **tester** avec une boutique dans cette catégorie

### Scénario: Restreindre une catégorie existante

**Situation:** "Électronique" ne doit vendre QUE des téléphones

**Solution (côté produit, pas recommandé - maintenir au niveau boutique):**

```javascript
"Électronique": ["Électronique"] // Retirer "High-Tech & Gadgets"
```

**Solution RECOMMANDÉE (vérification Firestore):**

Ajouter une validation côté serveur/fonction Cloud:

```javascript
// Dans setupSellerForms() - AVANT d'ajouter le produit:
const category = window.getCategorySelection(...).main;
const allowedForShop = window.getAllowedProductCategories(currentShop.category);

if (!allowedForShop.includes(category)) {
    window.showToast('❌ Category not allowed for your shop!', 'danger');
    return; // Bloquer l'ajout
}
```

---

## 🔐 Sécurité & Considérations

### ⚠️ Avertissement Important

**Cet système est une restriction UI UNIQUEMENT!**

**Problème:** Un utilisateur technique pourrait:
1. Ouvrir DevTools
2. Modifier `allowedCategories` en mémoire
3. Contourner les restrictions UI

**Solution:** Mettre en place une **validation serveur** (Cloud Functions):

```javascript
// Dans la Cloud Function qui crée le produit:
const allowedCategories = shopCategoryToProductCategories[shop.category] || [];

if (!allowedCategories.includes(productCategory)) {
    throw new Error('Invalid category for this shop');
}

// Créer le produit
```

### ✅ Bonnes pratiques

1. **Enregistrer les tentatives invalides:**
```javascript
console.warn(`🚨 Vendeur ${currentShop.id} a tenté d'accéder à catégorie non autorisée`);
```

2. **Audit logs:**
```javascript
// Sauvegarder dans Firestore:
{
    timestamp: new Date(),
    vendorId: currentShop.id,
    attemptedCategory: selectedCategory,
    allowedCategories: allowed,
    blocked: true
}
```

3. **Notifications admin:**
```javascript
// Alerter les admins des tentatives suspectes
window.db.collection('audit_logs').add({...});
```

---

## 📊 Tableau de Correspondance Complet

| Catégorie Boutique | Catégories Produits Autorisées |
|---|---|
| Mode & Vêtements | Mode |
| Mode & Accessoires | Mode |
| Électronique | Électronique, High-Tech & Gadgets |
| Beauté & Cosmétiques | Beauté & Santé |
| Beauté & Santé | Beauté & Santé |
| Jouets & Puériculture | Jeux, Jouets & Bébé |
| Jeux, Jouets & Bébé | Jeux, Jouets & Bébé |
| Général / Hypermarché | **TOUTES** |
| Général | **TOUTES** |
| Multimarques | **TOUTES** |
| High-Tech | Électronique, High-Tech & Gadgets |
| High-Tech & Gadgets | High-Tech & Gadgets |

---

## 🚀 API de Référence

### `window.getAllowedProductCategories(shopCategory)`

**Description:** Retourne les catégories de produits autorisées pour une boutique

**Signature:**
```javascript
function getAllowedProductCategories(shopCategory: string): Array<string>
```

**Paramètres:**
- `shopCategory` (string): La catégorie de la boutique (ex: "Mode & Vêtements")

**Retour:**
- Array: Tableau des catégories de produits autorisées
- Example: `["Mode"]` ou `["Mode", "Électronique", ...]`

**Exemple:**
```javascript
const allowed = window.getAllowedProductCategories("Mode & Vêtements");
console.log(allowed); // ["Mode"]
```

---

### `window.initCategoryCascade(options)`

**Description:** Initialise le système de sélection en cascade avec restrictions

**Signature:**
```javascript
function initCategoryCascade(options: Object): void
```

**Options:**
```javascript
{
    mainCategoryId: 'p-cat-main',           // ID du select catégorie principale
    subCategoryId: 'p-cat-sub',             // ID du select sous-catégorie
    subSubCategoryId: 'p-cat-subsub',       // ID du select type de produit
    containerId: 'category-cascade-container',  // ID du conteneur
    allowedCategories: ["Mode", "..."]      // NOUVEAU: Restreindre les catégories (optionnel)
}
```

**Exemple:**
```javascript
window.initCategoryCascade({
    mainCategoryId: 'p-cat-main',
    subCategoryId: 'p-cat-sub',
    subSubCategoryId: 'p-cat-subsub',
    containerId: 'category-cascade-container',
    allowedCategories: ["Mode"] // Afficher UNIQUEMENT Mode
});
```

---

## 🧪 Tests & Validation

### Test 1: Vérifier le mapping pour une boutique Mode

```javascript
// Console:
let allowed = window.getAllowedProductCategories("Mode & Vêtements");
console.assert(allowed.length === 1 && allowed[0] === "Mode", "Mode & Vêtements should only allow Mode");
```

### Test 2: Vérifier le mapping pour une boutique Général

```javascript
let allowed = window.getAllowedProductCategories("Général / Hypermarché");
console.assert(allowed.length === 5, "Général should allow all 5 categories");
```

### Test 3: Vérifier le fallback (catégorie inconnue)

```javascript
let allowed = window.getAllowedProductCategories("Catégorie fantôme");
console.assert(allowed.length === 5, "Unknown category should return all categories");
```

### Test 4: Vérifier l'UI du formulaire

1. Ouvrir l'espace vendeur pour une boutique Mode
2. Cliquer "Ajouter un produit"
3. Vérifier que le dropdown "Catégorie principale" affiche UNIQUEMENT "Mode"
4. Confirmer que "Électronique", "Beauté", etc. NE sont PAS affichés

---

## 📚 Fichiers Modifiés

| Fichier | Modifications |
|---|---|
| `assets/js/categories.js` | ✅ Dictionnaire de mapping + fonction helper + paramètre allowedCategories |
| `assets/js/admin.js` | ✅ Récupération et passage des catégories restreintes à initCategoryCascade() |

---

## 🔗 Liens Utiles

- **Firestore Schema:** `collections('shops').field('category')`
- **Category Hierarchy:** Max 3 niveaux (Main > Sub > SubSub)
- **Seller Dashboard:** `seller.html`
- **Product Form:** `seller.html#sec-add`

---

**Version:** 1.0  
**Créé:** 2026-02-22  
**Maintenance:** Développeur E-commerce Senior
