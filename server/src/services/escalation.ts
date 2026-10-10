import { v4 as uuidv4 } from 'uuid';
import type { BloodRequest, Donor, Match } from '../types.js';
import { find, filter, readJson, update, insert } from '../utils/db.js';
import { findCandidates } from './matching.js';
import { getSystemConfig } from './configService.js';
import { dispatchAlertNotifications } from './notificationService.js';

let running = false;

/** Called by the server scheduler; each request expands by 5 km after a 2 minute response window. */
export function escalateUnansweredRequests(now = Date.now()): number {
  if (running) return 0;
  running = true;
  let escalated = 0;
  try {
    for (const request of readJson<BloodRequest>('bloodRequests')) {
      if (request.status !== 'searching' && request.status !== 'matched') continue;
      const matches = filter<Match>('matches', (match) => match.requestId === request.id);
      if (Number.isFinite(Date.parse(request.requiredBy)) && Date.parse(request.requiredBy) <= now) {
        update<BloodRequest>('bloodRequests', request.id, { status: 'expired' });
        matches.filter((match) => ['pending_alert', 'alerted'].includes(match.status)).forEach((match) => update<Match>('matches', match.id, { status: 'expired', donorCurrentLocation: null, etaSeconds: null, distanceRemaining: null }));
        continue;
      }
      const donated = matches.filter((match) => match.status === 'donated').length;
      const active = matches.filter((match) => ['accepted', 'en_route', 'reached'].includes(match.status)).length;
      if (donated >= request.unitsRequired) { update<BloodRequest>('bloodRequests', request.id, { status: 'fulfilled' }); continue; }
      if (active + donated >= request.unitsRequired) continue;
      const config = getSystemConfig();
      const lastStep = request.lastEscalatedAt ? Date.parse(request.lastEscalatedAt) : Date.parse(request.createdAt);
      if (now - lastStep < config.alertTimeoutSeconds * 1000) continue;

      // Expire unanswered invitations so stale alerts cannot be accepted later.
      for (const match of matches) {
        if (match.status === 'alerted' && Date.parse(match.alertExpiresAt || match.alertedAt || '') <= now) update<Match>('matches', match.id, { status: 'expired' });
      }
      const refreshed = filter<Match>('matches', (match) => match.requestId === request.id);
      const excludes = new Set(refreshed.map((match) => match.donorId));
      const expandedRadius = Math.min(config.maxRadiusKm, Math.max(request.radiusKm, (request.escalationLevel || 0) * config.radiusStepKm + request.radiusKm + config.radiusStepKm));
      const candidateRequest = { ...request, radiusKm: expandedRadius };
      const next = findCandidates(candidateRequest, readJson<Donor>('donors'), excludes).slice(0, Math.max(5, (request.unitsRequired - active - donated) * 5));
      const timestamp = new Date(now).toISOString();
      next.forEach((candidate, index) => {
        const match: Match = {
          id: `match_${uuidv4().slice(0, 8)}`,
          requestId: request.id,
          donorId: candidate.donor.id,
          distance: candidate.distance,
          score: candidate.score,
          rank: refreshed.length + index + 1,
          status: 'alerted',
          alertedAt: timestamp,
          respondedAt: null,
          response: null,
          alertExpiresAt: new Date(now + config.alertTimeoutSeconds * 1000).toISOString(),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        insert<Match>('matches', match);
        void dispatchAlertNotifications(candidate.donor, request, match).catch((err) => {
          console.warn(`[ESCALATION NOTIF DISPATCH ERROR] donor ${candidate.donor.id}:`, err);
        });
      });
      const status = next.length ? 'searching' : expandedRadius >= config.maxRadiusKm ? 'unfulfilled' : request.status;
      update<BloodRequest>('bloodRequests', request.id, {
        status, radiusKm: expandedRadius, escalationLevel: (request.escalationLevel || 0) + 1,
        lastEscalatedAt: timestamp,
      });
      escalated += next.length;
    }
  } finally { running = false; }
  return escalated;
}
