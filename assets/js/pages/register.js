/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/register.js
 * Page register.html — Création de compte utilisateur
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('btn-register');
  if (!btn) return;

  btn.addEventListener('click', async function() {
    var name        = (document.getElementById('reg-name')?.value||'').trim();
    var email       = (document.getElementById('reg-email')?.value||'').trim();
    var phone       = (document.getElementById('reg-phone')?.value||'').trim();
    var pass        = document.getElementById('reg-pass')?.value||'';
    var passConfirm = document.getElementById('reg-pass-confirm')?.value||'';
    var errorDiv    = document.getElementById('error-message');

    function showErr(msg) { if(errorDiv) errorDiv.textContent=msg; if(window.showToast) window.showToast(msg,'danger'); }

    if (!name||!email||!phone||!pass) { showErr('Veuillez remplir tous les champs.'); return; }
    if (pass !== passConfirm)  { showErr('Les mots de passe ne correspondent pas.'); return; }
    if (pass.length < 6)       { showErr('Mot de passe trop court (min 6 caractères).'); return; }
    if (phone.length < 6)      { showErr('Numéro de téléphone invalide.'); return; }

    var orig = btn.innerHTML;
    btn.innerHTML = '<span>Vérification en cours…</span>'; btn.disabled = true;

    try {
      // Vérifier que l'email n'existe pas déjà
      var emailSnap = await window.db.collection('users').where('email','==',email).limit(1).get();
      if (!emailSnap.empty) { showErr('Cet email est déjà associé à un compte.'); btn.innerHTML = orig; btn.disabled = false; return; }

      // Vérifier que le téléphone n'existe pas déjà
      var phoneSnap = await window.db.collection('users').where('phone','==',phone).limit(1).get();
      if (!phoneSnap.empty) { showErr('Ce numéro de téléphone est déjà utilisé.'); btn.innerHTML = orig; btn.disabled = false; return; }

      btn.innerHTML = '<span>Création en cours…</span>';

      // Créer le compte Firebase
      var cred = await window.auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName:name });
      await window.db.collection('users').doc(cred.user.uid).set({
        name:name, email:email, phone:phone, role:'client', createdAt:new Date(),
      });

      var finish = function(){ if(window.showToast) window.showToast('Compte créé avec succès !','success'); setTimeout(function(){ window.location.href='index.html'; },1000); };
      if (typeof window.syncCurrentUser === 'function') window.syncCurrentUser(cred.user).then(finish).catch(finish);
      else finish();
    } catch(error) {
      var msgs = {
        'auth/email-already-in-use': 'Cet email est déjà associé à un compte.',
        'auth/invalid-email':        'Format d\'email invalide.',
        'auth/weak-password':        'Mot de passe trop faible.',
      };
      showErr(msgs[error.code] || error.message || 'Erreur lors de la création.');
      btn.innerHTML = orig; btn.disabled = false;
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
