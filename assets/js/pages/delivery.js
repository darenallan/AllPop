/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — delivery.js  v2
 * Dashboard livreur : commandes en attente, en transit, historique, profil
 *
 * FIXES v2 :
 *   ✓ Suppression du doublon window.acceptDelivery (était défini 2x)
 *   ✓ Ajout du listener pour commandes "in_transit" (l'onglet était vide)
 *   ✓ Guards null sur tous les éléments DOM
 *   ✓ Nettoyage des listeners Firestore à la déconnexion
 *   ✓ showToast → alias vers la fonction globale si disponible
 * ═══════════════════════════════════════════════════════════════════════════
 */

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("tab-pending")) return;

  var db = window.db;
  var auth = window.auth;

  // ── Guards Firebase ──
  if (!db || !auth) {
    console.error("[delivery] Firebase non disponible");
    return;
  }

  // ── Unsub refs pour nettoyage ──
  var _unsubPending = null;
  var _unsubTransit = null;
  var _unsubHistory = null;

  // ── Formatters ──
  function fmtMoney(v) {
    return new Intl.NumberFormat("fr-FR").format(v || 0) + " FCFA";
  }
  function fmtDate(ts) {
    if (!ts) return "—";
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  function isToday(ts) {
    if (!ts) return false;
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toDateString() === new Date().toDateString();
  }
  function ordRef(order) {
    return order.reference || "SAN-" + order.id.slice(-6).toUpperCase();
  }

  // ── Topbar date ──
  (function () {
    var el = document.getElementById("topbar-date");
    if (el)
      el.textContent = new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  })();

  // ── Navigation ──
  var TAB_TITLES = {
    pending: "Livraisons <em>en attente</em>",
    transit: "Livraisons <em>en cours</em>",
    history: "Historique <em>complet</em>",
    profile: "Mon <em>profil</em>",
  };

  window.navTo = function (tabId, btn) {
    document.querySelectorAll(".dv-section").forEach(function (s) {
      s.classList.remove("active");
    });
    var target = document.getElementById("tab-" + tabId);
    if (target) target.classList.add("active");
    document.querySelectorAll(".dv-nav-item").forEach(function (n) {
      n.classList.remove("active");
    });
    if (btn) btn.classList.add("active");
    var tt = document.getElementById("topbar-title");
    if (tt) tt.innerHTML = TAB_TITLES[tabId] || "";
    var sb = document.querySelector(".dv-sidebar");
    if (sb) sb.classList.remove("open");
  };

  window.doLogout = function () {
    auth.signOut().then(function () {
      window.location.href = "/";
    });
  };

  // ── Modal "Confirmer livré" ──
  var _pendingOrderId = null;

  window.openModal = function (orderId, ref) {
    _pendingOrderId = orderId;
    var refEl = document.getElementById("dv-modal-ref");
    if (refEl) refEl.textContent = ref || orderId.slice(-8).toUpperCase();
    var modal = document.getElementById("dv-modal");
    if (modal) modal.classList.add("open");
  };

  window.closeModal = function () {
    _pendingOrderId = null;
    var modal = document.getElementById("dv-modal");
    if (modal) modal.classList.remove("open");
  };

  var okBtn = document.getElementById("dv-modal-ok");
  if (okBtn) {
    okBtn.addEventListener("click", async function () {
      if (!_pendingOrderId) return;
      okBtn.disabled = true;
      try {
        await db.collection("orders").doc(_pendingOrderId).update({
          status: "delivered",
          deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
          deliveredBy: auth.currentUser.uid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (window.showToast)
          window.showToast("Livraison confirmée ✓", "success");
        window.closeModal();
      } catch (err) {
        if (window.showToast)
          window.showToast("Erreur : " + err.message, "danger");
        okBtn.disabled = false;
      }
    });
  }

  // ── Accepter une livraison (ready_for_delivery → in_transit) ──
  // ✅ FIX : Défini UNE SEULE FOIS ici, avec accès garanti à `db` et `auth`
  window.acceptDelivery = async function (orderId) {
    if (
      !confirm(
        "Accepter cette livraison ? Vous deviendrez responsable du colis.",
      )
    )
      return;
    try {
      var courier = auth.currentUser;
      if (!courier) {
        if (window.showToast)
          window.showToast("Vous devez être connecté", "danger");
        return;
      }
      await db
        .collection("orders")
        .doc(orderId)
        .update({
          status: "in_transit",
          courierId: courier.uid,
          courierName: courier.displayName || "Livreur",
          courierEmail: courier.email,
          acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      if (window.showToast)
        window.showToast(
          "Livraison acceptée ✓ Le client est notifié.",
          "success",
        );
    } catch (err) {
      console.error("[delivery] acceptDelivery error:", err);
      if (window.showToast)
        window.showToast("Erreur : " + err.message, "danger");
    }
  };

  // ── Construire les adresses de pickup multi-vendeurs ──
  function buildPickupAddresses(order) {
    if (!Array.isArray(order.sellerIds) || order.sellerIds.length <= 1)
      return "";
    var itemsByShop = {};
    (order.items || []).forEach(function (item) {
      var shopId = item.shopId || item.sellerId || "unknown";
      if (!itemsByShop[shopId]) itemsByShop[shopId] = [];
      itemsByShop[shopId].push(item);
    });
    var pickupList = Object.keys(itemsByShop)
      .map(function (shopId) {
        var shopItems = itemsByShop[shopId];
        var shopName =
          shopItems[0].shopName || shopItems[0].sellerName || shopId;
        var shopAddr =
          shopItems[0].shopAddress || "📍 À confirmer avec la boutique";
        var itemCount = shopItems.reduce(function (s, it) {
          return s + (it.qty || 1);
        }, 0);
        return (
          '<div class="dv-pickup-shop">' +
          "<strong>" +
          shopName +
          "</strong><br>" +
          "<small>" +
          shopAddr +
          "</small><br>" +
          '<small class="dv-pickup-count">' +
          itemCount +
          " article(s)</small>" +
          "</div>"
        );
      })
      .join("");
    return (
      '<div class="dv-pickup-wrap">' +
      '<div class="dv-pickup-label">🚚 Lieux de récupération</div>' +
      pickupList +
      "</div>"
    );
  }

  // ── Rendu commandes en attente / en transit ──
  function renderOrderCard(o, mode) {
    var deliveryAddr = o.deliveryAddress
      ? [
          o.deliveryAddress.street,
          o.deliveryAddress.city,
          o.deliveryAddress.sector,
        ]
          .filter(Boolean)
          .join(", ")
      : "Adresse non spécifiée";
    var items = (o.items || [])
      .map(function (i) {
        return (
          '<li class="dv-item"><strong>' +
          (i.qty || 1) +
          "×</strong> " +
          (i.name || "Article") +
          "</li>"
        );
      })
      .join("");
    var actionBtn = "";
    if (mode === "pending" && o.status === "ready_for_delivery") {
      actionBtn =
        '<button class="dv-accept-btn" onclick="window.acceptDelivery(\'' +
        o.id +
        "')\">" +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14"><polyline points="20 6 9 17 4 12"/></svg>' +
        "<span>Accepter la livraison</span></button>";
    } else if (mode === "transit" && o.status === "in_transit") {
      actionBtn =
        '<button class="dv-confirm-btn" onclick="window.openModal(\'' +
        o.id +
        "','" +
        ordRef(o) +
        "')\">" +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14"><polyline points="20 6 9 17 4 12"/></svg>' +
        "<span>Confirmer livré</span></button>";
    }
    return (
      '<div class="dv-order-card">' +
      '<div class="dv-order-head">' +
      "<div>" +
      '<div class="dv-order-ref">' +
      ordRef(o) +
      "</div>" +
      '<div class="dv-order-meta">' +
      "<span>" +
      fmtDate(o.readyForDeliveryAt || o.acceptedAt || o.updatedAt) +
      "</span>" +
      "<span>" +
      (o.userEmail || o.userName || "Client") +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="dv-order-right">' +
      '<div class="dv-order-total">' +
      fmtMoney(o.total) +
      "</div>" +
      '<span class="dv-chip ' +
      (mode === "transit" ? "transit" : "ready") +
      '">' +
      (mode === "transit" ? "En cours" : "Prêt") +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="dv-order-body">' +
      buildPickupAddresses(o) +
      '<div class="dv-address">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">' +
      '<path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>' +
      '<circle cx="12" cy="10" r="3"/>' +
      "</svg>" +
      '<div class="dv-address-text"><strong>Adresse de livraison</strong><br>' +
      deliveryAddr +
      "</div>" +
      "</div>" +
      (items ? '<ul class="dv-items-list">' + items + "</ul>" : "") +
      actionBtn +
      "</div>" +
      "</div>"
    );
  }

  function renderPending(orders) {
    var el = document.getElementById("pending-list");
    var badge = document.getElementById("badge-pending");
    var stat = document.getElementById("stat-pending");
    if (badge) {
      badge.textContent = orders.length;
      badge.classList.toggle("show", orders.length > 0);
    }
    if (stat) stat.textContent = orders.length;
    if (!el) return;
    if (!orders.length) {
      el.innerHTML =
        '<div class="dv-empty"><div class="dv-empty-icon">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
        '<div class="dv-empty-title">Aucune livraison en attente</div>' +
        '<div class="dv-empty-sub">Les nouvelles commandes prêtes apparaîtront ici.</div></div>';
      return;
    }
    el.innerHTML = orders
      .map(function (o) {
        return renderOrderCard(o, "pending");
      })
      .join("");
  }

  // ✅ FIX : Rendu pour les commandes IN_TRANSIT (onglet manquant dans l'ancienne version)
  function renderTransit(orders) {
    var el = document.getElementById("transit-list");
    var badge = document.getElementById("badge-transit");
    var stat = document.getElementById("stat-transit");
    if (badge) {
      badge.textContent = orders.length;
      badge.classList.toggle("show", orders.length > 0);
    }
    if (stat) stat.textContent = orders.length;
    if (!el) return;
    if (!orders.length) {
      el.innerHTML =
        '<div class="dv-empty">' +
        '<div class="dv-empty-title">Aucune livraison en cours</div>' +
        '<div class="dv-empty-sub">Acceptez une commande pour qu\'elle apparaisse ici.</div></div>';
      return;
    }
    el.innerHTML = orders
      .map(function (o) {
        return renderOrderCard(o, "transit");
      })
      .join("");
  }

  function renderHistory(orders, todayCount) {
    var el = document.getElementById("history-list");
    var today = document.getElementById("stat-done-today");
    var total = document.getElementById("stat-total");
    if (today) today.textContent = todayCount;
    if (total) total.textContent = orders.length;
    if (!el) return;
    if (!orders.length) {
      el.innerHTML =
        '<div class="dv-empty"><div class="dv-empty-title">Aucune livraison effectuée</div></div>';
      return;
    }
    el.innerHTML = orders
      .map(function (o) {
        return (
          '<div class="dv-history-item">' +
          '<div><div class="dv-history-ref">' +
          ordRef(o) +
          "</div>" +
          '<div class="dv-history-date">Livré le ' +
          fmtDate(o.deliveredAt) +
          "</div></div>" +
          '<div style="text-align:right"><div class="dv-history-total">' +
          fmtMoney(o.total) +
          "</div>" +
          '<span class="dv-chip delivered">Livré</span></div>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderProfile(userData, email) {
    var el = document.getElementById("profile-grid");
    if (!el) return;
    var certDate = userData.certifiedAt
      ? new Date(
          userData.certifiedAt.toDate
            ? userData.certifiedAt.toDate()
            : userData.certifiedAt,
        ).toLocaleDateString("fr-FR")
      : "N/A";
    var blocks = [
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
      .map(function (b) {
        return (
          '<div class="dv-profile-block">' +
          '<div class="dv-profile-label">' +
          b.label +
          "</div>" +
          '<div class="dv-profile-value' +
          (b.gold ? " gold" : "") +
          '">' +
          b.value +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // ── Auth + Listeners ──
  auth.onAuthStateChanged(async function (user) {
    // Nettoyer les anciens listeners
    if (_unsubPending) {
      _unsubPending();
      _unsubPending = null;
    }
    if (_unsubTransit) {
      _unsubTransit();
      _unsubTransit = null;
    }
    if (_unsubHistory) {
      _unsubHistory();
      _unsubHistory = null;
    }

    if (!user) {
      if (window.AuthWall)
        window.AuthWall.deny({
          redirectUrl: "/login",
          redirectLabel: "Se connecter",
          reason: "Connexion requise.",
        });
      else window.location.href = "/login";
      return;
    }

    try {
      var userDoc = await db.collection("users").doc(user.uid).get();
      var userData = userDoc.exists ? userDoc.data() : {};

      if (userData.role !== "livreur") {
        if (window.AuthWall)
          window.AuthWall.deny({
            email: user.email,
            reason: "Espace réservé aux livreurs certifiés Sanhia.",
          });
        else window.location.href = "/";
        return;
      }

      var sbName = document.getElementById("sb-user-name");
      var sbEmail = document.getElementById("sb-user-email");
      if (sbName) sbName.textContent = userData.name || user.displayName || "—";
      if (sbEmail) sbEmail.textContent = user.email || "—";

      // Listener 1 — Commandes prêtes à livrer
      _unsubPending = db
        .collection("orders")
        .where("status", "==", "ready_for_delivery")
        .limit(50)
        .onSnapshot(
          function (snap) {
            var orders = snap.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            renderPending(orders);
          },
          function (err) {
            console.error("[delivery] pending listener:", err.message);
          },
        );

      // ✅ FIX : Listener 2 — Commandes que CE livreur a acceptées (in_transit)
      _unsubTransit = db
        .collection("orders")
        .where("status", "==", "in_transit")
        .where("courierId", "==", user.uid)
        .limit(20)
        .onSnapshot(
          function (snap) {
            var orders = snap.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            renderTransit(orders);
          },
          function (err) {
            console.error("[delivery] transit listener:", err.message);
          },
        );

      // Listener 3 — Historique des livraisons effectuées
      _unsubHistory = db
        .collection("orders")
        .where("status", "==", "delivered")
        .where("deliveredBy", "==", user.uid)
        .orderBy("deliveredAt", "desc")
        .limit(100)
        .onSnapshot(
          function (snap) {
            var orders = snap.docs.map(function (d) {
              return Object.assign({ id: d.id }, d.data());
            });
            renderHistory(
              orders,
              orders.filter(function (o) {
                return isToday(o.deliveredAt);
              }).length,
            );
          },
          function (err) {
            console.error("[delivery] history listener:", err.message);
          },
        );

      renderProfile(userData, user.email);
      setTimeout(function () {
        if (window.AuthWall) window.AuthWall.reveal();
      }, 350);
    } catch (err) {
      console.error("[delivery] bootstrap:", err);
      if (window.AuthWall)
        window.AuthWall.deny({
          reason: "Erreur de vérification : " + err.message,
        });
    }
  });
});
// NOTE : window.acceptDelivery est défini UNE SEULE FOIS à l'intérieur du DOMContentLoaded
// pour garantir l'accès à `db` et `auth`. L'ancien doublon global a été supprimé.
