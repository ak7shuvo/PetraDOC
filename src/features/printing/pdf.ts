import type { PrintTarget } from "./types";

export const PAPER_MM: Record<PrintTarget, number | null> = { A4: null, THERMAL_58: 58, THERMAL_80: 80 };

/**
 * Renders a mounted element to a real PDF file (A4 pages, or one tall thermal-width page).
 * Uses html2canvas + jsPDF so Bengali and any font in the document render correctly.
 * Limitation: page content is raster, so PDF text is not selectable; A4 splits at fixed page height.
 */
export async function elementToPdf(el: HTMLElement, target: PrintTarget): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
  const widthMm = PAPER_MM[target];
  if (widthMm) {
    const h = (canvas.height * widthMm) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: [widthMm, h] });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, widthMm, h);
    return pdf.output("blob");
  }
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210, ph = 297;
  const sliceH = Math.floor((canvas.width * ph) / pw);
  for (let y = 0, page = 0; y < canvas.height; y += sliceH, page++) {
    const h = Math.min(sliceH, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width; slice.height = h;
    slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, (h * pw) / canvas.width);
  }
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
