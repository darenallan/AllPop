/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — data.js  (Données de démonstration)
 * ═══════════════════════════════════════════════════════════════
 * ⚠️  Ce fichier contient des données fictives pour le développement.
 *     Il NE doit PAS être chargé en production.
 *     Pour désactiver : supprimez le <script src="data.js"> de vos pages
 *     ou ajoutez data-env="dev" sur la balise script.
 *
 * En production, toutes les données proviennent de Firestore via config.js.
 * window.Store est hydraté ici uniquement pour le développement local.
 * ═══════════════════════════════════════════════════════════════
 */

// Guard : ne rien faire en production (détecter via hostname)
(function () {
  'use strict';

  const isProd = !['localhost','127.0.0.1',''].includes(window.location.hostname)
              && !window.location.hostname.startsWith('192.168.');

  if (isProd) {
    console.log('[data.js] Production détectée — données de démo désactivées.');
    return;
  }

  console.log('[data.js] Mode développement — données de démo actives.');

  // ── VERSION ────────────────────────────────────────────────────
  const DATA_VERSION = 13;
  const stored = parseInt(localStorage.getItem('ac_data_version') || '0', 10);
  if (stored < DATA_VERSION) {
    ['ac_products','ac_shops','ac_invoices','ac_restaurants'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('ac_data_version', String(DATA_VERSION));
  }

  // ── STORE ──────────────────────────────────────────────────────
  // On réutilise window.Store créé par config.js, ou on le crée si data.js
  // est chargé avant config.js (cas de test).
  if (!window.Store) window.Store = {};
  const S = window.Store;
  S.users     = JSON.parse(localStorage.getItem('ac_users')    || '[]');
  S.shops     = JSON.parse(localStorage.getItem('ac_shops')    || '[]');
  S.products  = JSON.parse(localStorage.getItem('ac_products') || '[]');
  S.orders    = JSON.parse(localStorage.getItem('ac_orders')   || '[]');
  S.promos    = JSON.parse(localStorage.getItem('ac_promos')   || '[{"code":"AURUM10","percent":10,"expires":' + (Date.now() + 7 * 86400000) + '}]');

  // Catégories synchronisées avec categories.js
  S.categories = [
    'Mode', 'Électronique', 'Beauté & Santé', 'Maison & Décoration',
    'Alimentation', 'Bâtiment & Matériaux', 'Véhicules & Mobilité',
    'High-Tech & Gadgets', 'Services',
  ];

  // ── INITIALISATION DÉMO ────────────────────────────────────────
  if (!S.users.length) {
    S.users = [
      { email: 'aurumcorporate.d@gmail.com', role: 'superadmin', name: 'Super Admin' },
      { email: 'vente.lll@gmail.com',        role: 'seller',     name: 'Vendeur Démo', shop: 'demo-shop' },
      { email: 'client.add@gmail.com',       role: 'client',     name: 'Client Démo' },
    ];
    localStorage.setItem('ac_users', JSON.stringify(S.users));
  }

  if (!S.shops.length) {
    const now = Date.now();
    S.shops = [{
      id: 'demo-shop', name: 'Boutique Démo Aurum',
      description: 'Boutique de démonstration',
      category: 'Mode', ownerEmail: 'vente.lll@gmail.com',
      startDate: now, endDate: now + 30 * 86400000,
      itemLimit: 50, status: 'active',
    }];
    localStorage.setItem('ac_shops', JSON.stringify(S.shops));
  }

  if (!S.products.length) {
    // 8 produits factices minimalistes
    const IMG = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
    S.products = Array.from({ length: 8 }, (_, i) => ({
      id:       'P' + (i + 1),
      name:     ['T-Shirt Premium', 'Chemise Élégante', 'Jean Slim', 'Veste Urbaine',
                 'Robe Chic', 'Sac Bandoulière', 'Sneakers Gold', 'Blouson Cuir'][i],
      price:    [12500, 18900, 22500, 35000, 28000, 15000, 42000, 89000][i],
      stock:    10 + i * 3,
      category: 'Mode',
      images:   [IMG],
      shopId:   'demo-shop',
      rating:   (4.5 + Math.random() * 0.4).toFixed(1),
      views:    Math.floor(Math.random() * 500),
      sales:    Math.floor(Math.random() * 60),
    }));
    localStorage.setItem('ac_products', JSON.stringify(S.products));
  }

  if (!S.orders.length) {
    S.orders = [{
      id: 'O' + Date.now(),
      userEmail: 'client.add@gmail.com',
      date: Date.now() - 86400000,
      status: 'paid',
      items: [{ pid: 'P1', name: 'T-Shirt Premium', price: 12500, qty: 1 }],
      subtotal: 12500, discount: 0, shipping: 0, total: 12500,
    }];
    localStorage.setItem('ac_orders', JSON.stringify(S.orders));
  }

  // ── saveStore helper ────────────────────────────────────────────
  window.saveStore = function () {
    localStorage.setItem('ac_users',    JSON.stringify(S.users));
    localStorage.setItem('ac_shops',    JSON.stringify(S.shops));
    localStorage.setItem('ac_products', JSON.stringify(S.products));
    localStorage.setItem('ac_orders',   JSON.stringify(S.orders));
    localStorage.setItem('ac_promos',   JSON.stringify(S.promos));
  };

  console.log('[data.js] Store local initialisé :', S.products.length, 'produits,', S.shops.length, 'boutiques.');
})();