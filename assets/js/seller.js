
// Dashboard vendeur
window.addEventListener('DOMContentLoaded', ()=>{
  const user = JSON.parse(localStorage.getItem('ac_currentUser')||'null');
  const guard = document.getElementById('seller-guard');
  const dash = document.getElementById('seller-dashboard');
  if(!user || user.role!=='seller'){
    guard.classList.remove('hidden'); dash.classList.add('hidden');
    return;
  }
  guard.classList.add('hidden'); dash.classList.remove('hidden');

  const shop = Store.shops.find(s=>s.ownerEmail===user.email);
  const meta = document.getElementById('shop-meta');
  if(shop){
    const remaining = Math.max(0, shop.endDate - Date.now());
    const days = Math.ceil(remaining/86400000);
    
    // Récupérer l'info catégorie
    const categoryIcon = shop.categoryIcon || '🛍️';
    const categoryName = shop.category || 'Non classé';
    const statusClass = shop.status === 'active' ? 'status-active' : 
                        shop.status === 'suspended' ? 'status-suspended' : 'status-blocked';
    
    meta.innerHTML = `<div class="shop-info-card">
      <div class="shop-info-header">
        <span class="shop-category-badge large">
          <span class="cat-icon">${categoryIcon}</span>
          ${categoryName}
        </span>
        <span class="shop-status ${statusClass}">${shop.status}</span>
      </div>
      <h3 class="shop-title">${shop.name}</h3>
      <p class="shop-description">${shop.description || '<em>Pas de description</em>'}</p>
      <div class="shop-stats-row">
        <div class="shop-stat">
          <i data-lucide="package"></i>
          <span>${shop.itemLimit} articles max</span>
        </div>
        <div class="shop-stat">
          <i data-lucide="clock"></i>
          <span>Expire dans ${days} jours</span>
        </div>
      </div>
      ${shop.status === 'suspended' ? `
        <div class="shop-alert warning">
          <i data-lucide="alert-triangle"></i>
          <span>Boutique suspendue${shop.suspendReason ? ': ' + shop.suspendReason : ''}. Contactez l'administration.</span>
        </div>
      ` : ''}
    </div>`;
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Gestion avancée des tailles pour Mode & Vêtements
  const fashionTypeRow = document.getElementById('fashion-type-row');
  const fashionItemType = document.getElementById('fashion-item-type');
  const sizeSystemGroup = document.getElementById('size-system-group');
  const sizeSystemSelect = document.getElementById('size-system');
  const sizesDynamic = document.getElementById('sizes-dynamic');
  const sizesDynamicGrid = document.getElementById('sizes-dynamic-grid');

  const SIZE_CONFIG = {
    "Mode & Vetements": {
      clothing: ["XS","S","M","L","XL","XXL","XXXL"],
      shoes: {
        "EU": ["35","36","37","38","39","40","41","42","43","44","45","46"],
        "US Homme": ["6","7","8","9","10","11","12","13"],
        "US Femme": ["5","6","7","8","9","10","11"],
        "UK": ["5","6","7","8","9","10","11"],
        "Enfants": ["20","21","22","23","24","25","26","27","28","29","30","31","32","33","34"]
      }
    },
    "Beauté & Hygiène": ["30ml","50ml","100ml","200ml","500ml"],
    "Electronique": ["16GB","32GB","64GB","128GB","256GB","512GB","1TB"],
    "Maison & Meubles": ["Small","Medium","Large","XL","2XL"],
    "Bâtiment & Quincaillerie": ["1m","2m","3m","5m","10m"],
    "Véhicules": ["Compact","Berline","SUV","4x4","Camion"],
    "Restauration": ["Small","Medium","Large","XL (Family)"]
  };

  const isFashion = shop?.category && shop.category.toLowerCase().includes('mode');

  function renderSizeOptions(options){
    if(!sizesDynamicGrid) return;
    sizesDynamicGrid.innerHTML = options.map(val => `
      <label class="size-checkbox"><input type="checkbox" name="sizes" value="${val}"> ${val}</label>
    `).join('');
  }

  function showSizes(options){
    if(!sizesDynamic) return;
    renderSizeOptions(options || []);
    sizesDynamic.classList.toggle('hidden', !options || options.length===0);
    // reset selections
    sizesDynamic.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false);
  }

  function handleFashionSelection(){
    if(!isFashion){
      if(fashionTypeRow) fashionTypeRow.classList.add('hidden');
      showSizes([]);
      return;
    }
    if(fashionTypeRow) fashionTypeRow.classList.remove('hidden');

    const itemType = fashionItemType.value;
    if(itemType === 'clothing'){
      if(sizeSystemGroup) sizeSystemGroup.classList.add('hidden');
      const sizes = SIZE_CONFIG["Mode & Vetements"].clothing;
      showSizes(sizes);
    }else if(itemType === 'shoes'){
      if(sizeSystemGroup) sizeSystemGroup.classList.remove('hidden');
      const system = sizeSystemSelect.value || 'EU';
      const sizes = SIZE_CONFIG["Mode & Vetements"].shoes[system] || [];
      showSizes(sizes);
    }else{
      if(sizeSystemGroup) sizeSystemGroup.classList.add('hidden');
      showSizes([]);
    }
  }

  if(fashionItemType){
    fashionItemType.addEventListener('change', handleFashionSelection);
  }
  if(sizeSystemSelect){
    sizeSystemSelect.addEventListener('change', handleFashionSelection);
  }

  function updateSizesVisibility(){
    handleFashionSelection();
  }

  // Initialisation de l'affichage des tailles
  updateSizesVisibility();

  function getSelectedSizes() {
    // Si la boutique n'est pas Mode & Vetements, on ignore les tailles
    if(!isFashion){
      return { type: 'none', system: null, sizes: [], itemType: null };
    }

    const itemType = fashionItemType ? fashionItemType.value : '';
    if(!itemType){
      return { type: 'invalid', message: 'Choisissez le type d\'article (Vêtements ou Chaussures)' };
    }

    if(itemType === 'clothing'){
      const options = SIZE_CONFIG["Mode & Vetements"].clothing;
      const checked = sizesDynamic?.querySelectorAll('input[type="checkbox"]:checked') || [];
      const sizes = Array.from(checked).map(cb=>cb.value).filter(v=>options.includes(v));
      if(sizes.length===0) return { type: 'invalid', message: 'Sélectionnez au moins une taille de vêtement' };
      return { type: 'clothing', system: null, sizes, itemType };
    }

    if(itemType === 'shoes'){
      const system = sizeSystemSelect ? sizeSystemSelect.value : 'EU';
      const options = (SIZE_CONFIG["Mode & Vetements"].shoes[system]) || [];
      const checked = sizesDynamic?.querySelectorAll('input[type="checkbox"]:checked') || [];
      const sizes = Array.from(checked).map(cb=>cb.value).filter(v=>options.includes(v));
      if(sizes.length===0) return { type: 'invalid', message: 'Sélectionnez au moins une pointure' };
      return { type: 'shoes', system, sizes, itemType };
    }

    return { type: 'invalid', message: 'Type d\'article non reconnu' };
  }

  // Formulaire produit
  const form = document.getElementById('product-form');
  if(form){
    form.addEventListener('submit', async e=>{
      e.preventDefault();
      if(!shop || shop.status!=='active') return showToast('Boutique inactive','danger');
      
      const fd = new FormData(form);
      const id = 'P'+(Date.now());
      
      // Récupérer les tailles
      const sizeData = getSelectedSizes();
      if(sizeData.type === 'invalid'){
        return showToast(sizeData.message || 'Tailles invalides', 'warning');
      }
      
      // Créer les variantes basées sur les tailles
      const variants = sizeData.sizes.map(size => ({
        id: 'var-' + size,
        value: size,
        stock: Math.ceil(parseInt(fd.get('stock') || '0') / Math.max(sizeData.sizes.length, 1))
      }));
      
      // Convertir les images en base64 pour le stockage persistant
      const images = [];
      const files = fd.getAll('images');
      
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          if (!file || !file.size) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };
      
      // Convertir toutes les images
      for (const file of files) {
        if (file && file.size) {
          try {
            const base64 = await convertToBase64(file);
            if (base64) images.push(base64);
          } catch (err) {
            console.error('Erreur conversion image:', err);
          }
        }
      }
      
      const prod = {
        id, 
        name: fd.get('name'), 
        price: parseFloat(fd.get('price')), 
        stock: parseInt(fd.get('stock')||'0'),
        color: fd.get('color')||'', 
        sizeType: sizeData.type,
        sizeItemType: sizeData.itemType || null,
        sizeSystem: sizeData.system || null,
        sizes: sizeData.sizes,
        variants: variants,
        size: sizeData.sizes.length > 0 ? sizeData.sizes[0] : '', // Première taille par défaut
        features: fd.get('features')||'', 
        images: images.length ? images : ["assets/img/placeholder-product-1.svg"],
        shopId: shop ? shop.id : null, 
        category: shop ? shop.category : 'Général', 
        rating: 0, 
        reviews: [], 
        views: 0, 
        wishlist: 0, 
        sales: 0
      };
      
      Store.products.push(prod); 
      saveStore(); 
      showToast('Produit publié avec ' + sizeData.sizes.length + ' taille(s)','success'); 
      form.reset();
      updateSizesVisibility(); // Reset l'affichage des tailles
      renderSellerProducts();
    });
  }

  // === Notifications vendeur ===
  const notifsDiv = document.getElementById('seller-notifications');
  function renderSellerNotifications(){
    if(!notifsDiv) return;
    const key = `seller_notifs_${(user.email||'').toLowerCase()}`;
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    if(list.length === 0){
      notifsDiv.innerHTML = '<p class="text-muted">Aucune notification pour le moment</p>';
      return;
    }
    list.sort((a,b)=> b.date - a.date);
    notifsDiv.innerHTML = list.map(n=>{
      const dateStr = new Date(n.date).toLocaleString('fr-FR');
      if(n.type === 'invoice_validated'){
        return `
          <div class="card" style="background:#d4edda">
            <div class="info">
              <div><strong>Facture INV-${n.ref} validée</strong></div>
              <div class="text-muted">Client: ${n.client?.name} · ${n.client?.email} · ${n.client?.phone}</div>
              <div class="mt-2">Montant: ${new Intl.NumberFormat('fr-FR').format(n.amount)} FCFA</div>
              <div class="text-muted" style="margin-top:8px">${dateStr}</div>
            </div>
          </div>
        `;
      }
      if(n.type === 'invoice_rejected'){
        return `
          <div class="card" style="background:#f8d7da">
            <div class="info">
              <div><strong>Facture INV-${n.ref} rejetée</strong></div>
              <div class="text-muted">Raison: ${n.adminNote || 'Non précisée'}</div>
              <div class="text-muted">Client: ${n.client?.name} · ${n.client?.email} · ${n.client?.phone}</div>
              <div class="mt-2">Montant: ${new Intl.NumberFormat('fr-FR').format(n.amount)} FCFA</div>
              <div class="text-muted" style="margin-top:8px">${dateStr}</div>
            </div>
          </div>
        `;
      }
      return `
        <div class="card">
          <div class="info">${JSON.stringify(n)}</div>
        </div>
      `;
    }).join('');
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderSellerNotifications();

  // Upload CSV - helper (local, non-globale)
  function parseCSV(txt){
    const lines = txt.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length===0) return [];
    const headers = lines.shift().split(',').map(h=>h.trim());
    return lines.map(line=>{
      const cols = line.split(','); const obj={};
      headers.forEach((h,i)=> obj[h]=cols[i]);
      return obj;
    });
  }

  const bulkBtn = document.getElementById('bulk-upload-btn');
  if(bulkBtn){
    bulkBtn.addEventListener('click', ()=>{
      const csvInput = document.getElementById('csv-input');
      const file = csvInput && csvInput.files ? csvInput.files[0] : null; if(!file) return showToast('Sélectionnez un CSV','warning');
      const reader = new FileReader();
      reader.onload = ()=>{
        const rows = parseCSV(reader.result || '');
        rows.forEach(r=>{
          const prod = {
            id:'P'+(Date.now()+Math.random()), name:r.name||'Sans nom', price: parseFloat(r.price||'0'), stock: parseInt(r.stock||'0'),
            color: r.color||'', size:r.size||'', features:r.features||'', images:["assets/img/placeholder-product-2.svg"],
            shopId: shop ? shop.id : null, category: r.category|| (shop?shop.category:'Général'), rating:0, reviews:[], views:0, wishlist:0, sales:0
          };
          Store.products.push(prod);
        });
        saveStore(); showToast(`Importé ${rows.length} produits du CSV`,'success'); renderSellerProducts();
      };
      reader.readAsText(file);
    });
  }

  function renderSellerProducts(){
    const table = document.getElementById('seller-products');
    const my = Store.products.filter(p=>p.shopId===shop.id);
    table.innerHTML = `<tr><th>Nom</th><th>Prix</th><th>Stock</th><th>Actions</th></tr>` +
      my.map(p=>`<tr><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td>
        <td>
          <button class="btn btn-dark" onclick="togglePublish('${p.id}')">${p.hidden?'Publier':'Dépublier'}</button>
          <button class="btn" onclick="deleteProduct('${p.id}')">Supprimer</button>
        </td></tr>`).join('');
  }
  renderSellerProducts();

  window.togglePublish = (id)=>{
    const p = Store.products.find(x=>x.id===id); if(!p) return;
    p.hidden = !p.hidden; saveStore(); renderSellerProducts(); showToast(p.hidden?'Produit dépublié':'Produit publié','success');
  };
  window.deleteProduct = (id)=>{
    Store.products = Store.products.filter(x=>x.id!==id); saveStore(); renderSellerProducts(); showToast('Supprimé','warning');
  };

  // Statistiques
  const stats = document.getElementById('seller-stats');
  const my = Store.products.filter(p=>p.shopId===shop.id);
  const views = my.reduce((a,b)=>a+b.views,0), sales = my.reduce((a,b)=>a+b.sales,0), wl = my.reduce((a,b)=>a+b.wishlist,0);
  stats.innerHTML = `<div class="card"><div class="info">Vues: ${views} · Ventes: ${sales} · Wishlist: ${wl}</div></div>`;
});
