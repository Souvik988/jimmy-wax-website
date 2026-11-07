/**
 * Thin client for the JIMMY WAX API (contracts/api/openapi.yaml in the backend repo).
 * One origin serves /v1 (the edge routes reads and writes to the right service).
 *
 * Sessions: the short-lived access token lives in memory; the rotating refresh token is kept in localStorage so a
 * reload keeps the customer signed in. That is readable by any script on this origin, so the site must never load
 * third-party scripts into the checkout. A replayed refresh token revokes the whole session server-side.
 */
const ORIGIN = (
  (import.meta.env.VITE_API_ORIGIN as string | undefined) ??
  "http://localhost:8080"
).replace(/\/$/, "");
const STORE_KEY = "jw-session-v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: {
      reason?: string;
      fields?: Record<string, string>;
      paused?: boolean;
      lines?: unknown[];
    } = {},
    readonly retryable = false,
  ) {
    super(message);
  }
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
}
interface Stored {
  refreshToken: string;
  user: AuthUser;
}

let access: { token: string; exp: number } | null = null;
let stored: Stored | null = readStored();
const listeners = new Set<() => void>();

function readStored(): Stored | null {
  try {
    const v = JSON.parse(
      localStorage.getItem(STORE_KEY) ?? "null",
    ) as Stored | null;
    return v && typeof v.refreshToken === "string" ? v : null;
  } catch {
    return null;
  }
}
function writeStored(v: Stored | null) {
  stored = v;
  try {
    v
      ? localStorage.setItem(STORE_KEY, JSON.stringify(v))
      : localStorage.removeItem(STORE_KEY);
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}
export const session = {
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  user: () => stored?.user ?? null,
  isSignedIn: () => !!stored,
};

interface Tokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}
function adopt(t: Tokens, user?: AuthUser) {
  access = {
    token: t.accessToken,
    exp: Date.now() + (t.expiresIn - 20) * 1000,
  };
  const u = user ?? stored?.user;
  if (u) writeStored({ refreshToken: t.refreshToken, user: u });
}

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  if (!stored) return false;
  refreshing ??= (async () => {
    try {
      const t = await raw<Tokens>("POST", "/v1/auth/refresh", {
        body: { refreshToken: stored!.refreshToken },
      });
      adopt(t);
      return true;
    } catch (e) {
      // Only a definitive rejection ends the session; a network blip must not sign the customer out.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        access = null;
        writeStored(null);
      }
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function raw<T>(
  method: string,
  path: string,
  o: { body?: unknown; headers?: Record<string, string>; token?: string } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ORIGIN + path, {
      method,
      headers: {
        ...(o.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(o.token ? { authorization: `Bearer ${o.token}` } : {}),
        ...o.headers,
      },
      body: o.body === undefined ? undefined : JSON.stringify(o.body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK",
      "We could not reach the store. Check your connection and try again.",
      {},
      true,
    );
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* not json */
  }
  if (!res.ok) {
    const e = (
      json as {
        error?: {
          code?: string;
          message?: string;
          retryable?: boolean;
          reason?: string;
          fields?: Record<string, string>;
          paused?: boolean;
          lines?: unknown[];
        };
      } | null
    )?.error;
    throw new ApiError(
      res.status,
      e?.code ?? "UNKNOWN",
      e?.message ?? "Something went wrong",
      {
        reason: e?.reason,
        fields: e?.fields,
        paused: e?.paused,
        lines: e?.lines,
      },
      e?.retryable ?? res.status >= 500,
    );
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    if (json === null && text)
      throw new ApiError(
        502,
        "INVALID_RESPONSE",
        "The store returned an unreadable response. Please try again.",
      );
    return json as T;
  }
  return text as T;
}

/** Public (anonymous) call. */
export const publicApi = <T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) => raw<T>(method, path, { body, headers });

/** Signed-in call: attaches the access token, refreshing once when it is missing, expired or rejected. */
export async function authedApi<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  if (!stored)
    throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue");
  if (!access || access.exp < Date.now()) {
    if (!(await refresh()))
      throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue");
  }
  try {
    return await raw<T>(method, path, { body, headers, token: access!.token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && (await refresh()))
      return raw<T>(method, path, { body, headers, token: access!.token });
    throw e;
  }
}

// ----------------------------------------------------------------- auth
interface AuthSession extends Tokens {
  user: AuthUser;
}
const start = (s: AuthSession) => {
  adopt(s, s.user);
  return s.user;
};

export const auth = {
  forgotPassword: (email: string) =>
    publicApi("POST", "/v1/auth/password/forgot", { email }),
  resetPassword: (token: string, password: string) =>
    publicApi("POST", "/v1/auth/password/reset", { token, password }),
  verifyEmail: (token: string) =>
    publicApi("POST", "/v1/auth/email/verify", { token }),
  requestOtp: (phone: string) =>
    publicApi<{ accepted: boolean; expiresInSeconds?: number }>(
      "POST",
      "/v1/auth/otp/request",
      { phone },
    ),
  verifyOtp: async (phone: string, code: string) =>
    start(
      await publicApi<AuthSession>("POST", "/v1/auth/otp/verify", {
        phone,
        code,
      }),
    ),
  login: async (email: string, password: string) =>
    start(
      await publicApi<AuthSession>("POST", "/v1/auth/login", {
        email,
        password,
      }),
    ),
  register: async (email: string, password: string, fullName: string) =>
    start(
      await publicApi<AuthSession>("POST", "/v1/auth/register", {
        email,
        password,
        fullName,
      }),
    ),
  async signOut() {
    const t = stored?.refreshToken;
    access = null;
    writeStored(null);
    if (t) {
      try {
        await publicApi("POST", "/v1/auth/logout", { refreshToken: t });
      } catch {
        /* already gone */
      }
    }
  },
};

export const inr = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

export const API_ORIGIN = ORIGIN;

/** Refuse cursor loops rather than silently truncating lists. */
export async function apiPages<T>(
  path: string,
  authenticated = false,
): Promise<T[]> {
  const items: T[] = [],
    seen = new Set<string>();
  let cursor: string | null = null;
  do {
    const url: string =
      path +
      (cursor
        ? (path.includes("?") ? "&" : "?") +
          "cursor=" +
          encodeURIComponent(cursor)
        : "");
    const page: { items: T[]; nextCursor?: string | null } =
      await (authenticated
        ? authedApi<{ items: T[]; nextCursor?: string | null }>("GET", url)
        : publicApi<{ items: T[]; nextCursor?: string | null }>("GET", url));
    items.push(...page.items);
    cursor = page.nextCursor ?? null;
    if (cursor && (seen.has(cursor) || seen.size >= 1000))
      throw new ApiError(
        502,
        "INVALID_CURSOR",
        "The store could not finish loading this list. Please retry.",
      );
    if (cursor) seen.add(cursor);
  } while (cursor);
  return items;
}
