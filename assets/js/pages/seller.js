/**
 * seller.js
 * Dashboard vendeur complet : produits, commandes, paramètres, messages
 * Section §19 de prime.js
 */

document.addEventListener('DOMContentLoaded', function() {
  var sdContainer = document.getElementById('sd');
  if (!sdContainer) return;
  
  // Masquer le contenu pendant la vérification d'autorisation
  sdContainer.style.opacity = '0';
  sdContainer.style.pointerEvents = 'none';
  
  // Fonction pour afficher le contenu (appelée après vérification réussie)
  window.sdShowContent = function() {
    sdContainer.style.transition = 'opacity 0.3s ease';
    sdContainer.style.opacity = '1';
    sdContainer.style.pointerEvents = 'auto';
  };

  if (!document.getElementById('sd')) return;

  window.sdSwitchTab = function(name) {
    document.querySelectorAll('#sd .sd-tab').forEach(function(t){ t.classList.remove('on'); });
    document.querySelectorAll('#sd .sd-nav-item[data-tab]').forEach(function(l){ l.classList.remove('on'); });
    var tab  = document.getElementById('sd-tab-'+name);
    if (tab) tab.classList.add('on');
    var link = document.querySelector('#sd .sd-nav-item[data-tab="'+name+'"]');
    if (link) link.classList.add('on');
    var TITLES = { overview:'Vue d\'ensemble', products:'Mes Produits', 'add-product':'Ajouter un produit', orders:'Commandes', settings:'Paramètres', messages:'Messagerie' };
    var el = document.getElementById('sd-topbar-section'); if(el) el.textContent = TITLES[name]||name;
    var sb = document.getElementById('sd-sidebar'); if(sb) sb.classList.remove('open');
  };

  document.querySelectorAll('#sd .sd-nav-item[data-tab]').forEach(function(link) {
    link.addEventListener('click', function(e){ e.preventDefault(); window.sdSwitchTab(link.getAttribute('data-tab')); });
  });

  window.sdLogout = function() {
    if (!confirm('Se déconnecter ?')) return;
    firebase.auth().signOut().then(function(){ window.location.href='/login'; });
  };

  var sdFmt     = function(n){ return new Intl.NumberFormat('fr-FR').format(n); };
  var sdFmtDate = function(ts){ try{ var d=ts?.toDate?ts.toDate():new Date(ts?.seconds?ts.seconds*1000:ts); return d.toLocaleDateString('fr-FR'); }catch{return '';} };

  function sdStatus(status) {
    var s = (status||'').toLowerCase();
    if (s==='pending_admin'||s==='pending')        return { label:'En attente',    cls:'warn' };
    if (s==='pending_seller')                      return { label:'En préparation',cls:'info' };
    if (s==='ready_for_delivery')                  return { label:'En livraison',  cls:'info' };
    if (s==='delivered'||s.includes('livr'))       return { label:'Livré',         cls:'ok'   };
    if (s==='cancelled'||s.includes('annul'))      return { label:'Annulé',        cls:'err'  };
    if (s==='shipped'||s.includes('expéd'))        return { label:'Expédié',       cls:'info' };
    return { label:'En cours', cls:'info' };
  }

  var fpImages = document.getElementById('fp-images');
  if (fpImages) {
    fpImages.addEventListener('change', function() {
      var preview = document.getElementById('sd-img-preview'); if(!preview) return;
      preview.innerHTML = '';
      Array.from(this.files).forEach(function(file) {
        var r = new FileReader();
        r.onload = function(e2) {
          var div = document.createElement('div'); div.className='sd-img-thumb';
          div.innerHTML='<img src="'+e2.target.result+'" alt=""><button class="sd-img-thumb-del" type="button" onclick="this.parentElement.remove()" title="Supprimer">×</button>';
          preview.appendChild(div);
        };
        r.readAsDataURL(file);
      });
    });
  }
  window.sdResetForm = function() { var f=document.getElementById('sd-product-form'); if(f) f.reset(); var p=document.getElementById('sd-img-preview'); if(p) p.innerHTML=''; window.sdSwitchTab('products'); };

  if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
  var db2  = firebase.firestore();
  var auth = firebase.auth();
  var storage = firebase.storage ? firebase.storage() : null;
  var currentShopId = null, currentShopData = null;

  auth.onAuthStateChanged(async function(user) {
    if (!user) { window.location.href='/login'; return; }
    try {
      var snap = await db2.collection('shops').where('ownerEmail','==',user.email).limit(1).get();
      if (snap.empty) { 
        console.warn('[Seller Auth] Aucune boutique trouvée pour:', user.email);
        window.location.href='/403'; 
        return; 
      }
      var doc = snap.docs[0];
      var shopData = Object.assign({ id:doc.id }, doc.data());
      if (shopData.status === 'blocked' || shopData.status === 'suspended') {
        console.warn('[Seller Auth] Boutique bloquée/suspendue:', shopData.id);
        window.location.href='/403?reason=blocked';
        return;
      }
      currentShopId   = doc.id;
      currentShopData = shopData;
      initSdDashboard(user, currentShopData);
    } catch(e){ 
      console.error('[Seller Auth] Erreur chargement boutique:', e); 
      window.location.href='/403?reason=error'; 
    }
  });

  async function initSdDashboard(user, shop) {
    var name = shop.name||'Ma Boutique';
    var setEl= function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
    setEl('sd-shop-name',    name);
    setEl('sd-topbar-shop',  name);
    setEl('sd-shop-initial', name.charAt(0).toUpperCase());
    if (shop.logo) { var img=document.getElementById('sd-shop-logo'); if(img){img.src=shop.logo;img.style.display='block';} var ini=document.getElementById('sd-shop-initial'); if(ini)ini.style.display='none'; }
    if (shop.banner) { var bannerPrev=document.getElementById('sp-banner-preview'); if(bannerPrev) bannerPrev.innerHTML='<div class="sd-img-thumb" style="width:100%;height:120px"><img src="'+shop.banner+'" style="width:100%;height:100%;object-fit:cover"></div>'; }
    var isActive  = shop.status==='active'||shop.status==='Active';
    var statusHtml= '<span class="sd-status-badge '+(isActive?'ok':'warn')+'\">● '+(isActive?'Active':'Inactive')+'</span>';
    ['sd-shop-status-block','sd-shop-status-inline'].forEach(function(id){ var el=document.getElementById(id); if(el) el.innerHTML=statusHtml; });
    setEl('sd-shop-category', shop.category||'—');
    ['name','category','city','phone','description'].forEach(function(k){ var el=document.getElementById('sp-'+k); if(el) el.value=shop[k]||''; });

    // Afficher le contenu après vérification d'autorisation réussie
    if (typeof window.sdShowContent === 'function') {
      window.sdShowContent();
    }

    await Promise.all([sdLoadProducts(), sdLoadOrders(), sdLoadStats()]);
    sdLoadMessages(user);
  }

  async function sdLoadProducts() {
    try {
      var snap = await db2.collection('products').where('shopId','==',currentShopId).get();
      var products = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var badge = document.getElementById('sd-products-badge');
      if (badge) { badge.textContent=products.length; badge.style.display=products.length?'flex':'none'; }
      var tbody = document.getElementById('sd-products-tbody'); if(!tbody) return;
      if (!products.length) { tbody.innerHTML='<tr><td colspan="6"><div class="sd-empty"><div class="sd-empty-title">Aucun produit</div></div></td></tr>'; return; }
      tbody.innerHTML = products.map(function(p) {
        var img = (Array.isArray(p.images)?p.images[0]:null)||p.image||'assets/img/placeholder-product-1.svg';
        var st  = sdStatus(p.status||'active');
        var html = '<tr><td><div class="sd-prod-cell"><div class="sd-prod-thumb"><img src="'+img+'" onerror="this.src=\'assets/img/placeholder-product-1.svg\'"></div>';
        html += '<div><div class="sd-prod-name">'+(p.name||'—')+'</div><div class="sd-prod-cat">'+(p.category||'')+'</div></div></div></td>';
        html += '<td class="price">'+sdFmt(p.price||0)+' FCFA</td>';
        html += '<td style="color:'+(p.stock<5?'var(--warn)':'rgba(254,252,248,.6)')+'\">'+''+(p.stock||0)+'</td>';
        html += '<td>'+(p.category||'—')+'</td>';
        html += '<td><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></td>';
        html += '<td><div class="sd-table-actions">';
        html += '<button class="sd-tbl-btn" onclick="window.sdEditProduct(\''+p.id+'\')" >Modifier</button>';
        var pname = (p.name||'').replace(/'/g,"\\'");
        html += '<button class="sd-tbl-btn del" onclick="window.sdDeleteProduct(\''+p.id+'\',\''+pname+'\')">× Supprimer</button>';
        html += '</div></td></tr>';
        return html;
      }).join('');
    } catch(e){ console.error('[sd] sdLoadProducts:', e); }
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * SYSTÈME DE SÉCURISATION DES STATUTS DE COMMANDE
   * Hiérarchie stricte, confirmations, et verrouillage
   * ═══════════════════════════════════════════════════════════════
   */

  // HIÉRARCHIE STRICTE DES STATUTS (ordre immuable)
  var STATUS_HIERARCHY = ['pending_admin', 'pending_seller', 'ready_for_delivery', 'delivered'];
  var LOCKED_STATUSES  = ['ready_for_delivery', 'delivered', 'cancelled']; // Selects désactivés
  var STATUS_LABELS    = {
    'pending_admin':        'En attente',
    'pending_seller':       'En préparation',
    'ready_for_delivery':   'En livraison',
    'delivered':            'Livré',
    'cancelled':            'Annulé'
  };

  // Stockage des anciennes valeurs de select pour l'annulation
  window.sdOrderStatusCache = {};

  // Calcule la position d'un statut dans la hiérarchie
  function getStatusIndex(status) {
    var idx = STATUS_HIERARCHY.indexOf(status);
    return idx >= 0 ? idx : -1;
  }

  // Valide si le passage d'un ancien statut à un nouveau est légal
  function isValidStatusTransition(oldStatus, newStatus) {
    // Les statuts "annulé" et "livré" ne peuvent pas revenir en arrière
    if (['cancelled', 'delivered'].includes(oldStatus)) return false;
    
    var oldIdx = getStatusIndex(oldStatus);
    var newIdx = getStatusIndex(newStatus);
    
    // Si c'est une annulation, c'est toujours valide
    if (newStatus === 'cancelled') return true;
    
    // Pour les autres, nouveau doit être > ancien dans la hiérarchie
    return newIdx > oldIdx;
  }

  // Fonction améliorée pour mettre à jour le statut des commandes
  window.sdUpdateOrderStatus = async function(orderId, newStatus) {
    try {
      // Récupère la commande actuelle pour son statut
      var orderSnap = await db2.collection('orders').doc(orderId).get();
      if (!orderSnap.exists) {
        if (window.showToast) window.showToast('Commande introuvable', 'danger');
        resetOrderSelect(orderId);
        return;
      }

      var currentOrder = orderSnap.data();
      var oldStatus    = currentOrder.status || 'pending_admin';

      // Validation 1: Vérifier si la transition est valide
      if (!isValidStatusTransition(oldStatus, newStatus)) {
        if (window.showToast) {
          window.showToast('Action impossible : vous ne pouvez pas revenir à un statut précédent.', 'danger');
        }
        resetOrderSelect(orderId);
        return;
      }

      // Validation 2: Demander confirmation irréversible
      var oldLabel = STATUS_LABELS[oldStatus] || oldStatus;
      var newLabel = STATUS_LABELS[newStatus] || newStatus;
      var confirmMsg = 'Êtes-vous sûr de vouloir passer cette commande en ' + newLabel + ' ? Cette action est définitive et vous ne pourrez plus revenir en arrière.';

      if (!confirm(confirmMsg)) {
        resetOrderSelect(orderId);
        return;
      }

      // Mise à jour Firestore
      await db2.collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (window.showToast) window.showToast('Statut mis à jour en ' + newLabel, 'success');

      // Recharger les commandes pour refléter les changements (notamment le verrouillage)
      await sdLoadOrders();

    } catch(e) {
      console.error('[sdUpdateOrderStatus] Erreur:', e);
      if (window.showToast) window.showToast('Erreur lors de la mise à jour', 'danger');
      resetOrderSelect(orderId);
    }
  };

  // Réinitialise un select de statut à sa valeur précédente
  function resetOrderSelect(orderId) {
    var select = document.querySelector('select[data-order-id="' + orderId + '"]');
    if (select && window.sdOrderStatusCache[orderId]) {
      select.value = window.sdOrderStatusCache[orderId];
    }
  }

  // Sauvegarde la valeur actuelle du select quand il est focus
  document.addEventListener('focus', function(e) {
    if (e.target && e.target.tagName === 'SELECT' && e.target.hasAttribute('data-order-id')) {
      var orderId = e.target.getAttribute('data-order-id');
      window.sdOrderStatusCache[orderId] = e.target.value;
    }
  }, true);

  // Ajoute des listeners aux selects après le rendu
  function attachOrderStatusListeners() {
    document.querySelectorAll('select[data-order-id]').forEach(function(select) {
      var orderId = select.getAttribute('data-order-id');
      var status  = select.getAttribute('data-current-status');

      // Sauvegarde la valeur initiale pour cette commande
      window.sdOrderStatusCache[orderId] = status;

      // Désactiver le select si le statut actuel est "verrouillé"
      if (LOCKED_STATUSES.includes(status)) {
        select.disabled = true;
        select.title = 'Cette commande ne peut plus être modifiée.';
        select.style.opacity = '0.5';
        select.style.cursor = 'not-allowed';
      } else {
        select.disabled = false;
        select.title = '';
        select.style.opacity = '1';
        select.style.cursor = 'pointer';
      }

      // Listener pour sauvegarder la valeur avant changement
      select.addEventListener('focus', function() {
        window.sdOrderStatusCache[orderId] = this.value;
      });
    });
  }

  // Alias pour backward compatibility
  async function sdLoadOrders_Original() {
    try {
      var snap = await db2.collection('orders').where('sellerId','==',currentShopId).orderBy('createdAt','desc').limit(20).get()
        .catch(function(){ return db2.collection('orders').where('sellerId','==',currentShopId).limit(20).get(); });
      var orders  = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      var badge   = document.getElementById('sd-orders-badge');
      var pending = orders.filter(function(o){ return !['delivered','cancelled'].includes((o.status||'').toLowerCase()); }).length;
      if (badge) { badge.textContent=pending; badge.style.display=pending?'flex':'none'; }
      var c = document.getElementById('sd-orders-list'); if(c) c.innerHTML = orders.length
        ? orders.map(function(o){ var st=sdStatus(o.status); var locked = LOCKED_STATUSES.includes(o.status); return '<div class="sd-order-row"><div><div class="sd-order-ref">#'+(o.reference||o.id.substring(0,8).toUpperCase())+'</div><div class="sd-order-meta">'+sdFmtDate(o.createdAt)+'</div></div><div><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></div><div style="font-family:\'Unbounded\',sans-serif;font-size:13px;color:var(--g);font-weight:700">'+sdFmt(o.total||0)+' FCFA</div><div><select class="sd-input" data-order-id="'+o.id+'" data-current-status="'+o.status+'" '+(locked?'disabled':'')+' style="padding:6px 28px 6px 10px;font-size:11px;background:var(--i3)'+(locked?';opacity:0.5;cursor:not-allowed':'')+'" onchange="window.sdUpdateOrderStatus(\''+o.id+'\',this.value)" ><option value="pending_admin"'+(o.status==='pending_admin'?' selected':'')+'>En attente</option><option value="pending_seller"'+(o.status==='pending_seller'?' selected':'')+'>En préparation</option><option value="ready_for_delivery"'+(o.status==='ready_for_delivery'?' selected':'')+'>En livraison</option><option value="delivered"'+(o.status==='delivered'?' selected':'')+'>Livré</option><option value="cancelled"'+(o.status==='cancelled'?' selected':'')+'>Annulé</option></select></div><div></div></div>'; }).join('')
        : '<div class="sd-empty"><div class="sd-empty-title">Aucune commande</div></div>';
      var cr = document.getElementById('sd-recent-orders'); if(cr) cr.innerHTML = orders.slice(0,5).map(function(o){ var st=sdStatus(o.status); return '<div class="sd-order-row"><div><div class="sd-order-ref">#'+(o.reference||o.id.substring(0,8).toUpperCase())+'</div><div class="sd-order-meta">'+sdFmtDate(o.createdAt)+'</div></div><div><span class="sd-status-badge '+st.cls+'">'+st.label+'</span></div><div style="font-family:\'Unbounded\',sans-serif;font-size:13px;color:var(--g);font-weight:700">'+sdFmt(o.total||0)+' FCFA</div><div></div><div></div></div>'; }).join('');
      
      // Attacher les listeners de sécurité une fois le HTML rendu
      setTimeout(attachOrderStatusListeners, 0);
    } catch(e){ console.error('[sd] sdLoadOrders:', e); }
  }

  // Wrapper pour appeler la fonction originale
  async function sdLoadOrders() {
    await sdLoadOrders_Original();
  }

  async function sdLoadStats() {
    try {
      var snap = await db2.collection('orders').where('sellerId','==',currentShopId).get()
        .catch(function(){ return db2.collection('orders').where('shopId','==',currentShopId).get(); });
      var totalSales = snap.docs.map(function(d){return d.data();}).filter(function(o){return o.status==='delivered';}).reduce(function(s,o){return s+(o.total||0);},0);
      var psnap      = await db2.collection('products').where('shopId','==',currentShopId).get();
      var setEl      = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
      setEl('sd-stat-products', sdFmt(psnap.size));
      setEl('sd-stat-sales',    sdFmt(totalSales));
      setEl('sd-stat-views',    sdFmt(currentShopData.views||0));
    } catch(e){ ['sd-stat-products','sd-stat-sales','sd-stat-views'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='—';}); }
  }

  window.sdUpdateOrderStatus = async function(orderId, newStatus) {
    try {
      await db2.collection('orders').doc(orderId).update({ status:newStatus, updatedAt:firebase.firestore.FieldValue.serverTimestamp() });
      if(window.showToast) window.showToast('Statut mis à jour','success');
    } catch(e){ if(window.showToast) window.showToast('Erreur mise à jour','danger'); }
  };

  window.sdEditProduct = function(pid) {
    window.sdSwitchTab('add-product');
    db2.collection('products').doc(pid).get().then(function(doc){ if(!doc.exists) return; var p=doc.data(); ['name','category','price','original-price','stock','sku','description'].forEach(function(k){ var el=document.getElementById('fp-'+k.replace('-','_').replace('original_price','original-price')); if(el) el.value=p[k.replace('-','Price').replace('_','')]||p[k]||''; }); var fp=document.getElementById('sd-product-form'); if(fp) fp.dataset.editId=pid; });
  };
  window.sdDeleteProduct = async function(pid, name) {
    if (!confirm('Supprimer "'+name+'" ?')) return;
    try { await db2.collection('products').doc(pid).delete(); if(window.showToast) window.showToast('Produit supprimé','success'); sdLoadProducts(); }
    catch(e){ if(window.showToast) window.showToast('Erreur suppression','danger'); }
  };

  var sdProductForm = document.getElementById('sd-product-form');
  if (sdProductForm) {
   sdProductForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = document.getElementById('sd-submit-btn'); 
      if(btn) { btn.disabled=true; var sp=btn.querySelector('span'); if(sp) sp.textContent='Publication…'; }
      
      try {
        var editId = e.target.dataset.editId;
        var g = function(id){ return document.getElementById(id)?.value||''; };
        
        // --- 1. GÉNÉRATION DU SLUG ---
        var productName = g('fp-name');
        var slug = productName
          .toLowerCase()
          .trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève les accents
          .replace(/[^\w ]+/g, '') // Enlève les caractères spéciaux
          .replace(/ +/g, '-')     // Remplace les espaces par des tirets
          + '-' + Math.random().toString(36).substring(2, 6); // Petit code unique

        var data = {
          name: productName,
          slug: slug, // <--- AJOUT DU SLUG ICI
          category: g('fp-category'),
          price: Number(g('fp-price'))||0,
          stock: Number(g('fp-stock'))||0,
          sku: g('fp-sku'),
          description: g('fp-description'),
          colors: g('fp-colors').split(',').map(function(c){return c.trim();}).filter(Boolean),
          sizes: g('fp-sizes').split(',').map(function(s){return s.trim();}).filter(Boolean),
          shopId: currentShopId,
          shopName: currentShopData?.name||'',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // --- 2. GESTION DES IMAGES ET ENVOI ---
        var op = Number(g('fp-original-price'))||0; if(op) data.originalPrice=op;
        var fileInput = document.getElementById('fp-images');
        
        if (fileInput && fileInput.files.length > 0 && storage) {
          var urls=[]; 
          for(var file of fileInput.files){ 
            var compressedBlob=await window.compressImage(file);
            var ref2=storage.ref('products/'+currentShopId+'/'+Date.now()+'.webp'); 
            var sn=await ref2.put(compressedBlob); 
            urls.push(await sn.ref.getDownloadURL()); 
          } 
          data.images=urls; data.image=urls[0];
        }

        if (editId) { 
          // Si on modifie, on ne change pas forcément le slug pour ne pas casser le SEO déjà indexé
          // Mais on peut choisir de le mettre à jour si tu préfères
          await db2.collection('products').doc(editId).update(data); 
          delete e.target.dataset.editId; 
          if(window.showToast) window.showToast('Produit mis à jour','success'); 
        } else { 
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); 
          await db2.collection('products').add(data); 
          if(window.showToast) window.showToast('Produit publié avec succès','success'); 
        }

        e.target.reset(); 
        var prev = document.getElementById('sd-img-preview'); 
        if(prev) prev.innerHTML=''; 
        window.sdSwitchTab('products'); 
        sdLoadProducts();
      } catch(err){ 
        if(window.showToast) window.showToast('Erreur : '+err.message,'danger'); 
        console.error(err); 
      } finally { 
        if(btn){ btn.disabled=false; var sp=btn.querySelector('span'); if(sp) sp.textContent='Publier le produit'; } 
      }
    });
  }

  var sdSettingsForm = document.getElementById('sd-settings-form');
  if (sdSettingsForm) {
    sdSettingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      try {
        var g = function(id){ return document.getElementById(id)?.value||''; };
        var updates = { name:g('sp-name'), category:g('sp-category'), city:g('sp-city'), phone:g('sp-phone'), description:g('sp-description'), updatedAt:firebase.firestore.FieldValue.serverTimestamp() };
        var logoFile = document.getElementById('sp-logo-file')?.files[0];
        if (logoFile && storage) { 
          var compressedBlobLogo=await window.compressImage(logoFile);
          var ref3=storage.ref('shops/'+currentShopId+'/logo_'+Date.now()+'.webp'); 
          var sn2=await ref3.put(compressedBlobLogo); 
          updates.logo=await sn2.ref.getDownloadURL(); 
        }
        var bannerFile = document.getElementById('sp-banner-file')?.files[0];
        if (bannerFile && storage) { 
          var compressedBlobBanner=await window.compressImage(bannerFile);
          var refB=storage.ref('shops/'+currentShopId+'/banner_'+Date.now()+'.webp'); 
          var snB=await refB.put(compressedBlobBanner); 
          updates.banner=await snB.ref.getDownloadURL(); 
        }
        await db2.collection('shops').doc(currentShopId).update(updates);
        if(window.showToast) window.showToast('Boutique mise à jour','success');
        ['sd-shop-name','sd-topbar-shop'].forEach(function(id){ var el=document.getElementById(id); if(el) el.textContent=updates.name; });
        var ini=document.getElementById('sd-shop-initial'); if(ini) ini.textContent=updates.name.charAt(0).toUpperCase();
      } catch(err){ if(window.showToast) window.showToast('Erreur : '+err.message,'danger'); }
    });
  }

  var spLogoFile = document.getElementById('sp-logo-file');
  if (spLogoFile) {
    spLogoFile.addEventListener('change', function() {
      var prev = document.getElementById('sp-logo-preview'); if(!prev||!this.files[0]) return;
      var r = new FileReader(); r.onload=function(e2){ prev.innerHTML='<div class="sd-img-thumb" style="width:80px;height:80px"><img src="'+e2.target.result+'"></div>'; }; r.readAsDataURL(this.files[0]);
    });
  }

  var spBannerFile = document.getElementById('sp-banner-file');
  if (spBannerFile) {
    spBannerFile.addEventListener('change', function() {
      var prev = document.getElementById('sp-banner-preview'); if(!prev||!this.files[0]) return;
      var r = new FileReader(); r.onload=function(e2){ prev.innerHTML='<div class="sd-img-thumb" style="width:100%;height:120px"><img src="'+e2.target.result+'" style="width:100%;height:100%;object-fit:cover"></div>'; }; r.readAsDataURL(this.files[0]);
    });
  }

  function sdLoadMessages(user) {
    var container = document.getElementById('sd-messages-list'); if(!container) return;
    if (typeof window.subscribeUserChats !== 'function') { container.innerHTML='<div class="sd-empty"><div class="sd-empty-sub">Messagerie indisponible.</div></div>'; return; }
    window.subscribeUserChats(user.uid, function(chats) {
      var badge = document.getElementById('sd-msg-badge');
      if (badge) { badge.textContent=chats.length; badge.style.display=chats.length?'flex':'none'; }
      if (!chats.length) { container.innerHTML='<div class="sd-empty"><div class="sd-empty-title">Aucune discussion</div></div>'; return; }
      container.innerHTML = chats.map(function(chat) {
        var buyer   = chat.buyerName||'Client';
        var initials= buyer.split(' ').map(function(w){return w[0];}).join('').toUpperCase().substring(0,2);
        var preview = chat.lastMessage ? (chat.lastMessage.length>60?chat.lastMessage.substring(0,60)+'…':chat.lastMessage) : 'Aucun message';
        var time    = chat.lastMessageAt||chat.updatedAt;
        if (time) { var d=time.toDate?time.toDate():new Date(time.seconds?time.seconds*1000:time); var diff=Math.floor((Date.now()-d)/1000); time = diff<60?'À l\'instant':diff<3600?Math.floor(diff/60)+'min':diff<86400?Math.floor(diff/3600)+'h':d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}); } else time='';
        var p = new URLSearchParams({ chatId:chat.id, shopId:chat.shopId||'', sellerId:chat.sellerId||'' });
        return '<a href="/messages.html?'+p.toString()+'" class="sd-disc-item"><div class="sd-disc-avatar">'+initials+'</div><div style="flex:1;min-width:0"><div class="sd-disc-name">'+buyer+'</div><div class="sd-disc-preview">'+preview+'</div></div><div class="sd-disc-time">'+time+'</div></a>';
      }).join('');
    }, function(){ container.innerHTML='<div class="sd-empty"><div class="sd-empty-sub">Impossible de charger les discussions.</div></div>'; });
  }
});