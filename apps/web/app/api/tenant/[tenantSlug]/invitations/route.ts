import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  createInvitation,
  type TenantRole,
  type WorkspaceRole,
} from "@/lib/tenant-home";

type TenantInvitationsRouteContext = {
  params: Promise<{
    tenantSlug: string;
  }>;
};

async function readInvitationInput(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as {
      email?: string;
      invitedName?: string;
      tenantRole?: TenantRole;
      workspaceId?: string;
      workspaceRole?: WorkspaceRole;
    };
  }

  const formData = await request.formData();

  return {
    email: formData.get("email")?.toString(),
    invitedName: formData.get("invitedName")?.toString(),
    tenantRole: formData.get("tenantRole")?.toString() as TenantRole | undefined,
    workspaceId: formData.get("workspaceId")?.toString() || undefined,
    workspaceRole:
      formData.get("workspaceRole")?.toString() as WorkspaceRole | undefined,
  };
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "email_required":
    case "workspace_role_required":
    case "workspace_id_required":
    case "workspace_not_found":
      return NextResponse.json({ error: message }, { status: 400 });
    case "tenant_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: TenantInvitationsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { tenantSlug } = await context.params;

  try {
    const input = await readInvitationInput(request);
    const invitation = createInvitation({
      tenantSlug,
      invitedByUserId: session.userId,
      email: input.email ?? "",
      invitedName: input.invitedName,
      tenantRole: input.tenantRole ?? "member",
      workspaceId: input.workspaceId,
      workspaceRole: input.workspaceRole,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
