import { useState } from "react";

export default function UpgradeBanner({
  title = "Unlock Pro",
  features = [],
  ctaText = "Upgrade",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="upgrade-banner">
        <div className="upgrade-banner-content">
          <div>
            <strong>{title}</strong>
          </div>

          {features.length > 0 && (
            <ul>
              {features.map((feature, index) => (
                <li key={`${feature}-${index}`}>{feature}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="upgrade-button"
          onClick={() => setIsOpen(true)}
        >
          {ctaText}
        </button>
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
              Premium features are coming soon. ProjectStack Pro will unlock a
              smoother, faster workflow with fewer free-tier limits.
            </p>

            <div className="upgrade-modal-section">
              <strong>Planned Pro benefits</strong>
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
                <li>Premium workflow options</li>
                <li>More file operations beyond PDFs</li>
                <li>Smarter export and naming controls</li>
              </ul>
            </div>

            <div className="upgrade-modal-actions">
              <button
                type="button"
                className="upgrade-button"
                onClick={() => setIsOpen(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
