import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import UpgradeBanner from "../components/UpgradeBanner";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function SplitTool() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
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

  async function splitPdf() {
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pageCount = pdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `page-${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
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
        features={[
          "Split large PDFs",
          "Faster processing",
          "Future export options",
        ]}
      />

      <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          hidden
        />

        <div className="drop-zone-title">Select a PDF to Split</div>
        <div className="drop-zone-sub">Max 5MB (free plan)</div>
      </div>

      {file && <div className="usage-indicator">Selected: {file.name}</div>}

      {message && (
        <div className={`inline-message ${message.type}`}>{message.text}</div>
      )}

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
