import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { readJson, insert } from '../utils/db.js';
import type { AuditLog, BloodRequest, Donor, Hospital, Match, User } from '../types.js';
import { getSystemConfig, updateSystemConfig } from '../services/configService.js';

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

router.get('/audit-logs', (_req, res) => {
  const logs = readJson<AuditLog>('auditLogs').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100);
  res.json({ logs });
});

// GET /api/admin/config - Get current matching & escalation config
router.get('/config', (_req, res) => {
  res.json(getSystemConfig());
});

// PUT /api/admin/config - Update matching & escalation config
router.put('/config', (req, res) => {
  const updated = updateSystemConfig(req.body);
  insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: 'admin',
    actorRole: 'admin',
    action: 'system_config.updated',
    entityType: 'systemConfig',
    entityId: 'global',
    details: updated as any,
    createdAt: new Date().toISOString(),
  });
  res.json({ message: 'System configuration updated', config: updated });
});

// GET /api/admin/users - User directory
router.get('/users', (_req, res) => {
  const users = readJson<User>('users').map(({ ...u }) => ({
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
router.get('/reports/export', (_req, res) => {
  const logs = readJson<AuditLog>('auditLogs').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
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
  res.setHeader('Content-Disposition', 'attachment; filename="lifepulse-audit-logs.csv"');
  res.send(csvContent);
});

// POST /api/admin/flags - Report or flag suspicious activity / misuse
router.post('/flags', (req: AuthenticatedRequest, res) => {
  const { reason, entityType, entityId, notes } = req.body;
  if (!reason || !entityType || !entityId) {
    return res.status(400).json({ error: 'reason, entityType, and entityId are required' });
  }
  const flagId = `flag_${uuidv4().slice(0, 8)}`;
  insert<AuditLog>('auditLogs', {
    id: `audit_${uuidv4().slice(0, 10)}`,
    actorUid: req.user!.uid,
    actorRole: req.user!.role,
    action: 'suspicious_activity.flagged',
    entityType,
    entityId,
    details: { flagId, reason, notes },
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ message: 'Suspicious activity recorded and audited', flagId });
});

// GET /api/admin/history - Network-wide dispatch & donation fulfillment history
router.get('/history', (_req, res) => {
  const requests = readJson<BloodRequest>('bloodRequests');
  const matches = readJson<Match>('matches');
  const donors = readJson<Donor>('donors');
  const hospitals = readJson<Hospital>('hospitals');

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
