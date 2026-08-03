/**
 * Client runtime error reporter — catches window `error` and `unhandledrejection`
 * and POSTs them to `/api/runtime-error`, where the server writes them to the
 * `runtime-errors/client/` folder for manual review.
 *
 * Reporting is fire-and-forget and must never break the app.
 */

function send(message: string, stack?: string): void {
  try {
    const body = JSON.stringify({
      message: message.slice(0, 500),
      stack: (stack || "").slice(0, 5000),
      url: (typeof window !== "undefined" ? window.location.href : "").slice(0, 500),
    });
    fetch("/api/runtime-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* ignore — reporting must never surface errors */
    });
  } catch {
    /* ignore */
  }
}

export function installClientErrorReporter(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    send(
      event.message || "window error",
      event.error instanceof Error ? event.error.stack : undefined
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      send(reason.message, reason.stack);
    } else {
      send(`Unhandled promise rejection: ${String(reason)}`);
    }
  });
}
