import { api } from "./api";

// Save a Blob as a file download.
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

// File name = station name + dispatch date, e.g. Agartala_13-01-2026
function fileStem(order) {
  const station = ((order.customer && (order.customer.city || order.customer.name)) || "Challan").trim();
  const when = order.dispatch_date || order.order_date || ""; // YYYY-MM-DD
  const [y, m, d] = when.split("-");
  const date = y && m && d ? `${d}-${m}-${y}` : "";
  return `${station}_${date}`.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

// "PDF" button: the challan with the letterhead artwork, followed by the uploaded Bilty and Kaanta Parchi.
export async function downloadChallanPdf(order) {
  const blob = await api.getChallanPdf(order.id, "letterhead");
  saveBlob(blob, `${fileStem(order)}.pdf`);
}

// Orders screen "PDF" button: the dispatch summary (orders dispatched on the chosen date, YYYY-MM-DD).
export async function downloadSummaryPdf(date) {
  const blob = await api.getSummaryPdf(date);
  const [y, m, d] = date.split("-");
  saveBlob(blob, `Dispatch_Summary_${d}-${m}-${y}.pdf`);
}

// "Print" button: the challan without artwork and with the margins for the
// pre-printed letterhead, opened in a new tab so it can be printed from the
// PDF viewer. If the browser/app won't open a new tab it is downloaded instead.
export async function printChallanPdf(order) {
  // Open the tab right away, inside the click, so popup blockers allow it.
  const win = window.open("", "_blank");
  if (win) win.document.write("<p style='font-family:sans-serif;padding:16px'>Preparing PDF…</p>");
  try {
    const blob = await api.getChallanPdf(order.id, "print");
    if (win) {
      const url = URL.createObjectURL(blob);
      win.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } else {
      saveBlob(blob, `${fileStem(order)}-print.pdf`); // the '-print.pdf' ending is what the Android app uses to open the print dialog
    }
  } catch (e) {
    if (win) win.close();
    throw e;
  }
}
