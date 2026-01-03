// ==========================================
// CONFIGURATION FIREBASE (Le lien vers le Cloud)
// ==========================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
  authDomain: "aurum-bf.firebaseapp.com",
  projectId: "aurum-bf",
  storageBucket: "aurum-bf.firebasestorage.app",
  messagingSenderId: "858318726586",
  appId: "1:858318726586:web:14687fff6d4d08527a6983",
  measurementId: "G-SY7DY6WV97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ==========================================
// LOGIQUE D'AUTHENTIFICATION (Gestion Login/Register)
// ==========================================

const Auth = {
    // 1. S'INSCRIRE (Créer un compte dans le Cloud)
    register: function(email, password, name) {
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Succès ! On met à jour le nom de l'utilisateur
                const user = userCredential.user;
                return user.updateProfile({
                    displayName: name
                }).then(() => {
                    return { success: true, user: user };
                });
            })
            .catch((error) => {
                // Erreur (ex: email déjà pris, mot de passe trop court)
                let msg = "Erreur inconnue";
                if (error.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé !";
                if (error.code === 'auth/weak-password') msg = "Le mot de passe est trop faible (6 caractères min).";
                if (error.code === 'auth/invalid-email') msg = "L'adresse email n'est pas valide.";
                return { success: false, message: msg };
            });
    },

    // 2. SE CONNECTER
    login: function(email, password) {
        return auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return { success: true, user: userCredential.user };
            })
            .catch((error) => {
                let msg = "Erreur de connexion.";
                if (error.code === 'auth/user-not-found') msg = "Aucun compte trouvé avec cet email.";
                if (error.code === 'auth/wrong-password') msg = "Mot de passe incorrect.";
                return { success: false, message: msg };
            });
    },

    // 3. SE DÉCONNECTER
    logout: function() {
        auth.signOut().then(() => {
            window.location.href = "login.html";
        });
    }
};

// ==========================================
// GESTION DES FORMULAIRES (HTML)
// ==========================================

document.addEventListener("DOMContentLoaded", function() {

    // --- FORMULAIRE INSCRIPTION ---
    const regForm = document.getElementById('form-register');
    if (regForm) {
        regForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass1 = document.getElementById('reg-pass').value;
            const pass2 = document.getElementById('reg-pass-confirm').value;

            if (pass1 !== pass2) {
                alert("❌ Les mots de passe ne correspondent pas !");
                return;
            }

            Auth.register(email, pass1, name).then((result) => {
                if (result.success) {
                    alert("✅ Compte créé ! Bienvenue " + name);
                    window.location.href = "index.html"; // Redirection Accueil
                } else {
                    alert("⚠️ " + result.message);
                }
            });
        });
    }

    // --- FORMULAIRE CONNEXION ---
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            Auth.login(email, pass).then((result) => {
                if (result.success) {
                    alert("👋 Connexion réussie !");
                    // Vérification Admin (si tu veux coder l'email admin en dur)
                    if (email === "admin@aurum.com") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "index.html";
                    }
                } else {
                    alert("❌ " + result.message);
                }
            });
        });
    }

    // --- VÉRIFICATION DE SESSION (Pour protéger les pages) ---
    // Si on veut afficher "Mon Compte" ou "Déconnexion"
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("Utilisateur connecté :", user.email);
            // Ici tu peux changer tes boutons "Connexion" par "Mon Profil"
        } else {
            console.log("Aucun utilisateur connecté");
        }
    });
});
