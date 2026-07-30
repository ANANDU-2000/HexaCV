import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";

describe("Optional Authentication & Guest Experience", () => {
  beforeAll(() => {
    db.seedMockDb();
  });

  it("should track a guest session", async () => {
    const sessionId = "guest-session-123";
    const deviceUid = "device-uid-xyz";
    const session = await db.trackGuestSession(sessionId, deviceUid);

    expect(session).toBeDefined();
    expect(session?.id).toBe(sessionId);
    expect(session?.deviceUid).toBe(deviceUid);
    expect(session?.convertedUserId).toBeNull();
  });

  it("should update lastActiveAt for an existing guest session", async () => {
    const sessionId = "guest-session-123";
    const deviceUid = "device-uid-xyz-updated";
    const session = await db.trackGuestSession(sessionId, deviceUid);

    expect(session).toBeDefined();
    expect(session?.deviceUid).toBe(deviceUid);
    expect(session?.lastActiveAt).toBeInstanceOf(Date);
  });

  it("should convert a guest session on registration", async () => {
    const sessionId = "guest-session-123";
    const userId = 2; // Anandu Krishna in mockDb
    const session = await db.convertGuestSession(sessionId, userId);

    expect(session).toBeDefined();
    expect(session?.convertedUserId).toBe(userId);
    expect(session?.convertedAt).toBeInstanceOf(Date);
  });

  it("should manage resume version history", async () => {
    const userId = 2;
    const resumeId = "resume-abc-123";
    
    // Save first version
    const version1 = await db.saveResumeHistory(userId, resumeId, "Software Engineer Resume", "classic-ats-blue", JSON.stringify({ sections: [] }));
    expect(version1).toBeDefined();
    expect(version1.version).toBe(1);
    expect(version1.title).toBe("Software Engineer Resume");

    // Save second version
    const version2 = await db.saveResumeHistory(userId, resumeId, "Senior Software Engineer Resume", "classic-ats-blue", JSON.stringify({ sections: [{ id: "1" }] }));
    expect(version2).toBeDefined();
    expect(version2.version).toBe(2);
    expect(version2.title).toBe("Senior Software Engineer Resume");

    // Retrieve history
    const history = await db.getResumeHistory(resumeId, userId);
    expect(history).toHaveLength(2);
    expect(history[0].version).toBe(2);
    expect(history[1].version).toBe(1);
  });

  it("should manage cloud backups", async () => {
    const userId = 2;
    const type = "cover_letter";
    const name = "Google Cover Letter";
    const content = { body: "Dear Hiring Manager..." };

    // Save backup
    const backup = await db.saveCloudBackup(userId, type, name, content);
    expect(backup).toBeDefined();
    expect(backup.userId).toBe(userId);
    expect(backup.name).toBe(name);

    // List backups
    const list = await db.listCloudBackups(userId, type);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe(name);

    // Delete backup
    const deleted = await db.deleteCloudBackup(backup.id, userId);
    expect(deleted).toBe(true);

    const listAfterDelete = await db.listCloudBackups(userId, type);
    expect(listAfterDelete).toHaveLength(0);
  });
});
