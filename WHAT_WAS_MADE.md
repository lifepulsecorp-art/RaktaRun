# 🩸 LifePulse — System Delivery Report (Phases 1–5)

> **Project:** LifePulse — Real-Time Emergency Blood Coordination Network for Coastal Karnataka (Udupi & Dakshina Kannada)  
> **Status:** **Phase 1 foundation, Phases 2–4 implementation, and Phase 5 simulation/security work complete. Live district pilot pending.**
> **Date:** October 8, 2026
> **Architecture:** React 19 (Vite) + Express (TypeScript) + JSON Data Layer + Firebase Auth  

---

## 🎯 Executive Summary

Phase 1 established the verified medical foundation of LifePulse. Unlike public open-directory apps, LifePulse operates as a **strictly verified emergency network**:
- Donors must possess a medical screening certificate issued by accredited blood banks.
- Hospitals must be verified by the District LifePulse Administrator.
- All authenticated actions are cryptographically verified using Firebase ID tokens and role-based access control (RBAC).

The Phase 1 foundation remains in place. Phase 2 adds emergency matching and donor dispatch; Phase 3 adds consent-based live location sharing; Phase 4 adds donor recognition and operational telemetry; Phase 5 adds matching/journey simulations and security hardening. The project starts with the root command `npm run dev`.

---

## 🏗️ Architecture Blueprint

```
┌─────────────────────────────────────────────────────────┐
│               React 19 Frontend (client/)               │
│  - Firebase Auth (Client Login / ID Token Generation)   │
│  - Axios Interceptor → Attaches 'Bearer <idToken>'      │
│  - Single App Architecture with 3 Role Route Groups:    │
│    • /admin/*      → Admin Command Center               │
│    • /hospital/*   → Hospital Emergency Portal          │
│    • /donor/*      → Medically Verified Donor Portal    │
└────────────────────────────┬────────────────────────────┘
                             │ REST + JWT (Firebase ID token)
                             ↓
┌─────────────────────────────────────────────────────────┐
│               Express Backend (server/)                 │
│  - Firebase Admin SDK (Verifies ID Tokens via Google)   │
│  - RBAC Middleware (admin, hospital, donor)             │
│  - Routes: /api/auth, /api/hospitals, /api/donors       │
│  - Proximity Matching Engine (Haversine + Scoring)      │
│  - Static Certificate Document Server                   │
└────────────────────────────┬────────────────────────────┘
                             │ Atomic Read / Write
                             ↓
┌─────────────────────────────────────────────────────────┐
│              JSON Data Layer (server/data/)             │
│  - users.json          (System accounts & roles)        │
│  - hospitals.json      (Accredited medical centers)     │
│  - donors.json         (Screened donors & vitals)       │
│  - bloodRequests.json  (Emergency requests)             │
│  - matches.json        (Compatibility scores & ranks)   │
│  - certificates/       (Physical certificate files)     │
└─────────────────────────────────────────────────────────┘
```

> **Future MongoDB / Firestore Migration**: The JSON data layer models exactly match a 1:1 document shape. When migrating to MongoDB or Cloud Firestore, simply swap `server/src/utils/db.ts` methods with collection queries without touching business logic or route controllers.

---

## 📦 Detailed Block-by-Block Implementation

### 🔹 Block A: Frontend Foundation
- **Stack:** React 19, Vite 8, TailwindCSS 4, React Router 7, Lucide Icons.
- **Setup:** Configured client build pipeline, strict typing, responsive layout containers, and emergency theme palette (Rose-600 / Slate-950).

