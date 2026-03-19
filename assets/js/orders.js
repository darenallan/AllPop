/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — orders.js
 * Module de gestion des commandes côté CLIENT et ADMIN
 * Suivi en temps réel, transitions de statut, webhooks
 * ═══════════════════════════════════════════════════════════════
 */

"use strict";

// ── STATUTS STANDARDS ─────────────────────────────────────────────
const ORDER_STATUSES = {
  PENDING:              'pending',           // Client a créé, en attente validation
  VALIDATED:            'validated',         // Admin/system a validé
  READY_FOR_DELIVERY:   'ready_for_delivery',// Vendeur a préparé
  IN_TRANSIT:           'in_transit',        // Livreur a accepté et transport
  DELIVERED:            'delivered',         // Livreur a confirmé livré
  CANCELLED:            'cancelled',         // Annulé
};

// ── STATUS LABELS & COLORS ────────────────────────────────────────
const STATUS_DISPLAY = {
  'pending':              { label: 'En attente',    color: '#F5A623', icon: '⏳' },
  'validated':            { label: 'Validée',       color: '#4A84C8', icon: '✅' },
  'ready_for_delivery':   { label: 'Prête',         color: '#4A84C8', icon: '📦' },
  'in_transit':           { label: 'En transit',    color: '#F5A623', icon: '🚚' },
  'delivered':            { label: 'Livrée',        color: '#2ECC71', icon: '✓' },
  'cancelled':            { label: 'Annulée',       color: '#E74C3C', icon: '✕' },
};

// ── SUBSCRIBE AUX COMMANDES DU CLIENT ─────────────────────────────
window.subscribeMyOrders = function(userId, onUpdate, onError) {
  if (!window.db || !userId) {
    console.error('❌ [ORDERS] Invalid parameters: db=', !!window.db, 'userId=', userId);
    return null;
  }
  
  console.log('📡 [ORDERS] Subscribing to client orders, userId:', userId);
  
  return window.db.collection('orders')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(
      snap => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('✅ [ORDERS] Client orders updated:', orders.length, 'total');
        orders.forEach(o => {
          console.log(`   Order ${o.id}: ${o.status} (${STATUS_DISPLAY[o.status]?.label || 'unknown'})`);
        });
        if (onUpdate) onUpdate(orders);
      },
      err => {
        console.error('❌ [ORDERS] Client listener error:', err);
        if (onError) onError(err);
      }
    );
};

// ── SUBSCRIBE AUX COMMANDES VENDOR ────────────────────────────────
window.subscribeVendorOrders = function(shopId, onUpdate, onError) {
  if (!window.db || !shopId) {
    console.error('❌ [ORDERS] Invalid parameters: shopId=', shopId);
    return null;
  }
  
  console.log('📡 [ORDERS] Subscribing to vendor orders, shopId:', shopId);
  
  return window.db.collection('orders')
    .where('shopId', '==', shopId)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(
      snap => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('✅ [ORDERS] Vendor orders updated:', orders.length, 'total');
        if (onUpdate) onUpdate(orders);
      },
      err => {
        console.error('❌ [ORDERS] Vendor listener error:', err);
        if (onError) onError(err);
      }
    );
};

// ── GET STATUS DISPLAY INFO ───────────────────────────────────────
window.getStatusDisplay = function(status) {
  return STATUS_DISPLAY[status] || { label: 'Status inconnu', color: '#999', icon: '?' };
};

// ── FORMAT TIMESTAMP ──────────────────────────────────────────────
window.formatOrderDate = function(timestamp) {
  if (!timestamp) return 'N/A';
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
};

