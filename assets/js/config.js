"use strict";

/**
 * ═══════════════════════════════════════════════════════════════
 * AURUM — config.js  v3
 * Configuration globale, Firebase, utilitaires
 * ═══════════════════════════════════════════════════════════════
 * À charger EN PREMIER dans toutes les pages.
 * ORDRE RECOMMANDÉ :
 *   1. firebase-app-compat.js
 *   2. firebase-auth-compat.js
 *   3. firebase-firestore-compat.js
 *   4. config.js   ← ce fichier
 *   5. messaging.js (si nécessaire)
 *   6. header.js
 *   7. app.js / admin.js
 * ═══════════════════════════════════════════════════════════════
 */

// ── 1. FIREBASE ──────────────────────────────────────────────────
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp({
    apiKey:            "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
    authDomain:        "aurum-bf.firebaseapp.com",
    projectId:         "aurum-bf",
    storageBucket:     "aurum-bf.firebasestorage.app",
    messagingSenderId: "858318726586",
    appId:             "1:858318726586:web:14687fff6d4d08527a6983",
    measurementId:     "G-SY7DY6WV97",
  });
  console.log("🔥 Firebase connecté");
}

window.auth = firebase.auth();
window.db   = firebase.firestore();

// ── 2. STORE GLOBAL (remplacé par Firestore, garde pour compat) ──
// window.Store est hydraté par data.js si présent.
// Les modules app.js / admin.js doivent privilégier window.db.
if (!window.Store) {
  window.Store = {
    users: [], shops: [], products: [], orders: [],
    invoices: [], promos: [], categories: [], restaurants: [],
  };
}

