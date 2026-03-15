# 🎨 STRUCTURE HTML GÉNÉRÉE - Spécifications V2

## 📐 HTML Complet d'Une Ligne

Quand vous appelez `window.addSpecRow()`, voici le HTML généré:

```html
<!-- Structure complète d'une ligne de spécification V2 -->
<div class="spec-row">
    <!-- PARTIE 1: Wrapper Select + Custom Input (flex: 0 0 35%) -->
    <div class="spec-key-wrapper">
        <!-- Select pré-défini avec optgroups -->
        <select class="spec-key input">
            <option value="">-- Sélectionnez une caractéristique --</option>
            
            <!-- OPTGROUP 1: Général -->
            <optgroup label="Général">
                <option value="Marque">Marque</option>
                <option value="Modèle">Modèle</option>
                <option value="Couleur">Couleur</option>
                <option value="Poids">Poids</option>
                <option value="Dimensions">Dimensions</option>
                <option value="État">État</option>
                <option value="Garantie">Garantie</option>
            </optgroup>
            
            <!-- OPTGROUP 2: Mode -->
            <optgroup label="Mode">
                <option value="Matière">Matière</option>
                <option value="Taille">Taille</option>
                <option value="Genre">Genre</option>
                <option value="Entretien">Entretien</option>
            </optgroup>
            
            <!-- OPTGROUP 3: Électronique -->
            <optgroup label="Électronique">
                <option value="Taille d'écran">Taille d'écran</option>
                <option value="RAM">RAM</option>
                <option value="Stockage">Stockage</option>
                <option value="Processeur">Processeur</option>
                <option value="Batterie">Batterie</option>
                <option value="Connectivité">Connectivité</option>
                <option value="Système d'exploitation">Système d'exploitation</option>
            </optgroup>
            
            <!-- OPTGROUP 4: Beauté -->
            <optgroup label="Beauté">
                <option value="Contenance">Contenance</option>
                <option value="Type de peau">Type de peau</option>
                <option value="Notes olfactives">Notes olfactives</option>
            </optgroup>
            
            <!-- OPTGROUP 5: Option "Autre" -->
            <optgroup label="---">
                <option value="custom" style="font-weight: bold; color: #D4AF37;">
                    ✏️ Autre caractéristique...
                </option>
            </optgroup>
        </select>
        
        <!-- Input custom (CACHÉ au départ) -->
        <input 
            type="text" 
            class="spec-custom-key input" 
            placeholder="Nom personnalisé..." 
            style="display: none; flex: 1;"
        >
    </div>
    
    <!-- PARTIE 2: Champ Valeur (flex: 1) -->
    <input 
        type="text" 
        class="spec-value input" 
        placeholder="Valeur (ex: Noir, 8 Go, 256 GB)"
    >
    
    <!-- PARTIE 3: Bouton Supprimer (flex-shrink: 0) -->
    <button 
        type="button" 
        class="remove-spec" 
        onclick="this.closest('.spec-row').remove(); if(typeof lucide !== 'undefined') lucide.createIcons();"
    >
        <i data-lucide="trash-2"></i>
    </button>
</div>
```

---

## 🎬 Rendu Visuel

### État INITIAL (Select Standard Sélectionné)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [-- Sélectionnez une caractéristique --▼] │ [Valeur...           ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘
                     ↑
              SELECT FERMÉ          35%              Reste de l'espace
