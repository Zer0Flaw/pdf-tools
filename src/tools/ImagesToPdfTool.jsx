import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_FREE_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function SortableImageItem({
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

export default function ImagesToPdfTool() {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
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

    const imageFiles = incomingFiles.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png")
      );
    });

    if (!imageFiles.length) {
      setMessage({
        type: "error",
        text: "Only JPG and PNG images are supported right now.",
      });
      return;
    }

    const oversizedFiles = imageFiles.filter(
      (file) => !isPremium && file.size > MAX_FILE_SIZE,
    );

    const acceptedFiles = imageFiles.filter(
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
        : MAX_FREE_IMAGES - prev.length;
      const limitedAcceptedFiles = acceptedFiles.slice(0, remainingSlots);
      const combined = [...prev, ...limitedAcceptedFiles];

      if (
        !isPremium &&
        oversizedFiles.length > 0 &&
        acceptedFiles.length > remainingSlots
      ) {
        setMessage({
          type: "error",
          text: "Some images were skipped because of the 5MB limit and free plan image limit.",
        });
      } else if (!isPremium && oversizedFiles.length > 0) {
        setMessage({
          type: "error",
          text: "Some files exceeded the 5MB limit for free users.",
        });
      } else if (!isPremium && acceptedFiles.length > remainingSlots) {
        setMessage({
          type: "error",
          text: `Free plan allows up to ${MAX_FREE_IMAGES} images.`,
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
    if (isConverting) return;
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    if (isConverting) return;
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

  async function convertImagesToPdf() {
    if (!files.length || isConverting) return;

    setIsConverting(true);
    setMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const watermarkFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const lowerName = file.name.toLowerCase();

        const image =
          file.type === "image/png" || lowerName.endsWith(".png")
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes);

        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });

        if (!isPremium) {
          page.drawText("Created with ProjectStack", {
            x: 16,
            y: 16,
            size: 10,
            font: watermarkFont,
            color: rgb(0.45, 0.45, 0.45),
            opacity: 0.75,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images-to-pdf.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while converting your images. Please try again.",
      });
    } finally {
      setIsConverting(false);
    }
  }

  const sortableItems = files.map(
    (file, i) => `${file.name}-${file.size}-${i}`,
  );

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Images to PDF</h2>
          <p className="tool-sub">
            Convert JPG and PNG images into a single PDF document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner />

      <div
        className={`drop-zone ${isDragOver ? "drag-over" : ""} ${isConverting ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isConverting) fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleFileChange}
          hidden
        />

        <div className="drop-zone-title">Select or Drop Images Here</div>
        <div className="drop-zone-sub">Free plan: max 5 images, 5MB each</div>
      </div>

      <div
        className="usage-indicator"
        style={{
          color: files.length >= MAX_FREE_IMAGES ? "#dc2626" : "#374151",
        }}
      >
        {files.length} / {MAX_FREE_IMAGES} images used
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
                <SortableImageItem
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
        disabled={!files.length || isConverting}
        onClick={convertImagesToPdf}
      >
        {isConverting ? "Converting..." : "Create PDF"}
      </button>
    </>
  );
}
