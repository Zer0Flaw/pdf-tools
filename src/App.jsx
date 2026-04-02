import { useEffect, useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import MergeTool from "./tools/MergeTool";
import DeletePdfPagesTool from "./tools/DeletePdfPagesTool";
import ReorderPdfPagesTool from "./tools/ReorderPdfPagesTool";
import RotatePdfTool from "./tools/RotatePdfTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import PdfToImageTool from "./tools/PdfToImageTool";
import LandingPage from "./components/LandingPage";
import SupportPage, { SUPPORT_PAGES } from "./components/SupportPage";
import ToolSeoContent from "./components/ToolSeoContent";
import SiteFooter from "./components/SiteFooter";
import ScrollToTop from "./components/ScrollToTop";
import { trackEvent } from "./utils/analytics";

const APP_VIEW_KEY = "projectstack-active-view";
const APP_TOOL_KEY = "projectstack-active-tool";
const VALID_VIEWS = ["home", "workspace", "support"];
const VALID_TOOLS = ["merge", "rotate", "delete", "reorder", "split", "compress", "images", "pdfToImage"];
const HOME_TITLE = "ProjectStack | Browser-Based PDF and Image Tools";
const HOME_DESCRIPTION =
  "Use browser-based PDF and image tools with ProjectStack. Merge PDFs, rotate pages, delete pages, reorder pages, split files, convert images to PDF, convert PDFs to images, and compress images in one clean workspace.";
const TOOL_ROUTES = {
  merge: "/merge-pdf",
  rotate: "/rotate-pdf-pages",
  delete: "/delete-pdf-pages",
  reorder: "/reorder-pdf-pages",
  split: "/split-pdf",
  images: "/images-to-pdf",
  pdfToImage: "/pdf-to-image",
  compress: "/compress-images",
};

const TOOL_METADATA = {
  merge: {
    title: "Merge PDF Files Online | ProjectStack",
    description:
      "Merge PDF files online in your browser with ProjectStack. Reorder pages, keep files local, and download one clean combined PDF.",
    heading: "Merge PDF Files Online",
    intro:
      "Combine multiple PDF files into one organized document with fast browser-based processing, local file handling, and simple order control before export.",
  },
  rotate: {
    title: "Rotate PDF Pages Online | ProjectStack",
    description:
      "Rotate PDF pages online in your browser with ProjectStack. Adjust page orientation, keep files local, and export a corrected PDF.",
    heading: "Rotate PDF Pages Online",
    intro:
      "Rotate individual PDF pages in a browser-based workspace built for quick page fixes, simple orientation control, and privacy-respecting local processing.",
  },
  delete: {
    title: "Delete PDF Pages Online | ProjectStack",
    description:
      "Delete PDF pages online in your browser with ProjectStack. Remove unwanted pages, keep files local, and export a cleaner PDF.",
    heading: "Delete PDF Pages Online",
    intro:
      "Remove unwanted PDF pages in a browser-based workspace built for quick cleanup, clear page selection, and privacy-respecting local processing.",
  },
  reorder: {
    title: "Reorder PDF Pages Online | ProjectStack",
    description:
      "Reorder PDF pages online in your browser with ProjectStack. Drag pages into a new sequence, keep files local, and export a reorganized PDF.",
    heading: "Reorder PDF Pages Online",
    intro:
      "Reorder PDF pages in a browser-based workspace built for quick organization, drag-and-drop page control, and privacy-respecting local processing.",
  },
  split: {
    title: "Split PDF Files Online | ProjectStack",
    description:
      "Split PDF files online in your browser with ProjectStack. Extract pages into smaller PDF downloads without a server upload for core processing.",
    heading: "Split PDF Online",
    intro:
      "Break a PDF into smaller page files in a clean browser-based workspace designed for quick extraction, simpler sharing, and predictable downloads.",
  },
  compress: {
    title: "Compress Images Online | ProjectStack",
    description:
      "Compress images online in your browser with ProjectStack. Reduce JPG, PNG, and WEBP file sizes for easier sharing and uploads.",
    heading: "Compress Images Online",
    intro:
      "Reduce image file size for sharing, uploads, and storage with a simple browser-based compression workflow that keeps the core process on your device.",
  },
  images: {
    title: "Convert Images to PDF Online | ProjectStack",
    description:
      "Convert images to PDF online in your browser with ProjectStack. Turn JPG and PNG files into one clean downloadable PDF.",
    heading: "Images to PDF Online",
    intro:
      "Turn JPG and PNG images into one clean PDF with a browser-based workflow built for fast conversion, simple reordering, and privacy-respecting processing.",
  },
  pdfToImage: {
    title: "PDF to Image Online | ProjectStack",
    description:
      "Convert PDF pages to image files online in your browser with ProjectStack. Generate clean PNG page downloads without server-side processing for the core workflow.",
    heading: "PDF to Image Online",
    intro:
      "Turn PDF pages into clean PNG image downloads with browser-based processing built for quick exports, simple downloads, and privacy-respecting file handling.",
  },
};

function getToolFromPath(pathname) {
  return (
    Object.entries(TOOL_ROUTES).find(([, route]) => route === pathname)?.[0] ||
    null
  );
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
    }

    return readStoredValue(APP_VIEW_KEY, VALID_VIEWS, "home");
  });
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
    } else {
      updateBrowserPath("/");
    }
  }, [activeSupportPage, activeTool, activeView]);

  useEffect(() => {
    const metadata =
      activeView === "home"
        ? { title: HOME_TITLE, description: HOME_DESCRIPTION }
        : activeView === "support"
          ? SUPPORT_PAGES[activeSupportPage]
          : TOOL_METADATA[activeTool];

    document.title = metadata.title;
    updateMetaTag("name", "description", metadata.description);
    updateMetaTag("property", "og:title", metadata.title);
    updateMetaTag("property", "og:description", metadata.description);
    updateMetaTag("name", "twitter:title", metadata.title);
    updateMetaTag("name", "twitter:description", metadata.description);
  }, [activeSupportPage, activeTool, activeView]);

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

  function scrollToToolWorkspace() {
    if (typeof document === "undefined") return;

    document.getElementById("tool-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function renderActiveTool() {
    switch (activeTool) {
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
        : "/";

  if (activeView === "home") {
    return (
      <>
        <ScrollToTop pathname={currentPath} />
        <div className="app-shell">
          <div className="app-card app-card-home">
            <LandingPage
              onStart={() => openWorkspace("merge")}
              onOpenTool={openWorkspace}
            />
            <SiteFooter onOpenSupportPage={openSupportPage} />
          </div>
        </div>
      </>
    );
  }

  if (activeView === "support") {
    return (
      <>
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
      </>
    );
  }

  const activeToolMetadata = TOOL_METADATA[activeTool];

  return (
    <>
      <ScrollToTop pathname={currentPath} />
      <div className="app-shell">
        <div className="app-card">
          <div className="brand-bar workspace-brand-bar">
            <button
              type="button"
              className="back-home-btn"
              onClick={() => setActiveView("home")}
            >
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

          <div className="route-intro">
            <h1>{activeToolMetadata.heading}</h1>
            <p>{activeToolMetadata.intro}</p>
            <p className="route-trust-note">
              Files are processed locally in your browser, so they never need to
              leave your device.
            </p>
            <div className="tool-hero-actions">
              <button
                type="button"
                className="hero-primary-btn"
                onClick={scrollToToolWorkspace}
              >
                Use {activeToolMetadata.heading.replace(" Online", "")}
              </button>
            </div>
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
    </>
  );
}
