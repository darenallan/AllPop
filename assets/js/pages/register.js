/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — pages/register.js  [VERSION STANDARD FRONTEND]
 * ═══════════════════════════════════════════════════════════════════════════
 */

"use strict";

// ── Validation locale ──

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/[\s\-\.]/g, "");
  if (!/^\+?\d+$/.test(cleaned)) return false;
  const numOnly = cleaned.replace(/\D/g, "");
  if (numOnly.length < 7) return false;
  if (/^0+$/.test(numOnly)) return false;
  if (/0{4,}/.test(numOnly)) return false;
  return true;
}

function validateName(name) {
  const t = name.trim();
  return t.length >= 2 && !/^\d+$/.test(t);
}

function validatePassword(pass, confirm) {
  if (pass !== confirm)
    return { valid: false, error: "Les mots de passe ne correspondent pas." };
  if (pass.length < 6)
    return {
      valid: false,
      error: "Mot de passe trop court (minimum 6 caractères).",
    };
  if (pass.length > 256)
    return { valid: false, error: "Mot de passe trop long." };
  return { valid: true };
}

function normalizePhone(phone) {
  return phone.replace(/[\s\-\.]/g, "");
}

// ── Affichage erreurs ──

function showErr(msg) {
  console.warn("[REG] ❌", msg);
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.cssText = `
      display: block !important;
      color: #D94F4F;
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(217,79,79,0.08);
      border: 1px solid rgba(217,79,79,0.25);
      border-left: 3px solid #D94F4F;
      font-family: 'Syne', sans-serif;
      line-height: 1.5;
    `;
    errorDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  if (typeof window.showToast === "function") {
    window.showToast(msg, "danger");
  }
}

function clearErr() {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.cssText = "display: none !important;";
  }
}

// ── Attente Firebase prêt (SANS Functions) ──

function waitForFirebase(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.auth && window.db) {
        resolve({
          auth: window.auth,
          db: window.db,
        });
      } else if (Date.now() - start > timeout) {
        reject(new Error("Firebase non initialisé après " + timeout + "ms"));
      } else {
        setTimeout(check, 80);
      }
    };
    check();
  });
}

// ══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════

async function handleRegister() {
  clearErr();

  const name = (document.getElementById("reg-name")?.value || "").trim();
  const email = (document.getElementById("reg-email")?.value || "")
    .trim()
    .toLowerCase();
  const phone = (document.getElementById("reg-phone")?.value || "").trim();
  const pass = document.getElementById("reg-pass")?.value || "";
  const passConfirm = document.getElementById("reg-pass-confirm")?.value || "";
  const btn = document.getElementById("btn-register");

  if (!name || !email || !phone || !pass || !passConfirm) {
    showErr("Veuillez remplir tous les champs.");
    return;
  }
  if (!validateName(name)) {
    showErr("Nom invalide (minimum 2 caractères).");
    return;
  }
  if (!validateEmail(email)) {
    showErr("Adresse email invalide.");
    return;
  }
  if (!validatePhone(phone)) {
    showErr("Numéro de téléphone invalide. Exemple : +226 70 00 00 00");
    return;
  }
  const passCheck = validatePassword(pass, passConfirm);
  if (!passCheck.valid) {
    showErr(passCheck.error);
    return;
  }

  let auth, db;
  try {
    ({ auth, db } = await waitForFirebase());
  } catch (e) {
    showErr("Erreur de connexion à Firebase. Rechargez la page.");
    return;
  }

  const origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "<span>Création du compte…</span>";

  try {
    // 1. Création Firebase Auth (Firebase vérifiera tout seul si l'email existe déjà !)
    console.log("[REG] Création Auth…");
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;
    console.log("[REG] ✅ Auth créé, UID:", uid);

    // 2. Mise à jour profil Auth
    await cred.user.updateProfile({ displayName: name });
    console.log("[REG] ✅ Profil Auth mis à jour");

    // 3. Écriture Firestore
    btn.innerHTML = "<span>Enregistrement…</span>";
    console.log("[REG] Écriture Firestore…");
    await db
      .collection("users")
      .doc(uid)
      .set({
        uid,
        name,
        email,
        phone: normalizePhone(phone),
        role: "client",
        status: "active",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    console.log("[REG] ✅ Document Firestore créé");

    // 4. Redirection
    const finish = () => {
      if (typeof window.showToast === "function") {
        window.showToast("Compte créé avec succès ! Bienvenue 🎉", "success");
      }
      console.log("[REG] 🎉 Inscription réussie — redirection…");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500); // Redirige vers l'accueil ou le login
    };

    if (typeof window.syncCurrentUser === "function") {
      window.syncCurrentUser(cred.user).then(finish).catch(finish);
    } else {
      finish();
    }
  } catch (error) {
    console.error("[REG] ❌ Erreur:", error.code, error.message);

    const firebaseErrors = {
      "auth/email-already-in-use":
        "Cette adresse email est déjà utilisée. Connectez-vous !",
      "auth/invalid-email": "Format d'email invalide.",
      "auth/weak-password": "Mot de passe trop faible (minimum 6 caractères).",
      "auth/operation-not-allowed":
        "Inscription désactivée. Contactez l'administrateur.",
      "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
    };

    const msg =
      firebaseErrors[error.code] || "Erreur lors de la création du compte.";
    showErr(msg);

    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}

// ── Init ──

document.addEventListener("DOMContentLoaded", () => {
  console.log("[REG] 🚀 register.js (Standard version) chargé");

  const btn = document.getElementById("btn-register");
  const form =
    document.getElementById("register-container") ||
    document.querySelector("form");

  if (!btn) {
    console.error("[REG] ❌ #btn-register introuvable");
    return;
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    handleRegister();
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleRegister();
    });
  }

  clearErr();
  console.log("[REG] ✅ Prêt");
});
