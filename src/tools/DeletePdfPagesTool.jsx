import { useEffect, useRef, useState } from "react";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { deletePdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const DELETE_FEATURE = getFeatureGate("delete");
const MAX_FILE_SIZE = DELETE_FEATURE.maxFileSize;
const MAX_FILES = DELETE_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

export default function DeletePdfPagesTool() {
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
        tool: "delete",
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
      tool: "delete",
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
        markedForDeletion: false,
      }));

      setPages(nextPages);
      setSelectedPages(nextPages.map((page) => page.pageNumber));
      setMessage({
        type: "success",
        text: `Ready to review ${nextPages.length} page${nextPages.length === 1 ? "" : "s"} for deletion.`,
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

  function updateDeletionState(targetPageNumbers, markedForDeletion) {
    if (!targetPageNumbers.length) return;

    const nextPages = pages.map((page) =>
      targetPageNumbers.includes(page.pageNumber)
        ? { ...page, markedForDeletion }
        : page,
    );
    const remainingPages = nextPages.filter((page) => !page.markedForDeletion).length;

    if (remainingPages === 0) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the PDF.",
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
    const page = pages.find((entry) => entry.pageNumber === pageNumber);
    if (!page) return;

    updateDeletionState([pageNumber], !page.markedForDeletion);
  }

  async function exportDeletedPdf() {
    if (!file || !pages.length || isProcessing) return;

    const keptPages = pages.filter((page) => !page.markedForDeletion);
    if (!keptPages.length) {
      setMessage({
        type: "error",
        text: "At least one page must remain in the PDF.",
      });
      return;
    }

    trackEvent("process_started", {
      tool: "delete",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await deletePdfPages(
        bytes,
        keptPages.map((page) => page.pageNumber),
      );
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${getBaseFileName(file.name)}-trimmed.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowExportAd(true);
      trackEvent("process_completed", {
        tool: "delete",
        file_count: keptPages.length,
        input_type: "pdf",
        output_type: "pdf",
        size_bytes: blob.size,
      });
      trackEvent("export_downloaded", {
        tool: "delete",
        file_count: keptPages.length,
        output_type: "pdf",
        size_bytes: blob.size,
      });
      setMessage({
        type: "success",
        text: `Updated PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your updated PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const deletedCount = pages.filter((page) => page.markedForDeletion).length;
  const remainingCount = pages.length - deletedCount;

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Delete PDF Pages</h2>
          <p className="tool-sub">
            Remove selected PDF pages and export a cleaner document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable page-level cleanup workflows over time."
        features={[
          "Edit larger PDFs without hitting the free cap",
          "Move through page cleanup tasks with less friction",
          "Unlock more advanced PDF editing workflows as ProjectStack grows",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={DELETE_FEATURE.upgradeReason}
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
        {DELETE_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {DELETE_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={DELETE_FEATURE.adPlacement}
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
              <strong>
                {deletedCount} page{deletedCount === 1 ? "" : "s"} marked for
                deletion
              </strong>
              <span>
                {remainingCount} page{remainingCount === 1 ? "" : "s"} will stay in the exported PDF.
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
                onClick={markSelectedForDeletion}
                disabled={!selectedPages.length}
              >
                Remove Selected
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

          <div className="rotate-page-grid">
            {pages.map((page) => (
              <article
                key={page.pageNumber}
                className={`rotate-page-card ${
                  page.markedForDeletion ? "rotate-page-card-deleted" : ""
                }`}
              >
                <label className="rotate-page-select">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.pageNumber)}
                    onChange={() => togglePageSelection(page.pageNumber)}
                  />
                  <span>Select page {page.pageNumber}</span>
                </label>

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
                      {page.markedForDeletion
                        ? "Marked for deletion"
                        : "Will stay in the output PDF"}
                    </p>
                  </div>

                  <div className="rotate-page-actions">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => toggleDeletionForPage(page.pageNumber)}
                    >
                      {page.markedForDeletion ? "Keep Page" : "Delete Page"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <button
        className="merge-btn"
        disabled={!pages.length || !remainingCount || isProcessing}
        onClick={exportDeletedPdf}
      >
        {isProcessing ? "Exporting..." : "Export Updated PDF"}
      </button>
    </>
  );
}
