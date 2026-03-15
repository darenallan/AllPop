/**
 * seller-application.js
 * Formulaire de candidature vendeur avec upload de fichiers
 * Section §17 de prime.js
 */

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('sa-form')) return;

  var currentStep = 1;

  window.saGoTo = function(step) {
    if (step > currentStep) {
      var cur    = document.querySelector('.sa-section[data-section="'+currentStep+'"]');
      var inputs = cur ? cur.querySelectorAll('[required]') : [];
      var valid  = true;
      inputs.forEach(function(inp){ if(!inp.value.trim()){ valid=false; inp.style.borderBottomColor='var(--danger)'; setTimeout(function(){inp.style.borderBottomColor='';},2000); } });
      if (!valid) { if(window.showToast) window.showToast('Veuillez remplir tous les champs obligatoires.','danger'); return; }
    }
    var from = document.querySelector('.sa-section[data-section="'+currentStep+'"]');
    var to   = document.querySelector('.sa-section[data-section="'+step+'"]');
    if (from) from.classList.remove('active');
    if (to)   to.classList.add('active');
    document.querySelectorAll('.sa-step').forEach(function(s){
      var n = parseInt(s.dataset.step);
      s.classList.remove('active','done');
      if (n===step) s.classList.add('active');
      else if (n<step) s.classList.add('done');
    });
    currentStep = step;
    var stepsWrap = document.querySelector('.sa-steps-wrap');
    if (stepsWrap) window.scrollTo({ top:stepsWrap.offsetTop-10, behavior:'smooth' });
  };

  window.saFile = function(input, areaId, lblId) {
    if (input.files && input.files[0]) {
      var f  = input.files[0];
      var nm = f.name.length > 20 ? f.name.substring(0,20)+'…' : f.name;
      var sz = (f.size/1024/1024).toFixed(2);
      var lbl = document.getElementById(lblId); if(lbl) lbl.textContent = nm+' ('+sz+' MB)';
      var area= document.getElementById(areaId); if(area) area.classList.add('done');
    }
  };

  window.toggleCk = function(cb) { cb.closest('.sa-ck').classList.toggle('checked', cb.checked); };

  document.getElementById('sa-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (typeof firebase === 'undefined') { if(window.showToast) window.showToast('Firebase non détecté.','danger'); return; }
    var submitBtn = document.getElementById('sa-submit');
    var prog      = document.getElementById('sa-prog');
    var fill      = document.getElementById('sa-prog-fill');
    var txt       = document.getElementById('sa-prog-txt');
    if (submitBtn) submitBtn.style.display = 'none';
    if (prog)      prog.style.display = 'block';

    try {
      var db2     = firebase.firestore();
      var storage = firebase.storage();
      var fd      = new FormData(e.target);
      var shopName= (fd.get('shop_name')||'boutique').replace(/\s+/g,'_').toLowerCase();
      var ts      = Date.now();
      var folder  = 'candidatures/' + shopName + '_' + ts;

      var pm = [];
      ['payment_mobile_money','payment_cash','payment_card','payment_transfer'].forEach(function(n){ if(fd.get(n)) pm.push(fd.get(n)); });

      var data = {
        shop_name:      fd.get('shop_name'), legal_status: fd.get('legal_status'),
        rccm:           fd.get('rccm')||'',  ifu_num:      fd.get('ifu')||'',
        owner_name:     fd.get('owner_name'),owner_role:   fd.get('owner_role'),
        phone:          fd.get('phone'),     email:        fd.get('email'),
        address:        fd.get('address'),   bank_account: fd.get('bank_account')||'',
        payment_methods:pm, billing_address:fd.get('billing_address')||'',
        categories:     fd.get('categories'),brand_story:  fd.get('brand_story'),
        delivery_time:  fd.get('delivery_time')||'', return_policy:fd.get('return_policy')||'',
        social_instagram:fd.get('social_instagram')||'', social_website:fd.get('social_website')||'',
        status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (txt) txt.textContent = 'Envoi des fichiers…';
      var files = [
        { id:'inp-logo', field:'logo_url',     name:'logo'    },
        { id:'inp-id',   field:'id_card_url',  name:'id_card' },
        { id:'inp-rccm', field:'rccm_doc_url', name:'rccm_doc'},
        { id:'inp-ifu',  field:'ifu_doc_url',  name:'ifu_doc' },
      ];
      var active = files.filter(function(f){ return document.getElementById(f.id) && document.getElementById(f.id).files.length>0; });
      var done   = 0;
      for (var fi of active) {
        var file = document.getElementById(fi.id).files[0];
        var ext  = file.name.split('.').pop();
        var ref  = storage.ref(folder+'/'+fi.name+'.'+ext);
        var task = ref.put(file);
        await new Promise(function(res,rej){ task.on('state_changed', function(snap){ if(fill) fill.style.width=((done+snap.bytesTransferred/snap.totalBytes)/active.length*100)+'%'; }, rej, async function(){ data[fi.field]=await task.snapshot.ref.getDownloadURL(); done++; res(); }); });
      }
      if (txt)  txt.textContent = 'Finalisation…';
      if (fill) fill.style.width = '100%';
      await db2.collection('seller_applications').add(data);

      e.target.style.display = 'none';
      if (prog) prog.style.display = 'none';
      var success = document.getElementById('sa-success');
      if (success) { success.style.display='block'; success.scrollIntoView({behavior:'smooth',block:'center'}); }
    } catch(err){
      console.error(err);
      if(window.showToast) window.showToast('Erreur : '+err.message,'danger');
      if(submitBtn) submitBtn.style.display='inline-flex';
      if(prog) prog.style.display='none';
    }
  });
});