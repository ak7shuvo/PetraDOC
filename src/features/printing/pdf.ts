import type { PrintTarget } from "./types";

export const PAPER_MM: Record<PrintTarget, number | null> = { A4: null, THERMAL_58: 58, THERMAL_80: 80 };

const A4_LAYOUT_PX = 794; // fixed layout width used for the A4 render, independent of screen size
const MARGIN_MM = 10;

const MIN_GAP_PX = 14; // canvas px (2x): wider than the gap between two lines of one entry

const rowBlank = (ctx: CanvasRenderingContext2D, w: number, y: number) => {
  const d = ctx.getImageData(0, y, w, 1).data;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245) return false;
  return true;
};

/**
 * Cut position in (minY, limitY]: the middle of the lowest blank band wider than a line gap (so entries stay
 * together), else the lowest single blank row, else limitY. Never cuts through ink when a blank row exists.
 */
function findCut(canvas: HTMLCanvasElement, minY: number, limitY: number): number {
  const ctx = canvas.getContext("2d")!;
  let run = 0, fallback = -1;
  for (let y = limitY; y > minY; y--) {
    if (rowBlank(ctx, canvas.width, y)) {
      if (fallback < 0) fallback = y;
      if (++run >= MIN_GAP_PX) return y + Math.floor(run / 2);
    } else run = 0;
  }
  return fallback > 0 ? fallback : limitY;
}

/** Page cut positions in canvas px: each page ends on a blank row where possible. */
export function planPages(canvas: HTMLCanvasElement, pageHeightPx: number): [number, number][] {
  const pages: [number, number][] = [];
  let start = 0;
  while (start < canvas.height - 1) {
    const limit = start + pageHeightPx;
    const cut = limit >= canvas.height ? canvas.height : findCut(canvas, start + pageHeightPx * 0.5, limit);
    pages.push([start, cut]);
    start = cut;
  }
  return pages;
}

/**
 * Renders a mounted prescription element to a real PDF file: A4 (multi-page, breaks between
 * on blank rows, never through a line of text) or one tall thermal-width page.
 * Uses html2canvas + jsPDF so Bengali and any web font render correctly.
 * Limit: page content is raster, so PDF text is not selectable/searchable. Selectable text would need a
 * separate text layout engine with an embedded Bengali font (duplicate layout logic), so it is not done.
 */
export async function elementToPdf(el: HTMLElement, target: PrintTarget): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const widthMm = PAPER_MM[target];
  // Render a fixed-width offscreen clone so A4 output does not depend on the screen size.
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthMm ? el.offsetWidth : A4_LAYOUT_PX}px;background:#fff`;
  const node = el.cloneNode(true) as HTMLElement;
  node.removeAttribute("id");
  if (!widthMm) { node.style.width = `${A4_LAYOUT_PX}px`; node.style.maxWidth = `${A4_LAYOUT_PX}px`; }
  host.appendChild(node);
  document.body.appendChild(host);
  let canvas: HTMLCanvasElement;
  try {
    await document.fonts?.ready;
    canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  } finally {
    host.remove();
  }
  if (widthMm) {
    const h = (canvas.height * widthMm) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: [widthMm, h] });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, widthMm, h);
    return pdf.output("blob");
  }
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const contentW = 210 - 2 * MARGIN_MM, contentH = 297 - 2 * MARGIN_MM - 4;
  const pages = planPages(canvas, Math.floor((canvas.width * contentH) / contentW));
  pages.forEach(([y0, z], i) => {
    const h = z - y0;
    const slice = document.createElement("canvas");
    slice.width = canvas.width; slice.height = h;
    slice.getContext("2d")!.drawImage(canvas, 0, y0, canvas.width, h, 0, 0, canvas.width, h);
    if (i > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN_MM, MARGIN_MM, contentW, (h * contentW) / canvas.width);
    if (pages.length > 1) { pdf.setFontSize(8); pdf.text(`Page ${i + 1} of ${pages.length}`, 105, 291, { align: "center" }); }
  });
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
