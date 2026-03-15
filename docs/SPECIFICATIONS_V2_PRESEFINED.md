# 🔧 SYSTÈME SPÉCIFICATIONS V2 - Avec Select Prédéfinis

## Architecture Améliorée

Le nouveau système remplace le champ texte libre par un `<select>` organisé par catégories, avec une option "Autre" qui déverrouille un champ custom.

---

## 📋 Configuration des Options

```javascript
// À ajouter EN HAUT de admin.js (avant les fonctions)

const SPEC_OPTIONS = {
    'Général': [
        'Marque',
        'Modèle',
        'Couleur',
        'Poids',
        'Dimensions',
        'État',
        'Garantie'
    ],
    'Mode': [
        'Matière',
        'Taille',
        'Genre',
        'Entretien'
    ],
    'Électronique': [
        'Taille d\'écran',
        'RAM',
        'Stockage',
        'Processeur',
        'Batterie',
        'Connectivité',
        'Système d\'exploitation'
    ],
    'Beauté': [
        'Contenance',
        'Type de peau',
        'Notes olfactives'
    ]
};
```

---

## 🎯 Fonction Principale: `addSpecRow()`

```javascript
/**
 * Ajoute une nouvelle ligne de spécification avec select pré-défini
 */
window.addSpecRow = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'spec-row';
    
    // Créer le HTML du select avec optgroups
    const selectHtml = createSpecKeySelect();
    
    // Structure: [Select + Custom Input] [Value Input] [Delete Button]
    row.innerHTML = `
        <div class="spec-key-wrapper">
            ${selectHtml}
            <input 
                type="text" 
                class="spec-custom-key input" 
                placeholder="Nom personnalisé..." 
                style="display: none; flex: 1;"
            >
        </div>
        <input 
            type="text" 
            class="spec-value input" 
            placeholder="Valeur (ex: Noir, 8 Go, 256 GB)"
        >
        <button 
            type="button" 
            class="remove-spec" 
            onclick="this.closest('.spec-row').remove(); if(typeof lucide !== 'undefined') lucide.createIcons();"
        >
            <i data-lucide="trash-2"></i>
        </button>
    `;
    
    container.appendChild(row);
    
    // Ajouter l'écouteur d'événement sur le select
    const select = row.querySelector('.spec-key');
    select.addEventListener('change', function() {
        handleSpecKeyChange(this, row);
    });
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Crée le HTML du <select> avec optgroups et options
 */
function createSpecKeySelect() {
    let html = '<select class="spec-key input">';
    html += '<option value="">-- Sélectionnez une caractéristique --</option>';
    
    // Générer les optgroups à partir de SPEC_OPTIONS
    for (const [category, options] of Object.entries(SPEC_OPTIONS)) {
        html += `<optgroup label="${category}">`;
        options.forEach(option => {
            html += `<option value="${option}">${option}</option>`;
        });
        html += '</optgroup>';
    }
    
    // Option spéciale "Autre"
    html += '<optgroup label="---">';
    html += '<option value="custom" style="font-weight: bold; color: #D4AF37;">✏️ Autre caractéristique...</option>';
    html += '</optgroup>';
    
    html += '</select>';
    
    return html;
}

/**
 * Gère le changement du select
 * Affiche/masque le champ custom selon la sélection
 */
function handleSpecKeyChange(selectElement, rowElement) {
    const value = selectElement.value;
    const customInput = rowElement.querySelector('.spec-custom-key');
    
    if (!customInput) return;
    
    if (value === 'custom') {
        // Montrer le custom input
        customInput.style.display = 'block';
        customInput.focus();  // Focus auto sur le champ
        selectElement.style.flex = '0 0 auto';  // Le select ne prend que son espace
    } else {
        // Cacher le custom input et le vider
        customInput.style.display = 'none';
        customInput.value = '';
        selectElement.style.flex = '1';  // Le select reprend tout l'espace du wrapper
    }
}

/**
 * Récupère les spécifications en gérant les deux cas:
 * 1. Clé du select standard
 * 2. Clé du champ custom (si "Autre" était sélectionné)
 */
window.getSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return {};

    const specs = {};
    const rows = container.querySelectorAll('.spec-row');

    rows.forEach(row => {
        const keySelect = row.querySelector('.spec-key');
        const customKeyInput = row.querySelector('.spec-custom-key');
        const valueInput = row.querySelector('.spec-value');

        if (keySelect && valueInput) {
            let key = keySelect.value.trim();
            const value = valueInput.value.trim();

            // Cas 1: "Autre" est sélectionné → prendre du custom input
            if (key === 'custom' && customKeyInput) {
                key = customKeyInput.value.trim();
            }

            // Ignorer les lignes vides ou incomplètes
            if (key && value) {
                specs[key] = value;
            }
        }
    });

    return specs;
};

/**
 * Initialise le système avec 1 ligne vide par défaut
 */
window.initSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;
    window.addSpecRow();
};

// Auto-init au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initSpecifications();
    }, 500);
});
```

