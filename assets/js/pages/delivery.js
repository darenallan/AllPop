/**
 * delivery.js
 * Dashboard livreur : commandes en attente, historique, profil
 * Section §10 de prime.js
 */

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('tab-pending')) return;

  var db   = window.db;
  var auth = window.auth;

  function fmtMoney(v) { return new Intl.NumberFormat('fr-FR').format(v||0) + ' FCFA'; }
  function fmtDate(ts) {
    if (!ts) return '—';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
  function isToday(ts) {
    if (!ts) return false;
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toDateString() === new Date().toDateString();
  }
  function ordRef(order) { return order.reference || 'AUR-' + order.id.slice(-6).toUpperCase(); }

  (function () {
    var el = document.getElementById('topbar-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  })();

  var TAB_TITLES = { pending: 'Livraisons <em>en attente</em>', history: 'Historique <em>complet</em>', profile: 'Mon <em>profil</em>' };
  window.navTo = function (tabId, btn) {
    document.querySelectorAll('.dv-section').forEach(function (s) { s.classList.remove('active'); });
    var target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.dv-nav-item').forEach(function (n) { n.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var tt = document.getElementById('topbar-title');
    if (tt) tt.innerHTML = TAB_TITLES[tabId] || '';
    var sb = document.querySelector('.dv-sidebar');
    if (sb) sb.classList.remove('open');
  };

  window.doLogout = function () {
    auth.signOut().then(function () { window.location.href = '/'; });
  };

  var _pendingOrderId = null;
  window.openModal = function (orderId, ref) {
    _pendingOrderId = orderId;
    var refEl = document.getElementById('dv-modal-ref');
    if (refEl) refEl.textContent = ref || orderId.slice(-8).toUpperCase();
    var modal = document.getElementById('dv-modal');
    if (modal) modal.classList.add('open');
  };
  window.closeModal = function () {
    _pendingOrderId = null;
    var modal = document.getElementById('dv-modal');
    if (modal) modal.classList.remove('open');
  };
  var okBtn = document.getElementById('dv-modal-ok');
  if (okBtn) {
    okBtn.addEventListener('click', async function () {
      if (!_pendingOrderId) return;
      okBtn.disabled = true;
      try {
        await db.collection('orders').doc(_pendingOrderId).update({
          status: 'delivered',
          deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
          deliveredBy: auth.currentUser.uid,
          updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (window.showToast) window.showToast('Livraison confirmée ✓', 'success');
        window.closeModal();
      } catch (err) {
        if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
        okBtn.disabled = false;
      }
    });
  }

  // ── ACCEPTER UNE LIVRAISON (ready_for_delivery → in_transit) ──────
  window.acceptDelivery = async function (orderId) {
    if (!confirm('Accepter cette livraison ? Vous deviendrez responsable du colis.')) return;
    
    try {
      var courier = auth.currentUser;
      if (!courier) {
        if (window.showToast) window.showToast('Vous devez être connecté', 'danger');
        return;
      }
      
      console.log('📦 [COURIER] Accepting delivery:', orderId, '| courierId:', courier.uid);
      
      await db.collection('orders').doc(orderId).update({
        status:         'in_transit',
        courierId:      courier.uid,
        courierName:    courier.displayName || 'Livreur',
        courierEmail:   courier.email,
        acceptedAt:     firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log('✅ [COURIER] Delivery accepted, status changed to in_transit');
      if (window.showToast) window.showToast('Livraison acceptée ✓ Le client est notifié.', 'success');
    } catch (err) {
      console.error('❌ [COURIER] Accept error:', err);
      if (window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
    }
  };

  function renderPending(orders) {
    var el    = document.getElementById('pending-list');
    var badge = document.getElementById('badge-pending');
    var stat  = document.getElementById('stat-pending');
    if (badge) { badge.textContent = orders.length; badge.classList.toggle('show', orders.length > 0); }
    if (stat)  stat.textContent = orders.length;
    if (!el) return;
    if (!orders.length) {
      el.innerHTML = '<div class="dv-empty"><div class="dv-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="dv-empty-title">Aucune livraison</div><div class="dv-empty-sub">Les nouvelles commandes apparaîtront ici.</div></div>';
      return;
    }
    el.innerHTML = orders.map(function (o) {
      var addr = o.deliveryAddress ? [o.deliveryAddress.street, o.deliveryAddress.city, o.deliveryAddress.sector].filter(Boolean).join(', ') : 'Adresse non spécifiée';
      var items = (o.items||[]).map(function (i) { return '<li class="dv-item"><strong>' + (i.qty||1) + '×</strong>' + (i.name||'Article') + '</li>'; }).join('');
      return '<div class="dv-order-card">'\
        + '<div class="dv-order-head"><div><div class="dv-order-ref">' + ordRef(o) + '</div><div class="dv-order-meta"><span>' + fmtDate(o.readyForDeliveryAt||o.updatedAt) + '</span><span>' + (o.userEmail||o.userName||'Client') + '</span></div></div>'\
        + '<div class="dv-order-right"><div class="dv-order-total">' + fmtMoney(o.total) + '</div><span class="dv-chip ready">Prêt</span></div></div>'\
        + '<div class="dv-order-body"><div class="dv-address"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg><div class="dv-address-text"><strong>Adresse de livraison</strong>' + addr + '</div></div>'\
        + (items ? '<ul class="dv-items-list">' + items + '</ul>' : '')\
        + (o.status === 'ready_for_delivery' 
          ? '<button class="dv-accept-btn" onclick="window.acceptDelivery(\'' + o.id + '\')" style="background:#4A84C8"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14"><polyline points="20 6 9 17 4 12"/></svg><span>Accepter la livraison</span></button>'
          : '')
        + (o.status === 'in_transit' 
          ? '<button class="dv-confirm-btn" onclick="window.openModal(\'' + o.id + '\',\'' + ordRef(o) + '\')" style="background:#C8A84B"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14"><polyline points="20 6 9 17 4 12"/></svg><span>Confirmer livré</span></button>' 
          : '')
        + '</div></div>';
    }).join('');
  }

  function renderHistory(orders, todayCount) {
    var el    = document.getElementById('history-list');
    var today = document.getElementById('stat-done-today');
    var total = document.getElementById('stat-total');
    if (today) today.textContent = todayCount;
    if (total) total.textContent = orders.length;
    if (!el) return;
    if (!orders.length) { el.innerHTML = '<div class="dv-empty"><div class="dv-empty-title">Aucune livraison</div></div>'; return; }
    el.innerHTML = orders.map(function (o) {
      return '<div class="dv-history-item">'\
        + '<div><div class="dv-history-ref">' + ordRef(o) + '</div><div class="dv-history-date">Livré le ' + fmtDate(o.deliveredAt) + '</div></div>'\
        + '<div style="text-align:right"><div class="dv-history-total">' + fmtMoney(o.total) + '</div><span class="dv-chip delivered">Livré</span></div>'\
      + '</div>';
    }).join('');
  }

  function renderProfile(userData, email) {
    var el = document.getElementById('profile-grid');
    if (!el) return;
    var certDate = userData.certifiedAt ? new Date(userData.certifiedAt.toDate ? userData.certifiedAt.toDate() : userData.certifiedAt).toLocaleDateString('fr-FR') : 'N/A';
    var blocks = [
      { label: 'Nom complet', value: userData.name || '—' },
      { label: 'Email',        value: email || userData.email || '—' },
      { label: 'Téléphone',    value: userData.phone || '—' },
      { label: 'Zone de livraison', value: userData.zone || '—' },
      { label: 'Statut',       value: userData.status === 'active' ? 'Actif' : 'Inactif', gold: userData.status === 'active' },
      { label: 'Certifié le',  value: certDate },
    ];
    el.innerHTML = blocks.map(function (b) {
      return '<div class="dv-profile-block"><div class="dv-profile-label">' + b.label + '</div><div class="dv-profile-value' + (b.gold ? ' gold' : '') + '">' + b.value + '</div></div>';
    }).join('');
  }

  auth.onAuthStateChanged(async function (user) {
    if (!user) { if (window.AuthWall) window.AuthWall.deny({ redirectUrl: '/login', redirectLabel: 'Se connecter', reason: 'Connexion requise.' }); else window.location.href = '/login'; return; }
    try {
      var userDoc  = await db.collection('users').doc(user.uid).get();
      var userData = userDoc.exists ? userDoc.data() : {};
      if (userData.role !== 'livreur') {
        if (window.AuthWall) window.AuthWall.deny({ email: user.email, role: userData.role||'client', reason: 'Espace réservé aux livreurs certifiés Aurum.' });
        else window.location.href = '/';
        return;
      }

      var sbName  = document.getElementById('sb-user-name');
      var sbEmail = document.getElementById('sb-user-email');
      if (sbName)  sbName.textContent  = userData.name || user.displayName || '—';
      if (sbEmail) sbEmail.textContent = user.email || '—';

      db.collection('orders').where('status', '==', 'ready_for_delivery').limit(50)\
        .onSnapshot(function (snap) { renderPending(snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })); },\
          function (err) { console.error('[delivery] pending:', err.message); });

      db.collection('orders')\
        .where('status', '==', 'delivered')\
        .where('deliveredBy', '==', user.uid)\
        .orderBy('deliveredAt', 'desc').limit(100)\
        .onSnapshot(function (snap) {
          var orders = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
          renderHistory(orders, orders.filter(function (o) { return isToday(o.deliveredAt); }).length);
        }, function (err) { console.error('[delivery] history:', err.message); });

      renderProfile(userData, user.email);
      setTimeout(function () { if (window.AuthWall) window.AuthWall.reveal(); }, 350);
    } catch (err) {
      console.error('[delivery] bootstrap:', err);
      if (window.AuthWall) window.AuthWall.deny({ reason: 'Erreur de vérification : ' + err.message });
    }
  });
});

// NOUVEAU: Accepter une commande (Livreur passe de ready_for_delivery à in_transit)
window.acceptDelivery = async function(orderId) {
  if (!confirm('Accepter cette livraison ? Vous deviendrez responsable du colis.')) return;
  
  try {
    const courier = auth.currentUser;
    if (!courier) { 
      if(window.showToast) window.showToast('Vous devez être connecté', 'danger');
      return; 
    }
    
    console.log('📦 [COURIER] Accepting delivery:', orderId, '| courierId:', courier.uid);
    
    await db.collection('orders').doc(orderId).update({
      status:         'in_transit',           // ← Nouveau statut
      courierId:      courier.uid,            // ← Attacher le livreur
      courierName:    courier.displayName || 'Livreur',
      courierEmail:   courier.email,
      acceptedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:      firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('✅ [COURIER] Delivery accepted, status changed to in_transit');
    if(window.showToast) window.showToast('Livraison acceptée ✓ Le client est notifié.', 'success');
    
    // L'onSnapshot du client sera notifié automatiquement
  } catch (err) {
    console.error('❌ [COURIER] Accept error:', err);
    if(window.showToast) window.showToast('Erreur : ' + err.message, 'danger');
  }
};