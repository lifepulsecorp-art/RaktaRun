[05/10, 11:39 am] Vinay VJEC: LifePulse — Smart Emergency Blood Donor Matching and Coordination System

LifePulse is a full-stack web application designed to help hospitals quickly find suitable blood donors during emergencies across the coastal Karnataka region. When a hospital needs emergency blood, it creates a blood request in the system, and LifePulse automatically finds nearby eligible donors with compatible blood groups and alerts them.

Technology Stack

- Frontend: React.js
- Backend: Node.js + Express.js
- Database: Firebase Firestore
- Authentication: Firebase Authentication + OTP
- Identity: Aadhaar authentication/e-KYC integration, subject to legal authorization
- Location: Google Maps API
- Matching: Rule-based donor matching algorithm
- Notifications: Firebase Cloud Messaging (FCM)
- Hosting: Firebase / Cloud Platform
- Security: HTTPS + Role-Based Access Control
- Development: VS Code + GitHub
- API Testing: Postman

User Roles

1. Donor

Donors can register, verify their mobile number using OTP, and maintain their profile with:

- Name and blood group
- Location
- Availability status
- Last donation date
- Relevant donor eligibility information
- Notification preferences

The system uses the donor's blood group, last donation date, eligibility, availability and location during matching. Eligible donors receive emergency alerts and can accept or decline requests.

2. Hospital

Verified hospitals can:

- Create emergency blood requests.
- Enter required blood group, blood component, number of units, urgency and required time.
- Provide hospital location and contact information.
- View online blood matching results directly from the hospital dashboard.
- See nearby compatible donors, their distance and available information.
- Track donor responses and matching progress.
- Update the request as fulfilled, cancelled, expired or unfulfilled.

The hospital dashboard acts as the main emergency coordination interface.

3. Admin

Admins can:

- Verify and manage hospitals.
- Manage users and access.
- Monitor emergency requests.
- Configure matching and escalation rules.
- Review reports and audit logs.
- Handle suspicious activity or misuse.

Emergency Blood Matching Workflow

Hospital needs emergency blood
↓
Hospital creates a blood request
↓
System validates and stores the request
↓
Matching algorithm searches nearby donors
↓
Checks blood compatibility + last donation + eligibility + availability + location
↓
Compatible donors are ranked by proximity and other configured rules
↓
FCM sends emergency alerts to selected donors
↓
Donors Accept / Decline
↓
Hospital sees responses through online matching dashboard
↓
If responses are insufficient, the system searches or alerts additional donors
↓
Hospital coordinates with the responding donor and updates the request status

Matching Algorithm

The rule-based matching engine automatically filters and ranks donors based on:

- Blood-group and blood-component compatibility
- Last donation date and applicable donation interval
- Donor eligibility information
- Availability status
- Consent and notification preferences
- Geographical proximity
- Estimated travel time where available

The system should use medically approved compatibility rules. Donor acceptance does not replace the hospital's medical screening or confirm that a donation will occur.

Google Maps Integration

Google Maps API is used for:

- Donor and hospital location handling
- Distance calculation
- Nearby donor identification
- Route and estimated travel time where available
- Location-based matching

Donor privacy must be maintained, and exact home locations should not be unnecessarily exposed.

Online Blood Matching — Hospital Perspective

The hospital dashboard provides a real-time view of the matching process. After creating a request, hospital staff can see compatible nearby donors identified by the system, matching status, distance, responses and escalation progress.

This allows the hospital to manage the emergency request from a single dashboard instead of manually searching for donors.

Notifications

Firebase Cloud Messaging sends emergency alerts to matched donors. Donors can open the request and Accept or Decline it. The system records responses and can automatically notify additional candidates when the required number of responses is not received.

Database

Firestore stores:

- User and donor profiles
- Blood groups and donor information
- Last donation dates
- Availability
- Hospital details and verification status
- Emergency blood requests
- Matching results
- Donor responses
- Notification records
- Request status
- Audit logs

Security

LifePulse uses:

- Firebase Authentication
- OTP verification
- HTTPS
- Role-based access control
- Firestore Security Rules
- Backend authorization
- Input validation
- Audit logging
- Protected donor and location information

Aadhaar/e-KYC should only be implemented through an authorized integration with appropriate consent and data-protection requirements.

Development and Testing

The project will be developed using VS Code and GitHub. Postman will be used for API testing, along with application testing for authentication, hospital verification, donor matching, notification delivery, accept/decline responses, duplicate requests, escalation and security.

Expected Outcome

LifePulse provides an integrated emergency blood coordination platform where hospitals can create urgent blood requests, the system can automatically identify nearby compatible donors, donors can respond through their dashboard, and hospitals can monitor the entire online matching process until the request is resolved.

