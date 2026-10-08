# 📋 LifePulse — Gap Analysis & Pending Requirements (`yetto.md`)

> **Reference Document:** [`reduired.md`](file:///d:/Echelonglobal/Lifepulse/reduired.md) (Vinay VJEC Project Specification)  
> **Current Build Status:** Phases 1–4 Core Implemented (Offline Local JWT, Rule-based Matching, Ephemeral Transit Radar, Public Hero Wall)  
> **Date:** October 8, 2026  
> **Scope:** Coastal Karnataka (Udupi & Dakshina Kannada)

---

## 🧭 Executive Overview

A thorough audit comparing the specifications in [`reduired.md`](file:///d:/Echelonglobal/Lifepulse/reduired.md) against the active LifePulse codebase reveals that while the **core clinical workflow** (rule-based compatibility matching, 2-minute auto-escalation, ephemeral location streaming, 150m arrival cutoff, and public hero wall) is fully working, several **infrastructure integrations, communication layers, and UX/governance features** remain to be built.

Below is the comprehensive breakdown of everything missed or yet to be completed, categorized by priority and system area.

---

## 🔴 High Priority Gaps (Core Architecture & Security)

### 1. Mobile OTP Authentication
* **Spec in `reduired.md` (Lines 10, 24, 141):**
  > *"Authentication: Firebase Authentication + OTP"*  
  > *"Donors can register, verify their mobile number using OTP..."*
* **Current State:** The system uses email and password with local JWT authentication.
* **What is Missed:**
  - Phone number verification via SMS OTP (e.g. Firebase Phone Auth, Twilio Verify, or MSG91).
  - OTP challenge screen during donor registration and profile phone updates.
  - Verification badge confirming phone number authenticity.

### 2. Aadhaar Authentication / e-KYC Integration
* **Spec in `reduired.md` (Lines 11, 150):**
  > *"Identity: Aadhaar authentication/e-KYC integration, subject to legal authorization"*  
  > *"Aadhaar/e-KYC should only be implemented through an authorized integration with appropriate consent and data-protection requirements."*
* **Current State:** Stored only as a passive seed boolean (`aadhaarVerified: true`) in `server/data/donors.json`.
* **What is Missed:**
  - Aadhaar number input with masked display (`XXXX-XXXX-1234`).
  - Consent declaration checkbox for e-KYC lookup.
  - Mock/Sandbox e-KYC verification gateway (OTP-based Aadhaar simulation).
  - Explicit privacy statement regarding Aadhaar data protection under Indian regulations.

### 3. Production Cloud Database (Firebase Firestore)
* **Spec in `reduired.md` (Lines 9, 120–135, 144):**
  > *"Database: Firebase Firestore"*  
  > *"Firestore stores: User and donor profiles, Blood groups, Last donation dates, Availability, Hospital details, Emergency blood requests, Matching results, Donor responses, Notification records, Request status, Audit logs."*
* **Current State:** Running on a local JSON file store (`server/data/*.json`) with atomic file writes to allow 100% offline development.
* **What is Missed:**
  - Firestore database service adapter.
  - Production `firestore.rules` enforcing role-based read/write permissions.
  - Real-time Firestore snapshot listeners (`onSnapshot`) for multi-device sync without polling.

### 4. Real Google Maps API & Navigation Routes
* **Spec in `reduired.md` (Lines 12, 98–107, 173, 203):**
  > *"Location: Google Maps API"*  
  > *"Google Maps API is used for: Donor and hospital location handling, Distance calculation, Nearby donor identification, Route and estimated travel time where available, Location-based matching"*  
  > *"Once accepted: Donor → Hospital: Show Current location, Distance, ETA, Route, Hospital destination"*
* **Current State:** Uses mathematical Haversine calculations and a custom SVG radar canvas (`LiveTrackingPage.tsx`).
* **What is Missed:**
  - Google Maps JavaScript API SDK integration (`@react-google-maps/api` or Google Maps embed).
  - Interactive map view displaying hospital pin and moving donor marker.
  - Google Directions API integration showing the actual road route polyline and live road-traffic ETA.
  - Turn-by-turn navigation link launching Google Maps app for the traveling donor.

---

## 🟡 Medium Priority Gaps (Communications, Alerts & Controls)

### 5. Multi-Channel Alerting (Push + SMS / WhatsApp Fallback)
* **Spec in `reduired.md` (Lines 14, 74, 118, 184–185):**
  > *"Fast donor alert: Push notification, SMS/WhatsApp fallback"*  
  > *"Firebase Cloud Messaging sends emergency alerts to matched donors."*  
  > *"Emergency escalation if the first donor doesn't respond."*
* **Current State:** Alerts are received only when the donor has the web app open in a browser tab (via periodic polling of `/api/donors/me/alerts`).
* **What is Missed:**
  - Web Push / Firebase Cloud Messaging (FCM) Service Worker to alert donors even when the browser tab is in background or closed.
  - Automated SMS fallback (via Twilio, Gupshup, or Fast2SMS) if the alert is unacknowledged after 60 seconds.
  - WhatsApp Business Cloud API fallback sending structured emergency broadcast templates with interactive [I CAN HELP] / [DECLINE] quick-reply buttons.

### 6. Human-Centric Alert Experience & Copywriting
* **Spec in `reduired.md` (Lines 267–285):**
  > *"🚨 LIFE PULSE EMERGENCY ALERT*  
  > *Someone near you needs your help.*  
  > *🩸 O+ donor needed · 📍 3.2 km from you · 🏥 XYZ Hospital · ⏱ Emergency request*  
  > *You could be the person who gets there in time.*  
  > *[ I CAN HELP ]*  
  > *Estimated travel time: 11 minutes"*
* **Current State:** Alert modal is functional but uses technical phrasing (*"Emergency donor alert: A nearby hospital needs help"*, *"Accept & share location"*).
* **What is Missed:**
  - High-impact emotional alert modal with the exact copy specified by Vinay.
  - Large prominent ETA badge (*"Estimated travel time: X minutes"*).
  - Primary button titled **"[ I CAN HELP ]"** for maximum urgency.

### 7. Donor Profile Customization & Preferences
* **Spec in `reduired.md` (Lines 31, 92, 211):**
  > *"Notification preferences"*  
  > *"Consent and notification preferences"*  
  > *"Preferred radius"*
* **Current State:** Donors have fixed defaults in `donors.json` (`preferredRadius: 15`).
* **What is Missed:**
  - **Preferred Search Radius Slider:** Allow donors to adjust their travel radius (e.g. 5 km, 10 km, 25 km, 50 km).
  - **Notification Preferences Center:** Toggles for Push, SMS, and WhatsApp alerts; option for "Critical Emergencies Only" vs "All Compatible Requests".
  - **Self-Service Profile Editor:** Edit home locality, phone number, and emergency contact details.

### 8. Hospital Request Lifecycle Completeness
* **Spec in `reduired.md` (Lines 45, 191–195):**
  > *"Update the request as fulfilled, cancelled, expired or unfulfilled."*  
  > *"Required-by time, Blood bank/contact, Contact person"*
* **Current State:** Hospitals can create, cancel, and complete requests.
* **What is Missed:**
  - Explicit option to mark requests as **`unfulfilled`** with documented reason (e.g. "No donors reached in time; arranged inter-hospital blood bank transfer").
  - Clear emergency contact person card visible to en-route donors (calling hospital duty doctor/blood bank directly from the tracking page).

---

## 🟢 Community, Hero & Administrative Gaps

### 9. Fifth Badge: "LifePulse Community Champion"
* **Spec in `reduired.md` (Lines 306–308):**
  > *"🌟 LifePulse Community Champion: Someone who consistently contributes to voluntary blood-donation awareness and community mobilisation."*
* **Current State:** 4 badges are implemented (`life_pulse_hero`, `rapid_responder`, `repeat_hero`, `rare_blood_hero`).
* **What is Missed:**
  - Badge definition for `community_champion`.
  - Awarding criteria (e.g. sharing social awareness cards, referring verified donors, organizing donation drives).
  - Badge icon and description on the Hero Wall and Donor Profile.

### 10. Post-Donation Celebration & Instagram Story Card
* **Spec in `reduired.md` (Lines 318–345):**
  > *After a verified donation/response, LifePulse asks the donor:*  
  > *“Would you like us to celebrate your contribution publicly? [ YES ] / [ KEEP PRIVATE ]”*  
  > *Only if they explicitly consent, create a beautiful Instagram-ready card:*  
  > *“LIFEPULSE HERO ❤️*  
  > *Meet Rahul · 🩸 O+ Donor · ⚡ Emergency Response · 📍 Udupi*  
  > *❤️ Supported a verified emergency request*  
  > *'He didn’t just receive an alert. He responded.'*  
  > *LifePulse — Connecting Lives When It Matters Most”*
* **Current State:** Hero Wall exists with a 1200x630 banner generator, but opt-in is a passive checkbox in dashboard settings.
* **What is Missed:**
  - **Celebration Modal:** Triggered immediately when the hospital marks a donation complete, asking the donor: *"Would you like us to celebrate your contribution publicly?" [ YES, CELEBRATE ] / [ KEEP PRIVATE ]*.
  - **Instagram Story Generator (9:16 vertical 1080x1920 & 1:1 square):** Rendered with the exact inspirational quote, donor name, blood group, district, and verified badge for 1-click sharing on Instagram/WhatsApp Status.

### 11. Admin Configuration Console for Matching Rules
* **Spec in `reduired.md` (Line 56):**
  > *"Configure matching and escalation rules"*
* **Current State:** Escalation parameters (120-second window, +5 km radius increments, 50 km max ceiling) are hardcoded in `server/src/services/escalation.ts`.
* **What is Missed:**
  - Admin UI page to adjust alert timeout duration (e.g. 90s, 120s, 180s).
  - Admin UI to adjust radius expansion step size and maximum ceiling.
  - Toggle between strict component matching and whole-blood fallback.

### 12. Security, Abuse Prevention & Administrative Reporting
* **Spec in `reduired.md` (Lines 57–58):**
  > *"Review reports and audit logs."*  
  > *"Handle suspicious activity or misuse."*
* **Current State:** Audit logs are displayed as raw events in `AdminDashboardPage.tsx`.
* **What is Missed:**
  - **Abuse & Misuse Protection:**
    - Flagging false emergency dispatches.
    - Donor no-show tracking (e.g. accepted but never moved or arrived).
    - Rate-limiting dispatches per hospital.
  - **Reporting & Data Export:**
    - Export audit logs to CSV / JSON / PDF.
    - District shortage analytics (e.g. percentage of unfulfilled requests by blood group in Udupi vs Mangaluru).
  - **User & Access Management:**
    - Admin UI to search all registered accounts, block/suspend users, and manage access roles.

---

## 📊 Summary Gap Matrix

| Area | Feature in `reduired.md` | In Current App? | Priority |
| :--- | :--- | :--- | :--- |
| **Authentication** | Mobile Phone OTP Verification | ❌ Missing | High |
| **Identity** | Aadhaar / e-KYC Verification & Consent | ❌ Missing (Mock bool only) | High |
| **Database** | Firebase Firestore Cloud Sync & Security Rules | ❌ Missing (Local JSON) | High |
| **Mapping** | Google Maps SDK + Directions API Route Polyline | ❌ Missing (SVG Radar only) | High |
| **Notifications** | FCM Web Push Notifications | ❌ Missing (In-app polling only) | High |
| **Notifications** | SMS & WhatsApp Broadcast Fallback | ❌ Missing | High |
| **Matching UI** | Human-Centric Alert Copy & Prominent ETA | ⚠️ Partial (Technical copy) | Medium |
| **Donor UI** | Preferred Search Radius Slider & Notification Prefs | ❌ Missing | Medium |
| **Hospital UI** | Mark Request as `unfulfilled` with Audit Reason | ❌ Missing | Medium |
| **Hero Model** | `LifePulse Community Champion` Badge | ❌ Missing (4 of 5 exist) | Medium |
| **Hero Model** | Post-Donation Celebration Modal with Story Card | ⚠️ Partial (Banner only) | Medium |
| **Admin UI** | Dynamic Matching & Escalation Config Console | ❌ Missing (Hardcoded) | Medium |
| **Admin UI** | Abuse Reporting, No-Show Penalties & CSV Exports | ❌ Missing | Low |
| **Admin UI** | Complete User Management Table | ❌ Missing | Low |

---

## 🎯 Recommended Next Implementation Steps

1. **Phase 5A: UX & Copy Polish (Fastest Win)**
   - Update [`DonorDashboardPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/DonorDashboardPage.tsx) alert modal with the exact inspirational copy (*"Someone near you needs your help"*, *"[ I CAN HELP ]"*, travel time ETA).
   - Add the **Post-Donation Celebration Modal** and Instagram Story Card generator (9:16 layout).
   - Add the 5th badge: **LifePulse Community Champion**.

2. **Phase 5B: Mobile OTP & Aadhaar e-KYC Flow**
   - Add phone number OTP step to [`DonorRegisterPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/register/DonorRegisterPage.tsx).
   - Add Aadhaar verification card with mock OTP challenge & legal consent disclaimer.

3. **Phase 5C: Mapping & Routing Upgrade**
   - Integrate Google Maps JavaScript API / Leaflet Maps on [`LiveTrackingPage.tsx`](file:///d:/Echelonglobal/Lifepulse/client/src/pages/LiveTrackingPage.tsx) to complement or replace the radar with actual road routes.

4. **Phase 5D: Multi-Channel Messaging**
   - Add Web Push / FCM Service Worker and WhatsApp/SMS webhook simulation for offline alerts.

