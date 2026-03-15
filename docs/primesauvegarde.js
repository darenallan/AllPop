/* 404 script */
/* CURSOR */
(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,[onclick]"))
      document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,[onclick]"))
      document.body.classList.remove("cur-h");
  });
})();

/*A.html script*/

/* ── CURSOR ── */
(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  const s = "a,button,input,select,textarea";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(s)) document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(s)) document.body.classList.remove("cur-h");
  });
})();

/* ── REVEAL ── */
const ro = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("on");
        ro.unobserve(e.target);
      }
    }),
  { threshold: 0.1 },
);
document.querySelectorAll(".rv").forEach((el) => ro.observe(el));

/* ── TABS ── */
function switchTab(name) {
  document.querySelectorAll(".hl-tab").forEach((t) => t.classList.remove("on"));
  document
    .querySelectorAll("[data-tab]")
    .forEach((b) => b.classList.remove("on"));
  document.getElementById("tab-" + name).classList.add("on");
  document
    .querySelectorAll(`[data-tab="${name}"]`)
    .forEach((b) => b.classList.add("on"));
  if (window.innerWidth < 1024)
    document.querySelector(".hl-main").scrollIntoView({ behavior: "smooth" });
}
document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

/* ── FAQ ACCORDION ── */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") lucide.createIcons();

  function ease(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  }
  function animH(el, from, to, dur, done) {
    const s = performance.now();
    (function step(now) {
      const p = Math.min((now - s) / dur, 1);
      el.style.maxHeight = from + (to - from) * ease(p) + "px";
      p < 1 ? requestAnimationFrame(step) : done && done();
    })(s);
  }

  document.querySelectorAll(".hl-faq-item").forEach((item) => {
    const btn = item.querySelector(".hl-faq-q");
    const ans = item.querySelector(".hl-faq-a");
    const inner = item.querySelector(".hl-faq-a-inner");

    btn.addEventListener("click", () => {
      const open = item.classList.contains("open");

      document.querySelectorAll(".hl-faq-item.open").forEach((other) => {
        if (other === item) return;
        const oa = other.querySelector(".hl-faq-a");
        const from = parseFloat(oa.style.maxHeight) || oa.scrollHeight;
        other.classList.remove("open");
        oa.style.opacity = "0";
        other.querySelector(".hl-faq-q").setAttribute("aria-expanded", "false");
        animH(oa, from, 0, 300, () => (oa.style.maxHeight = "0"));
      });

      if (open) {
        const from = parseFloat(ans.style.maxHeight) || ans.scrollHeight;
        item.classList.remove("open");
        ans.style.opacity = "0";
        btn.setAttribute("aria-expanded", "false");
        animH(ans, from, 0, 300, () => (ans.style.maxHeight = "0"));
      } else {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        const to = inner.scrollHeight + 48;
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            ans.style.opacity = "1";
            animH(ans, 0, to, 420, () => (ans.style.maxHeight = "none"));
          }),
        );
      }
    });
  });
});

/*about.html script*/
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") lucide.createIcons();

  /* ── STATS FIREBASE ── */
  const loadStats = async () => {
    if (typeof firebase === "undefined" || !firebase.apps.length) {
      setFallback();
      return;
    }
    try {
      const db = firebase.firestore();
      const [prodsSnap, shopsSnap] = await Promise.all([
        db.collectionGroup("products").get(),
        db.collection("shops").get(),
      ]);
      let totalRating = 0,
        rCount = 0;
      prodsSnap.forEach((d) => {
        if (d.data().rating) {
          totalRating += d.data().rating;
          rCount++;
        }
      });
      const avg = rCount > 0 ? (totalRating / rCount).toFixed(1) : 4.5;

      document
        .getElementById("stats-products")
        .setAttribute("data-target", prodsSnap.size || 500);
      document
        .getElementById("stats-shops")
        .setAttribute("data-target", shopsSnap.size || 25);
      document.getElementById("stats-rating").setAttribute("data-target", avg);
    } catch (e) {
      setFallback();
    }
  };

  function setFallback() {
    document.getElementById("stats-products").setAttribute("data-target", 500);
    document.getElementById("stats-shops").setAttribute("data-target", 25);
    document.getElementById("stats-rating").setAttribute("data-target", 4.5);
  }

  /* ── COUNTER ANIMATION ── */
  function animCounter(el) {
    const target = parseFloat(el.getAttribute("data-target"));
    const suffix = el.getAttribute("data-suffix") || "";
    const isFloat = !Number.isInteger(target);
    const dur = 2200;
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      const val = target * ease;
      el.textContent =
        (isFloat ? val.toFixed(1) : Math.floor(val)) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    })(start);
  }

  const cObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animCounter(e.target);
          cObs.unobserve(e.target);
        }
      }),
    { threshold: 0.15 },
  );

  loadStats().then(() => {
    document.querySelectorAll(".counter").forEach((c) => cObs.observe(c));
  });
});

/*boutique-list.html script*/

function setupHeaderMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("menu-overlay");

  const toggleMenu = () => {
    if (!drawer || !overlay) return;
    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = drawer.classList.contains("active")
      ? "hidden"
      : "";
  };

  if (menuToggle) menuToggle.addEventListener("click", toggleMenu);
  if (closeBtn) closeBtn.addEventListener("click", toggleMenu);
  if (overlay) overlay.addEventListener("click", toggleMenu);

  const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const count = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
    if (count > 0) {
      badge.innerText = count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderMenu();

  // Remise en place de ta fonction pour l'année !
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.innerText = new Date().getFullYear();
  }

  // Gestion de la déconnexion
  const logoutBtn = document.getElementById("mobile-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "login.html";
        });
    });
  }

  // --- CHARGEMENT BOUTIQUES ---
  if (typeof firebase === "undefined" || !firebase.apps.length) {
    document.getElementById("shops-grid").innerHTML = `
          <div class="bl-empty" style="grid-column: 1 / -1; border:none; background:transparent;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h3 class="bl-empty-title">Erreur de chargement</h3>
            <p class="bl-empty-sub">Firebase n'est pas initialisé.</p>
          </div>
       `;
    return;
  }

  const db = firebase.firestore();
  const categorySelect = document.getElementById("category-filter");
  const grid = document.getElementById("shops-grid");

  const fallbackCategories = [
    "Mode & Accessoires",
    "Beauté, Hygiène & Bien-être",
    "Électronique, Téléphonie & Informatique",
    "Maison, Meubles & Décoration",
    "Bâtiment, Quincaillerie & Matériaux",
    "Véhicules & Mobilité",
    "Restauration & Boissons",
  ];

  const fallbackShops = [
    {
      id: "test-mode",
      name: "Mode & Accessoires",
      description: "Tendances premium et pièces uniques.",
      category: "Mode & Accessoires",
    },
    {
      id: "test-beaute",
      name: "Beauté & Bien-être",
      description: "Cosmétiques, soins et parfums d'exception.",
      category: "Beauté, Hygiène & Bien-être",
    },
    {
      id: "test-electro",
      name: "Électronique",
      description: "High-Tech, téléphonie et informatique.",
      category: "Électronique, Téléphonie & Informatique",
    },
  ];

  function renderShops(list) {
    if (!list || list.length === 0) {
      grid.innerHTML = `
          <div class="bl-empty" style="grid-column: 1 / -1; border:none; background:transparent;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
            <h3 class="bl-empty-title">Aucune galerie trouvée</h3>
            <p class="bl-empty-sub">Il n'y a pas encore de boutiques dans cette catégorie.</p>
          </div>
        `;
      return;
    }

    grid.innerHTML = list
      .map((shop, idx) => {
        const logo =
          shop.logo || shop.image || "assets/img/placeholder-urban.svg";
        const banner = [
          shop.cover,
          shop.coverUrl,
          shop.banner,
          shop.bannerUrl,
          shop.coverImage,
          shop.heroImage,
          shop.headerImage,
          Array.isArray(shop.banners) ? shop.banners[0] : null,
          Array.isArray(shop.coverImages) ? shop.coverImages[0] : null,
          Array.isArray(shop.images) ? shop.images[0] : null,
          "assets/img/cover.png",
        ].find((v) => typeof v === "string" && v.trim().length > 0);
        const hasLogo = Boolean(shop.logo || shop.image);
        return `
          <a href="boutique.html?id=${shop.id}" class="bl-card" style="transition-delay: ${idx * 0.05}s;">
            <div class="bl-card-banner" style="background-image: linear-gradient(135deg, rgba(11,10,8,.18), rgba(11,10,8,.42)), url('${banner}'); background-size: cover; background-position: center;"></div>
            <div class="bl-card-avatar">
              ${
                hasLogo
                  ? `<img src="${logo}" alt="${shop.name || "Boutique"}" onerror="this.style.display='none';">`
                  : `<i data-lucide="store"></i>`
              }
            </div>
            <div class="bl-card-body">
              <span class="bl-card-cat">${shop.category || "Catégorie"}</span>
              <h3 class="bl-card-name">${shop.name || "Boutique"}</h3>
              <p class="bl-card-desc">${shop.description || "Visitez notre vitrine pour découvrir nos collections exclusives et nos nouveautés."}</p>
              <div class="bl-card-footer">
                <span class="bl-card-btn">
                  Explorer 
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </a>
        `;
      })
      .join("");

    // Déclenche l'animation d'entrée
    setTimeout(() => {
      document
        .querySelectorAll(".bl-card")
        .forEach((el) => el.classList.add("on"));
    }, 50);

    if (window.lucide) lucide.createIcons();
  }

  async function loadCategories() {
    try {
      const snap = await db.collection("categories").get();
      const cats = [];
      snap.forEach((doc) => cats.push(doc.data().name));
      const all = cats.length ? cats : fallbackCategories;
      categorySelect.innerHTML =
        '<option value="">Toutes les galeries</option>' +
        all.map((c) => `<option value="${c}">${c}</option>`).join("");
    } catch (err) {
      categorySelect.innerHTML =
        '<option value="">Toutes les galeries</option>' +
        fallbackCategories
          .map((c) => `<option value="${c}">${c}</option>`)
          .join("");
    }
  }

  async function loadShops(filterCat = "") {
    grid.innerHTML = `
        <div class="bl-loader" style="grid-column: 1 / -1; border:none; background:transparent;">
          <span class="bl-loader-ring"></span>
          <p class="bl-loader-txt">Recherche en cours</p>
        </div>
      `;
    try {
      let ref = db.collection("shops");
      if (filterCat) ref = ref.where("category", "==", filterCat);
      const snap = await ref.get();
      const shops = [];
      snap.forEach((doc) => shops.push({ id: doc.id, ...doc.data() }));
      renderShops(shops.length ? shops : filterCat ? [] : fallbackShops);
    } catch (err) {
      renderShops(filterCat ? [] : fallbackShops);
    }
  }

  categorySelect.addEventListener("change", (e) => {
    loadShops(e.target.value || "");
  });

  loadCategories();
  loadShops();
});

/*boutique.html script*/

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();

  // Gestion Menu Mobile
  const logoutBtn = document.getElementById("mobile-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "login.html";
        });
    });
  }

  const menuToggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("menu-overlay");

  function openMenu() {
    if (drawer) drawer.classList.add("active");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    if (drawer) drawer.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (menuToggle) menuToggle.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  // --- LOGIQUE FIREBASE BOUTIQUE ---
  if (typeof firebase === "undefined" || !firebase.apps.length) {
    document.getElementById("shop-name").innerText = "Erreur Firebase";
    return;
  }

  const db = firebase.firestore();
  const params = new URLSearchParams(window.location.search);
  const shopId = params.get("id");

  const els = {
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

  let allShopProducts = [];
  let currentShopData = {};

  if (!shopId) {
    els.name.innerText = "Boutique introuvable";
    els.grid.innerHTML = "<p class='bp-msg'>ID de boutique manquant.</p>";
    return;
  }

  // Charger Info Boutique
  db.collection("shops")
    .doc(shopId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        currentShopData = data || {};
        els.name.innerText = data.name;
        els.slogan.innerText = data.slogan || "";
        els.desc.innerText =
          data.description || "Bienvenue dans notre galerie.";

        if (data.banner) els.banner.src = data.banner;
        if (data.logo) els.logo.src = data.logo;
        if (data.status === "active")
          els.verified.style.display = "inline-flex";

        els.contactBtn.onclick = async () => {
          if (typeof window.initChatModalBindings === "function") {
            window.initChatModalBindings();
          }
          if (typeof window.openSellerChat !== "function") {
            if (typeof window.showToast === "function") {
              window.showToast(
                "Messagerie indisponible pour le moment.",
                "danger",
              );
            }
            return;
          }
          try {
            await window.openSellerChat({
              shopId,
              sellerId:
                currentShopData.ownerId ||
                currentShopData.sellerId ||
                currentShopData.ownerUid ||
                currentShopData.userId ||
                currentShopData.uid ||
                "",
              shopName: currentShopData.name || "Boutique",
              sellerName:
                currentShopData.ownerName ||
                currentShopData.sellerName ||
                currentShopData.name ||
                "Vendeur",
            });
          } catch (error) {
            if (typeof window.showToast === "function") {
              window.showToast(
                error.message || "Impossible d'ouvrir la conversation.",
                "danger",
              );
            }
          }
        };
      } else {
        els.name.innerText = "Boutique fermée ou inexistante";
        els.grid.innerHTML = "";
      }
    });

  // Charger Produits
  db.collection("products")
    .where("shopId", "==", shopId)
    .get()
    .then((snap) => {
      els.grid.innerHTML = "";
      if (snap.empty) {
        els.grid.innerHTML =
          "<p class='bp-msg'>Cette boutique n'a pas encore ajouté de pièces à sa collection.</p>";
        return;
      }
      snap.forEach((doc) => {
        const p = { id: doc.id, ...doc.data() };
        allShopProducts.push(p);
        renderCard(p);
      });
      if (window.lucide) lucide.createIcons();
    });

  // Fonction de rendu (NOUVEAU DESIGN SOMBRE)
  function renderCard(p) {
    const price = new Intl.NumberFormat("fr-FR").format(p.price);
    const img =
      p.imageURL ||
      p.image ||
      (p.images && p.images[0]) ||
      "assets/img/placeholder-product-1.svg";
    const rating = p.rating || "5.0";
    const shopName =
      p.shopName || p.shop || p.vendorName || p.sellerName || "Aurum";
    const isFavorite =
      typeof isInWishlist === "function" ? isInWishlist(p.id) : false;

    els.grid.innerHTML += `
              <a href="product.html?id=${p.id}" class="bp-card">
                  <div class="bp-card-img-wrap">
                      <button class="bp-card-wishlist${isFavorite ? " active" : ""}" type="button" aria-pressed="${isFavorite ? "true" : "false"}" onclick="event.stopPropagation(); event.preventDefault(); if (typeof toggleWishlist === 'function') toggleWishlist(event, '${p.id}'); return false;">
                          <i data-lucide="heart" style="width:16px; height:16px; fill:${isFavorite ? "currentColor" : "none"}"></i>
                      </button>
                      <img src="${img}" alt="${p.name || "Produit"}" class="bp-card-img">
                  </div>
                  <div class="bp-card-body">
                      <span class="bp-card-brand">${shopName}</span>
                      <h3 class="bp-card-title">${p.name || "Pièce Unique"}</h3>
                      <div class="bp-card-rating">
                          ★★★★★ <span style="color:#7A7570;">(${rating})</span>
                      </div>
                      <div class="bp-card-footer">
                          <span class="bp-card-price">${price} FCFA</span>
                          <button class="bp-card-add" type="button" onclick="event.stopPropagation(); event.preventDefault(); addToCart('${p.id}'); return false;">
                              <i data-lucide="shopping-bag" style="width:14px; height:14px;"></i> Ajouter
                          </button>
                      </div>
                  </div>
              </a>
          `;
  }

  // Filtre de recherche en temps réel
  els.search.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    els.grid.innerHTML = "";
    const filtered = allShopProducts.filter((p) =>
      (p.name || "").toLowerCase().includes(term),
    );
    if (filtered.length === 0)
      els.grid.innerHTML =
        "<p class='bp-msg'>Aucune pièce ne correspond à votre recherche.</p>";
    else {
      filtered.forEach((p) => renderCard(p));
      if (window.lucide) lucide.createIcons();
    }
  });

  if (window.lucide) lucide.createIcons();
});

/* ── CURSOR SCRIPT ── */
(() => {
  const ring = document.getElementById("bp-ring"),
    dot = document.getElementById("bp-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,select,input,[onclick],.bp-card"))
      document.body.classList.add("bp-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,select,input,[onclick],.bp-card"))
      document.body.classList.remove("bp-h");
  });
})();

/* cart.html script */

/* ── CURSOR ── */
(() => {
  const ring = document.getElementById("ct-ring"),
    dot = document.getElementById("ct-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,select,[onclick]"))
      document.body.classList.add("ct-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,select,[onclick]"))
      document.body.classList.remove("ct-h");
  });
})();

