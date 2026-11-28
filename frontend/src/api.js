const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function readCsrf() {
  const response = await fetch(`${API_BASE}/api/csrf`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not retrieve CSRF token.");
  }

  const data = await response.json();

  if (!data.token || !data.headerName) {
    throw new Error("Invalid CSRF token response.");
  }

  return {
    token: data.token,
    headerName: data.headerName,
  };
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const security = await readCsrf();
    if (security) headers[security.headerName] = security.token;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
  if (response.status === 401) {
    const error = new Error("Your session has ended. Please sign in again.");
    error.status = 401;
    throw error;
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message =
        payload.error || payload["error: "] || payload.message || message;
    } catch {
      /* response has no JSON body */
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

export const apiBase = API_BASE;

export function websocketUrl() {
  if (API_BASE) return `${API_BASE.replace(/^http/, "ws")}/ws`;
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;
}

export async function login(username, password) {
  const security = await readCsrf();
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (security) headers[security.headerName] = security.token;
  const response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers,
    body: new URLSearchParams({ username, password }),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "That username and password do not match."
        : `Sign in failed (${response.status}).`,
    );
}

export async function logout() {
  return api("/api/logout", { method: "POST" });
}
