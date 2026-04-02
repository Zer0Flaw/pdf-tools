import AdSlot from "./AdSlot";

const TOOL_SEO_CONTENT = {
  merge: {
    benefits: [
      "Combine multiple PDFs in one browser-based workflow without sending files to a server for core processing.",
      "Control file order before export so the final document comes out in the sequence you want.",
      "Start free with a simple upload flow designed for quick document cleanup and sharing.",
      "Keep the experience fast, predictable, and easy to use for repeat PDF tasks.",
      "Useful when you want one cleaner file for contracts, forms, reports, invoices, or reference packets.",
    ],
    steps: [
      "Add the PDF files you want to combine.",
      "Reorder the files until the final document looks right.",
      "Merge and download a finished PDF directly from your browser.",
    ],
    faqs: [
      {
        question: "Can I control the order of the merged PDF?",
        answer:
          "Yes. ProjectStack lets you reorder PDFs before export so the final merged file follows the order you choose.",
      },
      {
        question: "Are my PDFs uploaded to a server?",
        answer:
          "No. ProjectStack's current core merge workflow runs locally in your browser, so your PDFs do not need to be uploaded for normal processing.",
      },
      {
        question: "Is Merge PDF free to use?",
        answer:
          "Yes. The free version is available with current product limits and watermark rules that are clearly shown in the tool.",
      },
      {
        question: "What is Merge PDF best for?",
        answer:
          "It works well for combining invoices, forms, reference pages, or other small PDF sets into one cleaner document.",
      },
    ],
    relatedTools: ["split", "images", "compress"],
    bottomCtaTitle: "Ready to combine your PDFs?",
    bottomCtaCopy:
      "Open the merge workflow and export one organized PDF without leaving the browser.",
  },
  split: {
    benefits: [
      "Split a PDF into smaller page files in a browser-based workflow that keeps the process simple.",
      "Useful for extracting pages, separating sections, or turning one longer document into smaller pieces.",
      "Files stay on your device during normal processing, so there is no core upload step to a ProjectStack server.",
      "The interface stays focused so you can move from upload to download with minimal friction.",
      "A practical option when one large PDF is harder to review, send, or reuse than smaller page files.",
    ],
    steps: [
      "Choose the PDF you want to break apart.",
      "Run the split workflow in your browser.",
      "Download the generated page files for the pages you need.",
    ],
    faqs: [
      {
        question: "What happens when I split a PDF here?",
        answer:
          "ProjectStack creates separate PDF downloads for the pages in the original document so you can work with smaller files.",
      },
      {
        question: "Do I need to install anything?",
        answer:
          "No. The current split workflow runs in the browser, so you can use it directly from the ProjectStack page.",
      },
      {
        question: "Are my files uploaded during splitting?",
        answer:
          "No. For the current core split tool, processing happens locally in the browser rather than on a backend server.",
      },
      {
        question: "When is Split PDF useful?",
        answer:
          "It is handy when you need to extract a few pages from a larger file, share smaller sections, or separate a document for review.",
      },
    ],
    relatedTools: ["merge", "images", "compress"],
    bottomCtaTitle: "Need smaller PDF files fast?",
    bottomCtaCopy:
      "Start the split tool and turn one document into smaller browser-processed downloads.",
  },
  images: {
    benefits: [
      "Turn JPG and PNG images into a single PDF without leaving the browser.",
      "Keep image-to-PDF conversion simple when you need one file for sharing, printing, or submission.",
      "Core processing happens locally in your browser, so there is no normal server upload step for the conversion itself.",
      "Free usage stays accessible while premium messaging remains clearly separated from the workflow.",
      "Helpful for receipts, screenshots, scans, and photo sets that need to become one organized document.",
    ],
    steps: [
      "Add the images you want in the final PDF.",
      "Arrange them in the order you want the pages to appear.",
      "Convert and download a single PDF built in your browser.",
    ],
    faqs: [
      {
        question: "What image types can I use?",
        answer:
          "The current tool supports JPG and PNG images for the browser-based PDF conversion flow.",
      },
      {
        question: "Can I choose the page order?",
        answer:
          "Yes. You can reorder uploaded images before creating the final PDF so the document reflects the sequence you want.",
      },
      {
        question: "Does ProjectStack upload my images?",
        answer:
          "No. The current core conversion flow processes files locally in the browser during normal use.",
      },
      {
        question: "Why use Images to PDF?",
        answer:
          "It is useful when you want to collect screenshots, scans, receipts, or photos into one PDF that is easier to send or archive.",
      },
    ],
    relatedTools: ["pdfToImage", "merge", "compress"],
    bottomCtaTitle: "Turn your images into one PDF",
    bottomCtaCopy:
      "Launch the conversion workflow and build a clean PDF from your images directly in the browser.",
  },
  pdfToImage: {
    benefits: [
      "Convert PDF pages into PNG image downloads in a browser-based workflow that keeps the core process local.",
      "Useful when you need page previews, visual assets, slide images, or document pages in a format that is easier to share.",
      "ProjectStack handles the current PDF-to-image flow in your browser, so normal processing does not require a server upload.",
      "The tool keeps the steps simple: upload one PDF, render the pages, then download the images you need.",
      "A practical option when a full PDF is less convenient than individual page images for review, design, or upload workflows.",
    ],
    steps: [
      "Choose the PDF you want to convert into page images.",
      "Run the browser-based conversion to generate PNG files for each page.",
      "Download one page at a time or export the full image set.",
    ],
    faqs: [
      {
        question: "What format are the exported page images?",
        answer:
          "The current ProjectStack PDF to Image workflow exports each page as a PNG image to keep the first version simple and reliable.",
      },
      {
        question: "Are my PDF pages uploaded during conversion?",
        answer:
          "No. For the current core workflow, ProjectStack converts PDF pages locally in your browser during normal use.",
      },
      {
        question: "Can I download just one page image?",
        answer:
          "Yes. After conversion, you can download individual page images or use the download-all action for the full set.",
      },
      {
        question: "When is PDF to Image useful?",
        answer:
          "It is useful when you need page thumbnails, shareable image versions of documents, or visual assets from a PDF without opening design software.",
      },
    ],
    relatedTools: ["images", "split", "merge"],
    bottomCtaTitle: "Need PNG images from a PDF?",
    bottomCtaCopy:
      "Open the PDF to Image workflow and generate page images directly in your browser.",
  },
  compress: {
    benefits: [
      "Reduce image file size for sharing, uploads, and storage with a simple browser-based compression flow.",
      "Useful when images feel too large for email, forms, or lightweight web publishing.",
      "Core compression runs locally in your browser, so your images do not need to be uploaded to a ProjectStack backend for normal use.",
      "The workflow stays straightforward so you can compress a small batch and download the results quickly.",
      "A good fit when you need smaller files without adding editing software or a complicated export process.",
    ],
    steps: [
      "Add the images you want to reduce in size.",
      "Adjust the compression quality to match your needs.",
      "Compress and download lighter image files from the browser.",
    ],
    faqs: [
      {
        question: "What does Compress Images do?",
        answer:
          "It creates smaller image downloads that are easier to share or upload while trying to keep the files practically usable.",
      },
      {
        question: "Which image formats are supported?",
        answer:
          "The current tool works with JPG, PNG, and WEBP inputs in the browser-based compression flow.",
      },
      {
        question: "Are my images uploaded during compression?",
        answer:
          "No. For the current core tool, compression happens locally in your browser during normal use.",
      },
      {
        question: "When should I use this tool?",
        answer:
          "It is a good fit when image files are too large for forms, email attachments, or lightweight content publishing.",
      },
    ],
    relatedTools: ["images", "pdfToImage", "merge"],
    bottomCtaTitle: "Need smaller image files?",
    bottomCtaCopy:
      "Open the compression tool and create lighter image downloads without adding extra workflow friction.",
  },
};

