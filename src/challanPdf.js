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

// "PDF" button: the challan with the letterhead artwork, downloaded.
export async function downloadChallanPdf(order) {
  const blob = await api.getChallanPdf(order.id, "letterhead");
  saveBlob(blob, `Challan-${order.code}.pdf`);
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
      saveBlob(blob, `Challan-${order.code}-print.pdf`);
    }
  } catch (e) {
    if (win) win.close();
    throw e;
  }
}
