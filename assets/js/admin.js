
// Dashboard admin (création/gestion boutiques, rôles, expiration, skip)
window.addEventListener('DOMContentLoaded', ()=>{
  const user = JSON.parse(localStorage.getItem('ac_currentUser')||'null');
  const guard = document.getElementById('admin-guard');
  const dash = document.getElementById('admin-dashboard');
  if(!user || user.role!=='superadmin'){
    if(guard) guard.classList.remove('hidden');
    if(dash) dash.classList.add('hidden');
    return;
  }
  if(guard) guard.classList.add('hidden');
  if(dash) dash.classList.remove('hidden');

  // === Créer un compte vendeur ===
  const createSellerForm = document.getElementById('create-seller-form');
  if(createSellerForm){
    createSellerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(createSellerForm);
      const name = fd.get('name')?.trim();
      const email = fd.get('email')?.trim();
      const phone = fd.get('phone')?.trim();
      const password = fd.get('password')?.trim();

      // Validation
      if(!name || !email || !phone || !password){
        showToast('Tous les champs sont obligatoires', 'warning');
        return;
      }

      // Vérifier que l'email n'existe pas déjà
      const exists = Store.users.some(u => (u.email||'').toLowerCase() === email.toLowerCase());
      if(exists){
        showToast('Un compte avec cet email existe déjà', 'danger');
        return;
      }

      // Créer le compte vendeur
      const newSeller = {
        id: 'user-'+Date.now(),
        email: email,
        password: password,
        name: name,
        phone: phone,
        role: 'seller',
        createdAt: Date.now(),
      };

      Store.users.push(newSeller);
      saveStore();

      showToast(`Compte vendeur "${name}" créé avec succès!`, 'success');
      createSellerForm.reset();
    });
  }

  // === Gestion des catégories ===
  const categorySelect = document.getElementById('shop-category-select');
  const categoryIconPreview = document.getElementById('cat-icon-preview');
  const categoryError = document.getElementById('category-error');
  const filterShopCategory = document.getElementById('filter-shop-category');
  const filterShopStatus = document.getElementById('filter-shop-status');

  // Récupérer les catégories actives (non désactivées)
  function getActiveCategories() {
    return (Store.shopCategories || []).filter(cat => 
      !(Store.disabledCategories || []).includes(cat.id)
    );
  }

  // Peupler le select des catégories avec icônes Lucide
  function populateCategorySelect() {
    if (!categorySelect) return;
    const activeCategories = getActiveCategories();
    categorySelect.innerHTML = '<option value="">— Sélectionner une catégorie —</option>';
    activeCategories.forEach(cat => {
      categorySelect.innerHTML += `<option value="${cat.id}" data-icon="${cat.lucideIcon || 'shopping-bag'}" data-emoji="${cat.icon}">${cat.icon} ${cat.name}</option>`;
    });
  }
  populateCategorySelect();

  // Peupler le filtre par catégorie
  function populateFilterCategory() {
    if (!filterShopCategory) return;
    filterShopCategory.innerHTML = '<option value="">Toutes les catégories</option>';
    (Store.shopCategories || []).forEach(cat => {
      filterShopCategory.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
    });
  }
  populateFilterCategory();

  // Mise à jour de l'icône preview lors du changement de catégorie (utilise Lucide)
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      const selectedOption = categorySelect.options[categorySelect.selectedIndex];
      const lucideIcon = selectedOption?.dataset?.icon || 'shopping-bag';
      const emoji = selectedOption?.dataset?.emoji || '🛍️';
      
      // Afficher icône Lucide dans le preview
      if (categoryIconPreview) {
        categoryIconPreview.innerHTML = `<i data-lucide="${lucideIcon}" aria-hidden="true"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
      
      // Masquer l'erreur si une catégorie est sélectionnée
      if (categoryError && categorySelect.value) {
        categoryError.classList.add('hidden');
        categorySelect.classList.remove('input-error');
      }
    });
  }

  // Obtenir une catégorie par son ID
  function getCategoryById(catId) {
    return (Store.shopCategories || []).find(c => c.id === catId);
  }

  const form = document.getElementById('shop-form');
  if(form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(form);
      
      // Validation catégorie obligatoire
      const categoryId = fd.get('categoryId');
      if (!categoryId) {
        if (categoryError) {
          categoryError.classList.remove('hidden');
          categorySelect.classList.add('input-error');
        }
        showToast('Veuillez sélectionner une catégorie pour la boutique', 'warning');
        return;
      }

      // Vérifier que la catégorie n'est pas désactivée
      if ((Store.disabledCategories || []).includes(categoryId)) {
        showToast('Cette catégorie est actuellement désactivée', 'danger');
        return;
      }

      const category = getCategoryById(categoryId);
      const durationDays = parseInt(fd.get('duration'));
      const start = Date.now();
      const shop = {
        id: (fd.get('name')||'').toLowerCase().replace(/\s+/g,'-'),
        name: fd.get('name'),
        description: fd.get('description'),
        categoryId: categoryId,
        category: category ? category.name : 'Général',
        categoryIcon: category ? category.icon : '🛍️',
        ownerEmail: fd.get('ownerEmail'),
        startDate: start,
        endDate: start + durationDays*86400000,
        itemLimit: parseInt(fd.get('itemLimit')||'50'),
        status: 'active'
      };
      Store.shops.push(shop); 
      saveStore(); 
      showToast(`Boutique "${shop.name}" créée dans ${category?.icon || ''} ${category?.name || 'Général'}`, 'success'); 
      form.reset();
      if (categoryIconPreview) categoryIconPreview.textContent = '🛍️';
      renderShops();
    });
  }

  // Boutique sélectionnée pour les actions
  let selectedShopId = null;

  function renderShops(){
    const container = document.getElementById('admin-shops');
    if(!container) return;
    
    // Filtres
    const filterCat = filterShopCategory?.value || '';
    const filterStatus = filterShopStatus?.value || '';
    
    let filteredShops = Store.shops.filter(s => {
      if (filterCat && s.categoryId !== filterCat) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });

    if (filteredShops.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Aucune boutique trouvée</p></div>';
      return;
    }

    container.innerHTML = filteredShops.map(s=>{
      const remaining = Math.max(0, s.endDate - Date.now());
      const days = Math.ceil(remaining/86400000);
      const category = getCategoryById(s.categoryId);
      const isSelected = selectedShopId === s.id;
      const statusClass = s.status === 'active' ? 'status-active' : 
                          s.status === 'suspended' ? 'status-suspended' : 'status-blocked';
      
      return `<div class="shop-card ${isSelected ? 'selected' : ''}" data-shop-id="${s.id}">
        <div class="shop-card-header">
          <span class="shop-category-badge">
            <span class="cat-icon">${s.categoryIcon || category?.icon || '🛍️'}</span>
            ${s.category || category?.name || 'Non classé'}
          </span>
          <span class="shop-status ${statusClass}">${s.status}</span>
        </div>
        <h4 class="shop-name">${s.name}</h4>
        <p class="shop-desc">${s.description || '<em>Pas de description</em>'}</p>
        <div class="shop-meta">
          <span><i data-lucide="mail"></i> ${s.ownerEmail}</span>
          <span><i data-lucide="package"></i> ${s.itemLimit} articles max</span>
          <span><i data-lucide="clock"></i> ${days} jours restants</span>
        </div>
        <div class="shop-actions">
          <button class="btn btn-sm" data-change-cat="${s.id}">
            <i data-lucide="folder-edit"></i> Changer catégorie
          </button>
          <button class="btn btn-sm btn-warning" data-suspend="${s.id}" ${s.status === 'suspended' ? 'disabled' : ''}>
            <i data-lucide="pause-circle"></i> Suspendre
          </button>
          <button class="btn btn-sm btn-success" data-reactivate="${s.id}" ${s.status === 'active' ? 'disabled' : ''}>
            <i data-lucide="play-circle"></i> Réactiver
          </button>
        </div>
      </div>`;
    }).join('');
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderShops();

  // Événements de filtrage
  if (filterShopCategory) filterShopCategory.addEventListener('change', renderShops);
  if (filterShopStatus) filterShopStatus.addEventListener('change', renderShops);

  // Délégation pour les actions boutique
  const shopsContainer = document.getElementById('admin-shops');
  if (shopsContainer) {
    shopsContainer.addEventListener('click', (ev) => {
      // Sélection de boutique
      const shopCard = ev.target.closest('.shop-card');
      if (shopCard && !ev.target.closest('button')) {
        const shopId = shopCard.dataset.shopId;
        selectedShopId = selectedShopId === shopId ? null : shopId;
        renderShops();
        return;
      }

      // Changer catégorie
      const changeCatBtn = ev.target.closest('[data-change-cat]');
      if (changeCatBtn) {
        const shopId = changeCatBtn.getAttribute('data-change-cat');
        showChangeCategoryModal(shopId);
        return;
      }

      // Suspendre
      const suspendBtn = ev.target.closest('[data-suspend]');
      if (suspendBtn) {
        const shopId = suspendBtn.getAttribute('data-suspend');
        suspendShop(shopId, 'Catégorie incorrecte');
        return;
      }

      // Réactiver
      const reactivateBtn = ev.target.closest('[data-reactivate]');
      if (reactivateBtn) {
        const shopId = reactivateBtn.getAttribute('data-reactivate');
        reactivateShop(shopId);
        return;
      }
    });
  }

  // Modal pour changer de catégorie
  function showChangeCategoryModal(shopId) {
    const shop = Store.shops.find(s => s.id === shopId);
    if (!shop) return;
    
    const activeCategories = getActiveCategories();
    const options = activeCategories.map(cat => 
      `<option value="${cat.id}" ${cat.id === shop.categoryId ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
    ).join('');
    
    const modalHtml = `
      <div class="modal-overlay" id="change-cat-modal">
        <div class="modal-content">
          <h3>Changer la catégorie</h3>
          <p>Boutique: <strong>${shop.name}</strong></p>
          <div class="form-group">
            <label class="form-label">Nouvelle catégorie</label>
            <select class="input category-select" id="new-category-select">
              ${options}
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn" id="modal-cancel">Annuler</button>
            <button class="btn btn-gold" id="modal-confirm">Confirmer</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('modal-cancel').addEventListener('click', () => {
      document.getElementById('change-cat-modal').remove();
    });
    
    document.getElementById('modal-confirm').addEventListener('click', () => {
      const newCatId = document.getElementById('new-category-select').value;
      changeShopCategory(shopId, newCatId);
      document.getElementById('change-cat-modal').remove();
    });
  }

  // Changer la catégorie d'une boutique
  function changeShopCategory(shopId, newCategoryId) {
    const shop = Store.shops.find(s => s.id === shopId);
    if (!shop) return;
    
    const newCategory = getCategoryById(newCategoryId);
    if (!newCategory) return;
    
    const oldCategory = shop.category;
    shop.categoryId = newCategoryId;
    shop.category = newCategory.name;
    shop.categoryIcon = newCategory.icon;
    
    // Mettre à jour tous les produits de la boutique pour hériter de la nouvelle catégorie
    Store.products.filter(p => p.shopId === shopId).forEach(p => {
      p.category = newCategory.name;
    });
    
    saveStore();
    showToast(`Catégorie changée: ${oldCategory} → ${newCategory.icon} ${newCategory.name}`, 'success');
    renderShops();
  }

  // Suspendre une boutique pour catégorie incorrecte
  function suspendShop(shopId, reason) {
    const shop = Store.shops.find(s => s.id === shopId);
    if (!shop) return;
    
    shop.status = 'suspended';
    shop.suspendReason = reason;
    shop.suspendDate = Date.now();
    
    // Masquer les produits
    Store.products.filter(p => p.shopId === shopId).forEach(p => p.hidden = true);
    
    // Notification
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    notifs.push({
      type: 'shop_suspended',
      email: shop.ownerEmail,
      shop: shopId,
      reason: reason,
      date: Date.now()
    });
    localStorage.setItem('ac_notifications', JSON.stringify(notifs));
    
    saveStore();
    showToast(`Boutique "${shop.name}" suspendue: ${reason}`, 'warning');
    renderShops();
  }

  // Réactiver une boutique
  function reactivateShop(shopId) {
    const shop = Store.shops.find(s => s.id === shopId);
    if (!shop) return;
    
    shop.status = 'active';
    delete shop.suspendReason;
    delete shop.suspendDate;
    
    // Réafficher les produits
    Store.products.filter(p => p.shopId === shopId).forEach(p => p.hidden = false);
    
    saveStore();
    showToast(`Boutique "${shop.name}" réactivée`, 'success');
    renderShops();
  }

  // === Gestion des catégories (activation/désactivation) ===
  function renderCategoriesManagement() {
    const container = document.getElementById('categories-management');
    if (!container) return;
    
    container.innerHTML = (Store.shopCategories || []).map(cat => {
      const isDisabled = (Store.disabledCategories || []).includes(cat.id);
      const shopsInCategory = Store.shops.filter(s => s.categoryId === cat.id).length;
      
      return `<div class="category-manage-card ${isDisabled ? 'disabled' : ''}">
        <div class="category-manage-header">
          <span class="category-manage-icon">${cat.icon}</span>
          <h4>${cat.name}</h4>
        </div>
        <p class="category-manage-stats">${shopsInCategory} boutique(s)</p>
        <div class="category-manage-actions">
          ${isDisabled ? 
            `<button class="btn btn-sm btn-success" data-enable-cat="${cat.id}">
              <i data-lucide="check-circle"></i> Activer
            </button>` :
            `<button class="btn btn-sm btn-warning" data-disable-cat="${cat.id}" ${shopsInCategory > 0 ? '' : ''}>
              <i data-lucide="x-circle"></i> Désactiver
            </button>`
          }
        </div>
      </div>`;
    }).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderCategoriesManagement();

  // Délégation pour gestion des catégories
  const catContainer = document.getElementById('categories-management');
  if (catContainer) {
    catContainer.addEventListener('click', (ev) => {
      const enableBtn = ev.target.closest('[data-enable-cat]');
      if (enableBtn) {
        const catId = enableBtn.getAttribute('data-enable-cat');
        enableCategory(catId);
        return;
      }
      
      const disableBtn = ev.target.closest('[data-disable-cat]');
      if (disableBtn) {
        const catId = disableBtn.getAttribute('data-disable-cat');
        disableCategory(catId);
        return;
      }
    });
  }

  function enableCategory(catId) {
    Store.disabledCategories = (Store.disabledCategories || []).filter(id => id !== catId);
    localStorage.setItem('ac_disabled_categories', JSON.stringify(Store.disabledCategories));
    const cat = getCategoryById(catId);
    showToast(`Catégorie "${cat?.name}" activée`, 'success');
    populateCategorySelect();
    renderCategoriesManagement();
  }

  function disableCategory(catId) {
    const shopsInCategory = Store.shops.filter(s => s.categoryId === catId && s.status === 'active').length;
    if (shopsInCategory > 0) {
      if (!confirm(`Attention: ${shopsInCategory} boutique(s) active(s) dans cette catégorie. Elles resteront visibles. Continuer?`)) {
        return;
      }
    }
    
    if (!Store.disabledCategories) Store.disabledCategories = [];
    if (!Store.disabledCategories.includes(catId)) {
      Store.disabledCategories.push(catId);
    }
    localStorage.setItem('ac_disabled_categories', JSON.stringify(Store.disabledCategories));
    const cat = getCategoryById(catId);
    showToast(`Catégorie "${cat?.name}" désactivée (nouvelles boutiques impossibles)`, 'warning');
    populateCategorySelect();
    renderCategoriesManagement();
  }

  // Expiration automatique (tâche côté client pour démo)
  setInterval(()=>{
    let changed=false;
    Store.shops.forEach(s=>{
      if(s.status==='active' && Date.now()>s.endDate){
        s.status='blocked';
        // Masquer produits
        Store.products.filter(p=>p.shopId===s.id).forEach(p=> p.hidden=true);
        // Notification au propriétaire (simulée)
        const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
        notifs.push({type:'shop_expired', email:s.ownerEmail, shop:s.id, date:Date.now()});
        localStorage.setItem('ac_notifications', JSON.stringify(notifs));
        changed=true;
      }
    });
    if(changed){ saveStore(); renderShops(); showToast('Certaines boutiques ont expiré et ont été bloquées','warning'); }
  }, 5000);

  // SAUTER LA BOUTIQUE
  document.getElementById('skip-shop-btn').addEventListener('click', ()=>{
    const sel = Store.shops[0]; // Démo: prendre la première boutique, à brancher avec sélection UI
    if(!sel) return showToast('Aucune boutique','warning');
    sel.status='disabled';
    // Masquer produits et backup
    const affected = Store.products.filter(p=>p.shopId===sel.id);
    affected.forEach(p=> p.hidden=true);
    const backups = JSON.parse(localStorage.getItem('ac_backups')||'[]');
    backups.push({shop: sel, products: affected, date: Date.now()});
    localStorage.setItem('ac_backups', JSON.stringify(backups));
    // Notification
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    notifs.push({type:'shop_skipped', email:sel.ownerEmail, shop:sel.id, date:Date.now()});
    localStorage.setItem('ac_notifications', JSON.stringify(notifs));
    saveStore(); renderShops(); showToast('Boutique désactivée et produits masqués','danger');
  });

  // Gestion des comptes (liste, bannir/restaurer)
  const usersDiv = document.getElementById('admin-users');
  function renderUsers(){
    if(!usersDiv) return;
    usersDiv.innerHTML = Store.users.map(u=>`<div class="card"><div class="info">${u.name} — ${u.email} — Rôle: ${u.role}
      <div class="mt-2">
        <button class="btn" data-ban="${u.email}">Bannir</button>
        <button class="btn" data-restore="${u.email}">Restaurer</button>
      </div>
    </div></div>`).join('');
  }
  renderUsers();

  function banUser(email){
    const u = Store.users.find(x=>x.email===email); if(!u) return;
    u.banned = true; saveStore(); showToast('Utilisateur banni','danger');
  }
  function restoreUser(email){
    const u = Store.users.find(x=>x.email===email); if(!u) return;
    u.banned = false; saveStore(); showToast('Compte restauré','success');
  }

  // Délégation sur usersDiv
  if(usersDiv){
    usersDiv.addEventListener('click', (ev)=>{
      const bBan = ev.target.closest('[data-ban]');
      if(bBan){ banUser(bBan.getAttribute('data-ban')); renderUsers(); return; }
      const bRestore = ev.target.closest('[data-restore]');
      if(bRestore){ restoreUser(bRestore.getAttribute('data-restore')); renderUsers(); return; }
    });
  }

  // Stats globales
  const statsDiv = document.getElementById('admin-stats');
  const totalSales = Store.products.reduce((a,b)=>a+b.sales,0);
  const totalViews = Store.products.reduce((a,b)=>a+b.views,0);
  statsDiv.innerHTML = `<div class="card"><div class="info">Ventes totales: ${totalSales} · Vues totales: ${totalViews} · Boutiques: ${Store.shops.length}</div></div>`;

  // === Affichage des notifications ===
  const notifsDiv = document.getElementById('admin-notifications');
  function renderNotifications(){
    if(!notifsDiv) return;
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    
    if(notifs.length === 0){
      notifsDiv.innerHTML = '<p class="text-muted">Aucune notification pour le moment</p>';
      return;
    }

    // Trier par date (plus récentes en premier)
    notifs.sort((a, b) => b.date - a.date);

    notifsDiv.innerHTML = notifs.map(notif => {
      const date = new Date(notif.date).toLocaleString('fr-FR');
      let message = '';
      let iconName = 'bell';
      let bgColor = '#f0f0f0';

      if(notif.type === 'shop_request'){
        iconName = 'store';
        bgColor = '#fff3cd';
        message = `<strong>Demande de boutique</strong><br>Email: ${notif.email}`;
      } else if(notif.type === 'newsletter'){
        iconName = 'mail';
        bgColor = '#d1ecf1';
        message = `<strong>Inscription newsletter</strong><br>Email: ${notif.email}`;
      } else if(notif.type === 'shop_suspended'){
        iconName = 'alert-circle';
        bgColor = '#f8d7da';
        message = `<strong>Boutique suspendue</strong><br>Boutique: ${notif.shop}<br>Raison: ${notif.reason}`;
      } else if(notif.type === 'shop_disabled'){
        iconName = 'x-circle';
        bgColor = '#f8d7da';
        message = `<strong>Boutique désactivée</strong><br>Boutique: ${notif.shop}<br>Raison: ${notif.reason || 'Non spécifié'}`;
      } else {
        message = JSON.stringify(notif);
      }

      return `
        <div class="card" style="background: ${bgColor}; border-left: 4px solid var(--gold);">
          <div class="info">
            <div style="display: flex; align-items: start; gap: 12px;">
              <i data-lucide="${iconName}" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 4px;"></i>
              <div style="flex: 1;">
                <div style="margin-bottom: 8px;">${message}</div>
                <div class="text-muted" style="font-size: 0.875rem;">${date}</div>
              </div>
            </div>
            <button class="btn btn-sm" data-clear-notif="${notif.date}" style="margin-top: 8px;">
              <i data-lucide="check"></i> Marquer comme lu
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Réinitialiser les icônes Lucide après le rendu
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderNotifications();

  // Supprimer une notification
  if(notifsDiv){
    notifsDiv.addEventListener('click', (ev)=>{
      const clearBtn = ev.target.closest('[data-clear-notif]');
      if(clearBtn){
        const notifDate = parseInt(clearBtn.getAttribute('data-clear-notif'));
        const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
        const filtered = notifs.filter(n => n.date !== notifDate);
        localStorage.setItem('ac_notifications', JSON.stringify(filtered));
        showToast('Notification marquée comme lue', 'success');
        renderNotifications();
      }
    });
  }
  
  // === Gestion des factures ===
  const invoicesDiv = document.getElementById('admin-invoices');

  function ensureInvoices(){
    if(!Array.isArray(Store.invoices)) Store.invoices = [];
  }

  function invoiceStatusPill(status){
    const map = {
      submitted: { label: 'En attente', cls: 'pill-warning' },
      validated: { label: 'Validée', cls: 'pill-success' },
      rejected: { label: 'Rejetée', cls: 'pill-danger' },
      edited: { label: 'Modifiée', cls: 'pill-info' }
    };
    const s = map[status] || map.submitted;
    return `<span class="invoice-status ${s.cls}">${s.label}</span>`;
  }

  function sendSellerInvoiceNotification(inv, status){
    if(!inv.sellerEmail) return;
    const sellerNotifsKey = `seller_notifs_${(inv.sellerEmail||'').toLowerCase()}`;
    const list = JSON.parse(localStorage.getItem(sellerNotifsKey)||'[]');
    list.push({
      type: status === 'validated' ? 'invoice_validated' : 'invoice_rejected',
      ref: inv.reference,
      client: { name: inv.clientName, email: inv.clientEmail, phone: inv.clientPhone },
      amount: inv.amount,
      status,
      adminNote: inv.adminNote || '',
      date: Date.now()
    });
    localStorage.setItem(sellerNotifsKey, JSON.stringify(list));
  }

  function logEmailSimulation(inv, status){
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    notifs.push({
      type: 'email_invoice_status',
      status,
      ref: inv.reference,
      seller: inv.sellerEmail,
      client: { name: inv.clientName, email: inv.clientEmail, phone: inv.clientPhone },
      date: Date.now()
    });
    localStorage.setItem('ac_notifications', JSON.stringify(notifs));
  }

  function updateInvoiceStatus(id, status, note = ''){
    ensureInvoices();
    const inv = Store.invoices.find(x=>x.id===id);
    if(!inv) return;
    inv.status = status;
    inv.adminNote = note || inv.adminNote || '';
    inv.updatedAt = Date.now();
    if(status === 'validated') inv.validatedAt = Date.now();
    if(status === 'rejected') inv.rejectedAt = Date.now();
    saveStore();
    sendSellerInvoiceNotification(inv, status);
    logEmailSimulation(inv, status);
    renderInvoices();
    showToast(`Facture INV-${inv.reference} ${status === 'validated' ? 'validée' : status === 'rejected' ? 'rejetée' : 'mise à jour'}`, status === 'validated' ? 'success' : status === 'rejected' ? 'danger' : 'info');
  }

  function openInvoiceEditModal(inv){
    const modalHtml = `
      <div class="modal-overlay" id="invoice-edit-modal">
        <div class="modal-content">
          <h3>Modifier la facture INV-${inv.reference}</h3>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="input" id="inv-edit-desc" rows="3">${inv.serviceDescription || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Montant (FCFA)</label>
              <input class="input" id="inv-edit-amount" type="number" min="0" value="${inv.amount || 0}" />
            </div>
            <div class="form-group">
              <label class="form-label">Mode de paiement</label>
              <select class="input" id="inv-edit-payment">
                <option value="Orange Money" ${inv.paymentMethod==='Orange Money'?'selected':''}>Orange Money</option>
                <option value="Moov Money" ${inv.paymentMethod==='Moov Money'?'selected':''}>Moov Money</option>
                <option value="Wave" ${inv.paymentMethod==='Wave'?'selected':''}>Wave</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="input" id="inv-edit-date" type="date" value="${inv.date ? inv.date.substring(0,10) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Note admin (visible dans la notification)</label>
            <textarea class="input" id="inv-edit-note" rows="2">${inv.adminNote || ''}</textarea>
          </div>
          <div class="modal-actions">
            <button class="btn" id="invoice-edit-cancel">Annuler</button>
            <button class="btn btn-gold" id="invoice-edit-save">Enregistrer</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('invoice-edit-modal');
    const descInput = document.getElementById('inv-edit-desc');
    const amountInput = document.getElementById('inv-edit-amount');
    const paymentSelect = document.getElementById('inv-edit-payment');
    const dateInput = document.getElementById('inv-edit-date');
    const noteInput = document.getElementById('inv-edit-note');

    document.getElementById('invoice-edit-cancel').onclick = ()=> modal.remove();
    document.getElementById('invoice-edit-save').onclick = ()=>{
      inv.serviceDescription = (descInput.value || '').trim();
      inv.amount = Number(amountInput.value) || inv.amount;
      inv.paymentMethod = paymentSelect.value || inv.paymentMethod;
      inv.date = dateInput.value ? new Date(dateInput.value).toISOString() : inv.date;
      inv.adminNote = (noteInput.value || '').trim();
      inv.status = 'edited';
      inv.updatedAt = Date.now();
      saveStore();
      renderInvoices();
      showToast('Facture mise à jour', 'success');
      modal.remove();
    };
  }

  function renderInvoices(){
    if(!invoicesDiv) return;
    ensureInvoices();
    if(Store.invoices.length === 0){
      invoicesDiv.innerHTML = '<div class="empty-state"><p class="text-muted">Aucune facture soumise pour le moment</p></div>';
      return;
    }

    const sorted = [...Store.invoices].sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    invoicesDiv.innerHTML = `
      <div class="invoice-admin-grid">
        ${sorted.map(inv=>{
          const dateStr = new Date(inv.date || inv.createdAt || Date.now()).toLocaleDateString('fr-FR');
          const amountStr = new Intl.NumberFormat('fr-FR').format(inv.amount || 0);
          return `
            <div class="invoice-admin-card" data-invoice-id="${inv.id}">
              <div class="invoice-admin-header">
                <div>
                  <div class="invoice-ref">INV-${inv.reference}</div>
                  <div class="text-muted">${dateStr}</div>
                </div>
                ${invoiceStatusPill(inv.status)}
              </div>
              <div class="invoice-admin-meta">
                <span><i data-lucide="user"></i> ${inv.clientName}</span>
                <span><i data-lucide="mail"></i> ${inv.clientEmail}</span>
                <span><i data-lucide="phone"></i> ${inv.clientPhone}</span>
                ${inv.sellerEmail ? `<span><i data-lucide="store"></i> Vendeur: ${inv.sellerEmail}</span>` : ''}
              </div>
              <div class="invoice-admin-body">
                <div class="text-muted">${inv.serviceDescription || '—'}</div>
                <div class="invoice-admin-amount">${amountStr} FCFA · ${inv.paymentMethod}</div>
              </div>
              <div class="invoice-admin-actions">
                <button class="btn btn-success btn-sm" data-validate="${inv.id}"><i data-lucide="check"></i> Valider</button>
                <button class="btn btn-warning btn-sm" data-edit="${inv.id}"><i data-lucide="pencil"></i> Modifier</button>
                <button class="btn btn-danger btn-sm" data-reject="${inv.id}"><i data-lucide="x"></i> Rejeter</button>
              </div>
              <div class="invoice-admin-note text-muted">${inv.adminNote ? `Note admin: ${inv.adminNote}` : 'Aucune note'}</div>
            </div>`;
        }).join('')}
      </div>`;

    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderInvoices();

  if(invoicesDiv){
    invoicesDiv.addEventListener('click', (ev)=>{
      const validateBtn = ev.target.closest('[data-validate]');
      const rejectBtn = ev.target.closest('[data-reject]');
      const editBtn = ev.target.closest('[data-edit]');
      if(!validateBtn && !rejectBtn && !editBtn) return;
      const id = validateBtn?.getAttribute('data-validate') || rejectBtn?.getAttribute('data-reject') || editBtn?.getAttribute('data-edit');
      if(!id) return;
      if(validateBtn){
        const note = prompt('Note à joindre à la validation (optionnel)', 'Facture validée');
        updateInvoiceStatus(id, 'validated', note || '');
      }else if(rejectBtn){
        const note = prompt('Raison du rejet', 'Informations manquantes');
        updateInvoiceStatus(id, 'rejected', note || '');
      }else if(editBtn){
        const inv = (Store.invoices||[]).find(x=>x.id===id);
        if(inv) openInvoiceEditModal(inv);
      }
    });
  }

  // === Gestion des promotions ===
  const promoForm = document.getElementById('promo-form');
  const promosDiv = document.getElementById('admin-promos');

  function renderPromos(){
    if(!promosDiv) return;
    if(!Store.promos || Store.promos.length === 0){
      promosDiv.innerHTML = '<p class="text-muted">Aucune promotion active</p>';
      return;
    }

    promosDiv.innerHTML = Store.promos.map(promo=>{
      const expiresDate = new Date(promo.expires).toLocaleDateString('fr-FR');
      const now = Date.now();
      const isExpired = promo.expires < now;
      const statusClass = isExpired ? 'promo-expired' : 'promo-active';
      const statusLabel = isExpired ? 'Expirée' : 'Active';

      return `
        <div class="promo-card ${statusClass}">
          <div class="promo-info">
            <div class="promo-code">${promo.code}</div>
            <div class="promo-details">
              <span class="promo-percent">${promo.percent}% de réduction</span>
              <span class="promo-expires">Expire le ${expiresDate}</span>
              <span class="promo-status">${statusLabel}</span>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" data-delete-promo="${promo.code}">
            <i data-lucide="trash-2"></i>
            Supprimer
          </button>
        </div>
      `;
    }).join('');

    if(typeof lucide !== 'undefined') lucide.createIcons();
  }
  renderPromos();

  if(promoForm){
    promoForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(promoForm);
      const code = fd.get('code')?.toString()?.trim()?.toUpperCase();
      const percent = parseInt(fd.get('percent'));
      const days = parseInt(fd.get('expires'));

      if(!code || !percent || !days){
        showToast('Tous les champs sont requis', 'warning');
        return;
      }

      const exists = Store.promos.some(p => p.code === code);
      if(exists){
        showToast('Ce code promo existe déjà', 'danger');
        return;
      }

      const newPromo = {
        code: code,
        percent: percent,
        expires: Date.now() + days * 86400000
      };

      Store.promos.push(newPromo);
      saveStore();
      showToast(`Promotion ${code} créée (${percent}%)`, 'success');
      promoForm.reset();
      renderPromos();
    });
  }

  if(promosDiv){
    promosDiv.addEventListener('click', (ev)=>{
      const delBtn = ev.target.closest('[data-delete-promo]');
      if(delBtn){
        const code = delBtn.getAttribute('data-delete-promo');
        Store.promos = Store.promos.filter(p => p.code !== code);
        saveStore();
        showToast(`Promotion ${code} supprimée`, 'warning');
        renderPromos();
      }
    });
  }
});
