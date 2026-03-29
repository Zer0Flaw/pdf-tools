function padNumber(value) {
  return String(value).padStart(2, "0");
}

export function getDateStamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
}

export function getBaseFileName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "");
}
