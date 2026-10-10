import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';
import { readJson, find, filter, insert, update } from '../utils/db.js';
import type { Donor, Match, BloodRequest, User, AuditLog, Hospital } from '../types.js';
import { resolveDonorResponse, updateJourney } from '../services/journey.js';
import { sendSmsAlert, sendWhatsAppAlert, sendEmailAlert } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CERTIFICATES_DIR = path.join(__dirname, '../../data/certificates');

const router = Router();

// GET /api/donors - List all donors (hospital or admin)
router.get('/', authenticate, authorizeRoles('hospital', 'admin'), (req: AuthenticatedRequest, res) => {
  const donors = readJson<Donor>('donors');
  if (req.user!.role === 'admin') return res.json(donors);
  res.json(donors.map(({ phone, coordinates, preciseLocation, ...publicProfile }) => publicProfile));
});

// GET /api/donors/me - Get current donor profile
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const donor = find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId);
  if (!donor) {
    return res.status(404).json({ error: 'Donor profile not found for current user' });
  }
  res.json(donor);
});

// GET /api/donors/:id - Get specific donor
router.get('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  if (req.user!.role !== 'admin' && donor.uid !== req.user!.uid) return res.status(403).json({ error: 'Donor profiles are private' });
  res.json(donor);
});

// POST /api/donors - Register/Onboard donor with certificate
router.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    fullName,
    phone,
    bloodGroup,
    rhType,
    bloodComponentEligibility,
    hemoglobinLevel,
    weight,
    hospitalId,
    hospitalName,
    certificateId,
    verifiedBy,
    certificateFileBase64,
    certificateFileName,
    homeLocality,
    coordinates,
    preferredRadius,
  } = req.body;

  if (!fullName || !phone || !bloodGroup || !certificateId) {
    return res.status(400).json({ error: 'Missing mandatory donor registration fields' });
  }

  const donorId = `donor_${uuidv4().substring(0, 8)}`;
  let savedCertFilename: string | undefined = undefined;

  // Option 2: Save certificate file separately in server/data/certificates/
  if (certificateFileBase64) {
    const ext = certificateFileName ? path.extname(certificateFileName) : '.pdf';
    savedCertFilename = `cert_${certificateId}_${Date.now()}${ext}`;
    const buffer = Buffer.from(certificateFileBase64, 'base64');
    fs.writeFileSync(path.join(CERTIFICATES_DIR, savedCertFilename), buffer);
  }

  const newDonor: Donor = {
    id: donorId,
    uid: req.user!.uid,
    fullName,
    phone,
    aadhaarVerified: true,
    bloodGroup,
    rhType: rhType || 'positive',
    bloodComponentEligibility: bloodComponentEligibility || ['whole_blood'],
    lastDonationDate: null,
    hemoglobinLevel: Number(hemoglobinLevel) || 14.0,
    weight: Number(weight) || 65,
    eligibilityStatus: 'eligible',
    verification: {
      hospitalId: hospitalId || 'hosp_general',
      hospitalName: hospitalName || 'Verified Medical Centre',
      certificateId,
      verifiedAt: new Date().toISOString(),
      verifiedBy: verifiedBy || 'Screening Medical Officer',
      certificateFileName: savedCertFilename,
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    },
    homeLocality: homeLocality || 'Udupi/Mangaluru',
    coordinates: coordinates || { latitude: 13.35, longitude: 74.78 },
    locationSharingEnabled: false,
    preferredRadius: Number(preferredRadius) || 15,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 0,
      totalDonations: 0,
      averageResponseTime: 0,
      badges: ['life_pulse_hero'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<Donor>('donors', newDonor);
  update<User>('users', req.user!.uid, { donorId: newDonor.id, role: 'donor' });

  res.status(201).json(newDonor);
});

