# Code d'Affichage - Spécifications Produit

## Pour product.html - Affichage des Spécifications

Ajouter cette section dans la page détail produit (`product.html`) pour afficher les spécifications sauvegardées.

---

## 📌 HTML à Ajouter

Insérer cette section après les infos principales (prix, description) et avant les boutons d'achat:

```html
<!-- Spécifications Techniques -->
<div id="product-specs" style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e9ecef;">
    <h3 style="margin-top: 0; margin-bottom: 16px; color: #333; font-size: 18px; font-weight: 600;">
        🛠️ Spécifications Techniques
    </h3>
    <div id="specs-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <!-- Les spécifications seront injectées ici dynamiquement -->
    </div>
</div>
```

---

## 🔧 JavaScript à Ajouter

Ajouter cette fonction pour afficher et compiler les spécifications:

```javascript
/**
 * Affiche les spécifications d'un produit
 * @param {Object} product - Document produit de Firestore
 */
function renderProductSpecifications(product) {
    const specsContainer = document.getElementById('specs-list');
    if (!specsContainer) return;

    // Vérifier si des spécifications existent
    const specs = product.specifications || {};
    
    // Si aucune spécification, masquer la section
    if (Object.keys(specs).length === 0) {
        const section = document.getElementById('product-specs');
        if (section) section.style.display = 'none';
        return;
    }

    // Générer les cartes de spécifications
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

/**
 * Échappe le HTML pour éviter les injections
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

---

## 🔗 Point d'Appel

Dans la fonction qui charge les détails du produit (généralement après avoir récupéré le document Firestore):

```javascript
// Exemple d'utilisation dans votre logique de chargement produit
window.db.collection('products').doc(productId).onSnapshot((doc) => {
    const product = doc.data();
    
    // Afficher le nom, prix, etc...
    document.getElementById('prod-name').textContent = product.name;
    
    // Afficher les spécifications ← NOUVEAU
    renderProductSpecifications(product);
    
    // Reste du code...
});
```

---

## 🎨 Styles Alternatifs

### Variante 1: Table (plus compact)
```html
<table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <tbody id="specs-table-body">
        <!-- Rempli par JS -->
    </tbody>
</table>

<script>
function renderProductSpecificationsTable(product) {
    const tbody = document.getElementById('specs-table-body');
    if (!tbody) return;

    const specs = product.specifications || {};
    
    tbody.innerHTML = Object.entries(specs).map(([key, value]) => `
        <tr style="border-bottom: 1px solid #e9ecef;">
            <td style="padding: 12px; font-weight: 600; color: #666; width: 35%;">${escapeHtml(key)}</td>
            <td style="padding: 12px; color: #333;">${escapeHtml(value)}</td>
        </tr>
    `).join('');
}
</script>
```

### Variante 2: Vertical (Mobile-friendly)
```html
<div id="specs-vertical" style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
    <!-- Rempli par JS -->
</div>

<script>
function renderProductSpecificationsVertical(product) {
    const container = document.getElementById('specs-vertical');
    if (!container) return;

    const specs = product.specifications || {};
    
    container.innerHTML = Object.entries(specs).map(([key, value]) => `
        <div style="border-left: 4px solid #D4AF37; padding-left: 12px;">
            <div style="font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
                ${escapeHtml(key)}
            </div>
            <div style="font-size: 16px; color: #333; font-weight: 500;">
                ${escapeHtml(value)}
            </div>
        </div>
    `).join('');
}
</script>
```

### Variante 3: Accords Collapsibles
```html
<div id="specs-accordion" style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
    <!-- Rempli par JS -->
</div>

<script>
function renderProductSpecificationsAccordion(product) {
    const container = document.getElementById('specs-accordion');
    if (!container) return;

    const specs = product.specifications || {};
    let html = '';
    let index = 0;

    Object.entries(specs).forEach(([key, value]) => {
        html += `
        <div style="border-bottom: 1px solid #e9ecef;">
            <button 
                onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';"
                style="width: 100%; text-align: left; padding: 14px 16px; background: #f8f9fa; border: none; cursor: pointer; 
                        font-weight: 600; color: #333; font-size: 14px; transition: background 0.2s;"
                onmouseover="this.style.background='#f0f1f3';"
                onmouseout="this.style.background='#f8f9fa';">
                ${escapeHtml(key)}
                <span style="float: right; font-size: 12px; opacity: 0.6;">▼</span>
            </button>
            <div style="display: ${index === 0 ? 'block' : 'none'}; padding: 14px 16px; background: #fff; color: #333;">
                ${escapeHtml(value)}
            </div>
        </div>
        `;
        index++;
    });

    container.innerHTML = html;
}
</script>
```

---

## 📊 Exemple Complet d'Intégration

```javascript
// Dans product.html - Fonction d'initialisation du produit
window.addEventListener('DOMContentLoaded', function() {
    const productId = getProductIdFromURL();

    if (!productId) {
        console.error('ID produit manquant');
        return;
    }

    // Charger le produit depuis Firestore
    window.db.collection('products').doc(productId).onSnapshot((doc) => {
        if (!doc.exists) {
            console.error('Produit non trouvé');
            return;
        }

        const product = { id: doc.id, ...doc.data() };

        // Afficher les informations principales
        document.getElementById('prod-name').textContent = product.name || 'Produit';
        document.getElementById('prod-price').textContent = `${product.price.toFixed(2)} €`;
        document.getElementById('prod-desc').textContent = product.description || '';

        // ← NOUVEAU: Afficher les spécifications
        renderProductSpecifications(product);

        // Galerie d'images
        if (product.images && product.images.length > 0) {
            renderProductGallery(product.images);
        }

        // Stock
        document.getElementById('prod-stock').textContent = product.stock || 0;

        // Reste du code...
    }, (error) => {
        console.error('Erreur chargement produit:', error);
    });
});

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

## 🎯 Checklist d'Intégration

- [ ] Ajouter HTML section specs dans product.html
- [ ] Ajouter fonction `renderProductSpecifications()`
- [ ] Ajouter fonction `escapeHtml()`
- [ ] Appeler `renderProductSpecifications(product)` dans la fonction de chargement
- [ ] Tester avec un produit ayant des specs
- [ ] Tester avec un produit sans specs (section masquée?)
- [ ] Vérifier affichage sur mobile
- [ ] Vérifier XSS (escapeHtml fonctionne?)

---

## 📝 Notes

- ✅ Les spécifications sont **optionnelles** (produits sans specs ne posent pas problème)
- ✅ Format **flexbox** s'adapte au nombre de specs
- ✅ Design **Aurum** cohérent (couleurs, espacements)
- ✅ Fonction `escapeHtml()` évite **injections XSS**
- ⚠️ Si vous modifiez `renderProductSpecifications()`, testez aussi les anciennes données

---

**Version**: 1.0  
**Date**: Février 2026
