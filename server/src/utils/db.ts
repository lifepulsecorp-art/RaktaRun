import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data and certificates directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const CERTIFICATES_DIR = path.join(DATA_DIR, 'certificates');
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

function getFilePath(collection: string): string {
  const fileName = collection.endsWith('.json') ? collection : `${collection}.json`;
  return path.join(DATA_DIR, fileName);
}

export function readJson<T>(collection: string): T[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return [];
    return JSON.parse(content) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

export function writeJson<T>(collection: string, data: T[]): void {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function find<T>(collection: string, predicate: (item: T) => boolean): T | undefined {
  const items = readJson<T>(collection);
  return items.find(predicate);
}

export function filter<T>(collection: string, predicate: (item: T) => boolean): T[] {
  const items = readJson<T>(collection);
  return items.filter(predicate);
}

export function insert<T>(collection: string, item: T): T {
  const items = readJson<T>(collection);
  items.push(item);
  writeJson(collection, items);
  return item;
}

export function update<T extends { id?: string; uid?: string }>(
  collection: string,
  idOrUid: string,
  patch: Partial<T>
): T | null {
  const items = readJson<T>(collection);
  const index = items.findIndex((item) => item.id === idOrUid || item.uid === idOrUid);
  if (index === -1) return null;

  items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
  writeJson(collection, items);
  return items[index];
}

export function remove<T extends { id?: string; uid?: string }>(
  collection: string,
  idOrUid: string
): boolean {
  const items = readJson<T>(collection);
  const initialLength = items.length;
  const filtered = items.filter((item) => item.id !== idOrUid && item.uid !== idOrUid);
  if (filtered.length !== initialLength) {
    writeJson(collection, filtered);
    return true;
  }
  return false;
}

export default {
  readJson,
  writeJson,
  find,
  filter,
  insert,
  update,
  remove,
};

