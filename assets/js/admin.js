"use strict";

/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — admin.js  v3
 * Espace vendeur : dashboard, produits, commandes, paramètres
 * ═══════════════════════════════════════════════════════════════
 * À charger APRÈS config.js
 * ═══════════════════════════════════════════════════════════════
 */

// ── STATE ─────────────────────────────────────────────────────────
let currentShop     = null;
let currentProducts = [];
let productImages   = [];
let logoBase64      = '';
let bannerBase64    = '';
let _unsubProducts  = null; // pour cleanup onSnapshot

// ── NAVIGATION ────────────────────────────────────────────────────
// Défini UNE SEULE FOIS, accessible globalement
window.nav = window.navigateSellerTab = function (tabId, btn) {
  document.querySelectorAll('.admin-section').forEach(s => {
    s.classList.add('hidden'); s.classList.remove('active');
  });
  const target = document.getElementById('sec-' + tabId);
  if (target) { target.classList.remove('hidden'); target.classList.add('active'); }

  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (window.innerWidth < 900) {
    const sb = document.getElementById('seller-sidebar');
    if (sb) sb.classList.remove('mobile-open');
  }
};

// ── ROLE CHECK ────────────────────────────────────────────────────
function isSellerOrAdmin(role) {
  return ['admin', 'superadmin', 'seller', 'maintainer'].includes(role || '');
}

// ── COMPRESSION IMAGE ─────────────────────────────────────────────
const IMAGE_LIMITS = {
  logo:    { maxW: 400,  maxH: 400,  q: 0.85 },
  banner:  { maxW: 1200, maxH: 400,  q: 0.75 },
  product: { maxW: 1200, maxH: 1200, q: 0.80 },
};

/**
 * Compresse une image via canvas et retourne une Promise<string> base64.
 * Gère WebP avec fallback JPEG. Recompresse récursivement si > 900 Ko.
 */
function compressImageToBase64(file, maxW = 1200, maxH = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) { reject(new Error('Fichier invalide (image requise).')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier échouée.'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide.'));
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxW || h > maxH) { const r = Math.min(maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas non supporté.')); return; }
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const toBlob = (type, q) => new Promise(res => canvas.toBlob(res, type, q));
        (async () => {
          try {
            let blob = await toBlob('image/webp', quality);
            if (!blob || blob.size < 100) blob = await toBlob('image/jpeg', quality);
            if (!blob) { reject(new Error('Compression échouée.')); return; }
            const fr = new FileReader();
            fr.onerror = () => reject(new Error('Conversion Base64 échouée.'));
            fr.onload = ev => {
              const b64 = ev.target.result;
              const kb  = Math.round((b64.length * 3) / 4 / 1024);
              if (kb > 900) {
                compressImageToBase64(new File([blob], file.name, { type: blob.type }), maxW, maxH, Math.max(quality - 0.15, 0.4))
                  .then(resolve).catch(reject);
              } else {
                resolve(b64);
              }
            };
            fr.readAsDataURL(blob);
          } catch (err) { reject(err); }
        })();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── IMAGES PRODUIT ────────────────────────────────────────────────
function setupProductUpload() {
  const zone  = document.getElementById('drop-zone');
  const input = document.getElementById('p-files');
  if (!zone || !input) return;

  zone.addEventListener('click',    () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave',()  => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleProductFiles(e.dataTransfer.files); });
  input.addEventListener('change', () => handleProductFiles(input.files));
}

async function handleProductFiles(files) {
  if (productImages.length + files.length > 5) { window.showToast('Maximum 5 images.', 'warning'); return; }
  const { maxW, maxH, q } = IMAGE_LIMITS.product;
  for (const file of Array.from(files)) {
    if (!file.type?.startsWith('image/')) continue;
    try {
      productImages.push(await compressImageToBase64(file, maxW, maxH, q));
      renderProductGallery();
    } catch (err) { window.showToast('Image ignorée : ' + err.message, 'warning'); }
  }
}

function renderProductGallery() {
  const gallery = document.getElementById('preview-gallery');
  if (!gallery) return;
  gallery.innerHTML = productImages.map((img, i) => `
    <div class="preview-item">
      <img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:4px">
      <button type="button" onclick="removeProductImage(${i})" style="position:absolute;top:2px;right:2px;background:#D94F4F;color:#fff;border:none;border-radius:50%;width:18px;height:18px;line-height:16px;cursor:pointer">×</button>
    </div>`).join('');
}
window.removeProductImage = i => { productImages.splice(i, 1); renderProductGallery(); };

// ── IMAGES BOUTIQUE (logo / bannière) ─────────────────────────────
function setupProfileUpload() {
  const bind = (zoneId, inputId, previewId, type) => {
    const zone  = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input) return;
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const file = input.files[0]; if (!file) return;
      const prev = document.getElementById(previewId);
      if (prev) prev.style.opacity = '0.5';
      const { maxW, maxH, q } = IMAGE_LIMITS[type];
      try {
        const b64 = await compressImageToBase64(file, maxW, maxH, q);
        if (type === 'logo')   logoBase64   = b64;
        if (type === 'banner') bannerBase64 = b64;
        if (prev) { prev.src = b64; prev.style.opacity = '1'; }
        window.showToast(`${type === 'logo' ? 'Logo' : 'Bannière'} chargé(e) ✓`, 'success');
      } catch (err) {
        window.showToast('Erreur : ' + err.message, 'danger');
        if (prev) prev.style.opacity = '1';
      }
    });
  };
  bind('upload-logo',   'file-logo',   'preview-logo',   'logo');
  bind('upload-banner', 'file-banner', 'preview-banner', 'banner');
}

