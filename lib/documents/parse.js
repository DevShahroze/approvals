let pdfParse;

async function getPdfParse() {
  if (!pdfParse) {
    pdfParse = (await import("pdf-parse")).default;
  }
  return pdfParse;
}

export async function parseDocumentBuffer(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    const parse = await getPdfParse();
    const data = await parse(buffer);
    return data.text || "";
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  if (mimeType?.startsWith("text/")) {
    return buffer.toString("utf8");
  }
  return "";
}
