import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { find } from '../utils/db.js';
import type { BloodRequest, Hospital, Match } from '../types.js';

const router = Router();
router.get('/:requestId', authenticate, async (req: AuthenticatedRequest, res) => {
  const request = (await find<BloodRequest>('bloodRequests', (item) => item.id === req.params.requestId));
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const hospital = (await find<Hospital>('hospitals', (item) => item.id === request.hospitalId));
  const isHospital = req.user!.role === 'admin' || req.user!.uid === hospital?.uid || req.user!.hospitalId === hospital?.id;
  const isMatchedDonor = (await find<Match>('matches', (match) => match.requestId === request.id && match.donorId === req.user!.donorId && ['accepted', 'en_route', 'reached', 'donated'].includes(match.status)));
  if (!isHospital && !isMatchedDonor) return res.status(403).json({ error: 'Forbidden' });
  res.json({ request });
});
export default router;
