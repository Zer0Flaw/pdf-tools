import { useState } from "react";
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

  const MAX_FREE_FILES = 3;
  const isPremium = false;

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    setFiles((prev) => {
      const combined = [...prev, ...selectedFiles];

      if (combined.length > MAX_FREE_FILES) {
        alert("Free version allows up to 3 PDFs. Upgrade coming soon.");
        return combined.slice(0, MAX_FREE_FILES);
      }

      return combined;
    });

    event.target.value = "";
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function moveFileUp(index) {
    if (index === 0) return;

    setFiles((prev) => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [
        newFiles[index],
        newFiles[index - 1],
      ];
      return newFiles;
    });
  }

  function moveFileDown(index) {
    setFiles((prev) => {
      if (index === prev.length - 1) return prev;

      const newFiles = [...prev];
      [newFiles[index + 1], newFiles[index]] = [
        newFiles[index],
        newFiles[index + 1],
      ];
      return newFiles;
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setFiles((prev) => {
      const oldIndex = prev.findIndex(
        (file, index) => `${file.name}-${file.size}-${index}` === active.id,
      );

      const newIndex = prev.findIndex(
        (file, index) => `${file.name}-${file.size}-${index}` === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return prev;

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
    if (!files.length) return;

    const mergedPdf = await PDFDocument.create();
    const watermarkFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

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
  }

  const sortableItems = files.map(
    (file, index) => `${file.name}-${file.size}-${index}`,
  );

  return (
    <div className="app-shell">
      <div className="app-card">
        <UpgradeBanner />
        <p className="eyebrow">PDF Utility Suite</p>
        <h1>Merge PDF Files</h1>
        <p className="subtitle">
          Upload multiple PDF files, arrange them, and prepare them for merging.
        </p>

        <label className="upload-box">
          <span>Select PDF files</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileChange}
          />
        </label>

        <div className="file-section">
          <h2>Selected Files</h2>

          {files.length === 0 ? (
            <div className="empty-state">No files selected yet.</div>
          ) : (
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
        </div>

        <button
          type="button"
          className="merge-btn"
          disabled={!files.length}
          onClick={mergePdfs}
        >
          Merge PDFs
        </button>
      </div>
    </div>
  );
}
