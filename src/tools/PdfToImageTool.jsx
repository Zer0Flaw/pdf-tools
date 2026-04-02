import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import UpgradeBanner from "../components/UpgradeBanner";
import AdSlot from "../components/AdSlot";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { formatFeatureFileSize, getFeatureGate } from "../utils/features";
import { trackEvent } from "../utils/analytics";

GlobalWorkerOptions.workerSrc = pdfWorker;

const PDF_TO_IMAGE_FEATURE = getFeatureGate("pdfToImage");
const MAX_FILE_SIZE = PDF_TO_IMAGE_FEATURE.maxFileSize;
const MAX_FILES = PDF_TO_IMAGE_FEATURE.maxFiles;
const FILE_SIZE_LIMIT_LABEL = formatFeatureFileSize(MAX_FILE_SIZE);

function revokeImageUrls(images) {
  images.forEach((image) => {
    URL.revokeObjectURL(image.url);
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export default function PdfToImageTool() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const imageUrlsRef = useRef([]);
  const isPremium = false;

  useEffect(() => {
    imageUrlsRef.current = images;
  }, [images]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      revokeImageUrls(imageUrlsRef.current);
    };
  }, []);

  function resetOutputs() {
    revokeImageUrls(imageUrlsRef.current);
    imageUrlsRef.current = [];
    setImages([]);
  }

  function setSelectedFile(selectedFile) {
    setFile(selectedFile);
    resetOutputs();
    setShowExportAd(false);
  }

  function validatePdf(selectedFile) {
    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage({ type: "error", text: "Only PDF files are supported." });
      return false;
    }

    if (!isPremium && selectedFile.size > MAX_FILE_SIZE) {
      trackEvent("free_limit_encountered", {
        tool: "pdfToImage",
        file_count: 1,
        input_type: "pdf",
        gated_feature: "file_size_limit",
      });
      setMessage({
        type: "error",
        text: `File exceeds the ${FILE_SIZE_LIMIT_LABEL} limit for free users.`,
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
      tool: "pdfToImage",
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
    resetOutputs();
    setShowExportAd(false);
    setMessage(null);
    trackEvent("file_removed", {
      tool: "pdfToImage",
      file_count: 1,
      input_type: "pdf",
    });
  }

  async function convertPdfToImages() {
    if (!file || isProcessing) return;

    trackEvent("process_started", {
      tool: "pdfToImage",
      file_count: 1,
      input_type: "pdf",
      output_type: "image",
    });
    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);
    resetOutputs();

    try {
      const bytes = await file.arrayBuffer();
      const loadingTask = getDocument({ data: new Uint8Array(bytes) });
      const pdf = await loadingTask.promise;
      const nextImages = [];
      const baseName = getBaseFileName(file.name);

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas is not supported.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const blob = await canvasToBlob(canvas);
        const imageName = `${baseName}-page-${pageNumber}.png`;

        nextImages.push({
          pageNumber,
          name: imageName,
          blob,
          size: blob.size,
          url: URL.createObjectURL(blob),
        });

        canvas.width = 0;
        canvas.height = 0;
      }

      setImages(nextImages);
      setShowExportAd(true);

      const totalBytes = nextImages.reduce((sum, image) => sum + image.size, 0);

      trackEvent("process_completed", {
        tool: "pdfToImage",
        file_count: nextImages.length,
        input_type: "pdf",
        output_type: "image",
        size_bytes: totalBytes,
      });
      setMessage({
        type: "success",
        text: `Generated ${nextImages.length} PNG image${nextImages.length === 1 ? "" : "s"} (${formatBytes(totalBytes)} total).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while converting your PDF. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadImage(image) {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.name;
    link.click();

    trackEvent("export_downloaded", {
      tool: "pdfToImage",
      file_count: 1,
      output_type: "image",
      page_number: image.pageNumber,
      size_bytes: image.size,
    });
  }

  function downloadAllImages() {
    if (!images.length) return;

    images.forEach((image) => {
      const link = document.createElement("a");
      link.href = image.url;
      link.download = image.name;
      link.click();
    });

    trackEvent("export_downloaded", {
      tool: "pdfToImage",
      file_count: images.length,
      output_type: "image",
      size_bytes: images.reduce((sum, image) => sum + image.size, 0),
    });
  }

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>PDF to Image</h2>
          <p className="tool-sub">
            Convert PDF pages into downloadable PNG images in your browser.
          </p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title={`Free plan: ${FILE_SIZE_LIMIT_LABEL} max file`}
        subtitle="ProjectStack Pro is designed for larger PDF conversions, smoother repeat exports, and more flexible file workflows over time."
        features={[
          "Convert larger PDFs without hitting the free file cap",
          "Keep repeat page-export work moving with less friction",
          "Unlock more capable conversion flows as ProjectStack grows",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={PDF_TO_IMAGE_FEATURE.upgradeReason}
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
        {PDF_TO_IMAGE_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {PDF_TO_IMAGE_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={PDF_TO_IMAGE_FEATURE.adPlacement}
        isVisible={showExportAd}
      />

      {images.length > 0 && (
        <div className="pdf-image-results">
          <div className="pdf-image-results-header">
            <div>
              <h3>Converted pages</h3>
              <p>Download each page as a PNG image or grab the whole set.</p>
            </div>

            <button
              type="button"
              className="hero-secondary-btn"
              onClick={downloadAllImages}
            >
              Download All Images
            </button>
          </div>

          <div className="pdf-image-grid">
            {images.map((image) => (
              <article key={image.name} className="pdf-image-card">
                <img
                  className="pdf-image-preview"
                  src={image.url}
                  alt={`Preview of page ${image.pageNumber}`}
                />
                <div className="pdf-image-card-body">
                  <div>
                    <h4>Page {image.pageNumber}</h4>
                    <p>{formatBytes(image.size)}</p>
                  </div>

                  <button
                    type="button"
                    className="hero-secondary-btn tool-preview-btn"
                    onClick={() => downloadImage(image)}
                  >
                    Download PNG
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <button
        className="merge-btn"
        disabled={!file || isProcessing}
        onClick={convertPdfToImages}
      >
        {isProcessing ? "Converting..." : "Convert PDF to Images"}
      </button>
    </>
  );
}
