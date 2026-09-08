import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

import { readSessionValue, SESSION_COOKIE_NAME, type Session } from "@/lib/session";

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<Session | undefined> {
  return readSessionValue(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export async function getSessionFromPage(): Promise<Session | undefined> {
  const store = await cookies();
  return readSessionValue(store.get(SESSION_COOKIE_NAME)?.value);
}
