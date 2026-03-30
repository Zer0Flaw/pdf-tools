import { useEffect, useId, useRef } from "react";
import {
  AD_CONFIG,
  getAdPlacementConfig,
  getAdProviderConfig,
  isAdProviderReady,
  shouldRenderAdPlacement,
} from "../utils/adConfig";
import { trackEvent } from "../utils/analytics";

function renderPlaceholder(placement, providerName, provider) {
  return (
    <div
      className="ad-slot"
      role="complementary"
      aria-label="Future sponsored placement"
      data-placement={placement}
      data-provider={providerName}
    >
      <div className="ad-slot-label">{provider.label}</div>
      <p className="ad-slot-copy">{provider.placeholderCopy}</p>
    </div>
  );
}

export default function AdSlot({ placement, isVisible = true }) {
  const adRef = useRef(null);
  const hasTrackedViewRef = useRef(false);
  const instanceId = useId();
  const placementConfig = getAdPlacementConfig(placement);
  const providerName = placementConfig?.provider || AD_CONFIG.defaultProvider;
  const provider = getAdProviderConfig(providerName);
  const shouldRender =
    Boolean(isVisible) &&
    shouldRenderAdPlacement(placement) &&
    Boolean(placementConfig) &&
    Boolean(provider);
  const canRenderLiveAd =
    shouldRender &&
    placementConfig.enabled &&
    isAdProviderReady(providerName, placement);

  useEffect(() => {
    if (!canRenderLiveAd || providerName !== "adsense" || !adRef.current) return;

    try {
      if (!adRef.current.dataset.loaded) {
        adRef.current.dataset.loaded = "true";
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      adRef.current.dataset.loaded = "";
    }
  }, [canRenderLiveAd, providerName]);

  useEffect(() => {
    if (!shouldRender || hasTrackedViewRef.current) return;

    hasTrackedViewRef.current = true;
    trackEvent("ad_viewed", {
      placement,
      provider: providerName,
      live: canRenderLiveAd,
    });
  }, [canRenderLiveAd, placement, providerName, shouldRender]);

  if (!shouldRender) return null;

  if (!canRenderLiveAd) {
    return placementConfig.renderPlaceholderWhenDisabled
      ? renderPlaceholder(placement, providerName, provider)
      : null;
  }

  if (providerName === "adsense") {
    return (
      <div
        className="ad-slot ad-slot-live"
        role="complementary"
        aria-label="Sponsored placement"
        data-placement={placement}
        data-provider={providerName}
      >
        <ins
          key={`${placement}-${instanceId}`}
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={provider.client}
          data-ad-slot={placementConfig.slot}
          data-ad-format={placementConfig.format || "auto"}
          data-full-width-responsive={
            placementConfig.responsive ? "true" : "false"
          }
        />
      </div>
    );
  }

  return renderPlaceholder(placement, providerName, provider);
}
