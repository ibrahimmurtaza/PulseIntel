import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { restoreDashboardRevision } from "@/lib/tenant-home";

type RestoreRevisionRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
    revisionId: string;
  }>;
};

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown_error";

  switch (message) {
    case "revision_not_found":
      return NextResponse.json({ error: message }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: message }, { status: 403 });
    default:
      return NextResponse.json({ error: "unknown_error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: RestoreRevisionRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId, dashboardId, revisionId } =
    await context.params;

  try {
    const dashboard = restoreDashboardRevision({
      tenantSlug,
      workspaceId,
      dashboardId,
      revisionId,
      userId: session.userId,
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 403 },
      );
    }

    return NextResponse.json({ dashboard });
  } catch (error) {
    return toErrorResponse(error);
  }
}
