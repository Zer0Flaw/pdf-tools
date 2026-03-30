import { useState, useRef, useEffect } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
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
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import {
  canUseDailyWatermarkRemoval,
  consumeDailyWatermarkRemoval,
} from "../utils/freeTier";

const MERGE_FEATURE = getFeatureGate("merge");
const MAX_FREE_FILES = MERGE_FEATURE.maxFiles;
const MAX_FILE_SIZE = MERGE_FEATURE.maxFileSize;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

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
      text: "Watermark-free export enabled. Your next merge will download without a watermark.",
    });
  }

  function addFiles(newFiles) {
    const incomingFiles = Array.from(newFiles || []);
    setShowExportAd(false);
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
        text: `Some files exceeded the ${FILE_SIZE_LIMIT_LABEL} limit for free users.`,
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
          text: `Some files were skipped because of the ${FILE_SIZE_LIMIT_LABEL} limit and free plan file limit.`,
        });
      } else if (!isPremium && oversizedFiles.length > 0) {
        setMessage({
          type: "error",
          text: `Some files exceeded the ${FILE_SIZE_LIMIT_LABEL} limit for free users.`,
        });
      } else if (!isPremium && acceptedFiles.length > remainingSlots) {
        setMessage({
          type: "error",
          text: `Free plan allows up to ${MAX_FREE_FILES} PDFs.`,
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
    setShowExportAd(false);
    setMessage(null);
    const skipWatermark = useFreeWatermarkRemoval;

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

          if (!isPremium && !skipWatermark) {
            addWatermark(page, watermarkFont, "Merged with ProjectStack");
          }
        }
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `merged-${getDateStamp()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (skipWatermark) {
        consumeDailyWatermarkRemoval();
        setUseFreeWatermarkRemoval(false);
        setCanRemoveWatermarkToday(false);
        trackEvent("watermark_removed", {
          tool: "merge",
        });
      }

      setShowExportAd(true);
      trackEvent("export_success", {
        tool: "merge",
        file_count: files.length,
        size_bytes: blob.size,
        watermark_free: skipWatermark,
      });
      setMessage({
        type: "success",
        text: skipWatermark
          ? `Merged PDF downloaded without a watermark (${formatBytes(blob.size)}). Your free watermark-free export for today has been used.`
          : `Merged PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
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

      <UpgradeBanner
        title={`Free plan: merge up to ${MAX_FREE_FILES} PDFs`}
        subtitle="ProjectStack Pro gives you more room to work with larger files, longer merge sessions, and cleaner final documents."
        features={[
          "Keep multi-file merge workflows moving without low limits",
          "Handle larger uploads with less friction",
          "Export polished PDFs without watermarks every time",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={MERGE_FEATURE.upgradeReason}
        secondaryCtaText={
          useFreeWatermarkRemoval
            ? "Watermark-free export enabled"
            : "Remove watermark free today"
        }
        onSecondaryCta={activateFreeWatermarkRemoval}
        secondaryDisabled={!canRemoveWatermarkToday || useFreeWatermarkRemoval}
        secondaryHint={
          useFreeWatermarkRemoval
            ? "Your next merge export will be watermark-free."
            : canRemoveWatermarkToday
              ? "Free plan includes one watermark-free merge export each day."
              : "You have already used today's free watermark-free merge. Upgrade for watermark-free exports anytime."
        }
      />

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
        <div className="drop-zone-sub">
          Free plan includes up to {MAX_FREE_FILES} PDFs, {FILE_SIZE_LIMIT_LABEL} each
        </div>
      </div>

      <div
        className="usage-indicator"
        style={{
          color: files.length >= MAX_FREE_FILES ? "#dc2626" : "#374151",
        }}
      >
        {files.length} of {MAX_FREE_FILES} free PDFs selected
      </div>

      <div className="usage-indicator trust-indicator">
        {MERGE_FEATURE.privacyMessage}
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

      {isMerging && (
        <div className="usage-indicator processing-indicator">
          {MERGE_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={MERGE_FEATURE.adPlacement}
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