/* ── TOAST ── */
function ctToast(msg, type = "") {
  const zone = document.getElementById("ct-toasts");
  const el = document.createElement("div");
  el.className =
    "ct-toast " + (type === "success" ? "ok" : type === "error" ? "err" : "");
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.showToast = ctToast;

/* ── FORMAT ── */
const ctFmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

/* ── CLEAR ── */
window.ctClearCart = () => {
  if (!confirm("Vider tout le panier ?")) return;
  localStorage.removeItem("ac_cart");
  location.reload();
};

document.addEventListener("DOMContentLoaded", () => {
  if (!firebase.apps.length) {
    document.getElementById("loading").innerHTML =
      '<p style="color:#D94F4F;text-align:center;padding:40px;font-family:Syne,sans-serif;">Firebase non initialisé.</p>';
    return;
  }

  const db = firebase.firestore(),
    auth = firebase.auth();
  const loadingEl = document.getElementById("loading");
  const emptyEl = document.getElementById("cart-empty");
  const contentEl = document.getElementById("cart-content");
  const listEl = document.getElementById("cart-items-list");
  const countLabel = document.getElementById("cart-count-label");
  const subtotalEl = document.getElementById("subtotal-display");
  const totalEl = document.getElementById("total-display");
  const checkoutBtn = document.getElementById("btn-checkout");
  const shippingFeeEl = document.getElementById("shipping-fee-display");
  const addressSelectEl = document.getElementById("delivery-address-select");
  const shippingNoteEl = document.getElementById("shipping-note");

  let shippingRates = null,
    currentShippingFee = 0,
    currentAddress = null;
  const addressById = new Map();

  /* ── CHECKOUT ── */
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const user =
        (auth && auth.currentUser) ||
        (firebase.auth && firebase.auth().currentUser) ||
        null;
      if (!user) {
        alert("Veuillez vous connecter pour continuer.");
        window.location.href = "login.html?redirect=invoice.html";
        return;
      }
      try {
        checkoutBtn.disabled = true;
        checkoutBtn.querySelector(".btn-txt").textContent = "Traitement…";
        const mainOrderRef =
          "AUR-" + Math.random().toString(36).substr(2, 6).toUpperCase();
        const invoiceNumber = await getNextInvoiceNumber(db);
        const subtotal = cartProductsData.reduce(
          (acc, item) => acc + item.price * item.qty,
          0,
        );
        const itemsBySeller = {};
        cartProductsData.forEach((item) => {
          const sid = item.shopId || item.sellerId || "unknown";
          if (!itemsBySeller[sid]) itemsBySeller[sid] = [];
          itemsBySeller[sid].push(item);
        });
        const sellerIds = Object.keys(itemsBySeller);
        const createdOrderIds = [];
        for (let i = 0; i < sellerIds.length; i++) {
          const sellerId = sellerIds[i];
          const sellerItems = itemsBySeller[sellerId];
          const subRef =
            sellerIds.length > 1 ? `${mainOrderRef}-${i + 1}` : mainOrderRef;
          const sellerSubtotal = sellerItems.reduce(
            (acc, item) => acc + item.price * item.qty,
            0,
          );
          const sellerShippingFee =
            sellerIds.length > 1
              ? Math.round((sellerSubtotal / subtotal) * currentShippingFee)
              : currentShippingFee;
          const orderData = {
            reference: subRef,
            mainOrderRef,
            invoiceNumber,
            userId: user.uid,
            userEmail: user.email,
            sellerId,
            items: sellerItems.map((item) => ({
              productId: item.id,
              shopId: item.shopId || item.sellerId || null,
              name: item.name,
              price: item.price,
              qty: item.qty,
              image: item.image || "",
            })),
            subtotal: sellerSubtotal,
            shippingFee: sellerShippingFee,
            total: sellerSubtotal + sellerShippingFee,
            deliveryAddress: currentAddress || null,
            status: "pending_admin",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          };
          const docRef = await db.collection("orders").add(orderData);
          createdOrderIds.push(docRef.id);
        }
        localStorage.setItem(
          "ac_cart_checkout",
          JSON.stringify({
            orderId: createdOrderIds[0],
            mainOrderRef,
            items: cartProductsData,
            invoiceNumber,
            reference: mainOrderRef,
          }),
        );
        localStorage.removeItem("ac_cart");
        window.location.href = "invoice.html?orderId=" + createdOrderIds[0];
      } catch (err) {
        ctToast("Erreur lors de la commande. Réessayez.", "error");
        checkoutBtn.disabled = false;
        checkoutBtn.querySelector(".btn-txt").textContent =
          "Procéder au paiement";
      }
    });
  }

  async function getNextInvoiceNumber(db) {
    const ref = db.collection("meta").doc("invoiceCounter");
    try {
      return await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const next = (doc.exists ? doc.data().value || 0 : 0) + 1;
        t.set(ref, { value: next }, { merge: true });
        return next;
      });
    } catch (e) {
      const c = Number(localStorage.getItem("ac_invoice_counter") || "0") + 1;
      localStorage.setItem("ac_invoice_counter", String(c));
      return c;
    }
  }

  /* ── PANIER DATA ── */
  let rawCart = [];
  try {
    const s = localStorage.getItem("ac_cart");
    rawCart = s ? JSON.parse(s) : [];
  } catch (e) {
    localStorage.removeItem("ac_cart");
    rawCart = [];
  }

  let cart = Array.isArray(rawCart)
    ? rawCart
        .map((item) => {
          if (!item) return null;
          if (item.pid) return item;
          if (item.product && item.product.id)
            return {
              pid: String(item.product.id),
              qty: item.quantity || 1,
              product: item.product,
            };
          return null;
        })
        .filter(Boolean)
    : [];

  if (cart.length !== rawCart.length)
    localStorage.setItem("ac_cart", JSON.stringify(cart));

  let cartProductsData = [];

  if (cart.length === 0) {
    showEmpty();
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  const localProducts = cart.filter((i) => i.product && i.product.id);
  if (localProducts.length === cart.length) {
    cartProductsData = localProducts.map((i) => ({
      id: String(i.product.id),
      ...i.product,
      shopId: i.product.shopId || i.product.sellerId || null,
      qty: parseInt(i.qty || i.quantity, 10) || 1,
    }));
    renderCart();
  } else {
    loadingEl.classList.add("show");
    Promise.all(
      cart.map((item) =>
        db
          .collection("products")
          .doc(item.pid)
          .get()
          .then((doc) => ({ doc, error: null }))
          .catch((error) => ({ doc: null, error })),
      ),
    )
      .then((results) => {
        let hasChanges = false;
        results.forEach((result) => {
          if (result.doc && result.doc.exists) {
            const pd = result.doc.data();
            const ci = cart.find((i) => i.pid === result.doc.id);
            cartProductsData.push({
              id: result.doc.id,
              ...pd,
              shopId: pd.shopId || pd.sellerId || null,
              qty: ci ? parseInt(ci.qty || ci.quantity, 10) || 1 : 1,
            });
          } else hasChanges = true;
        });
        if (hasChanges) {
          const vi = cartProductsData.map((p) => p.id);
          cart = cart.filter((i) => vi.includes(i.pid));
          localStorage.setItem("ac_cart", JSON.stringify(cart));
        }
        if (cartProductsData.length === 0) showEmpty();
        else renderCart();
      })
      .catch(() => {
        loadingEl.innerHTML =
          '<div style="text-align:center;padding:60px"><p style="color:#D94F4F;font-family:Syne,sans-serif;margin-bottom:20px;">Erreur de chargement.</p><button onclick="localStorage.removeItem(\'ac_cart\');location.reload();" style="padding:12px 28px;background:#C8A84B;color:#0B0A08;border:none;font-family:Unbounded,sans-serif;font-size:9px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;cursor:pointer;">Vider et réessayer</button></div>';
      });
  }

  function showEmpty() {
    loadingEl.style.display = "none";
    emptyEl.classList.add("show");
    contentEl.classList.remove("show");
  }

  function recalcTotal() {
    let total = 0,
      count = 0;
    document.querySelectorAll(".ct-item").forEach((row) => {
      const price = Number(row.getAttribute("data-price") || 0);
      const qtyEl = row.querySelector(".ct-qty-val");
      const qty = parseInt(qtyEl ? qtyEl.textContent : "1", 10) || 1;
      total += price * qty;
      count += qty;
    });
    if (subtotalEl) subtotalEl.textContent = ctFmt(total);
    if (totalEl)
      totalEl.textContent = ctFmt(total + (Number(currentShippingFee) || 0));
    if (countLabel) countLabel.textContent = count;
    if (checkoutBtn) checkoutBtn.disabled = count === 0;
  }

  function renderCart() {
    loadingEl.style.display = "none";
    emptyEl.classList.remove("show");
    contentEl.classList.add("show");
    listEl.innerHTML = "";

    cartProductsData.forEach((p, idx) => {
      const qty = parseInt(p.qty || p.quantity, 10) || 1;
      const price = Number(String(p.price || 0).replace(/[^\d.-]/g, "")) || 0;
      const lineTotal = price * qty;
      const maxStock = parseInt(p.stock || 0, 10) || 999;
      p.qty = qty;

      let img = "assets/img/placeholder-product-1.svg";
      if (p.image) img = p.image;
      else if (p.images && p.images.length > 0) img = p.images[0];

      const div = document.createElement("div");
      div.className = "ct-item";
      div.setAttribute("data-product-id", p.id);
      div.setAttribute("data-price", price);
      div.setAttribute("data-stock", maxStock);

      div.innerHTML = `
        <a href="produit.html?id=${p.id}" class="ct-item-img-wrap">
          <img src="${img}" class="ct-item-img" alt="${p.name || ""}" onerror="this.src='assets/img/placeholder-product-1.svg'">
        </a>
        <div class="ct-item-body">
          ${p.category ? `<span class="ct-item-cat">${p.category}</span>` : ""}
          <a href="produit.html?id=${p.id}" class="ct-item-name">${p.name || "Produit sans nom"}</a>
          ${p.shopName ? `<span class="ct-item-shop"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${p.shopName}</span>` : ""}
          <span class="ct-item-unit">${new Intl.NumberFormat("fr-FR").format(price)} FCFA / unité</span>
        </div>
        <div class="ct-item-right">
          <span class="ct-item-total" id="line-total-${p.id}">${new Intl.NumberFormat("fr-FR").format(lineTotal)} FCFA</span>
          <div class="ct-qty">
            <button class="ct-qty-btn" onclick="ctUpdateQty('${p.id}',-1)">−</button>
            <span class="ct-qty-val" id="qty-${p.id}">${qty}</span>
            <button class="ct-qty-btn" onclick="ctUpdateQty('${p.id}',1)" ${qty >= maxStock ? "disabled" : ""}>+</button>
          </div>
          <button class="ct-del" onclick="ctRemoveItem('${p.id}')" title="Supprimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      `;
      listEl.appendChild(div);
      // stagger reveal
      setTimeout(() => div.classList.add("on"), 60 + idx * 80);
    });

    recalcTotal();
    if (typeof updateCartBadge === "function") updateCartBadge();
  }

  /* ── SHIPPING ── */
  function normCity(v) {
    return String(v || "").trim();
  }
  function getShipFee(city) {
    if (!shippingRates) return null;
    const t = normCity(city).toLowerCase();
    if (!t) return null;
    const k = Object.keys(shippingRates).find((k) => k.toLowerCase() === t);
    return Number(k ? shippingRates[k] : shippingRates.default) || 0;
  }
  function updateShipUI() {
    if (!shippingRates) {
      if (shippingFeeEl) shippingFeeEl.textContent = "Tarif indisponible";
      currentShippingFee = 0;
      recalcTotal();
      return;
    }
    if (!currentAddress) {
      if (shippingFeeEl) shippingFeeEl.textContent = "Sélectionnez une adresse";
      if (shippingNoteEl) shippingNoteEl.textContent = "";
      currentShippingFee = 0;
      recalcTotal();
      return;
    }
    const city = normCity(currentAddress.city);
    const fee = getShipFee(city);
    if (fee === null) {
      if (shippingFeeEl) shippingFeeEl.textContent = "Ville non reconnue";
      currentShippingFee = Number(shippingRates?.default) || 0;
    } else {
      if (shippingFeeEl) shippingFeeEl.textContent = ctFmt(fee);
      currentShippingFee = fee;
    }
    if (shippingNoteEl)
      shippingNoteEl.textContent = city ? `Livraison vers ${city}` : "";
    localStorage.setItem(
      "ac_checkout_shipping",
      JSON.stringify({
        addressId: currentAddress.id || null,
        city: currentAddress.city || "",
        fee: currentShippingFee,
      }),
    );
    recalcTotal();
  }
  function setAddressOptions(addresses) {
    if (!addressSelectEl) return;
    addressById.clear();
    if (!Array.isArray(addresses) || addresses.length === 0) {
      addressSelectEl.innerHTML =
        '<option value="">Aucune adresse enregistrée</option>';
      addressSelectEl.disabled = true;
      currentAddress = null;
      updateShipUI();
      if (shippingNoteEl)
        shippingNoteEl.innerHTML =
          '<a href="profile.html">+ Ajouter une adresse</a>';
      return;
    }
    addresses.forEach((a) => addressById.set(String(a.id), a));
    addressSelectEl.disabled = false;
    addressSelectEl.innerHTML =
      '<option value="">Choisir une adresse</option>' +
      addresses
        .map(
          (a) =>
            `<option value="${a.id}">${[a.name || "Adresse", a.city, a.description].filter(Boolean).join(" · ")}</option>`,
        )
        .join("");
    const saved = localStorage.getItem("ac_selected_address_id");
    if (saved && addressById.has(saved)) {
      addressSelectEl.value = saved;
      currentAddress = addressById.get(saved);
    } else if (addresses.length === 1) {
      addressSelectEl.value = addresses[0].id;
      currentAddress = addresses[0];
    } else currentAddress = null;
    updateShipUI();
  }
  async function loadShipRates() {
    try {
      const doc = await db.collection("shipping_settings").doc("rates").get();
      shippingRates = doc.exists ? doc.data() : null;
    } catch (e) {
      shippingRates = null;
    }
    updateShipUI();
  }
  async function loadAddresses(user) {
    if (!user) {
      if (addressSelectEl) {
        addressSelectEl.innerHTML = '<option value="">Connectez-vous</option>';
        addressSelectEl.disabled = true;
      }
      currentAddress = null;
      updateShipUI();
      return;
    }
    try {
      const snap = await db
        .collection("users")
        .doc(user.uid)
        .collection("addresses")
        .get();
      setAddressOptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      if (addressSelectEl) {
        addressSelectEl.innerHTML =
          '<option value="">Erreur chargement</option>';
        addressSelectEl.disabled = true;
      }
    }
  }
  if (addressSelectEl) {
    addressSelectEl.addEventListener("change", () => {
      const id = addressSelectEl.value;
      localStorage.setItem("ac_selected_address_id", id || "");
      currentAddress = id && addressById.has(id) ? addressById.get(id) : null;
      updateShipUI();
    });
  }
  auth.onAuthStateChanged((user) => loadAddresses(user));
  loadShipRates();

  /* ── QUANTITÉ ── */
  window.ctUpdateQty = (productId, delta) => {
    const row = document.querySelector(
      `.ct-item[data-product-id="${productId}"]`,
    );
    const qtyEl = document.getElementById(`qty-${productId}`);
    const item = cartProductsData.find((p) => p.id === productId);
    if (!row || !qtyEl || !item) return;
    const maxStock =
      parseInt(row.getAttribute("data-stock") || "999", 10) || 999;
    const cur = parseInt(qtyEl.textContent || "1", 10) || 1;
    let next = cur;
    if (delta > 0) {
      if (cur < maxStock) next = cur + 1;
      else {
        ctToast(`Stock limité à ${maxStock}.`, "error");
        return;
      }
    } else next = Math.max(1, cur - 1);
    if (next === cur) return;
    qtyEl.textContent = next;
    item.qty = next;
    item.quantity = next;
    const ci = cart.find((i) => i.pid === productId);
    if (ci) {
      ci.qty = next;
      ci.quantity = next;
    }
    localStorage.setItem("ac_cart", JSON.stringify(cart));
    const price = Number(row.getAttribute("data-price") || 0);
    const ltEl = document.getElementById(`line-total-${productId}`);
    if (ltEl)
      ltEl.textContent =
        new Intl.NumberFormat("fr-FR").format(price * next) + " FCFA";
    const plusBtn = row.querySelector(".ct-qty-btn:last-of-type");
    if (plusBtn) plusBtn.disabled = next >= maxStock;
    recalcTotal();
  };
  // Alias pour compatibilité app.js
  window.updateQuantity = window.ctUpdateQty;

  /* ── SUPPRIMER ── */
  window.ctRemoveItem = (productId) => {
    const row = document.querySelector(
      `.ct-item[data-product-id="${productId}"]`,
    );
    if (row) {
      row.style.transition = "opacity .3s,transform .3s";
      row.style.opacity = "0";
      row.style.transform = "translateX(16px)";
      setTimeout(() => row.remove(), 320);
    }
    cart = cart.filter((i) => i.pid !== productId);
    cartProductsData = cartProductsData.filter((p) => p.id !== productId);
    localStorage.setItem("ac_cart", JSON.stringify(cart));
    setTimeout(() => {
      if (cart.length === 0) showEmpty();
      else recalcTotal();
    }, 340);
    if (typeof updateCartBadge === "function") updateCartBadge();
  };
  window.removeItem = window.ctRemoveItem;
});

/* catalogue.js script */

