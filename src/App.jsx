import { useEffect, useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import EditPdfTool from "./tools/EditPdfTool";
import MergeTool from "./tools/MergeTool";
import DeletePdfPagesTool from "./tools/DeletePdfPagesTool";
import ExtractPdfPagesTool from "./tools/ExtractPdfPagesTool";
import ReorderPdfPagesTool from "./tools/ReorderPdfPagesTool";
import RotatePdfTool from "./tools/RotatePdfTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import PdfToImageTool from "./tools/PdfToImageTool";
import ErrorTranslatorTool from "./tools/ErrorTranslatorTool";
import ErrorDetailPage from "./components/ErrorDetailPage";
import LandingPage from "./components/LandingPage";
import SupportPage, { SUPPORT_PAGES } from "./components/SupportPage";
import ToolSeoContent from "./components/ToolSeoContent";
import SiteFooter from "./components/SiteFooter";
import ScrollToTop from "./components/ScrollToTop";
import { trackEvent } from "./utils/analytics";
import { getErrorBySlug } from "./utils/errorMatcher";
import UserAuthButton from "./components/UserAuthButton";
import { useUser } from "@clerk/clerk-react";
import { SubscriptionProvider } from "./utils/subscription";

const CLERK_AVAILABLE = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

// Rendered only when ClerkProvider is present — safe to call useUser() here
function AppWithSubscription({ children }) {
  const { user, isSignedIn } = useUser();
  const userEmail = isSignedIn ? user?.primaryEmailAddress?.emailAddress : null;

  return (
    <SubscriptionProvider email={userEmail}>
      {children}
    </SubscriptionProvider>
  );
}

function AppSubscriptionWrapper({ children }) {
  if (!CLERK_AVAILABLE) {
    return <SubscriptionProvider email={null}>{children}</SubscriptionProvider>;
  }

  return <AppWithSubscription>{children}</AppWithSubscription>;
}

const APP_VIEW_KEY = "projectstack-active-view";
const APP_TOOL_KEY = "projectstack-active-tool";
const VALID_VIEWS = ["home", "workspace", "support"];
const VALID_TOOLS = ["edit", "merge", "rotate", "delete", "reorder", "extract", "split", "compress", "images", "pdfToImage", "errorExplain"];
const HOME_TITLE = "ProjectStack | File Tools & Developer Utilities";
const HOME_DESCRIPTION =
  "Browser-based file tools and developer utilities. Edit PDFs, merge documents, compress images, translate error messages, and more — all processed locally in your browser.";
const TOOL_ROUTES = {
  edit: "/edit-pdf",
  merge: "/merge-pdf",
  rotate: "/rotate-pdf-pages",
  delete: "/delete-pdf-pages",
  reorder: "/reorder-pdf-pages",
  extract: "/extract-pdf-pages",
  split: "/split-pdf",
  images: "/images-to-pdf",
  pdfToImage: "/pdf-to-image",
  compress: "/compress-images",
  errorExplain: "/error-explain",
};

const TOOL_METADATA = {
  edit: {
    title: "Edit PDF Online | ProjectStack",
    description:
      "Edit PDF pages online in your browser with ProjectStack. Reorder, rotate, delete, and extract pages in one local browser-based workspace.",
    heading: "Edit PDF Online",
    intro:
      "Organize and clean up PDF pages in one browser-based editor built for reordering, rotating, deleting, extracting, and exporting without sending files away for core processing.",
    contextNote:
      "Upload a PDF to reorder, rotate, delete, or extract pages in one workspace. Your file stays in your browser during the entire session — nothing is sent to a server at any point. When you are finished, download the edited PDF directly to your device.",
  },
  merge: {
    title: "Merge PDF Files Online | ProjectStack",
    description:
      "Merge PDF files online in your browser with ProjectStack. Reorder pages, keep files local, and download one clean combined PDF.",
    heading: "Merge PDF Files Online",
    intro:
      "Combine multiple PDF files into one organized document with fast browser-based processing, local file handling, and simple order control before export.",
    contextNote:
      "Add multiple PDF files and arrange them in the order you want before combining. ProjectStack merges them into a single document using your browser's built-in processing, so your files stay on your device from start to finish. Download the merged PDF when you are ready.",
  },
  rotate: {
    title: "Rotate PDF Pages Online | ProjectStack",
    description:
      "Rotate PDF pages online in your browser with ProjectStack. Adjust page orientation, keep files local, and export a corrected PDF.",
    heading: "Rotate PDF Pages Online",
    intro:
      "Rotate individual PDF pages in a browser-based workspace built for quick page fixes, simple orientation control, and privacy-respecting local processing.",
    contextNote:
      "Upload a PDF, then select which pages need rotating and apply the correction. The rotation is calculated and applied locally in your browser without sending your file to any server. Export the corrected PDF as soon as the orientation looks right.",
  },
  delete: {
    title: "Delete PDF Pages Online | ProjectStack",
    description:
      "Delete PDF pages online in your browser with ProjectStack. Remove unwanted pages, keep files local, and export a cleaner PDF.",
    heading: "Delete PDF Pages Online",
    intro:
      "Remove unwanted PDF pages in a browser-based workspace built for quick cleanup, clear page selection, and privacy-respecting local processing.",
    contextNote:
      "Upload a PDF and mark the pages you want to remove. ProjectStack rebuilds the document without those pages entirely in your browser, with no server involved in the process. Download the cleaned-up PDF directly when you are finished.",
  },
  reorder: {
    title: "Reorder PDF Pages Online | ProjectStack",
    description:
      "Reorder PDF pages online in your browser with ProjectStack. Drag pages into a new sequence, keep files local, and export a reorganized PDF.",
    heading: "Reorder PDF Pages Online",
    intro:
      "Reorder PDF pages in a browser-based workspace built for quick organization, drag-and-drop page control, and privacy-respecting local processing.",
    contextNote:
      "Upload a PDF and drag pages into the sequence that makes sense for your document. The reordering happens locally in your browser without any file leaving your device. Export the reorganized PDF when the page order looks right.",
  },
  extract: {
    title: "Extract PDF Pages Online | ProjectStack",
    description:
      "Extract PDF pages online in your browser with ProjectStack. Select the pages you want to keep, keep files local, and export a new PDF.",
    heading: "Extract PDF Pages Online",
    intro:
      "Extract selected PDF pages in a browser-based workspace built for quick page selection, simple export, and privacy-respecting local processing.",
    contextNote:
      "Upload a PDF and select the pages you want to save as a separate document. ProjectStack builds the new PDF from your selection directly in your browser without uploading anything to a server. Download the extracted pages as a standalone PDF file.",
  },
  split: {
    title: "Split PDF Files Online | ProjectStack",
    description:
      "Split PDF files online in your browser with ProjectStack. Extract pages into smaller PDF downloads without a server upload for core processing.",
    heading: "Split PDF Online",
    intro:
      "Break a PDF into smaller page files in a clean browser-based workspace designed for quick extraction, simpler sharing, and predictable downloads.",
    contextNote:
      "Upload a PDF and ProjectStack breaks it into individual page files — one per page. The entire split operation runs in your browser without uploading your document to any server. Each page downloads as its own self-contained PDF file.",
  },
  compress: {
    title: "Compress Images Online | ProjectStack",
    description:
      "Compress images online in your browser with ProjectStack. Reduce JPG, PNG, and WEBP file sizes for easier sharing and uploads.",
    heading: "Compress Images Online",
    intro:
      "Reduce image file size for sharing, uploads, and storage with a simple browser-based compression workflow that keeps the core process on your device.",
    contextNote:
      "Upload one or more images and ProjectStack reduces their file size using canvas-based compression that runs entirely in your browser. No image data is sent to any server during the process. Download the compressed files when you are satisfied with the results.",
  },
  images: {
    title: "Convert Images to PDF Online | ProjectStack",
    description:
      "Convert images to PDF online in your browser with ProjectStack. Turn JPG and PNG files into one clean downloadable PDF.",
    heading: "Images to PDF Online",
    intro:
      "Turn JPG and PNG images into one clean PDF with a browser-based workflow built for fast conversion, simple reordering, and privacy-respecting processing.",
    contextNote:
      "Upload JPG or PNG images and arrange them in the order you want before converting. ProjectStack compiles them into a single PDF document entirely within your browser, with no server handling your files. Download the finished PDF when the layout looks right.",
  },
  pdfToImage: {
    title: "PDF to Image Online | ProjectStack",
    description:
      "Convert PDF pages to image files online in your browser with ProjectStack. Generate clean PNG page downloads without server-side processing for the core workflow.",
    heading: "PDF to Image Online",
    intro:
      "Turn PDF pages into clean PNG image downloads with browser-based processing built for quick exports, simple downloads, and privacy-respecting file handling.",
    contextNote:
      "Upload a PDF and ProjectStack converts each page into a clean PNG image file. The conversion runs locally in your browser using built-in rendering, so your document never leaves your device. Each page downloads as a separate image file ready to use anywhere.",
  },
  errorExplain: {
    title: "Developer Hub — Error Reference for Git, npm, Python, TypeScript & Docker | ProjectStack",
    description:
      "Paste any error message from Git, npm, Node.js, Python, TypeScript, or Docker and instantly get a plain-English explanation with common causes and step-by-step fixes. Free, browser-based, no sign-in needed.",
    heading: "Error Translator",
    intro:
      "Paste an error message from Git, npm, Node.js, Python, TypeScript, or Docker and get a clear explanation with causes and fix commands — no searching Stack Overflow required.",
    contextNote:
      "Paste any error message from Git, npm, Node.js, Python, TypeScript, or Docker and get an instant explanation with common causes and step-by-step fixes. The database covers 150+ errors across six ecosystems, with more being added regularly. Everything runs in your browser — your error text is never sent to a server.",
  },
};

function getToolFromPath(pathname) {
  return (
    Object.entries(TOOL_ROUTES).find(([, route]) => route === pathname)?.[0] ||
    null
  );
}

function getErrorSlugFromPath(pathname) {
  const match = pathname.match(/^\/errors\/(.+)$/);
  return match ? match[1] : null;
}

function getSupportPageFromPath(pathname) {
  return (
    Object.entries(SUPPORT_PAGES).find(([, page]) => page.route === pathname)?.[0] ||
    null
  );
}

function updateBrowserPath(pathname) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === pathname) return;

  window.history.pushState({}, "", pathname);
}

