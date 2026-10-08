import { Router } from 'express';
import { readJson } from '../utils/db.js';
import type { Donor } from '../types.js';

const router = Router();

router.get('/', (_req, res) => {
  const heroes = readJson<Donor>('donors')
    .filter((donor) => donor.publicHeroConsent === true && donor.eligibilityStatus === 'eligible' && donor.heroStats.totalDonations > 0)
    .map((donor) => ({
      id: donor.id,
      displayName: donor.fullName,
      district: donor.homeLocality.toLowerCase().includes('mangal') ? 'Dakshina Kannada' : 'Udupi',
      bloodGroup: donor.bloodGroup,
      donations: donor.heroStats.totalDonations,
      responses: donor.heroStats.totalEmergencyResponses,
      badges: donor.heroStats.badges,
    }))
    .sort((a, b) => b.donations - a.donations || a.displayName.localeCompare(b.displayName));
  res.json({ heroes });
});

export default router;
