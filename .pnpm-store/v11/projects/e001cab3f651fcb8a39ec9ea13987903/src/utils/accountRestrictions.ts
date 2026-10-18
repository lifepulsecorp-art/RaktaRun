import { readJson } from './db.js';
import type { BlockedEmail } from '../types.js';

export async function isEmailBlocked(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (await readJson<BlockedEmail>('blockedEmails')).some((entry) => entry.email.trim().toLowerCase() === normalized);
}
