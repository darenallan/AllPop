
// Logique générale (home, catalogue, newsletter, header search, wishlist/panier)
let currentUser = JSON.parse(localStorage.getItem('ac_currentUser')||'null');

// Icônes Lucide pour les catégories principales (mapping nom -> icône Lucide)
const categoryLucideIcons = {
  'Mode & Vêtements': 'shirt',
  'Mode & Accessoires': 'shirt',
  'Beauté, Hygiène & Bien-être': 'sparkles',
  'Électronique, Téléphonie & Informatique': 'smartphone',
  'Maison, Meubles & Décoration': 'home',
  'Bâtiment, Quincaillerie & Matériaux': 'hammer',
  'Véhicules & Mobilité': 'car',
  'Restauration & Boissons': 'utensils',
  'default': 'shopping-bag'
};

// Icônes emoji fallback pour les sous-catégories
const categoryIcons = {
  'Mode & Vêtements': '👗',
  'Mode & Accessoires': '👗',
  'Streetwear': '👕',
  'Luxueux': '💎',
  'Accessoires': '👜',
  'Chaussures': '👟',
  'Homme': '👔',
  'Femme': '👗',
  'Enfant': '🧒',
  'Électronique': '📱',
  'Électronique, Téléphonie & Informatique': '📱',
  'Maison': '🏠',
  'Maison, Meubles & Décoration': '🏠',
  'Bâtiment': '🏗️',
  'Bâtiment, Quincaillerie & Matériaux': '🏗️',
  'Véhicules': '🚗',
  'Véhicules & Mobilité': '🚗',
  'Restauration': '🍽️',
  'Restauration & Boissons': '🍽️',
  'Sport': '⚽',
  'Beauté': '💄',
  'Beauté, Hygiène & Bien-être': '🧴',
  'Bijoux': '💍',
  'Montres': '⌚',
  'Sacs': '👝',
  'Parfum': '🌸',
  'Soin visage': '✨',
  'Soin corps': '🧴',
  'Maquillage': '💄',
  'Hygiène': '🧼',
  'Cheveux': '💇',
  'Bien-être': '🧘',
  'default': '🛍️'
};

// Retourne l'icône Lucide HTML pour une catégorie
function getCategoryLucideIcon(category, size = 24) {
  const iconName = categoryLucideIcons[category] || categoryLucideIcons['default'];
  return `<i data-lucide="${iconName}" class="category-lucide-icon" aria-hidden="true" style="width:${size}px;height:${size}px;"></i>`;
}

// Retourne l'emoji fallback
function getCategoryIcon(category) {
  return categoryIcons[category] || categoryIcons['default'];
}

// Render Category Carousel (Glovo style) avec icônes Lucide
function renderCategoryCarousel() {
  const carousel = document.getElementById('category-carousel');
  if (!carousel) return;

  const categories = Store.categories || [];
  
  carousel.innerHTML = categories.map(cat => `
    <a href="catalogue.html?cat=${encodeURIComponent(cat)}" 
       class="category-card" 
       title="${cat}"
       aria-label="${cat.replace('&', 'et')}">
      <div class="category-card-icon">
        ${getCategoryLucideIcon(cat, 28)}
      </div>
      <div class="category-card-label">${cat}</div>
    </a>
  `).join('');

  // Initialize Lucide icons dans le carousel
  if(typeof lucide !== 'undefined') lucide.createIcons();
  
  // Setup carousel navigation
  setupCarouselNav();
}

function setupCarouselNav() {
  const carousel = document.getElementById('category-carousel');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  
  if (!carousel || !prevBtn || !nextBtn) return;
  
  const scrollAmount = 240; // Scroll par clic
  
  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  
  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
  
  // Update button states on scroll
  function updateArrows() {
    prevBtn.disabled = carousel.scrollLeft <= 0;
    nextBtn.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 5;
  }
  
  carousel.addEventListener('scroll', updateArrows);
  updateArrows();
}

