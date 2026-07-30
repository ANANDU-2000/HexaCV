import { Express, Request, Response } from "express";
import * as db from "./db";

export function registerCountryRoutes(app: Express) {
  // GET /countries - Retrieves all active countries
  app.get("/countries", async (req: Request, res: Response) => {
    try {
      const list = await db.getCountries();
      res.json(list);
    } catch (error: any) {
      console.error("[API] Error fetching countries:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // GET /countries/admin - Retrieves all countries (for admin dashboard, active or not)
  app.get("/countries/admin", async (req: Request, res: Response) => {
    try {
      const list = await db.getAllCountriesAdmin();
      res.json(list);
    } catch (error: any) {
      console.error("[API] Error fetching admin countries:", error);
      res.status(500).json({ error: "Failed to fetch countries list" });
    }
  });

  // GET /countries/:id/states - Retrieves subdivisions for a country (ID or Code e.g. US, IN)
  app.get("/countries/:id/states", async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      // If it's numeric, parse it as a number, otherwise pass as country code string
      const lookupVal = /^\d+$/.test(idParam) ? parseInt(idParam) : idParam;
      
      const statesList = await db.getStatesByCountry(lookupVal);
      res.json(statesList);
    } catch (error: any) {
      console.error(`[API] Error fetching states for country ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });

  // GET /states/:id/districts - Retrieves districts for a state ID
  app.get("/states/:id/districts", async (req: Request, res: Response) => {
    try {
      const stateId = parseInt(req.params.id);
      if (isNaN(stateId)) {
        res.status(400).json({ error: "Invalid state ID format" });
        return;
      }
      const list = await db.getDistrictsByState(stateId);
      res.json(list);
    } catch (error: any) {
      console.error(`[API] Error fetching districts for state ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });

  // GET /states/:id/cities - Retrieves cities for a state ID
  app.get("/states/:id/cities", async (req: Request, res: Response) => {
    try {
      const stateId = parseInt(req.params.id);
      if (isNaN(stateId)) {
        res.status(400).json({ error: "Invalid state ID format" });
        return;
      }
      const list = await db.getCitiesByState(stateId);
      res.json(list);
    } catch (error: any) {
      console.error(`[API] Error fetching cities for state ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // GET /country-settings/:country - Retrieves settings for a country code or ID
  app.get("/country-settings/:country", async (req: Request, res: Response) => {
    try {
      const param = req.params.country;
      const lookupVal = /^\d+$/.test(param) ? parseInt(param) : param;
      
      const settings = await db.getCountrySettings(lookupVal);
      if (!settings) {
        res.status(404).json({ error: "Country settings not found" });
        return;
      }
      res.json(settings);
    } catch (error: any) {
      console.error(`[API] Error fetching country settings for ${req.params.country}:`, error);
      res.status(500).json({ error: "Failed to fetch country settings" });
    }
  });

  // GET /country-ats-rules/:source/:target - Retrieves transition ATS rules
  app.get("/country-ats-rules/:source/:target", async (req: Request, res: Response) => {
    try {
      const source = req.params.source;
      const target = req.params.target;
      const rules = await db.getCountryAtsRules(source, target);
      if (!rules) {
        // Return null/empty rule structure instead of 404 to avoid breaking client-side UI fetches
        res.json(null);
        return;
      }
      res.json(rules);
    } catch (error: any) {
      console.error(`[API] Error fetching ATS rules ${req.params.source} -> ${req.params.target}:`, error);
      res.status(500).json({ error: "Failed to fetch ATS rules" });
    }
  });

  // ADMIN ENDPOINTS (Super Admin panel saves)
  
  // POST /api/admin/countries - Adds a country
  app.post("/api/admin/countries", async (req: Request, res: Response) => {
    try {
      // In production, verify auth role == 'admin' here
      const newCountry = await db.insertCountry(req.body);
      res.status(201).json(newCountry);
    } catch (error: any) {
      console.error("[API Admin] Error creating country:", error);
      res.status(500).json({ error: error.message || "Failed to create country" });
    }
  });

  // PUT /api/admin/countries/:id - Updates a country
  app.put("/api/admin/countries/:id", async (req: Request, res: Response) => {
    try {
      const countryId = parseInt(req.params.id);
      if (isNaN(countryId)) {
        res.status(400).json({ error: "Invalid country ID format" });
        return;
      }
      const updated = await db.updateCountry(countryId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error(`[API Admin] Error updating country ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to update country" });
    }
  });

  // POST /api/admin/ats-rules - Updates/inserts an ATS transition rule
  app.post("/api/admin/ats-rules", async (req: Request, res: Response) => {
    try {
      const saved = await db.saveCountryAtsRule(req.body);
      res.json(saved);
    } catch (error: any) {
      console.error("[API Admin] Error saving ATS rules:", error);
      res.status(500).json({ error: "Failed to save ATS rules" });
    }
  });

  // POST /api/admin/phone-rules - Updates/inserts a phone validation regex
  app.post("/api/admin/phone-rules", async (req: Request, res: Response) => {
    try {
      const { countryId, dialCode, validationRegex } = req.body;
      if (!countryId || !dialCode || !validationRegex) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      const saved = await db.saveCountryPhoneRule(countryId, dialCode, validationRegex);
      res.json(saved);
    } catch (error: any) {
      console.error("[API Admin] Error saving phone rules:", error);
      res.status(500).json({ error: "Failed to save phone rules" });
    }
  });

  // POST /api/admin/localization-rules - Updates/inserts date/address formatting rules
  app.post("/api/admin/localization-rules", async (req: Request, res: Response) => {
    try {
      const { countryId, dateFormat, addressFormat, resumeStyle, languagePreferences } = req.body;
      if (!countryId || !dateFormat || !addressFormat) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      const saved = await db.saveCountryLocalizationRule(countryId, dateFormat, addressFormat, resumeStyle, languagePreferences);
      res.json(saved);
    } catch (error: any) {
      console.error("[API Admin] Error saving localization settings:", error);
      res.status(500).json({ error: "Failed to save localization rules" });
    }
  });
}
