// ========================================
// GESTION FORMULAIRE PRODUIT DYNAMIQUE
// ========================================

let productVariants = []; // Pour stocker les variants (Mode)

// Configuration des champs dynamiques selon la catégorie
function setupDynamicAttributes() {
    const catSelect = document.getElementById('p-cat');
    const container = document.getElementById('dynamic-fields');

    if (!catSelect || !container) return;

    catSelect.addEventListener('change', () => {
        const category = catSelect.value;
        container.innerHTML = '';
        productVariants = []; // Reset variants

        if (!category) return;

        // Wrapper pour les champs dynamiques
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'border-left: 4px solid #f59e0b; padding-left: 16px; margin-bottom: 24px;';
        wrapper.innerHTML = '<h3 style="margin-top: 0; color: #333;">⚙️ Spécifications</h3>';

        if (category === 'Beauté & Hygiène') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Type de produit</label>
                        <select class="input" id="spec-beauty-type">
                            <option value="">-- Sélectionner --</option>
                            <option value="Soin visage">Soin visage</option>
                            <option value="Soin corps">Soin corps</option>
                            <option value="Maquillage">Maquillage</option>
                            <option value="Parfum">Parfum</option>
                            <option value="Hygiène">Hygiène</option>
                        </select>
                    </div>
                    <div>
                        <label>Date d'expiration</label>
                        <input type="date" class="input" id="spec-expiry-date">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label>Numéro de lot</label>
                        <input type="text" class="input" id="spec-batch-number" placeholder="Ex: LOT2024-001">
                    </div>
                    <div>
                        <label>Conditions de stockage</label>
                        <input type="text" class="input" id="spec-storage-conditions" placeholder="Ex: À l'abri de la lumière">
                    </div>
                </div>
            `;
        } else if (category === 'Mode & Vêtements') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Type</label>
                        <select class="input" id="spec-clothing-type">
                            <option value="">-- Sélectionner --</option>
                            <option value="Haut">Haut</option>
                            <option value="Bas">Bas</option>
                            <option value="Chaussure">Chaussure</option>
                            <option value="Accessoire">Accessoire</option>
                            <option value="Ensemble">Ensemble</option>
                        </select>
                    </div>
                    <div>
                        <label>Genre</label>
                        <select class="input" id="spec-gender">
                            <option value="">-- Sélectionner --</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Unisexe">Unisexe</option>
                            <option value="Enfant">Enfant</option>
                        </select>
                    </div>
                    <div>
                        <label>Matière</label>
                        <input type="text" class="input" id="spec-material" placeholder="Ex: Coton 100%">
                    </div>
                </div>
                
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px;">
                    <h4 style="margin-top: 0; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="layers" style="width: 18px; height: 18px;"></i> Variants (Taille / Couleur / Stock)
                    </h4>
                    <div style="display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr; gap: 8px; margin-bottom: 12px;">
                        <input type="text" class="input" id="variant-size" placeholder="Ex: M, L, XL" style="margin: 0;">
                        <input type="text" class="input" id="variant-color" placeholder="Ex: Bleu, Rouge" style="margin: 0;">
                        <input type="number" class="input" id="variant-qty" placeholder="Quantité" min="0" style="margin: 0;">
                        <button type="button" class="btn-gold" onclick="addVariant()" style="margin: 0; padding: 8px; font-size: 13px;">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                    <div id="variants-list" style="max-height: 200px; overflow-y: auto;"></div>
                    <p style="font-size: 12px; color: #666; margin: 8px 0 0 0;">
                        💡 Ajoutez plusieurs variants pour offrir différentes tailles/couleurs. Le stock global sera la somme des variants.
                    </p>
                </div>
            `;
        } else if (category === 'Électronique') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Marque</label>
                        <input type="text" class="input" id="spec-brand" placeholder="Ex: Samsung, Apple">
                    </div>
                    <div>
                        <label>Modèle</label>
                        <input type="text" class="input" id="spec-model" placeholder="Ex: Galaxy S21">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                    <div>
                        <label>État</label>
                        <select class="input" id="spec-condition">
                            <option value="Neuf">Neuf</option>
                            <option value="Reconditionné">Reconditionné</option>
                            <option value="Occasion">Occasion</option>
                        </select>
                    </div>
                    <div>
                        <label>Garantie (mois)</label>
                        <input type="number" class="input" id="spec-warranty" placeholder="Ex: 12" min="0">
                    </div>
                    <div>
                        <label>Numéro de série (optionnel)</label>
                        <input type="text" class="input" id="spec-serial" placeholder="Ex: SN12345">
                    </div>
                </div>
            `;
        } else if (category === 'Maison & Déco') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Dimensions (L x l x h)</label>
                        <input type="text" class="input" id="spec-dimensions" placeholder="Ex: 120 x 80 x 45 cm">
                    </div>
                    <div>
                        <label>Poids (kg)</label>
                        <input type="number" class="input" id="spec-weight" placeholder="Ex: 5.5" step="0.1" min="0">
                    </div>
                </div>
                <div>
                    <label>Assemblage requis ?</label>
                    <select class="input" id="spec-assembly">
                        <option value="Non">Non</option>
                        <option value="Oui">Oui</option>
                    </select>
                </div>
            `;
        } else if (category === 'Services Digitaux') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Type de licence</label>
                        <select class="input" id="spec-license-type">
                            <option value="Unique">Unique</option>
                            <option value="Multi-utilisateur">Multi-utilisateur</option>
                            <option value="Abonnement">Abonnement</option>
                        </select>
                    </div>
                    <div>
                        <label>Durée validité (jours)</label>
                        <input type="number" class="input" id="spec-validity" placeholder="Ex: 365" min="1">
                    </div>
                </div>
                <div>
                    <label>Lien de téléchargement / Accès</label>
                    <input type="url" class="input" id="spec-download-link" placeholder="https://...">
                </div>
                <p style="font-size: 12px; color: #f59e0b; margin: 8px 0 0 0;">
                    ⚠️ Les champs de livraison seront masqués pour les services digitaux lors de la commande.
                </p>
            `;
        } else if (category === 'Véhicules') {
            wrapper.innerHTML += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label>Marque</label>
                        <input type="text" class="input" id="spec-vehicle-brand" placeholder="Ex: Toyota">
                    </div>
                    <div>
                        <label>Année</label>
                        <input type="number" class="input" id="spec-year" placeholder="Ex: 2020" min="1900" max="${new Date().getFullYear() + 1}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                    <div>
                        <label>Kilométrage</label>
                        <input type="number" class="input" id="spec-mileage" placeholder="Ex: 50000" min="0">
                    </div>
                    <div>
                        <label>VIN (optionnel)</label>
                        <input type="text" class="input" id="spec-vin" placeholder="Ex: 1HGBH41...">
                    </div>
                    <div>
                        <label>État</label>
                        <select class="input" id="spec-vehicle-condition">
                            <option value="Neuf">Neuf</option>
                            <option value="Occasion">Occasion</option>
                            <option value="À réparer">À réparer</option>
                        </select>
                    </div>
                </div>
            `;
        }

        container.appendChild(wrapper);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

