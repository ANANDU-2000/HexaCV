import { describe, it, expect } from "vitest";
import {
  filterGroundedBullets,
  filterGroundedRewrite,
  isAiGeneratedPhrase,
  textGroundedInSource,
  validateGeneratedResume,
} from "./contentValidation";
import { inferJobTitleAndTargetRole } from "./fileParser";

describe("contentValidation", () => {
  it("rejects AI filler phrases in rewrites", () => {
    const original = "Built REST APIs using Node.js for payment processing";
    const aiFiller = "Results-driven and highly motivated professional who leveraged synergies";
    expect(filterGroundedRewrite(original, aiFiller)).toBe(original);
  });

  it("keeps grounded rewrites with sufficient word overlap", () => {
    const original = "Developed React dashboard for sales analytics";
    const rewritten = "Built React analytics dashboard for the sales team";
    expect(filterGroundedRewrite(original, rewritten)).toBe(rewritten);
  });

  it("preserves bullet count and rejects ungrounded bullets", () => {
    const originals = ["Managed PostgreSQL database migrations", "Wrote unit tests with Jest"];
    const rewritten = [
      "Orchestrated enterprise-scale cloud transformations across 12 regions",
      "Wrote unit tests with Jest",
    ];
    const result = filterGroundedBullets(originals, rewritten);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(originals[0]);
    expect(result[1]).toBe(rewritten[1]);
  });

  it("detects common AI phrases", () => {
    expect(isAiGeneratedPhrase("A results-driven and highly motivated engineer")).toBe(true);
    expect(isAiGeneratedPhrase("Implemented CI pipeline for Node.js services")).toBe(false);
  });

  it("grounds text in source document", () => {
    const source = "John Smith\nSenior Software Engineer\nBuilt APIs with Node.js";
    expect(textGroundedInSource("Senior Software Engineer", source)).toBe(true);
    expect(textGroundedInSource("Quantum blockchain visionary", source)).toBe(false);
  });

  it("validateGeneratedResume strips ungrounded invents when source is provided", () => {
    const source =
      "Priya Nair\nSite Engineer\nAcme Infra\nSupervised site concreting and formwork";
    const dirty = {
      header: { name: "Priya Nair", email: "", phone: "", location: "", jobTitle: "Site Engineer", targetRole: "Site Engineer", links: [] },
      summary: "Visionary thought leader who leveraged synergies across blockchain",
      skills: [{ category: "Tools", skills: ["formwork", "Quantum NLP"] }],
      experiences: [
        {
          id: "1",
          company: "Acme Infra",
          role: "Site Engineer",
          startDate: "2020",
          endDate: "Present",
          current: true,
          description: [
            "Supervised site concreting and formwork",
            "Delivered 50+ major products on schedule across 12 regions",
          ],
        },
      ],
      projects: [],
      educations: [],
      certifications: [],
      achievements: [],
      languages: [],
      references: [],
    };
    const cleaned = validateGeneratedResume(dirty, source);
    expect(cleaned.summary).toBe("");
    expect(cleaned.skills[0].skills).toEqual(["formwork"]);
    expect(cleaned.experiences).toHaveLength(1);
    expect(cleaned.experiences[0].description).toEqual([
      "Supervised site concreting and formwork",
    ]);
  });
});

describe("inferJobTitleAndTargetRole", () => {
  it("extracts job title from line after name", () => {
    const text = `Jane Doe
Full Stack Developer
jane@email.com
Objective: Seeking a senior backend engineer role`;
    const result = inferJobTitleAndTargetRole(text);
    expect(result.jobTitle).toBe("Full Stack Developer");
    expect(result.targetRole.toLowerCase()).toContain("backend");
  });

  it("extracts civil / product-owner style titles", () => {
    const text = `Rashid Al Mansouri
Site Engineer
rashid@example.com
Experience at Gulf Infrastructure`;
    const result = inferJobTitleAndTargetRole(text);
    expect(result.jobTitle.toLowerCase()).toContain("site engineer");
  });

  it("falls back to most recent experience role", () => {
    const text = `Alex Kim
alex@email.com
Experience section below`;
    const result = inferJobTitleAndTargetRole(text, [
      { role: "Junior Developer", company: "A", startDate: "2020" },
      { role: "Senior Backend Engineer", company: "B", current: true, startDate: "2023" },
    ]);
    expect(result.jobTitle).toBe("Senior Backend Engineer");
  });
});
