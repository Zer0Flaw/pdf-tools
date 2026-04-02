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
          "It is designed as a real product, not a throwaway utility page, so consistency, clarity, and trust matter as much as the features themselves.",
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
          "ProjectStack is being built with a freemium model. Free tools help people get value quickly, while premium features and carefully placed ads are intended to support ongoing development over time.",
          "The product direction is to keep core workflows useful and low-friction while building a business that can support better tools in the future.",
        ],
      },
    ],
  },
  privacy: {
    route: "/privacy",
    linkLabel: "Privacy",
    title: "Privacy Policy | ProjectStack",
    description:
      "Learn how ProjectStack handles browser-based file processing, local storage, and lightweight analytics.",
    heading: "Privacy Policy",
    intro:
      "ProjectStack is built so practical file work can stay on your device. This page explains what the current browser-based product does, what limited data may be stored locally, and how lightweight site analytics may be used.",
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
          "ProjectStack may use lightweight analytics to understand site traffic and product usage patterns. This may include privacy-friendly website analytics available through the current Cloudflare Pages setup, as well as lightweight product event tracking used to understand which tools and flows are being used.",
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
          "ProjectStack may use advertising placements to support the free product experience. Ad integrations may change over time as the product evolves.",
          "If ad technology is enabled later, ProjectStack may work with advertising providers that use their own policies or browser technologies. This page will be updated so the wording stays aligned with the live product.",
        ],
      },
      {
        title: "Questions and updates",
        paragraphs: [
          "ProjectStack may update this policy as the service evolves. Material changes should be reflected here before or when they go live.",
          <>
            If you have a privacy question, contact{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>.
          </>,
        ],
      },
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
          "You are responsible for the files you choose to process and for confirming that downloaded results meet your needs before sharing or relying on them.",
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
            If you have a question about these terms, contact{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>.
          </>,
        ],
      },
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
      "ProjectStack is a lightweight product, so the contact experience is intentionally simple. Use this page for support questions, privacy questions, business inquiries, or general feedback.",
    sections: [
      {
        title: "Get in touch",
        paragraphs: [
          <>
            Email{" "}
            <a href="mailto:hello@projectstack.cc">hello@projectstack.cc</a>{" "}
            for support, product questions, business inquiries, or feedback.
          </>,
          "A simple email channel keeps the product easy to maintain while ProjectStack is still in its early launch stage.",
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
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.title}-${index}`}>{paragraph}</p>
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
              {supportPage.linkLabel || supportPage.heading}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
