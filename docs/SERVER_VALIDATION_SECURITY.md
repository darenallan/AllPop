# 🔐 Validation Serveur - Guide de Sécurisation

## ⚠️ Problème de Sécurité

Le système de restriction des catégories actuel est une **restriction UI UNIQUEMENT**.

### Attack Vector 1: Console DevTools
```javascript
// Attacker peut faire ceci:
// 1. Ouvrir Console (F12)
// 2. Modifier allowedCategories en mémoire
// 3. Submit product dans une catégorie interdite
```

### Attack Vector 2: Network Tampering
```javascript
// Attacker peut faire ceci:
// 1. Intercepter la requête Firestore
// 2. Modifier le payload
// 3. Créer un produit dans une catégorie interdite
```

### Attack Vector 3: Direct API Call
```javascript
// Attacker (avec accès SDK) peut faire:
firebase.firestore()
    .collection('products')
    .add({
        shopId: '...',
        category: 'Électronique', // INTERDITE pour sa boutique Mode
        price: 9999,
        ...
    }); // ✗ Aucune validation côté serveur → ACCEPTÉ!
```

---

## ✅ Solution: Validation Cloud Functions

La solution est d'ajouter une **vérification côté serveur** dans une Cloud Function ou une Firestore Security Rule.

### Approche 1: Firestore Security Rules (RECOMMANDÉ)

**Fichier:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ─────────────────────────────────────────────────────────────
    // COLLECTION: products
    // ─────────────────────────────────────────────────────────────
    
    match /products/{productId} {
      
      /**
       * RÈGLE: Valider que la catégorie du produit est autorisée
       *        selon la catégorie de la boutique du vendeur
       */
      function isAllowedProductCategory(shopCategory, productCategory) {
        let allowedCategories = {
          'Mode & Vêtements': ['Mode'],
          'Mode & Accessoires': ['Mode'],
          'Électronique': ['Électronique', 'High-Tech & Gadgets'],
          'Beauté & Cosmétiques': ['Beauté & Santé'],
          'Beauté & Santé': ['Beauté & Santé'],
          'Jouets & Puériculture': ['Jeux, Jouets & Bébé'],
          'Jeux, Jouets & Bébé': ['Jeux, Jouets & Bébé'],
          'Général / Hypermarché': ['Mode', 'Électronique', 'Beauté & Santé', 'High-Tech & Gadgets', 'Jeux, Jouets & Bébé'],
          'Général': ['Mode', 'Électronique', 'Beauté & Santé', 'High-Tech & Gadgets', 'Jeux, Jouets & Bébé'],
          'Multimarques': ['Mode', 'Électronique', 'Beauté & Santé', 'High-Tech & Gadgets', 'Jeux, Jouets & Bébé'],
          'High-Tech': ['Électronique', 'High-Tech & Gadgets'],
          'High-Tech & Gadgets': ['High-Tech & Gadgets']
        };
        
        return allowedCategories[shopCategory] == null 
          || productCategory in allowedCategories[shopCategory];
      }
      
      /**
       * CRÉER UN PRODUIT
       * - Vendeur ne peut créer que SES propres produits
       * - Catégorie produit DOIT être autorisée pour la boutique
       */
      allow create: if 
        request.auth != null
        && request.auth.uid == request.resource.data.vendorId  // Vendeur crée son propre produit
        && exists(/databases/$(database)/documents/shops/$(request.resource.data.shopId))  // Shop doit exister
        && isAllowedProductCategory(
            get(/databases/$(database)/documents/shops/$(request.resource.data.shopId)).data.category,
            request.resource.data.category
          );  // ✅ VALIDATION: Catégorie autorisée
      
      /**
       * LIRE UN PRODUIT
       * - Public (anyone peut lire)
       */
      allow read: if true;
      
      /**
       * MODIFIER UN PRODUIT
       * - Vendeur ne peut modifier que SES propres produits
       * - Catégorie ne peut pas être changée vers une catégorie interdite
       */
      allow update: if
        request.auth != null
        && request.auth.uid == resource.data.vendorId  // Vendeur modifie son propre produit
        && isAllowedProductCategory(
            get(/databases/$(database)/documents/shops/$(resource.data.shopId)).data.category,
            request.resource.data.category
          );  // ✅ VALIDATION: Catégorie autorisée (même après update)
      
      /**
       * SUPPRIMER UN PRODUIT
       * - Vendeur ne peut supprimer que SES propres produits
       */
      allow delete: if
        request.auth != null
        && request.auth.uid == resource.data.vendorId;  // Vendeur supprime son propre produit
    }
    
    // ... autres règles ...
  }
}
```

**Avantages:**
✅ Validation au niveau de la base de données  
✅ Impossible à contourner (même via API direct)  
✅ Zéro latence (validation côté Firestore)  
✅ Pas besoin de Cloud Function  

**Déployer:**
```bash
firebase deploy --only firestore:rules
```

---

### Approche 2: Cloud Function (Alternative)

Si vous préférez plus de flexibilité:

**Fichier:** `functions/src/index.ts` (ou `.js`)

```javascript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: Trigger avant CREATE de produit
 * Valide que la catégorie du produit est autorisée
 */
