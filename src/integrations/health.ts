let enabled = false;
let cachedEntries: any[] = [];

export async function requestHealthPermission(): Promise<boolean> {
  // TODO: Integrate Health Connect / HealthKit SDKs.
  enabled = true;
  return enabled;
}

export function revokeHealthPermission() {
  enabled = false;
  cachedEntries = [];
}

export function isHealthEnabled() {
  return enabled;
}

export function cacheHealthEntries(entries: any[]) {
  cachedEntries = entries;
}

export function getHealthEntries() {
  return cachedEntries;
}

export async function clearHealthCache() {
  cachedEntries = [];
}
