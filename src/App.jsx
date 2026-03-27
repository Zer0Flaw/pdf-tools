import { useState, useRef } from "react";
import "./index.css";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import UpgradeBanner from "./components/UpgradeBanner";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FREE_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function SortableFileItem({
  file,
  index,
  moveFileUp,
  moveFileDown,
  removeFile,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${file.name}-${file.size}-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="file-item">
      <div className="file-item-main" {...attributes} {...listeners}>
        <div className="file-meta">
          <p className="file-name">{file.name}</p>
          <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>

      <div className="file-actions">
        <button type="button" onClick={() => moveFileUp(index)}>
          ↑
        </button>

        <button type="button" onClick={() => moveFileDown(index)}>
          ↓
        </button>

        <button
          type="button"
          className="remove-btn"
          onClick={() => removeFile(index)}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const fileInputRef = useRef(null);
  const isPremium = false;

  function addFiles(newFiles) {
    const incomingFiles = Array.from(newFiles || []);

    const pdfFiles = incomingFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    if (!pdfFiles.length) return;

    const oversizedFiles = pdfFiles.filter(
      (file) => !isPremium && file.size > MAX_FILE_SIZE,
    );

    if (oversizedFiles.length > 0) {
      alert("Some files exceeded the 5MB limit for free users.");
    }

    const acceptedFiles = pdfFiles.filter(
      (file) => isPremium || file.size <= MAX_FILE_SIZE,
    );

    if (!acceptedFiles.length) return;

    setFiles((prev) => {
      const combined = [...prev, ...acceptedFiles];

      if (!isPremium && combined.length > MAX_FREE_FILES) {
        alert("Free version allows up to 3 PDFs. Upgrade coming soon.");
        return combined.slice(0, MAX_FREE_FILES);
      }

      return combined;
    });
  }

  function handleFileChange(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  }

  function moveFileUp(index) {
    if (index === 0) return;

    setFiles((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  function moveFileDown(index) {
    setFiles((prev) => {
      if (index === prev.length - 1) return prev;

      const arr = [...prev];
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      return arr;
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFiles((prev) => {
      const oldIndex = prev.findIndex(
        (file, i) => `${file.name}-${file.size}-${i}` === active.id,
      );

      const newIndex = prev.findIndex(
        (file, i) => `${file.name}-${file.size}-${i}` === over.id,
      );

      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function addWatermark(page, font, text) {
    const { width, height } = page.getSize();

    page.drawText(text, {
      x: width / 2 - 160,
      y: height / 2,
      size: 24,
      font,
      color: rgb(0.75, 0.75, 0.75),
      rotate: degrees(45),
      opacity: 0.4,
    });
  }

  async function mergePdfs() {
    if (!files.length || isMerging) return;

    setIsMerging(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const watermarkFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);

        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );

        for (const page of copiedPages) {
          mergedPdf.addPage(page);

          if (!isPremium) {
            addWatermark(page, watermarkFont, "Merged with PDF Tool Suite");
          }
        }
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsMerging(false);
    }
  }

  const sortableItems = files.map(
    (file, i) => `${file.name}-${file.size}-${i}`,
  );

  return (
    <div className="app-shell">
      <div className="app-card">
        <UpgradeBanner />

        <div
          className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
            hidden
          />

          <div className="drop-zone-title">Select or Drop PDFs Here</div>
          <div className="drop-zone-sub">Free plan: max 3 files, 5MB each</div>
        </div>

        <div
          className="usage-indicator"
          style={{
            color: files.length >= MAX_FREE_FILES ? "#dc2626" : "#374151",
          }}
        >
          {files.length} / {MAX_FREE_FILES} PDFs used
        </div>

        {files.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              <ul className="file-list">
                {files.map((file, index) => (
                  <SortableFileItem
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    index={index}
                    moveFileUp={moveFileUp}
                    moveFileDown={moveFileDown}
                    removeFile={removeFile}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <button
          className="merge-btn"
          disabled={!files.length || isMerging}
          onClick={mergePdfs}
        >
          {isMerging ? "Merging..." : "Merge PDFs"}
        </button>
      </div>
    </div>
  );
}
