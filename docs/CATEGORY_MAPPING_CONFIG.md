# 🎯 Configuration des Catégories - Fichier de Référence Rapide

## 📋 Mapping Actuellement Déployé

File: `assets/js/categories.js` (lines 62-75)

```javascript
window.shopCategoryToProductCategories = {
    "Mode & Vêtements": ["Mode"],
    "Mode & Accessoires": ["Mode"],
    "Électronique": ["Électronique", "High-Tech & Gadgets"],
    "Beauté & Cosmétiques": ["Beauté & Santé"],
    "Beauté & Santé": ["Beauté & Santé"],
    "Jouets & Puériculture": ["Jeux, Jouets & Bébé"],
    "Jeux, Jouets & Bébé": ["Jeux, Jouets & Bébé"],
    "Général / Hypermarché": Object.keys(window.aurumCategories),
    "Général": Object.keys(window.aurumCategories),
    "Multimarques": Object.keys(window.aurumCategories),
    "High-Tech": ["Électronique", "High-Tech & Gadgets"],
    "High-Tech & Gadgets": ["High-Tech & Gadgets"]
};
```

---

## 🏪 Catégories Disponibles Dans Firestore (`shops.category`)

✅ Mode & Vêtements  
✅ Mode & Accessoires  
✅ Électronique  
✅ Beauté & Cosmétiques  
✅ Beauté & Santé  
✅ Jouets & Puériculture  
✅ Jeux, Jouets & Bébé  
✅ Général / Hypermarché  
✅ Général  
✅ Multimarques  
✅ High-Tech  
✅ High-Tech & Gadgets  

---

## 📦 Catégories de Produits Disponibles (`aurumCategories`)

File: `assets/js/categories.js` (lines 18-60)

```javascript
window.aurumCategories = {
    "Mode": { // 3 sous-catégories
        "Homme": [8 items],
        "Femme": [9 items],
        "Enfant": [3 items]
    },
    "Électronique": { // 10 sous-catégories (laissées vides)
        "Téléphones & Smartphones": [],
        "Accessoires Téléphones": [],
        "Ordinateurs & PC": [],
        "Tablettes": [],
        "TV & Audio": [],
        "Consoles & Jeux vidéo": [],
        "Montres connectées": [],
        "Appareils photo": [],
        "Accessoires informatiques": [],
        "Autre": []
    },
    "Beauté & Santé": { // 8 sous-catégories
        "Maquillage": [],
        "Soins du visage": [],
        "Soins du corps": [],
        "Parfums": [],
        "Produits capillaires": [],
        "Rasage": [],
        "Compléments alimentaires": [],
        "Autre": []
    },
    "High-Tech & Gadgets": { // 5 sous-catégories
        "Accessoires innovants": [],
        "Gadgets tech": [],
        "Smart home": [],
        "Drones": [],
        "Sécurité & surveillance": []
    },
    "Jeux, Jouets & Bébé": { // 5 sous-catégories
        "Jouets éducatifs": [],
        "Jeux de société": [],
        "Figurines": [],
        "Poussettes": [],
        "Articles bébé": []
    }
};
```

---

## ⚙️ Procédure d'Ajout d'une Nouvelle Boutique + Restriction

### Étape 1: Créer la boutique dans Firestore (admin.html)

1. Aller à `admin.html` → Section "Boutiques"
2. Remplir:
   - Nom: `"Mon Magasin"`
   - Email propriétaire: `vendeur@email.com`
   - **Catégorie:** Sélectionner une catégorie existante OU en ajouter une
3. Soumettre

### Étape 2: Ajouter le Mapping (si nouvelle catégorie boutique)

**Fichier:** `assets/js/categories.js`  
**Localiser:** Fonction `shopCategoryToProductCategories`

**Ajouter une ligne:**

```javascript
"Nom de la Nouvelle Catégorie": ["Catégorie Produit 1", "Catégorie Produit 2"]
```

**Exemple:**

```javascript
// Nouvelle boutique: "Alimentation & Épicerie"
"Alimentation & Épicerie": ["Beauté & Santé"] // Peut vendre compléments alimentaires
// OU restreindre à une autre combinaison
```

### Étape 3: Tester