(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (
      e.target.closest("a,button,[onclick],input,select,textarea,.color-swatch")
    )
      document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (
      e.target.closest("a,button,[onclick],input,select,textarea,.color-swatch")
    )
      document.body.classList.remove("cur-h");
  });
})();
(() => {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("on");
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll(".rv").forEach((el) => io.observe(el));
})();
function toggleFg(el) {
  el.classList.toggle("collapsed");
}
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
function toast(msg, type = "info") {
  const z = document.getElementById("toast-zone");
  const el = document.createElement("div");
  el.className =
    "ax-toast " + (type === "success" ? "ok" : type === "error" ? "err" : "");
  el.textContent = msg;
  z.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.showToast = toast;
function skeletons(n) {
  return Array(n)
    .fill(0)
    .map(
      () =>
        '<div class="prd-card prd-skeleton"><div class="prd-img-wrap"></div><div class="prd-body"><div class="skel-line" style="width:50%"></div><div class="skel-line" style="width:85%;height:14px"></div><div class="skel-line" style="width:42%;height:12px;margin-top:14px"></div></div></div>',
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  ) {
    document.getElementById("catalogue-grid").innerHTML =
      '<div class="cat-empty"><div class="cat-empty-num">!</div><div class="cat-empty-title">Firebase non initialis&#233;</div><div class="cat-empty-sub">V&#233;rifiez votre config.</div></div>';
    return;
  }
  const db = firebase.firestore();
  const params = new URLSearchParams(window.location.search);
  let allProducts = [],
    allColors = new Set();
  let searchTimer = null;
  const searchInput = document.getElementById("search-input");
  const searchAuto = document.getElementById("search-autocomplete");
  const priceMin = document.getElementById("price-min");
  const priceMax = document.getElementById("price-max");
  const priceRMin = document.getElementById("price-range-min");
  const priceRMax = document.getElementById("price-range-max");
  const locationSel = document.getElementById("location-select");
  const sortSel = document.getElementById("sort-select");
  const grid = document.getElementById("catalogue-grid");
  const activeFiltersDiv = document.getElementById("active-filters");
  const resetBtn = document.getElementById("reset-filters");
  const toggleBtn = document.getElementById("toggle-filters");
  const fabBtn = document.getElementById("mobile-filter-fab");
  const sidebar = document.getElementById("filters-sidebar");
  const overlay = document.getElementById("filter-overlay");
  const filtersSlot = document.getElementById("filters-slot");
  const countEl = document.getElementById("cat-count-num");
  grid.innerHTML = skeletons(6);
  async function init() {
    try {
      const [shopsSnap, productsSnap] = await Promise.all([
        db.collection("shops").get(),
        db.collection("products").get(),
      ]);
      const shopsMap = new Map();
      shopsSnap.forEach((d) => shopsMap.set(d.id, d.data()));
      if (productsSnap.empty) {
        grid.innerHTML =
          '<div class="cat-empty"><div class="cat-empty-num">\u2205</div><div class="cat-empty-title">Catalogue vide</div><div class="cat-empty-sub">Aucun produit disponible pour le moment.</div></div>';
        if (countEl) countEl.textContent = "0";
        return;
      }
      productsSnap.forEach((doc) => {
        const p = doc.data();
        const shop = shopsMap.get(p.shopId || "") || {};
        if (p.colors && Array.isArray(p.colors))
          p.colors.forEach((c) => allColors.add(c));
        allProducts.push({
          id: doc.id,
          shopId: p.shopId || "",
          shopName: shop.name || "Boutique",
          shopRating: shop.rating || 0,
          shopCity: shop.city || shop.address || "",
          ...p,
        });
      });
      if (countEl) countEl.textContent = allProducts.length;
      const prices = allProducts.map((p) => p.price || 0).filter((p) => p > 0);
      const pMin = prices.length ? Math.min(...prices) : 0,
        pMax = prices.length ? Math.max(...prices) : 1000000;
      priceMin.value = pMin;
      priceMax.value = pMax;
      priceMin.placeholder = pMin;
      priceMax.placeholder = pMax;
      priceRMin.min = pMin;
      priceRMin.max = pMax;
      priceRMin.value = pMin;
      priceRMax.min = pMin;
      priceRMax.max = pMax;
      priceRMax.value = pMax;
      renderCatFilters();
      renderColorFilters();
      locationSel.addEventListener("change", applyFilters);
      const initialSearch = (params.get("q") || "").trim();
      if (initialSearch) searchInput.value = initialSearch;
      const urlCat = params.get("category");
      if (urlCat) {
        setTimeout(() => {
          const cb = Array.from(
            document.querySelectorAll(
              '#category-filters-dynamic input[type="checkbox"]',
            ),
          ).find((c) => c.value === urlCat);
          if (cb) {
            cb.checked = true;
            applyFilters();
          }
        }, 150);
      } else {
        applyFilters();
      }
    } catch (err) {
      console.error(err);
      const isIndex =
        err.code === "failed-precondition" || err.message.includes("index");
      grid.innerHTML =
        '<div class="cat-empty"><div class="cat-empty-title">' +
        (isIndex ? "Index Firestore manquant" : "Erreur de chargement") +
        '</div><div class="cat-empty-sub">' +
        (isIndex ? "Ouvrez la console pour cr\u00e9er l'index." : err.message) +
        '</div><button class="cat-empty-btn" onclick="location.reload()">R\u00e9essayer</button></div>';
    }
  }
  function renderCatFilters() {
    if (typeof window.renderCategoryFilters === "function") {
      window.renderCategoryFilters("category-filters-dynamic");
      setTimeout(() => {
        document
          .querySelectorAll("#category-filters-dynamic label")
          .forEach((l) => {
            l.style.cssText =
              "font-size:12px;color:rgba(254,252,248,.7);cursor:none;display:flex;align-items:center;gap:10px;padding:7px 0";
          });
        document
          .querySelectorAll('#category-filters-dynamic input[type="checkbox"]')
          .forEach((cb) => {
            cb.style.cssText =
              "accent-color:var(--gold);cursor:none;width:14px;height:14px;flex-shrink:0";
            cb.addEventListener("change", applyFilters);
          });
      }, 200);
    }
  }
  function renderColorFilters() {
    const colorFilters = document.getElementById("color-filters-dynamic");
    if (!colorFilters) return;
    colorFilters.innerHTML = "";
    const preset = [
      "#000000",
      "#FFFFFF",
      "#D4AF37",
      "#FF0000",
      "#0000FF",
      "#00CC55",
      "#FFC0CB",
      "#FFA500",
    ];
    allColors.forEach((c) => {
      if (!preset.includes(c.toUpperCase())) {
        const sw = document.createElement("div");
        sw.className = "color-swatch";
        sw.dataset.color = c;
        sw.style.background = c.startsWith("#") ? c : "#888";
        sw.title = c;
        colorFilters.appendChild(sw);
      }
    });
    document.querySelectorAll(".color-swatch").forEach((sw) =>
      sw.addEventListener("click", () => {
        sw.classList.toggle("selected");
        applyFilters();
      }),
    );
  }
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    if (term.length >= 2) {
      searchTimer = setTimeout(() => showAuto(term), 300);
    } else {
      hideAuto();
      if (!term) applyFilters();
    }
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      hideAuto();
      applyFilters();
    }
  });
  document.addEventListener("click", (e) => {
    if (!document.getElementById("cat-search-box").contains(e.target))
      hideAuto();
  });
  function showAuto(term) {
    const matches = allProducts
      .filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.keywords &&
            Array.isArray(p.keywords) &&
            p.keywords.some((k) => k.toLowerCase().includes(term))) ||
          (p.category && p.category.toLowerCase().includes(term)),
      )
      .sort((a, b) => ((b.name || "").toLowerCase().startsWith(term) ? 1 : -1))
      .slice(0, 8);
    if (!matches.length) {
      searchAuto.innerHTML =
        '<div class="ac-empty">Aucun r\u00e9sultat pour \u00ab ' +
        term +
        " \u00bb</div>";
      searchAuto.classList.add("show");
      return;
    }
    searchAuto.innerHTML = matches
      .map((p) => {
        const img =
          (Array.isArray(p.images) ? p.images[0] : null) ||
          p.image ||
          "assets/img/placeholder-product-1.svg";
        const hl = (p.name || "").replace(
          new RegExp(term, "gi"),
          (m) =>
            '<mark style="background:rgba(200,168,75,.25);color:var(--gold);padding:0 2px">' +
            m +
            "</mark>",
        );
        return (
          '<div class="ac-item" onclick="location.href=\'produit.html?id=' +
          p.id +
          '\'"><img class="ac-img" src="' +
          img +
          '" alt="" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"/><div><div class="ac-name">' +
          hl +
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
    searchAuto.classList.remove("show");
    searchAuto.innerHTML = "";
  }
  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const minP = parseFloat(priceMin.value) || 0,
      maxP = parseFloat(priceMax.value) || Infinity;
    let selCats = [];
    if (typeof window.getSelectedCategoryFilters === "function")
      selCats = window.getSelectedCategoryFilters();
    else
      selCats = Array.from(
        document.querySelectorAll(
          '#category-filters-dynamic input[type="checkbox"]:checked',
        ),
      ).map((c) => c.value);
    const r4 =
      document.getElementById("rating-4plus") &&
      document.getElementById("rating-4plus").checked;
    const r3 =
      document.getElementById("rating-3plus") &&
      document.getElementById("rating-3plus").checked;
    const selColors = Array.from(
      document.querySelectorAll(".color-swatch.selected"),
    ).map((s) => s.dataset.color);
    const selLoc = locationSel.value,
      sortBy = sortSel.value;
    let filtered = allProducts.filter((p) => {
      const pP = parseFloat(p.price) || 0;
      const mSearch =
        !term ||
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.keywords &&
          p.keywords.some((k) => k.toLowerCase().includes(term))) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term));
      const mPrice = pP >= minP && pP <= maxP;
      const mCat =
        !selCats.length ||
        (p.category &&
          selCats.some(
            (c) => p.category === c || p.category.startsWith(c + " >"),
          ));
      const mRating = r4
        ? (p.shopRating || 0) >= 4
        : r3
          ? (p.shopRating || 0) >= 3
          : true;
      const mColor =
        !selColors.length ||
        (p.colors &&
          Array.isArray(p.colors) &&
          p.colors.some((c) => selColors.includes(c)));
      const mLoc = !selLoc || p.shopCity === selLoc;
      return mSearch && mPrice && mCat && mRating && mColor && mLoc;
    });
    if (sortBy === "price-asc")
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-desc")
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "recent")
      filtered.sort(
        (a, b) =>
          ((b.createdAt && b.createdAt.seconds) || 0) -
          ((a.createdAt && a.createdAt.seconds) || 0),
      );
    else if (sortBy === "popular")
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    renderActiveTags({ term, minP, maxP, selCats, r4, r3, selLoc });
    renderProducts(filtered);
  }
  window.applyFilters = applyFilters;
  function mkTag(txt, action) {
    return (
      '<div class="tag">' +
      txt +
      '<button class="tag-x" onclick="' +
      action +
      '"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
    );
  }
  function renderActiveTags(f) {
    let html = "";
    if (f.term)
      html += mkTag(
        '"' + f.term + '"',
        "document.getElementById('search-input').value='';applyFilters()",
      );
    const pMin0 = parseFloat(priceMin.placeholder) || 0,
      pMax0 = parseFloat(priceMax.placeholder) || Infinity;
    if (f.minP > pMin0 || f.maxP < pMax0)
      html += mkTag(
        fmt(f.minP) +
          " \u2013 " +
          (f.maxP === Infinity ? "\u221e" : fmt(f.maxP)) +
          " FCFA",
        "resetPriceFilter()",
      );
    f.selCats.forEach((c) => (html += mkTag(c, "uncheckCat('" + c + "')")));
    if (f.r4)
      html += mkTag(
        "\u2605\u2605\u2605\u2605+",
        "document.getElementById('rating-4plus').checked=false;applyFilters()",
      );
    if (f.r3)
      html += mkTag(
        "\u2605\u2605\u2605+",
        "document.getElementById('rating-3plus').checked=false;applyFilters()",
      );
    if (f.selLoc)
      html += mkTag(
        f.selLoc,
        "document.getElementById('location-select').value='';applyFilters()",
      );
    activeFiltersDiv.innerHTML = html;
  }
  function renderProducts(products) {
    if (!products.length) {
      grid.innerHTML =
        '<div class="cat-empty"><div class="cat-empty-num">\u2205</div><div class="cat-empty-title">Aucun r\u00e9sultat</div><div class="cat-empty-sub">Essayez de modifier vos crit\u00e8res de recherche.</div><button class="cat-empty-btn" onclick="document.getElementById(\'reset-filters\').click()">R\u00e9initialiser les filtres</button></div>';
      return;
    }
    const wishlist = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    grid.innerHTML = products
      .map((p, i) => {
        const img =
          (Array.isArray(p.images) ? p.images[0] : null) ||
          p.image ||
          "assets/img/placeholder-product-1.svg";
        const hasDisc = p.originalPrice && p.originalPrice > p.price;
        const disc = hasDisc
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : 0;
        const isNew =
          p.createdAt && Date.now() / 1000 - p.createdAt.seconds < 7 * 86400;
        const delay = 'style="animation-delay:' + (i % 6) * 0.06 + 's"';
        const inWish = wishlist.some((w) => (w.id || w) === p.id);
        const safeName = (p.name || "").replace(/'/g, "\\'");
        return (
          '<div class="prd-card rv" ' +
          delay +
          ">" +
          '<a href="produit.html?id=' +
          p.id +
          '">' +
          '<div class="prd-img-wrap">' +
          (hasDisc
            ? '<span class="prd-disc-badge">-' + disc + "%</span>"
            : isNew
              ? '<span class="prd-new-badge">Nouveau</span>'
              : "") +
          '<img class="prd-img" src="' +
          img +
          '" alt="' +
          (p.name || "") +
          '" loading="lazy" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"/>' +
          '<div class="prd-overlay"><button class="prd-quick" onclick="event.preventDefault();event.stopPropagation();quickAdd(\'' +
          p.id +
          "','" +
          safeName +
          "'," +
          (p.price || 0) +
          "'" +
          img +
          "','" +
          p.shopId +
          "')\"><span>+ Ajouter au panier</span></button></div>" +
          '<button class="prd-wish' +
          (inWish ? " on" : "") +
          '" onclick="event.preventDefault();event.stopPropagation();toggleWish(\'' +
          p.id +
          "',this,'" +
          safeName +
          "'," +
          (p.price || 0) +
          ",'" +
          img +
          '\')" title="Favoris"><svg viewBox="0 0 24 24" fill="' +
          (inWish ? "currentColor" : "none") +
          '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
          "</div></a>" +
          '<div class="prd-body">' +
          '<div class="prd-shop"><a class="prd-shop-name" href="boutique.html?id=' +
          p.shopId +
          '">' +
          p.shopName +
          '</a><span class="prd-stars">' +
          ((p.shopRating || 0) >= 4.5
            ? "\u2605\u2605\u2605\u2605\u2605"
            : (p.shopRating || 0) >= 4
              ? "\u2605\u2605\u2605\u2605"
              : "") +
          "</span></div>" +
          '<a href="produit.html?id=' +
          p.id +
          '"><div class="prd-name">' +
          (p.name || "Produit") +
          "</div></a>" +
          '<div class="prd-price-row"><span class="prd-price">' +
          fmt(p.price || 0) +
          "<span style=\"font-size:10px;font-family:'Syne';font-weight:400;margin-left:3px\">FCFA</span></span>" +
          (hasDisc
            ? '<span class="prd-price-orig">' +
              fmt(p.originalPrice) +
              " FCFA</span>"
            : "") +
          "</div>" +
          (p.shopCity
            ? '<div class="prd-city"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
              p.shopCity +
              "</div>"
            : "") +
          "</div></div>"
        );
      })
      .join("");
    requestAnimationFrame(() => {
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("on");
              io.unobserve(e.target);
            }
          }),
        { threshold: 0.05 },
      );
      document.querySelectorAll(".prd-card.rv").forEach((el) => io.observe(el));
    });
  }
  window.quickAdd = (id, name, price, image, shopId) => {
    if (typeof addToCart === "function") {
      addToCart(String(id), 1, {
        id,
        name,
        price,
        image,
        shopId,
        quantity: 1,
        variants: {},
      });
    } else {
      let cart = JSON.parse(
        localStorage.getItem("ac_cart") || localStorage.getItem("cart") || "[]",
      );
      const ei = cart.findIndex((c) => (c.id || c.productId) === id);
      if (ei > -1) cart[ei].quantity = (cart[ei].quantity || 1) + 1;
      else
        cart.push({
          id,
          name,
          price,
          image,
          shopId,
          quantity: 1,
          variants: {},
        });
      const key = localStorage.getItem("ac_cart") !== null ? "ac_cart" : "cart";
      localStorage.setItem(key, JSON.stringify(cart));
      if (typeof updateCartBadge === "function") updateCartBadge();
    }
    toast("\u2713 " + name + " ajout\u00e9 au panier", "success");
  };
  window.toggleWish = (id, btn, name, price, image) => {
    let wish = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    const idx = wish.findIndex((w) => (w.id || w) === id);
    if (idx > -1) {
      wish.splice(idx, 1);
      btn.classList.remove("on");
      btn.querySelector("svg").setAttribute("fill", "none");
      toast("Retir\u00e9 des favoris");
    } else {
      wish.push({ id, name, price, image });
      btn.classList.add("on");
      btn.querySelector("svg").setAttribute("fill", "currentColor");
      toast("Ajout\u00e9 aux favoris \u2661", "success");
    }
    localStorage.setItem("ac_wishlist", JSON.stringify(wish));
  };
  priceMin.addEventListener("input", () => {
    priceRMin.value = priceMin.value;
    applyFilters();
  });
  priceMax.addEventListener("input", () => {
    priceRMax.value = priceMax.value;
    applyFilters();
  });
  priceRMin.addEventListener("input", () => {
    priceMin.value = priceRMin.value;
    applyFilters();
  });
  priceRMax.addEventListener("input", () => {
    priceMax.value = priceRMax.value;
    applyFilters();
  });
  sortSel.addEventListener("change", applyFilters);
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    searchInput.value = "";
    document
      .querySelectorAll('#category-filters-dynamic input[type="checkbox"]')
      .forEach((c) => (c.checked = false));
    document
      .querySelectorAll(".color-swatch")
      .forEach((s) => s.classList.remove("selected"));
    ["rating-4plus", "rating-3plus"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    locationSel.value = "";
    const prices = allProducts.map((p) => p.price || 0).filter((p) => p > 0);
    const mn = prices.length ? Math.min(...prices) : 0,
      mx = prices.length ? Math.max(...prices) : 1000000;
    priceMin.value = mn;
    priceMax.value = mx;
    priceRMin.value = mn;
    priceRMax.value = mx;
    applyFilters();
  });
  window.resetPriceFilter = () => {
    const prices = allProducts.map((p) => p.price || 0).filter((p) => p > 0);
    const mn = prices.length ? Math.min(...prices) : 0,
      mx = prices.length ? Math.max(...prices) : 1000000;
    priceMin.value = mn;
    priceMax.value = mx;
    priceRMin.value = mn;
    priceRMax.value = mx;
    applyFilters();
  };
  window.uncheckCat = (cat) => {
    const cb = Array.from(
      document.querySelectorAll(
        '#category-filters-dynamic input[type="checkbox"]',
      ),
    ).find((c) => c.value === cat);
    if (cb) {
      cb.checked = false;
      applyFilters();
    }
  };
  const isSmall = () => window.matchMedia("(max-width:1024px)").matches;
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
    if (isSmall()) {
      sidebar && sidebar.classList.add("show");
      document.body.style.overflow = "hidden";
    }
    overlay && overlay.classList.add("active");
  }
  function closeSidebar() {
    sidebar && sidebar.classList.remove("show");
    overlay && overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
  toggleBtn && toggleBtn.addEventListener("click", openSidebar);
  fabBtn && fabBtn.addEventListener("click", openSidebar);
  overlay && overlay.addEventListener("click", closeSidebar);
  positionSidebar();
  window.addEventListener("resize", positionSidebar);
  init();
});

/* contact.html script */

/* ── CURSOR SCRIPT ── */
(() => {
  const ring = document.getElementById("ct-ring"),
    dot = document.getElementById("ct-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,input,textarea,[onclick]"))
      document.body.classList.add("ct-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,input,textarea,[onclick]"))
      document.body.classList.remove("ct-h");
  });
})();

function setupHeaderMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("menu-overlay");

  const toggleMenu = () => {
    if (!drawer || !overlay) return;
    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = drawer.classList.contains("active")
      ? "hidden"
      : "";
  };

  if (menuToggle) menuToggle.addEventListener("click", toggleMenu);
  if (closeBtn) closeBtn.addEventListener("click", toggleMenu);
  if (overlay) overlay.addEventListener("click", toggleMenu);

  const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const count = cart.reduce((acc, item) => acc + (item.qty || 0), 0);
    if (count > 0) {
      badge.innerText = count;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  setupHeaderMenu();
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.innerText = new Date().getFullYear();
  }

  // Gestion de la déconnexion
  const logoutBtn = document.getElementById("mobile-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "login.html";
        });
    });
  }
});

// Petite animation de soumission de formulaire factice mais classe
// (A remplacer par ta vraie logique d'envoi si besoin)
function handleContactSubmit(event) {
  event.preventDefault();
  const btn = event.target.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  btn.innerHTML = "<span>Envoi en cours...</span>";

  setTimeout(() => {
    if (typeof window.showToast === "function") {
      window.showToast(
        "Message envoyé avec succès. Nous vous contacterons très vite.",
        "success",
      );
    } else {
      alert("Message envoyé avec succès !");
    }
    event.target.reset();
    btn.innerHTML = originalText;
  }, 1500);
}

/* delivery.html script */

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

/*index.html script */

/* ── CURSOR ─────────────────────────────────── */
(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,[onclick],input,textarea"))
      document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,[onclick],input,textarea"))
      document.body.classList.remove("cur-h");
  });
})();

/* ── REVEAL ON SCROLL ────────────────────────── */
(() => {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("on");
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".rv").forEach((el) => obs.observe(el));
})();

/* ── HERO SEARCH ─────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".hero-search-input");
  const btn = document.querySelector(".hero-search-btn");
  const go = () => {
    const q = (input?.value || "").trim();
    window.location.href = q
      ? `catalogue.html?q=${encodeURIComponent(q)}`
      : "catalogue.html";
  };
  btn?.addEventListener("click", go);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  });

  /* Newsletter */
  document.getElementById("nl-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = e.target.querySelector("input").value;
    if (em) {
      if (typeof window.showToast === "function")
        window.showToast("Merci pour votre inscription !", "success");
      e.target.reset();
    }
  });

  /* Products loaded — hide skeleton, show grid */
  const skel = document.getElementById("skel-products");
  const grid = document.getElementById("products-container");
  const observer = new MutationObserver(() => {
    if (
      grid.children.length > 0 &&
      !(grid.children.length === 1 && grid.firstChild.tagName === "P")
    ) {
      skel.style.display = "none";
      grid.style.display = "grid";
    }
  });
  if (grid) observer.observe(grid, { childList: true });

  /* loadProducts from data.js */
  if (typeof window.loadProducts === "function") window.loadProducts();
  if (typeof lucide !== "undefined") lucide.createIcons();
});

