# Slidebook

Slidebook is an Expo Router app for discovering and saving books. It uses
Firebase Authentication for email/password accounts, Cloud Firestore for the
user library, and a small Node backend for Google Books recommendations. The
discovery, saved, profile, and interest routes require an authenticated session.

## Firebase setup

1. Create or open a Firebase project in the
   [Firebase console](https://console.firebase.google.com/).
2. Register a **Web app** in **Project settings > Your apps**. Expo uses the
   Firebase JavaScript SDK for Android, iOS, and web, so this client config is
   shared across platforms.
3. In **Authentication > Sign-in method**, enable **Email/Password**.
4. In **Build > Firestore Database**, create a Cloud Firestore database.
5. Copy `.env.example` to `.env.local` and replace each placeholder with the
   matching value from the Firebase web configuration object. Keep
   `EXPO_PUBLIC_BACKEND_URL=http://localhost:8787` for local web development.
6. Restart Expo after changing environment variables.

```powershell
Copy-Item .env.example .env.local
npm start
```

For the browser, run `npm run web`. On a phone, run `npm start` and scan the QR
code with Expo Go.

## Recommendation backend

The app sends `POST /getBookRecommendations` to the included Node backend with
the current Firebase ID token and `{ "interests": [...] }`. The backend verifies
the token against Firebase's public signing certificates, calls Google Books,
ranks the returned candidates locally, and returns only:

- `googleBookId`
- `title`
- `authors`
- `description`
- `thumbnail`
- `categories`
- `previewLink`
- `infoLink`
- `reason`

No Google Books request is made from the Expo app. Missing descriptions are
normalized to `No summary available yet.` on the server and handled the same way
again by the client.

Successful responses are strict JSON with one top-level `books` array. There is
no Markdown, commentary, model output, or hidden score in the response:

```json
{
  "books": [
    {
      "googleBookId": "example-id",
      "title": "Example",
      "authors": ["Example Author"],
      "description": "No summary available yet.",
      "thumbnail": null,
      "categories": ["Fiction"],
      "previewLink": null,
      "infoLink": null,
      "reason": "Matches your interest in Fantasy through its Google Books categories."
    }
  ]
}
```

### Local recommendation step

The recommendation step is a deterministic, content-based ranker that runs
inside the included backend. It compares the selected interests with the Google
Books categories, title, and available summary, then sorts the candidates and
adds a short, evidence-based `reason`. Equal-scoring books keep their Google
Books order.

This step does not call OpenAI, an LLM, or any other external AI provider. It
needs no AI API key, has no token charges, and does not send interests or book
metadata to an AI service. Google Books remains the only book-data provider;
the selected search subjects are sent to Google Books by the backend, never by
the mobile app.

The ranker does not rewrite or generate titles, authors, descriptions, ratings,
or other book metadata. Volumes without a real Google Books title are omitted,
missing authors remain an empty array, and ratings are not returned. The only
description fallback is the explicit `No summary available yet.` message; the
new `reason` is separate from the Google Books description.

Prepare the server-only environment, add a restricted Google Books key, and
start the backend in a second terminal. The npm script reads the Firebase
project ID already present in the app's `.env.local`:

```powershell
Copy-Item backend/.env.example backend/.env
# Set GOOGLE_BOOKS_API_KEY in backend/.env.
npm run backend:start
```

During local Expo development, the app defaults to `http://localhost:8787` when
`EXPO_PUBLIC_BACKEND_URL` is unset. The other backend settings can keep their
safe local defaults.

`GOOGLE_BOOKS_API_KEY` is required and server-only. Keep the Google Cloud
project unlinked from billing, restrict the key to the Books API and the backend
host, and place it only in `backend/.env`. Never prefix it with `EXPO_PUBLIC_`,
and do not continue if the console asks you to attach billing.

For Expo Go on a physical phone, both devices must be on the same network. Set
`HOST=0.0.0.0` in `backend/.env`, replace `EXPO_PUBLIC_BACKEND_URL` in
`.env.local` with `http://<your-computer-LAN-IP>:8787`, allow the local firewall
prompt, and restart both processes. `localhost` on a phone points to the phone,
not the development computer.

See [`backend/README.md`](backend/README.md) for the endpoint contract,
configuration, and local security notes.

## Database

The first version uses these Cloud Firestore document shapes:

- `users/{userId}`: `id`, `email`, `displayName`, `photoUrl`, `createdAt`,
  `isPremium`
- `userInterests/{userId}`: `userId`, `interests[]`
- `savedBooks/{userId_googleBookId}`: `userId`, `googleBookId`, `title`,
  `author`, `coverUrl`, `savedAt`
- `profiles/{userId}`: lightweight profile fields kept separate from private
  account data
- `bookRecommendations/{recommendationId}`: reserved recommendation cache;
  first-version recommendations are returned directly by the backend

Firestore creates collections when their first document is written. User and
profile documents are created on sign-in, interests are written when selections
change, and saved-book documents are created or deleted when a user toggles a
book. `bookRecommendations` remains unused in the Spark-only first version.

`posts`, `followers`, and `authorProfiles` are reserved for later. Their client
access is explicitly denied until their privacy and validation model is built.

Deploy the included ownership rules and index configuration before testing
database writes:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore
```

The saved-books query always includes `where('userId', '==', currentUser.uid)`
to match its ownership rule. Firestore rules are not result filters, so removing
that constraint will correctly cause the query to fail.

## Spark plan only

This project is intentionally limited to Firebase's no-cost **Spark** plan:

- Use one Cloud Firestore database only.
- Use email/password Firebase Authentication and the Firestore client SDK.
- Do not link a Cloud Billing account or enable Blaze.
- Do not deploy Cloud Functions, Cloud Run, paid Google Cloud services,
  Firestore backups, point-in-time recovery, TTL deletes, or extra databases.
- Do not add phone authentication, Cloud Storage, or paid extensions in this
  version.

The app minimizes writes by updating user/profile records only when their auth
profile fields actually change. Under the current Spark quota, the single free
Firestore database includes 1 GiB stored data, 50,000 reads/day, 20,000
writes/day, 20,000 deletes/day, and 10 GiB/month outbound transfer. If the free
quota is exhausted, Spark service is limited or paused rather than billing a
payment method. Monitor usage in **Firebase console > Firestore > Usage**, and
never accept a prompt to attach billing for this project.

Firebase Cloud Functions are intentionally not used: deploying them requires
the Blaze plan. The recommendation backend is provider-neutral and free to run
locally or on infrastructure you control. It is a self-hosted Node process, not
a Firebase managed backend, and it does not change the Firebase project from
Spark or enable any Firebase billing feature. This repository does not
automatically deploy or enable any hosted service. If it is hosted later, use a
genuinely free runtime with billing disabled and set the app URL to that HTTPS
endpoint.

## Client configuration and secrets

Firebase's web configuration, including its API key, identifies the Firebase
project and is public in a compiled web or mobile client. Authorization must be
enforced with Firebase Authentication and Security Rules—not by hiding this
configuration.

Never add service-account JSON, Admin SDK credentials, private keys, the Google
Books key, or other backend secrets to this repository or to an `EXPO_PUBLIC_*`
variable. The backend verifies Firebase tokens without an Admin SDK credential.
All local `.env` files and common Firebase service-account filenames are ignored
by Git; only `.env.example` files are committed.

## Checks

```powershell
npm run typecheck
npm run backend:test
npx expo export --platform web
npx expo export --platform android
```
