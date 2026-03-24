/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ShopRepository.js — Repository Pattern pour les Boutiques
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

class ShopRepository {
  constructor(db) {
    this.db = db;
    this._listeners = [];
    this._cache = new Map();
  }

  /**
   * Récupère une boutique par ID
   * @param {string} shopId
   */
  async getShopById(shopId) {
    if (!shopId) return null;

    // Vérifier le cache
    if (this._cache.has(shopId)) {
      return this._cache.get(shopId);
    }

    try {
      const doc = await this.db.collection('shops').doc(shopId).get();
      if (doc.exists) {
        const mapped = this._mapDoc(doc);
        this._cache.set(shopId, mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[ShopRepository] getShopById error:', err);
    }
    return null;
  }

  /**
   * Écoute les boutiques en temps réel (limité)
   * @param {Function} callback
   * @param {number} limit
   */
  onShopsChange(callback, limit = 50) {
    const unsubscribe = this.db.collection('shops')
      .limit(limit)
      .onSnapshot(
        snap => {
          const shops = snap.docs.map(d => {
            const mapped = this._mapDoc(d);
            this._cache.set(d.id, mapped);
            return mapped;
          });
          if (callback) callback(shops);
        },
        err => console.error('[ShopRepository] onShopsChange error:', err)
      );

    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Récupère les boutiques d'une catégorie
   * @param {string} category
   */
  async getShopsByCategory(category, limit = 50) {
    try {
      const snap = await this.db.collection('shops')
        .where('category', '==', category)
        .limit(limit)
        .get();
      return snap.docs.map(d => this._mapDoc(d));
    } catch (err) {
      console.error('[ShopRepository] getShopsByCategory error:', err);
      return [];
    }
  }

  /**
   * Crée une nouvelle boutique
   * @param {Object} shopData
   */
  async createShop(shopData) {
    try {
      const docRef = await this.db.collection('shops').add({
        ...shopData,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return { id: docRef.id, ...shopData };
    } catch (err) {
      console.error('[ShopRepository] createShop error:', err);
      throw err;
    }
  }

  /**
   * Met à jour une boutique
   * @param {string} shopId
   * @param {Object} updates
   */
  async updateShop(shopId, updates) {
    try {
      await this.db.collection('shops').doc(shopId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      const cached = this._cache.get(shopId);
      if (cached) {
        this._cache.set(shopId, { ...cached, ...updates });
      }
    } catch (err) {
      console.error('[ShopRepository] updateShop error:', err);
      throw err;
    }
  }

  /**
   * Supprime une boutique
   * @param {string} shopId
   */
  async deleteShop(shopId) {
    try {
      await this.db.collection('shops').doc(shopId).delete();
      this._cache.delete(shopId);
    } catch (err) {
      console.error('[ShopRepository] deleteShop error:', err);
      throw err;
    }
  }

  /**
   * Map un document Firestore
   * @private
   */
  _mapDoc(doc) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this._cache.clear();
  }

  /**
   * Cleanup
   */
  cleanup() {
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (err) { console.warn('[ShopRepository] Unsubscribe error:', err); }
    });
    this._listeners = [];
    this._cache.clear();
  }
}

if (typeof window !== 'undefined') {
  window.ShopRepository = ShopRepository;
}
