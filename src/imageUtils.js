// Shrinks a big phone photo before upload (a camera photo is often 4-8 MB, the server accepts 5 MB).
// Photos are scaled to 2000 px on the long side and re-saved as JPEG; small images are left alone.
export async function shrinkImage(file, maxSide = 2000, quality = 0.85) {
  if (!file || !file.type || !file.type.startsWith("image/") || file.size < 700 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file); // applies the photo's own rotation
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${(file.name || "photo").replace(/\.\w+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // if the browser can't process it, upload it as it is
  }
}
