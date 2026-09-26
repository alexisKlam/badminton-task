---
name: firebase-cli-notes
description: Gotchas when driving Firebase from the CLI for project bcv38-taches
type: lesson
---
- `firebase login --no-localhost` in a non-interactive shell prints a URL and exits; finish with `firebase login <authorizationCode>`.
- Firestore API must be enabled (serviceusage) before `firebase firestore:databases:create`.
- Rules take ~1 min to propagate after the first deploy.
- `identityPlatform:initializeAuth` fails with BILLING_NOT_ENABLED on Spark: enable Authentication from the console instead.

**Why**: these cost time on the initial setup.
**How to apply**: follow this order for a new environment.
**Related**: [[security-model]]
