const STORAGE_KEY = "projectstack-upgrade-intents";
import { trackEvent } from "./analytics";

export const UPGRADE_REASONS = {
  MERGE_LIMITS: "merge-limits",
  MERGE_WATERMARK: "merge-watermark",
  IMAGES_LIMITS: "images-limits",
  IMAGES_WATERMARK: "images-watermark",
  SPLIT_LIMITS: "split-limits",
  COMPRESS_LIMITS: "compress-limits",
};

export function trackUpgradeIntent(reason, source = "upgrade-banner") {
  if (typeof window === "undefined" || !reason) return;

  try {
    const existing = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]",
    );

    existing.push({
      reason,
      source,
      timestamp: new Date().toISOString(),
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage issues and keep the app usable.
  }

  trackEvent("upgrade_clicked", { reason, source });
}
