
/* ── CURSOR ── */
(()=>{
  const ring=document.getElementById('ct-ring'), dot=document.getElementById('ct-dot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
  (function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();
  document.addEventListener('mouseover',e=>{if(e.target.closest('a,button,select,[onclick]'))document.body.classList.add('ct-h')});
  document.addEventListener('mouseout',e=>{if(e.target.closest('a,button,select,[onclick]'))document.body.classList.remove('ct-h')});
})();

/* ── TOAST ── */
function ctToast(msg, type=''){
  const zone=document.getElementById('ct-toasts');
  const el=document.createElement('div');
  el.className='ct-toast '+(type==='success'?'ok':type==='error'?'err':'');
  el.textContent=msg;
  zone.appendChild(el);
  setTimeout(()=>el.remove(),3500);
}
window.showToast=ctToast;

/* ── FORMAT ── */
const ctFmt=n=>new Intl.NumberFormat('fr-FR').format(n)+' FCFA';

/* ── CLEAR ── */
window.ctClearCart=()=>{
  if(!confirm('Vider tout le panier ?'))return;
  localStorage.removeItem('ac_cart');
  location.reload();
};

document.addEventListener('DOMContentLoaded',()=>{

  if(!firebase.apps.length){
    document.getElementById('loading').innerHTML='<p style="color:#D94F4F;text-align:center;padding:40px;font-family:Syne,sans-serif;">Firebase non initialisé.</p>';
    return;
  }

  const db=firebase.firestore(), auth=firebase.auth();
  const loadingEl   = document.getElementById('loading');
  const emptyEl     = document.getElementById('cart-empty');
  const contentEl   = document.getElementById('cart-content');
  const listEl      = document.getElementById('cart-items-list');
  const countLabel  = document.getElementById('cart-count-label');
  const subtotalEl  = document.getElementById('subtotal-display');
  const totalEl     = document.getElementById('total-display');
  const checkoutBtn = document.getElementById('btn-checkout');
  const shippingFeeEl   = document.getElementById('shipping-fee-display');
  const addressSelectEl = document.getElementById('delivery-address-select');
  const shippingNoteEl  = document.getElementById('shipping-note');

  let shippingRates=null, currentShippingFee=0, currentAddress=null;
  const addressById=new Map();

  /* ── CHECKOUT ── */
  if(checkoutBtn){
    checkoutBtn.addEventListener('click',async()=>{
      const user=(auth&&auth.currentUser)||(firebase.auth&&firebase.auth().currentUser)||null;
      if(!user){alert('Veuillez vous connecter pour continuer.');window.location.href='/login';return;}
      try{
        checkoutBtn.disabled=true;
        checkoutBtn.querySelector('.btn-txt').textContent='Traitement…';
        const mainOrderRef='AUR-'+Math.random().toString(36).substr(2,6).toUpperCase();
        const invoiceNumber=await getNextInvoiceNumber(db);
        const subtotal=cartProductsData.reduce((acc,item)=>acc+item.price*item.qty,0);
        const itemsBySeller={};
        cartProductsData.forEach(item=>{
          const sid=item.shopId||item.sellerId||'unknown';
          if(!itemsBySeller[sid])itemsBySeller[sid]=[];
          itemsBySeller[sid].push(item);
        });
        const sellerIds=Object.keys(itemsBySeller);
        const createdOrderIds=[];
        for(let i=0;i<sellerIds.length;i++){
          const sellerId=sellerIds[i];
          const sellerItems=itemsBySeller[sellerId];
          const subRef=sellerIds.length>1?`${mainOrderRef}-${i+1}`:mainOrderRef;
          const sellerSubtotal=sellerItems.reduce((acc,item)=>acc+item.price*item.qty,0);
          const sellerShippingFee=sellerIds.length>1?Math.round((sellerSubtotal/subtotal)*currentShippingFee):currentShippingFee;
          const orderData={
            reference:subRef, mainOrderRef, invoiceNumber,
            userId:user.uid, userEmail:user.email, sellerId,
            items:sellerItems.map(item=>({productId:item.id,shopId:item.shopId||item.sellerId||null,name:item.name,price:item.price,qty:item.qty,image:item.image||''})),
            subtotal:sellerSubtotal, shippingFee:sellerShippingFee,
            total:sellerSubtotal+sellerShippingFee,
            deliveryAddress:currentAddress||null,
            status:'pending_admin',
            createdAt:firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
          };
          const docRef=await db.collection('orders').add(orderData);
          createdOrderIds.push(docRef.id);
        }
        localStorage.setItem('ac_cart_checkout',JSON.stringify({orderId:createdOrderIds[0],mainOrderRef,items:cartProductsData,invoiceNumber,reference:mainOrderRef}));
        localStorage.removeItem('ac_cart');
        window.location.href='/invoice?orderId='+createdOrderIds[0];
      }catch(err){
        ctToast('Erreur lors de la commande. Réessayez.','error');
        checkoutBtn.disabled=false;
        checkoutBtn.querySelector('.btn-txt').textContent='Procéder au paiement';
      }
    });
  }

  async function getNextInvoiceNumber(db){
    const ref=db.collection('meta').doc('invoiceCounter');
    try{
      return await db.runTransaction(async t=>{
        const doc=await t.get(ref);
        const next=(doc.exists?doc.data().value||0:0)+1;
        t.set(ref,{value:next},{merge:true});
        return next;
      });
    }catch(e){
      const c=Number(localStorage.getItem('ac_invoice_counter')||'0')+1;
      localStorage.setItem('ac_invoice_counter',String(c));
      return c;
    }
  }

  /* ── PANIER DATA ── */
  let rawCart=[];
  try{const s=localStorage.getItem('ac_cart');rawCart=s?JSON.parse(s):[];}
  catch(e){localStorage.removeItem('ac_cart');rawCart=[];}

  let cart=Array.isArray(rawCart)?rawCart.map(item=>{
    if(!item)return null;
    if(item.pid)return item;
    if(item.product&&item.product.id)return{pid:String(item.product.id),qty:item.quantity||1,product:item.product};
    return null;
  }).filter(Boolean):[];

  if(cart.length!==rawCart.length)localStorage.setItem('ac_cart',JSON.stringify(cart));

  let cartProductsData=[];

  if(cart.length===0){showEmpty();if(checkoutBtn)checkoutBtn.disabled=true;return;}

  const localProducts=cart.filter(i=>i.product&&i.product.id);
  if(localProducts.length===cart.length){
    cartProductsData=localProducts.map(i=>({id:String(i.product.id),...i.product,shopId:i.product.shopId||i.product.sellerId||null,qty:parseInt(i.qty||i.quantity,10)||1}));
    renderCart();
  }else{
    loadingEl.classList.add('show');
    Promise.all(cart.map(item=>db.collection('products').doc(item.pid).get().then(doc=>({doc,error:null})).catch(error=>({doc:null,error}))))
    .then(results=>{
      let hasChanges=false;
      results.forEach(result=>{
        if(result.doc&&result.doc.exists){
          const pd=result.doc.data();
          const ci=cart.find(i=>i.pid===result.doc.id);
          cartProductsData.push({id:result.doc.id,...pd,shopId:pd.shopId||pd.sellerId||null,qty:ci?parseInt(ci.qty||ci.quantity,10)||1:1});
        }else hasChanges=true;
      });
      if(hasChanges){const vi=cartProductsData.map(p=>p.id);cart=cart.filter(i=>vi.includes(i.pid));localStorage.setItem('ac_cart',JSON.stringify(cart));}
      if(cartProductsData.length===0)showEmpty();else renderCart();
    })
    .catch(()=>{
      loadingEl.innerHTML='<div style="text-align:center;padding:60px"><p style="color:#D94F4F;font-family:Syne,sans-serif;margin-bottom:20px;">Erreur de chargement.</p><button onclick="localStorage.removeItem(\'ac_cart\');location.reload();" style="padding:12px 28px;background:#C8A84B;color:#0B0A08;border:none;font-family:Unbounded,sans-serif;font-size:9px;letter-spacing:.18em;text-transform:uppercase;font-weight:800;cursor:pointer;">Vider et réessayer</button></div>';
    });
  }

  function showEmpty(){
    loadingEl.style.display='none';
    emptyEl.classList.add('show');
    contentEl.classList.remove('show');
  }

  function recalcTotal(){
    let total=0,count=0;
    document.querySelectorAll('.ct-item').forEach(row=>{
      const price=Number(row.getAttribute('data-price')||0);
      const qtyEl=row.querySelector('.ct-qty-val');
      const qty=parseInt(qtyEl?qtyEl.textContent:'1',10)||1;
      total+=price*qty; count+=qty;
    });
    if(subtotalEl)subtotalEl.textContent=ctFmt(total);
    if(totalEl)totalEl.textContent=ctFmt(total+(Number(currentShippingFee)||0));
    if(countLabel)countLabel.textContent=count;
    if(checkoutBtn)checkoutBtn.disabled=count===0;
  }

  function renderCart(){
    loadingEl.style.display='none';
    emptyEl.classList.remove('show');
    contentEl.classList.add('show');
    listEl.innerHTML='';

    cartProductsData.forEach((p,idx)=>{
      const qty=parseInt(p.qty||p.quantity,10)||1;
      const price=Number(String(p.price||0).replace(/[^\d.-]/g,''))||0;
      const lineTotal=price*qty;
      const maxStock=parseInt(p.stock||0,10)||999;
      p.qty=qty;

      let img='assets/img/placeholder-product-1.svg';
      if(p.image)img=p.image;
      else if(p.images&&p.images.length>0)img=p.images[0];

      const div=document.createElement('div');
      div.className='ct-item';
      div.setAttribute('data-product-id',p.id);
      div.setAttribute('data-price',price);
      div.setAttribute('data-stock',maxStock);
      // On définit l'URL SEO : Slug-ID pour SEO + facilité de récupération (avec -- comme séparateur)
      const pUrl = p.slug ? '/product/' + p.slug + '--' + p.id : '/product/' + (p.name ? p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'produit') + '--' + p.id;

      div.innerHTML=`
        <a href="${pUrl}" class="ct-item-img-wrap">
          <img src="${img}" class="ct-item-img" alt="${p.name||''}" onerror="this.src='assets/img/placeholder-product-1.svg'">
        </a>
        <div class="ct-item-body">
          ${p.category?`<span class="ct-item-cat">${p.category}</span>`:''}
          <a href="${pUrl}" class="ct-item-name">${p.name||'Produit sans nom'}</a>
          ${p.shopName?`<span class="ct-item-shop"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${p.shopName}</span>`:''}
          <span class="ct-item-unit">${new Intl.NumberFormat('fr-FR').format(price)} FCFA / unité</span>
        </div>
        <div class="ct-item-right">
          <span class="ct-item-total" id="line-total-${p.id}">${new Intl.NumberFormat('fr-FR').format(lineTotal)} FCFA</span>
          <div class="ct-qty">
            <button class="ct-qty-btn" onclick="ctUpdateQty('${p.id}',-1)">−</button>
            <span class="ct-qty-val" id="qty-${p.id}">${qty}</span>
            <button class="ct-qty-btn" onclick="ctUpdateQty('${p.id}',1)" ${qty>=maxStock?'disabled':''}>+</button>
          </div>
          <button class="ct-del" onclick="ctRemoveItem('${p.id}')" title="Supprimer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      `;
      listEl.appendChild(div);
      // stagger reveal
      setTimeout(()=>div.classList.add('on'), 60 + idx*80);
    });

    recalcTotal();
    if(typeof updateCartBadge==='function')updateCartBadge();
  }

  /* ── SHIPPING ── */
  function normCity(v){return String(v||'').trim();}
  function getShipFee(city){
    if(!shippingRates)return null;
    const t=normCity(city).toLowerCase();
    if(!t)return null;
    const k=Object.keys(shippingRates).find(k=>k.toLowerCase()===t);
    return Number(k?shippingRates[k]:shippingRates.default)||0;
  }
  function updateShipUI(){
    if(!shippingRates){if(shippingFeeEl)shippingFeeEl.textContent='Tarif indisponible';currentShippingFee=0;recalcTotal();return;}
    if(!currentAddress){if(shippingFeeEl)shippingFeeEl.textContent='Sélectionnez une adresse';if(shippingNoteEl)shippingNoteEl.textContent='';currentShippingFee=0;recalcTotal();return;}
    const city=normCity(currentAddress.city);
    const fee=getShipFee(city);
    if(fee===null){if(shippingFeeEl)shippingFeeEl.textContent='Ville non reconnue';currentShippingFee=Number(shippingRates?.default)||0;}
    else{if(shippingFeeEl)shippingFeeEl.textContent=ctFmt(fee);currentShippingFee=fee;}
    if(shippingNoteEl)shippingNoteEl.textContent=city?`Livraison vers ${city}`:'';
    localStorage.setItem('ac_checkout_shipping',JSON.stringify({addressId:currentAddress.id||null,city:currentAddress.city||'',fee:currentShippingFee}));
    recalcTotal();
  }
  function setAddressOptions(addresses){
    if(!addressSelectEl)return;
    addressById.clear();
    if(!Array.isArray(addresses)||addresses.length===0){
      addressSelectEl.innerHTML='<option value="">Aucune adresse enregistrée</option>';
      addressSelectEl.disabled=true; currentAddress=null; updateShipUI();
      if(shippingNoteEl)shippingNoteEl.innerHTML='<a href="profile.html">+ Ajouter une adresse</a>';
      return;
    }
    addresses.forEach(a=>addressById.set(String(a.id),a));
    addressSelectEl.disabled=false;
    addressSelectEl.innerHTML='<option value="">Choisir une adresse</option>'+
      addresses.map(a=>`<option value="${a.id}">${[a.name||'Adresse',a.city,a.description].filter(Boolean).join(' · ')}</option>`).join('');
    const saved=localStorage.getItem('ac_selected_address_id');
    if(saved&&addressById.has(saved)){addressSelectEl.value=saved;currentAddress=addressById.get(saved);}
    else if(addresses.length===1){addressSelectEl.value=addresses[0].id;currentAddress=addresses[0];}
    else currentAddress=null;
    updateShipUI();
  }
  async function loadShipRates(){
    try{const doc=await db.collection('shipping_settings').doc('rates').get();shippingRates=doc.exists?doc.data():null;}
    catch(e){shippingRates=null;}
    updateShipUI();
  }
  async function loadAddresses(user){
    if(!user){if(addressSelectEl){addressSelectEl.innerHTML='<option value="">Connectez-vous</option>';addressSelectEl.disabled=true;}currentAddress=null;updateShipUI();return;}
    try{
      const snap=await db.collection('users').doc(user.uid).collection('addresses').get();
      setAddressOptions(snap.docs.map(d=>({id:d.id,...d.data()})));
    }catch(e){if(addressSelectEl){addressSelectEl.innerHTML='<option value="">Erreur chargement</option>';addressSelectEl.disabled=true;}}
  }
  if(addressSelectEl){
    addressSelectEl.addEventListener('change',()=>{
      const id=addressSelectEl.value;
      localStorage.setItem('ac_selected_address_id',id||'');
      currentAddress=id&&addressById.has(id)?addressById.get(id):null;
      updateShipUI();
    });
  }
  auth.onAuthStateChanged(user=>loadAddresses(user));
  loadShipRates();

  /* ── QUANTITÉ ── */
  window.ctUpdateQty=(productId,delta)=>{
    const row=document.querySelector(`.ct-item[data-product-id="${productId}"]`);
    const qtyEl=document.getElementById(`qty-${productId}`);
    const item=cartProductsData.find(p=>p.id===productId);
    if(!row||!qtyEl||!item)return;
    const maxStock=parseInt(row.getAttribute('data-stock')||'999',10)||999;
    const cur=parseInt(qtyEl.textContent||'1',10)||1;
    let next=cur;
    if(delta>0){if(cur<maxStock)next=cur+1;else{ctToast(`Stock limité à ${maxStock}.`,'error');return;}}
    else next=Math.max(1,cur-1);
    if(next===cur)return;
    qtyEl.textContent=next;
    item.qty=next; item.quantity=next;
    const ci=cart.find(i=>i.pid===productId);
    if(ci){ci.qty=next;ci.quantity=next;}
    localStorage.setItem('ac_cart',JSON.stringify(cart));
    const price=Number(row.getAttribute('data-price')||0);
    const ltEl=document.getElementById(`line-total-${productId}`);
    if(ltEl)ltEl.textContent=new Intl.NumberFormat('fr-FR').format(price*next)+' FCFA';
    const plusBtn=row.querySelector('.ct-qty-btn:last-of-type');
    if(plusBtn)plusBtn.disabled=next>=maxStock;
    recalcTotal();
  };
  // Alias pour compatibilité app.js
  window.updateQuantity=window.ctUpdateQty;

  /* ── SUPPRIMER ── */
  window.ctRemoveItem=(productId)=>{
    const row=document.querySelector(`.ct-item[data-product-id="${productId}"]`);
    if(row){
      row.style.transition='opacity .3s,transform .3s';
      row.style.opacity='0';row.style.transform='translateX(16px)';
      setTimeout(()=>row.remove(),320);
    }
    cart=cart.filter(i=>i.pid!==productId);
    cartProductsData=cartProductsData.filter(p=>p.id!==productId);
    localStorage.setItem('ac_cart',JSON.stringify(cart));
    setTimeout(()=>{if(cart.length===0)showEmpty();else recalcTotal();},340);
    if(typeof updateCartBadge==='function')updateCartBadge();
  };
  window.removeItem=window.ctRemoveItem;

});