```

### État DROPDOWN (Select Ouvert)

```
┌─────────────────────────┐
│ -- Sélectionnez...      │
│ ─────────────────────── │
│ Général                 │
│   • Marque              │← Cliquer ici
│   • Modèle              │
│   • Couleur             │
│   • Poids               │
│   • Dimensions          │
│   • État                │
│   • Garantie            │
│ ─────────────────────── │
│ Mode                    │
│   • Matière             │
│   • Taille              │
│   • Genre               │
│   • Entretien           │
│ ─────────────────────── │
│ Électronique            │
│   • Taille d'écran      │
│   • RAM                 │← Que cliquer ici
│   • Stockage            │
│   • Processeur          │
│   • Batterie            │
│   • Connectivité        │
│   • Système d'exploit   │
│ ─────────────────────── │
│ Beauté                  │
│   • Contenance          │
│   • Type de peau        │
│   • Notes olfactives    │
│ ─────────────────────── │
│ ✏️ Autre caractéristique│← Cliquer pour custom
└─────────────────────────┘
```

### État OPTION SÉLECTIONNÉE (Select Standard)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Marque                 ▼] │ [Valeur...           ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘
     Select avec la valeur "Marque"
```

### État CUSTOM ACTIF (Option "Autre" Sélectionnée)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [✏️ Autre... ▼][Nom perso...] │ [Valeur...           ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘
           ↑                ↑
      Select avec      Custom input
      "custom"         VISIBLE + FOCALISÉ
```

### État REMPLI (Tous les Champs)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Marque                 ▼] │ [Apple               ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  [RAM                    ▼] │ [8 Go                ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  [✏️ Autre... ▼][Année    ] │ [2024                ] │🗑️│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Transitions d'État

### Transition 1: Sélectionner "Autre"

```
AVANT:
┌─────────────────────────────────────┬──────────┬──────┐
│ [-- Sélectionnez...            ▼]   │ [Val...] │ 🗑️  │
└─────────────────────────────────────┴──────────┴──────┘
  Select (flex: 1 dans wrapper)
  Custom input hidden

↓ Vendeur clique: "✏️ Autre caractéristique..."

APRÈS:
┌──────────────────────┬─────────────┬──────────┬──────┐
│ [✏️ Autre... ▼][Nom.]│ [Val...] │ 🗑️  │
└──────────────────────┴─────────────┴──────────┴──────┘
  Select (flex: 0 0 auto, rétrécit)
  Custom input visible + focalisé
```

### Transition 2: Sélectionner une Option Standard

```
AVANT:
┌──────────────────────┬─────────────┬──────────┬──────┐
│ [✏️ Autre... ▼][Nom.]│ [Val...] │ 🗑️  │
└──────────────────────┴─────────────┴──────────┴──────┘

↓ Vendeur clique: "Marque"

APRÈS:
┌─────────────────────────────────────┬──────────┬──────┐
│ [Marque                  ▼]         │ [Val...] │ 🗑️  │
└─────────────────────────────────────┴──────────┴──────┘
  Select reprend tout l'espace (flex: 1)
  Custom input hidden & vidé
```

---

## 💾 Données Envoyées à Firestore

### Cas 1: Options Standards Uniquement

```
HTML DOM:
┌──────────────────────────────────────────────────────┐
│ Ligne 1: [Marque ▼] [Apple]        [🗑️]            │
│ Ligne 2: [RAM ▼] [8 Go]            [🗑️]            │
│ Ligne 3: [Couleur ▼] [Gris]        [🗑️]            │
└──────────────────────────────────────────────────────┘

↓ window.getSpecifications()

Firebase Firestore:
{
  "specifications": {
    "Marque": "Apple",
    "RAM": "8 Go",
    "Couleur": "Gris"
  }
}
```

### Cas 2: Mix Standards + Custom

```
HTML DOM:
┌──────────────────────────────────────────────────────┐
│ Ligne 1: [Marque ▼] [Sony]         [🗑️]            │
│ Ligne 2: [✏️ Autre...▼][Indice...] [8/10]  [🗑️]    │
│ Ligne 3: [Batterie ▼] [5000 mAh]   [🗑️]            │
└──────────────────────────────────────────────────────┘

↓ window.getSpecifications()

