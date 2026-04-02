const STORAGE_KEY = "projectstack-analytics-events";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return Object.entries(metadata).reduce((cleaned, [key, value]) => {
    if (typeof value === "undefined") {
      return cleaned;
    }

    cleaned[key] = value;
    return cleaned;
  }, {});
}

export function trackEvent(name, metadata = {}) {
  if (!isBrowser() || !name) return;

  const payload = {
    name,
    metadata: normalizeMetadata(metadata),
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
