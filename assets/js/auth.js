/* =========================================================
   AUTHENTIFICATION & CONNEXION FIREBASE (CORRIGÉ)
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBGmPM4OXEonp7qL78x20NC2DXvQW0lavU",
    authDomain: "aurum-bf.firebaseapp.com",
    projectId: "aurum-bf",
    storageBucket: "aurum-bf.firebasestorage.app",
    messagingSenderId: "858318726586",
    appId: "1:858318726586:web:14687fff6d4d08527a6983",
    measurementId: "G-SY7DY6WV97"
};

// 1. Initialisation (Une seule fois, sécurité anti-doublon)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase connecté !");
}

// 2. Export des outils globaux
const auth = firebase.auth();
const db = firebase.firestore();

// 3. Fonctions d'aide (Login/Register)
const Auth = {
    register: (email, password, name) => {
        return auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                return cred.user.updateProfile({ displayName: name })
                    .then(() => {
                        // Créer l'entrée dans la base de données
                        return db.collection('users').doc(cred.user.uid).set({
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
        return auth.signInWithEmailAndPassword(email, password)
            .then(cred => ({ success: true, user: cred.user }))
            .catch(err => ({ success: false, message: err.message }));
    },

    logout: () => {
        auth.signOut().then(() => window.location.href = "login.html");
    }
};
