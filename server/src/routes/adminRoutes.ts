import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { readJson } from '../utils/db.js';
import type { AuditLog, BloodRequest, Donor, Hospital, Match } from '../types.js';

const router = Router();
router.use(authenticate, authorizeRoles('admin'));

router.get('/telemetry', (_req, res) => {
  const requests = readJson<BloodRequest>('bloodRequests');
  const matches = readJson<Match>('matches');
  const donors = readJson<Donor>('donors');
  const hospitals = readJson<Hospital>('hospitals');
  res.json({
    districts: ['Udupi', 'Dakshina Kannada'],
    totals: {
      hospitals: hospitals.filter((hospital) => hospital.verificationStatus === 'verified').length,
      verifiedDonors: donors.filter((donor) => donor.eligibilityStatus === 'eligible').length,
      activeRequests: requests.filter((request) => ['searching', 'matched'].includes(request.status)).length,
      fulfilledRequests: requests.filter((request) => request.status === 'fulfilled').length,
      donorsEnRoute: matches.filter((match) => match.status === 'en_route').length,
      completedDonations: matches.filter((match) => match.status === 'donated').length,
    },
    byDistrict: ['Udupi', 'Dakshina Kannada'].map((district) => {
      const hospitalIds = new Set(hospitals.filter((hospital) => hospital.district === district).map((hospital) => hospital.id));
      return { district, activeRequests: requests.filter((request) => ['searching', 'matched'].includes(request.status) && hospitalIds.has(request.hospitalId)).length };
    }),
  });
});

router.get('/audit-logs', (_req, res) => {
  const logs = readJson<AuditLog>('auditLogs').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
  res.json({ logs });
});

export default router;
