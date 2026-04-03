import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { activateOnEnterOrSpace } from "../utils/accessibility";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { editPdfPages, extractEditedPdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const EDIT_FEATURE = getFeatureGate("edit");
const MAX_FILE_SIZE = EDIT_FEATURE.maxFileSize;
const MAX_FILES = EDIT_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

function normalizeRotation(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

const SortableThumbnailPage = memo(function SortableThumbnailPage({
  page,
  index,
  totalPages,
  isActive,
  isSelected,
  onActivate,
  onToggleSelection,
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
    opacity: isDragging ? 0.68 : 1,
  };

  function handleActivate() {
    onActivate(page.pageNumber);
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-page-number={page.pageNumber}
      className={`edit-pdf-thumb ${isActive ? "active" : ""} ${
        isSelected ? "selected" : ""
      } ${page.markedForDeletion ? "deleted" : ""} ${
        isDragging ? "dragging" : ""
      }`}
      aria-current={isActive ? "page" : undefined}
      onClick={handleActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <div className="edit-pdf-thumb-top">
        <button
          type="button"
          className="edit-pdf-thumb-handle"
          aria-label={`Drag page ${page.pageNumber} to reorder`}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          Reorder
        </button>
        <label
          className="edit-pdf-thumb-check"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(page.pageNumber)}
          />
          <span>Select</span>
        </label>
      </div>

      <div className="edit-pdf-thumb-preview">
        <img
          className="edit-pdf-thumb-image"
          src={page.previewUrl}
          alt={`Preview of PDF page ${page.pageNumber}`}
          style={{ transform: `rotate(${page.rotation}deg)` }}
        />
      </div>

      <div className="edit-pdf-thumb-meta">
        <strong>Page {page.pageNumber}</strong>
        <span>
          {page.markedForDeletion
            ? "Deleted from export"
            : `Position ${index + 1} of ${totalPages}`}
        </span>
      </div>
    </article>
  );
}, areThumbnailPropsEqual);

function areThumbnailPropsEqual(prevProps, nextProps) {
  return (
    prevProps.page === nextProps.page &&
    prevProps.index === nextProps.index &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected
  );
}

export default function EditPdfTool() {
  const toolRootRef = useRef(null);
  const thumbnailListRef = useRef(null);
  const pageSwitchTimeoutRef = useRef(null);
  const previousActivePageRef = useRef(null);
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [activePageNumber, setActivePageNumber] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPageSwitching, setIsPageSwitching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const isPremium = false;
  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);
  const pageIds = useMemo(() => pages.map((page) => page.id), [pages]);
  const includedPages = useMemo(
    () => pages.filter((page) => !page.markedForDeletion),
    [pages],
  );
  const selectedIncludedPages = useMemo(
    () =>
      pages.filter(
        (page) => selectedPageSet.has(page.pageNumber) && !page.markedForDeletion,
      ),
    [pages, selectedPageSet],
  );

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
      if (pageSwitchTimeoutRef.current) {
        clearTimeout(pageSwitchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pages.length) {
      if (activePageNumber !== null) {
        setActivePageNumber(null);
      }
      return;
    }

    if (!pages.some((page) => page.pageNumber === activePageNumber)) {
      setActivePageNumber(pages[0].pageNumber);
    }
  }, [activePageNumber, pages]);

  useEffect(() => {
    if (!activePageNumber || !pages.length) return;

    const activeThumbnail = thumbnailListRef.current?.querySelector(
      `[data-page-number="${activePageNumber}"]`,
    );
    activeThumbnail?.scrollIntoView({
      block: "nearest",
      behavior: previousActivePageRef.current === null ? "auto" : "smooth",
    });

    if (
      previousActivePageRef.current !== null &&
      previousActivePageRef.current !== activePageNumber
    ) {
      setIsPageSwitching(true);
      if (pageSwitchTimeoutRef.current) {
        clearTimeout(pageSwitchTimeoutRef.current);
      }
      pageSwitchTimeoutRef.current = setTimeout(() => {
        setIsPageSwitching(false);
        pageSwitchTimeoutRef.current = null;
      }, 260);
    }

    previousActivePageRef.current = activePageNumber;
  }, [activePageNumber, pages.length]);

  function resetPages() {
    revokePreviewUrls(previewUrlsRef.current);
    previewUrlsRef.current = [];
    setPages([]);
    setSelectedPages([]);
    setActivePageNumber(null);
    setZoomLevel(1);
    setIsPageSwitching(false);
    previousActivePageRef.current = null;
    if (pageSwitchTimeoutRef.current) {
      clearTimeout(pageSwitchTimeoutRef.current);
      pageSwitchTimeoutRef.current = null;
    }
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
      setActivePageNumber(nextPages[0]?.pageNumber ?? null);
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

  const togglePageSelection = useCallback((pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((value) => value !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b),
    );
  }, []);

  const handleThumbnailActivate = useCallback((pageNumber) => {
    setActivePageNumber(pageNumber);
  }, []);

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

  function rotateActivePage(delta) {
    if (activePageNumber === null) return;
    rotatePage(activePageNumber, delta);
  }

  function adjustZoom(delta) {
    setZoomLevel((prev) => clampZoom(prev + delta));
  }

  function resetZoom() {
    setZoomLevel(1);
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

  function toggleActivePageDeletion() {
    if (activePageNumber === null) return;
    toggleDeletionForPage(activePageNumber);
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

  async function downloadPdfDocument(
    pdfBytes,
    downloadName,
    successText,
    metadata = {},
  ) {
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

  async function runPdfExport(exporter, onErrorMessage) {
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
      await exporter(bytes);
    } catch {
      setMessage({
        type: "error",
        text: onErrorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function exportEditedDocument() {
    if (!file || !pages.length || isProcessing) return;

    if (!includedPages.length) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the edited PDF.",
      });
      return;
    }

    await runPdfExport(async (bytes) => {
      const pdfBytes = await editPdfPages(bytes, pages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-edited.pdf`,
        "Edited PDF downloaded successfully",
        {
          fileCount: includedPages.length,
          extra: { export_kind: "edited_pdf" },
        },
      );
    }, "Something went wrong while exporting your edited PDF.");
  }

  async function exportSelectedPages() {
    if (!file || !selectedPages.length || isProcessing) return;

    if (!selectedIncludedPages.length) {
      setMessage({
        type: "error",
        text: "Select at least one page that is still included in the document.",
      });
      return;
    }

    await runPdfExport(async (bytes) => {
      const pdfBytes = await extractEditedPdfPages(bytes, pages, selectedPages);
      await downloadPdfDocument(
        pdfBytes,
        `${getBaseFileName(file.name)}-selected-pages.pdf`,
        "Selected pages downloaded successfully",
        {
          fileCount: selectedIncludedPages.length,
          extra: { export_kind: "selected_pages" },
        },
      );
    }, "Something went wrong while exporting your selected pages.");
  }

  const activePage =
    pages.find((page) => page.pageNumber === activePageNumber) || pages[0] || null;
  const deletedCount = pages.filter((page) => page.markedForDeletion).length;
  const remainingCount = pages.length - deletedCount;
  const selectedIncludedCount = selectedIncludedPages.length;
  const activePageSelected = activePage
    ? selectedPageSet.has(activePage.pageNumber)
    : false;
  const selectedPagesLabel =
    selectedPages.length === 1
      ? "1 selected page"
      : `${selectedPages.length} selected pages`;
  const selectedIncludedLabel =
    selectedIncludedCount === 1
      ? "1 selected in export"
      : `${selectedIncludedCount} selected in export`;
  const hasLoadedEditor = pages.length > 0 && activePage;
  const activePagePosition = activePage
    ? pages.findIndex((page) => page.pageNumber === activePage.pageNumber) + 1
    : 0;
  const viewerStatusItems = activePage
      ? [
          `Page ${activePage.pageNumber} / ${pages.length}`,
          activePage.rotation ? `Rotation: ${activePage.rotation}°` : null,
          zoomLevel !== 1 ? `Zoom: ${Math.round(zoomLevel * 100)}%` : null,
          activePageSelected ? "Selected" : null,
          activePage.markedForDeletion ? "Marked for Deletion" : null,
        ].filter(Boolean)
      : [];

  useEffect(() => {
    const appCard = toolRootRef.current?.closest(".app-card-editor");
    if (!appCard) return undefined;

    appCard.classList.toggle("edit-pdf-active", Boolean(hasLoadedEditor));

    return () => {
      appCard.classList.remove("edit-pdf-active");
    };
  }, [hasLoadedEditor]);

  return (
    <div
      ref={toolRootRef}
      className={`edit-pdf-tool ${hasLoadedEditor ? "loaded" : "empty"}`}
    >
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

      <div className={`edit-pdf-flow ${hasLoadedEditor ? "loaded" : "empty"}`}>
        <div className="edit-pdf-setup-panel">
          <div
            className={`drop-zone edit-pdf-drop-zone ${isDragOver ? "drag-over" : ""} ${isProcessing ? "disabled" : ""}`}
            role="button"
            tabIndex={isProcessing ? -1 : 0}
            aria-label={`Upload a PDF for Edit PDF. Free plan includes one PDF up to ${FILE_SIZE_LIMIT_LABEL}.`}
            aria-disabled={isProcessing}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!isProcessing) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (isProcessing) return;
              activateOnEnterOrSpace(event, () => fileInputRef.current?.click());
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
            <div className="file-selection-card edit-pdf-file-card">
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
        </div>

        {pages.length > 0 && activePage && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="edit-pdf-shell edit-pdf-editor-panel">
            <div className="edit-pdf-doc-summary" aria-label="Loaded document summary">
              <div className="edit-pdf-doc-summary-copy">
                <strong>{file.name}</strong>
                <span>{pages.length} page{pages.length === 1 ? "" : "s"} loaded</span>
              </div>
            </div>

              <div className="edit-pdf-toolbar">
                <div className="edit-pdf-toolbar-overview">
                  <div className="edit-pdf-toolbar-section edit-pdf-toolbar-status">
                    <strong>{remainingCount} pages in export</strong>
                    <span>{deletedCount} removed from export</span>
                  </div>

                  <div className="edit-pdf-toolbar-metrics" aria-label="Toolbar document metrics">
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{pages.length}</strong>
                      total
                    </span>
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{remainingCount}</strong>
                      in export
                    </span>
                    <span className="edit-pdf-toolbar-metric">
                      <strong>{deletedCount}</strong>
                      removed
                    </span>
                  </div>
                </div>

                <div className="edit-pdf-toolbar-command-bar" aria-label="Edit PDF commands">
                  <section className="edit-pdf-batch-panel" aria-label="Selected page actions">
                    <div className="edit-pdf-batch-panel-head">
                      <div className="edit-pdf-batch-panel-copy">
                        <span className="edit-pdf-toolbar-label">Selected Pages</span>
                        <span className="edit-pdf-batch-panel-sub">
                          Bulk actions for the current selection
                        </span>
                      </div>

                      <div
                        className="edit-pdf-batch-panel-metrics"
                        aria-label="Selected page workflow summary"
                      >
                        <span className="edit-pdf-batch-panel-metric">
                          {selectedPagesLabel}
                        </span>
                        <span className="edit-pdf-batch-panel-metric">
                          {selectedIncludedLabel}
                        </span>
                      </div>
                    </div>

                    <div className="edit-pdf-toolbar-groups">
                      <section className="edit-pdf-toolbar-group" aria-label="Selection commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Selection</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Manage selected-page scope
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
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
                        </div>
                      </section>

                      <section className="edit-pdf-toolbar-group" aria-label="Rotation commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Rotate</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Applies to selected pages
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={() => rotateSelectedPages(-90)}
                            disabled={!selectedPages.length}
                          >
                            Rotate Left
                          </button>
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            onClick={() => rotateSelectedPages(90)}
                            disabled={!selectedPages.length}
                          >
                            Rotate Right
                          </button>
                        </div>
                      </section>

                      <section className="edit-pdf-toolbar-group" aria-label="Page action commands">
                        <div className="edit-pdf-toolbar-group-head">
                          <span className="edit-pdf-toolbar-label">Page Actions</span>
                          <span className="edit-pdf-toolbar-group-context">
                            Batch-ready page operations
                          </span>
                        </div>
                        <div className="edit-pdf-toolbar-section">
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
                          <button
                            type="button"
                            className="hero-secondary-btn"
                            disabled={!selectedIncludedCount || isProcessing}
                            onClick={exportSelectedPages}
                          >
                            Extract Selected
                          </button>
                        </div>
                      </section>
                    </div>
                  </section>

                  <section
                    className="edit-pdf-toolbar-group edit-pdf-toolbar-group-export"
                    aria-label="Export commands"
                  >
                    <div className="edit-pdf-toolbar-group-head">
                      <span className="edit-pdf-toolbar-label">Export</span>
                      <span className="edit-pdf-toolbar-group-context">
                        Whole document
                      </span>
                    </div>
                    <div className="edit-pdf-toolbar-section edit-pdf-toolbar-section-right">
                      <button
                        type="button"
                        className="hero-primary-btn edit-pdf-export-btn"
                        disabled={!pages.length || !remainingCount || isProcessing}
                        onClick={exportEditedDocument}
                      >
                        {isProcessing ? "Exporting..." : "Export Document"}
                      </button>
                    </div>
                  </section>
                </div>
              </div>

            <div className="edit-pdf-workspace">
              <aside className="edit-pdf-sidebar">
                <div className="edit-pdf-sidebar-head">
                  <div className="edit-pdf-sidebar-head-copy">
                    <strong>Pages</strong>
                    <span>Drag to reorder</span>
                  </div>

                  <div className="edit-pdf-sidebar-head-metrics" aria-label="Thumbnail rail overview">
                    <span className="edit-pdf-sidebar-metric">
                      <strong>{pages.length}</strong>
                      pages
                    </span>
                    <span className="edit-pdf-sidebar-metric">
                      <strong>{selectedPages.length}</strong>
                      selected
                    </span>
                  </div>
                </div>

                <div className="edit-pdf-sidebar-command-bar" aria-label="Thumbnail rail commands">
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
                    Clear
                  </button>
                </div>

                <SortableContext
                  items={pageIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div ref={thumbnailListRef} className="edit-pdf-thumbnail-list">
                    {pages.map((page, index) => (
                      <SortableThumbnailPage
                        key={page.id}
                        page={page}
                        index={index}
                        totalPages={pages.length}
                        isActive={activePage.pageNumber === page.pageNumber}
                        isSelected={selectedPageSet.has(page.pageNumber)}
                        onActivate={handleThumbnailActivate}
                        onToggleSelection={togglePageSelection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </aside>

              <section className="edit-pdf-viewer">
                <div className="edit-pdf-viewer-head">
                  <div>
                    <p className="section-eyebrow">Document Viewer</p>
                    <h3>Page {activePage.pageNumber}</h3>
                    <p>
                      {activePage.markedForDeletion
                        ? "This page is currently removed from the edited PDF."
                        : `Position ${activePagePosition} of ${pages.length}`}
                    </p>
                  </div>

                  <div className="edit-pdf-viewer-chip-row">
                    <span className="edit-pdf-viewer-chip">
                      {activePageSelected ? "Selected" : "Not selected"}
                    </span>
                    <span className="edit-pdf-viewer-chip">
                      Rotation {activePage.rotation}°
                    </span>
                  </div>
                </div>

                  <div className="edit-pdf-viewer-body">
                    <div
                      className={`edit-pdf-viewer-workspace ${
                        isPageSwitching ? "page-switching" : ""
                      }`}
                    >
                    <div className="edit-pdf-viewer-page-header" aria-label="Active page context">
                      <div className="edit-pdf-viewer-page-header-copy">
                        <span className="edit-pdf-viewer-page-kicker">Active page</span>
                        <strong>
                          Page {activePage.pageNumber} of {pages.length}
                        </strong>
                      </div>
                      <span className="edit-pdf-viewer-page-state">
                        {activePage.markedForDeletion
                          ? "Marked for deletion"
                          : activePageSelected
                            ? "Selected"
                            : "Ready to edit"}
                      </span>
                    </div>
                    <div className="edit-pdf-viewer-stage">
                      <div className="edit-pdf-viewer-canvas-shell">
                        <div className="edit-pdf-viewer-preview-frame">
                          <div className="edit-pdf-viewer-canvas">
                            <img
                              className="edit-pdf-viewer-image"
                              src={activePage.previewUrl}
                              alt={`Preview of PDF page ${activePage.pageNumber}`}
                              style={{
                                transform: `rotate(${activePage.rotation}deg) scale(${zoomLevel})`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="edit-pdf-viewer-actions">
                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => togglePageSelection(activePage.pageNumber)}
                    >
                      {activePageSelected ? "Unselect Page" : "Select Page"}
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotateActivePage(-90)}
                    >
                      Rotate Left
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotateActivePage(90)}
                    >
                      Rotate Right
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group edit-pdf-viewer-action-group-zoom">
                    <span className="edit-pdf-viewer-action-label">
                      Zoom {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => adjustZoom(-ZOOM_STEP)}
                      disabled={zoomLevel <= MIN_ZOOM}
                    >
                      Zoom Out
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => adjustZoom(ZOOM_STEP)}
                      disabled={zoomLevel >= MAX_ZOOM}
                    >
                      Zoom In
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={resetZoom}
                      disabled={zoomLevel === 1}
                    >
                      Reset Zoom
                    </button>
                  </div>

                  <div className="edit-pdf-viewer-action-group">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={toggleActivePageDeletion}
                    >
                      {activePage.markedForDeletion ? "Keep Page" : "Delete Page"}
                    </button>
                  </div>
                </div>

                {viewerStatusItems.length > 0 && (
                  <div className="edit-pdf-viewer-status" aria-label="Active page status">
                    {viewerStatusItems.map((item) => (
                      <span key={item} className="edit-pdf-viewer-status-item">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </DndContext>
        )}
      </div>
    </div>
  );
}
