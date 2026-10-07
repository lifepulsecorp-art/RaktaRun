# LifePulse — Complete Technical Specification & Implementation Blueprint

## 🎯 Project Overview

**LifePulse** — *"Every minute matters. Connect. Locate. Respond. Save."*

A real-time emergency blood donor matching and coordination system for **Udupi & Dakshina Kannada** districts, connecting **medically verified donors** with hospitals during emergencies.

---

## 🔑 Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Verified Network Only** | No random donors. All donors hospital-screened & certified |
| **Privacy-by-Design** | Approximate location → temporary sharing on accept → auto-stop after completion |
| **Real-Time Everything** | Live donor tracking, instant alerts, ETA updates |
| **Medical Authority** | AI suggests; hospital confirms final compatibility |

---

## 1️⃣ VERIFIED DONOR ONBOARDING (The Foundation)

### Registration Flow

```
Donor visits hospital/blood bank
        ↓
Hospital performs medical screening:
  • Blood group + Rh typing
  • Hemoglobin test
  • Donation history review
  • Eligibility check (age, weight, health)
  • Location verification
        ↓
Hospital issues DIGITAL CERTIFICATE (signed QR)
        ↓
Donor registers on LifePulse with certificate
        ↓
OTP + Aadhaar e-KYC verification
        ↓
Profile activated with "VERIFIED" badge
```

### Donor Profile Schema (Firestore)

```javascript
// Collection: /donors/{donorId}
{
  uid: "firebase_auth_uid",
  fullName: "Rahul Shetty",
  phone: "+919876543210",
  aadhaarVerified: true,
  
  // Medical Verification (from hospital)
  bloodGroup: "O+",
  rhType: "positive",
  bloodComponentEligibility: ["whole_blood", "RBC", "plasma"],
  lastDonationDate: Timestamp,
  hemoglobinLevel: 14.2,
  weight: 72,
  eligibilityStatus: "eligible", // eligible | temporary_deferral | permanent_deferral
  deferralUntil: null,
  deferralReason: null,
  
  // Hospital Certificate
  verification: {
    hospitalId: "manipal_hospital_udupi",
    hospitalName: "Kasturba Hospital, Manipal",
    certificateId: "LP-CERT-2025-00847",
    verifiedAt: Timestamp,
    verifiedBy: "Dr. Anand Kumar",
    digitalSignature: "hash_string",
    qrCode: "certificate_qr_url",
    expiryDate: Timestamp // 1 year validity
  },
  
  // Location (privacy-controlled)
  homeLocality: "Manipal, Udupi", // Approximate only
  homeGeohash: "tdy8k3", // Coarse geohash (~5km)
  preciseLocation: null, // Only set during active emergency
  locationSharingEnabled: false,
  preferredRadius: 10, // km
  
  // Availability & Preferences
  availabilityStatus: "available", // available | unavailable | emergency_only
  notificationPreferences: {
    push: true,
    sms: true,
    whatsapp: true,
    quietHours: { start: "23:00", end: "06:00" },
    emergencyOverride: true // Emergency alerts bypass quiet hours
  },
  
  // Hero Recognition
  heroStats: {
    totalEmergencyResponses: 3,
    totalDonations: 5,
    averageResponseTime: 420, // seconds
    badges: ["life_pulse_hero", "rapid_responder"],
    lastResponseDate: Timestamp
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 2️⃣ REAL-TIME MATCHING ALGORITHM

### Compatibility Matrix (Medically Approved)

```javascript
const BLOOD_COMPATIBILITY = {
  // Recipient → Compatible Donors
  "O-":  ["O-"],
  "O+":  ["O-", "O+"],
  "A-":  ["O-", "A-"],
  "A+":  ["O-", "O+", "A-", "A+"],
  "B-":  ["O-", "B-"],
  "B+":  ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
};

const COMPONENT_RULES = {
  whole_blood: { minInterval: 90, maxUnitsPerRequest: 2 },
  RBC:         { minInterval: 90, maxUnitsPerRequest: 3 },
  platelets:   { minInterval: 14, maxUnitsPerRequest: 4 },
  plasma:      { minInterval: 28, maxUnitsPerRequest: 4 }
};
```

### Matching Engine (Cloud Function)

```javascript
// functions/matchingEngine.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const geofire = require('geofire-common');

