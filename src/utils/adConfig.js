const IS_DEV = import.meta.env.DEV;
const ADSENSE_CLIENT_PLACEHOLDER = "ca-pub-XXXXXXXXXXXXXXXX";

function readBooleanEnv(value, fallback = false) {
  if (typeof value !== "string") return fallback;

  return value.toLowerCase() === "true";
}

const ADS_ENABLED = readBooleanEnv(import.meta.env.VITE_ADS_ENABLED, false);
const ADSENSE_CLIENT =
  import.meta.env.VITE_ADSENSE_CLIENT || ADSENSE_CLIENT_PLACEHOLDER;

function getPlacementSlot(envKey) {
  return import.meta.env[envKey] || "";
}

export const AD_CONFIG = {
  enabled: ADS_ENABLED,
  defaultProvider: "adsense",
  providers: {
    placeholder: {
      enabled: true,
      label: "Sponsored placement",
      placeholderCopy:
        "Reserved sponsored area. No ad network is active right now.",
    },
    adsense: {
      enabled: ADS_ENABLED,
      label: "Sponsored placement",
      placeholderCopy:
        "Sponsored placement is configured for future activation, but live ads are currently disabled.",
      client: ADSENSE_CLIENT,
    },
    carbon: {
      enabled: false,
      label: "Carbon slot",
      placeholderCopy: "Carbon Ads integration is configured but not enabled yet.",
    },
  },
  placements: {
    postExport: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: getPlacementSlot("VITE_ADSENSE_SLOT_POST_EXPORT"),
      minHeight: 120,
    },
    upgradeModal: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: getPlacementSlot("VITE_ADSENSE_SLOT_UPGRADE_MODAL"),
      minHeight: 110,
    },
    landingFooter: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: getPlacementSlot("VITE_ADSENSE_SLOT_LANDING_FOOTER"),
      minHeight: 140,
    },
    toolSeoFooter: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: getPlacementSlot("VITE_ADSENSE_SLOT_TOOL_SEO_FOOTER"),
      minHeight: 140,
    },
    supportFooter: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: getPlacementSlot("VITE_ADSENSE_SLOT_SUPPORT_FOOTER"),
      minHeight: 140,
    },
  },
};

export function getAdPlacementConfig(placement) {
  return AD_CONFIG.placements[placement];
}

export function getAdProviderConfig(provider) {
  return AD_CONFIG.providers[provider];
}

export function shouldRenderAdPlacement(placement) {
  const placementConfig = getAdPlacementConfig(placement);
  if (!placementConfig) return false;
  if (placementConfig.devOnly && !IS_DEV) return false;

  return true;
}

export function isAdProviderReady(providerName, placement) {
  const provider = getAdProviderConfig(providerName);
  const placementConfig = getAdPlacementConfig(placement);

  if (!provider || !placementConfig || !provider.enabled) return false;

  if (providerName === "adsense") {
    return (
      AD_CONFIG.enabled &&
      Boolean(provider.client) &&
      provider.client !== ADSENSE_CLIENT_PLACEHOLDER &&
      Boolean(placementConfig.slot)
    );
  }

  return true;
}
