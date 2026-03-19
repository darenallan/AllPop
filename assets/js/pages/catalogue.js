/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/catalogue.js
 * Page catalogue.html — Listing des produits avec filtres
 * ═══════════════════════════════════════════════════════════════════════════
 */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("catalogue-grid")) return;

  // Utilitaires locaux
  function fmt(n) {
    return new Intl.NumberFormat("fr-FR").format(n);
  }
  function skeletons(n) {
    return Array(n)
      .fill(0)
      .map(function () {
        return '<div class="prd-card prd-skeleton"><div class="prd-img-wrap"></div><div class="prd-body"><div class="skel-line" style="width:50%"></div><div class="skel-line" style="width:85%;height:14px"></div><div class="skel-line" style="width:42%;height:12px;margin-top:14px"></div></div></div>';
      })
      .join("");
  }

  window.toggleFg = function (el) {
    el.classList.toggle("collapsed");
  };

  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  ) {
    document.getElementById("catalogue-grid").innerHTML =
      '<div class="cat-empty"><div class="cat-empty-title">Firebase non initialisé</div></div>';
    return;
  }

  var db = firebase.firestore();
  var params = new URLSearchParams(window.location.search);
  var allProducts = [];
  var allColors = new Set();
  var searchTimer = null;

  var searchInput = document.getElementById("search-input");
  var searchAuto = document.getElementById("search-autocomplete");
  var priceMin = document.getElementById("price-min");
  var priceMax = document.getElementById("price-max");
  var priceRMin = document.getElementById("price-range-min");
  var priceRMax = document.getElementById("price-range-max");
  var locationSel = document.getElementById("location-select");
  var sortSel = document.getElementById("sort-select");
  var grid = document.getElementById("catalogue-grid");
  var activeFiltersDiv = document.getElementById("active-filters");
  var resetBtn = document.getElementById("reset-filters");
  var toggleBtn = document.getElementById("toggle-filters");
  var fabBtn = document.getElementById("mobile-filter-fab");
  var sidebar = document.getElementById("filters-sidebar");
  var overlay = document.getElementById("filter-overlay");
  var filtersSlot = document.getElementById("filters-slot");
  var countEl = document.getElementById("cat-count-num");

  grid.innerHTML = skeletons(6);

  async function init() {
    try {
      var results = await Promise.all([
        db.collection("shops").limit(20).get(),
        db.collection("products").limit(100).get(),
      ]);
      var shopsSnap = results[0],
        productsSnap = results[1];
      var shopsMap = new Map();
      shopsSnap.forEach(function (d) {
        shopsMap.set(d.id, d.data());
      });

      if (productsSnap.empty) {
        grid.innerHTML =
          '<div class="cat-empty"><div class="cat-empty-num">∅</div><div class="cat-empty-title">Catalogue vide</div></div>';
        if (countEl) countEl.textContent = "0";
        return;
      }

      productsSnap.forEach(function (doc) {
        var p = doc.data();
        var shop = shopsMap.get(p.shopId || "") || {};
        if (p.colors && Array.isArray(p.colors))
          p.colors.forEach(function (c) {
            allColors.add(c);
          });
        allProducts.push(
          Object.assign(
            {
              id: doc.id,
              shopId: p.shopId || "",
              shopName: shop.name || "Boutique",
              shopRating: shop.rating || 0,
              shopCity: shop.city || shop.address || "",
            },
            p,
          ),
        );
      });

      if (countEl) countEl.textContent = allProducts.length;

      var prices = allProducts
        .map(function (p) {
          return p.price || 0;
        })
        .filter(function (p) {
          return p > 0;
        });
      var pMin = prices.length ? Math.min.apply(null, prices) : 0;
      var pMax = prices.length ? Math.max.apply(null, prices) : 1000000;
      if (priceMin) {
        priceMin.value = pMin;
        priceMin.placeholder = pMin;
      }
      if (priceMax) {
        priceMax.value = pMax;
        priceMax.placeholder = pMax;
      }
      if (priceRMin) {
        priceRMin.min = pMin;
        priceRMin.max = pMax;
        priceRMin.value = pMin;
      }
      if (priceRMax) {
        priceRMax.min = pMin;
        priceRMax.max = pMax;
        priceRMax.value = pMax;
      }

      renderCatFilters();
      if (locationSel) locationSel.addEventListener("change", applyFilters);

      var initialSearch = (params.get("q") || "").trim();
      if (initialSearch && searchInput) searchInput.value = initialSearch;

      var urlCat = params.get("category");
      if (urlCat) {
        setTimeout(function () {
          var cb = Array.from(
            document.querySelectorAll(
              '#category-filters-dynamic input[type="checkbox"]',
            ),
          ).find(function (c) {
            return c.value === urlCat;
          });
          if (cb) {
            cb.checked = true;
            applyFilters();
          }
        }, 150);
      } else {
        applyFilters();
      }
    } catch (err) {
      grid.innerHTML =
        '<div class="cat-empty"><div class="cat-empty-title">Erreur de chargement</div><div class="cat-empty-sub">' +
        (err.message || "") +
        '</div><button class="cat-empty-btn" onclick="location.reload()">Réessayer</button></div>';
    }
  }

  function renderCatFilters() {
    if (typeof window.renderCategoryFilters === "function") {
      window.renderCategoryFilters("category-filters-dynamic");
      setTimeout(function () {
        document
          .querySelectorAll('#category-filters-dynamic input[type="checkbox"]')
          .forEach(function (cb) {
            cb.addEventListener("change", applyFilters);
          });
      }, 200);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      var term = e.target.value.trim().toLowerCase();
      clearTimeout(searchTimer);
      if (term.length >= 2) {
        searchTimer = setTimeout(function () {
          showAuto(term);
        }, 300);
      } else {
        hideAuto();
        if (!term) applyFilters();
      }
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        hideAuto();
        applyFilters();
      }
    });
    document.addEventListener("click", function (e) {
      var box = document.getElementById("cat-search-box");
      if (box && !box.contains(e.target)) hideAuto();
    });
  }

  function showAuto(term) {
    if (!searchAuto) return;
    var matches = allProducts
      .filter(function (p) {
        return (
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.category && p.category.toLowerCase().includes(term))
        );
      })
      .slice(0, 8);
    if (!matches.length) {
      searchAuto.innerHTML =
        '<div class="ac-empty">Aucun résultat pour «\u00a0' +
        term +
        "\u00a0»</div>";
      searchAuto.classList.add("show");
      return;
    }
    searchAuto.innerHTML = matches
      .map(function (p) {
        var img =
          (Array.isArray(p.images) ? p.images[0] : null) ||
          p.image ||
          "assets/img/placeholder-product-1.svg";
        // On définit l'URL SEO : Slug-ID pour SEO + facilité de récupération (avec -- comme séparateur)
        var pUrl = p.slug ? '/product/' + p.slug + '--' + p.id : '/product/' + (p.name ? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'produit') + '--' + p.id;
        return (
          '<div class="ac-item" onclick="location.href=\'' +
          pUrl +
          "'\">" +
          '<img class="ac-img" src="' +
          img +
          '" alt="" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"/>' +
          '<div><div class="ac-name">' +
          (p.name || "") +
          '</div><div class="ac-price">' +
          fmt(p.price || 0) +
          " FCFA</div>" +
          (p.category ? '<div class="ac-cat">' + p.category + "</div>" : "") +
          "</div></div>"
        );
      })
      .join("");
    searchAuto.classList.add("show");
  }
  function hideAuto() {
    if (searchAuto) {
      searchAuto.classList.remove("show");
      searchAuto.innerHTML = "";
    }
  }

  function applyFilters() {
    var term = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var minP = parseFloat(priceMin ? priceMin.value : 0) || 0;
    var maxP = parseFloat(priceMax ? priceMax.value : 0) || Infinity;
    var selCats =
      typeof window.getSelectedCategoryFilters === "function"
        ? window.getSelectedCategoryFilters()
        : Array.from(
            document.querySelectorAll(
              '#category-filters-dynamic input[type="checkbox"]:checked',
            ),
          ).map(function (c) {
            return c.value;
          });
    var r4 =
      document.getElementById("rating-4plus") &&
      document.getElementById("rating-4plus").checked;
    var r3 =
      document.getElementById("rating-3plus") &&
      document.getElementById("rating-3plus").checked;
    var selLoc = locationSel ? locationSel.value : "";
    var sortBy = sortSel ? sortSel.value : "";

    var filtered = allProducts.filter(function (p) {
      var pP = parseFloat(p.price) || 0;
      var mSearch =
        !term ||
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term));
      var mPrice = pP >= minP && pP <= maxP;
      var mCat =
        !selCats.length ||
        (p.category &&
          selCats.some(function (c) {
            return p.category === c || p.category.startsWith(c + " >");
          }));
      var mRating = r4
        ? (p.shopRating || 0) >= 4
        : r3
          ? (p.shopRating || 0) >= 3
          : true;
      var mLoc = !selLoc || p.shopCity === selLoc;
      return mSearch && mPrice && mCat && mRating && mLoc;
    });

    if (sortBy === "price-asc")
      filtered.sort(function (a, b) {
        return (a.price || 0) - (b.price || 0);
      });
    else if (sortBy === "price-desc")
      filtered.sort(function (a, b) {
        return (b.price || 0) - (a.price || 0);
      });
    else if (sortBy === "popular")
      filtered.sort(function (a, b) {
        return (b.views || 0) - (a.views || 0);
      });
    else if (sortBy === "recent")
      filtered.sort(function (a, b) {
        return (
          ((b.createdAt && b.createdAt.seconds) || 0) -
          ((a.createdAt && a.createdAt.seconds) || 0)
        );
      });

    renderProducts(filtered);
  }
  window.applyFilters = applyFilters;

  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML =
        '<div class="cat-empty"><div class="cat-empty-num">∅</div><div class="cat-empty-title">Aucun résultat</div><div class="cat-empty-sub">Modifiez vos critères.</div><button class="cat-empty-btn" onclick="document.getElementById(\'reset-filters\').click()">Réinitialiser</button></div>';
      return;
    }
    var wishlist = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    grid.innerHTML = products
     .map(function (p, i) {
    var img = (Array.isArray(p.images) ? p.images[0] : null) || p.image || "assets/img/placeholder-product-1.svg";
    var hasDisc = p.originalPrice && p.originalPrice > p.price;
    var disc = hasDisc ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
    var inWish = wishlist.some(function (w) { return (w.id || w) === p.id; });
    var delay = 'style="animation-delay:' + (i % 6) * 0.06 + 's"';
    var safeName = (p.name || "").replace(/'/g, "\\'");

    // --- LOGIQUE DU LIEN SEO ---
    // Slug-ID pour SEO + facilité de récupération (avec -- comme séparateur)
    var pUrl = p.slug ? '/product/' + p.slug + '--' + p.id : '/product/' + (p.name ? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'produit') + '--' + p.id;
    // ---------------------------

    return (
        '<div class="prd-card rv" ' + delay + ">" +
        // MODIFICATION ICI : On utilise pUrl
        '<a href="' + pUrl + '">' +
        '<div class="prd-img-wrap">' +
        (hasDisc ? '<span class="prd-disc-badge">-' + disc + "%</span>" : "") +
        '<img class="prd-img" src="' + img + '" alt="' + (p.name || "") + '" loading="lazy" onerror="this.src=\'assets/img/placeholder-product-1.svg\'">' +
        '<div class="prd-overlay"><button class="prd-quick" onclick="event.preventDefault();event.stopPropagation();if(typeof window.quickAdd===\'function\')window.quickAdd(\'' +
        p.id + '\',\'' + safeName + '\',' + (p.price || 0) + ',\'' + img + '\',\'' + p.shopId + '\')"><span>+ Ajouter au panier</span></button></div>' +
        '<button class="prd-wish' + (inWish ? " on" : "") + '" onclick="event.preventDefault();event.stopPropagation();toggleWish(\'' +
        p.id + "',this,'" + safeName + "'," + (p.price || 0) + ",'" + img + '\')" title="Favoris"><svg viewBox="0 0 24 24" fill="' +
        (inWish ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
        "</div></a>" +
        '<div class="prd-body">' +
        '<div class="prd-shop"><a class="prd-shop-name" href="' + (p.shopSlug ? '/boutique/' + p.shopSlug : '/boutique?id=' + p.shopId) + '">' + p.shopName + "</a></div>" +
        // MODIFICATION ICI AUSSI : On utilise pUrl pour le nom du produit
        '<a href="' + pUrl + '"><div class="prd-name">' + (p.name || "Produit") + "</div></a>" +
        '<div class="prd-price-row"><span class="prd-price">' + fmt(p.price || 0) + "<span style=\"font-size:10px;font-family:'Syne';font-weight:400;margin-left:3px\">FCFA</span></span>" +
        (hasDisc ? '<span class="prd-price-orig">' + fmt(p.originalPrice) + " FCFA</span>" : "") +
        "</div>" +
        (p.shopCity ? '<div class="prd-city">📍 ' + p.shopCity + "</div>" : "") +
        "</div>" +
        "</div>"
    );
})
      .join("");

    requestAnimationFrame(function () {
      var io2 = new IntersectionObserver(
        function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("on");
              io2.unobserve(e.target);
            }
          });
        },
        { threshold: 0.05 },
      );
      document.querySelectorAll(".prd-card.rv").forEach(function (el) {
        io2.observe(el);
      });
    });
  }

  window.quickAdd = function (id, name, price, image, shopId) {
    if (typeof addToCart === "function") {
      addToCart(String(id), 1, {
        id: id,
        name: name,
        price: price,
        image: image,
        shopId: shopId,
        quantity: 1,
        variants: {},
      });
    } else {
      var c = JSON.parse(localStorage.getItem("ac_cart") || "[]");
      var ei = c.findIndex(function (x) {
        return (x.id || x.productId) === id;
      });
      if (ei > -1) c[ei].quantity = (c[ei].quantity || 1) + 1;
      else
        c.push({
          id: id,
          name: name,
          price: price,
          image: image,
          shopId: shopId,
          quantity: 1,
          variants: {},
        });
      localStorage.setItem("ac_cart", JSON.stringify(c));
      if (window.updateCartBadge) window.updateCartBadge();
    }
    if (window.showToast)
      window.showToast("✓ " + name + " ajouté au panier", "success");
  };

  window.toggleWish = function (id, btn, name, price, image) {
    var wish = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    var idx = wish.findIndex(function (w) {
      return (w.id || w) === id;
    });
    if (idx > -1) {
      wish.splice(idx, 1);
      btn.classList.remove("on");
      btn.querySelector("svg").setAttribute("fill", "none");
      if (window.showToast) window.showToast("Retiré des favoris");
    } else {
      wish.push({ id: id, name: name, price: price, image: image });
      btn.classList.add("on");
      btn.querySelector("svg").setAttribute("fill", "currentColor");
      if (window.showToast) window.showToast("Ajouté aux favoris ♡", "success");
    }
    localStorage.setItem("ac_wishlist", JSON.stringify(wish));
  };

  window.resetPriceFilter = function () {
    var prices = allProducts
      .map(function (p) {
        return p.price || 0;
      })
      .filter(function (p) {
        return p > 0;
      });
    var mn = prices.length ? Math.min.apply(null, prices) : 0;
    var mx = prices.length ? Math.max.apply(null, prices) : 1000000;
    if (priceMin) priceMin.value = mn;
    if (priceMax) priceMax.value = mx;
    if (priceRMin) priceRMin.value = mn;
    if (priceRMax) priceRMax.value = mx;
    applyFilters();
  };
  window.uncheckCat = function (cat) {
    var cb = Array.from(
      document.querySelectorAll(
        '#category-filters-dynamic input[type="checkbox"]',
      ),
    ).find(function (c) {
      return c.value === cat;
    });
    if (cb) {
      cb.checked = false;
      applyFilters();
    }
  };

  if (priceMin)
    priceMin.addEventListener("input", function () {
      if (priceRMin) priceRMin.value = priceMin.value;
      applyFilters();
    });
  if (priceMax)
    priceMax.addEventListener("input", function () {
      if (priceRMax) priceRMax.value = priceMax.value;
      applyFilters();
    });
  if (priceRMin)
    priceRMin.addEventListener("input", function () {
      if (priceMin) priceMin.value = priceRMin.value;
      applyFilters();
    });
  if (priceRMax)
    priceRMax.addEventListener("input", function () {
      if (priceMax) priceMax.value = priceRMax.value;
      applyFilters();
    });
  if (sortSel) sortSel.addEventListener("change", applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (searchInput) searchInput.value = "";
      document
        .querySelectorAll('#category-filters-dynamic input[type="checkbox"]')
        .forEach(function (c) {
          c.checked = false;
        });
      ["rating-4plus", "rating-3plus"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.checked = false;
      });
      if (locationSel) locationSel.value = "";
      window.resetPriceFilter();
    });
  }

  function isSmall() {
    return window.matchMedia("(max-width:1024px)").matches;
  }
  function positionSidebar() {
    if (!sidebar) return;
    if (!isSmall()) {
      if (filtersSlot && sidebar.parentElement !== filtersSlot)
        filtersSlot.appendChild(sidebar);
    } else {
      if (sidebar.parentElement !== document.body)
        document.body.appendChild(sidebar);
    }
  }
  function openSidebar() {
    if (isSmall() && sidebar) sidebar.classList.add("show");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("show");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
  if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
  if (fabBtn) fabBtn.addEventListener("click", openSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
  positionSidebar();
  window.addEventListener("resize", positionSidebar);

  init();
});
