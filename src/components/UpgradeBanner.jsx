import { useState } from "react";
import { trackUpgradeIntent } from "../utils/upgradeReasons";
import AdSlot from "./AdSlot";

export default function UpgradeBanner({
  title = "Unlock Pro",
  subtitle = "",
  features = [],
  ctaText = "Upgrade",
  upgradeReason = "",
  secondaryCtaText = "",
  onSecondaryCta,
  secondaryDisabled = false,
  secondaryHint = "",
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleUpgradeClick() {
    trackUpgradeIntent(upgradeReason);
    setIsOpen(true);
  }

  return (
    <>
      <div className="upgrade-banner">
        <div className="upgrade-banner-content">
          <div>
            <strong>{title}</strong>
          </div>

          {subtitle && <p className="upgrade-banner-sub">{subtitle}</p>}

          {features.length > 0 && (
            <ul>
              {features.map((feature, index) => (
                <li key={`${feature}-${index}`}>{feature}</li>
              ))}
            </ul>
          )}

          {secondaryHint && (
            <p className="upgrade-banner-hint">{secondaryHint}</p>
          )}
        </div>

        <div className="upgrade-banner-actions">
          {secondaryCtaText && onSecondaryCta && (
            <button
              type="button"
              className="upgrade-button upgrade-button-secondary"
              onClick={onSecondaryCta}
              disabled={secondaryDisabled}
            >
              {secondaryCtaText}
            </button>
          )}

          <button
            type="button"
            className="upgrade-button"
            onClick={handleUpgradeClick}
          >
            {ctaText}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="upgrade-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="upgrade-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Upgrade to ProjectStack Pro"
          >
            <div className="upgrade-modal-header">
              <h3>ProjectStack Pro</h3>
              <button
                type="button"
                className="upgrade-modal-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close upgrade modal"
              >
                ×
              </button>
            </div>

            <p className="upgrade-modal-sub">
              ProjectStack Pro is designed to make repeat file work feel
              faster, cleaner, and less constrained as your workflow grows.
            </p>

            <div className="upgrade-modal-section">
              <strong>Why upgrade</strong>
              <ul>
                {features.length > 0 ? (
                  features.map((feature, index) => (
                    <li key={`${feature}-modal-${index}`}>{feature}</li>
                  ))
                ) : (
                  <>
                    <li>Higher file limits</li>
                    <li>Watermark-free exports</li>
                    <li>Access to future premium tools</li>
                  </>
                )}
              </ul>
            </div>

            <div className="upgrade-modal-section">
              <strong>What’s coming later</strong>
              <ul>
                <li>Less friction when you handle larger files and repeat tasks</li>
                <li>More polished export workflows across the full toolset</li>
                <li>Expanded utility features beyond today&apos;s core PDF tools</li>
              </ul>
            </div>

            <div className="upgrade-modal-actions">
              <button
                type="button"
                className="upgrade-button"
                onClick={() => setIsOpen(false)}
              >
                Continue with free plan
              </button>
            </div>

            <AdSlot placement="upgradeModal" isVisible={isOpen} />
          </div>
        </div>
      )}
    </>
  );
}