The system is initially designed for the coastal Karnataka region and can later be expanded to additional regions.
[05/10, 11:39 am] Vinay VJEC: Now we're restricting for 
Udupi and dakshina Kannada
[05/10, 11:39 am] Vinay VJEC: Make it real time
[05/10, 11:39 am] Vinay VJEC: Donors must undergo hospital testing before registration. Hospitals verify blood group, Rh type, donation history, availability, location, and eligibility, issuing digital certificates. AI identifies potentially compatible nearby donors for hospital emergencies, with final compatibility confirmed by medical professionals.
[05/10, 11:39 am] Vinay VJEC: Don't search for random donors during an emergency. Build a verified network of medically screened donors and connect them to hospitals/blood banks through an emergency-response system.
[05/10, 11:39 am] Vinay VJEC: “Find the right donor. Know their location. Reach help faster.”

Core LifePulse features:

1. Donor live/current location
    * Donor opts in to location sharing during an active emergency request.
    * Show approximate location until the donor accepts the request.
    * Once accepted, provide navigation/ETA.
2. Blood-group matching
    * Blood group
    * Component required: whole blood / RBC / platelets / plasma
    * Availability status
    * Distance from hospital
3. Emergency matching
    * Patient/hospital raises a request.
    * LifePlus identifies eligible nearby donors.
    * Priority based on blood compatibility + distance + availability + response time.
4. Fast donor alert
    * Push notification
    * SMS/WhatsApp fallback
    * “Accept / Decline” buttons
    * Emergency escalation if the first donor doesn’t respond.
5. Hospital information
    * Hospital name
    * Location
    * Blood bank/contact
    * Required blood component
    * Units required
    * Required-by time
    * Contact person
6. Live journey tracking
    Once a donor accepts:
    Donor → Hospital
    Show:
    * Current location
    * Distance
    * ETA
    * Route
    * Hospital destination
7. Donor network
    Build a verified database of:
    * Blood group
    * Last donation date
    * Location
    * Availability
    * Preferred radius
    * Donation eligibility status
8. Emergency broadcast
    Example:
    🩸 URGENT O+ BLOOD REQUIRED
    📍 Manipal Hospital
    📏 Donors within 5 km
    ⏱ Required within 2 hours
    [I CAN DONATE]

One important design principle

Don’t continuously expose a donor’s precise location to everyone.

Instead:

Normal mode: approximate location / locality
↓
Emergency request: donor receives alert
↓
Donor accepts: temporary location sharing
↓
Hospital receives ETA/location information
↓
After completion: location sharing automatically stops.

This gives LifePulse a much stronger privacy-by-design approach.

Possible LifePlus positioning

LifePulse
“Every minute matters.”

Connect. Locate. Respond. Save.
[05/10, 11:39 am] Vinay VJEC: ❤️ LifePulse “Emergency Hero” Model

Imagine this scenario:

7:42 PM — Emergency Request

🔴 CRITICAL BLOOD REQUEST

O+ Blood Required
2 units
📍 Hospital: XYZ Hospital, Bengaluru
⏱ Required urgently
📏 Suitable donors within 5 km

LifePulse identifies 15 potentially suitable, available donors.

Instead of simply sending:

“Blood required. Please donate.”

Send something much more human:

🚨 LIFE PULSE EMERGENCY ALERT

Someone near you needs your help.

🩸 O+ donor needed
📍 3.2 km from you
🏥 XYZ Hospital
⏱ Emergency request

You could be the person who gets there in time.

[ I CAN HELP ]

Then show:

Estimated travel time: 11 minutes

That ETA could be a powerful motivator because the donor immediately understands that their physical proximity matters.

⸻

🏆 Then introduce LifePulse Hero Recognition

Don’t rank people as “better donors” simply because they donated more.

Instead, create recognition categories based on verified contributions.

🦸 LifePulse Hero

A donor who successfully responds to an emergency request.

⚡ LifePulse Rapid Responder

A donor who accepts an emergency request quickly and reaches the hospital within the required timeframe.

❤️ LifePulse Repeat Hero

A donor who repeatedly supports verified emergency requests over time.

🌟 LifePulse Community Champion

Someone who consistently contributes to voluntary blood-donation awareness and community mobilisation.

🏅 LifePulse Rare Blood Hero

A verified donor with a relatively uncommon blood group who has opted into emergency alerts.

⸻

📱 This is where Instagram becomes powerful

After a verified donation/response, LifePulse could ask the donor:

“Would you like us to celebrate your contribution publicly?”

YES / KEEP PRIVATE

Only if they explicitly consent, create a beautiful Instagram-ready card.

Example:

LIFEPULSE HERO ❤️

Meet Rahul

🩸 O+ Donor
⚡ Emergency Response
📍 Bengaluru
❤️ Supported a verified emergency request

“He didn’t just receive an alert.
He responded.”

LifePulse

Connecting Lives When It Matters Most

Then tag the donor only with permission.

This creates a very different social-media culture:

Not “Look how many followers I have.”

Instead:

“Look what I did when someone needed help.”

⸻

🔥 The LifePulse Hero Wall

Inside the app/website, create:

❤️ LIFE PULSE HEROES

A continuously updated recognition wall.