### 🔹 Block B: Express Backend & Firebase Admin SDK
- **Stack:** Express 4, TypeScript 5, `tsx` watch mode, CORS, Dotenv.
- **Firebase Admin SDK:** Initialized in [`server/src/utils/firebaseAdmin.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/firebaseAdmin.ts) using the service account key (`lifepulse-dev`).
- **Cleaned Up:** Deleted obsolete Cloud Functions and Firestore emulator rules from earlier scaffolding, leaving clean REST architecture.

### 🔹 Block C: JSON Data Layer & Seed Database
- **TypeScript Data Models:** [`server/src/types.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/types.ts) defining `User`, `Hospital`, `Donor`, `BloodRequest`, `Match`, `DonorVerification`, `HeroStats`.
- **Database Engine:** [`server/src/utils/db.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/db.ts) providing atomic read/write, `find`, `filter`, `insert`, `update`, and `remove`.
- **Database Seeder:** [`server/src/utils/seed.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/seed.ts) populated with:
  - 1 System Admin user (UID: `5G6ajWegMiepIzvIyreG7bx82SG2`)
  - 3 Accredited Hospitals in Udupi & Mangaluru
  - 5 Hospital-screened donors with coordinates & mock certificates
  - 1 Trauma ICU emergency request with 2 ranked matches.
- **Execution:** Run via `npm run seed`.

### 🔹 Block D: Express REST Routes & Authentication Middleware
- **Auth Middleware:** [`server/src/middleware/auth.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/middleware/auth.ts) with `authenticate` (decodes Firebase ID token) and `authorizeRoles` (`admin`, `hospital`, `donor`).
- **Auth Routes:** [`server/src/routes/authRoutes.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/routes/authRoutes.ts) (`GET /api/auth/me`, `POST /api/auth/sync`).
- **Hospital Routes:** [`server/src/routes/hospitalRoutes.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/routes/hospitalRoutes.ts):
  - `GET /api/hospitals` (Public/verified directory)
  - `GET /api/hospitals/:id` (Details)
  - `POST /api/hospitals` (Registration)
  - `PUT /api/hospitals/:id` (Profile & coordinate update)
  - `PUT /api/hospitals/:id/verify` (Admin accreditation decision)
  - `GET /api/hospitals/:id/requests` (List emergency requests)
  - `POST /api/hospitals/:id/requests` (Emergency dispatch + matching algorithm)
  - `GET /api/hospitals/:id/requests/:requestId/matches` (Real-time ranked matches)
- **Donor Routes:** [`server/src/routes/donorRoutes.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/routes/donorRoutes.ts):
  - `GET /api/donors` (Admin & hospital donor registry)
  - `GET /api/donors/me` (Authenticated donor profile)
  - `POST /api/donors` (Registration with certificate file saving)
  - `PUT /api/donors/:id/availability` (Availability status toggle)
  - `PUT /api/donors/:id/verify` (Admin eligibility decision & deferrals)
  - `GET /api/donors/me/alerts` (Incoming emergency alerts)
  - `POST /api/donors/matches/:matchId/respond` (Accept / Decline alert)
  - `POST /api/donors/matches/:matchId/location` (Live GPS transit streaming)
- **Static Documents:** Configured static route `/certificates` serving files from `server/data/certificates/`.

