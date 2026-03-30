import { useEffect, useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import MergeTool from "./tools/MergeTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import LandingPage from "./components/LandingPage";
import { trackEvent } from "./utils/analytics";

const APP_VIEW_KEY = "projectstack-active-view";
const APP_TOOL_KEY = "projectstack-active-tool";
const VALID_VIEWS = ["home", "workspace"];
const VALID_TOOLS = ["merge", "split", "compress", "images"];
const HOME_TITLE = "ProjectStack | Simple File Tools";
const HOME_DESCRIPTION =
  "Merge PDFs, split files, convert images to PDF, and compress images in one clean workspace.";
const TOOL_ROUTES = {
  merge: "/merge-pdf",
  split: "/split-pdf",
  images: "/images-to-pdf",
  compress: "/compress-images",
};

const TOOL_METADATA = {
  merge: {
    title: "ProjectStack | Merge PDF Online",
    description:
      "Merge multiple PDFs into one clean document in a browser-based workspace.",
    heading: "Merge PDF files online",
    intro:
      "Combine multiple PDF files into one organized document in a clean browser-based workspace.",
  },
  split: {
    title: "ProjectStack | Split PDF Online",
    description:
      "Split a PDF into separate page files in a clean browser-based workspace.",
    heading: "Split PDF pages online",
    intro:
      "Break a PDF into separate page files quickly while keeping the workflow simple and predictable.",
  },
  compress: {
    title: "ProjectStack | Compress Images Online",
    description:
      "Compress JPG, PNG, and WEBP images locally in your browser for easier sharing.",
    heading: "Compress images online",
    intro:
      "Reduce image file size for easier sharing and storage with simple browser-based compression.",
  },
  images: {
    title: "ProjectStack | Images to PDF Online",
    description:
      "Convert JPG and PNG images into a single PDF in one clean browser-based workspace.",
    heading: "Convert images to PDF online",
    intro:
      "Turn JPG and PNG images into a single PDF in one clean workspace designed for practical file tasks.",
  },
};

function getToolFromPath(pathname) {
  return (
    Object.entries(TOOL_ROUTES).find(([, route]) => route === pathname)?.[0] ||
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
    }

    return readStoredValue(APP_VIEW_KEY, VALID_VIEWS, "home");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const toolFromPath = getToolFromPath(window.location.pathname);

      if (toolFromPath) {
        setActiveTool(toolFromPath);
        setActiveView("workspace");
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
    } else {
      updateBrowserPath("/");
    }
  }, [activeTool, activeView]);

  useEffect(() => {
    const metadata =
      activeView === "home"
        ? { title: HOME_TITLE, description: HOME_DESCRIPTION }
        : TOOL_METADATA[activeTool];

    document.title = metadata.title;
    updateMetaTag("name", "description", metadata.description);
    updateMetaTag("property", "og:title", metadata.title);
    updateMetaTag("property", "og:description", metadata.description);
    updateMetaTag("name", "twitter:title", metadata.title);
    updateMetaTag("name", "twitter:description", metadata.description);
  }, [activeTool, activeView]);

  useEffect(() => {
    if (activeView !== "workspace") return;

    trackEvent("tool_selected", {
      tool: activeTool,
    });
  }, [activeTool, activeView]);

  function openWorkspace(tool = activeTool) {
    setActiveTool(tool);
    setActiveView("workspace");
  }

  function renderActiveTool() {
    switch (activeTool) {
      case "split":
        return <SplitTool />;
      case "compress":
        return <CompressTool />;
      case "images":
        return <ImagesToPdfTool />;
      case "merge":
      default:
        return <MergeTool />;
    }
  }

  if (activeView === "home") {
    return (
      <div className="app-shell">
        <div className="app-card app-card-home">
          <LandingPage
            onStart={() => openWorkspace("merge")}
            onOpenTool={openWorkspace}
          />
        </div>
      </div>
    );
  }

  const activeToolMetadata = TOOL_METADATA[activeTool];

  return (
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
        </div>

        <ToolNav activeTool={activeTool} onChange={openWorkspace} />
        {renderActiveTool()}
      </div>
    </div>
  );
}