1. Se connecter en tant que vendeur avec la nouvelle boutique
2. Aller à "Ajouter un produit"
3. Vérifier que le dropdown "Catégorie principale" n'affiche QUE les catégories autorisées

---

## 🚀 Scripts de Maintenance

### Vérifier toutes les correspondances

```javascript
// Dans la console:
Object.entries(window.shopCategoryToProductCategories).forEach(([shop, categories]) => {
    console.log(`🏪 ${shop}:`, categories);
});
```

### Vérifier qu'une boutique spécifique est correctement mappée

```javascript
const shop = "Mode & Vêtements";
const allowed = window.getAllowedProductCategories(shop);
console.log(`${shop} →`, allowed);
// Résultat attendu: ["Mode"]
```

### Lister toutes les catégories produits

```javascript
console.log(Object.keys(window.aurumCategories));
// ["Mode", "Électronique", "Beauté & Santé", "High-Tech & Gadgets", "Jeux, Jouets & Bébé"]
```

### Vérifier qu'une boutique a accès SAUF restriction

```javascript
const shop = "Général / Hypermarché";
const allowed = window.getAllowedProductCategories(shop);
console.log(`Catégories autorisées (${shop}):`, allowed);
console.log(`Total: ${allowed.length} catégories`);
```

---

## 🔄 Scénarios de Test

### Test Scénario 1: Vendeur Mode

**Shop:** Mode & Vêtements  
**Expected:** Peut ajouter UNIQUEMENT dans "Mode"

```
✅ Mode > Homme > T-shirts
✅ Mode > Femme > Robes
✗ Électronique > (bloqué)
✗ Beauté & Santé > (bloqué)
```

### Test Scénario 2: Vendeur Électronique + High-Tech

**Shop:** Électronique  
**Expected:** Peut ajouter dans "Électronique" ET "High-Tech & Gadgets"

```
✅ Électronique > Téléphones & Smartphones
✅ High-Tech & Gadgets > Smart home
✗ Mode > (bloqué)
✗ Beauté & Santé > (bloqué)
```

### Test Scénario 3: Vendeur Général/Hypermarché

**Shop:** Général / Hypermarché  
**Expected:** Peut ajouter PARTOUT

```
✅ Mode > Homme > T-shirts
✅ Électronique > Téléphones & Smartphones
✅ Beauté & Santé > Maquillage
✅ High-Tech & Gadgets > Drones
✅ Jeux, Jouets & Bébé > Articles bébé
```

---

## 📝 Changelog

### Version 1.0 (2026-02-22)

- ✅ Ajout du dictionnaire de mapping `shopCategoryToProductCategories`
- ✅ Fonction helper `getAllowedProductCategories()`
- ✅ Paramètre `allowedCategories` dans `initCategoryCascade()`
- ✅ Intégration dans `setupSellerForms()` (admin.js)
- ✅ Support de correspondance partielle (ex: "Mode" dans "Mode & Vêtements")
- ✅ Fallback sécurisé vers toutes les catégories si aucune correspondance

---

## 🎓 Points d'Entrée pour le Développement

### Pour **ajouter une restriction:**
→ Modifier `shopCategoryToProductCategories` dans `categories.js`

### Pour **vérifier l'accès d'une boutique:**
→ Appeler `window.getAllowedProductCategories(shopCategory)`

### Pour **tester l'intégration:**
→ Vérifier la console dans DevTools quand on ouvre "Ajouter un produit"  
→ Message: `🔒 Catégorie boutique: "..." → Catégories autorisées: [...]`

---

## ⚠️ À NE PAS OUBLIER

1. **Le mapping doit matcher les valeurs Firestore** - Ne pas inventer de noms
2. **Utiliser `Object.keys(window.aurumCategories)` pour "Tous"** - Assure la cohérence
3. **Tester après chaque modification** - Vérifier la console pour les warnings
4. **Ajouter une validation serveur** - Cette restriction UI n'est pas suffisante seule
5. **Documenter les modifications** - Mettez à jour ce fichier

---

**Document:** Configuration des Catégories  
**Dernière mise à jour:** 2026-02-22  
**Maintenu par:** Développeur E-commerce Senior
