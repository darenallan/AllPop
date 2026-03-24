/**
 * seller.js
 * Dashboard vendeur complet : produits, commandes, paramètres, messages
 * Section §19 de prime.js
 *
 * FIXES APPLIQUÉS :
 * 1. Suppression de la double définition de sdUpdateOrderStatus
 * 2. Correction du onchange (quotes échappées)
 * 3. Règle Firestore compatible sellerId (string) ET sellerIds (array)
 * 4. currentSellerUid conservé pour sellerStatuses
 */

document.addEventListener("DOMContentLoaded", function () {
  var sdContainer = document.getElementById("sd");
  if (!sdContainer) return;

  // Masquer le contenu pendant la vérification d'autorisation
  sdContainer.style.opacity = "0";
  sdContainer.style.pointerEvents = "none";

  window.sdShowContent = function () {
    sdContainer.style.transition = "opacity 0.3s ease";
    sdContainer.style.opacity = "1";
    sdContainer.style.pointerEvents = "auto";
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  window.sdSwitchTab = function (name) {
    document.querySelectorAll("#sd .sd-tab").forEach(function (t) {
      t.classList.remove("on");
    });
    document
      .querySelectorAll("#sd .sd-nav-item[data-tab]")
      .forEach(function (l) {
        l.classList.remove("on");
      });
    var tab = document.getElementById("sd-tab-" + name);
    if (tab) tab.classList.add("on");
    var link = document.querySelector(
      '#sd .sd-nav-item[data-tab="' + name + '"]',
    );
    if (link) link.classList.add("on");
    var TITLES = {
      overview: "Vue d'ensemble",
      products: "Mes Produits",
      "add-product": "Ajouter un produit",
      orders: "Commandes",
      settings: "Paramètres",
      messages: "Messagerie",
    };
    var el = document.getElementById("sd-topbar-section");
    if (el) el.textContent = TITLES[name] || name;
    var sb = document.getElementById("sd-sidebar");
    if (sb) sb.classList.remove("open");
  };

  document
    .querySelectorAll("#sd .sd-nav-item[data-tab]")
    .forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        window.sdSwitchTab(link.getAttribute("data-tab"));
      });
    });

  window.sdLogout = function () {
    if (!confirm("Se déconnecter ?")) return;
    firebase
      .auth()
      .signOut()
      .then(function () {
        window.location.href = "/login";
      });
  };

  // ─── Utilitaires ──────────────────────────────────────────────────────────
  var sdFmt = function (n) {
    return new Intl.NumberFormat("fr-FR").format(n);
  };
  var sdFmtDate = function (ts) {
    try {
      var d = ts?.toDate
        ? ts.toDate()
        : new Date(ts?.seconds ? ts.seconds * 1000 : ts);
      return d.toLocaleDateString("fr-FR");
    } catch (e) {
      return "";
    }
  };

  function sdStatus(status) {
    var s = (status || "").toLowerCase();
    if (s === "pending_admin" || s === "pending")
      return { label: "En attente", cls: "warn" };
    if (s === "validated") return { label: "Validée", cls: "info" };
    if (s === "pending_seller" || s === "in_preparation")
      return { label: "En préparation", cls: "info" };
    if (s === "ready_for_delivery")
      return { label: "En livraison", cls: "info" };
    if (s === "in_transit") return { label: "En transit", cls: "ok" };
    if (s === "delivered" || s.includes("livr"))
      return { label: "Livré", cls: "ok" };
    if (s === "cancelled" || s.includes("annul"))
      return { label: "Annulé", cls: "err" };
    if (s === "shipped" || s.includes("expéd"))
      return { label: "Expédié", cls: "info" };
    return { label: "En cours", cls: "info" };
  }

  // ─── Prévisualisation images produit ──────────────────────────────────────
  var fpImages = document.getElementById("fp-images");
  if (fpImages) {
    fpImages.addEventListener("change", function () {
      var preview = document.getElementById("sd-img-preview");
      if (!preview) return;
      preview.innerHTML = "";
      Array.from(this.files).forEach(function (file) {
        var r = new FileReader();
        r.onload = function (e2) {
          var div = document.createElement("div");
          div.className = "sd-img-thumb";
          div.innerHTML =
            '<img src="' +
            e2.target.result +
            '" alt=""><button class="sd-img-thumb-del" type="button" onclick="this.parentElement.remove()" title="Supprimer">×</button>';
          preview.appendChild(div);
        };
        r.readAsDataURL(file);
      });
    });
  }

  window.sdResetForm = function () {
    var f = document.getElementById("sd-product-form");
    if (f) f.reset();
    var p = document.getElementById("sd-img-preview");
    if (p) p.innerHTML = "";
    window.sdSwitchTab("products");
  };

  // ─── Guard Firebase ───────────────────────────────────────────────────────
  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  ) {
    console.error("[seller.js] Firebase SDK manquant ou non initialisé");
    return;
  }

  var db2 = firebase.firestore();
  var auth = firebase.auth();
  var storage = firebase.storage ? firebase.storage() : null;

  var currentShopId = null;
  var currentShopData = null;
  var currentSellerUid = null; // UID Firebase Auth du vendeur connecté
  var _unsubOrders = null;

  // ─── Auth & chargement boutique ───────────────────────────────────────────
  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      // Tentative 1 : par email
      var snap = await db2
        .collection("shops")
        .where("ownerEmail", "==", user.email)
        .limit(1)
        .get();

      // Tentative 2 : par ownerId
      if (snap.empty) {
        snap = await db2
          .collection("shops")
          .where("ownerId", "==", user.uid)
          .limit(1)
          .get();
      }

      // Tentative 3 : par sellerId
      if (snap.empty) {
        snap = await db2
          .collection("shops")
          .where("sellerId", "==", user.uid)
          .limit(1)
          .get();
      }

      if (snap.empty) {
        console.warn("[Seller] Aucune boutique pour:", user.email, user.uid);
        if (typeof window.sdShowContent === "function") window.sdShowContent();
        var info = document.getElementById("sd-shop-info-body");
        if (info)
          info.innerHTML =
            '<p style="color:var(--s);font-size:13px">Aucune boutique associée à votre compte.<br>Contactez l\'administrateur Sanhia.</p>';
        ["sd-stat-products", "sd-stat-sales", "sd-stat-views"].forEach(
          function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = "—";
          },
        );
        return;
      }

      var doc = snap.docs[0];
      var shopData = Object.assign({ id: doc.id }, doc.data());

      if (shopData.status === "blocked" || shopData.status === "suspended") {
        console.warn("[Seller] Boutique bloquée:", shopData.id);
        if (typeof window.sdShowContent === "function") window.sdShowContent();
        var info2 = document.getElementById("sd-shop-info-body");
        if (info2)
          info2.innerHTML =
            '<p style="color:#D94F4F;font-size:13px">Votre boutique est suspendue. Contactez l\'administrateur.</p>';
        return;
      }

      currentShopId = doc.id;
      currentShopData = shopData;
      currentSellerUid = user.uid; // UID vendeur — clé pour sellerStatuses

      initSdDashboard(user, currentShopData);
    } catch (e) {
      console.error("[Seller] Erreur auth boutique:", e);
      if (typeof window.sdShowContent === "function") window.sdShowContent();
      var errEl = document.getElementById("sd-shop-info-body");
      if (errEl)
        errEl.innerHTML =
          '<p style="color:#D94F4F;font-size:13px">Erreur : ' +
          e.message +
          "</p>";
    }
  });

  // ─── Init dashboard ───────────────────────────────────────────────────────
  async function initSdDashboard(user, shop) {
    var name = shop.name || "Ma Boutique";
    var setEl = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setEl("sd-shop-name", name);
    setEl("sd-topbar-shop", name);
    setEl("sd-shop-initial", name.charAt(0).toUpperCase());

    if (shop.logo) {
      var img = document.getElementById("sd-shop-logo");
      if (img) {
        img.src = shop.logo;
        img.style.display = "block";
      }
      var ini = document.getElementById("sd-shop-initial");
      if (ini) ini.style.display = "none";
    }
    if (shop.banner) {
      var bannerPrev = document.getElementById("sp-banner-preview");
      if (bannerPrev)
        bannerPrev.innerHTML =
          '<div class="sd-img-thumb" style="width:100%;height:120px"><img src="' +
          shop.banner +
          '" style="width:100%;height:100%;object-fit:cover"></div>';
    }

    var isActive = shop.status === "active" || shop.status === "Active";
    var statusHtml =
      '<span class="sd-status-badge ' +
      (isActive ? "ok" : "warn") +
      '">● ' +
      (isActive ? "Active" : "Inactive") +
      "</span>";
    ["sd-shop-status-block", "sd-shop-status-inline"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = statusHtml;
    });

    setEl("sd-shop-category", shop.category || "—");
    ["name", "category", "city", "phone", "description"].forEach(function (k) {
      var el = document.getElementById("sp-" + k);
      if (el) el.value = shop[k] || "";
    });

    if (typeof window.sdShowContent === "function") window.sdShowContent();

    await Promise.all([sdLoadProducts(), sdLoadOrders(), sdLoadStats()]);
    sdLoadMessages(user);
  }

  // ─── Produits ─────────────────────────────────────────────────────────────
  async function sdLoadProducts() {
    try {
      var snap = await db2
        .collection("products")
        .where("shopId", "==", currentShopId)
        .get();
      var products = snap.docs.map(function (d) {
        return Object.assign({ id: d.id }, d.data());
      });

      var badge = document.getElementById("sd-products-badge");
      if (badge) {
        badge.textContent = products.length;
        badge.style.display = products.length ? "flex" : "none";
      }

      var tbody = document.getElementById("sd-products-tbody");
      if (!tbody) return;

      if (!products.length) {
        tbody.innerHTML =
          '<tr><td colspan="6"><div class="sd-empty"><div class="sd-empty-title">Aucun produit</div></div></td></tr>';
        return;
      }

      tbody.innerHTML = products
        .map(function (p) {
          var img =
            (Array.isArray(p.images) ? p.images[0] : null) ||
            p.image ||
            "assets/img/placeholder-product-1.svg";
          var st = sdStatus(p.status || "active");
          var html =
            '<tr><td><div class="sd-prod-cell"><div class="sd-prod-thumb"><img src="' +
            img +
            '" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"></div>';
          html +=
            '<div><div class="sd-prod-name">' +
            (p.name || "—") +
            '</div><div class="sd-prod-cat">' +
            (p.category || "") +
            "</div></div></div></td>";
          html += '<td class="price">' + sdFmt(p.price || 0) + " FCFA</td>";
          html +=
            '<td style="color:' +
            (p.stock < 5 ? "var(--warn)" : "rgba(254,252,248,.6)") +
            '">' +
            (p.stock || 0) +
            "</td>";
          html += "<td>" + (p.category || "—") + "</td>";
          html +=
            '<td><span class="sd-status-badge ' +
            st.cls +
            '">' +
            st.label +
            "</span></td>";
          html += '<td><div class="sd-table-actions">';
          html +=
            '<button class="sd-tbl-btn" onclick="window.sdEditProduct(\'' +
            p.id +
            "')\">Modifier</button>";
          var pname = (p.name || "").replace(/'/g, "\\'");
          html +=
            '<button class="sd-tbl-btn del" onclick="window.sdDeleteProduct(\'' +
            p.id +
            "','" +
            pname +
            "')\">× Supprimer</button>";
          html += "</div></td></tr>";
          return html;
        })
        .join("");
    } catch (e) {
      console.error("[sd] sdLoadProducts:", e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SYSTÈME DE SÉCURISATION DES STATUTS DE COMMANDE
  // ══════════════════════════════════════════════════════════════════════════

  var STATUS_HIERARCHY = [
    "validated",
    "in_preparation",
    "ready_for_delivery",
    "in_transit",
    "delivered",
  ];
  var LOCKED_STATUSES = [
    "ready_for_delivery",
    "in_transit",
    "delivered",
    "cancelled",
  ];
  var STATUS_LABELS = {
    validated: "Validée (admin)",
    in_preparation: "En préparation",
    ready_for_delivery: "Prêt à livrer",
    in_transit: "En transit (livreur)",
    delivered: "Livré",
    cancelled: "Annulé",
  };

  window.sdOrderStatusCache = {};

  function getStatusIndex(status) {
    var idx = STATUS_HIERARCHY.indexOf(status);
    return idx >= 0 ? idx : -1;
  }

  function isValidStatusTransition(oldStatus, newStatus) {
    if (["cancelled", "delivered"].includes(oldStatus)) return false;
    if (newStatus === "cancelled") return true;
    var oldIdx = getStatusIndex(oldStatus);
    var newIdx = getStatusIndex(newStatus);
    return newIdx > oldIdx;
  }

  function resetOrderSelect(orderId) {
    var select = document.querySelector(
      'select[data-order-id="' + orderId + '"]',
    );
    if (select && window.sdOrderStatusCache[orderId]) {
      select.value = window.sdOrderStatusCache[orderId];
    }
  }

  document.addEventListener(
    "focus",
    function (e) {
      if (
        e.target &&
        e.target.tagName === "SELECT" &&
        e.target.hasAttribute("data-order-id")
      ) {
        var orderId = e.target.getAttribute("data-order-id");
        window.sdOrderStatusCache[orderId] = e.target.value;
      }
    },
    true,
  );

  function attachOrderStatusListeners() {
    document
      .querySelectorAll("select[data-order-id]")
      .forEach(function (select) {
        var orderId = select.getAttribute("data-order-id");
        var status = select.getAttribute("data-current-status");
        window.sdOrderStatusCache[orderId] = status;

        if (LOCKED_STATUSES.includes(status)) {
          select.disabled = true;
          select.title = "Cette commande ne peut plus être modifiée.";
          select.style.opacity = "0.5";
          select.style.cursor = "not-allowed";
        } else {
          select.disabled = false;
          select.title = "";
          select.style.opacity = "1";
          select.style.cursor = "pointer";
        }

        select.addEventListener("focus", function () {
          window.sdOrderStatusCache[orderId] = this.value;
        });
      });
  }

  // ── Mise à jour statut commande (VERSION UNIQUE — pas de doublon) ──────────
  window.sdUpdateOrderStatus = async function (orderId, newStatus) {
    try {
      var orderSnap = await db2.collection("orders").doc(orderId).get();
      if (!orderSnap.exists) {
        if (window.showToast)
          window.showToast("Commande introuvable", "danger");
        resetOrderSelect(orderId);
        return;
      }

      var currentOrder = orderSnap.data();

      // Statut actuel de CE vendeur (clé = currentShopId)
      var oldStatus =
        (currentOrder.sellerStatuses &&
          currentOrder.sellerStatuses[currentShopId]) ||
        "validated";

      if (!isValidStatusTransition(oldStatus, newStatus)) {
        if (window.showToast)
          window.showToast(
            "Action impossible : vous ne pouvez pas revenir à un statut précédent.",
            "danger",
          );
        resetOrderSelect(orderId);
        return;
      }

      var newLabel = STATUS_LABELS[newStatus] || newStatus;
      var confirmMsg =
        'Passer cette commande en "' +
        newLabel +
        '" ? Cette action est définitive.';
      if (!confirm(confirmMsg)) {
        resetOrderSelect(orderId);
        return;
      }

      // ÉTAPE 1 : Mise à jour du statut de ce vendeur
      console.log(
        "[sdUpdateOrderStatus] ÉTAPE 1 — Vendeur:",
        currentShopId,
        "|",
        oldStatus,
        "→",
        newStatus,
      );
      await db2
        .collection("orders")
        .doc(orderId)
        .update({
          ["sellerStatuses." + currentShopId]: newStatus,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      // ÉTAPE 2 : Relire la commande fraîche
      var docSnap = await db2.collection("orders").doc(orderId).get();
      var orderData = docSnap.data();
      var statuses = orderData.sellerStatuses || {};
      var allSellers = orderData.sellerIds || [];

      console.log(
        "[sdUpdateOrderStatus] ÉTAPE 2 — sellerIds:",
        allSellers,
        "| sellerStatuses:",
        statuses,
      );

      // ÉTAPE 3 : Vérifier si tous les vendeurs sont prêts
      var allReady =
        allSellers.length > 0 &&
        allSellers.every(function (id) {
          return (
            statuses[id] === "ready_for_delivery" ||
            statuses[id] === "in_transit"
          );
        });

      // ÉTAPE 4 : Mettre à jour le statut global
      if (allReady) {
        console.log(
          "[sdUpdateOrderStatus] ✅ Tous les vendeurs prêts → ready_for_delivery",
        );
        await db2.collection("orders").doc(orderId).update({
          status: "ready_for_delivery",
          readyForDeliveryAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        if (window.showToast)
          window.showToast(
            "Tous les vendeurs sont prêts ! Commande visible pour livraison.",
            "success",
          );
      } else {
        console.log(
          "[sdUpdateOrderStatus] ✅ Statut vendeur mis à jour. En attente des autres boutiques.",
        );
        await db2
          .collection("orders")
          .doc(orderId)
          .update({ status: "validated" });
        if (window.showToast)
          window.showToast(
            "Statut mis à jour. En attente des autres boutiques.",
            "info",
          );
      }

      await sdLoadOrders();
    } catch (e) {
      console.error("[sdUpdateOrderStatus] Erreur:", e);
      if (window.showToast)
        window.showToast(
          "Erreur lors de la mise à jour : " + e.message,
          "danger",
        );
      resetOrderSelect(orderId);
    }
  };

  // ─── Commandes ────────────────────────────────────────────────────────────
  async function sdLoadOrders() {
    try {
      if (_unsubOrders) _unsubOrders();

      console.log(
        "[sdLoadOrders] Listeners pour shopId:",
        currentShopId,
        "| uid:",
        currentSellerUid,
      );

      var filterItemsForSeller = function (items) {
        if (!Array.isArray(items)) return [];
        return items.filter(function (it) {
          return (
            it.shopId === currentShopId ||
            it.sellerId === currentShopId ||
            it.sellerId === currentSellerUid
          );
        });
      };

      var calculateSellerTotal = function (items) {
        return filterItemsForSeller(items).reduce(function (sum, it) {
          return sum + (it.price || 0) * (it.qty || 1);
        }, 0);
      };

      var allOrders = [];
      var subOrdersUnsub = null;
      var parentOrdersUnsub = null;
      var renderTimeout = null;

      var renderOrders = function () {
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(function () {
          var c = document.getElementById("sd-orders-list");
          var cr = document.getElementById("sd-recent-orders");
          if (c) c.innerHTML = "";
          if (cr) cr.innerHTML = "";

          var badge = document.getElementById("sd-orders-badge");
          var pending = allOrders.filter(function (o) {
            var vs =
              (o.sellerStatuses && o.sellerStatuses[currentShopId]) ||
              "validated";
            return !LOCKED_STATUSES.includes(vs.toLowerCase());
          }).length;
          if (badge) {
            badge.textContent = pending;
            badge.style.display = pending ? "flex" : "none";
          }

          // ── Conteneur principal ──
          if (c)
            c.innerHTML = allOrders.length
              ? allOrders
                  .map(function (o) {
                    var vendorStatus =
                      (o.sellerStatuses && o.sellerStatuses[currentShopId]) ||
                      "validated";
                    var st = sdStatus(vendorStatus);
                    var locked = LOCKED_STATUSES.includes(vendorStatus);

                    var vendorItems = filterItemsForSeller(o.items || []);
                    var vendorTotal = calculateSellerTotal(o.items || []);

                    var itemsHtml = vendorItems
                      .map(function (it) {
                        return (
                          '<li style="font-size:12px;color:var(--s);margin:4px 0">' +
                          (it.qty || 1) +
                          "× " +
                          it.name +
                          " (" +
                          sdFmt(it.price) +
                          " FCFA)</li>"
                        );
                      })
                      .join("");

                    // ⚠️ onchange avec quotes correctement échappées
                    var selectHtml =
                      '<select class="sd-input"' +
                      ' data-order-id="' +
                      o.id +
                      '"' +
                      ' data-current-status="' +
                      vendorStatus +
                      '"' +
                      (locked ? ' disabled title="Statut verrouillé"' : "") +
                      ' style="padding:6px 28px 6px 10px;font-size:11px;background:var(--i3)' +
                      (locked ? ";opacity:0.5;cursor:not-allowed" : "") +
                      '"' +
                      " onchange=\"window.sdUpdateOrderStatus('" +
                      o.id +
                      "', this.value)\">" +
                      '<option value="validated"' +
                      (vendorStatus === "validated" ? " selected" : "") +
                      ">✓ Validée (admin)</option>" +
                      '<option value="in_preparation"' +
                      (vendorStatus === "in_preparation" ? " selected" : "") +
                      ">⚙ En préparation</option>" +
                      '<option value="ready_for_delivery"' +
                      (vendorStatus === "ready_for_delivery"
                        ? " selected"
                        : "") +
                      ">📦 Prêt à livrer</option>" +
                      '<option value="in_transit" disabled' +
                      (vendorStatus === "in_transit" ? " selected" : "") +
                      ">🚚 En transit</option>" +
                      '<option value="delivered" disabled' +
                      (vendorStatus === "delivered" ? " selected" : "") +
                      ">✅ Livré</option>" +
                      "</select>";

                    return (
                      '<div class="sd-order-row">' +
                      "<div>" +
                      '<div class="sd-order-ref">#' +
                      (o.reference || o.id.substring(0, 8).toUpperCase()) +
                      "</div>" +
                      '<div class="sd-order-meta">' +
                      sdFmtDate(o.createdAt) +
                      "</div>" +
                      (itemsHtml
                        ? '<ul style="margin:8px 0;padding-left:16px;list-style:none">' +
                          itemsHtml +
                          "</ul>"
                        : "") +
                      "</div>" +
                      '<div><span class="sd-status-badge ' +
                      st.cls +
                      '">' +
                      st.label +
                      "</span></div>" +
                      "<div style=\"font-family:'Unbounded',sans-serif;font-size:13px;color:var(--g);font-weight:700\">" +
                      sdFmt(vendorTotal) +
                      " FCFA</div>" +
                      "<div>" +
                      selectHtml +
                      "</div>" +
                      "<div></div>" +
                      "</div>"
                    );
                  })
                  .join("")
              : '<div class="sd-empty"><div class="sd-empty-title">Aucune commande</div></div>';

          // ── Commandes récentes (overview) ──
          if (cr)
            cr.innerHTML = allOrders
              .slice(0, 5)
              .map(function (o) {
                var vs =
                  (o.sellerStatuses && o.sellerStatuses[currentShopId]) ||
                  "validated";
                var st = sdStatus(vs);
                var total = calculateSellerTotal(o.items || []);
                return (
                  '<div class="sd-order-row">' +
                  "<div>" +
                  '<div class="sd-order-ref">#' +
                  (o.reference || o.id.substring(0, 8).toUpperCase()) +
                  "</div>" +
                  '<div class="sd-order-meta">' +
                  sdFmtDate(o.createdAt) +
                  "</div>" +
                  "</div>" +
                  '<div><span class="sd-status-badge ' +
                  st.cls +
                  '">' +
                  st.label +
                  "</span></div>" +
                  "<div style=\"font-family:'Unbounded',sans-serif;font-size:13px;color:var(--g);font-weight:700\">" +
                  sdFmt(total) +
                  " FCFA</div>" +
                  "<div></div><div></div>" +
                  "</div>"
                );
              })
              .join("");

          setTimeout(attachOrderStatusListeners, 0);
          console.log("✅ [Seller] Orders mis à jour:", allOrders.length);
        }, 100);
      };

      // Helper : merge un snapshot dans allOrders sans doublons (par id)
      var mergeOrders = function (newOrders, src) {
        // Supprimer les anciens de cette source
        allOrders = allOrders.filter(function (o) {
          return o._src !== src;
        });
        // Supprimer aussi les doublons d'autres sources (même id)
        var newIds = {};
        newOrders.forEach(function (o) {
          newIds[o.id] = true;
        });
        allOrders = allOrders.filter(function (o) {
          return !newIds[o.id];
        });
        // Ajouter les nouveaux
        allOrders = allOrders.concat(newOrders);
        // Trier par date desc
        allOrders.sort(function (a, b) {
          var aT =
            a.createdAt?.toDate?.()?.getTime?.() ||
            (a.createdAt?.seconds || 0) * 1000;
          var bT =
            b.createdAt?.toDate?.()?.getTime?.() ||
            (b.createdAt?.seconds || 0) * 1000;
          return bT - aT;
        });
        console.log(
          "[orders-" + src + "] total:",
          allOrders.length,
          "| ajoutés:",
          newOrders.length,
        );
        renderOrders();
      };

      // Listener A : sellerId == shopId (format le plus courant)
      var unsubA = db2
        .collection("orders")
        .where("sellerId", "==", currentShopId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .onSnapshot(
          function (snap) {
            mergeOrders(
              snap.docs.map(function (d) {
                return Object.assign({ id: d.id }, d.data(), {
                  _src: "byShopId",
                });
              }),
              "byShopId",
            );
          },
          function (err) {
            console.warn(
              "[Seller] Listener A (sellerId==shopId):",
              err.message,
            );
          },
        );

      // Listener B : sellerId == uid (au cas où le champ stocke l'uid)
      var unsubB = null;
      if (currentSellerUid && currentSellerUid !== currentShopId) {
        unsubB = db2
          .collection("orders")
          .where("sellerId", "==", currentSellerUid)
          .orderBy("createdAt", "desc")
          .limit(50)
          .onSnapshot(
            function (snap) {
              mergeOrders(
                snap.docs.map(function (d) {
                  return Object.assign({ id: d.id }, d.data(), {
                    _src: "byUid",
                  });
                }),
                "byUid",
              );
            },
            function (err) {
              console.warn("[Seller] Listener B (sellerId==uid):", err.message);
            },
          );
      }

      // Listener C : sellerIds array-contains shopId (format multi-vendeurs — la valeur stockée est le shopId)
      var unsubC = db2
        .collection("orders")
        .where("sellerIds", "array-contains", currentShopId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .onSnapshot(
          function (snap) {
            mergeOrders(
              snap.docs.map(function (d) {
                return Object.assign({ id: d.id }, d.data(), {
                  _src: "bySellerIds",
                });
              }),
              "bySellerIds",
            );
          },
          function (err) {
            console.warn("[Seller] Listener C (sellerIds):", err.message);
            if (err.message.includes("index")) {
              console.warn(
                "[Seller] Index Firestore manquant — créez-le dans Firebase Console.",
              );
            }
          },
        );

      _unsubOrders = function () {
        unsubA();
        if (unsubB) unsubB();
        unsubC();
      };
    } catch (e) {
      console.error("[sd] sdLoadOrders:", e);
    }
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────
  async function sdLoadStats() {
    try {
      var calcTotal = function (items) {
        if (!Array.isArray(items)) return 0;
        return items
          .filter(function (it) {
            return it.shopId === currentShopId || it.sellerId === currentShopId;
          })
          .reduce(function (s, it) {
            return s + (it.price || 0) * (it.qty || 1);
          }, 0);
      };

      var subSnap = await db2
        .collection("orders")
        .where("sellerId", "==", currentShopId)
        .limit(100)
        .get()
        .catch(function () {
          return { docs: [] };
        });
      var parentSnap = await db2
        .collection("orders")
        .where("sellerIds", "array-contains", currentSellerUid || currentShopId)
        .limit(100)
        .get()
        .catch(function () {
          return { docs: [] };
        });

      var allDocs = subSnap.docs.concat(parentSnap.docs);
      var totalSales = allDocs
        .map(function (d) {
          return d.data();
        })
        .filter(function (o) {
          return o.status === "delivered";
        })
        .reduce(function (s, o) {
          return s + calcTotal(o.items || []);
        }, 0);

      var psnap = await db2
        .collection("products")
        .where("shopId", "==", currentShopId)
        .get();
      var setEl = function (id, v) {
        var el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      setEl("sd-stat-products", sdFmt(psnap.size));
      setEl("sd-stat-sales", sdFmt(totalSales));
      setEl("sd-stat-views", sdFmt(currentShopData.views || 0));
    } catch (e) {
      ["sd-stat-products", "sd-stat-sales", "sd-stat-views"].forEach(
        function (id) {
          var el = document.getElementById(id);
          if (el) el.textContent = "—";
        },
      );
    }
  }

  // ─── Édition / suppression produits ──────────────────────────────────────
  window.sdEditProduct = function (pid) {
    window.sdSwitchTab("add-product");
    db2
      .collection("products")
      .doc(pid)
      .get()
      .then(function (doc) {
        if (!doc.exists) return;
        var p = doc.data();
        [
          "name",
          "category",
          "price",
          "original-price",
          "stock",
          "sku",
          "description",
        ].forEach(function (k) {
          var el = document.getElementById("fp-" + k);
          if (el)
            el.value =
              p[
                k.replace("-", "_").replace("original_price", "originalPrice")
              ] ||
              p[k] ||
              "";
        });
        var fp = document.getElementById("sd-product-form");
        if (fp) fp.dataset.editId = pid;
      });
  };

  window.sdDeleteProduct = async function (pid, name) {
    if (!confirm('Supprimer "' + name + '" ?')) return;
    try {
      await db2.collection("products").doc(pid).delete();
      if (window.showToast) window.showToast("Produit supprimé", "success");
      sdLoadProducts();
    } catch (e) {
      if (window.showToast) window.showToast("Erreur suppression", "danger");
    }
  };

  // ─── Formulaire ajout / édition produit ───────────────────────────────────
  var sdProductForm = document.getElementById("sd-product-form");
  if (sdProductForm) {
    sdProductForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btn = document.getElementById("sd-submit-btn");
      if (btn) {
        btn.disabled = true;
        var sp = btn.querySelector("span");
        if (sp) sp.textContent = "Publication…";
      }

      try {
        var editId = e.target.dataset.editId;
        var g = function (id) {
          return document.getElementById(id)?.value || "";
        };

        var productName = g("fp-name");
        var slug =
          productName
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-") +
          "-" +
          Math.random().toString(36).substring(2, 6);

        var data = {
          name: productName,
          slug: slug,
          category: g("fp-category"),
          price: Number(g("fp-price")) || 0,
          stock: Number(g("fp-stock")) || 0,
          sku: g("fp-sku"),
          description: g("fp-description"),
          colors: g("fp-colors")
            .split(",")
            .map(function (c) {
              return c.trim();
            })
            .filter(Boolean),
          sizes: g("fp-sizes")
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean),
          shopId: currentShopId,
          shopName: currentShopData?.name || "",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        var op = Number(g("fp-original-price")) || 0;
        if (op) data.originalPrice = op;

        var fileInput = document.getElementById("fp-images");
        if (fileInput && fileInput.files.length > 0 && storage) {
          var urls = [];
          for (var file of fileInput.files) {
            var compressed = await window.compressImage(file);
            var ref2 = storage.ref(
              "products/" + currentShopId + "/" + Date.now() + ".webp",
            );
            var sn = await ref2.put(compressed);
            urls.push(await sn.ref.getDownloadURL());
          }
          data.images = urls;
          data.image = urls[0];
        }

        if (editId) {
          await db2.collection("products").doc(editId).update(data);
          delete e.target.dataset.editId;
          if (window.showToast)
            window.showToast("Produit mis à jour", "success");
        } else {
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db2.collection("products").add(data);
          if (window.showToast)
            window.showToast("Produit publié avec succès", "success");
        }

        e.target.reset();
        var prev = document.getElementById("sd-img-preview");
        if (prev) prev.innerHTML = "";
        window.sdSwitchTab("products");
        sdLoadProducts();
      } catch (err) {
        if (window.showToast)
          window.showToast("Erreur : " + err.message, "danger");
        console.error(err);
      } finally {
        if (btn) {
          btn.disabled = false;
          var sp2 = btn.querySelector("span");
          if (sp2) sp2.textContent = "Publier le produit";
        }
      }
    });
  }

  // ─── Formulaire paramètres boutique ───────────────────────────────────────
  var sdSettingsForm = document.getElementById("sd-settings-form");
  if (sdSettingsForm) {
    sdSettingsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      try {
        var g = function (id) {
          return document.getElementById(id)?.value || "";
        };
        var updates = {
          name: g("sp-name"),
          category: g("sp-category"),
          city: g("sp-city"),
          phone: g("sp-phone"),
          description: g("sp-description"),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        var logoFile = document.getElementById("sp-logo-file")?.files[0];
        if (logoFile && storage) {
          var clLogo = await window.compressImage(logoFile);
          var r3 = storage.ref(
            "shops/" + currentShopId + "/logo_" + Date.now() + ".webp",
          );
          var sn2 = await r3.put(clLogo);
          updates.logo = await sn2.ref.getDownloadURL();
        }

        var bannerFile = document.getElementById("sp-banner-file")?.files[0];
        if (bannerFile && storage) {
          var clBanner = await window.compressImage(bannerFile);
          var rB = storage.ref(
            "shops/" + currentShopId + "/banner_" + Date.now() + ".webp",
          );
          var snB = await rB.put(clBanner);
          updates.banner = await snB.ref.getDownloadURL();
        }

        await db2.collection("shops").doc(currentShopId).update(updates);
        if (window.showToast)
          window.showToast("Boutique mise à jour", "success");

        ["sd-shop-name", "sd-topbar-shop"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.textContent = updates.name;
        });
        var ini = document.getElementById("sd-shop-initial");
        if (ini) ini.textContent = updates.name.charAt(0).toUpperCase();
      } catch (err) {
        if (window.showToast)
          window.showToast("Erreur : " + err.message, "danger");
      }
    });
  }

  // ─── Prévisualisation logo / bannière ─────────────────────────────────────
  var spLogoFile = document.getElementById("sp-logo-file");
  if (spLogoFile) {
    spLogoFile.addEventListener("change", function () {
      var prev = document.getElementById("sp-logo-preview");
      if (!prev || !this.files[0]) return;
      var r = new FileReader();
      r.onload = function (e2) {
        prev.innerHTML =
          '<div class="sd-img-thumb" style="width:80px;height:80px"><img src="' +
          e2.target.result +
          '"></div>';
      };
      r.readAsDataURL(this.files[0]);
    });
  }

  var spBannerFile = document.getElementById("sp-banner-file");
  if (spBannerFile) {
    spBannerFile.addEventListener("change", function () {
      var prev = document.getElementById("sp-banner-preview");
      if (!prev || !this.files[0]) return;
      var r = new FileReader();
      r.onload = function (e2) {
        prev.innerHTML =
          '<div class="sd-img-thumb" style="width:100%;height:120px"><img src="' +
          e2.target.result +
          '" style="width:100%;height:100%;object-fit:cover"></div>';
      };
      r.readAsDataURL(this.files[0]);
    });
  }

  // ─── Messagerie ───────────────────────────────────────────────────────────
  function sdLoadMessages(user) {
    var container = document.getElementById("sd-messages-list");
    if (!container) return;

    if (typeof window.subscribeUserChats !== "function") {
      container.innerHTML =
        '<div class="sd-empty"><div class="sd-empty-sub">Messagerie indisponible.</div></div>';
      return;
    }

    window.subscribeUserChats(
      user.uid,
      function (chats) {
        var badge = document.getElementById("sd-msg-badge");
        if (badge) {
          badge.textContent = chats.length;
          badge.style.display = chats.length ? "flex" : "none";
        }

        if (!chats.length) {
          container.innerHTML =
            '<div class="sd-empty"><div class="sd-empty-title">Aucune discussion</div></div>';
          return;
        }

        container.innerHTML = chats
          .map(function (chat) {
            var buyer = chat.buyerName || "Client";
            var initials = buyer
              .split(" ")
              .map(function (w) {
                return w[0];
              })
              .join("")
              .toUpperCase()
              .substring(0, 2);
            var preview = chat.lastMessage
              ? chat.lastMessage.length > 60
                ? chat.lastMessage.substring(0, 60) + "…"
                : chat.lastMessage
              : "Aucun message";

            var time = chat.lastMessageAt || chat.updatedAt;
            if (time) {
              var d = time.toDate
                ? time.toDate()
                : new Date(time.seconds ? time.seconds * 1000 : time);
              var diff = Math.floor((Date.now() - d) / 1000);
              time =
                diff < 60
                  ? "À l'instant"
                  : diff < 3600
                    ? Math.floor(diff / 60) + "min"
                    : diff < 86400
                      ? Math.floor(diff / 3600) + "h"
                      : d.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        });
            } else {
              time = "";
            }

            var p = new URLSearchParams({
              chatId: chat.id,
              shopId: chat.shopId || "",
              sellerId: chat.sellerId || "",
            });
            return (
              '<a href="/messages.html?' +
              p.toString() +
              '" class="sd-disc-item">' +
              '<div class="sd-disc-avatar">' +
              initials +
              "</div>" +
              '<div style="flex:1;min-width:0">' +
              '<div class="sd-disc-name">' +
              buyer +
              "</div>" +
              '<div class="sd-disc-preview">' +
              preview +
              "</div>" +
              "</div>" +
              '<div class="sd-disc-time">' +
              time +
              "</div>" +
              "</a>"
            );
          })
          .join("");
      },
      function () {
        container.innerHTML =
          '<div class="sd-empty"><div class="sd-empty-sub">Impossible de charger les discussions.</div></div>';
      },
    );
  }
});
