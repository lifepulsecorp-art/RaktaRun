import { readJson, writeJson } from '../utils/db.js';
import type { SystemConfig } from '../types.js';

const DEFAULT_CONFIG: SystemConfig = {
  alertTimeoutSeconds: 120,
  radiusStepKm: 5,
  maxRadiusKm: 50,
  schedulerIntervalSeconds: 30,
};

export async function getSystemConfig(): Promise<SystemConfig> {
  const [stored] = await readJson<SystemConfig>('systemConfig');
  return { ...DEFAULT_CONFIG, ...stored };
}

export async function updateSystemConfig(patch: Partial<SystemConfig>): Promise<SystemConfig> {
  const current = await getSystemConfig();
  const updated: SystemConfig = {
    ...current,
    ...patch,
    alertTimeoutSeconds: Math.max(30, Math.min(600, Number(patch.alertTimeoutSeconds) || current.alertTimeoutSeconds)),
    radiusStepKm: Math.max(1, Math.min(25, Number(patch.radiusStepKm) || current.radiusStepKm)),
    maxRadiusKm: Math.max(10, Math.min(100, Number(patch.maxRadiusKm) || current.maxRadiusKm)),
    schedulerIntervalSeconds: Math.max(10, Math.min(300, Number(patch.schedulerIntervalSeconds) || current.schedulerIntervalSeconds)),
  };

  await writeJson('systemConfig', [updated]);
  return updated;
}