const TOOL_LABELS = {
  merge: "Merge PDF",
  split: "Split PDF",
  images: "Images to PDF",
  pdfToImage: "PDF to Image",
  compress: "Compress Images",
};

const TOOL_HELPERS = {
  merge: "Combine multiple PDFs into one finished document.",
  split: "Break one PDF into smaller page-based files.",
  images: "Turn JPG and PNG files into one PDF.",
  pdfToImage: "Export each PDF page as a PNG image.",
  compress: "Reduce image size for easier uploads and sharing.",
};

export default function ToolSeoContent({
  tool,
  onOpenTool,
  onUseTool,
}) {
  const content = TOOL_SEO_CONTENT[tool];

  if (!content) return null;

  return (
    <div className="tool-seo-content">
      <section className="landing-section tool-seo-section">
        <div className="section-heading">
          <p className="section-eyebrow">Why use this tool</p>
          <h2>Fast, browser-based file work without the usual friction</h2>
        </div>

        <div className="benefit-grid">
          {content.benefits.map((benefit) => (
            <div key={benefit} className="benefit-card">
              <p>{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section tool-seo-section">
        <div className="section-heading">
          <p className="section-eyebrow">How it works</p>
          <h2>Three simple steps</h2>
        </div>

        <div className="tool-seo-steps">
          {content.steps.map((step, index) => (
            <div key={step} className="feature-card tool-seo-step-card">
              <div className="tool-seo-step-number">0{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section tool-seo-section">
        <div className="section-heading">
          <p className="section-eyebrow">Common questions</p>
          <h2>Quick answers before you start</h2>
        </div>

        <div className="support-sections">
          {content.faqs.map((faq) => (
            <section key={faq.question} className="support-card">
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="landing-section tool-seo-section">
        <div className="section-heading">
          <p className="section-eyebrow">Related tools</p>
          <h2>Keep moving without starting over</h2>
          <p>
            ProjectStack keeps the rest of the file workflow close by when you
            need a second step.
          </p>
        </div>

        <div className="tool-preview-grid">
          {content.relatedTools.map((relatedTool) => (
            <div key={relatedTool} className="tool-preview-card">
              <h3>{TOOL_LABELS[relatedTool]}</h3>
              <p>{TOOL_HELPERS[relatedTool]}</p>
              <button
                type="button"
                className="hero-secondary-btn tool-preview-btn"
                onClick={() => onOpenTool?.(relatedTool)}
              >
                Open {TOOL_LABELS[relatedTool]}
              </button>
            </div>
          ))}
        </div>
      </section>

      <AdSlot
        placement="toolSeoFooter"
        className="tool-seo-ad"
        minHeight={140}
      />

      <section className="landing-cta tool-seo-section">
        <div className="landing-cta-card">
          <div>
            <p className="section-eyebrow">Use ProjectStack</p>
            <h2>{content.bottomCtaTitle}</h2>
            <p>{content.bottomCtaCopy}</p>
          </div>

          <button type="button" className="hero-primary-btn" onClick={onUseTool}>
            Use {TOOL_LABELS[tool]}
          </button>
        </div>
      </section>
    </div>
  );
}
