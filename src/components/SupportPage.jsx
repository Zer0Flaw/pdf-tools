import AdSlot from "./AdSlot";
import UserAuthButton from "./UserAuthButton";

export const SUPPORT_PAGES = {
  about: {
    route: "/about",
    linkLabel: "About",
    title: "About ProjectStack | ProjectStack",
    description:
      "Learn what ProjectStack is, how it works in the browser, and why it focuses on practical privacy-respecting file tools.",
    heading: "About ProjectStack",
    intro:
      "ProjectStack is a browser-based file utility platform built for practical work. The goal is simple: give people fast, privacy-respecting tools that feel trustworthy from the first click.",
    sections: [
      {
        title: "What ProjectStack is",
        paragraphs: [
          "ProjectStack brings together useful file workflows like merging PDFs, splitting documents, converting images to PDF, and compressing images in one clean workspace.",
          "It is designed to feel clear, dependable, and useful from the start, with consistency and trust treated as part of the product rather than an afterthought.",
        ],
      },
      {
        title: "Built to run in your browser",
        paragraphs: [
          "ProjectStack's current core tools process files locally in the browser. That means common workflows can be completed on your device without sending your files to a ProjectStack backend.",
          "This browser-first model keeps the experience fast while respecting the fact that many file tasks involve private or sensitive documents.",
        ],
      },
      {
        title: "How the platform is supported",
        paragraphs: [
          "ProjectStack uses a freemium model. Free core tools are meant to stay practical, while premium features and carefully placed advertising can help support the product when enabled.",
          "The goal is to keep core workflows useful and low-friction while supporting continued improvement over time.",
        ],
      },
    ],
    relatedLinks: [
      { type: "tool", id: "merge", label: "Merge PDF" },
      { type: "support", id: "privacy", label: "Privacy Policy" },
    ],
  },
  privacy: {
    route: "/privacy",
    linkLabel: "Privacy",
    title: "Privacy Policy | ProjectStack",
    description:
      "Learn how ProjectStack handles browser-based file processing, local storage, lightweight analytics, and future advertising changes.",
    heading: "Privacy Policy",
    intro:
      "ProjectStack is built so practical file work can stay on your device. This page explains what the current browser-based product does, what limited information may be stored locally, and how analytics or future advertising changes may affect the site.",
    sections: [
      {
        title: "Local browser-based processing",
        paragraphs: [
          "ProjectStack's current core tools process files locally in your browser. During normal use of merge, split, conversion, and compression workflows, your PDFs and images are not uploaded to a ProjectStack server for processing.",
          "Because these workflows run client-side, your files stay under your control on your device while the tool is being used.",
        ],
      },
      {
        title: "Analytics and basic usage data",
        paragraphs: [
          "ProjectStack uses lightweight analytics to understand site traffic and product usage patterns. This may include privacy-friendly website analytics available through the current Cloudflare Pages setup, as well as lightweight product event tracking used to understand which tools and flows are being used.",
          "These analytics are intended to measure adoption, improve usability, and support product decisions. They are not used to inspect the contents of files processed in the browser.",
        ],
      },
      {
        title: "Local storage and similar browser persistence",
        paragraphs: [
          "ProjectStack may store lightweight product state in your browser, such as the last tool you used, the last view you opened, upgrade intent markers, analytics event logs, and free-tier usage markers like the daily watermark-free export state.",
          "This local browser storage helps keep the app predictable and usable without requiring an account or a backend profile.",
        ],
      },
      {
        title: "Ads and future monetization",
        paragraphs: [
          "ProjectStack includes ad scaffolding, but advertising may not be active at all times. If ads are enabled later, they are intended to support the free product experience without interrupting the core file workflow.",
          "If third-party advertising technology is added in the future, third-party vendors including Google may use cookies, web beacons, or IP-based signals where applicable to serve, personalize, or measure ads. This page will be updated so the disclosures remain aligned with the live product.",
        ],
      },
      {
        title: "Questions and updates",
        paragraphs: [
          "ProjectStack may update this policy as the service evolves. Material changes should be reflected here before or when they go live.",
          <>
            For privacy questions, contact{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>.
          </>,
        ],
      },
    ],
    relatedLinks: [
      { type: "support", id: "contact", label: "Contact ProjectStack" },
      { type: "support", id: "faq", label: "FAQ" },
    ],
  },
  terms: {
    route: "/terms",
    linkLabel: "Terms",
    title: "Terms of Service | ProjectStack",
    description:
      "Read the basic terms for using ProjectStack's browser-based file tools and website.",
    heading: "Terms of Service",
    intro:
      "These terms describe the practical rules for using ProjectStack. They are written to be simple, readable, and appropriate for a lightweight browser-based utility product.",
    sections: [
      {
        title: "Using ProjectStack",
        paragraphs: [
          "ProjectStack is provided as a browser-based file utility workspace. You may use the service for lawful personal or business purposes.",
          "You are responsible for the files and content you choose to process and for confirming that downloaded results meet your needs before sharing or relying on them.",
        ],
      },
      {
        title: "Use at your own risk",
        paragraphs: [
          "ProjectStack is provided on an as-is basis. While the product is built to be useful and reliable, no guarantee is made that every workflow will be uninterrupted, error-free, or suitable for every purpose.",
          "You should review processed files before using them in any personal, business, legal, or operational context.",
        ],
      },
      {
        title: "Availability and service changes",
        paragraphs: [
          "ProjectStack may update, improve, pause, or remove features at any time in order to maintain the product, improve reliability, or support future launches.",
          "ProjectStack may also update these terms over time. Continued use of the service after changes are published means you accept the updated terms.",
        ],
      },
      {
        title: "Prohibited and unlawful use",
        paragraphs: [
          "You may not use ProjectStack in a way that harms the service, attempts to bypass product limits, interferes with other users, or violates applicable law.",
          "You are responsible for ensuring that you have the right to process the files you use with the service and that your use does not infringe the rights of others.",
        ],
      },
      {
        title: "Ownership and contact",
        paragraphs: [
          "ProjectStack, its branding, site content, and product experience remain the property of the ProjectStack operator unless stated otherwise.",
          <>
            For questions about these terms, contact{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>.
          </>,
        ],
      },
    ],
    relatedLinks: [
      { type: "support", id: "contact", label: "Contact ProjectStack" },
      { type: "support", id: "about", label: "About ProjectStack" },
    ],
  },
  contact: {
    route: "/contact",
    linkLabel: "Contact",
    title: "Contact ProjectStack | ProjectStack",
    description:
      "Get in touch with ProjectStack for support, business questions, or product feedback.",
    heading: "Contact ProjectStack",
    intro:
      "ProjectStack keeps contact simple and direct. Use this page for support questions, privacy questions, business inquiries, or general feedback.",
    sections: [
      {
        title: "Get in touch",
        paragraphs: [
          <>
            Email{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>{" "}
            for support, product questions, business inquiries, or feedback.
          </>,
          "Messages sent there are the current contact path for the site and product.",
        ],
      },
      {
        title: "What to include",
        paragraphs: [
          "When reporting an issue, include the tool you used, what you expected to happen, and what happened instead.",
          "Because files are processed locally in the browser, you usually do not need to send the original file in order to describe a problem.",
        ],
      },
      {
        title: "Privacy and support note",
        paragraphs: [
          "If you are reporting a privacy concern or product issue, avoid sending sensitive files unless it is truly necessary. In many cases, a short written description is enough because ProjectStack's core tools run locally in the browser.",
        ],
      },
    ],
    relatedLinks: [
      { type: "support", id: "faq", label: "FAQ" },
      { type: "tool", id: "merge", label: "Merge PDF" },
    ],
  },
  faq: {
    route: "/faq",
    linkLabel: "FAQ",
    title: "FAQ | ProjectStack",
    description:
      "Read common questions about ProjectStack, including browser-based processing, privacy, and free-tier usage.",
    heading: "FAQ",
    intro:
      "These are the most common practical questions someone might have before using or sharing ProjectStack.",
    sections: [
      {
        title: "Are my files uploaded to a server?",
        paragraphs: [
          "No. ProjectStack's current core tools process files locally in your browser, so your PDFs and images do not need to leave your device during normal use. This means common tasks like merging, splitting, rotating, and converting files happen on your device rather than passing through a server. The result downloads directly from your browser when you are done.",
        ],
      },
      {
        title: "Do I need to create an account?",
        paragraphs: [
          "No. ProjectStack is designed to be usable immediately without sign-in, which keeps file work fast and low-friction. You can open any tool, load a file, and start working without providing an email address or creating a profile. Free-tier limits apply to some tools, but those are enforced automatically without needing an account to track them.",
        ],
      },
      {
        title: "Why are there free limits or watermarks?",
        paragraphs: [
          "ProjectStack includes intentional free-plan limits and upgrade messaging so the free experience stays useful while still leaving room for premium features over time. Limits like the number of files per operation and the watermark on certain exports help distinguish the free experience from a paid tier that would remove those constraints. The current free tools are fully functional for individual one-time tasks within those limits.",
        ],
      },
      {
        title: "What browsers does ProjectStack rely on?",
        paragraphs: [
          "ProjectStack works best in modern browsers with current support for client-side file APIs, canvas processing, and browser storage. Chrome, Edge, Firefox, and Safari in their recent versions should all support the core workflows. Older browsers or those with restricted JavaScript environments may not work as expected, since all processing depends on browser-native capabilities.",
        ],
      },
      {
        title: "What file types does ProjectStack support?",
        paragraphs: [
          "ProjectStack currently supports PDF files for most tools, including Edit PDF, Merge PDF, Split PDF, Rotate, Delete, Reorder, and Extract pages. The Images to PDF and Compress tools accept JPG and PNG images, and PDF to Image converts PDF pages into downloadable PNG files. File support is tied to what browsers handle natively, so exotic or password-protected formats may not work in every case.",
        ],
      },
      {
        title: "Is there a file size limit?",
        paragraphs: [
          "Yes. Free-tier file processing is capped at 5 MB per file to keep browser-based operations fast and stable. Some tools also limit the number of files per session — for example, Merge PDF allows up to 3 PDFs in the free tier and Images to PDF allows up to 5 images. These limits are enforced at file selection, so you will see a message before you begin if a file exceeds them.",
        ],
      },
      {
        title: "What happens to my files after I close the browser?",
        paragraphs: [
          "Nothing is retained. Because ProjectStack processes files locally in your browser, your documents are never stored on a server or saved to a ProjectStack database. When you close the tab or browser window, the session ends and your files are no longer accessible through the app. Nothing from your session persists beyond what your own browser may keep in its own temporary cache.",
        ],
      },
      {
        title: "Can I use ProjectStack on my phone or tablet?",
        paragraphs: [
          "Yes, ProjectStack is designed to work on mobile browsers and tablets. The layout adapts to smaller screens, and the core file processing runs in any modern mobile browser the same way it does on a desktop. Some tools with drag-and-drop interfaces work best with a mouse or trackpad, but the essential workflows are accessible on touch devices.",
        ],
      },
      {
        title: "What is Fill & Sign in the Edit PDF tool?",
        paragraphs: [
          "Fill & Sign is a feature inside Edit PDF that lets you add signatures, typed text, dates, and initials directly onto PDF pages before exporting. You can create a signature by typing your name in a handwriting-style font or by uploading an image, then drag it into position on the active page. Everything is applied locally in your browser and flattened into the final PDF when you export.",
        ],
      },
      {
        title: "Will ProjectStack add more tools in the future?",
        paragraphs: [
          "Yes. ProjectStack is built as an expanding platform rather than a fixed set of tools. The current set includes 10 PDF and image tools plus the Developer Hub — a reference library of 90+ error explanations across Git, npm, Node.js, and Python, with an Error Translator for instant lookups. The architecture is designed so new tools can be added without disrupting the existing workspace. Future additions may include new file formats, additional editing capabilities, and more developer utilities.",
        ],
      },
    ],
    relatedLinks: [
      { type: "tool", id: "images", label: "Images to PDF" },
      { type: "support", id: "privacy", label: "Privacy Policy" },
      { type: "tool", id: "edit", label: "Edit PDF" },
    ],
  },
};

export default function SupportPage({
  pageId,
  onBackHome,
  onOpenSupportPage,
  onOpenTool,
}) {
  const page = SUPPORT_PAGES[pageId];

  if (!page) return null;

  return (
    <div className="support-page">
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

      <div className="route-intro support-intro">
        <h1>{page.heading}</h1>
        <p>{page.intro}</p>
      </div>

      <div className="support-sections">
        {page.sections.map((section) => (
          <section key={section.title} className="support-card">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.title}-${index}`}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      {page.relatedLinks?.length > 0 && (
        <section className="lp-section">
          <div className="lp-section-head">
            <h2 className="lp-section-title">Helpful pages</h2>
          </div>
          <div className="lp-tool-grid">
            {page.relatedLinks.map((link) => (
              <button
                key={`${pageId}-${link.type}-${link.id}`}
                type="button"
                className="lp-tool-card"
                onClick={() => {
                  if (link.type === "tool") {
                    onOpenTool?.(link.id);
                    return;
                  }
                  onOpenSupportPage?.(link.id);
                }}
              >
                <span className="lp-tool-name">{link.label}</span>
                <span className="lp-tool-cta">Open →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <AdSlot
        placement="supportFooter"
        className="support-page-ad"
        minHeight={140}
      />
    </div>
  );
}
