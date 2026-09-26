# Tableau de tâches (mini Trello)

Mini Trello sans compte pour une association : chaque tableau a une URL secrète (`https://bcv38-taches.web.app/#<id>`), toute personne qui a le lien peut tout faire.

- Statuts : À faire → En cours → Terminé (glisser-déposer, ou bouton « → statut suivant » sur mobile).
- Tâche : titre, description, checklist, assigné, statut, échéance.
- À la création : nom, emoji (non modifiables) et liste des personnes (modifiable via 👥).
- Admin : `https://bcv38-taches.web.app/#admin` (connexion Google, seul `alexis.k@bcv38.org` peut lister les tableaux).

## Stack

HTML/CSS/JS sans build + Firebase Hosting + Cloud Firestore (formule Spark gratuite).
Configuration et constantes : `public/config.js`. Sécurité : `firestore.rules`.

## Déployer

```sh
npm i -g firebase-tools
firebase login
firebase deploy
```
