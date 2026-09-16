import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  getWorkspaceMembership,
  listWorkspaceObservations,
} from "@/lib/tenant-home";

type WorkspaceObservationsRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: WorkspaceObservationsRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId } = await context.params;

  if (!getWorkspaceMembership(tenantSlug, workspaceId, session.userId)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 },
    );
  }

  const observations = listWorkspaceObservations(
    tenantSlug,
    workspaceId,
    session.userId,
  );

  return NextResponse.json({ observations });
}