/* login.html script */

/* ── CURSOR SCRIPT ── */
(() => {
  const ring = document.getElementById("lg-ring"),
    dot = document.getElementById("lg-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,input,[onclick]"))
      document.body.classList.add("lg-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,input,[onclick]"))
      document.body.classList.remove("lg-h");
  });
})();
// === PAGE LOGIN - LOGIQUE SPÉCIFIQUE ===
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();

  // AUTHENTIFICATION
  const form = document.getElementById("form-login");
  const btn = document.getElementById("btn-submit");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const originalText = btn.innerHTML;
      btn.innerHTML = "<span>Connexion...</span>";
      btn.disabled = true;

      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-pass").value;

      console.log("📧 Tentative connexion:", email);

      window.auth
        .signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
          console.log("✅ Connexion réussie:", userCredential.user.email);

          const finishRedirect = () => {
            const redirectWithRole = (role = "") => {
              const requestedReturn = new URLSearchParams(
                window.location.search,
              ).get("returnUrl");
              if (requestedReturn) {
                window.location.href = requestedReturn;
                return;
              }
              // Redirection basée sur le rôle
              if (email === "aurumcorporate.d@gmail.com") {
                window.location.href = "admin.html";
              } else if (["admin", "superadmin", "maintainer"].includes(role)) {
                window.location.href = "admin.html";
              } else if (role === "seller") {
                window.location.href = "seller.html";
              } else if (
                sessionStorage.getItem("ac_checkout_pending") === "true"
              ) {
                sessionStorage.removeItem("ac_checkout_pending");
                window.location.href = "theking.html";
              } else {
                window.location.href = "theking.html";
              }
            };

            if (window.db && userCredential.user?.uid) {
              window.db
                .collection("users")
                .doc(userCredential.user.uid)
                .get()
                .then((doc) => {
                  const role = doc.exists ? doc.data().role || "" : "";
                  redirectWithRole(role);
                })
                .catch(() => redirectWithRole(""));
            } else {
              redirectWithRole("");
            }
          };

          // Synchroniser l'utilisateur dans le localStorage avant redirection
          if (typeof window.syncCurrentUser === "function") {
            window
              .syncCurrentUser(userCredential.user)
              .then(finishRedirect)
              .catch(finishRedirect);
          } else {
            finishRedirect();
          }
        })
        .catch((error) => {
          console.error("❌ Erreur connexion:", error.code, error.message);

          let msg = "Erreur de connexion.";
          if (error.code === "auth/user-not-found") msg = "Compte introuvable.";
          if (error.code === "auth/wrong-password")
            msg = "Mot de passe incorrect.";
          if (error.code === "auth/invalid-email") msg = "Email invalide.";
          if (error.code === "auth/user-disabled") msg = "Compte désactivé.";
          if (error.code === "auth/too-many-requests")
            msg = "Trop de tentatives. Réessayez plus tard.";

          if (typeof window.showToast === "function") {
            window.showToast("⚠️ " + msg, "error");
          } else {
            alert("⚠️ " + msg);
          }

          btn.innerHTML = originalText;
          btn.disabled = false;
        });
    });
  }

  // === MOT DE PASSE OUBLIÉ ===
  const forgotLink = document.getElementById("forgot-password-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value;

      if (!email) {
        if (typeof window.showToast === "function")
          window.showToast("⚠️ Veuillez entrer votre email d'abord.", "info");
        else alert("Veuillez entrer votre email d'abord.");
        return;
      }

      firebase
        .auth()
        .sendPasswordResetEmail(email)
        .then(() => {
          if (typeof window.showToast === "function")
            window.showToast(
              "✅ Email de réinitialisation envoyé à " + email,
              "success",
            );
          else alert("✅ Email de réinitialisation envoyé à " + email);
        })
        .catch((error) => {
          let msg = "Erreur: " + error.message;
          if (error.code === "auth/user-not-found") msg = "Compte introuvable.";
          if (typeof window.showToast === "function")
            window.showToast("⚠️ " + msg, "error");
          else alert("⚠️ " + msg);
        });
    });
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
});

/*message.html script */

/* ═══════════════════════════════════════════════════════════════
   Aurum Inbox Controller
   ─ Fonctionne avec messaging.js v2
   ═══════════════════════════════════════════════════════════════ */
(function AurumInbox() {
  /* ── DOM refs ── */
  var sidebar = document.getElementById("inbox-sidebar");
  var convListEl = document.getElementById("inbox-conv-list");
  var countBadge = document.getElementById("inbox-count");
  var emptyState = document.getElementById("inbox-empty-state");
  var threadPanel = document.getElementById("inbox-thread");
  var threadInner = document.getElementById("inbox-thread-inner");
  var messagesWrap = document.getElementById("inbox-messages-wrap");
  var threadName = document.getElementById("inbox-thread-name");
  var threadSub = document.getElementById("inbox-thread-sub");
  var threadAvatar = document.getElementById("inbox-thread-avatar");
  var shopLink = document.getElementById("inbox-shop-link");
  var backBtn = document.getElementById("inbox-back-btn");
  var compose = document.getElementById("inbox-compose");
  var inputEl = document.getElementById("inbox-input");
  var charCount = document.getElementById("inbox-char-count");
  var sendBtn = document.getElementById("inbox-send-btn");

  /* ── State ── */
  var currentUser = null;
  var activeChat = null;
  var chatsCache = [];
  var activeTab = "all";
  var searchTerm = "";
  var unsubChats = null;
  var unsubMessages = null;

  /* ── URL params ── */
  var params = new URLSearchParams(location.search);
  var initChatId = params.get("chatId") || "";
  var initShopId = params.get("shopId") || "";
  var initSellerId = params.get("sellerId") || "";
  var initProdId = params.get("productId") || "";

  /* ── Toast ── */
  function toast(msg, type) {
    var tc = document.getElementById("toast-container");
    var el = document.createElement("div");
    el.className = "toast-item " + (type || "");
    el.textContent = msg;
    tc.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3500);
  }
  window.showToast = function (m, t) {
    toast(m, t === "error" ? "danger" : t === "success" ? "success" : "");
  };

  /* ── Helpers ── */
  function goLogin() {
    location.href =
      "login.html?returnUrl=" +
      encodeURIComponent(location.pathname + location.search);
  }
  function avatarLetters(name) {
    return String(name || "?")
      .trim()
      .split(" ")
      .map(function (w) {
        return w[0];
      })
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  function fmt(ts) {
    return window.formatChatTime ? window.formatChatTime(ts) : "";
  }
  function esc(s) {
    return window._aurumMsg
      ? window._aurumMsg.escapeHtml(s)
      : String(s || "")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
  }
  function formatDateLabel(ts) {
    return window._aurumMsg ? window._aurumMsg.formatDateLabel(ts) : "";
  }

  /* ── Render conversation list ── */
  function renderList() {
    var chats = chatsCache.slice();

    /* Tab filter */
    if (activeTab === "buyer") {
      chats = chats.filter(function (c) {
        return c.buyerId === currentUser.uid;
      });
    } else if (activeTab === "seller") {
      chats = chats.filter(function (c) {
        return c.sellerId === currentUser.uid || c.shopId;
      });
    }

    /* Search filter */
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      chats = chats.filter(function (c) {
        return (
          (c.shopName || "").toLowerCase().includes(q) ||
          (c.buyerName || "").toLowerCase().includes(q) ||
          (c.lastMessage || "").toLowerCase().includes(q)
        );
      });
    }

    /* Global unread count */
    var totalUnread = chatsCache.reduce(function (acc, c) {
      var isBuyer = c.buyerId === currentUser.uid;
      return acc + (isBuyer ? c.unreadBuyer || 0 : c.unreadSeller || 0);
    }, 0);
    if (totalUnread > 0) {
      countBadge.textContent = totalUnread > 99 ? "99+" : totalUnread;
      countBadge.classList.add("show");
    } else {
      countBadge.classList.remove("show");
    }

    if (!chats.length) {
      convListEl.innerHTML =
        '<div class="inbox-conv-empty">' +
        "<p>" +
        (searchTerm
          ? 'Aucun résultat pour "' + esc(searchTerm) + '".'
          : "Aucune conversation pour l'instant.") +
        "</p>" +
        (!searchTerm
          ? '<a href="catalogue.html">Explorer la marketplace →</a>'
          : "") +
        "</div>";
      return;
    }

    convListEl.innerHTML = chats
      .map(function (chat) {
        var isBuyer = chat.buyerId === currentUser.uid;
        var partner = isBuyer
          ? chat.shopName || "Boutique"
          : chat.buyerName || "Client";
        var unread = isBuyer ? chat.unreadBuyer || 0 : chat.unreadSeller || 0;
        var preview = chat.lastMessage || "Aucun message encore.";
        if (preview.length > 56) preview = preview.slice(0, 56) + "…";
        var time = fmt(chat.lastMessageAt || chat.updatedAt);
        var isAct = activeChat && activeChat.id === chat.id;

        return (
          '<button class="inbox-conv-item' +
          (isAct ? " active" : "") +
          (unread > 0 ? " has-unread" : "") +
          '" data-cid="' +
          chat.id +
          '" type="button">' +
          '<div class="inbox-conv-avatar">' +
          avatarLetters(partner) +
          (unread > 0
            ? '<span class="unread-pip">' +
              (unread > 9 ? "9+" : unread) +
              "</span>"
            : "") +
          "</div>" +
          '<div class="inbox-conv-body">' +
          '<div class="inbox-conv-top">' +
          '<span class="inbox-conv-name">' +
          esc(partner) +
          "</span>" +
          '<span class="inbox-conv-time">' +
          esc(time) +
          "</span>" +
          "</div>" +
          '<div style="margin-bottom:2px">' +
          '<span class="inbox-conv-role-tag ' +
          (isBuyer ? "buyer" : "seller") +
          '">' +
          (isBuyer ? "Achat" : "Vente") +
          "</span>" +
          '<span style="font-size:11px;color:#4A4540">' +
          esc(isBuyer ? chat.shopName || "" : chat.buyerName || "") +
          "</span>" +
          "</div>" +
          '<p class="inbox-conv-preview">' +
          esc(preview) +
          "</p>" +
          "</div></button>"
        );
      })
      .join("");

    convListEl.querySelectorAll("[data-cid]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chat = chatsCache.find(function (c) {
          return c.id === btn.dataset.cid;
        });
        if (chat) openThread(chat);
      });
    });
  }

  /* ── Open thread ── */
  function openThread(chat) {
    activeChat = chat;

    var isBuyer = chat.buyerId === currentUser.uid;
    var partner = isBuyer
      ? chat.shopName || "Boutique"
      : chat.buyerName || "Client";

    threadAvatar.textContent = avatarLetters(partner);
    threadName.textContent = partner;
    threadSub.textContent = isBuyer
      ? "Boutique Aurum" + (chat.productId ? " · Produit référencé" : "")
      : "Client · " + (chat.buyerEmail || "");

    if (chat.shopId && isBuyer) {
      shopLink.href = "boutique.html?id=" + chat.shopId;
      shopLink.style.display = "";
    } else {
      shopLink.style.display = "none";
    }

    /* Update URL sans rechargement */
    var url = new URL(window.location.href);
    url.searchParams.set("chatId", chat.id);
    history.replaceState({}, "", url.toString());

    /* Mobile: cacher sidebar, montrer thread */
    sidebar.classList.add("mobile-hidden");
    threadPanel.classList.add("mobile-show");

    emptyState.style.display = "none";
    threadInner.style.display = "flex";

    renderList(); /* Rafraîchit le highlight actif */
    listenMessages(chat.id);
    inputEl.focus();
  }

  /* ── Subscribe messages ── */
  function listenMessages(chatId) {
    if (unsubMessages) {
      unsubMessages();
      unsubMessages = null;
    }
    messagesWrap.innerHTML =
      '<div class="inbox-loading"><div class="inbox-spinner"></div></div>';

    unsubMessages = window.subscribeMessages(
      chatId,
      function (msgs) {
        renderMessages(msgs);
      },
      function (err) {
        messagesWrap.innerHTML =
          '<p class="inbox-msg-error">Impossible de charger les messages.</p>';
        console.error("[Inbox] listenMessages:", err);
      },
    );

    /* Marquer comme lu */
    if (window._aurumMsg && window._aurumMsg.markConversationRead) {
      window._aurumMsg.markConversationRead(chatId);
    }
  }

  /* ── Render messages ── */
  function renderMessages(msgs) {
    if (!msgs.length) {
      messagesWrap.innerHTML =
        '<div class="inbox-thread-empty">Envoyez le premier message ci-dessous.</div>';
      return;
    }

    var html = "";
    var lastLabel = "";

    msgs.forEach(function (msg) {
      var isMine = msg.senderId === currentUser.uid;
      var label = formatDateLabel(msg.createdAt);

      if (label && label !== lastLabel) {
        html +=
          '<div class="inbox-date-sep"><span>' + esc(label) + "</span></div>";
        lastLabel = label;
      }

      var time = fmt(msg.createdAt);
      var lock = msg.hasMaskedContent
        ? '<span class="inbox-masked-badge" title="Coordonnées masquées">🔒</span>'
        : "";

      html +=
        '<div class="inbox-bubble-row ' +
        (isMine ? "mine" : "theirs") +
        '">' +
        '<div class="inbox-bubble ' +
        (isMine ? "mine" : "theirs") +
        '">' +
        "<p>" +
        esc(msg.text) +
        "</p>" +
        '<div class="inbox-bubble-meta">' +
        lock +
        "<span>" +
        esc(time) +
        "</span></div>" +
        "</div>" +
        "</div>";
    });

    messagesWrap.innerHTML = html;
    messagesWrap.scrollTop = messagesWrap.scrollHeight;
  }

  /* ── Send ── */
  compose.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!activeChat) {
      toast("Sélectionnez une conversation.", "");
      return;
    }

    var raw = inputEl.value.trim();
    if (!raw) return;

    sendBtn.disabled = true;
    try {
      if (activeChat._stub) {
        /* Nouvelle conv : créer + envoyer */
        var chatId = await window.sendMessage(activeChat.shopId, raw, {
          sellerId: activeChat.sellerId || "",
          shopName: activeChat.shopName || "",
          sellerName: activeChat.sellerName || "",
          productId: activeChat.productId || "",
        });
        activeChat._stub = false;
        activeChat.id = chatId;
        listenMessages(chatId);
      } else {
        await window.sendReply(activeChat.id, raw);
      }
      inputEl.value = "";
      charCount.textContent = "0 / 1200";
      inputEl.style.height = "auto";
      inputEl.focus();
    } catch (err) {
      toast(err.message || "Envoi impossible.", "danger");
    } finally {
      sendBtn.disabled = false;
    }
  });

  /* ── Char counter + auto-grow ── */
  inputEl.addEventListener("input", function () {
    var len = inputEl.value.length;
    charCount.textContent = len + " / 1200";
    if (len > 1100) charCount.style.color = "#D94F4F";
    else charCount.style.color = "";
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
  });

  /* ── Enter = send ── */
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      compose.dispatchEvent(new Event("submit"));
    }
  });

  /* ── Tabs ── */
  document.querySelectorAll(".inbox-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".inbox-tab").forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      renderList();
    });
  });

  /* ── Search ── */
  document
    .getElementById("inbox-search")
    .addEventListener("input", function (e) {
      searchTerm = e.target.value.trim();
      renderList();
    });

  /* ── Back (mobile) ── */
  backBtn.addEventListener("click", function () {
    sidebar.classList.remove("mobile-hidden");
    threadPanel.classList.remove("mobile-show");
    emptyState.style.display = "";
    threadInner.style.display = "none";
    activeChat = null;
    if (unsubMessages) {
      unsubMessages();
      unsubMessages = null;
    }
    renderList();
  });

  /* ── Bootstrap depuis URL params ── */
  async function bootstrapFromUrl() {
    if (!initChatId && !initShopId) return;

    /* 1 — Essayer de trouver dans le cache */
    if (initChatId) {
      var found = chatsCache.find(function (c) {
        return c.id === initChatId;
      });
      if (found) {
        openThread(found);
        return;
      }
    }

    /* 2 — Essayer de charger depuis Firestore */
    if (initChatId) {
      try {
        var snap = await firebase
          .firestore()
          .collection("conversations")
          .doc(initChatId)
          .get();
        if (snap.exists) {
          openThread(Object.assign({ id: snap.id }, snap.data()));
          return;
        }
      } catch (_) {}
    }

    /* 3 — Stub nouvelle conversation */
    if (initShopId) {
      var stub = {
        id: initChatId || window.buildChatId(currentUser.uid, initShopId),
        shopId: initShopId,
        sellerId: initSellerId,
        productId: initProdId,
        shopName: "",
        sellerName: "Vendeur",
        buyerId: currentUser.uid,
        participants: [currentUser.uid, initSellerId || initShopId],
        unreadBuyer: 0,
        unreadSeller: 0,
        _stub: true,
      };
      /* Récupérer le nom de la boutique */
      try {
        var shopSnap = await firebase
          .firestore()
          .collection("shops")
          .doc(initShopId)
          .get();
        if (shopSnap.exists) {
          stub.shopName = shopSnap.data().name || "";
          stub.sellerName = shopSnap.data().ownerName || stub.sellerName;
          stub.sellerId =
            stub.sellerId ||
            shopSnap.data().ownerId ||
            shopSnap.data().ownerUid ||
            "";
        }
      } catch (_) {}
      chatsCache = [stub].concat(
        chatsCache.filter(function (c) {
          return c.id !== stub.id;
        }),
      );
      renderList();
      openThread(stub);
    }
  }

  /* ── Auth listener ── */
  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  ) {
    convListEl.innerHTML =
      '<div class="inbox-conv-empty"><p>Firebase non configuré. Vérifiez config.js.</p></div>';
    return;
  }

  firebase.auth().onAuthStateChanged(async function (user) {
    if (!user) {
      goLogin();
      return;
    }
    currentUser = user;

    if (unsubChats) {
      unsubChats();
      unsubChats = null;
    }

    unsubChats = window.subscribeUserChats(
      currentUser.uid,
      function (chats) {
        chatsCache = chats;
        /* Sync activeChat si mis à jour côté Firestore */
        if (activeChat && !activeChat._stub) {
          var updated = chats.find(function (c) {
            return c.id === activeChat.id;
          });
          if (updated) activeChat = Object.assign({}, activeChat, updated);
        }
        renderList();
      },
      function (err) {
        convListEl.innerHTML =
          '<div class="inbox-conv-empty"><p>Impossible de charger les conversations.<br>' +
          err.message +
          "</p></div>";
      },
    );

    /* Attendre le premier batch onSnapshot avant de bootstrapper */
    setTimeout(bootstrapFromUrl, 450);
  });

  window.addEventListener("beforeunload", function () {
    if (unsubChats) unsubChats();
    if (unsubMessages) unsubMessages();
  });

  /* ── Cursor ── */
  (function () {
    var ring = document.getElementById("cur-ring");
    var dot = document.getElementById("cur-dot");
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
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a,button,input,textarea,.inbox-conv-item"))
        document.body.classList.add("ch");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a,button,input,textarea,.inbox-conv-item"))
        document.body.classList.remove("ch");
    });
  })();
})();

