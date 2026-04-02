import React, { useState } from "react";
import AdSlot from "./AdSlot";

const TOOL_PREVIEWS = [
  {
    id: "merge",
    route: "/merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDFs into a single finished document.",
    cta: "Open Merge PDF",
  },
  {
    id: "rotate",
    route: "/rotate-pdf-pages",
    title: "Rotate PDF Pages",
    description: "Fix page orientation and export a corrected PDF.",
    cta: "Open Rotate PDF Pages",
  },
  {
    id: "delete",
    route: "/delete-pdf-pages",
    title: "Delete PDF Pages",
    description: "Remove unwanted pages and export a cleaner PDF.",
    cta: "Open Delete PDF Pages",
  },
  {
    id: "reorder",
    route: "/reorder-pdf-pages",
    title: "Reorder PDF Pages",
    description: "Drag pages into a new sequence and export the updated PDF.",
    cta: "Open Reorder PDF Pages",
  },
  {
    id: "extract",
    route: "/extract-pdf-pages",
    title: "Extract PDF Pages",
    description: "Select pages and export them into a new PDF.",
    cta: "Open Extract PDF Pages",
  },
  {
    id: "split",
    route: "/split-pdf",
    title: "Split PDF",
    description: "Break a PDF into separate page files in seconds.",
    cta: "Open Split PDF",
  },
  {
    id: "images",
    route: "/images-to-pdf",
    title: "Images to PDF",
    description: "Turn JPG and PNG images into one organized PDF.",
    cta: "Open Images to PDF",
  },
  {
    id: "pdfToImage",
    route: "/pdf-to-image",
    title: "PDF to Image",
    description: "Turn PDF pages into clean PNG image downloads.",
    cta: "Open PDF to Image",
  },
  {
    id: "compress",
    route: "/compress-images",
    title: "Compress Images",
    description: "Reduce file size for easier sharing and storage.",
    cta: "Open Compress Images",
  },
];

export default function LandingPage({ onStart, onOpenTool }) {
  const [showFooterAd, setShowFooterAd] = useState(false);
  const conversionTools = TOOL_PREVIEWS.filter((tool) =>
    ["images", "pdfToImage"].includes(tool.id),
  );

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
            Merge PDFs, rotate pages, delete pages, reorder pages, split files,
            extract pages, convert images to PDF, convert PDFs to images, and
            compress images in one clean workspace.
          </p>

          <div className="hero-actions">
            <button className="hero-primary-btn" onClick={onStart}>
              Open Workspace
            </button>
            <button
              className="hero-secondary-btn"
              onClick={() => {
                setShowFooterAd(true);
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

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Why ProjectStack?</p>
          <h2>Built to feel safe, simple, and fast from the first click</h2>
          <p>
            ProjectStack keeps file work practical by prioritizing privacy,
            speed, and a friction-free experience.
          </p>
        </div>

        <div className="benefit-grid">
          <div className="benefit-card">
            <h3>Files processed locally</h3>
            <p>
              Your files never leave your browser. Everything runs securely on
              your device.
            </p>
          </div>

          <div className="benefit-card">
            <h3>No uploads required</h3>
            <p>
              ProjectStack works entirely in your browser, so you keep full
              control of your files.
            </p>
          </div>

          <div className="benefit-card">
            <h3>No sign-in required</h3>
            <p>Use the tools instantly with no accounts or setup.</p>
          </div>

          <div className="benefit-card">
            <h3>Fast processing</h3>
            <p>
              Operations run directly in your browser for quick results.
            </p>
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
            <h3>Rotate PDF Pages</h3>
            <p>Fix page orientation and export a corrected PDF.</p>
          </div>

          <div className="feature-card">
            <h3>Delete PDF Pages</h3>
            <p>Remove unwanted pages and export a cleaner PDF.</p>
          </div>

          <div className="feature-card">
            <h3>Reorder PDF Pages</h3>
            <p>Drag pages into a new sequence and export the updated PDF.</p>
          </div>

          <div className="feature-card">
            <h3>Extract PDF Pages</h3>
            <p>Select pages and export them into a new PDF.</p>
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
            <h3>PDF to Image</h3>
            <p>Convert PDF pages into clean PNG image downloads.</p>
          </div>

          <div className="feature-card">
            <h3>Compress Images</h3>
            <p>Reduce file size for easier sharing and storage.</p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Tool Hub</p>
          <h2>Open the right tool without extra clicks</h2>
          <p>
            Explore every ProjectStack tool from one clean starting point, then
            jump straight into the workflow you need.
          </p>
        </div>

        <div className="tool-preview-grid">
          {TOOL_PREVIEWS.map((tool) => (
            <div
              key={tool.route}
              className="tool-preview-card"
              data-route={tool.route}
            >
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <button
                type="button"
                className="hero-secondary-btn tool-preview-btn"
                onClick={() => onOpenTool?.(tool.id)}
              >
                {tool.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="tool-pair-callout">
          <div className="tool-pair-copy">
            <p className="section-eyebrow">Convert Files</p>
            <h3>Switch cleanly between PDFs and images</h3>
            <p>
              ProjectStack keeps both conversion directions together so it is
              easy to move from image sets to PDFs or turn a PDF back into
              page-by-page PNGs.
            </p>
          </div>

          <div className="tool-pair-grid">
            {conversionTools.map((tool) => (
              <div key={`pair-${tool.id}`} className="tool-preview-card">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <button
                  type="button"
                  className="hero-secondary-btn tool-preview-btn"
                  onClick={() => onOpenTool?.(tool.id)}
                >
                  {tool.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Product design</p>
          <h2>Built like a dependable product, not a quick utility page</h2>
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
              Start with the free tools now. ProjectStack is designed to grow
              with more capable workflows over time while keeping the current
              experience simple.
            </p>
          </div>

          <button className="hero-primary-btn" onClick={onStart}>
            Launch ProjectStack
          </button>
        </div>

        <AdSlot placement="landingFooter" isVisible={showFooterAd} />
      </section>
    </div>
  );
}
