import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createDashboardSnapshot } from "@/lib/tenant-home";

type CreateSnapshotPageRouteContext = {
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
  dashboardId: string,
  error: string,
) {
  return NextResponse.redirect(
    new URL(
      `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}?error=${encodeURIComponent(
        error,
      )}`,
      request.url,
    ),
  );
}

export async function POST(
  request: NextRequest,
  context: CreateSnapshotPageRouteContext,
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
    const revision = createDashboardSnapshot({
      tenantSlug,
      workspaceId,
      dashboardId,
      createdByUserId: session.userId,
      name: formData.get("name")?.toString() ?? "",
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}?snapshot=${encodeURIComponent(
          revision.id,
        )}`,
        request.url,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return errorRedirect(
      request,
      tenantSlug,
      workspaceId,
      dashboardId,
      message,
    );
  }
}
