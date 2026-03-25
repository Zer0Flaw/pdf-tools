import { useState } from "react";
import "./index.css";

export default function App() {
  const [files, setFiles] = useState([]);

  function handleFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    setFiles((prev) => [...prev, ...selectedFiles]);

    // reset input so the same file can be selected again later if needed
    event.target.value = "";
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  return (
    <div className="app-shell">
      <div className="app-card">
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

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className="merge-btn" disabled>
          Merge PDFs
        </button>
      </div>
    </div>
  );
}
