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

// Liaison formulaires - attacher les listeners dès que possible
function attachFormListeners(){
  console.log('[auth] Attaching form listeners...');
  const loginForm = document.getElementById('login-form');
  console.log('[auth] loginForm element:', loginForm);
  
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      console.log('[login] submit event intercepté, defaultPrevented avant:', e.defaultPrevented);
      e.preventDefault();
      e.stopPropagation();
      console.log('[login] defaultPrevented après preventDefault:', e.defaultPrevented);
      const btn = loginForm.querySelector('button[type="submit"]');
      btn && (btn.disabled = true);
      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value.trim();
      console.log('[login] credentials:', { email, passLen: pass.length });
      const res = Auth.login(email, pass);
      console.log('[login] result:', res);
      if(!res.success){
        showToast?.(res.error || 'Échec de connexion', 'danger');
        btn && (btn.disabled = false);
        return;
      }
      showToast?.('Connecté', 'success');
      const role = res.user.role;
      console.log('[login] redirecting with role:', role);
      setTimeout(()=>{
        if(role === 'admin') location.href = 'admin.html';
        else location.href = 'index.html';
      }, 400);
    });
    console.log('[auth] login listener attached successfully');
  }

  const regForm = document.getElementById('register-form');
  if(regForm){
    regForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      e.stopPropagation();
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
    console.log('[auth] register listener attached successfully');
  }

  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', ()=>{
      Auth.logout();
      showToast?.('Déconnecté', 'info');
      setTimeout(()=> location.href='index.html', 300);
    });
  }
  console.log('[auth] All listeners attached');
}

// Attacher immédiatement si le DOM est prêt
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', attachFormListeners);
} else {
  // DOM déjà prêt, attacher tout de suite
  console.log('[auth] DOM already loaded, attaching listeners immediately');
  attachFormListeners();

}

//nouveelle section
if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault(); // Bloque le rechargement
      e.stopPropagation();

      const btn = loginForm.querySelector('button[type="submit"]');
      if(btn) btn.innerHTML = "Connexion..."; // Feedback visuel sur le bouton

      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value.trim();

      // Tentative de connexion
      const res = Auth.login(email, pass);

      if(!res.success){
        // 🚨 CAS D'ERREUR : On force une alerte visible
        alert("ERREUR : " + (res.error || 'Échec de connexion'));
        if(btn) btn.innerHTML = "Se connecter";
        if(btn) btn.disabled = false;
        return;
      }

      // ✅ SUCCÈS
      alert("SUCCÈS ! Connecté en tant que " + res.user.name);
      
      const role = res.user.role;
      setTimeout(()=>{
        if(role === 'admin') location.href = 'admin.html';
        else location.href = 'index.html';
      }, 100);
    });
  }
