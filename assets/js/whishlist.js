
// Page Wishlist
window.addEventListener('DOMContentLoaded', () => {
  const itemsEl = document.getElementById('wishlist-items');
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if(!itemsEl) return;

  function createWishlistItemElement(p) {
    const card = document.createElement('div');
    card.className = 'card mb-2';
    
    const info = document.createElement('div');
    info.className = 'info wishlist-item';
    
    const img = document.createElement('img');
    img.src = p.images[0];
    img.alt = p.name;
    
    const contentDiv = document.createElement('div');
    
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = p.name;
    
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${p.color||''} · ${p.size||''} · ${formatFCFA(p.price)}`;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'mt-2';
    actionsDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center';
    
    const viewLink = document.createElement('a');
    viewLink.href = `product.html?id=${encodeURIComponent(p.id)}`;
    viewLink.className = 'icon-btn';
    viewLink.title = 'Voir le produit';
    viewLink.innerHTML = '<i data-lucide="eye" class="lucide-icon"></i><span class="icon-label">Voir</span>';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-dark icon-btn';
    addBtn.dataset.add = p.id;
    addBtn.title = 'Ajouter au panier';
    addBtn.innerHTML = '<i data-lucide="shopping-bag" class="lucide-icon"></i><span class="icon-label">Ajouter</span>';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn icon-btn';
    removeBtn.dataset.remove = p.id;
    removeBtn.title = 'Retirer de la wishlist';
    removeBtn.innerHTML = '<i data-lucide="trash-2" class="lucide-icon"></i><span class="icon-label">Retirer</span>';
    
    actionsDiv.appendChild(viewLink);
    actionsDiv.appendChild(addBtn);
    actionsDiv.appendChild(removeBtn);
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(meta);
    contentDiv.appendChild(actionsDiv);
    
    const priceDiv = document.createElement('div');
    const priceText = document.createElement('div');
    priceText.style.fontWeight = '700';
    priceText.textContent = formatFCFA(p.price);
    priceDiv.appendChild(priceText);
    
    info.appendChild(img);
    info.appendChild(contentDiv);
    info.appendChild(priceDiv);
    card.appendChild(info);
    
    return card;
  }

  function render(){
    const items = getWishlistItems();
    itemsEl.textContent = ''; // Clear safely
    
    if(items.length === 0){
      const emptyCard = document.createElement('div');
      emptyCard.className = 'card';
      const emptyInfo = document.createElement('div');
      emptyInfo.className = 'info';
      emptyInfo.innerHTML = 'Votre wishlist est vide. <a href="catalogue.html">Voir le catalogue</a>';
      emptyCard.appendChild(emptyInfo);
      itemsEl.appendChild(emptyCard);
      return;
    }
    
    items.forEach(p => {
      itemsEl.appendChild(createWishlistItemElement(p));
    });
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