function renderHome(){
  // Render category carousel first
  renderCategoryCarousel();
  
  const cats = document.getElementById('home-categories');
  if(cats){
    cats.innerHTML = Store.categories.map(c=>`
      <div class="card"><img src="assets/img/placeholder-product-1.svg" loading="lazy" alt="${c}">
      <div class="info"><strong>${c}</strong><div class="mt-2"><a href="catalogue.html?cat=${encodeURIComponent(c)}" class="btn btn-dark">Voir</a></div></div></div>`).join('');
  }
  const homeNew = document.getElementById('home-new');
  if(homeNew){
    const list = [...Store.products].slice(-4);
    homeNew.innerHTML = list.map(p=>cardProduct(p)).join('');
    // Initialize Lucide icons after rendering home cards
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  const promos = document.getElementById('home-promos');
  if(promos){
    promos.innerHTML = Store.promos.map(pr=>`
      <div class="card"><div class="info"><span class="badge badge-gold">Code: ${pr.code}</span>
      <p class="mt-2">${pr.percent}% sur le catalogue (expiration: ${new Date(pr.expires).toLocaleDateString()})</p></div></div>`).join('');
  }
}

function cardProduct(p){
  return `
  <div class="card">
    <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
    <div class="info">
      <div>${p.name}</div>
      <div class="price">${p.price.toFixed(2)} FCFA</div>
      <div class="mt-2" style="display:flex;align-items:center;gap:8px">
          <a class="btn btn-gold" href="product.html?id=${encodeURIComponent(p.id)}" title="Voir le produit">
            <i data-lucide="eye" class="lucide-icon"></i>
            <span class="icon-label">Voir</span>
          </a>
          <button class="icon-btn ${isInCart(p.id)?'active':''}" data-add="${p.id}" aria-label="Ajouter au panier" title="Ajouter au panier">
            <i data-lucide="shopping-bag" class="lucide-icon"></i>
            <span class="icon-label">Ajouter</span>
          </button>
        </div>
    </div>
  </div>`;
}

    // Délégation d'événements pour boutons "Ajouter" générés dynamiquement
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-add]');
      if(btn){
        const pid = btn.getAttribute('data-add');
        if(pid) addToCart(pid);
        // animate the button to provide feedback
        animateIcon(btn);
        // visual update
        if(btn && typeof isInCart === 'function'){
          // small delay: ensure addToCart persisted
          setTimeout(()=>{
            if(isInCart(pid)) btn.classList.add('active');
            else btn.classList.remove('active');
          }, 60);
        }
      }
    });

    // Animate icon helper (adds .pulse then removes it)
    function animateIcon(el){
      if(!el) return;
      try{
        el.classList.remove('pulse');
        // force reflow
        void el.offsetWidth;
        el.classList.add('pulse');
        setTimeout(()=> el.classList.remove('pulse'), 600);
      }catch(e){}
    }

    // Update all data-add buttons to reflect current cart state
    function updateCartButtons(){
      const buttons = Array.from(document.querySelectorAll('[data-add]'));
      buttons.forEach(b => {
        const pid = b.getAttribute('data-add');
        if(pid && isInCart(pid)) b.classList.add('active'); else b.classList.remove('active');
      });
    }

function setupNewsletter(){
  const f = document.getElementById('newsletter-form');
  if(!f) return;
  f.addEventListener('submit', e=>{ 
    e.preventDefault(); 
    const emailInput = f.querySelector('input[type="email"]');
    const email = emailInput?.value?.trim();
    
    if(email){
      // Envoyer notification à l'admin
      const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
      notifs.push({
        type: 'newsletter', 
        email: email, 
        date: Date.now()
      });
      localStorage.setItem('ac_notifications', JSON.stringify(notifs));
    }
    
    showToast('Merci ! Vous êtes inscrit(e) à la newsletter.', 'success'); 
    f.reset();
  });
}

// Ensure initial button states reflect cart on page load
window.addEventListener('DOMContentLoaded', ()=>{
  try{ setTimeout(updateCartButtons, 80); }catch(e){}
});