/*product.html script */

/* ── CURSOR SCRIPT ── */
(() => {
  const ring = document.getElementById("pr-ring"),
    dot = document.getElementById("pr-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,[onclick]"))
      document.body.classList.add("pr-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,[onclick]"))
      document.body.classList.remove("pr-h");
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  // Menu Mobile (si nécessaire sur cette page)
  const menuToggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-btn");
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("menu-overlay");

  const toggleMenu = () => {
    if (!drawer || !overlay) return;
    drawer.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.style.overflow = drawer.classList.contains("active")
      ? "hidden"
      : "";
  };

  if (menuToggle) menuToggle.addEventListener("click", toggleMenu);
  if (closeBtn) closeBtn.addEventListener("click", toggleMenu);
  if (overlay) overlay.addEventListener("click", toggleMenu);

  // --- LOGIQUE SPÉCIFIQUE PRIVACY ---
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();

  // Date MAJ automatique
  const dateMaj = document.getElementById("date-maj");
  if (dateMaj) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    dateMaj.innerText = new Date().toLocaleDateString("fr-FR", options);
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
});

/*products.html script */

/* CURSOR */
(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  if (!ring || !dot) return;
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });
  (function r() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(r);
  })();
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,[data-h]"))
      document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,[data-h]"))
      document.body.classList.remove("cur-h");
  });
})();

/* SCROLL */
window.addEventListener("scroll", () => {
  const hd =
    document.getElementById("ax-hd") || document.querySelector("header");
  if (hd) hd.classList.toggle("s", scrollY > 60);
});
const obs = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("on");
    }),
  { threshold: 0.1 },
);
function watchReveal() {
  document.querySelectorAll(".rv").forEach((el) => obs.observe(el));
}

/* UTILS */
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const starH = (r) => "★".repeat(Math.floor(r)) + "☆".repeat(5 - Math.floor(r));
function toast(msg, type = "info") {
  const z = document.getElementById("ax-toasts"),
    el = document.createElement("div");
  el.className = `ax-toast ${type}`;
  el.textContent = msg;
  z.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}
window.showToast = toast;

/* BOOT */
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof firebase === "undefined" || !firebase.apps?.length) {
    showErr("Firebase non disponible");
    return;
  }
  const db = firebase.firestore();
  const pid = (new URLSearchParams(location.search).get("id") || "").trim();
  if (!pid) {
    showErr("Aucun produit spécifié");
    return;
  }
  try {
    const snap = await db.collection("products").doc(pid).get();
    if (!snap.exists) throw new Error("Produit introuvable");
    const product = { id: snap.id, ...snap.data() };
    const shopId = product.shopId || "unknown";
    let shopData = {};
    try {
      if (shopId !== "unknown") {
        const s = await db.collection("shops").doc(shopId).get();
        if (s.exists) shopData = s.data();
      }
    } catch (e) {}
    let reviews = [];
    try {
      const rs = await db
        .collection("reviews")
        .where("productId", "==", pid)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
      rs.forEach((d) => reviews.push({ id: d.id, ...d.data() }));
    } catch (e) {}
    let colors = [],
      sizes = [],
      ts = 0;
    if (Array.isArray(product.variants)) {
      const cs = new Set(),
        ss = new Set();
      product.variants.forEach((v) => {
        if (v.color) cs.add(v.color);
        if (v.size) ss.add(v.size);
        if (v.qty) ts += v.qty;
      });
      colors = [...cs].sort();
      sizes = [...ss].sort();
    }
    if (!colors.length) {
      if (Array.isArray(product.colors)) colors = product.colors;
      else if (typeof product.color === "string")
        colors = product.color
          .split(/[;,|]/)
          .map((c) => c.trim())
          .filter(Boolean);
    }
    if (!sizes.length) {
      if (Array.isArray(product.sizes)) sizes = product.sizes;
      else if (typeof product.size === "string")
        sizes = product.size
          .split(/[;,|]/)
          .map((s) => s.trim())
          .filter(Boolean);
    }
    product.colors = colors;
    product.sizes = sizes;
    if (!product.stock) product.stock = ts || product.specs?.stockLevel || 15;
    window.currentProduct = product;
    window.currentShopId = shopId;
    window.currentImages = Array.isArray(product.images)
      ? product.images
      : [product.image || "assets/img/placeholder-product-1.svg"];
    render(product, shopId, shopData, reviews);
  } catch (err) {
    console.error(err);
    showErr(err.message);
  }
});

function showErr(m) {
  document.getElementById("ax-root").innerHTML =
    `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:40px;text-align:center"><p style="font-family:'Instrument Serif',serif;font-size:88px;color:rgba(200,168,75,.1);line-height:1">!</p><h2 style="font-family:'Instrument Serif',serif;font-size:30px;font-weight:400;color:rgba(254,252,248,.55)">${m}</h2><a href="catalogue.html" style="margin-top:10px;padding:13px 30px;border:1px solid rgba(200,168,75,.28);color:var(--gold);text-decoration:none;font-size:9px;letter-spacing:.22em;text-transform:uppercase;font-family:'Unbounded',sans-serif;font-weight:800">← Catalogue</a></div>`;
}

function render(product, shopId, shopData, reviews) {
  const imgs = window.currentImages;
  const hd = product.originalPrice && product.originalPrice > product.price;
  const disc = hd
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;
  const avg = reviews.length
    ? (
        reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      ).toFixed(1)
    : product.rating || 0;
  const stk = product.stock;
  const sc = stk > 10 ? "ok" : stk > 0 ? "low" : "out";
  const smsg =
    stk > 10
      ? `En stock — ${stk} disponibles`
      : stk > 0
        ? `Stock limité — ${stk} restants`
        : "Rupture de stock";
  const scol =
    sc === "ok" ? "var(--ok)" : sc === "low" ? "var(--warn)" : "var(--danger)";

  const mqData = [
    product.category && { k: "Catégorie", v: product.category },
    { k: "Stock", v: stk + " unités" },
    (product.vehicleBrand ||
      product.techBrand ||
      product.beautyBrand ||
      product.btpBrand) && {
      k: "Marque",
      v:
        product.vehicleBrand ||
        product.techBrand ||
        product.beautyBrand ||
        product.btpBrand,
    },
    product.vehicleYear && { k: "Année", v: product.vehicleYear },
    product.vehicleFuel && { k: "Carburant", v: product.vehicleFuel },
    product.vehicleMileage !== undefined && {
      k: "Kilométrage",
      v: fmt(product.vehicleMileage) + " km",
    },
    product.colors?.length && { k: "Couleurs", v: product.colors.length },
    product.sizes?.length && { k: "Tailles", v: product.sizes.join(" / ") },
    (product.sku || product.id) && { k: "Réf", v: product.sku || product.id },
  ].filter(Boolean);

  const mqHTML = [...mqData, ...mqData]
    .map((i) => `<div class="ax-mqi">${i.k} <strong>${i.v}</strong></div>`)
    .join("");
  const dspecs = mqData
    .map(
      (i) =>
        `<div class="ax-dsrow"><span class="ax-dsk">${i.k}</span><span class="ax-dsv">${i.v}</span></div>`,
    )
    .join("");

  document.getElementById("ax-root").innerHTML = `
  <section class="ax-hero">
    <div class="ax-gal" id="ax-gal">
      ${hd ? `<div class="ax-disc-flag">−${disc}%</div>` : ""}
      <img src="${imgs[0]}" alt="${product.name}" class="ax-gal-img" id="ax-main-img"
           onerror="this.src='assets/img/placeholder-product-1.svg'"
           onload="document.getElementById('ax-gal').classList.add('ld')">
      ${imgs.length > 1 ? `<div class="ax-thumbs">${imgs.map((img, i) => `<div class="ax-t ${i === 0 ? "on" : ""}" onclick="axImg(${i})"><img src="${img}" onerror="this.src='assets/img/placeholder-product-1.svg'"></div>`).join("")}</div>` : ""}
      <div class="ax-gal-num"><strong>${String(1).padStart(2, "0")}</strong>/ ${String(imgs.length).padStart(2, "0")}</div>
    </div>

    <div class="ax-info">
      <p class="ax-eyebrow rv">${product.category || "Collection Premium"}</p>
      <h1 class="ax-pname rv rv1">${product.name}</h1>
      <div class="ax-rrow rv rv2">
        <span class="ax-stars">${starH(avg)}</span>
        <span class="ax-rmeta">${avg}/5 &nbsp;·&nbsp; <a href="#ax-tabs">${reviews.length} avis</a></span>
      </div>
      <div class="ax-pblock rv rv2">
        <p class="ax-plabel">Prix</p>
        <div class="ax-pprice">${fmt(product.price)}<small>FCFA</small></div>
        ${hd ? `<div class="ax-pstrike">${fmt(product.originalPrice)} FCFA <span class="ax-save">−${disc}%</span></div>` : ""}
      </div>

      ${product.colors?.length ? `<div class="rv rv3"><p class="ax-varlabel">Couleur</p><div class="ax-colors">${product.colors.map((c, i) => `<div class="ax-csw ${i === 0 ? "on" : ""}" style="background:${c}" data-vt="color" data-val="${c}" title="${c}" onclick="axVar('color','${c}',this)" data-h></div>`).join("")}</div></div>` : ""}
      ${product.sizes?.length ? `<div class="rv rv3"><p class="ax-varlabel">Taille</p><div class="ax-sizes">${product.sizes.map((s, i) => `<button class="ax-spill ${i === 0 ? "on" : ""}" data-vt="size" data-val="${s}" onclick="axVar('size','${s}',this)">${s}</button>`).join("")}</div></div>` : ""}

      <div class="ax-sline rv rv3">
        <div class="ax-sdot ${sc}"></div>
        <span style="color:${scol}">${smsg}</span>
      </div>

      <div class="ax-ctarow rv rv4">
        <div class="ax-qty">
          <button class="ax-qbtn" onclick="axQty(-1)">−</button>
          <input type="number" class="ax-qnum" id="ax-qty" value="1" min="1" max="${stk || 999}">
          <button class="ax-qbtn" onclick="axQty(1)">+</button>
        </div>
        <button class="ax-bcart" onclick="axCart()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>Ajouter au panier</span>
        </button>
        <button class="ax-bwish" id="ax-wish" onclick="axWish()">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      <div class="ax-seller rv">
        <div class="ax-sava">${shopData.logo ? `<img src="${shopData.logo}" alt="">` : (shopData.name || "B").charAt(0).toUpperCase()}</div>
        <div>
          <div class="ax-sname">Vendu par ${shopData.name || "Boutique Aurum"}</div>
          <div class="ax-ssub">
            <span style="color:var(--gold)">${starH(shopData.rating || 0)}</span>
            <span>📍 ${shopData.city || shopData.address || "Ouagadougou"}</span>
            <span>🚚 Livraison 48–72h</span>
          </div>
        </div>
        <button class="ax-bvisit" onclick="location.href='boutique.html?id=${shopId}'">Voir la boutique →</button>
        <button class="ax-bvisit" style="margin-top:6px;border-color:rgba(200,168,75,.1);color:rgba(200,168,75,.7)" onclick="axContactSeller()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:6px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Contacter le vendeur
        </button>
      </div>

      <div class="ax-trust rv">
        <div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Paiement sécurisé</div>
        <div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg> Retour 7 jours</div>
        <div class="ax-titem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> Support client</div>
      </div>
    </div>
  </section>

  <div class="ax-mq"><div class="ax-mqt">${mqHTML}</div></div>

  <section class="ax-tabs" id="ax-tabs">
    <div class="ax-ti">
      <div class="ax-tnav rv">
        <button class="ax-tbtn on" onclick="axTab('desc',this)">Description</button>
        <button class="ax-tbtn" onclick="axTab('rev',this)">Avis clients (${reviews.length})</button>
      </div>
      <div class="ax-tpanel on" id="ax-p-desc">
        <div class="ax-desc-grid rv">
          <p class="ax-dtxt">${product.description ? product.description.replace(/\n/g, "<br>") : '<em style="opacity:.4">Aucune description disponible.</em>'}</p>
          ${dspecs ? `<div class="ax-dspecs">${dspecs}</div>` : ""}
        </div>
      </div>
      <div class="ax-tpanel" id="ax-p-rev">
        <div class="ax-rl">
          <div class="ax-rs rv">
            <div class="ax-avghuge">${avg}</div>
            <div class="ax-avgstars">${starH(avg)}</div>
            <div class="ax-avgcnt">${reviews.length} avis vérifiés</div>
          </div>
          <div class="rv rv1">
            <div class="ax-rform">
              <h3 class="ax-rftitle">Partagez votre expérience</h3>
              <div class="ax-authwarn" id="ax-authwarn">⚠ Vous devez être <a href="login.html">connecté</a> pour laisser un avis.</div>
              <div class="ax-rffield"><label class="ax-rflabel">Votre nom</label><input type="text" id="ax-rname" class="ax-rfinput" placeholder="Votre nom complet"></div>
              <div class="ax-rffield"><label class="ax-rflabel">Note</label>
                <div class="ax-spick" id="ax-spick">
                  <span onmouseover="axHS(1)" onclick="axSS(1)">★</span>
                  <span onmouseover="axHS(2)" onclick="axSS(2)">★</span>
                  <span onmouseover="axHS(3)" onclick="axSS(3)">★</span>
                  <span onmouseover="axHS(4)" onclick="axSS(4)">★</span>
                  <span onmouseover="axHS(5)" onclick="axSS(5)">★</span>
                </div>
                <input type="hidden" id="ax-rrating" value="5">
              </div>
              <div class="ax-rffield"><label class="ax-rflabel">Votre avis</label><textarea id="ax-rcomment" class="ax-rfarea" placeholder="Décrivez votre expérience…"></textarea></div>
              <button class="ax-rfsubmit" onclick="axReview(event)"><span>Soumettre mon avis</span></button>
            </div>
            ${
              reviews.length > 0
                ? reviews
                    .map(
                      (r) => `
              <div class="ax-rcard">
                <div class="ax-rchead">
                  <div class="ax-rcwho">
                    <div class="ax-rcava">${(r.userName || "A").charAt(0).toUpperCase()}</div>
                    <div><div class="ax-rcname">${r.userName || "Anonyme"}</div><div class="ax-rcdate">${r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("fr-FR") : ""}</div></div>
                  </div>
                  <div class="ax-rcstars">${starH(r.rating || 5)}</div>
                </div>
                <p class="ax-rctxt">${r.comment || ""}</p>
              </div>`,
                    )
                    .join("")
                : `<div class="ax-norev"><div class="ax-nrevbig">✦</div><p class="ax-nrevp">Soyez le premier à partager votre expérience.</p></div>`
            }
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="ax-rel">
    <div class="ax-relhead rv">
      <h2 class="ax-sectitle">Vous aimerez<br><em>aussi</em></h2>
      <a href="catalogue.html${product.category ? `?category=${encodeURIComponent(product.category)}` : ""}" class="ax-seeall">Voir tout →</a>
    </div>
    <div class="ax-relgrid" id="ax-relgrid">
      ${[1, 2, 3, 4].map(() => `<div class="ax-rcard2"><div class="ax-rimgbox ax-sk" style="height:290px"></div><div class="ax-rbody"><div class="ax-sk" style="height:9px;width:48%;margin-bottom:10px"></div><div class="ax-sk" style="height:19px;width:72%;margin-bottom:12px"></div><div class="ax-sk" style="height:15px;width:34%"></div></div></div>`).join("")}
    </div>
  </section>
  `;

  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged((u) => {
      const w = document.getElementById("ax-authwarn");
      if (w) w.style.display = u ? "none" : "block";
    });
  }
  window.currentShopData = shopData || {};
  watchReveal();
  loadRelated(product, shopId);
}

