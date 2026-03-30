const IS_DEV = import.meta.env.DEV;
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

export const AD_CONFIG = {
  defaultProvider: "adsense",
  providers: {
    placeholder: {
      enabled: true,
      label: "Sponsored placement",
      placeholderCopy:
        "Reserved for a launch partner. No ad network is active yet.",
    },
    adsense: {
      enabled: true,
      label: "Sponsored placement",
      placeholderCopy:
        "AdSense is ready to connect. Replace the placeholder client and slot ids to go live.",
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
      slot: "0000000001",
    },
    upgradeModal: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: "0000000002",
    },
    landingFooter: {
      enabled: true,
      provider: "adsense",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
      format: "auto",
      responsive: true,
      slot: "0000000003",
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
      Boolean(provider.client) &&
      provider.client !== ADSENSE_CLIENT &&
      Boolean(placementConfig.slot) &&
      !placementConfig.slot.startsWith("000000000")
    );
  }

  return true;
}
