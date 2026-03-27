export default function LockedToolCard({ title, description }) {
  return (
    <div className="app-card">
      <div className="locked-header">
        <div>
          <h2>{title}</h2>
          <p className="locked-sub">{description}</p>
        </div>

        <div className="locked-badge">Premium</div>
      </div>

      <div className="locked-body">
        <p>This tool is part of the full PDF Tool Suite.</p>
        <p className="locked-muted">Upgrade to unlock advanced PDF features.</p>

        <button className="upgrade-cta">Upgrade to Pro</button>
      </div>
    </div>
  );
}
