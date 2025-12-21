
// Page Panier
window.addEventListener('DOMContentLoaded', () => {
  const itemsEl = document.getElementById('cart-items');
  const clearBtn = document.getElementById('clear-cart-btn');
  const promoInput = document.getElementById('promo-code');
  const applyPromoBtn = document.getElementById('apply-promo-btn');

  const countEl = document.getElementById('summary-count');
  const subtotalEl = document.getElementById('summary-subtotal');
  const discountEl = document.getElementById('summary-discount');
  const totalEl = document.getElementById('summary-total');

  let appliedPromo = null; // {code, percent}

  function render(){
    const items = getCartItems();
    if(items.length === 0){
      itemsEl.innerHTML = `
        <div class="card"><div class="info">
          Votre panier est vide. <a href="catalogue.html">Voir le catalogue</a>
        </div></div>`;
    } else {
      itemsEl.innerHTML = items.map(it => {
        const p = it.product;
        const max = p.stock || 999;
        return `
          <div class="card mb-2">
            <div class="info cart-item">
              <img src="${p.images[0]}" alt="${p.name}" />
              <div>
                <div class="title">${p.name}</div>
                <div class="meta">${p.color||''} · ${p.size||''} · ${formatFCFA(p.price)}</div>
                <div class="mt-2" style="display:flex;align-items:center;gap:8px">
                  <button class="qty-btn" data-minus="${p.id}" aria-label="Diminuer">–</button>
                  <span class="qty-val" id="val-${p.id}">${it.quantity}</span>
                  <button class="qty-btn" data-plus="${p.id}" aria-label="Augmenter">+</button>
                  <small class="text-muted-foreground">${max} en stock</small>
                </div>
              </div>
              <div>
                <div style="font-weight:700">${formatFCFA(p.price * it.quantity)}</div>
                <button class="btn mt-2 icon-btn remove-btn" data-remove="${p.id}" title="Supprimer">
                  <i data-lucide="trash-2" class="lucide-icon"></i>
                  <span class="icon-label">Supprimer</span>
                </button>
              </div>
            </div>
          </div>`;
      }).join('');
    }
    updateSummary();
    bindEvents();
    // Initialize Lucide icons after rendering cart items
    if(typeof lucide !== 'undefined') lucide.createIcons();
  }

  function bindEvents(){
    itemsEl.querySelectorAll('[data-minus]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const pid = btn.getAttribute('data-minus');
        const valEl = document.getElementById('val-'+pid);
        const current = parseInt(valEl.textContent||'1',10);
        const next = Math.max(1, current-1);
        updateCartQty(pid, next);
        valEl.textContent = next;
        updateSummary();
      });
    });
    itemsEl.querySelectorAll('[data-plus]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const pid = btn.getAttribute('data-plus');
        const valEl = document.getElementById('val-'+pid);
        const current = parseInt(valEl.textContent||'1',10);
        const prod = Store.products.find(p => p.id === pid);
        const max = prod ? (prod.stock||999) : 999;
        const next = Math.min(max, current+1);
        updateCartQty(pid, next);
        valEl.textContent = next;
        updateSummary();
      });
    });
    itemsEl.querySelectorAll('[data-remove]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const pid = btn.getAttribute('data-remove');
        removeFromCart(pid);
        render();
      });
    });
  }

  function computeDiscount(subtotal){
    if(!appliedPromo) return 0;
    const percent = appliedPromo.percent || 0;
    return Math.round(subtotal * percent / 100);
  }

  function updateSummary(){
    const items = getCartItems();
    const count = items.reduce((s,it)=>s+it.quantity,0);
    const subtotal = getSubtotal();
    const discount = computeDiscount(subtotal);
    const total = Math.max(0, subtotal - discount);

    countEl.textContent = count;
    subtotalEl.textContent = formatFCFA(subtotal);
    discountEl.textContent = formatFCFA(discount);
    totalEl.textContent = formatFCFA(total);
  }

  clearBtn.addEventListener('click', ()=>{
    clearCart();
    render();
  });
  // applyPromoBtn handled below (stores last applied promo in localStorage)

  // Paiement (placeholder)
  // checkout handled below (creates order, persists and redirects)

  // Initial render
  render();

  // Apply promo handler (guarded)
  if(promoInput && applyPromoBtn){
    applyPromoBtn.addEventListener('click', ()=>{
      const code = (promoInput.value||'').trim();
      if(!code) return showToast('Entrez un code promo','warning');
      const promo = Store.promos.find(pr => pr.code.toUpperCase()===code.toUpperCase());
      if(!promo) return showToast('Code promo invalide','danger');
      if(Date.now() > promo.expires) return showToast('Ce code est expiré','danger');
      appliedPromo = {code: promo.code, percent: promo.percent};
      localStorage.setItem('ac_last_promo', JSON.stringify(appliedPromo));
      showToast(`Code ${promo.code} appliqué (-${promo.percent}%)`, 'success');
      updateSummary();
    });
  }

  // Checkout handler (guarded)
  const checkoutBtn = document.getElementById('checkout-btn');
  if(checkoutBtn){
    checkoutBtn.addEventListener('click', ()=>{
      const user = JSON.parse(localStorage.getItem('ac_currentUser')||'null');
      if(!user){ showToast('Veuillez vous connecter pour continuer','warning'); return location.href='../login.html'; }
      const cartItems = getCartItems();
      if(cartItems.length===0) return showToast('Votre panier est vide','warning');

      // Recalcule montants
      const subtotal = cartItems.reduce((s,it)=> s + it.product.price*it.quantity, 0);
      const promo = JSON.parse(localStorage.getItem('ac_last_promo')||'null');
      const discount = promo ? Math.round(subtotal * (promo.percent||0) / 100) : 0;
      const shipping = 0; // logique simple : gratuite
      const total = Math.max(0, subtotal - discount + shipping);

      // Construire la commande
      const order = {
        id: 'O'+Date.now(),
        userEmail: user.email,
        date: Date.now(),
        status: 'paid', // statut initial après paiement simulé
        items: cartItems.map(it => ({
          pid: it.product.id,
          name: it.product.name,
          price: it.product.price,
          qty: it.quantity,
          image: it.product.images[0]
        })),
        subtotal, discount, shipping, total,
        promoCode: promo ? promo.code : null,
        address: null,
        meta: { method:'Standard' }
      };

      // Persister
      Store.orders.push(order);
      saveStore();

      // MAJ produits: incrémenter ventes (facultatif)
      order.items.forEach(it => {
        const p = Store.products.find(x=>x.id===it.pid);
        if(p){
          p.sales = (p.sales||0) + it.qty;
          p.stock = Math.max(0, (p.stock||0) - it.qty);
        }
      });
      saveStore();

      // Nettoyer
      clearCart();
      localStorage.removeItem('ac_last_promo');

      showToast('Commande créée avec succès','success');
      setTimeout(()=> location.href='../order.html', 800);
    });
  }
});
