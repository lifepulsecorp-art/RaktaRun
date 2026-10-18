import { Router } from 'express';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeRoles, type AuthenticatedRequest } from '../middleware/auth.js';
import type { BloodRequest, BuddyLink, BuddyReferral, Donor, Match } from '../types.js';
import { find, filter, insert } from '../utils/db.js';

const router = Router();
const MAX_INTERESTS_PER_LINK = 8;

async function getActiveLink(token: string): Promise<{ link: BuddyLink; request: BloodRequest } | null> {
  const link = (await find<BuddyLink>('buddyLinks', (item) => item.token === token));
  if (!link || Date.parse(link.expiresAt) <= Date.now()) return null;
  const request = (await find<BloodRequest>('bloodRequests', (item) => item.id === link.requestId));
  if (!request || !['searching', 'matched'].includes(request.status)) return null;
  return { link, request };
}

// A referred friend can see the emergency destination without an account.
// Only the hospital and public request details needed to plan a visit are returned.
router.get('/:token', async (req, res) => {
  const active = await getActiveLink(req.params.token);
  if (!active) return res.status(410).json({ error: 'This buddy link has expired or the emergency request has closed.' });
  const { request } = active;
  res.json({
    request: {
      id: request.id,
      bloodGroup: request.bloodGroup,
      component: request.component,
      urgency: request.urgency,
      requiredBy: request.requiredBy,
      status: request.status,
    },
    hospital: {
      id: request.hospitalId,
      name: request.hospitalName,
      address: (await find<{ id: string; address?: string }>('hospitals', (hospital) => hospital.id === request.hospitalId))?.address || '',
      coordinates: request.hospitalLocation,
    },
    expiresAt: active.link.expiresAt,
  });
});

// This is an interest form, not a medical clearance or donation confirmation.
router.post('/:token/interest', async (req, res) => {
  const active = await getActiveLink(req.params.token);
  if (!active) return res.status(410).json({ error: 'This buddy link has expired or the emergency request has closed.' });

  const friendName = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
  const phoneDigits = typeof req.body?.phone === 'string' ? req.body.phone.replace(/\D/g, '') : '';
  const phone = phoneDigits.length === 12 && phoneDigits.startsWith('91') ? phoneDigits.slice(2) : phoneDigits;
  if (friendName.length < 2 || friendName.length > 80) {
    return res.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
  }
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid 10-digit Indian phone number.' });
  if (req.body?.consent !== true) return res.status(400).json({ error: 'Please agree to be contacted by the hospital about this request.' });

  const { link, request } = active;
  const leads = (await filter<BuddyReferral>('buddyReferrals', (lead) => lead.linkId === link.id));
  if (leads.length >= MAX_INTERESTS_PER_LINK) {
    return res.status(429).json({ error: 'This invite has reached its response limit.' });
  }
  if (leads.some((lead) => lead.friendPhone.replace(/\D/g, '').endsWith(phone))) {
    return res.status(409).json({ error: 'This phone number has already responded to this invite.' });
  }

  const referral: BuddyReferral = {
    id: `buddy_${uuidv4().slice(0, 12)}`,
    linkId: link.id,
    requestId: request.id,
    matchId: link.matchId,
    donorId: link.donorId,
    referrerUid: link.referrerUid,
    friendName,
    friendPhone: `+91${phone}`,
    status: 'interest_received',
    createdAt: new Date().toISOString(),
  };
  (await insert<BuddyReferral>('buddyReferrals', referral));

  res.status(201).json({
    message: 'Your interest has been shared with the hospital. Staff will confirm availability and complete all required screening before any donation.',
    referralId: referral.id,
  });
});

// Authenticated donors create a high-entropy, expiring link tied to their active alert.
router.post('/matches/:matchId/link', authenticate, authorizeRoles('donor'), async (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'donor') return res.status(403).json({ error: 'Only a donor can invite a buddy.' });
  const match = (await find<Match>('matches', (item) => item.id === req.params.matchId));
  if (!match) return res.status(404).json({ error: 'Alert was not found.' });
  const donor = (await find<Donor>('donors', (item) => item.id === match.donorId));
  if (!donor || donor.uid !== req.user!.uid) return res.status(403).json({ error: 'This alert belongs to another donor.' });
  if (!['alerted', 'accepted', 'en_route'].includes(match.status)) {
    return res.status(409).json({ error: 'Buddy invites are available only for an active emergency alert.' });
  }
  if (match.status === 'alerted' && Date.parse(match.alertExpiresAt || match.alertedAt || '') <= Date.now()) {
    return res.status(409).json({ error: 'This emergency alert has expired.' });
  }
  const request = (await find<BloodRequest>('bloodRequests', (item) => item.id === match.requestId));
  if (!request || !['searching', 'matched'].includes(request.status)) {
    return res.status(409).json({ error: 'This emergency request is closed.' });
  }

  const link: BuddyLink = {
    id: `buddy_link_${uuidv4().slice(0, 10)}`,
    token: randomBytes(32).toString('base64url'),
    requestId: request.id,
    matchId: match.id,
    donorId: donor.id,
    referrerUid: req.user!.uid,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  (await insert<BuddyLink>('buddyLinks', link));
  res.status(201).json({ token: link.token, expiresAt: link.expiresAt });
});

export default router;
