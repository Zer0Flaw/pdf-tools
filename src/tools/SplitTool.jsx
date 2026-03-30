import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";
import { getBaseFileName } from "../utils/fileNaming";
import { formatBytes } from "../utils/formatting";
import { getFeatureGate } from "../utils/features";
import AdSlot from "../components/AdSlot";
import { trackEvent } from "../utils/analytics";

const SPLIT_FEATURE = getFeatureGate("split");
const MAX_FILE_SIZE = SPLIT_FEATURE.maxFileSize;

export default function SplitTool() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExportAd, setShowExportAd] = useState(false);
  const fileInputRef = useRef(null);
  const isPremium = false;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  function handleFileSelect(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setShowExportAd(false);

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage({ type: "error", text: "Only PDF files are supported." });
      return;
    }

    if (!isPremium && selected.size > MAX_FILE_SIZE) {
      setMessage({
        type: "error",
        text: "File exceeds 5MB limit for free users.",
      });
      return;
    }

    setFile(selected);
    setMessage(null);
  }

  function getSplitFileName(selectedFile, pageNumber) {
    return `${getBaseFileName(selectedFile.name)}-page-${pageNumber}.pdf`;
  }

  async function splitPdf() {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setShowExportAd(false);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pageCount = pdf.getPageCount();
      let totalBytes = 0;

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const pdfBytes = await newPdf.save();
        totalBytes += pdfBytes.length;
        const blob = new Blob([pdfBytes], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getSplitFileName(file, i + 1);
        a.click();
        URL.revokeObjectURL(url);
      }

      setShowExportAd(true);
      trackEvent("export_success", {
        tool: "split",
        file_count: pageCount,
        size_bytes: totalBytes,
      });
      setMessage({
        type: "success",
        text: `Downloaded ${pageCount} split PDF${pageCount === 1 ? "" : "s"} (${formatBytes(totalBytes)} total).`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong while splitting your PDF.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <div className="tool-header">
        <div>
          <h2>Split PDF</h2>
          <p className="tool-sub">Extract each page into separate PDF files.</p>
        </div>

        {!isPremium && <div className="free-badge">Free</div>}
      </div>

      <UpgradeBanner
        title="Free plan: 5MB max file"
        subtitle="ProjectStack Pro is built for bigger documents and a smoother split workflow when you need more than the basics."
        features={[
          "Split larger PDFs without hitting the free cap",
          "Move through repeat page exports with less friction",
          "Unlock more flexible export options as the product expands",
        ]}
        ctaText="See Pro benefits"
        upgradeReason={SPLIT_FEATURE.upgradeReason}
      />

      <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          hidden
        />

        <div className="drop-zone-title">Select or Drop PDF Here</div>
        <div className="drop-zone-sub">Free plan includes one PDF up to 5MB</div>
      </div>

      {file && <div className="usage-indicator">1 / 1 PDF selected</div>}

      <div className="usage-indicator trust-indicator">
        {SPLIT_FEATURE.privacyMessage}
      </div>

      {isProcessing && (
        <div className="usage-indicator processing-indicator">
          {SPLIT_FEATURE.processingMessage}
        </div>
      )}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

      <AdSlot
        placement={SPLIT_FEATURE.adPlacement}
        isVisible={showExportAd}
      />

      <button
        className="merge-btn"
        disabled={!file || isProcessing}
        onClick={splitPdf}
      >
        {isProcessing ? "Splitting..." : "Split PDF"}
      </button>
    </>
  );
}
