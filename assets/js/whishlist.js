
// Page Wishlist
window.addEventListener('DOMContentLoaded', () => {
  const itemsEl = document.getElementById('wishlist-items');
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if(!itemsEl) return;

  function render(){
    const items = getWishlistItems();
    if(items.length === 0){
      itemsEl.innerHTML = `
        <div class="card"><div class="info">
          Votre wishlist est vide. <a href="catalogue.html">Voir le catalogue</a>
        </div></div>`;
      return;
    }
    itemsEl.innerHTML = items.map(p => `
      <div class="card mb-2">
        <div class="info wishlist-item">
          <img src="${p.images[0]}" alt="${p.name}" />
          <div>
            <div class="title">${p.name}</div>
            <div class="meta">${p.color||''} · ${p.size||''} · ${formatFCFA(p.price)}</div>
            <div class="mt-2" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <a href="product.html?id=${encodeURIComponent(p.id)}" class="icon-btn" title="Voir le produit">
                <i data-lucide="eye" class="lucide-icon"></i>
                <span class="icon-label">Voir</span>
              </a>
              <button class="btn btn-dark icon-btn" data-add="${p.id}" title="Ajouter au panier">
                <i data-lucide="shopping-bag" class="lucide-icon"></i>
                <span class="icon-label">Ajouter</span>
              </button>
              <button class="btn icon-btn" data-remove="${p.id}" title="Retirer de la wishlist">
                <i data-lucide="trash-2" class="lucide-icon"></i>
                <span class="icon-label">Retirer</span>
              </button>
            </div>
          </div>
          <div>
            <div style="font-weight:700">${formatFCFA(p.price)}</div>
          </div>
        </div>
      </div>
    `).join('');
    bindEvents();
    // Initialize Lucide icons after rendering wishlist items
    if(typeof lucide !== 'undefined') lucide.createIcons();
    // sync add-buttons active state after rendering
    if(typeof updateCartButtons === 'function'){
      try{ updateCartButtons(); }catch(e){}
    }
  }

  function bindEvents(){
    itemsEl.querySelectorAll('[data-add]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const pid = btn.getAttribute('data-add');
        addToCart(pid, 1);
        showToast('Ajouté au panier depuis la wishlist','success');
        // animate the add button
        try{ if(typeof animateIcon==='function') animateIcon(btn); }catch(e){}
      });
    });
    itemsEl.querySelectorAll('[data-remove]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const pid = btn.getAttribute('data-remove');
        toggleWishlist(pid); // retire si présent
        render();
      });
    });
  }

  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      clearWishlist();
      render();
    });
  }

  render();
});
