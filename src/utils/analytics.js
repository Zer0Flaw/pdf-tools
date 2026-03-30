const STORAGE_KEY = "projectstack-analytics-events";

export function trackEvent(name, metadata = {}) {
  if (typeof window === "undefined" || !name) return;

  const payload = {
    name,
    metadata,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    );
    existing.push(payload);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage failures and keep the app usable.
  }

  try {
    window.dispatchEvent(
      new CustomEvent("projectstack:analytics", {
        detail: payload,
      }),
    );
  } catch {
    // Ignore event dispatch issues.
  }
}
