import { describe, expect, it } from "vitest";
import {
  SAFE_GUEST_FALLBACK,
  guestHref,
  isSafeGuestRedirect,
} from "./const";

describe("isSafeGuestRedirect", () => {
  it("rejects empty, root, and auth pages", () => {
    expect(isSafeGuestRedirect("")).toBe(false);
    expect(isSafeGuestRedirect("/")).toBe(false);
    expect(isSafeGuestRedirect("/login")).toBe(false);
    expect(isSafeGuestRedirect("/login?x=1")).toBe(false);
    expect(isSafeGuestRedirect("/register")).toBe(false);
    expect(isSafeGuestRedirect("/Register")).toBe(false);
  });

  it("rejects gated account/admin routes", () => {
    expect(isSafeGuestRedirect("/dashboard")).toBe(false);
    expect(isSafeGuestRedirect("/dashboard/")).toBe(false);
    expect(isSafeGuestRedirect("/dashboard/home")).toBe(false);
    expect(isSafeGuestRedirect("/admin")).toBe(false);
    expect(isSafeGuestRedirect("/admin/users")).toBe(false);
    expect(isSafeGuestRedirect("/url")).toBe(false);
  });

  it("rejects absolute / protocol-relative URLs", () => {
    expect(isSafeGuestRedirect("https://evil.example/builder/target")).toBe(
      false
    );
    expect(isSafeGuestRedirect("//evil.example/builder")).toBe(false);
  });

  it("accepts known builder redirects", () => {
    expect(isSafeGuestRedirect("/builder/target")).toBe(true);
    expect(isSafeGuestRedirect("/builder/target/")).toBe(true);
    expect(isSafeGuestRedirect("/builder/review-draft")).toBe(true);
    expect(isSafeGuestRedirect("/builder/upload")).toBe(true);
    expect(isSafeGuestRedirect("/builder/ai")).toBe(true);
  });
});

describe("guestHref", () => {
  it("falls back for unsafe redirects", () => {
    expect(guestHref("")).toBe(SAFE_GUEST_FALLBACK);
    expect(guestHref("/")).toBe(SAFE_GUEST_FALLBACK);
    expect(guestHref("/dashboard/settings")).toBe(SAFE_GUEST_FALLBACK);
    expect(guestHref("/admin")).toBe(SAFE_GUEST_FALLBACK);
  });

  it("preserves safe builder redirects from the funnel", () => {
    expect(guestHref("/builder/target")).toBe("/builder/target");
    expect(guestHref("/builder/review-draft")).toBe("/builder/review-draft");
    expect(guestHref("/builder/upload")).toBe("/builder/upload");
  });
});