// Gestion des variants pour la mode
window.addVariant = function() {
    const size = document.getElementById('variant-size')?.value.trim();
    const color = document.getElementById('variant-color')?.value.trim();
    const qty = Number(document.getElementById('variant-qty')?.value || 0);

    if (!size || !color || qty <= 0) {
        alert('❌ Veuillez remplir tous les champs du variant (taille, couleur, quantité)');
        return;
    }

    productVariants.push({ size, color, qty });
    
    // Clear inputs
    document.getElementById('variant-size').value = '';
    document.getElementById('variant-color').value = '';
    document.getElementById('variant-qty').value = '';

    renderVariantsList();
};

function renderVariantsList() {
    const list = document.getElementById('variants-list');
    if (!list) return;

    if (productVariants.length === 0) {
        list.innerHTML = '<p style="font-size: 13px; color: #999; text-align: center; padding: 12px;">Aucun variant ajouté</p>';
        return;
    }

    list.innerHTML = productVariants.map((v, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 6px;">
            <span style="font-size: 13px;">
                <strong>${v.size}</strong> • ${v.color} • <span style="color: #10b981;">${v.qty} unités</span>
            </span>
            <button type="button" onclick="removeVariant(${idx})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                ✕
            </button>
        </div>
    `).join('');
}

window.removeVariant = function(idx) {
    productVariants.splice(idx, 1);
    renderVariantsList();
};

// Collecter les specs selon la catégorie
function collectProductSpecs() {
    const category = document.getElementById('p-cat')?.value;
    if (!category) return null;

    const specs = {};

    if (category === 'Beauté & Hygiène') {
        const beautyType = document.getElementById('spec-beauty-type')?.value;
        if (beautyType) specs.type = beautyType;
        
        const expiryDate = document.getElementById('spec-expiry-date')?.value;
        if (expiryDate) specs.expiryDate = expiryDate;
        
        const batchNumber = document.getElementById('spec-batch-number')?.value;
        if (batchNumber) specs.batchNumber = batchNumber;
        
        const storageConditions = document.getElementById('spec-storage-conditions')?.value;
        if (storageConditions) specs.storageConditions = storageConditions;

    } else if (category === 'Mode & Vêtements') {
        const clothingType = document.getElementById('spec-clothing-type')?.value;
        if (clothingType) specs.type = clothingType;
        
        const gender = document.getElementById('spec-gender')?.value;
        if (gender) specs.gender = gender;
        
        const material = document.getElementById('spec-material')?.value;
        if (material) specs.material = material;

    } else if (category === 'Électronique') {
        const brand = document.getElementById('spec-brand')?.value;
        if (brand) specs.brand = brand;
        
        const model = document.getElementById('spec-model')?.value;
        if (model) specs.model = model;
        
        const condition = document.getElementById('spec-condition')?.value;
        if (condition) specs.condition = condition;
        
        const warranty = document.getElementById('spec-warranty')?.value;
        if (warranty) specs.warranty = Number(warranty);
        
        const serial = document.getElementById('spec-serial')?.value;
        if (serial) specs.serial = serial;

    } else if (category === 'Maison & Déco') {
        const dimensions = document.getElementById('spec-dimensions')?.value;
        if (dimensions) specs.dimensions = dimensions;
        
        const weight = document.getElementById('spec-weight')?.value;
        if (weight) specs.weight = Number(weight);
        
        const assembly = document.getElementById('spec-assembly')?.value;
        if (assembly) specs.assembly = assembly === 'Oui';

    } else if (category === 'Services Digitaux') {
        const licenseType = document.getElementById('spec-license-type')?.value;
        if (licenseType) specs.licenseType = licenseType;
        
        const validity = document.getElementById('spec-validity')?.value;
        if (validity) specs.validity = Number(validity);
        
        const downloadLink = document.getElementById('spec-download-link')?.value;
        if (downloadLink) specs.downloadLink = downloadLink;

    } else if (category === 'Véhicules') {
        const vehicleBrand = document.getElementById('spec-vehicle-brand')?.value;
        if (vehicleBrand) specs.brand = vehicleBrand;
        
        const year = document.getElementById('spec-year')?.value;
        if (year) specs.year = Number(year);
        
        const mileage = document.getElementById('spec-mileage')?.value;
        if (mileage) specs.mileage = Number(mileage);
        
        const vin = document.getElementById('spec-vin')?.value;
        if (vin) specs.vin = vin;
        
        const vehicleCondition = document.getElementById('spec-vehicle-condition')?.value;
        if (vehicleCondition) specs.condition = vehicleCondition;
    }

    return Object.keys(specs).length > 0 ? specs : null;
}

// Collecter toutes les données produit pour Firebase
function collectProductData(myShop) {
    const name = document.getElementById('p-name').value.trim();
    const price = Number(document.getElementById('p-price').value);
    const desc = document.getElementById('p-desc').value.trim();
    const category = document.getElementById('p-cat').value;
    const sku = document.getElementById('p-sku').value.trim();
    const stock = Number(document.getElementById('p-stock').value);
    const minStock = Number(document.getElementById('p-min-stock').value || 5);

    if (!name || !price || !desc || !category || !sku) {
        alert('❌ Veuillez remplir tous les champs obligatoires');
        return null;
    }

    if (productImages.length === 0) {
        alert('❌ Veuillez ajouter au moins une image produit');
        return null;
    }

    const mainImage = productImages[0];
    const specs = collectProductSpecs();

    const productData = {
        shopId: myShop.id,
        shopName: myShop.name,
        name,
        price,
        description: desc,
        category,
        image: mainImage,
        images: productImages,
        sku,
        stockLevel: stock,
        minStockAlert: minStock,
        createdAt: new Date()
    };

    // Ajouter les specs si présentes
    if (specs) {
        productData.specs = specs;
    }

    // Ajouter les variants si c'est de la mode
    if (category === 'Mode & Vêtements' && productVariants.length > 0) {
        productData.variants = productVariants;
        // Recalculer le stock total basé sur les variants
        productData.stockLevel = productVariants.reduce((sum, v) => sum + v.qty, 0);
    }

    return productData;
}
