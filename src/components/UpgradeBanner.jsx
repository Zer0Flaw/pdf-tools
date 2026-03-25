export default function UpgradeBanner() {
  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-content">
        <div>
          <strong>Free plan:</strong> merge up to 3 PDFs.
        </div>
        <ul>
          <li>Unlimited PDF merges</li>
          <li>No watermark</li>
          <li>Premium features coming soon</li>
        </ul>
      </div>

      <button
        className="upgrade-button"
        onClick={() => alert("Premium coming soon")}
      >
        Upgrade
      </button>
    </div>
  );
}
