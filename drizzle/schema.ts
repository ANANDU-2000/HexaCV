import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** G2: when true, do not persist resume_evaluations for this user */
  evaluationOptOut: boolean("evaluationOptOut").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const resumes = mysqlTable("resumes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  templateId: varchar("templateId", { length: 50 }).notNull(),
  jobDescriptionId: varchar("jobDescriptionId", { length: 36 }),
  content: json("content").notNull(), // Native JSON content of the resume
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIndex: index("resumes_user_idx").on(table.userId),
}));

export type ResumeDb = typeof resumes.$inferSelect;
export type InsertResumeDb = typeof resumes.$inferInsert;

export const jobDescriptions = mysqlTable("job_descriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  keywords: json("keywords").notNull(), // Native JSON array of keywords
  isCustom: boolean("isCustom").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIndex: index("job_desc_user_idx").on(table.userId),
}));

export type JobDescriptionDb = typeof jobDescriptions.$inferSelect;
export type InsertJobDescriptionDb = typeof jobDescriptions.$inferInsert;

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  tier: varchar("tier", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  referenceId: varchar("referenceId", { length: 255 }),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  /** F4: when status=grace, paid access until this timestamp */
  graceUntil: timestamp("graceUntil"),
}, (table) => ({
  userIdx: index("subscriptions_user_idx").on(table.userId),
}));

export type SubscriptionDb = typeof subscriptions.$inferSelect;
export type InsertSubscriptionDb = typeof subscriptions.$inferInsert;

export const supportTickets = mysqlTable("support_tickets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).default("open").notNull(),
  priority: varchar("priority", { length: 50 }).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("support_tickets_user_idx").on(table.userId),
}));

export type SupportTicketDb = typeof supportTickets.$inferSelect;
export type InsertSupportTicketDb = typeof supportTickets.$inferInsert;

// SaaS: Organizations (for tenants and white-labeling)
export const organizations = mysqlTable("organizations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 50 }).default("#1e40af").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 50 }).default("#0d9488").notNull(),
  customDomain: varchar("customDomain", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizationDb = typeof organizations.$inferSelect;
export type InsertOrganizationDb = typeof organizations.$inferInsert;

// SaaS: Organization Members
export const organizationMembers = mysqlTable("organization_members", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 50 }).default("collaborator").notNull(), // 'owner', 'recruiter', 'collaborator'
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("org_members_org_idx").on(table.organizationId),
  userIdx: index("org_members_user_idx").on(table.userId),
}));

export type OrganizationMemberDb = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMemberDb = typeof organizationMembers.$inferInsert;

// SaaS: Marketplace Templates and Public Resumes
export const marketplaceItems = mysqlTable("marketplace_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'resume' | 'template'
  content: text("content").notNull(), // Serialized JSON string of the template styles or resume section content
  authorId: int("authorId").notNull(),
  price: int("price").default(0).notNull(), // price in cents
  rating: varchar("rating", { length: 10 }).default("5.0").notNull(),
  downloads: int("downloads").default(0).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  authorIdx: index("marketplace_author_idx").on(table.authorId),
}));

export type MarketplaceItemDb = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItemDb = typeof marketplaceItems.$inferInsert;

// SaaS: Affiliate / Referral System
export const affiliateReferrals = mysqlTable("affiliate_referrals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referrerId: int("referrerId").notNull(),
  refereeId: int("refereeId"),
  email: varchar("email", { length: 320 }),
  clicks: int("clicks").default(1).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'joined', 'converted'
  commissionEarned: int("commissionEarned").default(0).notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referrerIdx: index("aff_ref_referrer_idx").on(table.referrerId),
  emailStatusIdx: index("aff_ref_email_status_idx").on(table.email, table.status),
}));

export type AffiliateReferralDb = typeof affiliateReferrals.$inferSelect;
export type InsertAffiliateReferralDb = typeof affiliateReferrals.$inferInsert;

// SaaS: Recruiter Job Postings
export const recruiterJobs = mysqlTable("recruiter_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationId: varchar("organizationId", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'closed'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("recruiter_jobs_org_idx").on(table.organizationId),
}));

export type RecruiterJobDb = typeof recruiterJobs.$inferSelect;
export type InsertRecruiterJobDb = typeof recruiterJobs.$inferInsert;

// SaaS: Recruiter Job Applications / Candidate Pipelines
export const jobApplications = mysqlTable("job_applications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  jobId: varchar("jobId", { length: 36 }).notNull(),
  resumeId: varchar("resumeId", { length: 36 }),
  applicantName: varchar("applicantName", { length: 255 }).notNull(),
  applicantEmail: varchar("applicantEmail", { length: 320 }).notNull(),
  matchScore: int("matchScore").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'reviewed', 'shortlisted', 'rejected'
  resumeContent: text("resumeContent").notNull(), // Extracted resume text or json representation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdx: index("job_app_job_idx").on(table.jobId),
}));

