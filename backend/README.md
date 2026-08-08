# Slidebook recommendations backend

This is a small, provider-neutral Node server. It does not use Firebase Cloud
Functions, Cloud Run, the Admin SDK, a service account, or any feature that
requires upgrading Firebase from the Spark plan. It runs locally or on
infrastructure you control; nothing in this folder deploys a hosted service,
changes the Firebase plan, or enables billing.

## Run locally

Node 20 or newer is required (Node 22 or newer is recommended). From the app
root, the normal command also reads `EXPO_PUBLIC_FIREBASE_PROJECT_ID` from the
existing `.env.local`:

```powershell
npm run backend:start
```

To run from this folder instead:

```powershell
Set-Location backend
Copy-Item .env.example .env
# Set FIREBASE_PROJECT_ID in .env, then run:
node --env-file=.env server.mjs
```

The default endpoint is `POST http://127.0.0.1:8787/getBookRecommendations`. Send a Firebase ID token from the signed-in app and the selected interests:

```http
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{"interests":["Fantasy","History"]}
```

Successful responses have this shape:

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

The success contract is strict JSON with exactly one top-level `books` array.
Each item contains the eight mapped Google Books fields shown above plus the
locally generated `reason`. The endpoint does not return Markdown, prose around
the JSON, model prompts, confidence scores, or internal ranking evidence.

## Local content-based ranking

After Google Books returns candidates, the backend ranks them locally using the
user's interests and phrase matches in these fields, from strongest to weakest:

1. Google Books categories
2. Title
3. Available Google Books summary

Matches across distinct interests accumulate, and equal scores preserve the
original Google Books order. The short `reason` names the selected interest and
the metadata field that supplied the strongest evidence. When no phrase is
present in the returned metadata, the reason only states that the book came
from the interest-based Google Books search.

This deterministic step does not call OpenAI, an LLM, or any other external AI
provider. It requires no AI provider key, creates no model or token cost, and
does not transfer the interests or returned book metadata to an AI service.
There is no model output to parse or an opportunity for a model to hallucinate
book details.

The ranker preserves the mapped Google Books metadata and adds only `reason`.
It never generates or rewrites titles, authors, descriptions, ratings, or other
book facts. A volume without a real Google Books title is omitted, missing
authors remain `[]`, and ratings are not part of the response. Missing summaries
use only the required `No summary available yet.` fallback, which remains
separate from the recommendation reason.

The server validates Firebase ID-token signatures and claims against Google's public SecureToken certificates. Only `FIREBASE_PROJECT_ID` (or the app's existing `EXPO_PUBLIC_FIREBASE_PROJECT_ID`) is needed for verification; it is an identifier, not a secret.

`GOOGLE_BOOKS_API_KEY` is required by Google for public Books API data. Keep it only in `backend/.env`, never use an `EXPO_PUBLIC_` name, and restrict it to the Google Books API and the backend host. It is sent to Google in the `X-Goog-Api-Key` request header and is never returned to the app. Keep billing disabled and stop if the console asks you to attach a billing account.

The server searches at most the first three selected interests per request, deduplicates books, caches matching requests for 15 minutes, applies a per-user in-memory rate limit, validates request sizes, and times out slow upstream calls. Some books have no description; those always return `No summary available yet.`

Google Books is the only external book-data API. The backend sends the selected
search subjects to it and keeps `GOOGLE_BOOKS_API_KEY` server-side; the Expo app
never calls Google Books directly. Firebase is used only to authenticate the
caller under the existing Spark-safe setup. No Firebase Cloud Function or paid
managed backend is required.

For an Android emulator, the mobile app normally reaches the host at `http://10.0.2.2:8787`. A physical device needs the computer's LAN address and `HOST=0.0.0.0`; only use that on a trusted local network. Expo web must use an origin listed in `ALLOWED_ORIGINS`. Any non-local deployment should use HTTPS, but no deployment is performed or required here.

## Tests

```powershell
npm run backend:test
```