export const onProductCreate = functions.firestore
    .document('products/{productId}')
    .onCreate(async (snap, context) => {
        const productData = snap.data();
        
        try {
            // 1. Récupérer la boutique du vendeur
            const shopDoc = await db.collection('shops').doc(productData.shopId).get();
            
            if (!shopDoc.exists) {
                throw new Error('Shop not found');
            }
            
            const shopData = shopDoc.data();
            const shopCategory = shopData.category;
            
            // 2. Mapping des catégories autorisées
            const allowedCategories = {
                'Mode & Vêtements': ['Mode'],
                'Mode & Accessoires': ['Mode'],
                'Électronique': ['Électronique', 'High-Tech & Gadgets'],
                // ... etc
            };
            
            // 3. Vérifier que la catégorie est autorisée
            const allowed = allowedCategories[shopCategory] || [];
            const productCategory = productData.category?.split(' > ')[0]; // "Mode > Homme > T-shirts" → "Mode"
            
            if (!allowed.includes(productCategory)) {
                // 🚨 VIOLATION: Bloquer et enregistrer
                console.error(`🚨 SECURITY VIOLATION: Vendor ${productData.vendorId} tried to create product in unauthorized category ${productCategory}`);
                
                // Enregistrer l'incident
                await db.collection('security_logs').add({
                    timestamp: admin.firestore.Timestamp.now(),
                    type: 'UNAUTHORIZED_CATEGORY',
                    vendorId: productData.vendorId,
                    shopId: productData.shopId,
                    shopCategory: shopCategory,
                    attemptedCategory: productCategory,
                    allowedCategories: allowed,
                    productId: context.params.productId
                });
                
                // Supprimer le produit créé
                await snap.ref.delete();
                throw new Error(`Category ${productCategory} not allowed for shop category ${shopCategory}`);
            }
            
            console.log(`✅ Product created validly: ${productData.name} in ${productCategory}`);
            
        } catch (error) {
            console.error('Error validating product:', error);
            // Supprimer le produit si validation échoue
            await snap.ref.delete();
            throw error;
        }
    });

/**
 * Cloud Function: Trigger avant UPDATE de produit
 * Empêcher le changement de catégorie vers non-autorisée
 */
export const onProductUpdate = functions.firestore
    .document('products/{productId}')
    .onUpdate(async (change, context) => {
        const oldData = change.before.data();
        const newData = change.after.data();
        
        // Si catégorie n'a pas changé, pas besoin de valider
        if (oldData.category === newData.category) {
            return;
        }
        
        // Validation similaire à onCreate
        // ... (voir code au-dessus)
    });
```

**Déployer:**
```bash
firebase deploy --only functions
```

---

### Approche 3: Hybrid (Recommandé)

Combiner **Security Rules + Cloud Function + Audit Log:**

```javascript
// firestore.rules: Bloquer les violations critiques
// Cloud Functions: Enregistrer les tentatives suspectes
// Audit Collection: Historique complet des actions
```

**Audit Log Schema:**
```javascript
{
    timestamp: Timestamp,
    action: 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT',
    vendorId: string,
    shopId: string,
    productId: string,
    category: string,
    allowed: boolean,
    reason?: string,
    ipAddress: string,
    userAgent: string
}
```

---

## 🔧 Implémentation Étape par Étape

### Étape 1: Ajouter la Validation au Moment de l'Envoi (Client)

**Fichier:** `assets/js/admin.js` → Fonction `setupSellerForms()` → Handler du formulaire

```javascript
// AVANT de créer le produit:
const category = window.getCategorySelection(...).main;
const allowedCategories = window.getAllowedProductCategories(currentShop.category);

if (!allowedCategories.includes(category)) {
    console.warn(`🚨 SECURITY: Category ${category} not allowed for shop ${currentShop.category}`);
    window.showToast('❌ Cette catégorie n\'est pas autorisée pour votre boutique', 'danger');
    btn.disabled = false;
    return; // Bloquer la soumission
}