export type JobApplicationDb = typeof jobApplications.$inferSelect;
export type InsertJobApplicationDb = typeof jobApplications.$inferInsert;

// ==========================================
// GLOBAL COUNTRY MANAGEMENT SYSTEM TABLES
// ==========================================

export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  flag: varchar("flag", { length: 10 }).notNull(),
  dialCode: varchar("dialCode", { length: 10 }).notNull(),
  phoneFormat: varchar("phoneFormat", { length: 50 }).notNull(),
  phoneRegex: varchar("phoneRegex", { length: 100 }).notNull(),
  postalCodeLabel: varchar("postalCodeLabel", { length: 50 }).notNull(),
  postalCodeFormat: varchar("postalCodeFormat", { length: 100 }).notNull(),
  dateFormat: varchar("dateFormat", { length: 20 }).notNull(),
  addressFormat: varchar("addressFormat", { length: 255 }).notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  isPriority: boolean("isPriority").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CountryDb = typeof countries.$inferSelect;
export type InsertCountryDb = typeof countries.$inferInsert;

export const states = mysqlTable("states", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  countryIdx: index("states_country_idx").on(table.countryId),
}));

export type StateDb = typeof states.$inferSelect;
export type InsertStateDb = typeof states.$inferInsert;

export const districts = mysqlTable("districts", {
  id: int("id").autoincrement().primaryKey(),
  stateId: int("stateId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  stateIdx: index("districts_state_idx").on(table.stateId),
}));

export type DistrictDb = typeof districts.$inferSelect;
export type InsertDistrictDb = typeof districts.$inferInsert;

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull(),
  stateId: int("stateId"),
  districtId: int("districtId"),
  name: varchar("name", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  countryIdx: index("cities_country_idx").on(table.countryId),
  stateIdx: index("cities_state_idx").on(table.stateId),
  districtIdx: index("cities_district_idx").on(table.districtId),
}));

export type CityDb = typeof cities.$inferSelect;
export type InsertCityDb = typeof cities.$inferInsert;

export const countrySettings = mysqlTable("country_settings", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull().unique(),
  dateFormat: varchar("dateFormat", { length: 20 }).notNull(),
  addressFormat: varchar("addressFormat", { length: 255 }).notNull(),
  resumeStyle: varchar("resumeStyle", { length: 100 }),
  languagePreferences: json("languagePreferences").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  countryIdx: index("settings_country_idx").on(table.countryId),
}));

export type CountrySettingsDb = typeof countrySettings.$inferSelect;
export type InsertCountrySettingsDb = typeof countrySettings.$inferInsert;

export const countryPhoneCodes = mysqlTable("country_phone_codes", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull().unique(),
  dialCode: varchar("dialCode", { length: 10 }).notNull(),
  validationRegex: varchar("validationRegex", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CountryPhoneCodeDb = typeof countryPhoneCodes.$inferSelect;
export type InsertCountryPhoneCodeDb = typeof countryPhoneCodes.$inferInsert;

export const countryAtsRules = mysqlTable("country_ats_rules", {
  id: int("id").autoincrement().primaryKey(),
  countryId: int("countryId").notNull(),
  targetCountryId: int("targetCountryId").notNull(),
  keywords: json("keywords").notNull(),
  preferredFormatting: text("preferredFormatting").notNull(),
  regionalHiringExpectations: text("regionalHiringExpectations").notNull(),
  regionalTerminology: json("regionalTerminology").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sourceTargetIdx: index("ats_source_target_idx").on(table.countryId, table.targetCountryId),
}));

export type CountryAtsRuleDb = typeof countryAtsRules.$inferSelect;
export type InsertCountryAtsRuleDb = typeof countryAtsRules.$inferInsert;

// ==========================================
// OPTIONAL AUTHENTICATION & GUEST FLOW TABLES
// ==========================================

export const guestSessions = mysqlTable("guest_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  deviceUid: varchar("deviceUid", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  convertedUserId: int("convertedUserId"),
  convertedAt: timestamp("convertedAt"),
});

export type GuestSessionDb = typeof guestSessions.$inferSelect;
export type InsertGuestSessionDb = typeof guestSessions.$inferInsert;

export const resumeHistory = mysqlTable("resume_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  resumeId: varchar("resumeId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  version: int("version").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  resumeIdx: index("history_resume_idx").on(table.resumeId),
  userIdx: index("history_user_idx").on(table.userId),
}));