/* INTERACTIONS */
window.axImg = (idx) => {
  const m = document.getElementById("ax-main-img"),
    n = document.querySelector(".ax-gal-num");
  if (m) m.src = window.currentImages[idx];
  if (n)
    n.innerHTML = `<strong>${String(idx + 1).padStart(2, "0")}</strong>/ ${String(window.currentImages.length).padStart(2, "0")}`;
  document
    .querySelectorAll(".ax-t")
    .forEach((t, i) => t.classList.toggle("on", i === idx));
};
window.axVar = (type, val, el) => {
  el.parentElement
    .querySelectorAll(`[data-vt="${type}"]`)
    .forEach((s) => s.classList.remove("on"));
  el.classList.add("on");
};
window.axQty = (d) => {
  const i = document.getElementById("ax-qty");
  if (i)
    i.value = Math.max(
      1,
      Math.min(parseInt(i.value || 1) + d, parseInt(i.max) || 999),
    );
};
window.axCart = () => {
  try {
    if (!window.currentProduct) {
      toast("Produit indisponible", "error");
      return;
    }
    const qty = Math.max(
      1,
      parseInt(document.getElementById("ax-qty")?.value) || 1,
    );
    const p = window.currentProduct;
    if (typeof addToCart === "function") {
      addToCart(
        typeof safeProductId === "function"
          ? safeProductId(p.id)
          : String(p.id || "").trim(),
        qty,
        p,
      );
    } else {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (!Array.isArray(cart)) cart = [];
      } catch (_) {
        cart = [];
      }
      const color = document.querySelector('[data-vt="color"].on')?.dataset.val;
      const size = document.querySelector('[data-vt="size"].on')?.dataset.val;
      const vars = {};
      if (color) vars.color = color;
      if (size) vars.size = size;
      const item = {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image || window.currentImages?.[0],
        quantity: qty,
        shopId: window.currentShopId,
        variants: vars,
      };
      const ei = cart.findIndex(
        (c) =>
          c.id === item.id &&
          JSON.stringify(c.variants) === JSON.stringify(item.variants),
      );
      if (ei > -1) cart[ei].quantity += qty;
      else cart.push(item);
      localStorage.setItem("cart", JSON.stringify(cart));
      if (typeof updateCartBadge === "function") updateCartBadge();
    }
    toast("✓ Ajouté au panier", "success");
  } catch (err) {
    console.error("axCart error:", err);
    toast("Impossible d'ajouter au panier", "error");
  }
};
window.axWish = () => {
  const b = document.getElementById("ax-wish");
  b.classList.toggle("on");
  toast(
    b.classList.contains("on")
      ? "♥ Ajouté aux favoris"
      : "♡ Retiré des favoris",
  );
};
window.axTab = (n, btn) => {
  document
    .querySelectorAll(".ax-tbtn")
    .forEach((b) => b.classList.remove("on"));
  document
    .querySelectorAll(".ax-tpanel")
    .forEach((p) => p.classList.remove("on"));
  btn.classList.add("on");
  document.getElementById(`ax-p-${n}`)?.classList.add("on");
};
window.axHS = (r) => {
  document
    .querySelectorAll("#ax-spick span")
    .forEach(
      (s, i) => (s.style.color = i < r ? "var(--gold)" : "rgba(11,10,8,.18)"),
    );
};
window.axSS = (r) => {
  document.getElementById("ax-rrating").value = r;
  axHS(r);
};
window.axReview = async (e) => {
  const btn = e.target.closest("button");
  const name = document.getElementById("ax-rname")?.value.trim();
  const rating = parseInt(document.getElementById("ax-rrating")?.value) || 5;
  const comment = document.getElementById("ax-rcomment")?.value.trim();
  if (!name) {
    toast("⚠ Entrez votre nom", "error");
    return;
  }
  if (!comment) {
    toast("⚠ Entrez votre avis", "error");
    return;
  }
  const user = firebase.auth().currentUser;
  if (!user) {
    toast("⚠ Connexion requise", "error");
    return;
  }
  try {
    btn.disabled = true;
    btn.querySelector("span").textContent = "Publication…";
    await firebase
      .firestore()
      .collection("reviews")
      .add({
        userId: user.uid,
        userName: name,
        productId: window.currentProduct.id,
        shopId: window.currentShopId || "",
        rating,
        comment,
        createdAt: firebase.firestore.Timestamp.now(),
      });
    toast("✓ Avis publié !", "success");
    document.getElementById("ax-rname").value = "";
    document.getElementById("ax-rcomment").value = "";
    axSS(5);
    setTimeout(() => location.reload(), 2000);
  } catch (err) {
    toast(`❌ ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.querySelector("span").textContent = "Soumettre mon avis";
  }
};

window.axContactSeller = async () => {
  if (typeof window.initChatModalBindings === "function")
    window.initChatModalBindings();
  if (typeof window.openSellerChat !== "function") {
    toast("Messagerie indisponible pour le moment.", "error");
    return;
  }
  try {
    const shop = window.currentShopData || {};
    const p = window.currentProduct || {};
    await window.openSellerChat({
      shopId: window.currentShopId || p.shopId || p.shop || "",
      sellerId:
        shop.ownerId ||
        shop.sellerId ||
        p.sellerId ||
        p.ownerId ||
        p.ownerUid ||
        p.userId ||
        "",
      shopName: shop.name || "Boutique",
      sellerName: shop.ownerName || shop.sellerName || shop.name || "Vendeur",
      productId: p.id || "",
    });
  } catch (err) {
    toast(err.message || "Impossible d'ouvrir la conversation.", "error");
  }
};

async function loadRelated(product, shopId) {
  const grid = document.getElementById("ax-relgrid");
  if (!grid) return;
  try {
    const db = firebase.firestore();
    let q = db.collection("products").limit(9);
    if (product.category)
      q = db
        .collection("products")
        .where("category", "==", product.category)
        .limit(9);
    const snap = await q.get();
    let items = [];
    snap.forEach((d) => {
      if (d.id !== product.id) items.push({ id: d.id, ...d.data() });
    });
    if (items.length < 2 && shopId && shopId !== "unknown") {
      const ss = await db
        .collection("products")
        .where("shopId", "==", shopId)
        .limit(6)
        .get();
      ss.forEach((d) => {
        if (d.id !== product.id && !items.find((r) => r.id === d.id))
          items.push({ id: d.id, ...d.data() });
      });
    }
    items = items.sort(() => Math.random() - 0.5).slice(0, 4);
    if (!items.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--smoke);font-size:11px;letter-spacing:.12em">Aucun produit similaire trouvé</div>`;
      return;
    }
    grid.innerHTML = items
      .map((p) => {
        const img =
          (Array.isArray(p.images) ? p.images[0] : null) ||
          p.image ||
          "assets/img/placeholder-product-1.svg";
        const hd = p.originalPrice && p.originalPrice > p.price;
        const d = hd
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : 0;
        return `<div class="ax-rcard2 rv" onclick="location.href='product.html?id=${p.id}'" data-h>
        <div class="ax-rimgbox">
          ${hd ? `<div class="ax-rdisc">−${d}%</div>` : ""}
          <img src="${img}" alt="${p.name}" onerror="this.src='assets/img/placeholder-product-1.svg'">
          <div class="ax-roverlay"><button class="ax-rquick" onclick="event.stopPropagation();axQuick('${p.id}')">+ Ajouter au panier</button></div>
        </div>
        <div class="ax-rbody">
          <p class="ax-rcat">${p.category || "Produit"}</p>
          <p class="ax-rname">${p.name}</p>
          <div class="ax-rfoot">
            <span class="ax-rprice">${fmt(p.price)} <small>FCFA</small></span>
            <span class="ax-rstars">${starH(p.rating || 0)}</span>
          </div>
        </div>
      </div>`;
      })
      .join("");
    watchReveal();
  } catch (err) {
    console.warn(err);
  }
}

window.axQuick = async (pid) => {
  try {
    const snap = await firebase
      .firestore()
      .collection("products")
      .doc(pid)
      .get();
    if (!snap.exists) {
      toast("Produit introuvable", "error");
      return;
    }
    const p = { id: snap.id, ...snap.data() };
    if (typeof addToCart === "function") addToCart(String(p.id), 1, p);
    else {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const ei = cart.findIndex((c) => c.id === p.id);
      if (ei > -1) cart[ei].quantity += 1;
      else
        cart.push({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: 1,
          shopId: p.shopId,
          variants: {},
        });
      localStorage.setItem("cart", JSON.stringify(cart));
      if (typeof updateCartBadge === "function") updateCartBadge();
    }
    toast(`✓ ${p.name} ajouté`, "success");
  } catch (e) {
    toast("Erreur", "error");
  }
};

/* profile.html script */

/* ── CURSOR ── */
(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  const sel =
    "a,button,input,select,textarea,.pr-order-item,.pr-addr-card,.pr-msg-item";
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(sel)) document.body.classList.add("cur-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(sel)) document.body.classList.remove("cur-h");
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") lucide.createIcons();

  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  const DEFAULT_RETENTION = 30;

  /* ─── TOAST ─── */
  function prToast(msg, type = "ok") {
    const el = document.createElement("div");
    el.className =
      "pr-toast " + (type === "ok" ? "ok" : type === "err" ? "err" : "");
    el.textContent = msg;
    document.getElementById("pr-toasts").appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }
  window.showToast = (m, t) =>
    prToast(m, t === "success" ? "ok" : t === "error" ? "err" : "ok");

  /* ─── TABS ─── */
  function switchTab(name) {
    document
      .querySelectorAll(".pr-tab")
      .forEach((t) => t.classList.remove("on"));
    document
      .querySelectorAll(".pr-aside-btn[data-tab]")
      .forEach((b) => b.classList.remove("on"));
    const tab = document.getElementById("tab-" + name);
    if (tab) tab.classList.add("on");
    const btn = document.querySelector(`.pr-aside-btn[data-tab="${name}"]`);
    if (btn) btn.classList.add("on");
    if (name === "messages" && auth.currentUser)
      initMessages(auth.currentUser.uid);
  }
  document.querySelectorAll(".pr-aside-btn[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  /* ─── AUTH GUARD ─── */
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    await loadProfile(user);
    await loadOrders(user.uid);
    await loadAddresses(user.uid);
    setupPhotoUpload(user);
    initRetention(user.uid);
    if (typeof lucide !== "undefined") lucide.createIcons();
  });

  /* ─── PROFIL ─── */
  async function loadProfile(user) {
    try {
      const shopSnap = await db
        .collection("shops")
        .where("ownerEmail", "==", user.email)
        .get();
      const role = shopSnap.empty ? "Client" : "Vendeur";

      const docRef = db.collection("users").doc(user.uid);
      const doc = await docRef.get();
      let data = {
        name: user.displayName || "",
        email: user.email,
        role: role.toLowerCase(),
      };
      if (doc.exists) data = { ...data, ...doc.data() };
      else
        await docRef.set({ ...data, createdAt: new Date() }, { merge: true });

      const name = data.name || "Utilisateur";
      const initials =
        name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "AU";

      // Hero
      document.getElementById("pr-hero-name").innerHTML =
        `${name.split(" ")[0] || "Bon"}<br><em>${name.split(" ").slice(1).join(" ") || "retour"}</em>`;
      document.getElementById("pr-hero-role").textContent = role;
      document.getElementById("pr-hero-email").textContent = user.email;
      document.getElementById("pr-wm").textContent = initials;
      document.getElementById("pr-initials").textContent = initials;

      // Form
      document.getElementById("pr-name").value = name;
      document.getElementById("pr-email").value = user.email;
      document.getElementById("pr-role-input").value = role;

      // Photo
      if (user.photoURL) {
        const img = document.getElementById("pr-avatar-img");
        img.src = user.photoURL;
        img.style.display = "block";
        document.getElementById("pr-initials").style.display = "none";
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById("pr-save-btn").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    const newName = document.getElementById("pr-name").value.trim();
    if (!newName) {
      prToast("Le nom ne peut pas être vide.", "err");
      return;
    }
    const btn = document.getElementById("pr-save-btn");
    btn.querySelector("span").textContent = "Enregistrement…";
    btn.disabled = true;
    try {
      await user.updateProfile({ displayName: newName });
      await db.collection("users").doc(user.uid).update({ name: newName });
      document.getElementById("pr-hero-name").innerHTML =
        `${newName.split(" ")[0] || "Bon"}<br><em>${newName.split(" ").slice(1).join(" ") || "retour"}</em>`;
      document.getElementById("pr-wm").textContent = newName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      prToast("Profil mis à jour !", "ok");
    } catch (e) {
      prToast("Erreur de mise à jour.", "err");
    } finally {
      btn.querySelector("span").textContent = "Enregistrer les modifications";
      btn.disabled = false;
    }
  });

  /* ─── PHOTO ─── */
  function setupPhotoUpload(user) {
    document.getElementById("pr-upload-btn").addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("pr-file-input").click();
    });
    document
      .getElementById("pr-file-input")
      .addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          prToast("Format non supporté.", "err");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          prToast("Image trop lourde (max 2 Mo).", "err");
          return;
        }
        const btn = document.getElementById("pr-upload-btn");
        btn.style.opacity = ".4";
        btn.style.pointerEvents = "none";
        try {
          const ref = storage.ref(`users/${user.uid}/profile.jpg`);
          const snap = await ref.put(file);
          const url = await snap.ref.getDownloadURL();
          await user.updateProfile({ photoURL: url });
          await db.collection("users").doc(user.uid).update({ photoURL: url });
          const img = document.getElementById("pr-avatar-img");
          img.src = url;
          img.style.display = "block";
          document.getElementById("pr-initials").style.display = "none";
          prToast("Photo mise à jour !", "ok");
        } catch (err) {
          prToast("Erreur upload.", "err");
        } finally {
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
          e.target.value = "";
        }
      });
  }

  /* ─── DÉCONNEXION ─── */
  document
    .getElementById("pr-logout-btn")
    .addEventListener("click", async () => {
      if (confirm("Se déconnecter ?")) {
        await auth.signOut();
        window.location.href = "login.html";
      }
    });

  /* ─── ORDERS ─── */
  function getRetention() {
    const v = Number(localStorage.getItem("ac_order_retention_days"));
    return Number.isFinite(v) && v >= 1 ? v : DEFAULT_RETENTION;
  }
  function initRetention(uid) {
    const inp = document.getElementById("pr-retention-input");
    inp.value = getRetention();
    inp.addEventListener("change", async () => {
      const val = Math.max(
        7,
        Math.min(180, Number(inp.value) || DEFAULT_RETENTION),
      );
      localStorage.setItem("ac_order_retention_days", String(val));
      inp.value = val;
      await loadOrders(uid);
    });
  }
  async function purgeOrders(uid, days) {
    try {
      const cutoff = new Date(Date.now() - days * 864e5);
      const snap = await db
        .collection("orders")
        .where("userId", "==", uid)
        .get();
      for (const doc of snap.docs) {
        const o = doc.data(),
          st = (o.status || "").toLowerCase();
        if (!["delivered", "cancelled"].some((s) => st.includes(s[0])))
          continue;
        const d =
          o.updatedAt?.toDate?.() ?? o.createdAt?.toDate?.() ?? new Date(0);
        if (d < cutoff) await db.collection("orders").doc(doc.id).delete();
      }
    } catch (e) {}
  }
  async function loadOrders(uid) {
    try {
      await purgeOrders(uid, getRetention());
      let snap;
      try {
        snap = await db
          .collection("orders")
          .where("userId", "==", uid)
          .orderBy("createdAt", "desc")
          .get();
      } catch {
        snap = await db.collection("orders").where("userId", "==", uid).get();
      }

      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
      const wishlist = JSON.parse(
        localStorage.getItem("ac_wishlist") || "[]",
      ).length;

      document.getElementById("pr-stat-orders").textContent = orders.length;
      document.getElementById("pr-stat-spent").textContent =
        new Intl.NumberFormat("fr-FR").format(totalSpent) + " FCFA";
      document.getElementById("pr-stat-wishlist").textContent = wishlist;

      renderOrders(orders);
    } catch (e) {
      console.error(e);
    }
  }

  function statusBadge(status) {
    const s = (status || "pending").toLowerCase();
    if (s.includes("livr") || s === "delivered")
      return { label: "Livré", cls: "st-done" };
    if (s.includes("annul") || s === "cancelled")
      return { label: "Annulé", cls: "st-cancel" };
    if (s.includes("expéd") || s === "shipped")
      return { label: "Expédié", cls: "st-ship" };
    if (s.includes("prép") || s.includes("seller"))
      return { label: "En préparation", cls: "st-prep" };
    return { label: "En attente", cls: "st-wait" };
  }

  function renderOrders(orders) {
    const c = document.getElementById("pr-orders-list");
    if (!orders.length) {
      c.innerHTML = `<div class="pr-empty">
        <div class="pr-empty-icon">∅</div>
        <p>Aucune commande pour le moment</p>
        <a href="catalogue.html">Découvrir le catalogue →</a>
      </div>`;
      if (lucide) lucide.createIcons();
      return;
    }
    c.innerHTML = orders
      .map((o) => {
        const date = o.createdAt?.toDate
          ? o.createdAt
              .toDate()
              .toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
          : "—";
        const total = new Intl.NumberFormat("fr-FR").format(o.total || 0);
        const { label, cls } = statusBadge(o.status);
        const items = o.items?.length || 0;
        return `<div class="pr-order-item">
        <div>
          <div class="pr-order-id">#${o.id.slice(0, 8).toUpperCase()}</div>
          <div class="pr-order-title">${items} article${items > 1 ? "s" : ""}</div>
          <div class="pr-order-meta">${date}</div>
        </div>
        <div class="pr-order-right">
          <div class="pr-order-price">${total} FCFA</div>
          <span class="pr-badge-status ${cls}">${label}</span>
        </div>
      </div>`;
      })
      .join("");
  }

  /* ─── ADRESSES ─── */
  async function loadAddresses(uid) {
    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("addresses")
      .get();
    const c = document.getElementById("pr-addr-list");
    if (snap.empty) {
      c.innerHTML = `<div class="pr-empty" style="grid-column:1/-1">
        <div class="pr-empty-icon">⌂</div>
        <p>Aucune adresse enregistrée</p>
      </div>`;
      if (lucide) lucide.createIcons();
      return;
    }
    c.innerHTML = snap.docs
      .map((doc) => {
        const a = doc.data();
        return `<div class="pr-addr-card">
        <button class="pr-addr-del" onclick="prDeleteAddr('${doc.id}')"><i data-lucide="trash-2"></i></button>
        <div class="pr-addr-tag">Adresse</div>
        <div class="pr-addr-name">${a.name}</div>
        <div class="pr-addr-detail"><i data-lucide="phone"></i> ${a.phone}</div>
        <div class="pr-addr-detail"><i data-lucide="map-pin"></i> ${a.city}</div>
        <div class="pr-addr-detail"><i data-lucide="navigation"></i> ${a.description || a.desc || ""}</div>
      </div>`;
      })
      .join("");
    if (lucide) lucide.createIcons();
  }

  window.prDeleteAddr = async (id) => {
    if (!confirm("Supprimer cette adresse ?")) return;
    await db
      .collection("users")
      .doc(auth.currentUser.uid)
      .collection("addresses")
      .doc(id)
      .delete();
    loadAddresses(auth.currentUser.uid);
    prToast("Adresse supprimée.", "ok");
  };

  // Modal adresse
  const modal = document.getElementById("pr-addr-modal");
  document
    .getElementById("pr-add-addr-btn")
    .addEventListener("click", () => modal.classList.add("on"));
  document
    .getElementById("pr-modal-close")
    .addEventListener("click", () => modal.classList.remove("on"));
  document
    .getElementById("pr-modal-cancel")
    .addEventListener("click", () => modal.classList.remove("on"));

  document
    .getElementById("pr-addr-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;
      const btn = e.target.querySelector("[type=submit]");
      btn.querySelector("span").textContent = "Sauvegarde…";
      btn.disabled = true;
      try {
        await db
          .collection("users")
          .doc(user.uid)
          .collection("addresses")
          .add({
            name: document.getElementById("addr-name").value.trim(),
            phone: document.getElementById("addr-phone").value.trim(),
            city: document.getElementById("addr-city").value,
            description: document.getElementById("addr-desc").value.trim(),
            createdAt: new Date(),
          });
        modal.classList.remove("on");
        e.target.reset();
        loadAddresses(user.uid);
        prToast("Adresse ajoutée !", "ok");
      } catch (err) {
        prToast("Erreur d'ajout.", "err");
      } finally {
        btn.querySelector("span").textContent = "Enregistrer";
        btn.disabled = false;
      }
    });

  /* ─── MESSAGES ─── */
  function initMessages(uid) {
    if (typeof window.subscribeUserChats !== "function") return;
    window.subscribeUserChats(
      uid,
      (chats) => {
        const badge = document.getElementById("pr-msg-badge");
        if (badge) {
          badge.textContent = chats.length;
          badge.style.display = chats.length ? "inline" : "none";
        }
        const c = document.getElementById("pr-msg-list");
        if (!chats.length) {
          c.innerHTML = `<div class="pr-empty">
          <div class="pr-empty-icon">✉</div>
          <p>Aucun message</p>
        </div>`;
          if (lucide) lucide.createIcons();
          return;
        }
        c.innerHTML = chats
          .map((ch) => {
            const isBuyer = ch.buyerId === uid;
            const partner = isBuyer
              ? ch.shopName || "Vendeur"
              : ch.buyerName || "Client";
            const init = partner.slice(0, 2).toUpperCase();
            return `<a href="messages.html?chatId=${ch.id}" class="pr-msg-item">
          <div class="pr-msg-av">${init}</div>
          <div class="pr-msg-body">
            <div class="pr-msg-shop">${partner}</div>
            <div class="pr-msg-last">${ch.lastMessage || "…"}</div>
          </div>
          <div class="pr-msg-arrow"><i data-lucide="arrow-right"></i></div>
        </a>`;
          })
          .join("");
        if (lucide) lucide.createIcons();
      },
      (err) => console.warn(err),
    );
  }
});

