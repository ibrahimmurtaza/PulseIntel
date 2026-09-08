import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createInvitation } from "@/lib/tenant-home";

type CreateInvitationPageRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

function errorRedirect(request: NextRequest, tenantSlug: string, error: string) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/invitations?error=${encodeURIComponent(error)}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateInvitationPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(`/tenant/${tenantSlug}/invitations`)}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const invitation = createInvitation({
      tenantSlug,
      invitedByUserId: session.userId,
      email: formData.get("email")?.toString() ?? "",
      invitedName: formData.get("invitedName")?.toString() || undefined,
      tenantRole:
        (formData.get("tenantRole")?.toString() as
          | "owner"
          | "admin"
          | "member"
          | undefined) ?? "member",
      workspaceId: formData.get("workspaceId")?.toString() || undefined,
      workspaceRole:
        (formData.get("workspaceRole")?.toString() as
          | "viewer"
          | "editor"
          | "admin"
          | undefined) || undefined,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/invitations?created=${encodeURIComponent(invitation.id)}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, message);
  }
}
