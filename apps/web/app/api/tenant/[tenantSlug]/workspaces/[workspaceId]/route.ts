import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { resolveWorkspace } from "@/lib/tenant-home";

type WorkspaceRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: WorkspaceRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;
  const workspace = resolveWorkspace(tenantSlug, workspaceId, session.userId);

  if (!workspace) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 },
    );
  }

  return NextResponse.json({ workspace });
}
