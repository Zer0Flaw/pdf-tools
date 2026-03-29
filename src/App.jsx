import { useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import MergeTool from "./tools/MergeTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [activeTool, setActiveTool] = useState("merge");

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
        <div className="app-card">
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

          <h1 className="brand-title">ProjectStack</h1>
        </div>

        <ToolNav activeTool={activeTool} onChange={setActiveTool} />
        {renderActiveTool()}
      </div>
    </div>
  );
}
