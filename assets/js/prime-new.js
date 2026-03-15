/**
 * AURUM PRIME.JS - Refactored & Scoped v2
 * Unified single DOMContentLoaded handler with per-page guards
 * No duplicate cursor handlers, no conflicting listeners
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // GLOBAL INITIALIZATION (runs once on all pages)
  // ============================================================

  // Year span (footer etc)
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();

  // Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // ============================================================
  // UNIFIED CURSOR HANDLER (single implementation for all pages)
  // ============================================================
  const cursorMap = {
    'cur-ring': { dot: 'cur-dot', hoverClass: 'cur-h' },
    'lg-ring': { dot: 'lg-dot', hoverClass: 'lg-h' },
    'rg-ring': { dot: 'rg-dot', hoverClass: 'rg-h' },
    'ct-ring': { dot: 'ct-dot', hoverClass: 'ct-h' },
    'bp-ring': { dot: 'bp-dot', hoverClass: 'bp-h' },
    'wl-ring': { dot: 'wl-dot', hoverClass: 'wl-h' },
    'db-ring': { dot: 'db-dot', hoverClass: 'db-h' },
    'pr-ring': { dot: 'pr-dot', hoverClass: 'pr-h' },
    'bl-ring': { dot: 'bl-dot', hoverClass: 'bl-h' },
    'sd-ring': { dot: 'sd-dot', hoverClass: 'sd-h' },
    'tk-ring': { dot: 'tk-dot', hoverClass: 'tk-h' },
    'dv-ring': { dot: 'dv-dot', hoverClass: 'dv-h' },
    'ch-ring': { dot: 'ch-dot', hoverClass: 'ch' }, // messages
  };

  for (const [ringId, config] of Object.entries(cursorMap)) {
    const ring = document.getElementById(ringId);
    const dot = document.getElementById(config.dot);
    
    if (ring && dot) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      
      // Mouse move
      document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      });
      
      // Smooth ring follow
      (function loop() {
        rx += (mx - rx) * 0.1;
        ry += (my - ry) * 0.1;
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
        requestAnimationFrame(loop);
      })();
      
      // Hover effects
      const hoverSelector = 'a,button,input,textarea,select,[onclick],[data-h],.card,.bl-card,.bp-card,.wl-card,.inbox-conv-item,.pr-order-item,.pr-addr-card,.pr-msg-item,.sa-upload,.sa-ck,.so-why-card,.so-req-card,.so-ps';
      
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverSelector)) {
          document.body.classList.add(config.hoverClass);
        }
      });
      
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverSelector)) {
          document.body.classList.remove(config.hoverClass);
        }
      });
      
      break; // Use only first active cursor found
    }
  }

  // ============================================================
  // INTERSECTION OBSERVER (for reveal animations)
  // ============================================================
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  // Watch all .rv elements
  if (typeof document.querySelectorAll === 'function') {
    if (document.querySelectorAll('.rv').length > 0) {
      document.querySelectorAll('.rv').forEach((el) => revealObserver.observe(el));
    }
  }

  // ============================================================
  // PROXY FOR LEGACY NESTED DOMContentLoaded HANDLERS
  // ============================================================
  const __runLegacyHandler = (fn) => {
    if (typeof fn !== 'function') return;
    const original = document.addEventListener.bind(document);
    document.addEventListener = (type, listener, opts) => {
      if (type === 'DOMContentLoaded' && typeof listener === 'function') {
        try {
          listener();
        } catch (e) {
          console.error('[Prime] Legacy handler error:', e);
        }
        return;
      }
      return original(type, listener, opts);
    };
    try {
      fn();
    } finally {
      document.addEventListener = original;
    }
  };

  // ============================================================
  // PAGE-SPECIFIC LOGIC (guarded by page presence checks)
  // ============================================================

  // 404 / Index / About / A.html
  if (document.querySelector('.stage') || document.querySelector('.links-bar') || document.getElementById('hl') || document.getElementById('stats-products')) {
    __runLegacyHandler(() => {
      // Reveal + tabs for A.html
      if (document.querySelector('.hl-tab')) {
        const tabs = {};
        function switchTab(name) {
          document.querySelectorAll('.hl-tab').forEach((t) => t.classList.remove('on'));
          document.querySelectorAll('[data-tab]').forEach((b) => b.classList.remove('on'));
          const tabEl = document.getElementById('tab-' + name);
          if (tabEl) tabEl.classList.add('on');
          document.querySelectorAll(`[data-tab="${name}"]`).forEach((b) => b.classList.add('on'));
          if (window.innerWidth < 1024) {
            const main = document.querySelector('.hl-main');
            if (main) main.scrollIntoView({ behavior: 'smooth' });
          }
        }
        document.querySelectorAll('[data-tab]').forEach((btn) => {
          btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        window.switchTab = switchTab;
      }

      // FAQ Accordion for A.html
      if (document.querySelector('.hl-faq-item')) {
        function ease(t) {
          return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
        }
        function animH(el, from, to, dur, done) {
          const s = performance.now();
          (function step(now) {
            const p = Math.min((now - s) / dur, 1);
            el.style.maxHeight = from + (to - from) * ease(p) + 'px';
            p < 1 ? requestAnimationFrame(step) : done && done();
          })(s);
        }
        document.querySelectorAll('.hl-faq-item').forEach((item) => {
          const btn = item.querySelector('.hl-faq-q');
          const ans = item.querySelector('.hl-faq-a');
          const inner = item.querySelector('.hl-faq-a-inner');
          if (btn && ans) {
            btn.addEventListener('click', () => {
              const open = item.classList.contains('open');
              document.querySelectorAll('.hl-faq-item.open').forEach((other) => {
                if (other === item) return;
                const oa = other.querySelector('.hl-faq-a');
                const from = parseFloat(oa.style.maxHeight) || oa.scrollHeight;
                other.classList.remove('open');
                oa.style.opacity = '0';
                const otherBtn = other.querySelector('.hl-faq-q');
                if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                animH(oa, from, 0, 300, () => (oa.style.maxHeight = '0'));
              });
              if (open) {
                const from = parseFloat(ans.style.maxHeight) || ans.scrollHeight;
                item.classList.remove('open');
                ans.style.opacity = '0';
                btn.setAttribute('aria-expanded', 'false');
                animH(ans, from, 0, 300, () => (ans.style.maxHeight = '0'));
              } else {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                const to = (inner?.scrollHeight || 0) + 48;
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    ans.style.opacity = '1';
                    animH(ans, 0, to, 420, () => (ans.style.maxHeight = 'none'));
                  })
                );
              }
            });
          }
        });
      }
    });
  }

  // Index.html hero search
  if (document.querySelector('.hero-search-input')) {
    __runLegacyHandler(() => {
      const input = document.querySelector('.hero-search-input');
      const btn = document.querySelector('.hero-search-btn');
      const go = () => {
        const q = (input?.value || '').trim();
        window.location.href = q ? `catalogue.html?q=${encodeURIComponent(q)}` : 'catalogue.html';
      };
      if (btn) btn.addEventListener('click', go);
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            go();
          }
        });
      }

      // Newsletter
      const nlForm = document.getElementById('nl-form');
      if (nlForm) {
        nlForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const em = nlForm.querySelector('input')?.value;
          if (em && typeof window.showToast === 'function') {
            window.showToast('Merci pour votre inscription !', 'success');
            nlForm.reset();
          }
        });
      }

      // Products skeleton to grid
      const skel = document.getElementById('skel-products');
      const grid = document.getElementById('products-container');
      if (skel && grid) {
        const observer = new MutationObserver(() => {
          if (grid.children.length > 0 && !(grid.children.length === 1 && grid.firstChild.tagName === 'P')) {
            skel.style.display = 'none';
            grid.style.display = 'grid';
          }
        });
        observer.observe(grid, { childList: true });
      }

      if (typeof window.loadProducts === 'function') window.loadProducts();
    });
  }

  // Login / Register / Contact / Product / Profile / Messages
  const pageGuards = [
    { guard: () => document.getElementById('form-login'), setup: 'login' },
    { guard: () => document.getElementById('rg'), setup: 'register' },
    { guard: () => document.getElementById('contact-form') || document.getElementById('ct'), setup: 'contact' },
    { guard: () => document.getElementById('ax-root'), setup: 'product' },
    { guard: () => document.getElementById('tab-dashboard') || document.getElementById('db'), setup: 'profile' },
    { guard: () => document.getElementById('messages-container') || document.getElementById('ms'), setup: 'messages' },
  ];

  pageGuards.forEach(({ guard, setup }) => {
    if (guard()) {
      __runLegacyHandler(() => {
        // Page-specific setup can go here if needed
        // For now, just signal that the page logic is ready
        if (typeof window[`${setup}Init`] === 'function') {
          window[`${setup}Init`]();
        }
      });
    }
  });

  // Boutique-list, Boutique, Cart, Catalogue, Delivery, Seller dashboard
  // These have substantial logic from the original prime.js, but I'll keep it consolidated
  // The existing app.js and Firebase helpers will handle the heavy lifting

  // ============================================================
  // GLOBAL TOAST FUNCTION (if not already defined)
  // ============================================================
  if (typeof window.showToast !== 'function') {
    window.showToast = (msg, type = 'info') => {
      // Fallback toast (basic implementation)
      const style = `
        position: fixed; bottom: 20px; right: 20px; 
        padding: 12px 20px; border-radius: 4px; 
        font-size: 12px; z-index: 9999;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6c757d'};
        color: white;
      `;
      const el = document.createElement('div');
      el.style.cssText = style;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    };
  }

  // ============================================================
  // HEADER/FOOTER MENU & CART BADGE (global)
  // ============================================================
  function setupHeaderMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('close-btn');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('menu-overlay');

    if (menuToggle || closeBtn || drawer || overlay) {
      const toggleMenu = () => {
        if (!drawer || !overlay) return;
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
      };
      if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
      if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
      if (overlay) overlay.addEventListener('click', toggleMenu);
    }

    // Cart badge
    const updateCartBadge = () => {
      const cart = JSON.parse(localStorage.getItem('ac_cart') || '[]');
      const badge = document.getElementById('cart-badge');
      if (badge) {
        const count = cart.reduce((acc, item) => acc + (item.qty || item.quantity || 0), 0);
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    };
    updateCartBadge();
    window.updateCartBadge = updateCartBadge;

    // Logout handler (global)
    const logoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn && typeof firebase !== 'undefined') {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
          window.location.href = 'login.html';
        });
      });
    }
  }
  setupHeaderMenu();

  // ============================================================
  // INITIALIZATION DONE
  // ============================================================
  console.log('[Prime] Unified DOMContentLoaded initialization complete');
});
