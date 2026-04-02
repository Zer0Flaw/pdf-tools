const TOOL_GROUPS = [
  {
    id: "organize",
    label: "Organize PDF",
    description: "Reorder, combine, or break PDFs into the files you need.",
    tools: [
      { id: "merge", label: "Merge PDF", shortLabel: "Merge" },
      { id: "split", label: "Split PDF", shortLabel: "Split" },
    ],
  },
  {
    id: "convert",
    label: "Convert Files",
    description: "Turn everyday file types into a cleaner finished document.",
    tools: [{ id: "images", label: "Images to PDF", shortLabel: "Images to PDF" }],
  },
  {
    id: "compress",
    label: "Compress",
    description: "Reduce file size before sharing, uploading, or storing files.",
    tools: [
      {
        id: "compress",
        label: "Compress Images",
        shortLabel: "Compress Images",
      },
    ],
  },
];

export default function ToolNav({ activeTool, onChange }) {
  return (
    <div className="tool-nav" aria-label="Workspace tool navigation">
      {TOOL_GROUPS.map((group) => (
        <section key={group.id} className="tool-nav-group">
          <div className="tool-nav-group-copy">
            <p className="tool-nav-group-label">{group.label}</p>
            <p className="tool-nav-group-description">{group.description}</p>
          </div>

          <div className="tool-nav-group-tools">
            {group.tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`tool-tab ${activeTool === tool.id ? "active" : ""}`}
                onClick={() => onChange(tool.id)}
                aria-pressed={activeTool === tool.id}
              >
                <span className="tool-tab-title">{tool.label}</span>
                <span className="tool-tab-sub">
                  {activeTool === tool.id ? "Open now" : `Use ${tool.shortLabel}`}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
