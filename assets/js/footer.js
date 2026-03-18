/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — footer.js  v3
 * Composant footer universel — design system Awwwards
 * ═══════════════════════════════════════════════════════════════
 *
 * UTILISATION :
 *   <script src="assets/js/footer.js" defer></script>
 *
 * Le footer s'injecte automatiquement avant </body>.
 * Il supporte les deux thèmes dark/light via :
 *   html[data-theme="light"] .footer { ... }
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (window.__aurumFooterInjected) return;
  window.__aurumFooterInjected = true;

  /* ── CSS ─────────────────────────────────────────────────────── */
  const CSS = `
    .footer {
      background: #0B0A08;
      border-top: 1px solid rgba(200,168,75,.1);
      padding: 72px 0 0;
      color: #FEFCF8;
      position: relative;
      overflow: hidden;
    }
    html[data-theme="light"] .footer {
      background: #1A1916;
    }
    .footer::before {
      content: 'SANHIA';
      position: absolute;
      bottom: -20px; right: -10px;
      font-family: 'Unbounded', sans-serif;
      font-size: 140px;
      font-weight: 900;
      color: rgba(200,168,75,.025);
      letter-spacing: -.04em;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }
    .footer-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 60px;
      position: relative;
      z-index: 1;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 60px;
      padding-bottom: 60px;
      border-bottom: 1px solid rgba(200,168,75,.08);
    }
    .footer-brand-col {}
    .footer-logo-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .footer-logo-img {
      width: 28px; height: 28px;
      object-fit: contain;
    }
    .footer-logo-name {
      font-family: 'Unbounded', sans-serif;
      font-size: 12px; font-weight: 900;
      letter-spacing: .28em; text-transform: uppercase;
      color: #FEFCF8;
    }
    .footer-logo-name span { color: #C8A84B; }
    .footer-tagline {
      font-size: 8px; letter-spacing: .2em;
      text-transform: uppercase; color: #C8A84B;
      font-weight: 700; margin-bottom: 16px;
      display: block;
    }
    .footer-desc {
      font-size: 13px;
      color: #7A7570;
      line-height: 1.7;
      max-width: 280px;
      margin-bottom: 24px;
    }
    .footer-social {
      display: flex;
      gap: 8px;
    }
    .footer-social-link {
      width: 36px; height: 36px;
      border: 1px solid rgba(200,168,75,.15);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none;
      transition: all .25s;
      color: #7A7570;
    }
    .footer-social-link:hover {
      border-color: #C8A84B;
      background: rgba(200,168,75,.08);
      color: #C8A84B;
    }
    .footer-social-link svg { width: 14px; height: 14px; fill: currentColor; }

    /* Nav cols */
    .footer-col-title {
      font-family: 'Unbounded', sans-serif;
      font-size: 8px; letter-spacing: .2em;
      text-transform: uppercase; color: #C8A84B;
      font-weight: 700; margin-bottom: 20px;
      display: flex; align-items: center; gap: 8px;
    }
    .footer-col-title::before {
      content: ''; width: 12px; height: 1px;
      background: #C8A84B; display: block;
    }
    .footer-links {
      list-style: none;
      display: flex; flex-direction: column; gap: 10px;
    }
    .footer-links a {
      font-size: 13px;
      color: #7A7570;
      text-decoration: none;
      transition: color .2s;
      display: flex; align-items: center; gap: 6px;
    }
    .footer-links a::before {
      content: '';
      width: 4px; height: 4px;
      background: rgba(200,168,75,.3);
      border-radius: 50%;
      flex-shrink: 0;
      transition: background .2s;
    }
    .footer-links a:hover { color: #FEFCF8; }
    .footer-links a:hover::before { background: #C8A84B; }

    /* Newsletter */
    .footer-newsletter-desc {
      font-size: 13px; color: #7A7570;
      line-height: 1.6; margin-bottom: 16px;
    }
    .footer-newsletter-form {
      display: flex; flex-direction: column; gap: 8px;
    }
    .footer-newsletter-input-wrap {
      display: flex; gap: 0;
      border: 1px solid rgba(200,168,75,.15);
      transition: border-color .25s;
    }
    .footer-newsletter-input-wrap:focus-within {
      border-color: rgba(200,168,75,.45);
    }
    .footer-newsletter-input {
      flex: 1; background: rgba(255,255,255,.03);
      border: none; outline: none;
      padding: 11px 14px;
      font-family: 'Syne', sans-serif;
      font-size: 13px; color: #FEFCF8;
    }
    .footer-newsletter-input::placeholder { color: rgba(254,252,248,.2); }
    .footer-newsletter-btn {
      padding: 11px 18px;
      background: #C8A84B; color: #0B0A08;
      border: none; font-family: 'Unbounded', sans-serif;
      font-size: 8px; letter-spacing: .2em;
      text-transform: uppercase; font-weight: 800;
      cursor: pointer; transition: background .2s;
      white-space: nowrap; flex-shrink: 0;
    }
    .footer-newsletter-btn:hover { background: #E2C56A; }
    .footer-newsletter-btn:disabled { opacity: .5; pointer-events: none; }
    .footer-newsletter-note {
      font-size: 10px; color: #4A4540; letter-spacing: .04em;
    }

    /* Bottom bar */
    .footer-bottom {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 0;
      flex-wrap: wrap; gap: 16px;
    }
    .footer-copyright {
      font-size: 11px; color: #4A4540; letter-spacing: .08em;
    }
    .footer-bottom-links {
      display: flex; gap: 24px;
    }
    .footer-bottom-links a {
      font-size: 11px; color: #4A4540; text-decoration: none;
      letter-spacing: .06em; transition: color .2s;
    }
    .footer-bottom-links a:hover { color: #C8A84B; }

    /* Responsive */
    @media (max-width: 1100px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
      .footer-brand-col { grid-column: 1 / -1; }
      .footer-desc { max-width: none; }
    }
    @media (max-width: 640px) {
      .footer-inner { padding: 0 24px; }
      .footer-grid { grid-template-columns: 1fr; gap: 36px; }
      .footer-brand-col { grid-column: auto; }
      .footer-bottom { flex-direction: column; align-items: flex-start; }
      .footer-bottom-links { flex-wrap: wrap; gap: 16px; }
    }
  `;

  /* ── Template HTML ───────────────────────────────────────────── */
  function buildHTML() {
    return `
      <footer class="footer" role="contentinfo">
        <div class="footer-inner">
          <div class="footer-grid">

            <!-- Colonne Marque -->
            <div class="footer-brand-col">
              <div class="footer-logo-wrap">
                <img class="footer-logo-img" src="/assets/img/Logo.png" alt="Sanhia" onerror="this.style.display='none'/>
                <span class="footer-logo-name">SAN<span>H</span>IA</span>
              </div>
              <span class="footer-tagline">La première marketplace premium du Burkina Faso</span>
              <p class="footer-desc">Qualité, confiance et élégance à votre portée. Découvrez les meilleurs créateurs et commerçants burkinabè sélectionnés avec soin.</p>
              <div class="footer-social">
                <!-- Facebook -->
                <a href="https://www.facebook.com/share/1CRt3jkL1c/" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="Facebook">
                  <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <!-- Instagram -->
                <a href="https://www.instagram.com/aurum_bf?igsh=NXNkaXExeTVhNXgy" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="Instagram">
                  <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <!-- TikTok -->
                <a href="https://www.tiktok.com/@aurum_bf?_r=1&_t=ZM-92qMqptMlOV" target="_blank" rel="noopener noreferrer" class="footer-social-link" aria-label="TikTok">
                  <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                </a>
              </div>
            </div>

            <!-- Navigation -->
            <div>
              <h4 class="footer-col-title">Navigation</h4>
              <ul class="footer-links">
                <li><a href="/">Accueil</a></li>
                <li><a href="/catalogue">Catalogue</a></li>
                <li><a href="/boutique-list">Nos Boutiques</a></li>
                <li><a href="/seller-onboarding">Devenir Vendeur</a></li>
                <li><a href="/about">À propos</a></li>
              </ul>
            </div>

            <!-- Informations -->
            <div>
              <h4 class="footer-col-title">Informations</h4>
              <ul class="footer-links">
                <li><a href="/a">CGU & FAQ</a></li>
                <li><a href="/a">Mentions légales</a></li>
                <li><a href="/a">Confidentialité</a></li>
                <li><a href="/contact">Nous contacter</a></li>
              </ul>
            </div>

            <!-- Newsletter -->
            <div>
              <h4 class="footer-col-title">Newsletter</h4>
              <p class="footer-newsletter-desc">Recevez nos offres exclusives, nouvelles collections et actualités en avant-première.</p>
              <form class="footer-newsletter-form" id="footer-newsletter-form" novalidate>
                <div class="footer-newsletter-input-wrap">
                  <input
                    type="email"
                    id="footer-newsletter-email"
                    class="footer-newsletter-input"
                    placeholder="votre@email.com"
                    required
                    autocomplete="email"
                    aria-label="Votre adresse email"
                  />
                  <button type="submit" class="footer-newsletter-btn" id="footer-newsletter-btn">
                    OK
                  </button>
                </div>
                <span class="footer-newsletter-note">Pas de spam. Désabonnement en un clic.</span>
              </form>
            </div>

          </div>

          <!-- Bottom bar -->
          <div class="footer-bottom">
            <span class="footer-copyright">
              &copy; <span id="footer-year"></span> Sanhia Marketplace — Ouagadougou, Burkina Faso
            </span>
            <div class="footer-bottom-links">
              <a href="/a">CGU</a>
              <a href="/a#confidentialite">Confidentialité</a>
              <a href="/a#mentions">Mentions légales</a>
              <a href="/contact">Contact</a>
            </div>
          </div>

        </div>
      </footer>
    `;
  }

  /* ── Newsletter ───────────────────────────────────────────────── */
  function setupNewsletter() {
    const form  = document.getElementById('footer-newsletter-form');
    const input = document.getElementById('footer-newsletter-email');
    const btn   = document.getElementById('footer-newsletter-btn');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (input.value || '').trim().toLowerCase();
      if (!email) return;

      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';

      try {
        // Récupérer Firestore depuis window.db ou firebase global
        const db = (window.db && typeof window.db.collection === 'function')
          ? window.db
          : (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);

        if (!db) throw new Error('Firestore non disponible');

        const existing = await db.collection('newsletter').where('email', '==', email).get();
        if (!existing.empty) {
          _toast('Vous êtes déjà inscrit(e) !', 'warn');
          return;
        }
        await db.collection('newsletter').add({
          email,
          subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'active',
        });
        _toast('Merci pour votre inscription ✓', 'ok');
        input.value = '';
      } catch (err) {
        console.error('[Aurum Footer] Newsletter:', err);
        _toast('Une erreur est survenue. Réessayez.', 'err');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  /* ── Toast (lightweight, sans dépendance) ────────────────────── */
  function _toast(msg, type) {
    if (window.showToast) { window.showToast(msg, type === 'ok' ? 'success' : type); return; }
    // Fallback inline toast
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position:fixed;bottom:22px;right:22px;z-index:99990;
      padding:12px 20px;background:#1A1916;
      border-left:3px solid ${type==='ok'?'#4A9E72':type==='warn'?'#C8A84B':'#D94F4F'};
      font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:#FEFCF8;
      box-shadow:0 14px 40px rgba(0,0,0,.5);
      animation:toastIn .3s ease both;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(style);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  /* ── Inject ───────────────────────────────────────────────────── */
  function injectFooter() {
    // Styles
    if (!document.getElementById('aurum-footer-styles')) {
      const style = document.createElement('style');
      style.id = 'aurum-footer-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    // HTML
    document.body.insertAdjacentHTML('beforeend', buildHTML());

    // Année
    const yr = document.getElementById('footer-year');
    if (yr) yr.textContent = new Date().getFullYear();

    // Newsletter
    setupNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

})();