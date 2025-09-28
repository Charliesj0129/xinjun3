let calendarEnabled = false;
let cachedSuggestions: any[] = [];

export async function requestCalendarPermission(): Promise<boolean> {
  calendarEnabled = true;
  return calendarEnabled;
}

export function revokeCalendarPermission() {
  calendarEnabled = false;
  cachedSuggestions = [];
}

export function isCalendarEnabled() {
  return calendarEnabled;
}

export function cacheCalendarSuggestions(entries: any[]) {
  cachedSuggestions = entries;
}

export function getCalendarSuggestions() {
  return cachedSuggestions;
}

export async function clearCalendarCache() {
  cachedSuggestions = [];
}
