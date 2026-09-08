import { NextRequest, NextResponse } from "next/server";

import { getAuthMode, serializeSession } from "@/lib/auth";
import { getSessionFromRequest } from "@/lib/request-auth";
import { setSessionCookie } from "@/lib/response-cookies";
import { acceptInvitation } from "@/lib/tenant-home";

type AcceptInvitationRouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "invitation_email_mismatch":
      return NextResponse.json({ error: message }, { status: 403 });
    case "invitation_not_pending":
      return NextResponse.json({ error: message }, { status: 409 });
    case "invitation_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: AcceptInvitationRouteContext,
) {
  const { invitationId } = await context.params;
  const session = await getSessionFromRequest(request);

  if (!session && getAuthMode() !== "stub") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const accepted = acceptInvitation({
      invitationId,
      userId: session?.userId,
      userEmail: session?.email,
      invitedName: session?.name,
    });

    const response = NextResponse.json(
      {
        invitation: accepted.invitation,
        redirectTo: `/tenant/${accepted.tenantSlug}`,
      },
      { status: 200 },
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
    return toErrorResponse(error);
  }
}
