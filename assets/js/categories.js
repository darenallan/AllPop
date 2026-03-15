/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — categories.js  v2
 * Dictionnaire des catégories + système de sélection en cascade
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // ── DICTIONNAIRE ────────────────────────────────────────────────
  window.aurumCategories = {
    'Mode': {
      'Homme':  ['T-shirts', 'Chemises', 'Pantalons', 'Jeans', 'Vestes & Manteaux', 'Chaussures', 'Sous-vêtements', 'Accessoires'],
      'Femme':  ['Robes', 'Tops', 'Pantalons', 'Jupes', 'Vestes & Manteaux', 'Chaussures', 'Sacs', 'Bijoux', 'Accessoires'],
      'Enfant': ['Fille', 'Garçon', 'Bébé'],
      'Accessoires': ['Ceintures', 'Chapeaux', 'Lunettes', 'Bijoux', 'Montres'],
    },
    'Électronique': {
      'Téléphones & Smartphones': [],
      'Accessoires Téléphones': [],
      'Ordinateurs & PC': [],
      'Tablettes': [],
      'TV & Audio': [],
      'Consoles & Jeux vidéo': [],
      'Montres connectées': [],
      'Appareils photo': [],
      'Accessoires informatiques': [],
      'Autre': [],
    },
    'Beauté & Santé': {
      'Maquillage': [],
      'Soins du visage': [],
      'Soins du corps': [],
      'Parfums': [],
      'Produits capillaires': [],
      'Rasage & Épilation': [],
      'Compléments alimentaires': [],
      'Autre': [],
    },
    'Maison & Décoration': {
      'Meubles': ['Canapé & Fauteuil', 'Lit & Matelas', 'Table & Chaise', 'Rangement'],
      'Luminaires': [],
      'Décoration': [],
      'Cuisine & Arts de la table': [],
      'Salle de bain': [],
      'Jardin & Extérieur': [],
    },
    'Alimentation': {
      'Épicerie': [],
      'Boissons': [],
      'Produits frais': [],
      'Surgelés': [],
    },
    'Bâtiment & Matériaux': {
      'Ciment & Béton': [],
      'Fer & Métaux': [],
      'Bois & Menuiserie': [],
      'Peinture & Revêtement': [],
      'Plomberie': [],
      'Électricité': [],
      'Outillage': [],
      'Carrelage & Sols': [],
    },
    'Véhicules & Mobilité': {
      'Voitures': [],
      'Motos & Scooters': [],
      'Vélos': [],
      'Pièces détachées': [],
      'Accessoires auto': [],
    },
    'High-Tech & Gadgets': {
      'Smart Home': [],
      'Drones': [],
      'Gadgets innovants': [],
      'Sécurité': [],
    },
    'Services': {
      'Livraison': [],
      'Réparation': [],
      'Enseignement': [],
      'Autre': [],
    },
  };

  // ── MAPPING Boutique → Produits autorisés ───────────────────────
  window.shopCategoryToProductCategories = {
    'Mode & Vêtements':                         ['Mode'],
    'Mode & Accessoires':                        ['Mode'],
    'Beauté & Cosmétiques':                      ['Beauté & Santé'],
    'Beauté, Hygiène & Bien-être':               ['Beauté & Santé'],
    'Électronique':                              ['Électronique', 'High-Tech & Gadgets'],
    'Électronique, Téléphonie & Informatique':   ['Électronique', 'High-Tech & Gadgets'],
    'High-Tech & Gadgets':                       ['Électronique', 'High-Tech & Gadgets'],
    'Maison, Meubles & Décoration':              ['Maison & Décoration'],
    'Bâtiment, Quincaillerie & Matériaux':       ['Bâtiment & Matériaux'],
    'Véhicules & Mobilité':                      ['Véhicules & Mobilité'],
    'Alimentation & Épicerie':                   ['Alimentation'],
    'Restauration & Boissons':                   ['Alimentation'],
    'Général / Hypermarché':                     null, // null = toutes catégories
    'Général':                                   null,
    'Multimarques':                              null,
  };

  window.getAllowedProductCategories = function (shopCategory) {
    if (!shopCategory) return Object.keys(window.aurumCategories);
    const norm    = (shopCategory || '').trim();
    const mapping = window.shopCategoryToProductCategories;
    if (Object.prototype.hasOwnProperty.call(mapping, norm)) {
      return mapping[norm] || Object.keys(window.aurumCategories);
    }
    // Correspondance partielle
    for (const [key, val] of Object.entries(mapping)) {
      if (norm.includes(key) || key.includes(norm)) return val || Object.keys(window.aurumCategories);
    }
    return Object.keys(window.aurumCategories);
  };

  // ── SÉLECTION EN CASCADE ────────────────────────────────────────
  window.initCategoryCascade = function (options = {}) {
    const cfg = {
      mainCategoryId:    'p-cat-main',
      subCategoryId:     'p-cat-sub',
      subSubCategoryId:  'p-cat-subsub',
      containerId:       'category-cascade-container',
      allowedCategories: null,
      ...options,
    };

    const container = document.getElementById(cfg.containerId);
    if (!container) { console.error('[categories] Conteneur introuvable :', cfg.containerId); return; }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div>
          <label>Catégorie principale <span style="color:#D94F4F">*</span></label>
          <select class="input" id="${cfg.mainCategoryId}" required>
            <option value="">— Sélectionner —</option>
          </select>
        </div>
        <div id="sub-wrap-${cfg.containerId}" style="display:none">
          <label>Sous-catégorie <span style="color:#D94F4F">*</span></label>
          <select class="input" id="${cfg.subCategoryId}" required disabled>
            <option value="">— Sélectionner d'abord —</option>
          </select>
        </div>
        <div id="subsub-wrap-${cfg.containerId}" style="display:none">
          <label>Type de produit</label>
          <select class="input" id="${cfg.subSubCategoryId}" disabled>
            <option value="">— Optionnel —</option>
          </select>
        </div>
      </div>`;

    const mainSel    = document.getElementById(cfg.mainCategoryId);
    const subSel     = document.getElementById(cfg.subCategoryId);
    const subSubSel  = document.getElementById(cfg.subSubCategoryId);
    const subWrap    = document.getElementById('sub-wrap-'    + cfg.containerId);
    const subSubWrap = document.getElementById('subsub-wrap-' + cfg.containerId);

    // Remplir catégories principales
    const allowed = cfg.allowedCategories || Object.keys(window.aurumCategories);
    allowed.forEach(cat => {
      if (window.aurumCategories[cat]) {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        mainSel.appendChild(opt);
      }
    });

    mainSel.addEventListener('change', function () {
      subSel.innerHTML   = '<option value="">— Sélectionner —</option>';
      subSel.disabled    = true;
      subSubSel.innerHTML = '<option value="">— Optionnel —</option>';
      subSubSel.disabled = true;
      subWrap.style.display    = 'none';
      subSubWrap.style.display = 'none';

      if (!this.value || !window.aurumCategories[this.value]) return;
      Object.keys(window.aurumCategories[this.value]).forEach(sub => {
        const opt = document.createElement('option'); opt.value = sub; opt.textContent = sub;
        subSel.appendChild(opt);
      });
      subSel.disabled         = false;
      subWrap.style.display   = 'block';
    });

    subSel.addEventListener('change', function () {
      subSubSel.innerHTML  = '<option value="">— Optionnel —</option>';
      subSubSel.disabled   = true;
      subSubWrap.style.display = 'none';

      const main  = mainSel.value;
      const sub   = this.value;
      if (!main || !sub) return;
      const items = window.aurumCategories[main]?.[sub] || [];
      if (!items.length) return;
      items.forEach(item => {
        const opt = document.createElement('option'); opt.value = item; opt.textContent = item;
        subSubSel.appendChild(opt);
      });
      subSubSel.disabled       = false;
      subSubWrap.style.display = 'block';
    });
  };

  window.getCategorySelection = function (options = {}) {
    const cfg = {
      mainCategoryId:   'p-cat-main',
      subCategoryId:    'p-cat-sub',
      subSubCategoryId: 'p-cat-subsub',
      ...options,
    };
    const main   = document.getElementById(cfg.mainCategoryId)?.value   || '';
    const sub    = document.getElementById(cfg.subCategoryId)?.value    || '';
    const subsub = document.getElementById(cfg.subSubCategoryId)?.value || '';
    let fullPath = main;
    if (sub)    fullPath += ' > ' + sub;
    if (subsub) fullPath += ' > ' + subsub;
    return { main, sub, subsub, fullPath };
  };

  // ── FILTRES CATALOGUE ────────────────────────────────────────────
  window.renderCategoryFilters = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.warn('[categories] Conteneur filtres introuvable :', containerId); return; }

    let html = '';
    Object.keys(window.aurumCategories).forEach(main => {
      const mainId = _sid(main);
      html += `
        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;gap:7px;font-weight:600;cursor:pointer">
            <input type="checkbox" id="cf-m-${mainId}" value="${main}" data-level="main" onchange="window.toggleCategoryGroup(this)">
            <span>${main}</span>
          </label>
          <div id="cf-g-${mainId}" style="margin-left:18px;display:none">`;

      Object.keys(window.aurumCategories[main]).forEach(sub => {
        const subId  = _sid(sub);
        const subSubs = window.aurumCategories[main][sub];
        html += `
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin:4px 0">
            <input type="checkbox" id="cf-s-${mainId}-${subId}" value="${main} > ${sub}" data-level="sub" data-main="${main}" onchange="window.toggleSubCategoryGroup(this)">
            <span>${sub}</span>
          </label>`;
        if (subSubs.length) {
          html += `<div id="cf-ss-${mainId}-${subId}" style="margin-left:14px;display:none">`;
          subSubs.forEach(ss => {
            html += `
              <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:#7A7570;cursor:pointer;margin:3px 0">
                <input type="checkbox" value="${main} > ${sub} > ${ss}">
                <span>${ss}</span>
              </label>`;
          });
          html += '</div>';
        }
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
  };

  window.toggleCategoryGroup = function (cb) {
    const el = document.getElementById('cf-g-' + _sid(cb.value));
    if (!el) return;
    el.style.display = cb.checked ? 'block' : 'none';
    if (!cb.checked) {
      el.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
      el.querySelectorAll('[id^="cf-ss-"]').forEach(g => { g.style.display = 'none'; });
    }
  };

  window.toggleSubCategoryGroup = function (cb) {
    const main = cb.dataset.main || '';
    const sub  = (cb.value.split(' > ')[1] || '').trim();
    const el   = document.getElementById('cf-ss-' + _sid(main) + '-' + _sid(sub));
    if (!el) return;
    el.style.display = cb.checked ? 'block' : 'none';
    if (!cb.checked) el.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
  };

  window.getSelectedCategoryFilters = function () {
    return Array.from(document.querySelectorAll(
      '#category-filters-dynamic input[type=checkbox]:checked'
    )).map(cb => cb.value);
  };

  // ── UTIL ────────────────────────────────────────────────────────
  function _sid(str) { return String(str).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(); }

  console.log('✅ categories.js v2 chargé');
})();