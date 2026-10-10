import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOOD_COMPATIBILITY, findCandidates } from './matching.js';
import { completeDonation, resolveDonorResponse, updateJourney } from './journey.js';
import type { BloodRequest, Donor } from '../types.js';

function donor(overrides: Partial<Donor> = {}): Donor {
  return {
    id: 'donor-test', uid: 'uid-test', fullName: 'Test Donor', phone: '+910000000000', aadhaarVerified: true,
    bloodGroup: 'O-', rhType: 'negative', bloodComponentEligibility: ['whole_blood'], lastDonationDate: null,
    hemoglobinLevel: 14, weight: 65, eligibilityStatus: 'eligible', verification: {
      hospitalId: 'hosp-test', hospitalName: 'Test Hospital', certificateId: 'CERT-1', verifiedAt: new Date().toISOString(),
      verifiedBy: 'Doctor', expiryDate: new Date(Date.now() + 86400000).toISOString(),
    }, homeLocality: 'Udupi', coordinates: { latitude: 13.35, longitude: 74.78 }, locationSharingEnabled: false,
    preferredRadius: 25, availabilityStatus: 'available', heroStats: { totalEmergencyResponses: 0, totalDonations: 0, averageResponseTime: 400, badges: [] },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...overrides,
  };
}

function request(overrides: Partial<BloodRequest> = {}): BloodRequest {
  return {
    id: 'req-test', hospitalId: 'hosp-test', hospitalName: 'Kasturba Hospital, Manipal',
    hospitalLocation: { latitude: 13.3535, longitude: 74.7865 }, bloodGroup: 'O+', component: 'whole_blood',
    unitsRequired: 2, urgency: 'critical', requiredBy: new Date(Date.now() + 3600000).toISOString(), radiusKm: 20,
    status: 'searching', createdBy: 'hospital-test', contactPerson: { name: 'Doctor', phone: '+910000000000' },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...overrides,
  };
}

test('compatibility matrix uses recipient-to-donor rules', () => {
  assert.deepEqual(BLOOD_COMPATIBILITY['O-'], ['O-']);
  assert.deepEqual(BLOOD_COMPATIBILITY['AB+'], ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']);
  assert.ok(BLOOD_COMPATIBILITY['A+'].includes('O-'));
  assert.ok(!BLOOD_COMPATIBILITY['A+'].includes('B+'));
});

test('dispatch simulation for Kasturba Manipal ranks eligible nearby O-negative donors', () => {
  const candidates = findCandidates(request(), [donor(), donor({ id: 'far', coordinates: { latitude: 12.9, longitude: 74.85 } })]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].donor.id, 'donor-test');
  assert.ok(candidates[0].distance < 2);
});

test('AJ Hospital Mangaluru trauma request finds compatible local donor and excludes out-of-radius donor', () => {
  const ajRequest = request({ hospitalId: 'hosp_aj_02', hospitalName: 'AJ Hospital & Research Centre', hospitalLocation: { latitude: 12.8988, longitude: 74.8562 }, bloodGroup: 'A+', radiusKm: 20 });
  const local = donor({ id: 'local-a', bloodGroup: 'A+', coordinates: { latitude: 12.899, longitude: 74.857 } });
  const far = donor({ id: 'far-o', coordinates: { latitude: 13.35, longitude: 74.78 } });
  assert.deepEqual(findCandidates(ajRequest, [local, far]).map((match) => match.donor.id), ['local-a']);
});

test('matching rejects deferred, expired-certificate, recent-donation, incompatible and component-ineligible donors', () => {
  const base = donor(); const yesterday = new Date(Date.now() - 86400000).toISOString();
  const candidates = findCandidates(request(), [
    base,
    donor({ id: 'deferred', eligibilityStatus: 'temporary_deferral', deferralUntil: new Date(Date.now() + 86400000).toISOString() }),
    donor({ id: 'expired', verification: { ...base.verification, expiryDate: yesterday } }),
    donor({ id: 'recent', lastDonationDate: yesterday }),
    donor({ id: 'incompatible', bloodGroup: 'B+' }),
    donor({ id: 'wrong-component', bloodComponentEligibility: ['platelets'] }),
  ]);
  assert.deepEqual(candidates.map((match) => match.donor.id), ['donor-test']);
});

