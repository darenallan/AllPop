/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/login.js
 * Page login.html — Authentification par email/mot de passe
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';
 
document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('form-login');
  if (!form) return;

  var btn       = document.getElementById('btn-submit');
  var forgotLnk = document.getElementById('forgot-password-link');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var orig = btn ? btn.innerHTML : '';
      if (btn) { btn.innerHTML = '<span>Connexion…</span>'; btn.disabled = true; }

      var email = document.getElementById('login-email').value;
      var pass  = document.getElementById('login-pass').value;

      window.auth.signInWithEmailAndPassword(email, pass)
        .then(function (cred) {
          var finishRedirect = function () {
            var redirectWithRole = function (role) {
              var returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
              if (returnUrl) { window.location.href = returnUrl; return; }
              var ADMIN_MAIL = 'aurumcorporate.d@gmail.com';
              if (email === ADMIN_MAIL || role === 'superadmin' || role === 'admin' || role === 'maintainer') {
                window.location.href = '/theking';
              } else if (role === 'seller') {
                window.location.href = '/seller';
              } else if (role === 'livreur') {
                window.location.href = '/delivery';
              } else {
                window.location.href = '/';
              }
            };

            if (window.db && cred.user && cred.user.uid) {
              window.db.collection('users').doc(cred.user.uid).get()
                .then(function (doc) { redirectWithRole(doc.exists ? doc.data().role || '' : ''); })
                .catch(function () { redirectWithRole(''); });
            } else { redirectWithRole(''); }
          };

          if (typeof window.syncCurrentUser === 'function') {
            window.syncCurrentUser(cred.user).then(finishRedirect).catch(finishRedirect);
          } else { finishRedirect(); }
        })
        .catch(function (error) {
          var msgs = {
            'auth/user-not-found':  'Compte introuvable.',
            'auth/wrong-password':  'Mot de passe incorrect.',
            'auth/invalid-email':   'Email invalide.',
            'auth/user-disabled':   'Compte désactivé.',
            'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
          };
          var msg = msgs[error.code] || 'Erreur de connexion.';
          if (window.showToast) window.showToast('⚠ ' + msg, 'danger');
          else alert('⚠ ' + msg);
          if (btn) { btn.innerHTML = orig; btn.disabled = false; }
        });
    });
  }

  if (forgotLnk) {
    forgotLnk.addEventListener('click', function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('login-email');
      var email   = emailEl ? emailEl.value : '';
      if (!email) { if (window.showToast) window.showToast('Entrez votre email d\'abord.', 'warn'); return; }
      firebase.auth().sendPasswordResetEmail(email)
        .then(function () { if (window.showToast) window.showToast('Email de réinitialisation envoyé à ' + email, 'success'); })
        .catch(function (err) { if (window.showToast) window.showToast('⚠ ' + (err.code === 'auth/user-not-found' ? 'Compte introuvable.' : err.message), 'danger'); });
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
