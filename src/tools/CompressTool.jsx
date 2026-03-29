import { useState, useRef, useEffect } from "react";
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

function SortableCompressItem({
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

export default function CompressTool() {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [message, setMessage] = useState(null);
  const [quality, setQuality] = useState(0.7);
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
        file.type === "image/webp" ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp")
      );
    });

    if (!imageFiles.length) {
      setMessage({
        type: "error",
        text: "Only JPG, PNG, and WEBP images are supported right now.",
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
          text: "Some files were skipped because of the 5MB limit and free plan image limit.",
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
    if (isCompressing) return;
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    if (isCompressing) return;
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

  function getOutputExtension(file) {
    const lowerName = file.name.toLowerCase();

    if (file.type === "image/png" || lowerName.endsWith(".png")) {
      return "jpg";
    }

    if (file.type === "image/webp" || lowerName.endsWith(".webp")) {
      return "jpg";
    }

    return "jpg";
  }

  function getCompressedFileName(file) {
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return `${baseName}-compressed.${getOutputExtension(file)}`;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = src;
    });
  }

  function canvasToBlob(canvas, type, encoderQuality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed."));
            return;
          }
          resolve(blob);
        },
        type,
        encoderQuality,
      );
    });
  }

  async function compressImage(file) {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);

    return {
      blob,
      name: getCompressedFileName(file),
    };
  }

  async function compressImages() {
    if (!files.length || isCompressing) return;

    setIsCompressing(true);
    setMessage(null);

    try {
      for (const file of files) {
        const compressed = await compressImage(file);
        const url = URL.createObjectURL(compressed.blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = compressed.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while compressing your images. Please try again.",
      });
    } finally {
      setIsCompressing(false);
    }
  }

  const sortableItems = files.map(
    (file, i) => `${file.name}-${file.size}-${i}`,
  );

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Compress Images</h2>
          <p className="tool-sub">
            Reduce image file size while maintaining usable quality.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title="Free plan: 5 images, 5MB each"
        features={[
          "Batch compress unlimited images",
          "Higher file size limits",
          "Future PDF compression tools",
        ]}
      />

      <div
        className={`drop-zone ${isDragOver ? "drag-over" : ""} ${isCompressing ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isCompressing) fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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

      <div className="compress-slider-block">
        <div className="usage-indicator compress-slider-label">
          Compression quality: {Math.round(quality * 100)}%
        </div>

        <input
          className="compress-slider"
          type="range"
          min="0.3"
          max="0.95"
          step="0.05"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          disabled={isCompressing}
          aria-label="Compression quality"
        />
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
                <SortableCompressItem
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
        disabled={!files.length || isCompressing}
        onClick={compressImages}
      >
        {isCompressing ? "Compressing..." : "Compress Images"}
      </button>
    </>
  );
}
