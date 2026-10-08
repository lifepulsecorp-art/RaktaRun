# LifePulse district pilot readiness

The Phase 2–4 application flows and local matching simulations are implemented. The live district rollout remains an operational step because it needs real hospital operators, production infrastructure, and an approved clinical workflow.

## Before inviting pilot users

- [ ] Configure Firebase Auth for the production project, approved domains, account recovery, and hospital staff accounts.
- [ ] Replace the local JSON data store with a durable shared database before running more than one server instance.
- [ ] Deploy the API behind HTTPS and configure exact CORS origins, secrets, backups, monitoring, and retention for location data.
- [ ] Configure and verify donor notifications for production. The current dispatch alert is an in-app feed; FCM, SMS, and WhatsApp providers are not configured.
- [ ] Confirm donor eligibility, donation interval, compatibility, arrival, and cancellation procedures with the participating blood-bank medical officers.
- [ ] Obtain written pilot approval from Kasturba Hospital Manipal and AJ Hospital Mangaluru and assign staff for dispatch and donation-completion confirmation.
- [ ] Run a supervised drill with test accounts in each district, including rejection, timeout, radius escalation, cancellation, GPS denial, arrival, and completion.
- [ ] Publish privacy notice and retention policy; confirm opt-in language for public Hero Wall profiles and location sharing.
- [ ] Validate emergency contacts and escalation coverage for both districts before accepting real trauma requests.

## Implemented safeguards for the pilot build

- Firebase ID tokens are verified with revocation checks; missing, invalid, expired, or revoked tokens receive HTTP 401.
- Hospital dispatch, donor responses, and location writes are scoped to the authenticated hospital or donor.
- Only accepted donors can stream GPS. Coordinates are returned to the owning hospital while the request remains active, then cleared on arrival or closure.
- Unanswered alerts expire after two minutes and new batches expand the search radius up to 50 km.
- Public hero profiles are hidden unless the donor opts in.
- Administrative dispatch and donation-completion actions write audit events.

This checklist is an operational handoff, not evidence that a live pilot has been approved or launched.
