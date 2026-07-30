import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";

describe("Global Country Management System", () => {
  beforeAll(() => {
    // Ensure mockDb is seeded
    db.seedMockDb();
  });

  it("retrieves list of active countries", async () => {
    const list = await db.getCountries();
    expect(list.length).toBeGreaterThan(0);
    
    // Check that priority country India is present
    const india = list.find((c) => c.code === "IN");
    expect(india).toBeDefined();
    expect(india?.name).toBe("India");
    expect(india?.dialCode).toBe("+91");
  });

  it("retrieves states/subdivisions for a country code", async () => {
    const usStates = await db.getStatesByCountry("US");
    expect(usStates.length).toBe(51); // 50 states + DC
    
    const caStates = await db.getStatesByCountry("CA");
    expect(caStates.length).toBe(13); // provinces & territories
  });

  it("retrieves localized country settings", async () => {
    const inSettings = await db.getCountrySettings("IN");
    expect(inSettings).toBeDefined();
    expect(inSettings?.dateFormat).toBe("DD/MM/YYYY");
    expect(inSettings?.addressFormat).toContain("India");
  });

  it("retrieves regional ATS transition rules", async () => {
    const rule = await db.getCountryAtsRules("IN", "US");
    expect(rule).toBeDefined();
    expect(rule?.keywords).toContain("Managed");
    expect(rule?.regionalTerminology).toMatchObject({
      "CV": "Resume",
      "PIN Code": "ZIP Code"
    });
  });

  it("inserts and updates countries in memory fallbacks", async () => {
    const newC = await db.insertCountry({
      code: "XX",
      name: "Testland",
      flag: "🏴",
      dialCode: "+999",
      phoneFormat: "XXX-XXX",
      phoneRegex: "^\\d{6}$",
      postalCodeLabel: "Testcode",
      postalCodeFormat: "6 digits",
      dateFormat: "YYYY-MM-DD",
      addressFormat: "{city}, Testland",
      nationality: "Testlander",
      isPriority: false,
      isActive: true
    });

    expect(newC).toBeDefined();
    expect(newC.code).toBe("XX");

    const updated = await db.updateCountry(newC.id, { name: "Testlandia" });
    expect(updated).toBeDefined();
    expect(updated?.name).toBe("Testlandia");
  });
});
