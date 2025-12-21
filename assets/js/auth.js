
// Authentification avancée (API inspirée du contexte React)
// Clés de stockage
const AUTH_KEY = 'ac_currentUser';

// Mapping des rôles (depuis React -> vers notre app)
const RoleMap = {
  'super_admin': 'superadmin',
  'vendeur': 'seller',
  'client': 'client',
  'maintainer': 'maintainer',
};

// Utilitaires
function delay(ms){ return new Promise(res => setTimeout(res, ms)); }
function normalizeRole(r){
  const key = String(r||'client').toLowerCase();
  return RoleMap[key] || key;
}

// Expose une API Auth globale
const Auth = {
  user: null,
  isLoading: false,

  load(){
    try {
      const u = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      this.user = u || null;
      return this.user;
    } catch(e){
      localStorage.removeItem(AUTH_KEY);
      this.user = null;
      return null;
    }
  },

  isAuthenticated(){ return !!this.user; },

  async login(email, password){
    this.isLoading = true;

    // Simule un délai
    await delay(800);

    // Recherche dans Store.users
    const acc = Store.users.find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if(!acc){
      this.isLoading = false;
      return { success:false, error:'Compte non trouvé' };
    }
    if(acc.password !== password){
      this.isLoading = false;
      // Afficher le message d'aide
      const helpMsg = document.getElementById('password-help');
      if(helpMsg) helpMsg.classList.remove('hidden');
      return { success:false, error:'Mot de passe incorrect' };
    }

    // Normaliser rôle
    acc.role = normalizeRole(acc.role);

    // Persister
    localStorage.setItem(AUTH_KEY, JSON.stringify(acc));
    this.user = acc;
    this.isLoading = false;
    return { success:true };
  },

  async register(email, password, name, phone = '', role = 'client'){
    this.isLoading = true;

    await delay(800);

    const exists = Store.users.some(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if(exists){
      this.isLoading = false;
      return { success:false, error:'Un compte avec cet email existe déjà' };
    }

    const newUser = {
      id: 'user-'+Date.now(),
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      phone: phone.trim(),
      role: normalizeRole(role),
      createdAt: Date.now(),
    };

    Store.users.push(newUser); saveStore();

    // Connexion automatique après inscription
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    this.user = newUser;
    this.isLoading = false;
    return { success:true };
  },

  logout(){
    localStorage.removeItem(AUTH_KEY);
    this.user = null;
  },

  // Déclenche une demande de boutique (simulateur)
  requestStore(){
    const u = this.user;
    if(!u) return showToast('Veuillez vous connecter','warning');
    const notifs = JSON.parse(localStorage.getItem('ac_notifications')||'[]');
    notifs.push({type:'shop_request', email:u.email, date:Date.now()});
    localStorage.setItem('ac_notifications', JSON.stringify(notifs));
    showToast('Demande de boutique envoyée à l’admin','success');
  }
};

// Initialisation session
Auth.load();

// ---- Liaison aux formulaires existants (login/register) ----
window.addEventListener('DOMContentLoaded', ()=>{
  // Login form
  const loginForm = document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);
      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value.trim();

      const res = await Auth.login(email, pass);
      if(!res.success){
        showToast(res.error || 'Échec de connexion', 'danger');
        btn && (btn.disabled = false);
        return;
      }
      showToast('Connecté avec succès', 'success');
      // Redirections selon rôles
      const role = Auth.user.role;
      setTimeout(()=>{
        if(role === 'seller') location.href = '../seller.html';
        else if(role === 'superadmin') location.href = '../admin.html';
        else location.href = '../index.html';
      }, 600);
    });
  }

  // Register form
  const regForm = document.getElementById('register-form');
  if(regForm){
    regForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const btn = regForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);

      const name = regForm.name.value.trim();
      const email = regForm.email.value.trim();
      const phone = regForm.phone.value.trim();
      const pass = regForm.password.value.trim();
      const wantShop = !!regForm.wantShop?.checked;

      const res = await Auth.register(email, pass, name, phone, 'client');
      if(!res.success){
        showToast(res.error || 'Échec de création', 'danger');
        btn && (btn.disabled = false);
        return;
      }

      showToast('Compte créé', 'success');

      if(wantShop){
        // Demande boutique
        Auth.requestStore();
      }
      // Après inscription, aller au login
      setTimeout(()=> location.href='../login.html', 700);
    });
  }

  // Bouton déconnexion dans le header (si présent)
  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      Auth.logout();
      showToast('Déconnecté', 'success');
      setTimeout(()=> location.href='../index.html', 500);
    });
  }
});
