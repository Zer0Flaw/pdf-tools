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
import { editPdfPages, extractEditedPdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const EDIT_FEATURE = getFeatureGate("edit");
const MAX_FILE_SIZE = EDIT_FEATURE.maxFileSize;
const MAX_FILES = EDIT_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

function normalizeRotation(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function SortableEditablePdfPageCard({
  page,
  index,
  totalPages,
  isSelected,
  onToggleSelection,
  onRotatePage,
  onToggleDeletion,
}) {
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
      } ${page.markedForDeletion ? "rotate-page-card-deleted" : ""} ${
        isSelected ? "extract-page-card-selected" : ""
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

      <label className="rotate-page-select">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(page.pageNumber)}
        />
        <span>Select page {page.pageNumber}</span>
      </label>

      <div className="rotate-page-preview-shell">
        <img
          className="rotate-page-preview"
          src={page.previewUrl}
          alt={`Preview of PDF page ${page.pageNumber}`}
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      </div>

      <div className="rotate-page-meta">
        <div>
          <h3>Page {page.pageNumber}</h3>
          <p>
            {page.markedForDeletion
              ? "Marked for deletion"
              : `Position ${index + 1} of ${totalPages}`}
          </p>
          <p>Rotation: {page.rotation}°</p>
        </div>

        <div className="rotate-page-actions">
          <button
            type="button"
            className="hero-secondary-btn"
            onClick={() => onRotatePage(page.pageNumber, -90)}
          >
            Rotate Left
          </button>
          <button
            type="button"
            className="hero-secondary-btn"
            onClick={() => onRotatePage(page.pageNumber, 90)}
          >
            Rotate Right
          </button>
          <button
            type="button"
            className="hero-secondary-btn"
            onClick={() => onToggleDeletion(page.pageNumber)}
          >
            {page.markedForDeletion ? "Keep Page" : "Delete Page"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function EditPdfTool() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
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
    setSelectedPages([]);
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
        tool: "edit",
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
      tool: "edit",
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
      const nextPages = previewPages.map((page) => ({
        ...page,
        id: `page-${page.pageNumber}`,
        rotation: 0,
        markedForDeletion: false,
      }));

      setPages(nextPages);
      setSelectedPages(nextPages.map((page) => page.pageNumber));
      setMessage({
        type: "success",
        text: `Ready to edit ${nextPages.length} page${nextPages.length === 1 ? "" : "s"}.`,
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

  function togglePageSelection(pageNumber) {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((value) => value !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b),
    );
  }

  function selectAllPages() {
    setSelectedPages(pages.map((page) => page.pageNumber));
  }

  function clearPageSelection() {
    setSelectedPages([]);
  }

  function rotatePage(pageNumber, delta) {
    setPages((prev) =>
      prev.map((page) =>
        page.pageNumber === pageNumber
          ? { ...page, rotation: normalizeRotation(page.rotation + delta) }
          : page,
      ),
    );
  }

  function rotateSelectedPages(delta) {
    if (!selectedPages.length) return;

    setPages((prev) =>
      prev.map((page) =>
        selectedPages.includes(page.pageNumber)
          ? { ...page, rotation: normalizeRotation(page.rotation + delta) }
          : page,
      ),
    );
  }

  function updateDeletionState(targetPageNumbers, markedForDeletion) {
    if (!targetPageNumbers.length) return;

    const nextPages = pages.map((page) =>
      targetPageNumbers.includes(page.pageNumber)
        ? { ...page, markedForDeletion }
        : page,
    );

    if (!nextPages.some((page) => !page.markedForDeletion)) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the edited PDF.",
      });
      return;
    }

    setPages(nextPages);
    setMessage(null);
  }

  function markSelectedForDeletion() {
    updateDeletionState(selectedPages, true);
  }

  function keepSelectedPages() {
    updateDeletionState(selectedPages, false);
  }

  function toggleDeletionForPage(pageNumber) {
    const targetPage = pages.find((page) => page.pageNumber === pageNumber);
    if (!targetPage) return;

    updateDeletionState([pageNumber], !targetPage.markedForDeletion);
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

  async function downloadPdfDocument(pdfBytes, downloadName, successText, metadata = {}) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);

    setShowExportAd(true);
    trackEvent("process_completed", {
      tool: "edit",
      file_count: metadata.fileCount,
      input_type: "pdf",
      output_type: "pdf",
      size_bytes: blob.size,
      ...metadata.extra,
    });
    trackEvent("export_downloaded", {
      tool: "edit",
      file_count: metadata.fileCount,
      output_type: "pdf",
      size_bytes: blob.size,
      ...metadata.extra,
    });
    setMessage({
      type: "success",
      text: `${successText} (${formatBytes(blob.size)}).`,
    });
  }

  async function exportEditedDocument() {
    if (!file || !pages.length || isProcessing) return;

    const remainingPages = pages.filter((page) => !page.markedForDeletion);
    if (!remainingPages.length) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the edited PDF.",
      });
      return;
    }

    trackEvent("process_started", {
      tool: "edit",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await editPdfPages(bytes, pages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-edited.pdf`,
        "Edited PDF downloaded successfully",
        {
          fileCount: remainingPages.length,
          extra: { export_kind: "edited_pdf" },
        },
      );
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your edited PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function exportSelectedPages() {
    if (!file || !selectedPages.length || isProcessing) return;

    const selectedKeptPages = pages.filter(
      (page) =>
        selectedPages.includes(page.pageNumber) && !page.markedForDeletion,
    );

    if (!selectedKeptPages.length) {
      setMessage({
        type: "error",
        text: "Select at least one page that is still included in the document.",
      });
      return;
    }

    trackEvent("process_started", {
      tool: "edit",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await extractEditedPdfPages(bytes, pages, selectedPages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-selected-pages.pdf`,
        "Selected pages downloaded successfully",
        {
          fileCount: selectedKeptPages.length,
          extra: { export_kind: "selected_pages" },
        },
      );
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your selected pages.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const deletedCount = pages.filter((page) => page.markedForDeletion).length;
  const remainingCount = pages.length - deletedCount;
  const selectedIncludedCount = pages.filter(
    (page) =>
      selectedPages.includes(page.pageNumber) && !page.markedForDeletion,
  ).length;

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Edit PDF</h2>
          <p className="tool-sub">
            Reorder, rotate, delete, and extract PDF pages in one browser-based editor.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable all-in-one editing workflows over time."
        features={[
          "Edit larger PDFs without hitting the free cap",
          "Keep page cleanup and organization work in one place",
          "Make future premium editing upgrades easier to unlock",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={EDIT_FEATURE.upgradeReason}
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
        {EDIT_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {EDIT_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot placement={EDIT_FEATURE.adPlacement} isVisible={showExportAd} />

      {file && !pages.length && !isProcessing && (
        <button className="merge-btn" onClick={loadPdfPages}>
          Load PDF Pages
        </button>
      )}

      {pages.length > 0 && (
        <>
          <div className="rotate-toolbar">
            <div className="rotate-toolbar-copy">
              <strong>
                {selectedPages.length} selected, {remainingCount} staying in the edited PDF
              </strong>
              <span>
                Drag to reorder, rotate pages as needed, mark pages for deletion, or export just the current selection.
              </span>
            </div>

            <div className="rotate-toolbar-actions">
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={selectAllPages}
              >
                Select All
              </button>
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={clearPageSelection}
              >
                Clear Selection
              </button>
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={() => rotateSelectedPages(-90)}
                disabled={!selectedPages.length}
              >
                Rotate Selected Left
              </button>
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={() => rotateSelectedPages(90)}
                disabled={!selectedPages.length}
              >
                Rotate Selected Right
              </button>
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={markSelectedForDeletion}
                disabled={!selectedPages.length}
              >
                Delete Selected
              </button>
              <button
                type="button"
                className="hero-secondary-btn"
                onClick={keepSelectedPages}
                disabled={!selectedPages.length}
              >
                Keep Selected
              </button>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={pages.map((page) => page.id)}
              strategy={rectSortingStrategy}
            >
              <div className="rotate-page-grid">
                {pages.map((page, index) => (
                  <SortableEditablePdfPageCard
                    key={page.id}
                    page={page}
                    index={index}
                    totalPages={pages.length}
                    isSelected={selectedPages.includes(page.pageNumber)}
                    onToggleSelection={togglePageSelection}
                    onRotatePage={rotatePage}
                    onToggleDeletion={toggleDeletionForPage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="rotate-toolbar edit-pdf-actions">
            <div className="rotate-toolbar-copy">
              <strong>
                {deletedCount} page{deletedCount === 1 ? "" : "s"} marked for deletion
              </strong>
              <span>
                Export the full edited PDF, or export {selectedIncludedCount} selected page{selectedIncludedCount === 1 ? "" : "s"} into a separate file.
              </span>
            </div>

            <div className="rotate-toolbar-actions">
              <button
                type="button"
                className="hero-secondary-btn"
                disabled={!selectedIncludedCount || isProcessing}
                onClick={exportSelectedPages}
              >
                {isProcessing ? "Exporting..." : "Export Selected Pages"}
              </button>
            </div>
          </div>
        </>
      )}

      <button
        className="merge-btn"
        disabled={!pages.length || !remainingCount || isProcessing}
        onClick={exportEditedDocument}
      >
        {isProcessing ? "Exporting..." : "Export Edited PDF"}
      </button>
    </>
  );
}