// ── 3. AUTH SERVICE ───────────────────────────────────────────────
window.Auth = {
  register(email, password, name) {
    return window.auth
      .createUserWithEmailAndPassword(email, password)
      .then(cred =>
        cred.user
          .updateProfile({ displayName: name })
          .then(() =>
            window.db.collection('users').doc(cred.user.uid).set({
              name, email, role: 'client',
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
          )
          .then(() => ({ success: true, user: cred.user }))
      )
      .catch(err => ({ success: false, message: err.message }));
  },
  login(email, password) {
    return window.auth
      .signInWithEmailAndPassword(email, password)
      .then(cred => ({ success: true, user: cred.user }))
      .catch(err => ({ success: false, message: err.message }));
  },
  logout() {
    window.auth.signOut().then(() => (window.location.href = 'login.html'));
  },
};

// ── 4. SYNC UTILISATEUR COURANT ───────────────────────────────────
window.syncCurrentUser = function (user) {
  if (!user) {
    localStorage.removeItem('ac_currentUser');
    return Promise.resolve(null);
  }
  const ADMIN_MAIL = 'aurumcorporate.d@gmail.com';
  const base = {
    uid:   user.uid,
    email: user.email || '',
    name:  user.displayName || '',
    role:  user.email === ADMIN_MAIL ? 'superadmin' : 'client',
  };
  return window.db.collection('users').doc(user.uid).get()
    .then(doc => {
      const merged = doc.exists
        ? { ...base, name: doc.data().name || base.name, role: doc.data().role || base.role }
        : base;
      localStorage.setItem('ac_currentUser', JSON.stringify(merged));
      return merged;
    })
    .catch(() => {
      localStorage.setItem('ac_currentUser', JSON.stringify(base));
      return base;
    });
};

// Écoute globale auth → garde localStorage à jour
window.auth.onAuthStateChanged(user => window.syncCurrentUser(user));

// ── 5. AUTO-REPAIR RÔLES ──────────────────────────────────────────
(function checkRoles() {
  const ADMIN_MAIL = 'aurumcorporate.d@gmail.com';
  window.auth.onAuthStateChanged(user => {
    if (!user || !window.db) return;
    const isAdmin = user.email === ADMIN_MAIL;
    window.db.collection('users').doc(user.uid).get().then(doc => {
      const data     = doc.exists ? (doc.data() || {}) : {};
      const current  = data.role || '';
      const expected = isAdmin ? 'superadmin' : (current || 'client');
      if (!doc.exists) {
        return window.db.collection('users').doc(user.uid)
          .set({ name: user.displayName || '', email: user.email, role: expected,
                 createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
      if (expected !== current) {
        return window.db.collection('users').doc(user.uid).update({ role: expected });
      }
    }).catch(() => {});
  });
})();

// ── 6. FORMATAGE ──────────────────────────────────────────────────
window.formatFCFA = function (amount) {
  try   { return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA'; }
  catch { return (Number(amount) || 0) + ' FCFA'; }
};

window.formatDate = function (ts, opts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  return d.toLocaleDateString('fr-FR', opts || { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── 7. TOAST ──────────────────────────────────────────────────────
// Couleurs compatibles dark/light
const TOAST_COLORS = {
  success: '#4A9E72', ok: '#4A9E72',
  danger:  '#D94F4F', error: '#D94F4F', err: '#D94F4F',
  warning: '#C8813A', warn: '#C8813A',
  info:    '#4A84C8',
};

window.showToast = function (message, type = 'info') {
  // Cherche un container existant (injecté par header.js ou par la page)
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:99990;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const color = TOAST_COLORS[type] || '#C8A84B';
  const el    = document.createElement('div');
  el.style.cssText = `
    min-width:260px;padding:12px 18px;
    background:#1A1916;border-left:3px solid ${color};
    font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:#FEFCF8;
    box-shadow:0 14px 40px rgba(0,0,0,.6);
    animation:toastIn .3s cubic-bezier(.16,1,.3,1) both;
  `;
  if (!document.getElementById('_toast-kf')) {
    const s = document.createElement('style');
    s.id = '_toast-kf';
    s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
  }
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3600);
};

// ── 8. CLIPBOARD ─────────────────────────────────────────────────
window.copyToClipboard = async function (text) {
  try {
    await navigator.clipboard.writeText(text);
    window.showToast('Lien copié dans le presse-papier', 'success');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    window.showToast('Lien copié', 'success');
  }
};

// ── 9. CART BADGE (compatibilité avec header.js v3) ───────────────
// header.js expose window.refreshCartCount().
// app.js expose window.updateCartBadge() qui cherche #cart-badge.
// On unifie : les deux appellent la même logique, et les deux IDs sont supportés.
window.updateCartBadge = function () {
  try {
    const raw   = localStorage.getItem('ac_cart') || localStorage.getItem('cart') || '[]';
    const cart  = JSON.parse(raw);
    const count = cart.reduce((s, i) => s + (parseInt(i.qty) || parseInt(i.quantity) || 1), 0);
    // Support des deux IDs présents dans le DOM
    ['cart-count', 'cart-badge'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = count > 99 ? '99+' : count;
      if (el.classList) {
        el.classList.toggle('show', count > 0);
      } else {
        el.style.display = count > 0 ? (id === 'cart-count' ? 'flex' : 'block') : 'none';
      }
    });
  } catch (_) {}
};
// Alias pour header.js v3
window.refreshCartCount = window.updateCartBadge;

// ── 10. MOBILE MENU (compat config.js précédent) ──────────────────
// header.js v3 gère lui-même son drawer avec ses propres IDs.
// Cette fonction reste pour les pages qui auraient leurs propres drawers.
window.setupMobileMenu = function () {
  // Chercher les IDs du nouveau header en priorité, puis les anciens
  const toggle  = document.getElementById('mobile-burger-btn')  || document.getElementById('menu-toggle');
  const close   = document.getElementById('drawer-close-btn')   || document.getElementById('close-btn');
  const drawer  = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay')     || document.getElementById('menu-overlay');
  if (!toggle || !drawer) return;

  const open  = () => { drawer.classList.add('active'); if (overlay) overlay.classList.add('active'); document.body.style.overflow = 'hidden'; };
  const shut  = () => { drawer.classList.remove('active'); if (overlay) overlay.classList.remove('active'); document.body.style.overflow = ''; };
  toggle.addEventListener('click', () => drawer.classList.contains('active') ? shut() : open());
  if (close)   close.addEventListener('click', shut);
  if (overlay) overlay.addEventListener('click', shut);
  drawer.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', shut));
};

// ── 11. AUTH UI (compat config.js précédent) ─────────────────────
// header.js v3 gère maintenant l'auth UI directement.
// Cette fonction reste comme fallback pour les pages sans header.js.
window.setupAuthUI = function () {
  const user      = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');
  const loginBtn  = document.getElementById('mobile-login-btn')  || document.getElementById('drawer-login-link');
  const logoutBtn = document.getElementById('mobile-logout-btn') || document.getElementById('drawer-logout-link');
  if (!loginBtn && !logoutBtn) return;
  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'flex';
  } else {
    if (loginBtn)  loginBtn.style.display  = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('ac_currentUser');
      location.href = 'index.html';
    });
  }
};

// ── 12. ACCESS DENIED + AUTH WALL ────────────────────────────────
window.AuthWall = (function () {
  let _wall, _status, _done = false;
  function _get() {
    _wall   = _wall   || document.getElementById('aurum-auth-wall');
    _status = _status || document.getElementById('wall-status-text');
  }
  return {
    updateStatus(text) { _get(); if (_status) _status.textContent = text; },
    reveal() {
      if (_done) return; _done = true; _get();
      document.body.classList.remove('aurum-guarded');
      document.body.classList.add('aurum-revealed');
      if (_wall) { _wall.classList.add('wall-hiding'); setTimeout(() => _wall?.remove(), 400); }
    },
    deny(opts = {}) {
      if (_done) return; _done = true;
      this.updateStatus('Accès refusé');
      setTimeout(() => window.showAccessDenied(opts), 120);
    },
  };
})();

window.showAccessDenied = function ({
  email = '', role = '',
  redirectUrl = 'index.html', redirectLabel = "Retourner à l'accueil",
  reason = '',
} = {}) {
  const meta   = [email, role ? 'Rôle : ' + role : ''].filter(Boolean).join(' · ');
  document.body.className = 'aurum-denied-page';
  document.body.innerHTML = `
    <style>
      .aurum-denied-page{margin:0;padding:0;background:#0B0A08;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif}
      .aurum-denied-card{text-align:center;padding:60px 40px;max-width:480px}
      .aurum-denied-icon-wrap{width:72px;height:72px;border:1px solid rgba(217,79,79,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;color:rgba(217,79,79,.45)}
      .aurum-denied-icon-wrap svg{width:28px;height:28px}
      .aurum-denied-eyebrow{font-family:'Unbounded',sans-serif;font-size:8px;letter-spacing:.3em;text-transform:uppercase;color:#C8A84B;font-weight:700}
      .aurum-denied-title{font-family:'Instrument Serif',serif;font-size:40px;color:rgba(254,252,248,.25);margin:12px 0;line-height:1}
      .aurum-denied-separator{width:32px;height:1px;background:#C8A84B;margin:16px auto}
      .aurum-denied-text{font-size:13px;color:#7A7570;line-height:1.6;margin-bottom:6px}
      .aurum-denied-meta{font-size:11px;color:#4A4540;letter-spacing:.08em;margin-top:8px}
      .aurum-denied-btn{display:inline-flex;align-items:center;gap:10px;margin-top:28px;padding:14px 32px;background:#C8A84B;color:#0B0A08;font-family:'Unbounded',sans-serif;font-size:8px;letter-spacing:.2em;text-transform:uppercase;font-weight:800;text-decoration:none;transition:background .2s}
      .aurum-denied-btn:hover{background:#E2C56A}
      .aurum-denied-footer{margin-top:32px;font-family:'Unbounded',sans-serif;font-size:9px;letter-spacing:.28em;color:#4A4540}
      .aurum-denied-footer a{color:#4A4540;text-decoration:none}
    </style>
    <div class="aurum-denied-card">
      <div class="aurum-denied-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <span class="aurum-denied-eyebrow">Zone Restreinte</span>
      <h1 class="aurum-denied-title">Accès Non Autorisé</h1>
      <div class="aurum-denied-separator"></div>
      <p class="aurum-denied-text">Vous n'avez pas les autorisations nécessaires pour accéder à cette section.</p>
      ${reason ? `<p class="aurum-denied-text" style="font-size:12px;color:#4A4540">${reason}</p>` : ''}
      ${meta   ? `<p class="aurum-denied-meta">${meta}</p>` : ''}
      <a href="${redirectUrl}" class="aurum-denied-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        ${redirectLabel}
      </a>
      <div class="aurum-denied-footer"><a href="index.html">AURUM</a></div>
    </div>`;
};

// ── 13. ICONS AURUM ───────────────────────────────────────────────
window.AurumIcons = {
  navigation: { home:'home', search:'search', wishlist:'heart', cart:'shopping-bag', user:'user', login:'log-in', logout:'log-out', menu:'menu', close:'x', back:'arrow-left', forward:'arrow-right', share:'share-2', copy:'copy', eye:'eye', eyeOff:'eye-off' },
  actions: { add:'plus', delete:'trash-2', edit:'edit-2', save:'save', check:'check', filter:'filter' },
};

// ── 14. TRANSLATE ORDER STATUS ────────────────────────────────────
window.translateOrderStatus = function (status) {
  const map = {
    pending_admin:        'En attente (admin)',
    pending_seller:       'En préparation',
    ready_for_delivery:   'Prêt pour livraison',
    delivered:            'Livré',
    cancelled:            'Annulé',
    paid:                 'Payé',
    shipped:              'Expédié',
    confirmed:            'Confirmé',
    processing:           'En traitement',
  };
  return map[status] || status || '—';
};

// ── FIXLUCIDEICONS — version safe (dark/light aware) ─────────────
// ⚠️  L'ancienne version forçait stroke:#0F0F0F sur TOUTES les pages
//     y compris les pages dark → icônes noires sur fond noir.
// Nouvelle version : n'agit QUE si la page est en mode light explicite.
window.fixLucideIcons = function () {
  // On ne fixe que si la page n'est PAS en mode dark (html[data-theme!="light"])
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (!isLight) return; // Les pages dark gèrent leurs propres couleurs d'icône via CSS

  requestAnimationFrame(() => {
    document.querySelectorAll('svg.lucide, [data-lucide] svg').forEach(svg => {
      svg.setAttribute('stroke', '#0F0F0F');
      svg.querySelectorAll('path, line, circle, polyline, polygon, rect').forEach(el => {
        el.setAttribute('stroke', '#0F0F0F');
      });
    });
  });
};

// Auto-run icons à la fin du chargement (une seule fois, léger)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.fixLucideIcons();
  });
} else {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  window.fixLucideIcons();
}

console.log("✅ config.js v3 chargé");