// Catalogue
function initCatalogue(){
  const list = document.getElementById('catalogue-list'); if(!list) return;
  const fc = document.getElementById('filter-category');
  const fcol = document.getElementById('filter-color');
  const fsize = document.getElementById('filter-size');
  const sort = document.getElementById('sort-select');
  const search = document.getElementById('search-input');
  
  // Filtres Beauté
  const fBeautyType = document.getElementById('filter-beauty-type');
  const fSkinType = document.getElementById('filter-skin-type');
  const fBrand = document.getElementById('filter-brand');
  
  // Filtres Électronique
  const fTechType = document.getElementById('filter-tech-type');
  const fCapacity = document.getElementById('filter-capacity');
  const fCondition = document.getElementById('filter-condition');
  const fTechBrand = document.getElementById('filter-tech-brand');
  
  // Filtres Maison
  const fHomeType = document.getElementById('filter-home-type');
  const fMaterial = document.getElementById('filter-material');
  const fDimension = document.getElementById('filter-dimension');
  const fHomeStyle = document.getElementById('filter-home-style');
  
  // Filtres Bâtiment
  const fBtpType = document.getElementById('filter-btp-type');
  const fBtpUnit = document.getElementById('filter-btp-unit');
  const fClientType = document.getElementById('filter-client-type');
  const fBtpBrand = document.getElementById('filter-btp-brand');
  
  // Filtres Véhicules
  const fVehicleType = document.getElementById('filter-vehicle-type');
  const fVehicleCondition = document.getElementById('filter-vehicle-condition');
  const fVehicleYear = document.getElementById('filter-vehicle-year');
  const fVehicleFuel = document.getElementById('filter-vehicle-fuel');
  const fVehicleBrand = document.getElementById('filter-vehicle-brand');
  
  // Filtres Restauration
  const fCuisineType = document.getElementById('filter-cuisine-type');
  const fPriceRange = document.getElementById('filter-price-range');
  const fOpenNow = document.getElementById('filter-open-now');
  const fDelivery = document.getElementById('filter-delivery');
  
  // Filtre Boutique
  const fShop = document.getElementById('filter-shop');
  
  if(fc) fc.innerHTML += Store.categories.map(c=>`<option>${c}</option>`).join('');
  if(fcol) fcol.innerHTML += Store.colors.map(c=>`<option>${c}</option>`).join('');
  if(fsize) fsize.innerHTML += Store.sizes.map(c=>`<option>${c}</option>`).join('');
  
  // Remplir les filtres Beauté
  if(fBeautyType && Store.beautyTypes) {
    fBeautyType.innerHTML = '<option value="">Type de produit</option>' + Store.beautyTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fSkinType && Store.skinTypes) {
    fSkinType.innerHTML = '<option value="">Type de peau</option>' + Store.skinTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fBrand && Store.beautyBrands) {
    fBrand.innerHTML = '<option value="">Marque</option>' + Store.beautyBrands.map(b=>`<option>${b}</option>`).join('');
  }
  
  // Remplir les filtres Électronique
  if(fTechType && Store.techTypes) {
    fTechType.innerHTML = '<option value="">Type d\'appareil</option>' + Store.techTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fCapacity && Store.techCapacities) {
    fCapacity.innerHTML = '<option value="">Capacité</option>' + Store.techCapacities.map(c=>`<option>${c}</option>`).join('');
  }
  if(fCondition && Store.techConditions) {
    fCondition.innerHTML = '<option value="">État</option>' + Store.techConditions.map(c=>`<option>${c}</option>`).join('');
  }
  if(fTechBrand && Store.techBrands) {
    fTechBrand.innerHTML = '<option value="">Marque</option>' + Store.techBrands.map(b=>`<option>${b}</option>`).join('');
  }
  
  // Remplir les filtres Maison
  if(fHomeType && Store.homeTypes) {
    fHomeType.innerHTML = '<option value="">Type de meuble</option>' + Store.homeTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fMaterial && Store.homeMaterials) {
    fMaterial.innerHTML = '<option value="">Matière</option>' + Store.homeMaterials.map(m=>`<option>${m}</option>`).join('');
  }
  if(fDimension && Store.homeDimensions) {
    fDimension.innerHTML = '<option value="">Dimensions</option>' + Store.homeDimensions.map(d=>`<option>${d}</option>`).join('');
  }
  if(fHomeStyle && Store.homeStyles) {
    fHomeStyle.innerHTML = '<option value="">Style</option>' + Store.homeStyles.map(s=>`<option>${s}</option>`).join('');
  }
  
  // Remplir les filtres Bâtiment
  if(fBtpType && Store.btpTypes) {
    fBtpType.innerHTML = '<option value="">Type de produit</option>' + Store.btpTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fBtpUnit && Store.btpUnits) {
    fBtpUnit.innerHTML = '<option value="">Unité</option>' + Store.btpUnits.map(u=>`<option>${u}</option>`).join('');
  }
  if(fClientType && Store.btpClientTypes) {
    fClientType.innerHTML = '<option value="">Type client</option>' + Store.btpClientTypes.map(c=>`<option>${c}</option>`).join('');
  }
  if(fBtpBrand && Store.btpBrands) {
    fBtpBrand.innerHTML = '<option value="">Marque</option>' + Store.btpBrands.map(b=>`<option>${b}</option>`).join('');
  }
  
  // Remplir les filtres Véhicules
  if(fVehicleType && Store.vehicleTypes) {
    fVehicleType.innerHTML = '<option value="">Type de véhicule</option>' + Store.vehicleTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fVehicleCondition && Store.vehicleConditions) {
    fVehicleCondition.innerHTML = '<option value="">État</option>' + Store.vehicleConditions.map(c=>`<option>${c}</option>`).join('');
  }
  if(fVehicleYear && Store.vehicleYears) {
    fVehicleYear.innerHTML = '<option value="">Année</option>' + Store.vehicleYears.map(y=>`<option>${y}</option>`).join('');
  }
  if(fVehicleFuel && Store.vehicleFuels) {
    fVehicleFuel.innerHTML = '<option value="">Carburant</option>' + Store.vehicleFuels.map(f=>`<option>${f}</option>`).join('');
  }
  if(fVehicleBrand && Store.vehicleBrands) {
    fVehicleBrand.innerHTML = '<option value="">Marque</option>' + Store.vehicleBrands.map(b=>`<option>${b}</option>`).join('');
  }
  
  // Remplir les filtres Restauration
  if(fCuisineType && Store.cuisineTypes) {
    fCuisineType.innerHTML = '<option value="">Type de cuisine</option>' + Store.cuisineTypes.map(t=>`<option>${t}</option>`).join('');
  }
  if(fPriceRange && Store.priceRanges) {
    fPriceRange.innerHTML = '<option value="">Tous les prix</option>' + Store.priceRanges.map(p=>`<option>${p}</option>`).join('');
  }
  
  // Remplir le filtre Boutique (regroupé par catégorie)
  function populateShopFilter() {
    if(!fShop) return;
    const activeShops = (Store.shops || []).filter(s => s.status === 'active');
    
    // Grouper par catégorie
    const shopsByCategory = {};
    activeShops.forEach(s => {
      const catName = s.category || 'Autres';
      if(!shopsByCategory[catName]) shopsByCategory[catName] = [];
      shopsByCategory[catName].push(s);
    });
    
    let html = '<option value="">Toutes les boutiques</option>';
    Object.keys(shopsByCategory).forEach(catName => {
      const cat = (Store.shopCategories || []).find(c => c.name === catName);
      const icon = cat?.icon || '🛍️';
      html += `<optgroup label="${icon} ${catName}">`;
      shopsByCategory[catName].forEach(shop => {
        html += `<option value="${shop.id}">${shop.name}</option>`;
      });
      html += '</optgroup>';
    });
    
    fShop.innerHTML = html;
  }
  populateShopFilter();
  
  // Afficher/masquer filtres selon catégorie
  function updateCategoryFilters() {
    const params = new URLSearchParams(location.search);
    const presetCat = params.get('cat');
    const selectedCat = fc ? fc.value : '';
    const isBeauty = (presetCat === 'Beauté, Hygiène & Bien-être') || (selectedCat === 'Beauté, Hygiène & Bien-être');
    const isTech = (presetCat === 'Électronique, Téléphonie & Informatique') || (selectedCat === 'Électronique, Téléphonie & Informatique');
    const isHome = (presetCat === 'Maison, Meubles & Décoration') || (selectedCat === 'Maison, Meubles & Décoration');
    const isBtp = (presetCat === 'Bâtiment, Quincaillerie & Matériaux') || (selectedCat === 'Bâtiment, Quincaillerie & Matériaux');
    const isVehicle = (presetCat === 'Véhicules & Mobilité') || (selectedCat === 'Véhicules & Mobilité');
    const isRestaurant = (presetCat === 'Restauration & Boissons') || (selectedCat === 'Restauration & Boissons');
    
    // Afficher filtres Beauté, masquer filtres Mode et Tech
    if(fBeautyType) fBeautyType.classList.toggle('hidden', !isBeauty);
    if(fSkinType) fSkinType.classList.toggle('hidden', !isBeauty);
    if(fBrand) fBrand.classList.toggle('hidden', !isBeauty);
    
    // Afficher filtres Électronique, masquer filtres Mode et Beauté
    if(fTechType) fTechType.classList.toggle('hidden', !isTech);
    if(fCapacity) fCapacity.classList.toggle('hidden', !isTech);
    if(fCondition) fCondition.classList.toggle('hidden', !isTech);
    if(fTechBrand) fTechBrand.classList.toggle('hidden', !isTech);
    
    // Afficher filtres Maison
    if(fHomeType) fHomeType.classList.toggle('hidden', !isHome);
    if(fMaterial) fMaterial.classList.toggle('hidden', !isHome);
    if(fDimension) fDimension.classList.toggle('hidden', !isHome);
    if(fHomeStyle) fHomeStyle.classList.toggle('hidden', !isHome);
    
    // Afficher filtres Bâtiment
    if(fBtpType) fBtpType.classList.toggle('hidden', !isBtp);
    if(fBtpUnit) fBtpUnit.classList.toggle('hidden', !isBtp);
    if(fClientType) fClientType.classList.toggle('hidden', !isBtp);
    if(fBtpBrand) fBtpBrand.classList.toggle('hidden', !isBtp);
    
    // Afficher filtres Véhicules
    if(fVehicleType) fVehicleType.classList.toggle('hidden', !isVehicle);
    if(fVehicleCondition) fVehicleCondition.classList.toggle('hidden', !isVehicle);
    if(fVehicleYear) fVehicleYear.classList.toggle('hidden', !isVehicle);
    if(fVehicleFuel) fVehicleFuel.classList.toggle('hidden', !isVehicle);
    if(fVehicleBrand) fVehicleBrand.classList.toggle('hidden', !isVehicle);
    
    // Afficher filtres Restauration
    if(fCuisineType) fCuisineType.classList.toggle('hidden', !isRestaurant);
    if(fPriceRange) fPriceRange.classList.toggle('hidden', !isRestaurant);
    if(fOpenNow) fOpenNow.classList.toggle('hidden', !isRestaurant);
    if(fDelivery) fDelivery.classList.toggle('hidden', !isRestaurant);
    
    // Masquer filtre boutique pour restaurants
    if(fShop) fShop.classList.toggle('hidden', isRestaurant);
    
    // Masquer taille et couleur pour catégories spéciales
    if(fsize) fsize.classList.toggle('hidden', isBeauty || isTech || isHome || isBtp || isVehicle || isRestaurant);
    if(fcol) fcol.classList.toggle('hidden', isRestaurant);
    
    // Masquer recherche texte pour restaurants (on filtre autrement)
    if(search) search.classList.toggle('hidden', isRestaurant);
    
    // Mettre à jour le filtre boutique selon la catégorie sélectionnée
    updateShopFilterByCategory(presetCat || selectedCat);
  }
  
  // Mettre à jour le filtre boutique pour n'afficher que les boutiques de la catégorie
  function updateShopFilterByCategory(selectedCat) {
    if(!fShop) return;
    const activeShops = (Store.shops || []).filter(s => s.status === 'active');
    
    // Si une catégorie est sélectionnée, filtrer les boutiques de cette catégorie
    let shopsToShow = activeShops;
    if(selectedCat) {
      shopsToShow = activeShops.filter(s => s.category === selectedCat);
    }
    
    // Grouper par catégorie
    const shopsByCategory = {};
    shopsToShow.forEach(s => {
      const catName = s.category || 'Autres';
      if(!shopsByCategory[catName]) shopsByCategory[catName] = [];
      shopsByCategory[catName].push(s);
    });
    
    let html = '<option value="">Toutes les boutiques</option>';
    
    if(Object.keys(shopsByCategory).length === 0) {
      html += '<option disabled>Aucune boutique dans cette catégorie</option>';
    } else {
      Object.keys(shopsByCategory).forEach(catName => {
        const cat = (Store.shopCategories || []).find(c => c.name === catName);
        const icon = cat?.icon || '🛍️';
        if(selectedCat) {
          // Si catégorie sélectionnée, ne pas regrouper
          shopsByCategory[catName].forEach(shop => {
            html += `<option value="${shop.id}">${icon} ${shop.name}</option>`;
          });
        } else {
          html += `<optgroup label="${icon} ${catName}">`;
          shopsByCategory[catName].forEach(shop => {
            html += `<option value="${shop.id}">${shop.name}</option>`;
          });
          html += '</optgroup>';
        }
      });
    }
    
    fShop.innerHTML = html;
  }
  
  // Listener sur changement de catégorie
  if(fc) fc.addEventListener('change', updateCategoryFilters);
  updateCategoryFilters();

  function apply(){
    const params = new URLSearchParams(location.search);
    const presetCat = params.get('cat');
    const selectedCat = fc ? fc.value : '';
    const isRestaurant = (presetCat === 'Restauration & Boissons') || (selectedCat === 'Restauration & Boissons');
    
    // Si catégorie Restauration, afficher les restaurants
    if(isRestaurant) {
      let restaurants = [...(Store.restaurants || [])];
      
      // Filtres Restauration
      const cuisineTypeVal = fCuisineType ? fCuisineType.value : '';
      const priceRangeVal = fPriceRange ? fPriceRange.value : '';
      const openNowVal = fOpenNow ? fOpenNow.checked : false;
      const deliveryVal = fDelivery ? fDelivery.checked : false;
      
      if(cuisineTypeVal) restaurants = restaurants.filter(r => r.cuisineType === cuisineTypeVal);
      if(priceRangeVal) restaurants = restaurants.filter(r => r.priceRange === priceRangeVal);
      if(openNowVal) restaurants = restaurants.filter(r => isRestaurantOpen(r));
      if(deliveryVal) restaurants = restaurants.filter(r => r.deliveryEnabled);
      
      // Tri restaurants
      if(sort.value==='price-asc') restaurants.sort((a,b) => getPriceLevel(a.priceRange) - getPriceLevel(b.priceRange));
      else if(sort.value==='price-desc') restaurants.sort((a,b) => getPriceLevel(b.priceRange) - getPriceLevel(a.priceRange));
      else restaurants.sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)); // Par défaut: meilleure note
      
      list.innerHTML = restaurants.map(r => cardRestaurant(r)).join('');
      if(typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }
    
    let items = [...Store.products];
    const q = (search.value||'').toLowerCase();
    
    // Filtres standard
    items = items.filter(p=> (!fc.value || p.category===fc.value) && (!fcol.value || p.color===fcol.value) && (!fsize.value || p.size===fsize.value));
    if(presetCat) items = items.filter(p=>p.category===presetCat);
    if(q){ items = items.filter(p=> p.name.toLowerCase().includes(q)); }
    
    // Filtre par boutique
    const shopVal = fShop ? fShop.value : '';
    if(shopVal) items = items.filter(p => p.shopId === shopVal);
    
    // Ne pas afficher les produits des boutiques inactives
    items = items.filter(p => {
      if(!p.shopId) return true;
      const shop = (Store.shops || []).find(s => s.id === p.shopId);
      return shop && shop.status === 'active';
    });
    
    // Filtres Beauté
    const beautyTypeVal = fBeautyType ? fBeautyType.value : '';
    const skinTypeVal = fSkinType ? fSkinType.value : '';
    const brandVal = fBrand ? fBrand.value : '';
    
    if(beautyTypeVal) items = items.filter(p => p.beautyType === beautyTypeVal);
    if(skinTypeVal) items = items.filter(p => p.skinType === skinTypeVal);
    if(brandVal) items = items.filter(p => p.brand === brandVal);
    
    // Filtres Électronique
    const techTypeVal = fTechType ? fTechType.value : '';
    const capacityVal = fCapacity ? fCapacity.value : '';
    const conditionVal = fCondition ? fCondition.value : '';
    const techBrandVal = fTechBrand ? fTechBrand.value : '';
    
    if(techTypeVal) items = items.filter(p => p.techType === techTypeVal);
    if(capacityVal) items = items.filter(p => p.capacity === capacityVal);
    if(conditionVal) items = items.filter(p => p.condition === conditionVal);
    if(techBrandVal) items = items.filter(p => p.techBrand === techBrandVal);
    
    // Filtres Maison
    const homeTypeVal = fHomeType ? fHomeType.value : '';
    const materialVal = fMaterial ? fMaterial.value : '';
    const dimensionVal = fDimension ? fDimension.value : '';
    const homeStyleVal = fHomeStyle ? fHomeStyle.value : '';
    
    if(homeTypeVal) items = items.filter(p => p.homeType === homeTypeVal);
    if(materialVal) items = items.filter(p => p.material === materialVal);
    if(dimensionVal) items = items.filter(p => p.dimension === dimensionVal);
    if(homeStyleVal) items = items.filter(p => p.homeStyle === homeStyleVal);
    
    // Filtres Bâtiment
    const btpTypeVal = fBtpType ? fBtpType.value : '';
    const btpUnitVal = fBtpUnit ? fBtpUnit.value : '';
    const clientTypeVal = fClientType ? fClientType.value : '';
    const btpBrandVal = fBtpBrand ? fBtpBrand.value : '';
    
    if(btpTypeVal) items = items.filter(p => p.btpType === btpTypeVal);
    if(btpUnitVal) items = items.filter(p => p.unit === btpUnitVal);
    if(clientTypeVal && clientTypeVal !== 'Tous') items = items.filter(p => p.clientType === clientTypeVal || p.clientType === 'Tous');
    if(btpBrandVal) items = items.filter(p => p.btpBrand === btpBrandVal);
    
    // Filtres Véhicules
    const vehicleTypeVal = fVehicleType ? fVehicleType.value : '';
    const vehicleConditionVal = fVehicleCondition ? fVehicleCondition.value : '';
    const vehicleYearVal = fVehicleYear ? fVehicleYear.value : '';
    const vehicleFuelVal = fVehicleFuel ? fVehicleFuel.value : '';
    const vehicleBrandVal = fVehicleBrand ? fVehicleBrand.value : '';
    
    if(vehicleTypeVal) items = items.filter(p => p.vehicleType === vehicleTypeVal);
    if(vehicleConditionVal) items = items.filter(p => p.vehicleCondition === vehicleConditionVal);
    if(vehicleYearVal) items = items.filter(p => p.vehicleYear === vehicleYearVal);
    if(vehicleFuelVal) items = items.filter(p => p.vehicleFuel === vehicleFuelVal);
    if(vehicleBrandVal) items = items.filter(p => p.vehicleBrand === vehicleBrandVal);
    
    // Tri
    if(sort.value==='price-asc') items.sort((a,b)=>a.price-b.price);
    else if(sort.value==='price-desc') items.sort((a,b)=>b.price-a.price);
    else items = items.reverse();
    list.innerHTML = items.map(p=>cardProduct(p)).join('');
    // Initialize Lucide icons after rendering cards
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  
  // Ajouter les filtres Beauté, Électronique, Maison, Bâtiment, Véhicules, Restauration et Boutique aux listeners
  [fc,fcol,fsize,sort,search,fShop,fBeautyType,fSkinType,fBrand,fTechType,fCapacity,fCondition,fTechBrand,fHomeType,fMaterial,fDimension,fHomeStyle,fBtpType,fBtpUnit,fClientType,fBtpBrand,fVehicleType,fVehicleCondition,fVehicleYear,fVehicleFuel,fVehicleBrand,fCuisineType,fPriceRange].forEach(el=> el && el.addEventListener('input', apply));
  // Checkboxes pour restauration
  if(fOpenNow) fOpenNow.addEventListener('change', apply);
  if(fDelivery) fDelivery.addEventListener('change', apply);
  if(fShop) fShop.addEventListener('change', apply);
  
  // Auto-suggest (simple)
  if(search){
    search.addEventListener('input', ()=>{
      const q = (search.value||'').toLowerCase();
      const match = Store.products.filter(p=>p.name.toLowerCase().includes(q)).slice(0,5).map(p=>p.name);
      search.setAttribute('aria-label', `Suggestions: ${match.join(', ')}`);
    });
  }
  apply();
}

