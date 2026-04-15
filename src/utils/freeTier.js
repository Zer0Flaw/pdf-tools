const DAILY_WATERMARK_KEY = "projectstack-free-watermark-date";
const DAILY_EXPORT_COUNT_KEY = "projectstack-daily-export-count";
const DAILY_EXPORT_DATE_KEY = "projectstack-daily-export-date";
const FREE_DAILY_EXPORT_LIMIT = 5;

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function readStorageValue(key) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and keep the UI usable.
  }
}

export function canUseDailyWatermarkRemoval() {
  return readStorageValue(DAILY_WATERMARK_KEY) !== getTodayStamp();
}

export function consumeDailyWatermarkRemoval() {
  writeStorageValue(DAILY_WATERMARK_KEY, getTodayStamp());
}

export function getDailyExportCount() {
  const storedDate = readStorageValue(DAILY_EXPORT_DATE_KEY);
  if (storedDate !== getTodayStamp()) return 0;
  const count = parseInt(readStorageValue(DAILY_EXPORT_COUNT_KEY) || "0", 10);
  return isNaN(count) ? 0 : count;
}

export function hasReachedDailyExportLimit() {
  return getDailyExportCount() >= FREE_DAILY_EXPORT_LIMIT;
}

export function incrementDailyExportCount() {
  const today = getTodayStamp();
  const storedDate = readStorageValue(DAILY_EXPORT_DATE_KEY);
  if (storedDate !== today) {
    writeStorageValue(DAILY_EXPORT_DATE_KEY, today);
    writeStorageValue(DAILY_EXPORT_COUNT_KEY, "1");
    return 1;
  }
  const current = getDailyExportCount();
  const next = current + 1;
  writeStorageValue(DAILY_EXPORT_COUNT_KEY, String(next));
  return next;
}

export function getRemainingDailyExports() {
  return Math.max(0, FREE_DAILY_EXPORT_LIMIT - getDailyExportCount());
}

export { FREE_DAILY_EXPORT_LIMIT };
