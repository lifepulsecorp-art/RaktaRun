import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { readJson, insert, find, update, remove } from '../utils/db.js';
import type { AuditLog, BloodRequest, Donor, Hospital, Match, User, BuddyReferral, BlockedEmail } from '../types.js';
import { getSystemConfig, updateSystemConfig } from '../services/configService.js';
import firebaseAdmin from '../utils/firebaseAdmin.js';
import { reviewCertificateWithAi } from '../services/certificateAiReview.js';
import { downloadCertificate } from '../utils/supabase.js';

const router = Router();
router.use(authenticate, authorizeRoles('admin'));

router.get('/donors/:donorId/certificate', async (req, res) => {
  const donor = (await find<Donor>('donors', (item) => item.id === req.params.donorId));
  const objectPath = donor?.verification?.certificateFileName;
  if (!objectPath || !objectPath.startsWith('certificates/') || objectPath.includes('..')) {
    return res.status(404).json({ error: 'Certificate document was not found.' });
  }

  let file: Buffer;
  try {
    file = await downloadCertificate(objectPath);
  } catch (error) {
    console.error('[CERTIFICATE DOWNLOAD]', error);
    return res.status(404).json({ error: 'Certificate document is not available in storage.' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', objectPath.endsWith('.png') ? 'image/png' : objectPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
  return res.send(file);
});

router.post('/donors/:donorId/review-certificate', async (req: AuthenticatedRequest, res) => {
  const donor = (await find<Donor>('donors', (item) => item.id === req.params.donorId));
  const objectPath = donor?.verification?.certificateFileName;
  if (!donor || !objectPath || !objectPath.startsWith('certificates/') || objectPath.includes('..')) {
    return res.status(404).json({ error: 'Donor certificate was not found.' });
  }
  let file: Buffer;
  try {
    file = await downloadCertificate(objectPath);
  } catch (error) {
    console.error('[CERTIFICATE REVIEW DOWNLOAD]', error);
    return res.status(404).json({ error: 'Certificate document is not available in storage.' });
  }

  const aiReview = await reviewCertificateWithAi({
    file,
    fileName: objectPath.split('/').at(-1) || 'certificate',
    donorName: donor.fullName,
    bloodGroup: donor.bloodGroup,
    hospitalName: donor.verification.hospitalName,
  });
  const updated = (await update<Donor>('donors', donor.id, {
    verification: { ...donor.verification, aiReview },
  }));
  (await insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: req.user!.uid,
    actorRole: req.user!.role,
    action: 'donor.certificate_ai_reviewed',
    entityType: 'donor',
    entityId: donor.id,
    details: { status: aiReview.status, summary: aiReview.summary },
    createdAt: new Date().toISOString(),
  }));
  return res.json({ message: 'AI certificate review completed.', aiReview, donor: updated });
});

router.get('/telemetry', async (_req, res) => {
  const requests = (await readJson<BloodRequest>('bloodRequests'));
  const matches = (await readJson<Match>('matches'));
  const donors = (await readJson<Donor>('donors'));
  const hospitals = (await readJson<Hospital>('hospitals'));
  res.json({
    districts: ['Udupi', 'Dakshina Kannada'],
    totals: {
      hospitals: hospitals.filter((hospital) => hospital.verificationStatus === 'verified').length,
      verifiedDonors: donors.filter((donor) => donor.eligibilityStatus === 'eligible').length,
      activeRequests: requests.filter((request) => ['searching', 'matched'].includes(request.status)).length,
      fulfilledRequests: requests.filter((request) => request.status === 'fulfilled').length,
      unfulfilledRequests: requests.filter((request) => request.status === 'unfulfilled').length,
      donorsEnRoute: matches.filter((match) => match.status === 'en_route').length,
      completedDonations: matches.filter((match) => match.status === 'donated').length,
    },
    byDistrict: ['Udupi', 'Dakshina Kannada'].map((district) => {
      const hospitalIds = new Set(hospitals.filter((hospital) => hospital.district === district).map((hospital) => hospital.id));
      return { district, activeRequests: requests.filter((request) => ['searching', 'matched'].includes(request.status) && hospitalIds.has(request.hospitalId)).length };
    }),
  });
});

router.get('/audit-logs', async (_req, res) => {
  const logs = (await readJson<AuditLog>('auditLogs')).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
  res.json({ logs });
});

router.get('/buddy-referrals', async (_req, res) => {
  const requests = (await readJson<BloodRequest>('bloodRequests'));
  const hospitals = (await readJson<Hospital>('hospitals'));
  const users = (await readJson<User>('users'));
  const referrals = (await readJson<BuddyReferral>('buddyReferrals'))
    .filter((referral) => referral.hospitalReport)
    .sort((a, b) => Date.parse(b.hospitalReport?.reportedAt || b.createdAt) - Date.parse(a.hospitalReport?.reportedAt || a.createdAt))
    .map((referral) => ({
      ...referral,
      request: requests.find((request) => request.id === referral.requestId),
      hospital: hospitals.find((hospital) => hospital.id === referral.hospitalReport?.hospitalId),
      referrer: (() => {
        const user = users.find((entry) => entry.uid === referral.referrerUid);
        return user ? { uid: user.uid, name: user.name, email: user.email, trustStatus: user.trustStatus || 'clear' } : null;
      })(),
    }));
  res.json({ referrals });
});

router.post('/buddy-referrals/:referralId/review', async (req: AuthenticatedRequest, res) => {
  const { decision, notes } = req.body || {};
  if (!['dismissed', 'confirmed', 'delete_and_block'].includes(decision)) {
    return res.status(400).json({ error: 'Choose dismissed, confirmed, or delete_and_block.' });
  }
  const referral = (await find<BuddyReferral>('buddyReferrals', (item) => item.id === req.params.referralId));
  if (!referral?.hospitalReport) return res.status(404).json({ error: 'A hospital report is required before review.' });
  if (referral.adminReview) return res.status(409).json({ error: 'This report has already been reviewed.' });
  const referrer = (await find<User>('users', (user) => user.uid === referral.referrerUid));
  if (!referrer) return res.status(404).json({ error: 'Referrer account was not found.' });

  if (decision === 'delete_and_block') {
    if (!referrer.email) return res.status(409).json({ error: 'This account has no email address to block.' });
    const email = referrer.email.trim().toLowerCase();
    const blocked = (await readJson<BlockedEmail>('blockedEmails'));
    if (!blocked.some((entry) => entry.email === email)) {
      (await insert<BlockedEmail>('blockedEmails', {
        email,
        reason: 'Account removed after admin review of a hospital buddy-referral report.',
        blockedAt: new Date().toISOString(),
        blockedBy: req.user!.uid,
        deletedUid: referrer.uid,
      }));
    }
    (await update<BuddyReferral>('buddyReferrals', referral.id, {
      adminReview: {
        decision: 'confirmed',
        notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : 'Account removed and email blocked by administrator.',
        reviewedBy: req.user!.uid,
        reviewedAt: new Date().toISOString(),
      },
    }));
    const donor = (await find<Donor>('donors', (item) => item.uid === referrer.uid));
    if (donor) (await remove<Donor>('donors', donor.id));
    (await remove<User>('users', referrer.uid));
    if (firebaseAdmin.apps.length) {
      try {
        await firebaseAdmin.auth().deleteUser(referrer.uid);
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found' && error.code !== 'auth/invalid-uid') {
          console.warn('[BUDDY ACCOUNT REMOVAL] Firebase account removal did not complete:', error.message);
        }
      }
    }
    (await insert<AuditLog>('auditLogs', {
      id: `audit_${uuidv4().slice(0, 10)}`,
      actorUid: req.user!.uid,
      actorRole: 'admin',
      action: 'buddy_referral.referrer_deleted_email_blocked',
      entityType: 'user',
      entityId: referrer.uid,
      details: { email, referralId: referral.id, reportId: referral.hospitalReport.id },
      createdAt: new Date().toISOString(),
    }));
    return res.json({ message: 'Referrer account removed and email blocked from creating a RaktaRun account.' });
  }

  const review = {
    decision: decision as 'dismissed' | 'confirmed',
    notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : undefined,
    reviewedBy: req.user!.uid,
    reviewedAt: new Date().toISOString(),
  };
  (await update<BuddyReferral>('buddyReferrals', referral.id, { adminReview: review }));
  if (decision === 'confirmed') {
    (await update<User>('users', referrer.uid, { trustStatus: 'flagged' }));
  } else {
    const otherReports = (await readJson<BuddyReferral>('buddyReferrals')).filter((entry) =>
      entry.referrerUid === referrer.uid && entry.id !== referral.id && entry.hospitalReport
    );
    const hasConfirmedConcern = otherReports.some((entry) => entry.adminReview?.decision === 'confirmed');
    const hasOpenReport = otherReports.some((entry) => !entry.adminReview);
    (await update<User>('users', referrer.uid, { trustStatus: hasConfirmedConcern ? 'flagged' : hasOpenReport ? 'under_review' : 'clear' }));
  }
  (await insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: req.user!.uid,
    actorRole: 'admin',
    action: decision === 'confirmed' ? 'buddy_referral.concern_confirmed' : 'buddy_referral.report_dismissed',
    entityType: 'buddyReferral',
    entityId: referral.id,
    details: { referrerUid: referrer.uid, notes: review.notes },
    createdAt: new Date().toISOString(),
  }));
  res.json({ message: decision === 'confirmed' ? 'Concern confirmed and referrer flagged for review.' : 'Hospital report dismissed.' });
});

