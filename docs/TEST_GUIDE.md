# 🧪 Guide de Test - Spécifications Techniques

## Avant de commencer

Assurez-vous que:
- ✅ seller.html est accessible
- ✅ admin.js est chargé
- ✅ Lucide Icons fonctionne
- ✅ Firestore est configuré
- ✅ Vous êtes connecté en tant que vendeur

---

## Test 1: Interface (2 min)

### Étape 1.1: Ouvrir le formulaire
1. Naviguer vers `seller.html`
2. Vérifier la présence de la section: **"🛠️ Caractéristiques Techniques"**
3. ✅ Section visible avec bordure orange

### Étape 1.2: État initial
1. Vérifier qu'il y a **1 ligne vide par défaut**
2. Ligne avec:
   - Input gauche placeholder: "Ex: Marque, Couleur, RAM..."
   - Input droite placeholder: "Ex: Apple, Noir, 8 Go..."
   - Bouton [🗑️] en rouge

### Étape 1.3: Ajouter une ligne
1. Cliquer "+ Ajouter une caractéristique"
2. ✅ Nouvelle ligne apparaît
3. Cliquer à nouveau
4. ✅ 3ème ligne apparaît

### Étape 1.4: Supprimer une ligne
1. Cliquer [🗑️] sur la 2ème ligne
2. ✅ Ligne 2 disparaît
3. Reste: 2 lignes visibles

---

## Test 2: Données (3 min)

### Étape 2.1: Remplir les specs
```
Ligne 1:
  Marque → Apple
  Couleur → Noir

Ligne 2:
  RAM → 8 Go
  Stockage → 256 GB

Ligne 3:
  (laisser vide)

Ligne 4:
  Batterie → 3500 mAh
  (laisser valeur vide)
```

### Étape 2.2: Vérifier via Console
1. Ouvrir DevTools (F12)
2. Console tab
3. Exécuter:
```javascript
window.getSpecifications()
```
4. Résultat attendu:
```javascript
{
  "Marque": "Apple",
  "Couleur": "Noir",
  "RAM": "8 Go",
  "Stockage": "256 GB"
}
```
✅ Lignes 3 et 4 *ignorées* (incomplètes)

---

## Test 3: Soumission & Base de Données (5 min)

### Étape 3.1: Remplir le formulaire complet
```
📋 Informations de base:
  Nom: iPhone 15 Pro
  Prix: 1299
  Description: Dernier modèle Apple...
  Catégorie: Électronique > Smartphones

📦 Gestion des Stocks:
  SKU: IPHONE15PRO-256-TN
  Quantité: 50
  Seuil alerte: 10

🛠️ Caractéristiques:
  Marque → Apple
  Modèle → iPhone 15 Pro
  Capacité → 256 GB
  Couleur → Titane Noir

📸 Photos:
  Ajouter au moins 1 image
```

### Étape 3.2: Soumettre
1. Cliquer "Mettre en vente"
2. ✅ Message succès: "✅ Produit ajouté avec succès!"
3. ✅ Formulaire reset (vide)

### Étape 3.3: Vérifier en Base de Données
1. Ouvrir **Firebase Console** → Firestore
2. Collection `products`
3. Trouver le nouveau document "iPhone 15 Pro"
4. ✅ Champ `specifications` existe
5. Contenu:
```json
{
  "Marque": "Apple",
  "Modèle": "iPhone 15 Pro",
  "Capacité": "256 GB",
  "Couleur": "Titane Noir"
}
```

---

## Test 4: Variantes de Produits

### Test 4.1: Mode (T-shirt)
```
Produit: T-Shirt Homme
Spécifications:
  Marque → Calvin Klein
  Taille → M
  Couleur → Noir
  Matière → 100% Coton
  Grammage → 180 g/m²

✅ Vérifier sauvegarde
```

### Test 4.2: Beauté (Crème)
```
Produit: Crème Hydratante
Spécifications:
  Marque → L'Oréal Paris
  Type → Crème hydratante
  Contenance → 50 ml
  Ingrédient principal → Acide hyaluronique
  Type de peau → Tous types
  Certification → Vegan

✅ Vérifier sauvegarde
```

