/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ProductRepository.js — Repository Pattern pour les Produits
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Isole la logique Firestore des produits pour permettre:
 *   1. Migration future vers PostgreSQL/API REST
 *   2. Cache et optimisations transparentes  
 *   3. Testing mockable
 *   4. Pagination cohérente
 *   5. Cleanup automatique des listeners
 *
 * À charger APRÈS config.js et firebase SDK.
 */

'use strict';

class ProductRepository {
  constructor(db) {
    this.db = db;
    this._listeners = [];       // Pour cleanup automatique
    this._cache = new Map();    // Cache optionnel par ID
    this._lastQuery = null;     // Pour pagination continue
  }

  /**
   * Récupère les produits avec pagination
   * @param {number} limit - Nombre de produits par page
   * @param {DocumentSnapshot} startAfter - Dernier doc de la page précédente (pour pagination)
   * @returns {Promise<{docs: Array, lastVis: DocumentSnapshot, hasMore: boolean}>}
   */
  async getProductsPaginated(limit = 20, startAfter = null) {
    try {
      let query = this.db.collection('products')
        .orderBy('createdAt', 'desc')
        .limit(limit + 1); // +1 pour détecter s'il y a plus
      
      if (startAfter) {
        query = query.startAfter(startAfter);
      }
      
      const snap = await query.get();
      const allDocs = snap.docs;
      
      // Vérifier s'il y a plus de résultats
      const hasMore = allDocs.length > limit;
      const docs = allDocs.slice(0, limit).map(d => this._mapDoc(d));
      const lastVis = allDocs[Math.min(limit - 1, allDocs.length - 1)];
      
      this._lastQuery = lastVis; // Sauvegarder pour la prochaine page
      
      return { docs, lastVis: hasMore ? lastVis : null, hasMore };
    } catch (err) {
      console.error('[ProductRepository] getProductsPaginated error:', err);
      throw err;
    }
  }

