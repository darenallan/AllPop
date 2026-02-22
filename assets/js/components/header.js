/**
 * ========================================
 * AURUM HEADER COMPONENT
 * Apple-style Dynamic Header Component
 * ========================================
 * 
 * Ce composant injecte dynamiquement un header
 * responsive sur toutes les pages du site.
 * 
 * @author Aurum Development Team
 * @version 2.0
 */

(function() {
  'use strict';

  /**
   * Injection du Header dans le DOM
   * Appelé automatiquement au chargement de la page
   */
  window.injectHeader = function() {
    const placeholder = document.getElementById('header-placeholder');
    
    if (!placeholder) {
      console.warn('[Aurum Header] Placeholder #header-placeholder introuvable.');
      return;
    }

    // Template HTML du Header
    const headerHTML = `
      <header class="aurum-glass-header">
        <!-- Logo à gauche -->
        <div class="header-left">
          <a href="index.html" class="header-brand">
            <div class="header-logo">
              <img src="assets/img/Logo.png" alt="Aurum Logo" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="header-brand-text">
              <span class="header-brand-name">AURUM</span>
              <span class="header-tagline">EXCELLENCE À VOTRE PORTÉE</span>
            </div>
          </a>
        </div>

        <!-- Navigation centrale (Desktop uniquement) -->
        <nav class="header-center">
          <a href="index.html" class="header-link">Accueil</a>
          <a href="catalogue.html" class="header-link">Catalogue</a>
          <a href="boutique-list.html" class="header-link">Nos Boutiques</a>
          <a href="seller.html" class="header-link">Vendeur</a>
        </nav>

        <!-- Actions à droite -->
        <div class="header-right">
          <!-- Icône Recherche -->
          <a href="catalogue.html" class="header-icon-btn" aria-label="Rechercher">
            <i data-lucide="search"></i>
          </a>

          <!-- Icône Favoris -->
          <a href="wishlist.html" class="header-icon-btn" aria-label="Favoris">
            <i data-lucide="heart"></i>
          </a>

          <!-- Icône Panier avec badge -->
          <a href="cart.html" class="header-icon-btn header-cart-btn" aria-label="Panier">
            <i data-lucide="shopping-bag"></i>
            <span class="header-cart-badge" id="cart-count">0</span>
          </a>

          <!-- Icône Profil -->
          <a href="profile.html" class="header-icon-btn" id="header-profile-btn" aria-label="Mon Profil">
            <i data-lucide="user"></i>
          </a>

          <!-- Menu Burger (Mobile uniquement) -->
          <button class="mobile-burger" id="mobile-burger-btn" aria-label="Menu">
            <i data-lucide="menu"></i>
          </button>
        </div>
      </header>

      <!-- Drawer Menu Mobile -->
      <div class="mobile-drawer" id="mobile-drawer">
        <div class="drawer-header">
          <span class="drawer-title">Menu</span>
          <button class="drawer-close-btn" id="drawer-close-btn" aria-label="Fermer">
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <nav class="drawer-nav">
          <a href="index.html" class="drawer-link">
            <i data-lucide="home"></i> Accueil
          </a>
          <a href="catalogue.html" class="drawer-link">
            <i data-lucide="grid"></i> Catalogue
          </a>
          <a href="boutique-list.html" class="drawer-link">
            <i data-lucide="store"></i> Nos Boutiques
          </a>
          <a href="cart.html" class="drawer-link">
            <i data-lucide="shopping-bag"></i> Panier
          </a>
          <a href="wishlist.html" class="drawer-link">
            <i data-lucide="heart"></i> Mes Favoris
          </a>
          
          <div class="drawer-divider"></div>
          
          <a href="seller.html" class="drawer-link">
            <i data-lucide="briefcase"></i> Espace Vendeur
          </a>
          <a href="profile.html" class="drawer-link">
            <i data-lucide="user"></i> Mon Profil
          </a>
          
          <div class="drawer-divider"></div>
          
          <a href="login.html" id="drawer-login-btn" class="drawer-link">
            <i data-lucide="log-in"></i> Connexion
          </a>
          <a href="#" id="drawer-logout-btn" class="drawer-link drawer-link-danger">
            <i data-lucide="log-out"></i> Déconnexion
          </a>
        </nav>
      </div>

      <!-- Overlay pour le drawer -->
      <div class="mobile-drawer-overlay" id="drawer-overlay"></div>
    `;

    // Injection du template
    placeholder.innerHTML = headerHTML;

    // Initialisation des fonctionnalités
    initializeHeader();

    // Génération des icônes Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  };

  /**
   * Initialisation des événements et fonctionnalités du header
   */
  function initializeHeader() {
    // Gestion du menu burger mobile
    setupMobileMenu();

    // Gestion du compteur de panier
    updateCartCount();

    // Gestion de l'authentification
    setupAuthButtons();

    // Effet de scroll sur le header
    setupScrollEffect();
  }

  /**
   * Configuration du menu mobile (drawer)
   */
  function setupMobileMenu() {
    const burgerBtn = document.getElementById('mobile-burger-btn');
    const closeBtn = document.getElementById('drawer-close-btn');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('drawer-overlay');

    if (!burgerBtn || !drawer || !overlay) return;

    const toggleDrawer = () => {
      const isActive = drawer.classList.contains('active');
      
      if (isActive) {
        closeDrawer();
      } else {
        openDrawer();
      }
    };

    const openDrawer = () => {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    // Événements
    burgerBtn.addEventListener('click', toggleDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Fermer lors du clic sur un lien (navigation)
    const drawerLinks = drawer.querySelectorAll('.drawer-link');
    drawerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Ne pas fermer si c'est le bouton logout (gère son propre comportement)
        if (link.id !== 'drawer-logout-btn') {
          closeDrawer();
        }
      });
    });
  }

  /**
   * Mise à jour du compteur de panier
   */
  function updateCartCount() {
    try {
      const cartData = localStorage.getItem('ac_cart');
      const cart = cartData ? JSON.parse(cartData) : [];
      const badge = document.getElementById('cart-count');

      if (!badge) return;

      // Calculer le nombre total d'articles
      const totalItems = cart.reduce((sum, item) => {
        return sum + (parseInt(item.qty) || parseInt(item.quantity) || 1);
      }, 0);

      // Afficher ou masquer le badge
      if (totalItems > 0) {
        badge.textContent = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    } catch (error) {
      console.error('[Aurum Header] Erreur lors de la mise à jour du compteur:', error);
    }
  }

  /**
   * Configuration des boutons d'authentification
   */
  function setupAuthButtons() {
    const logoutBtn = document.getElementById('drawer-logout-btn');
    const loginBtn = document.getElementById('drawer-login-btn');
    const profileBtn = document.getElementById('header-profile-btn');

    // Vérifier si Firebase est disponible
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('[Aurum Header] Firebase non disponible.');
      return;
    }

    // Observer l'état d'authentification
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // Utilisateur connecté
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (profileBtn) {
          profileBtn.href = 'profile.html';
          profileBtn.setAttribute('aria-label', 'Mon Profil');
        }
      } else {
        // Utilisateur non connecté
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (profileBtn) {
          profileBtn.href = 'login.html';
          profileBtn.setAttribute('aria-label', 'Connexion');
        }
      }
    });

    // Gestion de la déconnexion
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
          firebase.auth().signOut()
            .then(() => {
              window.location.href = 'index.html';
            })
            .catch((error) => {
              console.error('[Aurum Header] Erreur déconnexion:', error);
              alert('Erreur lors de la déconnexion. Veuillez réessayer.');
            });
        }
      });
    }
  }

  /**
   * Effet de scroll sur le header (ajoute une ombre au scroll)
   */
  function setupScrollEffect() {
    const header = document.querySelector('.aurum-glass-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    });
  }

  /**
   * Fonction publique pour rafraîchir le compteur de panier
   * Utilisable depuis d'autres scripts
   */
  window.refreshCartCount = function() {
    updateCartCount();
  };

  // Auto-initialisation au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    // DOM déjà chargé
    injectHeader();
  }

})();