// GET /api/admin/config - Get current matching & escalation config
router.get('/config', async (_req, res) => {
  res.json(await getSystemConfig());
});

// PUT /api/admin/config - Update matching & escalation config
router.put('/config', async (req, res) => {
  const updated = await updateSystemConfig(req.body);
  (await insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: 'admin',
    actorRole: 'admin',
    action: 'system_config.updated',
    entityType: 'systemConfig',
    entityId: 'global',
    details: updated as any,
    createdAt: new Date().toISOString(),
  }));
  res.json({ message: 'System configuration updated', config: updated });
});

// GET /api/admin/users - User directory
router.get('/users', async (_req, res) => {
  const users = (await readJson<User>('users')).map(({ ...u }) => ({
    uid: u.uid,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    hospitalId: u.hospitalId,
    donorId: u.donorId,
    createdAt: u.createdAt,
  }));
  res.json({ users });
});

// GET /api/admin/reports/export - Export audit logs as CSV
router.get('/reports/export', async (_req, res) => {
  const logs = (await readJson<AuditLog>('auditLogs')).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const headers = ['id', 'createdAt', 'actorRole', 'actorUid', 'action', 'entityType', 'entityId', 'details'];
  const rows = logs.map((l) => [
    l.id,
    l.createdAt,
    l.actorRole,
    l.actorUid,
    l.action,
    l.entityType,
    l.entityId,
    JSON.stringify(l.details || {}).replace(/"/g, '""'),
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.map((f) => `"${f}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="raktarun-audit-logs.csv"');
  res.send(csvContent);
});

// POST /api/admin/flags - Report or flag suspicious activity / misuse
router.post('/flags', async (req: AuthenticatedRequest, res) => {
  const { reason, entityType, entityId, notes } = req.body;
  if (!reason || !entityType || !entityId) {
    return res.status(400).json({ error: 'reason, entityType, and entityId are required' });
  }
  const flagId = `flag_${uuidv4().slice(0, 8)}`;
  (await insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: req.user!.uid,
    actorRole: req.user!.role,
    action: 'suspicious_activity.flagged',
    entityType,
    entityId,
    details: { flagId, reason, notes },
    createdAt: new Date().toISOString(),
  }));
  res.status(201).json({ message: 'Suspicious activity recorded and audited', flagId });
});

// GET /api/admin/history - Network-wide dispatch & donation fulfillment history
router.get('/history', async (_req, res) => {
  const requests = (await readJson<BloodRequest>('bloodRequests'));
  const matches = (await readJson<Match>('matches'));
  const donors = (await readJson<Donor>('donors'));
  const hospitals = (await readJson<Hospital>('hospitals'));

  const history = requests.map((r) => {
    const hosp = hospitals.find((h) => h.id === r.hospitalId);
    const reqMatches = matches.filter((m) => m.requestId === r.id);
    const donatedMatches = reqMatches.filter((m) => m.status === 'donated');
    const acceptedMatches = reqMatches.filter((m) => ['accepted', 'en_route', 'reached', 'donated'].includes(m.status));

    return {
      id: r.id,
      hospitalId: r.hospitalId,
      hospitalName: r.hospitalName || hosp?.name || 'Hospital',
      district: hosp?.district || 'Coastal Karnataka',
      bloodGroup: r.bloodGroup,
      component: r.component,
      unitsRequired: r.unitsRequired,
      unitsDonated: donatedMatches.length,
      urgency: r.urgency,
      status: r.status,
      createdAt: r.createdAt,
      requiredBy: r.requiredBy,
      totalAlerted: reqMatches.length,
      totalAccepted: acceptedMatches.length,
      donors: donatedMatches.map((m) => {
        const d = donors.find((donor) => donor.id === m.donorId);
        return {
          donorId: m.donorId,
          fullName: d?.fullName || 'Verified Donor',
          bloodGroup: d?.bloodGroup,
          donatedAt: m.donationCompletedAt || m.updatedAt,
        };
      }),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    summary: {
      totalDispatches: requests.length,
      fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
      unfulfilled: requests.filter((r) => r.status === 'unfulfilled').length,
      active: requests.filter((r) => ['searching', 'matched'].includes(r.status)).length,
      totalDonations: matches.filter((m) => m.status === 'donated').length,
    },
    history,
  });
});

export default router;
