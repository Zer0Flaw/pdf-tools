export default function AdSlot({ placementId, isVisible }) {
  if (!isVisible) return null;

  return (
    <div
      className="ad-slot"
      role="complementary"
      aria-label="Future sponsored placement"
      data-placement={placementId}
    >
      <div className="ad-slot-label">Sponsored placement</div>
      <p className="ad-slot-copy">
        Reserved for a launch partner. No ad network is active yet.
      </p>
    </div>
  );
}
