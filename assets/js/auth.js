// Authentification 100% locale (LocalStorage mock)
// - Aucune requête réseau
// - Stocke les utilisateurs dans localStorage sous la clé "users"
// - Stocke la session dans localStorage sous la clé "currentUser"
// - Rôle admin forcé pour l'email admin@aurum.com

const LS_USERS_KEY = 'users';
const LS_CURRENT_KEY = 'currentUser';

function safeParse(json, fallback){
  try { return JSON.parse(json); } catch { return fallback; }
}

function loadUsers(){
  const users = safeParse(localStorage.getItem(LS_USERS_KEY), []);
  // Injecter l'admin par défaut s'il n'existe pas
  const hasAdmin = users.some(u => (u.email||'').toLowerCase() === 'admin@aurum.com');
  if(!hasAdmin){
    users.push({ email:'admin@aurum.com', password:'admin', name:'Admin Aurum', role:'admin' });
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  }
  return users;
}

function saveUsers(users){
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function setSession(user){
  localStorage.setItem(LS_CURRENT_KEY, JSON.stringify(user));
}

function clearSession(){
  localStorage.removeItem(LS_CURRENT_KEY);
}

function getSession(){
  return safeParse(localStorage.getItem(LS_CURRENT_KEY), null);
}

const Auth = {
  register(name, email, password, phone = ''){
    const users = loadUsers();
    const exists = users.some(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if(exists) return { success:false, error:'Un compte existe déjà avec cet email' };

    const role = (email||'').toLowerCase() === 'admin@aurum.com' ? 'admin' : 'client';
    const user = { name: name?.trim()||'Utilisateur', email: email.trim(), password: password.trim(), phone: phone.trim(), role };
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { success:true, user };
  },

  login(email, password){
    const users = loadUsers();
    const user = users.find(u => (u.email||'').toLowerCase() === (email||'').toLowerCase());
    if(!user) return { success:false, error:'Compte introuvable' };
    if(user.password !== password) return { success:false, error:'Mot de passe incorrect' };
    setSession(user);
    return { success:true, user };
  },

  logout(){ clearSession(); },
  current(){ return getSession(); },
  isAuthenticated(){ return !!getSession(); }
};

// Liaison formulaires
window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);
      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value.trim();
      const res = Auth.login(email, pass);
      if(!res.success){
        showToast?.(res.error || 'Échec de connexion', 'danger');
        btn && (btn.disabled = false);
        return;
      }
      showToast?.('Connecté', 'success');
      const role = res.user.role;
      setTimeout(()=>{
        if(role === 'admin') location.href = 'admin.html';
        else location.href = 'index.html';
      }, 400);
    });
  }

  const regForm = document.getElementById('register-form');
  if(regForm){
    regForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const btn = regForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);
      const name = regForm.name?.value?.trim() || '';
      const email = regForm.email?.value?.trim() || '';
      const pass = regForm.password?.value?.trim() || '';
      const phone = regForm.phone?.value?.trim() || '';
      const res = Auth.register(name, email, pass, phone);
      if(!res.success){
        showToast?.(res.error || 'Échec de création', 'danger');
        btn && (btn.disabled = false);
        return;
      }
      showToast?.('Compte créé', 'success');
      setTimeout(()=> location.href='index.html', 500);
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      Auth.logout();
      showToast?.('Déconnecté', 'info');
      setTimeout(()=> location.href='index.html', 300);
    });
  }
});
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

// URL API (à remplacer par l'endpoint public en prod, jamais localhost depuis GitHub Pages)
const API_BASE = 'https://api.example.com';

// Utilitaires
function delay(ms){ return new Promise(res => setTimeout(res, ms)); }
function normalizeRole(r){
  const key = String(r||'client').toLowerCase();
  return RoleMap[key] || key;
}
function safeToast(message, type='info'){
  try {
    return showToast(message, type);
  } catch (err) {
    console.warn('[toast-fallback]', err);
    alert(message);
  }
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

    // Persister (avec garde mobile/safari privé)
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(acc));
    } catch (err) {
      console.warn('[auth] localStorage indisponible', err);
      return { success:false, error:'Stockage bloqué par le navigateur. Réessaye en mode normal.' };
    }

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
    console.log('[login] Form #login-form détecté');
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      console.log('[login] Submit intercepté');
      const btn = loginForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);
      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value.trim();
      console.log('[login] Champs saisis', { email, pwdLen: pass.length });

      // Feedback immédiat pour mobile
      safeToast('Connexion en cours...', 'info');

      // Garde si Store n'est pas prêt (cache/cors)
      if(!window.Store){
        console.error('[login] Store indisponible');
        safeToast('Données non chargées. Recharge la page.', 'danger');
        btn && (btn.disabled = false);
        return;
      }

      try {
        console.log('[login] Tentative Auth.login (localStore)');
        const res = await Auth.login(email, pass);
        console.log('[login] Résultat', res);

        if(!res.success){
          console.warn('[login] Échec', res.error);
          safeToast(res.error || 'Échec de connexion', 'danger');
          btn && (btn.disabled = false);
          return;
        }

        safeToast('Connecté avec succès', 'success');
        const role = Auth.user.role;
        console.log('[login] Redirection rôle', role);
        setTimeout(()=>{
          if(role === 'seller') location.href = 'seller.html';
          else if(role === 'superadmin') location.href = 'admin.html';
          else location.href = 'index.html';
        }, 600);
      } catch (err) {
        console.error('[login] Exception', err);
        safeToast("Impossible de contacter le serveur. Vérifie ta connexion ou l'URL de l'API.", 'danger');
      } finally {
        btn && (btn.disabled = false);
      }
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
        safeToast(res.error || 'Échec de création', 'danger');
        btn && (btn.disabled = false);
        return;
      }

      safeToast('Compte créé', 'success');

      if(wantShop){
        // Demande boutique
        Auth.requestStore();
      }
      // Après inscription, aller au login
      setTimeout(()=> location.href='login.html', 700);
    });
  }

  // Bouton déconnexion dans le header (si présent)
  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      Auth.logout();
      showToast('Déconnecté', 'success');
      setTimeout(()=> location.href='index.html', 500);
    });
  }
});
