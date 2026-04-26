import React, { useState } from "react";
import AdSlot from "./AdSlot";

const FILE_TOOLS = [
  { id: "edit", title: "Edit PDF", description: "Reorder, rotate, delete, and extract pages in one editor." },
  { id: "merge", title: "Merge PDF", description: "Combine multiple PDFs into a single finished document." },
  { id: "split", title: "Split PDF", description: "Break a PDF into separate page files in seconds." },
  { id: "rotate", title: "Rotate PDF Pages", description: "Fix page orientation and export a corrected PDF." },
  { id: "delete", title: "Delete PDF Pages", description: "Remove unwanted pages and export a cleaner PDF." },
  { id: "reorder", title: "Reorder PDF Pages", description: "Drag pages into a new sequence and export the result." },
  { id: "extract", title: "Extract PDF Pages", description: "Select pages and export them into a new PDF." },
  { id: "images", title: "Images to PDF", description: "Turn JPG and PNG images into one organized PDF." },
  { id: "pdfToImage", title: "PDF to Image", description: "Turn PDF pages into clean PNG image downloads." },
  { id: "compress", title: "Compress Images", description: "Reduce file size for easier sharing and storage." },
];

const DEV_TOOLS = [
  {
    id: "errorExplain",
    title: "Error Translator",
    description:
      "Paste a compiler error, runtime exception, or terminal message and get a plain-English explanation with actionable fixes. Supports Git, Node.js, Python, and more.",
  },
];

export default function LandingPage({ onStart, onOpenTool }) {
  const [showFooterAd, setShowFooterAd] = useState(false);

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
          <p className="hero-eyebrow">File Tools &amp; Developer Utilities</p>
          <h1 className="hero-title">Practical tools that stay out of your way</h1>
          <p className="hero-subtitle">
            Browser-based file tools and developer utilities. No uploads, no accounts, no waiting.
          </p>
          <div className="hero-actions">
            <button type="button" className="hero-primary-btn" onClick={onStart}>
              Get Started
            </button>
            <button
              type="button"
              className="hero-text-link"
              onClick={() => {
                setShowFooterAd(true);
                document.getElementById("file-tools")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See what&apos;s included ↓
            </button>
          </div>
        </div>
      </section>

      <section id="file-tools" className="lp-section">
        <div className="lp-section-head">
          <h2 className="lp-section-title">File &amp; Document Tools</h2>
          <p className="lp-section-desc">
            Edit, merge, split, convert, and compress files directly in your browser. No uploads, no sign-in.
          </p>
        </div>
        <div className="lp-tool-grid">
          {FILE_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="lp-tool-card"
              onClick={() => onOpenTool?.(tool.id)}
            >
              <span className="lp-tool-name">{tool.title}</span>
              <span className="lp-tool-desc">{tool.description}</span>
              <span className="lp-tool-cta">Open →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="lp-section lp-section--dev">
        <div className="lp-section-head">
          <h2 className="lp-section-title">Developer Hub</h2>
          <p className="lp-section-desc">
            90+ error explanations across Git, npm, Node.js, and Python. Paste an error, get an answer.
          </p>
        </div>
        <div className="lp-dev-grid">
          {DEV_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="lp-dev-card"
              onClick={() => onOpenTool?.(tool.id)}
            >
              <span className="lp-dev-name">{tool.title}</span>
              <span className="lp-dev-desc">{tool.description}</span>
              <span className="lp-tool-cta">Open →</span>
            </button>
          ))}
        </div>
        <p className="lp-coming-soon">More developer tools coming soon.</p>
      </section>

      <section className="lp-section">
        <div className="lp-section-head lp-section-head--center">
          <h2 className="lp-section-title">How it works</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <span className="lp-step-num">1</span>
            <h3>Choose a tool</h3>
            <p>Pick the task you need. Each tool is purpose-built for one job with no setup required.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">2</span>
            <h3>Upload your file</h3>
            <p>Drag or click to load your file. It&apos;s read directly by your browser — never sent to a server.</p>
          </div>
          <div className="lp-step">
            <span className="lp-step-num">3</span>
            <h3>Download your result</h3>
            <p>Make your edits and export. The result downloads directly to your device. Nothing is stored.</p>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head lp-section-head--center">
          <h2 className="lp-section-title">Why ProjectStack</h2>
        </div>
        <div className="lp-why-grid">
          <div className="lp-why-point">
            <h3>Local processing</h3>
            <p>All operations run in your browser. Files never leave your device.</p>
          </div>
          <div className="lp-why-point">
            <h3>No uploads</h3>
            <p>Nothing is transmitted to any external server — sensitive documents stay private.</p>
          </div>
          <div className="lp-why-point">
            <h3>No sign-in</h3>
            <p>No accounts, no email verification, no setup. Open and start working immediately.</p>
          </div>
          <div className="lp-why-point">
            <h3>Fast results</h3>
            <p>Processing runs on your device. Most operations complete in seconds.</p>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="lp-cta-inner">
          <h2>Ready to get started?</h2>
          <button type="button" className="hero-primary-btn" onClick={onStart}>
            Open Workspace
          </button>
        </div>
        <AdSlot placement="landingFooter" isVisible={showFooterAd} />
      </section>
    </div>
  );
}
