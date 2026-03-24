/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — profile.js  v2
 *
 * FIXES v2 :
 *   ✓ statusBadge() — couvre tous les statuts du nouveau workflow
 *   ✓ Fuite mémoire : cleanup _unsubOrders dans onAuthStateChanged (pas dans loadOrders)
 *   ✓ Utilise window.fmtDate / window.statusBadge de global.utils si disponibles
 *   ✓ Guard null sur les éléments DOM critiques
 *   ✓ orderId affiché proprement (invoiceNumber ou reference)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── CURSOR ── */
(function () {
  // Utilise global.utils si disponible, sinon implémentation locale légère
  if (typeof window.initCursor === "function") {
    window.initCursor(
      "cur-ring",
      "cur-dot",
      "a,button,input,select,textarea,.pr-order-item,.pr-addr-card,.pr-msg-item",
      "cur-h",
    );
  } else {
    var ring = document.getElementById("cur-ring");
    var dot = document.getElementById("cur-dot");
    if (!ring || !dot) return;
    var mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    (function loop() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    var sel =
      "a,button,input,select,textarea,.pr-order-item,.pr-addr-card,.pr-msg-item";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(sel)) document.body.classList.add("cur-h");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(sel)) document.body.classList.remove("cur-h");
    });
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  if (typeof lucide !== "undefined") lucide.createIcons();

  var auth = firebase.auth();
  var db = firebase.firestore();
  var storage = firebase.storage();
  var DEFAULT_RETENTION = 30;

  // ✅ FIX : unsub déclaré dans le scope principal pour être nettoyé
  // lors de chaque changement d'utilisateur Auth (pas juste dans loadOrders)
  var _unsubOrders = null;

  /* ─── TOAST ─── */
  function prToast(msg, type) {
    var container = document.getElementById("pr-toasts");
    if (!container) return;
    var el = document.createElement("div");
    el.className =
      "pr-toast " + (type === "ok" ? "ok" : type === "err" ? "err" : "");
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3400);
  }
  window.showToast = function (m, t) {
    prToast(m, t === "success" ? "ok" : t === "error" ? "err" : "ok");
  };

  /* ─── TABS ─── */
  function switchTab(name) {
    document.querySelectorAll(".pr-tab").forEach(function (t) {
      t.classList.remove("on");
    });
    document.querySelectorAll(".pr-aside-btn[data-tab]").forEach(function (b) {
      b.classList.remove("on");
    });
    var tab = document.getElementById("tab-" + name);
    if (tab) tab.classList.add("on");
    var btn = document.querySelector('.pr-aside-btn[data-tab="' + name + '"]');
    if (btn) btn.classList.add("on");
    if (name === "messages" && auth.currentUser)
      initMessages(auth.currentUser.uid);
  }
  document.querySelectorAll(".pr-aside-btn[data-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.dataset.tab);
    });
  });

  /* ─── AUTH GUARD ─── */
  auth.onAuthStateChanged(async function (user) {
    // ✅ FIX : cleanup systématique avant tout, même si l'utilisateur change
    if (_unsubOrders) {
      _unsubOrders();
      _unsubOrders = null;
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }
    await loadProfile(user);
    loadOrders(user.uid); // Démarre le listener temps réel
    await loadAddresses(user.uid);
    setupPhotoUpload(user);
    initRetention(user.uid);
    if (typeof lucide !== "undefined") lucide.createIcons();
  });

  /* ─── PROFIL ─── */
  async function loadProfile(user) {
    try {
      var shopSnap = await db
        .collection("shops")
        .where("ownerEmail", "==", user.email)
        .get();
      var role = shopSnap.empty ? "Client" : "Vendeur";

      var docRef = db.collection("users").doc(user.uid);
      var doc = await docRef.get();
      var data = {
        name: user.displayName || "",
        email: user.email,
        role: role.toLowerCase(),
      };
      if (doc.exists) data = Object.assign({}, data, doc.data());
      else
        await docRef.set(Object.assign({}, data, { createdAt: new Date() }), {
          merge: true,
        });

      var name = data.name || "Utilisateur";
      var initials =
        name
          .split(" ")
          .map(function (n) {
            return n[0];
          })
          .join("")
          .toUpperCase()
          .slice(0, 2) || "SA";

      var heroName = document.getElementById("pr-hero-name");
      if (heroName)
        heroName.innerHTML =
          (name.split(" ")[0] || "Bon") +
          "<br><em>" +
          (name.split(" ").slice(1).join(" ") || "retour") +
          "</em>";
      var heroRole = document.getElementById("pr-hero-role");
      if (heroRole) heroRole.textContent = role;
      var heroEmail = document.getElementById("pr-hero-email");
      if (heroEmail) heroEmail.textContent = user.email;
      var wm = document.getElementById("pr-wm");
      if (wm) wm.textContent = initials;
      var ini = document.getElementById("pr-initials");
      if (ini) ini.textContent = initials;

      var nameInp = document.getElementById("pr-name");
      if (nameInp) nameInp.value = name;
      var emailInp = document.getElementById("pr-email");
      if (emailInp) emailInp.value = user.email;
      var roleInp = document.getElementById("pr-role-input");
      if (roleInp) roleInp.value = role;

      if (user.photoURL) {
        var img = document.getElementById("pr-avatar-img");
        if (img) {
          img.src = user.photoURL;
          img.style.display = "block";
        }
        if (ini) ini.style.display = "none";
      }
    } catch (e) {
      console.error("[profile] loadProfile:", e);
    }
  }

  var saveBtn = document.getElementById("pr-save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      var user = auth.currentUser;
      if (!user) return;
      var newName = (document.getElementById("pr-name")?.value || "").trim();
      if (!newName) {
        prToast("Le nom ne peut pas être vide.", "err");
        return;
      }
      var span = saveBtn.querySelector("span");
      if (span) span.textContent = "Enregistrement…";
      saveBtn.disabled = true;
      try {
        await user.updateProfile({ displayName: newName });
        await db.collection("users").doc(user.uid).update({ name: newName });
        var heroName = document.getElementById("pr-hero-name");
        if (heroName)
          heroName.innerHTML =
            (newName.split(" ")[0] || "Bon") +
            "<br><em>" +
            (newName.split(" ").slice(1).join(" ") || "retour") +
            "</em>";
        var wm = document.getElementById("pr-wm");
        if (wm)
          wm.textContent = newName
            .split(" ")
            .map(function (n) {
              return n[0];
            })
            .join("")
            .toUpperCase()
            .slice(0, 2);
        prToast("Profil mis à jour !", "ok");
      } catch (e) {
        prToast("Erreur de mise à jour.", "err");
      } finally {
        if (span) span.textContent = "Enregistrer les modifications";
        saveBtn.disabled = false;
      }
    });
  }

  /* ─── PHOTO ─── */
  function setupPhotoUpload(user) {
    var uploadBtn = document.getElementById("pr-upload-btn");
    var fileInput = document.getElementById("pr-file-input");
    if (!uploadBtn || !fileInput) return;
    uploadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      fileInput.click();
    });
    fileInput.addEventListener("change", async function (e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        prToast("Format non supporté.", "err");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        prToast("Image trop lourde (max 2 Mo).", "err");
        return;
      }
      uploadBtn.style.opacity = ".4";
      uploadBtn.style.pointerEvents = "none";
      try {
        var compressedBlob =
          typeof window.compressImage === "function"
            ? await window.compressImage(file)
            : file;
        var ref = storage.ref("users/" + user.uid + "/profile.jpg");
        var snap = await ref.put(compressedBlob);
        var url = await snap.ref.getDownloadURL();
        await user.updateProfile({ photoURL: url });
        await db.collection("users").doc(user.uid).update({ photoURL: url });
        var img = document.getElementById("pr-avatar-img");
        if (img) {
          img.src = url;
          img.style.display = "block";
        }
        var ini = document.getElementById("pr-initials");
        if (ini) ini.style.display = "none";
        prToast("Photo mise à jour !", "ok");
      } catch (err) {
        prToast("Erreur upload.", "err");
        console.error(err);
      } finally {
        uploadBtn.style.opacity = "1";
        uploadBtn.style.pointerEvents = "auto";
        e.target.value = "";
      }
    });
  }

  /* ─── DÉCONNEXION ─── */
  var logoutBtn = document.getElementById("pr-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      if (confirm("Se déconnecter ?")) {
        await auth.signOut();
        window.location.href = "/login";
      }
    });
  }

  /* ─── ORDERS ─── */
  function getRetention() {
    var v = Number(localStorage.getItem("ac_order_retention_days"));
    return Number.isFinite(v) && v >= 1 ? v : DEFAULT_RETENTION;
  }

  function initRetention(uid) {
    var inp = document.getElementById("pr-retention-input");
    if (!inp) return;
    inp.value = getRetention();
    inp.addEventListener("change", async function () {
      var val = Math.max(
        7,
        Math.min(180, Number(inp.value) || DEFAULT_RETENTION),
      );
      localStorage.setItem("ac_order_retention_days", String(val));
      inp.value = val;
      // Relancer le listener (il va se réabonner avec le nouveau filtre de rétention)
      loadOrders(auth.currentUser?.uid);
    });
  }

  async function purgeOrders(uid, days) {
    try {
      var cutoff = new Date(Date.now() - days * 864e5);
      var snap = await db.collection("orders").where("userId", "==", uid).get();
      for (var i = 0; i < snap.docs.length; i++) {
        var doc = snap.docs[i];
        var o = doc.data();
        var st = (o.status || "").toLowerCase();
        if (
          !["delivered", "cancelled"].some(function (s) {
            return st.includes(s[0]);
          })
        )
          continue;
        var d =
          o.updatedAt?.toDate?.() ?? o.createdAt?.toDate?.() ?? new Date(0);
        if (d < cutoff) await db.collection("orders").doc(doc.id).delete();
      }
    } catch (e) {
      /* silencieux */
    }
  }

  function loadOrders(uid) {
    if (!uid) return;
    // ✅ FIX : cleanup avant de créer un nouveau listener
    if (_unsubOrders) {
      _unsubOrders();
      _unsubOrders = null;
    }

    purgeOrders(uid, getRetention()); // fire-and-forget, pas await

    _unsubOrders = db
      .collection("orders")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(100)
      .onSnapshot(
        function (snap) {
          var orders = snap.docs.map(function (d) {
            return Object.assign({ id: d.id }, d.data());
          });
          var totalSpent = orders.reduce(function (s, o) {
            return s + (o.total || 0);
          }, 0);
          var wishlistCount = JSON.parse(
            localStorage.getItem("ac_wishlist") || "[]",
          ).length;

          var elO = document.getElementById("pr-stat-orders");
          if (elO) elO.textContent = orders.length;
          var elS = document.getElementById("pr-stat-spent");
          if (elS)
            elS.textContent =
              new Intl.NumberFormat("fr-FR").format(totalSpent) + " FCFA";
          var elW = document.getElementById("pr-stat-wishlist");
          if (elW) elW.textContent = wishlistCount;

          renderOrders(orders);
        },
        function (err) {
          console.error("[profile] orders listener error:", err);
          // Fallback sans orderBy (si index manquant)
          db.collection("orders")
            .where("userId", "==", uid)
            .get()
            .then(function (snap) {
              renderOrders(
                snap.docs.map(function (d) {
                  return Object.assign({ id: d.id }, d.data());
                }),
              );
            })
            .catch(function (e2) {
              console.error("[profile] orders fallback error:", e2);
            });
        },
      );
  }

  /* ─── STATUS BADGE ─── 
     ✅ FIX : Version complète couvrant tous les statuts du nouveau workflow
     Utilise global.utils si disponible */
  function localStatusBadge(status) {
    if (typeof window.statusBadge === "function")
      return window.statusBadge(status);
    var s = (status || "pending").toLowerCase();
    if (s.includes("livr") || s === "delivered")
      return { label: "Livré", cls: "st-done" };
    if (s.includes("annul") || s === "cancelled")
      return { label: "Annulé", cls: "st-cancel" };
    if (s === "in_transit" || s.includes("transit"))
      return { label: "En transit", cls: "st-ship" };
    if (s === "ready_for_delivery")
      return { label: "Prêt à livrer", cls: "st-ready" };
    if (s === "in_preparation" || s.includes("prép"))
      return { label: "En préparation", cls: "st-prep" };
    if (s === "validated") return { label: "Validée", cls: "st-info" };
    if (s.includes("expéd") || s === "shipped")
      return { label: "Expédié", cls: "st-ship" };
    return { label: "En attente", cls: "st-wait" };
  }

  function renderOrders(orders) {
    var c = document.getElementById("pr-orders-list");
    if (!c) return;
    if (!orders.length) {
      c.innerHTML =
        '<div class="pr-empty">' +
        '<div class="pr-empty-icon">∅</div>' +
        "<p>Aucune commande pour le moment</p>" +
        '<a href="/catalogue">Découvrir le catalogue →</a>' +
        "</div>";
      if (typeof lucide !== "undefined") lucide.createIcons();
      return;
    }
    c.innerHTML = orders
      .map(function (o) {
        var fmtD =
          typeof window.fmtDate === "function"
            ? window.fmtDate
            : function (ts) {
                if (!ts) return "—";
                var d = ts.toDate ? ts.toDate() : new Date(ts);
                return d.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              };
        var date = fmtD(o.createdAt);
        var total = new Intl.NumberFormat("fr-FR").format(o.total || 0);
        var badge = localStatusBadge(o.status);
        var items = o.items?.length || 0;
        // Afficher la référence lisible (invoiceNumber > reference > id tronqué)
        var ref = o.invoiceNumber
          ? "SAN-" + String(o.invoiceNumber).padStart(4, "0")
          : o.reference || "#" + o.id.slice(0, 8).toUpperCase();
        return (
          '<div class="pr-order-item">' +
          "<div>" +
          '<div class="pr-order-id">' +
          ref +
          "</div>" +
          '<div class="pr-order-title">' +
          items +
          " article" +
          (items > 1 ? "s" : "") +
          "</div>" +
          '<div class="pr-order-meta">' +
          date +
          "</div>" +
          "</div>" +
          '<div class="pr-order-right">' +
          '<div class="pr-order-price">' +
          total +
          " FCFA</div>" +
          '<span class="pr-badge-status ' +
          badge.cls +
          '">' +
          badge.label +
          "</span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ─── ADRESSES ─── */
  async function loadAddresses(uid) {
    var c = document.getElementById("pr-addr-list");
    if (!c) return;
    try {
      var snap = await db
        .collection("users")
        .doc(uid)
        .collection("addresses")
        .get();
      if (snap.empty) {
        c.innerHTML =
          '<div class="pr-empty" style="grid-column:1/-1"><div class="pr-empty-icon">⌂</div><p>Aucune adresse enregistrée</p></div>';
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
      }
      c.innerHTML = snap.docs
        .map(function (doc) {
          var a = doc.data();
          return (
            '<div class="pr-addr-card">' +
            '<button class="pr-addr-del" onclick="prDeleteAddr(\'' +
            doc.id +
            '\')"><i data-lucide="trash-2"></i></button>' +
            '<div class="pr-addr-tag">Adresse</div>' +
            '<div class="pr-addr-name">' +
            (a.name || "") +
            "</div>" +
            '<div class="pr-addr-detail"><i data-lucide="phone"></i> ' +
            (a.phone || "—") +
            "</div>" +
            '<div class="pr-addr-detail"><i data-lucide="map-pin"></i> ' +
            (a.city || "—") +
            "</div>" +
            '<div class="pr-addr-detail"><i data-lucide="navigation"></i> ' +
            (a.description || a.desc || "") +
            "</div>" +
            "</div>"
          );
        })
        .join("");
      if (typeof lucide !== "undefined") lucide.createIcons();
    } catch (e) {
      console.error("[profile] loadAddresses:", e);
    }
  }

  window.prDeleteAddr = async function (id) {
    if (!confirm("Supprimer cette adresse ?")) return;
    var user = auth.currentUser;
    if (!user) return;
    await db
      .collection("users")
      .doc(user.uid)
      .collection("addresses")
      .doc(id)
      .delete();
    loadAddresses(user.uid);
    prToast("Adresse supprimée.", "ok");
  };

  // Modal adresse
  var modal = document.getElementById("pr-addr-modal");
  var addBtn = document.getElementById("pr-add-addr-btn");
  if (addBtn && modal) {
    addBtn.addEventListener("click", function () {
      modal.classList.add("on");
      setTimeout(function () {
        var el = document.getElementById("addr-name");
        if (el) el.focus();
      }, 100);
    });
  }
  ["pr-modal-close", "pr-modal-cancel"].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn && modal)
      btn.addEventListener("click", function () {
        modal.classList.remove("on");
      });
  });

  // Géolocalisation
  var geoBtn = document.getElementById("pr-geo-btn");
  if (geoBtn) {
    geoBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      var statusEl = document.getElementById("pr-geo-status");
      if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = "❌ Géolocalisation non supportée";
        return;
      }
      if (statusEl) statusEl.textContent = "📍 Localisation en cours…";
      navigator.geolocation.getCurrentPosition(
        async function (pos) {
          try {
            var lat = pos.coords.latitude,
              lon = pos.coords.longitude;
            var res = await fetch(
              "https://nominatim.openstreetmap.org/reverse?lat=" +
                lat +
                "&lon=" +
                lon +
                "&format=json",
            );
            var data = await res.json();
            var city =
              data.address?.city || data.address?.town || "Ouagadougou";
            var area =
              data.address?.neighbourhood || data.address?.suburb || "";
            var cityInp = document.getElementById("addr-city");
            if (cityInp) cityInp.value = "Autre";
            var descInp = document.getElementById("addr-desc");
            if (descInp)
              descInp.value =
                (area || city) +
                ", " +
                lat.toFixed(4) +
                "° N, " +
                lon.toFixed(4) +
                "° E";
            if (statusEl) statusEl.textContent = "✅ Localisation réussie";
          } catch (err) {
            if (statusEl) statusEl.textContent = "❌ Erreur API";
            console.warn(err);
          }
        },
        function (err) {
          if (statusEl) statusEl.textContent = "❌ Géolocalisation refusée";
          console.warn(err);
        },
      );
    });
  }

  var addrForm = document.getElementById("pr-addr-form");
  if (addrForm) {
    addrForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var user = auth.currentUser;
      if (!user) return;
      var btn = e.target.querySelector("[type=submit]");
      var span = btn?.querySelector("span");
      if (span) span.textContent = "Sauvegarde…";
      if (btn) btn.disabled = true;
      try {
        await db
          .collection("users")
          .doc(user.uid)
          .collection("addresses")
          .add({
            name: (document.getElementById("addr-name")?.value || "").trim(),
            phone: (document.getElementById("addr-phone")?.value || "").trim(),
            city: document.getElementById("addr-city")?.value || "",
            description: (
              document.getElementById("addr-desc")?.value || ""
            ).trim(),
            createdAt: new Date(),
          });
        if (modal) modal.classList.remove("on");
        e.target.reset();
        loadAddresses(user.uid);
        prToast("Adresse ajoutée !", "ok");
      } catch (err) {
        prToast("Erreur d'ajout.", "err");
      } finally {
        if (span) span.textContent = "Enregistrer";
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ─── MESSAGES ─── */
  function initMessages(uid) {
    if (typeof window.subscribeUserChats !== "function") return;
    window.subscribeUserChats(
      uid,
      function (chats) {
        var badge = document.getElementById("pr-msg-badge");
        if (badge) {
          badge.textContent = chats.length;
          badge.style.display = chats.length ? "inline" : "none";
        }
        var c = document.getElementById("pr-msg-list");
        if (!c) return;
        if (!chats.length) {
          c.innerHTML =
            '<div class="pr-empty"><div class="pr-empty-icon">✉</div><p>Aucun message</p></div>';
          if (typeof lucide !== "undefined") lucide.createIcons();
          return;
        }
        c.innerHTML = chats
          .map(function (ch) {
            var isBuyer = ch.buyerId === uid;
            var partner = isBuyer
              ? ch.shopName || "Vendeur"
              : ch.buyerName || "Client";
            return (
              '<a href="/messages.html?chatId=' +
              ch.id +
              '" class="pr-msg-item">' +
              '<div class="pr-msg-av">' +
              partner.slice(0, 2).toUpperCase() +
              "</div>" +
              '<div class="pr-msg-body">' +
              '<div class="pr-msg-shop">' +
              partner +
              "</div>" +
              '<div class="pr-msg-last">' +
              (ch.lastMessage || "…") +
              "</div>" +
              "</div>" +
              '<div class="pr-msg-arrow"><i data-lucide="arrow-right"></i></div>' +
              "</a>"
            );
          })
          .join("");
        if (typeof lucide !== "undefined") lucide.createIcons();
      },
      function (err) {
        console.warn("[profile] messages:", err);
      },
    );
  }
});