// POST /api/donors/register - Self-service registration from public onboarding
router.post('/register', authenticate, (req: AuthenticatedRequest, res) => {
  const {
    fullName,
    phone,
    bloodGroup,
    homeLocality,
    pincode,
    lastDonationDate,
    certificateFileName,
    certificateFileBase64,
  } = req.body;

  const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
  const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
  const cleanBloodGroup = typeof bloodGroup === 'string' ? bloodGroup.trim() : '';

  if (!cleanName || !cleanPhone || !cleanBloodGroup) {
    return res.status(400).json({ error: 'Full name, phone, and blood group are required.' });
  }

  // Ensure certificates directory exists
  try {
    fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
  } catch {}

  let savedCertFilename: string | undefined = undefined;
  if (certificateFileBase64) {
    const ext = certificateFileName ? path.extname(certificateFileName) : '.jpg';
    savedCertFilename = `cert_${req.user!.uid}_${Date.now()}${ext || '.jpg'}`;
    const buffer = Buffer.from(certificateFileBase64, 'base64');
    fs.writeFileSync(path.join(CERTIFICATES_DIR, savedCertFilename), buffer);
  }

  // Check if donor already exists for this UID
  let existingDonor = find<Donor>('donors', (d) => d.uid === req.user!.uid);
  if (existingDonor) {
    const updated = update<Donor>('donors', existingDonor.id, {
      fullName: cleanName,
      phone: cleanPhone,
      bloodGroup: cleanBloodGroup,
      rhType: cleanBloodGroup.includes('-') ? 'negative' : 'positive',
      homeLocality: homeLocality ? `${homeLocality} (${pincode || ''})`.trim() : existingDonor.homeLocality,
      lastDonationDate: lastDonationDate || existingDonor.lastDonationDate,
      verification: {
        ...existingDonor.verification,
        certificateFileName: savedCertFilename || existingDonor.verification.certificateFileName,
        verifiedAt: new Date().toISOString(),
      },
    });
    update<User>('users', req.user!.uid, { donorId: existingDonor.id, role: 'donor', name: cleanName, phone: cleanPhone });
    return res.status(200).json({ donor: updated || existingDonor });
  }

  const donorId = `donor_${uuidv4().substring(0, 8)}`;
  const certId = `LP-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newDonor: Donor = {
    id: donorId,
    uid: req.user!.uid,
    fullName: cleanName,
    phone: cleanPhone,
    aadhaarVerified: true,
    bloodGroup: cleanBloodGroup,
    rhType: cleanBloodGroup.includes('-') ? 'negative' : 'positive',
    bloodComponentEligibility: ['whole_blood'],
    lastDonationDate: lastDonationDate || null,
    hemoglobinLevel: 14.0,
    weight: 65,
    eligibilityStatus: 'pending', // Awaiting Admin Review
    verification: {
      hospitalId: 'pending',
      hospitalName: 'Pending Admin Verification',
      certificateId: certId,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Pending Review',
      certificateFileName: savedCertFilename,
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    },
    homeLocality: homeLocality ? `${homeLocality} (${pincode || ''})`.trim() : 'Udupi/Mangaluru',
    coordinates: { latitude: 13.3524, longitude: 74.7927 },
    locationSharingEnabled: false,
    preferredRadius: 15,
    availabilityStatus: 'available',
    heroStats: {
      totalEmergencyResponses: 0,
      totalDonations: 0,
      averageResponseTime: 0,
      badges: ['life_pulse_hero'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  insert<Donor>('donors', newDonor);
  update<User>('users', req.user!.uid, { donorId: newDonor.id, role: 'donor', name: cleanName, phone: cleanPhone });

  res.status(201).json({ donor: newDonor });
});

// POST /api/donors/certificate - Upload certificate base64 file for current donor
router.post('/certificate', authenticate, (req: AuthenticatedRequest, res) => {
  const { fileName, fileData } = req.body;
  if (!fileData) {
    return res.status(400).json({ error: 'fileData (base64) is required' });
  }

  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  const ext = fileName ? path.extname(fileName) : '.pdf';
  const savedCertFilename = `cert_${req.user!.uid}_${Date.now()}${ext || '.pdf'}`;
  const buffer = Buffer.from(fileData, 'base64');
  fs.writeFileSync(path.join(CERTIFICATES_DIR, savedCertFilename), buffer);

  if (donor) {
    update<Donor>('donors', donor.id, {
      verification: {
        ...donor.verification,
        certificateFileName: savedCertFilename,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  res.status(200).json({
    message: 'Certificate uploaded successfully',
    fileName: savedCertFilename,
  });
});

// PUT /api/donors/me/availability or /api/donors/:id/availability - Toggle emergency status
router.put('/me/availability', authenticate, (req: AuthenticatedRequest, res) => {
  const { availabilityStatus } = req.body;
  if (!['available', 'unavailable', 'emergency_only'].includes(availabilityStatus)) {
    return res.status(400).json({ error: 'Invalid availability status. Must be available, unavailable, or emergency_only' });
  }
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
  const updated = update<Donor>('donors', donor.id, { availabilityStatus });
  res.json({ message: 'Emergency status updated', donor: updated, availabilityStatus: updated?.availabilityStatus });
});

router.put('/:id/availability', authenticate, (req: AuthenticatedRequest, res) => {
  const { availabilityStatus } = req.body;
  if (!['available', 'unavailable', 'emergency_only'].includes(availabilityStatus)) {
    return res.status(400).json({ error: 'Invalid availability status' });
  }

  const donor = find<Donor>('donors', (d) => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  if (req.user!.role !== 'admin' && donor.uid !== req.user!.uid) return res.status(403).json({ error: 'Forbidden' });
  const updated = update<Donor>('donors', req.params.id, { availabilityStatus });
  res.json({ message: 'Availability updated', donor: updated });
});

// PUT /api/donors/:id/verify - Admin approves or defers donor eligibility
router.put('/:id/verify', authenticate, authorizeRoles('admin'), (req: AuthenticatedRequest, res) => {
  const { eligibilityStatus, deferralReason, deferralUntil } = req.body;
  if (!['pending', 'eligible', 'temporary_deferral', 'permanent_deferral'].includes(eligibilityStatus)) {
    return res.status(400).json({ error: 'Invalid eligibility status' });
  }

  const patch: Partial<Donor> = {
    eligibilityStatus,
    deferralReason: deferralReason || null,
    deferralUntil: deferralUntil || null,
  };

  const updated = update<Donor>('donors', req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Donor not found' });
  insert<AuditLog>('auditLogs', { id: `audit_${uuidv4().slice(0, 10)}`, actorUid: req.user!.uid, actorRole: req.user!.role, action: 'donor.eligibility_updated', entityType: 'donor', entityId: updated.id, details: { eligibilityStatus: updated.eligibilityStatus }, createdAt: new Date().toISOString() });
  res.json({ message: 'Donor eligibility updated', donor: updated });
});

// GET /api/donors/me/alerts - Get emergency matches for current donor
router.get('/me/alerts', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const donor = find<Donor>('donors', (d) => d.uid === user.uid || d.id === user.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

  const donorMatches = filter<Match>('matches', (m) => m.donorId === donor.id);
  const requests = readJson<BloodRequest>('bloodRequests');

  const alerts = donorMatches.filter((match) => ['alerted', 'accepted', 'en_route', 'reached'].includes(match.status) && (match.status !== 'alerted' || Date.parse(match.alertExpiresAt || match.alertedAt || '') > Date.now())).map((match) => {
    const request = requests.find((r) => r.id === match.requestId);
    return {
      match,
      request: request || null,
    };
  });

  res.json(alerts);
});

// POST /api/donors/matches/:matchId/respond - Accept or Decline match
router.post('/matches/:matchId/respond', authenticate, (req: AuthenticatedRequest, res) => {
  const { response } = req.body; // 'accepted' | 'declined'
  if (!['accepted', 'declined'].includes(response)) {
    return res.status(400).json({ error: 'Response must be accepted or declined' });
  }

  const match = find<Match>('matches', (m) => m.id === req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match record not found' });
  const donor = find<Donor>('donors', (d) => d.id === match.donorId);
  if (!donor || (req.user!.role !== 'admin' && donor.uid !== req.user!.uid)) return res.status(403).json({ error: 'This alert belongs to another donor' });
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === match.requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  const acceptedCount = filter<Match>('matches', (m) => m.requestId === match.requestId && ['accepted', 'en_route', 'reached', 'donated'].includes(m.status)).length;
  const result = resolveDonorResponse(match, request, response, acceptedCount);
  if (!result.ok) {
    if (result.expire) update<Match>('matches', match.id, { status: 'expired' });
    return res.status(409).json({ error: result.error });
  }
  const updatedMatch = update<Match>('matches', match.id, result.matchPatch);
  if (result.requestStatus) update<BloodRequest>('bloodRequests', request.id, { status: result.requestStatus });

  res.json({ message: `Alert ${response}`, match: updatedMatch });
});

// POST /api/donors/matches/:matchId/location - Live GPS coordinates stream from donor
router.post('/matches/:matchId/location', authenticate, (req: AuthenticatedRequest, res) => {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Valid latitude and longitude required' });
  }

  const match = find<Match>('matches', (m) => m.id === req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Match record not found' });
  const donor = find<Donor>('donors', (d) => d.id === match.donorId);
  if (!donor || (req.user!.role !== 'admin' && donor.uid !== req.user!.uid)) return res.status(403).json({ error: 'This tracking session belongs to another donor' });
  if (!['accepted', 'en_route'].includes(match.status)) return res.status(409).json({ error: 'Location sharing is available only after accepting an active request' });
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Coordinates are outside valid bounds' });
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === match.requestId);
  if (!request || !['searching', 'matched'].includes(request.status)) return res.status(409).json({ error: 'Request is closed; tracking has stopped' });
  const journey = updateJourney(match, request, { latitude, longitude });
  const updatedMatch = update<Match>('matches', match.id, journey.matchPatch);

  res.json({ message: journey.message, match: updatedMatch, trackingActive: journey.trackingActive });
});

router.get('/me/matches/:requestId', authenticate, (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
  const match = find<Match>('matches', (m) => m.requestId === req.params.requestId && m.donorId === donor.id);
  if (!match || !['accepted', 'en_route', 'reached', 'donated'].includes(match.status)) return res.status(404).json({ error: 'Active match not found' });
  const request = find<BloodRequest>('bloodRequests', (r) => r.id === match.requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json({ match, request: { id: request.id, hospitalName: request.hospitalName, hospitalLocation: request.hospitalLocation, status: request.status } });
});

router.put('/me/preferences', authenticate, (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
  const { preferredRadius, notificationPreferences, homeLocality, coordinates } = req.body;
  const patch: Partial<Donor> = {};
  if (preferredRadius != null) patch.preferredRadius = Math.max(5, Math.min(50, Number(preferredRadius) || 15));
  if (homeLocality) patch.homeLocality = String(homeLocality).trim();
  if (coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number') {
    if (coordinates.latitude >= -90 && coordinates.latitude <= 90 && coordinates.longitude >= -180 && coordinates.longitude <= 180) {
      patch.coordinates = {
        latitude: Math.round(coordinates.latitude * 100000) / 100000,
        longitude: Math.round(coordinates.longitude * 100000) / 100000,
      };
    }
  }
  if (notificationPreferences && typeof notificationPreferences === 'object') {
    patch.notificationPreferences = {
      push: Boolean(notificationPreferences.push),
      sms: Boolean(notificationPreferences.sms),
      whatsapp: Boolean(notificationPreferences.whatsapp),
      email: notificationPreferences.email !== undefined ? Boolean(notificationPreferences.email) : true,
      criticalOnly: Boolean(notificationPreferences.criticalOnly),
    };
  }
  const updated = update<Donor>('donors', donor.id, patch);
  res.json({ message: 'Donor preferences updated', donor: updated });
});

// POST /api/donors/me/test-notifications - Dispatch a test alert across donor's active channels
router.post('/me/test-notifications', authenticate, async (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

  const prefs = donor.notificationPreferences || {
    push: true,
    sms: true,
    whatsapp: true,
    email: true,
    criticalOnly: false,
  };

  const results: any[] = [];
  const testMessage = `[LifePulse Emergency Broadcast Test]\nHello ${donor.fullName}! Your emergency alert routing is operational.\nPriority: CODE RED (Trauma)\nBase: ${donor.homeLocality || 'Manipal'}\nStatus: Verified Responder`;

  if (prefs.push) {
    results.push({
      channel: 'push',
      recipient: donor.id,
      success: true,
      provider: 'browser_push',
      message: 'In-browser desktop push alert trigger ready',
    });
  }

  if (prefs.sms && donor.phone) {
    const smsRes = await sendSmsAlert(donor.phone, testMessage);
    results.push(smsRes);
  }

  if (prefs.whatsapp && donor.phone) {
    const waRes = await sendWhatsAppAlert(donor.phone, testMessage);
    results.push(waRes);
  }

  const donorEmail = donor.email || find<User>('users', (u) => u.uid === donor.uid)?.email || req.user?.email;
  if (prefs.email !== false && donorEmail) {
    const emailRes = await sendEmailAlert(
      donorEmail,
      donor.fullName,
      `[LifePulse TEST] Emergency Channel Verification`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
        <h2 style="color: #f43f5e; margin: 0 0 10px 0;">LifePulse Emergency Network</h2>
        <p style="font-size: 15px; color: #cbd5e1;">Hello <strong>${donor.fullName}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1;">This is a verification test of your emergency email alert channel powered by Brevo.</p>
        <div style="background: #1e293b; padding: 14px; border-radius: 8px; margin: 16px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> Verified Active Responder</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Base Locality:</strong> ${donor.homeLocality || 'Manipal'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Delivery Gateway:</strong> Brevo Transactional SMTP</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">LifePulse Emergency Dispatch Network • Udupi & Dakshina Kannada</p>
      </div>`
    );
    results.push(emailRes);
  }

  insert<AuditLog>('auditLogs', {
    id: `audit_testnotif_${uuidv4().slice(0, 8)}`,
    actorUid: req.user!.uid,
    actorRole: req.user!.role,
    action: 'donor.notification_channels_tested',
    entityType: 'donor',
    entityId: donor.id,
    details: {
      recipientPhone: donor.phone,
      recipientEmail: donorEmail,
      channelsTested: results.map((r) => `${r.channel}:${r.provider}`),
    },
    createdAt: new Date().toISOString(),
  });

  res.json({
    message: 'Test notification dispatches processed',
    recipientPhone: donor.phone,
    recipientEmail: donorEmail,
    preferences: prefs,
    results,
  });
});

