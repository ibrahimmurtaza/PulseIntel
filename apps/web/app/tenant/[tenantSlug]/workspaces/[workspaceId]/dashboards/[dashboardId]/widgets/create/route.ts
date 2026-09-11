import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/request-auth";
import {
  addDashboardWidget,
  parseWidgetKindInput,
} from "@/lib/tenant-home";

type CreateWidgetPageRouteContext = {
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
  context: CreateWidgetPageRouteContext,
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
    const kind = parseWidgetKindInput(formData.get("kind")?.toString());
    const overrideEnabled =
      formData.get("overrideEnabled")?.toString() === "on";
    const overrideLabel = formData.get("timeRangeLabel")?.toString();
    const overrideWindowRaw = formData.get("timeRangeWindowDays")?.toString();
    const overrideWindow = overrideWindowRaw ? Number(overrideWindowRaw) : undefined;

    if (!kind) {
      throw new Error("widget_kind_required");
    }

    const widget = addDashboardWidget({
      tenantSlug,
      workspaceId,
      dashboardId,
      createdByUserId: session.userId,
      kind,
      title: formData.get("title")?.toString() ?? "",
      description: formData.get("description")?.toString() || undefined,
      x: Number(formData.get("x")),
      y: Number(formData.get("y")),
      width: Number(formData.get("width")),
      height: Number(formData.get("height")),
      timeRangeOverride:
        overrideEnabled && overrideLabel !== undefined && overrideWindow !== undefined
          ? { label: overrideLabel, windowDays: overrideWindow }
          : undefined,
    });

    return NextResponse.redirect(
      new URL(
        `/tenant/${tenantSlug}/workspaces/${workspaceId}/dashboards/${dashboardId}?created=${encodeURIComponent(
          widget.id,
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
