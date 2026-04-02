import { degrees, PDFDocument } from "pdf-lib";

function toPageIndexes(pageNumbers) {
  return pageNumbers.map((pageNumber) => pageNumber - 1);
}

async function buildPdfFromPageIndexes(bytes, pageIndexes) {
  const sourcePdf = await PDFDocument.load(bytes);
  const nextPdf = await PDFDocument.create();
  const copiedPages = await nextPdf.copyPages(sourcePdf, pageIndexes);

  copiedPages.forEach((page) => nextPdf.addPage(page));

  return nextPdf.save();
}

export async function rotatePdfPages(bytes, pages) {
  const pdf = await PDFDocument.load(bytes);

  pages.forEach((pageState, index) => {
    const page = pdf.getPage(index);
    page.setRotation(degrees(pageState.rotation));
  });

  return pdf.save();
}

export async function deletePdfPages(bytes, keptPageNumbers) {
  return buildPdfFromPageIndexes(bytes, toPageIndexes(keptPageNumbers));
}

export async function reorderPdfPages(bytes, orderedPageNumbers) {
  return buildPdfFromPageIndexes(bytes, toPageIndexes(orderedPageNumbers));
}

export async function extractPdfPages(bytes, selectedPageNumbers) {
  return buildPdfFromPageIndexes(bytes, toPageIndexes(selectedPageNumbers));
}
