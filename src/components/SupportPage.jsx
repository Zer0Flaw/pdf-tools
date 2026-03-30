export const SUPPORT_PAGES = {
  privacy: {
    route: "/privacy-policy",
    title: "Privacy Policy | ProjectStack",
    description:
      "Learn how ProjectStack handles privacy, browser-based file processing, and lightweight product analytics.",
    heading: "Privacy Policy",
    intro:
      "ProjectStack is built so practical file work can stay on your device. This policy explains what is processed locally in the browser and what limited product information may be stored in your browser.",
    sections: [
      {
        title: "Files stay in your browser",
        paragraphs: [
          "ProjectStack processes files locally in your browser whenever you use the core tools. Your PDFs and images are not uploaded to a ProjectStack server as part of normal tool use.",
          "Because processing happens client-side, your files remain under your control on your device during merge, split, conversion, and compression workflows.",
        ],
      },
      {
        title: "What ProjectStack may store locally",
        paragraphs: [
          "ProjectStack may store lightweight product state in your browser, such as the last tool you used, upgrade intent events, analytics event logs, and free-tier usage markers like the daily watermark-free export state.",
          "This local storage is used to keep the app predictable and improve the product experience without requiring an account.",
        ],
      },
      {
        title: "Analytics and product signals",
        paragraphs: [
          "ProjectStack may use lightweight analytics to understand page views and product usage patterns, such as tool selection, upgrade clicks, export success events, watermark-free usage, and ad views.",
          "These signals are intended to improve the product and measure adoption, not to inspect the contents of your files.",
        ],
      },
      {
        title: "Changes and contact",
        paragraphs: [
          "ProjectStack may update this policy as the product evolves. Material changes should be reflected on this page before or when they go live.",
          "If you have a privacy question about the product, use the Contact page for the current support channel.",
        ],
      },
    ],
  },
  terms: {
    route: "/terms-of-use",
    title: "Terms of Use | ProjectStack",
    description:
      "Read the basic terms for using ProjectStack's browser-based file tools.",
    heading: "Terms of Use",
    intro:
      "These terms describe the practical rules for using ProjectStack. They are meant to be clear, simple, and appropriate for a lightweight browser-based utility product.",
    sections: [
      {
        title: "Using the service",
        paragraphs: [
          "ProjectStack is provided as a browser-based file utility workspace. You may use the service for lawful personal or business purposes.",
          "You are responsible for the files you choose to process and for confirming that downloaded results meet your needs before sharing or relying on them.",
        ],
      },
      {
        title: "Free and future premium usage",
        paragraphs: [
          "Some tools include free-tier limits, watermarking, or promotional upgrade messaging. ProjectStack may expand premium capabilities over time without changing the basic client-side nature of the current tools.",
          "Until paid features are introduced, any upgrade messaging is informational product UI and not a payment commitment.",
        ],
      },
      {
        title: "Availability and changes",
        paragraphs: [
          "ProjectStack may update, improve, pause, or remove features at any time in order to maintain the product, improve reliability, or support future launches.",
          "The service is provided on an as-is basis, and no guarantee is made that every workflow will be uninterrupted or error-free.",
        ],
      },
      {
        title: "Reasonable use",
        paragraphs: [
          "You may not use ProjectStack in a way that harms the service, attempts to bypass product limits, or violates applicable law.",
          "If premium functionality is added later, additional commercial terms may apply and will be published clearly before launch.",
        ],
      },
    ],
  },
  contact: {
    route: "/contact",
    title: "Contact | ProjectStack",
    description:
      "Get in touch with ProjectStack for product questions, launch support, or feedback.",
    heading: "Contact",
    intro:
      "ProjectStack is a lightweight product, so the contact experience is intentionally simple. Use this page for product questions, launch support, privacy questions, or feedback.",
    sections: [
      {
        title: "Support and product questions",
        paragraphs: [
          "For help with the product, privacy questions, launch support, or general feedback, use the published ProjectStack support channel for your release.",
          "If you are preparing for launch, this page is the right place to publish your preferred support email, form link, or company contact details.",
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
        title: "Product trust note",
        paragraphs: [
          "ProjectStack's core file tools run in the browser, which helps reduce the need to upload private files just to complete common utility tasks.",
        ],
      },
    ],
  },
  faq: {
    route: "/faq",
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
          "No. ProjectStack's current core tools process files locally in your browser, so your PDFs and images do not need to leave your device during normal use.",
        ],
      },
      {
        title: "Do I need to create an account?",
        paragraphs: [
          "No. ProjectStack is designed to be usable immediately without sign-in, which keeps file work fast and low-friction.",
        ],
      },
      {
        title: "Why are there free limits or watermarks?",
        paragraphs: [
          "ProjectStack is being built as a real product, so the free plan includes intentional limits and upgrade messaging. The goal is to keep the free experience useful while making room for future premium workflows.",
        ],
      },
      {
        title: "What browsers does ProjectStack rely on?",
        paragraphs: [
          "ProjectStack works best in modern browsers with current support for client-side file APIs, canvas processing, and browser storage.",
        ],
      },
    ],
  },
};

export default function SupportPage({
  pageId,
  onBackHome,
  onOpenSupportPage,
}) {
  const page = SUPPORT_PAGES[pageId];

  if (!page) return null;

  return (
    <div className="support-page">
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
      </div>

      <div className="route-intro support-intro">
        <h1>{page.heading}</h1>
        <p>{page.intro}</p>
        <p className="route-trust-note">
          Files are processed locally in your browser for the core ProjectStack
          tools.
        </p>
      </div>

      <div className="support-sections">
        {page.sections.map((section) => (
          <section key={section.title} className="support-card">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      <footer className="site-footer">
        <div className="site-footer-links">
          {Object.entries(SUPPORT_PAGES).map(([id, supportPage]) => (
            <a
              key={supportPage.route}
              href={supportPage.route}
              className="site-footer-link"
              onClick={(event) => {
                event.preventDefault();
                onOpenSupportPage?.(id);
              }}
            >
              {supportPage.heading}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