exports.matchDonorsForRequest = functions.firestore
  .document('bloodRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const request = snap.data();
    const { requestId } = context.params;
    
    // 1. Get compatible blood groups
    const compatibleGroups = BLOOD_COMPATIBILITY[request.bloodGroup];
    const componentRules = COMPONENT_RULES[request.component];
    
    // 2. Query eligible donors within radius
    const radiusInM = request.radiusKm * 1000;
    const bounds = geofire.geohashQueryBounds(
      [request.hospitalLocation.latitude, request.hospitalLocation.longitude],
      radiusInM
    );
    
    const matchingDonors = [];
    
    for (const b of bounds) {
      const q = admin.firestore()
        .collection('donors')
        .where('eligibilityStatus', '==', 'eligible')
        .where('availabilityStatus', 'in', ['available', 'emergency_only'])
        .where('bloodGroup', 'in', compatibleGroups)
        .where('verification.expiryDate', '>', admin.firestore.Timestamp.now())
        .orderBy('homeGeohash')
        .startAt(b[0])
        .endAt(b[1]);
      
      const snapshot = await q.get();
      
      snapshot.forEach(doc => {
        const donor = doc.data();
        
        // 3. Filter: last donation interval
        const daysSinceDonation = donor.lastDonationDate 
          ? Math.floor((Date.now() - donor.lastDonationDate.toMillis()) / 86400000)
          : 999;
        
        if (daysSinceDonation < componentRules.minInterval) return;
        
        // 4. Calculate distance & ETA
        const distance = geofire.distanceBetween(
          [donor.homeGeohash_lat, donor.homeGeohash_lng],
          [request.hospitalLocation.latitude, request.hospitalLocation.longitude]
        );
        
        if (distance * 1000 > radiusInM) return;
        
        // 5. Compute match score
        const score = calculateMatchScore({
          distance,
          daysSinceDonation,
          responseRate: donor.heroStats.averageResponseTime,
          availability: donor.availabilityStatus,
          componentMatch: donor.bloodComponentEligibility.includes(request.component)
        });
        
        matchingDonors.push({
          donorId: doc.id,
          ...donor,
          distance,
          score
        });
      });
    }
    
    // 6. Rank and select top candidates
    const ranked = matchingDonors
      .sort((a, b) => b.score - a.score)
      .slice(0, request.unitsRequired * 5); // 5 candidates per unit
    
    // 7. Store matches
    const batch = admin.firestore().batch();
    ranked.forEach((match, index) => {
      const matchRef = admin.firestore()
        .collection('bloodRequests')
        .doc(requestId)
        .collection('matches')
        .doc(match.donorId);
      
      batch.set(matchRef, {
        donorId: match.donorId,
        distance: match.distance,
        score: match.score,
        rank: index + 1,
        status: 'pending_alert',
        alertedAt: null,
        respondedAt: null,
        response: null
      });
    });
    
    await batch.commit();
    
    // 8. Trigger alerts
    await sendEmergencyAlerts(requestId, ranked);
    
    return { matched: ranked.length };
  });

function calculateMatchScore({ distance, daysSinceDonation, responseRate, availability, componentMatch }) {
  let score = 100;
  
  // Distance (closer = better) — max 40 points
  score += Math.max(0, 40 - (distance * 4));
  
  // Donation interval (longer since donation = better) — max 20 points
  score += Math.min(20, daysSinceDonation / 5);
  
  // Response history — max 20 points
  if (responseRate < 600) score += 20;
  else if (responseRate < 1200) score += 10;
  
  // Availability — 10 points
  if (availability === 'available') score += 10;
  
  // Component eligibility — 10 points
  if (componentMatch) score += 10;
  
  return score;
}
```

---

## 3️⃣ REAL-TIME ALERT SYSTEM

### Multi-Channel Notification Flow

```javascript
// functions/alertService.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

