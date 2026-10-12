# Veriq - Setup (Expo SDK 57)

## A. Run the app (no database needed)
```
cd frontend
npm install
npx expo install --check
npx expo start -c
```
Scan the QR with Expo Go (phone and computer on the same Wi-Fi; if it fails: `npx expo start --tunnel`).

OCR key: `frontend/src/config.js` (`OCR_SPACE_API_KEY`). Free key limits: files up to 1MB, PDFs up to 3 pages. Photos are auto-compressed; large PDFs are not.

## B. Database (Supabase) - only for the optional backend
1. Supabase > your project > Project Settings > Database > Connection string.
2. Copy the **Transaction pooler** string into `DATABASE_URL` (port 6543, keep `?pgbouncer=true`).
3. Copy the **Session pooler** string into `DIRECT_URL` (port 5432).
   (The direct `db.xxxx.supabase.co` host is IPv6-only and fails on many home networks - use the pooler.)
4. Put your password in both. Special characters must be URL-encoded (`@` = `%40`), or reset the password to letters and numbers.
5. Set `JWT_SECRET` to a new random string:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
6. Run:
```
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed      # optional demo user: lawyer@veriq.demo / demo1234
npm run dev       # API on http://localhost:4000/api/health
```
Optional standalone OCR server: `npm run ocr` (port 4001).

## C. Connecting the app to the backend
The app currently runs fully on-device (`frontend/src/services/api.js` uses local demo login). To use the backend, replace the bodies of `login()` and `register()` there with `fetch` calls to `http://YOUR_COMPUTER_IP:4000/api/auth/login` and `/register` (use your computer's LAN IP, not localhost, because the phone is a different device).
