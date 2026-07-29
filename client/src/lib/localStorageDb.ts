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

const DEFAULT_USERS: LocalUser[] = [
  {
    id: 1,
    openId: "admin-key-owner",
    name: "Surag (Admin)",
    email: "admin@hexacv.com",
    password: "1234@hexaCv",
    role: "admin",
    loginMethod: "email",
    createdAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  },
  {
    id: 2,
    openId: "mock-google-test-candidate",
    name: "Google Candidate",
    email: "google.candidate@gmail.com",
    role: "user",
    loginMethod: "google",
    createdAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
  },
];

/**
 * Get all registered users from browser localStorage
 */
export function getStoredUsers(): LocalUser[] {
  if (typeof window === "undefined") return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return parsed;
  } catch (err) {
    console.error("[LocalStorageDb] Failed to parse users:", err);
    return DEFAULT_USERS;
  }
}

/**
 * Save user list to localStorage
 */
export function saveStoredUsers(users: LocalUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("[LocalStorageDb] Failed to save users:", err);
  }
}

/**
 * Register a new user in browser localStorage DB
 */
export function registerLocalUser(
  name: string,
  email: string,
  password?: string
): { success: boolean; user?: LocalUser; message?: string } {
  const users = getStoredUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = users.find(
    (u) => u.email.toLowerCase().trim() === normalizedEmail
  );
  if (existing) {
    // User already registered - automatically log them in
    setCurrentLocalUser(existing);
    return {
      success: true,
      user: existing,
      message: "Account already exists. Logged into existing account.",
    };
  }

  const isAdmin = normalizedEmail === "admin@hexacv.com" || normalizedEmail.includes("admin");
  const openId = isAdmin
    ? "admin-key-owner"
    : `local-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newUser: LocalUser = {
    id: users.length + 1,
    openId,
    name: name.trim() || "Candidate User",
    email: normalizedEmail,
    password: password || undefined,
    role: isAdmin ? "admin" : "user",
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

/**
 * Login user against local storage database
 */
export function loginLocalUser(
  email: string,
  password?: string
): { success: boolean; user?: LocalUser; message?: string } {
  const users = getStoredUsers();
  const normalizedEmail = email.toLowerCase().trim();

  // Admin special fallback check
  if (normalizedEmail === "admin@hexacv.com") {
    if (password && password !== "1234@hexaCv") {
      return { success: false, message: "Invalid credentials for admin account." };
    }
    const adminUser = users.find((u) => u.email === "admin@hexacv.com") || DEFAULT_USERS[0];
    adminUser.lastSignedIn = new Date().toISOString();
    setCurrentLocalUser(adminUser);
    return { success: true, user: adminUser };
  }

  const found = users.find(
    (u) => u.email.toLowerCase().trim() === normalizedEmail
  );

  if (!found) {
    // Create new account automatically if user is logging in with a new email
    return registerLocalUser(
      email.split("@")[0] || "User",
      email,
      password
    );
  }

  if (found.password && password && found.password !== password) {
    return { success: false, message: "Incorrect password. Please try again." };
  }

  found.lastSignedIn = new Date().toISOString();
  saveStoredUsers(users);
  setCurrentLocalUser(found);

  return { success: true, user: found };
}

/**
 * Set the currently authenticated user in localStorage
 */
export function setCurrentLocalUser(user: LocalUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const sanitizedUser = {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        loginMethod: user.loginMethod || "email",
        lastSignedIn: user.lastSignedIn || new Date().toISOString(),
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitizedUser));
      localStorage.setItem(RUNTIME_USER_INFO_KEY, JSON.stringify(sanitizedUser));
      localStorage.removeItem("hexacv_logged_out");
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(RUNTIME_USER_INFO_KEY);
      localStorage.setItem("hexacv_logged_out", "true");
    }
  } catch (err) {
    console.error("[LocalStorageDb] Failed to set current user:", err);
  }
}

/**
 * Get current active user from localStorage
 */
export function getCurrentLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem("hexacv_logged_out") === "true") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Logout current active user from localStorage
 */
export function logoutLocalUser(): void {
  setCurrentLocalUser(null);
}
