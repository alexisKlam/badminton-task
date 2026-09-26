# Tableau de tâches (mini Trello)

Mini Trello sans compte pour une association : chaque tableau a une URL secrète (`https://bcv38-taches.web.app/#<id>`), toute personne qui a le lien peut tout faire.

- Statuts : À faire → En cours → Terminé (glisser-déposer, ou bouton « → statut suivant » sur mobile).
- Tâche : titre, description, checklist, assigné, statut, échéance.
- À la création : nom, emoji (non modifiables) et liste des personnes (modifiable via 👥).
- Admin : `https://bcv38-taches.web.app/#admin` (connexion Google, seul `alexis.k@bcv38.org` peut lister les tableaux).

## Stack

HTML/CSS/JS sans build + Firebase Hosting + Cloud Firestore (formule Spark gratuite).
Configuration et constantes : `public/config.js`. Sécurité : `firestore.rules`.

## Prérequis

- Node.js (LTS) et npm
- Un compte ayant accès au projet Firebase `bcv38-taches`
- Firebase CLI : `npm install -g firebase-tools`

## Lancer et déployer manuellement

À la racine du dépôt :

```sh
firebase login
firebase use bcv38-taches
firebase deploy --project bcv38-taches
```

Le projet Firebase est déjà sélectionné dans `.firebaserc`. Le déploiement publie Firebase Hosting, les règles Firestore et les index configurés dans `firebase.json`.

## Déploiement automatique depuis GitHub

Le workflow `.github/workflows/firebase-deploy.yml` déploie sur `bcv38-taches` à chaque push sur `main`.

Pour l’activer :

1. Dans Google Cloud Console, crée un compte de service pour le projet `bcv38-taches`.
2. Accorde-lui les rôles nécessaires au déploiement : **Firebase Hosting Admin**, **Cloud Datastore Index Admin** et **Firebase Rules Admin**.
3. Crée une clé JSON pour ce compte de service.
4. Dans le dépôt GitHub, ouvre **Settings → Secrets and variables → Actions**, puis ajoute le secret `FIREBASE_SERVICE_ACCOUNT_BCV38_TACHES` contenant le JSON complet de la clé.
5. Pousse les changements sur la branche `main` (ou lance le workflow manuellement depuis l’onglet **Actions**).

La clé est utilisée uniquement par GitHub Actions et ne doit jamais être ajoutée au dépôt. Pour révoquer l’accès, supprime la clé dans Google Cloud IAM.
