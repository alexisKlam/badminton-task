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

Le workflow utilise **Workload Identity Federation** : aucune clé JSON n’est créée ni stockée. Pour le configurer, ouvre [Google Cloud Console — comptes de service](https://console.cloud.google.com/iam-admin/serviceaccounts?project=bcv38-taches) et [Workload Identity Pools](https://console.cloud.google.com/iam-admin/workload-identity-pools?project=bcv38-taches), puis exécute les commandes suivantes dans Cloud Shell connecté au projet `bcv38-taches`.

```sh
PROJECT_ID=bcv38-taches
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
POOL_ID=github-pool
PROVIDER_ID=github-provider
SERVICE_ACCOUNT=github-firebase-deploy
REPOSITORY=alexisKlam/badminton-task
```

Créer un compte de service et lui attribuer les droits de déploiement :

```sh
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \\
  --project="$PROJECT_ID" \\
  --display-name="GitHub Firebase deploy"

SA_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \\
  --member="serviceAccount:$SA_EMAIL" \\
  --role="roles/firebasehosting.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \\
  --member="serviceAccount:$SA_EMAIL" \\
  --role="roles/firebaserules.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \\
  --member="serviceAccount:$SA_EMAIL" \\
  --role="roles/datastore.indexAdmin"
```

Créer le pool et son fournisseur OIDC GitHub, limité à ce dépôt :

```sh
gcloud iam workload-identity-pools create "$POOL_ID" \\
  --project="$PROJECT_ID" \\
  --location=global \\
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \\
  --project="$PROJECT_ID" \\
  --location=global \\
  --workload-identity-pool="$POOL_ID" \\
  --display-name="GitHub badminton-task" \\
  --issuer-uri="https://token.actions.githubusercontent.com" \\
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \\
  --attribute-condition="assertion.repository == '$REPOSITORY'"

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \\
  --project="$PROJECT_ID" \\
  --role="roles/iam.workloadIdentityUser" \\
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$REPOSITORY"
```

Dans GitHub, ouvre [Settings → Secrets and variables → Actions → Variables](https://github.com/alexisKlam/badminton-task/settings/variables/actions) et ajoute ces **repository variables** (pas des secrets) :

- `WIF_PROVIDER` = `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider` (remplace `PROJECT_NUMBER` par le numéro affiché par `echo "$PROJECT_NUMBER"` dans Cloud Shell).
- `WIF_SERVICE_ACCOUNT` = `github-firebase-deploy@bcv38-taches.iam.gserviceaccount.com`

Après configuration, un push sur `main` lance le déploiement. Tu peux aussi le déclencher depuis l’onglet [Actions](https://github.com/alexisKlam/badminton-task/actions).
