import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FREE_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

export default function MergeTool() {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const isPremium = false;

useEffect(() => {
  if (!message) return;

  const timer = setTimeout(() => {
    setMessage(null);
  }, 3500);

  return () => clearTimeout(timer);
}, [message]);

  function addFiles(newFiles) {
    const incomingFiles = Array.from(newFiles || []);
    setMessage(null);

    const pdfFiles = incomingFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    if (!pdfFiles.length) {
      setMessage({
        type: "error",
        text: "Only PDF files are supported.",
      });
      return;
    }

    const oversizedFiles = pdfFiles.filter(
      (file) => !isPremium && file.size > MAX_FILE_SIZE,
    );

    const acceptedFiles = pdfFiles.filter(
      (file) => isPremium || file.size <= MAX_FILE_SIZE,
    );

    if (!acceptedFiles.length && oversizedFiles.length > 0) {
      setMessage({
        type: "error",
        text: "Some files exceeded the 5MB limit for free users.",
      });
      return;
    }

    setFiles((prev) => {
      const remainingSlots = isPremium
        ? Infinity
        : MAX_FREE_FILES - prev.length;
      const limitedAcceptedFiles = acceptedFiles.slice(0, remainingSlots);
      const combined = [...prev, ...limitedAcceptedFiles];

      if (
        !isPremium &&
        oversizedFiles.length > 0 &&
        acceptedFiles.length > remainingSlots
      ) {
        setMessage({
          type: "error",
          text: "Some files were skipped because of the 5MB limit and free plan file limit.",
        });
      } else if (!isPremium && oversizedFiles.length > 0) {
        setMessage({
          type: "error",
          text: "Some files exceeded the 5MB limit for free users.",
        });
      } else if (!isPremium && acceptedFiles.length > remainingSlots) {
        setMessage({
          type: "error",
          text: "Free plan allows up to 3 PDFs.",
        });
      } else {
        setMessage(null);
      }

      return combined;
    });
  }

  function handleFileChange(e) {
    addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragOver(e) {
    if (isMerging) return;
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    if (isMerging) return;
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setMessage(null);
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
    setMessage(null);

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
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while merging your PDFs. Please try again.",
      });
    } finally {
      setIsMerging(false);
    }
  }

  const sortableItems = files.map(
    (file, i) => `${file.name}-${file.size}-${i}`,
  );

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Merge PDF</h2>
          <p className="tool-sub">
            Combine multiple PDFs into a single document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner />

      <div
        className={`drop-zone 
    ${isDragOver ? "drag-over" : ""} 
    ${isMerging ? "disabled" : ""}
  `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isMerging) fileInputRef.current?.click();
        }}
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

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

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
    </>
  );
}
