import {
  AD_CONFIG,
  getAdPlacementConfig,
  getAdProviderConfig,
  shouldRenderAdPlacement,
} from "../utils/adConfig";

function renderPlaceholder(placement, provider) {
  return (
    <div
      className="ad-slot"
      role="complementary"
      aria-label="Future sponsored placement"
      data-placement={placement}
      data-provider={provider}
    >
      <div className="ad-slot-label">{provider.label}</div>
      <p className="ad-slot-copy">{provider.placeholderCopy}</p>
    </div>
  );
}

export default function AdSlot({ placement, isVisible = true }) {
  if (!isVisible || !shouldRenderAdPlacement(placement)) return null;

  const placementConfig = getAdPlacementConfig(placement);

  if (!placementConfig) return null;

  const providerName = placementConfig.provider || AD_CONFIG.defaultProvider;
  const provider = getAdProviderConfig(providerName);

  if (!provider) return null;

  if (!placementConfig.enabled || !provider.enabled) {
    return placementConfig.renderPlaceholderWhenDisabled
      ? renderPlaceholder(placement, provider)
      : null;
  }

  return renderPlaceholder(placement, provider);
}
