import { useEffect, useRef, useState } from "react";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { extractPdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const EXTRACT_FEATURE = getFeatureGate("extract");
const MAX_FILE_SIZE = EXTRACT_FEATURE.maxFileSize;
const MAX_FILES = EXTRACT_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

export default function ExtractPdfPagesTool() {
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
        tool: "extract",
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
      tool: "extract",
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

      setPages(previewPages);
      setSelectedPages(previewPages.map((page) => page.pageNumber));
      setMessage({
        type: "success",
        text: `Ready to extract ${previewPages.length} page${previewPages.length === 1 ? "" : "s"}.`,
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

  async function exportExtractedPdf() {
    if (!file || !selectedPages.length || isProcessing) return;

    trackEvent("process_started", {
      tool: "extract",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdfBytes = await extractPdfPages(bytes, selectedPages);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${getBaseFileName(file.name)}-extracted.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowExportAd(true);
      trackEvent("process_completed", {
        tool: "extract",
        file_count: selectedPages.length,
        input_type: "pdf",
        output_type: "pdf",
        size_bytes: blob.size,
      });
      trackEvent("export_downloaded", {
        tool: "extract",
        file_count: selectedPages.length,
        output_type: "pdf",
        size_bytes: blob.size,
      });
      setMessage({
        type: "success",
        text: `Extracted PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your extracted PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Extract PDF Pages</h2>
          <p className="tool-sub">
            Select PDF pages and export them into a new PDF file.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable page-level extraction workflows over time."
        features={[
          "Extract pages from larger PDFs without hitting the free cap",
          "Move through repeat page-selection tasks with less friction",
          "Unlock more advanced PDF editing workflows as ProjectStack grows",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={EXTRACT_FEATURE.upgradeReason}
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
        {EXTRACT_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {EXTRACT_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={EXTRACT_FEATURE.adPlacement}
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
                {selectedPages.length} page{selectedPages.length === 1 ? "" : "s"} selected
              </strong>
              <span>
                Choose the pages you want to keep in the new extracted PDF.
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
            </div>
          </div>

          <div className="rotate-page-grid">
            {pages.map((page) => {
              const isSelected = selectedPages.includes(page.pageNumber);

              return (
                <article
                  key={page.pageNumber}
                  className={`rotate-page-card ${
                    isSelected ? "extract-page-card-selected" : ""
                  }`}
                >
                  <label className="rotate-page-select">
                    <input
                      type="checkbox"
                      checked={isSelected}
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
                      <p>{isSelected ? "Included in export" : "Not selected"}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <button
        className="merge-btn"
        disabled={!selectedPages.length || isProcessing}
        onClick={exportExtractedPdf}
      >
        {isProcessing ? "Exporting..." : "Export Selected Pages"}
      </button>
    </>
  );
}
