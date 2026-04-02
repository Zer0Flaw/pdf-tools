import { UPGRADE_REASONS } from "./upgradeReasons";

const MB = 1024 * 1024;

export const FEATURE_GATES = {
  merge: {
    id: "merge",
    maxFiles: 3,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: true,
      unlimitedImages: false,
      watermarkFree: true,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Merging locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.MERGE_LIMITS,
    watermarkUpgradeReason: UPGRADE_REASONS.MERGE_WATERMARK,
  },
  rotate: {
    id: "rotate",
    maxFiles: 1,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: false,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Rotating locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.ROTATE_LIMITS,
  },
  delete: {
    id: "delete",
    maxFiles: 1,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: false,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Updating locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.DELETE_LIMITS,
  },
  reorder: {
    id: "reorder",
    maxFiles: 1,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: false,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Reordering locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.REORDER_LIMITS,
  },
  split: {
    id: "split",
    maxFiles: 1,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: false,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Splitting locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.SPLIT_LIMITS,
  },
  images: {
    id: "images",
    maxFiles: 5,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: true,
      watermarkFree: true,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Converting locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.IMAGES_LIMITS,
    watermarkUpgradeReason: UPGRADE_REASONS.IMAGES_WATERMARK,
  },
  pdfToImage: {
    id: "pdfToImage",
    maxFiles: 1,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: false,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Converting locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.PDF_TO_IMAGE_LIMITS,
  },
  compress: {
    id: "compress",
    maxFiles: 5,
    maxFileSize: 5 * MB,
    premiumFlags: {
      unlimitedMerges: false,
      unlimitedImages: true,
      watermarkFree: false,
      largerFiles: true,
    },
    privacyMessage: "Files are processed locally in your browser.",
    processingMessage: "Compressing locally in your browser...",
    adPlacement: "postExport",
    upgradeReason: UPGRADE_REASONS.COMPRESS_LIMITS,
  },
};

export function getFeatureGate(toolId) {
  return FEATURE_GATES[toolId];
}

export function formatFeatureFileSize(bytes) {
  return `${Math.round(bytes / MB)}MB`;
}
