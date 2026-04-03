const STORAGE_KEY = "projectstack-upgrade-intents";
import { trackEvent } from "./analytics";

export const UPGRADE_REASONS = {
  EDIT_LIMITS: "edit-limits",
  MERGE_LIMITS: "merge-limits",
  MERGE_WATERMARK: "merge-watermark",
  DELETE_LIMITS: "delete-limits",
  EXTRACT_LIMITS: "extract-limits",
  REORDER_LIMITS: "reorder-limits",
  ROTATE_LIMITS: "rotate-limits",
  IMAGES_LIMITS: "images-limits",
  IMAGES_WATERMARK: "images-watermark",
  PDF_TO_IMAGE_LIMITS: "pdf-to-image-limits",
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

  trackEvent("upgrade_cta_clicked", {
    gated_feature: reason,
    source,
  });
}