async function sendEmergencyAlerts(requestId, donors) {
  const request = (await admin.firestore()
    .collection('bloodRequests').doc(requestId).get()).data();
  
  for (const donor of donors) {
    const alertPayload = {
      requestId,
      title: '🚨 LIFEPULSE EMERGENCY ALERT',
      body: `Someone near you needs your help.\n🩸 ${request.bloodGroup} needed\n📍 ${donor.distance.toFixed(1)} km from you\n🏥 ${request.hospitalName}\n⏱ Emergency request`,
      data: {
        type: 'emergency_request',
        requestId,
        bloodGroup: request.bloodGroup,
        hospitalName: request.hospitalName,
        distance: donor.distance.toString(),
        eta: donor.eta?.toString() || 'calculating',
        urgency: request.urgency
      }
    };
    
    // Channel 1: FCM Push (primary)
    try {
      await admin.messaging().send({
        token: donor.fcmToken,
        notification: {
          title: alertPayload.title,
          body: alertPayload.body
        },
        data: alertPayload.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'emergency_alerts',
            sound: 'emergency_alert',
            clickAction: 'OPEN_EMERGENCY_REQUEST'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: { title: alertPayload.title, body: alertPayload.body },
              sound: 'emergency_alert.caf',
              badge: 1,
              contentAvailable: true
            }
          }
        }
      });
    } catch (err) {
      console.error('FCM failed:', err);
      
      // Channel 2: SMS fallback
      await sendSMS(donor.phone, 
        `LIFEPULSE URGENT: ${request.bloodGroup} blood needed at ${request.hospitalName}. ${donor.distance.toFixed(1)}km away. Reply ACCEPT or DECLINE.`
      );
      
      // Channel 3: WhatsApp fallback
      await sendWhatsApp(donor.phone, alertPayload);
    }
    
    // Log notification
    await admin.firestore()
      .collection('notifications')
      .add({
        donorId: donor.donorId,
        requestId,
        channels: ['fcm', 'sms', 'whatsapp'],
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });
  }
}
```

### Alert Escalation Logic

```javascript
// functions/escalation.js
exports.checkEscalation = functions.pubsub
  .schedule('every 2 minutes')
  .onRun(async () => {
    const now = Date.now();
    
    const activeRequests = await admin.firestore()
      .collection('bloodRequests')
      .where('status', '==', 'searching')
      .get();
    
    for (const reqDoc of activeRequests.docs) {
      const request = reqDoc.data();
      const requestId = reqDoc.id;
      
      // Count accepted donors
      const matches = await reqDoc.ref.collection('matches')
        .where('response', '==', 'accepted')
        .get();
      
      const acceptedCount = matches.size;
      const unitsNeeded = request.unitsRequired;
      
      // If insufficient responses after 2 minutes, escalate
      const elapsed = now - request.createdAt.toMillis();
      
      if (acceptedCount < unitsNeeded && elapsed > 120000) {
        // Get next batch of non-alerted donors
        const nextBatch = await getNextDonorBatch(requestId, 10);
        
        if (nextBatch.length > 0) {
          await sendEmergencyAlerts(requestId, nextBatch);
          await reqDoc.ref.update({
            escalationLevel: admin.firestore.FieldValue.increment(1),
            lastEscalatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // No more donors — mark as unfulfilled
          await reqDoc.ref.update({
            status: 'unfulfilled',
            unfulfilledReason: 'no_more_donors_available',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
  });
```

---

## 4️⃣ REAL-TIME LIVE JOURNEY TRACKING

### Donor Location Sharing (Privacy-Controlled)

```javascript
// client/src/services/locationTracking.js
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDistanceMatrix } from './mapsService';

class DonorLocationTracker {
  constructor() {
    this.watchId = null;
    this.activeRequestId = null;
    this.updateInterval = null;
  }
  
  // Called ONLY when donor accepts an emergency request
  async startTracking(donorId, requestId, hospitalLocation) {
    this.activeRequestId = requestId;
    
    // Update donor document to enable precise location
    const donorRef = doc(getFirestore(), 'donors', donorId);
    await updateDoc(donorRef, {
      preciseLocationEnabled: true,
      activeRequestId: requestId,
      locationSharingStartedAt: serverTimestamp()
    });
    
    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        
        // Update real-time location in Firestore
        await updateDoc(donorRef, {
          currentLocation: {
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
            updatedAt: serverTimestamp()
          }
        });
        
        // Also update the match document (visible to hospital only)
        const matchRef = doc(
          getFirestore(),
          'bloodRequests', requestId,
          'matches', donorId
        );
        
        // Calculate ETA
        const eta = await getDistanceMatrix(
          { lat: latitude, lng: longitude },
          hospitalLocation
        );
        
        await updateDoc(matchRef, {
          donorCurrentLocation: { latitude, longitude },
          distanceRemaining: eta.distanceMeters,
          etaSeconds: eta.durationSeconds,
          lastLocationUpdate: serverTimestamp()
        });
      },
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
    
    // Also push updates every 10 seconds as backup
    this.updateInterval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await updateDoc(donorRef, {
          'currentLocation.latitude': latitude,
          'currentLocation.longitude': longitude,
          'currentLocation.updatedAt': serverTimestamp()
        });
      });
    }, 10000);
  }
  
  // Called when donation completes or request cancelled
  async stopTracking(donorId) {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Remove precise location from donor document
    const donorRef = doc(getFirestore(), 'donors', donorId);
    await updateDoc(donorRef, {
      preciseLocationEnabled: false,
      currentLocation: null,
      activeRequestId: null,
      locationSharingStoppedAt: serverTimestamp()
    });
    
    this.activeRequestId = null;
  }
}
```

### Hospital Live Tracking Dashboard (React)

```jsx
// client/src/components/HospitalLiveTracking.jsx
import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { collection, onSnapshot } from 'firebase/firestore';

function HospitalLiveTracking({ requestId, hospitalLocation }) {
  const [donors, setDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [directions, setDirections] = useState(null);
  
  // Real-time listener for accepted donors
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'bloodRequests', requestId, 'matches'),
      (snapshot) => {
        const acceptedDonors = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(m => m.response === 'accepted');
        setDonors(acceptedDonors);
      }
    );
    return unsubscribe;
  }, [requestId]);
  
  // Calculate route when donor selected
  useEffect(() => {
    if (!selectedDonor?.donorCurrentLocation) return;
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: selectedDonor.donorCurrentLocation,
        destination: hospitalLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK') setDirections(result);
      }
    );
  }, [selectedDonor?.donorCurrentLocation, hospitalLocation]);
  
  return (
    <div className="live-tracking-panel">
      <div className="map-container">
        <GoogleMap
          zoom={13}
          center={hospitalLocation}
          mapContainerStyle={{ width: '100%', height: '500px' }}
        >
          {/* Hospital marker */}
          <Marker
            position={hospitalLocation}
            icon={{ url: '/icons/hospital.png', scaledSize: { width: 40, height: 40 } }}
          />
          
          {/* Live donor markers */}
          {donors.map(donor => (
            donor.donorCurrentLocation && (
              <Marker
                key={donor.id}
                position={donor.donorCurrentLocation}
                icon={{ url: '/icons/donor-moving.png', scaledSize: { width: 36, height: 36 } }}
                onClick={() => setSelectedDonor(donor)}
              />
            )
          ))}
          
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: { strokeColor: '#e63946', strokeWeight: 5 }
              }}
            />
          )}
        </GoogleMap>
      </div>
      
      <div className="donor-tracking-list">
        <h3>🚑 Donors En Route ({donors.length})</h3>
        {donors.map(donor => (
          <div key={donor.id} className="donor-track-card" onClick={() => setSelectedDonor(donor)}>
            <div className="donor-info">
              <span className="blood-badge">{donor.bloodGroup}</span>
              <span className="donor-name">{donor.donorName}</span>
            </div>
            <div className="tracking-stats">
              <span>📍 {formatDistance(donor.distanceRemaining)} away</span>
              <span>⏱ ETA: {formatETA(donor.etaSeconds)}</span>
              <span>🚗 {formatSpeed(donor.speed)}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${calculateProgress(donor)}%` 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5️⃣ HERO RECOGNITION SYSTEM

### Badge Logic (Cloud Function)

```javascript
// functions/heroRecognition.js
exports.awardHeroBadges = functions.firestore
  .document('bloodRequests/{requestId}/matches/{donorId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { donorId } = context.params;
    
    // Trigger only on acceptance or completion
    if (after.response !== 'accepted' && after.status !== 'donated') return;
    
    const donorRef = admin.firestore().collection('donors').doc(donorId);
    const donor = (await donorRef.get()).data();
    
    const badges = new Set(donor.heroStats?.badges || []);
    const stats = donor.heroStats || {
      totalEmergencyResponses: 0,
      totalDonations: 0,
      averageResponseTime: 0,
      badges: []
    };
    
    // 🦸 LifePulse Hero — responded to emergency
    if (after.response === 'accepted') {
      badges.add('life_pulse_hero');
      stats.totalEmergencyResponses += 1;
    }
    
    // ⚡ Rapid Responder — reached within required time
    if (after.status === 'donated' && after.reachedWithinTime) {
      badges.add('rapid_responder');
    }
    
    // ❤️ Repeat Hero — 3+ emergency responses
    if (stats.totalEmergencyResponses >= 3) {
      badges.add('repeat_hero');
    }
    
    // 🌟 Community Champion — 5+ voluntary donations
    if (stats.totalDonations >= 5) {
      badges.add('community_champion');
    }
    
    // 🏅 Rare Blood Hero — uncommon blood group + opted in
    const rareGroups = ['AB-', 'B-', 'A-', 'O-'];
    if (rareGroups.includes(donor.bloodGroup) && donor.availabilityStatus !== 'unavailable') {
      badges.add('rare_blood_hero');
    }
    
    await donorRef.update({
      'heroStats.badges': Array.from(badges),
      'heroStats.totalEmergencyResponses': stats.totalEmergencyResponses,
      'heroStats.totalDonations': stats.totalDonations,
      'heroStats.lastResponseDate': admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Trigger social share prompt
    if (after.status === 'donated') {
      await createShareableCard(donorId, context.params.requestId);
    }
  });
```

### Social Share Card Generator

```javascript
// functions/shareCard.js
async function createShareableCard(donorId, requestId) {
  const donor = (await admin.firestore().collection('donors').doc(donorId).get()).data();
  const request = (await admin.firestore().collection('bloodRequests').doc(requestId).get()).data();
  
  const cardData = {
    donorId,
    requestId,
    name: donor.fullName,
    bloodGroup: donor.bloodGroup,
    locality: donor.homeLocality,
    badge: donor.heroStats.badges[donor.heroStats.badges.length - 1],
    hospital: request.hospitalName,
    date: new Date().toISOString(),
    message: `"${donor.fullName} didn't just receive an alert. They responded."`,
    cardUrl: `https://lifepulse.app/hero/${donorId}/${requestId}`,
    consentGiven: false // Must be explicitly set
  };
  
  // Send prompt to donor
  await admin.firestore().collection('sharePrompts').add(cardData);
  
  // Push notification asking for consent
  await admin.messaging().send({
    token: donor.fcmToken,
    notification: {
      title: '🏆 You\'re a LifePulse Hero!',
      body: 'Would you like us to celebrate your contribution publicly?'
    },
    data: {
      type: 'share_prompt',
      promptId: cardData.cardUrl
    }
  });
}
```

---

## 6️⃣ DATABASE STRUCTURE (Active JSON Layer — 1:1 MongoDB / Firestore Compatible)

```
📁 server/data/ (Active Storage — Atomic JSON Engine)
│
├── 📄 users.json            (User accounts, RBAC roles: admin, hospital, donor)
├── 📄 hospitals.json        (Hospital profiles, licensing, GPS coordinates, verification)
├── 📄 donors.json           (Donor medical profiles, vitals, eligibility, hero stats)
├── 📄 bloodRequests.json    (Emergency requests, units required, urgency, radius)
├── 📄 matches.json          (Ranked donor matches, compatibility score, live GPS)
└── 📁 certificates/         (Hospital digital screening certificate documents)
```

### Firestore / MongoDB Target Mapping:
```
📁 Root
│
├── 📁 donors/{donorId}
│   ├── profile fields (as schema above)
│   └── 📁 donationHistory/{donationId}
│
├── 📁 hospitals/{hospitalId}
│   ├── name, address, location
│   ├── verificationStatus: "verified" | "pending" | "rejected"
│   ├── bloodBankContact: { name, phone, email }
│   ├── licenseNumber, registrationNumber
│   ├── verifiedBy (admin), verifiedAt
│   └── 📁 staff/{staffId} (sub-users with RBAC)
│
├── 📁 bloodRequests/{requestId}
│   ├── hospitalId, hospitalName, hospitalLocation
│   ├── patientInfo: { name, age, gender, ward, doctor } (optional)
│   ├── bloodGroup, component, unitsRequired
│   ├── urgency: "critical" | "urgent" | "standard"
│   ├── requiredBy: Timestamp
│   ├── radiusKm, status: "searching"|"matched"|"fulfilled"|"cancelled"|"expired"|"unfulfilled"
│   ├── createdBy (staffId), createdAt, updatedAt
│   ├── escalationLevel, lastEscalatedAt
│   ├── contactPerson: { name, phone }
│   └── 📁 matches/{donorId}
│       ├── donorId, distance, score, rank
│       ├── status, alertedAt, respondedAt, response
│       ├── donorCurrentLocation (only when accepted)
│       ├── etaSeconds, distanceRemaining
│       └── reachedAt, donationCompletedAt
│
├── 📁 notifications/{notificationId}
│   ├── donorId, requestId, channels[], status
│   └── sentAt, deliveredAt, readAt
│
├── 📁 auditLogs/{logId}
│   ├── action, actorId, actorRole, targetId
│   ├── metadata, ipAddress, timestamp
│   └── severity: "info"|"warning"|"critical"
│
├── 📁 adminConfig/matchingRules
│   ├── maxRadiusKm, defaultEscalationDelay
│   ├── componentIntervals (updated by admin)
│   └── rateLimits
│
└── 📁 heroWall/{heroId} (public, consent-only)
    ├── donorName, bloodGroup, locality
    ├── badge, story, sharedAt
    └── donationVerified: true
```

---

## 7️⃣ SECURITY RULES (Firestore)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isDonor() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'donor';
    }
    
    function isHospital() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'hospital' &&
        get(/databases/$(database)/documents/hospitals/$(request.auth.uid)).data.verificationStatus == 'verified';
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Donors: only self-access to full profile
    match /donors/{donorId} {
      allow read: if isAuthenticated() && (request.auth.uid == donorId || isHospital() || isAdmin());
      allow write: if isAuthenticated() && request.auth.uid == donorId 
                   && !request.resource.data.diff(resource.data).affectedKeys()
                       .hasAny(['verification', 'heroStats', 'bloodGroup', 'eligibilityStatus']);
      allow update: if isHospital() && 
                    request.resource.data.diff(resource.data).affectedKeys()
                      .hasOnly(['verification', 'eligibilityStatus', 'lastDonationDate']);
    }
    
    // Blood requests: hospitals create, matched donors read limited fields
    match /bloodRequests/{requestId} {
      allow read: if isHospital() || isAdmin();
      allow read: if isDonor() && 
        exists(/databases/$(database)/documents/bloodRequests/$(requestId)/matches/$(request.auth.uid));
      allow create, update: if isHospital();
      allow delete: if isAdmin();
      
      // Matches: hospital sees all, donor sees own
      match /matches/{donorId} {
        allow read: if isHospital() || isAdmin() || request.auth.uid == donorId;
        allow create, update: if isHospital() || isAdmin();
        allow update: if request.auth.uid == donorId &&
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['response', 'respondedAt', 'donorCurrentLocation', 'etaSeconds', 'distanceRemaining']);
      }
    }
    
    // Precise location: NEVER readable in bulk
    match /donors/{donorId}/privateLocation/{doc} {
      allow read: if request.auth.uid == donorId || isAdmin();
      allow write: if request.auth.uid == donorId;
    }
    
    // Audit logs: admin-only
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only via Cloud Functions
    }
  }
}
```

---

## 8️⃣ TECH STACK SUMMARY (LOCKED-IN ARCHITECTURE)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite + TailwindCSS 4 | Donor / Hospital / Admin dashboards (Single App, 3 Route Groups) |
| **State** | React Context (`AuthContext`) + Axios | Auth session & server communication with Bearer token interceptor |
| **Backend** | Express + TypeScript (`tsx watch`) | REST API, matching algorithm, verification workflows |
| **Database** | JSON Data Layer (`server/data/`) | Atomic file persistence (1:1 shape for future MongoDB migration) |
| **Auth** | Firebase Auth (Client) + Firebase Admin SDK (Backend) | Client login/register + Backend server token verification & RBAC |
| **Storage** | File System (`server/data/certificates/`) | Hospital digital screening certificates |
| **Testing** | Automated E2E verification + Vite production bundling | Production verification |

---

## 9️⃣ DEVELOPMENT ROADMAP

### Phase 1 — Foundation & Medical Onboarding (✅ 100% COMPLETED)
- [x] **Block A**: Frontend setup with React 19, TailwindCSS, Vite & routing
- [x] **Block B**: Express server + Firebase Admin SDK initialization + `.env` configuration
- [x] **Block C**: JSON Data Layer (`types.ts`, `db.ts`, `seed.ts` with Admin UID `5G6ajWegMiepIzvIyreG7bx82SG2`, 3 hospitals, 5 donors)
- [x] **Block D**: Express REST routes (`/api/auth`, `/api/hospitals`, `/api/donors`) + JWT auth middleware
- [x] **Block E**: React Auth shell (`AuthContext`, `ProtectedRoute`, `LoginPage`, `UnauthorizedPage`)
- [x] **Block F**: Admin Hospital Accreditation Audit UI (`/admin/hospitals` — approve/reject actions)
- [x] **Block G**: Hospital Profile & Licensing Setup UI (`/hospital/profile` — location presets & licensing)
- [x] **Block H**: Donor Medical Onboarding & Certificate Upload UI (`/donor/register` — digital certificate upload)
- [x] **Block I**: Admin Donor Certificate Approval UI (`/admin/donors` — certificate inspector & eligibility decisions)
- [x] **Public Onboarding & Registration Suite**:
  - Landing Page (`/` — `HomePage.tsx`)
  - Role Chooser (`/register` — `RegisterPage.tsx`)
  - Self-Service Donor Registration with Certificate Upload (`/register/donor` — `DonorRegisterPage.tsx`)
  - Self-Service Hospital Registration (`/register/hospital` — `HospitalRegisterPage.tsx`)
  - Verification Pending Screens (`/donor/pending`, `/hospital/pending`)
  - Backend Onboarding Endpoints (`POST /api/auth/register`, `POST /api/donors/register`, `POST /api/donors/certificate`, `POST /api/hospitals/register`)

### Phase 2 — Core Emergency Matching (Next Up)
- [ ] Hospital Emergency Blood Request creation UI (`/hospital/request/new`)
- [ ] Emergency alert dispatch engine with medical compatibility matching
- [ ] Donor Emergency Alert modal (Accept / Decline with timeout)
- [ ] Multi-donor dispatch & escalation logic for critical trauma

### Phase 3 — Real-Time Live Journey Tracking
- [ ] Live Transit Tracking (`/live-tracking/:requestId` with Google Maps / Leaflet)
- [ ] Ephemeral GPS location streaming (`POST /api/donors/matches/:matchId/location`)
- [ ] Dynamic ETA & distance countdown
- [ ] Auto-termination on hospital arrival

### Phase 4 — Hero Recognition & Public Wall
- [ ] Hero badge issuance engine (`life_pulse_hero`, `rapid_responder`, `rare_blood_hero`)
- [ ] Public Hero Wall (`/hero-wall`)
- [ ] Social share card generation for life-saving donors
- [ ] Admin district-wide telemetry and audit logs

### Phase 5 — Testing & Pilot Launch
- [ ] End-to-end trauma simulation with Kasturba Hospital Manipal & AJ Hospital Mangaluru
- [ ] Security audit & token expiration handling
- [ ] District pilot rollout in Udupi & Dakshina Kannada

---

## 🎯 FINAL POSITIONING

> **LifePulse** — *"Every minute matters."*
> 
> **Connect. Locate. Respond. Save.**
> 
> Not a directory of phone numbers.  
> Not a random donor search.  
> A **verified, real-time emergency response network** for coastal Karnataka.

**For Hospitals:** Create a request → See live compatible donors → Track them en route → Save a life.

**For Donors:** Get an alert → See you're 3.2 km away → Accept → Become a hero.

**For the Community:** A wall of real heroes who responded when it mattered.                