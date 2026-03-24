/**
 * ═══════════════════════════════════════════════════════════════════════
 * SANHIA — functions/index.js
 * Cloud Function : vérification de doublon téléphone côté serveur
 * ═══════════════════════════════════════════════════════════════════════
 *
 * POURQUOI UNE CLOUD FUNCTION ?
 * ─────────────────────────────
 * La vérification de doublon téléphone se fait AVANT que l'utilisateur
 * soit connecté. On ne peut donc pas utiliser les Security Rules Firestore
 * (qui nécessitent request.auth) sans ouvrir la collection en lecture
 * publique — ce qui exposerait les numéros de tous les utilisateurs.
 *
 * La Cloud Function tourne avec les droits ADMIN (service account),
 * elle peut lire Firestore sans restriction, et elle ne retourne
 * QUE un booléen — jamais les données de l'utilisateur trouvé.
 *
 * SÉCURITÉ :
 * ──────────
 *  • Pas de données sensibles dans la réponse (juste exists: true/false)
 *  • Rate limiting via appCheck (optionnel, recommandé en prod)
 *  • Validation stricte du format téléphone côté serveur aussi
 *  • HTTPS callable = token CSRF automatique
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

// Initialiser l'Admin SDK (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ── Validation téléphone côté serveur (identique au client) ──
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  if (!/^\+?\d+$/.test(cleaned))          return false;
  const numOnly = cleaned.replace(/\D/g, '');
  if (numOnly.length < 7)                  return false;
  if (/^0+$/.test(numOnly))               return false;
  if (/0{4,}/.test(numOnly))              return false;
  return true;
}

/**
 * checkPhoneDuplicate
 * ───────────────────
 * Vérifie si un numéro de téléphone est déjà utilisé dans Firestore.
 *
 * Appel côté client :
 *   const checkPhone = firebase.functions().httpsCallable('checkPhoneDuplicate');
 *   const result = await checkPhone({ phone: '+22670000000' });
 *   // result.data → { exists: true } ou { exists: false }
 *
 * @param {string} data.phone — numéro à vérifier
 * @returns {{ exists: boolean }}
 */
exports.checkPhoneDuplicate = functions
  .region('europe-west1')          // ← change selon ta région Firebase
  .https.onCall(async (data, context) => {

    // ── 1. Validation de l'input ──
    const phone = (data.phone || '').toString().trim();

    if (!phone) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Le paramètre phone est requis.'
      );
    }

    if (!isValidPhone(phone)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Format de numéro de téléphone invalide.'
      );
    }

    // ── 2. Normalisation pour la comparaison ──
    //    On stocke le téléphone sans espaces dans Firestore pour
    //    éviter les faux négatifs (+226 70 00 vs +22670000)
    const normalized = phone.replace(/[\s\-\.]/g, '');

    // ── 3. Requête Firestore avec droits Admin (aucune règle ne bloque) ──
    try {
      const snap = await db
        .collection('users')
        .where('phone', '==', normalized)
        .limit(1)
        .get();

      // On ne renvoie QUE le booléen — jamais l'uid ou les données du compte
      return { exists: !snap.empty };

    } catch (err) {
      console.error('[checkPhoneDuplicate] Erreur Firestore:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la vérification. Réessayez.'
      );
    }
  });


/**
 * checkEmailDuplicate  (bonus — même logique pour l'email)
 * ──────────────────────────────────────────────────────────
 * Firebase Auth gère déjà les doublons d'email côté auth,
 * mais cette fonction permet de vérifier AVANT de tenter la création
 * et d'afficher un message immédiat sans faire un round-trip auth.
 *
 * @param {string} data.email — email à vérifier
 * @returns {{ exists: boolean }}
 */
exports.checkEmailDuplicate = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {

    const email = (data.email || '').toString().trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Format d\'email invalide.'
      );
    }

    try {
      // Firebase Auth Admin permet de vérifier sans créer de compte
      await admin.auth().getUserByEmail(email);
      // Si on arrive ici, l'email existe
      return { exists: true };

    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        return { exists: false };
      }
      console.error('[checkEmailDuplicate] Erreur Auth:', err);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la vérification. Réessayez.'
      );
    }
  });