# Veriq — AI-Assisted Legal Document Contradiction & Evidence Analysis

Two parts, in one folder:

```
veriq/
  frontend/   React Native (Expo) app — runs on your phone via Expo Go
  backend/    Node.js + Express + Prisma (PostgreSQL) API — optional, for a real multi-user deployment
```

## What changed in this version

- **No preset/demo data anywhere.** The app now starts completely empty.
  The very first thing you see after logging in is a capture/upload
  screen — you scan or upload real documents, confirm a few key facts
  from each one, and Veriq compares them **live**, on-device, as you go.
- **3 roles, 3 distinct dashboards.** Sign in as **Lawyer**, **Legal
  Researcher**, or **Admin** — each gets a different home screen and
  different permissions (only Lawyer/Admin can accept/reject a
  contradiction finding; Researcher can flag and search but not resolve).
- **Export to PDF now actually works.** The Reports tab generates a real
  PDF (via `expo-print`) from your case's current documents, facts, and
  findings, and opens the native share sheet so you can save, print, or
  email it.
- **Nicer UI/UX.** Gradient hero headers, a proper color/spacing/shadow
  system, icons throughout, empty states instead of blank screens, and
  role-colored badges (see `src/theme/theme.js`).

## How the "live" analysis actually works (please read this)

Real OCR (reading text out of a photographed or scanned document) and a
real cross-document AI reasoning pipeline need either a native ML model or
a backend service — that can't run inside Expo Go on your phone. So this
app takes an honest middle path instead of faking it:

1. You **capture a photo or upload a file** — this is real; JPG/PNG/PDF
   files go through real cloud OCR (see setup below), and `.txt` files are
   read directly on-device. (DOCX text extraction isn't wired up yet —
   you'll see a note to enter those facts manually.)
2. The app scans the real OCR text for dates and amounts and shows them as
   **tappable suggestions** — confirm one with a tap, or type facts in
   yourself if you prefer, or if OCR didn't find something.
3. The **contradiction engine** (`src/utils/contradictionEngine.js`) then
   compares every fact you've confirmed against every other document's
   facts, live, and flags genuine mismatches — different dates, different
   amounts, inconsistent names (while correctly ignoring simple
   abbreviations like "Ravi K." vs "Ravi Kumar", per the spec), missing
   supporting evidence, etc. Nothing here is scripted or pre-baked —
   contradictions only appear once *you* enter conflicting facts.
4. Timeline, Evidence Mapping, AI Summary, Compare, Search, and the PDF
   Report are all *derived live* from those same facts.

## Real OCR setup (5 minutes, free, no credit card)

Photos and PDFs are now read with **real OCR** via the OCR.space cloud API,
called directly from the phone — no backend needed.

1. Go to **https://ocr.space/ocrapi/freekey**
2. Enter your email — a free API key is shown instantly (also emailed to you).
3. Open `frontend/src/config.js` and replace the placeholder:
   ```js
   export const OCR_SPACE_API_KEY = 'YOUR_OCR_SPACE_API_KEY';
   ```
   with your real key.
4. Restart Expo (`npx expo start`) and reload the app.

That's it. Now, when you capture a photo or upload a JPG/PNG/PDF:
- The app compresses the image (`expo-image-manipulator`) to fit the free
  tier's 1MB limit, then sends it to OCR.space and gets real text back.
- `src/utils/factExtraction.js` scans that real text with regex for dates
  (`15 March 2025`, `10/03/2025`, `2025-03-15`, etc.) and amounts (`₹5,00,000`,
  `Rs 700000`, `$1,200`), and shows them as **tappable suggestions** on the
  "Confirm Facts" screen — tap one to instantly fill in the topic and value
  instead of typing it by hand.
- You still confirm/save each fact explicitly — nothing is auto-added
  without your tap, consistent with "the lawyer remains the final
  decision-maker."

**Free tier limits:** 25,000 requests/month, 500/day, 3 requests/second,
1MB per file (handled automatically by compression). Fine for testing and
small-team use — see https://ocr.space/ocrapi for paid tiers if you need more.

**If OCR fails** (no internet, bad photo, key not set yet), the app tells
you exactly why on the Confirm Facts screen and falls back to manual entry
— it never blocks you from finishing.

**Security note:** this key ships inside the app bundle. Fine for a demo/
internal tool; for a public app, proxy the call through your backend
instead — see the comment at the bottom of `src/services/ocrService.js`
for the two-line change that requires.

**Want higher accuracy (handwriting, messy scans)?** Swap OCR.space for
Google Cloud Vision:
1. Create a GCP project → enable the **Vision API** → create an API key.
2. In `ocrService.js`, replace the `callOcrSpace` function with:
   ```js
   async function callGoogleVision(base64) {
     const res = await fetch(
       `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           requests: [{ image: { content: base64 }, features: [{ type: 'TEXT_DETECTION' }] }],
         }),
       },
     );
     const data = await res.json();
     return data.responses?.[0]?.fullTextAnnotation?.text?.trim() || '';
   }
   ```
   Google Vision has a free tier of 1,000 units/month, then pay-per-use.

---



## 1. Install prerequisites (one-time)

1. **Node.js** (v18 or v20 LTS) — https://nodejs.org
2. **VS Code** — https://code.visualstudio.com
3. **Expo Go** app on your phone — search "Expo Go" on the App Store (iOS)
   or Google Play (Android).

## 2. Save the project in VS Code

1. Unzip/copy the `veriq/` folder to your computer.
2. Open VS Code → `File > Open Folder…` → select `veriq`.
3. Open a terminal: `Terminal > New Terminal`.

## 3. Run it on your phone

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with your phone's Camera app (iOS) or the Expo Go app's
scanner (Android). Your phone and computer must be on the same Wi-Fi.

**What you'll see:**
1. A login screen — pick **Lawyer**, **Legal Researcher**, or **Admin**,
   enter any email/password (this demo accepts anything), and continue.
2. Immediately, a "Let's start your case" screen with two big buttons:
   **Capture with Camera** and **Upload a Document**.
3. After adding a document, you'll be asked to confirm a few facts from
   it (date, amount, names, etc.).
4. Add a second document with a conflicting fact (e.g. a different date)
   and watch the **Contradictions** tab flag it live, with severity,
   confidence, and reasoning.
5. From then on, your Home tab shows your role's dashboard, and any
   previously-added documents/facts are listed under the **Case** tab →
   **Documents**, so you can keep building the same case across sessions
   (data persists on-device via AsyncStorage until you clear it in
   Settings).

> If the QR scan fails to connect, run `npx expo start --tunnel` instead.

---

## 4. Optional: the real backend (for actual OCR + multi-user deployment)

Everything above runs with **zero backend** — case data lives on your
phone. If you want real OCR (so text is extracted automatically from PDFs/
images instead of typed in) and a shared multi-user database, the
`backend/` folder has:

- A full Express + PostgreSQL API (auth, cases, documents, contradictions,
  case-level access control, audit logs) — see `backend/prisma/schema.prisma`
  for the complete data model.
- The exact pipeline order from the spec (extract → OCR → segment →
  entity/claim extraction → cross-document comparison → contradiction
  detection) in `backend/src/controllers/analysisPipeline.js`, with each
  stage's real implementation (OCR engine, LLM claim extraction) marked as
  a clear integration point rather than faked.

### Set it up
```bash
cd backend
cp .env.example .env
# create a free Postgres DB at https://supabase.com and paste its
# connection string into .env as DATABASE_URL; set any JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```
Then, once you've built out real extraction there, you'd swap the
frontend's on-device `LiveCaseContext` for calls to this API — the shapes
already match (`Contradiction`, `Claim`, `TimelineEvent`, etc. mirror the
same fields the on-device engine produces), so the UI screens themselves
would not need to change.

