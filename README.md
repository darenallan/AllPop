# Sanhia — site Firebase (première version)

Première version web de **Sanhia**, la marketplace de boutiques locales du Burkina Faso, sous forme de **site multi-pages** (HTML, CSS et JavaScript) hébergé sur Firebase.

## Contenu

- Pages : accueil, catalogue, boutiques, produit, panier, commande, facture, messages, profil, livraison, connexion et inscription, administration, pages d'information et pages d'erreur (403, 404)
- `assets/` : styles globaux et par page, scripts
- `functions/` : **Cloud Functions** Firebase pour les vérifications sensibles côté serveur
- `.firebaserc` : projet Firebase
- `DASHBOARD_AUDIT.md`, `ANALYSIS.json`, `MIGRATION_REPORT_FINAL.json` : audit et suivi de migration

## Lancer

```bash
npx firebase-tools serve      # aperçu local
npx firebase-tools deploy     # déploiement (hosting + functions)
```

La version actuelle du projet est dans [`sanhia-web`](https://github.com/darenallan/sanhia-web) et [`server-sanhia`](https://github.com/darenallan/server-sanhia).

> Licence : aucune licence n'est déclarée dans ce dépôt (tous droits réservés par défaut).
