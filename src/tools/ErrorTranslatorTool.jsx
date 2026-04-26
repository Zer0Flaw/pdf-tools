import { useEffect, useState } from "react";
import UpgradeBanner from "../components/UpgradeBanner";
import { trackEvent } from "../utils/analytics";
import { matchError, getErrorsByEcosystem } from "../utils/errorMatcher";
import { useSubscription } from "../utils/subscription";

const DIRECTORY_TABS = [
  { id: "git", label: "Git" },
  { id: "npm", label: "npm & Node.js" },
  { id: "python", label: "Python" },
];

export default function ErrorTranslatorTool({ onNavigateToError, initialDirectoryEcosystem }) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(initialDirectoryEcosystem || "git");
  const { isPremium } = useSubscription();

  useEffect(() => {
    setCopied(false);
  }, [result]);

  useEffect(() => {
    if (initialDirectoryEcosystem) {
      setActiveTab(initialDirectoryEcosystem);
      const el = document.getElementById(initialDirectoryEcosystem);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [initialDirectoryEcosystem]);

  function handleTranslate() {
    if (!inputText.trim()) return;

    trackEvent("error_searched", { tool: "errorExplain" });

    const matched = matchError(inputText);
    setResult(matched);
    setSearched(true);

    if (matched) {
      trackEvent("error_matched", {
        tool: "errorExplain",
        error_id: matched.id,
        ecosystem: matched.ecosystem,
      });
    } else {
      trackEvent("error_not_found", { tool: "errorExplain" });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleTranslate();
    }
  }

  function handleClear() {
    setInputText("");
    setResult(null);
    setSearched(false);
  }

  function handleCopyLink() {
    const url = `https://projectstack.cc/errors/${result.slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="error-translator-tool">
      <div className="developer-hub-hero">
        <div className="developer-hub-hero-text">
          <h2>Developer Hub</h2>
          <p>Browse 90+ error explanations across Git, npm, Node.js, and Python, or paste an error message below for an instant match.</p>
        </div>
      </div>

      <div className="tool-header">
        <h2>Error Translator</h2>
        <p className="tool-sub">
          Paste a Git, npm, Node.js, or Python error message and get a plain-English explanation with causes and fixes.
        </p>
        <span className="free-badge">Free</span>
      </div>

      <UpgradeBanner
        title="Unlock AI-powered error analysis"
        subtitle="Pro users get AI analysis for unrecognized errors — paste any error message and get a custom explanation."
        features={[
          "AI analysis for errors not in the database",
          "Suggested fix commands based on your repo context",
          "Support for npm, Python, Docker, and more ecosystems",
        ]}
        upgradeReason="error-explain-limits"
      />

      <div className="error-input-area">
        <textarea
          className="error-input"
          placeholder="Paste your error message here... (Ctrl+Enter to translate)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          spellCheck={false}
        />
        <div className="error-input-actions">
          <button
            type="button"
            className="merge-btn"
            onClick={handleTranslate}
            disabled={!inputText.trim()}
          >
            Translate Error
          </button>
          {(searched || inputText) && (
            <button type="button" className="remove-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="error-result">
          <div className="error-result-header">
            <span className="error-ecosystem-badge" data-ecosystem={result.ecosystem}>{result.ecosystem}</span>
            <h3>{result.title}</h3>
          </div>

          <div className="error-result-section">
            <h4>What this means</h4>
            <p>{result.explanation}</p>
          </div>

          <div className="error-result-section">
            <h4>Common causes</h4>
            <ul>
              {result.causes.map((cause) => (
                <li key={cause}>{cause}</li>
              ))}
            </ul>
          </div>

          <div className="error-result-section">
            <h4>How to fix it</h4>
            <ol>
              {result.fixes.map((fix) => (
                <li key={fix}>{fix}</li>
              ))}
            </ol>
          </div>

          {result.example && (
            <div className="error-result-example">
              <h4>Example</h4>
              <code>{result.example.input}</code>
              <p>{result.example.context}</p>
            </div>
          )}

          <div className="error-result-actions">
            <button
              type="button"
              className="error-view-detail-btn"
              onClick={() => onNavigateToError?.(result.slug)}
            >
              View full explanation →
            </button>
            <button
              type="button"
              className="error-copy-link-btn"
              onClick={handleCopyLink}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}

      {searched && !result && (
        <div className="error-no-match">
          <h3>Error not recognized</h3>
          <p>
            We couldn&apos;t match this error in our database. Try pasting just the error message
            line without extra log output, or check the exact wording from your terminal.
          </p>
        </div>
      )}

      <section className="error-directory">
        <div className="error-directory-header">
          <h3>Error Reference Library</h3>
          <p className="error-directory-subtitle">Browse by ecosystem</p>
        </div>

        <div className="error-directory-tabs" role="tablist" aria-label="Error ecosystems">
          {DIRECTORY_TABS.map((tab) => (
            <button
              key={tab.id}
              id={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`error-tab-panel-${tab.id}`}
              className={`error-directory-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {DIRECTORY_TABS.map((tab) => (
          <div
            key={tab.id}
            id={`error-tab-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={tab.id}
            className="error-directory-panel"
            hidden={activeTab !== tab.id}
          >
            <div className="error-directory-list">
              {getErrorsByEcosystem(tab.id).map((error) => (
                <a
                  key={error.slug}
                  className="error-directory-item"
                  href={`/errors/${error.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateToError?.(error.slug);
                  }}
                >
                  {error.shortTitle}
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
