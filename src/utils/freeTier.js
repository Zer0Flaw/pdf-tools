const DAILY_WATERMARK_KEY = "projectstack-free-watermark-date";

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
