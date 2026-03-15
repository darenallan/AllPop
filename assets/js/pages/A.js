/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — pages/A.js
 * Page aide.html (A.html) — FAQ, CGU, Mentions légales
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var page = document.getElementById('hl-page') || document.querySelector('.hl-hero');
  if (!page) return;

  /* ── Tabs navigation ── */
  function switchTab(name) {
    document.querySelectorAll('.hl-tab').forEach(function (t) { t.classList.remove('on'); });
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('on'); });
    var tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('on');
    document.querySelectorAll('[data-tab="' + name + '"]').forEach(function (b) { b.classList.add('on'); });
    if (window.innerWidth < 1024) {
      var main = document.querySelector('.hl-main');
      if (main) main.scrollIntoView({ behavior: 'smooth' });
    }
  }
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });

  /* ── FAQ Accordion avec animation fluide ── */
  function ease(t) { return t < 0.5 ? 8*t*t*t*t : 1 - 8*(--t)*t*t*t; }
  function animH(el, from, to, dur, done) {
    var s = performance.now();
    (function step(now) {
      var p = Math.min((now - s) / dur, 1);
      el.style.maxHeight = from + (to - from) * ease(p) + 'px';
      p < 1 ? requestAnimationFrame(step) : (done && done());
    })(s);
  }

  document.querySelectorAll('.hl-faq-item').forEach(function (item) {
    var btn   = item.querySelector('.hl-faq-q');
    var ans   = item.querySelector('.hl-faq-a');
    var inner = item.querySelector('.hl-faq-a-inner');
    if (!btn || !ans || !inner) return;

    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');

      // Fermer les autres
      document.querySelectorAll('.hl-faq-item.open').forEach(function (other) {
        if (other === item) return;
        var oa   = other.querySelector('.hl-faq-a');
        var from = parseFloat(oa.style.maxHeight) || oa.scrollHeight;
        other.classList.remove('open');
        oa.style.opacity = '0';
        other.querySelector('.hl-faq-q').setAttribute('aria-expanded', 'false');
        animH(oa, from, 0, 300, function () { oa.style.maxHeight = '0'; });
      });

      if (open) {
        var from = parseFloat(ans.style.maxHeight) || ans.scrollHeight;
        item.classList.remove('open');
        ans.style.opacity = '0';
        btn.setAttribute('aria-expanded', 'false');
        animH(ans, from, 0, 300, function () { ans.style.maxHeight = '0'; });
      } else {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        var to = inner.scrollHeight + 48;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            ans.style.opacity = '1';
            animH(ans, 0, to, 420, function () { ans.style.maxHeight = 'none'; });
          });
        });
      }
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
});