Firebase Firestore:
{
  "specifications": {
    "Marque": "Sony",
    "Indice réparabilité": "8/10",      ← Custom key compilée!
    "Batterie": "5000 mAh"
  }
}
```

---

## 🔍 Inspection avec DevTools

### Inspecting le Select

```html
<!-- Dans DevTools (F12 → Elements) -->
<select class="spec-key input">
    <option value="">-- Sélectionnez une caractéristique --</option>
    <optgroup label="Général">
        <option value="Marque" selected>Marque</option>
        <!-- ... autres options -->
    </optgroup>
    <!-- ... autres optgroups -->
</select>

<!-- Propriétés -->
element.value                    → "Marque"
element.selectedIndex            → 2
element.selectedOptions[0].text  → "Marque"
element.classList.contains('spec-key')  → true
```

### Inspecting le Custom Input

```html
<!-- Caché (state: "Autre" non sélectionné) -->
<input 
    type="text" 
    class="spec-custom-key input" 
    placeholder="Nom personnalisé..." 
    style="display: none;"
>

<!-- Visible (state: "Autre" sélectionné) -->
<input 
    type="text" 
    class="spec-custom-key input" 
    placeholder="Nom personnalisé..." 
    style="display: block;"
    value="Indice réparabilité"
>

<!-- Propriétés -->
element.style.display           → "block"
element.value                  → "Indice réparabilité"
element === document.activeElement  → true (si focalisé)
```

### Inspecting la Ligne Complète

```javascript
// Dans DevTools → Console
const lastRow = document.querySelector('.spec-row:last-child');

// Structure
lastRow.querySelector('.spec-key-wrapper')      → Wrapper ✅
lastRow.querySelector('.spec-key')              → Select ✅
lastRow.querySelector('.spec-custom-key')       → Custom input ✅
lastRow.querySelector('.spec-value')            → Value input ✅
lastRow.querySelector('.remove-spec')           → Delete button ✅

// Données
lastRow.querySelector('.spec-key').value        → "Marque"
lastRow.querySelector('.spec-value').value      → "Apple"
lastRow.querySelector('.spec-custom-key').value → ""
lastRow.querySelector('.spec-custom-key').style.display → "none"
```

---

## 🎯 Points d'Ancrage CSS

### `.spec-row` - La Ligne Complète

```css
.spec-row {
  display: flex;           /* Les 3 parties côte à côte */
  align-items: center;     /* Bien alignées vertically */
  gap: 12px;               /* Espace entre les parties */
  padding: 12px;           /* Respirant dedans */
  background: #f8f9fa;     /* Gris très clair */
  border: 1px solid #e9ecef;
  border-radius: 6px;
  transition: all 0.2s;    /* Smooth hover effect */
}
```

### `.spec-key-wrapper` - Le Wrapper Select

```css
.spec-key-wrapper {
  flex: 0 0 35%;           /* Fixe à 35% de la ligne */
  display: flex;           /* Select + custom côte à côte */
  align-items: center;
  gap: 8px;                /* Petit espace entre les deux */
  min-width: 0;            /* Permet flexbox de rétrécir */
}
```

### `.spec-key` - Le Select

```css
.spec-key {
  flex: 1;                 /* Prend tout l'espace du wrapper (par défaut) */
  appearance: none;        /* Enlever le style natif */
  background-image: url(...); /* Custom chevron */
  padding-right: 32px;     /* Place pour le chevron */
}

/* Quand "Autre" custom input est visible */
.spec-key[value="custom"] {
  flex: 0 0 auto;          /* Rétrécir juste à sa taille */
}
```

### `.spec-custom-key` - Le Input Custom

```css
.spec-custom-key {
  flex: 1;                 /* Prend le reste de l'espace */
  display: none;           /* CACHÉ par défaut */
  border: 1px solid #D4AF37;  /* Couleur Aurum */
  border-left: 3px solid #D4AF37;
  background: #fffaf0;     /* Beige chaud */
}

