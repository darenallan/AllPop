/* ═══════════════════════════════════════════════════════════════
   AURUM — delivery.js  v3  (Système de Logistique Complet)
   Flux : Le Marché → Mes Courses → Historique (Type UberEats/Glovo)
   ═══════════════════════════════════════════════════════════════ */

// ── Firebase config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
  authDomain: "aurum-bf.firebaseapp.com",
  projectId: "aurum-bf",
  storageBucket: "aurum-bf.firebasestorage.app",
  messagingSenderId: "858318726586",
  appId: "1:858318726586:web:14687fff6d4d08527a6983",
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ── Wall helpers ─────────────────────────────────────────────────
function wallStatus(t) {
  const el = document.getElementById("dv-wall-txt");
  if (el) el.textContent = t;
}
function wallReveal() {
  document.body.classList.remove("dv-guarded", "dv-guarded");
  document.body.classList.add("dv-revealed");
  const w = document.getElementById("dv-wall");
  if (w) {
    w.classList.add("hiding");
    setTimeout(() => w.remove(), 400);
  }
}
function wallDeny(reason) {
  wallStatus("Accès refusé");
  setTimeout(() => {
    const w = document.getElementById("dv-wall");
    if (w) w.remove();
    document.body.classList.remove("dv-guarded");
    document.body.classList.add("dv-revealed");
    document.body.innerHTML = `<div class="dv-denied"><div class="dv-denied-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><h2 class="dv-denied-title">Accès Refusé</h2><p class="dv-denied-sub">${reason || "Cet espace est réservé aux livreurs certifiés Aurum."}</p><a href="/" class="dv-denied-btn" style="display:inline-flex;align-items:center;gap:10px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>Retour à l'accueil</a></div>`;
  }, 400);
}

