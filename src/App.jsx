import { useState } from "react";
import "./index.css";
import { PDFDocument } from "pdf-lib";
import UpgradeBanner from "./components/UpgradeBanner";

export default function App() {
  const [files, setFiles] = useState([]);

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const MAX_FREE_FILES = 3;

    setFiles((prev) => {
      const combined = [...prev, ...selectedFiles];

      if (combined.length > MAX_FREE_FILES) {
        alert("Free version allows up to 3 PDFs. Upgrade coming soon.");
        return combined.slice(0, MAX_FREE_FILES);
      }

      return combined;
    });

    event.target.value = "";
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }
function moveFileUp(index) {
  if (index === 0) return;

  setFiles(prev => {
    const newFiles = [...prev];
    [newFiles[index - 1], newFiles[index]] =
      [newFiles[index], newFiles[index - 1]];
    return newFiles;
  });
}

function moveFileDown(index) {
  setFiles(prev => {
    if (index === prev.length - 1) return prev;

    const newFiles = [...prev];
    [newFiles[index + 1], newFiles[index]] =
      [newFiles[index], newFiles[index + 1]];
    return newFiles;
  });
}
async function mergePdfs() {
  if (!files.length) return;

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);

    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();

  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.pdf";
  a.click();

  URL.revokeObjectURL(url);
}
  return (
    <div className="app-shell">
      <div className="app-card">
        <UpgradeBanner />
        <p className="eyebrow">PDF Utility Suite</p>
        <h1>Merge PDF Files</h1>
        <p className="subtitle">
          Upload multiple PDF files, arrange them, and prepare them for merging.
        </p>

        <label className="upload-box">
          <span>Select PDF files</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileChange}
          />
        </label>

        <div className="file-section">
          <h2>Selected Files</h2>

          {files.length === 0 ? (
            <div className="empty-state">No files selected yet.</div>
          ) : (
            <ul className="file-list">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="file-item"
                >
                  <div className="file-meta">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => moveFileUp(index)}>↑</button>

                    <button onClick={() => moveFileDown(index)}>↓</button>

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="merge-btn"
          disabled={!files.length}
          onClick={mergePdfs}
        >
          Merge PDFs
        </button>
      </div>
    </div>
  );
}