  /**
   * Récupère les produits avec listener temps réel (limité)
   * @param {Function} callback - Fonction appelée avec les docs à chaque changement
   * @param {number} limit - Nombre de produits à écouter
   * @returns {Function} unsubscribe - Fonction pour arrêter l'écoute
   */
  onProductsChange(callback, limit = 50) {
    if (typeof callback !== 'function') {
      console.error('[ProductRepository] onProductsChange: callback must be a function');
      return () => {};
    }

    const unsubscribe = this.db.collection('products')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snap => {
          try {
            const docs = snap.docs.map(d => {
              const mapped = this._mapDoc(d);
              this._cache.set(d.id, mapped); // Mettre en cache
              return mapped;
            });
            callback(docs);
          } catch (err) {
            console.error('[ProductRepository] onProductsChange callback error:', err);
          }
        },
        err => {
          console.error('[ProductRepository] onProductsChange listener error:', err);
        }
      );
    
    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Écoute les produits d'une boutique spécifique
   * @param {string} shopId - ID de la boutique
   * @param {Function} callback 
   * @param {number} limit 
   * @returns {Function} unsubscribe
   */
  onShopProductsChange(shopId, callback, limit = 100) {
    if (!shopId) {
      console.error('[ProductRepository] onShopProductsChange: shopId required');
      return () => {};
    }

    const unsubscribe = this.db.collection('products')
      .where('shopId', '==', shopId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snap => {
          const docs = snap.docs.map(d => {
            const mapped = this._mapDoc(d);
            this._cache.set(d.id, mapped);
            return mapped;
          });
          callback(docs);
        },
        err => console.error('[ProductRepository] onShopProductsChange error:', err)
      );
    
    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Récupère un produit par ID (depuis cache ou Firestore)
   * @param {string} id - ID du produit
   * @returns {Promise<Object|null>}
   */
  async getProductById(id) {
    if (!id) return null;

    // Vérifier le cache d'abord
    if (this._cache.has(id)) {
      return this._cache.get(id);
    }

    try {
      const doc = await this.db.collection('products').doc(id).get();
      if (doc.exists) {
        const mapped = this._mapDoc(doc);
        this._cache.set(id, mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[ProductRepository] getProductById error:', err);
    }
    return null;
  }

  /**
   * Récupère les produits par slug
   * @param {string} slug - Slug du produit
   * @returns {Promise<Object|null>}
   */
  async getProductBySlug(slug) {
    if (!slug) return null;

    try {
      const snap = await this.db.collection('products')
        .where('slug', '==', slug)
        .limit(1)
        .get();
      
      if (!snap.empty) {
        const mapped = this._mapDoc(snap.docs[0]);
        this._cache.set(snap.docs[0].id, mapped);
        return mapped;
      }
    } catch (err) {
      console.error('[ProductRepository] getProductBySlug error:', err);
    }
    return null;
  }

  /**
   * Crée un nouveau produit
   * @param {Object} data - Données du produit
   * @returns {Promise<Object>}
   */
  async createProduct(data) {
    try {
      const docRef = await this.db.collection('products').add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        views: 0,
        rating: 0,
      });

      const newProduct = { id: docRef.id, ...data };
      this._cache.set(docRef.id, newProduct);
      return newProduct;
    } catch (err) {
      console.error('[ProductRepository] createProduct error:', err);
      throw err;
    }
  }

  /**
   * Met à jour un produit
   * @param {string} id - ID du produit
   * @param {Object} updates - Champs à mettre à jour
   * @returns {Promise<void>}
   */
  async updateProduct(id, updates) {
    if (!id) throw new Error('Product ID required');

    try {
      await this.db.collection('products').doc(id).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Mettre à jour le cache
      const cached = this._cache.get(id);
      if (cached) {
        this._cache.set(id, { ...cached, ...updates });
      }
    } catch (err) {
      console.error('[ProductRepository] updateProduct error:', err);
      throw err;
    }
  }

  /**
   * Incrémente les vues d'un produit (pour analytics)
   * @param {string} id - ID du produit
   * @returns {Promise<void>}
   */
  async incrementViews(id) {
    if (!id) return;

    try {
      await this.db.collection('products').doc(id).update({
        views: firebase.firestore.FieldValue.increment(1),
      });
    } catch (err) {
      console.error('[ProductRepository] incrementViews error:', err);
    }
  }

  /**
   * Supprime un produit
   * @param {string} id - ID du produit
   * @returns {Promise<void>}
   */
  async deleteProduct(id) {
    if (!id) throw new Error('Product ID required');

    try {
      await this.db.collection('products').doc(id).delete();
      this._cache.delete(id);
    } catch (err) {
      console.error('[ProductRepository] deleteProduct error:', err);
      throw err;
    }
  }

  /**
   * Recherche les produits par terme (simple)
   * @param {string} searchTerm - Terme à chercher dans le nom
   * @param {number} limit 
   * @returns {Promise<Array>}
   */
  async searchProducts(searchTerm, limit = 50) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const snap = await this.db.collection('products')
        .orderBy('name')
        .startAt(searchTerm)
        .endAt(searchTerm + '\uf8ff')
        .limit(limit)
        .get();
      
      return snap.docs.map(d => this._mapDoc(d));
    } catch (err) {
      console.error('[ProductRepository] searchProducts error:', err);
      return [];
    }
  }

  /**
   * Map un document Firestore vers un objet JS
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
   * Arrête tous les listeners et nettoie
   */
  cleanup() {
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (err) { console.warn('[ProductRepository] Unsubscribe error:', err); }
    });
    this._listeners = [];
    this._cache.clear();
    this._lastQuery = null;
  }

  /**
   * Retourne des stats utiles pour le debug
   */
  getStats() {
    return {
      listenersCount: this._listeners.length,
      cacheSize: this._cache.size,
      cacheKeys: Array.from(this._cache.keys()),
    };
  }
}

// Export global pour utilisation dans les autres scripts
if (typeof window !== 'undefined') {
  window.ProductRepository = ProductRepository;
}
