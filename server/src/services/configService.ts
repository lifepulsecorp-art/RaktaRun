import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { SystemConfig } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, '../../data/systemConfig.json');

const DEFAULT_CONFIG: SystemConfig = {
  alertTimeoutSeconds: 120,
  radiusStepKm: 5,
  maxRadiusKm: 50,
  schedulerIntervalSeconds: 30,
};

export function getSystemConfig(): SystemConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...data };
    }
  } catch (err) {
    console.error('Error reading systemConfig.json, using defaults:', err);
  }
  return DEFAULT_CONFIG;
}

export function updateSystemConfig(patch: Partial<SystemConfig>): SystemConfig {
  const current = getSystemConfig();
  const updated: SystemConfig = {
    ...current,
    ...patch,
    alertTimeoutSeconds: Math.max(30, Math.min(600, Number(patch.alertTimeoutSeconds) || current.alertTimeoutSeconds)),
    radiusStepKm: Math.max(1, Math.min(25, Number(patch.radiusStepKm) || current.radiusStepKm)),
    maxRadiusKm: Math.max(10, Math.min(100, Number(patch.maxRadiusKm) || current.maxRadiusKm)),
    schedulerIntervalSeconds: Math.max(10, Math.min(300, Number(patch.schedulerIntervalSeconds) || current.schedulerIntervalSeconds)),
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing systemConfig.json:', err);
  }
  return updated;
}