// ── Toast ────────────────────────────────────────────────────────
function toast(msg, type = "") {
  const z = document.getElementById("dv-toasts");
  if (!z) return;
  const el = document.createElement("div");
  el.className = "dv-toast " + type;
  el.textContent = msg;
  z.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Date topbar ──────────────────────────────────────────────────
function initDate() {
  const el = document.getElementById("topbar-date");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
initDate();

// ── Navigation ───────────────────────────────────────────────────
const TAB_TITLES = {
  marketplace: "Le <em>marché</em>",
  active: "Mes <em>courses</em>",
  history: "Historique <em>complet</em>",
  profile: "Mon <em>profil</em>",
};
function navTo(tabId, btn) {
  document.querySelectorAll(".dv-section").forEach((s) => s.classList.remove("active"));
  document.getElementById("tab-" + tabId).classList.add("active");
  document.querySelectorAll(".dv-nav-item").forEach((n) => n.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const tt = document.getElementById("topbar-title");
  if (tt) tt.innerHTML = TAB_TITLES[tabId] || "";
  document.querySelector(".dv-sidebar").classList.remove("open");
}

// ── Logout ───────────────────────────────────────────────────────
function doLogout() {
  auth.signOut().then(() => {
    window.location.href = "/";
  });
}

// ── Modal confirm ────────────────────────────────────────────────
let _pendingOrderId = null;
function openModal(orderId, ref) {
  _pendingOrderId = orderId;
  document.getElementById("dv-modal-ref").textContent = ref || orderId.slice(-8).toUpperCase();
  document.getElementById("dv-modal").classList.add("open");
}
function closeModal() {
  _pendingOrderId = null;
  document.getElementById("dv-modal").classList.remove("open");
}
document.getElementById("dv-modal-ok").addEventListener("click", async () => {
  if (!_pendingOrderId) return;
  const btn = document.getElementById("dv-modal-ok");
  btn.disabled = true;
  try {
    await db.collection("orders").doc(_pendingOrderId).update({
      status: "delivered",
      deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
      courierId: auth.currentUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    toast("Livraison confirmée ✓", "ok");
    closeModal();
  } catch (err) {
    toast("Erreur : " + err.message, "err");
    btn.disabled = false;
  }
});

// ── Format helpers ────────────────────────────────────────────────
function fmtMoney(v) {
  return new Intl.NumberFormat("fr-FR").format(v || 0) + " FCFA";
}
function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Google Maps URL Generator ─────────────────────────────────────
function buildMapsUrl(deliveryAddress) {
  if (!deliveryAddress) return null;
  // Si on a les coordonnées GPS
  if (deliveryAddress.lat && deliveryAddress.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${deliveryAddress.lat},${deliveryAddress.lng}`;
  }
  // Sinon on utilise l'adresse texte complète
  const addrParts = [
    deliveryAddress.street,
    deliveryAddress.neighborhood,
    deliveryAddress.city,
  ].filter(Boolean).join(", ");
  if (addrParts) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addrParts)}`;
  }
  return null;
}

// ── Extract ALL pickup details for parent orders ─────────────────
async function extractAllPickupDetails(order) {
  // If order has sellerIds (parent order), fetch ALL vendor details
  if (Array.isArray(order.sellerIds) && order.sellerIds.length > 0) {
    const pickups = [];
    for (const sellerId of order.sellerIds) {
      try {
        const shopDoc = await db.collection('shops').doc(sellerId).get();
        if (shopDoc.exists) {
          const shopData = shopDoc.data();
          const pickupAddr = shopData.address ? 
            `${shopData.address.street || ''} ${shopData.address.neighborhood || ''} ${shopData.address.city || ''}`.trim()
            : "Adresse non renseignée";
          pickups.push({
            name: shopData.name || "Boutique",
            phone: shopData.phone || "—",
            street: shopData.address?.street || "—",
            city: shopData.address?.city || "",
            address: pickupAddr
          });
        }
      } catch (err) {
        console.warn(`[Delivery] Erreur récupération shop ${sellerId}:`, err);
        pickups.push({
          name: `Boutique ${sellerId.slice(-4).toUpperCase()}`,
          phone: "—",
          street: "—",
          city: "",
          address: "Adresse non renseignée"
        });
      }
    }
    return pickups;
  }
  // Fallback for single seller orders
  return [await extractPickupDetails(order)];
}

// ── Extract order details WITH Firestore lookup for vendor ───────────
async function extractPickupDetails(order) {
  // 1. Essayer d'utiliser les données existantes dans la commande
  if (order.shopName && order.pickupAddress) {
    return {
      name: order.shopName,
      phone: order.shopPhone || "—",
      street: order.pickupAddress?.street || "—",
      city: order.pickupAddress?.city || "",
      address: order.pickupAddress 
        ? `${order.pickupAddress.street || ''} ${order.pickupAddress.neighborhood || ''} ${order.pickupAddress.city || ''}`.trim() || "Adresse non renseignée"
        : "Adresse non renseignée"
    };
  }
  
  // 2. Sinon, chercher le shop dans Firestore via sellerId
  if (order.sellerId || order.shopId) {
    try {
      const sellerId = order.sellerId || order.shopId;
      const shopDoc = await db.collection('shops').doc(sellerId).get();
      if (shopDoc.exists) {
        const shopData = shopDoc.data();
        const pickupAddr = shopData.address ? 
          `${shopData.address.street || ''} ${shopData.address.neighborhood || ''} ${shopData.address.city || ''}`.trim()
          : "Adresse non renseignée";
        return {
          name: shopData.name || "Boutique",
          phone: shopData.phone || "—",
          street: shopData.address?.street || "—",
          city: shopData.address?.city || "",
          address: pickupAddr
        };
      }
    } catch (err) {
      console.warn('[Delivery] Erreur récupération shop:', err);
    }
  }
  
  // 3. Fallback
  return {
    name: order.shopName || order.sellerName || "Boutique",
    phone: order.shopPhone || "—",
    street: order.pickupAddress?.street || "—",
    city: order.pickupAddress?.city || "",
    address: "Adresse non renseignée"
  };
}

function extractDeliveryDetails(order) {
  return {
    name: order.deliveryAddress?.name || order.userName || "Client",
    phone: order.deliveryAddress?.phone || order.userPhone || "—",
    street: order.deliveryAddress?.street || "—",
    city: order.deliveryAddress?.city || "",
    neighborhood: order.deliveryAddress?.neighborhood || "",
    address: order.deliveryAddress 
      ? `${order.deliveryAddress.street || ''} ${order.deliveryAddress.neighborhood || ''} ${order.deliveryAddress.city || ''}`.trim() || "Adresse non renseignée"
      : "Adresse non renseignée",
    mapsUrl: buildMapsUrl(order.deliveryAddress)
  };
}
function fmtDateShort(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function isToday(ts) {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function ordRef(order) {
  return order.reference || "AUR-" + order.id.slice(-6).toUpperCase();
}

// ── RENDER: Route Box Helper (Récupération -> Livraison) ──────────
function buildRouteBox(pickup, delivery, mapsUrl) {
  // Sécurité: définis les valeurs par défaut
  pickup = pickup || {};
  delivery = delivery || {};
  
  const pickupName = pickup.name || "Boutique";
  const pickupPhone = pickup.phone || "—";
  const pickupAddr = pickup.address || "Adresse non renseignée";
  
  const deliveryName = delivery.name || "Client";
  const deliveryPhone = delivery.phone || "—";
  const deliveryAddr = delivery.address || "Adresse non renseignée";
  
  const mapBtnHtml = mapsUrl 
    ? `<a href="${mapsUrl}" target="_blank" class="dv-map-btn"><i data-lucide="map"></i> Itinéraire</a>`
    : "";
  
  return `<div class="dv-route-box">
    <div class="dv-route-step">
      <div class="dv-route-icon">
        <i data-lucide="store"></i>
      </div>
      <div class="dv-route-info">
        <div class="dv-route-title">Récupération</div>
        <div class="dv-route-name">${pickupName}</div>
        <div class="dv-route-detail">${pickupPhone}</div>
        <div class="dv-route-address">${pickupAddr}</div>
      </div>
    </div>
    <div class="dv-route-line"></div>
    <div class="dv-route-step">
      <div class="dv-route-icon">
        <i data-lucide="user"></i>
      </div>
      <div class="dv-route-info">
        <div class="dv-route-title">Livraison</div>
        <div class="dv-route-name">${deliveryName}</div>
        <div class="dv-route-detail">${deliveryPhone}</div>
        <div class="dv-route-address">${deliveryAddr}</div>
        ${mapBtnHtml}
      </div>
    </div>
  </div>`;
}

// ── RENDER: Marketplace (Asynchrone pour charger infos vendeur) ─────
async function renderMarketplace(orders) {
  const el = document.getElementById("marketplace-list");
  const badge = document.getElementById("badge-marketplace");
  const statEl = document.getElementById("stat-marketplace");
  if (badge) {
    badge.textContent = orders.length;
    badge.classList.toggle("show", orders.length > 0);
  }
  if (statEl) statEl.textContent = orders.length;

  if (!orders.length) {
    el.innerHTML = `<div class="dv-empty"><div class="dv-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14m0-14l-6 6m6-6l6 6"/></svg></div><div class="dv-empty-title">Aucune course</div><div class="dv-empty-sub">Revenez bientôt - nouvelles commandes en temps réel !</div></div>`;
    return;
  }

  el.innerHTML = orders.map((o) => {
    // Placeholder pendant le chargement async
    return `<div class="dv-order-card marketplace" id="order-${o.id}"><div class="dv-loader">Chargement…</div></div>`;
  }).join("");

  // Maintenant charger les infos de chaque commande
  for (const o of orders) {
    try {
      const pickups = await extractAllPickupDetails(o);  // ← Get ALL pickup points
      const delivery = extractDeliveryDetails(o);
      const items = (o.items || []).map((i) => `<li class="dv-item"><strong>${i.qty || 1}×</strong>&nbsp;${i.name}</li>`).join("");
      
      // Build HTML for ALL pickup points
      const pickupBoxes = pickups.map((pickup, idx) => {
        const mapsUrl = pickup.address && delivery.address ?
          `https://www.google.com/maps/dir/?api=1&waypoints=${encodeURIComponent(pickup.address)}&destination=${encodeURIComponent(delivery.address)}`
          : null;
        return `
          <div class="dv-pickup-point" style="margin-bottom:12px;padding:10px;background:rgba(200,168,75,.05);border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:var(--g);margin-bottom:4px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 7 12 12 16 14"/></svg>
              Récupération ${pickups.length > 1 ? `(${idx + 1}/${pickups.length})` : ''}: <strong>${pickup.name}</strong>
            </div>
            <div style="font-size:11px;color:var(--s)">
              ${pickup.address ? `📍 ${pickup.address}` : 'Adresse non renseignée'}<br/>
              ${pickup.phone !== '—' ? `📞 ${pickup.phone}` : ''}
            </div>
          </div>
        `;
      }).join("");
      
      const routeBox = `
        <div style="margin-bottom:16px">
          ${pickupBoxes}
          <div class="dv-delivery-point" style="padding:10px;background:rgba(200,168,75,.05);border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:var(--g);margin-bottom:4px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg>
              Livraison: <strong>${delivery.name}</strong>
            </div>
            <div style="font-size:11px;color:var(--s)">
              ${delivery.address ? `📍 ${delivery.address}` : 'Adresse non renseignée'}<br/>
              ${delivery.phone !== '—' ? `📞 ${delivery.phone}` : ''}
            </div>
          </div>
        </div>
      `;
      
      const card = `<div class="dv-order-card marketplace">
        <div class="dv-order-head">
          <div>
            <div class="dv-order-ref">${ordRef(o)}</div>
            <div class="dv-order-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 7 12 12 16 14"/></svg>Depuis ${fmtDate(o.readyForDeliveryAt || o.updatedAt)}</span></div>
            ${pickups.length > 1 ? `<div class="dv-order-meta" style="font-weight:600;color:var(--g)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>${pickups.length} points de collecte</div>` : ''}
          </div>
          <div class="dv-order-right">
            <div class="dv-order-total">${fmtMoney(o.total)}</div>
            <span class="dv-chip marketplace">En bourse</span>
          </div>
        </div>
        <div class="dv-order-body">
          ${routeBox}

          <!-- Articles -->
          ${items ? `<div class="dv-items-section"><ul class="dv-items-list">${items}</ul></div>` : ""}

          <!-- Bouton Accepter -->
          <button class="dv-accept-btn" onclick="acceptDelivery('${o.id}', '${ordRef(o)}')" style="margin-top:12px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Accepter</span>
          </button>
        </div>
      </div>`;
      
      const container = document.getElementById(`order-${o.id}`);
      if (container) container.outerHTML = card;
    } catch (err) {
      console.error('[Delivery] Erreur rendu commande:', err);
      const container = document.getElementById(`order-${o.id}`);
      if (container) container.innerHTML = `<div class="dv-error">Erreur de chargement</div>`;
    }
  }

  // Réinitialiser les icônes Lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// ── RENDER: Active Deliveries ─────────────────────────────────────
function renderActive(orders) {
  const el = document.getElementById("active-list");
  const badge = document.getElementById("badge-active");
  const statEl = document.getElementById("stat-active");
  if (badge) {
    badge.textContent = orders.length;
    badge.classList.toggle("show", orders.length > 0);
  }
  if (statEl) statEl.textContent = orders.length;

  if (!orders.length) {
    el.innerHTML = `<div class="dv-empty"><div class="dv-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="dv-empty-title">Aucune course</div><div class="dv-empty-sub">Allez au marché pour accepter une course !</div></div>`;
    return;
  }

  el.innerHTML = orders.map((o) => {
    const pickup = extractPickupDetails(o);
    const delivery = extractDeliveryDetails(o);
    const items = (o.items || []).map((i) => `<li class="dv-item"><strong>${i.qty || 1}×</strong>&nbsp;${i.name}</li>`).join("");
    const routeBox = buildRouteBox(pickup, delivery, delivery.mapsUrl);
    
    return `<div class="dv-order-card active">
      <div class="dv-order-head">
        <div>
          <div class="dv-order-ref">${ordRef(o)}</div>
          <div class="dv-order-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>En transit depuis ${fmtDate(o.acceptedAt || o.updatedAt)}</span></div>
        </div>
        <div class="dv-order-right">
          <div class="dv-order-total">${fmtMoney(o.total)}</div>
          <span class="dv-chip in-transit">En transit</span>
        </div>
      </div>
      <div class="dv-order-body">
        ${routeBox}

        <!-- Articles -->
        ${items ? `<div class="dv-items-section"><ul class="dv-items-list">${items}</ul></div>` : ""}

        <!-- Bouton Confirmer -->
        <button class="dv-confirm-btn" onclick="openModal('${o.id}', '${ordRef(o)}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Confirmer</span>
        </button>
      </div>
    </div>`;
  }).join("");

  // Réinitialiser les icônes Lucide
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// ── RENDER: History ───────────────────────────────────────────────
function renderHistory(orders, todayCount) {
  const el = document.getElementById("history-list");
  const statToday = document.getElementById("stat-done-today");
  const statTotal = document.getElementById("stat-total");
  if (statToday) statToday.textContent = todayCount;
  if (statTotal) statTotal.textContent = orders.length;

  if (!orders.length) {
    el.innerHTML = `<div class="dv-empty"><div class="dv-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="dv-empty-title">Aucune livraison</div><div class="dv-empty-sub">Vos livraisons apparaîtront ici.</div></div>`;
    return;
  }

  el.innerHTML = orders.map((o) => `<div class="dv-history-item"><div><div class="dv-history-ref">${ordRef(o)}</div><div class="dv-history-date">Livré ${fmtDate(o.deliveredAt)}</div></div><div style="text-align:right"><div class="dv-history-total">${fmtMoney(o.total)}</div><span class="dv-chip delivered">✓</span></div></div>`).join("");
}

// ── RENDER: Profile ───────────────────────────────────────────────
function renderProfile(userData, email) {
  const el = document.getElementById("profile-grid");
  if (!el) return;
  const certDate = userData.certifiedAt ? fmtDateShort(userData.certifiedAt) : "N/A";
  const blocks = [
    { label: "Nom", value: userData.name || "—" },
    { label: "Email", value: email || "—" },
    { label: "Téléphone", value: userData.phone || "—" },
    { label: "Zone", value: userData.zone || "—" },
    { label: "Statut", value: userData.status === "active" ? "🟢 Actif" : "🔴 Inactif", gold: userData.status === "active" },
    { label: "Certifié", value: certDate },
  ];
  el.innerHTML = blocks.map((b) => `<div class="dv-profile-block"><div class="dv-profile-label">${b.label}</div><div class="dv-profile-value ${b.gold ? "gold" : ""}">${b.value}</div></div>`).join("");
}

// ── ACTION: Accept Delivery ───────────────────────────────────────
async function acceptDelivery(orderId, ref) {
  const btn = event.target.closest("button");
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = "En cours...";
  try {
    const currentUser = auth.currentUser;
    
    // On met à jour UNIQUEMENT la commande globale
    await db.collection("orders").doc(orderId).update({
      status: "in_transit",
      courierId: currentUser.uid,
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    
    toast(`${ref} acceptée ✓ (En route vers les boutiques)`, "ok");
  } catch (err) {
    toast("Erreur : " + err.message, "err");
    btn.disabled = false;
    btn.textContent = "Accepter";
  }
}

// ── Modal: Confirm Delivery (Parent + Sub-Orders) ────────────────
let _pendingDeliveryOrderId = null;
window.openModal = function(orderId, ref) {
  _pendingDeliveryOrderId = orderId;
  const refEl = document.getElementById("dv-modal-ref");
  if (refEl) refEl.textContent = ref || orderId.slice(-6).toUpperCase();
  const modal = document.getElementById("dv-modal");
  if (modal) modal.classList.add("open");
};
window.closeModal = function() {
  _pendingDeliveryOrderId = null;
  const modal = document.getElementById("dv-modal");
  if (modal) modal.classList.remove("open");
};

document.addEventListener("DOMContentLoaded", () => {
  const modalOkBtn = document.getElementById("dv-modal-ok");
  if (modalOkBtn) {
    modalOkBtn.addEventListener("click", async () => {
      if (!_pendingDeliveryOrderId) return;
      modalOkBtn.disabled = true;
      const span = modalOkBtn.querySelector("span");
      const origText = span ? span.textContent : "Confirmer la livraison";
      if (span) span.textContent = "En cours…";
      try {
        const currentUser = auth.currentUser;
        
        // On met à jour UNIQUEMENT la commande globale
        await db.collection("orders").doc(_pendingDeliveryOrderId).update({
          status: "delivered",
          deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
          deliveredBy: currentUser.uid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        toast(`Livraison confirmée ✓ Client livré !`, "ok");
        window.closeModal();
      } catch (err) {
        toast("Erreur : " + err.message, "err");
        modalOkBtn.disabled = false;
        if (span) span.textContent = origText;
      }
    });
  }
});

// ── BOOTSTRAP ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      wallDeny("Connectez-vous pour continuer.");
      return;
    }
    wallStatus("Vérification…");
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      if (userData.role !== "livreur") {
        wallDeny(`Accès réservé aux livreurs.`);
        return;
      }
      const sbName = document.getElementById("sb-user-name");
      const sbEmail = document.getElementById("sb-user-email");
      if (sbName) sbName.textContent = userData.name || user.displayName || "—";
      if (sbEmail) sbEmail.textContent = user.email || "—";
      wallStatus("Chargement…");

      // Timeout de sécurité : révéler après 5 secondes si pas déjà fait
      let wallRevealed = false;
      const revealTimeout = setTimeout(() => {
        if (!wallRevealed) {
          wallRevealed = true;
          wallReveal();
        }
      }, 5000);

      // Marketplace - PARENT orders with multiple pickups
      db.collection("orders")
        .where("isParent", "==", true)
        .where("status", "==", "ready_for_delivery")
        .limit(50)
        .onSnapshot((snap) => {
          const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          renderMarketplace(orders);
        }, (err) => {
          console.error("Marketplace error:", err);
          document.getElementById("marketplace-list").innerHTML = `<div class="dv-empty"><div class="dv-empty-sub" style="color:var(--danger)">Erreur chargement: ${err.message}</div></div>`;
        });

      // Active courses
      db.collection("orders")
        .where("isParent", "==", true)
        .where("status", "==", "in_transit")
        .where("courierId", "==", user.uid)
        .limit(100)
        .onSnapshot((snap) => {
          const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          renderActive(orders);
          if (!wallRevealed) {
            wallRevealed = true;
            clearTimeout(revealTimeout);
            wallReveal();
          }
        }, (err) => {
          console.error("Active courses error:", err);
          document.getElementById("active-list").innerHTML = `<div class="dv-empty"><div class="dv-empty-sub" style="color:var(--danger)">Erreur: ${err.message}</div></div>`;
          if (!wallRevealed) {
            wallRevealed = true;
            clearTimeout(revealTimeout);
            wallReveal();
          }
        });

      // History
      db.collection("orders")
        .where("isParent", "==", true)
        .where("status", "==", "delivered")
        .where("courierId", "==", user.uid)
        .orderBy("deliveredAt", "desc")
        .limit(100)
        .onSnapshot((snap) => {
          const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const todayCount = orders.filter((o) => isToday(o.deliveredAt)).length;
          renderHistory(orders, todayCount);
        }, (err) => {
          console.error(err);
          document.getElementById("history-list").innerHTML = `<div class="dv-empty"><div class="dv-empty-sub" style="color:var(--danger)">Erreur: ${err.message}</div></div>`;
        });

      renderProfile(userData, user.email);
    } catch (err) {
      console.error(err);
      wallDeny("Erreur: " + err.message);
    }
  });
});