/* register.html script */

/* ── CURSOR SCRIPT ── */
(() => {
  const ring = document.getElementById("rg-ring"),
    dot = document.getElementById("rg-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,input,[onclick]"))
      document.body.classList.add("rg-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,input,[onclick]"))
      document.body.classList.remove("rg-h");
  });
})();

// === PAGE REGISTER - LOGIQUE SPÉCIFIQUE ===
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();

  const auth = firebase.auth();
  const db = firebase.firestore();
  const btn = document.getElementById("btn-register");
  const errorDiv = document.getElementById("error-message");

  function showError(msg) {
    errorDiv.innerText = msg;
    if (typeof window.showToast === "function") {
      window.showToast(msg, "error");
    }
  }

  if (btn) {
    btn.addEventListener("click", function () {
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const pass = document.getElementById("reg-pass").value;
      const passConfirm = document.getElementById("reg-pass-confirm").value;

      errorDiv.innerText = "";

      if (!name || !email || !pass) {
        showError("Veuillez remplir tous les champs.");
        return;
      }
      if (pass !== passConfirm) {
        showError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (pass.length < 6) {
        showError("Le mot de passe doit faire au moins 6 caractères.");
        return;
      }

      const originalText = btn.innerHTML;
      btn.innerHTML = "<span>Création en cours...</span>";
      btn.disabled = true;

      window.auth
        .createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
          const user = userCredential.user;

          return user
            .updateProfile({
              displayName: name,
            })
            .then(() => {
              // Créer le document dans la collection users
              return db.collection("users").doc(user.uid).set({
                name: name,
                email: email,
                role: "client",
                createdAt: new Date(),
              });
            })
            .then(() => {
              const finishRedirect = () => {
                if (typeof window.showToast === "function") {
                  window.showToast("Compte créé avec succès !", "success");
                }
                // Redirection vers le catalogue après 1 seconde pour laisser le toast s'afficher
                setTimeout(() => {
                  window.location.href = "index.html";
                }, 1000);
              };

              if (typeof window.syncCurrentUser === "function") {
                return window
                  .syncCurrentUser(user)
                  .then(finishRedirect)
                  .catch(finishRedirect);
              }
              finishRedirect();
              return null;
            });
        })
        .catch((error) => {
          console.error(error);
          let msg = "Erreur lors de la création.";
          if (error.code === "auth/email-already-in-use")
            msg = "Cet email est déjà associé à un compte.";
          if (error.code === "auth/invalid-email")
            msg = "Format d'email invalide.";
          if (error.code === "auth/weak-password")
            msg = "Mot de passe trop faible.";

          showError(msg);

          btn.innerHTML = originalText;
          btn.disabled = false;
        });
    });
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
});

/* seller-application.html script */

(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,input,select,textarea,.sa-upload,.sa-ck"))
      document.body.classList.add("ch");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,input,select,textarea,.sa-upload,.sa-ck"))
      document.body.classList.remove("ch");
  });
})();
(() => {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("on");
      }),
    { threshold: 0.1 },
  );
  document.querySelectorAll(".rv").forEach((el) => io.observe(el));
})();

let currentStep = 1;
function saGoTo(step) {
  if (step > currentStep) {
    const cur = document.querySelector(
      '.sa-section[data-section="' + currentStep + '"]',
    );
    const inputs = cur.querySelectorAll("[required]");
    let valid = true;
    inputs.forEach((inp) => {
      if (!inp.value.trim()) {
        valid = false;
        inp.style.borderBottomColor = "var(--danger)";
        setTimeout(() => (inp.style.borderBottomColor = ""), 2000);
      }
    });
    if (!valid) {
      toast("Veuillez remplir tous les champs obligatoires.", "err");
      return;
    }
  }
  document
    .querySelector('.sa-section[data-section="' + currentStep + '"]')
    .classList.remove("active");
  document
    .querySelector('.sa-section[data-section="' + step + '"]')
    .classList.add("active");
  document.querySelectorAll(".sa-step").forEach((s) => {
    const n = parseInt(s.dataset.step);
    s.classList.remove("active", "done");
    if (n === step) s.classList.add("active");
    else if (n < step) s.classList.add("done");
  });
  currentStep = step;
  window.scrollTo({
    top: document.querySelector(".sa-steps-wrap").offsetTop - 10,
    behavior: "smooth",
  });
}
function saFile(input, areaId, lblId) {
  if (input.files && input.files[0]) {
    const f = input.files[0];
    const nm = f.name.length > 20 ? f.name.substring(0, 20) + "..." : f.name;
    const sz = (f.size / 1024 / 1024).toFixed(2);
    document.getElementById(lblId).textContent = nm + " (" + sz + " MB)";
    document.getElementById(areaId).classList.add("done");
  }
}
function toggleCk(cb) {
  cb.closest(".sa-ck").classList.toggle("checked", cb.checked);
}
function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "sa-toast " + type;
  el.textContent = msg;
  document.getElementById("sa-toasts").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.showToast = (m, t) =>
  toast(m, t === "success" ? "ok" : t === "error" ? "err" : "ok");

document.getElementById("sa-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (typeof firebase === "undefined") {
    toast("Firebase non détecté.", "err");
    return;
  }
  const submitBtn = document.getElementById("sa-submit");
  const prog = document.getElementById("sa-prog");
  const fill = document.getElementById("sa-prog-fill");
  const txt = document.getElementById("sa-prog-txt");
  submitBtn.style.display = "none";
  prog.style.display = "block";
  try {
    const db = firebase.firestore();
    const storage = firebase.storage();
    const fd = new FormData(e.target);
    const shopName = fd.get("shop_name").replace(/\s+/g, "_").toLowerCase();
    const ts = Date.now();
    const folder = "candidatures/" + shopName + "_" + ts;
    const pm = [];
    [
      "payment_mobile_money",
      "payment_cash",
      "payment_card",
      "payment_transfer",
    ].forEach((n) => {
      if (fd.get(n)) pm.push(fd.get(n));
    });
    const data = {
      shop_name: fd.get("shop_name"),
      legal_status: fd.get("legal_status"),
      rccm: fd.get("rccm") || "",
      ifu_num: fd.get("ifu") || "",
      owner_name: fd.get("owner_name"),
      owner_role: fd.get("owner_role"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      address: fd.get("address"),
      bank_account: fd.get("bank_account") || "",
      payment_methods: pm,
      billing_address: fd.get("billing_address") || "",
      categories: fd.get("categories"),
      brand_story: fd.get("brand_story"),
      delivery_time: fd.get("delivery_time") || "",
      return_policy: fd.get("return_policy") || "",
      social_instagram: fd.get("social_instagram") || "",
      social_website: fd.get("social_website") || "",
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    txt.textContent = "Envoi des fichiers...";
    const files = [
      { id: "inp-logo", field: "logo_url", name: "logo" },
      { id: "inp-id", field: "id_card_url", name: "id_card" },
      { id: "inp-rccm", field: "rccm_doc_url", name: "rccm_doc" },
      { id: "inp-ifu", field: "ifu_doc_url", name: "ifu_doc" },
    ];
    const active = files.filter(
      (f) => document.getElementById(f.id).files.length > 0,
    );
    let done = 0;
    for (const fi of active) {
      const file = document.getElementById(fi.id).files[0];
      const ext = file.name.split(".").pop();
      const ref = storage.ref(folder + "/" + fi.name + "." + ext);
      const task = ref.put(file);
      await new Promise((res, rej) =>
        task.on(
          "state_changed",
          (snap) => {
            const p = (snap.bytesTransferred / snap.totalBytes) * 100;
            fill.style.width = ((done + p / 100) / active.length) * 100 + "%";
          },
          rej,
          async () => {
            data[fi.field] = await task.snapshot.ref.getDownloadURL();
            done++;
            res();
          },
        ),
      );
    }
    txt.textContent = "Finalisation...";
    fill.style.width = "100%";
    await db.collection("seller_applications").add(data);
    e.target.style.display = "none";
    prog.style.display = "none";
    document.getElementById("sa-success").style.display = "block";
    document
      .getElementById("sa-success")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    console.error(err);
    toast("Erreur : " + err.message, "err");
    submitBtn.style.display = "inline-flex";
    prog.style.display = "none";
  }
});

/*seller-onboarding.html script*/

(() => {
  const ring = document.getElementById("cur-ring"),
    dot = document.getElementById("cur-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,.so-why-card,.so-req-card,.so-ps"))
      document.body.classList.add("ch");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,.so-why-card,.so-req-card,.so-ps"))
      document.body.classList.remove("ch");
  });
})();
(() => {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("on");
      }),
    { threshold: 0.07 },
  );
  document.querySelectorAll(".rv").forEach((el) => io.observe(el));
})();

// Compteurs animés depuis Firebase
document.addEventListener("DOMContentLoaded", () => {
  if (
    typeof firebase === "undefined" ||
    !firebase.apps ||
    !firebase.apps.length
  )
    return;
  const db = firebase.firestore();
  Promise.all([db.collection("shops").get(), db.collection("products").get()])
    .then(([shops, products]) => {
      const sc = shops.size,
        pc = products.size;
      animCount(document.getElementById("met-sellers"), sc || 25);
      animCount(document.getElementById("met-products"), pc || 500);
      animCount(document.getElementById("stat-sellers"), sc || 25);
      animCount(document.getElementById("stat-products"), pc || 500);
    })
    .catch(() => {
      ["met-sellers", "stat-sellers"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "25+";
      });
      ["met-products", "stat-products"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = "500+";
      });
    });
});
function animCount(el, target) {
  if (!el) return;
  const suffix = target >= 500 ? "+" : "";
  let start = 0;
  const dur = 2200;
  const s = performance.now();
  function step(now) {
    const t = Math.min((now - s) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(ease * target) + (t < 1 ? "" : suffix);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/*seller.html script*/

/* ── CURSOR ── */
(() => {
  const ring = document.getElementById("sd-ring"),
    dot = document.getElementById("sd-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,select,input,textarea,[onclick]"))
      document.body.classList.add("sd-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,select,input,textarea,[onclick]"))
      document.body.classList.remove("sd-h");
  });
})();

/* ── TOAST ── */
function sdToast(msg, type = "") {
  const zone = document.getElementById("sd-toasts");
  const el = document.createElement("div");
  el.className =
    "sd-toast " + (type === "success" ? "ok" : type === "error" ? "err" : "");
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.showToast = sdToast;

/* ── TAB SWITCH ── */
window.sdSwitchTab = (name) => {
  document
    .querySelectorAll("#sd .sd-tab")
    .forEach((t) => t.classList.remove("on"));
  document
    .querySelectorAll("#sd .sd-nav-item[data-tab]")
    .forEach((l) => l.classList.remove("on"));
  const tab = document.getElementById("sd-tab-" + name);
  if (tab) tab.classList.add("on");
  const link = document.querySelector(`#sd .sd-nav-item[data-tab="${name}"]`);
  if (link) link.classList.add("on");
  const titles = {
    overview: "Vue d'ensemble",
    products: "Mes Produits",
    "add-product": "Ajouter un produit",
    orders: "Commandes",
    settings: "Paramètres",
    messages: "Messagerie",
  };
  const el = document.getElementById("sd-topbar-section");
  if (el) el.textContent = titles[name] || name;
  // Close mobile sidebar
  document.getElementById("sd-sidebar")?.classList.remove("open");
};

/* ── NAV CLICKS ── */
document.querySelectorAll("#sd .sd-nav-item[data-tab]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    sdSwitchTab(link.getAttribute("data-tab"));
  });
});

/* ── LOGOUT ── */
window.sdLogout = () => {
  if (!confirm("Se déconnecter ?")) return;
  firebase
    .auth()
    .signOut()
    .then(() => (window.location.href = "login.html"));
};

/* ── FORMAT ── */
const sdFmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
const sdFmtDate = (ts) => {
  try {
    const d = ts?.toDate
      ? ts.toDate()
      : new Date(ts?.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
};

/* ── STATUS ── */
function sdStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "pending_admin" || s === "pending")
    return { label: "En attente", cls: "warn" };
  if (s === "pending_seller") return { label: "En préparation", cls: "info" };
  if (s === "ready_for_delivery") return { label: "En livraison", cls: "info" };
  if (s === "delivered" || s.includes("livr"))
    return { label: "Livré", cls: "ok" };
  if (s === "cancelled" || s.includes("annul"))
    return { label: "Annulé", cls: "err" };
  if (s === "shipped" || s.includes("expéd"))
    return { label: "Expédié", cls: "info" };
  return { label: "En cours", cls: "info" };
}

/* ── IMAGE PREVIEW ── */
document.getElementById("fp-images")?.addEventListener("change", function () {
  const preview = document.getElementById("sd-img-preview");
  preview.innerHTML = "";
  [...this.files].forEach((file, i) => {
    const r = new FileReader();
    r.onload = (e) => {
      const div = document.createElement("div");
      div.className = "sd-img-thumb";
      div.innerHTML = `<img src="${e.target.result}" alt=""><button class="sd-img-thumb-del" type="button" onclick="this.parentElement.remove()" title="Supprimer">×</button>`;
      preview.appendChild(div);
    };
    r.readAsDataURL(file);
  });
});

/* ── RESET FORM ── */
window.sdResetForm = () => {
  document.getElementById("sd-product-form")?.reset();
  document.getElementById("sd-img-preview").innerHTML = "";
  sdSwitchTab("products");
};

