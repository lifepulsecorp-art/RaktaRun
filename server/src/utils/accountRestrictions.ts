import { readJson } from './db.js';
import type { BlockedEmail } from '../types.js';

export function isEmailBlocked(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return readJson<BlockedEmail>('blockedEmails').some((entry) => entry.email.trim().toLowerCase() === normalized);
}