### 🔹 Block E: React Auth Shell & Role Guard
- **API Client:** [`client/src/utils/api.ts`](file:///d:/Echelonglobal/Lifepulse/client/src/utils/api.ts) with Axios interceptor fetching Firebase ID tokens automatically.
- **Auth Context:** [`client/src/context/AuthContext.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/context/AuthContext.tsx) tracking login session, user profile, role, and role records.
- **Route Guard:** [`client/src/routes/ProtectedRoute.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/routes/ProtectedRoute.tsx) blocking unauthorized users and roles.
- **Login Screen:** [`client/src/pages/LoginPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/LoginPage.tsx) with emergency branding, demo quick-fill, and immediate role-based redirecting.
- **403 Screen:** [`client/src/pages/UnauthorizedPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/UnauthorizedPage.tsx).

### 🔹 Block F: Admin Hospital Accreditation Audit UI
- **URL:** [`/admin/hospitals`](http://localhost:5173/admin/hospitals)
- **File:** [`client/src/pages/admin/AdminHospitalsPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/admin/AdminHospitalsPage.tsx)
- **Capabilities:**
  - Real table listing all hospitals with search and multi-district filters (Udupi / Dakshina Kannada).
  - Inspects blood bank license, hospital registration number, coordinates, emergency officer details.
  - **Live Audit Actions:** One-click "Approve Accreditation" and "Revoke Approval" with instant database updates.

### 🔹 Block G: Hospital Profile & Licensing Setup UI
- **URL:** [`/hospital/profile`](http://localhost:5173/hospital/profile)
- **File:** [`client/src/pages/hospital/HospitalProfilePage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/hospital/HospitalProfilePage.tsx)
- **Capabilities:**
  - Live accreditation status card (`Accredited` vs `Verification In Progress`).
  - Facility details form: Hospital name, physical address, district.
  - **One-Click Location Presets:** Pre-fills exact coordinates for Manipal, Mangaluru, and Udupi City.
  - Licensing & state registration fields.
  - Emergency officer contact details (Doctor name, direct phone, official email).

### 🔹 Block H: Donor Medical Onboarding & Certificate Upload UI
- **URL:** [`/donor/register`](http://localhost:5173/donor/register)
- **File:** [`client/src/pages/donor/DonorRegisterPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/donor/DonorRegisterPage.tsx)
- **Capabilities:**
  - Personal information: Full name, phone, locality, emergency response radius.
  - Medical typing & vitals: Blood group selection (`O+`, `O-`, `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`), Hemoglobin (g/dL), Weight (kg).
  - Component eligibility multi-select: Whole Blood, RBC, Platelets, Plasma.
  - **Hospital Certificate Attachment:** Input for screening hospital, certificate serial ID, screener doctor, and document file upload (PDF/PNG/JPG/TXT) converted to base64.

### 🔹 Block I: Admin Donor Certificate Approval UI
- **URL:** [`/admin/donors`](http://localhost:5173/admin/donors)
- **File:** [`client/src/pages/admin/AdminDonorsPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/admin/AdminDonorsPage.tsx)
- **Capabilities:**
  - Live table of all registered donors with search and blood group filters.
  - Vitals inspector (Hemoglobin, weight, component eligibility).
  - Hospital certificate inspector: Certificate ID, screening facility, doctor, and direct link to view the document.
  - **Live Audit Decisions:** "Approve & Activate" (marks eligible), "Defer" (temporary deferral with reason), and "Disqualify" (permanent deferral).

---

## 🗺️ System Route Reference

### Frontend URLs
| Path | Component | Protected Role | Purpose |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Emergency sign-in portal |
| `/unauthorized` | `UnauthorizedPage` | Public | 403 Forbidden screen |
| `/admin` | `AdminDashboardPage` | `admin` | Command center with system telemetry |
| `/admin/hospitals` | `AdminHospitalsPage` | `admin` | **Block F**: Hospital accreditation audit table |
| `/admin/donors` | `AdminDonorsPage` | `admin` | **Block I**: Donor certificate inspection & approval |
| `/hospital` | `HospitalDashboardPage` | `hospital`, `admin` | Hospital portal shell & active dispatches |
| `/hospital/profile` | `HospitalProfilePage` | `hospital`, `admin` | **Block G**: Accreditation profile & licensing setup |
| `/donor` | `DonorDashboardPage` | `donor`, `admin` | Donor hero portal, certificate badge & availability |
| `/donor/register` | `DonorRegisterPage` | `donor`, `admin` | **Block H**: Medical screening registration & certificate upload |
| `/live-tracking/:requestId` | `LiveTrackingPage` | Authenticated | Real-time transit telemetry & donor ETA tracker |

### Backend REST API Endpoints
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check |
| `GET` | `/api/auth/me` | Authenticated | Current user profile & attached role record |
| `POST` | `/api/auth/sync` | Authenticated | Synchronize user role, name, phone |
| `GET` | `/api/hospitals` | Public | List verified hospitals in coastal Karnataka |
| `GET` | `/api/hospitals/:id` | Public | Single hospital details |
| `POST` | `/api/hospitals` | Authenticated | Register new hospital |
| `PUT` | `/api/hospitals/:id` | Hospital / Admin | Update hospital profile, coordinates, license |
| `PUT` | `/api/hospitals/:id/verify` | Admin | Approve or reject hospital accreditation |
| `GET` | `/api/hospitals/:id/requests` | Authenticated | Get hospital's emergency blood requests |
| `POST` | `/api/hospitals/:id/requests` | Hospital / Admin | Dispatch emergency request + run matching engine |
| `GET` | `/api/hospitals/:id/requests/:requestId/matches` | Authenticated | Ranked matches with donor vitals & tracking |
| `GET` | `/api/donors` | Hospital / Admin | Registry of verified donors |
| `GET` | `/api/donors/me` | Authenticated | Current donor profile |
| `POST` | `/api/donors` | Authenticated | Onboard donor with certificate file |
| `PUT` | `/api/donors/:id/availability` | Authenticated | Toggle availability status |
| `PUT` | `/api/donors/:id/verify` | Admin | Set donor eligibility (eligible / deferred) |
| `GET` | `/api/donors/me/alerts` | Authenticated | Incoming emergency requests for donor |
| `POST` | `/api/donors/matches/:matchId/respond` | Authenticated | Accept or decline emergency request |
| `POST` | `/api/donors/matches/:matchId/location` | Authenticated | Stream live GPS coordinates |
| `GET` | `/certificates/:filename` | Public | Serve static certificate documents |

---

## 🔑 Demonstration Credentials & Seed Data

### 1. System Administrator
- **Email:** `admin@lifepulse.in`
- **Password:** Set in Firebase Console
- **Firebase UID:** `5G6ajWegMiepIzvIyreG7bx82SG2`
- **Role:** `admin` (Full access to all command centers, hospital approvals, and donor audits)

### 2. Pre-Seeded Hospitals
1. **Kasturba Hospital, Manipal** (`hosp_manipal_01`)
   - District: Udupi | Coordinates: `13.3535, 74.7865`
   - License: `KA-BB-UDP-042` | Status: `verified`
2. **AJ Hospital & Research Centre** (`hosp_aj_02`)
   - District: Dakshina Kannada | Coordinates: `12.8988, 74.8562`
   - License: `KA-BB-MNG-088` | Status: `verified`
3. **District Government Hospital, Udupi** (`hosp_udupi_dist_03`)
   - District: Udupi | Coordinates: `13.3409, 74.7421`
   - License: `KA-BB-UDP-007` | Status: `verified`

---

## 🌐 Public Onboarding & Self-Service Registration Suite

To accommodate fresh users joining the network, a complete public onboarding and self-service registration pipeline was added:

### 1. New Pages & UI Routes
- **Landing Page (`/` — `HomePage.tsx`)**: Hero banner, district scope overview, role highlights, direct links to Login and Register.
- **Role Chooser (`/register` — `RegisterPage.tsx`)**: Interactive card selection between Donor Registration and Hospital Registration.
- **Donor Registration (`/register/donor` — `DonorRegisterPage.tsx`)**: Public signup creating Firebase Auth credentials, demographic/vitals profile, and digital hospital certificate file upload.
- **Hospital Registration (`/register/hospital` — `HospitalRegisterPage.tsx`)**: Public facility registration with license details, contacts, and Manipal/Mangaluru/Udupi coordinate presets.
- **Donor Pending View (`/donor/pending` — `DonorPendingPage.tsx`)**: Friendly review holding screen for donors whose certificates are awaiting admin verification.
- **Hospital Pending View (`/hospital/pending` — `HospitalPendingPage.tsx`)**: Review holding screen for hospital administrators awaiting licensing accreditation.
- **Login Page (`/login` — `LoginPage.tsx`)**: Added "Register here →" link and "← Back to home" navigation.

### 2. Backend Self-Service Endpoints
- **`POST /api/auth/register`**: Assigns onboarding user roles (`donor` or `hospital`) and display names.
- **`POST /api/donors/register`**: Creates donor records with status `pending` linked to the authenticated UID.
- **`POST /api/donors/certificate`**: Uploads and saves screening certificates (base64) to `server/data/certificates/`.
- **`POST /api/hospitals/register`**: Registers hospital facilities with status `pending` linked to the authenticated UID.
- **Admin Verification (`PUT /api/donors/:id/verify`)**: Updated to handle approving newly registered pending donors.

## 🚀 How to Run the Application

From the project root directory (`D:\Echelonglobal\Lifepulse`):

```bash
# Start both Backend (port 5000) and Frontend (port 5173) simultaneously:
npm run dev

# Re-seed the JSON database at any time:
npm run seed
```

- **Open Frontend in Browser:** [http://localhost:5173](http://localhost:5173)
- **Backend API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ✅ Phase 2 — Emergency Matching & Dispatch

Hospitals can create a request at `/hospital/request/new`. The form captures recipient blood group, component, units, urgency, search radius, time needed, ward, and clinician. Requests are available from the hospital dashboard and refresh automatically.

The server filters candidates by the recipient-to-donor compatibility matrix, component eligibility, donation interval, certificate expiry, deferral status, donor availability, preferred radius, and distance. It ranks candidates using distance and response history, then creates up to five alerts per requested unit. Donors see an in-app alert with a two-minute response countdown and can accept or decline. Accepted donor count is limited to the units requested. Unanswered alerts expire, and the server expands the search radius in two-minute steps up to 50 km; requests can also expire at their required-by time.

**Main files:**

- `client/src/pages/hospital/EmergencyRequestPage.tsx` — request creation form and recent dispatches.
- `client/src/pages/HospitalDashboardPage.tsx` — hospital request list and tracking links.
- `client/src/pages/DonorDashboardPage.tsx` — polled in-app alert modal and donor response actions.
- `server/src/services/matching.ts` — compatibility, eligibility filters, distance and ranking.
- `server/src/services/escalation.ts` — alert expiry, radius expansion, request expiry.
- `server/src/routes/hospitalRoutes.ts` — request creation, listing, match view, cancel and complete.
- `server/src/routes/donorRoutes.ts` — donor alert feed and accept/decline actions.

## ✅ Phase 3 — Live Journey Tracking

The `/live-tracking/:requestId` page now loads live request and match records instead of displaying hard-coded sample data. After accepting a match, a donor can explicitly start browser GPS sharing. The API verifies that the update belongs to the authenticated donor and an active accepted match. The requesting hospital can view the donor’s current position, remaining straight-line distance, and approximate ETA.

When the donor is within 150 metres of the hospital, the match changes to `reached`, the stored precise location is cleared, and the browser is told to stop sharing. Cancellation or request expiry also prevents further location writes. Hospital staff can confirm the donation from the tracking view.

**Main files:**

- `client/src/pages/LiveTrackingPage.tsx` — donor and hospital tracking views, location sharing, and approximate position visualization.
- `server/src/services/journey.ts` — shared response, journey, arrival, and completion state logic.
- `server/src/routes/donorRoutes.ts` — donor-owned tracking session and GPS endpoint.
- `server/src/routes/requestRoutes.ts` — access-scoped request details.
- `server/src/routes/hospitalRoutes.ts` — hospital-owned match details and completion/cancellation actions.

**Mapping limitation:** The visualization and ETA are approximate straight-line estimates (ETA assumes 25 km/h). Google Maps, Leaflet road routing, and a directions provider are not configured.

## ✅ Phase 4 — Hero Recognition & Operations

Hospital-confirmed donations update donor response/donation totals and badges. The badge rules award `life_pulse_hero` after a completed donation, `repeat_hero` after three donations, `rare_blood_hero` to Rh-negative donors, and `rapid_responder` when the recorded average response time is at most ten minutes.

The public `/hero-wall` lists only eligible donors who explicitly opted in and have at least one completed donation. It omits phone numbers and precise location. Donors can download a PNG share card. The admin dashboard reads live aggregate counts, district request totals, and recent audit events.

**Main files:**

- `client/src/pages/HeroWallPage.tsx` — public wall and downloadable share cards.
- `client/src/pages/DonorDashboardPage.tsx` — public profile consent control.
- `server/src/routes/heroRoutes.ts` — consent-filtered public hero data.
- `server/src/routes/adminRoutes.ts` — admin-only telemetry and audit-log APIs.
- `client/src/pages/AdminDashboardPage.tsx` — live totals, district telemetry, and audit feed.
- `server/src/routes/hospitalRoutes.ts` and `server/src/routes/donorRoutes.ts` — audit events for operational and verification actions.

## ✅ Phase 5 — Simulation, Security & Pilot Readiness

Seven server tests cover the compatibility matrix, Manipal and Mangaluru local matching scenarios, donor eligibility exclusions, emergency-only availability, alert timeout, and a simulated dispatch journey through acceptance, GPS transit, hospital arrival, donation completion, and badge issuance.

Security changes include Firebase token revocation checks; hospital ownership checks for dispatch, cancellation, matching, and completion; donor ownership checks for alert responses and GPS writes; reduced donor data in hospital registry responses; and removal of role changes from the general auth-sync endpoint. Protected frontend routes also reject signed-in users whose role is absent or unauthorized.

**Main files:**

- `server/src/services/matching.test.ts` — seven matching and journey simulations.
- `server/src/services/journey.ts` — journey logic used by both routes and simulations.
- `server/src/middleware/auth.ts` — Firebase token and revocation verification.
- `server/src/routes/authRoutes.ts` — auth synchronization without general role mutation.
- `client/src/routes/ProtectedRoute.tsx` — frontend role guard.
- `server/scripts/test-os-shim.cjs` — compatibility shim for the restricted Windows test runner.

**Verification completed:** `npm test` in `server` (7 passed), server TypeScript typecheck, and `npm run build` in `client` (production build passed; Vite reported a large JavaScript chunk warning).

## 🚧 Live District Pilot — Not Yet Launched

The application work and local simulations do not constitute a live hospital pilot. Before real requests, the deployment still needs production hosting and HTTPS, a durable shared database (the current JSON files are local), configured production donor notifications (currently in-app only), hospital operator approval, clinical workflow validation, privacy/retention review, and supervised drills. The detailed operational checklist is in `PILOT_READINESS.md`.

## 📁 Phase 2–5 File Index

- `client/src/pages/hospital/EmergencyRequestPage.tsx`
- `client/src/pages/LiveTrackingPage.tsx`
- `client/src/pages/HeroWallPage.tsx`
- `client/src/pages/AdminDashboardPage.tsx`
- `client/src/pages/DonorDashboardPage.tsx`
- `client/src/routes/AppRoutes.tsx`
- `client/src/routes/ProtectedRoute.tsx`
- `server/src/services/matching.ts`
- `server/src/services/escalation.ts`
- `server/src/services/journey.ts`
- `server/src/services/matching.test.ts`
- `server/src/routes/hospitalRoutes.ts`, `donorRoutes.ts`, `requestRoutes.ts`, `heroRoutes.ts`, `adminRoutes.ts`
- `server/src/middleware/auth.ts`, `server/src/types.ts`, `server/src/index.ts`
- `PILOT_READINESS.md`

