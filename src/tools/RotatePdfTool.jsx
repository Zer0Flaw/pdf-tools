import { useEffect, useRef, useState } from "react";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";
import { activateOnEnterOrSpace } from "../utils/accessibility";
import { buildPdfPagePreviews, revokePreviewUrls } from "../utils/pdfPagePreviews";
import { rotatePdfPages } from "../utils/pdfPageOperations";
import { validatePdfFile } from "../utils/pdfValidation";

const ROTATE_FEATURE = getFeatureGate("rotate");
const MAX_FILE_SIZE = ROTATE_FEATURE.maxFileSize;
const MAX_FILES = ROTATE_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

function normalizeRotation(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export default function RotatePdfTool() {
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
        tool: "rotate",
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
      tool: "rotate",
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

  async function preparePages() {
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
        rotation: 0,
      }));

      setPages(nextPages);
      setSelectedPages(nextPages.map((page) => page.pageNumber));
      setMessage({
        type: "success",
        text: `Ready to rotate ${nextPages.length} page${nextPages.length === 1 ? "" : "s"}.`,
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

  function rotatePage(pageNumber, delta) {
    setPages((prev) =>
      prev.map((page) =>
        page.pageNumber === pageNumber
          ? { ...page, rotation: normalizeRotation(page.rotation + delta) }
          : page,
      ),
    );
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

  async function exportRotatedPdf() {
    if (!file || !pages.length || isProcessing) return;

    trackEvent("process_started", {
      tool: "rotate",
      file_count: 1,
      input_type: "pdf",
      output_type: "pdf",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const rotatedBytes = await rotatePdfPages(bytes, pages);
      const blob = new Blob([rotatedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${getBaseFileName(file.name)}-rotated.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowExportAd(true);
      trackEvent("process_completed", {
        tool: "rotate",
        file_count: pages.length,
        input_type: "pdf",
        output_type: "pdf",
        size_bytes: blob.size,
      });
      trackEvent("export_downloaded", {
        tool: "rotate",
        file_count: pages.length,
        output_type: "pdf",
        size_bytes: blob.size,
      });
      setMessage({
        type: "success",
        text: `Rotated PDF downloaded successfully (${formatBytes(blob.size)}).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while exporting your rotated PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Rotate PDF Pages</h2>
          <p className="tool-sub">
            Rotate individual PDF pages and export a corrected document.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for bigger PDFs and more capable document cleanup workflows over time."
        features={[
          "Rotate larger PDFs without hitting the free cap",
          "Keep repeat document cleanup moving with less friction",
          "Unlock more advanced PDF editing workflows as ProjectStack grows",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={ROTATE_FEATURE.upgradeReason}
      />

      <div
        className={`drop-zone ${isDragOver ? "drag-over" : ""} ${isProcessing ? "disabled" : ""}`}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-label={`Upload a PDF for Rotate PDF Pages. Free plan includes one PDF up to ${FILE_SIZE_LIMIT_LABEL}.`}
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
        {ROTATE_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {ROTATE_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={ROTATE_FEATURE.adPlacement}
        isVisible={showExportAd}
      />

      {file && !pages.length && !isProcessing && (
        <button className="merge-btn" onClick={preparePages}>
          Load PDF Pages
        </button>
      )}

      {pages.length > 0 && (
        <>
          <div className="rotate-toolbar">
            <div className="rotate-toolbar-copy">
              <strong>Selected pages: {selectedPages.length}</strong>
              <span>Choose pages to rotate together, or use each page card.</span>
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
            </div>
          </div>

          <div className="rotate-page-grid">
            {pages.map((page) => (
              <article key={page.pageNumber} className="rotate-page-card">
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
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                </div>

                <div className="rotate-page-meta">
                  <div>
                    <h3>Page {page.pageNumber}</h3>
                    <p>Rotation: {page.rotation}°</p>
                  </div>

                  <div className="rotate-page-actions">
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotatePage(page.pageNumber, -90)}
                    >
                      Rotate Left
                    </button>
                    <button
                      type="button"
                      className="hero-secondary-btn"
                      onClick={() => rotatePage(page.pageNumber, 90)}
                    >
                      Rotate Right
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
        disabled={!pages.length || isProcessing}
        onClick={exportRotatedPdf}
      >
        {isProcessing ? "Exporting..." : "Export Rotated PDF"}
      </button>
    </>
  );
}