test('emergency-only availability is included for critical requests only', () => {
  const emergencyOnly = donor({ availabilityStatus: 'emergency_only' });
  assert.equal(findCandidates(request({ urgency: 'critical' }), [emergencyOnly]).length, 1);
  assert.equal(findCandidates(request({ urgency: 'standard' }), [emergencyOnly]).length, 0);
});

test('critical-only notification preference excludes non-critical requests', () => {
  const criticalDonor = donor({ notificationPreferences: { push: true, sms: true, whatsapp: true, criticalOnly: true } });
  assert.equal(findCandidates(request({ urgency: 'critical' }), [criticalDonor]).length, 1);
  assert.equal(findCandidates(request({ urgency: 'urgent' }), [criticalDonor]).length, 0);
  assert.equal(findCandidates(request({ urgency: 'standard' }), [criticalDonor]).length, 0);
});

test('trauma journey simulation dispatches, accepts, tracks, arrives, completes and awards badges', () => {
  const hospitalRequest = request({ unitsRequired: 1 });
  const candidate = findCandidates(hospitalRequest, [donor()])[0];
  assert.ok(candidate, 'eligible donor is selected for the dispatch');
  const now = Date.now();
  const alert: import('../types.js').Match = {
    id: 'match-sim', requestId: hospitalRequest.id, donorId: candidate.donor.id, distance: candidate.distance,
    score: candidate.score, rank: 1, status: 'alerted', alertedAt: new Date(now).toISOString(),
    alertExpiresAt: new Date(now + 120000).toISOString(), respondedAt: null, response: null,
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
  };
  const accepted = resolveDonorResponse(alert, hospitalRequest, 'accepted', 0, now + 1000);
  assert.equal(accepted.ok, true);
  if (!accepted.ok) return;
  assert.equal(accepted.matchPatch.status, 'accepted');
  assert.equal(accepted.requestStatus, 'matched');
  const enRoute = updateJourney({ ...alert, ...accepted.matchPatch }, hospitalRequest, { latitude: 13.36, longitude: 74.80 }, now + 2000);
  assert.equal(enRoute.matchPatch.status, 'en_route');
  assert.equal(enRoute.trackingActive, true);
  assert.ok(Number(enRoute.matchPatch.etaSeconds) > 0);
  const arrived = updateJourney({ ...alert, ...enRoute.matchPatch }, hospitalRequest, hospitalRequest.hospitalLocation, now + 3000);
  assert.equal(arrived.matchPatch.status, 'reached');
  assert.equal(arrived.matchPatch.donorCurrentLocation, null);
  assert.equal(arrived.trackingActive, false);
  const completion = completeDonation({ ...alert, ...arrived.matchPatch }, candidate.donor, now + 4000);
  assert.equal(completion.matchPatch.status, 'donated');
  assert.equal(completion.donorPatch.heroStats?.totalDonations, 1);
  assert.ok(completion.donorPatch.heroStats?.badges?.includes('life_pulse_hero'));
});

test('timed out alerts cannot be accepted', () => {
  const now = Date.now();
  const expired: import('../types.js').Match = {
    id: 'match-expired', requestId: 'req-test', donorId: 'donor-test', distance: 1, score: 100, rank: 1,
    status: 'alerted', alertedAt: new Date(now - 180000).toISOString(), alertExpiresAt: new Date(now - 60000).toISOString(),
    respondedAt: null, response: null, createdAt: new Date(now - 180000).toISOString(), updatedAt: new Date(now - 180000).toISOString(),
  };
  const result = resolveDonorResponse(expired, request(), 'accepted', 0, now);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.expire, true);
});
