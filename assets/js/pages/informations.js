/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — informations.js  (anciennement A.js)
 * Page informations.html — FAQ · CGU · Mentions Légales · Confidentialité
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var page = document.getElementById('hl-page') || document.querySelector('.hl-hero');
  if (!page) return;

  /* ══════════════════════════════════════════════════════════════
     CURSOR
     ══════════════════════════════════════════════════════════════ */
  var ring = document.getElementById('cur-ring');
  var dot  = document.getElementById('cur-dot');

  if (ring && dot) {
    document.addEventListener('mousemove', function (e) {
      ring.style.left = e.clientX + 'px';
      ring.style.top  = e.clientY + 'px';
      dot.style.left  = e.clientX + 'px';
      dot.style.top   = e.clientY + 'px';
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('hl-h'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('hl-h'); });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     TABS — navigation par pillules + hash URL
     ══════════════════════════════════════════════════════════════ */
  var VALID_TABS = ['faq', 'cgu', 'mentions', 'privacy'];

  function switchTab(name) {
    if (VALID_TABS.indexOf(name) === -1) name = 'faq';

    document.querySelectorAll('.hl-tab').forEach(function (t) { t.classList.remove('on'); });
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('on'); });

    var tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('on');

    document.querySelectorAll('[data-tab="' + name + '"]').forEach(function (b) {
      b.classList.add('on');
    });

    // Scroll vers le contenu sur mobile
    if (window.innerWidth < 1024) {
      var main = document.querySelector('.hl-main');
      if (main) main.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Clic sur les pills
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var name = btn.dataset.tab;
      switchTab(name);
      history.replaceState(null, '', '#' + name);
    });
  });

  // Hash URL au chargement — permet de linker directement vers #privacy
  var hash = location.hash.replace('#', '');
  if (hash && VALID_TABS.indexOf(hash) !== -1) {
    switchTab(hash);
  }

  /* ══════════════════════════════════════════════════════════════
     FAQ ACCORDION — animation fluide frame par frame
     ══════════════════════════════════════════════════════════════ */
  function ease(t) { return t < 0.5 ? 8*t*t*t*t : 1 - 8*(--t)*t*t*t; }

  function animH(el, from, to, dur, done) {
    var start = performance.now();
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      el.style.maxHeight = (from + (to - from) * ease(p)) + 'px';
      if (p < 1) { requestAnimationFrame(step); }
      else if (done) { done(); }
    })(start);
  }

  document.querySelectorAll('.hl-faq-item').forEach(function (item) {
    var btn   = item.querySelector('.hl-faq-q');
    var ans   = item.querySelector('.hl-faq-a');
    var inner = item.querySelector('.hl-faq-a-inner');
    if (!btn || !ans || !inner) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Fermer les autres items ouverts
      document.querySelectorAll('.hl-faq-item.open').forEach(function (other) {
        if (other === item) return;
        var oa   = other.querySelector('.hl-faq-a');
        var from = parseFloat(oa.style.maxHeight) || oa.scrollHeight;
        other.classList.remove('open');
        oa.style.opacity = '0';
        other.querySelector('.hl-faq-q').setAttribute('aria-expanded', 'false');
        animH(oa, from, 0, 300, function () { oa.style.maxHeight = '0'; });
      });

      if (isOpen) {
        // Fermer cet item
        var from = parseFloat(ans.style.maxHeight) || ans.scrollHeight;
        item.classList.remove('open');
        ans.style.opacity = '0';
        btn.setAttribute('aria-expanded', 'false');
        animH(ans, from, 0, 300, function () { ans.style.maxHeight = '0'; });
      } else {
        // Ouvrir cet item
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var to = inner.scrollHeight + 48;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            ans.style.opacity = '1';
            animH(ans, 0, to, 420, function () {
              ans.style.maxHeight = 'none'; // libère le scroll si contenu s'agrandit
            });
          });
        });
      }
    });
  });

  /* ══════════════════════════════════════════════════════════════
     REVEAL ON SCROLL
     ══════════════════════════════════════════════════════════════ */
  var revEls = document.querySelectorAll('.rv');

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revEls.forEach(function (el) { obs.observe(el); });
  } else {
    // Fallback : tout afficher directement
    revEls.forEach(function (el) { el.classList.add('on'); });
  }

  /* ══════════════════════════════════════════════════════════════
     LUCIDE ICONS
     ══════════════════════════════════════════════════════════════ */
  if (typeof lucide !== 'undefined') { lucide.createIcons(); }

});