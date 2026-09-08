import { NextRequest, NextResponse } from "next/server";

import { clearAuthFlowCookies, setSessionCookie } from "@/lib/response-cookies";
import { AUTH_FLOW_COOKIE_PREFIX, exchangeAuth0Code, serializeSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const expectedState =
    request.cookies.get(`${AUTH_FLOW_COOKIE_PREFIX}_state`)?.value;
  const verifier =
    request.cookies.get(`${AUTH_FLOW_COOKIE_PREFIX}_verifier`)?.value;
  const returnTo =
    request.cookies.get(`${AUTH_FLOW_COOKIE_PREFIX}_return_to`)?.value ??
    "/tenant/acme";

  if (!code || !returnedState || !expectedState || !verifier) {
    return NextResponse.redirect(new URL("/auth/login?error=missing-auth-state", request.url));
  }

  if (returnedState !== expectedState) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-auth-state", request.url));
  }

  try {
    const { user } = await exchangeAuth0Code({
      code,
      verifier,
    });

    const response = NextResponse.redirect(new URL(returnTo, request.url));
    clearAuthFlowCookies(response);
    setSessionCookie(
      response,
      serializeSession({
        userId: user.userId,
        email: user.email,
        name: user.name,
      }),
    );

    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/auth/login?error=auth-callback-failed", request.url),
    );
    clearAuthFlowCookies(response);
    return response;
  }
}
