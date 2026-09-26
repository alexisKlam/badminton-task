---
name: security-model
description: No-account access model and admin listing for the board app
type: decision
---
Boards are only protected by their random id in the URL hash. Firestore rules allow `get` on a board and full access to its tasks, but `list` on boards only for the admin (Google sign-in, email alexis.k@bcv38.org, email_verified). Board name/emoji are immutable after creation (rules: update may only touch `people` and `lastActivityAt`).

**Why**: association use without accounts; listing boards must stay private or the URL secret is worthless. Identity Platform (email/password via API) needs billing, so admin auth uses Firebase Auth Google provider enabled in the console.

**How to apply**: keep rules in sync with STATUSES in public/config.js and with fields written by app.js; never allow public `list` on `boards`.

**Related**: [[firebase-cli-notes]]
