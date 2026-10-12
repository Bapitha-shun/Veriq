# Veriq — AI-Assisted Legal Document Contradiction & Evidence Analysis

Two parts, in one folder:

```
veriq/
  frontend/   React Native (Expo) app — runs on your phone via Expo Go
  backend/    Node.js + Express + Prisma (PostgreSQL) API — optional, for a real multi-user deployment
```


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
