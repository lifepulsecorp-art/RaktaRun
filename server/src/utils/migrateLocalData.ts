import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Donor } from '../types.js';
import { writeJson } from './db.js';
import { uploadCertificate } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const CERTIFICATES_DIR = path.join(DATA_DIR, 'certificates');

const COLLECTION_FILES = [
  ['users', 'users.json'],
  ['hospitals', 'hospitals.json'],
  ['donors', 'donors.json'],
  ['bloodRequests', 'bloodRequests.json'],
  ['matches', 'matches.json'],
  ['auditLogs', 'auditLogs.json'],
  ['buddyLinks', 'buddyLinks.json'],
  ['buddyReferrals', 'buddyReferrals.json'],
  ['emailVerifications', 'emailVerifications.json'],
  ['blockedEmails', 'blockedEmails.json'],
] as const;

function contentTypeFor(fileName: string): string | null {
  switch (path.extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.txt': return 'text/plain';
    default: return null;
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const collections = new Map<string, unknown[]>();
  for (const [collection, fileName] of COLLECTION_FILES) {
    const data = await readJsonFile<unknown[]>(path.join(DATA_DIR, fileName));
    if (data) collections.set(collection, data);
  }

  const donors = (collections.get('donors') || []) as Donor[];
  for (const donor of donors) {
    const oldPath = donor.verification?.certificateFileName;
    if (!oldPath || oldPath.startsWith('certificates/')) continue;

    const fileName = path.basename(oldPath);
    const contentType = contentTypeFor(fileName);
    if (!contentType || fileName !== oldPath) {
      console.warn(`Skipping unsupported certificate path for donor ${donor.id}.`);
      delete donor.verification.certificateFileName;
      continue;
    }

    try {
      const file = await fs.readFile(path.join(CERTIFICATES_DIR, fileName));
      const objectPath = `certificates/${donor.uid || donor.id}/${fileName}`;
      donor.verification.certificateFileName = await uploadCertificate(objectPath, file, contentType, true);
      console.log(`Migrated certificate for donor ${donor.id}.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`Certificate file not found for donor ${donor.id}; clearing stale filename.`);
        delete donor.verification.certificateFileName;
        continue;
      }
      throw error;
    }
  }
  if (collections.has('donors')) collections.set('donors', donors);

  for (const [collection, records] of collections) {
    await writeJson(collection, records);
    console.log(`Imported ${records.length} ${collection} records.`);
  }

  const config = await readJsonFile<Record<string, unknown>>(path.join(DATA_DIR, 'systemConfig.json'));
  if (config) {
    await writeJson('systemConfig', [config]);
    console.log('Imported system configuration.');
  }
}

main().catch((error) => {
  console.error('JSON-to-Supabase migration failed:', error);
  process.exitCode = 1;
});
