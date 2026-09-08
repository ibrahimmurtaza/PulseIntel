import { NextRequest, NextResponse } from "next/server";

import {
  buildAuth0AuthorizationUrl,
  createAuthFlowState,
  createStubSession,
  discoverAuth0Endpoints,
  getAuthMode,
  serializeSession,
} from "@/lib/auth";
import { setAuthFlowCookies, setSessionCookie } from "@/lib/response-cookies";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/tenant/acme";

  if (getAuthMode() === "stub") {
    const userId = request.nextUrl.searchParams.get("userId") ?? "";
    const session = createStubSession(userId);

    if (!session) {
      return NextResponse.redirect(new URL("/auth/login?error=unknown-user", request.url));
    }

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    setSessionCookie(response, serializeSession(session));
    return response;
  }

  const flow = createAuthFlowState(returnTo);
  const endpoints = await discoverAuth0Endpoints();
  const authorizationUrl = buildAuth0AuthorizationUrl({
    authorizationEndpoint: endpoints.authorization_endpoint,
    state: flow.state,
    challenge: flow.challenge,
  });

  const response = NextResponse.redirect(authorizationUrl);
  setAuthFlowCookies(response, flow);
  return response;
}
