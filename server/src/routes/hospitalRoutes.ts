import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { readJson, find, filter, insert, update } from '../utils/db.js';
import type { Hospital, BloodRequest, Match, Donor, BloodGroup, BloodComponent, User } from '../types.js';

const router = Router();

const BLOOD_COMPATIBILITY: Record<string, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
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
  res.json({ message: 'Hospital verification updated', hospital: updated });
});

// GET /api/hospitals/:id/requests - List requests for this hospital
router.get('/:id/requests', authenticate, (req, res) => {
  const requests = filter<BloodRequest>('bloodRequests', (r) => r.hospitalId === req.params.id);
  res.json(requests);
});

// POST /api/hospitals/:id/requests - Create emergency blood request & trigger matching
router.post('/:id/requests', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const hospital = find<Hospital>('hospitals', (h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

  const { bloodGroup, component, unitsRequired, urgency, radiusKm, patientInfo, contactPerson, requiredBy } = req.body;

  if (!bloodGroup || !unitsRequired) {
    return res.status(400).json({ error: 'Blood group and units required are mandatory' });
  }

  const requestId = `req_${uuidv4().substring(0, 8)}`;
  const searchRadius = Number(radiusKm) || 25;

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
    createdBy: req.user!.uid,
    contactPerson: contactPerson || hospital.bloodBankContact,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<BloodRequest>('bloodRequests', newRequest);

  // Run Matching Algorithm
  const compatibleBloodGroups = BLOOD_COMPATIBILITY[bloodGroup] || [bloodGroup];
  const allDonors = readJson<Donor>('donors');

  const candidates: { donor: Donor; distance: number; score: number }[] = [];

  for (const donor of allDonors) {
    // 1. Eligibility & Availability check
    if (donor.eligibilityStatus !== 'eligible') continue;
    if (donor.availabilityStatus === 'unavailable') continue;

    // 2. Compatibility check
    if (!compatibleBloodGroups.includes(donor.bloodGroup)) continue;

    // 3. Distance check
    const dist = calculateDistanceKm(
      hospital.coordinates.latitude,
      hospital.coordinates.longitude,
      donor.coordinates.latitude,
      donor.coordinates.longitude
    );
    if (dist > searchRadius) continue;

    // 4. Calculate Match Score
    let score = 100;
    score += Math.max(0, 40 - dist * 2);
    if (donor.heroStats.averageResponseTime < 600) score += 20;
    if (donor.availabilityStatus === 'available') score += 10;
    if (donor.bloodComponentEligibility.includes(newRequest.component)) score += 10;

    candidates.push({ donor, distance: dist, score: Math.round(score) });
  }

  // Sort by score descending and take top matches
  candidates.sort((a, b) => b.score - a.score);
  const topMatches = candidates.slice(0, newRequest.unitsRequired * 5);

  const createdMatches: Match[] = [];
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    insert<Match>('matches', match);
    createdMatches.push(match);
  });

  res.status(201).json({
    request: newRequest,
    matchedCount: createdMatches.length,
    matches: createdMatches,
  });
});

// GET /api/hospitals/:id/requests/:requestId/matches - Get matches for a request
router.get('/:id/requests/:requestId/matches', authenticate, (req, res) => {
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
            phone: donor.phone,
            homeLocality: donor.homeLocality,
            heroStats: donor.heroStats,
            verification: donor.verification,
          }
        : null,
    };
  });

  res.json(detailedMatches);
});

export default router;

