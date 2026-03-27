import { useState } from "react";
import "./index.css";
import ToolNav from "./components/ToolNav";
import MergeTool from "./tools/MergeTool";
import SplitTool from "./tools/SplitTool";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";

export default function App() {
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

  return (
    <div className="app-shell">
      <div className="app-card">
        <ToolNav activeTool={activeTool} onChange={setActiveTool} />
        {renderActiveTool()}
      </div>
    </div>
  );
}
