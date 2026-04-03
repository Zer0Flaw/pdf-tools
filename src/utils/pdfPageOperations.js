import { degrees, PDFDocument } from "pdf-lib";

function toZeroBasedPageIndexes(pageNumbers) {
  return pageNumbers.map((pageNumber) => pageNumber - 1);
}

async function buildPdfFromPageNumbers(bytes, pageNumbers) {
  const sourcePdf = await PDFDocument.load(bytes);
  const nextPdf = await PDFDocument.create();
  const copiedPages = await nextPdf.copyPages(
    sourcePdf,
    toZeroBasedPageIndexes(pageNumbers),
  );

  copiedPages.forEach((page) => nextPdf.addPage(page));

  return nextPdf.save();
}

async function buildPdfFromPageStates(bytes, pageStates) {
  const sourcePdf = await PDFDocument.load(bytes);
  const nextPdf = await PDFDocument.create();
  const copiedPages = await nextPdf.copyPages(
    sourcePdf,
    toZeroBasedPageIndexes(pageStates.map((page) => page.pageNumber)),
  );

  copiedPages.forEach((page, index) => {
    page.setRotation(degrees(pageStates[index].rotation || 0));
    nextPdf.addPage(page);
  });

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
  return buildPdfFromPageNumbers(bytes, keptPageNumbers);
}

export async function reorderPdfPages(bytes, orderedPageNumbers) {
  return buildPdfFromPageNumbers(bytes, orderedPageNumbers);
}

export async function extractPdfPages(bytes, selectedPageNumbers) {
  return buildPdfFromPageNumbers(bytes, selectedPageNumbers);
}

export async function editPdfPages(bytes, pageStates) {
  return buildPdfFromPageStates(
    bytes,
    pageStates.filter((page) => !page.markedForDeletion),
  );
}

export async function extractEditedPdfPages(bytes, pageStates, selectedPageNumbers) {
  return buildPdfFromPageStates(
    bytes,
    pageStates.filter(
      (page) =>
        !page.markedForDeletion && selectedPageNumbers.includes(page.pageNumber),
    ),
  );
}
