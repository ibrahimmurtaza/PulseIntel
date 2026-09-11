import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { restoreDashboardRevision } from "@/lib/tenant-home";

type RestoreRevisionPageRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
    dashboardId: string;
    revisionId: string;
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
  context: RestoreRevisionPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, workspaceId, dashboardId, revisionId } =
    await context.params;

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
    restoreDashboardRevision({
      tenantSlug,
      workspaceId,
      dashboardId,
      revisionId,
      userId: session.userId,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}?restored=${encodeURIComponent(
          revisionId,
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