function readStoredValue(key, validValues, fallbackValue) {
  if (typeof window === "undefined") return fallbackValue;

  try {
    const value = window.localStorage.getItem(key);
    return value && validValues.includes(value) ? value : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function updateMetaTag(attributeName, attributeValue, content) {
  if (typeof document === "undefined") return;

  const selector = `meta[${attributeName}="${attributeValue}"]`;
  const metaTag = document.querySelector(selector);

  if (metaTag) {
    metaTag.setAttribute("content", content);
  }
}

function updateCanonicalTag(href) {
  if (typeof document === "undefined") return;

  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const BASE_URL = "https://projectstack.cc";

export default function App() {
  const [activeTool, setActiveTool] = useState(() => {
    if (typeof window !== "undefined") {
      const toolFromPath = getToolFromPath(window.location.pathname);
      if (toolFromPath) return toolFromPath;
    }

    return readStoredValue(APP_TOOL_KEY, VALID_TOOLS, "merge");
  });
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== "undefined") {
      const toolFromPath = getToolFromPath(window.location.pathname);
      if (toolFromPath) return "workspace";
      const supportPageFromPath = getSupportPageFromPath(window.location.pathname);
      if (supportPageFromPath) return "support";
      const errorSlugFromPath = getErrorSlugFromPath(window.location.pathname);
      if (errorSlugFromPath) return "errorPage";
    }

    return readStoredValue(APP_VIEW_KEY, VALID_VIEWS, "home");
  });
  const [activeErrorSlug, setActiveErrorSlug] = useState(() => {
    if (typeof window !== "undefined") {
      return getErrorSlugFromPath(window.location.pathname) || "";
    }
    return "";
  });
  const [developerHubEcosystem, setDeveloperHubEcosystem] = useState(null);
  const [activeSupportPage, setActiveSupportPage] = useState(() => {
    if (typeof window !== "undefined") {
      const supportPageFromPath = getSupportPageFromPath(window.location.pathname);
      if (supportPageFromPath) return supportPageFromPath;
    }

    return "privacy";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const toolFromPath = getToolFromPath(window.location.pathname);
      const supportPageFromPath = getSupportPageFromPath(window.location.pathname);
      const errorSlugFromPath = getErrorSlugFromPath(window.location.pathname);

      if (toolFromPath) {
        setActiveTool(toolFromPath);
        setActiveView("workspace");
        return;
      }

      if (supportPageFromPath) {
        setActiveSupportPage(supportPageFromPath);
        setActiveView("support");
        return;
      }

      if (errorSlugFromPath) {
        setActiveErrorSlug(errorSlugFromPath);
        setActiveView("errorPage");
        return;
      }

      setActiveView("home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(APP_VIEW_KEY, activeView);
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [activeView]);

  useEffect(() => {
    try {
      window.localStorage.setItem(APP_TOOL_KEY, activeTool);
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [activeTool]);

  useEffect(() => {
    if (activeView === "workspace") {
      updateBrowserPath(TOOL_ROUTES[activeTool]);
    } else if (activeView === "support") {
      updateBrowserPath(SUPPORT_PAGES[activeSupportPage].route);
    } else if (activeView === "errorPage") {
      updateBrowserPath(`/errors/${activeErrorSlug}`);
    } else {
      updateBrowserPath("/");
    }
  }, [activeSupportPage, activeTool, activeView, activeErrorSlug]);

  useEffect(() => {
    let metadata;
    if (activeView === "home") {
      metadata = { title: HOME_TITLE, description: HOME_DESCRIPTION };
    } else if (activeView === "support") {
      metadata = SUPPORT_PAGES[activeSupportPage];
    } else if (activeView === "errorPage") {
      const error = getErrorBySlug(activeErrorSlug);
      const ecosystemLabel = error?.ecosystem === "npm" ? "npm & Node.js" : error?.ecosystem === "python" ? "Python" : error?.ecosystem === "typescript" ? "TypeScript" : error?.ecosystem === "docker" ? "Docker" : "Git";
      metadata = error
        ? {
            title: `${error.shortTitle} | ${ecosystemLabel} Errors | ProjectStack`,
            description: error.explanation,
          }
        : {
            title: "Error Not Found | ProjectStack",
            description: "This error page could not be found.",
          };
    } else {
      metadata = TOOL_METADATA[activeTool];
    }

    document.title = metadata.title;
    updateMetaTag("name", "description", metadata.description);
    updateMetaTag("property", "og:title", metadata.title);
    updateMetaTag("property", "og:description", metadata.description);
    updateMetaTag("name", "twitter:title", metadata.title);
    updateMetaTag("name", "twitter:description", metadata.description);

    let canonicalPath;
    if (activeView === "home") {
      canonicalPath = "/";
    } else if (activeView === "workspace") {
      canonicalPath = TOOL_ROUTES[activeTool] + "/";
    } else if (activeView === "support") {
      canonicalPath = SUPPORT_PAGES[activeSupportPage].route + "/";
    } else if (activeView === "errorPage") {
      canonicalPath = `/errors/${activeErrorSlug}/`;
    } else {
      canonicalPath = "/";
    }
    const canonicalUrl = BASE_URL + canonicalPath;
    updateCanonicalTag(canonicalUrl);
    updateMetaTag("property", "og:url", canonicalUrl);
  }, [activeSupportPage, activeTool, activeView, activeErrorSlug]);

  useEffect(() => {
    if (activeView !== "workspace") return;

    trackEvent("tool_opened", {
      tool: activeTool,
    });
  }, [activeTool, activeView]);

  function openWorkspace(tool = activeTool) {
    setActiveTool(tool);
    setActiveView("workspace");
  }

  function openSupportPage(pageId) {
    setActiveSupportPage(pageId);
    setActiveView("support");
  }

  function openErrorPage(slug) {
    setActiveErrorSlug(slug);
    setActiveView("errorPage");
  }

  function scrollToToolWorkspace() {
    if (typeof document === "undefined") return;

    document.getElementById("tool-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function renderActiveTool() {
    switch (activeTool) {
      case "edit":
        return <EditPdfTool />;
      case "extract":
        return <ExtractPdfPagesTool />;
      case "reorder":
        return <ReorderPdfPagesTool />;
      case "delete":
        return <DeletePdfPagesTool />;
      case "rotate":
        return <RotatePdfTool />;
      case "split":
        return <SplitTool />;
      case "compress":
        return <CompressTool />;
      case "images":
        return <ImagesToPdfTool />;
      case "pdfToImage":
        return <PdfToImageTool />;
      case "errorExplain":
        return (
          <ErrorTranslatorTool
            onNavigateToError={openErrorPage}
            initialDirectoryEcosystem={developerHubEcosystem}
          />
        );
      case "merge":
      default:
        return <MergeTool />;
    }
  }

  const currentPath =
    activeView === "workspace"
      ? TOOL_ROUTES[activeTool]
      : activeView === "support"
        ? SUPPORT_PAGES[activeSupportPage].route
        : activeView === "errorPage"
          ? `/errors/${activeErrorSlug}`
          : "/";

  if (activeView === "home") {
    return (
      <AppSubscriptionWrapper>
        <ScrollToTop pathname={currentPath} />
        <div className="app-shell">
          <div className="app-card app-card-home">
            <div className="app-top-bar">
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
          <LandingPage
              onStart={() => openWorkspace("merge")}
              onOpenTool={openWorkspace}
            />
            <SiteFooter onOpenSupportPage={openSupportPage} />
          </div>
        </div>
      </AppSubscriptionWrapper>
    );
  }

  if (activeView === "errorPage") {
    return (
      <AppSubscriptionWrapper>
        <ScrollToTop pathname={currentPath} />
        <div className="app-shell">
          <div className="app-card app-card-home">
            <ErrorDetailPage
              slug={activeErrorSlug}
              onBackHome={() => setActiveView("home")}
              onOpenErrorTool={() => openWorkspace("errorExplain")}
              onNavigateToDeveloperHub={(ecosystem) => {
                setDeveloperHubEcosystem(ecosystem);
                openWorkspace("errorExplain");
              }}
              onNavigateToError={openErrorPage}
              onOpenSupportPage={openSupportPage}
            />
            <SiteFooter onOpenSupportPage={openSupportPage} />
          </div>
        </div>
      </AppSubscriptionWrapper>
    );
  }

  if (activeView === "support") {
    return (
      <AppSubscriptionWrapper>
        <ScrollToTop pathname={currentPath} />
        <div className="app-shell">
          <div className="app-card app-card-home">
            <SupportPage
              pageId={activeSupportPage}
              onBackHome={() => setActiveView("home")}
              onOpenSupportPage={openSupportPage}
              onOpenTool={openWorkspace}
            />
            <SiteFooter onOpenSupportPage={openSupportPage} />
          </div>
        </div>
      </AppSubscriptionWrapper>
    );
  }

  const activeToolMetadata = TOOL_METADATA[activeTool];
  const workspaceCardClassName = "app-card app-card-editor";

  return (
    <AppSubscriptionWrapper>
      <ScrollToTop pathname={currentPath} />
      <div className="app-shell">
        <div className={workspaceCardClassName}>
          <div className="brand-bar workspace-brand-bar">
            <button
              type="button"
              className="back-home-btn"
              onClick={() => setActiveView("home")}
            >
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

          <div className="route-intro">
            <h1>{activeToolMetadata.heading}</h1>
            <p>{activeToolMetadata.intro}</p>
          </div>

          <div className="tool-context-bar">
            <p>{activeToolMetadata.contextNote}</p>
          </div>

          <div id="tool-workspace" className="tool-workspace">
            <ToolNav activeTool={activeTool} onChange={openWorkspace} />
            {renderActiveTool()}
          </div>

          <ToolSeoContent
            tool={activeTool}
            onOpenTool={openWorkspace}
            onUseTool={scrollToToolWorkspace}
          />
          <SiteFooter onOpenSupportPage={openSupportPage} />
        </div>
      </div>
    </AppSubscriptionWrapper>
  );
}
