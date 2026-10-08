import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { readJson, find, filter, insert, update } from '../utils/db.js';
import type { Hospital, BloodRequest, Match, Donor, BloodGroup, BloodComponent, User, AuditLog } from '../types.js';
import { findCandidates } from '../services/matching.js';
import { completeDonation } from '../services/journey.js';
import { getSystemConfig } from '../services/configService.js';

const router = Router();

function audit(req: AuthenticatedRequest, action: string, entityType: string, entityId: string, details?: Record<string, unknown>) {
  insert<AuditLog>('auditLogs', { id: `audit_${uuidv4().slice(0, 10)}`, actorUid: req.user!.uid, actorRole: req.user!.role, action, entityType, entityId, details, createdAt: new Date().toISOString() });
}

// GET /api/hospitals - List hospitals
router.get('/', (req, res) => {
  const hospitals = readJson<Hospital>('hospitals');
  res.json(hospitals);
});

// GET /api/hospitals/:id - Hospital details
router.get('/:id', (req, res) => {
  const hospital = find<Hospital>('hospitals', (h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  res.json(hospital);
});

// POST /api/hospitals - Register a hospital
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const { name, address, district, coordinates, bloodBankContact, licenseNumber, registrationNumber } = req.body;

  if (!name || !address || !district || !coordinates || !bloodBankContact || !licenseNumber) {
    return res.status(400).json({ error: 'Missing required hospital fields' });
  }

  const newHospital: Hospital = {
    id: `hosp_${uuidv4().substring(0, 8)}`,
    uid: req.user?.uid,
    name,
    address,
    district,
    coordinates,
    verificationStatus: 'pending',
    bloodBankContact,
    licenseNumber,
    registrationNumber: registrationNumber || `REG-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<Hospital>('hospitals', newHospital);
  res.status(201).json(newHospital);
});

// POST /api/hospitals/register - Self-service registration from public onboarding
router.post('/register', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    name,
    registrationNumber,
    address,
    locality,
    pincode,
    contactPerson,
    bloodBankContact,
    location,
  } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Hospital name and address are required' });
  }

  // Check if hospital already exists for this UID
  let existing = find<Hospital>('hospitals', (h) => h.uid === req.user!.uid);
  if (existing) {
    const updated = update<Hospital>('hospitals', existing.id, {
      name,
      registrationNumber: registrationNumber || existing.registrationNumber,
      address: `${address}, ${locality || ''} - ${pincode || ''}`.trim(),
    });
    return res.status(200).json({ hospital: updated || existing });
  }

  const hospitalId = `hosp_${uuidv4().substring(0, 8)}`;
  const district = locality?.toLowerCase().includes('mangal') ? 'Dakshina Kannada' : 'Udupi';

  const newHospital: Hospital = {
    id: hospitalId,
    uid: req.user!.uid,
    name,
    address: `${address}, ${locality || ''} ${pincode ? '- ' + pincode : ''}`.trim(),
    district,
    coordinates: {
      latitude: location?.latitude || 13.3524,
      longitude: location?.longitude || 74.7927,
    },
    verificationStatus: 'pending',
    bloodBankContact: {
      name: bloodBankContact?.name || contactPerson?.name || 'Blood Bank In-Charge',
      phone: bloodBankContact?.phone || contactPerson?.phone || '',
      email: req.user!.email || '',
    },
    licenseNumber: registrationNumber || `LIC-${Date.now().toString().slice(-4)}`,
    registrationNumber: registrationNumber || `REG-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<Hospital>('hospitals', newHospital);
  update<User>('users', req.user!.uid, { hospitalId: newHospital.id, role: 'hospital', name });

  res.status(201).json({ hospital: newHospital });
});

// PUT /api/hospitals/:id - Update hospital profile
router.put('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const hospital = find<Hospital>('hospitals', (h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  // Only allow admin or the hospital themselves
  if (req.user?.role !== 'admin' && req.user?.uid !== hospital.uid && req.user?.hospitalId !== hospital.id) {
    return res.status(403).json({ error: 'Forbidden: Cannot update this hospital' });
  }

  const { name, address, district, coordinates, bloodBankContact, licenseNumber, registrationNumber } = req.body;
  const patch: Partial<Hospital> = {};
  if (name) patch.name = name;
  if (address) patch.address = address;
  if (district) patch.district = district;
  if (coordinates) patch.coordinates = coordinates;
  if (bloodBankContact) patch.bloodBankContact = bloodBankContact;
  if (licenseNumber) patch.licenseNumber = licenseNumber;
  if (registrationNumber) patch.registrationNumber = registrationNumber;

  const updated = update<Hospital>('hospitals', hospital.id, patch);
  res.json({ message: 'Hospital profile updated', hospital: updated });
});

