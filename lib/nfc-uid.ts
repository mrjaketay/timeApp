/**
 * Normalize NFC card UID / serial number for consistent matching.
 * NFC Tools may show serial as "04:A1:B2:C3" or "04a1b2c3" — we strip separators and lowercase.
 */
export function normalizeNfcUid(uid: string): string {
  return uid
    .replace(/[\s:.-]/g, "")
    .toLowerCase()
    .trim();
}
