import { BattleMap } from '../battlemap/battlemap.js';

// UpfImage = { name, mime, b64 } (rohe Dateibytes in Base64) -> Blob
export function upfToBlob(img, where) {
  if (!img || typeof img.b64 !== 'string' || !img.b64) throw new Error(`${where}: image missing`);
  const bin = atob(img.b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: img.mime || 'image/png' });
}

async function naturalWidth(blob) {
  const bmp = await createImageBitmap(blob);
  const w = bmp.width;
  bmp.close();
  return w;
}

// Verkleinert ein gepushtes Bild auf eine JPEG-Data-URL (localStorage und WebRTC
// vertragen keine Megabyte-Bilder). `scale` ist das Verhaeltnis neu/original —
// Raster und Positionen aus dem Push beziehen sich auf die Originalpixel und
// muessen damit mitskaliert werden.
export async function upfToDataUrl(img, where, maxEdge = 1600, quality = 0.78) {
  const blob = upfToBlob(img, where);
  const [orig, small] = await Promise.all([
    naturalWidth(blob).catch(() => 0),
    BattleMap.bildVerkleinern(blob, maxEdge, quality),
  ]);
  return { dataUrl: small.dataUrl, scale: orig ? small.breite / orig : 1 };
}
