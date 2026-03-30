import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getDateStamp } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import {
  canUseDailyWatermarkRemoval,
  consumeDailyWatermarkRemoval,
} from "../utils/freeTier";

const IMAGES_FEATURE = getFeatureGate("images");
const MAX_FREE_IMAGES = IMAGES_FEATURE.maxFiles;
const MAX_FILE_SIZE = IMAGES_FEATURE.maxFileSize;

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
  const [useFreeWatermarkRemoval, setUseFreeWatermarkRemoval] = useState(false);
  const [canRemoveWatermarkToday, setCanRemoveWatermarkToday] = useState(true);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const isPremium = false;

  useEffect(() => {
    setCanRemoveWatermarkToday(canUseDailyWatermarkRemoval());
  }, []);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  function activateFreeWatermarkRemoval() {
    if (!canRemoveWatermarkToday) return;

    setUseFreeWatermarkRemoval(true);
    setShowExportAd(false);
    setMessage({
      type: "success",
      text: "Watermark-free export enabled. Your next PDF conversion will download without a watermark.",
    });
  }

  function addFiles(newFiles) {
    const incomingFiles = Array.from(newFiles || []);
    setShowExportAd(false);
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
    setShowExportAd(false);
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
    setShowExportAd(false);
    setMessage(null);
    const skipWatermark = useFreeWatermarkRemoval;

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

        if (!isPremium && !skipWatermark) {
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
      a.download = `images-to-pdf-${getDateStamp()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (skipWatermark) {
        consumeDailyWatermarkRemoval();
        setUseFreeWatermarkRemoval(false);
        setCanRemoveWatermarkToday(false);
        trackEvent("watermark_free_used", {
          tool: "images",
        });
      }

      setShowExportAd(true);
      trackEvent("export_completed", {
        tool: "images",
        file_count: files.length,
        size_bytes: blob.size,
        watermark_free: skipWatermark,
      });
      setMessage({
        type: "success",
        text: skipWatermark
          ? `PDF downloaded without a watermark (${formatBytes(blob.size)}). Your free watermark-free export for today has been used.`
          : `PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
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
          <h1>Images to PDF</h1>
          <p className="tool-sub">
            Convert JPG and PNG images into a single PDF document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title="Free plan: up to 5 images"
        subtitle="ProjectStack Pro helps you move from quick image batches to cleaner, more flexible PDF creation without the usual free-plan friction."
        features={[
          "Convert larger image sets in a smoother flow",
          "Work with bigger uploads more comfortably",
          "Export clean PDFs without watermarks whenever you need to",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={IMAGES_FEATURE.upgradeReason}
        secondaryCtaText={
          useFreeWatermarkRemoval
            ? "Watermark-free export enabled"
            : "Remove watermark free today"
        }
        onSecondaryCta={activateFreeWatermarkRemoval}
        secondaryDisabled={!canRemoveWatermarkToday || useFreeWatermarkRemoval}
        secondaryHint={
          useFreeWatermarkRemoval
            ? "Your next PDF export will be watermark-free."
            : canRemoveWatermarkToday
              ? "Free plan includes one watermark-free PDF export each day."
              : "You have already used today's free watermark-free PDF export. Upgrade for watermark-free exports anytime."
        }
      />

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
        <div className="drop-zone-sub">Free plan includes up to 5 images, 5MB each</div>
      </div>

      <div
        className="usage-indicator"
        style={{
          color: files.length >= MAX_FREE_IMAGES ? "#dc2626" : "#374151",
        }}
      >
        {files.length} of {MAX_FREE_IMAGES} free images selected
      </div>

      <div className="usage-indicator trust-indicator">
        {IMAGES_FEATURE.privacyMessage}
      </div>

      {(useFreeWatermarkRemoval || !canRemoveWatermarkToday) && (
        <div
          className={`usage-indicator watermark-status ${useFreeWatermarkRemoval ? "armed" : "consumed"}`}
        >
          {useFreeWatermarkRemoval
            ? "Next export: watermark-free"
            : "Today's free watermark-free export has been used"}
        </div>
      )}

      {isConverting && (
        <div className="usage-indicator processing-indicator">
          {IMAGES_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placementId={IMAGES_FEATURE.adPlacement}
        isVisible={showExportAd}
      />

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
        {isConverting ? "Converting..." : "Convert to PDF"}
      </button>
    </>
  );
}
