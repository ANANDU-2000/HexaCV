/**
 * Shared ArrayBuffer / Uint8Array → base64. Chunked so we never call
 * String.fromCharCode once per byte (main-thread freeze on multi-MB PDFs).
 */

const CHUNK_SIZE = 8192; // 8KB — safe for String.fromCharCode spread arity
/** Yield to the event loop between chunks when the payload is this large. */
const YIELD_AFTER_BYTES = 2 * 1024 * 1024;

function encodeChunk(bytes: Uint8Array, start: number, end: number): string {
  // Avoid spreading a huge typed array in one call (engine arg limits + TS target).
  const chunk = Array.from(bytes.subarray(start, end));
  return String.fromCharCode(...chunk);
}

/** Sync conversion — fine for small payloads (paste text, small files). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return uint8ArrayToBase64(new Uint8Array(buffer));
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += encodeChunk(bytes, i, Math.min(i + CHUNK_SIZE, bytes.length));
  }
  return btoa(binary);
}

/** UTF-8 text → base64 (LinkedIn paste, etc.). */
export function stringToBase64(text: string): string {
  return uint8ArrayToBase64(new TextEncoder().encode(text));
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

/**
 * Async conversion that yields between chunks for large files so the UI
 * (e.g. ParseLoader) can paint before the network request starts.
 */
export async function arrayBufferToBase64Async(
  buffer: ArrayBuffer
): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const shouldYield = bytes.length >= YIELD_AFTER_BYTES;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += encodeChunk(bytes, i, Math.min(i + CHUNK_SIZE, bytes.length));
    if (shouldYield && i + CHUNK_SIZE < bytes.length) {
      await yieldToMain();
    }
  }
  return btoa(binary);
}