export type ResumeHistoryDb = typeof resumeHistory.$inferSelect;
export type InsertResumeHistoryDb = typeof resumeHistory.$inferInsert;

export const cloudBackups = mysqlTable("cloud_backups", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("backups_user_idx").on(table.userId),
}));

export type CloudBackupDb = typeof cloudBackups.$inferSelect;
export type InsertCloudBackupDb = typeof cloudBackups.$inferInsert;

// ==========================================
// AI USAGE LOGGING (Phase A2)
// ==========================================

export const usageLogs = mysqlTable("usage_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  stage: varchar("stage", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  userId: int("userId"),
  tokensIn: int("tokensIn").notNull().default(0),
  tokensOut: int("tokensOut").notNull().default(0),
  costUsd: varchar("costUsd", { length: 32 }).notNull().default("0"),
  latencyMs: int("latencyMs").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("usage_logs_user_idx").on(table.userId),
  stageIdx: index("usage_logs_stage_idx").on(table.stage),
  createdIdx: index("usage_logs_created_idx").on(table.createdAt),
}));

export type UsageLogDb = typeof usageLogs.$inferSelect;
export type InsertUsageLogDb = typeof usageLogs.$inferInsert;

// ==========================================
// AI MODEL ROUTING (Phase B1)
// ==========================================

export const modelRouting = mysqlTable("model_routing", {
  id: varchar("id", { length: 36 }).primaryKey(),
  stage: varchar("stage", { length: 64 }).notNull(),
  tier: varchar("tier", { length: 32 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  rpmLimit: int("rpmLimit").notNull().default(60),
  rpdLimit: int("rpdLimit").notNull().default(2000),
  priority: int("priority").notNull().default(100),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 128 }),
}, (table) => ({
  stagePriorityIdx: index("model_routing_stage_priority_idx").on(table.stage, table.priority),
}));

export type ModelRoutingDb = typeof modelRouting.$inferSelect;
export type InsertModelRoutingDb = typeof modelRouting.$inferInsert;

// ==========================================
// C5 — PROMPT VERSIONS + RESUME EVALUATIONS
// ==========================================

export const promptVersions = mysqlTable("prompt_versions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  stage: varchar("stage", { length: 64 }).notNull(),
  version: int("version").notNull(),
  body: text("body").notNull(),
  isActive: boolean("isActive").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: varchar("createdBy", { length: 128 }),
}, (table) => ({
  stageIdx: index("prompt_versions_stage_idx").on(table.stage),
  stageActiveIdx: index("prompt_versions_stage_active_idx").on(
    table.stage,
    table.isActive
  ),
}));

export type PromptVersionDb = typeof promptVersions.$inferSelect;
export type InsertPromptVersionDb = typeof promptVersions.$inferInsert;

export const resumeEvaluations = mysqlTable("resume_evaluations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId"),
  resumeId: varchar("resumeId", { length: 64 }),
  stage: varchar("stage", { length: 64 }).notNull(),
  promptVersionId: varchar("promptVersionId", { length: 36 }),
  rating: varchar("rating", { length: 16 }).notNull(),
  note: text("note"),
  overallScore: int("overallScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("resume_evaluations_user_idx").on(table.userId),
  resumeIdx: index("resume_evaluations_resume_idx").on(table.resumeId),
  stageIdx: index("resume_evaluations_stage_idx").on(table.stage),
}));

export type ResumeEvaluationDb = typeof resumeEvaluations.$inferSelect;
export type InsertResumeEvaluationDb = typeof resumeEvaluations.$inferInsert;

// ==========================================
// F3 — PROCESSED STRIPE EVENTS (webhook idempotency)
// ==========================================

export const processedStripeEvents = mysqlTable("processed_stripe_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProcessedStripeEventDb = typeof processedStripeEvents.$inferSelect;
export type InsertProcessedStripeEventDb = typeof processedStripeEvents.$inferInsert;

// ==========================================
// RAZORPAY PRIMARY — payment_orders
// ==========================================

export const paymentOrders = mysqlTable("payment_orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  tier: varchar("tier", { length: 50 }).notNull(),
  amountPaise: int("amountPaise").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("INR"),
  razorpayOrderId: varchar("razorpayOrderId", { length: 128 }).notNull(),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 128 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("payment_orders_user_idx").on(table.userId),
  orderIdx: index("payment_orders_rzp_order_idx").on(table.razorpayOrderId),
}));

export type PaymentOrderDb = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrderDb = typeof paymentOrders.$inferInsert;
