import { useEffect, useRef, useState } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { trackUpgradeIntent } from "../utils/upgradeReasons";
import AdSlot from "./AdSlot";
import { trackEvent } from "../utils/analytics";

const CLERK_AVAILABLE = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

// Rendered only when ClerkProvider is present — safe to call useUser() here
function UpgradePrimaryButton() {
  const { isSignedIn } = useUser()

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className="upgrade-button">
          Sign in to upgrade
        </button>
      </SignInButton>
    )
  }

  return (
    <button
      type="button"
      className="upgrade-button"
      onClick={() => {
        trackEvent("upgrade_cta_clicked", { source: "upgrade_modal" })
        window.open("https://buy.stripe.com/9B6dRb1mdg8me8s4j6ejK00", "_blank", "noopener")
      }}
    >
      Upgrade to Pro — $9.99/mo
    </button>
  )
}

function DefaultUpgradeButton() {
  return (
    <button
      type="button"
      className="upgrade-button"
      onClick={() => {
        trackEvent("upgrade_cta_clicked", { source: "upgrade_modal" })
        window.open("https://buy.stripe.com/9B6dRb1mdg8me8s4j6ejK00", "_blank", "noopener")
      }}
    >
      Upgrade to Pro — $9.99/mo
    </button>
  )
}

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
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (hasTrackedViewRef.current) return;

    hasTrackedViewRef.current = true;
    trackEvent("upgrade_banner_viewed", {
      gated_feature: upgradeReason || undefined,
    });
  }, [upgradeReason]);

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
              Remove watermarks, increase file limits, and unlock premium features for $9.99/month.
            </p>

            <div className="upgrade-modal-section">
              <strong>Why upgrade</strong>
              <ul>
                <li>No watermarks on any exports</li>
                <li>Upload files up to 50MB (10x the free limit)</li>
                <li>Unlimited daily exports across all tools</li>
                <li>Priority access to new features</li>
              </ul>
            </div>

            <div className="upgrade-modal-actions">
              {CLERK_AVAILABLE ? <UpgradePrimaryButton /> : <DefaultUpgradeButton />}
              <button
                type="button"
                className="upgrade-button-dismiss"
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
