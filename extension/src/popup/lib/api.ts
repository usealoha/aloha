// Single point of contact between the popup and Aloha's API. Always
// uses `credentials: "include"` so Chrome attaches the existing
// session cookie (host_permissions for usealoha.app makes this work
// in MV3). Picks dev vs prod base URL based on whether localhost is
// reachable — built once at module load to avoid the probe firing on
// every call.

const PROD_BASE = "https://usealoha.app";
const DEV_BASE = "http://localhost:5010";

let cachedBase: string | null = null;

async function pickBaseUrl(): Promise<string> {
  if (cachedBase) return cachedBase;
  // Fast probe: try the dev API first (HEAD on a cheap auth-free path).
  // If we're not running a local Aloha, this fails immediately and we
  // fall through to prod. Any network error → prod.
  try {
    const res = await fetch(`${DEV_BASE}/api/whoami`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    // 401 still means the dev server is up — auth is just absent.
    if (res.ok || res.status === 401) {
      cachedBase = DEV_BASE;
      return cachedBase;
    }
  } catch {
    // Network failure → prod.
  }
  cachedBase = PROD_BASE;
  return cachedBase;
}

export async function alohaUrl(path: string): Promise<string> {
  const base = await pickBaseUrl();
  return `${base}${path}`;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Sign in to Aloha to continue.");
    this.name = "AuthRequiredError";
  }
}

export async function alohaFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = await alohaUrl(path);
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "X-Aloha-Extension": "1",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  return res;
}

export async function alohaJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await alohaFetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
