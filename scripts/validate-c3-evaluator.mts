/**
 * C3 validate: deterministic evaluator pass/fail (no live LLM).
 * Run: npx tsx scripts/validate-c3-evaluator.mts
 *
 * Live rewrite retry is smoke-tested manually; this proves the fail gate.
 */
import { evaluateRewriteDeterministic } from "../server/contentValidation";

const source =
  "Jane Doe worked at Acme Corp as Software Engineer from 2020 to 2024. " +
  "Built React dashboards and fixed PostgreSQL queries. Skills: TypeScript, React, SQL.";

const badResume = {
  header: { name: "Professional Candidate", email: "", phone: "", location: "", links: [] },
  summary:
    "Results-driven and highly motivated professional with a proven track record of designing scalable solutions.",
  skills: [],
  experiences: [
    {
      id: "1",
      company: "Tech Solutions Corp",
      role: "Engineer",
      startDate: "2020",
      endDate: "2024",
      current: false,
      description: [
        "Spearheaded initiatives and leveraged synergies across teams",
        "Collaborated across cross-functional teams to deliver value",
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

const goodResume = {
  header: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    location: "",
    links: [],
  },
  summary:
    "Software Engineer at Acme Corp focused on React dashboards and PostgreSQL query work.",
  skills: [{ category: "Engineering", skills: ["TypeScript", "React", "SQL"] }],
  experiences: [
    {
      id: "1",
      company: "Acme Corp",
      role: "Software Engineer",
      startDate: "2020",
      endDate: "2024",
      current: false,
      description: [
        "Built React dashboards for internal tools",
        "Fixed PostgreSQL queries for reporting",
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

const bad = evaluateRewriteDeterministic(badResume, source);
if (bad.passed || bad.overall >= 70) {
  throw new Error(
    `Expected bad resume to fail (passed=${bad.passed}, overall=${bad.overall})`
  );
}
if (bad.bannedHits.length === 0 && bad.reasons.length === 0) {
  throw new Error("Expected banned hits or reasons on bad resume");
}

const good = evaluateRewriteDeterministic(goodResume, source);
if (!good.passed || good.overall < 70) {
  throw new Error(
    `Expected good resume to pass (passed=${good.passed}, overall=${good.overall}, reasons=${good.reasons.join("; ")})`
  );
}

console.log("C3 validate OK:", {
  badOverall: bad.overall,
  badPassed: bad.passed,
  goodOverall: good.overall,
  goodPassed: good.passed,
});
