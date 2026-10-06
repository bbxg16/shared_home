# 有本要奏

A mobile-first web app for housemates to join one home, submit purchase requests, and file/report household issues for group voting.

This repository currently contains a simple mock-backed product prototype. See [Current scope](#current-scope) below.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Firebase Web SDK (Authentication, Cloud Firestore)
- Lucide React (icons)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Firebase Web app config:

```bash
cp .env.example .env.local
```

`.env.local` needs these five values (from Firebase Console → Project Settings → your Web app):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ONESIGNAL_APP_ID=
```

`.env.local` is gitignored and should never be committed. Double-check the API key and App ID directly in the Firebase Console — copy/paste through chat tools sometimes introduces stray backslashes (`\_`, `\:`) that must not appear in the real values.

`VITE_ONESIGNAL_APP_ID` is optional. When it is set, the app loads OneSignal Web Push, lets signed-in members subscribe from the bell button, and logs them into OneSignal with their Firebase UID as the external ID. Do not put your OneSignal REST API key in `.env.local`; that key must stay server-side.

### 3. Run the dev server

```bash
npm run dev
```

### 4. Type-check / build

```bash
npm run build
```

## What you need to configure manually in Firebase Console

- Confirm the Firebase project (`shared-home-48f90`, or your own project) exists.
- Create a **Cloud Firestore** database if one doesn't exist yet. Choose production/secure rules, not test-mode "open" rules.
- Enable **Authentication** and turn on the Google provider. Anonymous auth is also supported by the app's guest sign-in button if you enable it.
- Add `bbxg16.github.io` in **Authentication → Settings → Authorized domains** for the GitHub Pages test link.
- Keep Firestore rules scoped to authenticated users before sharing the app.
- `firestore.rules` and `firebase.json` are included. Deploy rules with the Firebase CLI after selecting your project.
- Optional: create a OneSignal Web Push app and add the App ID to `VITE_ONESIGNAL_APP_ID`. For GitHub Pages, configure the site URL as `https://bbxg16.github.io/shared_home/`. iPhone users still need to add the site to the Home Screen before iOS web push can work.
- For GitHub Pages deployment, add a repository secret named `VITE_ONESIGNAL_APP_ID` with the OneSignal App ID, then rerun the Pages workflow. The public App ID is safe to expose; the OneSignal REST API key is not.

The House screen includes a Firebase panel for basic verification:

- Sign in with Google or continue as a guest.
- The app writes/merges a `/users/{uid}` profile document in Firestore after sign-in.
- No Firebase Storage plan is required. Requests and reports are text-first and do not upload images.

## Live Firebase behavior

When `.env.local` is configured, the app uses live Firebase data:

- Users sign in through Firebase Authentication.
- A signed-in user can create one home from the House screen.
- The home gets an invite code.
- Another signed-in user can join by entering that invite code.
- Members, request posts, report posts, and votes are scoped under the joined home.
- Posts store text fields directly in Firestore.
- Post details are created with an `expiresAt` timestamp 30 days after creation.
- When a signed-in member opens the app, expired request/report documents are deleted in small batches.

Firestore shape:

```text
/users/{uid}
/houses/{houseId}
/houses/{houseId}/members/{uid}
/houses/{houseId}/purchases/{purchaseId}
/houses/{houseId}/purchases/{purchaseId}/votes/{uid}
/houses/{houseId}/reports/{reportId}
/houses/{houseId}/reports/{reportId}/votes/{uid}
/emailNotifications/{notificationId}
```

After enabling Firestore, deploy the included rules:

```bash
firebase deploy --only firestore:rules
```

## Shareable Test Link

Firebase Hosting is the recommended free shareable test link for this project.

Deploy it with:

```bash
npm run build
firebase login --reauth
firebase deploy --project shared-home-48f90 --only hosting,firestore:rules
```

Firebase will print a live URL, usually:

```text
https://shared-home-48f90.web.app
```

Add `shared-home-48f90.web.app` in Firebase Console → Authentication → Settings → Authorized domains.

GitHub Pages is also configured through `.github/workflows/deploy-pages.yml`, but private repositories may require a paid GitHub plan.

If you make the repo public and use GitHub Pages, the app should be available at:

```text
https://bbxg16.github.io/shared_home/
```

If the GitHub Actions deployment asks for Pages setup, go to GitHub → Settings → Pages and choose **GitHub Actions** as the source.

## Current scope

The app currently includes:

- Vite + React + TypeScript project scaffold
- Tailwind CSS design system (mobile-first, ~375–430px primary width)
- React Router routes and a persistent bottom navigation (Home, 申请, 举报, House)
- Firebase App, Authentication, and Firestore initialization
- Domain types for users, homes, members, purchase requests, reports, votes, and weekly summaries
- Auth helper service
- Mock-backed screens for Home, purchase requests, purchase request detail, reports/举报, report detail, and House

**Current simple product scope:**

- One shared home with members and an invite code
- Requests: members can submit purchase requests with an optional link, description, and price
- 申请 voting: other members approve/reject with optional comments
- Requester status tracking for pending/approved/rejected requests
- Reports: members can report another member with comments
- 举报 voting: other members agree/disagree with optional comments
- Weekly report summary showing reports each member received
- Purchase request and report details carry a 30-day expiry timestamp

**Still simple / next backend work:**

- Move 30-day cleanup from client-side best effort to a scheduled Cloud Function
- Add stronger rule validation for vote eligibility and immutable request/report fields
- Firebase Analytics
- Cloud Functions
- Automatic push notifications for new requests/reports
- Expense tracking, payments, or an expiry scheduler
- Native iOS/Android apps

## Optional Free Email Notifications

The app can queue email notifications in Firestore when a member creates a new request or report. This does not send mail by itself. A free Google Apps Script timer can poll the queue and send emails from your Gmail account.

How it works:

- New request/report created in the app.
- App writes `/emailNotifications/{notificationId}` with the post link and recipient emails.
- Google Apps Script runs every few minutes.
- Script sends one email to the other members and marks the notification `sent`.

Setup:

1. Deploy the updated Firestore rules:

```bash
firebase deploy --project shared-home-48f90 --only firestore:rules
```

2. In Google Cloud Console for the Firebase project, create a service account and grant it **Cloud Datastore User**.
3. Create a JSON key for that service account.
4. Open <https://script.google.com>, create a new Apps Script project, and paste `tools/google-apps-script-email-notifications.js`.
5. In Apps Script, open **Project Settings → Script properties** and add:

```text
FIREBASE_PROJECT_ID=shared-home-48f90
SERVICE_ACCOUNT_EMAIL=the service account client_email
SERVICE_ACCOUNT_PRIVATE_KEY=the service account private_key
```

Keep the `\n` characters in the private key if you paste it on one line.

6. Run `processEmailNotifications` once and approve permissions.
7. Add a time-driven trigger for `processEmailNotifications`, such as every 5 minutes.

Existing members may need to open the app once after this update so their email is saved into the home member list. New members will save their email automatically when they create or join a home.

## Optional OneSignal Push Notifications

The app can notify everyone in the same home when someone creates a new request or report. The browser app calls a small Cloudflare Worker, and the Worker calls OneSignal with the private REST API key.

Why a Worker is needed:

- The OneSignal App ID is public and can be used in the browser.
- The OneSignal REST API Key is private and must never be committed or exposed in frontend code.

Setup:

1. In Cloudflare, create a Worker and paste `tools/cloudflare-worker-onesignal.js`.
2. Add Worker environment variables:

```text
ONESIGNAL_APP_ID=5638288d-75df-46e6-8224-f21f5a904007
ONESIGNAL_REST_API_KEY=your OneSignal REST API key
```

3. Deploy the Worker and copy its URL, for example:

```text
https://youben-push.your-name.workers.dev
```

4. In GitHub, open the repository settings and add a repository secret:

```text
Name: VITE_PUSH_WEBHOOK_URL
Value: your Cloudflare Worker URL
```

5. Re-run the GitHub Pages deployment.
6. Open the app once with each browser/device and turn notifications on. The app tags each OneSignal subscription with the current `house_id`, so notifications only go to members in the same home.

## Backend next up

1. Create House and Join House via invite code
2. House member subcollection (`/houses/{houseId}/members/{uid}`)
3. Firestore Security Rules scoped to authenticated house membership
4. Protected application routes
5. Real Purchase Request create/read/vote writes
6. Real Report create/read/vote writes
7. Scheduled cleanup for expired request/report details

## Project structure

```
src/
├── components/
│   ├── common/       # AppHeader, BottomNavigation, EmptyState, StatusBadge
│   └── layout/        # AppLayout (page shell + bottom nav)
├── data/
│   └── mockData.ts    # Typed mock house, members, requests, reports, votes
├── lib/
│   └── firebase.ts     # Firebase App + Auth + Firestore init
├── pages/              # Home, purchase request, report, and house screens
├── services/            # Auth helper service
├── types/
│   └── index.ts         # Shared domain models
├── App.tsx
├── main.tsx
└── index.css
```
