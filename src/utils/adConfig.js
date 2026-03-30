const IS_DEV = import.meta.env.DEV;

export const AD_CONFIG = {
  defaultProvider: "placeholder",
  providers: {
    placeholder: {
      enabled: true,
      label: "Sponsored placement",
      placeholderCopy:
        "Reserved for a launch partner. No ad network is active yet.",
    },
    adsense: {
      enabled: false,
      label: "AdSense slot",
      placeholderCopy: "AdSense integration is configured but not enabled yet.",
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
      provider: "placeholder",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
    },
    upgradeModal: {
      enabled: false,
      provider: "placeholder",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
    },
    footer: {
      enabled: false,
      provider: "placeholder",
      renderPlaceholderWhenDisabled: true,
      devOnly: false,
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
