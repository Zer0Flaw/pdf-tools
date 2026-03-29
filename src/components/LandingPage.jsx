import React from "react";

export default function LandingPage({ onStart }) {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="brand-lockup hero-brand-lockup">
            <img
              className="brand-logo"
              src="/branding/projectstack-logo.png"
              alt="ProjectStack"
            />
          </div>

          <p className="hero-eyebrow">
            Simple file tools. Built to get out of your way.
          </p>
          <h1 className="hero-title">Simple file tools for practical work</h1>
          <p className="hero-subtitle">
            Merge PDFs, split files, convert images to PDF, and compress images
            in one clean workspace.
          </p>

          <div className="hero-actions">
            <button className="hero-primary-btn" onClick={onStart}>
              Open Workspace
            </button>
            <button
              className="hero-secondary-btn"
              onClick={() => {
                const section = document.getElementById("features");
                section?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See Features
            </button>
          </div>

          <div className="hero-trust">
            <span>Client-side processing</span>
            <span>No sign-in required</span>
            <span>Fast and simple</span>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Core tools</p>
          <h2>Everything you need for quick file tasks</h2>
          <p>
            ProjectStack is built for practical work. No bloated interface. No
            wasted clicks. Just the tools you actually use.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Merge PDF</h3>
            <p>Combine multiple PDFs into a single finished document.</p>
          </div>

          <div className="feature-card">
            <h3>Split PDF</h3>
            <p>Break a PDF into separate page files in seconds.</p>
          </div>

          <div className="feature-card">
            <h3>Images to PDF</h3>
            <p>Turn JPG and PNG images into one organized PDF.</p>
          </div>

          <div className="feature-card">
            <h3>Compress Images</h3>
            <p>Reduce file size for easier sharing and storage.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Why ProjectStack</p>
          <h2>Built like a product, not a throwaway utility</h2>
        </div>

        <div className="benefit-grid">
          <div className="benefit-card">
            <h3>Focused workflow</h3>
            <p>
              Each tool is designed to be simple, fast, and consistent across
              the app.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Modern UX</h3>
            <p>
              Drag-and-drop uploads, clear limits, inline feedback, and a clean
              working surface.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Room to grow</h3>
            <p>
              ProjectStack is built to expand beyond PDFs into broader file
              utility workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-card">
          <div>
            <p className="section-eyebrow">Get started</p>
            <h2>Open the workspace and try the tools</h2>
            <p>
              Start with the free tools now. Premium workflows and expanded
              features are planned next.
            </p>
          </div>

          <button className="hero-primary-btn" onClick={onStart}>
            Launch ProjectStack
          </button>
        </div>
      </section>
    </div>
  );
}
