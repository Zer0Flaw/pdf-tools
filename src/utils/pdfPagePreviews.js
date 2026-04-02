import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create page preview."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export function revokePreviewUrls(pages) {
  pages.forEach((page) => {
    URL.revokeObjectURL(page.previewUrl);
  });
}

export async function buildPdfPagePreviews(bytes, scale = 0.55) {
  const loadingTask = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await loadingTask.promise;
  const nextPages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
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

    nextPages.push({
      pageNumber,
      previewUrl: URL.createObjectURL(blob),
    });

    canvas.width = 0;
    canvas.height = 0;
  }

  return nextPages;
}
