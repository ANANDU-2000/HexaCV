/**
 * Guest session + device identity, sent as tRPC headers so the server can track
 * anonymous usage (`x-guest-session-id` / `x-device-uid`) and migrate the guest
 * session on account conversion (Login reads `guest_session_id`).
 *
 * IDs are created once per browser and persisted, so header generation is a
 * cheap localStorage read after the first request.
 */

const DEVICE_UID_KEY = "hexacv_device_uid";
const GUEST_SESSION_KEY = "guest_session_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreate(key: string): string {
  try {
    let v = localStorage.getItem(key);
    if (!v) {
      v = randomId();
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return "";
  }
}

export function getOrCreateDeviceUid(): string {
  return getOrCreate(DEVICE_UID_KEY);
}

/** Uses the same key as Login's convertGuest flow (`guest_session_id`). */
export function getOrCreateGuestSessionId(): string {
  return getOrCreate(GUEST_SESSION_KEY);
}
