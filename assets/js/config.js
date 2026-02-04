"use strict";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * AURUM CORP - CONFIGURATION GLOBALE & SERVICES
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier contient:
 * 1. Configuration Firebase
 * 2. Initialisation des bases de données et authentification
 * 3. Utilitaires généraux (formatage, toasts, dom)
 * 4. Système d'icônes Lucide
 * 5. Injection du header/footer
 * 
 * À charger en premier dans toutes les pages!
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURATION FIREBASE
// ─────────────────────────────────────────────────────────────────────────────

if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
        authDomain: "aurum-bf.firebaseapp.com",
        projectId: "aurum-bf",
        storageBucket: "aurum-bf.firebasestorage.app",
        messagingSenderId: "858318726586",
        appId: "1:858318726586:web:14687fff6d4d08527a6983",
        measurementId: "G-SY7DY6WV97"
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INITIALISATION FIREBASE (une seule fois)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase connecté !");
}

// Exports globaux (partagés par tous les modules)
window.auth = firebase.auth();
window.db = firebase.firestore();

// ─────────────────────────────────────────────────────────────────────────────
// 3. SERVICE D'AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

window.Auth = {
    register: (email, password, name) => {
        return window.auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                return cred.user.updateProfile({ displayName: name })
                    .then(() => {
                        // Créer l'entrée dans la base de données
                        return window.db.collection('users').doc(cred.user.uid).set({
                            name: name,
                            email: email,
                            role: 'client',
                            createdAt: new Date()
                        });
                    })
                    .then(() => ({ success: true, user: cred.user }));
            })
            .catch(err => ({ success: false, message: err.message }));
    },

    login: (email, password) => {
        return window.auth.signInWithEmailAndPassword(email, password)
            .then(cred => ({ success: true, user: cred.user }))
            .catch(err => ({ success: false, message: err.message }));
    },

    logout: () => {
        window.auth.signOut().then(() => window.location.href = "login.html");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. UTILITAIRES DOM
// ─────────────────────────────────────────────────────────────────────────────

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ─────────────────────────────────────────────────────────────────────────────
// 5. UTILITAIRES FORMATAGE & TOASTS
// ─────────────────────────────────────────────────────────────────────────────

window.formatFCFA = function(amount) {
    try {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    } catch (e) {
        return (Number(amount) || 0).toFixed(2) + ' FCFA';
    }
};

function formatPrice(amount) {
    return window.formatFCFA(amount);
}

window.showToast = function(message, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeft = `4px solid ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : type === 'danger' ? 'var(--danger)' : 'var(--gold)'}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
};

window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        window.showToast('Lien copié dans le presse-papier', 'success');
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        window.showToast('Lien copié', 'success');
    }
};

// Fix for garbled text (si nécessaire)
window.fixGarbledText = function(text) {
    if (typeof text !== 'string') return text;
    try {
        return decodeURIComponent(escape(text));
    } catch (e) {
        return text;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SYSTÈME D'ICÔNES LUCIDE
// ─────────────────────────────────────────────────────────────────────────────

// Fix Lucide icons visibility - force stroke attributes (global function)
window.fixLucideIcons = function() {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        // Target all SVGs that Lucide creates
        document.querySelectorAll('svg').forEach(svg => {
            // Check if it's a Lucide icon (has lucide class or is inside icon-btn)
            const isLucide = svg.classList.contains('lucide') || 
                             svg.className.baseVal?.includes('lucide') ||
                             svg.closest('.icon-btn') ||
                             svg.closest('.nav-actions') ||
                             svg.closest('.header') ||
                             svg.closest('.navbar') ||
                             svg.closest('.btn');

            if (isLucide) {
                // Force dark text icon color for light theme
                const strokeColor = '#0F0F0F';

                // Force attributes on SVG
                svg.setAttribute('stroke', strokeColor);
                svg.setAttribute('stroke-width', '2.5');
                svg.setAttribute('width', '24');
                svg.setAttribute('height', '24');
                svg.style.cssText = `
                    stroke: ${strokeColor} !important;
                    stroke-width: 2.5 !important;
                    width: 24px !important;
                    height: 24px !important;
                    min-width: 24px !important;
                    min-height: 24px !important;
                    max-width: 24px !important;
                    max-height: 24px !important;
                    color: ${strokeColor} !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    flex-shrink: 0 !important;
                `;

                // Also fix all child elements (path, line, circle, etc.)
                svg.querySelectorAll('path, line, circle, polyline, polygon, rect').forEach(child => {
                    child.setAttribute('stroke', strokeColor);
                    child.setAttribute('stroke-width', '2.5');
                    child.style.cssText = `stroke: ${strokeColor} !important; stroke-width: 2.5 !important; visibility: visible !important;`;
                });
            }
        });
    });
};

// Re-apply icon fixes on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        window.fixLucideIcons();
    }, 100);
});

// Observer pour re-fixer les icones quand le DOM change
const iconObserver = new MutationObserver((mutations) => {
    let shouldFix = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node.tagName === 'SVG' || node.querySelector?.('svg'))) {
                    shouldFix = true;
                    break;
                }
            }
        }
        if (shouldFix) break;
    }
    if (shouldFix && window.fixLucideIcons) {
        setTimeout(window.fixLucideIcons, 50);
    }
});

// Start observer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        iconObserver.observe(document.body, { childList: true, subtree: true });
        window.fixLucideIcons();
    });
} else {
    iconObserver.observe(document.body, { childList: true, subtree: true });
    window.fixLucideIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ICÔNES AURUM (MAPPINGS LUCIDE)
// ─────────────────────────────────────────────────────────────────────────────

window.AurumIcons = {
    navigation: {
        home: 'home',
        search: 'search',
        wishlist: 'heart',
        wishlistFilled: 'heart',
        cart: 'shopping-bag',
        user: 'user',
        account: 'user-circle',
        login: 'log-in',
        logout: 'log-out',
        register: 'user-plus',
        filters: 'sliders-horizontal',
        sort: 'arrow-up-down',
        menu: 'menu',
        close: 'x',
        back: 'arrow-left',
        forward: 'arrow-right',
        chevronLeft: 'chevron-left',
        chevronRight: 'chevron-right',
        chevronDown: 'chevron-down',
        chevronUp: 'chevron-up',
        more: 'more-horizontal',
        moreVertical: 'more-vertical',
        share: 'share-2',
        copy: 'copy',
        external: 'external-link',
        download: 'download',
        upload: 'upload',
        refresh: 'refresh-cw',
        eye: 'eye',
        eyeOff: 'eye-off',
    },
    categories: {
        'Mode & Vêtements': 'shirt',
        'Accessoires': 'gem',
        'Chaussures': 'footprints',
        'Bijoux': 'diamond',
        'Maroquinerie': 'briefcase',
        'Beauté, Hygiène & Bien-être': 'sparkles',
        'Restauration & Boissons': 'utensils',
        'Maison, Meubles & Décoration': 'lamp',
        'Art & Créateurs': 'palette',
    },
    actions: {
        add: 'plus',
        remove: 'x',
        delete: 'trash-2',
        edit: 'edit-2',
        save: 'save',
        cancel: 'x-circle',
        check: 'check',
        filter: 'filter',
        sort: 'arrow-up-down',
        view: 'eye',
        hide: 'eye-off',
        expand: 'expand',
        collapse: 'collapse',
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. INJECTION DU HEADER
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// INJECTION HEADER - DÉSACTIVÉE (Header défini directement dans HTML)
// ─────────────────────────────────────────────────────────────────────────────

// Note: Le header est maintenant défini directement dans les fichiers HTML
// pour éviter les conflits et améliorer les performances

// ─────────────────────────────────────────────────────────────────────────────
// SETUP MOBILE MENU - Gère le drawer mobile
// ─────────────────────────────────────────────────────────────────────────────

window.setupMobileMenu = function() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const closeBtn = document.getElementById('close-btn');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!menuToggle || !mobileDrawer) return;

    // Ouvrir le drawer
    menuToggle.addEventListener('click', () => {
        mobileDrawer.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Fermer le drawer
    const closeMenu = () => {
        mobileDrawer.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Fermer quand on clique sur un lien
    const drawerLinks = mobileDrawer.querySelectorAll('.drawer-link');
    drawerLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// SETUP AUTH UI - Gère l'affichage des boutons login/logout
// ─────────────────────────────────────────────────────────────────────────────

window.setupAuthUI = function() {
    const currentUser = JSON.parse(localStorage.getItem('ac_currentUser') || 'null');
    const loginBtn = document.getElementById('mobile-login-btn');
    const logoutBtn = document.getElementById('mobile-logout-btn');

    if (!loginBtn || !logoutBtn) return;

    if (currentUser) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('ac_currentUser');
            location.href = 'index.html';
        });
    }
};

console.log("✅ Config.js chargé - Firebase, Services & Utilitaires OK");