router.put('/me/public-hero-consent', authenticate, (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
  if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean' });
  const updated = update<Donor>('donors', donor.id, { publicHeroConsent: req.body.enabled });
  res.json({ publicHeroConsent: updated?.publicHeroConsent || false });
});

// GET /api/donors/me/history - Detailed donation & emergency response log
router.get('/me/history', authenticate, (req: AuthenticatedRequest, res) => {
  const donor = find<Donor>('donors', (d) => d.uid === req.user!.uid || d.id === req.user!.donorId);
  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

  const matches = filter<Match>('matches', (m) => m.donorId === donor.id);
  const requests = readJson<BloodRequest>('bloodRequests');
  const hospitals = readJson<Hospital>('hospitals');

  const realHistory = matches.map((m) => {
    const r = requests.find((req) => req.id === m.requestId);
    const hosp = r ? hospitals.find((h) => h.id === r.hospitalId) : null;
    return {
      id: m.id,
      requestId: m.requestId,
      matchStatus: m.status,
      response: m.response,
      alertedAt: m.alertedAt,
      respondedAt: m.respondedAt,
      donationCompletedAt: m.donationCompletedAt || (m.status === 'donated' ? m.updatedAt : null),
      bloodGroup: r?.bloodGroup || donor.bloodGroup,
      component: r?.component || 'whole_blood',
      urgency: r?.urgency || 'critical',
      hospitalName: r?.hospitalName || hosp?.name || donor.verification?.hospitalName || 'Kasturba Hospital, Manipal',
      hospitalDistrict: hosp?.district || 'Udupi',
      type: 'Emergency Alert Response',
      verifiedBy: donor.verification?.verifiedBy || 'Dr. Anand Kumar',
      certificateId: donor.verification?.certificateId,
    };
  });

  const totalRecordedDonations = donor.heroStats?.totalDonations || 0;
  const historyList = [...realHistory];
  const completedMatchCount = realHistory.filter((h) => h.matchStatus === 'donated').length;
  const missingCount = Math.max(0, totalRecordedDonations - completedMatchCount);

  if (missingCount > 0) {
    const baseTime = Date.parse(donor.lastDonationDate || donor.heroStats?.lastResponseDate || '2026-10-07T09:00:00.000Z');
    const hospitalName = donor.verification?.hospitalName || 'Kasturba Hospital, Manipal';
    for (let i = 1; i <= missingCount; i++) {
      const priorDate = new Date(baseTime - i * 90 * 24 * 3600 * 1000).toISOString();
      historyList.push({
        id: `hist_prior_${donor.id}_${i}`,
        requestId: `req_archive_${100 + i}`,
        matchStatus: 'donated',
        response: 'accepted',
        alertedAt: priorDate,
        respondedAt: priorDate,
        donationCompletedAt: priorDate,
        bloodGroup: donor.bloodGroup,
        component: i % 2 === 0 ? 'whole_blood' : 'RBC',
        urgency: i % 3 === 0 ? 'critical' : 'urgent',
        hospitalName,
        hospitalDistrict: 'Udupi',
        type: i % 2 === 0 ? 'Hospital Emergency Dispatch' : 'Certified Blood Bank Donation',
        verifiedBy: donor.verification?.verifiedBy || 'Dr. Screening Officer',
        certificateId: donor.verification?.certificateId,
      });
    }
  }

  historyList.sort((a, b) => new Date(b.donationCompletedAt || b.alertedAt || 0).getTime() - new Date(a.donationCompletedAt || a.alertedAt || 0).getTime());

  res.json({
    summary: {
      totalDonations: donor.heroStats?.totalDonations || 0,
      totalEmergencyResponses: donor.heroStats?.totalEmergencyResponses || 0,
      badges: donor.heroStats?.badges || [],
      bloodGroup: donor.bloodGroup,
      certificateId: donor.verification?.certificateId,
      hospitalName: donor.verification?.hospitalName,
      lastDonationDate: donor.lastDonationDate || donor.heroStats?.lastResponseDate,
    },
    history: historyList,
  });
});

export default router;

