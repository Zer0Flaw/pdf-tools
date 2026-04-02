import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { reorderPdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const REORDER_FEATURE = getFeatureGate("reorder");
const MAX_FILE_SIZE = REORDER_FEATURE.maxFileSize;
const MAX_FILES = REORDER_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

function SortablePdfPageCard({ page, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rotate-page-card reorder-page-card ${
        isDragging ? "reorder-page-card-dragging" : ""
      }`}
    >
      <div
        className="reorder-page-drag-handle"
        {...attributes}
        {...listeners}
        aria-label={`Drag page ${page.pageNumber} to reorder`}
      >
        <span className="reorder-page-badge">Position {index + 1}</span>
        <span className="reorder-page-hint">Drag to reorder</span>
      </div>

      <div className="rotate-page-preview-shell">
        <img
          className="rotate-page-preview"
          src={page.previewUrl}
          alt={`Preview of PDF page ${page.pageNumber}`}
        />
      </div>

      <div className="rotate-page-meta">
        <div>
          <h3>Page {page.pageNumber}</h3>
          <p>
            Current order: {index + 1} of {page.totalPages}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ReorderPdfPagesTool() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const isPremium = false;

  useEffect(() => {
    previewUrlsRef.current = pages;
  }, [pages]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(previewUrlsRef.current);
    };
  }, []);

  function resetPages() {
    revokePreviewUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
    setPages([]);
  }

  function setSelectedFile(nextFile) {
    setFile(nextFile);
    resetPages();
    setShowExportAd(false);
  }

  function validatePdf(selectedFile) {
    const result = validatePdfFile(selectedFile, MAX_FILE_SIZE, isPremium);

    if (!result.isValid && result.reason === "file_type") {
      setMessage({ type: "error", text: result.message });
      return false;
    }

    if (!result.isValid && result.reason === "file_size_limit") {
      trackEvent("free_limit_encountered", {
        tool: "reorder",
        file_count: 1,
        input_type: "pdf",
        gated_feature: "file_size_limit",
      });
      setMessage({
        type: "error",
        text: `File exceeds ${FILE_SIZE_LIMIT_LABEL} limit for free users.`,
      });
      return false;
    }

    return true;
  }

  function handleSelectedFile(selectedFile) {
    if (!selectedFile) return;
    if (!validatePdf(selectedFile)) return;

    setSelectedFile(selectedFile);
    setMessage(null);
    trackEvent("file_uploaded", {
      tool: "reorder",
      file_count: 1,
      input_type: "pdf",
    });
  }

  function handleFileChange(event) {
    handleSelectedFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDragOver(event) {
    if (isProcessing) return;
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(event) {
    if (isProcessing) return;
    event.preventDefault();
    setIsDragOver(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  }

  function clearSelectedFile() {
    if (!file) return;

    setFile(null);
    resetPages();
    setShowExportAd(false);
    setMessage(null);
  }

  async function loadPdfPages() {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);
    resetPages();

    try {
      const bytes = await file.arrayBuffer();
      const previewPages = await buildPdfPagePreviews(bytes);
      const nextPages = previewPages.map((page, index) => ({
        ...page,
        id: `page-${page.pageNumber}`,
        totalPages: previewPages.length,
        originalIndex: index,
      }));

      setPages(nextPages);
      setMessage({
        type: "success",
        text: `Ready to reorder ${nextPages.length} page${nextPages.length === 1 ? "" : "s"}.`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while loading your PDF pages.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setPages((prev) => {
      const oldIndex = prev.findIndex((page) => page.id === active.id);
      const newIndex = prev.findIndex((page) => page.id === over.id);

      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function exportReorderedPdf() {
    if (!file || !pages.length || isProcessing) return;

    trackEvent("process_started", {
      tool: "reorder",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await reorderPdfPages(
        bytes,
        pages.map((page) => page.pageNumber),
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${getBaseFileName(file.name)}-reordered.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowExportAd(true);
      trackEvent("process_completed", {
        tool: "reorder",
        file_count: pages.length,
        input_type: "pdf",
        output_type: "pdf",
        size_bytes: blob.size,
      });
      trackEvent("export_downloaded", {
        tool: "reorder",
        file_count: pages.length,
        output_type: "pdf",
        size_bytes: blob.size,
      });
      setMessage({
        type: "success",
        text: `Reordered PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your reordered PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Reorder PDF Pages</h2>
          <p className="tool-sub">
            Drag PDF pages into a new sequence and export the reordered document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable page-level document editing workflows over time."
        features={[
          "Reorder larger PDFs without hitting the free cap",
          "Keep repeat page organization work moving with less friction",
          "Unlock more advanced PDF editing workflows as ProjectStack grows",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={REORDER_FEATURE.upgradeReason}
      />

      <div
        className={`drop-zone ${isDragOver ? "drag-over" : ""} ${isProcessing ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          hidden
        />

        <div className="drop-zone-title">Select or Drop PDF Here</div>
        <div className="drop-zone-sub">
          Free plan includes one PDF up to {FILE_SIZE_LIMIT_LABEL}
        </div>
      </div>

      {file && (
        <div className="file-selection-card">
          <div className="file-meta">
            <p className="file-name">{file.name}</p>
            <p className="file-size">{formatBytes(file.size)}</p>
          </div>

          <button type="button" className="remove-btn" onClick={clearSelectedFile}>
            Remove
          </button>
        </div>
      )}

      {file && (
        <div className="usage-indicator">
          {MAX_FILES} / {MAX_FILES} PDF selected
        </div>
      )}

      <div className="usage-indicator trust-indicator">
        {REORDER_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {REORDER_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={REORDER_FEATURE.adPlacement}
        isVisible={showExportAd}
      />

      {file && !pages.length && !isProcessing && (
        <button className="merge-btn" onClick={loadPdfPages}>
          Load PDF Pages
        </button>
      )}

      {pages.length > 0 && (
        <>
          <div className="rotate-toolbar">
            <div className="rotate-toolbar-copy">
              <strong>Drag pages into the order you want</strong>
              <span>
                Move cards around to update the exported PDF sequence before you download it.
              </span>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={pages.map((page) => page.id)}
              strategy={rectSortingStrategy}
            >
              <div className="rotate-page-grid">
                {pages.map((page, index) => (
                  <SortablePdfPageCard
                    key={page.id}
                    page={page}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <button
        className="merge-btn"
        disabled={!pages.length || isProcessing}
        onClick={exportReorderedPdf}
      >
        {isProcessing ? "Exporting..." : "Export Reordered PDF"}
      </button>
    </>
  );
}
