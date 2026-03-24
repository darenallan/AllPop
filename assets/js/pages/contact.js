/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANHIA — pages/contact.js
 * Page contact.html — Formulaire de contact
 *
 * CORRECTIONS :
 *   ✅ Sauvegarde réelle dans Firestore (collection 'contacts')
 *   ✅ Tous les champs : name, email, phone, message
 *   ✅ status: 'unread' → badge rouge dans l'admin theking.html
 *   ✅ Anti-doublon : bouton désactivé pendant l'envoi
 *   ✅ Validation locale avant envoi
 * ═══════════════════════════════════════════════════════════════════════════
 */

"use strict";

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("ct") && !document.querySelector(".ct-wrapper"))
    return;

  window.handleContactSubmit = async function (event) {
    event.preventDefault();

    var form = event.target;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    // ── Lecture des champs (correspond aux name= dans contact.html) ──
    var name = (form.querySelector('[name="name"]')?.value || "").trim();
    var email = (form.querySelector('[name="email"]')?.value || "")
      .trim()
      .toLowerCase();
    var phone = (form.querySelector('[name="phone"]')?.value || "").trim();
    var message = (form.querySelector('[name="message"]')?.value || "").trim();

    // ── Validation ──
    if (!name) {
      if (window.showToast)
        window.showToast("Veuillez indiquer votre nom.", "warn");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (window.showToast) window.showToast("Adresse email invalide.", "warn");
      return;
    }
    if (!message) {
      if (window.showToast)
        window.showToast("Le message ne peut pas être vide.", "warn");
      return;
    }

    // ── Bloquer le bouton ──
    var origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<span>Envoi en cours…</span>";

    try {
      var db =
        window.db ||
        (typeof firebase !== "undefined" ? firebase.firestore() : null);
      if (!db)
        throw new Error("Service indisponible. Réessayez dans un instant.");

      // ── Enregistrement Firestore ──
      await db.collection("contacts").add({
        name: name,
        email: email,
        phone: phone || null,
        message: message,
        status: "unread", // → badge rouge dans l'admin
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: "contact_form",
      });

      // ── Succès ──
      if (window.showToast) {
        window.showToast(
          "Message envoyé ! Nous vous répondrons très rapidement.",
          "success",
        );
      }
      form.reset();
    } catch (err) {
      console.error("[contact.js] Erreur:", err);
      if (window.showToast) {
        window.showToast("Erreur lors de l'envoi. Réessayez.", "danger");
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHTML;
    }
  };
});
