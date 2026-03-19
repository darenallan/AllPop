/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/boutique.js
 * Page boutique.html — Profil d'une boutique
 * ═══════════════════════════════════════════════════════════════════════════
 */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var shopNameEl = document.getElementById("shop-name");
  if (!shopNameEl) return;

  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  ) {
    shopNameEl.innerText = "Erreur Firebase";
    return;
  }

  var db = firebase.firestore();
  const path = window.location.pathname;
  const shopSlug = path.split("/").filter(Boolean).pop();

  var els = {
    banner: document.getElementById("shop-banner"),
    logo: document.getElementById("shop-logo"),
    name: document.getElementById("shop-name"),
    slogan: document.getElementById("shop-slogan"),
    desc: document.getElementById("shop-desc"),
    verified: document.getElementById("badge-verified"),
    contactBtn: document.getElementById("contact-btn"),
    grid: document.getElementById("shop-products-grid"),
    search: document.getElementById("shop-search-input"),
  };

  if (!shopSlug) {
    if (els.name) els.name.innerText = "Boutique introuvable";
    return;
  }

  var allShopProducts = [];
  var currentShopData = {};
  var shopId = null;

  // Infos boutique (search by slug)
  db.collection("shops")
    .where("slug", "==", shopSlug)
    .limit(1)
    .get()
    .then(function (snap) {
      if (snap.empty) {
        if (els.name) els.name.innerText = "Boutique fermée ou inexistante";
        return;
      }
      var doc = snap.docs[0];
      shopId = doc.id;
      var data = doc.data();
      currentShopData = data || {};
      if (els.name) els.name.innerText = data.name || "Boutique";
      if (els.slogan) els.slogan.innerText = data.slogan || "";
      if (els.desc)
        els.desc.innerText =
          data.description || "Bienvenue dans notre galerie. Découvrez nos produits avec livraison rapide à Ouagadougou, Burkina Faso.";
      if (els.banner && data.banner) els.banner.src = data.banner;
      if (els.logo && data.logo) els.logo.src = data.logo;
      if (els.verified && data.status === "active")
        els.verified.style.display = "inline-flex";

      // Mise à jour dynamique du SEO de la boutique
      document.title = data.name + " | Sanhia";
      if (document.getElementById("shop-og-title")) {
        document
          .getElementById("shop-og-title")
          .setAttribute("content", data.name + " - Boutique Officielle");
      }
      if (document.getElementById("shop-og-desc")) {
        document
          .getElementById("shop-og-desc")
          .setAttribute(
            "content",
            "Visitez la boutique de " +
              data.name +
              " sur Sanhia. " +
              (data.description || "Meilleurs prix à Ouagadougou."),
          );
      }
      if (data.logo && document.getElementById("shop-og-image")) {
        document
          .getElementById("shop-og-image")
          .setAttribute("content", data.logo);
      }

      if (els.contactBtn) {
        els.contactBtn.addEventListener("click", function () {
          if (typeof window.initChatModalBindings === "function")
            window.initChatModalBindings();
          if (typeof window.openSellerChat !== "function") {
            if (window.showToast)
              window.showToast(
                "Messagerie indisponible pour le moment.",
                "danger",
              );
            return;
          }
          window
            .openSellerChat({
              shopId: shopId,
              sellerId:
                data.ownerId ||
                data.sellerId ||
                data.ownerUid ||
                data.userId ||
                "",
              shopName: data.name || "Boutique",
              sellerName:
                data.ownerName || data.sellerName || data.name || "Vendeur",
            })
            .catch(function (err) {
              if (window.showToast)
                window.showToast(
                  err.message || "Impossible d'ouvrir la conversation.",
                  "danger",
                );
            });
        });
      }

      // Injection JSON-LD pour boutique
      var shopSchema = {
        "@context": "https://schema.org/",
        "@type": "LocalBusiness",
        name: data.name || "Boutique Sanhia",
        description: data.description || "Découvrez nos produits avec livraison rapide à Ouagadougou, Burkina Faso",
        logo: data.logo || "",
        image: data.banner || "",
        areaServed: {
          "@type": "Place",
          name: "Ouagadougou, Burkina Faso"
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: data.city || "Ouagadougou",
          addressCountry: "Burkina Faso"
        },
        telephone: data.phone || "",
        url: window.location.href,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: data.rating || 4.5,
          reviewCount: 1
        }
      };
      var script = document.createElement("script");
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify(shopSchema);
      document.head.appendChild(script);

      // Produits (after shopId is fetched)
      db.collection("products")
        .where("shopId", "==", shopId)
        .get()
        .then(loadProducts);
    });

  function loadProducts(snap) {
    if (!els.grid) return;
    els.grid.innerHTML = "";
    if (snap.empty) {
      els.grid.innerHTML =
        '<p class="bp-msg">Cette boutique n\'a pas encore ajouté de pièces.</p>';
      return;
    }
    snap.forEach(function (doc) {
      var p = Object.assign({ id: doc.id }, doc.data());
      allShopProducts.push(p);
      renderBoutiqueCard(p, els.grid);
    });
    if (window.lucide) lucide.createIcons();
  }

  function renderBoutiqueCard(p, container) {
    var price = new Intl.NumberFormat("fr-FR").format(p.price);
    var img =
      p.imageURL ||
      p.image ||
      (p.images && p.images[0]) ||
      "assets/img/placeholder-product-1.svg";
    var shopName = p.shopName || "Aurum";
    var isFav = typeof isInWishlist === "function" ? isInWishlist(p.id) : false;
    // On définit l'URL SEO : Slug-ID pour SEO + facilité de récupération (avec -- comme séparateur)
    var pUrl = p.slug
      ? "/product/" + p.slug + "--" + p.id
      : "/product/" +
        (p.name
          ? p.name
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
          : "produit") +
        "--" +
        p.id;
    var div = document.createElement("div");
    div.innerHTML =
      '<a href="' +
      pUrl +
      '" class="bp-card">' +
      '<div class="bp-card-img-wrap">' +
      '<button class="bp-card-wishlist' +
      (isFav ? " active" : "") +
      '" type="button" onclick="event.stopPropagation();event.preventDefault();if(typeof toggleWishlist===\'function\')toggleWishlist(event,\'' +
      p.id +
      "');return false;\">" +
      '<i data-lucide="heart" style="width:16px;height:16px;fill:' +
      (isFav ? "currentColor" : "none") +
      '"></i>' +
      "</button>" +
      '<img src="' +
      img +
      '" alt="' +
      (p.name || "Produit") +
      ' - ' +
      shopName +
      ' | Achat Ouagadougou Sanhia" class="bp-card-img">' +
      "</div>" +
      '<div class="bp-card-body">' +
      '<span class="bp-card-brand">' +
      shopName +
      "</span>" +
      '<h3 class="bp-card-title">' +
      (p.name || "Pièce Unique") +
      "</h3>" +
      '<div class="bp-card-rating">★★★★★</div>' +
      '<div class="bp-card-footer">' +
      '<span class="bp-card-price">' +
      price +
      " FCFA</span>" +
      '<button class="bp-card-add" type="button" onclick="event.stopPropagation();event.preventDefault();if(typeof addToCart===\'function\')addToCart(\'' +
      p.id +
      "');return false;\">" +
      '<i data-lucide="shopping-bag" style="width:14px;height:14px"></i> Ajouter' +
      "</button>" +
      "</div>" +
      "</div>" +
      "</a>";
    container.appendChild(div.firstElementChild);
  }

  // Recherche
  if (els.search) {
    els.search.addEventListener("input", function (e) {
      var term = e.target.value.toLowerCase();
      if (!els.grid) return;
      els.grid.innerHTML = "";
      var filtered = allShopProducts.filter(function (p) {
        return (p.name || "").toLowerCase().includes(term);
      });
      if (!filtered.length) {
        els.grid.innerHTML =
          '<p class="bp-msg">Aucune pièce ne correspond à votre recherche.</p>';
      } else {
        filtered.forEach(function (p) {
          renderBoutiqueCard(p, els.grid);
        });
        if (window.lucide) lucide.createIcons();
      }
    });
  }
});