// ===== Helpers Restauration =====
function isRestaurantOpen(restaurant) {
  const now = new Date();
  const hours = now.getHours();
  return hours >= restaurant.openHour && hours < restaurant.closeHour;
}

function getPriceLevel(priceRange) {
  if(priceRange.includes('€€€')) return 3;
  if(priceRange.includes('€€')) return 2;
  return 1;
}

function cardRestaurant(r) {
  const isOpen = isRestaurantOpen(r);
  const badgesHTML = r.badges.map(b => {
    if(b === 'populaire') return '<span class="resto-badge resto-badge-popular"><i data-lucide="flame" class="lucide-icon lucide-sm"></i> Populaire</span>';
    if(b === 'livraison-rapide') return '<span class="resto-badge resto-badge-fast"><i data-lucide="zap" class="lucide-icon lucide-sm"></i> Rapide</span>';
    if(b === 'promo') return '<span class="resto-badge resto-badge-promo"><i data-lucide="percent" class="lucide-icon lucide-sm"></i> -' + r.promoPercent + '%</span>';
    return '';
  }).join('');
  
  return `
  <div class="resto-card ${isOpen ? '' : 'resto-closed'}">
    <div class="resto-card-image">
      <img src="${r.image}" alt="${r.name}" loading="lazy" />
      ${!isOpen ? '<div class="resto-overlay-closed">Fermé</div>' : ''}
      <div class="resto-badges">${badgesHTML}</div>
    </div>
    <div class="resto-card-info">
      <div class="resto-card-header">
        <h3 class="resto-name">${r.name}</h3>
        <div class="resto-rating">
          <i data-lucide="star" class="lucide-icon lucide-sm star-filled"></i>
          <span>${r.rating}</span>
          <span class="resto-review-count">(${r.reviewCount})</span>
        </div>
      </div>
      <div class="resto-meta">
        <span class="resto-cuisine">${r.cuisineType}</span>
        <span class="resto-separator">•</span>
        <span class="resto-price">${r.priceRange.split(' ')[0]}</span>
        <span class="resto-separator">•</span>
        <span class="resto-distance">${r.address.split(',')[0]}</span>
      </div>
      <div class="resto-delivery-info">
        ${r.deliveryEnabled ? `
          <span class="resto-delivery-time">
            <i data-lucide="clock" class="lucide-icon lucide-sm"></i>
            ${r.deliveryTime} min
          </span>
          <span class="resto-delivery-fee">
            <i data-lucide="bike" class="lucide-icon lucide-sm"></i>
            ${r.deliveryFee === 0 ? 'Gratuit' : formatFCFA(r.deliveryFee)}
          </span>
        ` : '<span class="resto-no-delivery"><i data-lucide="x" class="lucide-icon lucide-sm"></i> Pas de livraison</span>'}
        ${r.minOrder > 0 ? `<span class="resto-min-order">Min. ${formatFCFA(r.minOrder)}</span>` : ''}
      </div>
      <div class="resto-actions">
        <a href="restaurant.html?id=${encodeURIComponent(r.id)}" class="btn btn-gold resto-btn">
          <i data-lucide="utensils" class="lucide-icon"></i>
          <span>Voir le menu</span>
        </a>
      </div>
    </div>
  </div>`;
}


