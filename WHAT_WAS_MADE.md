# 🩸 LifePulse — Complete System Delivery Report (Phases 1–4)

> **Project:** LifePulse — Real-Time Emergency Blood Coordination Network for Coastal Karnataka (Udupi & Dakshina Kannada)  
> **Status:** **Phases 1–4: Core Emergency Matching, Transit Tracking & Hero Network — 100% IMPLEMENTED & VERIFIED ✅**  
> **Date:** October 8, 2026  
> **Architecture:** React 19 (Vite) + Express (TypeScript) + JSON Data Layer + Firebase Auth  
> **Repository:** [`https://github.com/nosij-playz/lifepulse`](https://github.com/nosij-playz/lifepulse) (`main` branch)

---

## 🎯 Executive Summary

LifePulse is a medically authoritative, real-time emergency blood coordination system built specifically for the **Udupi and Dakshina Kannada** districts. Unlike public directory apps that expose personal numbers, LifePulse enforces:
1. **Accredited Network Only:** Donors must hold verified hospital screening certificates; hospitals must be accredited by district administrators.
2. **Medical Authority Matching Engine:** Algorithmic ranking considering blood group compatibility, component interval rules, certificate expiration, and response histories.
3. **Privacy-by-Design Tracking:** Donor live coordinates are ephemeral and shared only upon accepting an emergency request, terminating automatically within 150m of hospital arrival.
4. **Community Recognition:** Opt-in Hero Wall with downloadable social share cards celebrating life-saving donors.

---

## 🏗️ Architecture Blueprint

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 Frontend (client/)                 │
│  - Public Landing & Registration (/, /register, /hero-wall) │
│  - Hospital Dispatch & Profile (/hospital/*)                │
│  - Donor Alert & Availability Portal (/donor/*)             │
│  - Admin Telemetry & Audit Center (/admin/*)                │
│  - Real-Time Live Radar Transit Tracking (/live-tracking/*) │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST + Bearer <Firebase ID Token>
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend (server/)                   │
│  - Firebase Admin SDK Token Verification & RBAC Guards      │
│  - Matching & Dispatch Engine (server/src/services/matching)│
│  - Auto-Escalation Loop (server/src/services/escalation)    │
│  - Ephemeral Journey Tracker (server/src/services/journey)  │
│  - District Telemetry, Audit Logs & Hero Endpoints          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Atomic Read / Write
                               ↓
┌─────────────────────────────────────────────────────────────┐
│                JSON Data Layer (server/data/)               │
│  - users.json          (System accounts & roles)            │
│  - hospitals.json      (Accredited medical centers)         │
│  - donors.json         (Screened donors & vitals)           │
│  - bloodRequests.json  (Emergency requests & dispatches)    │
│  - matches.json        (Ranked candidate matches & ETAs)    │
│  - certificates/       (Stored digital certificates)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase-by-Phase Implementation Details

### 🔹 Phase 1: Foundation, Authentication & Medical Accreditation

1. **Client & Server Foundation:**
   - React 19, Vite 8, TailwindCSS 4, React Router 7, Express 4, TypeScript 5.
   - Root orchestration via `concurrently` enabling one-command startup (`npm run dev`).
2. **Firebase Auth Integration:**
   - Client token generation with automated Axios Bearer interceptor ([`client/src/utils/api.ts`](file:///d:/Echelonglobal/Lifepulse/client/src/utils/api.ts)).
   - Backend verification using Firebase Admin SDK ([`server/src/utils/firebaseAdmin.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/firebaseAdmin.ts)) with role-based guards (`admin`, `hospital`, `donor`).
3. **JSON Data Layer & Seeder:**
   - Persistence layer in [`server/src/utils/db.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/db.ts).
   - Seeder in [`server/src/utils/seed.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/utils/seed.ts) pre-populating admin, 3 regional hospitals, 5 verified donors, and active trauma requests.
4. **Accreditation Portals:**
   - **Admin Hospital Audit (`/admin/hospitals`):** Accreditation approval and revocation.
   - **Hospital Profile & Licensing (`/hospital/profile`):** Facility registration, Manipal/Mangaluru/Udupi coordinate presets.
   - **Donor Screening Submission (`/donor/register`):** Certificate attachment, component eligibility, vitals.
   - **Admin Donor Inspection (`/admin/donors`):** Document verification, approve, defer, and disqualify actions.
5. **Public Onboarding & Registration Suite:**
   - Landing page ([`HomePage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/HomePage.tsx)), Role Chooser ([`RegisterPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/RegisterPage.tsx)), Self-service donor & hospital registration ([`DonorRegisterPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/register/DonorRegisterPage.tsx), [`HospitalRegisterPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/register/HospitalRegisterPage.tsx)), and review holding screens.

---

### 🔹 Phase 2: Core Emergency Matching & Alert Dispatch Engine

1. **Medical Matching Service ([`server/src/services/matching.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/services/matching.ts)):**
   - **Strict Compatibility Matrix:** Full recipient-to-donor compatibility table (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).
   - **Component Donation Interval Enforcement:**
     - Whole Blood & RBC: 90 days minimum interval.
     - Platelets: 14 days minimum interval.
     - Plasma: 28 days minimum interval.
   - **Certificate Validity Validation:** Donors with expired hospital certificates are automatically excluded from alerts.
   - **Availability Rules:** Donors marked `emergency_only` are alerted solely for `critical` trauma cases; `unavailable` donors are excluded.
   - **Distance & Ranked Scoring:** Calculates distance via Haversine formula and scores candidates based on proximity, response time history, donation recency, and component match.
2. **Auto-Escalation Engine ([`server/src/services/escalation.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/services/escalation.ts)):**
   - Alerts include a strict **2-minute response window** (`alertExpiresAt`). Unanswered alerts transition to `expired`.
   - If required units remain unfulfilled, the search radius automatically expands in **+5 km increments (up to 50 km)**.
   - Background scheduler runs every 30 seconds ([`server/src/index.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/index.ts)).
3. **Emergency Dispatch UI ([`client/src/pages/hospital/EmergencyRequestPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/hospital/EmergencyRequestPage.tsx)):**
   - URL: [`/hospital/request/new`](http://localhost:5173/hospital/request/new)
   - Form fields: Recipient blood group, component type, units required (1–10), urgency level (`critical`, `urgent`, `standard`), initial radius (10–50 km), ward/bed, clinician in charge.
   - Recent dispatches feed with auto-polling every 8 seconds.
   - Seamless navigation to live tracking upon dispatch creation.
4. **Donor Real-Time Alert Feeds:**
   - Integrated into [`client/src/pages/DonorDashboardPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/DonorDashboardPage.tsx).
   - Displays incoming emergency alert cards with 2-minute countdown timer, hospital name, distance, component needed, and one-click **"Accept Emergency"** or **"Decline"** actions.

---

### 🔹 Phase 3: Real-Time Live Journey & Transit Tracking

1. **Journey Service ([`server/src/services/journey.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/services/journey.ts)):**
   - `resolveDonorResponse`: Handles donor accept/decline state transitions with quota limits.
   - `updateJourney`: Computes real-time straight-line distance remaining and dynamic ETA in minutes.
   - **150m Arrival Auto-Cutoff:** When a donor arrives within 150 metres of the hospital, status changes to `reached`, and live location sharing is automatically stopped to protect donor privacy.
   - `completeDonation`: Marks donation fulfilled, increments lifetime counts, and issues appropriate recognition badges.
2. **Live Radar Tracking UI ([`client/src/pages/LiveTrackingPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/LiveTrackingPage.tsx)):**
   - URL: [`/live-tracking/:requestId`](http://localhost:5173/live-tracking/req_emergency_001)
   - **Hospital View:**
     - Custom SVG transit radar visualizing approximate donor positions relative to the medical center.
     - Active donors in transit with score, remaining distance, ETA countdown, and GPS timestamp.
     - One-click **"Confirm donation complete"** button once donor arrives.
     - Option to **"Cancel request"** which halts all transit streams.
   - **Donor View:**
     - "Your trip to the hospital" journey interface.
     - One-click **"Start live location sharing"** streaming browser Geolocation coordinates.
     - Real-time notice when within 150m: *"Hospital reached. Location sharing has stopped."*
3. **Endpoints & Security Scoping:**
   - `POST /api/donors/matches/:matchId/location`: Validates coordinate bounds and restricts writes strictly to the accepted donor.
   - `POST /api/hospitals/:id/requests/:requestId/matches/:matchId/complete`: Confirms completion and awards hero statistics.
   - `POST /api/hospitals/:id/requests/:requestId/cancel`: Closes request and clears ephemeral locations.

---

### 🔹 Phase 4: Hero Recognition & Public Wall

1. **Public Hero Wall ([`client/src/pages/HeroWallPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/HeroWallPage.tsx)):**
   - URL: [`/hero-wall`](http://localhost:5173/hero-wall)
   - Celebrates community donors who have completed donations and explicitly opted into public visibility.
   - Displays donor display name, district, blood group, donation count, and earned badges.
   - **Privacy Protection:** Phone numbers, home locations, and coordinates are strictly excluded from public views.
2. **Automated Social Share Card Generator:**
   - Client-side Canvas rendering (1200x630 banner).
   - Generates high-resolution PNG share cards with donor name, district, blood group, completed donations count, and emergency motto.
   - 1-click **"Download share card"** button.
3. **Donor Consent Management:**
   - `PUT /api/donors/me/public-hero-consent` allows donors to toggle public visibility on or off from their profile.
4. **Hero Badge Issuance Engine:**
   - `life_pulse_hero`: Awarded upon first completed emergency donation.
   - `repeat_hero`: Awarded after 3+ completed donations.
   - `rare_blood_hero`: Awarded to donors with Rh-negative blood groups (`O-`, `A-`, `B-`, `AB-`).
   - `rapid_responder`: Awarded when average response time is under 10 minutes (600s).

---

### 🔹 Security Hardening & Administrative Telemetry

1. **District Telemetry API ([`server/src/routes/adminRoutes.ts`](file:///d:/Echelonglobal/Lifepulse/server/src/routes/adminRoutes.ts)):**
   - `GET /api/admin/telemetry`: Aggregates active requests, fulfilled requests, donors en route, verified hospitals, and breakdown by district (Udupi & Dakshina Kannada).
2. **Audit Logging Framework:**
   - `GET /api/admin/audit-logs`: Administrative audit trail logging timestamped actor actions (`request.dispatched`, `donation.completed`, `donor.eligibility_updated`, `request.cancelled`).
3. **Access Controls:**
   - Scoped route authorization preventing unauthorized hospitals from reading peer dispatches or unauthorized users accessing private donor dossiers.

---

## 🗺️ Complete Route Directory

### Frontend URLs
| Path | Component | Access | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Emergency network landing page |
| `/login` | `LoginPage` | Public | Sign-in portal with quick-fill demo buttons |
| `/register` | `RegisterPage` | Public | Role selection (Donor vs. Hospital) |
| `/register/donor` | `DonorRegisterPage` | Public | Fresh donor signup & certificate upload |
| `/register/hospital` | `HospitalRegisterPage` | Public | Fresh hospital registration & presets |
| `/hero-wall` | `HeroWallPage` | Public | Opt-in community hero wall & share card generator |
| `/donor/pending` | `DonorPendingPage` | Authenticated | Holding screen awaiting certificate verification |
| `/hospital/pending` | `HospitalPendingPage` | Authenticated | Holding screen awaiting licensing review |
| `/admin` | `AdminDashboardPage` | `admin` | District command center & telemetry overview |
| `/admin/hospitals` | `AdminHospitalsPage` | `admin` | Hospital accreditation audit table |
| `/admin/donors` | `AdminDonorsPage` | `admin` | Donor medical certificate inspection & approval |
| `/hospital` | `HospitalDashboardPage` | `hospital`, `admin` | Hospital dispatch console & emergency stats |
| `/hospital/profile` | `HospitalProfilePage` | `hospital`, `admin` | Facility licensing & coordinate configuration |
| `/hospital/request/new` | `EmergencyRequestPage` | `hospital`, `admin` | Emergency request creation & dispatch |
| `/donor` | `DonorDashboardPage` | `donor`, `admin` | Hero portal, live alerts, and availability toggle |
| `/live-tracking/:requestId` | `LiveTrackingPage` | Authenticated | Real-time transit radar & GPS tracker |
| `/unauthorized` | `UnauthorizedPage` | Public | 403 Forbidden screen |

---

### Backend REST API Endpoints
| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check |
| `GET` | `/api/auth/me` | Authenticated | Current user profile & attached role record |
| `POST` | `/api/auth/sync` | Authenticated | Synchronize user details |
| `POST` | `/api/auth/register` | Authenticated | Assign role & name during onboarding |
| `GET` | `/api/hospitals` | Public | Directory of accredited hospitals |
| `GET` | `/api/hospitals/:id` | Public | Hospital details |
| `POST` | `/api/hospitals/register` | Authenticated | Self-service hospital registration |
| `PUT` | `/api/hospitals/:id` | Hospital / Admin | Update hospital profile & coordinates |
| `PUT` | `/api/hospitals/:id/verify` | Admin | Approve or reject hospital accreditation |
| `GET` | `/api/hospitals/:id/requests` | Authenticated | List hospital's emergency blood requests |
| `POST` | `/api/hospitals/:id/requests` | Hospital / Admin | Dispatch emergency request + run matching engine |
| `GET` | `/api/hospitals/:id/requests/:requestId/matches` | Authenticated | Ranked matches with transit telemetry |
| `POST` | `/api/hospitals/:id/requests/:requestId/cancel` | Hospital / Admin | Cancel active emergency request |
| `POST` | `/api/hospitals/:id/requests/:requestId/matches/:matchId/complete` | Hospital / Admin | Mark donation complete and award badges |
| `GET` | `/api/requests/:requestId` | Authenticated | Get blood request metadata |
| `GET` | `/api/donors` | Hospital / Admin | Registry of screened donors |
| `GET` | `/api/donors/me` | Authenticated | Authenticated donor profile |
| `POST` | `/api/donors/register` | Authenticated | Self-service donor registration |
| `POST` | `/api/donors/certificate` | Authenticated | Upload screening certificate document |
| `PUT` | `/api/donors/:id/availability` | Authenticated | Toggle availability status |
| `PUT` | `/api/donors/:id/verify` | Admin | Set donor eligibility status |
| `GET` | `/api/donors/me/alerts` | Authenticated | Active incoming emergency alerts for donor |
| `POST` | `/api/donors/matches/:matchId/respond` | Authenticated | Accept or decline emergency alert |
| `POST` | `/api/donors/matches/:matchId/location` | Authenticated | Stream live GPS coordinates |
| `GET` | `/api/donors/me/matches/:requestId` | Authenticated | Donor trip and match details |
| `PUT` | `/api/donors/me/public-hero-consent` | Authenticated | Toggle public hero wall opt-in |
| `GET` | `/api/heroes` | Public | List opt-in public heroes & badges |
| `GET` | `/api/admin/telemetry` | Admin | District-wide totals and telemetry |
| `GET` | `/api/admin/audit-logs` | Admin | System audit trail |
| `GET` | `/certificates/:filename` | Public | Static certificate document server |

---

## 🔑 Demonstration Credentials & Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| 🛡️ **System Admin** | `admin@lifepulse.in` | *(Console Password)* | Full administrative oversight, approvals, and telemetry |
| 🏥 **Hospital Staff (Manipal)** | `manipal@lifepulse.in` | `LifePulse@123` | Kasturba Hospital Manipal dispatch & profile console |
| 🏥 **Hospital Staff (Mangaluru)** | `ajhospital@lifepulse.in` | `LifePulse@123` | AJ Hospital & Research Centre dispatch console |
| 🩸 **Verified Donor (Rahul)** | `rahul.shetty@gmail.com` | `LifePulse@123` | O+ Screened donor with active alert feeds & journey tracking |
| 🩸 **Verified Donor (Sneha)** | `sneha.rao@gmail.com` | `LifePulse@123` | A+ Screened donor with active alert feeds |

*(All non-admin accounts are provisioned directly in Firebase Auth with matching records in `users.json`)*.

---

## 🧪 Automated Testing & Verification

1. **Server Unit & Simulation Test Suite:**
   ```bash
   npm run test --prefix server
   ```
   **Output:** `✔ 7 tests passed (0 failed)`
   - Recipient-to-donor compatibility matrix.
   - Kasturba Hospital Manipal O-negative proximity dispatch.
   - AJ Hospital Mangaluru localized trauma matching.
   - Deferral, certificate expiry, and component interval rejections.
   - Emergency-only availability constraints.
   - Full trauma journey simulation (dispatch ➔ accept ➔ stream ➔ arrive ➔ complete ➔ badge issuance).
   - 2-minute alert expiration timeout enforcement.

2. **Client Production Build:**
   ```bash
   npm run build --prefix client
   ```
   **Output:** `✓ built in 7.69s` (Zero TypeScript or bundling errors).

---

## 🚀 Running the Project

```bash
# 1. Install root dependencies:
npm install

# 2. Run backend (port 5000) and frontend (port 5173) concurrently:
npm run dev

# 3. Optional: Re-seed demo database at any time:
npm run seed
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Public Hero Wall:** [http://localhost:5173/hero-wall](http://localhost:5173/hero-wall)
- **Pilot Readiness Guide:** See [`PILOT_READINESS.md`](file:///d:/Echelonglobal/Lifepulse/PILOT_READINESS.md) for clinical and operational pre-launch steps.