// ── TRANSITION DE STATUT - VENDEUR (ready) ────────────────────────
window.markOrderReady = async function(orderId) {
  if (!window.db || !orderId) return;
  
  if (!confirm('Marquer cette commande comme prête pour expédition ?')) return;
  
  try {
    console.log('📦 [ORDERS] Marking order ready:', orderId);
    
    await window.db.collection('orders').doc(orderId).update({
      status:           ORDER_STATUSES.READY_FOR_DELIVERY,
      readyForDeliveryAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:        firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ [ORDERS] Order marked ready');
    if (window.showToast) window.showToast('Commande prête ✓ Les livreurs peuvent la prendre en charge.', 'success');
  } catch (err) {
    console.error('❌ [ORDERS] Error marking ready:', err);
    if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
  }
};

// ── TRANSITION DE STATUT - LIVREUR (in_transit) ───────────────────
window.acceptOrder = async function(orderId) {
  if (!window.db || !orderId) return;
  
  if (!confirm('Accepter cette commande ? Vous deviendrez responsable du colis.')) return;
  
  try {
    const courier = firebase.auth().currentUser;
    if (!courier) {
      if (window.showToast) window.showToast('Vous devez être connecté', 'danger');
      return;
    }
    
    console.log('📦 [ORDERS] Courier accepting order:', orderId, '| courierId:', courier.uid);
    
    await window.db.collection('orders').doc(orderId).update({
      status:        ORDER_STATUSES.IN_TRANSIT,
      courierId:     courier.uid,
      courierName:   courier.displayName || 'Livreur',
      courierEmail:  courier.email,
      acceptedAt:    firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ [ORDERS] Order accepted, in transit');
    if (window.showToast) window.showToast('Commande acceptée ✓ Le client est notifié.', 'success');
  } catch (err) {
    console.error('❌ [ORDERS] Error accepting order:', err);
    if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
  }
};

// ── TRANSITION DE STATUT - LIVREUR (delivered) ────────────────────
window.markOrderDelivered = async function(orderId) {
  if (!window.db || !orderId) return;
  
  try {
    const courier = firebase.auth().currentUser;
    if (!courier) {
      if (window.showToast) window.showToast('Vous devez être connecté', 'danger');
      return;
    }
    
    console.log('📦 [ORDERS] Courier confirming delivery:', orderId);
    
    await window.db.collection('orders').doc(orderId).update({
      status:       ORDER_STATUSES.DELIVERED,
      deliveredAt:  firebase.firestore.FieldValue.serverTimestamp(),
      deliveredBy:  courier.uid,
      updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ [ORDERS] Order delivered');
    if (window.showToast) window.showToast('Livraison confirmée ✓', 'success');
  } catch (err) {
    console.error('❌ [ORDERS] Error marking delivered:', err);
    if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
  }
};

// ── ANNULER UNE COMMANDE ──────────────────────────────────────────
window.cancelOrder = async function(orderId, reason = '') {
  if (!window.db || !orderId) return;
  
  if (!confirm('Êtes-vous sûr ? Cette action ne peut pas être annulée.')) return;
  
  try {
    console.log('❌ [ORDERS] Cancelling order:', orderId);
    
    await window.db.collection('orders').doc(orderId).update({
      status:       ORDER_STATUSES.CANCELLED,
      cancelledAt:  firebase.firestore.FieldValue.serverTimestamp(),
      cancelReason: reason || 'Pas de raison fournie',
      updatedAt:    firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ [ORDERS] Order cancelled');
    if (window.showToast) window.showToast('Commande annulée.', 'success');
  } catch (err) {
    console.error('❌ [ORDERS] Error cancelling:', err);
    if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
  }
};

// ── MIGRATION: ANCIENS → NOUVEAUX STATUTS (ADMIN ONLY) ──────────────
window.migrateOrderStatuses = async function() {
  if (!window.db || !firebase.auth().currentUser) {
    console.error('❌ [MIGRATION] Not authenticated');
    return;
  }
  
  const oldMapping = {
    'pending_admin':  ORDER_STATUSES.PENDING,
    'pending_seller': ORDER_STATUSES.VALIDATED,
  };
  
  if (!confirm('⚠️ ADMIN ONLY ⚠️\n\nMigrer TOUS les statuts ? Cette action est irréversible.')) return;
  
  try {
    console.log('🔄 [MIGRATION] Starting order status migration...');
    
    const snap = await window.db.collection('orders').get();
    const batch = window.db.batch();
    let count = 0;
    
    snap.docs.forEach(doc => {
      const oldStatus = doc.data().status;
      const newStatus = oldMapping[oldStatus];
      
      if (newStatus) {
        console.log(`   Migrating ${doc.id}: ${oldStatus} → ${newStatus}`);
        batch.update(doc.ref, { 
          status:    newStatus,
          migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      }
    });
    
    if (count === 0) {
      console.log('✅ [MIGRATION] No orders to migrate');
      if (window.showToast) window.showToast('Aucune commande à migrer.', 'info');
      return;
    }
    
    await batch.commit();
    console.log(`✅ [MIGRATION] Successfully migrated ${count} orders`);
    if (window.showToast) window.showToast(`Migré ${count} commandes avec succès.`, 'success');
  } catch (err) {
    console.error('❌ [MIGRATION] Failed:', err);
    if (window.showToast) window.showToast('Erreur migration : ' + err.message, 'danger');
  }
};

// ── RENDER ORDER CARD (CLIENT) ────────────────────────────────────
window.renderOrderCard = function(order) {
  if (!order) return '';
  
  const display = STATUS_DISPLAY[order.status] || { label: 'Inconnu', color: '#999', icon: '?' };
  const ref = order.reference || ('ORD-' + order.id.slice(-6).toUpperCase());
  const date = window.formatOrderDate(order.createdAt);
  const items = (order.items || []).map(i => `${i.qty || 1}× ${i.name}`).join(', ');
  const total = order.total ? new Intl.NumberFormat('fr-FR').format(order.total) + ' FCFA' : 'N/A';
  
  return `
    <div class="order-card" style="border-left:4px solid ${display.color}; background:var(--ink2,#1A1916); padding:16px; margin-bottom:12px; border-radius:4px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
        <div>
          <strong style="font-size:16px">${ref}</strong>
          <div style="font-size:12px; color:#7A7570">${date}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px; font-weight:700; color:#C8A84B">${total}</div>
          <div style="font-size:11px; padding:4px 8px; background:${display.color}20; color:${display.color}; border-radius:2px; margin-top:4px">
            ${display.icon} ${display.label}
          </div>
        </div>
      </div>
      <div style="font-size:13px; color:#999; margin-bottom:10px">${items}</div>
      ${order.courierId && order.courierName ? `<div style="font-size:12px; color:#C8A84B">📦 ${order.courierName}</div>` : ''}
    </div>
  `;
};

console.log('✅ [ORDERS] Module loaded');
