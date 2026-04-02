export function isPdfFile(file) {
  if (!file) return false;

  return (
    file.type === "application/pdf" ||
    file.name?.toLowerCase().endsWith(".pdf")
  );
}

export function validatePdfFile(file, maxFileSize, isPremium = false) {
  if (!isPdfFile(file)) {
    return {
      isValid: false,
      reason: "file_type",
      message: "Only PDF files are supported.",
    };
  }

  if (!isPremium && maxFileSize && file.size > maxFileSize) {
    return {
      isValid: false,
      reason: "file_size_limit",
      message: null,
    };
  }

  return {
    isValid: true,
    reason: null,
    message: null,
  };
}