.spec-custom-key:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);  /* Glow effect */
}
```

### `.spec-value` - L'Input Valeur

```css
.spec-value {
  flex: 1;                 /* Prend le reste de l'espace disponible */
}
```

### `.remove-spec` - Le Bouton Trash

```css
.remove-spec {
  flex-shrink: 0;          /* Ne pas rétrécir */
  width: 38px;             /* Carré parfait */
  height: 38px;
  background: #fee2e2;     /* Fond rouge clair */
  border: 1px solid #fecaca;
  color: #dc2626;          /* Texte rouge */
  cursor: pointer;
  transition: all 0.2s;
}

.remove-spec:hover {
  background: #fecaca;
  transform: scale(1.05);  /* Grossir au hover */
}
```

---

## 🧮 Flex Layout - Détail

### Répartition de l'Espace dans `.spec-row`

```
Total Width: 100%
├─ .spec-key-wrapper (35%)          [select + custom input]
├─ .spec-value (flex: 1)            [input texte]
└─ .remove-spec (38px + gaps)       [bouton trash]

Exemple: Width = 600px
├─ 210px (35%)     → Select ou custom
│  ├─ Select: flex 1 (185px)
│  ├─ Custom (hidden): display none
├─ ~220px (flex: 1) → Value input
├─ 12px (gap)       → Gap droite
└─ 38px             → Bouton
```

### Flex Layout à l'Intérieur du Wrapper

```
.spec-key-wrapper Width: 210px

Cas 1: Option Standard (custom hidden)
├─ Select (flex: 1)   → 210px - (8px gap)
└─ Custom (display: none)

Cas 2: Option "Autre" (custom visible)
├─ Select (flex: 0 0 auto)    → ~60px (sa taille propre)
├─ 8px gap
└─ Custom (flex: 1)           → 210px - 60px - 8px = ~142px
```

---

## 📊 Événements et État

### HTMLSelectElement.addEventListener('change')

Quand le vendeur change de sélection:

```javascript
select.addEventListener('change', function(event) {
    // Event object
    event.type              → "change"
    event.target            → Le select
    event.target.value      → La nouvelle valeur
    
    // Appelle handleSpecKeyChange()
    handleSpecKeyChange(this, rowElement);
});
```

### handleSpecKeyChange() Logique

```javascript
if (value === 'custom') {
    // Montrer custom input
    customInput.style.display = 'block';
    customInput.focus();
    selectElement.style.flex = '0 0 auto';  // Rétrécir
} else {
    // Cacher custom input
    customInput.style.display = 'none';
    customInput.value = '';
    selectElement.style.flex = '1';  // Reprendre l'espace
}
```

---

## 🎨 Thème Couleurs Aurum

| Élément | Couleur | Contexte |
|---------|---------|----------|
| Select border (focus) | `#D4AF37` | Gold/Aurum |
| Custom input border | `#D4AF37` | Couleur signature |
| Custom input bg | `#fffaf0` | Beige chaud |
| Custom input placeholder | `#D4AF37` | Italic + colored |
| Custom input glow | `rgba(212, 175, 55, 0.15)` | Subtle halo |
| Option "Autre" text | `#D4AF37` | Bold et prominente |
| Delete button bg | `#fee2e2` | Rouge léger |
| Delete button text | `#dc2626` | Rouge foncé |

---

## 🔗 Intégration dans seller.html

Même si vous n'avez pas modifié seller.html, voici comment ça s'intègre:

```html
<!-- Dans seller.html -->
<div style="border-left: 4px solid #f97316; padding-left: 16px;">
    <h3>🛠️ Caractéristiques Techniques (Optionnel)</h3>
    
    <!-- Container où les lignes sont injectées -->
    <div id="specs-container" style="display: flex; flex-direction: column;"></div>
    
    <!-- Bouton pour ajouter des lignes -->
    <button onclick="addSpecRow()" class="btn-secondary">+ Ajouter</button>
</div>

<!-- JavaScript (dans admin.js) injecte ici: -->
<script>
window.initSpecifications();  // Ajoute 1 première ligne
// → Crée la première div.spec-row dans specs-container
</script>
```

---

**Version:** 2.0  
**Dernière mise à jour:** Février 2026  
**Status:** ✅ Production Ready
