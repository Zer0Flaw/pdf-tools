import { getErrorBySlug, getErrorsByEcosystem } from "../utils/errorMatcher";
import UserAuthButton from "./UserAuthButton";

const ECOSYSTEM_LABELS = {
  git: "Git Errors",
  npm: "npm & Node.js Errors",
  python: "Python Errors",
  typescript: "TypeScript Errors",
  docker: "Docker Errors",
};

function getRelatedErrors(error) {
  if (!error) return [];
  return getErrorsByEcosystem(error.ecosystem)
    .filter((e) => e.slug !== error.slug)
    .slice(0, 5);
}

export default function ErrorDetailPage({
  slug,
  onBackHome,
  onOpenErrorTool,
  onNavigateToDeveloperHub,
  onNavigateToError,
  onOpenSupportPage,
}) {
  const error = getErrorBySlug(slug);
  const relatedErrors = getRelatedErrors(error);

  function navigateToHub(ecosystem) {
    if (onNavigateToDeveloperHub) {
      onNavigateToDeveloperHub(ecosystem || null);
    } else if (onOpenErrorTool) {
      onOpenErrorTool();
    }
  }

  return (
    <div className="error-detail-page">
      <div className="brand-bar workspace-brand-bar">
        <button type="button" className="back-home-btn" onClick={onBackHome}>
          ← Home
        </button>
        <div className="brand-lockup">
          <img
            className="brand-mark"
            src="/branding/projectstack-mark.png"
            alt=""
            aria-hidden="true"
          />
          <div className="brand-title">ProjectStack</div>
        </div>
        <UserAuthButton />
      </div>

      {!error ? (
        <div className="route-intro">
          <h1>Error not found</h1>
          <p>
            We don&apos;t have a page for this error slug. Try the Developer Hub to browse the full
            error reference library.
          </p>
          <div className="tool-hero-actions">
            <button type="button" className="hero-primary-btn" onClick={() => navigateToHub(null)}>
              Browse Developer Hub
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="route-intro error-detail-intro">
            <nav className="error-breadcrumb" aria-label="Breadcrumb">
              <a
                href="/error-explain/"
                className="error-breadcrumb-link"
                onClick={(e) => { e.preventDefault(); navigateToHub(null); }}
              >
                Developer Hub
              </a>
              <span className="error-breadcrumb-sep" aria-hidden="true">›</span>
              <a
                href={`/error-explain/#${error.ecosystem}`}
                className="error-breadcrumb-link"
                onClick={(e) => { e.preventDefault(); navigateToHub(error.ecosystem); }}
              >
                {ECOSYSTEM_LABELS[error.ecosystem] || error.ecosystem}
              </a>
              <span className="error-breadcrumb-sep" aria-hidden="true">›</span>
              <span className="error-breadcrumb-current" aria-current="page">
                {error.shortTitle}
              </span>
            </nav>
            <span className="error-ecosystem-badge" data-ecosystem={error.ecosystem}>{error.ecosystem}</span>
            <h1>{error.title}</h1>
            <p>{error.explanation}</p>
          </div>

          <article className="error-detail-content">
            <section className="error-detail-section">
              <h2>Common causes</h2>
              <ul>
                {error.causes.map((cause, i) => (
                  <li key={i}>{cause}</li>
                ))}
              </ul>
            </section>

            <section className="error-detail-section">
              <h2>How to fix it</h2>
              <ol>
                {error.fixes.map((fix, i) => (
                  <li key={i}>{fix}</li>
                ))}
              </ol>
            </section>

            {error.example && (
              <section className="error-detail-section">
                <h2>Example</h2>
                <code>{error.example.input}</code>
                <p>{error.example.context}</p>
              </section>
            )}

            {relatedErrors.length > 0 && (
              <section className="error-detail-section error-related-errors">
                <h2>Related {ECOSYSTEM_LABELS[error.ecosystem] || "Errors"}</h2>
                <div className="error-related-list">
                  {relatedErrors.map((related) => (
                    <a
                      key={related.slug}
                      href={`/errors/${related.slug}`}
                      className="error-related-item"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigateToError) onNavigateToError(related.slug);
                      }}
                    >
                      {related.shortTitle}
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="error-detail-section error-detail-cta">
              <h2>Browse more errors</h2>
              <p>
                The Developer Hub covers 150+ errors across Git, npm, Node.js, Python, TypeScript, and Docker — with plain-English explanations and fix steps.
              </p>
              <button
                type="button"
                className="hero-primary-btn"
                onClick={() => navigateToHub(null)}
              >
                Back to Developer Hub
              </button>
            </section>
          </article>
        </>
      )}
    </div>
  );
}
