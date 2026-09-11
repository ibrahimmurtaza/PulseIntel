import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import { createDashboard } from "@/lib/tenant-home";

type CreateDashboardPageRouteContext = {
  params: Promise<{
    tenantSlug: string;
    workspaceId: string;
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
  context: CreateDashboardPageRouteContext,
) {
  const session = await getSessionFromRequest(request);
  const { tenantSlug, workspaceId } = await context.params;

  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?returnTo=${encodeURIComponent(
          `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards`,
        )}`,
        request.url,
      ),
    );
  }

  try {
    const formData = await request.formData();
    const dashboard = createDashboard({
      tenantSlug,
      workspaceId,
      createdByUserId: session.userId,
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() || undefined,
      defaultTimeRange: {
        label: formData.get("timeRangeLabel")?.toString() ?? "",
        windowDays: Number(formData.get("timeRangeWindowDays")),
      },
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
