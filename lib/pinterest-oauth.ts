import crypto from "node:crypto";

import { env, getRequiredEnv } from "@/lib/env";
import { getUserAccount, type PinterestUserAccount } from "@/lib/pinterest";

export const PINTEREST_DEMO_SCOPES = [
  "user_accounts:read",
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write"
] as const;

export const PINTEREST_DEMO_STATE_COOKIE = "amaterest_pinterest_oauth_state";
export const PINTEREST_DEMO_SESSION_COOKIE = "amaterest_pinterest_session";
export const PINTEREST_DEMO_REDIRECT_COOKIE = "amaterest_pinterest_oauth_redirect_uri";

const PINTEREST_AUTHORIZE_URL = "https://www.pinterest.com/oauth/";
const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";

type PinterestOAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  response_type?: string;
};

export type PinterestDemoSession = {
  id: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  profile?: PinterestUserAccount;
  profileError?: string;
  createdAt: string;
  expiresAt?: string;
};

declare global {
  var __amaterestPinterestSessions: Map<string, PinterestDemoSession> | undefined;
}

function getSessionStore() {
  if (!globalThis.__amaterestPinterestSessions) {
    globalThis.__amaterestPinterestSessions = new Map<string, PinterestDemoSession>();
  }

  return globalThis.__amaterestPinterestSessions;
}

export function getPinterestDemoScopeString() {
  return PINTEREST_DEMO_SCOPES.join(",");
}

export function splitPinterestScopes(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function getMissingPinterestDemoScopes(grantedScopes: string[]) {
  return PINTEREST_DEMO_SCOPES.filter((scope) => !grantedScopes.includes(scope));
}

export function createPinterestOAuthState() {
  return crypto.randomUUID();
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function resolvePinterestRedirectUri(requestOrigin: string) {
  const localFallback = new URL("/pinterest/callback", requestOrigin).toString();

  if (!env.PINTEREST_REDIRECT_URI) {
    return localFallback;
  }

  try {
    const configuredUrl = new URL(env.PINTEREST_REDIRECT_URI);
    const requestUrl = new URL(requestOrigin);

    if (isLocalHost(requestUrl.hostname) && !isLocalHost(configuredUrl.hostname)) {
      return localFallback;
    }

    return env.PINTEREST_REDIRECT_URI;
  } catch {
    return localFallback;
  }
}

export function buildPinterestAuthorizeUrl(state: string, redirectUri: string) {
  const clientId = getRequiredEnv("PINTEREST_APP_ID");
  const url = new URL(PINTEREST_AUTHORIZE_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getPinterestDemoScopeString());
  url.searchParams.set("state", state);

  return url.toString();
}

function getPinterestOAuthHeaders() {
  const credentials = Buffer.from(
    `${getRequiredEnv("PINTEREST_APP_ID")}:${getRequiredEnv("PINTEREST_APP_SECRET")}`
  ).toString("base64");

  return {
    Accept: "application/json",
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded"
  };
}

function getOAuthErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.error_description === "string" && record.error_description) ||
      (typeof record.error === "string" && record.error);

    if (message) {
      return `Pinterest OAuth token exchange failed with status ${status}: ${message}`;
    }
  }

  if (typeof payload === "string" && payload.length > 0) {
    return `Pinterest OAuth token exchange failed with status ${status}: ${payload}`;
  }

  return `Pinterest OAuth token exchange failed with status ${status}.`;
}

export async function exchangePinterestCodeForToken(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri
  });

  const response = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: getPinterestOAuthHeaders(),
    body,
    cache: "no-store"
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(getOAuthErrorMessage(payload, response.status));
  }

  return payload as PinterestOAuthTokenResponse;
}

export async function createPinterestDemoSessionFromCode(code: string, redirectUri: string) {
  const token = await exchangePinterestCodeForToken(code, redirectUri);
  const scopes = splitPinterestScopes(token.scope);
  let profile: PinterestUserAccount | undefined;
  let profileError: string | undefined;

  try {
    profile = await getUserAccount(token.access_token);
  } catch (error) {
    profileError = error instanceof Error ? error.message : "Unable to load Pinterest profile.";
  }

  const sessionId = crypto.randomUUID();
  const session: PinterestDemoSession = {
    id: sessionId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    scopes,
    profile,
    profileError,
    createdAt: new Date().toISOString(),
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : undefined
  };

  getSessionStore().set(sessionId, session);

  return session;
}

export function getPinterestDemoSession(sessionId?: string | null) {
  if (!sessionId) {
    return undefined;
  }

  return getSessionStore().get(sessionId);
}

export function deletePinterestDemoSession(sessionId?: string | null) {
  if (!sessionId) {
    return;
  }

  getSessionStore().delete(sessionId);
}

export function getPinterestDemoStatus(session?: PinterestDemoSession, redirectUri?: string) {
  const grantedScopes = session?.scopes || [];
  const missingScopes = getMissingPinterestDemoScopes(grantedScopes);

  return {
    appReady: Boolean(env.PINTEREST_APP_ID && env.PINTEREST_APP_SECRET && env.PINTEREST_REDIRECT_URI),
    redirectUri: redirectUri || env.PINTEREST_REDIRECT_URI,
    requiredScopes: [...PINTEREST_DEMO_SCOPES],
    fallbackAccessTokenConfigured: Boolean(env.PINTEREST_ACCESS_TOKEN),
    connected: Boolean(session),
    scopes: grantedScopes,
    missingScopes,
    canReadBoards: grantedScopes.includes("boards:read"),
    canWritePins:
      grantedScopes.includes("boards:write") &&
      grantedScopes.includes("pins:write") &&
      grantedScopes.includes("pins:read"),
    profile: session?.profile,
    profileError: session?.profileError,
    expiresAt: session?.expiresAt
  };
}
