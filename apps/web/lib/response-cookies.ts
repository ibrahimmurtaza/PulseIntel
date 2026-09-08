import { NextResponse } from "next/server";

import { AUTH_FLOW_COOKIE_PREFIX } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export function setSessionCookie(response: NextResponse, value: string) {
  response.cookies.set(SESSION_COOKIE_NAME, value, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...COOKIE_BASE,
    maxAge: 0,
  });
}

export function setAuthFlowCookies(
  response: NextResponse,
  flow: {
    state: string;
    verifier: string;
    returnTo: string;
  },
) {
  response.cookies.set(`${AUTH_FLOW_COOKIE_PREFIX}_state`, flow.state, {
    ...COOKIE_BASE,
    maxAge: 60 * 10,
  });
  response.cookies.set(`${AUTH_FLOW_COOKIE_PREFIX}_verifier`, flow.verifier, {
    ...COOKIE_BASE,
    maxAge: 60 * 10,
  });
  response.cookies.set(`${AUTH_FLOW_COOKIE_PREFIX}_return_to`, flow.returnTo, {
    ...COOKIE_BASE,
    maxAge: 60 * 10,
  });
}

export function clearAuthFlowCookies(response: NextResponse) {
  for (const suffix of ["state", "verifier", "return_to"]) {
    response.cookies.set(`${AUTH_FLOW_COOKIE_PREFIX}_${suffix}`, "", {
      ...COOKIE_BASE,
      maxAge: 0,
    });
  }
}