---

## 🎨 CSS Additionnel (À ajouter à assets/css/admin.css)

```css
/* Wrapper pour le select + custom input */
.spec-key-wrapper {
  flex: 0 0 35%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;  /* Important pour flex items */
}

.spec-key-wrapper .spec-key {
  flex: 1;
  margin: 0;
}

.spec-key-wrapper .spec-custom-key {
  flex: 1;
  margin: 0;
  border: 1px solid #D4AF37;
  border-left: 3px solid #D4AF37;
}

.spec-key-wrapper .spec-custom-key:focus {
  outline: none;
  background: #fffaf0;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

.spec-key-wrapper .spec-custom-key::placeholder {
  color: #D4AF37;
  font-style: italic;
}

/* Style pour les optgroups */
.spec-key optgroup {
  font-weight: 600;
  color: #333;
}

/* Amélioration du select */
.spec-key {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23333' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
  padding-right: 32px;
}
```

---

## 🔄 Intégration Complète

### Étape 1: Remplacer la section spécifications en admin.js

Dans `setupSellerForms()`, à la ligne où vous appelez le `.add()` à Firestore, gardez:

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
    specifications: window.getSpecifications(),  // ← Ça fonctionne toujours !
    createdAt: new Date()
}).then(() => {
    // ...
});
```

**Rien à changer ici!** La fonction `getSpecifications()` gère les deux cas automatiquement.

---

## 📊 Exemples de Données Compilées

### Exemple 1: Sélections du select standard

```
Ligne 1: [Marque ▼] → Apple | [8 Go]
Ligne 2: [RAM ▼] → (8 Go) | [8 Go]
Ligne 3: [Couleur ▼] → Noir | [Noir]
```

**Résultat `getSpecifications()`**:
```javascript
{
    "Marque": "Apple",
    "RAM": "8 Go",
    "Couleur": "Noir"
}
```

### Exemple 2: Utilisation du champ "Autre"

```
Ligne 1: [Marque ▼] → Apple | [Value]
Ligne 2: [✏️ Autre... ▼] [Modèle spécial] | [Pro Max]
```

**Résultat `getSpecifications()`**:
```javascript
{
    "Marque": "Apple",
    "Modèle spécial": "Pro Max"
}
```

### Exemple 3: Mélange des deux

```
Ligne 1: [RAM ▼] → 12 GB | [Value]
Ligne 2: [Batterie ▼] → 5000 mAh | [Value]
Ligne 3: [✏️ Autre... ▼] [Index de réparabilité] | [9/10]
```

**Résultat `getSpecifications()`**:
```javascript
{
    "RAM": "12 GB",
    "Batterie": "5000 mAh",
    "Index de réparabilité": "9/10"
}
```

---

## 🎯 Points Clés de la Nouvelle Logique

### 1️⃣ Organisation par Catégories
```
SPEC_OPTIONS = {
    'Général': [options...],
    'Mode': [options...],
    // etc.
}
```

✅ Chaque catégorie devient un `<optgroup>`  
✅ Facile à ajouter/modifier des options  
✅ Scalable pour le futur  

### 2️⃣ Champ "Autre" Intelligent
```
Sélect "Autre" → Custom input apparaît
Sélect normal → Custom input disparaît
```

✅ Flexibilité si les options prédéfinies manquent  
✅ Pas de limite = vendeurs heureux  
✅ Intégrité BD + liberté  

### 3️⃣ `getSpecifications()` Universelle
```javascript
if (key === 'custom' && customKeyInput) {
    key = customKeyInput.value.trim();
}
```

✅ Gère les deux cas transparemment  
✅ Validation + filtrage vides  
✅ Aucun changement côté Firebase  

### 4️⃣ UX Smooth
```
✨ Auto-focus sur le champ custom
✨ Placeholder évocateur
✨ Couleur Aurum (#D4AF37)
✨ Spacing cohérent
```

---

## 🧪 Test Console

```javascript
// 1. Vérifier que SPEC_OPTIONS existe
console.log(SPEC_OPTIONS);  // Object avec 4 catégories

// 2. Ajouter une ligne
window.addSpecRow();

// 3. Sélectionner une option standard
// → Vérifier que custom input reste masqué

// 4. Sélectionner "Autre"
// → Vérifier que custom input aparaît + auto-focus

// 5. Taper dans les deux inputs
// Spec-key (custom): "Mon spec spéciale"
// Spec-value: "Valeur spéciale"

// 6. Récupérer les données
window.getSpecifications()
// Résultat: { "Mon spec spéciale": "Valeur spéciale" }

// 7. Ajouter une vraie spec
// Sélectionner "Marque" du select
// Taper "Apple"
// Re-run getSpecifications()
// Résultat: { "Marque": "Apple", "Mon spec spéciale": "Valeur spéciale" }
```

---

## 🚀 Intégration Étape par Étape

### 1. Ajouter la constante SPEC_OPTIONS
En haut de `admin.js` (avant `setupSellerForms()`):
```javascript
const SPEC_OPTIONS = {
    'Général': [...],
    'Mode': [...],
    // etc.
};
```

### 2. Remplacer la fonction `addSpecRow()`
Remplacer l'ancienne `window.addSpecRow = function() {...}` par la nouvelle version ci-dessus.

### 3. Ajouter les 3 nouvelles fonctions
- `createSpecKeySelect()`
- `handleSpecKeyChange()`
- Remplacer `getSpecifications()` par la nouvelle version

### 4. Ajouter le CSS
Ajouter le bloc CSS aux styles dans `admin.css`

### 5. Tester immédiatement
```javascript
window.addSpecRow()  // Voir le select avec optgroups
```

---

## 📈 Bénéfices

### Pour la Marketplace
✅ Données cohérentes et filtrables  
✅ Moins de variations pour les mêmes specs  
✅ Meilleurs filtres futurs  
✅ Meilleure expérience client  

### Pour les Vendeurs
✅ Interface guidée + intuitif  
✅ Pas de fautes d'orthographe = données correctes  
✅ Flexibilité avec "Autre"  
✅ Auto-complete via select  

### Pour la Tech
✅ Pas breaking change (getSpecifications() compatible)  
✅ Séparation concerns: SPEC_OPTIONS = config, fonctions = logique  
✅ Facilement maintenable et extensible  
✅ Aucune dépendance externe  

---

## 🛠️ Personnalisation Future

### Ajouter une catégorie
```javascript
const SPEC_OPTIONS = {
    'Général': [...],
    'Mon Secteur': [  // ← Nouvelle
        'Option 1',
        'Option 2'
    ]
};
```

### Retirer une option
```javascript
'Général': [
    'Marque',
    // 'Modèle',  ← Commenté = retiré
    'Couleur'
]
```

### Charger depuis la base de données
```javascript
// À l'avenir, vous pouvez faire:
const SPEC_OPTIONS = await getSpecOptionsFromFirebase();
```

---

**Version**: 2.0 - Avec Select Pré-Définis  
**Date**: Février 2026  
**Status**: ✅ Production Ready
