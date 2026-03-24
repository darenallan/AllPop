/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OrderRepository.js — Repository Pattern pour les Commandes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralise tous les appels Firestore liés aux commandes.
 * Permet migration future vers API REST/PostgreSQL sans toucher l'UI.
 */

'use strict';

class OrderRepository {
  constructor(db) {
    this.db = db;
    this._listeners = [];
  }

  /**
   * Écoute les commandes de l'utilisateur en temps réel
   * @param {string} userId - UID de l'utilisateur
   * @param {Function} callback - Appelé avec tableau de commandes
   * @param {number} limit - Nombre de commandes à charger
   */
  onUserOrdersChange(userId, callback, limit = 50) {
    if (!userId) return () => {};

    const unsubscribe = this.db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snap => {
          const orders = snap.docs.map(d => this._mapDoc(d));
          if (callback) callback(orders);
        },
        err => console.error('[OrderRepository] onUserOrdersChange error:', err)
      );

    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Écoute les commandes d'une boutique (vendeur)
   * @param {string} shopId - ID de la boutique
   * @param {Function} callback
   * @param {number} limit
   */
  onShopOrdersChange(shopId, callback, limit = 50) {
    if (!shopId) return () => {};

    const unsubscribe = this.db.collection('orders')
      .where('shopId', '==', shopId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .onSnapshot(
        snap => {
          const orders = snap.docs.map(d => this._mapDoc(d));
          if (callback) callback(orders);
        },
        err => console.error('[OrderRepository] onShopOrdersChange error:', err)
      );

    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Écoute une commande spécifique pour suivi en direct
   * @param {string} orderId
   * @param {Function} callback
   */
  onOrderDetailsChange(orderId, callback) {
    if (!orderId) return () => {};

    const unsubscribe = this.db.collection('orders')
      .doc(orderId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            if (callback) callback(this._mapDoc(doc));
          }
        },
        err => console.error('[OrderRepository] onOrderDetailsChange error:', err)
      );

    this._listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Récupère une commande par ID (une seule fois)
   * @param {string} orderId
   */
  async getOrderById(orderId) {
    if (!orderId) return null;

    try {
      const doc = await this.db.collection('orders').doc(orderId).get();
      return doc.exists ? this._mapDoc(doc) : null;
    } catch (err) {
      console.error('[OrderRepository] getOrderById error:', err);
      return null;
    }
  }

  /**
   * Crée une nouvelle commande
   * @param {Object} orderData - Données de la commande
   */
  async createOrder(orderData) {
    try {
      const docRef = await this.db.collection('orders').add({
        ...orderData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      return { id: docRef.id, ...orderData };
    } catch (err) {
      console.error('[OrderRepository] createOrder error:', err);
      throw err;
    }
  }

  /**
   * Met à jour le statut d'une commande
   * @param {string} orderId
   * @param {string} newStatus - ex: 'validated', 'ready_for_delivery', 'in_transit', 'delivered'
   */
  async updateOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) throw new Error('orderId and newStatus required');

    try {
      await this.db.collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] updateOrderStatus error:', err);
      throw err;
    }
  }

  /**
   * Valide une commande (admin → en attente du vendeur)
   * @param {string} orderId
   */
  async validateOrder(orderId) {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: 'validated',
        validatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] validateOrder error:', err);
      throw err;
    }
  }

  /**
   * Marque une commande prête à être livrée (vendeur)
   * @param {string} orderId
   */
  async markReadyForDelivery(orderId) {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: 'ready_for_delivery',
        readyForDeliveryAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] markReadyForDelivery error:', err);
      throw err;
    }
  }

  /**
   * Accepte une commande (livreur)
   * @param {string} orderId
   * @param {string} courierId
   */
  async acceptOrder(orderId, courierId) {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: 'in_transit',
        courierId: courierId,
        acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] acceptOrder error:', err);
      throw err;
    }
  }

  /**
   * Marque une commande comme livrée
   * @param {string} orderId
   */
  async markDelivered(orderId) {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: 'delivered',
        deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] markDelivered error:', err);
      throw err;
    }
  }

  /**
   * Annule une commande
   * @param {string} orderId
   * @param {string} reason - Raison de l'annulation
   */
  async cancelOrder(orderId, reason = '') {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: 'cancelled',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error('[OrderRepository] cancelOrder error:', err);
      throw err;
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
   * Arrête tous les listeners
   */
  cleanup() {
    this._listeners.forEach(unsub => {
      try { unsub(); } catch (err) { console.warn('[OrderRepository] Unsubscribe error:', err); }
    });
    this._listeners = [];
  }
}

if (typeof window !== 'undefined') {
  window.OrderRepository = OrderRepository;
}
