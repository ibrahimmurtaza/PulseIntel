import { randomBytes, createHash } from "node:crypto";

import { createSessionValue, type Session } from "@/lib/session";
import { getUserById } from "@/lib/tenant-home";

export type AuthMode = "stub" | "auth0";

export const AUTH_FLOW_COOKIE_PREFIX = "pulseintel_auth";

export function getAuthMode(): AuthMode {
  if (process.env.AUTH_MODE === "stub") {
    return "stub";
  }

  if (process.env.AUTH_MODE === "auth0") {
    return "auth0";
  }

  return process.env.NODE_ENV === "production" ? "auth0" : "stub";
}

export function createStubSession(userId: string): Session | undefined {
  const user = getUserById(userId);

  if (!user) {
    return undefined;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

function createPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createAuthFlowState(returnTo: string) {
  const verifier = randomToken();
  const state = randomToken();

  return {
    state,
    verifier,
    challenge: createPkceChallenge(verifier),
    returnTo,
  };
}

export function getAuth0Config() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Auth0 mode requires AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET.",
    );
  }

  return {
    domain,
    clientId,
    clientSecret,
    appBaseUrl,
    callbackUrl: `${appBaseUrl}/auth/callback`,
    issuerUrl: `https://${domain}`,
  };
}

export async function discoverAuth0Endpoints() {
  const { issuerUrl } = getAuth0Config();
  const response = await fetch(`${issuerUrl}/.well-known/openid-configuration`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to discover Auth0 OpenID configuration.");
  }

  const payload = (await response.json()) as {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
  };

  return payload;
}

export function buildAuth0AuthorizationUrl(input: {
  authorizationEndpoint: string;
  state: string;
  challenge: string;
}) {
  const { clientId, callbackUrl } = getAuth0Config();
  const url = new URL(input.authorizationEndpoint);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return url;
}

export async function exchangeAuth0Code(input: {
  code: string;
  verifier: string;
}) {
  const endpoints = await discoverAuth0Endpoints();
  const { clientId, clientSecret, callbackUrl } = getAuth0Config();
  const response = await fetch(endpoints.token_endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      code_verifier: input.verifier,
      redirect_uri: callbackUrl,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Auth0 rejected the authorization code exchange.");
  }

  const tokens = (await response.json()) as {
    access_token?: string;
  };

  if (!tokens.access_token) {
    throw new Error("Auth0 did not return an access token.");
  }

  const userResponse = await fetch(endpoints.userinfo_endpoint, {
    headers: {
      authorization: `Bearer ${tokens.access_token}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    throw new Error("Unable to fetch the Auth0 user profile.");
  }

  const payload = (await userResponse.json()) as {
    sub: string;
    email?: string;
    name?: string;
  };

  return {
    accessToken: tokens.access_token,
    user: {
      userId: payload.sub,
      email: payload.email ?? payload.sub,
      name: payload.name ?? payload.email ?? payload.sub,
    },
  };
}

export function serializeSession(session: Session): string {
  return createSessionValue(session);
}
