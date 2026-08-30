// Bild einer Datei einlesen, quadratisch zuschneiden, verkleinern und als
// data-URL zurueckgeben. Klein genug fuer localStorage und den P2P-Sync.
export function readPortrait(file, size = 320) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('notImage'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        reject(new Error('encodeFailed'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('loadFailed'));
    };
    img.src = url;
  });
}
