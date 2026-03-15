/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/contact.js
 * Page contact.html — Formulaire de contact
 * ═══════════════════════════════════════════════════════════════════════════
 */ 

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('ct') && !document.querySelector('.ct-wrapper')) return;
  
  window.handleContactSubmit = function (event) {
    event.preventDefault();
    var btn = event.target.querySelector('button[type="submit"]');
    var orig = btn.innerHTML;
    btn.innerHTML = '<span>Envoi en cours…</span>';
    setTimeout(function () {
      if (window.showToast) window.showToast('Message envoyé avec succès. Nous vous contacterons très vite.', 'success');
      else alert('Message envoyé !');
      event.target.reset();
      btn.innerHTML = orig;
    }, 1500);
  };
});
