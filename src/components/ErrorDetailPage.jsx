import { getErrorBySlug } from "../utils/errorMatcher";
import UserAuthButton from "./UserAuthButton";

export default function ErrorDetailPage({ slug, onBackHome, onOpenErrorTool, onOpenSupportPage }) {
  const error = getErrorBySlug(slug);

  return (
    <div className="error-detail-page">
      <div className="brand-bar workspace-brand-bar">
        <button type="button" className="back-home-btn" onClick={onBackHome}>
          Back to Home
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
            We don&apos;t have a page for this error slug. Try the Error Translator to search the
            full database.
          </p>
          <div className="tool-hero-actions">
            <button type="button" className="hero-primary-btn" onClick={onOpenErrorTool}>
              Open Error Translator
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="route-intro error-detail-intro">
            <span className="error-ecosystem-badge">{error.ecosystem}</span>
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

            <section className="error-detail-section error-detail-cta">
              <h2>Have a different error?</h2>
              <p>
                Paste any error message into the Error Translator to get an instant explanation.
              </p>
              <button type="button" className="hero-primary-btn" onClick={onOpenErrorTool}>
                Open Error Translator
              </button>
            </section>
          </article>
        </>
      )}
    </div>
  );
}
