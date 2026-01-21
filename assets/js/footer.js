/**
 * Footer Injector - Injecte dynamiquement un footer standardisé dans toutes les pages
 * Utilisation : <script src="assets/js/footer.js" defer></script>
 */

function injectFooter() {
  const footerHTML = `
    <footer class="footer">
      <div class="container">
          <div class="footer-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:40px;">
              
              <div class="footer-col">
                  <h3 style="font-family:'Playfair Display'; margin-bottom:15px;">AURUM</h3>
                  <p style="color:#aaa; font-size:14px; line-height:1.6;">
                      La première marketplace premium du Burkina Faso. Qualité, confiance et élégance à votre portée.
                  </p>
              </div>

              <div class="footer-col">
                  <h4 style="margin-bottom:15px; color:#fff;">Navigation</h4>
                  <ul style="list-style:none; padding:0; margin:0; line-height:2;">
                      <li><a href="index.html" style="color:#aaa; text-decoration:none;">Accueil</a></li>
                      <li><a href="catalogue.html" style="color:#aaa; text-decoration:none;">Catalogue</a></li>
                      <li><a href="seller-onboarding.html" style="color:#aaa; text-decoration:none;">Devenir Vendeur</a></li>
                      <li><a href="boutique-list.html" style="color:#aaa; text-decoration:none;">Nos Boutiques</a></li>
                  </ul>
              </div>

              <div class="footer-col">
                  <h4 style="margin-bottom:15px; color:#fff;">Informations</h4>
                  <ul style="list-style:none; padding:0; margin:0; line-height:2;">
                      <li><a href="about.html" style="color:#aaa; text-decoration:none;">A Propos</a></li>
                      <li><a href="privacy.html" style="color:#aaa; text-decoration:none;">Politique de Confidentialité</a></li>
                      <li><a href="A.html" style="color:#aaa; text-decoration:none;">CGU & FAQ</a></li>
                      <li><a href="contact.html" style="color:#aaa; text-decoration:none;">Nous contacter</a></li>
                  </ul>
              </div>

              <div class="footer-col">
                  <h4 style="margin-bottom:15px; color:#fff;">Suivez-nous</h4>
                  <div class="social-links" style="display:flex; gap:15px;">
                      <a href="https://www.facebook.com/share/1CRt3jkL1c/" target="_blank" style="color:#fff; transition:0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                      </a>
                      <a href="https://www.instagram.com/aurum_bf?igsh=NXNkaXExeTVhNXgy" target="_blank" style="color:#fff; transition:0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                      </a>
                      <a href="https://www.tiktok.com/@aurum_bf?_r=1&_t=ZM-92qMqptMlOV" target="_blank" style="color:#fff; transition:0.3s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                      </a>
                  </div>
              </div>
          </div>

          <div class="footer-bottom" style="border-top:1px solid rgba(255,255,255,0.1); margin-top:40px; padding-top:20px; text-align:center; color:#666; font-size:13px;">
              &copy; <span id="year">2026</span> Aurum Marketplace. Tous droits réservés.
          </div>
      </div>
    </footer>
  `;

  // Injecter le footer avant la fermeture du body
  document.body.insertAdjacentHTML('beforeend', footerHTML);

  // Mettre à jour l'année automatiquement
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.innerText = new Date().getFullYear();
  }

  // Réinitialiser les icônes lucide si disponibles
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Exécuter après le chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFooter);
} else {
  injectFooter();
}
