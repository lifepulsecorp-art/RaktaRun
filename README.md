# 🩸 LifePulse — Emergency Blood Coordination System

> *"Every minute matters. Connect. Locate. Respond. Save."*

LifePulse is a real-time emergency blood donor matching and dispatch system designed for **Udupi and Dakshina Kannada** districts in Coastal Karnataka. Unlike open directories, LifePulse connects hospitals exclusively with **medically screened, verified blood donors** during acute trauma and emergency surges.

---

## 🏗️ Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons, React Router 7.
- **Backend:** Express, TypeScript, Node.js (`tsx`), REST API with Bearer token authentication.
- **Authentication:** Dual Mode — Offline Local JWT (bcrypt + standard Bearer token) and Firebase Auth (Firebase Admin SDK).
- **Data Layer:** Local JSON Database (`server/data/*.json`) with atomic file writes, structured for direct 1:1 MongoDB/Firestore migration.

```
┌────────────────────────────────────────────────────────┐
│  React 19 Frontend (client/)                           │
│  - Public Landing & Registration (/, /register)        │
│  - Public Community Hero Wall (/heroes)                │
│  - Donor Portal & History (/donor, /donor/history)     │
│  - Private Hero Share Studio (/donor/hero-studio)      │
│  - Hospital Dispatch & History (/hospital)             │
│  - Admin Telemetry, Rules & Audit (/admin)             │
│  - Ephemeral Live Transit Radar (/live-tracking/*)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST + Bearer <JWT Token>
                            ↓
┌────────────────────────────────────────────────────────┐
│  Express Backend API (server/)                         │
│  - Offline Local Auth & Firebase Admin Token Guards    │
│  - RBAC Middleware (admin, hospital, donor)            │
│  - Rule-Based Compatibility & Escalation Engine        │
│  - Live Config Console & CSV Audit Exporter            │
│  - Ephemeral Journey Tracker (150m cutoff)             │
└───────────────────────────┬────────────────────────────┘
                            │ Atomic Persistence
                            ↓
┌────────────────────────────────────────────────────────┐
│  JSON Data Layer (server/data/)                        │
│  - users.json, hospitals.json, donors.json             │
│  - bloodRequests.json, matches.json, auditLogs.json    │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Capabilities

1. **Rule-Based Emergency Matching:**
   - 8-group recipient-to-donor ABO/Rh compatibility matrix.
   - Medical donation intervals: 90 days for Whole Blood/PRBC, 14 days for Platelets, 28 days for Plasma.
   - Expired certificate rejection and distance-ranked candidate scoring.

2. **Automated Search Radius Escalation:**
   - Strict 2-minute alert response window per batch.
   - Dynamic expansion (+5 km increments up to 50 km) configurable live from the Admin Console.

3. **Privacy-Preserving Ephemeral Tracking:**
   - Live GPS streaming activates only after a donor accepts an emergency alert.
   - Telemetry automatically terminates within 150m of hospital arrival.

4. **Comprehensive Donation & Dispatch History:**
   - **Donor:** Full timeline of completed donations and emergency responses with component badges.
   - **Hospital:** Historical request records, units collected, and donor fulfillment logs.
   - **Admin:** Network-wide audit history with district filters (`Udupi`, `Dakshina Kannada`), status filters, and search.

5. **Community Recognition & Private Hero Studio:**
   - **Public Hero Wall (`/heroes`):** Shows opted-in donors; public downloads are restricted.
   - **Private Hero Studio (`/donor/hero-studio`):** Generates high-res 1:1 Square (1080x1080) and 9:16 Instagram Story (1080x1920) graphics with 1-click download.
   - 5 Award Badges: LifePulse Hero, Rapid Responder, Repeat Hero, Rare Blood Hero, and Community Champion.

6. **Medical Accreditation & Guidance:**
   - Donors must hold a verified hospital screening certificate.
   - Registration includes an **Approved Screening Hospitals Directory** modal with contact numbers, addresses, and blood bank timings.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Installation & Run
```bash
# Install root dependencies
npm install

# Start both backend (port 5000) and frontend (port 5173):
npm run dev

# Re-seed demo database at any time:
npm run seed
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Public Hero Wall:** [http://localhost:5173/heroes](http://localhost:5173/heroes)

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| 🛡️ **System Admin** | `admin@lifepulse.in` | `AdminPulse@2026` / `LifePulse@123` | Full admin console, rule config, audit logs & CSV export |
| 🏥 **Hospital Staff** | `manipal@lifepulse.in` | `LifePulse@123` | Kasturba Hospital Manipal emergency dispatch & history |
| 🏥 **Hospital Staff** | `ajhospital@lifepulse.in` | `LifePulse@123` | AJ Hospital Mangaluru emergency dispatch & history |
| 🩸 **Verified Donor** | `rahul.shetty@gmail.com` | `LifePulse@123` | O+ Screened Donor (7 donations, 5 emergency responses, Hero Studio) |
| 🩸 **Verified Donor** | `sneha.rao@gmail.com` | `LifePulse@123` | A+ Screened Donor with active alerts & history |

---

## 🧪 Testing & Verification

```bash
# Run server test suite (7/7 simulation tests):
npm run test --prefix server

# Run client production build:
npm run build --prefix client
```

---

## 📋 Documentation Reference

- [`yetto.md`](yetto.md): Comprehensive gap analysis & status of requirements against specification.
- [`WHAT_WAS_MADE.md`](WHAT_WAS_MADE.md): Complete Phase 1–5 delivery report and REST API dictionary.
- [`PILOT_READINESS.md`](PILOT_READINESS.md): Operational handoff and hospital onboarding checklist for district rollout.
- [`reduired.md`](reduired.md): Original system requirements specification.