// ===== Panier & Wishlist =====
const Cart = JSON.parse(localStorage.getItem('ac_cart')||'[]');
const Wishlist = JSON.parse(localStorage.getItem('ac_wishlist')||'[]');

function persistCart(){ localStorage.setItem('ac_cart', JSON.stringify(Cart)); }
function persistWishlist(){ localStorage.setItem('ac_wishlist', JSON.stringify(Wishlist)); }

function getCartItems(){
  // Mappe vers objets enrichis (produit + quantité)
  return Cart.map(it => {
    const prod = Store.products.find(p => p.id === it.pid);
    return prod ? { product: prod, quantity: it.qty } : null;
  }).filter(Boolean);
}

function getItemCount(){
  return Cart.reduce((sum, it) => sum + (it.qty||1), 0);
}

function getSubtotal(){
  return getCartItems().reduce((sum, it) => sum + (it.product.price * it.quantity), 0);
}

function isInCart(pid){
  return Cart.some(it => it.pid === pid);
}

function addToCart(pid, qty = 1){
  const existing = Cart.find(it => it.pid === pid);
  if(existing){
    existing.qty = Math.min((existing.qty||1) + qty, 999);
  } else {
    Cart.push({pid, qty});
  }
  persistCart();
  showToast('Ajouté au panier', 'success');
  updateCartBadge && updateCartBadge(); // s’il existe
  // update visual state of add buttons
  try{ updateCartButtons(); }catch(e){}
}

