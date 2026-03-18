/**
 * profile.js
 * Gestion du profil utilisateur, adresses, commandes, messages
 * Section §15 de prime.js
 */

/* ── CURSOR ── */
(()=>{
  const ring=document.getElementById('cur-ring'),dot=document.getElementById('cur-dot');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.left=mx+'px';dot.style.top=my+'px'});
  (function loop(){rx+=(mx-rx)*.1;ry+=(my-ry)*.1;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();
  const sel='a,button,input,select,textarea,.pr-order-item,.pr-addr-card,.pr-msg-item';
  document.addEventListener('mouseover',e=>{if(e.target.closest(sel))document.body.classList.add('cur-h')});
  document.addEventListener('mouseout', e=>{if(e.target.closest(sel))document.body.classList.remove('cur-h')});
})();

document.addEventListener('DOMContentLoaded',()=>{
  if(typeof lucide!=='undefined') lucide.createIcons();

  const auth=firebase.auth();
  const db=firebase.firestore();
  const storage=firebase.storage();
  const DEFAULT_RETENTION=30;

  /* ─── TOAST ─── */
  function prToast(msg,type='ok'){
    const el=document.createElement('div');
    el.className='pr-toast '+(type==='ok'?'ok':type==='err'?'err':'');
    el.textContent=msg;
    document.getElementById('pr-toasts').appendChild(el);
    setTimeout(()=>el.remove(),3400);
  }
  window.showToast=(m,t)=>prToast(m,t==='success'?'ok':t==='error'?'err':'ok');

  /* ─── TABS ─── */
  function switchTab(name){
    document.querySelectorAll('.pr-tab').forEach(t=>t.classList.remove('on'));
    document.querySelectorAll('.pr-aside-btn[data-tab]').forEach(b=>b.classList.remove('on'));
    const tab=document.getElementById('tab-'+name);
    if(tab) tab.classList.add('on');
    const btn=document.querySelector(`.pr-aside-btn[data-tab="${name}"]`);
    if(btn) btn.classList.add('on');
    if(name==='messages' && auth.currentUser) initMessages(auth.currentUser.uid);
  }
  document.querySelectorAll('.pr-aside-btn[data-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>switchTab(btn.dataset.tab));
  });

  /* ─── AUTH GUARD ─── */
  auth.onAuthStateChanged(async user=>{
    if(!user){window.location.href='/login';return}
    await loadProfile(user);
    await loadOrders(user.uid);
    await loadAddresses(user.uid);
    setupPhotoUpload(user);
    initRetention(user.uid);
    if(typeof lucide!=='undefined') lucide.createIcons();
  });

  /* ─── PROFIL ─── */
  async function loadProfile(user){
    try{
      const shopSnap=await db.collection('shops').where('ownerEmail','==',user.email).get();
      const role=shopSnap.empty?'Client':'Vendeur';

      const docRef=db.collection('users').doc(user.uid);
      const doc=await docRef.get();
      let data={name:user.displayName||'',email:user.email,role:role.toLowerCase()};
      if(doc.exists) data={...data,...doc.data()};
      else await docRef.set({...data,createdAt:new Date()},{merge:true});

      const name=data.name||'Utilisateur';
      const initials=name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'AU';

      // Hero
      document.getElementById('pr-hero-name').innerHTML=`${name.split(' ')[0]||'Bon'}<br><em>${name.split(' ').slice(1).join(' ')||'retour'}</em>`;
      document.getElementById('pr-hero-role').textContent=role;
      document.getElementById('pr-hero-email').textContent=user.email;
      document.getElementById('pr-wm').textContent=initials;
      document.getElementById('pr-initials').textContent=initials;

      // Form
      document.getElementById('pr-name').value=name;
      document.getElementById('pr-email').value=user.email;
      document.getElementById('pr-role-input').value=role;

      // Photo
      if(user.photoURL){
        const img=document.getElementById('pr-avatar-img');
        img.src=user.photoURL;img.style.display='block';
        document.getElementById('pr-initials').style.display='none';
      }
    }catch(e){console.error(e)}
  }

  document.getElementById('pr-save-btn').addEventListener('click',async()=>{
    const user=auth.currentUser;if(!user)return;
    const newName=document.getElementById('pr-name').value.trim();
    if(!newName){prToast('Le nom ne peut pas être vide.','err');return}
    const btn=document.getElementById('pr-save-btn');
    btn.querySelector('span').textContent='Enregistrement…';btn.disabled=true;
    try{
      await user.updateProfile({displayName:newName});
      await db.collection('users').doc(user.uid).update({name:newName});
      document.getElementById('pr-hero-name').innerHTML=`${newName.split(' ')[0]||'Bon'}<br><em>${newName.split(' ').slice(1).join(' ')||'retour'}</em>`;
      document.getElementById('pr-wm').textContent=newName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
      prToast('Profil mis à jour !','ok');
    }catch(e){prToast('Erreur de mise à jour.','err')}
    finally{btn.querySelector('span').textContent='Enregistrer les modifications';btn.disabled=false}
  });

  /* ─── PHOTO ─── */
  function setupPhotoUpload(user){
    document.getElementById('pr-upload-btn').addEventListener('click',e=>{
      e.preventDefault();document.getElementById('pr-file-input').click();
    });
    document.getElementById('pr-file-input').addEventListener('change',async e=>{
      const file=e.target.files[0];if(!file)return;
      if(!file.type.startsWith('image/')){prToast('Format non supporté.','err');return}
      if(file.size>2*1024*1024){prToast('Image trop lourde (max 2 Mo).','err');return}
      const btn=document.getElementById('pr-upload-btn');
      btn.style.opacity='.4';btn.style.pointerEvents='none';
      try{
        const ref=storage.ref(`users/${user.uid}/profile.jpg`);
        const snap=await ref.put(file);
        const url=await snap.ref.getDownloadURL();
        await user.updateProfile({photoURL:url});
        await db.collection('users').doc(user.uid).update({photoURL:url});
        const img=document.getElementById('pr-avatar-img');
        img.src=url;img.style.display='block';
        document.getElementById('pr-initials').style.display='none';
        prToast('Photo mise à jour !','ok');
      }catch(err){prToast('Erreur upload.','err')}
      finally{btn.style.opacity='1';btn.style.pointerEvents='auto';e.target.value=''}
    });
  }

  /* ─── DÉCONNEXION ─── */
  document.getElementById('pr-logout-btn').addEventListener('click',async()=>{
    if(confirm('Se déconnecter ?')){
      await auth.signOut();window.location.href='/login';
    }
  });

  /* ─── ORDERS ─── */
  function getRetention(){
    const v=Number(localStorage.getItem('ac_order_retention_days'));
    return Number.isFinite(v)&&v>=1?v:DEFAULT_RETENTION;
  }
  function initRetention(uid){
    const inp=document.getElementById('pr-retention-input');
    inp.value=getRetention();
    inp.addEventListener('change',async()=>{
      const val=Math.max(7,Math.min(180,Number(inp.value)||DEFAULT_RETENTION));
      localStorage.setItem('ac_order_retention_days',String(val));
      inp.value=val;
      await loadOrders(uid);
    });
  }
  async function purgeOrders(uid,days){
    try{
      const cutoff=new Date(Date.now()-days*864e5);
      const snap=await db.collection('orders').where('userId','==',uid).get();
      for(const doc of snap.docs){
        const o=doc.data(),st=(o.status||'').toLowerCase();
        if(!['delivered','cancelled'].some(s=>st.includes(s[0]))) continue;
        const d=o.updatedAt?.toDate?.()??o.createdAt?.toDate?.()??new Date(0);
        if(d<cutoff) await db.collection('orders').doc(doc.id).delete();
      }
    }catch(e){}
  }
  async function loadOrders(uid){
    try{
      await purgeOrders(uid,getRetention());
      let snap;
      try{snap=await db.collection('orders').where('userId','==',uid).orderBy('createdAt','desc').get()}
      catch{snap=await db.collection('orders').where('userId','==',uid).get()}

      const orders=snap.docs.map(d=>({id:d.id,...d.data()}));
      const totalSpent=orders.reduce((s,o)=>s+(o.total||0),0);
      const wishlist=JSON.parse(localStorage.getItem('ac_wishlist')||'[]').length;

      document.getElementById('pr-stat-orders').textContent=orders.length;
      document.getElementById('pr-stat-spent').textContent=new Intl.NumberFormat('fr-FR').format(totalSpent)+' FCFA';
      document.getElementById('pr-stat-wishlist').textContent=wishlist;

      renderOrders(orders);
    }catch(e){console.error(e)}
  }

  function statusBadge(status){
    const s=(status||'pending').toLowerCase();
    if(s.includes('livr')||s==='delivered') return{label:'Livré',cls:'st-done'};
    if(s.includes('annul')||s==='cancelled') return{label:'Annulé',cls:'st-cancel'};
    if(s.includes('expéd')||s==='shipped') return{label:'Expédié',cls:'st-ship'};
    if(s.includes('prép')||s.includes('seller')) return{label:'En préparation',cls:'st-prep'};
    return{label:'En attente',cls:'st-wait'};
  }

  function renderOrders(orders){
    const c=document.getElementById('pr-orders-list');
    if(!orders.length){
      c.innerHTML=`<div class="pr-empty">
        <div class="pr-empty-icon">∅</div>
        <p>Aucune commande pour le moment</p>
        <a href="catalogue.html">Découvrir le catalogue →</a>
      </div>`;
      if(lucide) lucide.createIcons();return;
    }
    c.innerHTML=orders.map(o=>{
      const date=o.createdAt?.toDate?o.createdAt.toDate().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'—';
      const total=new Intl.NumberFormat('fr-FR').format(o.total||0);
      const {label,cls}=statusBadge(o.status);
      const items=o.items?.length||0;
      return `<div class="pr-order-item">
        <div>
          <div class="pr-order-id">#${o.id.slice(0,8).toUpperCase()}</div>
          <div class="pr-order-title">${items} article${items>1?'s':''}</div>
          <div class="pr-order-meta">${date}</div>
        </div>
        <div class="pr-order-right">
          <div class="pr-order-price">${total} FCFA</div>
          <span class="pr-badge-status ${cls}">${label}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ─── ADRESSES ─── */
  async function loadAddresses(uid){
    const snap=await db.collection('users').doc(uid).collection('addresses').get();
    const c=document.getElementById('pr-addr-list');
    if(snap.empty){
      c.innerHTML=`<div class="pr-empty" style="grid-column:1/-1">
        <div class="pr-empty-icon">⌂</div>
        <p>Aucune adresse enregistrée</p>
      </div>`;
      if(lucide) lucide.createIcons();return;
    }
    c.innerHTML=snap.docs.map(doc=>{
      const a=doc.data();
      return `<div class="pr-addr-card">
        <button class="pr-addr-del" onclick="prDeleteAddr('${doc.id}')"><i data-lucide="trash-2"></i></button>
        <div class="pr-addr-tag">Adresse</div>
        <div class="pr-addr-name">${a.name}</div>
        <div class="pr-addr-detail"><i data-lucide="phone"></i> ${a.phone}</div>
        <div class="pr-addr-detail"><i data-lucide="map-pin"></i> ${a.city}</div>
        <div class="pr-addr-detail"><i data-lucide="navigation"></i> ${a.description||a.desc||''}</div>
      </div>`;
    }).join('');
    if(lucide) lucide.createIcons();
  }

  window.prDeleteAddr=async(id)=>{
    if(!confirm('Supprimer cette adresse ?')) return;
    await db.collection('users').doc(auth.currentUser.uid).collection('addresses').doc(id).delete();
    loadAddresses(auth.currentUser.uid);
    prToast('Adresse supprimée.','ok');
  };

  // Modal adresse
  const modal=document.getElementById('pr-addr-modal');
  document.getElementById('pr-add-addr-btn').addEventListener('click',()=>modal.classList.add('on'));
  document.getElementById('pr-modal-close').addEventListener('click',()=>modal.classList.remove('on'));
  document.getElementById('pr-modal-cancel').addEventListener('click',()=>modal.classList.remove('on'));

  document.getElementById('pr-addr-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const user=auth.currentUser;if(!user)return;
    const btn=e.target.querySelector('[type=submit]');
    btn.querySelector('span').textContent='Sauvegarde…';btn.disabled=true;
    try{
      await db.collection('users').doc(user.uid).collection('addresses').add({
        name:document.getElementById('addr-name').value.trim(),
        phone:document.getElementById('addr-phone').value.trim(),
        city:document.getElementById('addr-city').value,
        description:document.getElementById('addr-desc').value.trim(),
        createdAt:new Date()
      });
      modal.classList.remove('on');
      e.target.reset();
      loadAddresses(user.uid);
      prToast('Adresse ajoutée !','ok');
    }catch(err){prToast('Erreur d\'ajout.','err')}
    finally{btn.querySelector('span').textContent='Enregistrer';btn.disabled=false}
  });

  /* ─── MESSAGES ─── */
  function initMessages(uid){
    if(typeof window.subscribeUserChats!=='function') return;
    window.subscribeUserChats(uid,chats=>{
      const badge=document.getElementById('pr-msg-badge');
      if(badge){badge.textContent=chats.length;badge.style.display=chats.length?'inline':'none'}
      const c=document.getElementById('pr-msg-list');
      if(!chats.length){
        c.innerHTML=`<div class="pr-empty">
          <div class="pr-empty-icon">✉</div>
          <p>Aucun message</p>
        </div>`;
        if(lucide) lucide.createIcons();return;
      }
      c.innerHTML=chats.map(ch=>{
        const isBuyer=ch.buyerId===uid;
        const partner=isBuyer?(ch.shopName||'Vendeur'):(ch.buyerName||'Client');
        const init=partner.slice(0,2).toUpperCase();
        return `<a href="messages.html?chatId=${ch.id}" class="pr-msg-item">
          <div class="pr-msg-av">${init}</div>
          <div class="pr-msg-body">
            <div class="pr-msg-shop">${partner}</div>
            <div class="pr-msg-last">${ch.lastMessage||'…'}</div>
          </div>
          <div class="pr-msg-arrow"><i data-lucide="arrow-right"></i></div>
        </a>`;
      }).join('');
      if(lucide) lucide.createIcons();
    },err=>console.warn(err));
  }

});