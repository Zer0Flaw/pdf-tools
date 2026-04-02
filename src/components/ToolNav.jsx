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
    description:
      "Move between image and PDF formats with a matched conversion pair.",
    pairLabel: "Two-way conversion",
    tools: [
      {
        id: "images",
        label: "Images to PDF",
        shortLabel: "Images to PDF",
        helper: "Turn JPG and PNG files into one PDF",
      },
      {
        id: "pdfToImage",
        label: "PDF to Image",
        shortLabel: "PDF to Image",
        helper: "Export each PDF page as a PNG image",
      },
    ],
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
            {group.pairLabel && (
              <p className="tool-nav-group-pair">{group.pairLabel}</p>
            )}
          </div>

          <div
            className={`tool-nav-group-tools ${
              group.id === "convert" ? "tool-nav-group-tools-convert" : ""
            }`}
          >
            {group.tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`tool-tab ${activeTool === tool.id ? "active" : ""}`}
                onClick={() => onChange(tool.id)}
                aria-pressed={activeTool === tool.id}
              >
                <span className="tool-tab-title">{tool.label}</span>
                {tool.helper && (
                  <span className="tool-tab-helper">{tool.helper}</span>
                )}
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
