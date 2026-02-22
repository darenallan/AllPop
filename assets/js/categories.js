/**
 * ═════════════════════════════════════════════════════════════════════════════
 * AURUM CATEGORIES - Système de catégories en cascade
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Dictionnaire de données stricte pour la marketplace Aurum
 * Structure: Catégorie > Sous-catégorie > Sous-sous-catégories
 * 
 * @version 1.0
 * @author Aurum Development Team
 */

(function() {
  'use strict';

  // ═════════════════════════════════════════════════════════════════════════
  // DICTIONNAIRE DE DONNÉES (STRICTEMENT RESPECTÉ)
  // ═════════════════════════════════════════════════════════════════════════
  
  window.aurumCategories = {
    "Mode": {
      "Homme": ["T-shirts", "Chemises", "Pantalons", "Jeans", "Vestes & Manteaux", "Chaussures", "Sous-vêtements", "Accessoires"],
      "Femme": ["Robes", "Tops", "Pantalons", "Jupes", "Vestes & Manteaux", "Chaussures", "Sacs", "Bijoux", "Accessoires"],
      "Enfant": ["Bébé", "Fille", "Garçon"]
    },
    "Électronique": {
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
    "Beauté & Santé": {
      "Maquillage": [],
      "Soins du visage": [],
      "Soins du corps": [],
      "Parfums": [],
      "Produits capillaires": [],
      "Rasage": [],
      "Compléments alimentaires": [],
      "Autre": []
    },
    "High-Tech & Gadgets": {
      "Accessoires innovants": [],
      "Gadgets tech": [],
      "Smart home": [],
      "Drones": [],
      "Sécurité & surveillance": []
    },
    "Jeux, Jouets & Bébé": {
      "Jouets éducatifs": [],
      "Jeux de société": [],
      "Figurines": [],
      "Poussettes": [],
      "Articles bébé": []
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // SYSTÈME DE SÉLECTION EN CASCADE (POUR FORMULAIRE VENDEUR)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Initialise le système de sélection en cascade pour le formulaire produit
   * @param {Object} options - Configuration {
   *   mainCategoryId: 'p-cat-main',
   *   subCategoryId: 'p-cat-sub',
   *   subSubCategoryId: 'p-cat-subsub',
   *   containerId: 'category-cascade-container'
   * }
   */
  window.initCategoryCascade = function(options) {
    const defaults = {
      mainCategoryId: 'p-cat-main',
      subCategoryId: 'p-cat-sub',
      subSubCategoryId: 'p-cat-subsub',
      containerId: 'category-cascade-container'
    };

    const config = { ...defaults, ...options };

    // Créer le conteneur HTML si nécessaire
    const container = document.getElementById(config.containerId);
    if (!container) {
      console.error('Conteneur de catégories introuvable:', config.containerId);
      return;
    }

    // Générer le HTML des 3 selects
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
        <div>
          <label>Catégorie principale <span style="color: red;">*</span></label>
          <select class="input" id="${config.mainCategoryId}" required>
            <option value="">-- Sélectionner --</option>
          </select>
        </div>
        <div id="sub-category-wrapper" style="display: none;">
          <label>Sous-catégorie <span style="color: red;">*</span></label>
          <select class="input" id="${config.subCategoryId}" required disabled>
            <option value="">-- Sélectionner d'abord --</option>
          </select>
        </div>
        <div id="subsub-category-wrapper" style="display: none;">
          <label>Type de produit</label>
          <select class="input" id="${config.subSubCategoryId}" disabled>
            <option value="">-- Optionnel --</option>
          </select>
        </div>
      </div>
    `;

    const mainSelect = document.getElementById(config.mainCategoryId);
    const subSelect = document.getElementById(config.subCategoryId);
    const subSubSelect = document.getElementById(config.subSubCategoryId);

    const subWrapper = document.getElementById('sub-category-wrapper');
    const subSubWrapper = document.getElementById('subsub-category-wrapper');

    // Remplir la catégorie principale
    populateMainCategories(mainSelect);

    // Gestion des changements - Catégorie principale
    mainSelect.addEventListener('change', function() {
      const selectedMain = this.value;

      // Réinitialiser les selects enfants
      subSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
      subSelect.disabled = true;
      subSubSelect.innerHTML = '<option value="">-- Optionnel --</option>';
      subSubSelect.disabled = true;
      subWrapper.style.display = 'none';
      subSubWrapper.style.display = 'none';

      if (selectedMain && window.aurumCategories[selectedMain]) {
        // Remplir les sous-catégories
        populateSubCategories(subSelect, selectedMain);
        subSelect.disabled = false;
        subWrapper.style.display = 'block';
      }
    });

    // Gestion des changements - Sous-catégorie
    subSelect.addEventListener('change', function() {
      const selectedMain = mainSelect.value;
      const selectedSub = this.value;

      // Réinitialiser le select enfant
      subSubSelect.innerHTML = '<option value="">-- Optionnel --</option>';
      subSubSelect.disabled = true;
      subSubWrapper.style.display = 'none';

      if (selectedSub && window.aurumCategories[selectedMain][selectedSub]) {
        const subSubCategories = window.aurumCategories[selectedMain][selectedSub];

        if (subSubCategories.length > 0) {
          // Remplir les sous-sous-catégories
          populateSubSubCategories(subSubSelect, selectedMain, selectedSub);
          subSubSelect.disabled = false;
          subSubWrapper.style.display = 'block';
        }
      }
    });

    console.log('✅ Système de catégories en cascade initialisé');
  };

  /**
   * Récupère la sélection complète du système en cascade
   * @returns {Object} { main, sub, subsub, fullPath }
   */
  window.getCategorySelection = function(options) {
    const defaults = {
      mainCategoryId: 'p-cat-main',
      subCategoryId: 'p-cat-sub',
      subSubCategoryId: 'p-cat-subsub'
    };

    const config = { ...defaults, ...options };

    const main = document.getElementById(config.mainCategoryId)?.value || '';
    const sub = document.getElementById(config.subCategoryId)?.value || '';
    const subsub = document.getElementById(config.subSubCategoryId)?.value || '';

    let fullPath = main;
    if (sub) fullPath += ' > ' + sub;
    if (subsub) fullPath += ' > ' + subsub;

    return {
      main: main,
      sub: sub,
      subsub: subsub,
      fullPath: fullPath
    };
  };

  // ═════════════════════════════════════════════════════════════════════════
  // FONCTIONS INTERNES
  // ═════════════════════════════════════════════════════════════════════════

  function populateMainCategories(selectElement) {
    const categories = Object.keys(window.aurumCategories);
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      selectElement.appendChild(option);
    });
  }

  function populateSubCategories(selectElement, mainCategory) {
    const subCategories = Object.keys(window.aurumCategories[mainCategory]);
    subCategories.forEach(subCat => {
      const option = document.createElement('option');
      option.value = subCat;
      option.textContent = subCat;
      selectElement.appendChild(option);
    });
  }

  function populateSubSubCategories(selectElement, mainCategory, subCategory) {
    const subSubCategories = window.aurumCategories[mainCategory][subCategory];
    subSubCategories.forEach(subSubCat => {
      const option = document.createElement('option');
      option.value = subSubCat;
      option.textContent = subSubCat;
      selectElement.appendChild(option);
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SYSTÈME DE FILTRES (POUR PAGE CATALOGUE)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Génère les filtres de catégories pour la page catalogue
   * @param {string} containerId - ID du conteneur où injecter les filtres
   */
  window.renderCategoryFilters = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Conteneur de filtres introuvable:', containerId);
      return;
    }

    let html = '';

    // Parcourir toutes les catégories
    Object.keys(window.aurumCategories).forEach(mainCat => {
      html += `
        <div class="category-filter-group" style="margin-bottom: 16px;">
          <div class="filter-checkbox" style="font-weight: 600; margin-bottom: 8px;">
            <input type="checkbox" id="cat-main-${sanitizeId(mainCat)}" value="${mainCat}" data-level="main" onchange="toggleCategoryGroup(this)">
            <label for="cat-main-${sanitizeId(mainCat)}">
              <span>${mainCat}</span>
            </label>
          </div>
          <div class="category-sub-group" id="group-${sanitizeId(mainCat)}" style="margin-left: 20px; display: none;">
      `;

      // Parcourir les sous-catégories
      Object.keys(window.aurumCategories[mainCat]).forEach(subCat => {
        const subSubCategories = window.aurumCategories[mainCat][subCat];
        
        html += `
          <div class="filter-checkbox" style="margin-bottom: 6px;">
            <input type="checkbox" id="cat-sub-${sanitizeId(mainCat)}-${sanitizeId(subCat)}" value="${mainCat} > ${subCat}" data-level="sub" data-main="${mainCat}" onchange="toggleSubCategoryGroup(this)">
            <label for="cat-sub-${sanitizeId(mainCat)}-${sanitizeId(subCat)}">
              <span style="font-size: 13px;">${subCat}</span>
            </label>
          </div>
        `;

        // Si sous-sous-catégories existent
        if (subSubCategories.length > 0) {
          html += `<div id="group-sub-${sanitizeId(mainCat)}-${sanitizeId(subCat)}" style="margin-left: 16px; font-size: 12px; color: #666; display: none;">`;
          subSubCategories.forEach(subSubCat => {
            html += `
              <div class="filter-checkbox" style="margin-bottom: 4px;">
                <input type="checkbox" id="cat-subsub-${sanitizeId(mainCat)}-${sanitizeId(subCat)}-${sanitizeId(subSubCat)}" value="${mainCat} > ${subCat} > ${subSubCat}" data-level="subsub" data-main="${mainCat}" data-sub="${subCat}">
                <label for="cat-subsub-${sanitizeId(mainCat)}-${sanitizeId(subCat)}-${sanitizeId(subSubCat)}">
                  <span>${subSubCat}</span>
                </label>
              </div>
            `;
          });
          html += `</div>`;
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    console.log('✅ Filtres de catégories générés');
  };

  /**
   * Toggle l'affichage d'un groupe de sous-catégories
   */
  window.toggleCategoryGroup = function(checkbox) {
    const mainCat = checkbox.value;
    const group = document.getElementById('group-' + sanitizeId(mainCat));
    
    if (group) {
      group.style.display = checkbox.checked ? 'block' : 'none';
      
      // Si décoché, décocher aussi tous les enfants
      if (!checkbox.checked) {
        const childCheckboxes = group.querySelectorAll('input[type="checkbox"]');
        childCheckboxes.forEach(cb => cb.checked = false);

        const subGroups = group.querySelectorAll('[id^="group-sub-"]');
        subGroups.forEach(subGroup => {
          subGroup.style.display = 'none';
        });
      }
    }
  };

  /**
   * Toggle l'affichage d'un groupe de sous-sous-catégories
   */
  window.toggleSubCategoryGroup = function(checkbox) {
    const mainCat = checkbox.dataset.main;
    const subCat = checkbox.value.split(' > ')[1] || '';
    const group = document.getElementById('group-sub-' + sanitizeId(mainCat) + '-' + sanitizeId(subCat));

    if (group) {
      group.style.display = checkbox.checked ? 'block' : 'none';

      if (!checkbox.checked) {
        const childCheckboxes = group.querySelectorAll('input[type="checkbox"]');
        childCheckboxes.forEach(cb => cb.checked = false);
      }
    }
  };

  /**
   * Récupère les catégories sélectionnées dans les filtres
   * @returns {Array} Liste des catégories sélectionnées ["Mode > Homme > T-shirts", ...]
   */
  window.getSelectedCategoryFilters = function() {
    const checkboxes = document.querySelectorAll('#category-filters-dynamic input[type="checkbox"]:checked');
    const selected = [];
    
    checkboxes.forEach(cb => {
      selected.push(cb.value);
    });
    
    return selected;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═════════════════════════════════════════════════════════════════════════

  function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  console.log('✅ categories.js chargé - Dictionnaire Aurum disponible');

})();
