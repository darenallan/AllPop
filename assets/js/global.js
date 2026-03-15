/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AURUM — global.js  v1
 * Scripts globaux — chargés sur TOUTES les pages
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CONTIENT :
 *   • Cursor ring/dot animation (supports multiple page prefixes)
 *   • Reveal-on-scroll (.rv elements with IntersectionObserver)
 *   • Toast notification system (window.showToast)
 *   • Mobile menu toggle
 *   • Footer year update
 *   • Pagination layout adjustments
 *
 * À charger en PREMIER (defer), AVANT les scripts page-spécifiques.
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {

  /* ══════════════════════════════════════════════════════════
     §0  CURSOR UNIVERSEL
     Fonctionne sur toutes les pages qui ont #cur-ring / #cur-dot
     Préfixes supportés : cur, bp, ct, lg, pr, rg, wl, sd, dv, ch
     ══════════════════════════════════════════════════════════ */
  (function initCursor() {
    const PAIRS = [
      ['cur-ring', 'cur-dot'],
      ['bp-ring',  'bp-dot'],
      ['ct-ring',  'ct-dot'],
      ['lg-ring',  'lg-dot'],
      ['pr-ring',  'pr-dot'],
      ['rg-ring',  'rg-dot'],
      ['wl-ring',  'wl-dot'],
      ['sd-ring',  'sd-dot'],
      ['dv-ring',  'dv-dot'],
    ];

    const HOVER_CLASSES = {
      'cur-ring': 'cur-h', 'bp-ring': 'bp-h', 'ct-ring': 'ct-h',
      'lg-ring':  'lg-h',  'pr-ring': 'pr-h', 'rg-ring': 'rg-h',
      'wl-ring':  'wl-h',  'sd-ring': 'sd-h', 'dv-ring': 'dv-h',
    };

    const HOVER_SEL = 'a,button,input,select,textarea,[onclick],[data-h],.bp-card,.inbox-conv-item,.color-swatch,.so-why-card,.so-req-card,.so-ps';

    let mx = 0, my = 0, rx = 0, ry = 0;
    let ringEl = null, dotEl = null, hoverClass = 'cur-h';
    let animStarted = false;

    function findElements() {
      for (const [rId, dId] of PAIRS) {
        const r = document.getElementById(rId);
        const d = document.getElementById(dId);
        if (r && d) {
          ringEl = r; dotEl = d;
          hoverClass = HOVER_CLASSES[rId] || 'cur-h';
          return true;
        }
      }
      return false;
    }

    function loop() {
      if (!ringEl) return;
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ringEl.style.left = rx + 'px';
      ringEl.style.top  = ry + 'px';
      requestAnimationFrame(loop);
    }

    function start() {
      if (!findElements()) return;
      if (animStarted) return;
      animStarted = true;

      document.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (dotEl) { dotEl.style.left = mx + 'px'; dotEl.style.top = my + 'px'; }
      });
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(HOVER_SEL)) document.body.classList.add(hoverClass);
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(HOVER_SEL)) document.body.classList.remove(hoverClass);
      });

      requestAnimationFrame(loop);
    }

    start();
  })();

  /* ══════════════════════════════════════════════════════════
     §1  REVEAL ON SCROLL UNIVERSEL
     Observe tous les éléments .rv et ajoute .on à l'intersection
     ══════════════════════════════════════════════════════════ */
  (function initReveal() {
    const els = document.querySelectorAll('.rv');
    if (!els.length) return;
    
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ══════════════════════════════════════════════════════════
     §2  TOAST NOTIFICATION SYSTEM
     Accessible via window.showToast(message, type)
     ══════════════════════════════════════════════════════════ */
  window.showToast = function(message, type = 'info') {
    // Guard : vérifier si window.showToast est déjà défini dans config.js
    if (typeof window._originalShowToast === 'function') {
      return window._originalShowToast(message, type);
    }

    // Version par défaut si pas de config.js
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'danger' ? '#D94F4F' : type === 'success' ? '#4A9E72' : '#C8A84B'};
      color: #FEFCF8;
      padding: 14px 20px;
      border-radius: 6px;
      font-family: Syne, sans-serif;
      font-size: 13px;
      z-index: 99999;
      animation: slideIn .3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut .3s ease'; }, 3000);
    setTimeout(() => { toast.remove(); }, 3300);
  };

  /* ══════════════════════════════════════════════════════════
     §3  MOBILE MENU TOGGLE (si présent)
     ══════════════════════════════════════════════════════════ */
  (function initMobileMenu() {
    const burgerBtn = document.querySelector('.mobile-burger, [data-burger]');
    const drawer = document.getElementById('mobile-drawer') || document.querySelector('[data-drawer]');
    const overlay = document.getElementById('mobile-overlay') || document.querySelector('.mobile-overlay');

    if (burgerBtn && drawer) {
      burgerBtn.addEventListener('click', function() {
        drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
        document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
      });

      if (overlay) {
        overlay.addEventListener('click', function() {
          drawer.classList.remove('open');
          overlay.classList.remove('show');
          document.body.style.overflow = '';
        });
      }

      // Fermer le drawer au clic sur un lien
      drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
          drawer.classList.remove('open');
          if (overlay) overlay.classList.remove('show');
          document.body.style.overflow = '';
        });
      });
    }
  })();

  /* ══════════════════════════════════════════════════════════
     §4  FOOTER YEAR UPDATE
     Met à jour la date © dans le footer
     ══════════════════════════════════════════════════════════ */
  (function updateFooterYear() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  })();

  /* ══════════════════════════════════════════════════════════
     §5  PAGINATION LAYOUT ADJUSTMENT (si présent)
     Réduit les rembourrages sur petits écrans
     ══════════════════════════════════════════════════════════ */
  (function adjustPagination() {
    if (window.innerWidth < 768) {
      document.querySelectorAll('.page-padding, [data-page-padding]').forEach(el => {
        el.style.paddingLeft = '16px';
        el.style.paddingRight = '16px';
      });
    }
  })();

});

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FIN — global.js
 * ═══════════════════════════════════════════════════════════════════════════
 */
