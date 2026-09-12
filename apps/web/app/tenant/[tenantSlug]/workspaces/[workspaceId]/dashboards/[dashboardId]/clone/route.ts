import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { cloneDashboard } from "@/lib/tenant-home";

type CloneDashboardPageRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
  }>;
};

function errorRedirect(
  request: NextRequest,
  tenantSlug: string,
  workspaceId: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards?error=${encodeURIComponent(
        error,
      )}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CloneDashboardPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, workspaceId, dashboardId } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const dashboard = cloneDashboard({
      tenantSlug,
      workspaceId,
      sourceDashboardId: dashboardId,
      createdByUserId: session.userId,
      name: formData.get("name")?.toString() || undefined,
      description: formData.get("description")?.toString() || undefined,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards?created=${encodeURIComponent(
          dashboard.id,
        )}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(request, tenantSlug, workspaceId, message);
  }
}
