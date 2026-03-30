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

const TOOL_METADATA = {
  merge: {
    title: "ProjectStack | Merge PDF",
    description:
      "Merge multiple PDFs into one clean document in a browser-based workspace.",
  },
  split: {
    title: "ProjectStack | Split PDF",
    description:
      "Split a PDF into separate page files in a clean browser-based workspace.",
  },
  compress: {
    title: "ProjectStack | Compress Images",
    description:
      "Compress JPG, PNG, and WEBP images locally in your browser for easier sharing.",
  },
  images: {
    title: "ProjectStack | Images to PDF",
    description:
      "Convert JPG and PNG images into a single PDF in one clean browser-based workspace.",
  },
};

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
  const [activeView, setActiveView] = useState(() =>
    readStoredValue(APP_VIEW_KEY, VALID_VIEWS, "home"),
  );
  const [activeTool, setActiveTool] = useState(() =>
    readStoredValue(APP_TOOL_KEY, VALID_TOOLS, "merge"),
  );

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
          <LandingPage onStart={() => setActiveView("workspace")} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="brand-bar workspace-brand-bar">
          <button
            type="button"
            className="back-home-btn"
            onClick={() => setActiveView("home")}
          >
            ← Back to Home
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

        <ToolNav activeTool={activeTool} onChange={setActiveTool} />
        {renderActiveTool()}
      </div>
    </div>
  );
}
