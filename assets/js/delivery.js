/* ═══════════════════════════════════════════════════════════════
   AURUM — delivery.html  (logique métier complète)
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
  document.body.classList.remove("dv-guarded");
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
    document.getElementById("dv-wall").remove();
    document.body.classList.remove("dv-guarded");
    document.body.classList.add("dv-revealed");
    document.body.innerHTML = `
      <div class="dv-denied">
        <div class="dv-denied-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 class="dv-denied-title">Accès Refusé</h2>
        <p class="dv-denied-sub">${reason || "Cet espace est réservé aux livreurs certifiés Aurum."}</p>
        <a href="index.html" class="dv-denied-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Retour à l'accueil
        </a>
      </div>`;
  }, 400);
}

// ── Toast ────────────────────────────────────────────────────────
function toast(msg, type = "") {
  const z = document.getElementById("dv-toasts");
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
  pending: "Livraisons <em>en attente</em>",
  history: "Historique <em>complet</em>",
  profile: "Mon <em>profil</em>",
};
function navTo(tabId, btn) {
  document
    .querySelectorAll(".dv-section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("tab-" + tabId).classList.add("active");
  document
    .querySelectorAll(".dv-nav-item")
    .forEach((n) => n.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const tt = document.getElementById("topbar-title");
  if (tt) tt.innerHTML = TAB_TITLES[tabId] || "";
  // Close mobile sidebar
  document.querySelector(".dv-sidebar").classList.remove("open");
}

// ── Logout ───────────────────────────────────────────────────────
function doLogout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

// ── Modal confirm ────────────────────────────────────────────────
let _pendingOrderId = null;
function openModal(orderId, ref) {
  _pendingOrderId = orderId;
  document.getElementById("dv-modal-ref").textContent =
    ref || orderId.slice(-8).toUpperCase();
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
      deliveredBy: auth.currentUser.uid,
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

// ── RENDER: Pending orders ────────────────────────────────────────
function renderPending(orders) {
  const el = document.getElementById("pending-list");
  const badge = document.getElementById("badge-pending");
  const statEl = document.getElementById("stat-pending");
  if (badge) {
    badge.textContent = orders.length;
    badge.classList.toggle("show", orders.length > 0);
  }
  if (statEl) statEl.textContent = orders.length;

  if (!orders.length) {
    el.innerHTML = `
      <div class="dv-empty">
        <div class="dv-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="dv-empty-title">Aucune livraison</div>
        <div class="dv-empty-sub">Les nouvelles commandes prêtes apparaîtront ici en temps réel.</div>
      </div>`;
    return;
  }

  el.innerHTML = orders
    .map((o) => {
      const addr = o.deliveryAddress
        ? [
            o.deliveryAddress.street,
            o.deliveryAddress.city,
            o.deliveryAddress.sector,
          ]
            .filter(Boolean)
            .join(", ")
        : "Adresse non spécifiée";
      const items = (o.items || [])
        .map(
          (i) =>
            `<li class="dv-item"><strong>${i.qty || 1}×</strong>${i.name || "Article"}</li>`,
        )
        .join("");

      return `
      <div class="dv-order-card">
        <div class="dv-order-head">
          <div>
            <div class="dv-order-ref">${ordRef(o)}</div>
            <div class="dv-order-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Prêt depuis : ${fmtDate(o.readyForDeliveryAt || o.updatedAt)}
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ${o.userEmail || o.userName || "Client"}
              </span>
            </div>
          </div>
          <div class="dv-order-right">
            <div class="dv-order-total">${fmtMoney(o.total)}</div>
            <span class="dv-chip ready">Prêt</span>
          </div>
        </div>
        <div class="dv-order-body">
          <div class="dv-address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
            <div class="dv-address-text">
              <strong>Adresse de livraison</strong>
              ${addr}
            </div>
          </div>
          ${items ? `<ul class="dv-items-list">${items}</ul>` : ""}
          <button class="dv-confirm-btn" onclick="openModal('${o.id}','${ordRef(o)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Confirmer la livraison</span>
          </button>
        </div>
      </div>`;
    })
    .join("");
}

// ── RENDER: History ───────────────────────────────────────────────
function renderHistory(orders, todayCount) {
  const el = document.getElementById("history-list");
  const statToday = document.getElementById("stat-done-today");
  const statTotal = document.getElementById("stat-total");
  if (statToday) statToday.textContent = todayCount;
  if (statTotal) statTotal.textContent = orders.length;

  if (!orders.length) {
    el.innerHTML = `
      <div class="dv-empty">
        <div class="dv-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="dv-empty-title">Aucune livraison</div>
        <div class="dv-empty-sub">Vos livraisons effectuées apparaîtront ici.</div>
      </div>`;
    return;
  }

  el.innerHTML = orders
    .map(
      (o) => `
    <div class="dv-history-item">
      <div>
        <div class="dv-history-ref">${ordRef(o)}</div>
        <div class="dv-history-date">Livré le ${fmtDate(o.deliveredAt)}</div>
      </div>
      <div style="text-align:right">
        <div class="dv-history-total">${fmtMoney(o.total)}</div>
        <span class="dv-chip delivered">Livré</span>
      </div>
    </div>`,
    )
    .join("");
}

// ── RENDER: Profile ───────────────────────────────────────────────
function renderProfile(userData, email) {
  const el = document.getElementById("profile-grid");
  if (!el) return;

  const certDate = userData.certifiedAt
    ? fmtDateShort(userData.certifiedAt)
    : "N/A";

  const blocks = [
    { label: "Nom complet", value: userData.name || "—" },
    { label: "Email", value: email || userData.email || "—" },
    { label: "Téléphone", value: userData.phone || "—" },
    { label: "Zone de livraison", value: userData.zone || "—" },
    {
      label: "Statut",
      value: userData.status === "active" ? "Actif" : "Inactif",
      gold: userData.status === "active",
    },
    { label: "Certifié le", value: certDate },
  ];

  el.innerHTML = blocks
    .map(
      (b) => `
    <div class="dv-profile-block">
      <div class="dv-profile-label">${b.label}</div>
      <div class="dv-profile-value ${b.gold ? "gold" : ""}">${b.value}</div>
    </div>`,
    )
    .join("");
}

// ── BOOTSTRAP ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      wallDeny("Vous devez être connecté pour accéder à cet espace.");
      return;
    }

    wallStatus("Vérification du rôle…");

    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      const role = userData.role || "";

      if (role !== "livreur") {
        wallDeny(
          `Cet espace est réservé aux livreurs certifiés Aurum.<br><small style="color:#4A4540">Rôle actuel : ${role || "client"}</small>`,
        );
        return;
      }

      // Mettre à jour le nom dans la sidebar
      const sbName = document.getElementById("sb-user-name");
      const sbEmail = document.getElementById("sb-user-email");
      if (sbName) sbName.textContent = userData.name || user.displayName || "—";
      if (sbEmail) sbEmail.textContent = user.email || "—";

      wallStatus("Chargement des livraisons…");

      // ── Écoute commandes en attente (real-time) ──────────────────
      db.collection("orders")
        .where("status", "==", "ready_for_delivery")
        .onSnapshot(
          (snap) => {
            const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            renderPending(orders);
          },
          (err) => {
            console.error(err);
            document.getElementById("pending-list").innerHTML =
              '<div class="dv-empty"><div class="dv-empty-sub" style="color:var(--danger)">Erreur de chargement : ' +
              err.message +
              "</div></div>";
          },
        );

      // ── Écoute historique livreur (real-time) ─────────────────────
      db.collection("orders")
        .where("status", "==", "delivered")
        .where("deliveredBy", "==", user.uid)
        .orderBy("deliveredAt", "desc")
        .limit(100)
        .onSnapshot(
          (snap) => {
            const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const todayCount = orders.filter((o) =>
              isToday(o.deliveredAt),
            ).length;
            renderHistory(orders, todayCount);
          },
          (err) => {
            console.error(err);
            document.getElementById("history-list").innerHTML =
              '<div class="dv-empty"><div class="dv-empty-sub" style="color:var(--danger)">Erreur : ' +
              err.message +
              "</div></div>";
          },
        );

      // ── Profil ─────────────────────────────────────────────────────
      renderProfile(userData, user.email);

      // ── Reveal ─────────────────────────────────────────────────────
      setTimeout(wallReveal, 350);
    } catch (err) {
      console.error(err);
      wallDeny("Erreur de vérification : " + err.message);
    }
  });
});
