/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — global.utils.js
 * Utilitaires partagés — à charger AVANT tous les scripts page
 *
 * Résout les duplications identifiées dans l'audit :
 *   ✓ buildProductUrl() — dupliqué dans 5 fichiers
 *   ✓ fmtDate() — redéfini dans chaque fichier
 *   ✓ statusBadge() — versions incompatibles entre profile.js et seller.js
 *   ✓ Cursor guard — crash si #cur-ring absent
 *   ✓ Reveal on scroll — IntersectionObserver réutilisable
 *   ✓ DEBUG flag — condition les console.log de dev
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage HTML :
 *   <script src="/assets/js/global.utils.js"></script>
 *   <!-- avant tous les autres scripts page -->
 */

"use strict";

(function (w) {
  /* ══════════════════════════════════════════════════════════════
     DEBUG FLAG
     ══════════════════════════════════════════════════════════════ */
  var DEBUG =
    w.location.hostname === "localhost" ||
    w.location.hostname === "127.0.0.1" ||
    w.location.search.includes("debug=1");

  w.sanDebug = function () {
    if (DEBUG) console.log.apply(console, arguments);
  };

  /* ══════════════════════════════════════════════════════════════
     URL PRODUIT — buildProductUrl(product)
     Résout : catalogue.js, cart.js, boutique.js, wishlist.js, product.js
     ══════════════════════════════════════════════════════════════ */
  w.buildProductUrl = function (p) {
    if (!p) return "/catalogue";
    var id = p.id || "";
    var slug = p.slug
      ? p.slug
      : p.name
        ? p.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // déaccenter
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : "produit";
    return "/product/" + slug + "--" + id;
  };

  /* ══════════════════════════════════════════════════════════════
     URL BOUTIQUE — buildShopUrl(shop)
     ══════════════════════════════════════════════════════════════ */
  w.buildShopUrl = function (shop) {
    if (!shop) return "/boutiques";
    return shop.slug ? "/boutique/" + shop.slug : "/boutique?id=" + shop.id;
  };

  /* ══════════════════════════════════════════════════════════════
     FORMAT DATE — fmtDate(ts, opts?)
     Résout : delivery.js, seller.js, theking.js, profile.js, etc.
     ══════════════════════════════════════════════════════════════ */
  w.fmtDate = function (ts, opts) {
    if (!ts) return "—";
    try {
      var d = ts.toDate
        ? ts.toDate()
        : ts.seconds
          ? new Date(ts.seconds * 1000)
          : new Date(ts);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString(
        "fr-FR",
        opts || {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
    } catch (_) {
      return "—";
    }
  };

  /* ══════════════════════════════════════════════════════════════
     FORMAT MONNAIE — fmtMoney(n)
     ══════════════════════════════════════════════════════════════ */
  w.fmtMoney = function (n) {
    if (n === null || n === undefined || isNaN(Number(n))) return "—";
    return (
      new Intl.NumberFormat("fr-FR").format(Math.round(Number(n))) + " FCFA"
    );
  };

  /* ══════════════════════════════════════════════════════════════
     STATUS BADGE — statusBadge(status)
     Version unifiée pour profile.js, seller.js, theking.js
     Couvre le NOUVEAU workflow multi-vendeurs complet
     ══════════════════════════════════════════════════════════════ */
  var STATUS_MAP = {
    // Statuts globaux (workflow Admin)
    pending: { label: "En attente", cls: "st-wait" },
    pending_admin: { label: "En attente admin", cls: "st-wait" },
    validated: { label: "Validée", cls: "st-info" },
    // Statuts vendeurs individuels
    in_preparation: { label: "En préparation", cls: "st-prep" },
    ready_for_delivery: { label: "Prêt à livrer", cls: "st-ready" },
    // Statuts livreur
    in_transit: { label: "En transit", cls: "st-ship" },
    delivered: { label: "Livré", cls: "st-done" },
    // Annulation
    cancelled: { label: "Annulé", cls: "st-cancel" },
  };

  w.statusBadge = function (status) {
    var s = (status || "pending").toLowerCase().trim();
    // Correspondances directes
    if (STATUS_MAP[s]) return STATUS_MAP[s];
    // Correspondances partielles (rétro-compatibilité)
    if (s.includes("livr") || s.includes("deliver"))
      return STATUS_MAP["delivered"];
    if (s.includes("annul") || s.includes("cancel"))
      return STATUS_MAP["cancelled"];
    if (s.includes("expéd") || s.includes("ship"))
      return STATUS_MAP["in_transit"];
    if (s.includes("prép") || s.includes("prep"))
      return STATUS_MAP["in_preparation"];
    if (s.includes("transit")) return STATUS_MAP["in_transit"];
    return { label: status || "Inconnu", cls: "st-wait" };
  };

  /* ══════════════════════════════════════════════════════════════
     CURSOR — initCursor(ringId, dotId, hoverSelector, bodyClass)
     Résout : index.js, profile.js, boutique-list.js, seller-onboarding.js
     ══════════════════════════════════════════════════════════════ */
  w.initCursor = function (ringId, dotId, hoverSelector, bodyClass) {
    var ring = document.getElementById(ringId || "cur-ring");
    var dot = document.getElementById(dotId || "cur-dot");
    if (!ring || !dot) return; // ✅ Guard null — plus de crash si absents

    var mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    var cls = bodyClass || "cur-h";

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

    var sel = hoverSelector || "a,button,select,[onclick],input,textarea";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(sel)) document.body.classList.add(cls);
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(sel)) document.body.classList.remove(cls);
    });
  };

  /* ══════════════════════════════════════════════════════════════
     REVEAL ON SCROLL — initReveal(selector, threshold)
     Réutilisable partout
     ══════════════════════════════════════════════════════════════ */
  w.initReveal = function (selector, threshold) {
    var els = document.querySelectorAll(selector || ".rv");
    if (!els.length) return;
    if (!("IntersectionObserver" in w)) {
      els.forEach(function (el) {
        el.classList.add("on");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: threshold || 0.1 },
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  };

  /* ══════════════════════════════════════════════════════════════
     COUNTER ANIMATION — animCounter(el, target, suffix, duration)
     Utilisé dans index.js, about.js, seller-onboarding.js
     ══════════════════════════════════════════════════════════════ */
  w.animCounter = function (el, target, suffix, duration) {
    if (!el) return;
    target = parseFloat(target || el.getAttribute("data-target") || 0);
    suffix = suffix || el.getAttribute("data-suffix") || "";
    duration = duration || 2200;
    var isFloat = !Number.isInteger(target);
    var start = performance.now();

    (function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 4);
      var val = isFloat
        ? (target * ease).toFixed(1)
        : Math.floor(target * ease);
      el.textContent = val + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    })(start);
  };

  /* ══════════════════════════════════════════════════════════════
     ESCAPE HTML — esc(str)
     ══════════════════════════════════════════════════════════════ */
  w.escHtml = function (str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  /* ══════════════════════════════════════════════════════════════
     WAIT FOR FIREBASE — waitForFirebase(timeout?)
     Utilisé dans register.js, peut être partagé
     ══════════════════════════════════════════════════════════════ */
  w.waitForFirebase = function (timeout) {
    timeout = timeout || 5000;
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      var check = function () {
        if (w.auth && w.db) {
          resolve({ auth: w.auth, db: w.db });
        } else if (Date.now() - start > timeout) {
          reject(new Error("Firebase non disponible après " + timeout + "ms"));
        } else {
          setTimeout(check, 80);
        }
      };
      check();
    });
  };

  /* ══════════════════════════════════════════════════════════════
     INVOICE NUMBER — getNextInvoiceNumber(db)
     Dupliqué dans cart.js ET invoice.js
     ══════════════════════════════════════════════════════════════ */
  w.getNextInvoiceNumber = async function (db) {
    var ref = db.collection("meta").doc("invoiceCounter");
    try {
      return await db.runTransaction(async function (t) {
        var snap = await t.get(ref);
        var next = (snap.exists ? snap.data().value || 0 : 0) + 1;
        t.set(ref, { value: next }, { merge: true });
        return next;
      });
    } catch (_) {
      var fallback = Number(localStorage.getItem("ac_inv_counter") || "0") + 1;
      localStorage.setItem("ac_inv_counter", String(fallback));
      return fallback;
    }
  };

  w.sanDebug(
    "[global.utils] Chargé. buildProductUrl, fmtDate, fmtMoney, statusBadge, initCursor, initReveal, animCounter disponibles.",
  );
})(window);