### Test 4.3: Produit sans specs
```
Produit: Stylo Bic clasique
Ajouter AUCUNE spécification
Laisser le conteneur vide

✅ Vérifier que:
  - Pas d'erreur en sauvegarde
  - Champ `specifications` = {} ou absent
  - Produit sauvegardé correctement
```

---

## Test 5: Affichage client (Optionnel)

### Si product.html est implémenté

1. Naviguer vers la page produit du "iPhone 15 Pro"
2. ✅ Section "Spécifications Techniques" visible
3. ✅ Affichage des 4 specs en cartes:
   - **MARQUE**: Apple
   - **MODÈLE**: iPhone 15 Pro
   - **CAPACITÉ**: 256 GB
   - **COULEUR**: Titane Noir

---

## Test 6: Edge Cases

### Test 6.1: Doublons de clés
```
Ligne 1: Couleur → Noir
Ligne 2: Couleur → Blanc

Résultat attendu:
  "Couleur": "Blanc"  (dernier remplace)
```

### Test 6.2: Espaces inutiles
```
Ligne 1: "  Marque  " → "  Apple  "

Résultat après trim():
  "Marque": "Apple"
```

### Test 6.3: Caractères spéciaux
```
Marque → L'Oréal Paris
Couleur → Noir & Or
Prix € → 1299€

✅ Tous sauvegardés correctement (pas d'échappement)
```

### Test 6.4: Très long texte
```
Marque → "Super longue marque très très très longue..."
Valeur → "Description ultra détaillée avec beaucoup de texte..."

✅ Sauvegardé complètement
```

---

## Checklist de Déploiement

Avant de dire "c'est prêt":

- [ ] Section HTML visible sur seller.html
- [ ] 1 ligne vide par défaut au chargement
- [ ] Bouton "+ Ajouter" ajoute vraiment une ligne
- [ ] Bouton [🗑️] supprime vraiment la ligne
- [ ] `getSpecifications()` retourne objet correct
- [ ] Produit sauvegardé avec `specifications` en Firestore
- [ ] Lignes vides ignorées
- [ ] Caractères spéciaux acceptés
- [ ] CSS s'affiche bien (pas de débordement)
- [ ] Sur mobile: toujours lisible et utilisable

---

## Debugging

### Si: Section ne s'affiche pas
```javascript
// Console:
document.getElementById('specs-container')  // doit exister
```

### Si: "+ Ajouter" ne fonctionne pas
```javascript
// Console:
typeof window.addSpecRow  // doit être "function"
window.addSpecRow()  // appeler directement
```

### Si: Spécifications non sauvegardées
```javascript
// Console lors de soumission:
console.log(window.getSpecifications())  // vérifier contenu
```

### Si: Icônes trash manquantes
```javascript
// Console:
typeof lucide  // doit être "object"
lucide.createIcons()  // réinitialiser manuellement
```

---

## Résultats Attendus

### ✅ Suite de tests réussie
```
[✅] Interface visible et stylisée
[✅] 1 ligne vide au démarrage
[✅] Ajout/suppression de lignes fluide
[✅] getSpecifications() compile correctement
[✅] Produit sauvegardé en Firestore
[✅] Champ specifications présent
[✅] Format JSON valide
[✅] Lignes vides filtrées
[✅] Responsive design OK
```

### ❌ Problème détecté?
```
✅ Vérifier console (F12) pour erreurs JS
✅ Vérifier Firestore permissions
✅ Vérifier lucide.createIcons() appelé
✅ Vérifier form-add-product existe
✅ Vérifier admin.js chargé
```

---

## Performance

### Temps d'exécution attendu
- Ajout ligne: **<10ms**
- Suppression ligne: **<5ms**
- getSpecifications(): **<5ms**
- Sauvegarde Firestore: **500-2000ms** (réseau)

### Aucun:
- ❌ Lag visuels
- ❌ Délai à la saisie
- ❌ Erreurs console

---

**À partir du moment où cette checklist est ✅, le système est PRÊT POUR LA PRODUCTION! 🚀**

---

**Version**: 1.0  
**Date**: Février 2026  
**Durée totale estimée**: ~15 min
