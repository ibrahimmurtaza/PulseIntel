import { NextRequest, NextResponse } from "next/server";

import { getAuthMode, serializeSession } from "@/lib/auth";
import { getSessionFromRequest } from "@/lib/request-auth";
import { setSessionCookie } from "@/lib/response-cookies";
import { acceptInvitation } from "@/lib/tenant-home";

type AcceptInvitationPageRouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

function redirectToInvitation(
  request: NextRequest,
  invitationId: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/invitations/${invitationId}?error=${encodeURIComponent(error)}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: AcceptInvitationPageRouteContext,
) {
  const { invitationId } = await context.params;
  const session = await getSessionFromRequest(request);

  if (!session && getAuthMode() !== "stub") {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(`/invitations/${invitationId}`)}`,
        request.url,
      ),
    );
  }

  try {
    const accepted = acceptInvitation({
      invitationId,
      userId: session?.userId,
      userEmail: session?.email,
      invitedName: session?.name,
    });

    const response = NextResponse.redirect(
      new URL(`/tenant/${accepted.tenantSlug}`, request.url),
    );

    if (!session) {
      setSessionCookie(
        response,
        serializeSession({
          userId: accepted.user.id,
          email: accepted.user.email,
          name: accepted.user.name,
        }),
      );
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return redirectToInvitation(request, invitationId, message);
  }
}
