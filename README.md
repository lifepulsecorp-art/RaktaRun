# 🩸 LifePulse — Emergency Blood Coordination System

> *"Every minute matters. Connect. Locate. Respond. Save."*

LifePulse is a real-time emergency blood donor matching and dispatch system designed for **Udupi and Dakshina Kannada** districts in Coastal Karnataka. Unlike open directories, LifePulse connects hospitals exclusively with **medically screened, verified blood donors** during acute trauma and emergency surges.

---

## 🏗️ Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons, React Router 7.
- **Backend:** Express, TypeScript, Node.js (`tsx`), REST API with Bearer token authentication.
- **Authentication:** Firebase Auth (Client-side token generation + Backend Admin SDK verification).
- **Data Layer:** Local JSON Database (`server/data/*.json`) ready for direct 1:1 MongoDB migration.

```
┌──────────────────────────────────────────────┐
│  React 19 Frontend (client/)                 │
│  - Public Landing & Registration (/, /register)
│  - Donor Portal (/donor/*)                   │
│  - Hospital Portal (/hospital/*)             │
│  - Admin Command Center (/admin/*)           │
└──────────────┬───────────────────────────────┘
               │ REST + Bearer <Firebase ID Token>
               ↓
┌──────────────────────────────────────────────┐
│  Express Backend API (server/)               │
│  - Firebase Admin SDK Token Verification     │
│  - RBAC Middleware (admin, hospital, donor)  │
│  - Matching & Dispatch Engine                │
└──────────────┬───────────────────────────────┘
               │ Local JSON Persistence
               ↓
┌──────────────────────────────────────────────┐
│  JSON Data Layer (server/data/)              │
│  - users.json, hospitals.json, donors.json   │
│  - bloodRequests.json, matches.json          │
└──────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+ or v20+)
- Firebase Project (`lifepulse-dev`)

### 2. Environment Setup
```bash
# In client/
cp client/.env.example client/.env

# In server/
cp server/.env.example server/.env
# Place your Firebase Admin Service Account key at:
# server/firebase-service-account.json
```

### 3. Installation & Run
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

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| 🛡️ **System Admin** | `admin@lifepulse.in` | *(Console Password)* | `/admin/*` Verification & Auditing |
| 🏥 **Hospital Staff** | `manipal@lifepulse.in` | `LifePulse@123` | `/hospital/*` Kasturba Hospital Manipal |
| 🏥 **Hospital Staff** | `ajhospital@lifepulse.in` | `LifePulse@123` | `/hospital/*` AJ Hospital Mangaluru |
| 🩸 **Verified Donor** | `rahul.shetty@gmail.com` | `LifePulse@123` | `/donor/*` (O+ Screened Donor) |
| 🩸 **Verified Donor** | `sneha.rao@gmail.com` | `LifePulse@123` | `/donor/*` (A+ Screened Donor) |

---

## 📦 Version Status
- **Current Milestone:** Version 1 — Phase 1 (Foundation, Medical Onboarding, Authentication Shell & Self-Service Registration Suite)
- **Roadmap:** Phase 2 (Emergency Request Matching & Alert Dispatch Engine)
