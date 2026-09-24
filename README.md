# KinnowERP — Packhouse Module

A mobile-first packhouse inventory / grower payment / sales-order ERP —
Daily Incoming, Stock Summary, Grower Management, Payment Requests for
packhouse staff; Orders, Booking, and User Management for Admins — backed by
a real FastAPI + PostgreSQL API with JWT login and role-based access.

```
kinonow_erp/
├── backend/          FastAPI + PostgreSQL API
└── src/              React (Vite) frontend — mobile-first UI
```

## 1. Backend setup

Requires Python 3.11+ and a running PostgreSQL server.

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Edit `.env` and set `DATABASE_URL` to your Postgres connection string, e.g.:

```
DATABASE_URL=postgresql+pg8000://postgres:yourpassword@localhost:5432/kinonow_erp
```

Create the database itself first (once), e.g. with `psql`:

```sql
CREATE DATABASE kinonow_erp;
```

Then create the tables and seed demo data:

```bash
python -m app.db.init_db
```

This prints the seeded logins (mobile number + password):

| Role                | Mobile      | Password  |
|---------------------|-------------|-----------|
| Admin               | 9999900001  | admin123  |
| PH-1 Abohar staff   | 9999900002  | staff123  |
| PH-2 Hanumangarh    | 9999900003  | staff123  |
| PH-3 Sri Ganganagar | 9999900004  | staff123  |

**Change these passwords before any real deployment.** Login is by mobile
number (not email) throughout the app.

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

If `uvicorn` isn't recognized as a command, use `python -m uvicorn app.main:app --reload --port 8000` instead.

Interactive API docs: `http://localhost:8000/docs`

## 2. Frontend setup

```bash
npm install
npm run dev
```

Open the printed local URL. Login with any of the seeded mobile numbers above.
The UI is mobile-first (bottom tab nav, sheet-style modals) — it's meant to
be viewed at a phone-width viewport, or opened on an actual phone/WebView.

By default the frontend talks to `http://localhost:8000`. To point it at a
different backend (e.g. a deployed server), set `VITE_API_URL` before
building:

```bash
# .env in the project root
VITE_API_URL=https://your-backend-domain.com
```

## 3. Production build

```bash
npm run build
```

Output goes to `dist/`. `vite.config.js` uses `base: "./"` so the build's
asset paths are relative — this is required for the Android WebView step
below (an absolute `/subpath/` base breaks asset loading from `file://` or
`android_asset` URLs).

## 4. Packaging as an Android WebView app

This repo is the web app only — wrapping it for Android is a separate,
small native project. Two common approaches:

**A. Point WebView at a hosted URL (simplest)**
Deploy `dist/` to any static host (or serve it from the same server as the
backend) and point an Android `WebView` at that HTTPS URL. Deploy the
FastAPI backend somewhere reachable too, and set `VITE_API_URL` to its
public URL before running `npm run build`. Update `CORS_ORIGINS` in the
backend's `.env` to include your deployed frontend's origin.

**B. Bundle the build into the APK's assets**
Copy `dist/` into the Android project's `app/src/main/assets/www/` and load
it with `webView.loadUrl("file:///android_asset/www/index.html")`. In this
mode the backend still needs to be reachable over the network (it cannot be
bundled into the APK), so `VITE_API_URL` must point at your deployed API,
and the backend's CORS settings must allow the WebView's origin
(`file://` origins can be permissive — restrict this appropriately for
production).

Either way, make sure `WebView.getSettings().setJavaScriptEnabled(true)` and
(if you use `fetch` to a plain-HTTP dev backend on a physical device)
`setMixedContentMode`/`usesCleartextTraffic` are configured — production
should use HTTPS throughout.

## Roles & navigation

- **Packhouse staff** (`role: staff`) see a bottom tab bar: Incoming, Stock,
  Growers, Payments — all scoped to their assigned packhouse.
- **Admins** (`role: admin`) see a different bottom tab bar: Home, Orders,
  Book (new order), Users. Admins are not tied to a single packhouse, so they
  don't get the staff tabs — payment approval for staff-raised requests still
  exists as a backend API (`/payments/{id}/approve`, `/payments/{id}/reject`)
  but has no dedicated admin screen in this UI; it could be added as a fifth
  admin tab reusing that existing endpoint.

## Notes / known simplifications

- Order documents (bilty / kaanta parchi) have placeholder fields in the
  database but no file-upload flow was built — they'll always show "Pending"
  until an upload feature is added.
- The "Resend WhatsApp" button on an order opens a `wa.me` link with a
  pre-filled message rather than sending anything server-side — there's no
  WhatsApp Business API integration.
- `src/screens`, `src/views`, `src/components` map closely to the original
  mobile design reference; `App.jsx` is the integration layer that fetches
  real data from the backend and adapts it to the shape those presentational
  components expect.
