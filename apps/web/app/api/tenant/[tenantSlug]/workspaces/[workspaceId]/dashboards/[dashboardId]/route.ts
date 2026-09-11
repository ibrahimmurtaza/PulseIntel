import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { resolveDashboard } from "@/lib/tenant-home";

type DashboardRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: DashboardRouteContext,
) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401 },
    );
  }

  const { tenantSlug, workspaceId, dashboardId } = await context.params;
  const dashboard = resolveDashboard(
    tenantSlug,
    workspaceId,
    dashboardId,
    session.userId,
  );

  if (!dashboard) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 },
    );
  }

  return NextResponse.json({ dashboard });
}
