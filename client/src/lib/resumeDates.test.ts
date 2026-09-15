import { describe, expect, it } from "vitest";
import {
  hasInvertedDateRange,
  parseResumeDate,
  resolveCurrentToggle,
} from "./resumeDates";

describe("parseResumeDate", () => {
  it("parses ISO-ish year/month/day values", () => {
    expect(parseResumeDate("2024")).toBe(Date.UTC(2024, 0, 1));
    expect(parseResumeDate("2024-05")).toBe(Date.UTC(2024, 4, 1));
    expect(parseResumeDate("2024-05-12")).toBe(Date.UTC(2024, 4, 12));
  });

  it("returns null for empty, free-form, or invalid values", () => {
    expect(parseResumeDate("")).toBeNull();
    expect(parseResumeDate(undefined)).toBeNull();
    expect(parseResumeDate("Jan 2022")).toBeNull();
    expect(parseResumeDate("Present")).toBeNull();
    expect(parseResumeDate("2022/05/12")).toBeNull();
    expect(parseResumeDate("not-a-date")).toBeNull();
  });
});

describe("hasInvertedDateRange", () => {
  it("flags inverted ISO ranges", () => {
    expect(hasInvertedDateRange("2024-05", "2023-11")).toBe(true);
    expect(hasInvertedDateRange("2024-05-12", "2024-05-01")).toBe(true);
  });

  it("accepts valid ranges and equality", () => {
    expect(hasInvertedDateRange("2023-11", "2024-05")).toBe(false);
    expect(hasInvertedDateRange("2024-05", "2024-05")).toBe(false);
  });

  it("treats Present/current as open-ended, never inverted", () => {
    expect(hasInvertedDateRange("2024-05", "Present")).toBe(false);
    expect(hasInvertedDateRange("2024-05", "current")).toBe(false);
  });

  it("skips free-form or missing values (non-blocking)", () => {
    expect(hasInvertedDateRange("May 2024", "March 2023")).toBe(false);
    expect(hasInvertedDateRange("", "")).toBe(false);
    expect(hasInvertedDateRange("2024-05", "")).toBe(false);
    expect(hasInvertedDateRange(undefined, undefined)).toBe(false);
  });
});

describe("resolveCurrentToggle", () => {
  it("checking sets Present sentinel", () => {
    expect(resolveCurrentToggle(true, "Mar 2023")).toEqual({
      current: true,
      endDate: "Present",
    });
  });

  it("unchecking clears an auto-set Present sentinel", () => {
    expect(resolveCurrentToggle(false, "Present")).toEqual({
      current: false,
      endDate: "",
    });
  });

  it("unchecking never wipes a user-typed end date", () => {
    expect(resolveCurrentToggle(false, "Mar 2023")).toEqual({
      current: false,
    });
    expect(resolveCurrentToggle(false, "")).toEqual({ current: false });
    expect(resolveCurrentToggle(false, undefined)).toEqual({
      current: false,
    });
  });
});