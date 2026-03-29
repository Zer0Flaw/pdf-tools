import { useEffect, useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import MergeTool from "./tools/MergeTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import LandingPage from "./components/LandingPage";

const APP_VIEW_KEY = "projectstack-active-view";
const APP_TOOL_KEY = "projectstack-active-tool";
const VALID_VIEWS = ["home", "workspace"];
const VALID_TOOLS = ["merge", "split", "compress", "images"];

const TOOL_TITLES = {
  merge: "Merge PDF",
  split: "Split PDF",
  compress: "Compress Images",
  images: "Images to PDF",
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
    document.title =
      activeView === "home"
        ? "ProjectStack | File Tools"
        : `ProjectStack | ${TOOL_TITLES[activeTool]}`;
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
            <h1 className="brand-title">ProjectStack</h1>
          </div>
        </div>

        <ToolNav activeTool={activeTool} onChange={setActiveTool} />
        {renderActiveTool()}
      </div>
    </div>
  );
}