// ── UI BOUTIQUE ───────────────────────────────────────────────────
function updateShopUI(shop) {
  const set = (ids, val) => ids.forEach(id => { const el = document.getElementById(id); if (el) (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value = val : el.textContent = val; });
  set(['shop-name-title','shop-title-display'], shop.name);
  set(['set-shop-name','set-name'],             shop.name);
  set(['set-shop-desc','set-desc'],             shop.description || '');
  set(['set-slogan'],                           shop.slogan || '');
  set(['set-phone'],                            shop.phone || '');
  set(['set-email'],                            shop.ownerEmail || shop.email || '');
  set(['shop-status-display'],                  shop.status || 'Actif');
  set(['shop-category-display'],                shop.category || '—');

  const logo   = shop.logoUrl   || shop.logo   || shop.logoBase64   || '';
  const banner = shop.bannerUrl || shop.banner || shop.bannerBase64 || '';
  if (logo)   { const el = document.getElementById('preview-logo');   if (el) el.src = logo; }
  if (banner) { const el = document.getElementById('preview-banner'); if (el) el.src = banner; }

  // Jours restants
  const daysEl = document.getElementById('shop-days-remaining');
  if (daysEl && shop.expiresAt) {
    try {
      const exp  = shop.expiresAt.toDate ? shop.expiresAt.toDate() : new Date(shop.expiresAt);
      const diff = Math.ceil((exp - Date.now()) / 86400000);
      if (diff < 0)      { daysEl.textContent = '(Expirée)';         daysEl.style.color = '#D94F4F'; }
      else if (diff <= 7) { daysEl.textContent = `(${diff}j restants)`; daysEl.style.color = '#C8813A'; }
      else                 { daysEl.textContent = `(${diff} jours restants)`; daysEl.style.color = '#7A7570'; }
    } catch {}
  }
}

// ── PRODUITS (realtime) ───────────────────────────────────────────
function listenToSellerProducts() {
  // Cleanup de l'ancien listener pour éviter les fuites mémoire
  if (_unsubProducts) { _unsubProducts(); _unsubProducts = null; }
  if (!currentShop?.id) return;

  _unsubProducts = window.db.collection('products')
    .where('shopId', '==', currentShop.id)
    .onSnapshot(snap => {
      currentProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const list = document.getElementById('products-list');
      if (!list) return;

      const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      setEl('stat-products', currentProducts.length);
      setEl('stat-views', new Intl.NumberFormat('fr-FR').format(
        currentProducts.reduce((s, p) => s + (p.views || 0), 0)
      ));

      if (!currentProducts.length) {
        list.innerHTML = '<p class="text-muted">Aucun produit en ligne.</p>'; return;
      }
      list.innerHTML = currentProducts.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid rgba(200,168,75,.08)">
          <div style="display:flex;gap:12px;align-items:center">
            <img src="${p.image || 'assets/img/placeholder.png'}" style="width:48px;height:48px;object-fit:cover;border-radius:4px">
            <div>
              <div style="font-weight:600">${p.name}</div>
              <div style="color:#C8A84B;font-size:12px">${window.formatFCFA(p.price)}</div>
            </div>
          </div>
          <button onclick="deleteSellerProduct('${p.id}')" style="background:none;border:none;color:#D94F4F;cursor:pointer">
            <i data-lucide="trash-2"></i>
          </button>
        </div>`).join('');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, err => console.error('[admin.js] listenToSellerProducts:', err));
}

window.deleteSellerProduct = function (id) {
  if (confirm('Supprimer ce produit ?'))
    window.db.collection('products').doc(id).delete()
      .then(()  => window.showToast('Produit supprimé', 'success'))
      .catch(err => window.showToast('Erreur : ' + err.message, 'danger'));
};

// ── COMMANDES VENDEUR ─────────────────────────────────────────────
async function loadSellerOrders(userEmail) {
  const loader    = document.getElementById('orders-loader');
  const container = document.getElementById('orders-container');
  const list      = document.getElementById('orders-list');
  if (!container || !list) return;
  if (loader) loader.style.display = 'block';
  container.style.display = 'none';

  try {
    const shopSnap = await window.db.collection('shops').where('ownerEmail', '==', userEmail).get();
    if (shopSnap.empty) {
      list.innerHTML = '<p style="color:#D94F4F;padding:20px">Aucune boutique trouvée.</p>';
      if (loader) loader.style.display = 'none';
      container.style.display = 'block'; return;
    }
    const shopId = shopSnap.docs[0].id;

    const ordersSnap = await window.db.collection('orders').where('sellerId', '==', shopId).get();
    const orders = ordersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

    if (!orders.length) {
      list.innerHTML = `<div style="padding:40px;text-align:center;color:#7A7570">
        <p>Aucune commande.</p><p>Vos ventes apparaîtront ici.</p></div>`;
    } else {
      list.innerHTML = orders.map(o => {
        const date  = o.createdAt ? (o.createdAt.toDate?.() || new Date(o.createdAt)) : new Date();
        const items = (o.items || []).filter(i => !shopId || i.shopId === shopId);
        const sub   = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
        return `
          <div style="padding:16px;border-left:3px solid #C8A84B;background:var(--ink2,#1A1916);margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px">
              <div>
                <strong>#${o.id.slice(-6).toUpperCase()}</strong>
                <div style="font-size:11px;color:#7A7570">${date.toLocaleDateString('fr-FR')}</div>
                <div style="font-size:11px;color:#7A7570">${o.userEmail || '—'}</div>
              </div>
              <div style="text-align:right">
                <div style="font-family:'Unbounded',sans-serif;font-size:13px;color:#C8A84B">${window.formatFCFA(o.total || sub)}</div>
                <span style="font-size:10px;color:#7A7570">${window.translateOrderStatus?.(o.status) || o.status || '—'}</span>
              </div>
            </div>
            <button data-oid="${o.id}" class="order-details-btn" style="background:#C8A84B;color:#0B0A08;border:none;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;width:100%">
              Détails / Gérer
            </button>
          </div>`;
      }).join('');
    }

    updateStatSales(orders, shopId);
    if (loader) loader.style.display = 'none';
    container.style.display = 'block';

    list.querySelectorAll('.order-details-btn').forEach(btn =>
      btn.addEventListener('click', () => window.showOrderDetails(btn.dataset.oid))
    );
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('[admin.js] loadSellerOrders:', err);
    list.innerHTML = '<p style="color:#D94F4F;padding:20px">Impossible de charger les commandes.</p>';
    if (loader) loader.style.display = 'none';
    container.style.display = 'block';
  }
}

function updateStatSales(orders = [], shopId) {
  const el = document.getElementById('stat-sales');
  if (!el) return;
  const total = orders.reduce((s, o) => {
    if (['cancelled','annulee'].includes(o.status)) return s;
    if (o.total > 0) return s + Number(o.total);
    const items = (o.items || []).filter(i => !shopId || i.shopId === shopId);
    return s + items.reduce((ss, i) => ss + (Number(i.price)||0) * (Number(i.qty)||0), 0);
  }, 0);
  el.textContent = new Intl.NumberFormat('fr-FR').format(total);
}

async function loadSellerStats(shopId) {
  if (!shopId || !window.db) return;
  try {
    const snap   = await window.db.collection('orders').where('sellerId', '==', shopId).get();
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateStatSales(orders, shopId);
  } catch (e) { console.warn('[admin.js] loadSellerStats:', e.message); }
}

// ── COMMANDES EN ATTENTE (pending_seller) ─────────────────────────
window.loadPendingSellerOrders = function (shopId) {
  const container = document.getElementById('seller-orders-pending');
  if (!container || !window.db) return;
  container.innerHTML = '<p style="padding:20px;text-align:center">Chargement…</p>';

  window.db.collection('orders')
    .where('sellerId', '==', shopId)
    .where('status', '==', 'pending_seller')
    .onSnapshot(snap => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!orders.length) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#7A7570">Aucune commande en préparation.</div>';
        return;
      }
      container.innerHTML = orders.map(o => {
        const date  = o.createdAt ? (o.createdAt.toDate?.() || new Date(o.createdAt)).toLocaleDateString('fr-FR') : '—';
        const items = (o.items || []).map(i => `<li>${i.qty || 1}× ${i.name}</li>`).join('');
        return `
          <div style="padding:16px;border-left:4px solid #4A84C8;background:var(--ink2,#1A1916);margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px">
              <div><strong>${o.reference || o.id.slice(-6).toUpperCase()}</strong><br><small>${date} · ${o.userEmail||'—'}</small></div>
              <span style="font-family:'Unbounded',sans-serif;color:#C8A84B">${window.formatFCFA(o.total)}</span>
            </div>
            <ul style="margin:8px 0;padding-left:16px;color:#7A7570;font-size:12px">${items}</ul>
            <button onclick="markAsReadyForDelivery('${o.id}')"
              style="background:#C8A84B;color:#0B0A08;border:none;padding:12px;font-weight:700;width:100%;cursor:pointer">
              📦 Prêt pour expédition
            </button>
          </div>`;
      }).join('');
    }, err => {
      container.innerHTML = `<p style="color:#D94F4F;padding:20px">Erreur : ${err.message}</p>`;
    });
};

window.markAsReadyForDelivery = async function (orderId) {
  if (!confirm('Confirmer que cette commande est prête ?')) return;
  try {
    await window.db.collection('orders').doc(orderId).update({
      status: 'ready_for_delivery',
      readyForDeliveryAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:          firebase.firestore.FieldValue.serverTimestamp(),
    });
    window.showToast('Commande marquée prête ✓ Le livreur peut la prendre en charge.', 'success');
  } catch (err) { window.showToast('Erreur : ' + err.message, 'danger'); }
};

// ── MODAL DÉTAILS COMMANDE ────────────────────────────────────────
window.showOrderDetails = async function (orderId) {
  if (!window.db) return;
  const doc = await window.db.collection('orders').doc(orderId).get().catch(() => null);
  if (!doc?.exists) { window.showToast('Commande introuvable', 'danger'); return; }
  const o = { id: doc.id, ...doc.data() };

  // Créer / recycler modal
  let modal = document.getElementById('order-details-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'order-details-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(11,10,8,.88);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
    document.body.appendChild(modal);
  }

  const items   = (o.items || []).map(i => `
    <tr>
      <td style="padding:8px">${i.name || '—'}</td>
      <td style="padding:8px;text-align:center">${i.qty || 1}</td>
      <td style="padding:8px;text-align:right">${window.formatFCFA(i.price)}</td>
      <td style="padding:8px;text-align:right;font-weight:700">${window.formatFCFA((i.price||0)*(i.qty||1))}</td>
    </tr>`).join('');

  const statOpts = ['pending_seller','ready_for_delivery','delivered','confirmed','processing','shipped','cancelled']
    .map(s => `<option value="${s}" ${o.status===s?'selected':''}>${window.translateOrderStatus?.(s)||s}</option>`)
    .join('');

  modal.innerHTML = `
    <div style="background:#1A1916;border:1px solid rgba(200,168,75,.15);max-width:700px;width:100%;max-height:90vh;overflow-y:auto;padding:32px;position:relative">
      <button onclick="this.closest('#order-details-modal').style.display='none'"
        style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;color:#7A7570;cursor:pointer">×</button>
      <h2 style="font-family:'Instrument Serif',serif;font-size:26px;color:#FEFCF8;margin-bottom:20px">
        Commande <em style="color:#C8A84B">#${o.id.slice(-6).toUpperCase()}</em>
      </h2>
      <div style="background:rgba(200,168,75,.05);border:1px solid rgba(200,168,75,.1);padding:14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        <div><span style="color:#7A7570">Client</span><br>${o.userEmail||'—'}</div>
        <div><span style="color:#7A7570">Téléphone</span><br>${o.userPhone||'—'}</div>
        <div><span style="color:#7A7570">Adresse</span><br>${o.address||o.deliveryAddress?.street||'—'}</div>
        <div><span style="color:#7A7570">Date</span><br>${o.createdAt?(o.createdAt.toDate?.()??new Date(o.createdAt)).toLocaleDateString('fr-FR'):'—'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:rgba(255,255,255,.04);font-size:11px">
          <th style="padding:8px;text-align:left">Produit</th><th style="padding:8px;text-align:center">Qté</th>
          <th style="padding:8px;text-align:right">Prix</th><th style="padding:8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div style="text-align:right;margin-bottom:20px;font-family:'Unbounded',sans-serif;font-size:14px;color:#C8A84B">
        Total : ${window.formatFCFA(o.total)}
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:6px">Changer le statut</label>
        <select id="modal-status" style="width:100%;background:#2C2A27;border:1px solid rgba(200,168,75,.2);color:#FEFCF8;padding:10px;font-family:'Syne',sans-serif">
          ${statOpts}
        </select>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:6px">Notes vendeur</label>
        <textarea id="modal-notes" style="width:100%;background:#2C2A27;border:1px solid rgba(200,168,75,.2);color:#FEFCF8;padding:10px;min-height:80px;font-family:'Syne',sans-serif;resize:vertical">${o.sellerNotes||''}</textarea>
      </div>
      <div style="display:flex;gap:10px">
        <button id="modal-save-status" style="flex:1;background:#C8A84B;color:#0B0A08;border:none;padding:12px;font-weight:700;cursor:pointer">Enregistrer le statut</button>
        <button id="modal-save-notes" style="flex:1;background:rgba(200,168,75,.1);color:#C8A84B;border:1px solid rgba(200,168,75,.2);padding:12px;font-weight:600;cursor:pointer">Sauver les notes</button>
      </div>
    </div>`;

  modal.style.display = 'flex';

  modal.querySelector('#modal-save-status').addEventListener('click', async () => {
    const ns = modal.querySelector('#modal-status').value;
    try {
      await window.db.collection('orders').doc(orderId).update({ status: ns, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      window.showToast('Statut mis à jour ✓', 'success');
      modal.style.display = 'none';
      if (currentShop?.ownerEmail) loadSellerOrders(currentShop.ownerEmail);
      if (currentShop?.id) loadSellerStats(currentShop.id);
    } catch (err) { window.showToast('Erreur : ' + err.message, 'danger'); }
  });

  modal.querySelector('#modal-save-notes').addEventListener('click', async () => {
    const notes = modal.querySelector('#modal-notes').value;
    try {
      await window.db.collection('orders').doc(orderId).update({ sellerNotes: notes, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      window.showToast('Notes sauvegardées ✓', 'success');
    } catch (err) { window.showToast('Erreur : ' + err.message, 'danger'); }
  });
};

// ── FORMULAIRES ───────────────────────────────────────────────────
function setupSellerForms() {
  // Cascade catégories
  if (typeof window.initCategoryCascade === 'function') {
    let allowed = null;
    if (currentShop?.category && typeof window.getAllowedProductCategories === 'function') {
      allowed = window.getAllowedProductCategories(currentShop.category);
    }
    window.initCategoryCascade({
      mainCategoryId: 'p-cat-main', subCategoryId: 'p-cat-sub', subSubCategoryId: 'p-cat-subsub',
      containerId: 'category-cascade-container', allowedCategories: allowed,
    });
  }

  // Ajout produit
  const formProd = document.getElementById('form-add-product');
  if (formProd) {
    formProd.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = formProd.querySelector('button[type=submit]');
      const v = id => document.getElementById(id)?.value || '';

      const name  = v('p-name')  || v('prod-name');
      const price = v('p-price') || v('prod-price');
      const desc  = v('p-desc')  || v('prod-desc');

      let category = '';
      if (typeof window.getCategorySelection === 'function') {
        category = window.getCategorySelection({ mainCategoryId:'p-cat-main', subCategoryId:'p-cat-sub', subSubCategoryId:'p-cat-subsub' }).fullPath;
      } else { category = v('p-cat') || currentShop?.category || ''; }

      if (!name || !price || !desc || !category) {
        window.showToast('Remplissez tous les champs requis.', 'warning'); return;
      }
      btn.disabled = true; btn.textContent = 'Ajout…';
      try {
        await window.db.collection('products').add({
          shopId:   currentShop.id, shopName: currentShop.name,
          sellerId: firebase.auth().currentUser.uid,
          name, price: Number(price), description: desc, category,
          image:  productImages[0] || 'assets/img/placeholder.png',
          images: productImages.slice(0, 5),
          sku: v('p-sku'), stock: Number(v('p-stock') || 0), minStock: Number(v('p-min-stock') || 0),
          specifications: typeof window.getSpecifications === 'function' ? window.getSpecifications() : {},
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          views: 0,
        });
        window.showToast('Produit publié ✓', 'success');
        formProd.reset(); productImages = []; renderProductGallery();
      } catch (err) { window.showToast('Erreur : ' + err.message, 'danger'); }
      finally { btn.disabled = false; btn.textContent = 'Mettre en ligne'; }
    });
  }

  // Paramètres boutique
  const formSet = document.getElementById('form-settings');
  if (formSet) {
    formSet.addEventListener('submit', async e => {
      e.preventDefault();
      const v = id => document.getElementById(id)?.value || '';
      const payload = {
        name:        v('set-shop-name') || v('set-name'),
        description: v('set-shop-desc') || v('set-desc'),
        slogan:      v('set-slogan'),
        phone:       v('set-phone'),
        ...(logoBase64   ? { logo: logoBase64 }     : {}),
        ...(bannerBase64 ? { banner: bannerBase64 } : {}),
      };
      try {
        await window.db.collection('shops').doc(currentShop.id).update(payload);
        window.showToast('Paramètres mis à jour ✓', 'success');
        const el = document.getElementById('shop-name-title') || document.getElementById('shop-title-display');
        if (el) el.textContent = payload.name;
      } catch (err) { window.showToast('Erreur : ' + err.message, 'danger'); }
    });
  }
}

// ── SPÉCIFICATIONS PRODUIT ────────────────────────────────────────
const SPEC_OPTIONS = {
  Général:      ['Marque','Modèle','Couleur','Poids','Dimensions','État','Garantie'],
  Mode:         ['Matière','Taille','Genre','Entretien'],
  Électronique: ['Taille d\'écran','RAM','Stockage','Processeur','Batterie','Connectivité','OS'],
  Beauté:       ['Contenance','Type de peau','Notes olfactives'],
};

window.addSpecRow = function () {
  const container = document.getElementById('specs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'spec-row';
  let optsHtml = '<option value="">— Caractéristique —</option>';
  for (const [cat, opts] of Object.entries(SPEC_OPTIONS)) {
    optsHtml += `<optgroup label="${cat}">${opts.map(o=>`<option value="${o}">${o}</option>`).join('')}</optgroup>`;
  }
  optsHtml += '<optgroup label="---"><option value="custom">✏️ Autre…</option></optgroup>';
  row.innerHTML = `
    <div style="display:flex;gap:8px;flex:1">
      <select class="spec-key input">${optsHtml}</select>
      <input type="text" class="spec-custom-key input" placeholder="Nom personnalisé…" style="display:none;flex:1">
    </div>
    <input type="text" class="spec-value input" placeholder="Valeur" style="flex:1">
    <button type="button" onclick="this.closest('.spec-row').remove()" style="background:none;border:none;color:#D94F4F;cursor:pointer">×</button>`;
  container.appendChild(row);
  row.querySelector('.spec-key').addEventListener('change', function () {
    const custom = row.querySelector('.spec-custom-key');
    if (this.value === 'custom') { custom.style.display = 'block'; custom.focus(); }
    else { custom.style.display = 'none'; custom.value = ''; }
  });
};

window.getSpecifications = function () {
  const specs = {};
  document.querySelectorAll('#specs-container .spec-row').forEach(row => {
    const sel    = row.querySelector('.spec-key');
    const custom = row.querySelector('.spec-custom-key');
    const val    = row.querySelector('.spec-value');
    if (!sel || !val) return;
    const key = sel.value === 'custom' ? (custom?.value || '').trim() : sel.value.trim();
    const v   = val.value.trim();
    if (key && v) specs[key] = v;
  });
  return specs;
};

window.initSpecifications = function () {
  const c = document.getElementById('specs-container');
  if (c) window.addSpecRow();
};

// ── INIT DASHBOARD ────────────────────────────────────────────────
function initSellerDashboard() {
  // Safety timeout : 7s max pour révéler la page
  const safetyTimer = setTimeout(() => {
    if (window.AuthWall) window.AuthWall.reveal();
  }, 7000);

  window.auth.onAuthStateChanged(async user => {
    if (!user) {
      clearTimeout(safetyTimer);
      if (window.AuthWall) window.AuthWall.deny({ redirectUrl: 'login.html', redirectLabel: 'Se connecter', reason: 'Connexion requise.' });
      else window.location.href = 'login.html';
      return;
    }

    // Vérification rôle
    let userData = {};
    try {
      const doc = await window.db.collection('users').doc(user.uid).get();
      userData  = doc.exists ? (doc.data() || {}) : {};
    } catch {}
    const role = userData.role || '';

    // Chercher la boutique
    let shopSnap;
    try { shopSnap = await window.db.collection('shops').where('ownerEmail', '==', user.email).get(); }
    catch { shopSnap = { empty: true }; }

    const hasShop = !shopSnap.empty;

    // Autoriser si rôle OK OU si une boutique existe (fallback sécurisé)
    if (!isSellerOrAdmin(role) && !hasShop) {
      clearTimeout(safetyTimer);
      if (window.AuthWall) window.AuthWall.deny({ email: user.email, role: role || 'client', reason: 'Accès réservé aux vendeurs certifiés.' });
      else window.location.href = 'index.html';
      return;
    }

    const loader  = document.getElementById('loader');
    const content = document.getElementById('seller-content');
    const warning = document.getElementById('no-shop-warning');

    if (!hasShop) {
      clearTimeout(safetyTimer);
      if (loader) loader.style.display = 'none';
      if (warning) { warning.classList.remove('hidden'); warning.style.display = 'flex'; }
      const emailEl = document.getElementById('user-email-display');
      if (emailEl) emailEl.textContent = user.email;
      if (window.AuthWall) window.AuthWall.reveal();
      return;
    }

    const shopDoc = shopSnap.docs[0];
    currentShop   = { id: shopDoc.id, ...shopDoc.data() };

    // Normaliser les champs UID de la boutique pour la messagerie
    if (!currentShop.ownerId) {
      const update = { ownerId: user.uid, sellerId: user.uid, ownerUid: user.uid, userId: user.uid };
      window.db.collection('shops').doc(shopDoc.id).set(update, { merge: true }).catch(() => {});
      Object.assign(currentShop, update);
    }

    if (loader)  loader.style.display  = 'none';
    if (content) { content.classList.remove('hidden'); content.style.display = 'block'; }

    updateShopUI(currentShop);
    listenToSellerProducts();
    loadSellerOrders(user.email);
    loadSellerStats(currentShop.id);
    setupProductUpload();
    setupProfileUpload();
    setupSellerForms();
    if (window.subscribeUserChats) {
      window.subscribeUserChats(user.uid, chats => {
        const badge = document.getElementById('sd-msg-badge');
        if (badge) {
          const unread = chats.reduce((s, c) => s + (c.unreadSeller || 0), 0);
          badge.textContent  = unread;
          badge.style.display = unread > 0 ? 'flex' : 'none';
        }
      });
    }

    clearTimeout(safetyTimer);
    setTimeout(() => {
      if (window.AuthWall) window.AuthWall.reveal();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 300);
  });
}

// ── LOGOUT ────────────────────────────────────────────────────────
window.logout = function () {
  window.auth.signOut().then(() => window.location.href = 'login.html');
};

// ── ROUTING ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const isSellerPage = !!(document.getElementById('seller-content') || document.getElementById('products-list'));
  if (isSellerPage) initSellerDashboard();
  if (typeof window.initSpecifications === 'function') setTimeout(window.initSpecifications, 500);
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

console.log("✅ admin.js v3 chargé");