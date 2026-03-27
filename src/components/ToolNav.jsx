// src/components/ToolNav.jsx
const TOOLS = [
  { id: "merge", label: "Merge" },
  { id: "split", label: "Split" },
  { id: "compress", label: "Compress" },
  { id: "images", label: "Images → PDF" },
];

export default function ToolNav({ activeTool, onChange }) {
  return (
    <div className="tool-nav">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`tool-tab ${activeTool === tool.id ? "active" : ""}`}
          onClick={() => onChange(tool.id)}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
