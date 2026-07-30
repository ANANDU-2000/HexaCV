export interface LocalUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "user";
  loginMethod: string;
  createdAt: string;
  lastSignedIn: string;
}

const USERS_STORAGE_KEY = "hexacv_users";
const CURRENT_USER_KEY = "hexacv_current_user";
const RUNTIME_USER_INFO_KEY = "manus-runtime-user-info";

/**
 * Get users from browser localStorage. No seeded fake accounts.
 */
export function getStoredUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[LocalStorageDb] Failed to parse users:", err);
    return [];
  }
}

export function saveStoredUsers(users: LocalUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("[LocalStorageDb] Failed to save users:", err);
  }
}

/** Clear legacy mock seeds (Google Candidate, hardcoded admin) once. */
export function purgeLegacyMockUsers(): void {
  if (typeof window === "undefined") return;
  try {
    const users = getStoredUsers().filter(
      (u) =>
        !u.openId?.startsWith("mock-") &&
        u.email !== "google.candidate@gmail.com" &&
        u.email !== "candidate@hexacv.local"
    );
    saveStoredUsers(users);
    const current = getCurrentLocalUser();
    if (
      current &&
      (current.openId?.startsWith("mock-") ||
        current.email === "google.candidate@gmail.com" ||
        current.name === "Google Candidate")
    ) {
      logoutLocalUser();
    }
  } catch {
    /* ignore */
  }
}

export function registerLocalUser(
  name: string,
  email: string,
  password?: string
): { success: boolean; user?: LocalUser; message?: string } {
  const users = getStoredUsers();
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail.includes("@")) {
    return { success: false, message: "Valid email required." };
  }

  const existing = users.find(
    (u) => u.email.toLowerCase().trim() === normalizedEmail
  );
  if (existing) {
    setCurrentLocalUser(existing);
    return {
      success: true,
      user: existing,
      message: "Account already exists. Logged into existing account.",
    };
  }

  const newUser: LocalUser = {
    id: users.length + 1,
    openId: `local-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || normalizedEmail.split("@")[0] || "User",
    email: normalizedEmail,
    password: password || undefined,
    role: "user",
    loginMethod: "email",
    createdAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);
  setCurrentLocalUser(newUser);

  return {
    success: true,
    user: newUser,
    message: "Account created successfully!",
  };
}

export function loginLocalUser(
  email: string,
  password?: string
): { success: boolean; user?: LocalUser; message?: string } {
  const users = getStoredUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const found = users.find(
    (u) => u.email.toLowerCase().trim() === normalizedEmail
  );

  if (!found) {
    return { success: false, message: "No account found for that email." };
  }

  if (found.password && password !== undefined && found.password !== password) {
    return { success: false, message: "Invalid credentials." };
  }

  found.lastSignedIn = new Date().toISOString();
  saveStoredUsers(users);
  setCurrentLocalUser(found);
  return { success: true, user: found };
}

export function getCurrentLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    if (localStorage.getItem("hexacv_logged_out") === "true") return null;
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUser;
  } catch {
    return null;
  }
}

export function setCurrentLocalUser(user: LocalUser): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("hexacv_logged_out");
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(RUNTIME_USER_INFO_KEY, JSON.stringify(user));
}

export function logoutLocalUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(RUNTIME_USER_INFO_KEY);
  localStorage.setItem("hexacv_logged_out", "true");
}
