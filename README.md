# Class Random Seat

Local-first classroom web app for:

- No-login local storage usage by default
- Optional Google sign-in for cloud backup
- Class registration and student registration
- Editable classroom layout templates
- Saved seat-plan history by title
- Timer and random student picker
- Korean / English UI

## Stack

- Next.js App Router
- Local Storage
- Firebase Authentication (Google, optional)
- Cloud Firestore (backup, optional)

## Setup

1. Install dependencies and run the dev server.
2. The app works immediately with browser local storage, even without login.
3. If you want optional cloud backup, create a Firebase project.
4. Enable Google sign-in in Firebase Authentication.
5. Create a Firestore database.
6. Copy `.env.example` to `.env.local` and fill in your Firebase web app keys.
7. Apply the Firestore rules in [firestore.rules](./firestore.rules).
8. If Playwright browsers are missing the first time you run smoke tests, install them with `npx playwright install`.

```bash
npm install
npm run dev
npx playwright install
```

## Verification

Run these commands from the repository root:

- `npm run lint`
- `npm run test:unit`
- `npm run test:smoke`
- `npm run verify`

`npm run verify` runs lint, unit tests, build, and smoke tests together.

## Local storage

- All classes, students, seat plans, recent selections, and language preference are stored in browser local storage by default.

## Firestore backup structure

```text
users/{uid}
users/{uid}/backups/primary
```

## Notes

- The app is fully usable without Google login.
- Google login is only needed when the user wants to back up or restore data through Firebase.
- Each saved seat plan keeps its own layout snapshot, so past plans still render correctly after later layout changes.
