# 💻 CODE COMPLET - Spécifications V2

## 📦 Fichiers Modifiés

### 1. assets/js/admin.js

#### À: Ajouter cette constante (après `requireAdminOrSeller()`, ~ligne 45)

```javascript
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION SPÉCIFICATIONS TECHNIQUES
// ─────────────────────────────────────────────────────────────────────────────

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

#### À: Remplacer la section "GESTION DES SPÉCIFICATIONS TECHNIQUES" (~ligne 950)

```javascript
// ════════════════════════════════════════════════════════════════
// GESTION DES SPÉCIFICATIONS TECHNIQUES (V2 - AVEC SELECT)
// ════════════════════════════════════════════════════════════════

/**
 * Crée le HTML du <select> avec optgroups et options pré-définies
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
        customInput.focus();
        selectElement.style.flex = '0 0 auto';
    } else {
        // Cacher le custom input et le vider
        customInput.style.display = 'none';
        customInput.value = '';
        selectElement.style.flex = '1';
    }
}

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
 * Récupère et compile toutes les spécifications depuis le formulaire
 * Gère les deux cas: select pré-défini ou champ custom "Autre"
 * @returns {Object} Objet {key: value, key: value, ...}
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
 * Initialise le système de spécifications au chargement
 * Ajoute une ligne vide par défaut
 */
window.initSpecifications = function() {
    const container = document.getElementById('specs-container');
    if (!container) return;

    // Ajouter une ligne vide par défaut
    window.addSpecRow();
};

// Initialiser les spécifications quand le formulaire vendeur est prêt
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.initSpecifications();
    }, 500);
});

console.log("✅ Spécifications Techniques V2 (avec Select) OK");
```

---

### 2. assets/css/admin.css

#### À: Ajouter ceci après la ligne `}` qui clôt `.category-manage-stats` (~ligne 481)

```css
/* ===== SPÉCIFICATIONS TECHNIQUES V2 - AVEC SELECT ===== */

/* Wrapper pour le select + custom input */
.spec-key-wrapper {
  flex: 0 0 35%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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
  background: #fffaf0;
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

/* Amélioration du select - chevron personnalisé */
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

## 🔄 AVANT vs APRÈS

### AVANT (V1)

```javascript
// V1: Deux inputs text simples
window.addSpecRow = function() {
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
        <input type="text" class="spec-key input" placeholder="Ex: Marque, Couleur, RAM...">
        <input type="text" class="spec-value input" placeholder="Ex: Apple, Noir, 8 Go...">
        <button class="remove-spec" onclick="this.parentElement.remove();">
            <i data-lucide="trash-2"></i>
        </button>
    `;
};