// Si validation UI passée, continuer vers Firestore
// (Mais la validation Firestore va aussi vérifier!)
```

### Étape 2: Déployer Security Rules

1. Ouvrir `firestore.rules`
2. Ajouter la fonction `isAllowedProductCategory()` (voir code au-dessus)
3. Ajouter la validation au règle `allow create`
4. Déployer: `firebase deploy --only firestore:rules`

### Étape 3: Tester les Restrictions

**Test 1: Interface UI (doit bloquer)**
```
1. Connexion vendeur Mode
2. Ajouter produit → Dropdown ne montre que "Mode"
3. ✅ PASS: UI restreint correctement
```

**Test 2: Security Rules (doit bloquer)**
```javascript
// Console DevTools:
firebase.firestore().collection('products').add({
    shopId: 'MODE_SHOP_ID',
    vendorId: 'VENDOR_UID',
    category: 'Électronique',  // ✗ Interdit
    name: 'Phone',
    price: 999
})
// Erreur attendue: "Missing required fields" ou "Unauthorized"
```

**Test 3: Audit Log (doit enregistrer)**
1. Tenter une création non-autorisée via Console
2. Vérifier `security_logs` en Firestore
3. ✅ Incident enregistré avec détails

---

## 📊 Matrice de Sécurité

| Scénario | UI Block | Rules Block | Cloud Fn Log | Résultat |
|---|---|---|---|---|
| Utilisateur normal, bonne catégorie | ✅ Permet | ✅ Accepte | ✅ Enregistre | ✅ PRODUIT CRÉÉ |
| Utilisateur normal, mauvaise catégorie | ✅ Bloque | ✅ Refuse | ✅ Enregistre | ❌ REFUSÉ (triple protection) |
| Attacker en DevTools | ❌ Contourne | ✅ Refuse | ✅ Enregistre | ❌ REFUSÉ (règles + logging) |
| Attacker par API direct | ❌ N/A | ✅ Refuse | ✅ Enregistre | ❌ REFUSÉ (règles + logging) |
| Admin bypass (si implémenté) | ✅ Bypass | ✅ Bypassable | ✅ Enregistre | ✅ PRODUIT CRÉÉ (mais loggé) |

---

## 🎯 Checklist de Déploiement

- [ ] Ajouter `shopCategoryToProductCategories` dans `categories.js` ✅ FAIT
- [ ] Ajouter `getAllowedProductCategories()` fonction ✅ FAIT
- [ ] Modifier `initCategoryCascade()` avec `allowedCategories` ✅ FAIT
- [ ] Modifier `setupSellerForms()` pour passer restrictions ✅ FAIT
- [ ] ⚠️ Ajouter validation Security Rules dans `firestore.rules`
- [ ] ⚠️ Ajouter Cloud Function pour audit logging
- [ ] ⚠️ Créer `security_logs` collection
- [ ] ⚠️ Tester tous les scénarios
- [ ] ⚠️ Documenter les procédures de monitoring
- [ ] ⚠️ Configurer alertes admin pour violations

---

## 🚨 Monitoring & Alerts

### Dashboard Admin

Créer une page Admin pour monitorer les violations:

```sql
SELECT 
    vendorId,
    COUNT(*) as violation_count,
    MAX(timestamp) as last_attempt,
    ARRAY_AGG(DISTINCT attemptedCategory) as categories_tried
FROM `firestore_audits.security_logs`
WHERE type = 'UNAUTHORIZED_CATEGORY'
    AND timestamp > CURRENT_TIMESTAMP() - INTERVAL 24 HOUR
GROUP BY vendorId
ORDER BY violation_count DESC;
```

### Email Alert

```javascript
// Cloud Function: Si 3+ violations en 1h, alerter admin
if (violationCount > 3) {
    await sendEmailToAdmin({
        subject: `🚨 Suspicious Activity: Vendor ${vendorId}`,
        body: `${violationCount} unauthorized category attempts in 1 hour.`
    });
}
```

---

## 💡 Best Practices

1. **Never trust the client** - Always validate on server
2. **Log everything** - Créer audit trail pour investigations futures
3. **Fail securely** - Si doute, rejeter la requête
4. **Monitor actively** - Configurer alertes pour patterns suspects
5. **Document exceptions** - Si admin bypass, laisser trace claire

---

## 📞 Support & Questions

- **Déployment Issues?** → Vérifier `firebase.json` et permissions
- **Performance Concerns?** → Security Rules ont zéro overhead
- **Need Real-time Alerts?** → Utiliser Pub/Sub + Cloud Functions

---

**Document:** Validation Serveur - Sécurisation  
**Créé:** 2026-02-22  
**Importance:** 🔴 HAUTE - Implémenter AVANT production
