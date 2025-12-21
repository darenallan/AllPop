
// Page produit (fiche avancée portée depuis React)
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const container = document.getElementById('product-detail');
  if(!id || !container){
    if(container) container.innerHTML = '<p>Produit introuvable.</p>';
    return;
  }

  const p = Store.products.find(x => x.id === id);
  if(!p){
    container.innerHTML = `
      <div class="center" style="padding:48px 0">
        <div>
          <h1 class="mb-2">Produit non trouvé</h1>
          <a href="catalogue.html">Retour au catalogue</a>
        </div>
      </div>`;
    return;
  }

  // Compteurs
  p.views = (p.views||0) + 1; saveStore();

  // Vérifier si l'utilisateur est admin
  const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin' || currentUser.role === 'maintainer');
  console.log('currentUser:', currentUser, 'isAdmin:', isAdmin);

  // Données dérivées
  const reviewCount = Array.isArray(p.reviews) ? p.reviews.length : 0;
  // Calculer le ratio réel à partir des avis
  let rating = 0;
  if (reviewCount > 0) {
    const totalStars = p.reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
    rating = totalStars / reviewCount;
  } else if (typeof p.rating === 'number') {
    rating = p.rating;
  }
  const images = Array.isArray(p.images) && p.images.length ? p.images : ["assets/img/placeholder-product-1.svg"];
  const compareAtPrice = (typeof p.compareAtPrice === 'number') ? p.compareAtPrice : null;
  const storeName = p.shopId || 'Boutique'; // fallback
  const tags = Array.isArray(p.tags) ? p.tags : []; // facultatif
  
  // Utiliser les variantes du produit s'il en a, sinon créer des variantes par défaut
  let variants = [];
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    variants = p.variants;
  } else if (Array.isArray(p.sizes) && p.sizes.length > 0) {
    // Créer des variantes à partir des tailles définies
    variants = p.sizes.map(size => ({
      id: 'size-' + size,
      value: size,
      stock: Math.ceil(p.stock / p.sizes.length)
    }));
  } else if (p.sizeType === 'none') {
    // Pas de taille (accessoire) - pas de variantes
    variants = [];
  } else {
    // Fallback: tailles par défaut seulement si pas d'info
    variants = Store.sizes.map(v => ({id:'size-'+v, value:v, stock: p.stock}));
  }
  
  // Déterminer le label pour les tailles
  let sizeLabel = 'Taille';
  if (p.sizeType === 'shoes') sizeLabel = 'Pointure';
  else if (p.sizeType === 'pants') sizeLabel = 'Taille pantalon';

  // État local
  let selectedImage = 0;
  let selectedVariant = null;
  let quantity = 1;

  // Breadcrumb
  const breadcrumb = `
    <nav class="breadcrumb" aria-label="Fil d’Ariane">
      <a href="index.html">Accueil</a><span>/</span>
      <a href="catalogue.html">Catalogue</a><span>/</span>
      <a href="catalogue.html?cat=${encodeURIComponent(p.category)}">${p.category}</a><span>/</span>
      <span>${p.name}</span>
    </nav>
  `;

  // Stars
  function starsHTML(val){
    const full = Math.floor(val);
    return Array.from({length:5}).map((_,i)=>
      `<span class="star ${i<full?'filled':''}">★</span>`
    ).join('');
  }

  // Thumbs
  function thumbsHTML(){
    return images.map((src, i) => `
      <button class="thumb ${i===selectedImage?'active':''}" data-thumb="${i}" aria-label="Image ${i+1}">
        <img src="${src}" alt="${p.name}" />
      </button>
    `).join('');
  }

  // Variants
  function variantsHTML(){
    if(!variants || variants.length===0) return '';
    return `
      <div class="variants">
        <label class="text-muted-foreground" style="display:block;margin-bottom:8px;">${sizeLabel}</label>
        <div class="flex" style="gap:8px; flex-wrap:wrap;">
          ${variants.map(v => `
            <button
              class="variant-btn ${selectedVariant===v.id?'active':''} ${v.stock===0?'disabled':''}"
              data-variant="${v.id}" ${v.stock===0?'disabled':''}
              aria-label="Choisir ${v.value}"
            >${v.value}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Features (icônes SVG simples)
  const featuresHTML = `
    <div class="features">
      <div class="feature-item">
        <div class="icon-circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h13l5 5v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
        <div>
          <p class="text-sm" style="font-weight:600">Livraison gratuite</p>
          <p class="text-xs text-muted-foreground">Dès 20000 FCFA</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="icon-circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
        <div>
          <p class="text-sm" style="font-weight:600">Retours gratuits</p>
          <p class="text-xs text-muted-foreground">Sous 30 jours</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="icon-circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
        <div>
          <p class="text-sm" style="font-weight:600">Paiement sécurisé</p>
          <p class="text-xs text-muted-foreground">SSL crypté</p>
        </div>
      </div>
    </div>
  `;
  
  // Spécifications techniques (pour l'électronique)
  function techSpecsHTML() {
    if (p.category !== 'Électronique, Téléphonie & Informatique') return '';
    
    const specs = [];
    if (p.techType) specs.push({ label: 'Type', value: p.techType });
    if (p.techBrand) specs.push({ label: 'Marque', value: p.techBrand });
    if (p.capacity && p.capacity !== 'N/A') specs.push({ label: 'Capacité', value: p.capacity });
    if (p.condition) specs.push({ label: 'État', value: p.condition });
    if (p.color) specs.push({ label: 'Couleur', value: p.color });
    
    if (specs.length === 0) return '';
    
    return `
      <div class="tech-specs">
        <h4>📱 Spécifications techniques</h4>
        <div class="specs-grid">
          ${specs.map(s => `
            <div class="spec-item">
              <span class="spec-label">${s.label}</span>
              <span class="spec-value">${s.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Spécifications produit Maison
  function homeSpecsHTML() {
    if (p.category !== 'Maison, Meubles & Décoration') return '';
    
    const specs = [];
    if (p.homeType) specs.push({ label: 'Type', value: p.homeType });
    if (p.material) specs.push({ label: 'Matière', value: p.material });
    if (p.dimension) specs.push({ label: 'Dimensions', value: p.dimension });
    if (p.homeStyle) specs.push({ label: 'Style', value: p.homeStyle });
    if (p.color) specs.push({ label: 'Couleur', value: p.color });
    
    if (specs.length === 0) return '';
    
    return `
      <div class="home-specs">
        <h4>🏠 Caractéristiques du produit</h4>
        <div class="specs-grid">
          ${specs.map(s => `
            <div class="spec-item">
              <span class="spec-label">${s.label}</span>
              <span class="spec-value">${s.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Spécifications produit Bâtiment
  function btpSpecsHTML() {
    if (p.category !== 'Bâtiment, Quincaillerie & Matériaux') return '';
    
    const specs = [];
    if (p.btpType) specs.push({ label: 'Catégorie', value: p.btpType });
    if (p.unit) specs.push({ label: 'Unité de vente', value: p.unit });
    if (p.btpBrand) specs.push({ label: 'Marque', value: p.btpBrand });
    if (p.clientType) specs.push({ label: 'Type client', value: p.clientType });
    
    if (specs.length === 0) return '';
    
    const hasPricePro = p.pricePro && p.pricePro < p.price;
    
    return `
      <div class="btp-specs">
        <h4>🏗️ Fiche technique</h4>
        <div class="specs-grid">
          ${specs.map(s => `
            <div class="spec-item">
              <span class="spec-label">${s.label}</span>
              <span class="spec-value">${s.value}</span>
            </div>
          `).join('')}
        </div>
        ${hasPricePro ? `
        <div class="pro-price-banner">
          <span class="pro-icon">🏢</span>
          <div class="pro-price-info">
            <strong>Prix Professionnel</strong>
            <span class="pro-price">${formatFCFA(p.pricePro)} / ${p.unit || 'unité'}</span>
          </div>
          <span class="pro-badge">-${Math.round((1 - p.pricePro/p.price)*100)}%</span>
        </div>
        ` : ''}
      </div>
    `;
  }
  
  // Spécifications Véhicules & Mobilité
  function vehicleSpecsHTML() {
    if (p.category !== 'Véhicules & Mobilité') return '';
    
    const specs = [];
    if (p.vehicleType) specs.push({ label: 'Type', value: p.vehicleType, icon: '🚗' });
    if (p.vehicleBrand) specs.push({ label: 'Marque', value: p.vehicleBrand, icon: '🏷️' });
    if (p.vehicleYear) specs.push({ label: 'Année', value: p.vehicleYear, icon: '📅' });
    if (p.vehicleMileage !== undefined && p.vehicleMileage > 0) specs.push({ label: 'Kilométrage', value: p.vehicleMileage.toLocaleString('fr-FR') + ' km', icon: '📏' });
    if (p.vehicleFuel && p.vehicleFuel !== 'N/A') specs.push({ label: 'Carburant', value: p.vehicleFuel, icon: '⛽' });
    if (p.vehicleTransmission && p.vehicleTransmission !== 'N/A') specs.push({ label: 'Transmission', value: p.vehicleTransmission, icon: '⚙️' });
    if (p.vehicleCondition) specs.push({ label: 'État', value: p.vehicleCondition, icon: '✅' });
    if (p.color) specs.push({ label: 'Couleur', value: p.color, icon: '🎨' });
    
    if (specs.length === 0) return '';
    
    const isVerified = p.sellerVerified === true;
    
    return `
      <div class="vehicle-specs">
        <h4>🚗 Fiche Annonce Véhicule</h4>
        ${isVerified ? `
        <div class="seller-verified-banner">
          <span class="verified-icon">✓</span>
          <div class="verified-info">
            <strong>Vendeur Vérifié</strong>
            <span>Ce vendeur a été vérifié par Aurum. Documents conformes.</span>
          </div>
          <span class="verified-badge">CONFIANCE</span>
        </div>
        ` : `
        <div class="seller-unverified-banner">
          <span class="unverified-icon">⚠️</span>
          <div class="unverified-info">
            <strong>Vendeur Non Vérifié</strong>
            <span>Ce vendeur n'a pas encore été vérifié. Soyez prudent.</span>
          </div>
        </div>
        `}
        <div class="specs-grid">
          ${specs.map(s => `
            <div class="spec-item vehicle-spec-item">
              <span class="spec-label">${s.icon} ${s.label}</span>
              <span class="spec-value">${s.value}</span>
            </div>
          `).join('')}
        </div>
        <div class="vehicle-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="warning-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="warning-text">
            <strong>Conseils de sécurité</strong>
            <ul>
              <li>Vérifiez toujours les documents du véhicule (carte grise, contrôle technique)</li>
              <li>Faites un essai routier avant l'achat</li>
              <li>Privilégiez les paiements sécurisés via Aurum</li>
              <li>Rencontrez le vendeur dans un lieu public</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // Tags
  function tagsHTML(){
    if(!tags.length) return '';
    return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${tags.map(tag => `
            <a href="catalogue.html?search=${encodeURIComponent(tag)}">${tag}</a>
          `).join('')}
        </div>
    `;
  }

  // Bloc principal
  container.innerHTML = `
    <div class="product-wrap">
      <div class="product-grid">
        <div class="product-main">
          <img src="${images[selectedImage]}" alt="${p.name}" />
        </div>
        <div class="thumbs">${thumbsHTML()}</div>
      </div>
      <div class="product-info">
        <a href="seller.html">
          ${storeName}
        </a>

          <h1 style="font-size:28px;margin:8px 0 12px">${p.name}</h1>

          <div class="product-rating">
            <div>${starsHTML(rating)}</div>
            <span class="text-muted-foreground text-sm">${rating.toFixed(1)} (${reviewCount} avis)</span>
          </div>

          <div style="display:flex;align-items:baseline;gap:12px;margin:10px 0 16px">
            <span class="price" style="font-size:24px">${formatFCFA(p.price)}</span>
            ${compareAtPrice ? `<span class="compare-price">${formatFCFA(compareAtPrice)}</span>` : ''}
          </div>

          <p class="text-muted-foreground" style="line-height:1.6;margin-bottom:12px">
            ${p.features ? p.features : 'Article premium Aurum — style chic, streetwear, qualité au rendez-vous.'}
          </p>

          ${variantsHTML()}
          
          ${p.category === 'Électronique, Téléphonie & Informatique' ? `
          <div class="warranty-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="warning-icon">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div class="warning-content">
              <strong>⚠️ Avertissement Garantie</strong>
              <p>Les produits électroniques vendus sur Aurum sont garantis par le vendeur. Vérifiez les conditions de garantie avec le vendeur avant l'achat. Aurum n'est pas responsable de la garantie constructeur.</p>
              ${p.condition && p.condition !== 'Neuf' ? `<p class="condition-note">Ce produit est vendu en état : <strong>${p.condition}</strong></p>` : ''}
            </div>
          </div>
          ` : ''}

          <div class="quantity">
            <label class="text-muted-foreground" style="display:block;margin-bottom:8px">Quantité</label>
            <div class="quantity-wrap">
              <div class="quantity-ctrl" role="group" aria-label="Contrôle de quantité">
                <button type="button" id="qty-minus" aria-label="Diminuer">–</button>
                <span class="quantity-value" id="qty-val">${quantity}</span>
                <button type="button" id="qty-plus" aria-label="Augmenter">+</button>
              </div>
              <span class="text-muted-foreground text-sm">${p.stock} en stock</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-gold btn-xl" id="add-cart" ${isInCart(p.id) || p.stock===0 ? 'disabled' : ''}>
              <i data-lucide="shopping-bag" class="lucide-icon lucide-sm"></i>
              <span>${isInCart(p.id) ? 'Dans le panier' : 'Ajouter au panier'}</span>
            </button>
            <button class="btn ${isInWishlist(p.id)?'btn-bordeaux active':'btn-outline-dark'} btn-xl icon-btn wishlist-btn" id="toggle-wl" data-role="wishlist" aria-pressed="${isInWishlist(p.id)?'true':'false'}" aria-label="Ajouter aux favoris" title="Ajouter aux favoris">
              <i data-lucide="heart" class="lucide-icon heart-icon ${isInWishlist(p.id) ? 'filled' : ''}"></i>
              <span class="icon-label">Favoris</span>
            </button>
            <button class="btn btn-outline btn-xl" id="share-btn" aria-label="Partager ce produit">
              <i data-lucide="share-2" class="lucide-icon lucide-sm"></i>
              <span>Partager</span>
            </button>
          </div>

          ${featuresHTML}
          ${techSpecsHTML()}
          ${homeSpecsHTML()}
          ${btpSpecsHTML()}
          ${vehicleSpecsHTML()}
          ${tagsHTML()}
        </div>
      </div>
    </div>

    <!-- Section Avis -->
    <div class="reviews-section" id="reviews-section">
      <div class="reviews-header">
        <h3>Avis clients</h3>
        <div class="reviews-summary">
          <span class="avg-rating">${rating}</span>
          <span class="stars-display">${starsHTML(rating)}</span>
          <span class="text-muted-foreground">(${reviewCount} avis)</span>
        </div>
      </div>

      <!-- Formulaire d'avis -->
      <div class="review-form-container" id="review-form-container">
        <h4>Donnez votre avis</h4>
        <form id="review-form">
          <div class="star-rating-input" id="star-rating-input">
            ${[1,2,3,4,5].map(n => `<button type="button" class="star-input" data-rating="${n}" aria-label="${n} étoile${n>1?'s':''}">★</button>`).join('')}
          </div>
          <textarea class="review-textarea" id="review-text" placeholder="Partagez votre expérience avec ce produit..." required></textarea>
          
          <div class="photo-upload-area" id="photo-upload-area">
            <input type="file" id="photo-input" accept="image/*" multiple />
            <svg class="photo-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>Cliquez ou glissez vos photos ici</p>
            <p class="hint">Montrez l'article porté ! (max 5 photos, 5MB chacune)</p>
          </div>
          
          <div class="photo-preview-grid" id="photo-preview-grid"></div>
          
          <button type="submit" class="btn btn-gold">Publier mon avis</button>
        </form>
      </div>

      <!-- Liste des avis -->
      <div id="reviews-list">
        ${renderReviews(p.reviews || [])}
      </div>
    </div>
  `;

  // ===== Système d'avis =====
  let selectedRating = 0;
  let uploadedPhotos = []; // Array of base64 strings

  // Fonction pour afficher les avis
  function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      return `
        <div class="no-reviews">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p>Aucun avis pour le moment.<br>Soyez le premier à donner votre avis !</p>
        </div>
      `;
    }
    return reviews.map((r, idx) => {
      const initial = (r.user || 'A')[0].toUpperCase();
      const userName = r.user || 'Anonyme';
      const verifiedBadge = r.verified ? '<span class="verified-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Achat vérifié</span>' : '';
      const dateStr = r.date || 'Récemment';
      const starsStr = '★'.repeat(r.stars || 5) + '☆'.repeat(5 - (r.stars || 5));
      const comment = r.comment || '';
      
      let photosHTML = '';
      if (r.photos && r.photos.length > 0) {
        const photoDivs = r.photos.map((photo, pidx) => 
          `<div class="review-photo" data-photo="${photo}"><img src="${photo}" alt="Photo avis ${pidx+1}" loading="lazy" /></div>`
        ).join('');
        photosHTML = `<div class="review-photos">${photoDivs}</div>`;
      }

      // Bouton de suppression pour admin
      const deleteBtn = isAdmin ? `
        <button class="review-delete-btn" data-review-idx="${idx}" title="Supprimer cet avis" aria-label="Supprimer cet avis">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      ` : '';
      
      return `
        <div class="review-card" data-review-idx="${idx}">
          <div class="review-card-header">
            <div class="review-avatar">${initial}</div>
            <div class="review-meta">
              <div class="reviewer-name">${userName}${verifiedBadge}</div>
              <div class="review-date">${dateStr}</div>
            </div>
            <div class="review-stars">${starsStr}</div>
            ${deleteBtn}
          </div>
          <p class="review-comment">${comment}</p>
          ${photosHTML}
        </div>
      `;
    }).join('');
  }

  // Notation par étoiles
  const starInputs = container.querySelectorAll('.star-input');
  starInputs.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.rating, 10);
      starInputs.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        s.classList.toggle('active', r <= selectedRating);
      });
    });
    btn.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(btn.dataset.rating, 10);
      starInputs.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        s.classList.toggle('active', r <= hoverRating);
      });
    });
  });
  
  const starContainer = container.querySelector('.star-rating-input');
  starContainer && starContainer.addEventListener('mouseleave', () => {
    starInputs.forEach(s => {
      const r = parseInt(s.dataset.rating, 10);
      s.classList.toggle('active', r <= selectedRating);
    });
  });

  // Upload de photos
  const photoUploadArea = container.querySelector('#photo-upload-area');
  const photoInput = container.querySelector('#photo-input');
  const photoPreviewGrid = container.querySelector('#photo-preview-grid');

  photoUploadArea && photoUploadArea.addEventListener('click', () => photoInput.click());
  
  photoUploadArea && photoUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    photoUploadArea.classList.add('dragover');
  });
  
  photoUploadArea && photoUploadArea.addEventListener('dragleave', () => {
    photoUploadArea.classList.remove('dragover');
  });
  
  photoUploadArea && photoUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    photoUploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  photoInput && photoInput.addEventListener('change', () => {
    handleFiles(photoInput.files);
  });

  function handleFiles(files) {
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    Array.from(files).forEach(file => {
      if (uploadedPhotos.length >= maxFiles) {
        showToast('Maximum 5 photos autorisées', 'warning');
        return;
      }
      if (file.size > maxSize) {
        showToast('Photo trop volumineuse (max 5MB)', 'warning');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Seules les images sont acceptées', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedPhotos.push(e.target.result);
        renderPhotoPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoPreview() {
    if (!photoPreviewGrid) return;
    photoPreviewGrid.innerHTML = uploadedPhotos.map((photo, idx) => `
      <div class="photo-preview-item">
        <img src="${photo}" alt="Preview ${idx+1}" />
        <button type="button" class="remove-photo" data-idx="${idx}" aria-label="Supprimer">&times;</button>
      </div>
    `).join('');

    // Event listeners pour supprimer
    photoPreviewGrid.querySelectorAll('.remove-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        uploadedPhotos.splice(idx, 1);
        renderPhotoPreview();
      });
    });
  }

  // Soumission du formulaire d'avis
  const reviewForm = container.querySelector('#review-form');
  reviewForm && reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (selectedRating === 0) {
      showToast('Veuillez sélectionner une note', 'warning');
      return;
    }
    
    const commentText = container.querySelector('#review-text').value.trim();
    if (!commentText) {
      showToast('Veuillez écrire un commentaire', 'warning');
      return;
    }

    const currentUserName = currentUser ? currentUser.name : 'Client';
    const newReview = {
      user: currentUserName,
      stars: selectedRating,
      comment: commentText,
      photos: [...uploadedPhotos],
      date: new Date().toLocaleDateString('fr-FR'),
      verified: !!currentUser // Vérifié si connecté
    };

    // Ajouter l'avis au produit
    if (!p.reviews) p.reviews = [];
    p.reviews.unshift(newReview);
    
    // Recalculer la note moyenne
    const totalStars = p.reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
    p.rating = (totalStars / p.reviews.length).toFixed(1);
    
    saveStore();
    
    // Reset form
    selectedRating = 0;
    uploadedPhotos = [];
    starInputs.forEach(s => s.classList.remove('active'));
    container.querySelector('#review-text').value = '';
    renderPhotoPreview();
    
    // Mettre à jour la liste des avis
    const reviewsList = container.querySelector('#reviews-list');
    if (reviewsList) {
      reviewsList.innerHTML = renderReviews(p.reviews);
      attachPhotoClickListeners();
    }
    
    // Mettre à jour le résumé
    const avgRating = container.querySelector('.avg-rating');
    const starsDisplay = container.querySelector('.stars-display');
    if (avgRating) avgRating.textContent = p.rating;
    if (starsDisplay) starsDisplay.innerHTML = starsHTML(parseFloat(p.rating));
    
    showToast('Merci pour votre avis !', 'success');
  });

  // Lightbox pour les photos
  function attachPhotoClickListeners() {
    container.querySelectorAll('.review-photo').forEach(el => {
      el.addEventListener('click', () => {
        const photoSrc = el.dataset.photo || el.querySelector('img').src;
        openLightbox(photoSrc);
      });
    });
  }
  attachPhotoClickListeners();

  // Suppression des avis (admin seulement) - utilise délégation d'événements
  if (isAdmin) {
    container.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.review-delete-btn');
      if (!deleteBtn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const idx = parseInt(deleteBtn.dataset.reviewIdx, 10);
      if (isNaN(idx)) return;
      
      if (confirm('Voulez-vous vraiment supprimer cet avis ?')) {
        // Supprimer l'avis
        p.reviews.splice(idx, 1);
        
        // Recalculer la note moyenne
        if (p.reviews.length > 0) {
          const totalStars = p.reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
          p.rating = (totalStars / p.reviews.length).toFixed(1);
        } else {
          p.rating = 0;
        }
        
        saveStore();
        
        // Mettre à jour l'affichage
        const reviewsList = container.querySelector('#reviews-list');
        if (reviewsList) {
          reviewsList.innerHTML = renderReviews(p.reviews);
          attachPhotoClickListeners();
        }
        
        // Mettre à jour le résumé
        const avgRating = container.querySelector('.avg-rating');
        const starsDisplay = container.querySelector('.stars-display');
        const reviewCountEl = container.querySelector('.reviews-summary .text-muted-foreground');
        if (avgRating) avgRating.textContent = p.rating;
        if (starsDisplay) starsDisplay.innerHTML = starsHTML(parseFloat(p.rating));
        if (reviewCountEl) reviewCountEl.textContent = `(${p.reviews.length} avis)`;
        
        showToast('Avis supprimé', 'success');
      }
    });
  }

  function openLightbox(src) {
    // Créer le lightbox s'il n'existe pas
    let lightbox = document.querySelector('.photo-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'photo-lightbox';
      lightbox.innerHTML = `
        <button class="close-lightbox" aria-label="Fermer">&times;</button>
        <img src="" alt="Photo agrandie" />
      `;
      document.body.appendChild(lightbox);
      
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('close-lightbox')) {
          lightbox.classList.remove('active');
        }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
          lightbox.classList.remove('active');
        }
      });
    }
    
    lightbox.querySelector('img').src = src;
    lightbox.classList.add('active');
  }

  // Vignettes: changement d’image
  container.querySelectorAll('[data-thumb]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectedImage = parseInt(btn.getAttribute('data-thumb'),10);
      container.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      container.querySelector('.product-main img').src = images[selectedImage];
    });
  });

  // Variantes: sélection
  container.querySelectorAll('[data-variant]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectedVariant = btn.getAttribute('data-variant');
      container.querySelectorAll('.variant-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Quantité +/- (bornée par stock)
  const qtyVal = container.querySelector('#qty-val');
  container.querySelector('#qty-minus').addEventListener('click', ()=>{
    quantity = Math.max(1, quantity-1); qtyVal.textContent = quantity;
  });
  container.querySelector('#qty-plus').addEventListener('click', ()=>{
    quantity = Math.min(p.stock||1, quantity+1); qtyVal.textContent = quantity;
  });

  // Ajouter au panier
  const addBtn = container.querySelector('#add-cart');
  addBtn && addBtn.addEventListener('click', ()=>{
    if(p.stock===0) return showToast('Article indisponible','warning');
    addToCart(p.id, quantity);
    addBtn.disabled = true;
    addBtn.innerHTML = '<i data-lucide="check" class="lucide-icon lucide-sm"></i><span>Dans le panier</span>';
    // Reinit Lucide for new icon
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Wishlist toggle
  const wlBtn = container.querySelector('#toggle-wl');
  wlBtn && wlBtn.addEventListener('click', ()=>{
    toggleWishlist(p.id);
    const isWl = isInWishlist(p.id);
    wlBtn.classList.toggle('btn-bordeaux', isWl);
    wlBtn.classList.toggle('btn-outline-dark', !isWl);
    wlBtn.classList.toggle('active', isWl);
    // Update heart icon fill
    const heartIcon = wlBtn.querySelector('.heart-icon');
    if (heartIcon) {
      heartIcon.classList.toggle('filled', isWl);
    }
    // update aria-pressed for accessibility
    wlBtn.setAttribute('aria-pressed', isWl ? 'true' : 'false');
    // Pulse animation
    wlBtn.classList.add('pulse');
    setTimeout(() => wlBtn.classList.remove('pulse'), 400);
  });

  // Partage (copie URL)
  const shareBtn = container.querySelector('#share-btn');
  shareBtn && shareBtn.addEventListener('click', ()=>{
    copyToClipboard(location.href);
  });

  // Initialize Lucide icons for product page
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Produits similaires (déjà prévu dans product.html)
  const similar = Store.products
    .filter(x => x.category===p.category && x.id!==p.id && !x.hidden)
    .slice(0,4);
  const simEl = document.getElementById('similar-list');
  if(simEl) simEl.innerHTML = similar.map(cardProduct).join('');
});
