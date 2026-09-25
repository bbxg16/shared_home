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
```

`.env.local` is gitignored and should never be committed. Double-check the API key and App ID directly in the Firebase Console — copy/paste through chat tools sometimes introduces stray backslashes (`\_`, `\:`) that must not appear in the real values.

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
- Post details are created with an `expiresAt` timestamp 7 days after creation.
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
- Purchase request and report details carry a 7-day expiry timestamp

**Still simple / next backend work:**

- Move 7-day cleanup from client-side best effort to a scheduled Cloud Function
- Add stronger rule validation for vote eligibility and immutable request/report fields
- Firebase Analytics
- Cloud Functions
- Push/email notifications
- Expense tracking, payments, or an expiry scheduler
- Native iOS/Android apps

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
