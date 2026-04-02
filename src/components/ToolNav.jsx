import { useState } from "react";

const TOOL_GROUPS = [
  {
    id: "organize",
    label: "Organize PDF",
    tools: [
      { id: "merge", label: "Merge PDF" },
      { id: "split", label: "Split PDF" },
      { id: "rotate", label: "Rotate PDF Pages" },
      { id: "delete", label: "Delete PDF Pages" },
      { id: "reorder", label: "Reorder PDF Pages" },
    ],
  },
  {
    id: "convert",
    label: "Convert",
    tools: [
      { id: "images", label: "Images to PDF" },
      { id: "pdfToImage", label: "PDF to Image" },
    ],
  },
  {
    id: "compress",
    label: "Compress",
    tools: [{ id: "compress", label: "Compress Images" }],
  },
];

function findGroupByTool(toolId) {
  return TOOL_GROUPS.find((group) =>
    group.tools.some((tool) => tool.id === toolId),
  );
}

export default function ToolNav({ activeTool, onChange }) {
  const [openGroup, setOpenGroup] = useState(null);
  const activeGroup = findGroupByTool(activeTool);

  function handleGroupToggle(groupId) {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  }

  function handleToolSelect(toolId) {
    onChange(toolId);
    setOpenGroup(null);
  }

  return (
    <div
      className="tool-nav"
      aria-label="Workspace tool navigation"
      onMouseLeave={() => setOpenGroup(null)}
    >
      <div className="tool-nav-bar">
        <div className="tool-nav-current">
          <span className="tool-nav-current-label">Current tool</span>
          <strong>{activeGroup?.tools.find((tool) => tool.id === activeTool)?.label}</strong>
        </div>

        <div className="tool-nav-menus">
          {TOOL_GROUPS.map((group) => {
            const isOpen = openGroup === group.id;
            const isActiveGroup = group.id === activeGroup?.id;

            return (
              <div
                key={group.id}
                className={`tool-nav-menu ${isOpen ? "open" : ""} ${
                  isActiveGroup ? "active-group" : ""
                }`}
                onMouseEnter={() => setOpenGroup(group.id)}
              >
                <button
                  type="button"
                  className={`tool-nav-trigger ${isActiveGroup ? "active" : ""}`}
                  onClick={() => handleGroupToggle(group.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                >
                  <span>{group.label}</span>
                  <span className="tool-nav-trigger-chevron">▾</span>
                </button>

                <div className="tool-nav-dropdown" role="menu" aria-label={group.label}>
                  {group.tools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      className={`tool-nav-item ${activeTool === tool.id ? "active" : ""}`}
                      onClick={() => handleToolSelect(tool.id)}
                      role="menuitem"
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