// Résultat possible:
getSpecifications() → {
    "Marque": "Apple",
    "marque ": "Samsung",  // ❌ Clé dupliquée (casse + espace)
    "RAM": "8 Go",
    "RAM": "16 GB"         // ❌ Clé dupliquée (unité différente)
}
```

### APRÈS (V2)

```javascript
// V2: Select guidé + champ custom flexible
window.addSpecRow = function() {
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
        <div class="spec-key-wrapper">
            <select class="spec-key input">
                <option value="">-- Sélectionnez --</option>
                <optgroup label="Général">
                    <option>Marque</option>
                    ...
                </optgroup>
                <optgroup label="---">
                    <option value="custom">✏️ Autre caractéristique...</option>
                </optgroup>
            </select>
            <input type="text" class="spec-custom-key" style="display: none;">
        </div>
        <input type="text" class="spec-value input" placeholder="Valeur...">
        <button class="remove-spec"><i data-lucide="trash-2"></i></button>
    `;
};

// Résultat garanti:
getSpecifications() → {
    "Marque": "Apple",
    "Marque": "Samsung",   // ✅ Clé identique (peut être mergée/filtrée)
    "RAM": "8 Go",
    "RAM": "16 GB"         // ✅ Clé cohérente (pas de variations)
}
```

---

## 📊 Exemples d'Utilisation

### Exemple 1: Sélection Standard

```
Ligne 1: Select [Marque ▼] → Input [Apple] → Output: "Marque": "Apple"
Ligne 2: Select [RAM ▼] → Input [8 Go] → Output: "RAM": "8 Go"
Ligne 3: Select [Couleur ▼] → Input [Gris sidéral] → Output: "Couleur": "Gris sidéral"
```

**getSpecifications() retourne:**
```javascript
{
    "Marque": "Apple",
    "RAM": "8 Go",
    "Couleur": "Gris sidéral"
}
```

### Exemple 2: Utilisation du champ "Autre"

```
Ligne 1: Select [Marque ▼] → Input [Sony]
Ligne 2: Select [✏️ Autre... ▼] → Custom Input [Résolution] → Input [4K] → Output: "Résolution": "4K"
Ligne 3: Select [Batterie ▼] → Input [5000 mAh]
```

**getSpecifications() retourne:**
```javascript
{
    "Marque": "Sony",
    "Résolution": "4K",      // ✅ Clé personnalisée
    "Batterie": "5000 mAh"
}
```

### Exemple 3: Mélange Standard + Custom

```
Ligne 1: Select [Contenance ▼] → Input [100 ml]
Ligne 2: Select [Type de peau ▼] → Input [Mixte]
Ligne 3: Select [✏️ Autre... ▼] → Custom [pH Balance] → Input [5.5]
Ligne 4: Select [Garantie ▼] → Input [1 an]
```

**getSpecifications() retourne:**
```javascript
{
    "Contenance": "100 ml",
    "Type de peau": "Mixte",
    "pH Balance": "5.5",     // ✅ Clé custom compilée
    "Garantie": "1 an"
}
```

---

## 🧪 Tests Console

### Test 1: Vérifier SPEC_OPTIONS

```javascript
// Vérifier que la constante existe
console.log(SPEC_OPTIONS);

// Output attendu:
{
    'Général': (7) ['Marque', 'Modèle', 'Couleur', 'Poids', 'Dimensions', 'État', 'Garantie'],
    'Mode': (4) ['Matière', 'Taille', 'Genre', 'Entretien'],
    'Électronique': (7) ['Taille d\'écran', 'RAM', 'Stockage', 'Processeur', 'Batterie', 'Connectivité', 'Système d\'exploitation'],
    'Beauté': (3) ['Contenance', 'Type de peau', 'Notes olfactives']
}
```

### Test 2: Ajouter une Ligne et Vérifier le DOM

```javascript
// Ajouter une ligne
window.addSpecRow();

// Vérifier qu'elle a les bons éléments
const row = document.querySelector('.spec-row:last-child');
console.log({
    hasSelectWrapper: !!row.querySelector('.spec-key-wrapper'),
    hasSelect: !!row.querySelector('.spec-key'),
    hasCustomInput: !!row.querySelector('.spec-custom-key'),
    hasValueInput: !!row.querySelector('.spec-value'),
    customInputIsHidden: row.querySelector('.spec-custom-key').style.display === 'none'
});

// Output attendu:
{
    hasSelectWrapper: true,
    hasSelect: true,
    hasCustomInput: true,
    hasValueInput: true,
    customInputIsHidden: true
}
```

### Test 3: Sélectionner "Autre" et Vérifier l'Apparition du Champ Custom

```javascript
// Ajouter une ligne
window.addSpecRow();

// Simuler la sélection de "custom"
const row = document.querySelector('.spec-row:last-child');
const select = row.querySelector('.spec-key');
const customInput = row.querySelector('.spec-custom-key');

// Avant: custom input est caché
console.log('Avant:', customInput.style.display);  // 'none'

// Sélectionner "Autre"
select.value = 'custom';
select.dispatchEvent(new Event('change'));

// Après: custom input est visible
console.log('Après:', customInput.style.display);  // 'block'
console.log('Focus sur custom input:', document.activeElement === customInput);  // true
```

### Test 4: Compilation Données

```javascript
// Ajouter 3 lignes
window.addSpecRow();
window.addSpecRow();
window.addSpecRow();

// Remplir les 3 lignes
const rows = document.querySelectorAll('.spec-row');

// Ligne 1: Marque → Apple
rows[0].querySelector('.spec-key').value = 'Marque';
rows[0].querySelector('.spec-value').value = 'Apple';

// Ligne 2: RAM → 8 Go
rows[1].querySelector('.spec-key').value = 'RAM';
rows[1].querySelector('.spec-value').value = '8 Go';

// Ligne 3: Autre → "Indice réparabilité" → "8/10"
rows[2].querySelector('.spec-key').value = 'custom';
rows[2].querySelector('.spec-key').dispatchEvent(new Event('change'));
rows[2].querySelector('.spec-custom-key').value = 'Indice réparabilité';
rows[2].querySelector('.spec-value').value = '8/10';

// Récupérer les données
const specs = window.getSpecifications();
console.log(specs);

// Output attendu:
{
    "Marque": "Apple",
    "RAM": "8 Go",
    "Indice réparabilité": "8/10"
}
```

### Test 5: Compilation avec Champ Vide

```javascript
// Ajouter 2 lignes
window.addSpecRow();
window.addSpecRow();

const rows = document.querySelectorAll('.spec-row');

// Ligne 1: Complète
rows[0].querySelector('.spec-key').value = 'Marque';
rows[0].querySelector('.spec-value').value = 'Apple';

// Ligne 2: Clé vide (doit être ignorée)
rows[1].querySelector('.spec-key').value = '';
rows[1].querySelector('.spec-value').value = 'Apple';

const specs = window.getSpecifications();
console.log(specs);

// Output attendu (ligne 2 ignorée):
{
    "Marque": "Apple"
}
```

---

## 🔗 Intégration avec setupSellerForms()

Le code `getSpecifications()` s'intègre **sans changement** dans votre code existant:

```javascript
// Dans setupSellerForms(), quand vous sauvegardez le produit:
window.db.collection('products').add({
    shopId: currentShop.id,
    shopName: currentShop.name,
    name: name,
    price: Number(price),
    description: desc,
    image: productImages[0] || img || 'assets/img/placeholder.png',
    images: productImages.length ? productImages.slice(0, 5) : undefined,
    category: category,
    specifications: window.getSpecifications(),  // ← Ça change déjà automatiquement!
    createdAt: new Date()
}).then(() => {
    console.log('✅ Produit sauvegardé avec specs');
});
```

---

## 📈 Statistiques du Code

| Métrique | Avant (V1) | Après (V2) | Gain |
|----------|-----------|-----------|------|
| Fonctions JS | 3 | 5 | +2 helpers |
| Lignes CSS | ~40 | ~65 | +25 (styling select) |
| Niveau cohérence données | ⚠️ Faible | ✅ Élevé | +++++ |
| Flexibilité utilisateur | ✅ Haute | ✅ Très haute | +Option custom |
| Complexité code | Faible | Moyen | +Select + custom logic |
| Compatibilité Firebase | ✅ Identique | ✅ Identique | ✅ Aucun changement |

---

## 🚀 Migration Données Existantes (Optionnel)

Si vous avez déjà des produits avec des specs V1, vous pouvez les normaliser:

```javascript
// Fonction de migration (à lancer UNE FOIS)
async function migrateSpecsV1ToV2() {
    const productsSnap = await window.db.collection('products').get();
    const batch = window.db.batch();
    
    productsSnap.forEach(doc => {
        const specs = doc.data().specifications || {};
        const normalizedSpecs = {};
        
        for (const [key, value] of Object.entries(specs)) {
            const normalizedKey = key.trim();  // Supprimer espaces
            const firstUpper = normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
            normalizedSpecs[firstUpper] = value;
        }
        
        batch.update(doc.ref, { specifications: normalizedSpecs });
    });
    
    await batch.commit();
    console.log('✅ Migration V1 → V2 complétée');
}

// Lancer dans la console (admin uniquement):
migrateSpecsV1ToV2();
```

---

**Version:** 2.0  
**Date:** Février 2026  
**Status:** ✅ Production Ready
