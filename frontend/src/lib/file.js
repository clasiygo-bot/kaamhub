// Read a File object as a data URL (base64). Optionally downscale to a max width.
// Suitable for QR codes, small banner images (< ~2MB).
export function readFileAsDataURL(file, { maxWidth = 1600, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    if (!file.type.startsWith("image/")) return reject(new Error("Not an image"));
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.onload = () => {
      const dataUrl = reader.result;
      // Skip downscale for SVG or GIF or when Image API is missing
      if (!dataUrl || typeof dataUrl !== "string" || file.type === "image/svg+xml" || file.type === "image/gif" || typeof Image === "undefined") {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth) return resolve(dataUrl);
        const scale = maxWidth / img.width;
        const canvas = document.createElement("canvas");
        canvas.width = maxWidth;
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const out = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality);
          resolve(out);
        } catch {
          resolve(dataUrl); // fallback to original
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