---

## 5. Making it a real installable phone app

```bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # installable .apk
eas build --platform ios --profile preview        # for TestFlight/simulator
```
Guide: https://docs.expo.dev/build/introduction/

---

## 6. Project structure reference

```
frontend/
  App.js                                wraps app in Auth + LiveCase providers
  src/
    navigation/RootNavigator.js         role-based tabs; Home flips from
                                         capture screen -> dashboard once
                                         facts exist
    context/AuthContext.js              login/session (local demo auth)
    context/LiveCaseContext.js          THE live data model — documents,
                                         facts, derived contradictions/
                                         timeline/evidence, audit log
    utils/contradictionEngine.js        rule-based live comparison engine
    utils/factExtraction.js             regex date/amount extraction from real OCR text
    utils/pdfReport.js                  real PDF export (expo-print + share)
    services/ocrService.js              real OCR via OCR.space cloud API
    config.js                           OCR API key goes here (see setup above)
    theme/theme.js                      colors, gradients, typography, radii
    components/UI.js                    Card, Badge, MetricTile, EmptyState...
    screens/
      LoginScreen.js                    role picker: Lawyer / Researcher / Admin
      OnboardingCaptureScreen.js        capture/upload landing (post-login)
      CameraCaptureScreen.js            live camera capture + quality check
      AddClaimScreen.js                 confirm facts from a document
      DocumentDetailScreen.js           per-document metadata + anomaly panel
      CompareScreen.js, SearchScreen.js, SettingsScreen.js
      dashboards/                       LawyerDashboard, ResearcherDashboard,
                                         AdminDashboard — 3 distinct home views
      case-tabs/                        Overview, Documents, Timeline,
                                         Contradictions, Evidence, AI Summary,
                                         Reports (tabs inside the Case tab)

backend/                                optional real backend (see section 4)
  prisma/schema.prisma                  full DB schema
  src/controllers/analysisPipeline.js   OCR/AI pipeline w/ integration points
  src/routes/{auth,cases,documents,contradictions}.js
```

---

## 7. Legal/product safeguards carried through the app

- Safe classifications only: Consistent, Unverified, Potentially
  Inconsistent, Direct Contradiction, Missing Supporting Evidence, Needs
  Lawyer Review — never "lie", "fraud", or "true/false".
- Every finding shows its source document(s) and the exact text snippet
  it came from, plus AI reasoning and what evidence could resolve it.
- Only Lawyer/Admin roles can accept, reject, or resolve a finding;
  Researcher can flag and search but not close the loop.
- Every AI-analysis screen carries a lawyer-verification disclaimer.
- Abbreviations (e.g. "Ravi K." vs "Ravi Kumar") are detected and flagged
  as low-severity/potential rather than auto-classified as contradictions.