document.addEventListener("DOMContentLoaded", () => {
  if (!firebase.apps.length) {
    sdToast("Firebase non initialisé", "error");
    return;
  }
  const db = firebase.firestore(),
    auth = firebase.auth(),
    storage = firebase.storage();
  let currentShopId = null,
    currentShopData = null;

  /* ── AUTH GUARD ── */
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    try {
      const snap = await db
        .collection("shops")
        .where("ownerEmail", "==", user.email)
        .limit(1)
        .get();
      if (snap.empty) {
        sdToast("Aucune boutique trouvée pour ce compte", "error");
        return;
      }
      const doc = snap.docs[0];
      currentShopId = doc.id;
      currentShopData = { id: doc.id, ...doc.data() };
      initDashboard(user, currentShopData);
    } catch (e) {
      sdToast("Erreur chargement boutique", "error");
      console.error(e);
    }
  });

  /* ── INIT ── */
  async function initDashboard(user, shop) {
    // Sidebar identity
    const name = shop.name || "Ma Boutique";
    document.getElementById("sd-shop-name").textContent = name;
    document.getElementById("sd-topbar-shop").textContent = name;
    document.getElementById("sd-shop-initial").textContent = name
      .charAt(0)
      .toUpperCase();
    if (shop.logo) {
      const img = document.getElementById("sd-shop-logo");
      img.src = shop.logo;
      img.style.display = "block";
      document.getElementById("sd-shop-initial").style.display = "none";
    }

    // Status badge
    const isActive = shop.status === "active" || shop.status === "Active";
    const statusBadge = `<span class="sd-status-badge ${isActive ? "ok" : "warn"}">${isActive ? "● Active" : "○ Inactive"}</span>`;
    document.getElementById("sd-shop-status-block").innerHTML = statusBadge;
    document.getElementById("sd-shop-status-inline").innerHTML = statusBadge;
    document.getElementById("sd-shop-category").textContent =
      shop.category || "—";

    // Settings form pre-fill
    ["name", "category", "city", "phone", "description"].forEach((k) => {
      const el = document.getElementById("sp-" + k);
      if (el) el.value = shop[k] || "";
    });

    // Load data
    await Promise.all([loadProducts(), loadOrders(), loadStats()]);
    loadMessages();
  }

  /* ── LOAD PRODUCTS ── */
  async function loadProducts() {
    try {
      const snap = await db
        .collection("products")
        .where("shopId", "==", currentShopId)
        .get();
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const badge = document.getElementById("sd-products-badge");
      if (badge) {
        badge.textContent = products.length;
        badge.style.display = products.length ? "flex" : "none";
      }
      renderProductsTable(products);
    } catch (e) {
      console.error("Produits:", e);
    }
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById("sd-products-tbody");
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="sd-empty">
        <div class="sd-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg></div>
        <div class="sd-empty-title">Aucun produit</div>
        <div class="sd-empty-sub">Ajoutez votre premier produit pour démarrer.</div>
      </div></td></tr>`;
      return;
    }
    tbody.innerHTML = products
      .map((p) => {
        const img =
          (Array.isArray(p.images) ? p.images[0] : null) ||
          p.image ||
          "assets/img/placeholder-product-1.svg";
        const st = sdStatus(p.status || "active");
        return `<tr>
        <td><div class="sd-prod-cell">
          <div class="sd-prod-thumb"><img src="${img}" onerror="this.src='assets/img/placeholder-product-1.svg'"></div>
          <div><div class="sd-prod-name">${p.name || "—"}</div><div class="sd-prod-cat">${p.category || ""}</div></div>
        </div></td>
        <td class="price">${sdFmt(p.price || 0)} FCFA</td>
        <td style="color:${(p.stock || 0) < 5 ? "var(--warn)" : "rgba(254,252,248,.6)"}">${p.stock || 0}</td>
        <td style="color:var(--s);font-size:12px">${p.category || "—"}</td>
        <td><span class="sd-status-badge ${st.cls}">${st.label}</span></td>
        <td><div class="sd-table-actions">
          <button class="sd-tbl-btn" onclick="sdEditProduct('${p.id}')">Modifier</button>
          <button class="sd-tbl-btn del" onclick="sdDeleteProduct('${p.id}','${(p.name || "").replace(/'/g, "\\'")}')">Supprimer</button>
        </div></td>
      </tr>`;
      })
      .join("");
  }

  /* ── LOAD ORDERS ── */
  async function loadOrders() {
    try {
      const snap = await db
        .collection("orders")
        .where("sellerId", "==", currentShopId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get()
        .catch(() =>
          db
            .collection("orders")
            .where("sellerId", "==", currentShopId)
            .limit(20)
            .get(),
        );
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const badge = document.getElementById("sd-orders-badge");
      const pending = orders.filter(
        (o) =>
          !["delivered", "cancelled"].includes((o.status || "").toLowerCase()),
      ).length;
      if (badge) {
        badge.textContent = pending;
        badge.style.display = pending ? "flex" : "none";
      }
      renderOrders(orders);
      renderRecentOrders(orders.slice(0, 5));
    } catch (e) {
      console.error("Commandes:", e);
    }
  }

  function renderOrders(orders) {
    const container = document.getElementById("sd-orders-list");
    if (!orders.length) {
      container.innerHTML = `<div class="sd-empty"><div class="sd-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div><div class="sd-empty-title">Aucune commande</div><div class="sd-empty-sub">Les commandes de vos clients apparaîtront ici.</div></div>`;
      return;
    }
    container.innerHTML = orders
      .map((o) => {
        const st = sdStatus(o.status);
        const items = (o.items || []).length;
        return `<div class="sd-order-row">
        <div>
          <div class="sd-order-ref">#${o.reference || o.id.substring(0, 8).toUpperCase()}</div>
          <div class="sd-order-meta">${sdFmtDate(o.createdAt)} · ${items} article${items > 1 ? "s" : ""}</div>
        </div>
        <div><span class="sd-status-badge ${st.cls}">${st.label}</span></div>
        <div style="font-family:'Unbounded',sans-serif;font-size:13px;color:var(--g);font-weight:700">${sdFmt(o.total || 0)} FCFA</div>
        <div>
          <select class="sd-input" style="padding:6px 28px 6px 10px;font-size:11px;background:var(--i3)" onchange="sdUpdateOrderStatus('${o.id}',this.value)">
            <option value="pending_admin" ${o.status === "pending_admin" ? "selected" : ""}>En attente</option>
            <option value="pending_seller" ${o.status === "pending_seller" ? "selected" : ""}>En préparation</option>
            <option value="ready_for_delivery" ${o.status === "ready_for_delivery" ? "selected" : ""}>En livraison</option>
            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Livré</option>
            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Annulé</option>
          </select>
        </div>
        <div></div>
      </div>`;
      })
      .join("");
  }

  function renderRecentOrders(orders) {
    const container = document.getElementById("sd-recent-orders");
    if (!orders.length) {
      container.innerHTML =
        '<div class="sd-empty" style="padding:32px 0"><div class="sd-empty-sub">Aucune commande récente.</div></div>';
      return;
    }
    container.innerHTML = orders
      .map((o) => {
        const st = sdStatus(o.status);
        return `<div class="sd-order-row">
        <div><div class="sd-order-ref">#${o.reference || o.id.substring(0, 8).toUpperCase()}</div><div class="sd-order-meta">${sdFmtDate(o.createdAt)}</div></div>
        <div><span class="sd-status-badge ${st.cls}">${st.label}</span></div>
        <div style="font-family:'Unbounded',sans-serif;font-size:13px;color:var(--g);font-weight:700">${sdFmt(o.total || 0)} FCFA</div>
        <div></div><div></div>
      </div>`;
      })
      .join("");
  }

  /* ── STATS ── */
  async function loadStats() {
    try {
      const snap = await db
        .collection("orders")
        .where("sellerId", "==", currentShopId)
        .get()
        .catch(() =>
          db.collection("orders").where("shopId", "==", currentShopId).get(),
        );
      const orders = snap.docs.map((d) => d.data());
      const totalSales = orders
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + (o.total || 0), 0);

      const psnap = await db
        .collection("products")
        .where("shopId", "==", currentShopId)
        .get();
      document.getElementById("sd-stat-products").textContent = sdFmt(
        psnap.size,
      );
      document.getElementById("sd-stat-sales").textContent = sdFmt(totalSales);
      document.getElementById("sd-stat-views").textContent = sdFmt(
        currentShopData.views || 0,
      );
    } catch (e) {
      document.getElementById("sd-stat-products").textContent = "—";
      document.getElementById("sd-stat-sales").textContent = "—";
      document.getElementById("sd-stat-views").textContent = "—";
    }
  }

  /* ── ORDER STATUS UPDATE ── */
  window.sdUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await db
        .collection("orders")
        .doc(orderId)
        .update({
          status: newStatus,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      sdToast("Statut mis à jour", "success");
    } catch (e) {
      sdToast("Erreur mise à jour", "error");
    }
  };

  /* ── EDIT PRODUCT ── */
  window.sdEditProduct = (pid) => {
    sdSwitchTab("add-product");
    db.collection("products")
      .doc(pid)
      .get()
      .then((doc) => {
        if (!doc.exists) return;
        const p = doc.data();
        document.getElementById("fp-name").value = p.name || "";
        document.getElementById("fp-category").value = p.category || "";
        document.getElementById("fp-price").value = p.price || "";
        document.getElementById("fp-original-price").value =
          p.originalPrice || "";
        document.getElementById("fp-stock").value = p.stock || "";
        document.getElementById("fp-sku").value = p.sku || "";
        document.getElementById("fp-description").value = p.description || "";
        document.getElementById("fp-colors").value = (p.colors || []).join(
          ", ",
        );
        document.getElementById("fp-sizes").value = (p.sizes || []).join(", ");
        document.getElementById("sd-product-form").dataset.editId = pid;
      });
  };

  /* ── DELETE PRODUCT ── */
  window.sdDeleteProduct = async (pid, name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      await db.collection("products").doc(pid).delete();
      sdToast("Produit supprimé", "success");
      loadProducts();
    } catch (e) {
      sdToast("Erreur suppression", "error");
    }
  };

  /* ── ADD / EDIT PRODUCT SUBMIT ── */
  document
    .getElementById("sd-product-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("sd-submit-btn");
      btn.disabled = true;
      btn.querySelector("span").textContent = "Publication…";

      try {
        const editId = e.target.dataset.editId;
        const colorRaw = document.getElementById("fp-colors").value;
        const sizeRaw = document.getElementById("fp-sizes").value;

        const productData = {
          name: document.getElementById("fp-name").value.trim(),
          category: document.getElementById("fp-category").value,
          price: Number(document.getElementById("fp-price").value) || 0,
          originalPrice:
            Number(document.getElementById("fp-original-price").value) ||
            0 ||
            null,
          stock: Number(document.getElementById("fp-stock").value) || 0,
          sku: document.getElementById("fp-sku").value.trim(),
          description: document.getElementById("fp-description").value.trim(),
          colors: colorRaw
            ? colorRaw
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
          sizes: sizeRaw
            ? sizeRaw
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          shopId: currentShopId,
          shopName: currentShopData?.name || "",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (!productData.originalPrice) delete productData.originalPrice;

        // Upload images
        const fileInput = document.getElementById("fp-images");
        if (fileInput.files.length > 0) {
          const urls = [];
          for (const file of fileInput.files) {
            const ref = storage.ref(
              `products/${currentShopId}/${Date.now()}_${file.name}`,
            );
            const snap = await ref.put(file);
            urls.push(await snap.ref.getDownloadURL());
          }
          productData.images = urls;
          productData.image = urls[0];
        }

        if (editId) {
          await db.collection("products").doc(editId).update(productData);
          delete e.target.dataset.editId;
          sdToast("Produit mis à jour", "success");
        } else {
          productData.createdAt =
            firebase.firestore.FieldValue.serverTimestamp();
          await db.collection("products").add(productData);
          sdToast("Produit publié avec succès", "success");
        }

        e.target.reset();
        document.getElementById("sd-img-preview").innerHTML = "";
        sdSwitchTab("products");
        loadProducts();
      } catch (err) {
        sdToast("Erreur publication: " + err.message, "error");
        console.error(err);
      } finally {
        btn.disabled = false;
        btn.querySelector("span").textContent = "Publier le produit";
      }
    });

  /* ── SETTINGS SUBMIT ── */
  document
    .getElementById("sd-settings-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const updates = {
          name: document.getElementById("sp-name").value.trim(),
          category: document.getElementById("sp-category").value,
          city: document.getElementById("sp-city").value.trim(),
          phone: document.getElementById("sp-phone").value.trim(),
          description: document.getElementById("sp-description").value.trim(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Logo upload
        const logoFile = document.getElementById("sp-logo-file").files[0];
        if (logoFile) {
          const ref = storage.ref(
            `shops/${currentShopId}/logo_${Date.now()}.jpg`,
          );
          const snap = await ref.put(logoFile);
          updates.logo = await snap.ref.getDownloadURL();
        }

        await db.collection("shops").doc(currentShopId).update(updates);
        sdToast("Boutique mise à jour", "success");

        // Update sidebar name
        document.getElementById("sd-shop-name").textContent = updates.name;
        document.getElementById("sd-topbar-shop").textContent = updates.name;
        document.getElementById("sd-shop-initial").textContent = updates.name
          .charAt(0)
          .toUpperCase();
      } catch (err) {
        sdToast("Erreur mise à jour: " + err.message, "error");
      }
    });

  /* ── LOGO PREVIEW ── */
  document
    .getElementById("sp-logo-file")
    ?.addEventListener("change", function () {
      const preview = document.getElementById("sp-logo-preview");
      if (!this.files[0]) return;
      const r = new FileReader();
      r.onload = (e) => {
        preview.innerHTML = `<div class="sd-img-thumb" style="width:80px;height:80px"><img src="${e.target.result}"></div>`;
      };
      r.readAsDataURL(this.files[0]);
    });

  /* ── MESSAGES ── */
  function loadMessages() {
    const container = document.getElementById("sd-messages-list");
    if (typeof window.subscribeUserChats !== "function") {
      container.innerHTML =
        '<div class="sd-empty"><div class="sd-empty-sub">Messagerie indisponible.</div></div>';
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    window.subscribeUserChats(
      user.uid,
      (chats) => {
        const badge = document.getElementById("sd-msg-badge");
        if (badge) {
          badge.textContent = chats.length;
          badge.style.display = chats.length ? "flex" : "none";
        }
        if (!chats.length) {
          container.innerHTML =
            '<div class="sd-empty"><div class="sd-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="sd-empty-title">Aucune discussion</div><div class="sd-empty-sub">Les messages de vos clients apparaîtront ici.</div></div>';
          return;
        }
        container.innerHTML = chats
          .map((chat) => {
            const buyer = chat.buyerName || "Client";
            const initials = buyer
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);
            const preview = chat.lastMessage
              ? chat.lastMessage.length > 60
                ? chat.lastMessage.substring(0, 60) + "…"
                : chat.lastMessage
              : "Aucun message";
            const time = formatDiscTime(chat.lastMessageAt || chat.updatedAt);
            const params = new URLSearchParams({
              chatId: chat.id,
              shopId: chat.shopId || "",
              sellerId: chat.sellerId || "",
            });
            return `<a href="messages.html?${params.toString()}" class="sd-disc-item">
          <div class="sd-disc-avatar">${initials}</div>
          <div style="flex:1;min-width:0">
            <div class="sd-disc-name">${buyer}</div>
            <div class="sd-disc-preview">${preview}</div>
          </div>
          <div class="sd-disc-time">${time}</div>
        </a>`;
          })
          .join("");
      },
      () => {
        container.innerHTML =
          '<div class="sd-empty"><div class="sd-empty-sub">Impossible de charger les discussions.</div></div>';
      },
    );
  }

  function formatDiscTime(ts) {
    if (!ts) return "";
    const date = ts.toDate
      ? ts.toDate()
      : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return Math.floor(diff / 60) + "min";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
});

/*whishlist.html script*/

/* ── CURSOR ── */
(() => {
  const ring = document.getElementById("wl-ring"),
    dot = document.getElementById("wl-dot");
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  document.addEventListener("mousemove", (e) => {
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
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,select,[onclick]"))
      document.body.classList.add("wl-h");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,select,[onclick]"))
      document.body.classList.remove("wl-h");
  });
})();

/* ── TOAST ── */
function wlToast(msg, type = "") {
  const z = document.getElementById("wl-toasts");
  const el = document.createElement("div");
  el.className =
    "wl-toast " + (type === "success" ? "ok" : type === "error" ? "err" : "");
  el.textContent = msg;
  z.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}
window.showToast = wlToast;

/* ── FORMAT ── */
const wlFmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

document.addEventListener("DOMContentLoaded", () => {
  if (!firebase.apps.length) {
    document.getElementById("wl-loader").innerHTML =
      '<p style="color:#D94F4F;font-family:Syne,sans-serif">Firebase non initialisé.</p>';
    return;
  }
  const db = firebase.firestore();

  const loaderEl = document.getElementById("wl-loader");
  const emptyEl = document.getElementById("wl-empty");
  const contentEl = document.getElementById("wl-content");
  const gridEl = document.getElementById("wl-grid");
  const toolbarEl = document.getElementById("wl-toolbar");
  const countEl = document.getElementById("wl-count");
  const countSubEl = document.getElementById("wl-count-sub");
  const filtersEl = document.getElementById("wl-filters");
  const sortEl = document.getElementById("wl-sort");

  let allProducts = [];
  let activeFilter = "all";

  /* ── LOAD ── */
  async function loadWishlist() {
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    } catch {
      localStorage.removeItem("ac_wishlist");
      ids = [];
    }
    ids = ids.filter(Boolean);

    if (!ids.length) {
      showEmpty();
      return;
    }

    const products = [];
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    try {
      for (const chunk of chunks) {
        const snap = await db
          .collection("products")
          .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
          .get();
        snap.docs.forEach((d) => products.push({ id: d.id, ...d.data() }));
      }
      // Preserve wishlist order
      allProducts = ids
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean);
      if (!allProducts.length) {
        showEmpty();
        return;
      }
      buildFilters();
      render();
    } catch (e) {
      console.error(e);
      loaderEl.innerHTML =
        '<div style="text-align:center;padding:60px"><p style="color:#D94F4F;font-family:Syne,sans-serif;font-size:13px">Erreur de chargement. Vérifiez votre connexion.</p></div>';
    }
  }

  function showEmpty() {
    loaderEl.style.display = "none";
    toolbarEl.style.display = "none";
    emptyEl.classList.add("show");
    contentEl.classList.remove("show");
    countEl.textContent = "0";
    countSubEl.textContent = "";
  }

  /* ── FILTERS ── */
  function buildFilters() {
    const cats = [
      ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
    ];
    if (cats.length < 2) {
      filtersEl.style.display = "none";
      return;
    }
    filtersEl.innerHTML =
      '<button class="wl-filter on" data-cat="all">Tous</button>' +
      cats
        .map((c) => `<button class="wl-filter" data-cat="${c}">${c}</button>`)
        .join("");
    filtersEl.querySelectorAll(".wl-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        filtersEl
          .querySelectorAll(".wl-filter")
          .forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
        activeFilter = btn.getAttribute("data-cat");
        render();
      });
    });
  }

  /* ── RENDER ── */
  function render() {
    loaderEl.style.display = "none";
    emptyEl.classList.remove("show");
    contentEl.classList.add("show");
    toolbarEl.style.display = "flex";

    let products = [...allProducts];
    if (activeFilter !== "all")
      products = products.filter((p) => p.category === activeFilter);

    const sort = sortEl.value;
    if (sort === "price-asc")
      products.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "price-desc")
      products.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === "name")
      products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    countEl.textContent = allProducts.length;
    countSubEl.textContent =
      products.length < allProducts.length ? `${products.length} affichés` : "";

    gridEl.innerHTML = "";
    products.forEach((p, idx) => {
      const card = buildCard(p);
      gridEl.appendChild(card);
      setTimeout(() => card.classList.add("on"), 40 + idx * 55);
    });
  }

  sortEl.addEventListener("change", render);

  /* ── CARD ── */
  function buildCard(p) {
    const price = Number(String(p.price || 0).replace(/[^\d.-]/g, "")) || 0;
    const originalPrice =
      Number(String(p.originalPrice || 0).replace(/[^\d.-]/g, "")) || 0;
    const hasDiscount = originalPrice > price && originalPrice > 0;
    const stock = parseInt(p.stock || 0, 10);

    let img = "assets/img/placeholder-product-1.svg";
    if (p.image) img = p.image;
    else if (p.images && p.images.length) img = p.images[0];

    let stockLabel = "",
      stockCls = "";
    if (stock === 0) {
      stockLabel = "Épuisé";
      stockCls = "out";
    } else if (stock <= 5) {
      stockLabel = `Plus que ${stock}`;
      stockCls = "low";
    } else {
      stockLabel = "En stock";
      stockCls = "ok";
    }

    const div = document.createElement("div");
    div.className = "wl-card";
    div.setAttribute("data-id", p.id);

    div.innerHTML = `
      <a href="produit.html?id=${p.id}" class="wl-card-img-wrap">
        <img src="${img}" class="wl-card-img" alt="${p.name || ""}" onerror="this.src='assets/img/placeholder-product-1.svg'">
        ${
          hasDiscount
            ? `<div class="wl-card-badge sale">-${Math.round((1 - price / originalPrice) * 100)}%</div>`
            : p.isNew
              ? `<div class="wl-card-badge">Nouveau</div>`
              : ""
        }
        <button class="wl-card-remove" onclick="wlRemove('${p.id}',event)" title="Retirer des favoris">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
        <div class="wl-card-overlay">
          <button class="wl-card-add-btn" onclick="wlAddToCart('${p.id}',event)" ${stock === 0 ? "disabled" : ""}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            ${stock === 0 ? "Épuisé" : "Ajouter au panier"}
          </button>
        </div>
      </a>
      <div class="wl-card-body">
        ${p.category ? `<span class="wl-card-cat">${p.category}</span>` : ""}
        <a href="produit.html?id=${p.id}" class="wl-card-name">${p.name || "Produit sans nom"}</a>
        ${p.shopName ? `<span class="wl-card-shop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${p.shopName}</span>` : ""}
        <div class="wl-card-footer">
          <div>
            <div class="wl-card-price">${wlFmt(price)}</div>
            ${hasDiscount ? `<div class="wl-card-original">${wlFmt(originalPrice)}</div>` : ""}
          </div>
          <span class="wl-card-stock ${stockCls}">${stockLabel}</span>
        </div>
      </div>
    `;
    return div;
  }

  /* ── REMOVE ── */
  window.wlRemove = (id, e) => {
    if (e) e.preventDefault();
    const card = document.querySelector(`.wl-card[data-id="${id}"]`);
    if (card) {
      card.style.transition = "opacity .3s,transform .3s";
      card.style.opacity = "0";
      card.style.transform = "scale(.92)";
      setTimeout(() => card.remove(), 320);
    }
    let ids = [];
    try {
      ids = JSON.parse(localStorage.getItem("ac_wishlist") || "[]");
    } catch {}
    ids = ids.filter((i) => i !== id);
    localStorage.setItem("ac_wishlist", JSON.stringify(ids));
    allProducts = allProducts.filter((p) => p.id !== id);
    setTimeout(() => {
      if (allProducts.length === 0) showEmpty();
      else {
        countEl.textContent = allProducts.length;
        render();
      }
    }, 340);
    wlToast("Retiré des favoris", "error");
    if (typeof updateWishlistBadge === "function") updateWishlistBadge();
  };
  window.removeFromWishlist = window.wlRemove;

  /* ── ADD TO CART ── */
  window.wlAddToCart = (id, e) => {
    if (e) e.preventDefault();
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
    } catch {}
    const p = allProducts.find((p) => p.id === id);
    if (!p) return;
    const existing = cart.find((i) => i.pid === id || i.id === id);
    if (existing) {
      existing.qty = (existing.qty || existing.quantity || 1) + 1;
      existing.quantity = existing.qty;
    } else {
      cart.push({ pid: id, qty: 1, quantity: 1, product: p });
    }
    localStorage.setItem("ac_cart", JSON.stringify(cart));
    wlToast(`${p.name} ajouté au panier`, "success");
    if (typeof updateCartBadge === "function") updateCartBadge();
  };
  window.addToCart = window.wlAddToCart;

  /* ── CLEAR ALL ── */
  window.wlClearAll = () => {
    if (!confirm("Vider tous vos favoris ?")) return;
    localStorage.removeItem("ac_wishlist");
    allProducts = [];
    showEmpty();
    wlToast("Favoris vidés");
    if (typeof updateWishlistBadge === "function") updateWishlistBadge();
  };

  loadWishlist();
});
