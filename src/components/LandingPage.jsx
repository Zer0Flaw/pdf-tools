import React, { useState } from "react";
import AdSlot from "./AdSlot";

const TOOL_PREVIEWS = [
  {
    id: "edit",
    route: "/edit-pdf",
    title: "Edit PDF",
    description: "Reorder, rotate, delete, and extract pages in one editor.",
    cta: "Open Edit PDF",
  },
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
  {
    id: "errorExplain",
    route: "/error-explain",
    title: "Error Translator",
    description: "Paste an error message and get a clear explanation with fixes.",
    cta: "Open Error Translator",
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

          <p className="hero-eyebrow">
            Simple file tools. Built to get out of your way.
          </p>
          <h1 className="hero-title">Simple file tools for practical work</h1>
          <p className="hero-subtitle">
            Edit PDFs, merge files, rotate pages, delete pages, reorder pages,
            split files, extract pages, convert images to PDF, convert PDFs to
            images, and compress images in one clean workspace.
          </p>

          <div className="hero-actions">
            <button type="button" className="hero-primary-btn" onClick={onStart}>
              Open Workspace
            </button>
            <button
              type="button"
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

      <section id="features" className="landing-section">
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
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">How It Works</p>
          <h2>Three steps from open to done</h2>
          <p>
            ProjectStack is designed to get you in and out as quickly as
            possible. There is no setup, no account, and no waiting.
          </p>
        </div>

        <div className="how-it-works-grid">
          <div className="benefit-card">
            <h3>1. Choose a tool</h3>
            <p>
              Pick the task you need from the workspace — merge, split, rotate,
              edit, convert, or compress. Each tool is purpose-built for one
              clear job so there is no guesswork about where to start. The tool
              opens immediately without any loading screen or setup step.
            </p>
          </div>

          <div className="benefit-card">
            <h3>2. Upload your file</h3>
            <p>
              Drag your file onto the drop zone or click to browse and select
              it. Your file is read directly by your browser and never sent to
              any external server. It stays entirely on your device from the
              moment you select it to the moment you download the result.
            </p>
          </div>

          <div className="benefit-card">
            <h3>3. Download your result</h3>
            <p>
              Make your edits, apply the operation, and export the finished
              file. The result downloads directly to your computer as a standard
              PDF or image file that works in any application. Nothing is stored
              or retained after the session ends.
            </p>
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
              Your files never leave your browser. All PDF and image operations
              run entirely on your device using client-side JavaScript, which
              means there is no round-trip to a server and no waiting for an
              upload to complete. Your documents stay under your control at
              every step.
            </p>
          </div>

          <div className="benefit-card">
            <h3>No uploads required</h3>
            <p>
              ProjectStack works entirely in your browser, so you keep full
              control of your files. Because nothing is transmitted to an
              external service, sensitive documents — contracts, tax forms,
              personal records — can be processed without the risk of them
              passing through a third-party system.
            </p>
          </div>

          <div className="benefit-card">
            <h3>No sign-in required</h3>
            <p>
              Use the tools instantly with no accounts or setup. You do not
              need to create a profile, verify an email, or agree to a data
              collection policy before getting access. Open the tool, load your
              file, and you are already working.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Fast processing</h3>
            <p>
              Operations run directly in your browser for quick results. Because
              processing happens locally, speed depends on your device rather
              than a remote server queue. Most operations on typical documents
              complete in a few seconds even on modest hardware.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="section-eyebrow">Privacy by Design</p>
          <h2>Your files never leave your device</h2>
        </div>

        <div className="privacy-prose">
          <p>
            ProjectStack processes all files entirely within your web browser
            using client-side JavaScript. When you load a PDF or image into any
            tool, that file is read locally by your browser — it is never
            transmitted to a server, never stored in a database, and never
            accessible to anyone other than you. The same applies to the output:
            your finished file downloads directly from the browser to your
            device without passing through any external infrastructure.
          </p>
          <p>
            No account or sign-in is required at any point. ProjectStack does
            not collect personal information, does not track which files you
            work with, and does not retain any document content between
            sessions. When you close the browser tab, nothing from your session
            persists. This architecture was a deliberate product decision, not
            an afterthought — keeping file processing local is the only way to
            guarantee that users retain complete ownership of their documents.
          </p>
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
              Each tool is designed to handle one task clearly and completely,
              with a consistent layout across every tool in the workspace. There
              are no settings buried in menus or options that require trial and
              error to understand. The interface surfaces exactly what you need
              and gets out of the way.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Modern UX</h3>
            <p>
              Drag-and-drop uploads, clear free-tier limits, inline feedback,
              and a clean working surface make the experience feel predictable
              from the first use. Error messages appear inline and dismiss
              automatically. Processing states disable the interface so you
              always know when the tool is working.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Room to grow</h3>
            <p>
              ProjectStack is built to expand beyond PDFs into broader file
              utility workflows over time. The architecture treats each tool as
              an independent unit, which makes it straightforward to add new
              capabilities without disrupting existing ones. New tools follow
              the same patterns so the experience stays consistent as the
              product grows.
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

          <button type="button" className="hero-primary-btn" onClick={onStart}>
            Launch ProjectStack
          </button>
        </div>

        <AdSlot placement="landingFooter" isVisible={showFooterAd} />
      </section>
    </div>
  );
}