function removeFromCart(pid){
  const idx = Cart.findIndex(it => it.pid === pid);
  if(idx !== -1){
    Cart.splice(idx,1);
    persistCart();
    showToast('Article retiré du panier', 'warning');
    updateCartBadge && updateCartBadge();
    try{ updateCartButtons(); }catch(e){}
  }
}

function updateCartQty(pid, qty){
  qty = Math.max(1, parseInt(qty||'1',10));
  const it = Cart.find(x => x.pid === pid);
  if(!it) return;
  const prod = Store.products.find(p => p.id === pid);
  const max = prod ? (prod.stock||999) : 999;
  it.qty = Math.min(qty, max);
  persistCart();
  showToast('Quantité mise à jour', 'success');
  updateCartBadge && updateCartBadge();
  try{ updateCartButtons(); }catch(e){}
}

function clearCart(){
  Cart.splice(0, Cart.length);
  persistCart();
  showToast('Panier vidé', 'warning');
  updateCartBadge && updateCartBadge();
  try{ updateCartButtons(); }catch(e){}
}

// ===== Wishlist =====
// ===== Wishlist =====

// ---- Wishlist helpers ----
function isInWishlist(pid){ return Wishlist.includes(pid); }
function getWishlistItems(){
  return Wishlist.map(pid => Store.products.find(p => p.id === pid)).filter(Boolean);
}
function getWishlistCount(){ return Wishlist.length; }
function toggleWishlist(pid){
  const idx = Wishlist.indexOf(pid);
  if(idx === -1){ Wishlist.push(pid); showToast('Ajouté à la wishlist','success'); }
  else { Wishlist.splice(idx,1); showToast('Retiré de la wishlist','warning'); }
  persistWishlist();
  updateWishlistBadge && updateWishlistBadge();
}
function addToWishlist(pid){
  if(!Wishlist.includes(pid)) Wishlist.push(pid);
  persistWishlist(); showToast('Ajouté à la wishlist','success');
  updateWishlistBadge && updateWishlistBadge();
}
function clearWishlist(){
  Wishlist.splice(0, Wishlist.length);
  persistWishlist(); showToast('Wishlist vidée','warning');
  updateWishlistBadge && updateWishlistBadge();
}

// ===== Initialisation automatique au chargement =====
document.addEventListener('DOMContentLoaded', () => {
  // Page catalogue
  if(document.getElementById('catalogue-list')) {
    initCatalogue();
  }
  // Page accueil
  if(document.getElementById('home-categories') || document.getElementById('home-new')) {
    renderHome();
  }
  // Newsletter
  setupNewsletter();
});