// PUT /api/hospitals/:id/verify - Admin verifies hospital
router.put('/:id/verify', authenticate, authorizeRoles('admin'), (req: AuthenticatedRequest, res) => {
  const { status } = req.body; // 'verified' | 'rejected'
  const updated = update<Hospital>('hospitals', req.params.id, {
    verificationStatus: status || 'verified',
    verifiedBy: req.user?.uid,
    verifiedAt: new Date().toISOString(),
  });

  if (!updated) return res.status(404).json({ error: 'Hospital not found' });
  insert<AuditLog>('auditLogs', { id: `audit_${uuidv4().slice(0, 10)}`, actorUid: req.user!.uid, actorRole: req.user!.role, action: 'hospital.accreditation_updated', entityType: 'hospital', entityId: updated.id, details: { status: updated.verificationStatus }, createdAt: new Date().toISOString() });
  res.json({ message: 'Hospital verification updated', hospital: updated });
});

// GET /api/hospitals/:id/requests - List requests for this hospital
router.get('/:id/requests', authenticate, (req: AuthenticatedRequest, res) => {
  const hospital = find<Hospital>('hospitals', (h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  if (req.user!.role !== 'admin' && hospital.uid !== req.user!.uid && req.user!.hospitalId !== hospital.id) return res.status(403).json({ error: 'Forbidden' });
  const requests = filter<BloodRequest>('bloodRequests', (r) => r.hospitalId === req.params.id);
  res.json(requests);
});

// POST /api/hospitals/:id/requests - Create emergency blood request & trigger matching
router.post('/:id/requests', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const hospital = find<Hospital>('hospitals', (h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
  if (req.user!.role !== 'admin' && hospital.uid !== req.user!.uid && req.user!.hospitalId !== hospital.id) return res.status(403).json({ error: 'Forbidden: cannot dispatch for this hospital' });
  if (hospital.verificationStatus !== 'verified') return res.status(403).json({ error: 'Hospital accreditation must be verified before dispatch' });

  const { bloodGroup, component, unitsRequired, urgency, radiusKm, patientInfo, contactPerson, requiredBy } = req.body;

  const validGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const validComponents: BloodComponent[] = ['whole_blood', 'RBC', 'platelets', 'plasma'];
  if (!validGroups.includes(bloodGroup) || !Number.isInteger(Number(unitsRequired)) || Number(unitsRequired) < 1 || Number(unitsRequired) > 10) {
    return res.status(400).json({ error: 'Choose a valid blood group and request between 1 and 10 units' });
  }
  if (component && !validComponents.includes(component)) return res.status(400).json({ error: 'Invalid blood component' });
  if (urgency && !['critical', 'urgent', 'standard'].includes(urgency)) return res.status(400).json({ error: 'Invalid urgency' });

  const requestId = `req_${uuidv4().substring(0, 8)}`;
  const searchRadius = Math.min(50, Math.max(5, Number(radiusKm) || 25));

  const newRequest: BloodRequest = {
    id: requestId,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    hospitalLocation: hospital.coordinates,
    patientInfo: patientInfo || {},
    bloodGroup,
    component: component || 'whole_blood',
    unitsRequired: Number(unitsRequired) || 1,
    urgency: urgency || 'critical',
    requiredBy: requiredBy || new Date(Date.now() + 1000 * 3600 * 4).toISOString(),
    radiusKm: searchRadius,
    status: 'searching',
    escalationLevel: 0,
    lastEscalatedAt: null,
    createdBy: req.user!.uid,
    contactPerson: contactPerson || hospital.bloodBankContact,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<BloodRequest>('bloodRequests', newRequest);

  const candidates = findCandidates(newRequest, readJson<Donor>('donors'));
  const topMatches = candidates.slice(0, newRequest.unitsRequired * 5);
  const createdMatches: Match[] = [];
  const config = getSystemConfig();
  topMatches.forEach((c, index) => {
      const match: Match = {
        id: `match_${uuidv4().substring(0, 8)}`,
        requestId,
        donorId: c.donor.id,
        distance: c.distance,
        score: c.score,
        rank: index + 1,
        status: 'alerted',
        alertedAt: new Date().toISOString(),
        respondedAt: null,
        response: null,
        alertExpiresAt: new Date(Date.now() + config.alertTimeoutSeconds * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insert<Match>('matches', match);
      createdMatches.push(match);
    });

  audit(req, 'request.dispatched', 'bloodRequest', requestId, { matchedCount: createdMatches.length, radiusKm: searchRadius });

  res.status(201).json({
    request: newRequest,
    matchedCount: createdMatches.length,
    matches: createdMatches,
  });
});

// GET /api/hospitals/:id/requests/:requestId/matches - Get matches for a request
router.get('/:id/requests/:requestId/matches', authenticate, (req, res) => {
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === req.params.requestId && r.hospitalId === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const hospital = find<Hospital>('hospitals', (h) => h.id === request.hospitalId);
  const authReq = req as AuthenticatedRequest;
  if (authReq.user!.role !== 'admin' && authReq.user!.uid !== hospital?.uid && authReq.user!.hospitalId !== hospital?.id) return res.status(403).json({ error: 'Forbidden' });
  const matches = filter<Match>('matches', (m) => m.requestId === req.params.requestId);
  const donors = readJson<Donor>('donors');

  const detailedMatches = matches.map((m) => {
    const donor = donors.find((d) => d.id === m.donorId);
    return {
      ...m,
      donor: donor
        ? {
            id: donor.id,
            fullName: donor.fullName,
            bloodGroup: donor.bloodGroup,
            homeLocality: donor.homeLocality,
            heroStats: donor.heroStats,
            verification: donor.verification,
          }
        : null,
    };
  });

  res.json(detailedMatches);
});

router.post('/:id/requests/:requestId/cancel', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === req.params.requestId && r.hospitalId === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const hospital = find<Hospital>('hospitals', (h) => h.id === request.hospitalId);
  if (req.user!.role !== 'admin' && req.user!.uid !== hospital?.uid && req.user!.hospitalId !== hospital?.id) return res.status(403).json({ error: 'Forbidden' });
  if (['fulfilled', 'cancelled'].includes(request.status)) return res.status(409).json({ error: 'Request is already closed' });
  update<BloodRequest>('bloodRequests', request.id, { status: 'cancelled' });
  readJson<Match>('matches').filter((m) => m.requestId === request.id && !['donated', 'reached'].includes(m.status)).forEach((m) => update<Match>('matches', m.id, { status: 'cancelled', donorCurrentLocation: null, etaSeconds: null, distanceRemaining: null }));
  audit(req, 'request.cancelled', 'bloodRequest', request.id);
  res.json({ message: 'Request cancelled' });
});

router.post('/:id/requests/:requestId/matches/:matchId/complete', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === req.params.requestId && r.hospitalId === req.params.id);
  const hospital = request && find<Hospital>('hospitals', (h) => h.id === request.hospitalId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (req.user!.role !== 'admin' && req.user!.uid !== hospital?.uid && req.user!.hospitalId !== hospital?.id) return res.status(403).json({ error: 'Forbidden' });
  const match = find<Match>('matches', (m) => m.id === req.params.matchId && m.requestId === request.id);
  if (!match || !['accepted', 'en_route', 'reached'].includes(match.status)) return res.status(409).json({ error: 'Only an accepted donor can be marked as donated' });
  const donor = find<Donor>('donors', (d) => d.id === match.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  const completion = completeDonation(match, donor);
  const updated = update<Match>('matches', match.id, completion.matchPatch);
  update<Donor>('donors', donor.id, completion.donorPatch);
  const stillNeeded = filter<Match>('matches', (m) => m.requestId === request.id && m.status === 'donated').length;
  if (stillNeeded >= request.unitsRequired) update<BloodRequest>('bloodRequests', request.id, { status: 'fulfilled' });
  audit(req, 'donation.completed', 'match', match.id, { requestId: request.id });
  res.json({ message: 'Donation marked complete; location sharing stopped', match: updated });
});

router.post('/:id/requests/:requestId/unfulfilled', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === req.params.requestId && r.hospitalId === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const hospital = find<Hospital>('hospitals', (h) => h.id === request.hospitalId);
  if (req.user!.role !== 'admin' && req.user!.uid !== hospital?.uid && req.user!.hospitalId !== hospital?.id) return res.status(403).json({ error: 'Forbidden' });
  if (['fulfilled', 'cancelled', 'unfulfilled'].includes(request.status)) return res.status(409).json({ error: 'Request is already closed' });
  update<BloodRequest>('bloodRequests', request.id, { status: 'unfulfilled' });
  readJson<Match>('matches').filter((m) => m.requestId === request.id && !['donated'].includes(m.status)).forEach((m) => update<Match>('matches', m.id, { status: 'expired', donorCurrentLocation: null, etaSeconds: null, distanceRemaining: null }));
  audit(req, 'request.unfulfilled', 'bloodRequest', request.id, { reason: reason || 'Donor quota not met within time window' });
  res.json({ message: 'Request recorded as unfulfilled', status: 'unfulfilled' });
});

export default router;

