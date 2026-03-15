/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/about.js
 * Page apropos.html — À propos d'Aurum
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var page = document.getElementById('ab-hero') || document.querySelector('.ab-hero');
  if (!page) return;

  /* Compteurs animés depuis Firebase */
  function loadAproposStats() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      setFallback();
      return;
    }
    var db = firebase.firestore();
    Promise.all([
      db.collectionGroup('products').get(),
      db.collection('shops').get(),
    ]).then(function (results) {
      var prodsSnap = results[0], shopsSnap = results[1];
      var totalRating = 0, rCount = 0;
      prodsSnap.forEach(function (d) {
        if (d.data().rating) { totalRating += d.data().rating; rCount++; }
      });
      var avg = rCount > 0 ? (totalRating / rCount).toFixed(1) : 4.5;
      setTarget('stats-products', prodsSnap.size || 500);
      setTarget('stats-shops',    shopsSnap.size || 25);
      setTarget('stats-rating',   avg);
    }).catch(setFallback);
  }

  function setFallback() {
    setTarget('stats-products', 500);
    setTarget('stats-shops',    25);
    setTarget('stats-rating',   4.5);
  }
  
  function setTarget(id, v) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('data-target', v);
  }

  function animCounter(el) {
    var target  = parseFloat(el.getAttribute('data-target'));
    var suffix  = el.getAttribute('data-suffix') || '';
    var isFloat = !Number.isInteger(target);
    var dur = 2200, start = performance.now();
    (function step(now) {
      var p    = Math.min((now - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 4);
      el.textContent = (isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease)) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    })(start);
  }

  loadAproposStats();
  var cObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animCounter(e.target); cObs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });

  // Lance après chargement des stats
  setTimeout(function () {
    document.querySelectorAll('.counter').forEach(function (c) { cObs.observe(c); });
  }, 400);
});
